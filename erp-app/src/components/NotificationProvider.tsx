import React, { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';
import { requestNotificationPermission, showNotification } from '../utils/notifications';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: number;
  created_at: string;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const lastCheckRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 알림 권한 요청
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // 알림 조회
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications?user_id=${user.id}`);
      const result = await response.json();

      if (result.success) {
        const newNotifications = result.data || [];
        
        // 새 알림 확인 (마지막 확인 시간 이후)
        const newUnreadNotifications = newNotifications.filter((n: Notification) => 
          n.is_read === 0 && new Date(n.created_at) > lastCheckRef.current
        );

        // 새 알림이 있으면 브라우저 알림 표시
        if (newUnreadNotifications.length > 0) {
          newUnreadNotifications.forEach((notification: Notification) => {
            showNotification(notification.title, {
              body: notification.message,
              tag: notification.type,
              requireInteraction: false,
            });
          });
        }

        setNotifications(newNotifications);
        lastCheckRef.current = new Date();
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    }
  };

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count?user_id=${user.id}`);
      const result = await response.json();

      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error);
    }
  };

  // 주기적으로 알림 확인 (30초마다)
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      intervalRef.current = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 30000); // 30초

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 알림 읽음 처리
  const markAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      window.location.href = notification.link;
    }
    
    setShowDropdown(false);
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* 알림 벨 아이콘 (헤더에 표시) */}
      <div className="fixed top-4 right-20 z-50">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* 알림 드롭다운 */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[500px] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">알림</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>알림이 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        notification.is_read === 0 ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.is_read === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        {notification.is_read === 0 && (
                          <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
