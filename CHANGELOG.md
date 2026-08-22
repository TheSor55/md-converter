# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-08-22

### Added
- **Premium Dark Productivity Workspace UI**: Complete design system refactor inspired by modern professional tools (Linear, Notion, Raycast), featuring sleek slate surfaces, Inter + Noto Sans Thai typography, refined spacing, and subtle micro-interactions.
- **Advanced Settings Drawer**: A non-intrusive slide-over drawer for OCR language configuration, PDPA custom keyword management, and API key settings.
- **Non-blocking Toast Notification System**: Replaced browser-native alerts with elegant floating toast notifications for copy actions, file validation, and network statuses.
- **Enhanced Source Selector**: Modern tab container with format badge chips, dedicated icons, and keyboard accessibility.
- **Improved Side-by-Side Workspace**: Refined Markdown editor and compiled HTML preview pane with live token reduction metrics and ZIP multi-export support.

### Improved
- **App Shell & Header**: Added explicit `🔒 Local Processing` trust indicator, PWA installer integration, and version tracking.
- **Responsive Layout**: Re-architected grid system guaranteeing full usability across Desktop (1280px+), Tablet (768px+), and Mobile viewports (touch targets ≥44px).
- **Service Worker & PWA Caching**: Updated cache scope to `md-converter-v3.0.0` for instant asset updates without stale cache locks.

### Preserved
- **Protected Conversion Engine**: 100% backward-compatible parsing for PDF, DOCX, XLSX, PPTX, Images (OCR), Audio, Video, YouTube Transcripts, Raw Text, CAD, and Assembly/PLC files.

---

## [2.0.0] - 2026-08-20

### Added
- **Local OCR (Image → Markdown)**: Local browser OCR using Tesseract.js (supporting Thai and English languages) with real-time progress indicators.
- **Audio Transcription Interface**: Added a wrapper supporting local browser microphone input (Mode A) and external Whisper and Gemini APIs (Mode B) using client-cached keys.
- **Video Processing Engine**: Browser-side audio decoding of video streams (MP4/WEBM/MOV) using native Web Audio API and mono WAV PCM generation.
- **YouTube Transcript Cleaner**: Formats pasted YouTube transcripts by stripping timestamps, merging short sentences, and identifying speaker shifts.
- **CAD & Coding Formats**: DXF drawing files parsing and code wrapping blocks for PLC logic and Assembly codes.
- **PDPA & Privacy Sanitizer**: Optional toggle to anonymize company names into `[Company A, B, C]` placeholders entirely on the client side.
- **Result Workspace**: A split side-by-side layout containing document details, a live markdown text editor, and a compiled HTML preview pane.
- **PWA Capabilities**: Service worker caching and web manifests to enable complete offline boot and desktop app installs.
- **Large PDF Python Fallback**: Script `scripts/pdf_converter.py` and batch file `scripts/convert_large_pdf.bat`.
