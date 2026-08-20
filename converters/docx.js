/**
 * converters/docx.js
 * Converts DOCX files to raw text using Mammoth.js
 */

export async function convertDocx(file) {
  if (typeof mammoth === 'undefined') {
    throw new Error('Mammoth.js library is not loaded. Ensure mammoth.browser.min.js is present in libs/.');
  }
  
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  
  if (result.messages && result.messages.length > 0) {
    console.warn('Mammoth warning:', result.messages);
  }
  
  return result.value || '';
}
