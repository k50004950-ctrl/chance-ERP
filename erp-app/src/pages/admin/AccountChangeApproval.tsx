import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateToKorean } from '../../utils/dateFormat';

interface ChangeRequest {
  id: number;
  user_id: number;
  username: string;
  user_name: string;
  employee_code: string;
  requested_changes: any;
  status: string;
  admin_note: string;
  requested_at: string;
  reviewed_at: string;
  reviewed_by_name: string;
}

const AccountChangeApproval: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/account-change-requests?status=${statusFilter}`);
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('요청 조회 실패:', error);
    }
  };

  const handleOpenModal = (request: ChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNote('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNote('');
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !user) return;

    try {
      const response = await fetch(`http://localhost:3000/api/account-change-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          admin_note: adminNote,
          reviewed_by: user.id
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(actionType === 'approve' ? '승인되었습니다.' : '거절되었습니다.');
        handleCloseModal();
        fetchRequests();
      } else {
        alert('처리 실패: ' + result.message);
      }
    } catch (error) {
      console.error('처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            대기중
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            거절됨
          </span>
        );
      default:
        return null;
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
      name: '이름',
      department: '부서',
      position: '직급',
      bank_name: '은행',
      account_number: '계좌번호',
      social_security_number: '주민번호',
      hire_date: '입사일',
      address: '주소',
      emergency_contact: '비상연락망'
    };
    return labels[field] || field;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">계정 변경 승인</h1>
        <p className="text-gray-600 mt-2">직원들의 계정 변경 요청을 검토하고 승인/거절할 수 있습니다</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-700">상태:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거절됨</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {statusFilter === 'pending' ? '대기 중인 요청이 없습니다.' : '요청이 없습니다.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사원번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변경 내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    처리일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.user_name}</div>
                      <div className="text-sm text-gray-500">{request.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.employee_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        {Object.entries(request.requested_changes).map(([field, value]) => (
                          <div key={field}>
                            <span className="font-medium">{getFieldLabel(field)}:</span>{' '}
                            {field === 'hire_date' && value ? formatDateToKorean(value as string) : (value as string)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateToKorean(request.requested_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reviewed_at ? (
                        <div>
                          <div>{formatDateToKorean(request.reviewed_at)}</div>
                          {request.reviewed_by_name && (
                            <div className="text-xs text-gray-400">{request.reviewed_by_name}</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(request, 'approve')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="승인"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(request, 'reject')}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="거절"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">처리완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {actionType === 'approve' ? '변경 승인' : '변경 거절'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">요청자 정보</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">이름:</span> {selectedRequest.user_name}</p>
                  <p><span className="font-medium">아이디:</span> {selectedRequest.username}</p>
                  <p><span className="font-medium">사원번호:</span> {selectedRequest.employee_code}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">변경 요청 내용</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(selectedRequest.requested_changes).map(([field, value]) => (
                    <p key={field}>
                      <span className="font-medium">{getFieldLabel(field)}:</span>{' '}
                      {field === 'hire_date' && value ? formatDateToKorean(value as string) : (value as string)}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관리자 메모 {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={actionType === 'reject' ? '거절 사유를 입력하세요' : '메모를 입력하세요 (선택사항)'}
                  required={actionType === 'reject'}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className={`px-6 py-2 rounded-lg transition ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {actionType === 'approve' ? '승인' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountChangeApproval;
