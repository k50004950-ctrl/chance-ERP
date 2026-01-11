import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Percent, DollarSign, Medal, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';

interface RankingData {
  id: number;
  name: string;
  employee_code: string;
  total_db: number;
  contract_count: number;
  total_contract_fee: number;
  contract_rate: number;
  fee_rank: number;
  rate_rank: number;
}

const MonthlyRanking: React.FC = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [period, setPeriod] = useState('');
  const [activeTab, setActiveTab] = useState<'fee' | 'rate'>('fee');

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/api/rankings/monthly');
      const result = await response.json();
      
      if (result.success) {
        setRankings(result.data);
        setPeriod(result.period);
      }
    } catch (error) {
      console.error('순위 조회 실패:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const isMyData = (rankingData: RankingData) => {
    return user?.name === rankingData.name;
  };

  // 기장료 순위로 정렬
  const feeRankings = [...rankings].sort((a, b) => a.fee_rank - b.fee_rank);
  
  // 계약율 순위로 정렬
  const rateRankings = [...rankings].sort((a, b) => a.rate_rank - b.rate_rank);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-800">당월 실적 순위</h1>
        </div>
        <p className="text-gray-600">{period} 실시간 순위</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fee')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'fee'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>기장료 순위</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('rate')}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'rate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5" />
            <span>계약율 순위</span>
          </div>
        </button>
      </div>

      {/* Rankings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {activeTab === 'fee' && (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <DollarSign className="w-6 h-6" />
                <span>기장료 합산 순위</span>
              </h2>
              <p className="text-sm text-blue-100 mt-1">계약 완료된 기장료 합산 기준</p>
            </div>

            {/* Table */}
            <div className="divide-y divide-gray-200">
              {feeRankings.map((ranking) => {
                const isMine = isMyData(ranking);
                return (
                  <div
                    key={ranking.id}
                    className={`flex items-center px-6 py-4 hover:bg-gray-50 transition ${
                      isMine ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    {/* 순위 */}
                    <div className="flex items-center space-x-3 w-24">
                      {getMedalIcon(ranking.fee_rank)}
                      <span
                        className={`text-2xl font-bold px-3 py-1 rounded-lg ${getRankBadgeColor(
                          ranking.fee_rank
                        )}`}
                      >
                        {ranking.fee_rank}
                      </span>
                    </div>

                    {/* 이름 */}
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{ranking.name}</p>
                      <p className="text-sm text-gray-500">{ranking.employee_code}</p>
                    </div>

                    {/* 계약 건수 */}
                    <div className="w-32 text-center">
                      <p className="text-sm text-gray-500 mb-1">계약 건수</p>
                      <p className="text-xl font-bold text-gray-900">
                        {isMine ? `${formatNumber(ranking.contract_count)}건` : '?건'}
                      </p>
                    </div>

                    {/* 총 기장료 */}
                    <div className="w-48 text-center">
                      <p className="text-sm text-gray-500 mb-1">총 기장료</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {isMine ? `${formatNumber(ranking.total_contract_fee)}원` : '???원'}
                      </p>
                    </div>

                    {/* 계약율 */}
                    <div className="w-32 text-center">
                      <p className="text-sm text-gray-500 mb-1">계약율</p>
                      <p className="text-lg font-semibold text-green-600">
                        {isMine ? `${ranking.contract_rate.toFixed(1)}%` : '?%'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'rate' && (
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <TrendingUp className="w-6 h-6" />
                <span>계약율 순위</span>
              </h2>
              <p className="text-sm text-green-100 mt-1">계약 완료 / 전체 DB 기준</p>
            </div>

            {/* Table */}
            <div className="divide-y divide-gray-200">
              {rateRankings.map((ranking) => {
                const isMine = isMyData(ranking);
                return (
                  <div
                    key={ranking.id}
                    className={`flex items-center px-6 py-4 hover:bg-gray-50 transition ${
                      isMine ? 'bg-green-50 border-l-4 border-green-600' : ''
                    }`}
                  >
                    {/* 순위 */}
                    <div className="flex items-center space-x-3 w-24">
                      {getMedalIcon(ranking.rate_rank)}
                      <span
                        className={`text-2xl font-bold px-3 py-1 rounded-lg ${getRankBadgeColor(
                          ranking.rate_rank
                        )}`}
                      >
                        {ranking.rate_rank}
                      </span>
                    </div>

                    {/* 이름 */}
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{ranking.name}</p>
                      <p className="text-sm text-gray-500">{ranking.employee_code}</p>
                    </div>

                    {/* 전체 DB */}
                    <div className="w-32 text-center">
                      <p className="text-sm text-gray-500 mb-1">전체 DB</p>
                      <p className="text-xl font-bold text-gray-900">
                        {isMine ? `${formatNumber(ranking.total_db)}건` : '?건'}
                      </p>
                    </div>

                    {/* 계약 건수 */}
                    <div className="w-32 text-center">
                      <p className="text-sm text-gray-500 mb-1">계약 건수</p>
                      <p className="text-xl font-bold text-blue-600">
                        {isMine ? `${formatNumber(ranking.contract_count)}건` : '?건'}
                      </p>
                    </div>

                    {/* 계약율 */}
                    <div className="w-48 text-center">
                      <p className="text-sm text-gray-500 mb-1">계약율</p>
                      <p className="text-3xl font-bold text-green-600">
                        {isMine ? `${ranking.contract_rate.toFixed(1)}%` : '?%'}
                      </p>
                    </div>

                    {/* 총 기장료 */}
                    <div className="w-40 text-center">
                      <p className="text-sm text-gray-500 mb-1">총 기장료</p>
                      <p className="text-lg font-semibold text-gray-700">
                        {isMine ? `${formatNumber(ranking.total_contract_fee)}원` : '???원'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rankings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>아직 실적 데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Trophy className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">💡 순위 안내</p>
            <ul className="list-disc list-inside space-y-1">
              <li>본인의 실적만 구체적인 숫자로 확인할 수 있습니다.</li>
              <li>다른 영업자의 실적은 물음표(?)로 표시됩니다.</li>
              <li>실시간으로 업데이트되며 매월 1일 0시에 초기화됩니다.</li>
              <li>계약 완료(Y)로 표시된 건만 실적에 포함됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRanking;
