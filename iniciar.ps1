# Arranca Comandas Saboratto desde PowerShell sin depender del PATH.
# Uso:  .\iniciar.ps1
$nodeDir = "$env:LOCALAPPDATA\Programs\nodejs"

if (-not (Test-Path "$nodeDir\node.exe")) {
  Write-Host "No se encontro Node.js en $nodeDir" -ForegroundColor Red
  exit 1
}

$env:Path = "$nodeDir;$env:Path"
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules\next")) {
  Write-Host "Instalando dependencias por primera vez..." -ForegroundColor Yellow
  npm install --no-audit --no-fund
}

Write-Host ""
Write-Host "Comandas Saboratto -> http://localhost:3000" -ForegroundColor Green
Write-Host "Para detener: Ctrl+C" -ForegroundColor DarkGray
Write-Host ""

npm run dev
