@echo off
rem The Checker worker: keeps running, and starts again 30 seconds after any stop.
rem Double-click to start; close this window to stop it.
title Minka Asalam - Checker worker (keep this window open)
cd /d "%~dp0"
:loop
node src\worker.mjs >> "%~dp0worker-console.log" 2>&1
echo %date% %time% the worker stopped; starting again in 30 seconds >> "%~dp0worker-console.log"
timeout /t 30 /nobreak > nul
goto loop
