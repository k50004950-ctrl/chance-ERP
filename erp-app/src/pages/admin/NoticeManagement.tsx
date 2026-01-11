import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit, Trash2, X, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';

interface Notice {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  is_important: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_read?: number;
}

const NoticeManagement: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_important: false
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notices?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setNotices(result.data);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    }
  };

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      setIsEditing(true);
      setEditingId(notice.id);
      setFormData({
        title: notice.title,
        content: notice.content,
        is_important: notice.is_important === 1
      });
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        is_important: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      is_important: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      if (isEditing && editingId) {
        // 수정
        const response = await fetch(`${API_BASE_URL}/api/notices/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            is_active: 1
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('공지사항이 수정되었습니다.');
          handleCloseModal();
          fetchNotices();
        } else {
          alert('수정 실패: ' + result.message);
        }
      } else {
        // 추가
        const response = await fetch(`${API_BASE_URL}/api/notices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            author_id: user.id
          })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('공지사항이 등록되었습니다.');
          handleCloseModal();
          fetchNotices();
        } else {
          alert('등록 실패: ' + result.message);
        }
      }
    } catch (error) {
      console.error('공지사항 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/notices/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        alert('공지사항이 삭제되었습니다.');
        fetchNotices();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handlePreview = (notice: Notice) => {
    setPreviewNotice(notice);
    setShowPreview(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">공지사항 관리</h1>
        <p className="text-gray-600 mt-2">전체 직원에게 공지사항을 전달하세요</p>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>공지사항 등록</span>
        </button>
      </div>

      {/* Notices List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {notices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {notice.is_important === 1 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          중요
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notice.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{notice.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>작성자: {notice.author_name}</span>
                      <span>•</span>
                      <span>{formatDateToKorean(notice.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePreview(notice)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="미리보기"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(notice)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '공지사항 수정' : '공지사항 등록'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 중요 공지 체크박스 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_important"
                  checked={formData.is_important}
                  onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_important" className="ml-2 text-sm font-medium text-gray-700">
                  중요 공지사항
                </label>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="공지사항 내용을 입력하세요"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {isEditing ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">공지사항 미리보기</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                {previewNotice.is_important === 1 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    중요 공지
                  </span>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {previewNotice.title}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-2">
                  <span>작성자: {previewNotice.author_name}</span>
                  <span>•</span>
                  <span>{formatDateToKorean(previewNotice.created_at)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-800 whitespace-pre-wrap">{previewNotice.content}</p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
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

export default NoticeManagement;
