@echo off
title Orquestador RPA LAD-6819 - Servidor Local Next.js
color 0A

echo =====================================================================
echo           ORQUESTADOR RPA LAD-6819 - SISTEMA LOCAL FULLSTACK
echo      Next.js 14 + TypeScript + Firebase (Sin Dependencias Python)
echo =====================================================================
echo.
echo Iniciando servidor en http://localhost:3001 ...
echo.

cd /d "%~dp0"

:: Abrir navegador automaticamente despues de 2 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3001"

:: Iniciar servidor de produccion optimizado de Next.js
npm run start -- -p 3001

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Iniciando en modo desarrollo...
    npm run dev -- -p 3001
)

pause
