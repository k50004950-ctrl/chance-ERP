import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Calendar, 
  UserCheck, 
  Briefcase,
  ChevronDown,
  Home,
  Settings,
  FileText,
  ClipboardList,
  UserPlus,
  Clock,
  Building,
  CalendarCheck,
  LogOut,
  BarChart3,
  ShoppingCart,
  CheckCircle,
  User,
  Search,
  Database,
  DollarSign,
  FileSignature,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SubMenuItem {
  title: string;
  path: string;
  icon?: React.ReactNode;
}

interface ChildMenuItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  children?: SubMenuItem[];
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: ChildMenuItem[];
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['인사관리', 'DB관리', '영업자 관리', '계약 관리', '설정관리']);
  const [expandedSubMenus, setExpandedSubMenus] = useState<string[]>(['근태관리', '휴가관리']);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 출퇴근 시간 로드
  React.useEffect(() => {
    const loadAttendanceTime = () => {
      if (user?.username) {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `erp_attendance_${user.username}_${today}`;
        const todayAttendance = localStorage.getItem(storageKey);
        
        if (todayAttendance) {
          const attendance = JSON.parse(todayAttendance);
          setClockInTime(attendance.clockInTime || null);
          setClockOutTime(attendance.clockOutTime || null);
        } else {
          setClockInTime(null);
          setClockOutTime(null);
        }
      }
    };

    // 초기 로드
    loadAttendanceTime();

    // 5초마다 업데이트
    const interval = setInterval(loadAttendanceTime, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // 관리자만 볼 수 있는 메뉴
  const adminMenuItems: MenuItem[] = [
    {
      title: '인사관리',
      icon: <Users className="w-4 h-4" />,
      children: [
        { 
          title: '직원목록', 
          path: '/hr/employees', 
          icon: <UserPlus className="w-4 h-4" /> 
        },
        {
          title: '근태관리',
          icon: <Clock className="w-4 h-4" />,
          children: [
            { title: '근태현황', path: '/hr/attendance', icon: <UserCheck className="w-4 h-4" /> },
            { title: '휴가캘린더', path: '/hr/attendance-status', icon: <CalendarCheck className="w-4 h-4" /> },
          ],
        },
        {
          title: '휴가관리',
          icon: <Calendar className="w-4 h-4" />,
          children: [
            { title: '휴가 개별승인', path: '/hr/leaves', icon: <CalendarCheck className="w-4 h-4" /> },
          ],
        },
      ],
    },
    {
      title: 'DB관리',
      icon: <Database className="w-4 h-4" />,
      children: [
        { title: 'DB등록', path: '/sales-db/register', icon: <UserPlus className="w-4 h-4" /> },
        { title: 'DB검색', path: '/sales-db/search', icon: <Search className="w-4 h-4" /> },
        { title: '섭외자 개인별 실적', path: '/admin/recruiter-performance', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: '영업자 관리',
      icon: <TrendingUp className="w-4 h-4" />,
      children: [
        { title: '월별 실적 현황', path: '/admin/monthly-performance', icon: <BarChart3 className="w-4 h-4" /> },
        { title: '영업자 개인별 실적', path: '/admin/salesperson-performance', icon: <Users className="w-4 h-4" /> },
        { title: '전체 수수료 요약', path: '/admin/commission-summary', icon: <TrendingUp className="w-4 h-4" /> },
        { title: '영업자 수수료 명세서', path: '/salesperson/commission-statement', icon: <FileText className="w-4 h-4" /> },
        { title: '영업자 DB 입력', path: '/salesperson/register', icon: <UserPlus className="w-4 h-4" /> },
        { title: '영업자 일정/메모 관리', path: '/admin/salesperson-schedules', icon: <Calendar className="w-4 h-4" /> },
        { title: '매출거래처 관리', path: '/admin/sales-clients', icon: <Database className="w-4 h-4" /> },
      ],
    },
    {
      title: '계약 관리',
      icon: <FileSignature className="w-4 h-4" />,
      children: [
        { title: '매출 거래처 수수료', path: '/contract/sales-commission', icon: <DollarSign className="w-4 h-4" /> },
        { title: '섭외 거래처 수수료', path: '/contract/recruitment-commission', icon: <DollarSign className="w-4 h-4" /> },
      ],
    },
    {
      title: '설정관리',
      icon: <Settings className="w-4 h-4" />,
      children: [
        ...(user?.role === 'admin' ? [
          { title: '계정설정', path: '/settings/accounts', icon: <Users className="w-4 h-4" /> },
          { title: '계정 변경 승인', path: '/admin/account-change-approval', icon: <CheckCircle className="w-4 h-4" /> },
          { title: '공지사항 관리', path: '/admin/notice-management', icon: <Bell className="w-4 h-4" /> },
        ] : []),
        { title: '내 정보 수정', path: '/settings/my-account', icon: <User className="w-4 h-4" /> },
        ...(user?.role === 'admin' ? [
          { title: '회사 설정', path: '/settings/company', icon: <Briefcase className="w-4 h-4" /> },
        ] : []),
      ],
    },
  ];

  // 영업자용 메뉴
  const salespersonMenuItems: MenuItem[] = [
    {
      title: '영업자 관리',
      icon: <TrendingUp className="w-4 h-4" />,
      children: [
        { title: '당월 실적 순위', path: '/salesperson/monthly-ranking', icon: <BarChart3 className="w-4 h-4" /> },
        { title: '수수료 명세서', path: '/salesperson/commission-statement', icon: <FileText className="w-4 h-4" /> },
        { title: '내 DB 관리', path: '/salesperson/register', icon: <UserPlus className="w-4 h-4" /> },
        { title: '일정관리', path: '/salesperson/schedules', icon: <Calendar className="w-4 h-4" /> },
        { title: '메모관리', path: '/salesperson/memos', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: '설정관리',
      icon: <Settings className="w-4 h-4" />,
      children: [
        { title: '내 정보 수정', path: '/settings/my-account', icon: <User className="w-4 h-4" /> },
      ],
    },
  ];

  // 섭외자용 메뉴
  const recruiterMenuItems: MenuItem[] = [
    {
      title: 'DB관리',
      icon: <Database className="w-4 h-4" />,
      children: [
        { title: '내 DB 관리', path: '/recruiter/my-data', icon: <FileText className="w-4 h-4" /> },
        { title: 'DB등록', path: '/sales-db/register', icon: <UserPlus className="w-4 h-4" /> },
        { title: 'DB검색', path: '/sales-db/search', icon: <Search className="w-4 h-4" /> },
      ],
    },
    {
      title: '업무관리',
      icon: <TrendingUp className="w-4 h-4" />,
      children: [
        { title: '일정관리', path: '/salesperson/schedules', icon: <Calendar className="w-4 h-4" /> },
        { title: '메모관리', path: '/salesperson/memos', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: '설정관리',
      icon: <Settings className="w-4 h-4" />,
      children: [
        { title: '내 정보 수정', path: '/settings/my-account', icon: <User className="w-4 h-4" /> },
      ],
    },
  ];

  // 일반사용자용 메뉴
  const employeeMenuItems: MenuItem[] = [
    {
      title: '설정관리',
      icon: <Settings className="w-4 h-4" />,
      children: [
        { title: '내 정보 수정', path: '/settings/my-account', icon: <User className="w-4 h-4" /> },
      ],
    },
  ];

  // 사용자 권한에 따라 메뉴 결정
  const menuItems = user?.role === 'admin' ? adminMenuItems : 
                    user?.role === 'salesperson' ? salespersonMenuItems :
                    user?.role === 'recruiter' ? recruiterMenuItems : 
                    employeeMenuItems;

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const toggleSubMenu = (title: string) => {
    setExpandedSubMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800">찬스컴퍼니 ERP</h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? '관리자' : 
                 user?.role === 'salesperson' ? '영업자' : 
                 user?.role === 'recruiter' ? '섭외자' : '직원'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4 text-gray-600" />
            <span className="text-xs text-gray-600">로그아웃</span>
          </button>
        </div>
      </div>

      {/* 근태 정보 (일반 사용자만, 영업자/섭외자 제외) */}
      {user?.role !== 'admin' && user?.role !== 'salesperson' && user?.role !== 'recruiter' && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-800">근태</h3>
              <Settings className="w-3 h-3 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
            
            {/* 출퇴근 시간 */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">출근시간</span>
                <span className={`text-xs font-semibold ${clockInTime ? 'text-blue-600' : 'text-gray-400'}`}>
                  {clockInTime ? `${clockInTime.substring(0, 5)}` : '00:00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">퇴근시간</span>
                <span className={`text-xs font-semibold ${clockOutTime ? 'text-green-600' : 'text-gray-400'}`}>
                  {clockOutTime ? `${clockOutTime.substring(0, 5)}` : '00:00'}
                </span>
              </div>
            </div>

            {/* 주간 근무 진행율 */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">주간 근무 진행율</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            {/* 34시간 링크 */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              34시간
            </button>
          </div>
        </div>
      )}

      {/* 인사 종목 메뉴 (일반 사용자(employee) 및 섭외자(recruiter)) */}
      {(user?.role === 'employee' || user?.role === 'recruiter') && (
        <div className="p-3 border-b border-gray-200">
          <NavLink
            to="/attendance/clock-in"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 mb-1 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-lg">🏢</span>
            <span className="font-medium">출근하기</span>
          </NavLink>
          
          <NavLink
            to="/attendance/clock-out"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 mb-1 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-lg">🏃</span>
            <span className="font-medium">퇴근하기</span>
          </NavLink>
          
          <NavLink
            to="/attendance/leave-request"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-lg">✈️</span>
            <span className="font-medium">휴가신청</span>
          </NavLink>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item, index) => (
          <div key={`${item.title}-${index}`} className="mb-1">
            <button
              onClick={() => toggleMenu(item.title)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                expandedMenus.includes(item.title) ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </div>
              <ChevronDown 
                className={`w-3 h-3 transition-transform ${
                  expandedMenus.includes(item.title) ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Submenu */}
            {expandedMenus.includes(item.title) && item.children && (
              <div className="bg-gray-50 border-l-2 border-gray-200 ml-4">
                {item.children.map((child, childIndex) => (
                  <div key={`${child.title}-${childIndex}`}>
                    {child.path ? (
                      // 2레벨 메뉴 (path가 있는 경우)
                      <NavLink
                        to={child.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 px-4 py-2 text-xs hover:bg-gray-100 transition-colors ${
                            isActive ? 'text-blue-600 bg-blue-50 border-l-2 border-blue-600' : 'text-gray-600'
                          }`
                        }
                      >
                        {child.icon && <span>{child.icon}</span>}
                        <span>{child.title}</span>
                      </NavLink>
                    ) : (
                      // 2레벨 메뉴 (children이 있는 경우 - 3레벨 구조)
                      <div>
                        <button
                          onClick={() => toggleSubMenu(child.title)}
                          className={`w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-gray-100 transition-colors ${
                            expandedSubMenus.includes(child.title) ? 'text-blue-600' : 'text-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {child.icon && <span>{child.icon}</span>}
                            <span className="font-medium">{child.title}</span>
                          </div>
                          <ChevronDown 
                            className={`w-3 h-3 transition-transform ${
                              expandedSubMenus.includes(child.title) ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        {/* 3레벨 메뉴 */}
                        {expandedSubMenus.includes(child.title) && child.children && (
                          <div className="bg-white border-l-2 border-gray-300 ml-4">
                            {child.children.map((subChild, subIndex) => (
                              <NavLink
                                key={`${subChild.path}-${subIndex}`}
                                to={subChild.path}
                                className={({ isActive }) =>
                                  `flex items-center space-x-2 px-4 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                                    isActive ? 'text-blue-600 bg-blue-50 border-l-2 border-blue-600' : 'text-gray-500'
                                  }`
                                }
                              >
                                {subChild.icon && <span className="text-[10px]">{subChild.icon}</span>}
                                <span>{subChild.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;

