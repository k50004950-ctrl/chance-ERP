@echo off
cd /d "C:\chance erp\HRM"
git add -A
git commit -m "Fix: Add notification_enabled to /api/users GET endpoints"
git push origin master
pause
