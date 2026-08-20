# User Guide — MD Converter v2

Welcome to **MD Converter v2**. This guide will walk you through the various features, settings, and workflows to convert your content into clean Markdown.

---

## 📂 1. Converting Documents (Word, PDF, Excel, PowerPoint)

The **Documents** tab is the default area for converting standard office formats.

### Steps
1.  Open `index.html` in your browser.
2.  Select the **Documents** tab (if not already active).
3.  Drag one or more files (`.docx`, `.pdf`, `.xlsx`, `.pptx`, `.csv`, `.txt`, etc.) and drop them into the dashed box. Alternatively, click **Choose File** to select them from your explorer.
4.  (Optional) Choose an **Output Format Preset** in the sidebar settings:
    *   **Standard**: Standard headings and bullet lists.
    *   **Meeting Notes**: Places the content under Summary, Decisions, and Action Items sections.
    *   **Lecture Notes**: Separates content into Topic, Key Concepts, and Review summaries.
    *   **Research Notes**: Generates Source metadata, Abstract, Findings, and important Quote headers.
5.  Click the **Convert Queue** button.
6.  The progress will display in real-time. Once finished, click on any file in the queue list to load it into the **Workspace** at the bottom.
7.  In the Workspace:
    *   You can edit the Markdown directly in the text editor.
    *   Click **Show Preview** to see the formatted HTML preview of your Markdown.
    *   Click **Copy MD** to copy the text to your clipboard.
    *   Click **Download .md** to save it locally.
    *   If you converted multiple files, click **Download ZIP** to get them all at once.

---

## 🖼 2. Image OCR (Thai + English)

The **Images / OCR** tab extracts text from pictures of documents, receipts, screenshots, or scans.

### Steps
1.  Switch to the **Images / OCR** tab.
2.  In the sidebar, choose the **OCR Language**:
    *   *English + Thai* (Recommended for mixed documents)
    *   *Thai only*
    *   *English only*
3.  Drop your images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`) into the dropzone.
4.  Click **Convert Queue**.
5.  Tesseract.js will load the language files locally (via web workers) and scan the image. You will see progress indicators (e.g. `OCR Processing: 45%`).
6.  Review the extracted text in the workspace.

---

## 🎙 3. Audio & Video Transcription

The **Audio** and **Video** tabs let you convert spoken voice in recordings into text transcripts.

### Offline vs. API Modes
*   **Mode A (Browser Speech API)**: This runs locally using your browser's speech recognition engine (currently supported best in Google Chrome). Because the browser engine only supports real-time microphone dictation, uploading a pre-recorded file is not supported locally.
*   **Mode B (AI Provider APIs)**: To transcribe pre-recorded files (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.mov`, etc.), you must configure an external API.

### Configuring APIs (Private & Serverless)
1.  In the sidebar settings under **Transcription API**, choose your provider:
    *   **OpenAI Whisper API**: Ultra-high transcription accuracy.
    *   **Google Gemini API**: Transcribes and cleans using Gemini 1.5 Flash.
2.  Input your API key in the password field. The key is stored **only in your browser's local cache** (`localStorage`) and is never sent to any developer servers.
3.  Drop your audio or video file.
4.  Click **Convert Queue**. The app will upload the file, track progress, and write the transcript.

*Note for Video files: The app decodes the audio track using the browser's Web Audio API and exports a small WAV file before sending it to the transcription API, saving you bandwidth and upload time!*

---

## ▶ 4. YouTube Transcript Cleaner

If you want to convert a YouTube video to Markdown but do not want to download/upload the video:

1.  Switch to the **YouTube Transcript** tab.
2.  Go to YouTube, open the video's transcript panel, copy all lines, and paste them into the text area.
3.  In the YouTube Options checkbox, choose:
    *   **Remove Timestamps**: Strips numbers like `0:05` or `12:34`.
    *   **Merge Short Lines**: Combines chopped transcript lines into readable paragraphs.
    *   **Format Speakers**: Highlights who is speaking if labels are present.
4.  Click **Convert Paste**.
5.  View, edit, and export your polished transcript in the workspace.

---

## 🔒 5. PDPA & Privacy Sanitizer

If you are converting company quotes, financial records, or invoices and want to avoid data leakage before uploading the Markdown to an AI chatbot (like ChatGPT, Gemini, or Claude):

1.  Toggle the **Anonymize Company Names** switch in the sidebar.
2.  (Optional) Under **Custom Keywords**, type names of companies or individuals you want to redact, separated by commas (e.g. `บริษัท เอฟ, สมชาย, Initech`).
3.  When you run the conversion, the generator will replace these occurrences with `[Company A]`, `[Company B]`, etc., maintaining logical consistency throughout the document.
