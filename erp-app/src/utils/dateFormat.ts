/**
 * 날짜를 한글 포맷으로 변환
 * @param date "YYYY-MM-DD" 형식의 날짜
 * @returns "YYYY년 MM월 DD일" 형식의 날짜
 */
export const formatDateToKorean = (date: string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  } catch (error) {
    return date || '';
  }
};

/**
 * 한글 포맷 날짜를 ISO 포맷으로 변환
 * @param koreanDate "YYYY년 MM월 DD일" 형식의 날짜
 * @returns "YYYY-MM-DD" 형식의 날짜
 */
export const parseKoreanDateToISO = (koreanDate: string): string => {
  if (!koreanDate) return '';
  
  try {
    // "2026년 1월 11일" -> ["2026", "1", "11"]
    const match = koreanDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (!match) return koreanDate;
    
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    return koreanDate;
  }
};

/**
 * 현재 날짜를 한글 포맷으로 반환
 * @returns "YYYY년 MM월 DD일" 형식의 오늘 날짜
 */
export const getTodayKorean = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 현재 날짜를 ISO 포맷으로 반환
 * @returns "YYYY-MM-DD" 형식의 오늘 날짜
 */
export const getTodayISO = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 다양한 날짜 형식을 HTML date input에 사용 가능한 형식으로 변환
 * @param dateString 날짜 문자열 (다양한 형식)
 * @returns "YYYY-MM-DD" 형식의 날짜 또는 빈 문자열
 */
export const toDateValue = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    // 이미 YYYY-MM-DD 형식인 경우
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // YYYY-MM-DD로 시작하는 경우 (뒤에 시간 등이 있을 수 있음)
    const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }
    
    // ISO 형식 (T 포함)
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // 공백 포함 (날짜 시간 구분)
    if (dateString.includes(' ')) {
      return dateString.split(' ')[0];
    }
    
    // 한글 형식 "YYYY년 MM월 DD일"
    const koreanMatch = dateString.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (koreanMatch) {
      const [, year, month, day] = koreanMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  } catch (error) {
    return '';
  }
};

/**
 * 다양한 날짜/시간 형식을 HTML datetime-local input에 사용 가능한 형식으로 변환
 * @param dateTimeString 날짜/시간 문자열 (다양한 형식)
 * @returns "YYYY-MM-DDTHH:mm" 형식의 날짜/시간 또는 빈 문자열
 */
export const toDatetimeLocalValue = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '';
  
  try {
    // 이미 YYYY-MM-DDTHH:mm 형식인 경우
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateTimeString)) {
      return dateTimeString.substring(0, 16);
    }
    
    // ISO 형식 with seconds
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateTimeString)) {
      return dateTimeString.substring(0, 16);
    }
    
    // 공백으로 구분된 형식 "YYYY-MM-DD HH:mm"
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateTimeString)) {
      return dateTimeString.replace(' ', 'T').substring(0, 16);
    }
    
    // 날짜만 있는 경우 (시간은 00:00으로)
    const dateOnly = toDateValue(dateTimeString);
    if (dateOnly) {
      return `${dateOnly}T09:00`;
    }
    
    return '';
  } catch (error) {
    return '';
  }
};

/**
 * 날짜/시간 문자열을 표시용 형식으로 변환
 * @param dateTimeString 날짜/시간 문자열
 * @returns 포맷된 날짜/시간 문자열
 */
export const formatDateTime = (dateTimeString: string | null | undefined): string => {
  if (!dateTimeString) return '-';
  
  try {
    // ISO 형식 또는 datetime-local 형식 (2026-01-20T15:00)
    if (dateTimeString.includes('T') || dateTimeString.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/)) {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return dateTimeString;
      }
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // 한글 형식이 포함된 경우 그대로 반환
    if (dateTimeString.includes('년') || dateTimeString.includes('월') || dateTimeString.includes('일')) {
      return dateTimeString;
    }
    
    // 그 외의 경우 그대로 반환
    return dateTimeString;
  } catch (error) {
    return dateTimeString || '-';
  }
};
