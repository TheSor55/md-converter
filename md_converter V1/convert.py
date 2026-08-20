"""
convert.py - Script CLI สำหรับแปลงไฟล์เป็น Markdown
วัตถุประสงค์: ลดการใช้ Token AI

รองรับ: PDF, DOCX, PPTX, XLSX, HTML, TXT, CSV, JPG, PNG ฯลฯ

การใช้งาน:
  python convert.py <path1> [path2] [path3] ...

ตัวอย่าง:
  python convert.py "D:\\C8\\ไฟล์ล่าสุด 12072569"
  python convert.py "D:\\C8\\ไฟล์ล่าสุด 12072569" "D:\\C8\\บทความข้อมูลวิชาการทางสุขภาพ"
  python convert.py "D:\\C8\\ไฟล์ล่าสุด 12072569\\แนะนำตัว.docx"
"""

import sys
import os
import io
import re

# Fix Windows terminal encoding
if sys.stdout.encoding and sys.stdout.encoding.lower() in ('cp874', 'cp1252', 'ascii'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
import time
from pathlib import Path
from datetime import datetime

try:
    from markitdown import MarkItDown
except ImportError:
    print("❌ ไม่พบ markitdown กรุณารัน: pip install markitdown[all]")
    sys.exit(1)

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

# ============================================================
# ประเภทไฟล์ที่รองรับ
# ============================================================
SUPPORTED_EXTENSIONS = {
    # เอกสาร
    ".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls",
    # ข้อความ
    ".txt", ".csv", ".json", ".xml", ".html", ".htm",
    # รูปภาพ
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff",
    # อื่นๆ
    ".zip", ".epub",
}

OUTPUT_BASE = Path(__file__).parent / "output"


def estimate_tokens(text: str) -> int:
    """ประมาณจำนวน token (คร่าวๆ 1 token ≈ 4 ตัวอักษรภาษาอังกฤษ หรือ 2 ตัวอักษรภาษาไทย)"""
    return max(1, len(text) // 3)


def sanitize_filename(name: str) -> str:
    """ทำความสะอาดชื่อไฟล์ (รองรับภาษาไทย)"""
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    return name.strip()


def convert_file(md: MarkItDown, file_path: Path, output_dir: Path) -> dict:
    """แปลงไฟล์เดียว คืนค่าสถิติ"""
    result = {
        "file": file_path.name,
        "success": False,
        "original_bytes": 0,
        "md_bytes": 0,
        "original_tokens": 0,
        "md_tokens": 0,
        "error": None,
        "output_path": None,
    }

    try:
        if not file_path.exists():
            raise FileNotFoundError(f"ไม่พบไฟล์: {file_path}")
            
        orig_size = file_path.stat().st_size
        result["original_bytes"] = orig_size

        out_name = sanitize_filename(file_path.stem) + ".md"
        out_path = output_dir / out_name

        # ตรวจสอบว่าเคยแปลงแล้วหรือไม่ (Incremental conversion)
        if out_path.exists() and out_path.stat().st_size > 0:
            md_text = out_path.read_text(encoding="utf-8")
            result["success"] = True
            result["md_bytes"] = out_path.stat().st_size
            result["original_tokens"] = estimate_tokens(" " * orig_size)  # rough
            result["md_tokens"] = estimate_tokens(md_text)
            result["elapsed"] = 0.0
            result["output_path"] = str(out_path)
            return result

        start = time.time()
        converted = md.convert(str(file_path))
        elapsed = time.time() - start

        md_text = converted.text_content or ""

        # บันทึกไฟล์ .md
        out_path.write_text(md_text, encoding="utf-8")

        # คำนวณสถิติ
        result["success"] = True
        result["md_bytes"] = out_path.stat().st_size
        result["original_tokens"] = estimate_tokens(" " * orig_size)  # rough
        result["md_tokens"] = estimate_tokens(md_text)
        result["elapsed"] = round(elapsed, 2)
        result["output_path"] = str(out_path)

    except Exception as e:
        result["error"] = str(e)

    return result


def collect_files(paths: list[str]) -> list[Path]:
    """รวบรวมไฟล์จาก path ที่ให้มา (รองรับทั้งไฟล์และโฟลเดอร์)"""
    files = []
    for p in paths:
        path = Path(p)
        if not path.exists():
            print(f"⚠️  ไม่พบ path: {p}")
            continue
        if path.is_file():
            if path.suffix.lower() in SUPPORTED_EXTENSIONS:
                files.append(path)
            else:
                print(f"⚠️  ไม่รองรับนามสกุล: {path.suffix} ({path.name})")
        elif path.is_dir():
            found = [
                f for f in path.iterdir()
                if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
            ]
            found.sort(key=lambda f: f.name)
            files.extend(found)
            print(f"📁 โฟลเดอร์: {path.name} พบ {len(found)} ไฟล์")
    return files


def print_separator(char="-", width=60):
    print(char * width)


def print_summary(results: list[dict], total_elapsed: float):
    """แสดงสรุปผลการแปลง"""
    success = [r for r in results if r["success"]]
    failed  = [r for r in results if not r["success"]]

    total_orig_bytes = sum(r["original_bytes"] for r in success)
    total_md_bytes   = sum(r["md_bytes"] for r in success)
    total_orig_tok   = sum(r["original_tokens"] for r in success)
    total_md_tok     = sum(r["md_tokens"] for r in success)
    saved_pct = (1 - total_md_tok / total_orig_tok) * 100 if total_orig_tok else 0

    print_separator("═")
    print("📊 สรุปผลการแปลง")
    print_separator()
    print(f"  ✅ สำเร็จ       : {len(success):>4} ไฟล์")
    print(f"  ❌ ล้มเหลว      : {len(failed):>4} ไฟล์")
    print(f"  ⏱️  เวลาทั้งหมด  : {total_elapsed:.1f} วินาที")
    print_separator()
    print(f"  📦 ขนาดเดิม     : {total_orig_bytes/1024/1024:.2f} MB")
    print(f"  📄 ขนาด MD      : {total_md_bytes/1024:.1f} KB")
    print(f"  🎯 Token เดิม   : ~{total_orig_tok:,}")
    print(f"  🎯 Token MD     : ~{total_md_tok:,}")
    print(f"  💰 ประหยัด Token: {saved_pct:.1f}%")
    print_separator()

    if success:
        print(f"\n📁 ไฟล์ .md อยู่ที่: {success[0]['output_path'].rsplit(os.sep, 1)[0]}")

    if failed:
        print("\n⚠️  ไฟล์ที่ล้มเหลว:")
        for r in failed:
            print(f"   - {r['file']}: {r['error']}")
    print_separator("═")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nใช้งาน: python convert.py <path1> [path2] ...")
        sys.exit(0)

    paths = sys.argv[1:]
    print_separator("═")
    print("🔄 MarkItDown Converter — ลด Token AI")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_separator()

    files = collect_files(paths)

    if not files:
        print("❌ ไม่พบไฟล์ที่รองรับ")
        sys.exit(1)

    print(f"\n📋 ไฟล์ทั้งหมด: {len(files)} ไฟล์\n")

    # สร้าง output directories
    OUTPUT_BASE.mkdir(parents=True, exist_ok=True)

    md = MarkItDown()
    results = []
    start_all = time.time()

    iterator = tqdm(files, desc="กำลังแปลง", unit="ไฟล์") if HAS_TQDM else files

    for file_path in iterator:
        # สร้าง output subfolder ตามโฟลเดอร์ต้นทาง
        out_dir = OUTPUT_BASE / sanitize_filename(file_path.parent.name)
        out_dir.mkdir(parents=True, exist_ok=True)

        if not HAS_TQDM:
            idx = files.index(file_path) + 1
            print(f"[{idx}/{len(files)}] แปลง: {file_path.name}", end=" ... ", flush=True)

        result = convert_file(md, file_path, out_dir)
        results.append(result)

        if not HAS_TQDM:
            if result["success"]:
                print(f"✅ ({result.get('elapsed', 0):.1f}s)")
            else:
                print(f"❌ {result['error']}")

    total_elapsed = time.time() - start_all
    print()
    print_summary(results, total_elapsed)


if __name__ == "__main__":
    main()
