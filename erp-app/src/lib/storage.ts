// 브라우저 LocalStorage를 사용한 데이터 저장
import type { Product, User, Employee, Attendance, Leave } from '../types/electron';

// 회사 위치 인터페이스
export interface CompanyLocation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
}

// LocalStorage 키 관리 (중앙 집중식)
const STORAGE_KEYS = {
  PRODUCTS: 'erp_products',
  USERS: 'erp_users',
  EMPLOYEES: 'erp_employees',
  ATTENDANCE: 'erp_attendance',
  LEAVES: 'erp_leaves',
  LEAVE_REQUESTS: 'erp_leave_requests',
  COMPANY_LOCATIONS: 'erp_company_locations',
  ATTENDANCE_RECORDS: 'erp_attendance_records',
  CLIENTS: 'erp_clients', // 거래처 관리
  INITIALIZED: 'erp_initialized', // 초기화 완료 플래그
};

// 초기 데이터 설정 (한 번만 실행)
const initializeStorage = () => {
  // 이미 초기화되었는지 확인
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  
  console.log('[Storage] 초기화 시작:', isInitialized ? '기존 데이터 유지' : '신규 초기화');

  // 기본 관리자 및 일반 사용자 계정 (없을 때만)
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: 306,
        username: 'admin',
        name: '관리자',
        role: 'admin',
        password: 'admin123',
      },
      {
        id: 305,
        username: 'user01',
        name: '김철수',
        role: 'employee',
        password: 'user123',
        workType: '사무직',
        workLocation: '회사 본사'
      },
      {
        id: 304,
        username: 'user02',
        name: '이영희',
        role: 'employee',
        password: 'user123',
        workType: '생산직',
        workLocation: '회사 본사'
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    console.log('[Storage] 기본 사용자 계정 생성');
  }

  // 빈 배열로 초기화 (없을 때만)
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    console.log('[Storage] 제품 목록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    console.log('[Storage] 직원 목록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    console.log('[Storage] 근태 기록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify([]));
    console.log('[Storage] 휴가 목록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify([]));
    console.log('[Storage] 휴가 신청 목록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify([]));
    console.log('[Storage] 출퇴근 기록 초기화');
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    console.log('[Storage] 거래처 목록 초기화');
  }

  // 회사 위치 설정 (없을 때만 기본값 설정)
  if (!localStorage.getItem(STORAGE_KEYS.COMPANY_LOCATIONS)) {
    const defaultLocations: CompanyLocation[] = [
      {
        id: 1,
        name: '회사 본사',
        address: '서울특별시 중구 세종대로 110',
        lat: 37.5666805,
        lng: 126.9784147,
        radius: 100
      }
    ];
    localStorage.setItem(STORAGE_KEYS.COMPANY_LOCATIONS, JSON.stringify(defaultLocations));
    console.log('[Storage] 회사 위치 기본값 설정');
  }

  // 초기화 완료 플래그 설정
  if (!isInitialized) {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('[Storage] 초기화 완료');
  }
};

// 웹 브라우저용 API (Electron API와 동일한 인터페이스)
export const browserAPI = {
  // 인증
  login: async (credentials: { username: string; password: string }) => {
    initializeStorage();
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // 간단한 인증 (실제로는 백엔드에서 해야 함)
    // 저장된 비밀번호와 입력한 비밀번호를 비교
    const user = users.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    );
    
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  },

  // 제품 관리
  products: {
    getAll: async () => {
      initializeStorage();
      const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      return { success: true, data: products };
    },

    create: async (product: Product) => {
      initializeStorage();
      const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const newProduct = {
        ...product,
        id: products.length > 0 ? Math.max(...products.map(p => p.id || 0)) + 1 : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      products.push(newProduct);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return { success: true, id: newProduct.id };
    },

    update: async (id: number, product: Product) => {
      initializeStorage();
      const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const index = products.findIndex((p) => p.id === id);
      if (index !== -1) {
        products[index] = {
          ...product,
          id,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        return { success: true };
      }
      return { success: false, message: '제품을 찾을 수 없습니다.' };
    },

    delete: async (id: number) => {
      initializeStorage();
      const products: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const filtered = products.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
      return { success: true };
    },

    import: async (products: Product[]) => {
      initializeStorage();
      const existing: Product[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      let maxId = existing.length > 0 ? Math.max(...existing.map(p => p.id || 0)) : 0;
      
      const newProducts = products.map((p) => ({
        ...p,
        id: ++maxId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      
      const allProducts = [...existing, ...newProducts];
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(allProducts));
      return { success: true, count: newProducts.length };
    },

    importCSV: async () => {
      // CSV 임포트는 파일 업로드로 대체 필요
      return { success: false, message: '웹 버전에서는 파일 업로드 기능을 사용하세요.' };
    },
  },

  // 직원 관리
  employees: {
    getAll: async () => {
      initializeStorage();
      const employees: Employee[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      return { success: true, data: employees };
    },
  },

  // 근태 관리
  attendance: {
    getAll: async () => {
      initializeStorage();
      const attendance: Attendance[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
      return { success: true, data: attendance };
    },
  },

  // 휴가 관리
  leaves: {
    getAll: async () => {
      initializeStorage();
      const leaves: Leave[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVES) || '[]');
      return { success: true, data: leaves };
    },
  },
};

// LocalStorage 유틸리티 함수
export const storageUtils = {
  // 데이터 읽기
  get: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Storage] ${key} 읽기 실패:`, error);
      return null;
    }
  },

  // 데이터 쓰기
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`[Storage] ${key} 저장 완료`);
      return true;
    } catch (error) {
      console.error(`[Storage] ${key} 저장 실패:`, error);
      return false;
    }
  },

  // 데이터 삭제
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      console.log(`[Storage] ${key} 삭제 완료`);
      return true;
    } catch (error) {
      console.error(`[Storage] ${key} 삭제 실패:`, error);
      return false;
    }
  },

  // 모든 데이터 초기화 (주의: 개발 및 테스트용)
  clearAll: (): boolean => {
    try {
      localStorage.clear();
      console.log('[Storage] 모든 데이터 삭제 완료');
      return true;
    } catch (error) {
      console.error('[Storage] 데이터 삭제 실패:', error);
      return false;
    }
  },

  // Storage 키 export
  keys: STORAGE_KEYS,
};

// window.electronAPI가 없으면 browserAPI 사용
export const getAPI = () => {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return browserAPI;
};

