@echo off
echo Starting Neve Amiel - Dev Mode
echo Server: http://localhost:3001
echo Client: http://localhost:5173
echo.

start "Server" cmd /k "cd server && npm run dev"
timeout /t 2 /nobreak >nul
start "Client" cmd /k "cd client && npm run dev"

echo Both processes started. Press any key to exit this window.
pause >nul
