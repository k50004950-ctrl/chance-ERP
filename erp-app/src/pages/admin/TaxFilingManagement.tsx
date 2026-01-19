import React, { useState, useEffect } from 'react';
import { Building2, Search, MessageSquare, X, Plus, Eye, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import * as XLSX from 'xlsx';

interface TaxFilingBusiness {
  id: number;
  salesperson_id: number;
  salesperson_name: string;
  business_name: string;
  business_type: '간이' | '일반' | '법인' | '프리랜서';
  representative: string;
  contact: string;
  hometax_id: string;
  hometax_password: string;
  business_number: string;
  address: string;
  additional_info: string;
  feedback: string;
  created_at: string;
  updated_at: string;
}

interface FeedbackItem {
  author: string;
  content: string;
  timestamp: string;
}

const TaxFilingManagement: React.FC = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<TaxFilingBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<TaxFilingBusiness[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<TaxFilingBusiness | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [newFeedback, setNewFeedback] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, searchTerm, selectedBusinessType]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses?role=admin`);
      const result = await response.json();
      if (result.success) {
        setBusinesses(result.data);
      }
    } catch (error) {
      console.error('사업장 목록 조회 실패:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...businesses];

    // 사업장 유형 필터
    if (selectedBusinessType !== 'all') {
      filtered = filtered.filter(b => b.business_type === selectedBusinessType);
    }

    // 검색어 필터 (업체명, 영업자명, 대표자명, 연락처)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.business_name.toLowerCase().includes(term) ||
          b.salesperson_name.toLowerCase().includes(term) ||
          b.representative.toLowerCase().includes(term) ||
          b.contact.includes(term)
      );
    }

    setFilteredBusinesses(filtered);
  };

  const handleShowFeedback = (business: TaxFilingBusiness) => {
    setSelectedBusiness(business);
    try {
      const history = business.feedback ? JSON.parse(business.feedback) : [];
      setFeedbackHistory(Array.isArray(history) ? history : []);
    } catch (e) {
      setFeedbackHistory(business.feedback ? [{ author: '시스템', content: business.feedback, timestamp: new Date().toISOString() }] : []);
    }
    setShowFeedbackModal(true);
  };

  const handleShowDetail = (business: TaxFilingBusiness) => {
    setSelectedBusiness(business);
    setShowDetailModal(true);
  };

  const handleDelete = async (business: TaxFilingBusiness) => {
    if (!window.confirm(`정말 "${business.business_name}" 사업장을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses/${business.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('삭제되었습니다.');
        fetchBusinesses(); // 목록 새로고침
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim() || !selectedBusiness) {
      alert('피드백 내용을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tax-filing-businesses/${selectedBusiness.id}/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: user?.name,
          content: newFeedback
        })
      });

      const result = await response.json();
      if (result.success) {
        setFeedbackHistory(result.data);
        setNewFeedback('');
        alert('피드백이 추가되었습니다.');
        fetchBusinesses();
      } else {
        alert('피드백 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('피드백 추가 실패:', error);
      alert('피드백 추가 중 오류가 발생했습니다.');
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSummaryStats = () => {
    return {
      total: businesses.length,
      간이: businesses.filter(b => b.business_type === '간이').length,
      일반: businesses.filter(b => b.business_type === '일반').length,
      법인: businesses.filter(b => b.business_type === '법인').length
    };
  };

  const handleExcelDownload = () => {
    try {
      // 엑셀로 내보낼 데이터 준비
      const excelData = filteredBusinesses.map((business, index) => ({
        '번호': index + 1,
        '영업자': business.salesperson_name,
        '업체명': business.business_name,
        '형태': business.business_type,
        '대표자': business.representative,
        '연락처': business.contact,
        '사업자번호': business.business_number || '-',
        '홈택스 ID': business.hometax_id || '-',
        '주소': business.address || '-',
        '추가정보': business.additional_info || '-',
        '등록일': new Date(business.created_at).toLocaleDateString('ko-KR'),
        '피드백 개수': (() => {
          try {
            const history = business.feedback ? JSON.parse(business.feedback) : [];
            return Array.isArray(history) ? history.length : 0;
          } catch {
            return business.feedback ? 1 : 0;
          }
        })()
      }));

      // 워크시트 생성
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 설정
      const colWidths = [
        { wch: 5 },  // 번호
        { wch: 10 }, // 영업자
        { wch: 25 }, // 업체명
        { wch: 8 },  // 형태
        { wch: 10 }, // 대표자
        { wch: 15 }, // 연락처
        { wch: 15 }, // 사업자번호
        { wch: 15 }, // 홈택스 ID
        { wch: 30 }, // 주소
        { wch: 30 }, // 추가정보
        { wch: 12 }, // 등록일
        { wch: 10 }  // 피드백 개수
      ];
      ws['!cols'] = colWidths;

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '신고대리 전체');

      // 파일 다운로드
      const fileName = `신고대리_전체사업장_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      alert(`${filteredBusinesses.length}개의 사업장 정보가 다운로드되었습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const stats = getSummaryStats();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building2 className="w-6 h-6 mr-2" />
          신고대리 전체 관리
        </h1>
        <p className="text-gray-600 mt-1">모든 영업자의 사업장 정보를 조회하고 관리하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-90">전체 사업장</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
          <div className="text-2xl font-bold">{stats.간이}</div>
          <div className="text-sm opacity-90">간이사업자</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
          <div className="text-2xl font-bold">{stats.일반}</div>
          <div className="text-sm opacity-90">일반사업자</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow p-4 text-white">
          <div className="text-2xl font-bold">{stats.법인}</div>
          <div className="text-sm opacity-90">법인사업자</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사업장 유형</label>
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="간이">간이</option>
              <option value="일반">일반</option>
              <option value="법인">법인</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="업체명, 영업자명, 대표자명, 연락처 검색..."
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">데이터 내보내기</label>
            <button
              onClick={handleExcelDownload}
              disabled={filteredBusinesses.length === 0}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 사업장 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">영업자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">형태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대표자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">홈택스 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">피드백</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    {searchTerm || selectedBusinessType !== 'all' ? '검색 결과가 없습니다.' : '등록된 사업장이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{business.salesperson_name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{business.business_name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        business.business_type === '간이' ? 'bg-green-100 text-green-800' :
                        business.business_type === '일반' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {business.business_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{business.representative}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{business.contact}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{business.hometax_id || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(business.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleShowFeedback(business)}
                        className="inline-flex items-center justify-center space-x-1 text-purple-600 hover:text-purple-800 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                          {(() => {
                            try {
                              const history = business.feedback ? JSON.parse(business.feedback) : [];
                              return Array.isArray(history) ? history.length : 0;
                            } catch {
                              return business.feedback ? 1 : 0;
                            }
                          })()}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleShowDetail(business)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(business)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 피드백 모달 */}
      {showFeedbackModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div>
                <h2 className="text-2xl font-bold">{selectedBusiness.business_name}</h2>
                <p className="text-sm opacity-90 mt-1">영업자: {selectedBusiness.salesperson_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setNewFeedback('');
                }}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {feedbackHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>아직 작성된 피드백이 없습니다.</p>
                  <p className="text-sm mt-2">첫 번째 피드백을 작성해보세요!</p>
                </div>
              ) : (
                feedbackHistory.map((feedback, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {feedback.author}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(feedback.timestamp)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="bg-white rounded p-3 mt-2 border border-gray-100">
                      <p className="text-gray-800 whitespace-pre-wrap">{feedback.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 피드백 작성
              </label>
              <textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="피드백 내용을 입력하세요..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleAddFeedback}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>피드백 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div>
                <h2 className="text-2xl font-bold">{selectedBusiness.business_name}</h2>
                <p className="text-sm opacity-90 mt-1">영업자: {selectedBusiness.salesperson_name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">업체명</label>
                    <p className="text-gray-900 font-medium">{selectedBusiness.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">형태</label>
                    <p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        selectedBusiness.business_type === '간이' ? 'bg-green-100 text-green-800' :
                        selectedBusiness.business_type === '일반' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {selectedBusiness.business_type}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">대표자</label>
                    <p className="text-gray-900 font-medium">{selectedBusiness.representative}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">연락처</label>
                    <p className="text-gray-900 font-medium">{selectedBusiness.contact}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">사업자등록번호</label>
                    <p className="text-gray-900 font-medium">{selectedBusiness.business_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">주소</label>
                    <p className="text-gray-900">{selectedBusiness.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 홈택스 정보 */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">홈택스 계정 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">홈택스 ID</label>
                    <p className="text-gray-900 font-medium font-mono">{selectedBusiness.hometax_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">홈택스 비밀번호</label>
                    <p className="text-gray-900 font-medium font-mono">
                      {selectedBusiness.hometax_password ? '••••••••' : '-'}
                      {selectedBusiness.hometax_password && (
                        <button
                          onClick={() => {
                            if (confirm('비밀번호를 복사하시겠습니까?')) {
                              navigator.clipboard.writeText(selectedBusiness.hometax_password);
                              alert('비밀번호가 복사되었습니다.');
                            }
                          }}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          복사
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              {selectedBusiness.additional_info && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">추가 정보</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedBusiness.additional_info}</p>
                  </div>
                </div>
              )}

              {/* 등록/수정 일시 */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">시스템 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">등록일시</label>
                    <p className="text-gray-900">{formatDateTime(selectedBusiness.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">최종 수정일시</label>
                    <p className="text-gray-900">{formatDateTime(selectedBusiness.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxFilingManagement;
