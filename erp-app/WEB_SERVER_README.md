# ERP 시스템 - 웹 서버 버전

## 개요

이 ERP 시스템은 이제 **웹 브라우저**에서 실행됩니다. Electron 데스크톱 앱과 웹 서버 모두 지원합니다.

## 웹 서버 실행 방법

### 방법 1: 간편 실행 (권장)

**프로덕션 모드:**
```bash
start-web-server.bat
```
- 자동으로 빌드하고 서버를 시작합니다
- 웹 브라우저에서 `http://localhost:3000` 접속

**개발 모드:**
```bash
start-web-dev.bat
```
- 개발 모드로 실행 (핫 리로드 지원)
- 웹 브라우저에서 `http://localhost:5173` 접속

### 방법 2: 수동 실행

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **개발 모드 실행:**
   ```bash
   npm run server:dev
   ```
   - 프론트엔드: http://localhost:5173
   - 백엔드: http://localhost:3000

3. **프로덕션 빌드 & 실행:**
   ```bash
   npm run build
   npm run server
   ```
   - 서버: http://localhost:3000

## 주요 변경 사항

### 기술 스택
- **프론트엔드:** React + TypeScript + Vite (변경 없음)
- **백엔드:** Express.js (Electron IPC에서 변경)
- **데이터베이스:** SQLite (better-sqlite3)
- **UI:** Tailwind CSS (변경 없음)

### 아키텍처
- Electron IPC → REST API로 변경
- 데스크톱 앱 → 웹 애플리케이션
- 모든 UI와 기능은 그대로 유지

## 시스템 요구사항

- Node.js 16 이상
- npm 또는 yarn
- 웹 브라우저 (Chrome, Firefox, Edge 등)

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인

### 제품 관리
- `GET /api/products` - 제품 목록 조회
- `POST /api/products` - 제품 등록
- `PUT /api/products/:id` - 제품 수정
- `DELETE /api/products/:id` - 제품 삭제
- `POST /api/products/import` - 제품 일괄 등록
- `POST /api/products/import-csv` - CSV 파일 가져오기

### 직원 관리
- `GET /api/employees` - 직원 목록 조회

### 근태 관리
- `GET /api/attendance` - 근태 기록 조회

### 휴가 관리
- `GET /api/leaves` - 휴가 신청 목록 조회

## 데이터베이스

- 위치: `server/erp.db`
- SQLite 데이터베이스로 모든 데이터 저장
- 기본 관리자 계정:
  - 아이디: `admin`
  - 비밀번호: `admin123`

## 네트워크 접속

### 로컬 네트워크에서 접속하기

1. 서버를 실행한 컴퓨터의 IP 주소 확인:
   ```bash
   ipconfig
   ```

2. 같은 네트워크의 다른 기기에서 접속:
   ```
   http://[서버-IP]:3000
   ```

### 포트 변경

기본 포트는 3000입니다. 변경하려면:

```bash
# Windows
set PORT=8080 && npm run server

# Linux/Mac
PORT=8080 npm run server
```

## Electron 버전 실행 (기존 방식)

Electron 데스크톱 앱으로도 여전히 실행 가능합니다:

```bash
npm run electron:dev
```

## 문제 해결

### 포트 충돌
- 3000 포트가 사용 중이면 환경 변수로 포트 변경
- `set PORT=3001 && npm run server`

### 데이터베이스 초기화
- `server/erp.db` 파일 삭제 후 서버 재시작

### CORS 오류
- 서버는 모든 출처에서의 요청을 허용합니다 (cors 설정 적용됨)

## 개발 참고사항

- **프론트엔드 코드:** `src/` 폴더
- **백엔드 코드:** `server/` 폴더
- **API 클라이언트:** `src/utils/mockElectronAPI.ts`
- **타입 정의:** `src/types/electron.ts`

## 라이선스

Copyright © 2025 Chance Company

