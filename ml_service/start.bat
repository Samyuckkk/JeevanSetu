@echo off
echo ============================================
echo  ML Service - Starting
echo ============================================

if not exist venv (
    echo ERROR: venv not found. Run setup.bat first.
    pause
    exit /b 1
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting ML service on http://127.0.0.1:8000 ...
echo Press Ctrl+C to stop.
echo.
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
