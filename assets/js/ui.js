/**
 * assets/js/ui.js
 * Manages v3 UI rendering, drawer, toast system, side-by-side workspace, and settings sync.
 */

import { isBrowserSpeechSupported } from '../../converters/audio.js';

export class UIManager {
  constructor() {
    this.activeTab = 'documents';
    this.previewActive = false; // false = editor, true = preview
    this.activeResult = null; // The result object currently loaded in workspace
    
    this.initDOM();
    this.initDrawer();
    this.initSettings();
    this.checkCapabilities();
  }

  initDOM() {
    // Tab buttons
    this.tabs = document.querySelectorAll('.tab');
    
    // Panels & Dropzone
    this.dz = document.getElementById('dz');
    this.dzIcon = document.getElementById('dz-icon');
    this.dzTitle = document.getElementById('dz-title');
    this.dzSub = document.getElementById('dz-sub');
    this.dzBtnLbl = document.getElementById('dz-btn-lbl');
    this.dzHint = document.getElementById('dz-hint');
    this.fileChips = document.getElementById('file-chips');
    this.fileInput = document.getElementById('fi');
    
    // Custom Inputs
    this.customInputPanel = document.getElementById('custom-input-panel');
    this.customInputTitle = document.getElementById('custom-input-title');
    this.ytUrlContainer = document.getElementById('yt-url-container');
    this.customTextContainer = document.getElementById('custom-text-container');
    this.customTextLabel = document.getElementById('custom-text-label');
    this.customTextInput = document.getElementById('custom-text-input');
    this.ytSettingsContainer = document.getElementById('yt-settings-container');
    this.btnProcessCustom = document.getElementById('btn-process-custom');
    
    // Settings
    this.ocrSettings = document.getElementById('ocr-settings');
    this.audioSettings = document.getElementById('audio-settings');
    this.apiProviderSelect = document.getElementById('api-provider');
    this.apiKeyContainer = document.getElementById('api-key-container');
    this.apiKeyInput = document.getElementById('api-key');
    this.localSpeechStatus = document.getElementById('local-speech-status');
    
    // Drawer & Toast
    this.drawer = document.getElementById('settings-drawer');
    this.drawerOverlay = document.getElementById('drawer-overlay');
    this.btnOpenDrawer = document.getElementById('btn-open-drawer');
    this.btnCloseDrawer = document.getElementById('btn-close-drawer');
    this.btnTriggerDrawer = document.getElementById('btn-trigger-drawer');
    this.toastContainer = document.getElementById('toast-container');

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

  // Drawer open/close handler
  initDrawer() {
    const openDrawer = () => {
      if (this.drawer && this.drawerOverlay) {
        this.drawer.classList.add('open');
        this.drawerOverlay.classList.add('open');
      }
    };

    const closeDrawer = () => {
      if (this.drawer && this.drawerOverlay) {
        this.drawer.classList.remove('open');
        this.drawerOverlay.classList.remove('open');
      }
    };

    if (this.btnOpenDrawer) this.btnOpenDrawer.addEventListener('click', openDrawer);
    if (this.btnTriggerDrawer) this.btnTriggerDrawer.addEventListener('click', openDrawer);
    if (this.btnCloseDrawer) this.btnCloseDrawer.addEventListener('click', closeDrawer);
    if (this.drawerOverlay) this.drawerOverlay.addEventListener('click', closeDrawer);
  }

  // Toast notification system
  showToast(message, type = 'info', duration = 3500) {
    if (!this.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    this.toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // Backwards compatibility alert replacement
  showAlert(type, message) {
    this.showToast(message, type === 'warning' ? 'info' : type, 4500);
  }

  // Load and save external API settings in localStorage
  initSettings() {
    const cachedProvider = localStorage.getItem('md_api_provider');
    const cachedKey = localStorage.getItem('md_api_key');

    if (cachedProvider && this.apiProviderSelect) {
      this.apiProviderSelect.value = cachedProvider;
      this.toggleApiKeyVisibility(cachedProvider);
    }
    if (cachedKey && this.apiKeyInput) {
      this.apiKeyInput.value = cachedKey;
    }

    if (this.apiProviderSelect) {
      this.apiProviderSelect.addEventListener('change', (e) => {
        const provider = e.target.value;
        localStorage.setItem('md_api_provider', provider);
        this.toggleApiKeyVisibility(provider);
      });
    }

    if (this.apiKeyInput) {
      this.apiKeyInput.addEventListener('input', (e) => {
        localStorage.setItem('md_api_key', e.target.value);
      });
    }
  }

  toggleApiKeyVisibility(provider) {
    if (!this.apiKeyContainer) return;
    if (provider === 'local') {
      this.apiKeyContainer.style.display = 'none';
    } else {
      this.apiKeyContainer.style.display = 'flex';
    }
  }

  checkCapabilities() {
    if (!this.localSpeechStatus) return;
    if (isBrowserSpeechSupported()) {
      this.localSpeechStatus.textContent = 'Available';
      this.localSpeechStatus.className = 'version-tag';
      this.localSpeechStatus.style.background = 'var(--accent-emerald-subtle)';
      this.localSpeechStatus.style.color = 'var(--accent-emerald)';
    } else {
      this.localSpeechStatus.textContent = 'Not supported';
      this.localSpeechStatus.className = 'version-tag';
      this.localSpeechStatus.style.background = 'var(--accent-amber-subtle)';
      this.localSpeechStatus.style.color = 'var(--accent-amber)';
    }
  }

  // Switch tabs
  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Toggle active tab buttons
    this.tabs.forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Reset Dropzone & settings visibility
    this.dz.style.display = 'flex';
    this.customInputPanel.style.display = 'none';
    if (this.ocrSettings) this.ocrSettings.style.display = 'none';
    if (this.audioSettings) this.audioSettings.style.display = 'none';
    
    switch(tabId) {
      case 'documents':
        this.dzIcon.textContent = '📄';
        this.dzTitle.textContent = 'Drop document files here to convert';
        this.dzHint.textContent = '🔒 Local Browser Processing: PDF, DOCX, XLSX, XLS, CSV, PPTX, TXT, HTML, JSON, XML, MD, DXF, ASM, ST, IL';
        this.fileChips.innerHTML = '<span class="chip">PDF</span><span class="chip">DOCX</span><span class="chip">XLSX</span><span class="chip">PPTX</span><span class="chip">TXT</span><span class="chip">DXF</span>';
        this.fileInput.accept = '.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.csv,.json,.xml,.html,.htm,.md,.dxf,.asm,.s,.st,.il,.ld,.plc';
        break;
        
      case 'images':
        this.dzIcon.textContent = '🖼️';
        this.dzTitle.textContent = 'Drop images here for browser OCR';
        this.dzHint.textContent = '🔒 Local Tesseract.js OCR: PNG, JPG, JPEG, WEBP, BMP (Thai + English supported)';
        this.fileChips.innerHTML = '<span class="chip">PNG</span><span class="chip">JPG</span><span class="chip">WEBP</span><span class="chip">BMP</span>';
        this.fileInput.accept = '.png,.jpg,.jpeg,.webp,.bmp';
        if (this.ocrSettings) this.ocrSettings.style.display = 'flex';
        break;
        
      case 'audio':
        this.dzIcon.textContent = '🎙️';
        this.dzTitle.textContent = 'Drop audio files here to transcribe';
        this.dzHint.textContent = '🔒 Transcribe speech: MP3, WAV, M4A, OGG, WEBM';
        this.fileChips.innerHTML = '<span class="chip">MP3</span><span class="chip">WAV</span><span class="chip">M4A</span><span class="chip">OGG</span>';
        this.fileInput.accept = '.mp3,.wav,.m4a,.ogg,.webm';
        if (this.audioSettings) this.audioSettings.style.display = 'flex';
        break;
        
      case 'video':
        this.dzIcon.textContent = '🎬';
        this.dzTitle.textContent = 'Drop video files here for audio extraction';
        this.dzHint.textContent = '🔒 Video audio extraction: MP4, WEBM, MOV';
        this.fileChips.innerHTML = '<span class="chip">MP4</span><span class="chip">WEBM</span><span class="chip">MOV</span>';
        this.fileInput.accept = '.mp4,.webm,.mov';
        if (this.audioSettings) this.audioSettings.style.display = 'flex';
        break;
        
      case 'youtube':
        this.dz.style.display = 'none';
        this.customInputPanel.style.display = 'flex';
        this.customInputTitle.textContent = '▶️ YouTube Transcript';
        this.ytUrlContainer.style.display = 'flex';
        this.customTextContainer.style.display = 'flex';
        this.customTextLabel.textContent = 'Paste YouTube transcript text:';
        this.customTextInput.placeholder = '0:00 Welcome to today\'s session...\n0:05 Next topic we will discuss...';
        this.ytSettingsContainer.style.display = 'flex';
        break;
        
      case 'text':
        this.dz.style.display = 'none';
        this.customInputPanel.style.display = 'flex';
        this.customInputTitle.textContent = '📝 Raw Text Input';
        this.ytUrlContainer.style.display = 'none';
        this.customTextContainer.style.display = 'flex';
        this.customTextLabel.textContent = 'Write or paste raw text to format into Markdown:';
        this.customTextInput.placeholder = 'Paste raw unstructured text here...';
        this.ytSettingsContainer.style.display = 'none';
        break;
    }
  }

  // File queue listing UI
  renderQueue(queue, onRemoveFileCallback) {
    if (!this.qp) return;
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
        <span class="file-icon">${statusIcon}</span>
        <span class="fn" title="${item.file.name}">${item.file.name}</span>
        <span class="fsz">${this.formatSize(item.file.size)}</span>
        <span class="fstat">${item.status === 'processing' ? `${item.progress}%` : item.status}</span>
        <button class="remove-btn btn-icon btn-sm" style="width:28px; height:28px; font-size:0.75rem;" title="Remove">✕</button>
      `;

      li.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onRemoveFileCallback(index);
      });
      
      li.addEventListener('click', () => {
        if ((item.status === 'done' || item.status === 'failed') && item.resultIndex !== -1) {
          this.loadResultInWorkspace(item.resultIndex);
        }
      });

      this.queueItems.appendChild(li);
    });
  }

  // Update progress bar
  updateProgress(visible, text, percent) {
    if (!this.pp) return;
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
    if (!this.sp) return;
    const okResults = results.filter(r => r.ok);
    if (okResults.length === 0) {
      this.sp.style.display = 'none';
      return;
    }
    
    this.sp.style.display = 'grid';
    
    const totalOrigBytes = okResults.reduce((sum, r) => sum + r.origSize, 0);
    const totalMdBytes = okResults.reduce((sum, r) => sum + r.mdSize, 0);
    
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
    if (!result || !this.wp) return;

    this.activeResult = result;
    this.wp.style.display = 'block';
    
    if (!result.ok) {
      this.wsFilename.textContent = `Error: ${result.name}`;
      this.metaFile.textContent = result.name;
      this.metaType.textContent = 'ERROR';
      this.metaOrigSize.textContent = '-';
      this.metaMdSize.textContent = '-';
      this.metaTokens.textContent = '-';
      this.metaReduction.textContent = '-';
      this.metaOcrWarn.style.display = 'none';

      this.editorArea.value = `⚠️ Error during conversion:\n\n${result.error}\n\nSuggestions:\n- For Pre-recorded Audio/Video files, ensure you have selected either OpenAI Whisper or Google Gemini API in settings and provided a key.`;
      this.editorArea.classList.remove('hidden');
      this.previewArea.classList.remove('active');
      this.previewActive = false;
      this.btnTogglePreview.textContent = '👁 Show Preview';
      
      const okCount = results.filter(r => r.ok).length;
      this.btnDlZip.style.display = okCount > 1 ? 'inline-flex' : 'none';
      
      this.wp.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

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

    const okCount = results.filter(r => r.ok).length;
    this.btnDlZip.style.display = okCount > 1 ? 'inline-flex' : 'none';

    // Hook live editing
    this.editorArea.oninput = () => {
      result.formattedMarkdown = this.editorArea.value;
      result.mdSize = new Blob([this.editorArea.value]).size;
      result.mdTokens = Math.max(1, Math.round(this.editorArea.value.length / 3));
      
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
      const markdown = this.editorArea.value;
      this.previewArea.innerHTML = this.mdToHtml(markdown);
      this.previewArea.classList.add('active');
      this.editorArea.classList.add('hidden');
      this.btnTogglePreview.textContent = '✏️ Edit Markdown';
    } else {
      this.previewArea.classList.remove('active');
      this.editorArea.classList.remove('hidden');
      this.btnTogglePreview.textContent = '👁 Show Preview';
    }
  }

  // Markdown to HTML compiler
  mdToHtml(md) {
    if (!md) return '';
    
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^\> (.*?)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\*\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    
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
          tableHtml += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          if (cells.every(c => c.startsWith('-'))) {
            continue;
          }
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          lines[i - 1] = tableHtml + '\n' + line;
        }
      }
    }
    
    if (inTable) {
      tableHtml += '</tbody></table>';
      lines[lines.length - 1] = tableHtml;
    }
    
    html = lines.join('\n');
    
    html = html.split(/\n{2,}/).map(para => {
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

  async copyToClipboard(text, btnElement) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Markdown copied to clipboard!', 'success');
      if (btnElement) {
        const originalText = btnElement.textContent;
        btnElement.textContent = '✅ Copied!';
        setTimeout(() => { btnElement.textContent = originalText; }, 2000);
      }
    } catch (err) {
      this.showToast(`Failed to copy: ${err.message}`, 'error');
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
