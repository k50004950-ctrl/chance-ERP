import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Users, Eye } from 'lucide-react';

interface Schedule {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  schedule_date: string;
  schedule_time: string;
  client_name: string;
  location: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

interface Memo {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

const SalespersonSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'memos'>('schedules');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('grouped'); // 한눈에 보기 모드 추가
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadUsers();
    loadSchedules();
    loadMemos();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadSchedules();
    } else {
      loadMemos();
    }
  }, [selectedUser, activeTab]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        // 영업자와 섭외자만 필터링
        const salesUsers = result.data.filter(
          (u: any) => u.role === 'salesperson' || u.role === 'recruiter'
        );
        setUsers(salesUsers);
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      let url = '/api/schedules';
      if (selectedUser) {
        url += `?user_id=${selectedUser}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('일정 조회 실패:', error);
    }
  };

  const loadMemos = async () => {
    try {
      let url = '/api/memos';
      if (selectedUser) {
        url += `?user_id=${selectedUser}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setMemos(result.data);
      }
    } catch (error) {
      console.error('메모 조회 실패:', error);
    }
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

  // 영업자별로 일정 그룹화 (날짜 필터링 포함)
  const getGroupedSchedules = () => {
    // 선택된 날짜의 일정만 필터링
    const filteredByDate = schedules.filter(s => s.schedule_date === selectedDate);
    
    // 영업자별로 그룹화
    const grouped: Record<string, Schedule[]> = {};
    filteredByDate.forEach(schedule => {
      const userName = schedule.user_name || '알 수 없음';
      if (!grouped[userName]) {
        grouped[userName] = [];
      }
      grouped[userName].push(schedule);
    });
    
    // 각 영업자의 일정을 시간순으로 정렬
    Object.keys(grouped).forEach(userName => {
      grouped[userName].sort((a, b) => {
        const timeA = a.schedule_time || '00:00';
        const timeB = b.schedule_time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">영업자 일정/메모 관리</h1>
        <p className="text-gray-600 mt-1">모든 영업자의 일정과 메모를 조회할 수 있습니다</p>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">영업자:</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'salesperson' ? '영업자' : '섭외자'})
                </option>
              ))}
            </select>
          </div>
          
          {activeTab === 'schedules' && (
            <>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">날짜:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    viewMode === 'grouped'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  한눈에 보기
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    viewMode === 'table'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  테이블 보기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'schedules'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>일정 ({schedules.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('memos')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'memos'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>메모 ({memos.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* 일정 탭 내용 */}
        {activeTab === 'schedules' && (
          <div className="p-6">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-1">등록된 일정이 없습니다</p>
              </div>
            ) : viewMode === 'grouped' ? (
              // 한눈에 보기 모드
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })} 일정
                  </h3>
                </div>
                {Object.keys(getGroupedSchedules()).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium mb-1">선택한 날짜에 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(getGroupedSchedules())
                      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB, 'ko-KR'))
                      .map(([userName, userSchedules]) => (
                      <div key={userName} className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-5 border border-blue-100">
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-blue-200">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-lg text-gray-800">{userName}</h4>
                          <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            {userSchedules.length}건
                          </span>
                        </div>
                        <div className="space-y-3">
                          {userSchedules.map((schedule) => (
                            <div 
                              key={schedule.id} 
                              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-blue-600 text-sm">
                                    {schedule.schedule_time || '시간 미정'}
                                  </span>
                                  {getStatusBadge(schedule.status)}
                                </div>
                              </div>
                              <p className="font-medium text-gray-900 mb-1">{schedule.title}</p>
                              {schedule.client_name && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">고객:</span> {schedule.client_name}
                                </p>
                              )}
                              {schedule.location && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">장소:</span> {schedule.location}
                                </p>
                              )}
                              {schedule.notes && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  {schedule.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // 테이블 보기 모드 (기존)
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        영업자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        일정 제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        날짜/시간
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
                        메모
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules
                      .sort((a, b) => {
                        // 1차 정렬: 영업자 이름순 (한글)
                        const nameCompare = (a.user_name || '').localeCompare(b.user_name || '', 'ko-KR');
                        if (nameCompare !== 0) return nameCompare;
                        
                        // 2차 정렬: 날짜순
                        const dateCompare = (a.schedule_date || '').localeCompare(b.schedule_date || '');
                        if (dateCompare !== 0) return dateCompare;
                        
                        // 3차 정렬: 시간순
                        return (a.schedule_time || '').localeCompare(b.schedule_time || '');
                      })
                      .map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {schedule.user_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {schedule.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {schedule.schedule_date}
                          {schedule.schedule_time && ` ${schedule.schedule_time}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {schedule.client_name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {schedule.location || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(schedule.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {schedule.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 메모 탭 내용 */}
        {activeTab === 'memos' && (
          <div className="p-6">
            {memos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-1">등록된 메모가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memos.map((memo) => (
                  <div
                    key={memo.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-800">{memo.user_name}</span>
                        {memo.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {memo.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{memo.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{memo.content}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(memo.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalespersonSchedules;


