@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Jieyou Post Office - Local Preview
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
echo.
pause
