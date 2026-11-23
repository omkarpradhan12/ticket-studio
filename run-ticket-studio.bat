@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>&1
if not errorlevel 1 (
  set "PYTHON=py"
) else (
  where python >nul 2>&1
  if errorlevel 1 (
    echo Python was not found. Install Python or run this folder with VS Code Live Server.
    pause
    exit /b 1
  )
  set "PYTHON=python"
)

start "" /B powershell -NoProfile -Command "$url='http://127.0.0.1:8000'; $ready=$false; for($i=0;$i -lt 100 -and -not $ready;$i++){ $ready=Test-NetConnection 127.0.0.1 -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue; if(-not $ready){Start-Sleep -Milliseconds 300} }; if($ready){Start-Process $url}"
%PYTHON% -m http.server 8000 --bind 127.0.0.1

echo.
echo Ticket Studio server stopped.
pause
