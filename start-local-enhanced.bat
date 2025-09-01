C:\Users\StevenKok\Desktop\hkit-course-analyzer\start-local-enhanced.bat@echo off
title HKIT Course Analyzer - Local Enhanced Mode
echo ========================================
echo   HKIT Course Analyzer - Local Enhanced
echo ========================================
echo.
echo Starting local server on port 8000...
echo.

REM Start Python server
echo Starting Python HTTP server...
start cmd /k "python -m http.server 8000"

REM Wait a moment for server to start
timeout /t 2 /nobreak >nul

REM Open browser to the local enhanced version
echo Opening browser to local enhanced mode...
start http://localhost:8000/local/enhanced.html

echo.
echo ========================================
echo Server is running at: http://localhost:8000/local/enhanced.html
echo.
echo Press Ctrl+C in the server window to stop
echo ========================================
echo.
pause