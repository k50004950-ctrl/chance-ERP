import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Edit2, Trash2, X, Check, Search, Bell, List, CalendarDays, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

interface Schedule {
  id?: number;
  user_id: number;
  title: string;
  schedule_date: string;
  schedule_time: string;
  client_name: string;
  location: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  sales_db_id?: number; // DB와 연결
  created_at?: string;
  updated_at?: string;
}

const ScheduleManagement: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar'); // 캘린더 뷰 기본
  const [upcomingAlerts, setUpcomingAlerts] = useState<Schedule[]>([]);

  const [formData, setFormData] = useState<Schedule>({
    user_id: user?.id || 0,
    title: '',
    schedule_date: '',
    schedule_time: '',
    client_name: '',
    location: '',
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (user?.id) {
      loadSchedules();
      checkUpcomingSchedules();
    }
  }, [user]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, selectedMonth, searchKeyword]);

  // 5분마다 알림 체크
  useEffect(() => {
    const interval = setInterval(() => {
      checkUpcomingSchedules();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [schedules]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('일정 조회 실패:', error);
    }
  };

  // 다가오는 일정 알림 체크
  const checkUpcomingSchedules = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const today = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcoming = schedules.filter(s => 
      s.status === 'scheduled' && 
      (s.schedule_date === today || s.schedule_date === tomorrowStr)
    );

    setUpcomingAlerts(upcoming);

    // 브라우저 알림 요청
    if (upcoming.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // 브라우저 알림 보내기
  const sendNotification = (schedule: Schedule) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('일정 알림', {
        body: `${schedule.schedule_date} ${schedule.schedule_time}\n${schedule.title}`,
        icon: '/vite.svg',
        tag: `schedule-${schedule.id}`
      });
    }
  };

  const filterSchedules = () => {
    let filtered = schedules;

    // 월별 필터링
    if (selectedMonth) {
      filtered = filtered.filter(s => s.schedule_date.startsWith(selectedMonth));
    }

    // 키워드 검색
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(keyword) ||
        s.client_name?.toLowerCase().includes(keyword) ||
        s.location?.toLowerCase().includes(keyword) ||
        s.notes?.toLowerCase().includes(keyword)
      );
    }

    setFilteredSchedules(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSchedule ? `${API_BASE_URL}/api/schedules/${editingSchedule.id}` : `${API_BASE_URL}/api/schedules`;
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        await loadSchedules();
        handleCloseModal();
      }
    } catch (error) {
      console.error('일정 저장 실패:', error);
    }
  };

  const handleStatusChange = async (schedule: Schedule, newStatus: string) => {
    try {
      // 일정 상태 업데이트
      const response = await fetch(`${API_BASE_URL}/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, status: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        // 완료 처리 시 DB도 자동 업데이트
        if (newStatus === 'completed' && schedule.client_name) {
          await updateSalesDBStatus(schedule.client_name, '미팅완료');
          alert(`✅ 일정이 완료되었고, ${schedule.client_name}의 미팅 상태가 "미팅완료"로 업데이트되었습니다!`);
        }
        await loadSchedules();
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // DB 미팅 상태 자동 업데이트
  const updateSalesDBStatus = async (companyName: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/update-meeting-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_name: companyName,
          salesperson_id: user?.id,
          meeting_status: status 
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('DB 상태 업데이트 실패:', result.message);
      }
    } catch (error) {
      console.error('DB 상태 업데이트 오류:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      user_id: user?.id || 0,
      title: '',
      schedule_date: '',
      schedule_time: '',
      client_name: '',
      location: '',
      notes: '',
      status: 'scheduled'
    });
  };

  const handleOpenAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      user_id: user?.id || 0,
      title: '',
      schedule_date: '',
      schedule_time: '',
      client_name: '',
      location: '',
      notes: '',
      status: 'scheduled'
    });
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    const labels: Record<string, string> = {
      scheduled: '예정',
      completed: '완료',
      cancelled: '취소'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.scheduled}`}>
        {labels[status] || status}
      </span>
    );
  };

  // 캘린더 뷰용 - 해당 월의 모든 날짜 생성
  const generateCalendarDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay(); // 0 (일요일) ~ 6 (토요일)
    const totalDays = lastDay.getDate();

    const days = [];
    
    // 이전 달의 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  };

  const getSchedulesForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    return filteredSchedules.filter(s => s.schedule_date === dateStr);
  };

  // 날짜별로 그룹화 (리스트 뷰용)
  const groupedSchedules = filteredSchedules.reduce((acc, schedule) => {
    const date = schedule.schedule_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const sortedDates = Object.keys(groupedSchedules).sort();
  const calendarDays = generateCalendarDays();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 알림 배너 */}
      {upcomingAlerts.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">📢 다가오는 일정 알림</h3>
              {upcomingAlerts.map((alert, idx) => (
                <div key={idx} className="text-sm text-yellow-700 mb-1">
                  • {alert.schedule_date} {alert.schedule_time} - {alert.title} ({alert.client_name})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          일정관리
        </h1>
        <p className="text-gray-600 mt-1">업무 일정을 등록하고 관리하세요</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">월 선택</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* 뷰 모드 전환 */}
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
                viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>캘린더</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              <span>리스트</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 flex-1 md:max-w-md">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="키워드 검색..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>일정등록</span>
          </button>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div
                key={day}
                className={`text-center font-bold py-2 ${
                  idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
            
            {/* 날짜 칸 */}
            {calendarDays.map((day, idx) => {
              const daySchedules = getSchedulesForDay(day);
              const isToday = day && selectedMonth === new Date().toISOString().slice(0, 7) && 
                             day === new Date().getDate();
              
              return (
                <div
                  key={idx}
                  className={`min-h-24 border rounded-lg p-2 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          onClick={() => handleEdit(schedule)}
                          className={`text-xs p-1 mb-1 rounded cursor-pointer truncate ${
                            schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-800'
                          }`}
                          title={`${schedule.schedule_time} ${schedule.title}`}
                        >
                          {schedule.schedule_time} {schedule.title}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    장소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">등록된 일정이 없습니다</p>
                      <p className="text-sm mt-1">+ 일정등록 버튼을 눌러 일정을 추가하세요</p>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.schedule_date}
                        <br />
                        <span className="text-xs text-gray-500">
                          ({new Date(schedule.schedule_date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {schedule.schedule_time || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {schedule.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {schedule.client_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {schedule.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={schedule.status}
                          onChange={(e) => handleStatusChange(schedule, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                            schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="scheduled">예정</option>
                          <option value="completed">완료</option>
                          <option value="cancelled">취소</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id!)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {schedule.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(schedule, 'completed')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                              title="완료 처리"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 고객사 미팅"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 *
                  </label>
                  <input
                    type="date"
                    value={formData.schedule_date}
                    onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시간
                  </label>
                  <input
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객명
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: (주)찬스컴퍼니"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상세 내용을 입력하세요"
                />
              </div>

              {editingSchedule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">예정</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {editingSchedule ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
