@echo off
chcp 65001 > nul
echo ========================================
echo  ERP 웹 서버 시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 필요한 패키지 설치 중...
call npm install
if errorlevel 1 (
    echo 패키지 설치 실패!
    pause
    exit /b 1
)

echo.
echo [2/3] 프론트엔드 빌드 중...
call npm run build
if errorlevel 1 (
    echo 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [3/3] 서버 시작 중...
echo.
echo ========================================
echo  ERP 시스템이 실행되었습니다!
echo  웹 브라우저에서 다음 주소로 접속하세요:
echo  http://localhost:3000
echo ========================================
echo.
echo  종료하려면 Ctrl+C를 누르세요.
echo.

call npm run server

pause

