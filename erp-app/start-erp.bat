@echo off
title ERP 시스템 시작 중...
echo ================================
echo   ERP 시스템을 시작합니다...
echo ================================
echo.
cd /d "%~dp0"
echo 서버를 시작하는 중입니다. 잠시만 기다려주세요...
echo.
start cmd /k "npm run electron:dev"
echo.
echo 앱이 곧 열립니다!
timeout /t 3 /nobreak >nul
exit

