/* script.js — MD Converter Web App Logic */

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
let selectedFiles = [];
let convertedResults = [];

// ══════════════════════════════════════
// TABS
// ══════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

// ══════════════════════════════════════
// FILE ICONS
// ══════════════════════════════════════
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📕', docx: '📘', doc: '📘',
    pptx: '📙', ppt: '📙',
    xlsx: '📗', xls: '📗',
    txt: '📄', csv: '📊', json: '🔧', xml: '🔧',
    html: '🌐', htm: '🌐',
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', bmp: '🖼', webp: '🖼',
    zip: '📦', epub: '📚',
  };
  return icons[ext] || '📄';
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  if (bytes >= 1024)         return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

function formatNum(n) {
  return n.toLocaleString('th-TH');
}

// ══════════════════════════════════════
// DRAG & DROP
// ══════════════════════════════════════
const dropzone  = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  handleFiles([...e.dataTransfer.files]);
});
dropzone.addEventListener('click', e => {
  if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
    fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  handleFiles([...fileInput.files]);
  fileInput.value = '';
});

function handleFiles(files) {
  files.forEach(f => {
    if (!selectedFiles.find(sf => sf.name === f.name && sf.size === f.size)) {
      selectedFiles.push(f);
    }
  });
  renderFileList();
}

function renderFileList() {
  const list = document.getElementById('selected-files');
  const wrap = document.getElementById('file-list');
  const count = document.getElementById('file-count');

  if (selectedFiles.length === 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = 'block';
  count.textContent = `${selectedFiles.length} ไฟล์เลือกไว้`;
  list.innerHTML = '';

  selectedFiles.forEach((f, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="file-icon">${getFileIcon(f.name)}</span>
      <span class="file-name" title="${f.name}">${f.name}</span>
      <span class="file-size">${formatSize(f.size)}</span>
      <button onclick="removeFile(${i})" style="background:none;border:none;cursor:pointer;color:#7d8590;padding:0 0.3rem;font-size:1rem;" title="ลบ">✕</button>
    `;
    list.appendChild(li);
  });
}

function removeFile(idx) {
  selectedFiles.splice(idx, 1);
  renderFileList();
}

function clearFiles() {
  selectedFiles = [];
  convertedResults = [];
  renderFileList();
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('stats-overview').style.display = 'none';
  document.getElementById('progress-section').style.display = 'none';
}

// ══════════════════════════════════════
// CONVERT (Upload Tab)
// ══════════════════════════════════════
async function startConvert() {
  if (selectedFiles.length === 0) return;

  const btn = document.getElementById('btn-convert');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังแปลง...';

  // Show progress
  const progSection = document.getElementById('progress-section');
  const progBar     = document.getElementById('progress-bar');
  const progLabel   = document.getElementById('progress-label');
  progSection.style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('stats-overview').style.display = 'none';
  document.getElementById('results-list').innerHTML = '';

  convertedResults = [];

  // Process files in batches of 3
  const batchSize = 3;
  let processed = 0;

  for (let i = 0; i < selectedFiles.length; i += batchSize) {
    const batch = selectedFiles.slice(i, i + batchSize);
    const formData = new FormData();
    batch.forEach(f => formData.append('files', f));

    try {
      progLabel.textContent = `กำลังแปลง ${i + 1}–${Math.min(i + batchSize, selectedFiles.length)} / ${selectedFiles.length} ไฟล์...`;

      const res = await fetch('/api/convert', { method: 'POST', body: formData });
      const data = await res.json();
      convertedResults.push(...data.results);

      processed += batch.length;
      const pct = Math.round((processed / selectedFiles.length) * 100);
      progBar.style.width = pct + '%';
    } catch (err) {
      console.error(err);
    }
  }

  progLabel.textContent = '✅ แปลงเสร็จแล้ว!';
  progBar.style.width = '100%';

  renderResults(convertedResults);

  btn.disabled = false;
  btn.textContent = '⚡ แปลงเลย';
}

// ══════════════════════════════════════
// CONVERT FOLDER
// ══════════════════════════════════════
function setFolderPath(path) {
  document.getElementById('folder-path').value = path;
}

async function startFolderConvert() {
  const path = document.getElementById('folder-path').value.trim();
  if (!path) {
    alert('กรุณาใส่ path โฟลเดอร์');
    return;
  }

  const btn      = document.getElementById('btn-folder-convert');
  const progWrap = document.getElementById('folder-progress');
  const progBar  = document.getElementById('folder-progress-bar');
  const progLabel= document.getElementById('folder-progress-label');

  btn.disabled = true;
  btn.textContent = '⏳ กำลังแปลง...';
  progWrap.style.display = 'block';
  progBar.style.width = '15%';
  progLabel.textContent = `กำลังสแกนและแปลงไฟล์ใน: ${path}`;

  try {
    const res = await fetch('/api/convert_folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const data = await res.json();

    progBar.style.width = '100%';

    if (data.error) {
      progLabel.textContent = '❌ ' + data.error;
    } else {
      progLabel.textContent = `✅ แปลงเสร็จ ${data.results.filter(r=>r.success).length} ไฟล์ → บันทึกที่: ${data.output_dir}`;
      convertedResults = data.results;
      renderResults(convertedResults);
    }
  } catch (err) {
    progLabel.textContent = '❌ เกิดข้อผิดพลาด: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = '⚡ แปลง';
}

// ══════════════════════════════════════
// RENDER RESULTS
// ══════════════════════════════════════
function renderResults(results) {
  const section   = document.getElementById('results-section');
  const list      = document.getElementById('results-list');
  const statsDiv  = document.getElementById('stats-overview');
  const btnDlAll  = document.getElementById('btn-download-all');

  section.style.display = 'block';
  statsDiv.style.display = 'grid';
  list.innerHTML = '';

  const success = results.filter(r => r.success);
  const failed  = results.filter(r => !r.success);

  // ── Stats ──
  const totalOrig    = success.reduce((a,r) => a + (r.orig_size_kb || 0), 0);
  const totalMd      = success.reduce((a,r) => a + (r.md_size_kb   || 0), 0);
  const totalOrigTok = success.reduce((a,r) => a + (r.orig_tokens  || 0), 0);
  const totalMdTok   = success.reduce((a,r) => a + (r.md_tokens    || 0), 0);
  const savedPct     = totalOrigTok > 0
    ? ((1 - totalMdTok / totalOrigTok) * 100).toFixed(1)
    : 0;

  document.getElementById('stat-files').textContent    = success.length;
  document.getElementById('stat-orig-size').textContent = totalOrig >= 1024
    ? (totalOrig/1024).toFixed(1) + ' MB'
    : totalOrig.toFixed(1) + ' KB';
  document.getElementById('stat-md-size').textContent   = totalMd >= 1024
    ? (totalMd/1024).toFixed(1) + ' MB'
    : totalMd.toFixed(1) + ' KB';
  document.getElementById('stat-saved').textContent     = savedPct + '%';

  btnDlAll.style.display = success.length > 1 ? 'inline-flex' : 'none';

  // ── Result Cards ──
  results.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'result-card ' + (r.success ? 'success-card' : 'error-card');
    card.id = 'card-' + idx;

    if (r.success) {
      const savedColor = r.saved_pct > 50 ? 'gold' : '';
      card.innerHTML = `
        <div class="result-header" onclick="toggleCard(${idx})">
          <span class="result-status">✅</span>
          <span class="result-name" title="${r.filename}">${r.filename}</span>
          <div class="result-meta">
            <span class="meta-tag">${r.orig_size_kb} KB → ${r.md_size_kb} KB</span>
            <span class="meta-tag green">~${formatNum(r.md_tokens)} tokens</span>
            <span class="meta-tag ${savedColor}">ประหยัด ${r.saved_pct}%</span>
          </div>
          <span class="chevron" id="chev-${idx}">▼</span>
        </div>
        <div class="result-body" id="body-${idx}">
          <div class="result-actions">
            <button class="btn btn-green btn-sm" onclick="downloadSingle(${idx}, '${escapeStr(r.out_name || r.filename)}')" id="dl-btn-${idx}">
              ⬇️ ดาวน์โหลด .md
            </button>
            <button class="btn btn-outline btn-sm" onclick="copyText(${idx})">
              📋 คัดลอก
            </button>
          </div>
          <div class="md-preview" id="preview-${idx}">${escapeHtml(r.preview || '')}</div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="result-header">
          <span class="result-status">❌</span>
          <span class="result-name">${r.filename}</span>
        </div>
        <div class="result-body open">
          <div class="error-msg">⚠️ ${escapeHtml(r.error || 'ไม่ทราบสาเหตุ')}</div>
        </div>
      `;
    }

    list.appendChild(card);
  });

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleCard(idx) {
  const body = document.getElementById('body-' + idx);
  const chev = document.getElementById('chev-' + idx);
  const header = body.previousElementSibling;

  const isOpen = body.classList.toggle('open');
  chev.classList.toggle('open', isOpen);
  header.classList.toggle('open', isOpen);
}

// ══════════════════════════════════════
// DOWNLOAD
// ══════════════════════════════════════
async function downloadSingle(idx, name) {
  const r = convertedResults[idx];
  if (!r || !r.full_text) return;

  const res = await fetch('/api/download_single', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: r.full_text, name: r.out_name || name }),
  });
  const blob = await res.blob();
  triggerDownload(blob, r.out_name || name);
}

async function downloadAll() {
  const files = convertedResults
    .filter(r => r.success && r.full_text)
    .map(r => ({ name: r.out_name || r.filename + '.md', content: r.full_text }));

  if (files.length === 0) return;

  const res = await fetch('/api/download_zip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files }),
  });
  const blob = await res.blob();
  triggerDownload(blob, 'converted_markdown.zip');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyText(idx) {
  const r = convertedResults[idx];
  if (!r || !r.full_text) return;
  try {
    await navigator.clipboard.writeText(r.full_text);
    const btn = document.querySelector(`#body-${idx} .btn-outline`);
    const orig = btn.textContent;
    btn.textContent = '✅ คัดลอกแล้ว!';
    setTimeout(() => btn.textContent = orig, 2000);
  } catch (e) {
    console.error(e);
  }
}

// ══════════════════════════════════════
// UTILS
// ══════════════════════════════════════
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeStr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
