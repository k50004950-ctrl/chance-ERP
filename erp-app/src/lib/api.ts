// API 기본 URL 설정
// 개발: http://localhost:3000
// 프로덕션: 현재 도메인 사용 (상대 경로)
export const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

// fetch wrapper
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
}
