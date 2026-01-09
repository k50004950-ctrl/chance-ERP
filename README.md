# 🏢 Chance Company HRM/ERP 시스템

**한국 중소기업을 위한 통합 인사/영업/재고 관리 시스템**

---

## 📖 문서 가이드

프로젝트를 처음 접하셨나요? 상황에 맞는 문서를 선택하세요:

### 🆕 새로 시작하는 경우
| 문서 | 대상 | 설명 |
|------|------|------|
| **[QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)** | 👤 **개발자** | 5분 만에 시작하기 - 빠른 체크리스트 |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | 👤 **개발자** | 상세한 설치 및 설정 가이드 (Git, Cursor 등) |
| **[PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md)** | 🤖 **AI/Cursor** | AI가 프로젝트를 이해하기 위한 상세 문서 |

### 📚 추가 문서
| 문서 | 설명 |
|------|------|
| [erp-app/README.md](erp-app/README.md) | 애플리케이션 기능 및 사용법 |
| [erp-app/WEB_SERVER_README.md](erp-app/WEB_SERVER_README.md) | 웹 서버 실행 방법 |
| [erp-app/RAILWAY_DEPLOYMENT.md](erp-app/RAILWAY_DEPLOYMENT.md) | 클라우드 배포 가이드 |

---

## 🚀 빠른 시작

### 처음 사용하는 경우
```bash
# 1. erp-app 폴더로 이동
cd erp-app

# 2. 의존성 설치
npm install

# 3. 실행
start-web-dev.bat
# 또는
npm run server:dev

# 4. 브라우저 접속
# http://localhost:5173
```

### 로그인 정보
- **아이디:** `admin`
- **비밀번호:** `admin123`

---

## 💡 이 프로젝트는...

### 주요 기능
- ✅ **인사관리** - 직원, 근태, 휴가 관리
- ✅ **영업관리** - 고객 DB, 계약, 수수료 관리
- ✅ **일정관리** - 영업자 스케줄 및 메모
- ✅ **재고관리** - 제품 등록 및 관리 (개발 중)
- ✅ **출퇴근** - 체크인/체크아웃 시스템

### 기술 스택
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Express.js / Electron
- **Database:** SQLite
- **Build:** Vite + electron-builder

### 실행 모드
1. **웹 서버 모드** - 브라우저에서 실행 (권장)
2. **Electron 데스크톱 앱** - 독립 실행 프로그램

---

## 📂 프로젝트 구조

```
HRM/
├── 📄 README.md                          ← 지금 보고 있는 파일
├── 📄 SETUP_GUIDE.md                     ← 상세 설치 가이드
├── 📄 QUICK_START_CHECKLIST.md           ← 빠른 체크리스트
├── 📄 PROJECT_CONTEXT_FOR_AI.md          ← AI용 프로젝트 설명
├── 📁 erp-app/                           ← 메인 애플리케이션
│   ├── 📁 src/                          ← React 프론트엔드
│   ├── 📁 server/                       ← Express 백엔드
│   ├── 📁 electron/                     ← Electron 데스크톱
│   ├── 📄 package.json
│   └── 📄 README.md                     ← 앱 상세 설명
└── 📁 기타 파일들
```

---

## 🎯 시작 순서

### 1️⃣ 개발자인 경우
1. **[QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)** 확인
2. Node.js 설치 및 `npm install`
3. `start-web-dev.bat` 실행
4. 문제 발생 시 → **[SETUP_GUIDE.md](SETUP_GUIDE.md)** 참조

### 2️⃣ AI (Cursor) 사용자인 경우
1. **[PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md)** 파일을 Cursor에 업로드
2. AI에게: "이 프로젝트를 파악해줘" 요청
3. AI가 자동으로 프로젝트 구조 이해

### 3️⃣ 다른 컴퓨터/계정으로 이전하는 경우
1. 전체 폴더 복사
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** 의 "Git 설정 변경" 섹션 참조
3. `npm install` 재실행
4. 데이터베이스 백업 복원 (필요시)

---

## 🔧 주요 명령어

```bash
# 개발 모드 (웹)
npm run server:dev

# 프로덕션 모드 (웹)
npm run build
npm run server

# Electron 데스크톱 앱
npm run electron:dev
```

---

## ⚠️ 필수 요구사항

- **Node.js:** 22.12.0 이상
- **npm:** 10.0.0 이상
- **OS:** Windows (배치 파일 사용)

---

## 🐛 문제 해결

| 문제 | 해결 방법 |
|------|----------|
| `npm install` 실패 | `npm cache clean --force` 후 재시도 |
| 포트 충돌 (3000) | `set PORT=3001 && npm run server` |
| 데이터베이스 오류 | `server/erp.db` 삭제 후 재실행 |
| Electron 실행 안됨 | `npm run build` 먼저 실행 |

자세한 해결 방법: **[SETUP_GUIDE.md](SETUP_GUIDE.md)** 의 "문제 해결" 섹션

---

## 📞 도움이 필요하신가요?

1. **먼저 확인:** [SETUP_GUIDE.md](SETUP_GUIDE.md) 의 문제 해결 섹션
2. **AI 활용:** Cursor에서 [PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md) 업로드 후 질문
3. **문서 참조:** `erp-app/` 폴더 내 README 파일들

---

## 📝 개발 참여

### 새 기능 추가 시
1. `src/types/electron.ts` - 타입 정의
2. `server/index.js` - API 엔드포인트
3. `src/pages/` - 페이지 컴포넌트
4. `src/App.tsx` - 라우팅 추가

자세한 내용: **[PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md)** 의 "개발 워크플로우" 섹션

---

## 🌟 주요 특징

- ✅ **듀얼 플랫폼** - 웹/데스크톱 모두 지원
- ✅ **단일 코드베이스** - React + TypeScript
- ✅ **로컬 우선** - 인터넷 없이 작동
- ✅ **한국어 최적화** - 한국 비즈니스에 맞춤
- ✅ **실제 사용 중** - 이론이 아닌 실전 프로젝트

---

## 📜 라이선스

Copyright © 2025 Chance Company

---

## 🗺️ 문서 네비게이션

```
📄 README.md (현재)
├─ 📄 QUICK_START_CHECKLIST.md        ← 5분 빠른 시작
├─ 📄 SETUP_GUIDE.md                  ← 상세 설치 가이드
├─ 📄 PROJECT_CONTEXT_FOR_AI.md       ← AI용 상세 설명
└─ 📁 erp-app/
   ├─ 📄 README.md                    ← 앱 기능 설명
   ├─ 📄 WEB_SERVER_README.md         ← 웹 서버 가이드
   └─ 📄 RAILWAY_DEPLOYMENT.md        ← 배포 가이드
```

---

**버전:** 1.0  
**최종 업데이트:** 2026년 1월 5일  
**제작:** Chance Company

---

🚀 **준비되셨나요?** [QUICK_START_CHECKLIST.md](QUICK_START_CHECKLIST.md)로 시작하세요!

