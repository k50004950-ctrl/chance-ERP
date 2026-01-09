import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

interface Memo {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

const MemoManagement: React.FC = () => {
  const { user } = useAuth();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);

  const [formData, setFormData] = useState<Memo>({
    user_id: user?.id || 0,
    title: '',
    content: '',
    category: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadMemos();
    }
  }, [user]);

  useEffect(() => {
    filterMemos();
  }, [memos, selectedMonth, searchKeyword]);

  const loadMemos = async () => {
    try {
      const response = await fetch(`/api/memos?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setMemos(result.data);
      }
    } catch (error) {
      console.error('메모 조회 실패:', error);
    }
  };

  const filterMemos = () => {
    let filtered = memos;

    // 월별 필터링
    if (selectedMonth) {
      filtered = filtered.filter(m => {
        const createdDate = m.created_at ? new Date(m.created_at).toISOString().slice(0, 7) : '';
        return createdDate === selectedMonth;
      });
    }

    // 키워드 검색
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(keyword) ||
        m.content.toLowerCase().includes(keyword) ||
        m.category?.toLowerCase().includes(keyword)
      );
    }

    setFilteredMemos(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingMemo ? `/api/memos/${editingMemo.id}` : '/api/memos';
      const method = editingMemo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        await loadMemos();
        handleCloseModal();
      }
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await loadMemos();
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error);
    }
  };

  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setFormData(memo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMemo(null);
    setFormData({
      user_id: user?.id || 0,
      title: '',
      content: '',
      category: ''
    });
  };

  const handleOpenAddModal = () => {
    setEditingMemo(null);
    setFormData({
      user_id: user?.id || 0,
      title: '',
      content: '',
      category: ''
    });
    setShowModal(true);
  };

  // 날짜별로 그룹화
  const groupedMemos = filteredMemos.reduce((acc, memo) => {
    const date = memo.created_at ? new Date(memo.created_at).toISOString().split('T')[0] : '날짜 없음';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(memo);
    return acc;
  }, {} as Record<string, Memo[]>);

  const sortedDates = Object.keys(groupedMemos).sort().reverse();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          메모관리
        </h1>
        <p className="text-gray-600 mt-1">업무 메모를 등록하고 관리하세요</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">월자</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 flex-1 md:max-w-md">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">키워드 검색</label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="키워드를 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={filterMemos}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-1"
            >
              <Search className="w-4 h-4" />
              <span>검색</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center space-x-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>메모등록</span>
          </button>
        </div>
      </div>

      {/* 메모 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  분류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비고
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">등록된 메모가 없습니다</p>
                    <p className="text-sm mt-1">+ 메모등록 버튼을 눌러 메모를 추가하세요</p>
                  </td>
                </tr>
              ) : (
                sortedDates.map((date) => (
                  groupedMemos[date].map((memo, idx) => (
                    <tr key={memo.id} className="hover:bg-gray-50">
                      {idx === 0 ? (
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                          rowSpan={groupedMemos[date].length}
                        >
                          {date !== '날짜 없음' ? date : '-'}
                          {date !== '날짜 없음' && (
                            <>
                              <br />
                              <span className="text-xs text-gray-500">
                                ({new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                              </span>
                            </>
                          )}
                        </td>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {memo.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {memo.category ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {memo.category}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <div className="line-clamp-2">{memo.content}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(memo)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(memo.id!)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 메모 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMemo ? '메모 수정' : '메모 추가'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메모 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  분류 (카테고리)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 업무, 고객, 아이디어 등"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="메모 내용을 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {editingMemo ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoManagement;


