# MD Converter v3 — Universal Content to Markdown Workspace

MD Converter v3 is a **privacy-first, local-first static web application** (PWA) designed to extract clean, structured Markdown from a wide variety of content formats (documents, images, audio, video, online transcripts, drawing annotations, and PLC/Assembly source code). 

By converting files to Markdown, you can reduce AI LLM token usage by **70% to 90%** while keeping your data safe, offline, and compliant with PDPA.

---

## 📄 Key Features in v3

*   **Premium Dark Productivity Workspace**: Re-architected UI inspired by modern tools (Linear, Raycast, Vercel) with sleek slate surfaces, Inter + Noto Sans Thai typography, and refined micro-interactions.
*   **Local-First Architecture**: 100% of standard files, images (OCR), and drawing parsers run locally in your web browser. No files are uploaded to any server.
*   **Privacy & PDPA Sanitizer**: Client-side anonymization filter that automatically redacts corporate names (e.g. `บริษัท...จำกัด`, `Co., Ltd.`) and custom keywords into sequential placeholders (`[Company A]`, `[Company B]`).
*   **Advanced Settings Drawer**: Non-intrusive slide-over drawer for configuring OCR languages, custom PDPA keywords, and cloud transcription API keys.
*   **Installable PWA**: Offline-enabled via Service Workers (`md-converter-v3.0.0`). Works anywhere, even without an active internet connection.
*   **Side-by-Side Result Workspace**: Live Markdown text editor, real-time token reduction gauge, and compiled HTML preview pane.
*   **Batch Multi-File Queue**: Queue multiple files of different types together, track individual progress, and export all converted Markdown files in a single `.zip` package.

---

## 🛠 Supported Formats

| Format Type | Extensions | Conversion Engine / Strategy | Processing Location |
| :--- | :--- | :--- | :--- |
| **Documents** | `.docx`, `.doc` | Mammoth.js text rendering | 🟢 100% Local (Browser) |
| **PDF** | `.pdf` | PDF.js asynchronous worker | 🟢 100% Local (Browser) |
| **Spreadsheets** | `.xlsx`, `.xls`, `.csv` | SheetJS sheet-to-json table converter | 🟢 100% Local (Browser) |
| **Presentations** | `.pptx`, `.ppt` | JSZip & OpenXML Slide XML text extraction | 🟢 100% Local (Browser) |
| **Plain Text** | `.txt`, `.html`, `.xml`, `.json`, `.md` | DOMParser & custom code block formatting | 🟢 100% Local (Browser) |
| **Drawing / CAD** | `.dxf` | Custom group-code string extractor | 🟢 100% Local (Browser) |
| **PLC / Assembly** | `.asm`, `.s`, `.st`, `.il`, `.ld` | Code block wrappers (preserving indentation) | 🟢 100% Local (Browser) |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp` | Tesseract.js (Thai + English) Web Worker | 🟢 100% Local (Browser) |
| **Audio** | `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm` | Web Speech API (Local) / Whisper & Gemini APIs | 🟡 Local / External API |
| **Video** | `.mp4`, `.mov`, `.webm` | Web Audio API extraction + External APIs | 🟡 Local / External API |
| **YouTube** | Paste Transcript / URL Placeholder | Transcript cleaning (timestamps / speaker mapping) | 🟢 100% Local (Browser) |

---

## 🚀 Getting Started (Browser App)

### Quick Run
1. Double-click `index.html` or host via local static server (e.g. `python -m http.server 8080`).
2. Select a source tab matching your input type (e.g., Documents, Images, Audio).
3. Drag and drop files into the target area, adjust settings (like PDPA anonymization or Presets), and click **Convert Queue**.
4. Copy the text or download the resulting `.md` or ZIP archive.

### PWA Installation
Open the app in Google Chrome or Microsoft Edge. Click the **Install Icon** in the address bar to add MD Converter as a standalone desktop utility with offline desktop shortcuts.

---

## 🐍 Offline Python Fallback (For Large Files)

For very large PDF files (e.g., documents exceeding 100+ pages or 50MB), client-side browser memory limits may cause tab crashes. We have provided a fast, high-performance offline script.

### Installation
```bash
pip install pypdf
# (Optional for 10x faster parsing)
pip install pymupdf
```

### Usage
* **Windows Drag-and-Drop**: Drag a large PDF file and drop it directly onto the batch script `scripts/convert_large_pdf.bat`.
* **CLI**:
  ```bash
  python scripts/pdf_converter.py "D:\my_giant_paper.pdf"
  ```

---

## 🔒 Security & Data Compliance

1. **No Telemetry / Analytics**: The application collects no metrics and makes no background connections.
2. **API Keys Safety**: Transcription API keys for OpenAI Whisper or Google Gemini are stored strictly in your browser's local `localStorage` cache. They are sent directly to official endpoints via client-side `fetch` requests.
3. **XSS Prevention**: User inputs are escaped, and the Markdown-to-HTML parser uses native DOM string mapping to prevent execution of injected scripts.

---

## 📄 License & Third Party Libraries

* **Mammoth.js**: BSD-2-Clause
* **PDF.js**: Apache-2.0
* **SheetJS (XLSX)**: Apache-2.0
* **JSZip**: MIT / GPLv3
* **Tesseract.js**: Apache-2.0
* **Project License**: MIT License (See `LICENSE` file)
