@echo off
echo Starting Financial ERP System servers...
echo.

echo Starting main application server...
start "Main App" cmd /k "cd /d e:\Financial-ERP-Sys && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting file upload server...
start "File Server" cmd /k "cd /d e:\Financial-ERP-Sys && npm run server"

echo.
echo Servers started successfully!
echo Main Application: http://10.143.139.79:8090
echo File Upload Server: http://10.143.139.79:3002
echo.
echo Press any key to exit...
pause >nul