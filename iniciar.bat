@echo off
REM Arranca Comandas Saboratto sin depender del PATH del sistema.
REM Doble clic en este archivo, o ejecutarlo desde cualquier terminal.
setlocal
set "NODEDIR=%LOCALAPPDATA%\Programs\nodejs"

if not exist "%NODEDIR%\node.exe" (
  echo No se encontro Node.js en "%NODEDIR%".
  echo Instalalo de nuevo o avisa para reinstalarlo.
  pause
  exit /b 1
)

set "PATH=%NODEDIR%;%PATH%"
cd /d "%~dp0"

if not exist "node_modules\next" (
  echo Instalando dependencias por primera vez, esto tarda un par de minutos...
  call npm install --no-audit --no-fund
)

echo.
echo ================================================
echo   Comandas Saboratto
echo   Abre en el navegador:  http://localhost:3000
echo   Para detener: cierra esta ventana o Ctrl+C
echo ================================================
echo.

call npm run dev
pause
