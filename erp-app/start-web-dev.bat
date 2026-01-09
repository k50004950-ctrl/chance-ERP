@echo off
chcp 65001 > nul
echo ========================================
echo  ERP 개발 모드 시작
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 필요한 패키지 설치 중...
call npm install
if errorlevel 1 (
    echo 패키지 설치 실패!
    pause
    exit /b 1
)

echo.
echo [2/2] 개발 서버 시작 중...
echo.
echo ========================================
echo  개발 모드로 ERP 시스템이 실행됩니다!
echo  - 프론트엔드: http://localhost:5173
echo  - 백엔드: http://localhost:3000
echo ========================================
echo.
echo  종료하려면 Ctrl+C를 누르세요.
echo.

call npm run server:dev

pause

