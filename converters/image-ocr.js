/**
 * converters/image-ocr.js
 * Performs client-side image OCR (Thai / English) using Tesseract.js v4 API
 */

export async function convertImageOcr(file, lang = 'eng+tha', onProgress) {
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js is not loaded. Ensure tesseract.min.js is present in libs/.');
  }
  
  // Create worker with explicit CDN paths to prevent local 404 resolution issues
  const worker = await Tesseract.createWorker({
    workerPath: 'https://unpkg.com/tesseract.js@v4.1.1/dist/worker.min.js',
    corePath: 'https://unpkg.com/tesseract.js-core@v4.0.3/tesseract-core.wasm.js',
    logger: message => {
      // Progress reporting
      if (message && message.status === 'recognizing' && typeof onProgress === 'function') {
        const percent = Math.round(message.progress * 100);
        onProgress(percent);
      }
    }
  });
  
  // Create HTMLImageElement to ensure image is fully loaded before processing
  const imageUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = imageUrl;
  
  try {
    // Wait for image to load fully in memory
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Failed to load image file into browser memory."));
    });

    // Tesseract.js v4 required sequence
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    
    // Pass the fully loaded HTMLImageElement to recognize
    const { data: { text } } = await worker.recognize(img);
    return text || '';
  } finally {
    // Clean up resources
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
  }
}
