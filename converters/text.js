/**
 * converters/text.js
 * Handles plain text, html, xml, json, markdown inputs
 */

export async function convertText(file) {
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'md') {
    return text; // Pass through raw markdown
  }
  
  if (ext === 'json') {
    try {
      const obj = JSON.parse(text);
      return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
    } catch {
      return text;
    }
  }
  
  if (ext === 'html' || ext === 'htm') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    // Extract textual content from body, fallback to document element
    const bodyText = doc.body ? doc.body.innerText || doc.body.textContent : doc.documentElement.textContent;
    return bodyText ? bodyText.trim() : text;
  }
  
  if (ext === 'xml') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      // Return raw text if XML parsing fails
      return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return doc.documentElement.textContent ? doc.documentElement.textContent.trim() : text;
  }
  
  // Default raw text
  return text;
}
