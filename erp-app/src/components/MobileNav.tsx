import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* 모바일 상단 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 로고 */}
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏢</span>
            <h1 className="text-sm font-bold text-gray-800">찬스컴퍼니 ERP</h1>
          </div>

          {/* 사용자 정보 & 햄버거 메뉴 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                {user?.name.substring(0, 1)}
              </div>
              <span className="text-xs font-medium text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="py-2">
              {/* 대시보드 */}
              <NavLink
                to="/dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">대시보드</span>
              </NavLink>

              {/* 일반 사용자(employee) 및 섭외자(recruiter) 메뉴 */}
              {(user?.role === 'employee' || user?.role === 'recruiter') && (
                <>
                  <NavLink
                    to="/attendance/clock-in"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">🏢</span>
                    <span className="text-sm font-medium">출근하기</span>
                  </NavLink>
                  <NavLink
                    to="/attendance/clock-out"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">🏃</span>
                    <span className="text-sm font-medium">퇴근하기</span>
                  </NavLink>
                  <NavLink
                    to="/attendance/leave-request"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">✈️</span>
                    <span className="text-sm font-medium">휴가신청</span>
                  </NavLink>
                </>
              )}

              {/* 섭외자 메뉴 */}
              {user?.role === 'recruiter' && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    DB관리
                  </div>
                  <NavLink
                    to="/recruiter/my-data"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">내 DB 관리</span>
                  </NavLink>
                  <NavLink
                    to="/sales-db/register"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">DB등록</span>
                  </NavLink>
                  <NavLink
                    to="/sales-db/search"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">DB검색</span>
                  </NavLink>
                </>
              )}

              {/* 영업사원 메뉴 */}
              {user?.role === 'salesperson' && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    영업자 관리
                  </div>
                  <NavLink
                    to="/salesperson/monthly-ranking"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-sm font-medium">당월 실적 순위</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/commission-statement"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">💰</span>
                    <span className="text-sm font-medium">수수료 명세서</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/register"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📝</span>
                    <span className="text-sm font-medium">내 DB 관리</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/schedules"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium">일정관리</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/memos"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📋</span>
                    <span className="text-sm font-medium">메모관리</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    경정청구
                  </div>
                  <NavLink
                    to="/correction/list"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📝</span>
                    <span className="text-sm font-medium">경정청구 검토</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    설정관리
                  </div>
                  <NavLink
                    to="/settings/my-account"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">👤</span>
                    <span className="text-sm font-medium">내 정보 수정</span>
                  </NavLink>
                </>
              )}

              {/* 관리자 메뉴 */}
              {user?.role === 'admin' && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    인사관리
                  </div>
                  <NavLink
                    to="/hr/employees"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">직원 목록</span>
                  </NavLink>
                  <NavLink
                    to="/hr/attendance"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">근태 현황</span>
                  </NavLink>
                  <NavLink
                    to="/hr/leaves"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">휴가 개별승인</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    DB관리
                  </div>
                  <NavLink
                    to="/sales-db/register"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">DB등록</span>
                  </NavLink>
                  <NavLink
                    to="/sales-db/search"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">DB검색</span>
                  </NavLink>
                  <NavLink
                    to="/admin/recruiter-performance"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">섭외자 개인별 실적</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    업무관리
                  </div>
                  <NavLink
                    to="/salesperson/schedules"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">일정관리</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/memos"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">메모관리</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    영업자 관리
                  </div>
                  <NavLink
                    to="/admin/monthly-performance"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">월별 실적 현황</span>
                  </NavLink>
                  <NavLink
                    to="/admin/salesperson-performance"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">영업자 개인별 실적</span>
                  </NavLink>
                  <NavLink
                    to="/admin/commission-summary"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">전체 수수료 요약</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/commission-statement"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">영업자 수수료 명세서</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/register"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">영업자 DB 입력</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/schedules"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">일정관리</span>
                  </NavLink>
                  <NavLink
                    to="/salesperson/memos"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">메모관리</span>
                  </NavLink>
                  <NavLink
                    to="/admin/salesperson-schedules"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">영업자 일정/메모 관리</span>
                  </NavLink>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    계약 관리
                  </div>
                  <NavLink
                    to="/contract/sales-commission"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">매출 거래처 수수료</span>
                  </NavLink>
                  <NavLink
                    to="/contract/recruitment-commission"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">섭외 거래처 수수료</span>
                  </NavLink>
                </>
              )}

              {/* 해피콜 - 관리자 */}
              {user?.role === 'admin' && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    해피콜
                  </div>
                  <NavLink
                    to="/happycall/list"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📞</span>
                    <span className="text-sm font-medium">해피콜 관리</span>
                  </NavLink>
                </>
              )}

              {/* 해피콜 - 해피콜 직원만 (reviewer는 제외) */}
              {(user?.role === 'happycall' || user?.role === 'employee') && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    해피콜
                  </div>
                  <NavLink
                    to="/happycall/db-list"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-sm font-medium">DB 조회 및 해피콜 입력</span>
                  </NavLink>
                  <NavLink
                    to="/happycall/register"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📞</span>
                    <span className="text-sm font-medium">해피콜 등록</span>
                  </NavLink>
                  <NavLink
                    to="/happycall/list"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-lg">📋</span>
                    <span className="text-sm font-medium">내 해피콜 내역</span>
                  </NavLink>
                </>
              )}

              {/* 경정청구 - 모든 사용자 */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                경정청구
              </div>
              <NavLink
                to="/correction/list"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-lg">📝</span>
                <span className="text-sm font-medium">경정청구 검토</span>
              </NavLink>

              {/* 설정관리 - 모든 사용자 */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                설정관리
              </div>
              {user?.role === 'admin' && (
                <>
                  <NavLink
                    to="/settings/accounts"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">계정설정</span>
                  </NavLink>
                  <NavLink
                    to="/admin/account-change-approval"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">계정 변경 승인</span>
                  </NavLink>
                  <NavLink
                    to="/admin/notice-management"
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">공지사항 관리</span>
                  </NavLink>
                </>
              )}
              <NavLink
                to="/settings/my-account"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <span className="text-sm font-medium">내 정보 수정</span>
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink
                  to="/settings/company"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-sm font-medium">회사 설정</span>
                </NavLink>
              )}

              {/* 로그아웃 */}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상단 헤더 높이만큼 여백 추가 */}
      <div className="md:hidden h-14"></div>
    </>
  );
};

export default MobileNav;


