import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, CheckCircle, AlertCircle, Coffee, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Employee {
  id: number;
  name: string;
  employee_code: string;
  department: string;
  position: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in: string;
  check_out: string;
  status: string;
}

interface LeaveRecord {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  employees: {
    [key: number]: {
      status: 'present' | 'absent' | 'late' | 'vacation' | 'pending' | 'weekend';
      checkIn?: string;
      checkOut?: string;
    };
  };
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentMonthName = `${currentYear}년 ${currentMonth + 1}월`;

  // 데이터 가져오기
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchLeaves();
  }, []);

  // 캘린더 생성
  useEffect(() => {
    if (employees.length > 0) {
      generateCalendar();
    }
  }, [currentDate, employees, attendance, leaves]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('직원 목록 조회 실패:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const result = await response.json();
      if (result.success) {
        setAttendance(result.data);
      }
    } catch (error) {
      console.error('근태 기록 조회 실패:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves');
      const result = await response.json();
      if (result.success) {
        setLeaves(result.data.filter((leave: LeaveRecord) => leave.status === 'approved'));
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
    
    const days: CalendarDay[] = [];
    const current = new Date(startDay);
    
    while (current <= endDay) {
      const dayInfo: CalendarDay = {
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        employees: {}
      };
      
      // 각 직원의 해당 날짜 상태 확인
      employees.forEach(employee => {
        const dateStr = formatDate(current);
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
        
        // 휴가 확인
        const onLeave = leaves.some(leave => 
          employee.id === leave.employee_id &&
          dateStr >= leave.start_date &&
          dateStr <= leave.end_date
        );
        
        if (onLeave) {
          dayInfo.employees[employee.id] = { status: 'vacation' };
        } else if (isWeekend) {
          dayInfo.employees[employee.id] = { status: 'weekend' };
        } else {
          // 근태 기록 확인
          const attendanceRecord = attendance.find(
            att => att.employee_id === employee.id && att.date === dateStr
          );
          
          if (attendanceRecord) {
            const checkInTime = attendanceRecord.check_in;
            const isLate = checkInTime && checkInTime > '09:00:00';
            
            dayInfo.employees[employee.id] = {
              status: isLate ? 'late' : 'present',
              checkIn: checkInTime,
              checkOut: attendanceRecord.check_out
            };
          } else if (current < new Date()) {
            // 과거 날짜인데 기록이 없으면 결근
            dayInfo.employees[employee.id] = { status: 'absent' };
          } else {
            // 미래 날짜
            dayInfo.employees[employee.id] = { status: 'pending' };
          }
        }
      });
      
      days.push(dayInfo);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-blue-500';
      case 'late':
        return 'bg-orange-500';
      case 'absent':
        return 'bg-red-500';
      case 'vacation':
        return 'bg-green-500';
      case 'weekend':
        return 'bg-gray-300';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '출근';
      case 'late':
        return '지각';
      case 'absent':
        return '결근';
      case 'vacation':
        return '휴가';
      case 'weekend':
        return '휴무';
      default:
        return '-';
    }
  };

  // 현재 월의 통계 계산
  const calculateMonthlyStats = () => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);

    const monthlyAttendance = attendance.filter(
      att => att.date >= monthStartStr && att.date <= monthEndStr
    );

    const presentCount = monthlyAttendance.filter(att => att.check_in).length;
    const lateCount = monthlyAttendance.filter(att => att.check_in && att.check_in > '09:00:00').length;
    const totalWorkDays = calendarDays.filter(day => 
      day.isCurrentMonth && day.date.getDay() !== 0 && day.date.getDay() !== 6 && day.date < new Date()
    ).length;

    return {
      presentCount,
      lateCount,
      totalWorkDays,
      attendanceRate: totalWorkDays > 0 ? ((presentCount / (totalWorkDays * employees.length)) * 100).toFixed(1) : 0
    };
  };

  const stats = calculateMonthlyStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">근태 현황</h1>
        <p className="text-gray-600 mt-2">{currentMonthName} 전체 직원 근태 및 휴가 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 직원 수</p>
              <p className="text-2xl font-bold text-gray-800">{employees.length}명</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">출근 기록</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}건</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">지각</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lateCount}건</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">출근율</p>
              <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 캘린더 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 mr-2" />
            근태 캘린더
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
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>출근</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span>지각</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>결근</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>휴가</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
            <span>휴무</span>
          </div>
        </div>

        {/* 캘린더 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10 min-w-[150px]">
                  직원
                </th>
                {calendarDays.slice(0, 7).map((day, index) => (
                  <th
                    key={index}
                    className={`p-2 text-center text-xs font-medium min-w-[40px] ${
                      day.date.getDay() === 0 ? 'text-red-600' :
                      day.date.getDay() === 6 ? 'text-blue-600' :
                      'text-gray-600'
                    }`}
                  >
                    {['일', '월', '화', '수', '목', '금', '토'][day.date.getDay()]}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200">
                <th className="p-3 bg-gray-50 sticky left-0 z-10"></th>
                {calendarDays.map((day, index) => {
                  const isToday = formatDate(day.date) === formatDate(new Date());
                  return (
                    <th
                      key={index}
                      className={`p-2 text-center text-xs font-normal ${
                        !day.isCurrentMonth ? 'text-gray-400' :
                        isToday ? 'bg-blue-100 text-blue-700 font-bold' :
                        day.date.getDay() === 0 ? 'text-red-600' :
                        day.date.getDay() === 6 ? 'text-blue-600' :
                        'text-gray-700'
                      }`}
                    >
                      {day.date.getDate()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 sticky left-0 bg-white z-10 border-r border-gray-200">
                    <div>
                      <div className="font-medium text-gray-800">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.department} · {employee.position}</div>
                    </div>
                  </td>
                  {calendarDays.map((day, dayIndex) => {
                    const employeeStatus = day.employees[employee.id];
                    const isToday = formatDate(day.date) === formatDate(new Date());
                    
                    return (
                      <td
                        key={dayIndex}
                        className={`p-1 text-center ${
                          isToday ? 'bg-blue-50' : ''
                        } ${!day.isCurrentMonth ? 'bg-gray-50' : ''}`}
                      >
                        {employeeStatus && day.isCurrentMonth && (
                          <div
                            className={`w-6 h-6 mx-auto rounded ${getStatusColor(employeeStatus.status)}`}
                            title={`${employee.name} - ${getStatusText(employeeStatus.status)}${
                              employeeStatus.checkIn ? `\n출근: ${employeeStatus.checkIn}` : ''
                            }${
                              employeeStatus.checkOut ? `\n퇴근: ${employeeStatus.checkOut}` : ''
                            }`}
                          ></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 직원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
