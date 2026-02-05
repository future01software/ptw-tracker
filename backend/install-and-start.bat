@echo off
set "PATH=C:\node;%PATH%"
echo ========================================
echo PTW-Tracker Backend Setup
echo ========================================
echo Node Path:
where node
echo NPM Path:
where npm
echo.

echo Installing ExcelJS package...
call npm install exceljs
echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
call npm run dev
