@echo off
echo ====================================================
echo Starting Insurance Document Intelligence Lab Backend
echo Target Drive: D:\PDF Extracter
echo ====================================================
cd /d "D:\PDF Extracter\backend"
set PYTHONPATH=D:\PDF Extracter\backend
python run_backend.py
pause

