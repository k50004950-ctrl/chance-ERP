import React, { useState, useEffect } from 'react';
import { XCircle, Search, Plus, Trash2, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import { formatDateToKorean } from '../../utils/dateFormat';
import * as XLSX from 'xlsx';

interface CompletedDB {
  id: number;
  company_name: string;
  representative: string;
  salesperson_id: number;
  salesperson_name: string;
  contract_date: string;
  actual_sales: number;
  contract_month: string;
}

interface Cancellation {
  id: number;
  sales_db_id: number;
  salesperson_id: number;
  salesperson_name: string;
  company_name: string;
  cancelled_by: number;
  canceller_name: string;
  cancellation_reason: string;
  payment_months: number;
  refund_amount: number;
  original_contract_date: string;
  original_actual_sales: number;
  cancelled_at: string;
  notes: string;
  contract_date: string;
  contract_month: string;
}

const ContractCancellation: React.FC = () => {
  const { user } = useAuth();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [completedDBs, setCompletedDBs] = useState<CompletedDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDB, setSelectedDB] = useState<CompletedDB | null>(null);
  
  const [formData, setFormData] = useState({
    cancellation_reason: '',
    payment_months: 0,
    refund_amount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-cancellations`);
      const result = await response.json();
      if (result.success) {
        setCancellations(result.data);
      }
    } catch (error) {
      console.error('계약취소 목록 조회 실패:', error);
    }
  };

  const fetchCompletedDBs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/completed?search=${searchTerm}`);
      const result = await response.json();
      if (result.success) {
        setCompletedDBs(result.data);
      }
    } catch (error) {
      console.error('계약완료 DB 조회 실패:', error);
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setSelectedDB(null);
    setFormData({
      cancellation_reason: '',
      payment_months: 0,
      refund_amount: 0,
      notes: ''
    });
    fetchCompletedDBs();
  };

  const handleSubmit = async () => {
    if (!selectedDB) {
      alert('해지할 계약을 선택하세요.');
      return;
    }

    if (!formData.cancellation_reason.trim()) {
      alert('해지 사유를 입력하세요.');
      return;
    }

    if (formData.refund_amount <= 0) {
      alert('환수금액을 입력하세요.');
      return;
    }

    if (!window.confirm(`${selectedDB.company_name} 계약을 해지하시겠습니까?\n환수금액: ${formData.refund_amount.toLocaleString()}원`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-cancellations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_db_id: selectedDB.id,
          cancelled_by: user?.id,
          canceller_name: user?.name,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ 계약해지가 등록되었습니다.\n환수금액이 수수료 명세서에 자동으로 반영됩니다.');
        setShowAddModal(false);
        fetchCancellations();
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('계약해지 등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number, companyName: string) => {
    if (!window.confirm(`${companyName}의 계약해지를 삭제하시겠습니까?\n(계약 상태가 다시 '계약완료'로 변경되고, 환수금액도 수수료 명세서에서 제거됩니다)`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/contract-cancellations/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ 계약해지가 삭제되었습니다.');
        fetchCancellations();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('계약해지 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExcelDownload = () => {
    const excelData = cancellations.map(c => ({
      '해지일': formatDateToKorean(c.cancelled_at.split(' ')[0]),
      '업체명': c.company_name,
      '담당영업자': c.salesperson_name,
      '원계약일': formatDateToKorean(c.original_contract_date),
      '원계약금액': c.original_actual_sales || 0,
      '해지사유': c.cancellation_reason,
      '납부개월': c.payment_months,
      '환수금액': c.refund_amount,
      '처리자': c.canceller_name,
      '비고': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '계약해지');
    
    const date = new Date();
    const filename = `계약해지_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <XCircle className="w-7 h-7 mr-2 text-red-600" />
              계약해지 관리
            </h1>
            <p className="text-gray-600 mt-1">계약 해지 처리 및 환수금액 관리</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExcelDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Download className="w-5 h-5" />
              <span>엑셀 다운로드</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition"
            >
              <Plus className="w-5 h-5" />
              <span>계약해지 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 해지건수</p>
              <p className="text-2xl font-bold text-gray-900">{cancellations.length}건</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 환수금액</p>
              <p className="text-2xl font-bold text-red-600">
                {cancellations.reduce((sum, c) => sum + c.refund_amount, 0).toLocaleString()}원
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번달 해지</p>
              <p className="text-2xl font-bold text-gray-900">
                {cancellations.filter(c => c.cancelled_at.startsWith(new Date().toISOString().slice(0, 7))).length}건
              </p>
            </div>
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* 해지 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">해지일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업체명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당영업자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">원계약일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">원계약금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">해지사유</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">납부개월</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-red-50">환수금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리자</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cancellations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    계약해지 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                cancellations.map((cancellation) => (
                  <tr key={cancellation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateToKorean(cancellation.cancelled_at.split(' ')[0])}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {cancellation.company_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cancellation.salesperson_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateToKorean(cancellation.original_contract_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(cancellation.original_actual_sales || 0).toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cancellation.cancellation_reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cancellation.payment_months}개월
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 bg-red-50">
                      {cancellation.refund_amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {cancellation.canceller_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(cancellation.id, cancellation.company_name)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계약해지 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <XCircle className="w-6 h-6 mr-2 text-red-600" />
                계약해지 등록
              </h2>

              {/* Step 1: 계약 선택 */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">1. 해지할 계약 선택</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="업체명, 대표자, 영업자로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={fetchCompletedDBs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    검색
                  </button>
                </div>

                {selectedDB ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{selectedDB.company_name}</p>
                        <p className="text-sm text-gray-600">
                          담당: {selectedDB.salesperson_name} | 
                          계약일: {formatDateToKorean(selectedDB.contract_date)} | 
                          계약금액: {(selectedDB.actual_sales || 0).toLocaleString()}원
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedDB(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                    {completedDBs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        검색 버튼을 눌러 계약완료된 DB를 조회하세요.
                      </div>
                    ) : (
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">업체명</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">담당자</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">계약일</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">계약금액</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">선택</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {completedDBs.map((db) => (
                            <tr key={db.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{db.company_name}</td>
                              <td className="px-4 py-2 text-sm">{db.salesperson_name}</td>
                              <td className="px-4 py-2 text-sm">{formatDateToKorean(db.contract_date)}</td>
                              <td className="px-4 py-2 text-sm">{(db.actual_sales || 0).toLocaleString()}원</td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => setSelectedDB(db)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                  선택
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: 해지 정보 입력 */}
              <div className="space-y-4">
                <h3 className="font-semibold">2. 해지 정보 입력</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    해지 사유 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cancellation_reason}
                    onChange={(e) => setFormData({ ...formData, cancellation_reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 고객 요청, 계약 위반 등"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      납부개월
                    </label>
                    <input
                      type="number"
                      value={formData.payment_months}
                      onChange={(e) => setFormData({ ...formData, payment_months: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      환수금액 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.refund_amount}
                      onChange={(e) => setFormData({ ...formData, refund_amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비고
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="추가 메모..."
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  계약해지 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractCancellation;
