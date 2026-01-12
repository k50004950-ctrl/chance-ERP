import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import NoticePopup from './NoticePopup';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

const Layout: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    } else {
      setProfileLoading(false);
    }
  }, [user?.id]); // user.id가 변경될 때만 재실행

  const checkProfileCompletion = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    try {
      // 사용자 정보를 서버에서 다시 조회하여 최신 정보 확인
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const userData = result.data;
        
        // 필수 정보 체크: 은행명, 계좌번호, 주민번호
        const hasRequiredInfo = !!(userData.bank_name && 
                                   userData.account_number && 
                                   userData.social_security_number);
        
        setIsProfileComplete(hasRequiredInfo);
        console.log('프로필 완성 여부:', hasRequiredInfo, userData);
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('프로필 확인 오류:', error);
      setIsProfileComplete(false);
    } finally {
      setProfileLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (profileLoading || isProfileComplete === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 프로필 완성 페이지가 아닌 곳에서 필수 정보가 없으면 리다이렉트
  if (!isProfileComplete && location.pathname !== '/settings/complete-profile') {
    console.log('프로필 미완성 - 리다이렉트:', location.pathname);
    return <Navigate to="/settings/complete-profile" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 모바일 상단 네비게이션 */}
      <MobileNav />
      
      {/* 사이드바는 태블릿 이상에서만 표시 */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      
      {/* 공지사항 팝업 */}
      <NoticePopup />
    </div>
  );
};

export default Layout;

