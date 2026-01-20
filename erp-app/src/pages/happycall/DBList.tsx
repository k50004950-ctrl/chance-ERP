import React, { useState, useEffect } from 'react';
import { Phone, Search as SearchIcon, X, MessageSquare } from 'lucide-react';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';
import KoreanDatePicker from '../../components/KoreanDatePicker';

interface SalesDB {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_name: string;
  salesperson_id: number;
  meeting_status: string;
  company_name: string;
  representative: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: number;
  existing_client: string;
  contract_status: string;
  contract_date: string;
  client_name: string;
  feedback: string;
}

const HappyCallDBList: React.FC = () => {
  const [salesDB, setSalesDB] = useState<SalesDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<SalesDB[]>([]);
  const [showHappyCallModal, setShowHappyCallModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedDB, setSelectedDB] = useState<SalesDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [happyCallData, setHappyCallData] = useState({
    call_date: new Date().toISOString().split('T')[0],
    call_content: '',
    score: '중',
    notes: ''
  });

  useEffect(() => {
    fetchSalesDB();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = salesDB.filter(
        (item) =>
          item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contact?.includes(searchTerm) ||
          item.salesperson_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(salesDB);
    }
  }, [searchTerm, salesDB]);

  const fetchSalesDB = async () => {
    setLoading(true);
    try {
      console.log('API 호출 시작:', `${API_BASE_URL}/api/sales-db`);
      const response = await fetch(`${API_BASE_URL}/api/sales-db`);
      console.log('응답 상태:', response.status);
      const result = await response.json();
      console.log('조회 결과:', result);
      
      if (result.success) {
        console.log('조회된 DB 수:', result.data.length);
        setSalesDB(result.data || []);
        setFilteredData(result.data || []);
      } else {
        console.error('DB 조회 실패:', result.message);
        alert('DB 조회에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('DB 조회 오류:', error);
      alert('DB 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHappyCall = (item: SalesDB) => {
    setSelectedDB(item);
    setHappyCallData({
      call_date: new Date().toISOString().split('T')[0],
      call_content: '',
      score: '중',
      notes: ''
    });
    setShowHappyCallModal(true);
  };

  const handleOpenFeedback = (item: SalesDB) => {
    setSelectedDB(item);
    setShowFeedbackModal(true);
  };

  const parseFeedback = (feedbackString: string) => {
    try {
      if (!feedbackString) return [];
      const parsed = JSON.parse(feedbackString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return feedbackString ? [feedbackString] : [];
    }
  };

  const handleSubmitHappyCall = async () => {
    if (!selectedDB) return;

    if (!happyCallData.call_content.trim()) {
      alert('통화 내용을 입력해주세요.');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await fetch(`${API_BASE_URL}/api/happycalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          happycall_staff_id: currentUser.id,
          happycall_staff_name: currentUser.name,
          salesperson_id: selectedDB.salesperson_id,
          salesperson_name: selectedDB.salesperson_name,
          client_name: selectedDB.company_name,
          client_contact: selectedDB.contact,
          call_date: happyCallData.call_date,
          call_content: happyCallData.call_content,
          score: happyCallData.score,
          notes: happyCallData.notes
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('해피콜이 등록되었습니다!');
        setShowHappyCallModal(false);
        setSelectedDB(null);
      } else {
        alert('해피콜 등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('해피콜 등록 오류:', error);
      alert('해피콜 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">영업 DB 조회 (해피콜용)</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          모든 영업 DB를 조회하고 해피콜을 입력할 수 있습니다.
        </p>
      </div>

      {/* 검색 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="업체명, 대표자, 연락처, 영업자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">해피콜</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">섭외일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">영업자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">미팅상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">거래처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">피드백</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <div>
                      <p className="text-lg font-medium mb-2">조회된 데이터가 없습니다.</p>
                      <p className="text-sm">영업자가 등록한 DB가 없거나 검색 조건에 맞는 데이터가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenHappyCall(item)}
                        className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition"
                        title="해피콜 입력"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        입력
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToKorean(item.proposal_date) || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.company_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.representative || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.contact || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.salesperson_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '미팅대기중' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.meeting_status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.contract_status === 'Y' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.contract_status === 'Y' ? '계약완료' : '미계약'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.client_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.feedback ? (
                        <button
                          onClick={() => handleOpenFeedback(item)}
                          className="inline-flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition"
                          title="피드백 보기"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {(() => {
                            try {
                              const feedback = JSON.parse(item.feedback);
                              return Array.isArray(feedback) ? feedback.length : 1;
                            } catch {
                              return 1;
                            }
                          })()}개
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">없음</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 피드백 보기 모달 */}
      {showFeedbackModal && selectedDB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">피드백 내역</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedDB.company_name}</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {parseFeedback(selectedDB.feedback).length > 0 ? (
                <div className="space-y-4">
                  {parseFeedback(selectedDB.feedback).map((feedback: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-700">
                            {typeof feedback === 'string' ? '피드백' : feedback.author || '작성자 미상'}
                          </span>
                        </div>
                        {typeof feedback === 'object' && feedback.timestamp && (
                          <span className="text-xs text-gray-500">
                            {new Date(feedback.timestamp).toLocaleString('ko-KR')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {typeof feedback === 'string' ? feedback : feedback.content || feedback.text || JSON.stringify(feedback)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">피드백이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 해피콜 입력 모달 */}
      {showHappyCallModal && selectedDB && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">해피콜 입력</h2>
              <button
                onClick={() => setShowHappyCallModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 고객 정보 표시 */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-800 mb-2">고객 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">업체명:</span>
                    <span className="ml-2 font-medium">{selectedDB.company_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">대표자:</span>
                    <span className="ml-2 font-medium">{selectedDB.representative}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">연락처:</span>
                    <span className="ml-2 font-medium">{selectedDB.contact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">담당 영업자:</span>
                    <span className="ml-2 font-medium">{selectedDB.salesperson_name}</span>
                  </div>
                </div>
              </div>

              {/* 통화일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화일 <span className="text-red-500">*</span>
                </label>
                <KoreanDatePicker
                  selected={happyCallData.call_date ? new Date(happyCallData.call_date) : new Date()}
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setHappyCallData({ ...happyCallData, call_date: `${year}-${month}-${day}` });
                    }
                  }}
                />
              </div>

              {/* 통화 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  통화 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={happyCallData.call_content}
                  onChange={(e) => setHappyCallData({ ...happyCallData, call_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  placeholder="고객과의 통화 내용을 입력하세요..."
                />
              </div>

              {/* 평가 점수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  평가 점수 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="상"
                      checked={happyCallData.score === '상'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium">상 (만족)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="중"
                      checked={happyCallData.score === '중'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">중 (보통)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="하"
                      checked={happyCallData.score === '하'}
                      onChange={(e) => setHappyCallData({ ...happyCallData, score: e.target.value })}
                      className="mr-2"
                    />
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded font-medium">하 (불만)</span>
                  </label>
                </div>
                {happyCallData.score === '하' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ '하' 점수는 관리자와 담당 영업자에게 알림이 발송됩니다.
                  </p>
                )}
              </div>

              {/* 특이사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특이사항
                </label>
                <textarea
                  value={happyCallData.notes}
                  onChange={(e) => setHappyCallData({ ...happyCallData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="추가 특이사항이 있다면 입력하세요..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowHappyCallModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleSubmitHappyCall}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                해피콜 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HappyCallDBList;
