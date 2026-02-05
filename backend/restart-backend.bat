@echo off
set "PATH=C:\node;%PATH%"
cd /d "%~dp0"
echo ========================================
echo PTW-Tracker Backend Restart
echo ========================================
echo.
echo Stopping existing processes on port 4000...
rem Only kill if we find exact port match
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /C:":4000 "') do taskkill /f /pid %%a
echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
call npm run dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Server crashed or failed to start!
    echo Please take a photo of this screen if asking for help.
    pause
)
pause
