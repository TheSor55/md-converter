/**
 * converters/spreadsheet.js
 * Converts XLSX, XLS, and CSV files to Markdown tables using SheetJS
 */

export async function convertSpreadsheet(file) {
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS (xlsx.full.min.js) library is not loaded. Ensure it is in libs/.');
  }
  
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  let md = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to json array of objects (using first row as header)
    // raw: false forces formatting of cells as strings
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    
    if (rows.length === 0) return;
    
    md += `## Sheet: ${sheetName}\n\n`;
    
    // Rows[0] is the header row
    const headers = rows[0].map(h => String(h || '').trim());
    const columnCount = headers.length;
    
    // Table Header
    md += '| ' + headers.join(' | ') + ' |\n';
    md += '| ' + Array(columnCount).fill('---').join(' | ') + ' |\n';
    
    // Table Body Rows
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      // Pad array if row has fewer cells than columns
      const rowCells = [];
      for (let c = 0; c < columnCount; c++) {
        const val = String(rowData[c] !== undefined ? rowData[c] : '').trim();
        // Escape vertical bars to keep markdown table structure valid
        rowCells.push(val.replace(/\|/g, '\\|'));
      }
      md += '| ' + rowCells.join(' | ') + ' |\n';
    }
    md += '\n';
  });
  
  return md.trim();
}
