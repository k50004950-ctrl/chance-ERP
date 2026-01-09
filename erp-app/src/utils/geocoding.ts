/**
 * Geocoding 유틸리티
 * Nominatim API를 사용하여 위도/경도를 주소로 변환
 */

interface AddressComponents {
  full: string;
  city?: string;
  district?: string;
  neighbourhood?: string;
  road?: string;
}

interface NominatimResponse {
  display_name: string;
  address: {
    city?: string;
    province?: string;
    borough?: string;
    suburb?: string;
    district?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    road?: string;
    house_number?: string;
  };
}

/**
 * 위도/경도를 주소로 변환하는 함수
 * Nominatim API 사용 (무료, API 키 불필요)
 * 
 * @param lat 위도
 * @param lng 경도
 * @returns 주소 정보 객체
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<AddressComponents> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`,
      {
        headers: {
          'User-Agent': 'Chance-Company-ERP/1.0', // Nominatim 정책상 필수
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data: NominatimResponse = await response.json();
    const addr = data.address;

    // 한국 주소 형태로 구성
    let fullAddress = '';
    
    // 시/도
    if (addr.city || addr.province) {
      fullAddress += (addr.city || addr.province) + ' ';
    }
    
    // 구/군
    if (addr.borough || addr.suburb || addr.district) {
      fullAddress += (addr.borough || addr.suburb || addr.district) + ' ';
    }
    
    // 동/읍/면
    if (addr.neighbourhood || addr.hamlet || addr.village) {
      fullAddress += (addr.neighbourhood || addr.hamlet || addr.village);
    }
    
    // 도로명이 있으면 추가
    if (addr.road) {
      if (fullAddress.trim()) {
        fullAddress += ' ' + addr.road;
      } else {
        fullAddress = addr.road;
      }
      
      // 건물 번호가 있으면 추가
      if (addr.house_number) {
        fullAddress += ' ' + addr.house_number;
      }
    }

    // 기본 표시명이 없으면 display_name 사용
    if (!fullAddress.trim()) {
      // display_name에서 한국 주소 부분만 추출 시도
      const displayParts = data.display_name.split(',');
      fullAddress = displayParts.slice(0, 3).join(',').trim();
    }

    // 여전히 비어있으면 좌표 표시
    if (!fullAddress.trim()) {
      fullAddress = `위치: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    return {
      full: fullAddress.trim(),
      city: addr.city || addr.province,
      district: addr.borough || addr.suburb || addr.district,
      neighbourhood: addr.neighbourhood || addr.hamlet || addr.village,
      road: addr.road,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // 에러 발생 시 좌표로 표시
    return {
      full: `위치: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
  }
}

/**
 * 간단한 버전 - 주소 문자열만 반환
 */
export async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  const result = await reverseGeocode(lat, lng);
  return result.full;
}




