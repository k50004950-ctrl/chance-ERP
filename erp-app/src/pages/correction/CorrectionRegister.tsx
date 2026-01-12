import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../lib/api';

const CorrectionRegister: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    company_name: '',
    representative: '',
    special_relation: '',
    first_startup: 'X',
    correction_in_progress: 'N',
    additional_workplace: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name || !formData.representative) {
      alert('업체명과 대표자는 필수 입력 항목입니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/correction-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writer_id: user?.id,
          writer_name: user?.name,
          ...formData
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('경정청구 요청이 등록되었습니다.');
        window.location.href = '/correction/list';
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.location.href = '/correction/list'}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          목록으로 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-800">경정청구 요청 등록</h1>
        <p className="text-gray-600 mt-1">경정청구 검토 요청을 등록합니다</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 영업담당자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              영업담당자 (계정주) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          {/* 업체명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              업체명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="업체명을 입력하세요"
            />
          </div>

          {/* 대표자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대표자 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="representative"
              value={formData.representative}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="대표자명을 입력하세요"
            />
          </div>

          {/* 특수관계자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              특수관계자
            </label>
            <input
              type="text"
              name="special_relation"
              value={formData.special_relation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="특수관계자 정보를 입력하세요"
            />
          </div>

          {/* 최초창업여부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최초창업여부 <span className="text-red-500">*</span>
            </label>
            <select
              name="first_startup"
              value={formData.first_startup}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="O">O (최초창업)</option>
              <option value="X">X (재창업)</option>
            </select>
          </div>

          {/* 경정진행여부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              경정진행여부 <span className="text-red-500">*</span>
            </label>
            <select
              name="correction_in_progress"
              value={formData.correction_in_progress}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Y">Y (진행중)</option>
              <option value="N">N (미진행)</option>
            </select>
          </div>

          {/* 추가사업장여부 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가사업장여부
            </label>
            <textarea
              name="additional_workplace"
              value={formData.additional_workplace}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="추가사업장 정보를 입력하세요"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.location.href = '/correction/list'}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition"
          >
            <Save className="w-5 h-5" />
            <span>등록</span>
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 안내사항</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 경정청구 요청을 등록하면 검토담당자가 확인하고 검토 결과를 입력합니다.</li>
            <li>• 검토 결과는 '환급가능', '환급불가', '자료수집X' 중 하나로 표시됩니다.</li>
            <li>• '자료수집X'로 표시된 건은 실적 집계에서 제외됩니다.</li>
            <li>• 환급가능으로 확정되면 시스템에서 자동으로 공지가 발송됩니다.</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CorrectionRegister;
