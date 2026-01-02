@echo off
chcp 65001 >nul
title ERP 시스템

echo ============================================
echo   ERP 시스템 (재고관리 + 인사관리)
echo ============================================
echo.
echo   [1/2] 개발 서버를 시작합니다...
echo.

cd /d "C:\a make your dream\HRM\erp-app"

:: Vite 개발 서버를 백그라운드에서 실행
start /B cmd /c "npm run dev > nul 2>&1"

echo   [2/2] Electron 앱을 시작합니다...
echo   (약 10초 후 앱 창이 열립니다)
echo.

:: 10초 대기 (서버 시작 시간)
timeout /t 10 /nobreak >nul

:: Electron 실행
set NODE_ENV=development
call npx electron .

echo.
echo   앱이 종료되었습니다.
echo   개발 서버도 종료하려면 이 창을 닫으세요.
pause

