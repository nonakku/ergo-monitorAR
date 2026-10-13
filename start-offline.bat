@echo off
rem ErgoMonitor AR offline launcher: starts a local web server and opens the browser.
rem Requires only Windows standard PowerShell (no Python, no admin rights).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
