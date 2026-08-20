/**
 * converters/presentation.js
 * Converts PPTX files to Markdown by extracting text nodes from slide XML using JSZip
 */

export async function convertPresentation(file) {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded. Ensure jszip.min.js is present in libs/.');
  }
  
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  
  let md = '';
  
  // Find slide XML files, e.g. ppt/slides/slide1.xml
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
    
  if (slideFiles.length === 0) {
    return '*(No slides found or unsupported PPTX format)*';
  }
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideXmlText = await zip.files[slideFiles[i]].async('text');
    
    // Parse slide XML to extract text nodes
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXmlText, 'text/xml');
    
    // In OpenXML format, slide text is inside <a:t> nodes
    const textNodes = doc.getElementsByTagName('a:t');
    let slideTexts = [];
    
    for (let t = 0; t < textNodes.length; t++) {
      const val = textNodes[t].textContent;
      if (val && val.trim()) {
        slideTexts.push(val.trim());
      }
    }
    
    md += `## Slide ${i + 1}\n\n`;
    if (slideTexts.length > 0) {
      md += slideTexts.join(' ') + '\n\n';
    } else {
      md += '*(Empty slide)*\n\n';
    }
  }
  
  return md.trim();
}
