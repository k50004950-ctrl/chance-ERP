import React, { useState, useEffect } from 'react';
import { Phone, Calendar, User, Building2, MessageSquare, Star, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';
import KoreanDatePicker from '../../components/KoreanDatePicker';

const HappyCallRegister: React.FC = () => {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    salesperson_id: '',
    salesperson_name: '',
    client_name: '',
    client_contact: '',
    call_date: new Date().toISOString().split('T')[0],
    call_content: '',
    score: '',
    notes: ''
  });

  useEffect(() => {
    fetchSalespersons();
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/salespersons`);
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 오류:', error);
    }
  };

  const handleSalespersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = salespersons.find(s => s.id === parseInt(selectedId));
    setFormData({
      ...formData,
      salesperson_id: selectedId,
      salesperson_name: selected?.name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.score) {
      alert('고객 만족도를 선택해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/happycalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          happycall_staff_id: user?.id,
          happycall_staff_name: user?.name,
          ...formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message || '해피콜이 등록되었습니다.');
        // 폼 초기화
        setFormData({
          salesperson_id: '',
          salesperson_name: '',
          client_name: '',
          client_contact: '',
          call_date: new Date().toISOString().split('T')[0],
          call_content: '',
          score: '',
          notes: ''
        });
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('해피콜 등록 오류:', error);
      alert('해피콜 등록 중 오류가 발생했습니다.');
    }
  };

  const getScoreBadge = (score: string) => {
    const badges = {
      '상': 'bg-green-100 text-green-800 border-green-300',
      '중': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '하': 'bg-red-100 text-red-800 border-red-300'
    };
    return badges[score as keyof typeof badges] || '';
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Phone className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">해피콜 등록</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">고객과의 통화 내용을 기록하고 만족도를 평가하세요</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-6">
        {/* 담당 영업자 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            <span>담당 영업자</span>
          </label>
          <select
            value={formData.salesperson_id}
            onChange={handleSalespersonChange}
            className="mobile-form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택해주세요</option>
            {salespersons.map(person => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        {/* 고객명 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4" />
            <span>고객명 (회사명) <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            className="mobile-form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="회사명 또는 고객명을 입력하세요"
            required
          />
        </div>

        {/* 고객 연락처 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4" />
            <span>고객 연락처</span>
          </label>
          <input
            type="text"
            value={formData.client_contact}
            onChange={(e) => setFormData({ ...formData, client_contact: e.target.value })}
            className="mobile-form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="010-0000-0000"
          />
        </div>

        {/* 통화 날짜 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span>통화 날짜 <span className="text-red-500">*</span></span>
          </label>
          <KoreanDatePicker
            selected={formData.call_date ? new Date(formData.call_date) : new Date()}
            onChange={(date) => setFormData({ ...formData, call_date: date.toISOString().split('T')[0] })}
            className="mobile-form-input"
          />
        </div>

        {/* 통화 내용 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>통화 내용 <span className="text-red-500">*</span></span>
          </label>
          <textarea
            value={formData.call_content}
            onChange={(e) => setFormData({ ...formData, call_content: e.target.value })}
            className="mobile-form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            placeholder="고객과의 통화 내용을 상세히 기록해주세요"
            required
          />
        </div>

        {/* 고객 만족도 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Star className="w-4 h-4" />
            <span>고객 만족도 <span className="text-red-500">*</span></span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['상', '중', '하'].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setFormData({ ...formData, score })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.score === score
                    ? `${getScoreBadge(score)} border-2`
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {score === '상' && '😊'}
                    {score === '중' && '😐'}
                    {score === '하' && '😞'}
                  </div>
                  <div className="text-lg font-bold">{score}</div>
                </div>
              </button>
            ))}
          </div>
          {formData.score === '하' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ '하' 평가 시 관리자와 담당 영업자에게 자동으로 알림이 전송됩니다.
              </p>
            </div>
          )}
        </div>

        {/* 비고 */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>비고</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mobile-form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="추가 메모사항이 있다면 입력해주세요"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 touch-target"
          >
            <Save className="w-5 h-5" />
            <span>해피콜 등록</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HappyCallRegister;
