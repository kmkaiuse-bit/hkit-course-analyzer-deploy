@echo off
echo 🚀 Starting HKIT Course Analyzer Local Server...
echo.

REM Check if Python 3 is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3 from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Change to the directory containing this script
cd /d "%~dp0"

REM Start the Python server
python start-server.py

pause
