import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign, Edit, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Salesperson {
  id: number;
  name: string;
}

interface CommissionDetail {
  id: number;
  company_name: string;
  contract_client: string;
  contract_date: string;
  commission_rate: number;
  commission_base: number;
  commission_amount: number;
  contract_status: string;
}

const SalespersonCommissionStatement: React.FC = () => {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [details, setDetails] = useState<CommissionDetail[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');

  useEffect(() => {
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (selectedSalesperson) {
      fetchCommissionDetails();
    }
  }, [selectedSalesperson]);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
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
      const response = await fetch(`/api/salesperson/${selectedSalesperson}/commission-details`);
      const result = await response.json();
      if (result.success) {
        setDetails(result.data);
      }
    } catch (error) {
      console.error('수수료 상세 조회 실패:', error);
    }
  };

  const totalCommission = details.reduce((sum, item) => {
    return sum + (item.contract_status === '해임' ? -item.commission_amount : item.commission_amount);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditingRate(currentRate.toString());
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/sales-db/${id}`, {
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

      {/* 영업자 선택 (관리자만 표시) */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">영업자 선택:</label>
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
        </div>
      )}
      
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
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {selectedSalesperson ? '계약 완료된 데이터가 없습니다.' : '영업자를 선택하세요.'}
                </td>
              </tr>
            ) : (
              <>
                {details.map((detail, index) => (
                  <tr key={index} className={detail.contract_status === '해임' ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.contract_date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {detail.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.contract_client ? formatCurrency(parseFloat(detail.contract_client)) : '-'}
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
                    총 수수료
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                    {formatCurrency(totalCommission)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalespersonCommissionStatement;

