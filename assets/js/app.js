/**
 * assets/js/app.js
 * Main entry point. Co-ordinates UI interactions, drag-and-drop file queues,
 * and the markdown compilation pipeline.
 */

import { UIManager } from './ui.js';
import { QueueManager } from './file-handler.js';
import { buildMarkdown } from './markdown.js';
import { cleanYoutubeTranscript } from '../../converters/youtube-transcript.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager();
  const qm = new QueueManager();

  // Keep reference of current results in UI
  ui.currentResults = qm.results;

  // 1. Drag & Drop File Binding
  const dz = ui.dz;
  
  dz.addEventListener('dragover', (e) => {
    e.preventDefault();
    dz.classList.add('drag-over');
  });

  dz.addEventListener('dragleave', () => {
    dz.classList.remove('drag-over');
  });

  dz.addEventListener('drop', (e) => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    handleIncomingFiles(e.dataTransfer.files);
  });

  dz.addEventListener('click', (e) => {
    // Avoid triggering file explorer if label button is clicked (browser default)
    if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
      ui.fileInput.click();
    }
  });

  ui.fileInput.addEventListener('change', () => {
    handleIncomingFiles(ui.fileInput.files);
    ui.fileInput.value = ''; // Reset input
  });

  function handleIncomingFiles(fileList) {
    const files = Array.from(fileList);
    const { addedCount, errors } = qm.addFiles(files);
    
    if (errors.length > 0) {
      ui.showAlert('warning', `Some files were skipped:\n\n${errors.join('\n')}`);
    }

    refreshQueueUI();
  }

  function refreshQueueUI() {
    ui.renderQueue(qm.queue, (indexToRemove) => {
      qm.removeFile(indexToRemove);
      refreshQueueUI();
    });
  }

  // 2. Queue Buttons
  document.getElementById('btn-clear-queue').addEventListener('click', () => {
    qm.clearQueue();
    refreshQueueUI();
    ui.updateStats([]);
    ui.wp.style.display = 'none';
    ui.activeResult = null;
  });

  document.getElementById('btn-convert-queue').addEventListener('click', async () => {
    if (qm.queue.length === 0) return;
    
    const convertBtn = document.getElementById('btn-convert-queue');
    convertBtn.disabled = true;
    
    ui.updateProgress(true, 'Starting batch conversion...', 0);
    
    const pdpaEnabled = document.getElementById('pdpa-toggle').checked;
    const pdpaKwsString = document.getElementById('pdpa-keywords').value || '';
    const pdpaKws = pdpaKwsString.split(',').map(s => s.trim()).filter(Boolean);
    const preset = document.getElementById('output-preset').value;
    const ocrLang = document.getElementById('ocr-lang').value;
    const apiProvider = document.getElementById('api-provider').value;
    const apiKey = document.getElementById('api-key').value.trim();

    const options = {
      pdpa: pdpaEnabled,
      pdpaKeywords: pdpaKws,
      preset: preset,
      ocrLang: ocrLang,
      apiProvider: apiProvider,
      apiKey: apiKey
    };

    qm.results = []; // Reset results for new run
    ui.currentResults = qm.results;

    const totalFiles = qm.queue.length;
    let completed = 0;

    for (let i = 0; i < qm.queue.length; i++) {
      const item = qm.queue[i];
      ui.updateProgress(true, `Converting file (${i + 1}/${totalFiles}): ${item.file.name}`, Math.round((completed / totalFiles) * 100));
      
      const result = await qm.convertFile(item, options, (updatedItem) => {
        refreshQueueUI();
      });

      if (result.ok) {
        // Build formatted Markdown based on preset and options
        result.formattedMarkdown = buildMarkdown(result.name, result.rawText, preset, {
          pdpa: pdpaEnabled,
          pdpaKeywords: pdpaKws,
          audioMode: apiProvider === 'local' ? 'Local Browser Engine' : `API: ${apiProvider.toUpperCase()}`
        });
        result.mdSize = new Blob([result.formattedMarkdown]).size;
        result.mdTokens = Math.max(1, Math.round(result.formattedMarkdown.length / 3));
      }

      completed++;
      refreshQueueUI();
    }

    ui.updateProgress(false);
    ui.updateStats(qm.results);
    convertBtn.disabled = false;

    // Load first successful file in workspace if available
    const firstOkIdx = qm.results.findIndex(r => r.ok);
    if (firstOkIdx !== -1) {
      ui.loadResultInWorkspace(firstOkIdx, qm.results);
    } else {
      ui.showAlert('error', 'All files failed to convert. Please review the errors in the queue list.');
    }
  });

  // 3. Pasted Text inputs (YouTube or Raw Text)
  document.getElementById('btn-process-custom').addEventListener('click', () => {
    const rawInput = ui.customTextInput.value;
    if (!rawInput || !rawInput.trim()) {
      ui.showAlert('warning', 'Please enter some text to convert.');
      return;
    }

    const pdpaEnabled = document.getElementById('pdpa-toggle').checked;
    const pdpaKwsString = document.getElementById('pdpa-keywords').value || '';
    const pdpaKws = pdpaKwsString.split(',').map(s => s.trim()).filter(Boolean);
    const preset = document.getElementById('output-preset').value;

    let processedText = rawInput;
    let mockFilename = 'pasted_text.txt';

    if (ui.activeTab === 'youtube') {
      mockFilename = 'youtube_transcript.txt';
      const cleanOpts = {
        removeTimestamps: document.getElementById('yt-remove-timestamps').checked,
        mergeLines: document.getElementById('yt-merge-lines').checked,
        formatSpeakers: document.getElementById('yt-format-speakers').checked
      };
      processedText = cleanYoutubeTranscript(rawInput, cleanOpts);
    }

    // Wrap as a mock result
    const formatted = buildMarkdown(mockFilename, processedText, preset, {
      pdpa: pdpaEnabled,
      pdpaKeywords: pdpaKws
    });

    const mockResult = {
      name: mockFilename,
      outName: mockFilename.replace(/\.[^.]+$/, '.md'),
      ok: true,
      category: ui.activeTab,
      origSize: new Blob([rawInput]).size,
      rawText: processedText,
      formattedMarkdown: formatted,
      mdSize: new Blob([formatted]).size,
      mdTokens: Math.max(1, Math.round(formatted.length / 3)),
      error: null
    };

    // Load inside workspace directly
    qm.results = [mockResult];
    ui.currentResults = qm.results;
    ui.loadResultInWorkspace(0, qm.results);
  });

  // 4. Workspace Button actions
  ui.btnTogglePreview.addEventListener('click', () => {
    ui.togglePreviewMode();
  });

  ui.btnCopyMd.addEventListener('click', () => {
    if (ui.activeResult) {
      ui.copyToClipboard(ui.activeResult.formattedMarkdown, ui.btnCopyMd);
    }
  });

  ui.btnDlMd.addEventListener('click', () => {
    if (ui.activeResult) {
      const blob = new Blob([ui.activeResult.formattedMarkdown], { type: 'text/markdown;charset=utf-8' });
      ui.downloadBlob(blob, ui.activeResult.outName);
    }
  });

  ui.btnDlZip.addEventListener('click', async () => {
    try {
      const zipBlob = await qm.generateZip();
      ui.downloadBlob(zipBlob, 'converted_markdown.zip');
    } catch (err) {
      ui.showAlert('error', `Failed to generate ZIP: ${err.message}`);
    }
  });

  // 5. Sidebar/Tabs Switching Action
  ui.tabs.forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      const tabId = tabBtn.getAttribute('data-tab');
      ui.switchTab(tabId);
    });
  });

  // 6. Test API Connection Action
  const btnTestApi = document.getElementById('btn-test-api');
  const apiTestStatus = document.getElementById('api-test-status');

  if (btnTestApi) {
    btnTestApi.addEventListener('click', async () => {
      const apiKey = document.getElementById('api-key').value.trim();
      const provider = document.getElementById('api-provider').value;

      if (!apiKey) {
        apiTestStatus.innerHTML = '<span style="color:var(--red);">❌ Please enter an API key first.</span>';
        return;
      }

      apiTestStatus.innerHTML = '<span style="color:var(--text);">⏳ Testing connection...</span>';

      try {
        if (provider === 'gemini') {
          const res = await fetch('https://generativelanguage.googleapis.com/v1/models', {
            headers: { 'x-goog-api-key': apiKey }
          });
          const data = await res.json();
          if (res.ok) {
            const modelNames = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];
            const hasFlash = modelNames.some(name => /gemini-.*-flash/.test(name));
            if (hasFlash) {
              apiTestStatus.innerHTML = '<span style="color:var(--green);">✅ Connection successful! Gemini Flash is ready.</span>';
            } else {
              apiTestStatus.innerHTML = `<span style="color:var(--gold);">⚠️ Connected, but Gemini Flash is not available.<br/>Available models: ${modelNames.join(', ')}</span>`;
            }
          } else {
            apiTestStatus.innerHTML = `<span style="color:var(--red);">❌ API Error: ${data.error ? data.error.message : res.statusText}</span>`;
          }
        } else if (provider === 'whisper') {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          const data = await res.json();
          if (res.ok) {
            apiTestStatus.innerHTML = '<span style="color:var(--green);">✅ Connection successful! OpenAI Whisper is ready.</span>';
          } else {
            apiTestStatus.innerHTML = `<span style="color:var(--red);">❌ OpenAI Error: ${data.error ? data.error.message : res.statusText}</span>`;
          }
        } else {
          apiTestStatus.innerHTML = '<span style="color:var(--red);">❌ Mode A (Local) does not require connection testing.</span>';
        }
      } catch (err) {
        apiTestStatus.innerHTML = `<span style="color:var(--red);">❌ Network Error: ${err.message}</span>`;
      }
    });
  }

  // 7. YouTube URL Analyze Action
  const btnYtCheck = document.getElementById('btn-yt-check');
  if (btnYtCheck) {
    btnYtCheck.addEventListener('click', () => {
      const ytUrl = document.getElementById('yt-url').value.trim();
      if (!ytUrl) {
        ui.showAlert('warning', 'กรุณากรอกลิงก์ YouTube ก่อนกด Analyze ครับ');
        return;
      }

      // Extract video ID from standard or shortened YouTube URL
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = ytUrl.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (!videoId) {
        ui.showAlert('error', 'รูปแบบลิงก์ YouTube ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้งครับ');
        return;
      }

      const ytVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      ui.showAlert('info', `🔒 เนื่องจากระบบรักษาความปลอดภัยของ YouTube (CORS Policy) บนเบราว์เซอร์ จึงไม่สามารถดาวน์โหลดคำถอดเสียงจากวิดีโอเข้าหน้าเว็บได้โดยตรงแบบอัตโนมัติ\n\n💡 คำแนะนำขั้นตอนในการดึงคำถอดเสียงใน 10 วินาที:\n\n1. คลิกเปิดลิงก์วิดีโอนี้เพื่อดูบน YouTube:\n👉 ${ytVideoUrl}\n\n2. ใต้คลิปวิดีโอ (แถบรายละเอียดคำบรรยาย) ให้คลิกปุ่ม "... เพิ่มเติม" (More) แล้วคลิกปุ่ม "แสดงคำถอดเสียง" (Show Transcript)\n\n3. คัดลอกข้อความคำถอดเสียงทั้งหมดจากหน้านั้น แล้วนำมาวางลงในกล่องข้อความ "วางสคริปต์/คำอธิบายย่อย..." ด้านล่าง\n\n4. ติ๊กเลือกตัวเลือกบีบอัดข้อมูล เช่น Remove Timestamps (ลบเลขเวลา) แล้วกดปุ่ม "Convert Paste" สีฟ้าขวาล่างเพื่อทำความสะอาดและจัดรูปแบบเป็น Markdown ทันทีครับ!`);
    });
  }
});
