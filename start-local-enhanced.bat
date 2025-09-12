C:\Users\StevenKok\Desktop\hkit-course-analyzer\start-local-enhanced.bat@echo off
title HKIT Course Analyzer - Local Enhanced Mode with Learning Database
echo ========================================
echo   HKIT Course Analyzer - Local Enhanced
echo        with Learning Database System
echo ========================================
echo.
echo Starting Learning Database API Server...
echo.

REM Start Learning Database API Server (port 3001)
echo [1/3] Starting Learning Database API Server on port 3001...
start "Learning Server" cmd /k "npm run server"

REM Wait for learning server to initialize
echo [2/3] Waiting for learning server to initialize...
timeout /t 5 /nobreak >nul

REM Start Python HTTP server for frontend
echo [3/3] Starting Python HTTP server on port 8000...
start "Web Server" cmd /k "python -m http.server 8000"

REM Wait for web server to start
timeout /t 3 /nobreak >nul

REM Open browser to the local enhanced version
echo.
echo Opening browser to local enhanced mode with full learning capabilities...
start http://localhost:8000/local/enhanced.html

echo.
echo ========================================
echo  🌟 HKIT Course Analyzer is now running!
echo ========================================
echo  📡 Learning API Server: http://localhost:3001
echo  🌐 Web Application: http://localhost:8000/local/enhanced.html
echo  🧠 Learning Database: PostgreSQL (localhost:5432)
echo.
echo  ✅ Full learning database integration active
echo  📊 Real-time pattern storage and retrieval
echo  🎯 AI accuracy improvement enabled
echo.
echo ========================================
echo  To stop the application:
echo  1. Close both server windows (Learning & Web)
echo  2. Or press Ctrl+C in each server window
echo ========================================
echo.
pause