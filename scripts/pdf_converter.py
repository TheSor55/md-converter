# -*- coding: utf-8 -*-
"""
pdf_converter.py - High-Capacity Offline PDF to Markdown Converter
Usage:
  python pdf_converter.py <input_pdf_path> [output_md_path]

Requirements:
  pip install pypdf
  (Optional for faster parsing) pip install pymupdf
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 console output for Thai language support on Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def convert_pdf_to_md(pdf_path, md_path=None):
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"❌ Error: File not found: {pdf_path}")
        return False
        
    if not md_path:
        md_path = pdf_path.with_suffix('.md')
    else:
        md_path = Path(md_path)
        
    print(f"📄 Processing: {pdf_path.name}")
    print(f"📦 File size: {pdf_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    pages_text = []
    num_pages = 0
    
    # 1. Try PyMuPDF (fitz) - fastest and highest fidelity
    try:
        import fitz
        print("⚡ Using PyMuPDF (fitz) parser...")
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        
        for p_idx in range(num_pages):
            page = doc.load_page(p_idx)
            text = page.get_text()
            pages_text.append((p_idx + 1, text))
            # Inline progress print
            percent = int((p_idx + 1) / num_pages * 100)
            sys.stdout.write(f"\rProgress: [{p_idx+1}/{num_pages}] {percent}%")
            sys.stdout.flush()
        print("\nParsing completed successfully.")
        
    except ImportError:
        # 2. Fallback to pypdf (pure python, very lightweight)
        try:
            import pypdf
            print("🐍 PyMuPDF not found. Falling back to pypdf...")
            reader = pypdf.PdfReader(pdf_path)
            num_pages = len(reader.pages)
            
            for p_idx in range(num_pages):
                page = reader.pages[p_idx]
                text = page.extract_text() or ""
                pages_text.append((p_idx + 1, text))
                
                percent = int((p_idx + 1) / num_pages * 100)
                sys.stdout.write(f"\rProgress: [{p_idx+1}/{num_pages}] {percent}%")
                sys.stdout.flush()
            print("\nParsing completed successfully.")
            
        except ImportError:
            print("❌ Error: No PDF parser libraries found. Please run: pip install pypdf")
            return False
            
    # Build Markdown
    title = pdf_path.stem
    markdown_content = []
    markdown_content.append(f"# {title}\n")
    markdown_content.append(f"- **Source File**: {pdf_path.name}")
    markdown_content.append(f"- **Total Pages**: {num_pages}\n")
    markdown_content.append("---")
    
    for page_num, text in pages_text:
        clean_text = text.strip()
        if clean_text:
            markdown_content.append(f"\n## Page {page_num}\n")
            markdown_content.append(clean_text)
            
    # Write MD File
    try:
        md_path.write_text("\n".join(markdown_content), encoding='utf-8')
        print(f"✅ Success! Saved Markdown to: {md_path.name}")
        print(f"💾 MD size: {md_path.stat().st_size / 1024:.2f} KB")
        return True
    except Exception as e:
        print(f"❌ Failed to save markdown file: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Universal Content to Markdown - Offline PDF Fallback Script")
        print("Usage: python pdf_converter.py <input_pdf_path> [output_md_path]")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    md_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_pdf_to_md(pdf_path, md_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
