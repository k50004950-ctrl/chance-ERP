import React, { useState, useEffect } from 'react';
import { Phone, Search as SearchIcon, X, MessageSquare, Download, CheckCircle, Edit2, Save, RefreshCw, FileText } from 'lucide-react';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import * as XLSX from 'xlsx';

interface SalesDB {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_name: string;
  salesperson_id: number;
  meeting_status: string;
  company_name: string;
  representative: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: number;
  existing_client: string;
  contract_status: string;
  contract_date: string;
  client_name: string;
  feedback: string;
  happycall_completed: number;
  happycall_memo: string;
}

const HappyCallDBList: React.FC = () => {
  const { user } = useAuth();
  const [salesDB, setSalesDB] = useState<SalesDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<SalesDB[]>([]);
  const [showHappyCallModal, setShowHappyCallModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDB, setSelectedDB] = useState<SalesDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('all');
  const [editingMemo, setEditingMemo] = useState<number | null>(null);
  const [memoContent, setMemoContent] = useState<string>('');
  const [happyCallData, setHappyCallData] = useState({
    call_date: new Date().toISOString().split('T')[0],
    call_content: '',
    score: '중',
    notes: ''
  });
  
  const isHappyCallStaff = user?.role === 'happycall' || user?.role === 'admin';

  useEffect(() => {
    fetchSalesDB();
  }, []);

  useEffect(() => {
    let filtered = salesDB;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contact?.includes(searchTerm) ||
          item.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 날짜 필터
    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = item.proposal_date;
        if (!itemDate) return false;

        const dateStr = itemDate.split('T')[0]; // YYYY-MM-DD 형식으로 변환
        
        if (startDate && endDate) {
          return dateStr >= startDate && dateStr <= endDate;
        } else if (startDate) {
          return dateStr >= startDate;
        } else if (endDate) {
          return dateStr <= endDate;
        }
        return true;
      });
    }

    // 완료 상태 필터
    if (completionFilter !== 'all') {
      filtered = filtered.filter((item) => {
        if (completionFilter === 'completed') {
          return item.happycall_completed === 1;
        } else if (completionFilter === 'incomplete') {
          return item.happycall_completed === 0 || !item.happycall_completed;
        }
        return true;
      });
    }

    // 계약 상태 필터
    if (contractStatusFilter !== 'all') {
      filtered = filtered.filter((item) => {
        if (contractStatusFilter === 'completed') {
          return item.contract_status === 'Y' || item.contract_status === '계약완료';
        } else if (contractStatusFilter === 'not_completed') {
          return item.contract_status !== 'Y' && item.contract_status !== '계약완료';
        }
        return true;
      });
    }

    setFilteredData(filtered);
  }, [searchTerm, startDate, endDate, completionFilter, contractStatusFilter, salesDB]);

  const fetchSalesDB = async () => {
    setLoading(true);
    try {
      console.log('API 호출 시작:', `${API_BASE_URL}/api/sales-db`);
      const response = await fetch(`${API_BASE_URL}/api/sales-db`);
      console.log('응답 상태:', response.status);
      const result = await response.json();
      console.log('조회 결과:', result);
      
      if (result.success) {
        console.log('조회된 DB 수:', result.data.length);
        setSalesDB(result.data || []);
        setFilteredData(result.data || []);
      } else {
        console.error('DB 조회 실패:', result.message);
        alert('DB 조회에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('DB 조회 오류:', error);
      alert('DB 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHappyCall = (item: SalesDB) => {
    setSelectedDB(item);
    setHappyCallData({
      call_date: new Date().toISOString().split('T')[0],
      call_content: '',
      score: '중',
      notes: ''
    });
    setShowHappyCallModal(true);
  };

  const handleOpenFeedback = (item: SalesDB) => {
    setSelectedDB(item);
    setShowFeedbackModal(true);
  };

  const parseFeedback = (feedbackString: string) => {
    try {
      if (!feedbackString) return [];
      const parsed = JSON.parse(feedbackString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return feedbackString ? [feedbackString] : [];
    }
  };

  const handleSubmitHappyCall = async () => {
    if (!selectedDB) return;

    if (!happyCallData.call_content.trim()) {
      alert('통화 내용을 입력해주세요.');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const requestData = {
      happycall_staff_id: currentUser.id,
      happycall_staff_name: currentUser.name,
      salesperson_id: selectedDB.salesperson_id,
      salesperson_name: selectedDB.salesperson_name,
      client_name: selectedDB.company_name,
      client_contact: selectedDB.contact,
      call_date: happyCallData.call_date,
      call_content: happyCallData.call_content,
      score: happyCallData.score,
      notes: happyCallData.notes
    };

    console.log('해피콜 등록 요청:', requestData);

    try {
      // sales_db_id를 추가하여 정확한 DB 매칭
      const requestDataWithId = {
        ...requestData,
        sales_db_id: selectedDB.id
      };

      console.log('해피콜 등록 요청 (DB ID 포함):', requestDataWithId);

      const response = await fetch(`${API_BASE_URL}/api/happycalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestDataWithId)
      });

      console.log('응답 상태:', response.status);
      const result = await response.json();
      console.log('응답 결과:', result);
      
      if (result.success) {
        alert('✅ 해피콜이 등록되었습니다!\n\n현재 필터 설정이 유지됩니다.');
        setShowHappyCallModal(false);
        setSelectedDB(null);
        // 화면 초기화를 방지하기 위해 fetchSalesDB() 호출 제거
        // 필요시 사용자가 직접 새로고침하거나 필터를 다시 설정할 수 있습니다
      } else {
        console.error('해피콜 등록 실패:', result);
        alert('❌ 해피콜 등록 실패:\n' + result.message);
      }
    } catch (error) {
      console.error('해피콜 등록 오류:', error);
      alert('❌ 해피콜 등록 중 오류가 발생했습니다.\n\n오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    }
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    const excelData = filteredData.map((item, index) => ({
      '번호': index + 1,
      '섭외일': formatDateToKorean(item.proposal_date) || '-',
      '업체명': item.company_name || '-',
      '대표자': item.representative || '-',
      '연락처': item.contact || '-',
      '주소': item.address || '-',
      '영업자': item.salesperson_name || '-',
      '미팅상태': item.meeting_status || '-',
      '계약상태': item.contract_status === 'Y' ? '계약완료' : '미계약',
      '거래처': item.client_name || '-',
      '해피콜완료': item.happycall_completed === 1 ? '완료' : '미완료',
      '담당자메모': item.happycall_memo || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '영업DB');
    
    const fileName = `영업DB_해피콜용_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 완료 상태 토글
  const handleToggleCompletion = async (item: SalesDB) => {
    if (!isHappyCallStaff) {
      alert('해피콜 담당자만 완료 상태를 변경할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          happycall_completed: item.happycall_completed === 1 ? 0 : 1
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchSalesDB();
      } else {
        alert('완료 상태 변경 실패: ' + result.message);
      }
    } catch (error) {
      console.error('완료 상태 변경 오류:', error);
      alert('완료 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 메모 수정 시작
  const handleStartEditMemo = (item: SalesDB) => {
    setEditingMemo(item.id);
    setMemoContent(item.happycall_memo || '');
  };

  // 메모 저장
  const handleSaveMemo = async (item: SalesDB) => {
    if (!isHappyCallStaff) {
      alert('해피콜 담당자만 메모를 작성할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          happycall_memo: memoContent
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingMemo(null);
        setMemoContent('');
        fetchSalesDB();
      } else {
        alert('메모 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('메모 저장 오류:', error);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 메모 수정 취소
  const handleCancelEditMemo = () => {
    setEditingMemo(null);
    setMemoContent('');
  };

  // 해피콜 완료 상태 동기화 (관리자 전용)
  const handleSyncCompletionStatus = async () => {
    if (!window.confirm('기존 등록된 모든 해피콜의 완료 상태를 동기화하시겠습니까?\n\n이 작업은 happycalls 테이블에 있는 모든 해피콜을 sales_db 테이블의 완료 상태로 업데이트합니다.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/happycalls/sync-completion-status`, {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ 해피콜 완료 상태 동기화 완료!\n\n${result.updatedCount}건의 DB가 업데이트되었습니다.`);
        fetchSalesDB(); // 목록 새로고침
      } else {
        alert('❌ 동기화 실패: ' + result.message);
      }
    } catch (error) {
      console.error('동기화 오류:', error);
      alert('❌ 동기화 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">영업 DB 조회 (해피콜용)</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              모든 영업 DB를 조회하고 해피콜을 입력할 수 있습니다.
            </p>
          </div>
          <div className="flex space-x-2">
            {isHappyCallStaff && (
              <button
                onClick={handleSyncCompletionStatus}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition"
                title="해피콜 완료 상태 동기화"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">완료상태 동기화</span>
              </button>
            )}
            <button
              onClick={handleExcelDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">엑셀 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4 space-y-4">
        {/* 검색 */}
        <div className="flex items-center space-x-2">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="업체명, 대표자, 연락처, 영업자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 날짜 필터 */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">섭외일 기간:</span>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              날짜 초기화
            </button>
          )}
        </div>

        {/* 완료 상태 필터 */}
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-gray-400" />
          <select
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">해피콜 상태: 전체</option>
            <option value="completed">완료</option>
            <option value="incomplete">미완료</option>
          </select>
        </div>

        {/* 계약 상태 필터 */}
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <select
            value={contractStatusFilter}
            onChange={(e) => setContractStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">계약상태: 전체</option>
            <option value="completed">계약완료</option>
            <option value="not_completed">미계약</option>
          </select>
          <div className="ml-auto text-sm text-gray-600">
            총 <span className="font-bold text-blue-600">{filteredData.length}</span>건
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">해피콜</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-green-50">완료상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">섭외일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">영업자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">미팅상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">거래처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">피드백</th>
                {isHappyCallStaff && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">담당자메모</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isHappyCallStaff ? 12 : 11} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isHappyCallStaff ? 12 : 11} className="px-4 py-12 text-center text-gray-500">
                    <div>
                      <p className="text-lg font-medium mb-2">조회된 데이터가 없습니다.</p>
                      <p className="text-sm">영업자가 등록한 DB가 없거나 검색 조건에 맞는 데이터가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`${
                      item.happycall_completed === 1 
                        ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenHappyCall(item)}
                        className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition"
                        title="해피콜 입력"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        입력
                      </button>
                    </td>
                    <td className="px-4 py-3 bg-green-50 text-center">
                      {isHappyCallStaff ? (
                        <button
                          onClick={() => handleToggleCompletion(item)}
                          className={`px-3 py-1 text-xs font-medium rounded transition ${
                            item.happycall_completed === 1
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {item.happycall_completed === 1 ? '✓ 완료' : '미완료'}
                        </button>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-medium rounded ${
                          item.happycall_completed === 1
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.happycall_completed === 1 ? '✓ 완료' : '미완료'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToKorean(item.proposal_date) || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.company_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.representative || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.contact || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.salesperson_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '미팅대기중' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.meeting_status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.contract_status === 'Y' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.contract_status === 'Y' ? '계약완료' : '미계약'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.client_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.feedback ? (
                        <button
                          onClick={() => handleOpenFeedback(item)}
                          className="inline-flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition"
                          title="피드백 보기"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {(() => {
                            try {
                              const feedback = JSON.parse(item.feedback);
                              return Array.isArray(feedback) ? feedback.length : 1;
                            } catch {
                              return 1;
                            }
                          })()}개
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">없음</span>
                      )}
                    </td>
                    {isHappyCallStaff && (
                      <td className="px-4 py-3 bg-blue-50">
                        {editingMemo === item.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={memoContent}
                              onChange={(e) => setMemoContent(e.target.value)}
                              className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="메모 입력..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveMemo(item)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="저장"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEditMemo}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="취소"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between space-x-2">
                            <span className="text-sm text-gray-700">{item.happycall_memo || '-'}</span>
                            <button
                              onClick={() => handleStartEditMemo(item)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="메모 수정"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 피드백 보기 모달 */}
      {showFeedbackModal && selectedDB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">피드백 내역</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDB.company_name}</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {parseFeedback(selectedDB.feedback).length > 0 ? (
                <div className="space-y-4">
                  {parseFeedback(selectedDB.feedback).map((feedback: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-700">
                            {typeof feedback === 'string' ? '피드백' : feedback.author || '작성자 미상'}
                          </span>
                        </div>
                        {typeof feedback === 'object' && feedback.timestamp && (
                          <span className="text-xs text-gray-500">
                            {new Date(feedback.timestamp).toLocaleString('ko-KR')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {typeof feedback === 'string' ? feedback : feedback.content || feedback.text || JSON.stringify(feedback)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">피드백이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 해피콜 입력 모달 */}
      {showHappyCallModal && selectedDB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">해피콜 입력</h2>
              <button
                onClick={() => setShowHappyCallModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 고객 정보 표시 */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 mb-2">고객 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">업체명:</span>
                    <span className="ml-2 font-medium">{selectedDB.company_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">대표자:</span>
                    <span className="ml-2 font-medium">{selectedDB.representative}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">연락처:</span>
                    <span className="ml-2 font-medium">{selectedDB.contact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">담당 영업자:</span>
                    <span className="ml-2 font-medium">{selectedDB.salesperson_name}</span>
                  </div>
                </div>
              </div>

              {/* 통화일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화일 <span className="text-red-500">*</span>
                </label>
                <KoreanDatePicker
                  selected={happyCallData.call_date ? new Date(happyCallData.call_date) : new Date()}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setHappyCallData({ ...happyCallData, call_date: `${year}-${month}-${day}` });
                    }
                  }}
                />
              </div>

              {/* 통화 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={happyCallData.call_content}
                  onChange={(e) => setHappyCallData({ ...happyCallData, call_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  placeholder="고객과의 통화 내용을 입력하세요..."
                />
              </div>

              {/* 평가 점수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평가 점수 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="상"
                      checked={happyCallData.score === '상'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium">상 (만족)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="중"
                      checked={happyCallData.score === '중'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">중 (보통)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="하"
                      checked={happyCallData.score === '하'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded font-medium">하 (불만)</span>
                  </label>
                </div>
                {happyCallData.score === '하' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ '하' 점수는 관리자와 담당 영업자에게 알림이 발송됩니다.
                  </p>
                )}
              </div>

              {/* 특이사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특이사항
                </label>
                <textarea
                  value={happyCallData.notes}
                  onChange={(e) => setHappyCallData({ ...happyCallData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="추가 특이사항이 있다면 입력하세요..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowHappyCallModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleSubmitHappyCall}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                해피콜 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HappyCallDBList;
