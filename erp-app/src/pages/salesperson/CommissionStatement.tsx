import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, Edit, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';

interface Salesperson {
  id: number;
  name: string;
}

interface CommissionDetail {
  id: number;
  company_name: string;
  contract_client: string;
  contract_date: string;
  actual_sales: number;
  commission_rate: number;
  commission_base: number;
  commission_amount: number;
  contract_status: string;
}

interface MiscCommission {
  id?: number;
  salesperson_id: number;
  year: string;
  month: string;
  description: string;
  amount: number;
}

const SalespersonCommissionStatement: React.FC = () => {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [details, setDetails] = useState<CommissionDetail[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [miscCommissions, setMiscCommissions] = useState<MiscCommission[]>([]);
  const [showAddMisc, setShowAddMisc] = useState<boolean>(false);
  const [newMiscDescription, setNewMiscDescription] = useState<string>('');
  const [newMiscAmount, setNewMiscAmount] = useState<string>('');

  useEffect(() => {
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (selectedSalesperson) {
      fetchCommissionDetails();
      fetchMiscCommissions();
    }
  }, [selectedSalesperson, selectedYear, selectedMonth]);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/salespersons`);
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
        
        // 영업자로 로그인한 경우, 본인 ID로 자동 설정
        if (user?.role === 'salesperson' && user?.id) {
          setSelectedSalesperson(user.id.toString());
        } else if (result.data.length > 0) {
          // 관리자인 경우 첫 번째 영업자 선택
          setSelectedSalesperson(result.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchCommissionDetails = async () => {
    if (!selectedSalesperson) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/salesperson/${selectedSalesperson}/commission-details?year=${selectedYear}&month=${selectedMonth}`);
      const result = await response.json();
      if (result.success) {
        setDetails(result.data);
        setIsConfirmed(result.isConfirmed || false);
      }
    } catch (error) {
      console.error('수수료 상세 조회 실패:', error);
    }
  };

  const fetchMiscCommissions = async () => {
    if (!selectedSalesperson) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/misc-commissions?salesperson_id=${selectedSalesperson}&year=${selectedYear}&month=${selectedMonth}`);
      const result = await response.json();
      if (result.success) {
        setMiscCommissions(result.data);
      }
    } catch (error) {
      console.error('기타수수료 조회 실패:', error);
    }
  };

  const handleAddMiscCommission = async () => {
    if (!newMiscDescription || !newMiscAmount) {
      alert('내역과 금액을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/misc-commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: selectedSalesperson,
          year: selectedYear,
          month: selectedMonth,
          description: newMiscDescription,
          amount: parseInt(newMiscAmount.replace(/,/g, ''))
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('기타수수료가 추가되었습니다.');
        setShowAddMisc(false);
        setNewMiscDescription('');
        setNewMiscAmount('');
        fetchMiscCommissions();
      } else {
        alert('추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('추가 실패:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMiscCommission = async (id: number) => {
    if (!confirm('이 기타수수료를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/misc-commissions/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchMiscCommissions();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleConfirm = async () => {
    if (!confirm(`${selectedYear}년 ${selectedMonth}월 수수료를 확정하시겠습니까?\n확정 후에는 수정할 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/commission-statements/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: selectedSalesperson,
          year: selectedYear,
          month: selectedMonth,
          details: details,
          total_commission: totalCommission
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('수수료가 확정되었습니다.');
        fetchCommissionDetails();
      } else {
        alert('확정 실패: ' + result.message);
      }
    } catch (error) {
      console.error('확정 실패:', error);
      alert('확정 중 오류가 발생했습니다.');
    }
  };

  // 계약 수수료 합계
  const contractCommission = details.reduce((sum, item) => {
    return sum + (item.contract_status === '해임' ? -item.commission_amount : item.commission_amount);
  }, 0);

  // 기타 수수료 합계
  const miscCommissionTotal = miscCommissions.reduce((sum, item) => sum + item.amount, 0);

  // 총 수수료
  const totalCommission = contractCommission + miscCommissionTotal;

  // 원천징수 (3.3%)
  const withholdingTax = Math.round(totalCommission * 0.033);

  // 실수령액
  const netPay = totalCommission - withholdingTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditingRate(currentRate.toString());
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales-db/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commission_rate: parseFloat(editingRate) || 500,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEditingId(null);
        fetchCommissionDetails(); // 데이터 새로고침
      }
    } catch (error) {
      console.error('수수료율 저장 실패:', error);
      alert('수수료율 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRate('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          영업자 수수료 명세서
        </h1>
        <p className="text-gray-600 mt-1">계약 완료된 업체별 수수료를 확인하세요 (계약여부='Y'인 항목만 표시)</p>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 영업자 선택 (관리자만) */}
      {user?.role === 'admin' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">영업자:</label>
            <select
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택하세요</option>
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
          )}

          {/* 년도 선택 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">년도:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
          </div>

          {/* 월 선택 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">월:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {i + 1}월
                  </option>
                );
              })}
            </select>
          </div>

          {/* 확정 버튼 (관리자만, 미확정 시에만) */}
          {user?.role === 'admin' && !isConfirmed && selectedSalesperson && (
            <button
              onClick={handleConfirm}
              className="ml-auto px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>확정</span>
            </button>
          )}

          {/* 확정 상태 표시 */}
          {isConfirmed && (
            <div className="ml-auto px-4 py-2 bg-green-100 text-green-800 rounded-lg flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">확정됨</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 영업자 본인 정보 표시 */}
      {user?.role === 'salesperson' && (
        <div className="bg-blue-50 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">영업자:</span>
            <span className="text-sm font-bold text-blue-600">{user.name}</span>
            <span className="text-xs text-gray-500 ml-2">(본인 수수료 명세서)</span>
          </div>
        </div>
      )}

      {/* 수수료 상세 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                계약날짜
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                업체명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                계약기장료
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                매출거래처
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                수수료율 (%)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                수수료
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {selectedSalesperson ? '계약 완료된 데이터가 없습니다.' : '영업자를 선택하세요.'}
                </td>
              </tr>
            ) : (
              <>
                {details.map((detail, index) => (
                  <tr key={index} className={detail.contract_status === '해임' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateToKorean(detail.contract_date) || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {detail.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.actual_sales ? formatCurrency(detail.actual_sales) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm bg-purple-50">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {detail.contract_client || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {editingId === detail.id ? (
                        <input
                          type="number"
                          value={editingRate}
                          onChange={(e) => setEditingRate(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          autoFocus
                        />
                      ) : (
                        `${detail.commission_rate}%`
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                      detail.contract_status === '해임' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {detail.contract_status === '해임' ? '-' : ''}{formatCurrency(detail.commission_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {editingId === detail.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleSave(detail.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(detail.id, detail.commission_rate)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="px-6 py-4 text-right text-sm text-gray-900">
                    계약 수수료 합계
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                    {formatCurrency(contractCommission)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 기타수수료 섹션 */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">기타수수료</h3>
          {user?.role === 'admin' && !isConfirmed && (
            <button
              onClick={() => setShowAddMisc(true)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>추가</span>
            </button>
          )}
        </div>

        {showAddMisc && (
          <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="내역 (예: 교통비, 차감: 벌금)"
                value={newMiscDescription}
                onChange={(e) => setNewMiscDescription(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="금액 (-가능)"
                value={newMiscAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  // 빈 값, 마이너스 부호만, 또는 마이너스가 앞에 있는 숫자 허용
                  if (value === '' || value === '-' || /^-?\d+$/.test(value)) {
                    if (value === '' || value === '-') {
                      setNewMiscAmount(value);
                    } else {
                      setNewMiscAmount(parseInt(value).toLocaleString('ko-KR'));
                    }
                  }
                }}
                className="w-40 px-3 py-2 border border-gray-300 rounded text-right"
              />
              <button
                onClick={handleAddMiscCommission}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setShowAddMisc(false);
                  setNewMiscDescription('');
                  setNewMiscAmount('');
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded"
              >
                취소
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              * 차감 항목은 마이너스(-)로 입력하세요. 예: -50000
            </p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {miscCommissions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              기타수수료가 없습니다.
            </div>
          ) : (
            miscCommissions.map((misc) => (
              <div key={misc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <span className="text-sm text-gray-900">{misc.description}</span>
                <div className="flex items-center space-x-4">
                  <span className={`text-sm font-semibold ${misc.amount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {misc.amount >= 0 ? '+' : ''}{formatCurrency(misc.amount)}
                  </span>
                  {user?.role === 'admin' && !isConfirmed && (
                    <button
                      onClick={() => handleDeleteMiscCommission(misc.id!)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <span className="text-xs">삭제</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-sm text-gray-900">기타수수료 합계</span>
            <span className={`text-sm ${miscCommissionTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {miscCommissionTotal >= 0 ? '+' : ''}{formatCurrency(miscCommissionTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 최종 합계 */}
      <div className="bg-white rounded-lg shadow mt-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-gray-900">계약 수수료</span>
            <span className="font-semibold text-gray-900">{formatCurrency(contractCommission)}</span>
          </div>
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-gray-900">기타 수수료</span>
            <span className={`font-semibold ${miscCommissionTotal >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {miscCommissionTotal >= 0 ? '+' : ''}{formatCurrency(miscCommissionTotal)}
            </span>
          </div>
          <div className="border-t border-gray-300 pt-4">
            <div className="flex items-center justify-between text-xl">
              <span className="font-bold text-gray-900">총 수수료</span>
              <span className="font-bold text-blue-600">{formatCurrency(totalCommission)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-lg text-red-600">
            <span className="font-medium">원천징수 (3.3%)</span>
            <span className="font-semibold">-{formatCurrency(withholdingTax)}</span>
          </div>
          <div className="border-t-2 border-gray-400 pt-4">
            <div className="flex items-center justify-between text-2xl">
              <span className="font-bold text-gray-900">실수령액</span>
              <span className="font-bold text-green-600">{formatCurrency(netPay)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalespersonCommissionStatement;

