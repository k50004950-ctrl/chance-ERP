import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, MapPin, CheckCircle, Navigation, AlertCircle, Building2 } from 'lucide-react';
import { getAddressFromCoords } from '../../utils/geocoding';

declare global {
  interface Window {
    L: any;
  }
}

// 기본 회사 위치 설정 (LocalStorage에 없을 경우 사용)
const DEFAULT_COMPANY_LOCATION = {
  lat: 37.5666805,  // 서울시청 위도
  lng: 126.9784147, // 서울시청 경도
  name: '회사 본사',
  address: '서울특별시 중구 세종대로 110',
  radius: 100
};

const ClockIn: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceToCompany, setDistanceToCompany] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(false);
  const [companyLocation, setCompanyLocation] = useState(DEFAULT_COMPANY_LOCATION);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  // LocalStorage에서 회사 위치 불러오기
  useEffect(() => {
    const savedLocation = localStorage.getItem('erp_company_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setCompanyLocation(location);
      } catch (error) {
        console.error('회사 위치 정보 로드 실패:', error);
        // 기본값 사용
        setCompanyLocation(DEFAULT_COMPANY_LOCATION);
      }
    } else {
      // 기본값을 LocalStorage에 저장
      localStorage.setItem('erp_company_location', JSON.stringify(DEFAULT_COMPANY_LOCATION));
      setCompanyLocation(DEFAULT_COMPANY_LOCATION);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 오늘 출근 기록이 있는지 확인
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `erp_attendance_${user?.username}_${today}`;
    const todayAttendance = localStorage.getItem(storageKey);
    
    if (todayAttendance) {
      const attendance = JSON.parse(todayAttendance);
      if (attendance.clockInTime) {
        setClockInTime(attendance.clockInTime);
        setClockedIn(true);
      }
    }

    return () => clearInterval(timer);
  }, [user]);

  // 두 지점 간 거리 계산 (Haversine formula - 미터 단위)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

  // GPS 위치 가져오기 및 거리 계산 (거리 제한 없이 출근 가능)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError(null);
          
          // 거리 계산 (참고용)
          const distance = calculateDistance(
            latitude, 
            longitude, 
            companyLocation.lat, 
            companyLocation.lng
          );
          setDistanceToCompany(distance);
          
          // 거리 제한 없이 항상 출근 가능
          setIsWithinRange(true);

          // 주소 변환 (Nominatim API 사용)
          setIsGeocodingLoading(true);
          try {
            const address = await getAddressFromCoords(latitude, longitude);
            setLocationAddress(address);
            console.log('현재 위치:', address);
          } catch (error) {
            console.error('주소 변환 실패:', error);
            setLocationAddress(`위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          } finally {
            setIsGeocodingLoading(false);
          }
        },
        (error) => {
          console.error('위치 정보 가져오기 실패:', error);
          setLocationError('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
          // 위치를 가져올 수 없어도 출근은 가능하도록
          setIsWithinRange(true);
          setLocationAddress('위치 확인 불가');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('브라우저가 위치 서비스를 지원하지 않습니다.');
      // 위치 서비스가 없어도 출근 가능
      setIsWithinRange(true);
      setLocationAddress('위치 서비스 미지원');
    }
  }, [companyLocation]);

  // Leaflet 지도 초기화
  useEffect(() => {
    if (!userLocation || !mapRef.current || !window.L) return;

    const L = window.L;

    // 기존 지도가 있으면 제거
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
    }

    // 지도 생성 (회사와 사용자 위치를 모두 포함하도록)
    const map = L.map(mapRef.current);
    leafletMapRef.current = map;

    // OpenStreetMap 타일 레이어 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // 회사 위치 마커 추가 (빨간색 건물 아이콘)
    const companyMarker = L.marker([companyLocation.lat, companyLocation.lng], {
      icon: L.divIcon({
        className: 'custom-company-marker',
        html: `<div style="
          background-color: #ef4444;
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 16px;">🏢</div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(map);

    // 회사 위치 팝업
    companyMarker.bindPopup(`
      <div style="padding: 10px; min-width: 150px;">
        <h4 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">${companyLocation.name}</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${companyLocation.address}
        </p>
      </div>
    `).openPopup();

    // 회사 위치 반경 표시 (출근 가능 범위)
    L.circle([companyLocation.lat, companyLocation.lng], {
      color: isWithinRange ? '#22c55e' : '#ef4444',
      fillColor: isWithinRange ? '#22c55e' : '#ef4444',
      fillOpacity: 0.1,
      weight: 2,
      radius: companyLocation.radius,
      dashArray: '5, 5'
    }).addTo(map);

    // 현재 위치에 파란색 원형 마커 추가
    const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
      color: '#ffffff',
      fillColor: '#3b82f6',
      fillOpacity: 1,
      weight: 3,
      radius: 10
    }).addTo(map);

    // 현재 위치 팝업
    userMarker.bindPopup(`
      <div style="padding: 8px; min-width: 120px;">
        <h4 style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">현재 위치</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${user?.name || '사용자'}님의 위치
        </p>
      </div>
    `);

    // 현재 위치 정확도 표시 (작은 원)
    L.circle([userLocation.lat, userLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 1,
      radius: 50
    }).addTo(map);

    // 지도 범위를 회사와 사용자 위치를 모두 포함하도록 조정
    const bounds = L.latLngBounds(
      [userLocation.lat, userLocation.lng],
      [companyLocation.lat, companyLocation.lng]
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [userLocation, user, isWithinRange, companyLocation]);

  const handleClockIn = async () => {
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
    
    // LocalStorage에 출근 시간 및 위치 저장
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `erp_attendance_${user?.username}_${today}`;
    
    const attendance = {
      clockInTime: timeString,
      clockInLocation: locationAddress || '위치 확인 불가',
      clockInCoordinates: userLocation ? JSON.stringify(userLocation) : null,
      clockOutTime: null,
      date: today,
      username: user?.username,
      name: user?.name,
      location: userLocation,
      distance: distanceToCompany
    };
    
    localStorage.setItem(storageKey, JSON.stringify(attendance));
    
    // 서버에도 저장 (employee_id 필요)
    try {
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: user?.id,
          date: today,
          check_in: timeString,
          check_in_location: locationAddress || '위치 확인 불가',
          check_in_coordinates: userLocation ? JSON.stringify(userLocation) : null,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('출근 기록이 서버에 저장되었습니다.');
      } else {
        console.error('서버 저장 실패:', result.message);
      }
    } catch (error) {
      console.error('서버 저장 중 오류:', error);
      // 서버 저장 실패해도 로컬에는 저장되었으므로 계속 진행
    }
    
    setClockInTime(displayTime);
    setClockedIn(true);
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
    <div className="p-3 xs:p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="max-w-full xs:max-w-md sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 xs:mb-6 md:mb-8 text-center">
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-800 mb-1 xs:mb-2">출근하기</h1>
          <p className="text-xs xs:text-sm md:text-base text-gray-600">오늘도 좋은 하루 되세요!</p>
        </div>

        {/* 현재 위치 정보 카드 */}
        <div className="rounded-lg shadow-lg p-3 xs:p-4 md:p-4 mb-2 xs:mb-3 md:mb-4 bg-white border border-gray-200">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-700 mb-1">현재 위치</div>
              {isGeocodingLoading ? (
                <p className="text-sm text-gray-600">위치 확인 중...</p>
              ) : locationAddress ? (
                <p className="text-sm text-gray-700 break-words">{locationAddress}</p>
              ) : (
                <p className="text-sm text-gray-500">위치 정보 없음</p>
              )}
              {distanceToCompany !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  회사로부터 약 {distanceToCompany < 1000 
                    ? `${Math.round(distanceToCompany)}m` 
                    : `${(distanceToCompany / 1000).toFixed(2)}km`} 거리
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 출근 가능 안내 */}
        <div className="rounded-lg shadow-lg p-2 xs:p-3 md:p-4 mb-2 xs:mb-3 md:mb-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <div className="text-center">
              <div className="text-sm xs:text-base font-semibold">거리 제한 없이 출근 가능</div>
              <div className="text-[10px] xs:text-xs opacity-90 mt-0.5">출근 위치가 자동으로 기록됩니다</div>
            </div>
          </div>
        </div>

        {/* Clock Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-2 xs:p-3 md:p-4 text-white mb-2 xs:mb-3 md:mb-4">
          <div className="text-center mb-1.5 xs:mb-2 md:mb-3">
            <div className="text-xl xs:text-2xl md:text-4xl font-bold mb-0.5 xs:mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-[9px] xs:text-[10px] md:text-sm opacity-90">
              {formatDate(currentTime)}
            </div>
          </div>

          {!clockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={clockedIn}
              className="w-full font-bold py-1.5 xs:py-2 md:py-2.5 px-2 xs:px-3 md:px-4 rounded-md transition duration-200 shadow-lg flex items-center justify-center space-x-1 bg-white text-blue-600 hover:bg-blue-50 cursor-pointer active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 md:w-4 md:h-4 flex-shrink-0" />
              <span className="text-[11px] xs:text-xs md:text-sm whitespace-nowrap">
                출근 체크
              </span>
            </button>
          ) : (
            <div className="bg-white bg-opacity-20 rounded-md p-1.5 xs:p-2 md:p-3 text-center">
              <CheckCircle className="w-6 h-6 xs:w-7 xs:h-7 md:w-10 md:h-10 mx-auto mb-1 xs:mb-1.5" />
              <div className="text-sm xs:text-base md:text-lg font-bold mb-0.5">출근 완료!</div>
              <div className="text-[10px] xs:text-xs md:text-sm opacity-90">
                출근 시간: {clockInTime}
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-lg shadow-md p-3 xs:p-4 md:p-6">
          <h2 className="text-sm xs:text-base md:text-lg font-bold text-gray-800 mb-2 xs:mb-3 md:mb-4">근무 정보</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="text-xs xs:text-sm md:text-base text-gray-600">근무 장소</span>
              <span className="text-xs xs:text-sm md:text-base font-semibold text-gray-800">{companyLocation.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs xs:text-sm md:text-base text-gray-600">근무 형태</span>
              <span className="text-xs xs:text-sm md:text-base font-semibold text-gray-800">
                {user?.workType || '사무직'}
              </span>
            </div>
          </div>
        </div>

        {/* 위치 정보 및 OpenStreetMap 지도 */}
        <div className="bg-white rounded-lg shadow-md p-3 xs:p-4 md:p-6 mt-3 xs:mt-4 md:mt-6">
          <div className="mb-2 xs:mb-3 md:mb-4">
            <h2 className="text-sm xs:text-base md:text-lg font-bold text-gray-800 flex items-center mb-2">
              <Navigation className="w-3.5 h-3.5 xs:w-4 xs:h-4 md:w-5 md:h-5 mr-1.5 xs:mr-2 text-blue-600 flex-shrink-0" />
              위치 확인
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 md:gap-4 text-[11px] xs:text-xs md:text-sm">
              <div className="p-2 xs:p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-600 mb-1">현재 위치</div>
                <div className="font-semibold text-gray-800 break-all text-[10px] xs:text-xs">
                  {userLocation ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` : '측정 중...'}
                </div>
              </div>
              <div className="p-2 xs:p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600 mb-1">회사 위치</div>
                <div className="font-semibold text-blue-800 truncate">{companyLocation.name}</div>
              </div>
            </div>
          </div>
          
          {locationError && (
            <div className="mb-2 xs:mb-3 md:mb-4 p-2 xs:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-1.5 xs:space-x-2">
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 md:w-5 md:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] xs:text-xs md:text-sm text-yellow-800">{locationError}</div>
              </div>
            </div>
          )}
          
          {/* OpenStreetMap 지도 */}
          <div 
            ref={mapRef} 
            className="w-full h-56 xs:h-64 sm:h-72 md:h-80 lg:h-96 rounded-lg border border-gray-200 overflow-hidden touch-pan-y"
            style={{ minHeight: '224px' }}
          >
            {!userLocation && (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-center p-4">
                  <MapPin className="w-6 h-6 xs:w-8 xs:h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-xs xs:text-sm md:text-base text-gray-600">위치 정보를 불러오는 중...</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-2 xs:mt-3 md:mt-4 grid grid-cols-3 gap-1 xs:gap-2 text-[10px] xs:text-xs text-center">
            <div className="flex flex-col xs:flex-row items-center justify-center xs:space-x-1">
              <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 bg-blue-500 rounded-full border-2 border-white mb-0.5 xs:mb-0 flex-shrink-0"></div>
              <span className="text-gray-600 leading-tight">현재 위치</span>
            </div>
            <div className="flex flex-col xs:flex-row items-center justify-center xs:space-x-1">
              <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 bg-red-500 rounded-full border-2 border-white mb-0.5 xs:mb-0 flex-shrink-0"></div>
              <span className="text-gray-600 leading-tight">회사 위치</span>
            </div>
            <div className="flex flex-col xs:flex-row items-center justify-center xs:space-x-1">
              <div className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full border-2 mb-0.5 xs:mb-0 flex-shrink-0 ${isWithinRange ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600 leading-tight">{companyLocation.radius}m 반경</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockIn;

