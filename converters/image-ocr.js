/**
 * converters/image-ocr.js
 * Performs client-side image OCR (Thai / English) using Tesseract.js v4 API
 */

export async function convertImageOcr(file, lang = 'eng+tha', onProgress) {
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js is not loaded. Ensure tesseract.min.js is present in libs/.');
  }
  
  // Create worker with logger option
  const worker = await Tesseract.createWorker({
    logger: message => {
      // Progress reporting
      if (message && message.status === 'recognizing' && typeof onProgress === 'function') {
        const percent = Math.round(message.progress * 100);
        onProgress(percent);
      }
    }
  });
  
  try {
    // Tesseract.js v4 required sequence
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    
    const { data: { text } } = await worker.recognize(file);
    return text || '';
  } finally {
    // Ensure resources are released
    await worker.terminate();
  }
}
