import React, { useState, useEffect } from 'react';
import { Phone, Search, Calendar, Filter, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';
import { formatDateToKorean } from '../../utils/dateFormat';

interface HappyCall {
  id: number;
  happycall_staff_name: string;
  salesperson_name: string;
  client_name: string;
  client_contact: string;
  call_date: string;
  call_content: string;
  score: '상' | '중' | '하';
  notes: string;
  created_at: string;
}

const HappyCallList: React.FC = () => {
  const [happycalls, setHappycalls] = useState<HappyCall[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHappyCalls();
  }, [scoreFilter]);

  const fetchHappyCalls = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/happycalls`;
      
      if (scoreFilter !== 'all') {
        url += `?score=${scoreFilter}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setHappycalls(result.data);
      }
    } catch (error) {
      console.error('해피콜 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: string) => {
    const badges = {
      '상': <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">😊 상</span>,
      '중': <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">😐 중</span>,
      '하': <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">😞 하</span>
    };
    return badges[score as keyof typeof badges] || score;
  };

  const filteredHappyCalls = happycalls.filter(hc =>
    hc.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hc.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hc.happycall_staff_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreStats = () => {
    return {
      total: happycalls.length,
      high: happycalls.filter(h => h.score === '상').length,
      medium: happycalls.filter(h => h.score === '중').length,
      low: happycalls.filter(h => h.score === '하').length
    };
  };

  const stats = getScoreStats();

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Phone className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">해피콜 관리</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">고객 해피콜 내역을 확인하고 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-1">전체</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-1">상 😊</div>
          <div className="text-2xl font-bold text-green-600">{stats.high}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-1">중 😐</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500 mb-1">하 😞</div>
          <div className="text-2xl font-bold text-red-600">{stats.low}</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* 점수 필터 */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="mobile-form-input px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="상">상</option>
              <option value="중">중</option>
              <option value="하">하</option>
            </select>
          </div>

          {/* 검색 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="고객명, 영업자, 담당자 검색"
              className="mobile-form-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 해피콜 목록 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>로딩 중...</p>
          </div>
        ) : filteredHappyCalls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>해피콜 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHappyCalls.map((hc) => (
              <div key={hc.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{hc.client_name}</h3>
                      {getScoreBadge(hc.score)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                      <span>📞 {hc.client_contact || '연락처 없음'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{hc.call_date}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 통화 내용 */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{hc.call_content}</p>
                </div>

                {/* 추가 정보 */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span>👤 담당자: <span className="font-medium text-gray-700">{hc.happycall_staff_name}</span></span>
                  {hc.salesperson_name && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>💼 영업자: <span className="font-medium text-gray-700">{hc.salesperson_name}</span></span>
                    </>
                  )}
                  {hc.notes && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span>📝 {hc.notes}</span>
                    </>
                  )}
                </div>

                {/* 하 점수 경고 */}
                {hc.score === '하' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                      <div className="font-semibold">고객 불만 발생</div>
                      <div>관리자와 담당 영업자에게 알림이 전송되었습니다.</div>
                    </div>
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

export default HappyCallList;
