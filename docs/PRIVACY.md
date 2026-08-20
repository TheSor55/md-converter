# Privacy & Data Processing Policy

**MD Converter v2** is designed with a **privacy-first, local-first** architecture. This document explains how your files, text, and keys are processed.

---

## 🔒 1. File & Text Processing (Static Converters)

For all standard conversions:
*   **DOCX, PDF, Excel (XLSX/XLS/CSV), PowerPoint (PPTX), DXF, Plain Text**:
    *   Files are loaded into your browser's temporary memory (`ArrayBuffer` / `Blob`).
    *   Text extraction is performed entirely by JavaScript libraries running inside your web browser (Mammoth.js, PDF.js, SheetJS, JSZip).
    *   **No data is transmitted over the internet.** You can disconnect your network connection entirely and continue converting these files.

---

## 🖼 2. Image OCR Processing

*   **Tesseract.js OCR**:
    *   OCR is executed locally inside a browser Web Worker.
    *   Images are analyzed page-by-page inside the worker thread.
    *   Language traineddata models are loaded into your browser's Cache Storage.
    *   No image files or parsed text leave your device.

---

## 🎙 3. Audio & Video Transcription (API Integrations)

For pre-recorded speech file transcription:
*   **Mode A (Browser speech)**: Uses the browser's speech recognition model. Voice audio input is processed on-device (depending on browser implementation).
*   **Mode B (AI Provider APIs)**:
    *   If you configure **OpenAI Whisper** or **Google Gemini API**, your audio/video tracks will be sent to the respective provider's endpoints.
    *   These requests are made **directly** from your browser to `https://api.openai.com` or `https://generativelanguage.googleapis.com`.
    *   No middleman server or proxy is used.
    *   Please review OpenAI's and Google Gemini's API data usage policies regarding text inputs.

---

## 🔑 4. API Keys Storage

*   Your API keys (OpenAI or Google Gemini) are stored strictly inside your browser's local sandbox (`localStorage`).
*   They are never saved to GitHub, never sent to the developers, and are only accessed when making direct calls to the official APIs.
*   To wipe all keys, clear your browser site data or click the **Clear All** button in the queue manager.

---

## 📊 5. Telemetry & Tracking

*   This application contains **no analytics tracking**, **no cookies**, and **no advertising trackers**.
*   It does not log conversion events or file sizes.
