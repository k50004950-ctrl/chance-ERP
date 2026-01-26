import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Database, TrendingUp, CheckCircle, Clock, XCircle, FileAudio, Download, Search, Filter, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateToKorean, toDateValue, toDatetimeLocalValue } from '../../utils/dateFormat';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';

interface DBItem {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_id: number;
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
  contract_date: string;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
  meeting_request_datetime: string;
}

interface Salesperson {
  id: number;
  name: string;
  username: string;
}

interface Recruiter {
  id: number;
  name: string;
  username: string;
}

const AllDBManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [allData, setAllData] = useState<DBItem[]>([]);
  const [filteredData, setFilteredData] = useState<DBItem[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [selectedContractStatus, setSelectedContractStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DBItem | null>(null);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState<boolean>(false);
  const [meetingDateStart, setMeetingDateStart] = useState<string>('');
  const [meetingDateEnd, setMeetingDateEnd] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchAllData();
      fetchSalespersons();
      fetchRecruiters();
    }
  }, [currentUser]);

  const fetchAllData = async () => {
    try {
      const response = await fetch(`/api/sales-db`);
      const result = await response.json();
      if (result.success) {
        setAllData(result.data);
        setFilteredData(result.data);
        
        // Extract unique years
        const years = Array.from(
          new Set(
            result.data
              .map((item: DBItem) => item.proposal_date ? item.proposal_date.split('-')[0] : '')
              .filter(Boolean)
          )
        ).sort((a, b) => b.localeCompare(a));
        setAvailableYears(years as string[]);
      }
    } catch (error) {
      console.error('DB 조회 실패:', error);
    }
  };

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const response = await fetch('/api/users?role=recruiter');
      const result = await response.json();
      if (result.success) {
        setRecruiters(result.data);
      }
    } catch (error) {
      console.error('섭외자 목록 조회 실패:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      // ISO 형식 또는 datetime-local 형식 (2026-01-20T15:00)
      if (dateString.includes('T') || dateString.includes('-')) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Invalid date면 원본 반환
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
      }
      
      // 이미 한글 형식인 경우 (01월 20일 오전 10:00 등) - 그대로 반환
      return dateString;
    } catch (error) {
      console.error('날짜 형식 변환 실패:', error);
      return dateString; // 에러 발생 시 원본 반환
    }
  };

  // 필터링 로직
  useEffect(() => {
    let filtered = allData;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contact?.includes(searchTerm) ||
          item.proposer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 년도 필터
    if (selectedYear) {
      filtered = filtered.filter(
        (item) => item.proposal_date && item.proposal_date.startsWith(selectedYear)
      );
    }

    // 월 필터
    if (selectedMonth) {
      filtered = filtered.filter((item) => {
        if (!item.proposal_date) return false;
        const month = item.proposal_date.split('-')[1];
        return month === selectedMonth;
      });
    }

    // 섭외자 필터
    if (selectedRecruiter) {
      filtered = filtered.filter((item) => item.proposer === selectedRecruiter);
    }

    // 영업자 필터
    if (selectedSalesperson) {
      filtered = filtered.filter((item) => item.salesperson_name === selectedSalesperson);
    }

    // 계약 상태 필터
    if (selectedContractStatus) {
      filtered = filtered.filter((item) => item.contract_status === selectedContractStatus);
    }

    // 담당영업자 미배정 필터
    if (showUnassignedOnly) {
      filtered = filtered.filter((item) => !item.salesperson_id || item.salesperson_id === null);
    }

    // 미팅희망날짜 필터
    if (meetingDateStart || meetingDateEnd) {
      filtered = filtered.filter((item) => {
        if (!item.meeting_request_datetime) return false;
        
        // 날짜 부분만 추출 (YYYY-MM-DD)
        let meetingDate = '';
        if (item.meeting_request_datetime.includes('T')) {
          meetingDate = item.meeting_request_datetime.split('T')[0];
        } else if (item.meeting_request_datetime.includes(' ')) {
          meetingDate = item.meeting_request_datetime.split(' ')[0];
        } else {
          // "2026-01-22오후4시" 형식
          const dateMatch = item.meeting_request_datetime.match(/^(\d{4}-\d{2}-\d{2})/);
          meetingDate = dateMatch ? dateMatch[1] : item.meeting_request_datetime;
        }
        
        // 범위 체크
        if (meetingDateStart && meetingDate < meetingDateStart) return false;
        if (meetingDateEnd && meetingDate > meetingDateEnd) return false;
        
        return true;
      });
    }

    // 편집 중인 항목은 필터 조건과 관계없이 항상 표시
    if (editingId) {
      const editingItem = allData.find((item) => item.id === editingId);
      if (editingItem && !filtered.find((item) => item.id === editingId)) {
        filtered.push(editingItem);
      }
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedYear, selectedMonth, selectedRecruiter, selectedSalesperson, selectedContractStatus, showUnassignedOnly, meetingDateStart, meetingDateEnd, allData, editingId]);

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    fetchAllData();
  };

  // 날짜를 datetime-local input 형식으로 변환
  const toDatetimeLocalValue = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // YYYY-MM-DDTHH:mm 형식으로 변환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // 날짜를 date input 형식으로 변환
  const toDateValue = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // YYYY-MM-DD 형식으로 변환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const handleChange = (id: number, field: string, value: string | number) => {
    // allData와 filteredData 모두 업데이트
    const updateItem = (item: DBItem) => 
      item.id === id ? { ...item, [field]: value } : item;
    
    setAllData(allData.map(updateItem));
    setFilteredData(filteredData.map(updateItem));
  };

  const handleSave = async (item: DBItem) => {
    try {
      const response = await fetch(`/api/sales-db/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_date: item.proposal_date,
          proposer: item.proposer,
          meeting_status: item.meeting_status,
          salesperson_id: item.salesperson_id,
          contract_date: item.contract_date,
          contract_status: item.contract_status,
          actual_sales: item.actual_sales,
          client_name: item.client_name,
          feedback: item.feedback,
          meeting_request_datetime: item.meeting_request_datetime,
          company_name: item.company_name,
          representative: item.representative,
          address: item.address,
          contact: item.contact,
          industry: item.industry,
          sales_amount: item.sales_amount,
          existing_client: item.existing_client,
          contract_client: item.contract_client,
          contract_month: item.contract_month,
          termination_month: item.termination_month,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        
        // 담당영업자를 배정한 경우, '미배정만 보기' 필터를 자동 해제
        if (item.salesperson_id && showUnassignedOnly) {
          setShowUnassignedOnly(false);
        }
        
        fetchAllData();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleShowDetail = (item: DBItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
    setNewFeedback(''); // 모달 열 때 피드백 입력란 초기화
  };

  const handleDelete = async (item: DBItem) => {
    if (!window.confirm(`정말 "${item.company_name}" DB를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 일정도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/sales-db/${item.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        // 목록에서 제거
        setAllData(allData.filter(d => d.id !== item.id));
        setFilteredData(filteredData.filter(d => d.id !== item.id));
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedItem || !newFeedback.trim()) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }

    try {
      // 기존 피드백 파싱
      let feedbacks = [];
      if (selectedItem.feedback) {
        try {
          const parsed = JSON.parse(selectedItem.feedback);
          if (Array.isArray(parsed)) {
            feedbacks = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            // 단일 객체인 경우 배열로 변환
            feedbacks = [parsed];
          }
        } catch {
          // JSON 파싱 실패 시 일반 텍스트로 간주
          if (selectedItem.feedback.trim()) {
            feedbacks = [{
              author: '이전 작성자',
              content: selectedItem.feedback,
              timestamp: new Date().toISOString()
            }];
          }
        }
      }

      console.log('기존 피드백:', feedbacks);

      // 새 피드백 추가
      feedbacks.push({
        author: currentUser?.name || '관리자',
        content: newFeedback,
        timestamp: new Date().toISOString()
      });

      console.log('업데이트될 피드백:', feedbacks);

      // 서버에 업데이트
      const response = await fetch(`/api/sales-db/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: JSON.stringify(feedbacks)
        })
      });

      const result = await response.json();
      if (result.success) {
        // 전체 데이터 다시 가져오기
        await fetchAllData();
        
        // 서버에서 가져온 최신 데이터로 모달 업데이트
        // allData는 비동기로 업데이트되므로, 직접 조회
        const refreshResponse = await fetch(`/api/sales-db`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success) {
          const updatedItem = refreshResult.data.find((item: DBItem) => item.id === selectedItem.id);
          if (updatedItem) {
            setSelectedItem(updatedItem);
          }
        }

        setNewFeedback('');
        alert('피드백이 등록되었습니다.');
      } else {
        alert('피드백 등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 등록 실패:', error);
      alert('피드백 등록 중 오류가 발생했습니다.');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedRecruiter('');
    setSelectedSalesperson('');
    setSelectedContractStatus('');
    setShowUnassignedOnly(false);
    setMeetingDateStart('');
    setMeetingDateEnd('');
  };

  const handleFixScheduleTimes = async () => {
    if (!window.confirm('모든 일정의 시간을 DB의 미팅희망날짜 기준으로 일괄 업데이트하시겠습니까?\n\n잘못 저장된 00:00 시간들이 올바른 시간으로 수정됩니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/schedules/fix-times', {
        method: 'POST',
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`일정 시간 업데이트 완료!\n\n성공: ${result.updated}개\n실패: ${result.errors}개`);
      } else {
        alert('업데이트 실패: ' + result.message);
      }
    } catch (error) {
      console.error('일정 시간 업데이트 실패:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleExcelDownload = () => {
    try {
      // 엑셀로 내보낼 데이터 준비
      const excelData = filteredData.map((item, index) => ({
        '번호': index + 1,
        '섭외일': formatDateToKorean(item.proposal_date) || '-',
        '섭외자': item.proposer || '-',
        '미팅희망날짜': item.meeting_request_datetime ? formatDateTime(item.meeting_request_datetime) : '-',
        '업체명': item.company_name || '-',
        '대표자': item.representative || '-',
        '연락처': item.contact || '-',
        '주소': item.address || '-',
        '담당영업자': item.salesperson_name || '-',
        '미팅상태': item.meeting_status || '-',
        '계약상태': item.contract_status === 'Y' ? '완료' : 
                     item.contract_status === 'N' ? '미완료' : 
                     item.contract_status || '-',
        '계약날짜': formatDateToKorean(item.contract_date) || '-',
        '계약기장료': item.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(Number(item.actual_sales))}` : '-',
        '거래처': item.client_name || '-',
        '피드백': item.feedback || '-',
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DB 목록');
      
      // 파일명 생성 (현재 필터 조건 반영)
      const fileName = `DB목록_${selectedYear || '전체'}년_${selectedMonth || '전체'}월_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);
      
      alert(`${filteredData.length}건의 데이터가 다운로드되었습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">전체 DB 관리</h1>
            <p className="text-gray-600 mt-1">
              모든 섭외자와 영업자의 DB를 통합 관리하세요
            </p>
          </div>
        </div>
      </div>

      {/* 실적 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 DB</p>
              <p className="text-2xl font-bold text-gray-800">{filteredData.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미팅완료</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredData.filter(item => item.meeting_status === '미팅완료').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">조치 필요</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredData.filter(item => 
                  item.meeting_status === '일정재확인요청' || 
                  item.meeting_status === '일정재섭외' || 
                  item.meeting_status === 'AS'
                ).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미팅거절</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredData.filter(item => item.meeting_status === '미팅거절').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">필터</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 p-1 hover:bg-gray-100 rounded"
          >
            {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <button
            onClick={handleResetFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            초기화
          </button>
        </div>
        
        {showFilters && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="업체명, 대표자, 연락처 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 년도 필터 */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

          {/* 섭외자 필터 */}
          <select
            value={selectedRecruiter}
            onChange={(e) => setSelectedRecruiter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 섭외자</option>
            {recruiters.map((recruiter) => (
              <option key={recruiter.id} value={recruiter.name}>
                {recruiter.name}
              </option>
            ))}
          </select>

          {/* 영업자 필터 */}
          <select
            value={selectedSalesperson}
            onChange={(e) => setSelectedSalesperson(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 영업자</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.name}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>

        {/* 미팅희망날짜 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">미팅희망날짜:</label>
            <input
              type="date"
              value={meetingDateStart}
              onChange={(e) => setMeetingDateStart(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
              placeholder="시작일"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={meetingDateEnd}
              onChange={(e) => setMeetingDateEnd(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
              placeholder="종료일"
            />
          </div>
          <div className="text-sm text-gray-500">
            {meetingDateStart || meetingDateEnd ? 
              `필터링 중: ${filteredData.length}개` : 
              '날짜 범위를 선택하세요'}
          </div>
        </div>

        {/* 계약 상태 필터 추가 */}
        <div className="mt-4">
          <select
            value={selectedContractStatus}
            onChange={(e) => setSelectedContractStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="Y">완료</option>
            <option value="N">미완료</option>
            <option value="계약예정">계약예정</option>
            <option value="계약불가">계약불가</option>
          </select>
        </div>

        {/* 담당영업자 미배정 필터 */}
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              담당영업자 미배정만 보기
            </span>
          </label>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFixScheduleTimes}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center space-x-2"
              title="00:00으로 잘못 저장된 일정 시간을 일괄 수정합니다"
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">일정 시간 일괄 수정</span>
            </button>
            
            <button
              onClick={handleExcelDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center space-x-2"
              title="현재 필터링된 DB 목록을 엑셀로 다운로드합니다"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">엑셀 다운로드</span>
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="md:hidden space-y-4 mb-6">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            조건에 맞는 DB가 없습니다.
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              {/* 헤더 */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.company_name || '-'}</h3>
                  <p className="text-sm text-gray-600">{item.representative || '-'}</p>
                </div>
                <div className="flex space-x-2">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => handleSave(item.id)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <FileAudio className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 주요 정보 */}
              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">섭외일:</span>
                  {editingId === item.id ? (
                    <input
                      type="date"
                      value={toDateValue(item.proposal_date)}
                      onChange={(e) => handleChange(item.id, 'proposal_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{formatDateToKorean(item.proposal_date) || '-'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">섭외자:</span>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={item.proposer || ''}
                      onChange={(e) => handleChange(item.id, 'proposer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <span className="text-green-700 font-medium">{item.proposer || '-'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">미팅희망날짜:</span>
                  {editingId === item.id ? (
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(item.meeting_request_datetime)}
                      onChange={(e) => handleChange(item.id, 'meeting_request_datetime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    />
                  ) : (
                    <span className="text-yellow-700 font-medium">{formatDateTime(item.meeting_request_datetime)}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">연락처:</span>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={item.contact || ''}
                      onChange={(e) => handleChange(item.id, 'contact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{item.contact || '-'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">주소:</span>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={item.address || ''}
                      onChange={(e) => handleChange(item.id, 'address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-900">{item.address || '-'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">담당영업자:</span>
                  {editingId === item.id ? (
                    <select
                      value={item.salesperson_id || ''}
                      onChange={(e) => handleChange(item.id, 'salesperson_id', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">다시 선택</option>
                      {salespersons.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-purple-700 font-medium">{item.salesperson_name || '미배정'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">미팅상태:</span>
                  {editingId === item.id ? (
                    <select
                      value={item.meeting_status || ''}
                      onChange={(e) => handleChange(item.id, 'meeting_status', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">선택</option>
                      <option value="미팅완료">미팅완료</option>
                      <option value="미팅요청">미팅요청</option>
                      <option value="재미팅">재미팅</option>
                      <option value="일정재확인요청">일정재확인요청</option>
                      <option value="일정재섭외">일정재섭외</option>
                      <option value="AS">AS</option>
                      <option value="영업자관리">영업자관리</option>
                      <option value="미팅거절">미팅거절</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                      item.meeting_status === '미팅요청' ? 'bg-yellow-100 text-yellow-800' :
                      item.meeting_status === '재미팅' ? 'bg-blue-100 text-blue-800' :
                      item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                      item.meeting_status === '일정재섭외' ? 'bg-orange-100 text-orange-800' :
                      item.meeting_status === 'AS' ? 'bg-purple-100 text-purple-800' :
                      item.meeting_status === '영업자관리' ? 'bg-blue-100 text-blue-800' :
                      item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.meeting_status || '-'}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">계약상태:</span>
                  {editingId === item.id ? (
                    <select
                      value={item.contract_status || ''}
                      onChange={(e) => handleChange(item.id, 'contract_status', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">선택</option>
                      <option value="계약완료">계약완료</option>
                      <option value="미계약">미계약</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      item.contract_status === '계약완료' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.contract_status || '-'}
                    </span>
                  )}
                </div>
                
                {(editingId === item.id || item.contract_date) && (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-700">계약날짜:</span>
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={toDateValue(item.contract_date)}
                        onChange={(e) => handleChange(item.id, 'contract_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <span className="text-orange-700 font-medium">{formatDateToKorean(item.contract_date)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 피드백 섹션 */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileAudio className="w-4 h-4 mr-1" />
                    피드백
                  </h4>
                </div>
                
                {/* 기존 피드백 표시 */}
                {(() => {
                  try {
                    const feedbackArray = item.feedback ? JSON.parse(item.feedback) : [];
                    return feedbackArray.length > 0 ? (
                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                        {feedbackArray.map((fb: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-blue-900">{fb.writer_name}</span>
                              <span className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleString('ko-KR')}</span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{fb.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">피드백이 없습니다.</p>
                    );
                  } catch {
                    return item.feedback ? (
                      <div className="bg-blue-50 p-3 rounded-lg text-sm mb-3">
                        <p className="text-gray-700 whitespace-pre-wrap">{item.feedback}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">피드백이 없습니다.</p>
                    );
                  }
                })()}

                {/* 새 피드백 입력 */}
                <div className="space-y-2">
                  <textarea
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="새 피드백을 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      if (!newFeedback.trim()) {
                        alert('피드백 내용을 입력해주세요.');
                        return;
                      }
                      handleSubmitFeedback(item.id);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    피드백 저장
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 테이블 (데스크톱) */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">섭외일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-green-50">섭외자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-yellow-50">미팅희망날짜시간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">주소</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-purple-50">담당영업자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">미팅상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-orange-50">계약날짜</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                  조건에 맞는 DB가 없습니다.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} data-db-id={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 bg-blue-50 text-sm whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={toDateValue(item.proposal_date)}
                        onChange={(e) => handleChange(item.id, 'proposal_date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      formatDateToKorean(item.proposal_date) || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 bg-green-50">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.proposer || ''}
                        onChange={(e) => handleChange(item.id, 'proposer', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                        placeholder="섭외자"
                      />
                    ) : (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {item.proposer || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-yellow-50 text-sm whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="datetime-local"
                        value={toDatetimeLocalValue(item.meeting_request_datetime)}
                        onChange={(e) => handleChange(item.id, 'meeting_request_datetime', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : item.meeting_request_datetime ? (
                      <span className="text-gray-900 font-medium">
                        {formatDateTime(item.meeting_request_datetime)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.company_name || ''}
                        onChange={(e) => handleChange(item.id, 'company_name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="업체명"
                      />
                    ) : (
                      <button
                        onClick={() => handleShowDetail(item)}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {item.company_name}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.representative || ''}
                        onChange={(e) => handleChange(item.id, 'representative', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="대표자"
                      />
                    ) : (
                      item.representative || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.contact || ''}
                        onChange={(e) => handleChange(item.id, 'contact', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="연락처"
                      />
                    ) : (
                      item.contact || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.address || ''}
                        onChange={(e) => handleChange(item.id, 'address', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="주소"
                      />
                    ) : (
                      <div className="truncate" title={item.address}>
                        {item.address || '-'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-purple-50">
                    {editingId === item.id ? (
                      <select
                        value={item.salesperson_id || ''}
                        onChange={(e) => handleChange(item.id, 'salesperson_id', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        {salespersons.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {item.salesperson_name || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <select
                        value={item.meeting_status || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        <option value="미팅완료">미팅완료</option>
                        <option value="일정재확인요청">일정재확인요청</option>
                        <option value="일정재섭외">일정재섭외</option>
                        <option value="AS">AS</option>
                        <option value="영업자관리">영업자관리</option>
                        <option value="미팅거절">미팅거절</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                        item.meeting_status === '일정재섭외' ? 'bg-orange-100 text-orange-800' :
                        item.meeting_status === 'AS' ? 'bg-purple-100 text-purple-800' :
                        item.meeting_status === '영업자관리' ? 'bg-blue-100 text-blue-800' :
                        item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.meeting_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.id ? (
                      <select
                        value={item.contract_status || ''}
                        onChange={(e) => handleChange(item.id, 'contract_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        <option value="Y">완료</option>
                        <option value="N">미완료</option>
                        <option value="계약예정">계약예정</option>
                        <option value="계약불가">계약불가</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.contract_status === 'Y' ? 'bg-green-100 text-green-800' :
                        item.contract_status === 'N' ? 'bg-gray-100 text-gray-800' :
                        item.contract_status === '계약예정' ? 'bg-blue-100 text-blue-800' :
                        item.contract_status === '계약불가' ? 'bg-red-100 text-red-800' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {item.contract_status === 'Y' ? '완료' : 
                         item.contract_status === 'N' ? '미완료' : 
                         item.contract_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-orange-50 text-sm whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={toDateValue(item.contract_date)}
                        onChange={(e) => handleChange(item.id, 'contract_date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <span className="text-gray-900">{formatDateToKorean(item.contract_date) || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleSave(item)}
                          className="text-green-600 hover:text-green-900"
                          title="저장"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-red-600 hover:text-red-900"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
              <h2 className="text-lg md:text-2xl font-bold">업체 상세 정보</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setNewFeedback(''); // 모달 닫을 때 피드백 입력란 초기화
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">1</span>
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-gray-500 mb-1">업체명</p><p className="text-lg font-semibold text-gray-900">{selectedItem.company_name}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">대표자</p><p className="text-lg font-semibold text-gray-900">{selectedItem.representative || '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">연락처</p><p className="text-lg font-semibold text-gray-900">{selectedItem.contact || '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">업종</p><p className="text-lg font-semibold text-gray-900">{selectedItem.industry || '-'}</p></div>
                    <div className="md:col-span-2"><p className="text-sm font-medium text-gray-500 mb-1">주소</p><p className="text-lg font-semibold text-gray-900">{selectedItem.address || '-'}</p></div>
                  </div>
                </div>

                {/* 섭외/영업 정보 */}
                <div className="md:col-span-2 bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">2</span>
                    섭외 및 영업 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><p className="text-sm font-medium text-gray-500 mb-1">섭외일</p><p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.proposal_date) || '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">섭외자</p><span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">{selectedItem.proposer || '-'}</span></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">담당영업자</p><span className="inline-block px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-bold">{selectedItem.salesperson_name || '-'}</span></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">미팅 상태</p><span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                      selectedItem.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                      selectedItem.meeting_status === '일정재섭외' ? 'bg-orange-100 text-orange-800' :
                      selectedItem.meeting_status === 'AS' ? 'bg-purple-100 text-purple-800' :
                      selectedItem.meeting_status === '영업자관리' ? 'bg-blue-100 text-blue-800' :
                      selectedItem.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{selectedItem.meeting_status || '-'}</span></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">계약날짜</p><p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.contract_date) || '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">계약 완료</p><span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem.contract_status === 'Y' ? 'bg-green-100 text-green-800' : 
                      selectedItem.contract_status === 'N' ? 'bg-gray-100 text-gray-800' : 
                      selectedItem.contract_status === '계약예정' ? 'bg-blue-100 text-blue-800' :
                      selectedItem.contract_status === '계약불가' ? 'bg-red-100 text-red-800' :
                      'bg-gray-50 text-gray-500'
                    }`}>{
                      selectedItem.contract_status === 'Y' ? '완료' : 
                      selectedItem.contract_status === 'N' ? '미완료' : 
                      selectedItem.contract_status || '-'
                    }</span></div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="md:col-span-2 bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">3</span>
                    재무 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-gray-500 mb-1">매출액</p><p className="text-lg font-semibold text-gray-900">{selectedItem.sales_amount ? `${new Intl.NumberFormat('ko-KR').format(selectedItem.sales_amount)}원` : '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">계약기장료</p><p className="text-lg font-semibold text-blue-600">{selectedItem.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(Number(selectedItem.actual_sales))}원` : '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">기존거래처</p><p className="text-lg font-semibold text-gray-900">{selectedItem.existing_client || '-'}</p></div>
                    <div><p className="text-sm font-medium text-gray-500 mb-1">매출거래처</p><p className="text-lg font-semibold text-gray-900">{selectedItem.client_name || '-'}</p></div>
                  </div>
                </div>

                {/* Other Info */}
                <div className="md:col-span-2 bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">4</span>
                    기타 정보
                  </h3>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">피드백 / 기타사항</p>
                    
                    {/* 기존 피드백 표시 */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      {(() => {
                        if (!selectedItem.feedback) {
                          return <p className="text-gray-500">작성된 피드백이 없습니다.</p>;
                        }
                        
                        try {
                          const feedbacks = JSON.parse(selectedItem.feedback);
                          if (Array.isArray(feedbacks) && feedbacks.length > 0) {
                            return (
                              <div className="space-y-3">
                                {feedbacks.map((fb: any, index: number) => (
                                  <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-semibold text-gray-800">{fb.author || '작성자 미상'}</span>
                                      {fb.timestamp && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(fb.timestamp).toLocaleString('ko-KR')}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-900 whitespace-pre-wrap">{fb.content || fb.text || '-'}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        } catch {
                          // JSON 파싱 실패 시 원본 텍스트 표시
                        }
                        
                        return <p className="text-gray-900 whitespace-pre-wrap">{selectedItem.feedback}</p>;
                      })()}
                    </div>

                    {/* 새 피드백 작성 */}
                    <div className="bg-white rounded-lg p-4 border border-purple-300">
                      <p className="text-sm font-medium text-gray-700 mb-2">새 피드백 작성</p>
                      <textarea
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        placeholder="피드백 또는 기타사항을 입력하세요..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitFeedback}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium"
                        >
                          피드백 등록
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setNewFeedback(''); // 모달 닫을 때 피드백 입력란 초기화
                }}
                className="px-4 md:px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm md:text-base"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllDBManagement;
