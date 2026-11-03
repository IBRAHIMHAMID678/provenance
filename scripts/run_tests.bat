@echo off
echo ====================================================
echo Running Pytest Verification Suite
echo ====================================================
cd /d "D:\PDF Extracter\backend"
set PYTHONPATH=D:\PDF Extracter\backend
pytest tests/ -v
pause

