import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../lib/api';

interface CommissionSummary {
  salesperson_id: number;
  salesperson_name: string;
  username: string;
  total_sales: number;
  total_commission: number;
  withholding_tax: number;
  net_pay: number;
  is_confirmed: boolean;
  confirmed_at: string | null;
}

const CommissionSummary: React.FC = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<CommissionSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));

  useEffect(() => {
    fetchSummaries();
  }, [selectedYear, selectedMonth]);

  const fetchSummaries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commission-statements/summary?year=${selectedYear}&month=${selectedMonth}`);
      const result = await response.json();
      if (result.success) {
        setSummaries(result.data);
      }
    } catch (error) {
      console.error('수수료 요약 조회 실패:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handleRowClick = (salespersonId: number) => {
    // 개별 수수료명세서 페이지로 이동 (쿼리 파라미터 전달)
    navigate(`/salesperson/commission-statement?id=${salespersonId}&year=${selectedYear}&month=${selectedMonth}`);
  };

  const totalAllSales = summaries.reduce((sum, item) => sum + item.total_sales, 0);
  const totalAllCommission = summaries.reduce((sum, item) => sum + item.total_commission, 0);
  const totalAllTax = summaries.reduce((sum, item) => sum + item.withholding_tax, 0);
  const totalAllNetPay = summaries.reduce((sum, item) => sum + item.net_pay, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2" />
              전체 수수료명세서 요약
            </h1>
            <p className="text-gray-600 mt-1">모든 영업자의 수수료를 한눈에 확인하세요</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">연도:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">월:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {i + 1}월
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 요약 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                영업자
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 기장료
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                총 수수료
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                원천징수 (3.3%)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                실수령액
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                확정 상태
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">등록된 영업자가 없습니다</p>
                </td>
              </tr>
            ) : (
              <>
                {summaries.map((summary) => (
                  <tr 
                    key={summary.salesperson_id} 
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(summary.salesperson_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {summary.salesperson_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {summary.salesperson_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {summary.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-purple-600">
                      {formatCurrency(summary.total_sales)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(summary.total_commission)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                      -{formatCurrency(summary.withholding_tax)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                      {formatCurrency(summary.net_pay)}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {summary.is_confirmed ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          확정됨
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          미확정
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* 합계 행 */}
                <tr className="bg-blue-50 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    총 합계
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-purple-600">
                    {formatCurrency(totalAllSales)}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600">
                    {formatCurrency(totalAllCommission)}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                    -{formatCurrency(totalAllTax)}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                    {formatCurrency(totalAllNetPay)}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    -
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> 영업자 행을 클릭하면 상세 수수료명세서로 이동합니다.
        </p>
      </div>
    </div>
  );
};

export default CommissionSummary;
