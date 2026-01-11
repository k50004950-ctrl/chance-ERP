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
