# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-20

### Added
- **Local OCR (Image → Markdown)**: Local browser OCR using Tesseract.js (supporting Thai and English languages) with real-time progress indicators.
- **Audio Transcription Interface**: Added a wrapper supporting local browser microphone input (Mode A) and external Whisper and Gemini 1.5 APIs (Mode B) using client-cached keys.
- **Video Processing Engine**: Browser-side audio decoding of video streams (MP4/WEBM/MOV) using native Web Audio API and mono WAV PCM generation, bypassing the need for heavy external WebAssembly wrappers (like `ffmpeg.wasm`).
- **YouTube Transcript Cleaner**: Formats pasted YouTube transcripts by stripping timestamps, merging short sentences, and identifying speaker shifts.
- **CAD & Coding Formats**: 
  - DXF drawing files parsing (extracting dimension and layered text attributes).
  - Code wrapping blocks for PLC logic (Structured Text, Instruction List, Ladder Diagrams) and Assembly codes (`.asm`, `.s`).
- **PDPA & Privacy Sanitizer**: Optional toggle to anonymize company names (matching standard Thai/English corporate endings and user keywords) into `[Company A, B, C]` placeholders entirely on the client side.
- **Result Workspace**: A split side-by-side layout containing document details, a live markdown text editor, and a compiled HTML preview pane.
- **PWA Capabilities**: Service worker caching and web manifests to enable complete offline boot and desktop app installs.
- **Large PDF Python Fallback**: Script `scripts/pdf_converter.py` and batch file `scripts/convert_large_pdf.bat` to process multi-hundred page documents outside browser boundaries.
