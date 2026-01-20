// 브라우저 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 알림 표시
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options,
    });

    // 알림 클릭 시 창 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

// 알림 타입별 메시지
export const getNotificationMessage = (type: string, data: any) => {
  switch (type) {
    case 'happycall_low':
      return {
        title: '⚠️ 해피콜 불만 접수',
        body: `${data.client_name} - 고객 불만 접수되었습니다. 확인이 필요합니다.`,
        tag: 'happycall',
      };
    case 'meeting_reschedule':
      return {
        title: '🔄 일정 재섭외 요청',
        body: `${data.company_name} - 일정 재섭외가 필요합니다.`,
        tag: 'schedule',
      };
    case 'as_request':
      return {
        title: '🔧 AS 요청',
        body: `${data.company_name} - AS 요청이 접수되었습니다.`,
        tag: 'as',
      };
    case 'correction_review':
      return {
        title: '💰 경정청구 검토 완료',
        body: `환급 가능 금액: ${data.refund_amount}원 - 확인해주세요.`,
        tag: 'correction',
      };
    case 'notice':
      return {
        title: '📢 새 공지사항',
        body: data.title || '새로운 공지사항이 등록되었습니다.',
        tag: 'notice',
      };
    default:
      return {
        title: '🔔 새 알림',
        body: '새로운 알림이 있습니다.',
        tag: 'general',
      };
  }
};
