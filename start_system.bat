@echo off
TITLE Insurance Document Intelligence Lab - Launcher
echo =================================================================
echo  INSURANCE DOCUMENT INTELLIGENCE LAB
echo  Extract less blindly. Verify more intelligently.
echo =================================================================
echo.

cd /d "D:\PDF Extracter\backend"
echo [1/2] Starting FastAPI Backend on port 8000...
start "Backend (FastAPI)" cmd /k "python run_backend.py"

cd /d "D:\PDF Extracter\frontend"
echo [2/2] Starting Next.js Production UI on port 3000...
start "Frontend (Next.js)" cmd /k "npm run start"

echo.
echo Application successfully launched:
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API:        http://localhost:8000/api
echo  - Interactive Docs:   http://localhost:8000/docs
echo.

