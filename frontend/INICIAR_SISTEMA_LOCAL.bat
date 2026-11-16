@echo off
title Orquestador RPA LAD-6819 - Servidor Local Next.js
color 0A

echo =====================================================================
echo           ORQUESTADOR RPA LAD-6819 - SISTEMA LOCAL FULLSTACK
echo      Next.js 14 + TypeScript + Firebase (Sin Dependencias Python)
echo =====================================================================
echo.
echo Iniciando servidor en http://localhost:3000 ...
echo.

cd /d "%~dp0"

:: Abrir navegador automaticamente despues de 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Iniciar servidor de desarrollo de Next.js en puerto estandar 3000
npm run dev -- -p 3000

pause
