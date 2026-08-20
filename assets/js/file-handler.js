/**
 * assets/js/file-handler.js
 * Manages file queues, enforces size limits, and routes files to correct converters.
 */

import { convertText } from '../../converters/text.js';
import { convertDocx } from '../../converters/docx.js';
import { convertPdf } from '../../converters/pdf.js';
import { convertSpreadsheet } from '../../converters/spreadsheet.js';
import { convertPresentation } from '../../converters/presentation.js';
import { convertImageOcr } from '../../converters/image-ocr.js';
import { WhisperProvider, GeminiProvider } from '../../converters/audio.js';
import { convertVideo, downsampleAudioFile } from '../../converters/video.js';
import { convertCadOrCode } from '../../converters/cad-code.js';

// Configuration size limits in bytes
const SIZE_LIMITS = {
  document: 50 * 1024 * 1024, // 50 MB
  image: 20 * 1024 * 1024,    // 20 MB
  audio: 200 * 1024 * 1024,  // 200 MB
  video: 500 * 1024 * 1024   // 500 MB
};

// Categorize extensions
const EXT_MAP = {
  // Documents
  pdf: 'document', docx: 'document', doc: 'document',
  xlsx: 'document', xls: 'document', csv: 'document',
  pptx: 'document', ppt: 'document', txt: 'document',
  html: 'document', htm: 'document', json: 'document',
  xml: 'document', md: 'document',
  
  // CAD & Assembly/PLC
  dxf: 'document', asm: 'document', s: 'document',
  st: 'document', il: 'document', ld: 'document', plc: 'document',

  // Images
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', bmp: 'image',

  // Audio
  mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio', webm: 'audio',

  // Video
  mp4: 'video', mov: 'video'
};

export class QueueManager {
  constructor() {
    this.queue = []; // Array of File objects with extra status metadata
    this.results = []; // Array of converted objects
  }

  addFiles(files) {
    let addedCount = 0;
    let errors = [];

    files.forEach(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const category = EXT_MAP[ext];

      if (!category) {
        errors.push(`${file.name}: Unsupported file type (.${ext})`);
        return;
      }

      const limit = SIZE_LIMITS[category];
      if (file.size > limit) {
        const limitMb = limit / (1024 * 1024);
        errors.push(`${file.name}: Exceeds file size limit of ${limitMb}MB`);
        return;
      }

      // Avoid duplicates in current queue
      if (this.queue.some(q => q.file.name === file.name && q.file.size === file.size)) {
        return;
      }

      this.queue.push({
        file: file,
        category: category,
        ext: ext,
        status: 'pending', // pending, processing, done, failed
        progress: 0,
        error: null,
        resultIndex: -1
      });
      addedCount++;
    });

    return { addedCount, errors };
  }

  removeFile(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
    }
  }

  clearQueue() {
    this.queue = [];
    this.results = [];
  }

  // Convert a single file based on its category/type
  async convertFile(item, options = {}, onProgressCallback) {
    const file = item.file;
    const ext = item.ext;
    
    item.status = 'processing';
    item.progress = 10;
    if (onProgressCallback) onProgressCallback(item);

    try {
      let rawText = '';

      // ROUTING
      if (item.category === 'document') {
        if (ext === 'pdf') {
          rawText = await convertPdf(file, (current, total) => {
            item.progress = Math.round((current / total) * 100);
            if (onProgressCallback) onProgressCallback(item);
          });
        } else if (ext === 'docx' || ext === 'doc') {
          rawText = await convertDocx(file);
        } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
          rawText = await convertSpreadsheet(file);
        } else if (ext === 'pptx' || ext === 'ppt') {
          rawText = await convertPresentation(file);
        } else if (['dxf', 'asm', 's', 'st', 'il', 'ld', 'plc'].includes(ext)) {
          rawText = await convertCadOrCode(file);
        } else {
          // Standard text, XML, JSON, HTML, MD
          rawText = await convertText(file);
        }
      } 
      
      else if (item.category === 'image') {
        const ocrLang = options.ocrLang || 'eng+tha';
        rawText = await convertImageOcr(file, ocrLang, (pct) => {
          item.progress = pct;
          if (onProgressCallback) onProgressCallback(item);
        });
      } 
      
      else if (item.category === 'audio') {
        const providerName = options.apiProvider || 'local';
        const apiKey = options.apiKey || '';
        
        if (providerName === 'local') {
          throw new Error('Local browser engine only supports real-time microphone input. Please select OpenAI Whisper or Google Gemini API for file transcription.');
        }
        
        // Downsample audio to 16kHz mono WAV file to fit API size limits and speed up upload
        const wavFile = await downsampleAudioFile(file, (pct) => {
          item.progress = Math.round(pct * 0.5); // 0% to 50%
          if (onProgressCallback) onProgressCallback(item);
        });
        
        let provider;
        if (providerName === 'whisper') {
          provider = new WhisperProvider();
        } else if (providerName === 'gemini') {
          provider = new GeminiProvider();
        } else {
          throw new Error('Unsupported transcription provider');
        }
        
        rawText = await provider.transcribe(wavFile, apiKey, (pct) => {
          item.progress = 50 + Math.round(pct * 0.5); // 50% to 100%
          if (onProgressCallback) onProgressCallback(item);
        });
      } 
      
      else if (item.category === 'video') {
        const providerName = options.apiProvider || 'local';
        const apiKey = options.apiKey || '';
        
        if (providerName === 'local') {
          throw new Error('Direct local video decoding requires external transcription provider (Whisper or Gemini). Please configure API settings.');
        }
        
        rawText = await convertVideo(file, providerName, apiKey, (pct) => {
          item.progress = pct;
          if (onProgressCallback) onProgressCallback(item);
        });
      }

      item.status = 'done';
      item.progress = 100;
      item.error = null;
      
      const outName = file.name.replace(/\.[^.]+$/, '.md');
      
      const resultObj = {
        name: file.name,
        outName: outName,
        ok: true,
        category: item.category,
        origSize: file.size,
        rawText: rawText,
        error: null
      };
      
      this.results.push(resultObj);
      item.resultIndex = this.results.length - 1;
      
      if (onProgressCallback) onProgressCallback(item);
      return resultObj;

    } catch (err) {
      item.status = 'failed';
      item.progress = 0;
      item.error = err.message;
      
      const resultObj = {
        name: file.name,
        ok: false,
        error: err.message
      };
      
      this.results.push(resultObj);
      item.resultIndex = this.results.length - 1;
      
      if (onProgressCallback) onProgressCallback(item);
      return resultObj;
    }
  }

  // Generates a ZIP archive of all successfully converted markdown files
  async generateZip() {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip is not loaded.');
    }
    
    const zip = new JSZip();
    let fileAdded = false;
    
    this.results.forEach(r => {
      if (r.ok && r.formattedMarkdown) {
        zip.file(r.outName, r.formattedMarkdown);
        fileAdded = true;
      }
    });
    
    if (!fileAdded) {
      throw new Error('No successfully converted files to zip.');
    }
    
    return await zip.generateAsync({ type: 'blob' });
  }
}
