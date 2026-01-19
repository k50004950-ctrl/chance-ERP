import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckCircle, FileText, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

interface PerformanceData {
  id: number;
  name: string;
  employee_code: string;
  period: string;
  total_db: number;
  meeting_completed: number;
  contract_completed: number;
  total_contract_amount: number;
}

const SalespersonPerformance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'custom' | 'average'>('current');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [averageMonths, setAverageMonths] = useState('3');

  useEffect(() => {
    fetchPerformanceData();
  }, [viewMode, selectedYear, selectedMonth, averageMonths]);

  const fetchPerformanceData = async () => {
    try {
      let url = `${API_BASE_URL}/api/salesperson-performance`;
      
      if (viewMode === 'custom') {
        url += `?year=${selectedYear}&month=${selectedMonth}`;
      } else if (viewMode === 'average') {
        url += `?months=${averageMonths}`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setPerformanceData(result.data);
      } else {
        console.error('실적 조회 실패:', result.message);
        alert('실적 조회에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('실적 조회 오류:', error);
      alert('실적 조회 중 오류가 발생했습니다.');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(num));
  };

  const getPerformanceColor = (value: number, type: 'db' | 'meeting' | 'contract' | 'amount') => {
    if (viewMode === 'average') {
      // 평균 기준
      if (type === 'db' && value >= 10) return 'text-green-600';
      if (type === 'meeting' && value >= 5) return 'text-green-600';
      if (type === 'contract' && value >= 3) return 'text-green-600';
      if (type === 'amount' && value >= 1000000) return 'text-green-600';
    } else {
      // 월별 기준
      if (type === 'db' && value >= 10) return 'text-green-600';
      if (type === 'meeting' && value >= 5) return 'text-green-600';
      if (type === 'contract' && value >= 3) return 'text-green-600';
      if (type === 'amount' && value >= 1000000) return 'text-green-600';
    }
    if (value > 0) return 'text-blue-600';
    return 'text-gray-400';
  };

  // 연도 옵션 생성 (최근 3년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 총계 계산
  const totalStats = performanceData.reduce(
    (acc, curr) => ({
      total_db: acc.total_db + curr.total_db,
      meeting_completed: acc.meeting_completed + curr.meeting_completed,
      contract_completed: acc.contract_completed + curr.contract_completed,
      total_contract_amount: acc.total_contract_amount + curr.total_contract_amount,
    }),
    { total_db: 0, meeting_completed: 0, contract_completed: 0, total_contract_amount: 0 }
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">영업자 개인별 실적</h1>
        <p className="text-gray-600 mt-2">영업자들의 실적을 한눈에 확인하세요</p>
      </div>

      {/* 조회 옵션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 조회 모드 선택 */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">조회 기간:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('current')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                이번 달
              </button>
              <button
                onClick={() => setViewMode('custom')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                특정 월
              </button>
              <button
                onClick={() => setViewMode('average')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'average'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                평균
              </button>
            </div>
          </div>

          {/* 특정 월 선택 */}
          {viewMode === 'custom' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 평균 개월 수 선택 */}
          {viewMode === 'average' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">최근</span>
              <select
                value={averageMonths}
                onChange={(e) => setAverageMonths(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1개월</option>
                <option value="3">3개월</option>
                <option value="6">6개월</option>
                <option value="12">12개월</option>
              </select>
              <span className="text-sm text-gray-600">평균</span>
            </div>
          )}
        </div>
      </div>

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">총 DB 수</h3>
            <FileText className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalStats.total_db)}</p>
          <p className="text-xs opacity-80 mt-1">
            {viewMode === 'average' ? `월평균 ${formatNumber(totalStats.total_db / performanceData.length)}` : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">미팅 완료</h3>
            <CheckCircle className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalStats.meeting_completed)}</p>
          <p className="text-xs opacity-80 mt-1">
            {viewMode === 'average' ? `월평균 ${formatNumber(totalStats.meeting_completed / performanceData.length)}` : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">계약 완료</h3>
            <TrendingUp className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalStats.contract_completed)}</p>
          <p className="text-xs opacity-80 mt-1">
            {viewMode === 'average' ? `월평균 ${formatNumber(totalStats.contract_completed / performanceData.length)}` : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold opacity-90">총 계약 기장료</h3>
            <DollarSign className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(totalStats.total_contract_amount)}원</p>
          <p className="text-xs opacity-80 mt-1">
            {viewMode === 'average' ? `월평균 ${formatNumber(totalStats.total_contract_amount / performanceData.length)}원` : ''}
          </p>
        </div>
      </div>

      {/* 영업자별 상세 실적 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">영업자별 상세 실적</h2>
            {performanceData.length > 0 && (
              <span className="text-sm text-gray-500">
                ({performanceData[0].period})
              </span>
            )}
          </div>
        </div>

        {performanceData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>영업자 데이터가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    영업자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사원번호
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 DB 수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    미팅 완료
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약 완료
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 계약 기장료
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성공률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceData.map((data) => {
                  const successRate = data.total_db > 0 
                    ? ((data.contract_completed / data.total_db) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr key={data.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {data.name.substring(0, 1)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{data.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.employee_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-semibold ${getPerformanceColor(data.total_db, 'db')}`}>
                          {viewMode === 'average' ? data.total_db.toFixed(1) : formatNumber(data.total_db)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-semibold ${getPerformanceColor(data.meeting_completed, 'meeting')}`}>
                          {viewMode === 'average' ? data.meeting_completed.toFixed(1) : formatNumber(data.meeting_completed)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-lg font-semibold ${getPerformanceColor(data.contract_completed, 'contract')}`}>
                          {viewMode === 'average' ? data.contract_completed.toFixed(1) : formatNumber(data.contract_completed)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-lg font-semibold ${getPerformanceColor(data.total_contract_amount, 'amount')}`}>
                          {formatNumber(data.total_contract_amount)}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16">
                            <div className="relative pt-1">
                              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                                <div
                                  style={{ width: `${Math.min(parseFloat(successRate), 100)}%` }}
                                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                    parseFloat(successRate) >= 30
                                      ? 'bg-green-500'
                                      : parseFloat(successRate) >= 15
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-gray-700">{successRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalespersonPerformance;
