import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import { formatDateToKorean } from '../../utils/dateFormat';
import * as XLSX from 'xlsx';

interface CorrectionRequest {
  id: number;
  writer_id: number;
  writer_name: string;
  company_name: string;
  representative: string;
  special_relation: string;
  first_startup: string;
  correction_in_progress: string;
  additional_workplace: string;
  review_status: '대기' | '환급가능' | '환급불가' | '자료수집X';
  refund_amount: number;
  document_delivered: string;
  feedback_count: number;
  created_at: string;
  updated_at: string;
}

const CorrectionList: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('전체');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests?user_id=${user?.id}&role=${user?.role}`);
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
        
        // Extract unique years
        const years = Array.from(
          new Set(
            result.data
              .map((item: CorrectionRequest) => item.created_at ? item.created_at.split('-')[0] : '')
              .filter(Boolean)
          )
        ).sort((a, b) => b.localeCompare(a));
        setAvailableYears(years as string[]);
      }
    } catch (error) {
      console.error('경정청구 목록 조회 실패:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '환급가능':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '환급불가':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case '자료수집X':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      '대기': 'bg-gray-100 text-gray-800',
      '환급가능': 'bg-green-100 text-green-800',
      '환급불가': 'bg-red-100 text-red-800',
      '자료수집X': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || colors['대기'];
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.company_name.includes(searchTerm) || 
                         req.representative.includes(searchTerm) ||
                         req.writer_name.includes(searchTerm);
    const matchesFilter = filterStatus === '전체' || req.review_status === filterStatus;
    
    // 년도 필터
    let matchesYear = true;
    if (selectedYear) {
      matchesYear = req.created_at && req.created_at.startsWith(selectedYear);
    }
    
    // 월 필터
    let matchesMonth = true;
    if (selectedMonth) {
      const month = req.created_at ? req.created_at.split('-')[1] : '';
      matchesMonth = month === selectedMonth;
    }
    
    return matchesSearch && matchesFilter && matchesYear && matchesMonth;
  });

  const handleExcelDownload = () => {
    const excelData = filteredRequests.map(req => ({
      '상태': req.review_status,
      '업체명': req.company_name,
      '대표자': req.representative,
      '담당자': req.writer_name,
      '특수관계': req.special_relation,
      '첫창업': req.first_startup,
      '경정진행중': req.correction_in_progress,
      '추가사업장': req.additional_workplace,
      '환급금액': req.refund_amount || 0,
      '서류전달': req.document_delivered,
      '피드백': req.feedback_count || 0,
      '등록일': formatDateToKorean(req.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '경정청구');
    
    const date = new Date();
    const filename = `경정청구_검토_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleRowClick = (id: number) => {
    window.location.href = `/correction/detail/${id}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FileText className="w-7 h-7 mr-2" />
              경정청구 검토
            </h1>
            <p className="text-gray-600 mt-1">경정청구 요청을 등록하고 검토 결과를 확인하세요</p>
          </div>
          <button
            onClick={() => window.location.href = '/correction/register'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>새 요청 등록</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            {['전체', '대기', '환급가능', '환급불가', '자료수집X'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="업체명, 대표자, 담당자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* 월별 필터 및 엑셀 다운로드 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 pt-4 border-t space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            {/* 년도 필터 */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">전체 년도</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>

            {/* 월 필터 */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={!selectedYear}
            >
              <option value="">전체 월</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {i + 1}월
                  </option>
                );
              })}
            </select>

            {(selectedYear || selectedMonth) && (
              <button
                onClick={() => {
                  setSelectedYear('');
                  setSelectedMonth('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 엑셀 다운로드 */}
          <button
            onClick={handleExcelDownload}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">엑셀 다운로드 ({filteredRequests.length}건)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최초창업</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진행여부</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">환급금액</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">서류전달</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">피드백</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    등록된 경정청구 요청이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => handleRowClick(request.id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.review_status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(request.review_status)}`}>
                          {request.review_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.representative}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.writer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded ${request.first_startup === 'O' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {request.first_startup}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded ${request.correction_in_progress === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {request.correction_in_progress}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                      {request.refund_amount > 0 ? `${request.refund_amount.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 rounded ${request.document_delivered === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {request.document_delivered}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                        {request.feedback_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateToKorean(request.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">전체 요청</div>
          <div className="text-2xl font-bold text-gray-900">{requests.length}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">환급가능</div>
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.review_status === '환급가능').length}건
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">환급불가</div>
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.review_status === '환급불가').length}건
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">총 환급금액</div>
          <div className="text-2xl font-bold text-blue-600">
            {requests.reduce((sum, r) => sum + r.refund_amount, 0).toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionList;
