@echo off
echo ============================================
echo  ML Service - First Time Setup
echo ============================================

echo.
echo [1/3] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: python not found. Install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

echo.
echo [2/3] Activating venv and installing dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed. Check requirements.txt.
    pause
    exit /b 1
)

echo.
echo [3/3] Verifying uvicorn...
uvicorn --version
if errorlevel 1 (
    echo ERROR: uvicorn not found after install.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Setup complete. Run start.bat to launch.
echo ============================================
pause
