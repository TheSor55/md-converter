@echo off
chcp 65001 >nul
title MD Converter - Large PDF Offline Converter

echo ==================================================
echo   MD Converter v2 - เครื่องมือแปลงไฟล์ PDF ขนาดใหญ่
echo ==================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Python ติดตั้งอยู่ในเครื่องนี้!
    echo กรุณาติดตั้ง Python 3.10 ขึ้นไป และติ๊ก "Add Python to PATH"
    echo จากนั้นติดตั้งไลบรารี: pip install pypdf
    echo.
    pause
    exit /b
)

:: Check if file argument is supplied
if "%~1"=="" (
    echo [คำแนะนำ] ลากไฟล์ PDF ที่มีขนาดใหญ่หรือจำนวนหน้าเยอะๆ
    echo มาวางทับไอคอนไฟล์ .bat นี้เพื่อเริ่มแปลงระบบออฟไลน์ได้ทันที
    echo.
    set /p input_path="หรือระบุ Path ไฟล์ PDF ที่ต้องการแปลงตรงนี้: "
) else (
    set "input_path=%~1"
)

if "%input_path%"=="" (
    echo.
    echo ไม่มีการระบุไฟล์ใดๆ...
    pause
    exit /b
)

echo.
echo กำลังเริ่มประมวลผลไฟล์...
python "%~dp0pdf_converter.py" "%input_path%"

echo.
echo ==================================================
echo สิ้นสุดการประมวลผล
echo.
pause
