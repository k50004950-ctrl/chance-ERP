import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, TrendingUp, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import SalespersonDashboard from './SalespersonDashboard';

interface AttendanceRecord {
  clockInTime: string | null;
  clockOutTime: string | null;
  date: string;
  username: string;
  name: string;
  workHours?: string;
}

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeCode: string;
  username: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 영업자 또는 섭외자는 영업자 대시보드 표시
  if (user?.role === 'salesperson' || user?.role === 'recruiter') {
    return <SalespersonDashboard />;
  }
  
  const [attendanceStats, setAttendanceStats] = useState({
    monthlyWork: {
      current: 0,
      total: 168,
      percentage: 0,
      maxExceeded: 0,
      overtime: 0
    },
    leaveStats: {
      available: 0,
      totalLeave: 0,
      usedLeave: 0,
      approvedLeave: 0,
      pendingLeave: 0
    },
    yearlyPrediction: {
      percentage: 0,
      currentHours: 0,
      totalHours: 2080 // 52주 * 40시간
    }
  });
  const [weeklyRecords, setWeeklyRecords] = useState<any[]>([]);
  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // 관리자는 근태 현황 페이지로 리다이렉트
    if (user?.role === 'admin') {
      navigate('/hr/attendance', { replace: true });
      return;
    }
    
    if (user?.username) {
      loadAttendanceData();
      loadLeaveData();
    }
  }, [user, navigate]);

  const loadAttendanceData = () => {
    if (!user?.username) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // 이번 달의 첫날과 마지막 날
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // 이번 주의 첫날(월요일)과 마지막 날(일요일)
    const today = now.getDay();
    const diff = today === 0 ? -6 : 1 - today; // 월요일로 조정
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() + diff);
    firstDayOfWeek.setHours(0, 0, 0, 0);
    
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    // 월간 근무 시간 계산
    let monthlyHours = 0;
    let yearlyHours = 0;
    let hasAnyData = false;
    
    // 이번 달의 모든 날짜를 순회
    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const storageKey = `erp_attendance_${user.username}_${dateStr}`;
      const attendanceData = localStorage.getItem(storageKey);
      
      if (attendanceData) {
        hasAnyData = true;
        const record: AttendanceRecord = JSON.parse(attendanceData);
        
        if (record.clockInTime && record.clockOutTime) {
          // 근무 시간 계산
          const clockIn = new Date(`2000-01-01 ${record.clockInTime}`);
          const clockOut = new Date(`2000-01-01 ${record.clockOutTime}`);
          const diffMs = clockOut.getTime() - clockIn.getTime();
          const hours = diffMs / (1000 * 60 * 60);
          monthlyHours += hours;
        }
      }
    }

    // 연간 근무 시간 계산 (1월부터 현재 달까지)
    for (let m = 0; m <= currentMonth; m++) {
      const firstDay = new Date(currentYear, m, 1);
      const lastDay = new Date(currentYear, m + 1, 0);
      
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const storageKey = `erp_attendance_${user.username}_${dateStr}`;
        const attendanceData = localStorage.getItem(storageKey);
        
        if (attendanceData) {
          const record: AttendanceRecord = JSON.parse(attendanceData);
          
          if (record.clockInTime && record.clockOutTime) {
            const clockIn = new Date(`2000-01-01 ${record.clockInTime}`);
            const clockOut = new Date(`2000-01-01 ${record.clockOutTime}`);
            const diffMs = clockOut.getTime() - clockIn.getTime();
            const hours = diffMs / (1000 * 60 * 60);
            yearlyHours += hours;
          }
        }
      }
    }

    // 이번 주 근무 기록
    const weekRecords = [];
    for (let d = new Date(firstDayOfWeek); d <= lastDayOfWeek; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const formattedDate = `${d.getMonth() + 1}/${d.getDate()}(${dayNames[dayOfWeek]})`;
      
      const storageKey = `erp_attendance_${user.username}_${dateStr}`;
      const attendanceData = localStorage.getItem(storageKey);
      
      const isToday = d.toDateString() === now.toDateString();
      const isFuture = d > now;
      
      if (attendanceData) {
        const record: AttendanceRecord = JSON.parse(attendanceData);
        
        if (record.clockInTime && record.clockOutTime) {
          weekRecords.push({
            date: formattedDate,
            clockIn: record.clockInTime.substring(0, 5),
            clockOut: record.clockOutTime.substring(0, 5),
            status: '정상 출근',
            type: 'normal'
          });
        } else if (record.clockInTime && !record.clockOutTime) {
          weekRecords.push({
            date: formattedDate,
            clockIn: record.clockInTime.substring(0, 5),
            status: '근무중',
            type: 'working'
          });
        }
      } else {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekRecords.push({
            date: formattedDate,
            status: '휴무',
            type: 'rest'
          });
        } else if (isFuture) {
          weekRecords.push({
            date: formattedDate,
            status: '예정',
            type: 'scheduled'
          });
        } else {
          weekRecords.push({
            date: formattedDate,
            status: '미출근',
            type: 'absent'
          });
        }
      }
    }

    const monthlyPercentage = Math.round((monthlyHours / 168) * 100);
    const yearlyPercentage = Math.round((yearlyHours / 2080) * 100);
    const overtime = Math.max(0, monthlyHours - 168);
    const maxExceeded = Math.max(0, monthlyHours - 168);

    setAttendanceStats(prev => ({
      ...prev,
      monthlyWork: {
        current: Math.round(monthlyHours * 10) / 10,
        total: 168,
        percentage: monthlyPercentage,
        maxExceeded: Math.round(maxExceeded * 10) / 10,
        overtime: Math.round(overtime * 10) / 10
      },
      yearlyPrediction: {
        percentage: yearlyPercentage,
        currentHours: Math.round(yearlyHours * 10) / 10,
        totalHours: 2080
      }
    }));

    setWeeklyRecords(weekRecords);
    setHasData(hasAnyData);
  };

  const loadLeaveData = () => {
    if (!user?.username) return;

    // 직원의 연차 정보 가져오기
    const usersJson = localStorage.getItem('erp_users');
    if (usersJson) {
      const users = JSON.parse(usersJson);
      const currentUser = users.find((u: any) => u.username === user.username);
      
      // erp_employees에서 연차 정보 가져오기 (샘플로 15일 설정)
      const totalLeave = 15; // 기본값
      const usedLeave = 0; // 기본값
      
      // 휴가 신청 내역에서 승인된 휴가 계산
      const leaveRequestsJson = localStorage.getItem('erp_leave_requests');
      let approvedLeave = 0;
      let pendingLeave = 0;
      let recentRequests: LeaveRequest[] = [];
      
      if (leaveRequestsJson) {
        const allRequests: LeaveRequest[] = JSON.parse(leaveRequestsJson);
        const myRequests = allRequests.filter(req => req.username === user.username);
        
        myRequests.forEach(req => {
          if (req.status === 'approved') {
            approvedLeave += req.days;
          } else if (req.status === 'pending') {
            pendingLeave += req.days;
          }
        });
        
        // 최근 5개의 휴가 신청
        recentRequests = myRequests
          .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
          .slice(0, 5);
      }
      
      const availableLeave = totalLeave - approvedLeave;
      
      setAttendanceStats(prev => ({
        ...prev,
        leaveStats: {
          available: availableLeave,
          totalLeave: totalLeave,
          usedLeave: approvedLeave,
          approvedLeave: approvedLeave,
          pendingLeave: pendingLeave
        }
      }));
      
      setRecentLeaveRequests(recentRequests);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침입니다';
    if (hour < 18) return '좋은 오후입니다';
    return '좋은 저녁입니다';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Top Section - 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 근태 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">근태 현황</h3>
            <button className="px-4 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
              월간
            </button>
          </div>
          {!hasData ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">근태 데이터 없음</p>
              <p className="text-sm">이번 달 출퇴근 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg p-5 text-white mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">근무 시간</span>
                  <span className="text-lg font-bold">{attendanceStats.monthlyWork.percentage}%</span>
                </div>
                <div className="flex items-baseline mb-3">
                  <span className="text-4xl font-bold">{attendanceStats.monthlyWork.current}시간</span>
                  <span className="ml-2 text-sm opacity-90">/ {attendanceStats.monthlyWork.total}시간</span>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full h-2 mb-3">
                  <div 
                    className="bg-white rounded-full h-2"
                    style={{ width: `${Math.min(attendanceStats.monthlyWork.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>초과 근무</span>
                  <span className={`font-semibold ${attendanceStats.monthlyWork.overtime > 0 ? 'text-orange-600' : ''}`}>
                    {attendanceStats.monthlyWork.overtime}시간
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>이번 달 근무일</span>
                  <span className="font-semibold">
                    {Math.round(attendanceStats.monthlyWork.current / 8)}일
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 연차 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">연차 현황</h3>
            <button className="px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
              {new Date().getFullYear()}년
            </button>
          </div>
          <div className="mb-4">
            <div className="text-center mb-4">
              <div className="text-sm text-gray-600 mb-1">사용 가능 일자</div>
              <div className="text-4xl font-bold text-green-600">{attendanceStats.leaveStats.available}일</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">총 연차</div>
                <div className="font-semibold">{attendanceStats.leaveStats.totalLeave}일</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">사용한 연차</div>
                <div className="font-semibold text-red-600">{attendanceStats.leaveStats.usedLeave}일</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">승인된 휴가</div>
                <div className="font-semibold text-blue-600">{attendanceStats.leaveStats.approvedLeave}일</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600 text-xs">대기중</div>
                <div className="font-semibold text-yellow-600">{attendanceStats.leaveStats.pendingLeave}일</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2025년 근무 상태 및 예측 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{new Date().getFullYear()}년 근무 상태 및 예측</h3>
          <div className="flex flex-col items-center">
            {/* Circular Progress */}
            <div className="relative w-48 h-48 mb-4">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#blueGradient)"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - attendanceStats.yearlyPrediction.percentage / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-sm text-gray-600 mb-1">연차 근무율</div>
                <div className="text-4xl font-bold text-blue-600">{attendanceStats.yearlyPrediction.percentage}%</div>
              </div>
            </div>
            {/* Stats */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">이번시간</span>
                <span className="font-bold text-gray-800">{attendanceStats.yearlyPrediction.currentHours}시간</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 근무시간</span>
                <span className="font-bold text-gray-800">{attendanceStats.yearlyPrediction.totalHours}시간</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Timeline and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 이번주 근무 기록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">이번주 근무 기록</h3>
            <div className="text-sm text-gray-600">
              {(() => {
                const now = new Date();
                const today = now.getDay();
                const diff = today === 0 ? -6 : 1 - today;
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() + diff);
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                return `${firstDayOfWeek.getMonth() + 1}/${firstDayOfWeek.getDate()} ~ ${lastDayOfWeek.getMonth() + 1}/${lastDayOfWeek.getDate()}`;
              })()}
            </div>
          </div>
          {weeklyRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">근무 기록 없음</p>
              <p className="text-sm">이번 주 근무 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyRecords.map((record, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot and line */}
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className={`w-3 h-3 rounded-full ${
                        record.type === 'normal' ? 'bg-green-500' :
                        record.type === 'working' ? 'bg-blue-500' :
                        record.type === 'holiday' ? 'bg-red-400' :
                        record.type === 'scheduled' ? 'bg-gray-300' :
                        record.type === 'absent' ? 'bg-gray-400' :
                        'bg-gray-400'
                      }`} />
                      {index < weeklyRecords.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">{record.date}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          record.type === 'normal' ? 'bg-green-100 text-green-700' :
                          record.type === 'working' ? 'bg-blue-100 text-blue-700' :
                          record.type === 'holiday' ? 'bg-red-100 text-red-700' :
                          record.type === 'scheduled' ? 'bg-gray-100 text-gray-600' :
                          record.type === 'absent' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      {record.clockIn && (
                        <div className="text-sm text-gray-600">
                          {record.clockIn} {record.clockOut && `- ${record.clockOut}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 휴가 신청 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">최근 휴가 신청</h3>
          </div>
          {recentLeaveRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">휴가 신청 내역 없음</p>
              <p className="text-sm">아직 휴가를 신청하지 않았습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">신청일</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">휴가 기간</th>
                    <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">일수</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaveRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm text-gray-900">{request.requestDate}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">
                        {request.startDate} ~ {request.endDate}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-gray-900">
                        {request.days}일
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          request.status === 'approved' 
                            ? 'bg-green-100 text-green-700'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status === 'approved' ? '승인' : request.status === 'rejected' ? '반려' : '대기'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

