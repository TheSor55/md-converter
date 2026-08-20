/**
 * converters/pdf.js
 * Converts PDF files to text page-by-page asynchronously using PDF.js
 */

export async function convertPdf(file, onProgress) {
  if (!window.__pdfjs) {
    throw new Error('PDF.js library is not loaded. Ensure pdf.min.mjs and pdf.worker.min.mjs are present in libs/.');
  }
  
  const buffer = await file.arrayBuffer();
  
  // Load document using window.__pdfjs
  const loadingTask = window.__pdfjs.getDocument({ data: buffer });
  
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  let extractedText = '';
  
  for (let p = 1; p <= numPages; p++) {
    // Report progress to the UI
    if (typeof onProgress === 'function') {
      onProgress(p, numPages);
    }
    
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ').trim();
    
    if (pageText) {
      extractedText += `<!-- Page ${p} -->\n\n${pageText}\n\n`;
    }
  }
  
  return extractedText.trim();
}
