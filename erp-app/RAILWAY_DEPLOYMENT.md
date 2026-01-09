# 🚂 Railway 배포 가이드

Chance Company ERP를 Railway에 배포하는 방법입니다.

## 📋 사전 준비

1. **Railway 계정 생성**
   - https://railway.app 에서 계정 생성
   - GitHub 계정으로 로그인 권장

2. **GitHub 저장소 준비**
   - 프로젝트를 GitHub에 푸시
   - `.env` 파일이 제외되었는지 확인

## 🚀 배포 단계

### 1단계: Railway 프로젝트 생성

1. Railway 대시보드 접속
2. **"New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. 저장소 선택 (Chance Company HRM)

### 2단계: 환경 변수 설정

Railway 대시보드에서:

1. 프로젝트 선택
2. **"Variables"** 탭 클릭
3. 다음 환경 변수 추가:

```bash
NODE_ENV=production
PORT=3000
MAX_FILE_SIZE=104857600
SESSION_SECRET=<랜덤한 긴 문자열>
```

**SESSION_SECRET 생성 방법:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3단계: 볼륨 마운트 (데이터베이스 영속성)

⚠️ **중요**: SQLite 데이터베이스가 재배포 시 삭제되지 않도록 설정

1. 프로젝트 **"Settings"** 탭
2. **"Volumes"** 섹션
3. **"New Volume"** 클릭
4. 설정:
   - **Mount Path**: `/app/server`
   - **Size**: 1GB (무료는 1GB까지)
5. **"Add Volume"** 클릭

### 4단계: 배포

1. Railway가 자동으로 빌드 시작
2. 빌드 로그 확인:
   - `npm install`
   - `npm run build`
   - `npm run start:prod`
3. 배포 완료 후 **"Deployments"** 탭에서 URL 확인

### 5단계: 도메인 설정 (선택사항)

1. **"Settings"** 탭
2. **"Domains"** 섹션
3. **"Generate Domain"** 클릭
4. 또는 커스텀 도메인 연결

## 🔍 배포 확인

1. 생성된 URL 접속
2. 로그인 페이지 확인
3. 관리자 계정으로 로그인 테스트

## 📊 대량 업로드 테스트

프로덕션 환경에서 대량 데이터 업로드 테스트:

1. **일반 업로드** (1만 개 이하):
   - 기존 CSV 업로드 기능 사용
   - `/api/sales-db/upload-csv`

2. **대량 스트리밍 업로드** (1만 개 이상):
   - 스트리밍 엔드포인트 사용
   - `/api/sales-db/upload-csv-stream`
   - 500개씩 배치 처리로 메모리 최적화

## 🛠️ 문제 해결

### 배포 실패 시

1. **로그 확인**:
   - Railway 대시보드 → "Deployments" → 실패한 배포 클릭
   - 빌드 로그 확인

2. **일반적인 문제**:
   - `npm install` 실패: package.json 확인
   - 빌드 오류: `npm run build` 로컬에서 테스트
   - 시작 오류: `npm run start:prod` 로컬에서 테스트

### 데이터베이스 접근 불가

- 볼륨이 올바르게 마운트되었는지 확인
- `/app/server` 경로가 정확한지 확인

### 파일 업로드 실패

- MAX_FILE_SIZE 환경 변수 확인
- Railway의 메모리 제한 확인 (무료: 512MB)
- 대용량 파일은 스트리밍 엔드포인트 사용

## 💰 비용 안내

### 무료 티어
- $5 크레딧/월
- 512MB RAM
- 1GB 디스크
- 중소규모 사용에 충분

### 유료 플랜
- Hobby: $5/월 + 사용량
- 8GB RAM
- 100GB 디스크
- 대규모 운영 시 권장

## 🔄 업데이트 배포

코드 변경 시 자동 배포:

1. GitHub에 커밋 & 푸시
2. Railway가 자동으로 감지 및 재배포
3. 배포 완료까지 약 2-5분

수동 재배포:
1. Railway 대시보드
2. "Deployments" 탭
3. "Redeploy" 버튼 클릭

## 📱 모니터링

Railway 대시보드에서:
- **Metrics**: CPU, 메모리, 네트워크 사용량
- **Logs**: 실시간 서버 로그
- **Deployments**: 배포 히스토리

## 🔐 보안 권장사항

1. **환경 변수**:
   - 모든 비밀 정보는 환경 변수로 관리
   - SESSION_SECRET 정기 변경

2. **데이터베이스 백업**:
   - Railway CLI로 주기적 백업
   - 로컬에 백업 저장

3. **HTTPS**:
   - Railway는 자동으로 HTTPS 제공
   - 커스텀 도메인도 자동 SSL

## 📞 지원

문제 발생 시:
- Railway 공식 문서: https://docs.railway.app
- Discord 커뮤니티: https://discord.gg/railway
- GitHub Issues

---

**배포 성공을 기원합니다! 🎉**




