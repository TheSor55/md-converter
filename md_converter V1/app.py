"""
app.py - Web App สำหรับแปลงไฟล์เป็น Markdown
รองรับ: Drag & Drop, Batch Convert, ดาวน์โหลด ZIP, แสดงสถิติ Token
"""

import sys
import os
import io
import re
import zipfile
import tempfile

# Fix Windows terminal encoding
if sys.stdout.encoding and sys.stdout.encoding.lower() in ('cp874', 'cp1252', 'ascii'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from pathlib import Path
from flask import (
    Flask, render_template, request,
    jsonify, send_file, send_from_directory
)

try:
    from markitdown import MarkItDown
except ImportError:
    raise SystemExit("❌ กรุณารัน: pip install markitdown[all]")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024  # 200 MB max upload

UPLOAD_FOLDER = Path(tempfile.gettempdir()) / "md_converter_uploads"
OUTPUT_FOLDER = Path(__file__).parent / "output" / "web_uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

SUPPORTED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
    ".txt", ".csv", ".json", ".xml", ".html", ".htm",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
    ".zip", ".epub",
}

md_engine = MarkItDown()


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 3)


def sanitize_filename(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', '_', name).strip()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/convert", methods=["POST"])
def api_convert():
    """รับไฟล์จาก Drag & Drop แปลงเป็น MD คืน JSON"""
    if "files" not in request.files:
        return jsonify({"error": "ไม่พบไฟล์"}), 400

    files = request.files.getlist("files")
    results = []

    for file in files:
        if not file.filename:
            continue

        ext = Path(file.filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": f"ไม่รองรับนามสกุล {ext}",
            })
            continue

        # บันทึกไฟล์ชั่วคราว
        tmp_path = UPLOAD_FOLDER / sanitize_filename(file.filename)
        file.save(str(tmp_path))
        orig_size = tmp_path.stat().st_size

        try:
            converted = md_engine.convert(str(tmp_path))
            md_text = converted.text_content or ""

            # บันทึก MD
            out_name = sanitize_filename(Path(file.filename).stem) + ".md"
            out_path = OUTPUT_FOLDER / out_name
            out_path.write_text(md_text, encoding="utf-8")

            md_size = out_path.stat().st_size
            orig_tokens = estimate_tokens("x" * orig_size)
            md_tokens   = estimate_tokens(md_text)
            saved_pct   = round((1 - md_tokens / max(orig_tokens, 1)) * 100, 1)

            results.append({
                "filename": file.filename,
                "out_name": out_name,
                "success": True,
                "orig_size_kb": round(orig_size / 1024, 1),
                "md_size_kb": round(md_size / 1024, 1),
                "orig_tokens": orig_tokens,
                "md_tokens": md_tokens,
                "saved_pct": saved_pct,
                "preview": md_text[:2000],  # ส่ง preview 2000 ตัวอักษรแรก
                "full_text": md_text,
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e),
            })
        finally:
            try:
                tmp_path.unlink()
            except Exception:
                pass

    return jsonify({"results": results})


@app.route("/api/convert_folder", methods=["POST"])
def api_convert_folder():
    """แปลงไฟล์จาก path โฟลเดอร์บนเครื่อง"""
    data = request.get_json()
    folder_path = data.get("path", "").strip()

    if not folder_path:
        return jsonify({"error": "กรุณาระบุ path"}), 400

    folder = Path(folder_path)
    if not folder.exists() or not folder.is_dir():
        return jsonify({"error": f"ไม่พบโฟลเดอร์: {folder_path}"}), 400

    files = [
        f for f in folder.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not files:
        return jsonify({"error": "ไม่พบไฟล์ที่รองรับในโฟลเดอร์นี้"}), 400

    out_dir = OUTPUT_FOLDER / sanitize_filename(folder.name)
    out_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for file_path in sorted(files):
        orig_size = file_path.stat().st_size
        try:
            converted = md_engine.convert(str(file_path))
            md_text = converted.text_content or ""

            out_name = sanitize_filename(file_path.stem) + ".md"
            out_path = out_dir / out_name
            out_path.write_text(md_text, encoding="utf-8")

            md_size   = out_path.stat().st_size
            orig_tokens = estimate_tokens("x" * orig_size)
            md_tokens   = estimate_tokens(md_text)
            saved_pct   = round((1 - md_tokens / max(orig_tokens, 1)) * 100, 1)

            results.append({
                "filename": file_path.name,
                "out_name": str(out_path),
                "success": True,
                "orig_size_kb": round(orig_size / 1024, 1),
                "md_size_kb": round(md_size / 1024, 1),
                "orig_tokens": orig_tokens,
                "md_tokens": md_tokens,
                "saved_pct": saved_pct,
            })
        except Exception as e:
            results.append({
                "filename": file_path.name,
                "success": False,
                "error": str(e),
            })

    return jsonify({"results": results, "output_dir": str(out_dir)})


@app.route("/api/download_zip", methods=["POST"])
def download_zip():
    """ดาวน์โหลดไฟล์ MD ทั้งหมดเป็น ZIP"""
    data = request.get_json()
    files_content = data.get("files", [])  # [{"name": "...", "content": "..."}]

    if not files_content:
        return jsonify({"error": "ไม่มีไฟล์"}), 400

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files_content:
            zf.writestr(f["name"], f["content"])

    zip_buf.seek(0)
    return send_file(
        zip_buf,
        mimetype="application/zip",
        as_attachment=True,
        download_name="converted_markdown.zip",
    )


@app.route("/api/download_single", methods=["POST"])
def download_single():
    """ดาวน์โหลดไฟล์ MD เดียว"""
    data = request.get_json()
    content = data.get("content", "")
    name    = data.get("name", "output.md")

    buf = io.BytesIO(content.encode("utf-8"))
    return send_file(
        buf,
        mimetype="text/markdown; charset=utf-8",
        as_attachment=True,
        download_name=name,
    )


if __name__ == "__main__":
    print("[START] Web App: http://localhost:5000")
    app.run(debug=True, port=5000, host="0.0.0.0")
