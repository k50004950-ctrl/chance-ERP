import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, TrendingUp, DollarSign, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

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
  created_at?: string;
}

interface Memo {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  created_at?: string;
}

interface CommissionStats {
  totalContracts: number;
  thisMonthCommission: number;
  pendingCommission: number;
  completedDeals: number;
}

interface MonthlyRanking {
  rank: number;
  salesperson_id: number;
  salesperson_name: string;
  total_contract_fee: number;
  contract_count: number;
}

interface MyPerformance {
  totalDB: number;
  successDB: number;
  totalBookkeepingFee: number;
  contractCount: number;
  correctionRequests: number;
  correctionApproved: number;
}

const SalespersonDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalContracts: 0,
    thisMonthCommission: 0,
    pendingCommission: 0,
    completedDeals: 0
  });
  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyRanking[]>([]);
  const [myPerformance, setMyPerformance] = useState<MyPerformance>({
    totalDB: 0,
    successDB: 0,
    totalBookkeepingFee: 0,
    contractCount: 0,
    correctionRequests: 0,
    correctionApproved: 0
  });

  // 캘린더용 state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (user?.id) {
      loadSchedules();
      loadMemos();
      loadStats();
      loadMonthlyRankings();
      loadMyPerformance();
    }
  }, [user]);

  const loadSchedules = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/schedules?user_id=${user?.id}`);
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/memos?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setMemos(result.data);
      }
    } catch (error) {
      console.error('메모 조회 실패:', error);
    }
  };

  const loadStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      // 수수료 명세서 데이터 가져오기
      const response = await fetch(`${API_BASE_URL}/salesperson/${user?.id}/commission-details`);
      const result = await response.json();
      
      if (result.success) {
        const details = result.data;
        const thisMonth = new Date().toISOString().slice(0, 7);
        
        const thisMonthData = details.filter((d: any) => d.contract_date?.startsWith(thisMonth));
        const thisMonthCommission = thisMonthData.reduce((sum: number, d: any) => sum + (d.commission_amount || 0), 0);
        
        setStats({
          totalContracts: details.length,
          thisMonthCommission: thisMonthCommission,
          pendingCommission: 0, // 필요시 추가 로직
          completedDeals: details.filter((d: any) => d.contract_status === 'Y').length
        });
      }
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const loadMonthlyRankings = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/api/rankings/monthly`);
      const result = await response.json();
      
      if (result.success) {
        setMonthlyRankings(result.data.slice(0, 10)); // 상위 10명만
      }
    } catch (error) {
      console.error('월별 순위 조회 실패:', error);
    }
  };

  const loadMyPerformance = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const thisMonth = new Date().toISOString().slice(0, 7);
      
      // 내 DB 정보 가져오기
      const dbResponse = await fetch(`${API_BASE_URL}/api/sales-db/my-data?salesperson_id=${user?.id}`);
      const dbResult = await dbResponse.json();
      
      // 경정청구 정보 가져오기
      const correctionResponse = await fetch(`${API_BASE_URL}/api/correction-requests?user_id=${user?.id}&role=salesperson`);
      const correctionResult = await correctionResponse.json();
      
      if (dbResult.success) {
        const allDB = dbResult.data;
        const thisMonthDB = allDB.filter((db: any) => db.created_at?.startsWith(thisMonth));
        const successDB = thisMonthDB.filter((db: any) => db.contract_status === 'Y');
        const totalBookkeepingFee = successDB.reduce((sum: number, db: any) => sum + (db.actual_sales || 0), 0);
        
        let correctionRequests = 0;
        let correctionApproved = 0;
        
        if (correctionResult.success) {
          const thisMonthCorrections = correctionResult.data.filter((c: any) => c.created_at?.startsWith(thisMonth));
          correctionRequests = thisMonthCorrections.length;
          correctionApproved = thisMonthCorrections.filter((c: any) => c.review_status === '환급가능').length;
        }
        
        setMyPerformance({
          totalDB: thisMonthDB.length,
          successDB: successDB.length,
          totalBookkeepingFee: totalBookkeepingFee,
          contractCount: successDB.length,
          correctionRequests: correctionRequests,
          correctionApproved: correctionApproved
        });
      }
    } catch (error) {
      console.error('본인 실적 조회 실패:', error);
    }
  };

  // 캘린더 렌더링 함수
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 빈 칸 추가
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-center"></div>);
    }

    // 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const daySchedules = schedules.filter(s => s.schedule_date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSunday = date.getDay() === 0;
      const isSaturday = date.getDay() === 6;

      days.push(
        <div
          key={day}
          className={`p-2 min-h-[60px] border border-gray-200 text-sm ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}
        >
          <div className={`font-semibold mb-1 ${
            isSunday ? 'text-red-600' : isSaturday ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
          {daySchedules.length > 0 && (
            <div className="space-y-1">
              {daySchedules.slice(0, 2).map((schedule, idx) => (
                <div
                  key={idx}
                  className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded truncate"
                  title={schedule.title}
                >
                  {schedule.schedule_time && `${schedule.schedule_time.slice(0, 5)} `}
                  {schedule.title}
                </div>
              ))}
              {daySchedules.length > 2 && (
                <div className="text-xs text-gray-500">+{daySchedules.length - 2}개</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`text-center font-semibold text-sm py-2 ${
                idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
          {days}
        </div>
      </div>
    );
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  // 최근 5개 메모만 표시
  const recentMemos = memos.slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p className="text-gray-600 mt-1">오늘도 좋은 하루 되세요!</p>
      </div>

      {/* 상단 2개 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 좌상: 당월 실적 순위 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              당월 실적 순위
            </h3>
            <span className="text-sm text-gray-500">
              {new Date().getFullYear()}년 {String(new Date().getMonth() + 1).padStart(2, '0')}월
            </span>
          </div>
          
          <div className="overflow-y-auto max-h-[300px]">
            {monthlyRankings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">실적 데이터가 없습니다</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">순위</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">영업자</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">계약금액</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">건수</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRankings.map((ranking) => (
                    <tr 
                      key={ranking.salesperson_id} 
                      className={`border-b border-gray-100 ${ranking.salesperson_id === user?.id ? 'bg-blue-50 font-semibold' : ''}`}
                    >
                      <td className="px-3 py-2 text-sm">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          ranking.rank === 1 ? 'bg-yellow-400 text-white' :
                          ranking.rank === 2 ? 'bg-gray-300 text-white' :
                          ranking.rank === 3 ? 'bg-orange-400 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {ranking.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">{ranking.salesperson_name}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-900">
                        {formatCurrency(ranking.total_contract_fee)}원
                      </td>
                      <td className="px-3 py-2 text-sm text-center text-gray-700">{ranking.contract_count}건</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 우상: 본인 실적 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              본인 실적 현황
            </h3>
            <span className="text-sm text-gray-500">
              {new Date().getFullYear()}년 {String(new Date().getMonth() + 1).padStart(2, '0')}월
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">당월 DB 현황</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{myPerformance.successDB}</span>
                <span className="text-sm text-gray-600"> / {myPerformance.totalDB}건</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">총 기장료</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(myPerformance.totalBookkeepingFee)}원
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">계약 건수</div>
                <div className="text-2xl font-bold text-blue-600">{myPerformance.contractCount}건</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">경정청구 검토</div>
                <div className="text-lg font-bold text-purple-600">
                  {myPerformance.correctionApproved} / {myPerformance.correctionRequests}건
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">이번 달 일정</div>
                <div className="text-2xl font-bold text-orange-600">
                  {schedules.filter(s => s.schedule_date.startsWith(new Date().toISOString().slice(0, 7))).length}개
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 2개 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌하: 최근 일정 (캘린더 뷰) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              최근 일정
            </h3>
            <button
              onClick={() => navigate('/salesperson/schedules')}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              title="일정 관리"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* 월 선택 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-800">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 캘린더 */}
          {renderCalendar()}
        </div>

        {/* 우하: 최근 메모 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              최근 메모
            </h3>
            <button
              onClick={() => navigate('/salesperson/memos')}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              title="메모 관리"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {recentMemos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">등록된 메모가 없습니다</p>
              <p className="text-xs mt-1">+ 버튼을 눌러 메모를 추가하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">분류</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">제목</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">내용</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMemos.map((memo) => (
                    <tr key={memo.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-sm">
                        {memo.category ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {memo.category}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">
                        {memo.title}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700 max-w-xs">
                        <div className="line-clamp-1">{memo.content}</div>
                      </td>
                      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {memo.created_at ? new Date(memo.created_at).toLocaleDateString('ko-KR') : '-'}
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

export default SalespersonDashboard;
