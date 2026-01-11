import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface SalesClient {
  id?: number;
  client_name: string;
  commission_rate: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

const SalesClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<SalesClient>({
    client_name: '',
    commission_rate: 0,
    description: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/sales-clients');
      const result = await response.json();
      if (result.success) {
        setClients(result.data);
      }
    } catch (error) {
      console.error('거래처 목록 조회 실패:', error);
    }
  };

  const handleAdd = () => {
    setFormData({
      client_name: '',
      commission_rate: 0,
      description: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (client: SalesClient) => {
    setEditingId(client.id || null);
  };

  const handleSave = async (client: SalesClient) => {
    if (!client.id) return;

    try {
      const response = await fetch(`/api/sales-clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });

      const result = await response.json();
      if (result.success) {
        alert('저장되었습니다.');
        setEditingId(null);
        loadClients();
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/sales-clients/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        loadClients();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_name.trim()) {
      alert('거래처명을 입력하세요.');
      return;
    }

    try {
      const response = await fetch('/api/sales-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        alert('거래처가 추가되었습니다.');
        setShowAddModal(false);
        loadClients();
      } else {
        alert('추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('추가 실패:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (id: number, field: keyof SalesClient, value: string | number) => {
    setClients(clients.map(client =>
      client.id === id ? { ...client, [field]: value } : client
    ));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">매출거래처 관리</h1>
          <p className="text-gray-600 mt-1">거래처별 수수료율(%)을 관리합니다 (예: 600% = 계약기장료의 6배)</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>거래처 추가</span>
        </button>
      </div>

      {/* 거래처 목록 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                거래처명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                수수료율 (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                설명
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">등록된 거래처가 없습니다</p>
                  <p className="text-sm">거래처 추가 버튼을 눌러 새 거래처를 등록하세요</p>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingId === client.id ? (
                      <input
                        type="text"
                        value={client.client_name}
                        onChange={(e) => handleChange(client.id!, 'client_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{client.client_name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === client.id ? (
                      <input
                        type="number"
                        value={client.commission_rate}
                        onChange={(e) => handleChange(client.id!, 'commission_rate', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 600"
                      />
                    ) : (
                      <span className="text-gray-900">{client.commission_rate}%</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === client.id ? (
                      <input
                        type="text"
                        value={client.description}
                        onChange={(e) => handleChange(client.id!, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="설명 (선택사항)"
                      />
                    ) : (
                      <span className="text-gray-600">{client.description || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      {editingId === client.id ? (
                        <>
                          <button
                            onClick={() => handleSave(client)}
                            className="text-blue-600 hover:text-blue-900"
                            title="저장"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              loadClients();
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="취소"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(client)}
                            className="text-gray-600 hover:text-gray-900"
                            title="수정"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id!)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 거래처 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 거래처 추가</h2>
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거래처명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수수료율 (%)
                  </label>
                  <input
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 600 (계약기장료의 6배)"
                  />
                  <p className="text-xs text-gray-500 mt-1">예: 600% = 계약기장료 × 6</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택사항)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesClientsManagement;
