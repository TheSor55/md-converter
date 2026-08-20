/**
 * assets/js/ui.js
 * Manages UI rendering, events, side-by-side workspace, settings sync, and markdown previews.
 */

// Simple local speech recognition capability check
import { isBrowserSpeechSupported } from '../../converters/audio.js';

export class UIManager {
  constructor() {
    this.activeTab = 'documents';
    this.previewActive = false; // false = editor, true = preview
    this.activeResult = null; // The result object currently loaded in workspace
    
    this.initDOM();
    this.initSettings();
    this.checkCapabilities();
  }

  initDOM() {
    // Tab buttons
    this.tabs = document.querySelectorAll('.tab');
    
    // Panels
    this.dz = document.getElementById('dz');
    this.dzIcon = document.getElementById('dz-icon');
    this.dzTitle = document.getElementById('dz-title');
    this.dzBtnLbl = document.getElementById('dz-btn-lbl');
    this.dzHint = document.getElementById('dz-hint');
    this.fileInput = document.getElementById('fi');
    
    this.customInputPanel = document.getElementById('custom-input-panel');
    this.customInputTitle = document.getElementById('custom-input-title');
    this.ytUrlContainer = document.getElementById('yt-url-container');
    this.customTextContainer = document.getElementById('custom-text-container');
    this.customTextLabel = document.getElementById('custom-text-label');
    this.customTextInput = document.getElementById('custom-text-input');
    this.ytSettingsContainer = document.getElementById('yt-settings-container');
    this.btnProcessCustom = document.getElementById('btn-process-custom');
    
    // Sidebar settings
    this.ocrSettings = document.getElementById('ocr-settings');
    this.audioSettings = document.getElementById('audio-settings');
    this.apiProviderSelect = document.getElementById('api-provider');
    this.apiKeyContainer = document.getElementById('api-key-container');
    this.apiKeyInput = document.getElementById('api-key');
    this.localSpeechStatus = document.getElementById('local-speech-status');
    
    // Queue Panel
    this.qp = document.getElementById('qp');
    this.queueCount = document.getElementById('queue-count');
    this.queueItems = document.getElementById('queue-items');
    
    // Progress Panel
    this.pp = document.getElementById('pp');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.progressPercent = document.getElementById('progress-percent');
    
    // Stats
    this.sp = document.getElementById('sp');
    this.statFiles = document.getElementById('stat-files');
    this.statOrig = document.getElementById('stat-orig');
    this.statMd = document.getElementById('stat-md');
    this.statSaved = document.getElementById('stat-saved');
    
    // Workspace
    this.wp = document.getElementById('wp');
    this.wsFilename = document.getElementById('ws-filename');
    this.btnTogglePreview = document.getElementById('btn-toggle-preview');
    this.btnCopyMd = document.getElementById('btn-copy-md');
    this.btnDlMd = document.getElementById('btn-dl-md');
    this.btnDlZip = document.getElementById('btn-dl-zip');
    
    this.metaFile = document.getElementById('meta-file');
    this.metaType = document.getElementById('meta-type');
    this.metaOrigSize = document.getElementById('meta-orig-size');
    this.metaMdSize = document.getElementById('meta-md-size');
    this.metaTokens = document.getElementById('meta-tokens');
    this.metaReduction = document.getElementById('meta-reduction');
    this.metaOcrWarn = document.getElementById('meta-ocr-warn');
    
    this.editorArea = document.getElementById('editor-text');
    this.previewArea = document.getElementById('preview-html');
  }

  // Load and save external API settings in localStorage
  initSettings() {
    // Load cached API Provider and Key
    const cachedProvider = localStorage.getItem('md_api_provider');
    const cachedKey = localStorage.getItem('md_api_key');

    if (cachedProvider) {
      this.apiProviderSelect.value = cachedProvider;
      this.toggleApiKeyVisibility(cachedProvider);
    }
    if (cachedKey) {
      this.apiKeyInput.value = cachedKey;
    }

    // Bind settings change events
    this.apiProviderSelect.addEventListener('change', (e) => {
      const provider = e.target.value;
      localStorage.setItem('md_api_provider', provider);
      this.toggleApiKeyVisibility(provider);
    });

    this.apiKeyInput.addEventListener('input', (e) => {
      localStorage.setItem('md_api_key', e.target.value);
    });
  }

  toggleApiKeyVisibility(provider) {
    if (provider === 'local') {
      this.apiKeyContainer.style.display = 'none';
    } else {
      this.apiKeyContainer.style.display = 'flex';
    }
  }

  checkCapabilities() {
    if (isBrowserSpeechSupported()) {
      this.localSpeechStatus.textContent = 'Available';
      this.localSpeechStatus.className = 'badge badge-green';
    } else {
      this.localSpeechStatus.textContent = 'Not supported';
      this.localSpeechStatus.className = 'badge badge-gold';
    }
  }

  // Switch tabs
  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Toggle active tab buttons
    this.tabs.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Reset Dropzone icons & settings visibility
    this.dz.style.display = 'flex';
    this.customInputPanel.style.display = 'none';
    this.ocrSettings.style.display = 'none';
    this.audioSettings.style.display = 'none';
    
    // Adjust file input accept values & dropzone texts
    switch(tabId) {
      case 'documents':
        this.dzIcon.textContent = '📂';
        this.dzTitle.textContent = 'ลากไฟล์เอกสารมาวางที่นี่';
        this.dzHint.textContent = 'รองรับ: PDF · DOCX · PPTX · XLSX · XLS · CSV · TXT · HTML · JSON · XML · MD · DXF · ASM · S · ST · IL · LD';
        this.fileInput.accept = '.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.csv,.json,.xml,.html,.htm,.md,.dxf,.asm,.s,.st,.il,.ld,.plc';
        break;
        
      case 'images':
        this.dzIcon.textContent = '🖼';
        this.dzTitle.textContent = 'ลากรูปภาพมาวางที่นี่เพื่อทำ OCR';
        this.dzHint.textContent = 'รองรับ: PNG · JPG · JPEG · WEBP · BMP (ประมวลผล OCR ออฟไลน์ในเบราว์เซอร์)';
        this.fileInput.accept = '.png,.jpg,.jpeg,.webp,.bmp';
        this.ocrSettings.style.display = 'flex';
        break;
        
      case 'audio':
        this.dzIcon.textContent = '🎙';
        this.dzTitle.textContent = 'ลากไฟล์เสียงมาวางที่นี่';
        this.dzHint.textContent = 'รองรับ: MP3 · WAV · M4A · OGG · WEBM (ถอดข้อความเสียงเป็นคำพูด)';
        this.fileInput.accept = '.mp3,.wav,.m4a,.ogg,.webm';
        this.audioSettings.style.display = 'flex';
        break;
        
      case 'video':
        this.dzIcon.textContent = '🎬';
        this.dzTitle.textContent = 'ลากไฟล์วิดีโอมาวางที่นี่';
        this.dzHint.textContent = 'รองรับ: MP4 · WEBM · MOV (ถอดเสียงออกจากวิดีโอและทำพรีวิว/ทรานสคริปต์)';
        this.fileInput.accept = '.mp4,.webm,.mov';
        this.audioSettings.style.display = 'flex';
        break;
        
      case 'youtube':
        this.dz.style.display = 'none';
        this.customInputPanel.style.display = 'flex';
        this.customInputTitle.textContent = '▶ YouTube / Online Video Transcript';
        this.ytUrlContainer.style.display = 'flex';
        this.customTextContainer.style.display = 'flex';
        this.customTextLabel.textContent = 'วางสคริปต์/คำอธิบายย่อยของยูทูบที่คัดลอกมาที่นี่:';
        this.customTextInput.placeholder = '0:00 สวัสดีครับ...\n0:05 วันนี้จะมาพูดถึง...';
        this.ytSettingsContainer.style.display = 'flex';
        break;
        
      case 'text':
        this.dz.style.display = 'none';
        this.customInputPanel.style.display = 'flex';
        this.customInputTitle.textContent = '📝 Raw Text Input';
        this.ytUrlContainer.style.display = 'none';
        this.customTextContainer.style.display = 'flex';
        this.customTextLabel.textContent = 'เขียนหรือวางข้อความที่นี่เพื่อจัดระเบียบโครงสร้าง';
        this.customTextInput.placeholder = 'พิมพ์หรือวางข้อความดิบที่นี่...';
        this.ytSettingsContainer.style.display = 'none';
        break;
    }
  }

  // File queue listing UI
  renderQueue(queue, onRemoveFileCallback) {
    if (queue.length === 0) {
      this.qp.style.display = 'none';
      return;
    }
    this.qp.style.display = 'block';
    this.queueCount.textContent = `${queue.length} File${queue.length > 1 ? 's' : ''} Selected`;
    this.queueItems.innerHTML = '';

    queue.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = `queue-item ${item.status}`;
      
      const statusIcon = item.status === 'done' ? '✅' : (item.status === 'failed' ? '❌' : (item.status === 'processing' ? '⏳' : '📄'));
      
      li.innerHTML = `
        <span>${statusIcon}</span>
        <span class="fn" title="${item.file.name}">${item.file.name}</span>
        <span class="fsz">${this.formatSize(item.file.size)}</span>
        <span class="fstat">${item.status === 'processing' ? `${item.progress}%` : item.status}</span>
        <button class="remove-btn" style="background:none; border:none; color:var(--muted); cursor:pointer; margin-left:0.5rem; font-size:0.9rem;">✕</button>
      `;

      li.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onRemoveFileCallback(index);
      });
      
      // Allow clicking on a queue item to view it in workspace if it's already done
      li.addEventListener('click', () => {
        if (item.status === 'done' && item.resultIndex !== -1) {
          // Fire event or invoke callback to load this specific result
          this.loadResultInWorkspace(item.resultIndex);
        }
      });

      this.queueItems.appendChild(li);
    });
  }

  // Update progress bar
  updateProgress(visible, text, percent) {
    if (!visible) {
      this.pp.style.display = 'none';
      return;
    }
    this.pp.style.display = 'block';
    this.progressText.textContent = text;
    this.progressPercent.textContent = `${percent}%`;
    this.progressFill.style.width = `${percent}%`;
  }

  // Render conversion statistics panel
  updateStats(results) {
    const okResults = results.filter(r => r.ok);
    if (okResults.length === 0) {
      this.sp.style.display = 'none';
      return;
    }
    
    this.sp.style.display = 'grid';
    
    const totalOrigBytes = okResults.reduce((sum, r) => sum + r.origSize, 0);
    const totalMdBytes = okResults.reduce((sum, r) => sum + r.mdSize, 0);
    
    // Estimate token counts: 1 token ≈ 3 chars
    const totalOrigTokens = Math.max(1, Math.round(totalOrigBytes / 3));
    const totalMdTokens = okResults.reduce((sum, r) => sum + r.mdTokens, 0);
    const reductionPercent = totalOrigTokens > 0 ? Math.max(0, Math.round((1 - totalMdTokens / totalOrigTokens) * 100)) : 0;
    
    this.statFiles.textContent = okResults.length;
    this.statOrig.textContent = this.formatSize(totalOrigBytes);
    this.statMd.textContent = this.formatSize(totalMdBytes);
    this.statSaved.textContent = `${reductionPercent}%`;
  }

  // Load result into side-by-side workspace
  loadResultInWorkspace(resultIndex, allResults = []) {
    const results = allResults.length > 0 ? allResults : this.currentResults || [];
    const result = results[resultIndex];
    if (!result || !result.ok) return;

    this.activeResult = result;
    this.wp.style.display = 'block';
    this.wsFilename.textContent = `Result Workspace: ${result.name}`;
    
    // Update Meta info panel
    this.metaFile.textContent = result.name;
    this.metaType.textContent = result.category.toUpperCase();
    this.metaOrigSize.textContent = this.formatSize(result.origSize);
    this.metaMdSize.textContent = this.formatSize(result.mdSize);
    this.metaTokens.textContent = result.mdTokens.toLocaleString();
    
    const origTok = Math.max(1, Math.round(result.origSize / 3));
    const red = Math.max(0, Math.round((1 - result.mdTokens / origTok) * 100));
    this.metaReduction.textContent = `${red}%`;

    // Warn if it was audio file
    if (result.category === 'audio' || result.category === 'video') {
      this.metaOcrWarn.style.display = 'block';
    } else {
      this.metaOcrWarn.style.display = 'none';
    }

    // Populate editor
    this.editorArea.value = result.formattedMarkdown;
    this.editorArea.classList.remove('hidden');
    this.previewArea.classList.remove('active');
    this.previewActive = false;
    this.btnTogglePreview.textContent = '👁 Show Preview';

    // Enable / disable ZIP button based on successfully converted files count
    const okCount = results.filter(r => r.ok).length;
    this.btnDlZip.style.display = okCount > 1 ? 'inline-flex' : 'none';

    // Hook auto-save on edit
    this.editorArea.oninput = () => {
      result.formattedMarkdown = this.editorArea.value;
      result.mdSize = new Blob([this.editorArea.value]).size;
      result.mdTokens = Math.max(1, Math.round(this.editorArea.value.length / 3));
      
      // Update UI metadata live
      this.metaMdSize.textContent = this.formatSize(result.mdSize);
      this.metaTokens.textContent = result.mdTokens.toLocaleString();
    };

    this.wp.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Toggle Live Preview mode
  togglePreviewMode() {
    if (!this.activeResult) return;
    
    this.previewActive = !this.previewActive;
    if (this.previewActive) {
      // Build and show preview
      const markdown = this.editorArea.value;
      this.previewArea.innerHTML = this.mdToHtml(markdown);
      this.previewArea.classList.add('active');
      this.editorArea.classList.add('hidden');
      this.btnTogglePreview.textContent = '✏️ Edit Markdown';
    } else {
      // Hide preview, show editor
      this.previewArea.classList.remove('active');
      this.editorArea.classList.remove('hidden');
      this.btnTogglePreview.textContent = '👁 Show Preview';
    }
  }

  // Extremely simple & secure Markdown to HTML compiler
  mdToHtml(md) {
    if (!md) return '';
    
    // First escape HTML entities to prevent XSS
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Headings
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Blockquotes
    html = html.replace(/^\> (.*?)$/gm, '<blockquote>$1</blockquote>');
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold / Strong
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Lists: Unordered *
    html = html.replace(/^\*\s+(.*?)$/gm, '<li>$1</li>');
    // Group consecutive <li> items into <ul>
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    
    // Table rows
    // Matches line like | col 1 | col 2 |
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (!inTable) {
          inTable = true;
          tableHtml = '<table>';
          // Header row
          tableHtml += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          // Check if it's separator row (e.g. |---|---|)
          if (cells.every(c => c.startsWith('-'))) {
            continue; // Skip separator line
          }
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          lines[i - 1] = tableHtml + '\n' + line; // Insert table before current line
        }
      }
    }
    
    if (inTable) {
      tableHtml += '</tbody></table>';
      lines[lines.length - 1] = tableHtml;
    }
    
    html = lines.join('\n');
    
    // Paragraphs: Wrap double newlines with <p>
    html = html.split(/\n{2,}/).map(para => {
      // Don't wrap tags like <h1>, <ul>, <table>, <pre> in paragraphs
      if (para.trim().startsWith('<h') || para.trim().startsWith('<ul') || para.trim().startsWith('<table') || para.trim().startsWith('<pre') || para.trim().startsWith('<block')) {
        return para;
      }
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
  }

  // Helpers
  formatSize(bytes) {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  showAlert(type, message) {
    // Basic console warning/alert. Can be customized into pretty floating toast
    alert(`[${type.toUpperCase()}] ${message}`);
  }

  async copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = btnElement.textContent;
      btnElement.textContent = '✅ Copied!';
      setTimeout(() => { btnElement.textContent = originalText; }, 2000);
    } catch (err) {
      this.showAlert('error', `Failed to copy: ${err.message}`);
    }
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}
