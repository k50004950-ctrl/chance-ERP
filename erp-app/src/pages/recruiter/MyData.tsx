import React, { useState, useEffect } from 'react';
import { Edit, Save, X, UserCheck, TrendingUp, CheckCircle, Clock, XCircle, Plus, FileAudio, Upload, Download, Trash2, Bell, BellOff, ExternalLink } from 'lucide-react';
import { formatDateToKorean } from '../../utils/dateFormat';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MyDataItem {
  id: number;
  proposal_date: string;
  proposer: string;
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
  meeting_request_datetime: string;
}

interface Salesperson {
  id: number;
  name: string;
  username: string;
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  related_id: number | null;
  is_read: number;
  created_at: string;
}

const RecruiterMyData: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [myData, setMyData] = useState<MyDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<MyDataItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [currentFeedbackId, setCurrentFeedbackId] = useState<number | null>(null);
  
  // 녹취 파일 관련 states
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [selectedRecordingDbId, setSelectedRecordingDbId] = useState<number | null>(null);
  const [currentRecordings, setCurrentRecordings] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [recordingNotes, setRecordingNotes] = useState('');
  
  // 알림 관련 states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);

  // 상세보기 모달 관련 states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MyDataItem | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role === 'recruiter') {
      fetchMyData(currentUser.name);
      fetchSalespersons();
      fetchNotifications();
    }
  }, [currentUser]);
  
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`/api/notifications/${currentUser.id}?unreadOnly=true`);
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  };
  
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      const result = await response.json();
      if (result.success) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`/api/notifications/user/${currentUser.id}/read-all`, {
        method: 'PUT',
      });
      const result = await response.json();
      if (result.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('알림 일괄 읽음 처리 실패:', error);
    }
  };

  const handleEditFromNotification = (notificationId: number, relatedDbId: number | null) => {
    if (!relatedDbId) {
      alert('관련 DB 정보를 찾을 수 없습니다.');
      return;
    }
    
    // 해당 DB 항목 찾기
    const dbItem = myData.find(item => item.id === relatedDbId);
    
    if (!dbItem) {
      alert('해당 DB를 찾을 수 없습니다. 페이지를 새로고침하거나 필터를 확인해주세요.');
      return;
    }
    
    // 알림을 읽음 처리
    handleMarkAsRead(notificationId);
    
    // 편집 모드로 전환
    handleEdit(dbItem.id);
    
    // 해당 항목으로 스크롤
    setTimeout(() => {
      const element = document.querySelector(`[data-db-id="${dbItem.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
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

  const fetchMyData = async (proposerName: string) => {
    if (!proposerName) return;
    
    try {
      const response = await fetch(`/api/sales-db/my-data-recruiter?proposer=${encodeURIComponent(proposerName)}`);
      const result = await response.json();
      if (result.success) {
        setMyData(result.data);
        setFilteredData(result.data);
        
        // 연도 목록 추출 (proposal_date 기준)
        const years = new Set<string>();
        result.data.forEach((item: MyDataItem) => {
          if (item.proposal_date) {
            const year = item.proposal_date.substring(0, 4);
            years.add(year);
          }
        });
        const yearList = Array.from(years).sort((a, b) => b.localeCompare(a));
        setAvailableYears(yearList);
        
        // 기본값: 현재 연도와 월
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        
        if (yearList.includes(currentYear)) {
          setSelectedYear(currentYear);
          setSelectedMonth(currentMonth);
          filterDataByMonth(result.data, currentYear, currentMonth);
        } else if (yearList.length > 0) {
          setSelectedYear(yearList[0]);
          setSelectedMonth('');
        }
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  const filterDataByMonth = (data: MyDataItem[], year: string, month: string) => {
    if (!year) {
      setFilteredData(data);
      return;
    }
    
    let filtered = data.filter(item => {
      if (!item.proposal_date) return false;
      const itemYear = item.proposal_date.substring(0, 4);
      return itemYear === year;
    });
    
    if (month) {
      filtered = filtered.filter(item => {
        const itemMonth = item.proposal_date.substring(5, 7);
        return itemMonth === month;
      });
    }
    
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (myData.length > 0) {
      filterDataByMonth(myData, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    if (currentUser) {
      fetchMyData(currentUser.name);
    }
  };

  const handleShowDetail = (item: MyDataItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleGoToDBRegister = (itemId: number) => {
    // DB등록 페이지로 이동하면서 해당 항목을 편집할 수 있도록 ID 전달
    navigate(`/sales-db/register?editId=${itemId}`);
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

  // 녹취 파일 관련 함수들
  const handleShowRecordings = async (dbId: number) => {
    setSelectedRecordingDbId(dbId);
    setShowRecordingsModal(true);
    await fetchRecordings(dbId);
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
    if (!selectedRecordingDbId || uploadingFiles.length === 0) return;

    try {
      for (const file of uploadingFiles) {
        const formData = new FormData();
        formData.append('recording', file);
        formData.append('notes', recordingNotes);

        const response = await fetch(
          `${API_BASE_URL}/api/sales-db/${selectedRecordingDbId}/recordings`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('파일 업로드 실패');
        }
      }

      alert('녹취 파일이 성공적으로 업로드되었습니다.');
      setUploadingFiles([]);
      setRecordingNotes('');
      await fetchRecordings(selectedRecordingDbId);
    } catch (error) {
      console.error('녹취 파일 업로드 실패:', error);
      alert('녹취 파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleDownloadRecording = async (recordingId: number, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recordings/${recordingId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('녹취 파일 다운로드 실패:', error);
      alert('녹취 파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteRecording = async (recordingId: number) => {
    if (!window.confirm('이 녹취 파일을 삭제하시겠습니까?')) return;

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
        alert('녹취 파일 삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('녹취 파일 삭제 실패:', error);
      alert('녹취 파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const handleSave = async (item: MyDataItem) => {
    try {
      const response = await fetch(`/api/sales-db/${item.id}/recruiter-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_date: item.proposal_date,
          meeting_status: item.meeting_status,
          salesperson_id: item.salesperson_id,
          meeting_request_datetime: item.meeting_request_datetime,
          proposer: currentUser.name,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        fetchMyData(currentUser.name);
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (id: number, field: string, value: string | number) => {
    setMyData(myData.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (!currentUser || currentUser.role !== 'recruiter') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">섭외자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">내 DB 관리</h1>
            <p className="text-gray-600 mt-1">
              내가 섭외한 업체 정보를 확인하고 수정하세요
            </p>
          </div>
        </div>
        <p className="text-sm text-blue-600 mt-3">
          ※ 설의날짜, 미팅희망날짜시간, 미팅여부, 담당영업자 필드만 수정 가능합니다.
        </p>
        <p className="text-sm text-purple-600 mt-1">
          ※ <strong>업체명</strong>을 클릭하면 DB등록 페이지로 이동하여 수정할 수 있습니다.
        </p>
      </div>

      {/* 알림 배너 */}
      {notifications.length > 0 && showNotifications && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Bell className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  새 알림 {notifications.length}개
                </h3>
              </div>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        {notification.related_id && (
                          <button
                            onClick={() => handleEditFromNotification(notification.id, notification.related_id)}
                            className="text-green-600 hover:text-green-800 text-xs font-medium px-3 py-1 rounded hover:bg-green-50 border border-green-300"
                          >
                            수정하기
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                          읽음
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end space-x-3 mt-3">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  모두 읽음
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center space-x-1"
                >
                  <BellOff className="w-4 h-4" />
                  <span>닫기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 실적 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 섭외</p>
              <p className="text-2xl font-bold text-gray-800">{filteredData.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미팅완료 (실적)</p>
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

      {/* 알림 배너 */}
      {showNotifications && notifications.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Bell className="w-5 h-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-bold text-yellow-800">새 알림 ({notifications.length})</h3>
              </div>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="bg-white p-3 rounded-md flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                    >
                      확인
                    </button>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-sm text-gray-600 mt-2">외 {notifications.length - 3}개 알림...</p>
                )}
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                >
                  모두 읽음으로 표시
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 월별 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">연도:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>
          
          {selectedYear && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-semibold text-gray-700">월:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
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
          )}
          
          <div className="ml-auto">
            <span className="text-sm text-gray-600">
              총 <strong className="text-blue-600">{filteredData.length}</strong>개 업체
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">설의날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-yellow-50">미팅희망날짜시간</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">주소</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">미팅여부</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">담당영업자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-green-50">녹취관리</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-purple-50">피드백</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  {selectedYear || selectedMonth ? '해당 기간에 섭외한 업체가 없습니다.' : '섭외한 업체 데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} data-db-id={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <KoreanDatePicker
                        selected={item.proposal_date ? new Date(item.proposal_date) : null}
                        onChange={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            handleChange(item.id, 'proposal_date', `${year}-${month}-${day}`);
                          } else {
                            handleChange(item.id, 'proposal_date', '');
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholderText="날짜 선택"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{formatDateToKorean(item.proposal_date) || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-yellow-50">
                    {editingId === item.id ? (
                      <input
                        type="datetime-local"
                        value={item.meeting_request_datetime || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_request_datetime', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {item.meeting_request_datetime 
                          ? new Date(item.meeting_request_datetime).toLocaleString('ko-KR', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGoToDBRegister(item.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition flex items-center"
                        title="DB등록에서 수정하기"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {item.company_name}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.representative || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.contact || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {item.address || '-'}
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
                        <option value="일정재섭외">일정재섭외</option>
                        <option value="AS">AS</option>
                        <option value="미팅거절">미팅거절</option>
                      </select>
                    ) : (
                      <span 
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                          item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 hover:shadow-md transition-all' :
                          item.meeting_status === '일정재섭외' ? 'bg-orange-100 text-orange-800 cursor-pointer hover:bg-orange-200 hover:shadow-md transition-all' :
                          item.meeting_status === 'AS' ? 'bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 hover:shadow-md transition-all' :
                          item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                        onClick={() => {
                          if (item.meeting_status === '일정재확인요청' || item.meeting_status === '일정재섭외' || item.meeting_status === 'AS') {
                            handleEdit(item.id);
                          }
                        }}
                        title={(item.meeting_status === '일정재확인요청' || item.meeting_status === '일정재섭외' || item.meeting_status === 'AS') ? '클릭하여 수정하기' : ''}
                      >
                        {item.meeting_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
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
                      <span className="text-sm text-gray-900">
                        {salespersons.find(sp => sp.id === item.salesperson_id)?.name || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-green-50">
                    <button
                      onClick={() => handleShowRecordings(item.id)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition"
                    >
                      <FileAudio className="w-4 h-4" />
                      <span className="text-sm font-medium">녹취관리</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 bg-purple-50">
                    <button
                      onClick={() => handleShowFeedback(item.id)}
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition"
                    >
                      <span className="text-sm font-medium">피드백 보기</span>
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
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

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-2 md:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10">
              <h2 className="text-lg md:text-2xl font-bold">업체 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
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
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">대표자</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.representative || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">연락처</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.contact || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">업종</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.industry || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-1">주소</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.address || '-'}</p>
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
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedItem.sales_amount ? `${new Intl.NumberFormat('ko-KR').format(selectedItem.sales_amount)}원` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">실제매출</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedItem.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(selectedItem.actual_sales)}원` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">기존거래처</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.existing_client || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">해지월</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.termination_month || '-'}</p>
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
                      <p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.proposal_date) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">섭외자</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.proposer || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">담당영업자</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {salespersons.find(sp => sp.id === selectedItem.salesperson_id)?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">미팅 상태</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedItem.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        selectedItem.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                        selectedItem.meeting_status === '일정재섭외' ? 'bg-orange-100 text-orange-800' :
                        selectedItem.meeting_status === 'AS' ? 'bg-purple-100 text-purple-800' :
                        selectedItem.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedItem.meeting_status || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약날짜</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDateToKorean(selectedItem.contract_date) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약기장료</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedItem.actual_sales ? `${new Intl.NumberFormat('ko-KR').format(Number(selectedItem.actual_sales))}원` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약월</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.contract_month || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">매출거래처</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.client_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">계약 완료</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedItem.contract_status === 'Y' ? 'bg-green-100 text-green-800' :
                        selectedItem.contract_status === 'N' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {selectedItem.contract_status || '-'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">4월1종날짜</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.april_type1_date || '-'}</p>
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
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedItem.feedback || '작성된 피드백이 없습니다.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 md:px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm md:text-base"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 녹취 파일 관리 모달 */}
      {showRecordingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center space-x-3">
                <FileAudio className="w-6 h-6" />
                <h2 className="text-2xl font-bold">섭외 녹취 파일 관리</h2>
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
              {/* 파일 업로드 섹션 */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">새 섭외 녹취 업로드</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    녹취 파일 선택 (여러 개 선택 가능)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="audio/*,video/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    섭외 관련 녹취 파일을 업로드할 수 있습니다.
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
                            <FileAudio className="w-4 h-4 text-green-600" />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="녹취 파일에 대한 메모를 입력하세요..."
                  />
                </div>

                <button
                  onClick={handleUploadRecordings}
                  disabled={uploadingFiles.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>업로드</span>
                </button>
              </div>

              {/* 업로드된 녹취 파일 목록 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">업로드된 섭외 녹취</h3>
                
                {currentRecordings.filter(r => r.recording_type === '섭외녹취').length === 0 ? (
                  <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                    <FileAudio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>아직 업로드된 섭외 녹취가 없습니다.</p>
                    <p className="text-sm mt-2">첫 번째 녹취 파일을 업로드해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentRecordings.filter(r => r.recording_type === '섭외녹취').map((recording) => (
                      <div 
                        key={recording.id} 
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileAudio className="w-5 h-5 text-green-600" />
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
                          <div className="flex flex-col space-y-2 ml-4">
                            <button
                              onClick={() => handleDownloadRecording(recording.id, recording.file_name)}
                              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                            >
                              <Download className="w-4 h-4" />
                              <span>다운로드</span>
                            </button>
                            {recording.uploaded_by === currentUser?.id && (
                              <button
                                onClick={() => handleDeleteRecording(recording.id)}
                                className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>삭제</span>
                              </button>
                            )}
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

export default RecruiterMyData;
