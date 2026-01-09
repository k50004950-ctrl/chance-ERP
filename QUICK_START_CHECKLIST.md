# ⚡ 빠른 시작 체크리스트

**새 컴퓨터에서 프로젝트를 처음 설정할 때 이 순서대로 진행하세요**

---

## 📝 체크리스트

### ✅ 1. 필수 소프트웨어 설치
```
[ ] Node.js 22.12.0 이상 설치
    다운로드: https://nodejs.org/
    확인: node --version

[ ] (선택) Git 설치
    다운로드: https://git-scm.com/

[ ] (선택) Cursor IDE 설치
    다운로드: https://cursor.sh/
```

---

### ✅ 2. Git 설정 변경 (다른 계정 사용 시)
```bash
cd "C:\a make your dream\chance company\HRM"

# 본인 정보로 변경
git config user.name "본인이름"
git config user.email "본인이메일@example.com"

# 원격 저장소 변경 (필요시)
git remote remove origin
git remote add origin https://github.com/본인계정/저장소.git
```

---

### ✅ 3. 프로젝트 설치
```bash
cd erp-app

# 기존 node_modules 삭제 (권장)
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 새로 설치
npm install
```
**⏱️ 예상 시간: 5-10분**

---

### ✅ 4. 데이터베이스 초기화 (선택)
```bash
# 새로 시작하려면 (기존 데이터 삭제)
cd server
del erp.db
cd ..
```

---

### ✅ 5. 첫 실행
```bash
# 방법 1: 배치 파일
start-web-dev.bat

# 방법 2: 수동 실행
npm run server:dev
```

---

### ✅ 6. 로그인 테스트
```
브라우저: http://localhost:5173
아이디: admin
비밀번호: admin123
```

---

### ✅ 7. 보안 설정
```
[ ] 관리자 비밀번호 변경
    설정 > 계정 설정

[ ] .env 파일 생성 (선택)
    PORT=3000
    NODE_ENV=development
```

---

## 🚨 문제 발생 시

### npm install 실패
```bash
npm cache clean --force
npm install
```

### 포트 충돌
```bash
set PORT=3001 && npm run server
```

### 데이터베이스 오류
```bash
cd server
del erp.db
cd ..
npm run server
```

---

## 📚 자세한 내용
- **SETUP_GUIDE.md** - 상세한 설치 가이드
- **PROJECT_CONTEXT_FOR_AI.md** - AI/Cursor용 프로젝트 설명

---

## 🎯 자주 쓰는 명령어

```bash
# 개발 실행
npm run server:dev

# 프로덕션 실행
npm run build && npm run server

# Electron 앱
npm run electron:dev
```

---

✅ **모두 완료하면 설치 끝! 🎉**

