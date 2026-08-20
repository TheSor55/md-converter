/**
 * converters/cad-code.js
 * Handles text-based CAD files (.dxf) and PLC/Assembly source code (.asm, .s, .st, .il, .ld)
 */

export async function convertCadOrCode(file) {
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (ext === 'dxf') {
    return parseDxfText(text, file.name);
  }
  
  // Wrap PLC/Assembly in code block
  let lang = 'text';
  if (ext === 'asm' || ext === 's') {
    lang = 'assembly';
  } else if (ext === 'st') {
    lang = 'pascal'; // Structured Text syntax is similar to Pascal
  } else if (ext === 'il') {
    lang = 'iecst'; // Instruction List syntax
  } else if (ext === 'ld') {
    lang = 'ladder'; // Ladder Logic code (as text)
  }
  
  return `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
}

// Simple stream parser for DXF files to extract TEXT and MTEXT entities
function parseDxfText(dxfText, filename) {
  const lines = dxfText.split(/\r?\n/).map(l => l.trim());
  let texts = [];
  
  let isTextSection = false;
  let groupCode = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we are reading a group code (even lines in DXF) or a value (odd lines)
    if (i % 2 === 0) {
      groupCode = line;
    } else {
      // Group code '1' represents the text string value in DXF text/dimension entities
      if (groupCode === '1') {
        // Clean DXF styling codes (e.g., "\A1;", "\P" for newlines, fonts, colors)
        let cleaned = line
          .replace(/\\[A-Z].*?;/gi, '') // Removes styling codes like \fCourier New|b0|i0|c0|p34;
          .replace(/\\P/g, '\n')        // Replace paragraph code with actual newline
          .replace(/[{}]/g, '')         // Remove formatting brackets
          .trim();
          
        if (cleaned && !texts.includes(cleaned)) {
          texts.push(cleaned);
        }
      }
    }
  }
  
  if (texts.length === 0) {
    return `*(No text layers, annotations, or dimensions found in drawing: ${filename})*`;
  }
  
  // Generate structured markdown list
  let md = `## Drawing Annotations & Text Layers\n\n`;
  texts.forEach(t => {
    // If text has multiline breaks
    if (t.includes('\n')) {
      md += `*   **Block**:\n${t.split('\n').map(line => `    > ${line}`).join('\n')}\n`;
    } else {
      md += `*   ${t}\n`;
    }
  });
  
  return md.trim();
}
