import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Users } from 'lucide-react';

interface MyDataItem {
  id: number;
  proposal_date: string;
  proposer: string;
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
  termination_month: string;
  actual_sales: number;
  contract_date: string;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
}

interface Salesperson {
  id: number;
  name: string;
  username: string;
}

const SalespersonMyData: React.FC = () => {
  const [myData, setMyData] = useState<MyDataItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [salespersonId, setSalespersonId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (user.role === 'admin') {
      setIsAdmin(true);
      // 관리자는 영업자 목록을 가져옴
      fetchSalespersons();
    } else if (user.role === 'salesperson') {
      // 영업자는 본인 ID로 설정
      setSalespersonId(user.id);
    }
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
        // 첫 번째 영업자를 기본으로 선택
        if (result.data.length > 0) {
          setSalespersonId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    if (salespersonId) {
      fetchMyData();
    }
  }, [salespersonId]);

  const fetchMyData = async () => {
    if (!salespersonId) return;
    
    try {
      const response = await fetch(`/api/sales-db/my-data?salesperson_id=${salespersonId}`);
      const result = await response.json();
      if (result.success) {
        setMyData(result.data);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    fetchMyData(); // 원래 데이터로 되돌리기
  };

  const handleSave = async (item: MyDataItem) => {
    try {
      const response = await fetch(`/api/sales-db/${item.id}/salesperson-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_date: item.contract_date,
          meeting_status: item.meeting_status,
          contract_client: item.contract_client,
          client_name: item.client_name,
          feedback: item.feedback,
          salesperson_id: salespersonId,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        fetchMyData();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (id: number, field: string, value: string) => {
    setMyData(myData.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (!currentUser || (!isAdmin && currentUser.role !== 'salesperson')) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">접근 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!salespersonId) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">영업자를 선택하세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">영업자 DB 입력</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? '영업자별 담당 업체 정보를 확인하고 수정하세요' : '내가 담당하는 업체 정보를 수정하세요'}
        </p>
        <p className="text-sm text-blue-600 mt-2">
          ※ 계약날짜, 미팅여부, 계약기장료, 거래처, 기타(피드백) 필드만 수정 가능합니다.
        </p>
      </div>

      {/* 관리자용 영업자 선택 드롭다운 */}
      {isAdmin && salespersons.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-600" />
              <label className="text-sm font-semibold text-gray-700">영업자 선택:</label>
            </div>
            <select
              value={salespersonId || ''}
              onChange={(e) => setSalespersonId(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {salespersons.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">미팅여부</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">계약기장료</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">거래처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">기타(피드백)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {myData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  담당하는 업체 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              myData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <input
                        type="date"
                        value={item.contract_date || ''}
                        onChange={(e) => handleChange(item.id, 'contract_date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.contract_date || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {item.company_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.representative || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {item.contact || '-'}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.meeting_status || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="미팅여부"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.meeting_status || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.contract_client || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            handleChange(item.id, 'contract_client', value);
                          }
                        }}
                        onBlur={(e) => {
                          // 포커스를 잃을 때 콤마 포맷팅 적용
                          const value = e.target.value.replace(/,/g, '');
                          if (value && /^\d+$/.test(value)) {
                            e.target.value = Number(value).toLocaleString('ko-KR');
                          }
                        }}
                        onFocus={(e) => {
                          // 포커스를 받을 때 콤마 제거
                          const value = e.target.value.replace(/,/g, '');
                          e.target.value = value;
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                        placeholder="계약기장료"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.contract_client ? Number(item.contract_client.toString().replace(/,/g, '')).toLocaleString('ko-KR') : '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.client_name || ''}
                        onChange={(e) => handleChange(item.id, 'client_name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="거래처"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.client_name || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={item.feedback || ''}
                        onChange={(e) => handleChange(item.id, 'feedback', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="기타(피드백)"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{item.feedback || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleSave(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="저장"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalespersonMyData;
