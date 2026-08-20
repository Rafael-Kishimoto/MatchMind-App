@echo off
cd /d "%~dp0"
echo ============================================
echo   MatchMind - starting the app
echo ============================================
echo.
echo Keep THIS window open while you use the app.
echo When you see "Local: http://localhost:5173/"
echo below, open that link in your browser.
echo.
echo (To stop the app: close this window.)
echo.
call npm run dev
echo.
echo The app has stopped. You can close this window,
echo or run start-app.bat again to restart it.
pause
