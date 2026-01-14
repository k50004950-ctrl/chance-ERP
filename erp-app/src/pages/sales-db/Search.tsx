import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Trash2, X, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';

interface SalesDB {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_name: string;
  meeting_status: string;
  company_name: string;
  representative: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: number;
  existing_client: string;
  contract_status: string;
  termination_month: string;
  actual_sales: number;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
  created_at: string;
  meeting_request_datetime?: string;
}

const SalesDBSearch: React.FC = () => {
  const { user } = useAuth();
  const [salesDB, setSalesDB] = useState<SalesDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<SalesDB[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [currentFeedbackId, setCurrentFeedbackId] = useState<number | null>(null);
  
  // 필터 상태
  const [filterType, setFilterType] = useState<'all' | 'date' | 'month' | 'day' | 'cross'>('all');
  const [proposalDateFrom, setProposalDateFrom] = useState('');
  const [proposalDateTo, setProposalDateTo] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [meetingDateFrom, setMeetingDateFrom] = useState('');
  const [meetingDateTo, setMeetingDateTo] = useState('');

  useEffect(() => {
    fetchSalesDB();
  }, []);

  useEffect(() => {
    let filtered = [...salesDB];
    
    // 텍스트 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contact?.includes(searchTerm) ||
          item.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 날짜 필터
    if (filterType === 'date' && proposalDateFrom && proposalDateTo) {
      filtered = filtered.filter(item => {
        if (!item.proposal_date) return false;
        const date = item.proposal_date.split('T')[0];
        return date >= proposalDateFrom && date <= proposalDateTo;
      });
    }
    
    // 월별 필터
    if (filterType === 'month' && selectedMonth) {
      filtered = filtered.filter(item => {
        if (!item.proposal_date) return false;
        const month = item.proposal_date.substring(0, 7); // YYYY-MM
        return month === selectedMonth;
      });
    }
    
    // 일별 필터
    if (filterType === 'day' && selectedDay) {
      filtered = filtered.filter(item => {
        if (!item.proposal_date) return false;
        const day = item.proposal_date.split('T')[0];
        return day === selectedDay;
      });
    }
    
    // 교차 필터 (섭외일 + 미팅희망일)
    if (filterType === 'cross') {
      if (proposalDateFrom && proposalDateTo) {
        filtered = filtered.filter(item => {
          if (!item.proposal_date) return false;
          const date = item.proposal_date.split('T')[0];
          return date >= proposalDateFrom && date <= proposalDateTo;
        });
      }
      if (meetingDateFrom && meetingDateTo) {
        filtered = filtered.filter(item => {
          if (!item.meeting_request_datetime) return false;
          const date = item.meeting_request_datetime.split('T')[0];
          return date >= meetingDateFrom && date <= meetingDateTo;
        });
      }
    }
    
    setFilteredData(filtered);
  }, [searchTerm, salesDB, filterType, proposalDateFrom, proposalDateTo, selectedMonth, selectedDay, meetingDateFrom, meetingDateTo]);

  const fetchSalesDB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db`);
      const result = await response.json();
      if (result.success) {
        setSalesDB(result.data);
        setFilteredData(result.data);
      }
    } catch (error) {
      console.error('DB 조회 실패:', error);
    }
  };

  const handleShowFeedback = async (id: number) => {
    setCurrentFeedbackId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${id}/feedback-history`);
      const result = await response.json();
      if (result.success) {
        setFeedbackHistory(result.data || []);
        setShowFeedbackModal(true);
      } else {
        alert('피드백 조회 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 조회 오류:', error);
      alert('피드백 조회 중 오류가 발생했습니다.');
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim()) {
      alert('피드백 내용을 입력하세요.');
      return;
    }
    if (!user) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${currentFeedbackId}/add-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user.name,
          content: newFeedback
        })
      });
      const result = await response.json();
      if (result.success) {
        setFeedbackHistory(result.data);
        setNewFeedback('');
        alert('피드백이 추가되었습니다.');
        fetchSalesDB(); // 목록 새로고침
      } else {
        alert('피드백 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 추가 오류:', error);
      alert('피드백 추가 중 오류가 발생했습니다.');
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchSalesDB();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleMeetingStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        alert('미팅여부가 업데이트되었습니다.');
        fetchSalesDB();
      }
    } catch (error) {
      console.error('업데이트 실패:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatNumber = (value: string | number) => {
    if (!value) return '-';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <SearchIcon className="w-6 h-6 mr-2" />
          DB 검색
        </h1>
        <p className="text-gray-600 mt-1">등록된 고객 정보를 검색하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="회사명, 대표자, 연락처, 거래처명으로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 고급 필터 */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm font-medium text-gray-700">필터:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType('date')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterType === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              섭외일 기간
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              월별
            </button>
            <button
              onClick={() => setFilterType('day')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              일별
            </button>
            <button
              onClick={() => setFilterType('cross')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filterType === 'cross' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              교차검색
            </button>
          </div>

          {/* 필터 옵션 */}
          {filterType === 'date' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">섭외일 시작</label>
                <input
                  type="date"
                  value={proposalDateFrom}
                  onChange={(e) => setProposalDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">섭외일 종료</label>
                <input
                  type="date"
                  value={proposalDateTo}
                  onChange={(e) => setProposalDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {filterType === 'month' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">년월 선택</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {filterType === 'day' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜 선택</label>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {filterType === 'cross' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">섭외일 시작</label>
                  <input
                    type="date"
                    value={proposalDateFrom}
                    onChange={(e) => setProposalDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">섭외일 종료</label>
                  <input
                    type="date"
                    value={proposalDateTo}
                    onChange={(e) => setProposalDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">미팅희망일 시작</label>
                  <input
                    type="date"
                    value={meetingDateFrom}
                    onChange={(e) => setMeetingDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">미팅희망일 종료</label>
                  <input
                    type="date"
                    value={meetingDateTo}
                    onChange={(e) => setMeetingDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredData.length}</span>개
            {filterType !== 'all' && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setProposalDateFrom('');
                  setProposalDateTo('');
                  setSelectedMonth('');
                  setSelectedDay('');
                  setMeetingDateFrom('');
                  setMeetingDateTo('');
                }}
                className="ml-4 text-blue-600 hover:text-blue-800 underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  작업
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  섭외날자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  섭외자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  영업자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  미팅여부
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업체명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  대표자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업종
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매출
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기존거래처
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약여부
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  해임월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실제매출
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약기장료
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래처
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기타(피드백)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  해피콜내용
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm sticky left-0 bg-white z-10">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatDateToKorean(item.proposal_date) || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.proposer || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.salesperson_name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user?.role === 'salesperson' ? (
                      <select
                        value={item.meeting_status || ''}
                        onChange={(e) => handleMeetingStatusUpdate(item.id, e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택</option>
                        <option value="미팅완료">미팅완료</option>
                        <option value="일정재확인요청">일정재확인요청</option>
                        <option value="미팅거절">미팅거절</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                        item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.meeting_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.company_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.representative || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.address || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.contact || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.industry || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.sales_amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.existing_client || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.contract_status || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.termination_month || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.actual_sales)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(item.contract_client)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.contract_month || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.client_name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleShowFeedback(item.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
                    >
                      <span className="text-sm font-medium">피드백 보기</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        {(() => {
                          try {
                            const history = item.feedback ? JSON.parse(item.feedback) : [];
                            return Array.isArray(history) ? history.length : 0;
                          } catch {
                            return item.feedback ? 1 : 0;
                          }
                        })()}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.april_type1_date || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 피드백 이력 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <h2 className="text-2xl font-bold">피드백 이력</h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setNewFeedback('');
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 피드백 이력 목록 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {feedbackHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 작성된 피드백이 없습니다.</p>
                  <p className="text-sm mt-2">첫 번째 피드백을 작성해보세요!</p>
                </div>
              ) : (
                feedbackHistory.map((feedback, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {feedback.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(feedback.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="bg-white rounded p-3 mt-2 border border-gray-100">
                      <p className="text-gray-800 whitespace-pre-wrap">{feedback.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 새 피드백 작성 */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 피드백 작성
              </label>
              <textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="피드백 내용을 입력하세요..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddFeedback}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>피드백 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDBSearch;
