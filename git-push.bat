@echo off
cd /d "C:\chance erp\HRM"
git add -A
git commit -m "Fix: Delete previous salesperson schedule when reassigning DB"
git push origin master
pause
