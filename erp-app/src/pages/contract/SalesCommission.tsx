import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

interface Salesperson {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  contract_type: string;
  client_name: string;
  client_company: string;
  salesperson_id: number;
  salesperson_name: string;
  contract_amount: number;
  commission_rate: number;
  commission_amount: number;
  contract_date: string;
  payment_status: string;
  notes: string;
  created_at: string;
}

const SalesCommission: React.FC = () => {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    salesperson_id: '',
    contract_amount: '',
    commission_rate: '',
    commission_amount: '',
    contract_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchSalespersons();
    fetchContracts();
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      // 영업자인 경우 본인 계약만 조회
      let url = '/api/contracts?type=sales';
      if (user?.role === 'salesperson' && user?.id) {
        url += `&salesperson_id=${user.id}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setContracts(result.data);
      }
    } catch (error) {
      console.error('계약 목록 조회 실패:', error);
    }
  };

  const calculateCommission = () => {
    const amount = parseFloat(formData.contract_amount) || 0;
    const rate = parseFloat(formData.commission_rate) || 0;
    const commission = Math.round(amount * (rate / 100));
    setFormData({
      ...formData,
      commission_amount: commission.toString(),
    });
  };

  useEffect(() => {
    if (formData.contract_amount && formData.commission_rate) {
      calculateCommission();
    }
  }, [formData.contract_amount, formData.commission_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_type: 'sales',
          client_name: formData.client_name,
          client_company: formData.client_company,
          salesperson_id: parseInt(formData.salesperson_id),
          contract_amount: parseInt(formData.contract_amount) || 0,
          commission_rate: parseFloat(formData.commission_rate) || 0,
          commission_amount: parseInt(formData.commission_amount) || 0,
          contract_date: formData.contract_date,
          notes: formData.notes,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('매출 거래처 수수료가 등록되었습니다.');
        setFormData({
          client_name: '',
          client_company: '',
          salesperson_id: '',
          contract_amount: '',
          commission_rate: '',
          commission_amount: '',
          contract_date: '',
          notes: '',
        });
        setShowForm(false);
        fetchContracts();
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('계약 등록 실패:', error);
      alert('계약 등록 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchContracts();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const downloadSampleFile = () => {
    // 샘플 데이터 생성
    const sampleData = [
      {
        '거래처명': '샘플거래처',
        '회사명': '샘플회사',
        '담당영업자ID': '1',
        '계약금액': '10000000',
        '수수료율': '10',
        '계약일': '2026-01-01',
        '메모': '샘플 메모'
      }
    ];

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // 컬럼 너비 설정
    const colWidths = [
      { wch: 15 }, // 거래처명
      { wch: 15 }, // 회사명
      { wch: 15 }, // 담당영업자ID
      { wch: 15 }, // 계약금액
      { wch: 12 }, // 수수료율
      { wch: 12 }, // 계약일
      { wch: 30 }  // 메모
    ];
    ws['!cols'] = colWidths;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '매출거래처수수료');

    // 파일 다운로드
    XLSX.writeFile(wb, '매출거래처수수료_샘플파일.xlsx');
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          const rowData: any = row;
          const response = await fetch('/api/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contract_type: 'sales',
              client_name: rowData['거래처명'] || '',
              client_company: rowData['회사명'] || '',
              salesperson_id: parseInt(rowData['담당영업자ID']) || 0,
              contract_amount: parseInt(rowData['계약금액']) || 0,
              commission_rate: parseFloat(rowData['수수료율']) || 0,
              commission_amount: Math.round((parseInt(rowData['계약금액']) || 0) * (parseFloat(rowData['수수료율']) || 0) / 100),
              contract_date: rowData['계약일'] || '',
              notes: rowData['메모'] || '',
            }),
          });
          const result = await response.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('행 업로드 실패:', error);
          errorCount++;
        }
      }

      alert(`업로드 완료!\n성공: ${successCount}건\n실패: ${errorCount}건`);
      fetchContracts();
    } catch (error) {
      console.error('Excel 파일 파싱 실패:', error);
      alert('Excel 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
      paid: '지급완료',
      pending: '미지급',
      partial: '부분지급',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              매출 거래처 수수료
            </h1>
            <p className="text-gray-600 mt-1">매출 거래처별 수수료를 관리하세요</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadSampleFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              샘플파일
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? '업로드 중...' : 'Excel 업로드'}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              수수료 등록
            </button>
          </div>
        </div>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">매출 거래처 수수료 등록</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래처명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="거래처명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명
                </label>
                <input
                  type="text"
                  name="client_company"
                  value={formData.client_company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="회사명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당 영업자 <span className="text-red-500">*</span>
                </label>
                <select
                  name="salesperson_id"
                  value={formData.salesperson_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {salespersons.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계약일
                </label>
                <input
                  type="date"
                  name="contract_date"
                  value={formData.contract_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계약금액
                </label>
                <input
                  type="number"
                  name="contract_amount"
                  value={formData.contract_amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수수료율 (%)
                </label>
                <input
                  type="number"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수수료 금액
                </label>
                <input
                  type="number"
                  name="commission_amount"
                  value={formData.commission_amount}
                  onChange={handleChange}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="자동 계산"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="추가 정보를 입력하세요"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 계약 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">매출 거래처 목록</h2>
        
        {contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 거래처가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당 영업자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수수료율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수수료 금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약일
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
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contract.client_name}</div>
                      {contract.client_company && (
                        <div className="text-sm text-gray-500">{contract.client_company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.salesperson_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(contract.contract_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {formatCurrency(contract.commission_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contract.contract_date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesCommission;


