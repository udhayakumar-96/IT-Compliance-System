@echo off
title Vigil - IT Asset Security Console
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed, or it is not on PATH.
  echo.
  echo 1. Open https://nodejs.org
  echo 2. Download Node.js 22 LTS
  echo 3. During setup, tick "Add to PATH"
  echo 4. Close this window, then run START-WINDOWS.bat again
  echo.
  pause
  exit /b 1
)

echo.
echo Installing packages (first run takes a few minutes^)...
echo.
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Starting Vigil...
echo When you see "Local: http://localhost:8080", open that address in Chrome.
echo Keep this window open while you use the console.
echo Press Ctrl+C to stop.
echo.
call npm run dev
pause
