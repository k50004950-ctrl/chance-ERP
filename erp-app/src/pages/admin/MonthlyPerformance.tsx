import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Download, Filter, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';
import { formatDateToKorean } from '../../utils/dateFormat';

interface PerformanceData {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_name: string;
  meeting_status: string;
  contract_status: string;
  company_name: string;
  representative: string;
  contact: string;
  industry: string;
  client_name: string;
  contract_client: number;
  contract_month: string;
  actual_sales: number;
  commission_rate: number;
}

const MonthlyPerformance: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesClients, setSalesClients] = useState<Array<{ client_name: string }>>([]);
  
  // 필터 상태
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [contractFilter, setContractFilter] = useState<string>('all'); // all, Y, N
  const [clientFilter, setClientFilter] = useState<string>('all');
  
  // 통계 상태
  const [stats, setStats] = useState({
    totalCount: 0,
    contractedCount: 0,
    notContractedCount: 0,
    meetingCompleted: 0,
    totalContractAmount: 0,
    correctionCount: 0,
    correctionRefundAmount: 0
  });

  // 매출거래처 목록 가져오기
  const fetchSalesClients = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/api/sales-clients');
      const result = await response.json();
      if (result.success) {
        setSalesClients(result.data);
      }
    } catch (error) {
      console.error('매출거래처 목록 조회 오류:', error);
    }
  };

  // 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
        contract_status: contractFilter,
        client_name: clientFilter
      });
      
      console.log('API 요청:', `${API_BASE_URL}/api/admin/monthly-performance?${params}`);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/monthly-performance?${params}`);
      
      console.log('API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
        alert(`서버 오류 (${response.status}): ${errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('API 응답 데이터:', result);
      
      if (result.success) {
        setData(result.data);
        calculateStats(result.data);
      } else {
        alert('데이터 조회 실패: ' + result.message);
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      alert('데이터 조회 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  // 경정청구 통계 가져오기
  const fetchCorrectionStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests/stats/monthly?year=${selectedYear}&month=${selectedMonth}`);
      const result = await response.json();
      if (result.success) {
        const correctionCount = result.data.reduce((sum: number, item: any) => sum + item.total_count, 0);
        const correctionRefundAmount = result.data.reduce((sum: number, item: any) => sum + item.total_refund, 0);
        
        setStats(prev => ({
          ...prev,
          correctionCount,
          correctionRefundAmount
        }));
      }
    } catch (error) {
      console.error('경정청구 통계 조회 오류:', error);
    }
  };

  // 통계 계산
  const calculateStats = (performanceData: PerformanceData[]) => {
    const totalCount = performanceData.length;
    const contractedCount = performanceData.filter(d => d.contract_status === 'Y').length;
    const notContractedCount = performanceData.filter(d => d.contract_status === 'N').length;
    const meetingCompleted = performanceData.filter(d => d.meeting_status === '미팅완료').length;
    
    const totalContractAmount = performanceData
      .filter(d => d.contract_status === 'Y')
      .reduce((sum, d) => sum + (Number(d.contract_client) || 0), 0);
    
    setStats(prev => ({
      ...prev,
      totalCount,
      contractedCount,
      notContractedCount,
      meetingCompleted,
      totalContractAmount
    });
  };

  useEffect(() => {
    fetchSalesClients();
  }, []);

  useEffect(() => {
    fetchData();
    fetchCorrectionStats();
  }, [selectedYear, selectedMonth, contractFilter, clientFilter]);

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // CSV 형식으로 데이터 변환
    const headers = [
      '섭외 날짜',
      '섭외자',
      '영업자',
      '회사명',
      '대표자',
      '연락처',
      '업종',
      '미팅 상태',
      '계약 상태',
      '매출거래처',
      '기장료',
      '계약월',
      '실제 매출',
      '수수료율(%)'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        formatDateToKorean(row.proposal_date),
        row.proposer || '',
        row.salesperson_name || '',
        row.company_name,
        row.representative || '',
        row.contact || '',
        row.industry || '',
        row.meeting_status || '',
        row.contract_status || '',
        row.client_name || '',
        row.contract_client || 0,
        row.contract_month || '',
        row.actual_sales || 0,
        row.commission_rate || 0
      ].join(','))
    ].join('\n');
    
    // BOM 추가 (엑셀에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `월별실적현황_${selectedYear}년${selectedMonth}월.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 연도 옵션 (현재 연도 기준 ±5년)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-8 h-8 mr-2 text-blue-600" />
              월별 실적 현황
            </h1>
            <p className="text-gray-600 mt-2">전체 영업 실적을 월별로 확인하고 관리합니다.</p>
          </div>
          <button
            onClick={downloadExcel}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <Download className="w-5 h-5" />
            <span>엑셀 다운로드</span>
          </button>
        </div>

        {/* 필터 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">조회 기간:</span>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>

            <Filter className="w-5 h-5 text-gray-500 ml-8" />
            <span className="font-semibold text-gray-700">계약 상태:</span>
            
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              <option value="Y">계약 완료</option>
              <option value="N">미계약</option>
            </select>

            <Filter className="w-5 h-5 text-gray-500 ml-8" />
            <span className="font-semibold text-gray-700">매출거래처:</span>
            
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              {salesClients.map((client) => (
                <option key={client.client_name} value={client.client_name}>
                  {client.client_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-600 font-semibold mb-1">전체 건수</div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalCount}건</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-600 font-semibold mb-1">계약 완료</div>
            <div className="text-2xl font-bold text-green-700">{stats.contractedCount}건</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-600 font-semibold mb-1">미계약</div>
            <div className="text-2xl font-bold text-orange-700">{stats.notContractedCount}건</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-purple-600 font-semibold mb-1">미팅 완료</div>
            <div className="text-2xl font-bold text-purple-700">{stats.meetingCompleted}건</div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="text-sm text-indigo-600 font-semibold mb-1">총 계약 기장료</div>
            <div className="text-2xl font-bold text-indigo-700">
              {stats.totalContractAmount.toLocaleString()}원
            </div>
          </div>

          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <div className="text-sm text-pink-600 font-semibold mb-1">경정청구 건수</div>
            <div className="text-2xl font-bold text-pink-700">{stats.correctionCount}건</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="text-sm text-teal-600 font-semibold mb-1">경정청구 환급액</div>
            <div className="text-2xl font-bold text-teal-700">
              {stats.correctionRefundAmount.toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">데이터를 불러오는 중...</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">조회된 데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      섭외 날짜
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      섭외자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      영업자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대표자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      미팅 상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      계약 상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      매출거래처
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      기장료
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수수료율
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => navigate('/sales-db/register', { state: { editId: row.id } })}
                      className="hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDateToKorean(row.proposal_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.proposer || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.salesperson_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.company_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.representative || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.contact || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          row.meeting_status === '미팅완료'
                            ? 'bg-green-100 text-green-800'
                            : row.meeting_status === '일정재확인요청'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.meeting_status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          row.contract_status === 'Y'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {row.contract_status === 'Y' ? '계약완료' : '미계약'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.client_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.contract_client ? `${row.contract_client.toLocaleString()}원` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.commission_rate ? `${row.commission_rate}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyPerformance;
