# Railway 데이터 영구 저장 설정 가이드

## 문제 상황
Railway에서 배포할 때마다 SQLite 데이터베이스가 초기화되어 **모든 데이터(계정, 근태, 영업 정보 등)가 사라집니다**.

## 해결 방법: Railway Volume 사용

Railway Volume을 사용하면 배포 후에도 데이터가 영구적으로 보존됩니다.

### 1단계: Railway 대시보드 접속

1. [Railway 대시보드](https://railway.app)에 로그인
2. `chance-erp-production-b202` 프로젝트 선택
3. 서비스(Service) 클릭

### 2단계: Volume 추가

1. **Variables** 탭으로 이동
2. **+ Add Volume** 버튼 클릭
3. Volume 설정:
   - **Mount Path**: `/data`
   - **Name**: `erp-data` (원하는 이름)
4. **Add** 버튼 클릭

### 3단계: 환경 변수 추가 (선택사항)

Variables 탭에서:
- **Variable Name**: `DATA_DIR`
- **Value**: `/data`

이미 코드에서 `/data`를 기본값으로 사용하므로 이 단계는 선택사항입니다.

### 4단계: 재배포

Volume 추가 후 서비스가 자동으로 재배포됩니다.

## 확인 방법

서버 로그에서 다음 메시지를 확인:
```
Database path: /data/erp.db
```

## 주의사항

⚠️ **Volume 추가 전 데이터는 복구할 수 없습니다**
- Volume 설정 후부터 데이터가 보존됩니다
- 기존 데이터는 이미 사라졌다면 다시 입력해야 합니다

✅ **Volume 설정 후**
- 배포해도 데이터가 유지됩니다
- 계정, 근태, 영업 정보 등 모든 데이터가 영구 보존됩니다
- 서버 재시작 시에도 데이터가 그대로 남습니다

## 백업 권장사항

정기적으로 데이터베이스 백업을 받는 것을 권장합니다:

1. Railway CLI 설치:
   ```bash
   npm install -g @railway/cli
   ```

2. 로그인:
   ```bash
   railway login
   ```

3. 프로젝트 연결 및 데이터베이스 다운로드:
   ```bash
   railway link
   railway run cat /data/erp.db > backup.db
   ```

## 대안: PostgreSQL 사용

더 안정적인 운영을 위해 PostgreSQL로 마이그레이션하는 것도 고려할 수 있습니다:
- Railway에서 PostgreSQL 플러그인 제공
- 자동 백업 기능
- 더 나은 동시성 처리

하지만 현재 SQLite + Volume 조합으로도 충분히 안정적입니다.
