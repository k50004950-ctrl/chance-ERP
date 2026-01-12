import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import { formatDateToKorean } from '../../utils/dateFormat';
import { useParams } from 'react-router-dom';

interface Feedback {
  id: number;
  user_name: string;
  user_role: string;
  feedback_content: string;
  created_at: string;
}

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
  review_status: string;
  refund_amount: number;
  document_delivered: string;
  created_at: string;
  updated_at: string;
  feedbacks: Feedback[];
}

const CorrectionDetail: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CorrectionRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState('대기');
  const [refundAmount, setRefundAmount] = useState('');
  const [documentDelivered, setDocumentDelivered] = useState('N');
  const [newFeedback, setNewFeedback] = useState('');

  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';
  const isWriter = request?.writer_id === user?.id;

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests/${id}`);
      const result = await response.json();
      if (result.success) {
        setRequest(result.data);
        setReviewStatus(result.data.review_status);
        setRefundAmount(result.data.refund_amount ? result.data.refund_amount.toString() : '');
        setDocumentDelivered(result.data.document_delivered);
      }
    } catch (error) {
      console.error('상세 조회 실패:', error);
    }
  };

  const handleUpdateReview = async () => {
    if (!isReviewer) {
      alert('검토담당자만 검토 결과를 수정할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_status: reviewStatus,
          refund_amount: refundAmount ? parseInt(refundAmount.replace(/,/g, '')) : 0,
          document_delivered: documentDelivered
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('검토 결과가 저장되었습니다.');
        fetchDetail();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim()) {
      alert('피드백 내용을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction_id: id,
          user_id: user?.id,
          user_name: user?.name,
          user_role: user?.role,
          feedback_content: newFeedback
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewFeedback('');
        fetchDetail();
      } else {
        alert('피드백 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 추가 실패:', error);
      alert('피드백 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        window.location.href = '/correction/list';
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (!request) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.location.href = '/correction/list'}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          목록으로 돌아가기
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">경정청구 상세</h1>
            <p className="text-gray-600 mt-1">{request.company_name} - {formatDateToKorean(request.created_at)}</p>
          </div>
          {isWriter && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Trash2 className="w-5 h-5" />
              <span>삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">영업담당자</div>
            <div className="text-base font-medium text-gray-900">{request.writer_name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">업체명</div>
            <div className="text-base font-medium text-gray-900">{request.company_name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">대표자</div>
            <div className="text-base font-medium text-gray-900">{request.representative}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">특수관계자</div>
            <div className="text-base font-medium text-gray-900">{request.special_relation || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">최초창업여부</div>
            <span className={`px-2 py-1 text-sm rounded ${request.first_startup === 'O' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {request.first_startup}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-500">경정진행여부</div>
            <span className={`px-2 py-1 text-sm rounded ${request.correction_in_progress === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {request.correction_in_progress}
            </span>
          </div>
          {request.additional_workplace && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-500">추가사업장</div>
              <div className="text-base font-medium text-gray-900">{request.additional_workplace}</div>
            </div>
          )}
        </div>
      </div>

      {/* Review Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">검토 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검토 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검토 상태 {isReviewer && <span className="text-red-500">*</span>}
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              disabled={!isReviewer}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isReviewer ? 'focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
            >
              <option value="대기">대기</option>
              <option value="환급가능">환급가능</option>
              <option value="환급불가">환급불가</option>
              <option value="자료수집X">자료수집X</option>
            </select>
          </div>

          {/* 환급금액 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              환급금액 (원)
            </label>
            <input
              type="text"
              value={refundAmount}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                if (value === '' || /^\d+$/.test(value)) {
                  setRefundAmount(value === '' ? '' : parseInt(value).toLocaleString());
                }
              }}
              disabled={!isReviewer || reviewStatus !== '환급가능'}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isReviewer && reviewStatus === '환급가능' ? 'focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
              placeholder="환급금액 입력"
            />
          </div>

          {/* 서류전달여부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서류전달여부 {isReviewer && <span className="text-red-500">*</span>}
            </label>
            <select
              value={documentDelivered}
              onChange={(e) => setDocumentDelivered(e.target.value)}
              disabled={!isReviewer}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isReviewer ? 'focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'}`}
            >
              <option value="N">N (미전달)</option>
              <option value="Y">Y (전달완료)</option>
            </select>
          </div>
        </div>

        {isReviewer && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleUpdateReview}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Save className="w-5 h-5" />
              <span>검토 결과 저장</span>
            </button>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 서류전달여부를 'Y'로 설정하면 실적으로 인정되어 월별 실적 현황에 반영됩니다.
          </p>
        </div>
      </div>

      {/* Feedbacks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          피드백 ({request.feedbacks.length})
        </h2>

        {/* Feedback List */}
        <div className="space-y-4 mb-6">
          {request.feedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 피드백이 없습니다.
            </div>
          ) : (
            request.feedbacks.map((feedback) => (
              <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{feedback.user_name}</span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {feedback.user_role === 'reviewer' ? '검토담당자' : '작성자'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{formatDateToKorean(feedback.created_at)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{feedback.feedback_content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            피드백 작성
          </label>
          <textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="피드백을 입력하세요..."
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleAddFeedback}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Send className="w-5 h-5" />
              <span>피드백 추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionDetail;
