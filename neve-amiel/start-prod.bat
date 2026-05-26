@echo off
echo Building client...
cd client && npm run build && cd ..
echo.
echo Starting production server on http://localhost:3001
echo.
set NODE_ENV=production
node server/index.js
