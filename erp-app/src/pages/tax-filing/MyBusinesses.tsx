import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Save, X, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';

interface TaxFilingBusiness {
  id: number;
  salesperson_id: number;
  business_name: string;
  business_type: '간이' | '일반' | '법인';
  representative: string;
  contact: string;
  hometax_id: string;
  hometax_password: string;
  business_number: string;
  address: string;
  additional_info: string;
  feedback: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackItem {
  author: string;
  content: string;
  timestamp: string;
}

const MyBusinesses: React.FC = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<TaxFilingBusiness[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '일반' as '간이' | '일반' | '법인',
    representative: '',
    contact: '',
    hometax_id: '',
    hometax_password: '',
    business_number: '',
    address: '',
    additional_info: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchBusinesses();
    }
  }, [user]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses?salesperson_id=${user?.id}&role=${user?.role}`);
      const result = await response.json();
      if (result.success) {
        setBusinesses(result.data);
      }
    } catch (error) {
      console.error('사업장 목록 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `${API_BASE_URL}/api/tax-filing-businesses/${editingId}`
        : `${API_BASE_URL}/api/tax-filing-businesses`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salesperson_id: user?.id
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(editingId ? '수정되었습니다.' : '등록되었습니다.');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchBusinesses();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (business: TaxFilingBusiness) => {
    setFormData({
      business_name: business.business_name,
      business_type: business.business_type,
      representative: business.representative,
      contact: business.contact,
      hometax_id: business.hometax_id,
      hometax_password: business.hometax_password,
      business_number: business.business_number,
      address: business.address,
      additional_info: business.additional_info
    });
    setEditingId(business.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 사업장을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchBusinesses();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleShowFeedback = (business: TaxFilingBusiness) => {
    setSelectedBusinessId(business.id);
    try {
      const history = business.feedback ? JSON.parse(business.feedback) : [];
      setFeedbackHistory(Array.isArray(history) ? history : []);
    } catch (e) {
      setFeedbackHistory(business.feedback ? [{ author: '시스템', content: business.feedback, timestamp: new Date().toISOString() }] : []);
    }
    setShowFeedbackModal(true);
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim() || !selectedBusinessId) {
      alert('피드백 내용을 입력하세요.');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses/${selectedBusinessId}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user?.name,
          content: newFeedback
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setFeedbackHistory(result.data);
        setNewFeedback('');
        alert('피드백이 추가되었습니다.');
        fetchBusinesses();
      } else {
        alert('피드백 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 추가 실패:', error);
      alert('피드백 추가 중 오류가 발생했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      business_name: '',
      business_type: '일반',
      representative: '',
      contact: '',
      hometax_id: '',
      hometax_password: '',
      business_number: '',
      address: '',
      additional_info: ''
    });
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building2 className="w-6 h-6 mr-2" />
          신고대리 사업장 관리
        </h1>
        <p className="text-gray-600 mt-1">본인의 사업장 정보를 등록하고 관리하세요 (1월, 5월, 7월 신고 대비)</p>
      </div>

      {/* 추가 버튼 */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>사업장 추가</span>
        </button>
      </div>

      {/* 입력 폼 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {editingId ? '사업장 수정' : '사업장 등록'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 홍길동 세무사무소"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                형태 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value as '간이' | '일반' | '법인' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="간이">간이</option>
                <option value="일반">일반</option>
                <option value="법인">법인</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대표자 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                홈택스 ID
              </label>
              <input
                type="text"
                value={formData.hometax_id}
                onChange={(e) => setFormData({ ...formData, hometax_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="홈택스 로그인 ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                홈택스 비밀번호
              </label>
              <input
                type="password"
                value={formData.hometax_password}
                onChange={(e) => setFormData({ ...formData, hometax_password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="홈택스 로그인 비밀번호"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                value={formData.business_number}
                onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 123-45-67890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="사업장 주소"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                추가 정보
              </label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="기타 필요한 정보를 입력하세요"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? '수정' : '등록'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 사업장 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center text-gray-500">
            등록된 사업장이 없습니다.
          </div>
        ) : (
          businesses.map((business) => (
            <div key={business.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{business.business_name}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    business.business_type === '간이' ? 'bg-green-100 text-green-800' :
                    business.business_type === '일반' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {business.business_type}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(business)}
                    className="text-blue-600 hover:text-blue-900"
                    title="수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(business.id)}
                    className="text-red-600 hover:text-red-900"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">대표자:</span>
                  <span className="ml-2 text-gray-900 font-medium">{business.representative}</span>
                </div>
                <div>
                  <span className="text-gray-600">연락처:</span>
                  <span className="ml-2 text-gray-900">{business.contact}</span>
                </div>
                {business.business_number && (
                  <div>
                    <span className="text-gray-600">사업자번호:</span>
                    <span className="ml-2 text-gray-900">{business.business_number}</span>
                  </div>
                )}
                {business.hometax_id && (
                  <div>
                    <span className="text-gray-600">홈택스 ID:</span>
                    <span className="ml-2 text-gray-900">{business.hometax_id}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleShowFeedback(business)}
                  className="w-full flex items-center justify-center space-x-2 text-purple-600 hover:text-purple-800 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">피드백 보기</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                    {(() => {
                      try {
                        const history = business.feedback ? JSON.parse(business.feedback) : [];
                        return Array.isArray(history) ? history.length : 0;
                      } catch {
                        return business.feedback ? 1 : 0;
                      }
                    })()}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 피드백 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {feedbackHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 작성된 피드백이 없습니다.</p>
                  <p className="text-sm mt-2">첫 번째 피드백을 작성해보세요!</p>
                </div>
              ) : (
                feedbackHistory.map((feedback, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

export default MyBusinesses;
