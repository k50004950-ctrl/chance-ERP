# 🚀 프로젝트 초기 설정 가이드

**대상:** 이 프로젝트를 처음 받은 개발자  
**목적:** 다른 컴퓨터/다른 사용자 계정에서 프로젝트를 처음 설정하는 방법

---

## ⚠️ 시작하기 전에

이 문서는 다음과 같은 경우를 위한 가이드입니다:
- ✅ 프로젝트 폴더를 다른 컴퓨터로 복사한 경우
- ✅ 다른 GitHub 계정으로 작업하는 경우
- ✅ 다른 Cursor 계정으로 작업하는 경우
- ✅ 완전히 새로운 환경에서 시작하는 경우

---

## 📋 1단계: 필수 소프트웨어 설치

### 1-1. Node.js 설치 (필수)
- **최소 버전:** Node.js 22.12.0 이상
- **다운로드:** https://nodejs.org/
- **확인 방법:**
  ```bash
  node --version
  npm --version
  ```

### 1-2. Git 설치 (선택)
- **다운로드:** https://git-scm.com/
- **확인 방법:**
  ```bash
  git --version
  ```

### 1-3. Cursor IDE 설치 (선택)
- **다운로드:** https://cursor.sh/
- AI 기능을 사용하려면 Cursor 계정 필요

### 1-4. SQLite Viewer (선택, 권장)
- **DB Browser for SQLite:** https://sqlitebrowser.org/
- 데이터베이스 내용을 GUI로 확인하기 위함

---

## 🔧 2단계: Git 설정 변경 (다른 GitHub 계정 사용 시)

### 2-1. 기존 Git 설정 확인
```bash
cd "C:\a make your dream\chance company\HRM"
git config user.name
git config user.email
```

### 2-2. 본인의 정보로 변경
```bash
# 로컬 프로젝트에만 적용 (권장)
git config user.name "본인이름"
git config user.email "본인이메일@example.com"

# 또는 전역 설정 (컴퓨터 전체에 적용)
git config --global user.name "본인이름"
git config --global user.email "본인이메일@example.com"
```

### 2-3. Git 원격 저장소 변경 (필요시)
```bash
# 현재 원격 저장소 확인
git remote -v

# 원격 저장소 제거
git remote remove origin

# 본인의 GitHub 저장소 추가
git remote add origin https://github.com/본인계정/저장소이름.git

# 또는 새로 시작 (Git 히스토리 삭제)
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/본인계정/저장소이름.git
git push -u origin main
```

---

## 📦 3단계: 프로젝트 의존성 설치

### 3-1. erp-app 폴더로 이동
```bash
cd erp-app
```

### 3-2. 기존 node_modules 삭제 (선택, 권장)
```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Windows CMD
rmdir /s /q node_modules
del package-lock.json
```

### 3-3. 새로 설치
```bash
npm install
```

⏱️ **예상 소요 시간:** 5-10분 (인터넷 속도에 따라)

### 3-4. 설치 확인
```bash
npm list --depth=0
```

---

## 🗄️ 4단계: 데이터베이스 설정

### 4-1. 기존 데이터베이스 처리

**옵션 A: 기존 데이터 유지**
- `server/erp.db` 파일이 있다면 그대로 사용
- 기존 사용자, 제품, 직원 데이터 유지됨

**옵션 B: 새로 시작 (권장)**
```bash
# server 폴더로 이동
cd server

# 기존 데이터베이스 백업
copy erp.db erp.db.backup

# 데이터베이스 삭제
del erp.db

# 부모 폴더로 이동
cd ..
```

### 4-2. 데이터베이스 자동 생성
서버를 첫 실행하면 자동으로 생성됩니다.

---

## 🚀 5단계: 첫 실행 테스트

### 5-1. 웹 서버 모드로 테스트 (권장)

**방법 1: 배치 파일 사용 (간단)**
```bash
# 개발 모드 (핫 리로드)
start-web-dev.bat

# 프로덕션 모드
start-web-server.bat
```

**방법 2: 수동 실행**
```bash
# 개발 모드
npm run server:dev

# 프로덕션 모드
npm run build
npm run server
```

### 5-2. 브라우저에서 접속
- **개발 모드:** http://localhost:5173
- **프로덕션 모드:** http://localhost:3000

### 5-3. 로그인 테스트
- **아이디:** `admin`
- **비밀번호:** `admin123`

✅ **로그인 성공하면 설치 완료!**

---

## 🖥️ 6단계: Electron 데스크톱 앱 테스트 (선택)

### 6-1. 개발 모드 실행
```bash
npm run electron:dev
```

### 6-2. 실행 파일 빌드
```bash
npm run electron:build
```

빌드된 파일: `release/` 폴더

---

## 🔐 7단계: 보안 설정 (중요!)

### 7-1. 기본 관리자 비밀번호 변경
1. `admin`으로 로그인
2. **설정 > 계정 설정** 메뉴
3. 비밀번호 변경

### 7-2. 환경 변수 설정 (선택)

`erp-app/` 폴더에 `.env` 파일 생성:

```env
# 서버 포트
PORT=3000

# 최대 파일 업로드 크기 (바이트)
MAX_FILE_SIZE=104857600

# 업로드 디렉토리
UPLOAD_DIR=./server/uploads/

# 환경 (development 또는 production)
NODE_ENV=development
```

---

## 🎯 8단계: Cursor AI 설정 (Cursor 사용 시)

### 8-1. Cursor 계정 로그인
1. Cursor IDE 실행
2. 우측 상단 계정 아이콘 클릭
3. 본인의 Cursor 계정으로 로그인

### 8-2. AI 컨텍스트 문서 읽기
1. **`PROJECT_CONTEXT_FOR_AI.md`** 파일 열기
2. Cursor 채팅창에 다음과 같이 입력:
   ```
   이 프로젝트를 처음 받았어. PROJECT_CONTEXT_FOR_AI.md 파일을 읽고 프로젝트 구조를 파악해줘.
   ```
3. 파일을 드래그하여 채팅창에 업로드

### 8-3. Cursor 설정 권장사항
- **AI Rules 설정:**
  - Settings > Cursor Settings > Rules
  - 추가 규칙: "한국어로 대답하기", "코드에 주석 추가하기" 등

---

## ✅ 9단계: 설치 확인 체크리스트

설치가 제대로 되었는지 확인하세요:

- [ ] Node.js 버전이 22.12.0 이상인가?
- [ ] `npm install`이 에러 없이 완료되었나?
- [ ] 웹 서버가 정상적으로 실행되나?
- [ ] 브라우저에서 로그인이 되나?
- [ ] 대시보드가 정상적으로 보이나?
- [ ] Git 사용자 정보가 본인 것으로 설정되었나?
- [ ] 기본 관리자 비밀번호를 변경했나? (권장)

**모두 체크되었다면 설치 완료! 🎉**

---

## 🐛 문제 해결 (Troubleshooting)

### 문제 1: `npm install` 실패

**원인:** Node.js 버전이 낮거나 npm 캐시 문제

**해결:**
```bash
# Node.js 버전 확인
node --version

# npm 캐시 정리
npm cache clean --force

# 재시도
npm install
```

### 문제 2: 포트 충돌 (Port 3000 already in use)

**원인:** 다른 프로그램이 3000 포트 사용 중

**해결:**
```bash
# 포트 변경
set PORT=3001 && npm run server

# 또는 .env 파일에 PORT=3001 추가
```

### 문제 3: 데이터베이스 오류

**원인:** 손상된 데이터베이스 파일

**해결:**
```bash
# 기존 DB 삭제
cd erp-app/server
del erp.db

# 서버 재시작 (자동 재생성됨)
cd ..
npm run server
```

### 문제 4: Electron 앱이 실행되지 않음

**원인:** 빌드가 안 되어있거나 경로 문제

**해결:**
```bash
# 먼저 빌드
npm run build

# Electron 실행
npm run electron:dev
```

### 문제 5: "Cannot find module" 오류

**원인:** node_modules 문제

**해결:**
```bash
# 완전히 삭제 후 재설치
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 문제 6: Git 권한 오류

**원인:** 이전 사용자의 Git 자격 증명

**해결:**
```bash
# Windows 자격 증명 관리자에서 Git 자격 증명 삭제
# 제어판 > 자격 증명 관리자 > Windows 자격 증명

# 또는 Git 명령어로
git config --global credential.helper ""
```

---

## 📁 중요 파일 및 폴더 설명

### 변경하지 말아야 할 것들
- ❌ `node_modules/` - npm이 자동 관리
- ❌ `dist/` - 빌드 시 자동 생성
- ❌ `package-lock.json` - npm이 자동 관리

### 백업 권장 파일
- ✅ `server/erp.db` - 모든 데이터
- ✅ `server/uploads/` - 업로드된 파일
- ✅ `.env` - 환경 변수 설정

### 개인화 가능한 파일
- ✅ `.env` - 환경 변수
- ✅ `README.md` - 프로젝트 설명
- ✅ `package.json` - 프로젝트 메타데이터

---

## 🔄 업데이트 받기 (원본 프로젝트가 업데이트된 경우)

### 방법 1: Git 사용
```bash
# 원본 저장소 추가 (최초 1회)
git remote add upstream https://github.com/원본계정/원본저장소.git

# 최신 변경사항 가져오기
git fetch upstream

# 병합
git merge upstream/main
```

### 방법 2: 수동 복사
1. 새 버전 폴더를 받음
2. `server/erp.db` 백업
3. `server/uploads/` 백업
4. `.env` 백업
5. 새 버전에 백업 파일들 복사
6. `npm install` 재실행

---

## 📞 추가 도움이 필요한 경우

### AI 활용 (Cursor 사용 시)
```
다음과 같은 오류가 발생했어:
[오류 메시지 복사-붙여넣기]

어떻게 해결할 수 있을까?
```

### 개발자 커뮤니티
- **Stack Overflow:** https://stackoverflow.com/
- **GitHub Issues:** 프로젝트 저장소의 Issues 탭

### 관련 문서
- `PROJECT_CONTEXT_FOR_AI.md` - AI를 위한 프로젝트 설명
- `erp-app/README.md` - 프로젝트 개요
- `erp-app/WEB_SERVER_README.md` - 웹 서버 가이드
- `erp-app/RAILWAY_DEPLOYMENT.md` - 클라우드 배포 가이드

---

## 🎓 다음 단계

설치가 완료되었다면:

1. **프로젝트 구조 파악**
   - `PROJECT_CONTEXT_FOR_AI.md` 읽기
   - `src/` 폴더 구조 둘러보기

2. **코드 이해하기**
   - `src/App.tsx` - 라우팅 구조
   - `server/index.js` - API 엔드포인트
   - `src/types/electron.ts` - 데이터 타입

3. **기능 테스트**
   - 직원 등록해보기
   - 제품 등록해보기
   - 출퇴근 기록해보기

4. **커스터마이징**
   - 회사명 변경
   - 로고 변경
   - 메뉴 구조 조정

---

## ⚡ 빠른 참조

### 자주 사용하는 명령어
```bash
# 개발 모드 실행 (웹)
npm run server:dev

# 프로덕션 빌드 & 실행
npm run build && npm run server

# Electron 앱 실행
npm run electron:dev

# 의존성 설치
npm install

# 데이터베이스 위치
erp-app/server/erp.db
```

### 기본 정보
- **포트:** 3000 (웹 서버), 5173 (개발 서버)
- **기본 계정:** admin / admin123
- **데이터베이스:** SQLite (erp-app/server/erp.db)
- **Node.js 버전:** 22.12.0 이상

---

**작성일:** 2026년 1월 5일  
**버전:** 1.0  
**작성자:** AI Assistant

이 가이드대로 따라하시면 누구나 쉽게 프로젝트를 설정할 수 있습니다! 💪

