import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  userId?: number;
  username?: string;
  emergency?: boolean;
  halfDayPeriod?: '오전' | '오후';
}

const Leaves: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  // 데이터베이스에서 휴가 신청 목록 로드
  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leaves/all');
      const result = await response.json();
      if (result.success && result.data) {
        // API 데이터를 LeaveRequest 형식으로 변환
        const formattedData = result.data.map((item: any) => ({
          id: item.id,
          employeeName: item.employee_name || '알 수 없음',
          employeeCode: item.employee_code || '-',
          leaveType: item.leave_type,
          startDate: item.start_date,
          endDate: item.end_date,
          days: calculateDays(item.start_date, item.end_date, item.leave_type),
          reason: item.reason,
          status: item.status,
          requestDate: item.created_at ? item.created_at.split(' ')[0] : '-',
          userId: item.user_id,
          halfDayPeriod: item.reason?.includes('오전') ? '오전' : item.reason?.includes('오후') ? '오후' : undefined,
        }));
        setLeaveRequests(formattedData);
      }
    } catch (error) {
      console.error('휴가 목록 조회 실패:', error);
    }
  };

  const calculateDays = (startDate: string, endDate: string, leaveType: string): number => {
    if (leaveType === '반차') return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 승인/반려 처리
  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      const result = await response.json();
      if (result.success) {
        loadLeaveRequests(); // 목록 새로고침
      } else {
        alert('승인 처리 실패: ' + result.message);
      }
    } catch (error) {
      console.error('승인 처리 실패:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      const result = await response.json();
      if (result.success) {
        loadLeaveRequests(); // 목록 새로고침
      } else {
        alert('반려 처리 실패: ' + result.message);
      }
    } catch (error) {
      console.error('반려 처리 실패:', error);
      alert('반려 처리 중 오류가 발생했습니다.');
    }
  };

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  };

  const filteredRequests = filterStatus === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(r => r.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            <span>대기중</span>
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            <span>승인</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            <span>반려</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      '연차': 'bg-blue-100 text-blue-800',
      '반차': 'bg-purple-100 text-purple-800',
      '병가': 'bg-red-100 text-red-800',
      '경조사': 'bg-pink-100 text-pink-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">휴가 관리</h1>
        <p className="text-gray-600 mt-2">직원의 휴가 신청을 관리하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 신청</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}건</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">대기중</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}건</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">승인</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}건</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">반려</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}건</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">필터:</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                대기중
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                반려
              </button>
            </div>
          </div>

          {/* Add Button */}
          <button className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
            <Plus className="w-5 h-5" />
            <span>휴가 신청</span>
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직원정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  휴가종류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  일수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사유
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신청일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{request.employeeName}</div>
                    <div className="text-xs text-gray-500">{request.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getLeaveTypeBadge(request.leaveType)}
                      {request.leaveType === '반차' && request.halfDayPeriod && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                          {request.halfDayPeriod}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{request.startDate}</div>
                    <div className="text-xs text-gray-500">~ {request.endDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{request.days}일</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.requestDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {request.status === 'pending' && (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition"
                          title="승인"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition"
                          title="반려"
                        >
                          반려
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;

