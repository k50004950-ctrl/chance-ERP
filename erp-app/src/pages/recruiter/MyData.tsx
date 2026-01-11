import React, { useState, useEffect } from 'react';
import { Edit, Save, X, UserCheck, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDateToKorean } from '../../utils/dateFormat';
import KoreanDatePicker from '../../components/KoreanDatePicker';

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

const RecruiterMyData: React.FC = () => {
  const [myData, setMyData] = useState<MyDataItem[]>([]);
  const [filteredData, setFilteredData] = useState<MyDataItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (user.role === 'recruiter') {
      fetchMyData(user.name);
      fetchSalespersons();
    }
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

  const fetchMyData = async (proposerName: string) => {
    if (!proposerName) return;
    
    try {
      const response = await fetch(`/api/sales-db/my-data-recruiter?proposer=${encodeURIComponent(proposerName)}`);
      const result = await response.json();
      if (result.success) {
        setMyData(result.data);
        setFilteredData(result.data);
        
        // 연도 목록 추출 (proposal_date 기준)
        const years = new Set<string>();
        result.data.forEach((item: MyDataItem) => {
          if (item.proposal_date) {
            const year = item.proposal_date.substring(0, 4);
            years.add(year);
          }
        });
        const yearList = Array.from(years).sort((a, b) => b.localeCompare(a));
        setAvailableYears(yearList);
        
        // 기본값: 현재 연도와 월
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        
        if (yearList.includes(currentYear)) {
          setSelectedYear(currentYear);
          setSelectedMonth(currentMonth);
          filterDataByMonth(result.data, currentYear, currentMonth);
        } else if (yearList.length > 0) {
          setSelectedYear(yearList[0]);
          setSelectedMonth('');
        }
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  const filterDataByMonth = (data: MyDataItem[], year: string, month: string) => {
    if (!year) {
      setFilteredData(data);
      return;
    }
    
    let filtered = data.filter(item => {
      if (!item.proposal_date) return false;
      const itemYear = item.proposal_date.substring(0, 4);
      return itemYear === year;
    });
    
    if (month) {
      filtered = filtered.filter(item => {
        const itemMonth = item.proposal_date.substring(5, 7);
        return itemMonth === month;
      });
    }
    
    setFilteredData(filtered);
  };

  useEffect(() => {
    if (myData.length > 0) {
      filterDataByMonth(myData, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleCancel = () => {
    setEditingId(null);
    if (currentUser) {
      fetchMyData(currentUser.name);
    }
  };

  const handleSave = async (item: MyDataItem) => {
    try {
      const response = await fetch(`/api/sales-db/${item.id}/recruiter-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_date: item.proposal_date,
          meeting_status: item.meeting_status,
          salesperson_id: item.salesperson_id,
          proposer: currentUser.name,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        fetchMyData(currentUser.name);
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (id: number, field: string, value: string | number) => {
    setMyData(myData.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (!currentUser || currentUser.role !== 'recruiter') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">섭외자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">내 DB 관리</h1>
            <p className="text-gray-600 mt-1">
              내가 섭외한 업체 정보를 확인하고 수정하세요
            </p>
          </div>
        </div>
        <p className="text-sm text-blue-600 mt-3">
          ※ 설의날짜, 미팅여부, 담당영업자 필드만 수정 가능합니다.
        </p>
      </div>

      {/* 실적 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 섭외</p>
              <p className="text-2xl font-bold text-gray-800">{filteredData.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미팅완료 (실적)</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredData.filter(item => item.meeting_status === '미팅완료').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">재확인요청</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredData.filter(item => item.meeting_status === '일정재확인요청').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">미팅거절</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredData.filter(item => item.meeting_status === '미팅거절').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* 월별 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">연도:</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>
          
          {selectedYear && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-semibold text-gray-700">월:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
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
          )}
          
          <div className="ml-auto">
            <span className="text-sm text-gray-600">
              총 <strong className="text-blue-600">{filteredData.length}</strong>개 업체
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">설의날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">업체명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">주소</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">미팅여부</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap bg-blue-50">담당영업자</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  {selectedYear || selectedMonth ? '해당 기간에 섭외한 업체가 없습니다.' : '섭외한 업체 데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <KoreanDatePicker
                        selected={item.proposal_date ? new Date(item.proposal_date) : null}
                        onChange={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            handleChange(item.id, 'proposal_date', `${year}-${month}-${day}`);
                          } else {
                            handleChange(item.id, 'proposal_date', '');
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholderText="날짜 선택"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{formatDateToKorean(item.proposal_date) || '-'}</span>
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
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {item.address || '-'}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <select
                        value={item.meeting_status || ''}
                        onChange={(e) => handleChange(item.id, 'meeting_status', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        <option value="미팅완료">미팅완료</option>
                        <option value="일정재확인요청">일정재확인요청</option>
                        <option value="미팅거절">미팅거절</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        item.meeting_status === '미팅완료' ? 'bg-green-100 text-green-800' :
                        item.meeting_status === '일정재확인요청' ? 'bg-yellow-100 text-yellow-800' :
                        item.meeting_status === '미팅거절' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.meeting_status || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 bg-blue-50">
                    {editingId === item.id ? (
                      <select
                        value={item.salesperson_id || ''}
                        onChange={(e) => handleChange(item.id, 'salesperson_id', Number(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택</option>
                        {salespersons.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {salespersons.find(sp => sp.id === item.salesperson_id)?.name || '-'}
                      </span>
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

export default RecruiterMyData;
