import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Key, Edit, Trash2, X } from 'lucide-react';
import KoreanDatePicker from '../../components/KoreanDatePicker';
import { formatDateToKorean } from '../../utils/dateFormat';
import { API_BASE_URL } from '../../lib/api';

interface Account {
  id: number;
  username: string;
  name: string;
  employeeCode: string;
  employmentStatus: '재직' | '탈퇴';
  accountStatus: '활성' | '탈퇴';
  department: string;
  position: string;
  role: string;
  permissions: string;
  password?: string;
  commission_rate?: number;
  bank_name?: string;
  account_number?: string;
  social_security_number?: string;
  hire_date?: string;
  address?: string;
  emergency_contact?: string;
}

const AccountSettings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '재직' | '탈퇴'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [passwordData, setPasswordData] = useState({ accountId: 0, newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState<Partial<Account>>({
    username: '',
    name: '',
    employeeCode: '',
    employmentStatus: '재직',
    accountStatus: '활성',
    department: '',
    position: '',
    role: 'employee',
    permissions: '',
    password: '',
    bank_name: '',
    account_number: '',
    social_security_number: '',
    hire_date: '',
    address: '',
    emergency_contact: ''
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);

  // 권한 표시 헬퍼 함수
  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      'employee': '일반사용자',
      'admin': '관리자',
      'salesperson': '영업자',
      'recruiter': '섭외자'
    };
    return roleMap[role] || role;
  };

  // API에서 계정 데이터 로드
  const fetchAccounts = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/api/users');
      const result = await response.json();
      if (result.success) {
        const accountsData = result.data.map((user: any) => ({
          id: user.id,
          username: user.username,
          name: user.name,
          employeeCode: user.employee_code || (user.username === 'admin' ? 'ADMIN001' : `EMP${String(user.id).padStart(3, '0')}`),
          employmentStatus: '재직' as const,
          accountStatus: '활성' as const,
          department: user.department || (user.username === 'admin' ? '관리부서' : user.role === 'salesperson' ? '영업팀' : '개발팀'),
          position: user.position || (user.username === 'admin' ? '관리자' : user.role === 'salesperson' ? '영업사원' : '사원'),
          role: user.role === 'admin' ? '관리자' : user.role === 'salesperson' ? '영업자' : user.role === 'recruiter' ? '섭외자' : '일반사용자',
          permissions: '',
          commission_rate: user.commission_rate || 0,
          bank_name: user.bank_name || '',
          account_number: user.account_number || '',
          social_security_number: user.social_security_number || '',
          hire_date: user.hire_date || '',
          address: user.address || '',
          emergency_contact: user.emergency_contact || '',
        }));
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error('계정 조회 실패:', error);
    }
  };

  // 컴포넌트 마운트 시 API에서 데이터 로드
  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setIsEditing(true);
      setEditingId(account.id);
      setFormData({ ...account, password: '' }); // 수정 시 비밀번호는 비우기
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        username: '',
        name: '',
        employeeCode: '',
        employmentStatus: '재직',
        accountStatus: '활성',
        department: '',
        position: '',
        role: 'employee',
        permissions: '',
        password: '',
        bank_name: '',
        account_number: '',
        social_security_number: '',
        hire_date: '',
        address: '',
        emergency_contact: ''
      });
    }
    setShowModal(true);
  };

  const handleOpenPasswordModal = (accountId: number) => {
    setPasswordData({ accountId, newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData({ accountId: 0, newPassword: '', confirmPassword: '' });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (passwordData.newPassword.length < 4) {
      alert('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    
    try {
      const accountToUpdate = accounts.find(acc => acc.id === passwordData.accountId);
      if (!accountToUpdate) return;
      
      // 한글 → 영어 변환
      const roleMapping: { [key: string]: string } = {
        '관리자': 'admin',
        '영업자': 'salesperson',
        '섭외자': 'recruiter',
        '일반사용자': 'employee'
      };
      
      // 이미 영어면 그대로, 한글이면 변환
      const normalizeRole = (role: string): string => {
        if (['admin', 'employee', 'salesperson', 'recruiter'].includes(role)) {
          return role;
        }
        return roleMapping[role] || 'employee';
      };
      
      const response = await fetch(`${API_BASE_URL}/api/users/${passwordData.accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: accountToUpdate.username,
          name: accountToUpdate.name,
          role: normalizeRole(accountToUpdate.role),
          password: passwordData.newPassword,
          department: accountToUpdate.department,
          position: accountToUpdate.position,
          bank_name: accountToUpdate.bank_name,
          account_number: accountToUpdate.account_number,
          social_security_number: accountToUpdate.social_security_number,
          hire_date: accountToUpdate.hire_date,
          address: accountToUpdate.address,
          emergency_contact: accountToUpdate.emergency_contact,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        handleClosePasswordModal();
        fetchAccounts();
      } else {
        alert('비밀번호 변경 실패: ' + result.message);
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      username: '',
      name: '',
      employeeCode: '',
      employmentStatus: '재직',
      accountStatus: '활성',
      department: '',
      position: '',
      role: 'employee',
      permissions: '',
      password: '',
      commission_rate: 0,
      bank_name: '',
      account_number: '',
      social_security_number: '',
      hire_date: '',
      address: '',
      emergency_contact: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 한글 → 영어 변환 (하위 호환성을 위해 유지)
    const roleMapping: { [key: string]: string } = {
      '관리자': 'admin',
      '영업자': 'salesperson',
      '섭외자': 'recruiter',
      '일반사용자': 'employee'
    };
    
    // 이미 영어면 그대로, 한글이면 변환
    const normalizeRole = (role: string | undefined): string => {
      if (!role) return 'employee';
      // 이미 영어 role 값이면 그대로 반환
      if (['admin', 'employee', 'salesperson', 'recruiter'].includes(role)) {
        return role;
      }
      // 한글이면 변환
      return roleMapping[role] || 'employee';
    };
    
    try {
      if (isEditing && editingId) {
        // 수정
        const response = await fetch(`${API_BASE_URL}/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            name: formData.name,
            role: normalizeRole(formData.role),
            password: formData.password || undefined,
            department: formData.department,
            position: formData.position,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            social_security_number: formData.social_security_number,
            hire_date: formData.hire_date,
            address: formData.address,
            emergency_contact: formData.emergency_contact,
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          alert('계정이 수정되었습니다.');
          handleCloseModal();
          fetchAccounts();
        } else {
          alert('수정 실패: ' + result.message);
        }
      } else {
        // 추가 - 비밀번호 필수
        if (!formData.password || formData.password.length < 4) {
          alert('비밀번호는 최소 4자 이상이어야 합니다.');
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            name: formData.name,
            role: normalizeRole(formData.role),
            password: formData.password,
            department: formData.department,
            position: formData.position,
            commission_rate: formData.commission_rate || 0,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            social_security_number: formData.social_security_number,
            hire_date: formData.hire_date,
            address: formData.address,
            emergency_contact: formData.emergency_contact,
          }),
        });
        
        const result = await response.json();
        if (result.success) {
          alert('계정이 추가되었습니다.');
          handleCloseModal();
          fetchAccounts();
        } else {
          alert('추가 실패: ' + result.message);
        }
      }
    } catch (error) {
      console.error('계정 처리 실패:', error);
      alert('계정 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchAccounts();
      } else {
        alert('삭제 실패: ' + result.message);
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleInputChange = (field: keyof Account, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.includes(searchTerm) ||
      account.employeeCode.includes(searchTerm) ||
      account.department.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || account.employmentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === '재직' || status === '활성'
      ? <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">{status}</span>
      : <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">{status}</span>;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">계정설정</h1>
        <p className="text-gray-600 mt-2">시스템 계정을 관리하세요</p>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Left Side - Status Filter and Search */}
          <div className="flex items-center space-x-3">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">재직상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | '재직' | '탈퇴')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">전체</option>
                <option value="재직">재직</option>
                <option value="탈퇴">탈퇴</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="통합검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Side - Add Button */}
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>계정 추가</span>
          </button>
        </div>
      </div>

      {/* Total Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          총 <span className="font-bold text-blue-600">{filteredAccounts.length}</span>개
        </p>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  아이디
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사원번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  재직상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계정상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직급/직책
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {account.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {account.employeeCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(account.employmentStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(account.accountStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {account.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {getRoleDisplayName(account.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 text-xs"
                        title="로그인시청"
                      >
                        로그인시청
                      </button>
                      <button
                        onClick={() => handleOpenModal(account)}
                        className="text-green-600 hover:text-green-900"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenPasswordModal(account.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="비밀번호 수정"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '계정 수정' : '계정 추가'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 아이디 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    아이디 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user01"
                    required
                  />
                </div>

                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                    required
                  />
                </div>

                {/* 사원번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사원번호 <span className="text-gray-500 text-xs ml-2">(자동생성)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode || '자동생성됩니다'}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="자동생성됩니다"
                  />
                </div>

                {/* 부서 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    부서 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="개발팀"
                    required
                  />
                </div>

                {/* 직급 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직급 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사원"
                    required
                  />
                </div>

                {/* 권한 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    권한 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="employee">일반사용자</option>
                    <option value="admin">관리자</option>
                    <option value="salesperson">영업자</option>
                    <option value="recruiter">섭외자</option>
                  </select>
                </div>

                {/* 재직상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    재직상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="재직">재직</option>
                    <option value="탈퇴">탈퇴</option>
                  </select>
                </div>

                {/* 계정상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계정상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.accountStatus}
                    onChange={(e) => handleInputChange('accountStatus', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="활성">활성</option>
                    <option value="탈퇴">탈퇴</option>
                  </select>
                </div>

                {/* 비밀번호 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 {!isEditing && <span className="text-red-500">*</span>}
                    {isEditing && <span className="text-gray-500 text-xs ml-2">(비워두면 기존 비밀번호 유지)</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최소 4자 이상"
                    required={!isEditing}
                  />
                </div>

                {/* 주민번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주민번호
                  </label>
                  <input
                    type="text"
                    value={formData.social_security_number || ''}
                    onChange={(e) => handleInputChange('social_security_number', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000000-0000000"
                  />
                </div>

                {/* 은행명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="국민은행"
                  />
                </div>

                {/* 계좌번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={formData.account_number || ''}
                    onChange={(e) => handleInputChange('account_number', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000000-00-000000"
                  />
                </div>

                {/* 입사일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입사일
                  </label>
                  <KoreanDatePicker
                    selectedDate={formData.hire_date ? new Date(formData.hire_date) : null}
                    onChange={(date) => {
                      const isoDate = date ? date.toISOString().split('T')[0] : '';
                      handleInputChange('hire_date', isoDate);
                    }}
                    placeholderText="입사일 선택"
                  />
                </div>

                {/* 비상연락망 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비상연락망
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact || ''}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-0000-0000"
                  />
                </div>

                {/* 주소 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="서울시 강남구 테헤란로 123"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  {isEditing ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">비밀번호 변경</h2>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* 새 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최소 4자 이상"
                    required
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호 재입력"
                    required
                  />
                </div>

                {/* 안내 메시지 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    • 비밀번호는 최소 4자 이상이어야 합니다.<br />
                    • 새 비밀번호와 확인 비밀번호가 일치해야 합니다.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  변경
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;

