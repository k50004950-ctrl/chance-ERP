import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Users, Plus, FileAudio, Upload, Download, Trash2, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { formatDateToKorean, toDatetimeLocalValue, toDateValue } from '../../utils/dateFormat';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { API_BASE_URL } from '../../lib/api';

interface Recording {
  id: number;
  sales_db_id: number;
  uploaded_by: number;
  uploader_name: string;
  uploader_role: string;
  recording_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  notes: string;
  created_at: string;
}

interface MyDataItem {
  id: number;
  proposal_date: string;
  proposer: string;
  meeting_request_datetime: string;
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
  termination_month: string;
  actual_sales: number;
  contract_date: string;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
}

interface Salesperson {
  id: number;
  name: string;
  username: string;
}

interface SalesClient {
  id: number;
  client_name: string;
  commission_rate: number;
  description: string;
}

const SalespersonMyData: React.FC = () => {
  const [myData, setMyData] = useState<MyDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<MyDataItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [salespersonId, setSalespersonId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [recruiters, setRecruiters] = useState<{ id: number; name: string; }[]>([]);
  const [salesClients, setSalesClients] = useState<SalesClient[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MyDataItem | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editedItem, setEditedItem] = useState<MyDataItem | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [currentRecordings, setCurrentRecordings] = useState<Recording[]>([]);
  const [selectedRecordingDbId, setSelectedRecordingDbId] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [recordingNotes, setRecordingNotes] = useState('');
  const [currentFeedbackId, setCurrentFeedbackId] = useState<number | null>(null);
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'range'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [meetingDateStart, setMeetingDateStart] = useState('');
  const [meetingDateEnd, setMeetingDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  
  const [newData, setNewData] = useState({
    company_name: '',
    representative: '',
    address: '',
    contact: '',
    industry: '',
    sales_amount: 0,
    actual_sales: 0,
    existing_client: '',
    proposer_name: '',
    proposal_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    // 거래처 목록과 섭외자 목록은 항상 가져옴
    fetchSalesClients();
    fetchRecruiters();
    
    if (user.role === 'admin') {
      setIsAdmin(true);
      // 관리자는 영업자 목록을 가져옴
      fetchSalespersons();
    } else if (user.role === 'salesperson') {
      // 영업자는 본인 ID로 설정
      setSalespersonId(user.id);
    }
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/salespersons`);
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
        // 첫 번째 영업자를 기본으로 선택
        if (result.data.length > 0) {
          setSalespersonId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchSalesClients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-clients`);
      const result = await response.json();
      if (result.success) {
        setSalesClients(result.data);
      }
    } catch (error) {
      console.error('거래처 목록 조회 실패:', error);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const result = await response.json();
      if (result.success) {
        // 섭외자 역할만 필터링
        const recruiterList = result.data.filter((user: any) => user.role === 'recruiter');
        setRecruiters(recruiterList);
      }
    } catch (error) {
      console.error('섭외자 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (salespersonId) {
      fetchMyData();
    }
  }, [salespersonId]);

  const fetchMyData = async () => {
    if (!salespersonId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/my-data?salesperson_id=${salespersonId}`);
      const result = await response.json();
      if (result.success) {
        // 섭외일 기준으로 정렬 (최신순)
        const sortedData = result.data.sort((a: MyDataItem, b: MyDataItem) => {
          const dateA = a.proposal_date || '';
          const dateB = b.proposal_date || '';
          return dateB.localeCompare(dateA);
        });
        setMyData(sortedData);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  // 검색 및 필터링 로직
  useEffect(() => {
    let filtered = [...myData];

    // 검색어 필터
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.company_name && item.company_name.toLowerCase().includes(search)) ||
        (item.representative && item.representative.toLowerCase().includes(search)) ||
        (item.contact && item.contact.toLowerCase().includes(search))
      );
    }

    // 날짜 필터
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((item) => item.proposal_date === today);
    } else if (dateFilter === 'range' && startDate && endDate) {
      filtered = filtered.filter((item) => {
        if (!item.proposal_date) return false;
        return item.proposal_date >= startDate && item.proposal_date <= endDate;
      });
    }

    // 계약완료만 보기 필터
    if (showCompletedOnly) {
      filtered = filtered.filter((item) => item.contract_status === 'Y');
    }

    // 미팅희망날짜 필터
    if (meetingDateStart || meetingDateEnd) {
      filtered = filtered.filter((item) => {
        if (!item.meeting_request_datetime) return false;
        const meetingDate = item.meeting_request_datetime.split('T')[0]; // YYYY-MM-DD 형식으로 변환
        
        if (meetingDateStart && meetingDateEnd) {
          return meetingDate >= meetingDateStart && meetingDate <= meetingDateEnd;
        } else if (meetingDateStart) {
          return meetingDate >= meetingDateStart;
        } else if (meetingDateEnd) {
          return meetingDate <= meetingDateEnd;
        }
        return true;
      });
    }

    setFilteredData(filtered);
    
    // 기본적으로 모든 카드를 펼친 상태로 설정
    const allIds = new Set(filtered.map(item => item.id));
    setExpandedCards(allIds);
  }, [myData, searchTerm, dateFilter, startDate, endDate, showCompletedOnly, meetingDateStart, meetingDateEnd]);

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    fetchMyData(); // 원래 데이터로 되돌리기
  };

  const handleSave = async (item: MyDataItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${item.id}/salesperson-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_date: item.contract_date,
          meeting_status: item.meeting_status,
          meeting_request_datetime: item.meeting_request_datetime,
          contract_client: item.contract_client,
          client_name: item.client_name,
          contract_status: item.contract_status,
          feedback: item.feedback,
          actual_sales: item.actual_sales,
          salesperson_id: salespersonId,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        fetchMyData();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (id: number, field: string, value: string) => {
    const updateItem = (item: MyDataItem) => 
      item.id === id ? { ...item, [field]: value } : item;
    
    setMyData(myData.map(updateItem));
    setFilteredData(filteredData.map(updateItem));
  };

  // 모바일 카드 뷰 피드백 저장
  const handleMobileFeedbackSubmit = async (dbId: number) => {
    if (!newFeedback.trim()) {
      alert('피드백 내용을 입력해주세요.');
      return;
    }

    try {
      const item = myData.find(d => d.id === dbId);
      if (!item) return;

      let feedbackArray: any[] = [];
      try {
        feedbackArray = item.feedback ? JSON.parse(item.feedback) : [];
      } catch {
        feedbackArray = item.feedback ? [{ content: item.feedback, writer_name: '이전 기록', created_at: new Date().toISOString() }] : [];
      }

      const newFeedbackObj = {
        content: newFeedback,
        writer_name: currentUser?.name || '영업자',
        created_at: new Date().toISOString()
      };
      feedbackArray.push(newFeedbackObj);

      const response = await fetch(`${API_BASE_URL}/api/sales-db/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: JSON.stringify(feedbackArray) }),
      });

      const result = await response.json();
      if (result.success) {
        alert('피드백이 저장되었습니다.');
        setNewFeedback('');
        fetchMyData();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 저장 실패:', error);
      alert('피드백 저장 중 오류가 발생했습니다.');
    }
  };

  // 녹취 파일 관리 함수들
  const handleShowRecordings = async (dbId: number) => {
    setSelectedRecordingDbId(dbId);
    await fetchRecordings(dbId);
    setShowRecordingsModal(true);
  };

  const fetchRecordings = async (dbId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${dbId}/recordings`);
      const result = await response.json();
      if (result.success) {
        setCurrentRecordings(result.data);
      }
    } catch (error) {
      console.error('녹취 파일 목록 조회 실패:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadingFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadRecordings = async () => {
    if (!selectedRecordingDbId || uploadingFiles.length === 0) {
      alert('업로드할 파일을 선택하세요.');
      return;
    }

    try {
      for (const file of uploadingFiles) {
        const formData = new FormData();
        formData.append('recording', file);
        formData.append('uploaded_by', currentUser.id.toString());
        formData.append('uploader_name', currentUser.name);
        formData.append('uploader_role', currentUser.role);
        formData.append('recording_type', '미팅거절증거자료');
        formData.append('notes', recordingNotes);

        const response = await fetch(`${API_BASE_URL}/api/sales-db/${selectedRecordingDbId}/recordings`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!result.success) {
          alert(`파일 업로드 실패: ${file.name} - ${result.message}`);
          return;
        }
      }

      alert('모든 녹취 파일이 업로드되었습니다.');
      setUploadingFiles([]);
      setRecordingNotes('');
      await fetchRecordings(selectedRecordingDbId);
    } catch (error) {
      console.error('녹취 파일 업로드 실패:', error);
      alert('녹취 파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadRecording = async (recordingId: number) => {
    try {
      window.open(`${API_BASE_URL}/api/recordings/${recordingId}/download`, '_blank');
    } catch (error) {
      console.error('녹취 파일 다운로드 실패:', error);
      alert('녹취 파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteRecording = async (recordingId: number) => {
    if (!confirm('이 녹취 파일을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        alert('녹취 파일이 삭제되었습니다.');
        if (selectedRecordingDbId) {
          await fetchRecordings(selectedRecordingDbId);
        }
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('녹취 파일 삭제 실패:', error);
      alert('녹취 파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  const handleShowDetail = (item: MyDataItem) => {
    console.log('상세 정보 표시:', item);
    setSelectedItem(item);
    setEditedItem(item);
    setIsEditingDetail(false);
    setShowDetailModal(true);
  };

  const handleStartEdit = () => {
    setIsEditingDetail(true);
    setEditedItem({ ...selectedItem } as MyDataItem);
  };

  const handleCancelEdit = () => {
    setIsEditingDetail(false);
    setEditedItem(selectedItem);
  };

  const handleSaveDetailEdit = async () => {
    if (!editedItem || !editedItem.id) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${editedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedItem),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('수정이 완료되었습니다.');
        setSelectedItem(editedItem);
        setIsEditingDetail(false);
        setShowDetailModal(false);
        fetchMyData(currentUser.name); // 목록 새로고침
      } else {
        alert('수정 실패: ' + result.message);
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleShowFeedback = async (id: number) => {
    console.log('피드백 조회 시작:', id);
    setCurrentFeedbackId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${id}/feedback-history`);
      console.log('피드백 API 응답 상태:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('피드백 조회 결과:', result);
      
      if (result.success) {
        setFeedbackHistory(result.data || []);
        setShowFeedbackModal(true);
      } else {
        alert('피드백 조회 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 조회 오류:', error);
      alert('피드백 조회 중 오류가 발생했습니다. 콘솔을 확인하세요.\n오류: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim()) {
      alert('피드백 내용을 입력하세요.');
      return;
    }
    if (!currentUser) {
      alert('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${currentFeedbackId}/add-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: currentUser.name,
          content: newFeedback
        })
      });
      const result = await response.json();
      if (result.success) {
        setFeedbackHistory(result.data);
        setNewFeedback('');
        alert('피드백이 추가되었습니다.');
      } else {
        alert('피드백 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 추가 오류:', error);
      alert('피드백 추가 중 오류가 발생했습니다.');
    }
  };

  if (!currentUser || (!isAdmin && currentUser.role !== 'salesperson')) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!salespersonId) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">영업자를 선택하세요.</p>
        </div>
      </div>
    );
  }

  const handleAddNew = async () => {
    if (!currentUser || !salespersonId) return;
    
    // 필수 입력 확인
    if (!newData.company_name || !newData.representative) {
      alert('업체명과 대표자는 필수 입력 항목입니다.');
      return;
    }
    
    // 거래처 확인
    if (!newData.existing_client) {
      alert('거래처를 선택해주세요.');
      return;
    }
    
    // 섭외자 확인
    if (!newData.proposer_name) {
      alert('섭외자를 선택해주세요.');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newData,
          proposer: newData.proposer_name,
          salesperson: currentUser.name,
          salesperson_id: salespersonId,
          meeting_status: '미팅완료',
          contract_status: 'Y',  // 영업자가 입력하면 무조건 계약 완료
          contract_date: new Date().toISOString().split('T')[0],
          client_name: newData.existing_client,  // 거래처 이름을 client_name에도 저장
          contract_client: newData.existing_client  // 계약 거래처에도 저장
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('새 DB가 추가되었습니다!');
        setShowAddModal(false);
        setNewData({
          company_name: '',
          representative: '',
          address: '',
          contact: '',
          industry: '',
          sales_amount: 0,
          actual_sales: 0,
          existing_client: '',
          proposer_name: '',
          proposal_date: new Date().toISOString().split('T')[0]
        });
        fetchMyData(); // 목록 새로고침
      } else {
        alert('DB 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('DB 추가 오류:', error);
      alert('DB 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-2xl font-bold text-gray-800">영업자 DB 입력</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? '영업자별 담당 업체 정보를 확인하고 수정하세요' : '내가 담당하는 업체 정보를 수정하세요'}
        </p>
        <p className="text-sm text-blue-600 mt-2">
              ※ 계약날짜, 미팅여부, 거래처(매출거래처) 필드만 수정 가능합니다.
        </p>
            <p className="text-sm text-orange-600 mt-1">
              ※ 거래처 선택 시 수수료가 자동으로 적용됩니다.
            </p>
            <p className="text-sm text-purple-600 mt-1">
              ※ <strong>업체명</strong>을 클릭하면 상세 정보를 확인할 수 있습니다.
            </p>
            <p className="text-sm text-purple-600 mt-1">
              ※ <strong>피드백 보기</strong> 버튼을 클릭하면 피드백을 조회하고 추가할 수 있습니다.
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>새 DB 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* 관리자용 영업자 선택 드롭다운 */}
      {isAdmin && salespersons.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-700">영업자 선택:</label>
            </div>
            <select
              value={salespersonId || ''}
              onChange={(e) => setSalespersonId(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 검색 및 필터 섹션 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">검색 및 필터</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 p-1 hover:bg-gray-100 rounded"
          >
            {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showFilters && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="업체명, 대표자, 연락처 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 날짜 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">날짜 필터</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as 'all' | 'today' | 'range');
                if (e.target.value === 'today') {
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="range">기간 선택</option>
            </select>
          </div>

          {/* 시작일 */}
          {dateFilter === 'range' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* 종료일 */}
          {dateFilter === 'range' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* 계약완료만 보기 체크박스 */}
        <div className="mt-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCompletedOnly}
              onChange={(e) => setShowCompletedOnly(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              계약완료만 보기 (Y)
            </span>
          </label>
        </div>

        {/* 미팅희망날짜 필터 */}
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <label className="block text-sm font-medium text-purple-900 mb-2">
            미팅희망날짜 필터
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={meetingDateStart}
              onChange={(e) => setMeetingDateStart(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={meetingDateEnd}
              onChange={(e) => setMeetingDateEnd(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            />
            {(meetingDateStart || meetingDateEnd) && (
              <button
                onClick={() => {
                  setMeetingDateStart('');
                  setMeetingDateEnd('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                title="초기화"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 필터 결과 요약 */}
        <div className="mt-4 text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{filteredData.length}</span>개의 업체
          {searchTerm && <span className="ml-2">(검색: {searchTerm})</span>}
          {dateFilter === 'today' && <span className="ml-2">(오늘)</span>}
          {dateFilter === 'range' && startDate && endDate && (
            <span className="ml-2">({startDate} ~ {endDate})</span>
          )}
          {(meetingDateStart || meetingDateEnd) && (
            <span className="ml-2">(미팅: {meetingDateStart || '시작'} ~ {meetingDateEnd || '끝'})</span>
          )}
          {showCompletedOnly && <span className="ml-2">(계약완료만)</span>}
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
          filteredData.map((item) => {
            const isExpanded = expandedCards.has(item.id);
            const toggleExpand = () => {
              const newExpanded = new Set(expandedCards);
              if (isExpanded) {
                newExpanded.delete(item.id);
              } else {
                newExpanded.add(item.id);
              }
              setExpandedCards(newExpanded);
            };

            return (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              {/* 헤더 */}
              <div 
                className="flex justify-between items-start mb-3 pb-3 border-b cursor-pointer"
                onClick={toggleExpand}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                    {item.company_name || '-'}
                    <span className="ml-2 text-sm text-gray-500">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">{item.representative || '-'}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.contact || '-'}</p>
                </div>
                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => handleSave(item)}
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
                        title="편집"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleShowRecordings(item.id)}
                        className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        title="녹취관리"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        title="피드백"
                      >
                        <FileAudio className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 접혀있을 때 간단한 정보만 표시 */}
              {!isExpanded && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">미팅여부:</span>
                    <span className="text-blue-600 font-medium">{item.meeting_status || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">계약완료:</span>
                    <span className={item.contract_status === 'Y' ? 'text-green-600 font-bold' : 'text-gray-500'}>
                      {item.contract_status === 'Y' ? '완료' : '-'}
                    </span>
                  </div>
                </div>
              )}

              {/* 펼쳐졌을 때 상세 정보 표시 */}
              {isExpanded && (
              <>

              {/* 주요 정보 */}
              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">섭외날짜:</span>
                  <span className="text-yellow-700 font-medium">{formatDateToKorean(item.proposal_date) || '-'}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">섭외자:</span>
                  <span className="text-yellow-700 font-medium">{item.proposer || '-'}</span>
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
                  <span className="text-gray-900">{item.contact || '-'}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">주소:</span>
                  <span className="text-gray-900">{item.address || '-'}</span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">미팅여부:</span>
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
                      <option value="영업자관리">영업자관리</option>
                      <option value="미팅거절">미팅거절</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                      item.meeting_status === '미팅요청' ? 'bg-yellow-100 text-yellow-800' :
                      item.meeting_status === '재미팅' ? 'bg-blue-100 text-blue-800' :
                      item.meeting_status === '영업자관리' ? 'bg-purple-100 text-purple-800' :
                      item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.meeting_status || '-'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">계약완료:</span>
                  {editingId === item.id ? (
                    <select
                      value={item.contract_status || ''}
                      onChange={(e) => handleChange(item.id, 'contract_status', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">선택</option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      item.contract_status === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                
                {(editingId === item.id || item.actual_sales) && (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-700">계약기장료:</span>
                    {editingId === item.id ? (
                      <input
                        type="number"
                        value={item.actual_sales || ''}
                        onChange={(e) => handleChange(item.id, 'actual_sales', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-blue-700 font-medium">{item.actual_sales?.toLocaleString()}원</span>
                    )}
                  </div>
                )}

                {/* 거래처 선택 */}
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-700">거래처:</span>
                  {editingId === item.id ? (
                    <select
                      value={item.client_name || ''}
                      onChange={(e) => handleChange(item.id, 'client_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">거래처 선택</option>
                      {salesClients.map((client) => (
                        <option key={client.id} value={client.client_name}>
                          {client.client_name} ({client.commission_rate}%)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-purple-700 font-medium">{item.client_name || '-'}</span>
                  )}
                </div>
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
                    onClick={() => handleMobileFeedbackSubmit(item.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    피드백 저장
                  </button>
                </div>
              </div>
              </>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* 테이블 (데스크톱) */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-yellow-50">섭외날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-yellow-50">섭외자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-yellow-50">미팅희망날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">미팅여부</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약기장료</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">거래처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약완료</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-orange-50">계약날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-purple-50">녹취관리</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">기타(피드백)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-gray-500">
                  {searchTerm || dateFilter !== 'all' ? '검색 결과가 없습니다.' : '담당하는 업체 데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 bg-yellow-50 text-sm whitespace-nowrap">
                    <span className="text-gray-900 font-medium">{formatDateToKorean(item.proposal_date) || '-'}</span>
                  </td>
                  <td className="px-4 py-3 bg-yellow-50 text-sm whitespace-nowrap">
                    <span className="text-gray-900">{item.proposer || '-'}</span>
                  </td>
                  <td className="px-4 py-3 bg-yellow-50 text-sm whitespace-nowrap">
                    {editingId === item.id && item.meeting_status === '영업자관리' ? (
                      <input
                        type="datetime-local"
                        value={item.meeting_request_datetime || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_request_datetime', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      <span className="text-gray-900">
                        {item.meeting_request_datetime 
                          ? (() => {
                              try {
                                const date = new Date(item.meeting_request_datetime);
                                if (isNaN(date.getTime())) return '-';
                                return date.toLocaleString('ko-KR', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                });
                              } catch (e) {
                                return '-';
                              }
                            })()
                          : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <button
                      onClick={() => handleShowDetail(item)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer text-left"
                    >
                    {item.company_name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.representative || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.contact || '-'}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <select
                        value={item.meeting_status || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        <option value="미팅완료">미팅완료</option>
                        <option value="일정재확인요청">일정재확인요청</option>
                        <option value="영업자관리">영업자관리</option>
                        <option value="미팅거절">미팅거절</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
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
                      <input
                        type="text"
                        value={item.actual_sales || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            handleChange(item.id, 'actual_sales', value);
                          }
                        }}
                        onBlur={(e) => {
                          // 포커스를 잃을 때 콤마 포맷팅 적용
                          const value = e.target.value.replace(/,/g, '');
                          if (value && /^\d+$/.test(value)) {
                            e.target.value = Number(value).toLocaleString('ko-KR');
                          }
                        }}
                        onFocus={(e) => {
                          // 포커스를 받을 때 콤마 제거
                          const value = e.target.value.replace(/,/g, '');
                          e.target.value = value;
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        placeholder="계약기장료"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.actual_sales ? Number(item.actual_sales.toString().replace(/,/g, '')).toLocaleString('ko-KR') : '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <select
                        value={item.client_name || ''}
                        onChange={(e) => {
                          handleChange(item.id, 'client_name', e.target.value);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">거래처 선택</option>
                        {salesClients.map((client) => (
                          <option key={client.id} value={client.client_name}>
                            {client.client_name} ({client.commission_rate}%)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">{item.client_name || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-green-50">
                    {editingId === item.id ? (
                      <select
                        value={item.contract_status || ''}
                        onChange={(e) => handleChange(item.id, 'contract_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">선택</option>
                        <option value="Y">Y (완료)</option>
                        <option value="N">N (미완료)</option>
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
                        {item.contract_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-orange-50 text-sm whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={item.contract_date || ''}
                        onChange={(e) => handleChange(item.id, 'contract_date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <span className="text-gray-900">{formatDateToKorean(item.contract_date) || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-purple-50">
                    <button
                      onClick={() => handleShowRecordings(item.id)}
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition"
                    >
                      <FileAudio className="w-4 h-4" />
                      <span className="text-sm font-medium">녹취관리</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
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
                  <td className="px-4 py-3 text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleSave(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="저장"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 새 DB 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">새 DB 추가</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 업체명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newData.company_name}
                    onChange={(e) => setNewData({ ...newData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="업체명 입력"
                    required
                  />
                </div>

                {/* 대표자 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newData.representative}
                    onChange={(e) => setNewData({ ...newData, representative: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="대표자명 입력"
                    required
                  />
                </div>

                {/* 주소 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={newData.address}
                    onChange={(e) => setNewData({ ...newData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="주소 입력"
                  />
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={newData.contact}
                    onChange={(e) => setNewData({ ...newData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="연락처 입력"
                  />
                </div>

                {/* 업종 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업종
                  </label>
                  <input
                    type="text"
                    value={newData.industry}
                    onChange={(e) => setNewData({ ...newData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="업종 입력"
                  />
                </div>

                {/* 매출액 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    매출액 (원)
                  </label>
                  <input
                    type="number"
                    value={newData.sales_amount}
                    onChange={(e) => setNewData({ ...newData, sales_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* 기장료 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기장료 (원)
                  </label>
                  <input
                    type="number"
                    value={newData.actual_sales}
                    onChange={(e) => setNewData({ ...newData, actual_sales: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* 거래처 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newData.existing_client}
                    onChange={(e) => setNewData({ ...newData, existing_client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">거래처를 선택하세요</option>
                    {salesClients.map((client) => (
                      <option key={client.id} value={client.client_name}>
                        {client.client_name} (수수료율: {client.commission_rate}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 섭외자 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    섭외자 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newData.proposer_name}
                    onChange={(e) => setNewData({ ...newData, proposer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">섭외자를 선택하세요</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter.id} value={recruiter.name}>
                        {recruiter.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 섭외일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    섭외일
                  </label>
                  <KoreanDatePicker
                    selected={newData.proposal_date ? new Date(newData.proposal_date) : new Date()}
                    onChange={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setNewData({ ...newData, proposal_date: `${year}-${month}-${day}` });
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholderText="섭외일 선택"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 새로운 DB를 추가합니다. 추가 후 미팅 상태, 계약 정보 등은 목록에서 수정할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 이력 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
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

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
              <h2 className="text-lg md:text-2xl font-bold">
                {isEditingDetail ? '업체 정보 수정' : '업체 상세 정보'}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setIsEditingDetail(false);
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 섹션 */}
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">1</span>
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">업체명</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.company_name || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, company_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.company_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">대표자</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.representative || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, representative: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.representative || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">연락처</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.contact || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, contact: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.contact || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">업종</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.industry || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, industry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.industry || '-'}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-1">주소</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.address || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.address || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 재무 정보 섹션 */}
                <div className="md:col-span-2 bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">2</span>
                    재무 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">매출액</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="number"
                          value={editedItem.sales_amount || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, sales_amount: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedItem.sales_amount ? `${new Intl.NumberFormat('ko-KR').format(selectedItem.sales_amount)}원` : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">실제매출</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="number"
                          value={editedItem.actual_sales || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, actual_sales: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedItem.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(selectedItem.actual_sales)}원` : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">기존거래처</p>
                      {isEditingDetail && editedItem ? (
                        <select
                          value={editedItem.existing_client || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, existing_client: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">선택하세요</option>
                          {salesClients.map((client) => (
                            <option key={client.id} value={client.client_name}>
                              {client.client_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.existing_client || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">해지월</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.termination_month || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, termination_month: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 2025-12"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.termination_month || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 섭외/계약 정보 섹션 */}
                <div className="md:col-span-2 bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">3</span>
                    섭외 및 계약 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">섭외일</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="date"
                          value={editedItem.proposal_date || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, proposal_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.proposal_date) || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">섭외자</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.proposer || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, proposer: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          readOnly
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.proposer || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-gray-500 mb-1 bg-yellow-50 px-2 py-1 rounded">🗓️ 미팅 희망 날짜 및 시간</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="datetime-local"
                          value={editedItem.meeting_request_datetime || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, meeting_request_datetime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedItem.meeting_request_datetime ? 
                            new Date(selectedItem.meeting_request_datetime).toLocaleString('ko-KR', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">미팅 상태</p>
                      {isEditingDetail && editedItem ? (
                        <select
                          value={editedItem.meeting_status || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, meeting_status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">선택하세요</option>
                          <option value="미정">미정</option>
                          <option value="미팅완료">미팅완료</option>
                          <option value="일정재확인요청">일정재확인요청</option>
                          <option value="영업자관리">영업자관리</option>
                          <option value="미팅거절">미팅거절</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          selectedItem.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                          selectedItem.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                          selectedItem.meeting_status === '영업자관리' ? 'bg-blue-100 text-blue-800' :
                          selectedItem.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedItem.meeting_status || '미정'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약날짜</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="date"
                          value={editedItem.contract_date || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, contract_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.contract_date) || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약기장료</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="number"
                          value={editedItem.actual_sales || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, actual_sales: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-blue-600">
                          {selectedItem.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(Number(selectedItem.actual_sales))}원` : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약월</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.contract_month || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, contract_month: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="예: 2025-12"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.contract_month || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">매출거래처</p>
                      {isEditingDetail && editedItem ? (
                        <select
                          value={editedItem.client_name || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, client_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">선택하세요</option>
                          {salesClients.map((client) => (
                            <option key={client.id} value={client.client_name}>
                              {client.client_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.client_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약 완료</p>
                      {isEditingDetail && editedItem ? (
                        <select
                          value={editedItem.contract_status || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, contract_status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">선택하세요</option>
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                          <option value="계약예정">계약예정</option>
                          <option value="계약불가">계약불가</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          selectedItem.contract_status === 'Y' ? 'bg-green-100 text-green-800' :
                          selectedItem.contract_status === 'N' ? 'bg-gray-100 text-gray-800' :
                          selectedItem.contract_status === '계약예정' ? 'bg-blue-100 text-blue-800' :
                          selectedItem.contract_status === '계약불가' ? 'bg-red-100 text-red-800' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {selectedItem.contract_status || '-'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">4월1종날짜</p>
                      {isEditingDetail && editedItem ? (
                        <input
                          type="text"
                          value={editedItem.april_type1_date || ''}
                          onChange={(e) => setEditedItem({ ...editedItem, april_type1_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">{selectedItem.april_type1_date || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 기타 정보 섹션 */}
                <div className="md:col-span-2 bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">4</span>
                    기타 정보
                  </h3>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">피드백 / 기타사항</p>
                    {isEditingDetail && editedItem ? (
                      <textarea
                        value={editedItem.feedback || ''}
                        onChange={(e) => setEditedItem({ ...editedItem, feedback: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px]"
                        placeholder="피드백이나 기타사항을 입력하세요..."
                      />
                    ) : (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedItem.feedback || '작성된 피드백이 없습니다.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              {isEditingDetail ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 md:px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm md:text-base"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveDetailEdit}
                    className="px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm md:text-base"
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="px-4 md:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm md:text-base"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 md:px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm md:text-base"
                  >
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 녹취 파일 관리 모달 */}
      {showRecordingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <FileAudio className="w-6 h-6" />
                <h2 className="text-2xl font-bold">녹취 파일 관리</h2>
              </div>
              <button
                onClick={() => {
                  setShowRecordingsModal(false);
                  setUploadingFiles([]);
                  setRecordingNotes('');
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 섭외녹취 섹션 (읽기 전용) */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                  <FileAudio className="w-5 h-5 text-green-600" />
                  <span>섭외녹취 (섭외자가 업로드)</span>
                </h3>
                
                {currentRecordings.filter(r => r.recording_type === '섭외녹취').length === 0 ? (
                  <div className="text-center text-gray-500 py-6 bg-white rounded-lg">
                    <FileAudio className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm">섭외녹취가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentRecordings.filter(r => r.recording_type === '섭외녹취').map((recording) => (
                      <div key={recording.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileAudio className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-800">{recording.file_name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(recording.file_size || 0)})</span>
                          </div>
                          {recording.notes && (
                            <p className="text-xs text-gray-600 ml-6">비고: {recording.notes}</p>
                          )}
                          <p className="text-xs text-gray-500 ml-6">
                            업로드: {recording.uploader_name} | {new Date(recording.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadRecording(recording.id, recording.file_name)}
                          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>다운로드</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 파일 업로드 섹션 */}
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">새 증거자료 업로드</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    녹취 파일 선택 (여러 개 선택 가능)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="audio/*,video/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    미팅 거절 관련 녹취 또는 증거 파일을 업로드할 수 있습니다.
                  </p>
                </div>

                {uploadingFiles.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      선택된 파일 ({uploadingFiles.length}개)
                    </label>
                    <div className="space-y-2">
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <FileAudio className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-800">{file.name}</span>
                            <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비고 (선택사항)
                  </label>
                  <textarea
                    value={recordingNotes}
                    onChange={(e) => setRecordingNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                    placeholder="증거자료에 대한 메모를 입력하세요..."
                  />
                </div>

                <button
                  onClick={handleUploadRecordings}
                  disabled={uploadingFiles.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>업로드</span>
                </button>
              </div>

              {/* 업로드된 증거자료 목록 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">업로드된 증거자료</h3>
                
                {currentRecordings.filter(r => r.recording_type === '미팅거절증거자료').length === 0 ? (
                  <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                    <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>아직 업로드된 증거자료가 없습니다.</p>
                    <p className="text-sm mt-2">첫 번째 증거자료를 업로드해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentRecordings.filter(r => r.recording_type === '미팅거절증거자료').map((recording) => (
                      <div 
                        key={recording.id} 
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileAudio className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-gray-800">{recording.file_name}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>업로더: <span className="font-medium">{recording.uploader_name}</span></p>
                              <p>파일 크기: {formatFileSize(recording.file_size)}</p>
                              <p>업로드 시간: {formatDateTime(recording.created_at)}</p>
                              {recording.notes && (
                                <p className="text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                                  비고: {recording.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleDownloadRecording(recording.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="다운로드"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecording(recording.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="삭제"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonMyData;
