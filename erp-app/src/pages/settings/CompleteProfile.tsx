import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, Building, CreditCard, Calendar, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { API_BASE_URL } from '../../lib/api';

const CompleteProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    department: '',
    position: '',
    bank_name: '',
    account_number: '',
    social_security_number: '',
    hire_date: '',
    address: '',
    emergency_contact: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // 현재 사용자 정보 불러오기
    fetchUserInfo();
  }, [user]);

  const fetchUserInfo = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const userData = result.data;
        setFormData({
          department: userData.department || '',
          position: userData.position || '',
          bank_name: userData.bank_name || '',
          account_number: userData.account_number || '',
          social_security_number: userData.social_security_number || '',
          hire_date: userData.hire_date || '',
          address: userData.address || '',
          emergency_contact: userData.emergency_contact || ''
        });
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 입력 검증
    if (!formData.bank_name || !formData.account_number || !formData.social_security_number) {
      alert('은행명, 계좌번호, 주민번호는 필수 입력 항목입니다.');
      return;
    }

    // 주민번호 형식 검증 (13자리, YYMMDD-XXXXXXX)
    const ssnPattern = /^\d{6}-\d{7}$/;
    if (!ssnPattern.test(formData.social_security_number)) {
      alert('주민번호 형식이 올바르지 않습니다. (예: 900101-1234567)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('프로필이 완성되었습니다! 이제 시스템을 이용하실 수 있습니다.');
        
        // AuthContext의 user 정보 업데이트
        if (updateUser) {
          updateUser({ ...user, ...formData });
        }
        
        // 대시보드로 이동
        if (user?.role === 'admin') {
          navigate('/');
        } else if (user?.role === 'salesperson') {
          navigate('/salesperson-dashboard');
        } else {
          navigate('/');
        }
      } else {
        alert('프로필 저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex items-center space-x-3 mb-3">
            <AlertCircle className="w-8 h-8" />
            <h1 className="text-3xl font-bold">프로필 완성</h1>
          </div>
          <p className="text-blue-100">
            시스템을 이용하시려면 아래 필수 정보를 입력해주세요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 부서 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 mr-1" />
                부서
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 영업팀"
              />
            </div>

            {/* 직책 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-1" />
                직책
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 대리"
              />
            </div>

            {/* 은행명 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 mr-1" />
                은행명 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 국민은행"
                required
              />
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 mr-1" />
                계좌번호 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 123456-78-901234"
                required
              />
            </div>

            {/* 주민번호 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-1" />
                주민번호 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.social_security_number}
                onChange={(e) => setFormData({ ...formData, social_security_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 900101-1234567"
                required
              />
            </div>

            {/* 입사일 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-1" />
                입사일
              </label>
              <KoreanDatePicker
                selected={formData.hire_date ? new Date(formData.hire_date) : null}
                onChange={(date) => {
                  if (date) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    setFormData({ ...formData, hire_date: `${year}-${month}-${day}` });
                  } else {
                    setFormData({ ...formData, hire_date: '' });
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="입사일 선택"
              />
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 서울특별시 강남구 테헤란로 123"
              />
            </div>

            {/* 비상연락망 */}
            <div className="md:col-span-2">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 mr-1" />
                비상연락망
              </label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 010-1234-5678 (보호자 연락처)"
              />
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">필수 입력 항목</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>은행명, 계좌번호: 급여 및 수수료 지급을 위해 필요합니다.</li>
                  <li>주민번호: 생일 축하 공지 및 인사 관리를 위해 필요합니다.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '저장 중...' : '프로필 완성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
