# 🤖 AI를 위한 프로젝트 컨텍스트 문서

**작성일:** 2026년 1월 5일  
**프로젝트명:** Chance Company HRM/ERP 시스템  
**버전:** 웹 + Electron 하이브리드

---

## 📋 프로젝트 개요

이 프로젝트는 **한국 중소기업을 위한 통합 ERP/HRM 시스템**입니다. 재고관리, 인사관리, 영업자 관리, 계약 관리 등을 포함한 올인원 비즈니스 솔루션입니다.

### 핵심 특징
- **듀얼 플랫폼**: Electron 데스크톱 앱 + Express 웹 서버
- **단일 코드베이스**: React + TypeScript로 두 플랫폼 모두 지원
- **로컬 우선**: SQLite 데이터베이스로 인터넷 없이 작동
- **한국어 중심**: UI와 비즈니스 로직이 한국 시장에 최적화

---

## 🏗️ 아키텍처

### 기술 스택
```
Frontend: React 19 + TypeScript + Tailwind CSS + Vite
Backend: Express.js (웹) / Electron IPC (데스크톱)
Database: SQLite (better-sqlite3)
Build: Vite + electron-builder
Routing: React Router v7
Icons: lucide-react
State: Context API (AuthContext)
```

### 실행 모드
1. **Electron 데스크톱 앱** (원본)
   - `npm run electron:dev` (개발)
   - `npm run electron:build` (빌드)
   - `ERP실행.bat` (사용자용)

2. **웹 서버 모드** (신규)
   - `start-web-dev.bat` (개발, 포트 5173)
   - `start-web-server.bat` (프로덕션, 포트 3000)
   - `npm run server` (수동 실행)

---

## 📁 프로젝트 구조

```
HRM/                              # 프로젝트 루트
├── erp-app/                      # 메인 애플리케이션
│   ├── electron/                 # Electron 전용 (데스크톱)
│   │   ├── main.js              # 메인 프로세스 (IPC, DB)
│   │   └── preload.js           # Preload 스크립트
│   ├── server/                   # Express 서버 (웹)
│   │   ├── index.js             # 백엔드 API 서버 (1578 lines!)
│   │   ├── erp.db               # SQLite 데이터베이스
│   │   └── uploads/             # 파일 업로드 디렉토리
│   ├── src/                      # React 프론트엔드
│   │   ├── components/          # 공통 컴포넌트
│   │   │   ├── Layout.tsx       # 메인 레이아웃
│   │   │   ├── Sidebar.tsx      # 사이드바 네비게이션
│   │   │   └── MobileNav.tsx    # 모바일 네비게이션
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # 인증 컨텍스트
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SalespersonDashboard.tsx
│   │   │   ├── attendance/      # 출퇴근 관리
│   │   │   │   ├── ClockIn.tsx
│   │   │   │   ├── ClockOut.tsx
│   │   │   │   └── LeaveRequest.tsx
│   │   │   ├── hr/              # 인사관리
│   │   │   │   ├── Employees.tsx
│   │   │   │   ├── Attendance.tsx
│   │   │   │   ├── Leaves.tsx
│   │   │   │   └── LeaveCalendar.tsx
│   │   │   ├── inventory/       # 재고관리 (미사용? 확인 필요)
│   │   │   │   ├── ProductRegister.tsx
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── InventoryRegister.tsx
│   │   │   │   ├── InventorySales.tsx
│   │   │   │   ├── InventoryStatus.tsx
│   │   │   │   └── ClientRegister.tsx
│   │   │   ├── sales-db/        # 영업 데이터베이스
│   │   │   │   ├── Register.tsx
│   │   │   │   └── Search.tsx
│   │   │   ├── salesperson/     # 영업자 관리
│   │   │   │   ├── Register.tsx
│   │   │   │   ├── CommissionStatement.tsx
│   │   │   │   ├── ScheduleManagement.tsx
│   │   │   │   └── MemoManagement.tsx
│   │   │   ├── contract/        # 계약 관리
│   │   │   │   ├── SalesCommission.tsx
│   │   │   │   └── RecruitmentCommission.tsx
│   │   │   ├── admin/           # 관리자 전용
│   │   │   │   └── SalespersonSchedules.tsx
│   │   │   └── settings/        # 설정
│   │   │       ├── AccountSettings.tsx
│   │   │       └── CompanySettings.tsx
│   │   ├── types/               # TypeScript 타입
│   │   │   ├── electron.ts      # 주요 인터페이스 정의
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── mockElectronAPI.ts  # 웹/데스크톱 API 추상화
│   │   │   └── geocoding.ts        # 지오코딩 유틸
│   │   ├── lib/
│   │   │   └── storage.ts       # 로컬 스토리지 관리
│   │   ├── App.tsx              # 메인 앱 + 라우팅
│   │   └── main.tsx             # React 엔트리
│   ├── dist/                     # 빌드 출력
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── *.bat                     # Windows 실행 스크립트
├── 7-11月 재고리스트_税务.xlsx  # 실제 비즈니스 데이터
├── products_import.csv           # CSV 임포트 샘플
└── import_excel.py               # Python 임포트 스크립트
```

---

## 🗄️ 데이터베이스 스키마

**파일 위치:** `erp-app/server/erp.db` (SQLite)

### 주요 테이블

#### 1. `users` - 사용자 계정
```sql
- id: INTEGER PRIMARY KEY
- username: TEXT UNIQUE (로그인 ID)
- password: TEXT (평문 또는 해시, 확인 필요)
- name: TEXT (실명)
- role: 'admin' | 'employee' | 'salesperson' | 'recruiter'
- created_at: DATETIME
```

**기본 계정:**
- 아이디: `admin`
- 비밀번호: `admin123`
- 역할: `admin`

#### 2. `products` - 제품/재고
```sql
- id, barcode (UNIQUE), product_name
- quantity, consumer_price, purchase_price
- month (재고 월), created_at, updated_at
```

#### 3. `employees` - 직원 정보
```sql
- id, user_id (FK), employee_code (UNIQUE)
- department, position, hire_date
- phone, email, created_at
```

#### 4. `attendance` - 근태 기록
```sql
- id, employee_id (FK), date
- check_in (TIME), check_out (TIME)
- status: 'present' | 'absent' | 'late' | 'early_leave'
```

#### 5. `leaves` - 휴가 신청
```sql
- id, employee_id (FK), leave_type
- start_date, end_date, reason
- status: 'pending' | 'approved' | 'rejected'
```

#### 6. `sales_db` - 영업 데이터베이스
```sql
- 제안일, 제안자, 영업자ID, 미팅 상태
- 회사명, 대표자, 주소, 연락처, 업종
- 제품군, 규모, 메모 등
```

#### 7. `contracts` - 계약 관리
```sql
- contract_type: 'sales' | 'recruitment'
- client_name, client_company, salesperson_id
- contract_amount, commission_rate, commission_amount
- payment_status: 'pending' | 'paid' | 'partial'
```

#### 8. `schedules` - 일정 관리
```sql
- user_id (FK), title, schedule_date, schedule_time
- client_name, location, notes
- status: 'scheduled' | 'completed' | 'cancelled'
```

#### 9. `memos` - 메모
```sql
- user_id (FK), title, content, category
- created_at, updated_at
```

#### 10. `commission_statements` - 수수료 명세서
```sql
- salesperson_id (FK), period_start, period_end
- total_sales, total_commission
- payment_date, payment_status
```

---

## 🔌 API 엔드포인트 (웹 서버 모드)

**서버 파일:** `erp-app/server/index.js` (1578줄 - 매우 큰 파일!)

### 인증
- `POST /api/auth/login` - 로그인

### 제품 관리
- `GET /api/products` - 전체 조회
- `POST /api/products` - 등록
- `PUT /api/products/:id` - 수정
- `DELETE /api/products/:id` - 삭제
- `POST /api/products/import` - 일괄 등록 (JSON)
- `POST /api/products/import-csv` - CSV 임포트

### 인사관리
- `GET /api/employees`
- `GET /api/attendance`
- `GET /api/leaves`

### 영업 DB
- `GET /api/sales-db`
- `POST /api/sales-db`
- `PUT /api/sales-db/:id`
- `DELETE /api/sales-db/:id`

### 계약 관리
- `GET /api/contracts`
- `POST /api/contracts`
- `PUT /api/contracts/:id`
- `DELETE /api/contracts/:id`

### 일정/메모
- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`
- `GET /api/memos`
- `POST /api/memos`
- `PUT /api/memos/:id`
- `DELETE /api/memos/:id`

---

## 🎯 주요 기능 모듈

### 1. 인증 시스템
- **파일:** `src/context/AuthContext.tsx`
- **저장소:** localStorage (키: `'user'`)
- **역할 기반 접근 제어:** admin, employee, salesperson, recruiter
- **API 추상화:** `src/utils/mockElectronAPI.ts`가 웹/데스크톱 환경 자동 감지

### 2. 출퇴근 관리
- 출근 체크인 (`/attendance/clock-in`)
- 퇴근 체크아웃 (`/attendance/clock-out`)
- 휴가 신청 (`/attendance/leave-request`)

### 3. 인사관리 (HR)
- 직원 목록 및 통계
- 근태 현황 대시보드
- 휴가 신청 승인/반려
- 연차 캘린더

### 4. 영업자 관리
- 영업자 등록
- 일정 관리 (고객 미팅 등)
- 메모 관리
- 수수료 명세서

### 5. 영업 데이터베이스
- 잠재 고객 등록
- 제안 및 미팅 상태 추적
- 고객사 정보 관리

### 6. 계약 관리
- 판매 계약
- 채용 계약
- 수수료 계산
- 지급 상태 추적

### 7. 재고관리 (inventory/)
- **참고:** 파일은 존재하나 `App.tsx` 라우팅에 없음
- 향후 확장 예정 또는 레거시일 수 있음

---

## 🚀 새로운 컴퓨터에서 설치 방법

### 필수 요구사항
- **Node.js:** 22.12.0 이상 (package.json engines 참조)
- **npm:** 10.0.0 이상
- **OS:** Windows (배치 파일 사용)

### 설치 단계
```bash
cd erp-app
npm install
```

### 실행 방법
```bash
# Electron 데스크톱 (개발)
npm run electron:dev

# 웹 서버 (개발)
start-web-dev.bat
# 또는: npm run server:dev

# 웹 서버 (프로덕션)
start-web-server.bat
# 또는: npm run build && npm run server
```

### 데이터베이스 초기화
- 첫 실행 시 자동으로 `server/erp.db` 생성
- 기본 admin 계정 자동 생성
- 스키마는 `server/index.js`의 `initDatabase()` 함수에서 정의

---

## 🧩 코드 작성 시 주의사항

### 1. API 호출 방식
```typescript
// 올바른 방법 - 환경 자동 감지
import { getElectronAPI } from '../utils/mockElectronAPI';

const api = getElectronAPI();
const result = await api.products.getAll();
```

### 2. 사용자 인증 확인
```typescript
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();

// 역할 확인
if (user?.role === 'admin') {
  // 관리자 전용 기능
}
```

### 3. 타입 정의
- **중요:** `src/types/electron.ts`에 모든 인터페이스 정의
- User, Product, Employee, Attendance, Leave 등

### 4. 한국어 UI
- 모든 UI 텍스트는 한국어
- 날짜 형식: YYYY-MM-DD
- 통화: 원화 (₩)

---

## 🔍 디버깅 팁

### 웹 서버 모드
1. 콘솔 로그: `server/index.js`에서 `console.log` 확인
2. 데이터베이스: `server/erp.db`를 SQLite 뷰어로 열기
3. 포트 충돌: 환경 변수 `PORT=3001` 설정

### Electron 모드
1. DevTools: Ctrl+Shift+I (개발 모드)
2. 메인 프로세스 로그: 터미널 확인
3. IPC 통신: `electron/main.js`와 `electron/preload.js` 확인

### 일반
- **대용량 파일:** `server/index.js`는 1578줄 - 특정 API를 찾을 때는 검색 사용
- **환경 변수:** `.env` 파일 지원 (dotenv)
- **CORS:** 웹 서버는 모든 출처 허용

---

## 📝 알려진 이슈/TODO

1. **재고관리 모듈:** `src/pages/inventory/` 존재하나 라우팅 미연결
2. **비밀번호 보안:** 해시 여부 확인 필요 (admin123이 평문일 수 있음)
3. **OpenStreetMap:** `OPENSTREETMAP_SETUP.md` 존재 - 지도 기능 통합 예정?
4. **Railway 배포:** `RAILWAY_DEPLOYMENT.md`, `railway.json` - 클라우드 배포 설정
5. **Excel 파일:** 루트에 `7-11月 재고리스트_税务.xlsx` - 실제 데이터 백업?

---

## 🤝 개발 워크플로우

### 새 기능 추가 시
1. `src/types/electron.ts`에 타입 정의
2. `server/index.js`에 API 엔드포인트 추가
3. `src/pages/`에 페이지 컴포넌트 생성
4. `App.tsx`에 라우트 추가
5. `Sidebar.tsx`에 메뉴 항목 추가 (필요시)

### 데이터베이스 변경 시
1. `server/index.js`의 `initDatabase()` 함수 수정
2. 기존 `server/erp.db` 백업
3. 삭제 후 재시작 (자동 재생성)
4. 또는 ALTER TABLE 마이그레이션 스크립트 작성

---

## 🎓 프로젝트 학습 순서 (AI 추천)

1. **먼저 읽을 파일:**
   - `erp-app/README.md` - 전체 개요
   - `erp-app/package.json` - 의존성 및 스크립트
   - `erp-app/src/App.tsx` - 라우팅 구조
   - `erp-app/src/types/electron.ts` - 데이터 구조

2. **핵심 로직:**
   - `erp-app/server/index.js` (1-300줄) - 서버 초기화 및 DB 스키마
   - `erp-app/src/context/AuthContext.tsx` - 인증 흐름
   - `erp-app/src/utils/mockElectronAPI.ts` - API 추상화

3. **UI 이해:**
   - `erp-app/src/components/Sidebar.tsx` - 메뉴 구조
   - `erp-app/src/pages/Dashboard.tsx` - 메인 대시보드
   - `erp-app/src/pages/Login.tsx` - 로그인 UI

4. **특정 기능 파악 시:**
   - 각 페이지 디렉토리(`hr/`, `salesperson/`, `contract/` 등)를 독립적으로 분석
   - API 호출 → `server/index.js`에서 대응 엔드포인트 찾기

---

## 🌟 프로젝트의 강점

- ✅ **단일 코드베이스:** 웹/데스크톱 모두 지원
- ✅ **완전한 TypeScript:** 타입 안정성
- ✅ **로컬 우선:** 인터넷 없이 작동
- ✅ **실제 비즈니스:** 이론이 아닌 실제 회사 사용 중
- ✅ **한국 시장 최적화:** 언어, 날짜, 통화 형식

---

## 📬 마지막으로

이 문서는 **AI(Cursor 등)가 빠르게 프로젝트를 이해하도록** 작성되었습니다.

**새로운 컴퓨터에서 이 파일을 읽는 AI에게:**
- 이 프로젝트는 **활발히 개발 중**입니다
- `server/index.js`는 **매우 큰 파일**(1578줄)이니 검색으로 찾으세요
- **한국어 비즈니스 로직**이 많으니 문맥을 이해하세요
- **듀얼 플랫폼**이니 API 호출 시 `getElectronAPI()` 사용을 잊지 마세요

**질문 시작점:**
- "영업자 수수료 계산은 어떻게 작동하나요?" → `server/index.js`에서 `/api/contracts` 검색
- "출근 체크인은 어디서?" → `src/pages/attendance/ClockIn.tsx`
- "데이터베이스 구조는?" → 위 스키마 섹션 참조

**행운을 빕니다! 🚀**

---

**작성자:** AI Assistant (Claude Sonnet 4.5)  
**작성 목적:** 새로운 환경에서 AI가 프로젝트를 빠르게 파악하도록 돕기 위함  
**업데이트:** 프로젝트 변경 시 이 문서도 함께 업데이트하세요

