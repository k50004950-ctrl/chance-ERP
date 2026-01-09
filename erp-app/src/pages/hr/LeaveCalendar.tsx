import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, Plane } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  employee_code: string;
  department: string;
  position: string;
}

interface LeaveRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: string;
  days: number;
}

interface DayLeaves {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: LeaveRecord[];
}

const LeaveCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [calendarDays, setCalendarDays] = useState<DayLeaves[]>([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = `${currentYear}년 ${currentMonth + 1}월`;

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (leaves.length >= 0) {
      generateCalendar();
    }
  }, [currentDate, leaves]);

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves');
      const result = await response.json();
      if (result.success) {
        // 승인된 휴가만 표시
        const approvedLeaves = result.data.filter((leave: LeaveRecord) => leave.status === 'approved');
        setLeaves(approvedLeaves);
      }
    } catch (error) {
      console.error('휴가 기록 조회 실패:', error);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 이번 달의 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 캘린더 시작일 (이전 달 날짜 포함)
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - firstDay.getDay());
    
    // 캘린더 종료일 (다음 달 날짜 포함)
    const endDay = new Date(lastDay);
    endDay.setDate(endDay.getDate() + (6 - lastDay.getDay()));
    
    const days: DayLeaves[] = [];
    const current = new Date(startDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (current <= endDay) {
      const dateStr = formatDate(current);
      const currentCopy = new Date(current);
      currentCopy.setHours(0, 0, 0, 0);
      
      // 해당 날짜에 휴가 중인 직원 찾기
      const dayLeaves = leaves.filter(leave => 
        dateStr >= leave.start_date && dateStr <= leave.end_date
      );
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: currentCopy.getTime() === today.getTime(),
        leaves: dayLeaves
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'annual':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sick':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'special':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLeaveTypeName = (leaveType: string) => {
    switch (leaveType) {
      case 'annual':
        return '연차';
      case 'sick':
        return '병가';
      case 'special':
        return '특별휴가';
      default:
        return '기타';
    }
  };

  // 월별 통계
  const monthlyStats = () => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);

    // 이번 달에 시작하거나 진행 중인 휴가
    const monthLeaves = leaves.filter(leave => 
      (leave.start_date >= monthStartStr && leave.start_date <= monthEndStr) ||
      (leave.end_date >= monthStartStr && leave.end_date <= monthEndStr) ||
      (leave.start_date <= monthStartStr && leave.end_date >= monthEndStr)
    );

    const totalDays = monthLeaves.reduce((sum, leave) => sum + (leave.days || 1), 0);
    const uniqueEmployees = new Set(monthLeaves.map(leave => leave.employee_id)).size;

    return {
      totalLeaves: monthLeaves.length,
      totalDays,
      uniqueEmployees
    };
  };

  const stats = monthlyStats();

  // 주 단위로 캘린더 분할
  const weeks: DayLeaves[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">휴가 캘린더</h1>
        <p className="text-gray-600 mt-2">{currentMonthName} 전체 직원 휴가 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 휴가 건수</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalLeaves}건</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 휴가 일수</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalDays}일</p>
            </div>
            <Plane className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">휴가 사용 인원</p>
              <p className="text-2xl font-bold text-purple-600">{stats.uniqueEmployees}명</p>
            </div>
            <User className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 캘린더 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            월별 휴가 캘린더
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              오늘
            </button>
            <span className="text-lg font-semibold text-gray-700 min-w-[120px] text-center">
              {currentMonthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center space-x-4 mb-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span>연차</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
            <span>병가</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded mr-2"></div>
            <span>특별휴가</span>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <div className="border rounded-lg overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={index}
                className={`p-3 text-center text-sm font-semibold ${
                  index === 0 ? 'text-red-600' :
                  index === 6 ? 'text-blue-600' :
                  'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`min-h-[120px] p-2 border-r last:border-r-0 ${
                    !day.isCurrentMonth ? 'bg-gray-50' :
                    day.isToday ? 'bg-blue-50' :
                    'bg-white'
                  }`}
                >
                  {/* 날짜 헤더 */}
                  <div className={`text-sm font-medium mb-2 ${
                    !day.isCurrentMonth ? 'text-gray-400' :
                    day.isToday ? 'text-blue-600 font-bold' :
                    day.date.getDay() === 0 ? 'text-red-600' :
                    day.date.getDay() === 6 ? 'text-blue-600' :
                    'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {/* 휴가 중인 직원 목록 */}
                  {day.isCurrentMonth && day.leaves.length > 0 && (
                    <div className="space-y-1">
                      {day.leaves.slice(0, 3).map((leave) => (
                        <div
                          key={leave.id}
                          className={`px-2 py-1 rounded text-xs border ${getLeaveTypeColor(leave.leave_type)}`}
                          title={`${leave.employee_name} - ${getLeaveTypeName(leave.leave_type)}\n${leave.reason || ''}`}
                        >
                          <div className="font-medium truncate">
                            {leave.employee_name}
                          </div>
                          <div className="text-[10px] opacity-75">
                            {getLeaveTypeName(leave.leave_type)}
                          </div>
                        </div>
                      ))}
                      {day.leaves.length > 3 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{day.leaves.length - 3}명 더보기
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {leaves.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">승인된 휴가가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 이번 달 휴가 상세 목록 */}
      {stats.totalLeaves > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 달 휴가 상세</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">직원명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">휴가 종류</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시작일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">종료일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">일수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves
                  .filter(leave => {
                    const monthStart = formatDate(new Date(currentYear, currentMonth, 1));
                    const monthEnd = formatDate(new Date(currentYear, currentMonth + 1, 0));
                    return (leave.start_date >= monthStart && leave.start_date <= monthEnd) ||
                           (leave.end_date >= monthStart && leave.end_date <= monthEnd) ||
                           (leave.start_date <= monthStart && leave.end_date >= monthEnd);
                  })
                  .map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{leave.employee_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getLeaveTypeColor(leave.leave_type)}`}>
                          {getLeaveTypeName(leave.leave_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{leave.start_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{leave.end_date}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{leave.days}일</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{leave.reason || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendar;




