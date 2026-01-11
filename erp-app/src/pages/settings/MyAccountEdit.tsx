import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';

interface UserInfo {
  id: number;
  username: string;
  name: string;
  employee_code: string;
  department: string;
  position: string;
  bank_name: string;
  account_number: string;
  social_security_number: string;
  hire_date: string;
  address: string;
  emergency_contact: string;
  role: string;
}

interface ChangeRequest {
  id: number;
  requested_changes: any;
  status: string;
  admin_note: string;
  requested_at: string;
  reviewed_at: string;
  reviewed_by_name: string;
}

const MyAccountEdit: React.FC = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    bank_name: '',
    account_number: '',
    social_security_number: '',
    hire_date: '',
    address: '',
    emergency_contact: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserInfo();
      fetchChangeRequests();
    }
  }, [user]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const result = await response.json();
      if (result.success) {
        const currentUser = result.data.find((u: any) => u.id === user?.id);
        if (currentUser) {
          setUserInfo(currentUser);
          setFormData({
            name: currentUser.name || '',
            department: currentUser.department || '',
            position: currentUser.position || '',
            bank_name: currentUser.bank_name || '',
            account_number: currentUser.account_number || '',
            social_security_number: currentUser.social_security_number || '',
            hire_date: currentUser.hire_date || '',
            address: currentUser.address || '',
            emergency_contact: currentUser.emergency_contact || ''
          });
        }
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/account-change-requests/user/${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setChangeRequests(result.data);
      }
    } catch (error) {
      console.error('변경 요청 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // 변경된 필드만 추출
    const changes: any = {};
    if (formData.name !== userInfo?.name) changes.name = formData.name;
    if (formData.department !== userInfo?.department) changes.department = formData.department;
    if (formData.position !== userInfo?.position) changes.position = formData.position;
    if (formData.bank_name !== userInfo?.bank_name) changes.bank_name = formData.bank_name;
    if (formData.account_number !== userInfo?.account_number) changes.account_number = formData.account_number;
    if (formData.social_security_number !== userInfo?.social_security_number) changes.social_security_number = formData.social_security_number;
    if (formData.hire_date !== userInfo?.hire_date) changes.hire_date = formData.hire_date;
    if (formData.address !== userInfo?.address) changes.address = formData.address;
    if (formData.emergency_contact !== userInfo?.emergency_contact) changes.emergency_contact = formData.emergency_contact;

    if (Object.keys(changes).length === 0) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    try {
      const response = await fetch('${API_BASE_URL}/api/account-change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          requested_changes: changes
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('계정 변경 요청이 제출되었습니다. 관리자 승인 후 적용됩니다.');
        fetchChangeRequests();
      } else {
        alert('요청 제출 실패: ' + result.message);
      }
    } catch (error) {
      console.error('요청 제출 실패:', error);
      alert('요청 제출 중 오류가 발생했습니다.');
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
            <AlertCircle className="w-4 h-4 mr-1" />
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

  if (!userInfo) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">내 정보 수정</h1>
        <p className="text-gray-600 mt-2">정보 수정 시 관리자 승인이 필요합니다</p>
      </div>

      {/* 현재 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">현재 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">아이디</label>
            <p className="mt-1 text-gray-900">{userInfo.username}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">사원번호</label>
            <p className="mt-1 text-gray-900">{userInfo.employee_code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">이름</label>
            <p className="mt-1 text-gray-900">{userInfo.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">부서</label>
            <p className="mt-1 text-gray-900">{userInfo.department || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">직급</label>
            <p className="mt-1 text-gray-900">{userInfo.position || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">입사일</label>
            <p className="mt-1 text-gray-900">{userInfo.hire_date ? formatDateToKorean(userInfo.hire_date) : '-'}</p>
          </div>
        </div>
      </div>

      {/* 정보 수정 폼 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">정보 수정 요청</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름"
              />
            </div>

            {/* 부서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부서
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="부서"
              />
            </div>

            {/* 직급 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                직급
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="직급"
              />
            </div>

            {/* 입사일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                입사일
              </label>
              <KoreanDatePicker
                selectedDate={formData.hire_date ? new Date(formData.hire_date) : null}
                onChange={(date) => {
                  const isoDate = date ? date.toISOString().split('T')[0] : '';
                  setFormData({ ...formData, hire_date: isoDate });
                }}
                placeholderText="입사일 선택"
              />
            </div>

            {/* 은행 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="국민은행"
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000-00-000000"
              />
            </div>

            {/* 주민번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주민번호
              </label>
              <input
                type="text"
                value={formData.social_security_number}
                onChange={(e) => setFormData({ ...formData, social_security_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000000-0000000"
              />
            </div>

            {/* 비상연락망 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비상연락망
              </label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="010-0000-0000"
              />
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="서울시 강남구 테헤란로 123"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Save className="w-4 h-4 mr-2" />
              변경 요청
            </button>
          </div>
        </form>
      </div>

      {/* 변경 요청 내역 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">변경 요청 내역</h2>
        
        {changeRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            변경 요청 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {changeRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(request.status)}
                    <span className="text-sm text-gray-500">
                      요청일: {formatDateToKorean(request.requested_at)}
                    </span>
                  </div>
                  {request.reviewed_at && (
                    <span className="text-sm text-gray-500">
                      처리일: {formatDateToKorean(request.reviewed_at)}
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">변경 요청 내용:</h4>
                  <div className="space-y-1">
                    {Object.entries(request.requested_changes).map(([field, value]) => (
                      <div key={field} className="text-sm">
                        <span className="font-medium text-gray-700">{getFieldLabel(field)}:</span>{' '}
                        <span className="text-gray-900">
                          {field === 'hire_date' && value ? formatDateToKorean(value as string) : (value as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {request.admin_note && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">관리자 메모:</h4>
                    <p className="text-sm text-blue-900">{request.admin_note}</p>
                    {request.reviewed_by_name && (
                      <p className="text-xs text-blue-700 mt-1">처리자: {request.reviewed_by_name}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAccountEdit;
