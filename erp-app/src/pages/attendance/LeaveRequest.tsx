import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, FileText, Send, Clock } from 'lucide-react';

const LeaveRequest: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    leaveType: '연차',
    startDate: '',
    endDate: '',
    reason: '',
    emergency: false,
    halfDayPeriod: '오전' as '오전' | '오후'
  });
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // 내 휴가 신청 내역 로드
  useEffect(() => {
    loadMyRequests();
  }, [user, submitted]);

  const loadMyRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem('erp_leave_requests') || '[]');
    // 현재 사용자의 신청 내역만 필터링
    const userRequests = allRequests.filter((req: any) => req.username === user?.username);
    setMyRequests(userRequests);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 일수 계산
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // LocalStorage에서 기존 휴가 신청 목록 가져오기
    const existingRequests = JSON.parse(localStorage.getItem('erp_leave_requests') || '[]');
    
    // 사용자 정보 가져오기
    const users = JSON.parse(localStorage.getItem('erp_users') || '[]');
    const currentUser = users.find((u: any) => u.username === user?.username);
    
    // 새 휴가 신청 생성
    const newRequest = {
      id: Date.now(),
      employeeName: user?.name,
      employeeCode: currentUser?.username === 'admin' ? 'ADMIN001' : `EMP${String(currentUser?.id || 999).padStart(3, '0')}`,
      userId: user?.id,
      username: user?.username,
      leaveType: formData.leaveType,
      startDate: formData.startDate.replace(/-/g, '.'),
      endDate: formData.endDate.replace(/-/g, '.'),
      days: formData.leaveType === '반차' ? 0.5 : diffDays,
      reason: formData.reason,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      emergency: formData.emergency,
      halfDayPeriod: formData.leaveType === '반차' ? formData.halfDayPeriod : undefined
    };
    
    // LocalStorage에 저장
    existingRequests.push(newRequest);
    localStorage.setItem('erp_leave_requests', JSON.stringify(existingRequests));
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        leaveType: '연차',
        startDate: '',
        endDate: '',
        reason: '',
        emergency: false,
        halfDayPeriod: '오전'
      });
    }, 3000);
  };

  const handleChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    
    // 반차 선택 시 종료일을 시작일과 동일하게 설정
    if (field === 'leaveType' && value === '반차') {
      if (newFormData.startDate) {
        newFormData.endDate = newFormData.startDate;
      }
    }
    
    // 반차일 때 시작일 변경 시 종료일도 자동 변경
    if (field === 'startDate' && formData.leaveType === '반차') {
      newFormData.endDate = value;
    }
    
    setFormData(newFormData);
  };

  const leaveBalance = {
    total: 15,
    used: 10,
    remaining: 5
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">휴가 신청</h1>
          <p className="text-gray-600">휴가를 신청하고 관리하세요</p>
        </div>

        {/* Leave Balance Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            연차 현황
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm opacity-90 mb-1">총 연차</div>
              <div className="text-3xl font-bold">{leaveBalance.total}일</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">사용</div>
              <div className="text-3xl font-bold">{leaveBalance.used}일</div>
            </div>
            <div>
              <div className="text-sm opacity-90 mb-1">잔여</div>
              <div className="text-3xl font-bold">{leaveBalance.remaining}일</div>
            </div>
          </div>
        </div>

        {/* Leave Request Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">휴가 신청서</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신청자
                </label>
                <input
                  type="text"
                  value={user?.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  부서
                </label>
                <input
                  type="text"
                  value="개발팀"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                휴가 종류 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => handleChange('leaveType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="연차">연차</option>
                <option value="반차">반차</option>
                <option value="병가">병가</option>
                <option value="경조사">경조사</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* Half Day Period Selection (반차 시에만 표시) */}
            {formData.leaveType === '반차' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반차 시간 선택 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="halfDayPeriod"
                      value="오전"
                      checked={formData.halfDayPeriod === '오전'}
                      onChange={(e) => handleChange('halfDayPeriod', e.target.value)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">오전 반차</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="halfDayPeriod"
                      value="오후"
                      checked={formData.halfDayPeriod === '오후'}
                      onChange={(e) => handleChange('halfDayPeriod', e.target.value)}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">오후 반차</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  * 오전 반차: 09:00 ~ 13:00 / 오후 반차: 14:00 ~ 18:00
                </p>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.leaveType === '반차' ? '날짜' : '시작일'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료일 <span className="text-red-500">*</span>
                  {formData.leaveType === '반차' && (
                    <span className="ml-2 text-xs text-gray-500">(반차는 하루만 선택됩니다)</span>
                  )}
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formData.leaveType === '반차' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  disabled={formData.leaveType === '반차'}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={4}
                placeholder="휴가 사유를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Emergency Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emergency"
                checked={formData.emergency}
                onChange={(e) => handleChange('emergency', e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="emergency" className="ml-2 text-sm text-gray-700">
                긴급 휴가 신청
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>신청하기</span>
              </button>
            </div>
          </form>

          {/* Success Message */}
          {submitted && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-700">
                <FileText className="w-5 h-5 mr-2" />
                <span className="font-semibold">휴가 신청이 완료되었습니다!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">승인자에게 알림이 전송되었습니다.</p>
            </div>
          )}
        </div>

        {/* My Leave Requests */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              내 휴가 신청 내역
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                신청한 휴가 내역이 없습니다.
              </div>
            ) : (
              myRequests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">
                        {request.leaveType}
                        {request.leaveType === '반차' && request.halfDayPeriod && (
                          <span className="text-sm font-normal text-gray-600"> ({request.halfDayPeriod})</span>
                        )}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {request.startDate}
                        {request.startDate !== request.endDate && ` - ${request.endDate}`}
                      </span>
                      {request.leaveType === '반차' && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          0.5일
                        </span>
                      )}
                      {request.emergency && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          긴급
                        </span>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'pending' ? '대기중' :
                       request.status === 'approved' ? '승인' : '반려'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">신청일: {request.requestDate}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;

