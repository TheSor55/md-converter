@echo off
chcp 65001 >nul
title MD Converter

echo ==================================================
echo   MD Converter - เครื่องมือแปลงไฟล์เป็น Markdown
echo ==================================================
echo.

:: 1. ตรวจสอบว่าเครื่องมี Python หรือไม่
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] ไม่พบ Python ติดตั้งอยู่ในเครื่องนี้!
    echo กรุณาติดตั้ง Python 3.10 ขึ้นไป และสั่ง 'pip install markitdown[all]' ก่อนใช้งานสคริปต์นี้
    echo.
    echo *หมายเหตุ: คุณยังสามารถใช้ไฟล์ MD_Converter.html บนเบราว์เซอร์ได้ปกติโดยไม่ต้องใช้ Python
    echo --------------------------------------------------
    pause
    exit /b
)

:: 2. กรณีลากโฟลเดอร์/ไฟล์มาวางบนตัว .bat (Drag & Drop)
if "%~1" neq "" (
    echo กำลังแปลงไฟล์ตามที่คุณลากมาวาง...
    echo.
    python "%~dp0convert.py" %*
    goto end
)

:: 3. กรณีดับเบิ้ลคลิกรันปกติ
echo [1] กด 1 : แปลงไฟล์ในโฟลเดอร์ตัวอย่างดีฟอลต์ (D:\C8\...)
echo [2] กด 2 : ใส่ Path โฟลเดอร์ที่คุณต้องการด้วยตนเอง
echo.
set /p opt="กรุณาเลือกเมนู (1 หรือ 2): "

if "%opt%"=="1" (
    echo.
    echo กำลังแปลงโฟลเดอร์ต้นทางดีฟอลต์...
    python "%~dp0convert.py" "D:\C8\ไฟล์ล่าสุด 12072569" "D:\C8\บทความข้อมูลวิชาการทางสุขภาพ"
) else if "%opt%"=="2" (
    echo.
    set /p input_path="วาง Path โฟลเดอร์ที่ต้องการแปลงที่นี่: "
    echo.
    if exist "%input_path%" (
        python "%~dp0convert.py" "%input_path%"
    ) else (
        echo [ERROR] ไม่พบ Path โฟลเดอร์ที่คุณระบุ
    )
) else (
    echo.
    echo ตัวเลือกไม่ถูกต้อง
)

:end
echo.
echo ==================================================
echo การแปลงไฟล์เรียบร้อยแล้ว
echo.
pause
