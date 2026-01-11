import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateToKorean } from '../utils/dateFormat';

interface Notice {
  id: number;
  title: string;
  content: string;
  author_name: string;
  is_important: number;
  created_at: string;
}

const NoticePopup: React.FC = () => {
  const { user } = useAuth();
  const [unreadNotices, setUnreadNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadNotices();
    }
  }, [user]);

  const fetchUnreadNotices = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/notices/unread?user_id=${user.id}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        setUnreadNotices(result.data);
        setShowPopup(true);
      }
    } catch (error) {
      console.error('읽지 않은 공지사항 조회 실패:', error);
    }
  };

  const markAsRead = async (noticeId: number) => {
    if (!user) return;
    
    try {
      await fetch(`http://localhost:3000/api/notices/${noticeId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
    } catch (error) {
      console.error('공지사항 읽음 처리 실패:', error);
    }
  };

  const handleClose = () => {
    // 읽음 처리 없이 그냥 팝업만 닫기
    setShowPopup(false);
    setUnreadNotices([]);
    setCurrentIndex(0);
    setIsConfirmed(false);
  };

  const handleConfirm = async () => {
    // 체크박스가 체크된 경우에만 읽음 처리
    if (isConfirmed && unreadNotices[currentIndex]) {
      await markAsRead(unreadNotices[currentIndex].id);
      
      // 다음 공지사항이 있으면 다음으로 이동
      if (currentIndex < unreadNotices.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsConfirmed(false); // 다음 공지를 위해 체크박스 초기화
      } else {
        // 모든 공지사항을 확인했으면 팝업 닫기
        setShowPopup(false);
        setUnreadNotices([]);
        setCurrentIndex(0);
        setIsConfirmed(false);
      }
    } else {
      alert('공지사항을 확인하셨으면 체크박스를 선택해주세요.');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsConfirmed(false); // 이전 공지로 이동 시 체크박스 초기화
    }
  };

  const handleNext = () => {
    if (currentIndex < unreadNotices.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsConfirmed(false); // 다음 공지로 이동 시 체크박스 초기화
    }
  };

  if (!showPopup || unreadNotices.length === 0) {
    return null;
  }

  const currentNotice = unreadNotices[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${currentNotice.is_important === 1 ? 'bg-red-50 border-b-4 border-red-500' : 'bg-blue-50 border-b border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentNotice.is_important === 1 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white animate-pulse">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  중요 공지
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-800">
                공지사항
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition"
              title="닫기"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* 페이지 인디케이터 */}
          {unreadNotices.length > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>
                {currentIndex + 1} / {unreadNotices.length} 공지
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-1 rounded-lg transition ${
                    currentIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:shadow'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === unreadNotices.length - 1}
                  className={`p-1 rounded-lg transition ${
                    currentIndex === unreadNotices.length - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-white hover:shadow'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {currentNotice.title}
          </h3>
          
          <div className="flex items-center space-x-3 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
            <span>작성자: {currentNotice.author_name}</span>
            <span>•</span>
            <span>{formatDateToKorean(currentNotice.created_at)}</span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {currentNotice.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {/* 확인 체크박스 */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="notice-confirm"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="notice-confirm" className="ml-2 text-sm font-medium text-gray-700">
              확인하였습니다
            </label>
          </div>
          
          {/* 버튼들 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition"
            >
              닫기
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              {currentIndex < unreadNotices.length - 1 ? '확인 (다음 공지로)' : '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
