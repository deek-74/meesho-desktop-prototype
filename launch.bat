@echo off
title Meesho Final Proto Desktop Launcher
echo =========================================
echo   Starting Meesho Final Proto Desktop...
echo =========================================
echo.
cd /d "%~dp0"
cmd /c npm.cmd run dev -- --open
pause
