import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, LogOut, CheckCircle, TrendingUp, MapPin } from 'lucide-react';
import { getAddressFromCoords } from '../../utils/geocoding';

const ClockOut: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedOut, setClockedOut] = useState(false);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<string>('--:--:--');
  const [workHours, setWorkHours] = useState<string>('0시간 0분');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 오늘 근태 기록 가져오기
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `erp_attendance_${user?.username}_${today}`;
    const todayAttendance = localStorage.getItem(storageKey);
    
    if (todayAttendance) {
      const attendance = JSON.parse(todayAttendance);
      if (attendance.clockInTime) {
        setClockInTime(attendance.clockInTime);
      }
      if (attendance.clockOutTime) {
        setClockOutTime(attendance.clockOutTime);
        setClockedOut(true);
      }
    }

    return () => clearInterval(timer);
  }, [user]);

  const handleClockOut = async () => {
    // 현재 위치 가져오기
    setIsGeocodingLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // 주소 변환
          let address = '위치 확인 불가';
          try {
            address = await getAddressFromCoords(latitude, longitude);
            setLocationAddress(address);
          } catch (error) {
            console.error('주소 변환 실패:', error);
            address = `위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocationAddress(address);
          }
          
          // 퇴근 처리
          const now = new Date();
          // 24시간 형식으로 저장 (HH:mm:ss)
          const timeString = now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          
          // 표시용 시간 (오후 12:57:44)
          const displayTime = now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
          
          // LocalStorage에서 기존 출근 정보 가져오기
          const today = new Date().toISOString().split('T')[0];
          const storageKey = `erp_attendance_${user?.username}_${today}`;
          const todayAttendance = localStorage.getItem(storageKey);
          
          if (todayAttendance) {
            const attendance = JSON.parse(todayAttendance);
            attendance.clockOutTime = timeString;
            attendance.clockOutLocation = address;
            attendance.clockOutCoordinates = JSON.stringify({ lat: latitude, lng: longitude });
            
            // 근무 시간 계산
            if (attendance.clockInTime) {
              const clockIn = new Date(`2000-01-01 ${attendance.clockInTime}`);
              const clockOut = new Date(`2000-01-01 ${timeString}`);
              const diffMs = clockOut.getTime() - clockIn.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              setWorkHours(`${diffHours}시간 ${diffMinutes}분`);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(attendance));
          }
          
          // 서버에도 저장
          try {
            await fetch('/api/attendance/clock-out', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                employee_id: user?.id,
                date: today,
                check_out: timeString,
                check_out_location: address,
                check_out_coordinates: JSON.stringify({ lat: latitude, lng: longitude }),
              }),
            });
            console.log('퇴근 기록이 서버에 저장되었습니다.');
          } catch (error) {
            console.error('서버 저장 중 오류:', error);
          }
          
          setClockOutTime(displayTime);
          setClockedOut(true);
          setIsGeocodingLoading(false);
        },
        (error) => {
          console.error('위치 정보 가져오기 실패:', error);
          // 위치 없이도 퇴근 처리
          processClockOutWithoutLocation();
        }
      );
    } else {
      // 위치 서비스 미지원
      processClockOutWithoutLocation();
    }
  };

  const processClockOutWithoutLocation = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const displayTime = now.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `erp_attendance_${user?.username}_${today}`;
    const todayAttendance = localStorage.getItem(storageKey);
    
    if (todayAttendance) {
      const attendance = JSON.parse(todayAttendance);
      attendance.clockOutTime = timeString;
      attendance.clockOutLocation = '위치 확인 불가';
      
      if (attendance.clockInTime) {
        const clockIn = new Date(`2000-01-01 ${attendance.clockInTime}`);
        const clockOut = new Date(`2000-01-01 ${timeString}`);
        const diffMs = clockOut.getTime() - clockIn.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setWorkHours(`${diffHours}시간 ${diffMinutes}분`);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(attendance));
    }
    
    setClockOutTime(displayTime);
    setClockedOut(true);
    setIsGeocodingLoading(false);
    setLocationAddress('위치 확인 불가');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">퇴근하기</h1>
          <p className="text-gray-600">오늘 하루도 수고하셨습니다!</p>
        </div>

        {/* 현재 위치 정보 카드 */}
        {!clockedOut && (
          <div className="rounded-lg shadow-lg p-4 mb-6 bg-white border border-gray-200">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-700 mb-1">퇴근 위치</div>
                {isGeocodingLoading ? (
                  <p className="text-sm text-gray-600">위치 확인 중...</p>
                ) : locationAddress ? (
                  <p className="text-sm text-gray-700 break-words">{locationAddress}</p>
                ) : (
                  <p className="text-sm text-gray-500">퇴근 버튼을 누르면 위치가 기록됩니다</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clock Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white mb-6">
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2">
              {formatTime(currentTime)}
            </div>
            <div className="text-lg opacity-90">
              {formatDate(currentTime)}
            </div>
          </div>

          {!clockedOut ? (
            <button
              onClick={handleClockOut}
              className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-xl">퇴근 체크</span>
            </button>
          ) : (
            <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <div className="text-2xl font-bold mb-2">퇴근 완료!</div>
              <div className="text-lg opacity-90">
                퇴근 시간: {clockOutTime}
              </div>
              <div className="text-sm opacity-80 mt-2">
                내일 또 만나요! 👋
              </div>
            </div>
          )}
        </div>

        {/* Work Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            오늘의 근무 요약
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">출근 시간</span>
              <span className="font-semibold text-gray-800">{clockInTime}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">퇴근 시간</span>
              <span className="font-semibold text-gray-800">
                {clockedOut ? clockOutTime : '근무 중'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">총 근무 시간</span>
              <span className="font-semibold text-purple-600">{workHours}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">근무 상태</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                정상 근무
              </span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">근무자 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">직원명</span>
              <span className="font-semibold text-gray-800">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">부서</span>
              <span className="font-semibold text-gray-800">개발팀</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">이번 주 누적</span>
              <span className="font-semibold text-gray-800">42시간 30분</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">이번 달 누적</span>
              <span className="font-semibold text-gray-800">168시간 15분</span>
            </div>
          </div>
        </div>

        {/* Reminder */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>안내:</strong> 퇴근 체크를 완료하면 자동으로 근무 시간이 기록됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockOut;

