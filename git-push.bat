@echo off
cd /d "C:\chance erp\HRM"
git add -A
git commit -m "Fix: Disable unassigned filter after assigning salesperson"
git push origin master
pause
