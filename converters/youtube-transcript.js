/**
 * converters/youtube-transcript.js
 * Parses and cleans pasted YouTube transcripts.
 * Supports removing/formatting timestamps, merging short lines, and speaker highlighting.
 */

export function cleanYoutubeTranscript(rawTranscript, options = {}) {
  const {
    removeTimestamps = true,
    mergeLines = true,
    formatSpeakers = false
  } = options;
  
  if (!rawTranscript || !rawTranscript.trim()) {
    return '*(Empty Transcript)*';
  }
  
  // Split into lines
  let lines = rawTranscript.split('\n').map(l => l.trim());
  
  let cleanedLines = [];
  
  // Timestamps regex: supports 0:00, 00:00, 00:00:00, [00:00], etc.
  const timestampRegex = /^\s*\[?\d{1,2}:\d{2}(:\d{2})?\]?\s*/;
  // Solo timestamp lines like "0:05" on their own line
  const soloTimestampRegex = /^\s*\[?\d{1,2}:\d{2}(:\d{2})?\]?\s*$/;
  // Speaker tags like "[Speaker 1]" or "Name:"
  const speakerRegex = /^\[([^\]]+)\]:\s*|^([^:]+):\s*/;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (!line) continue;
    
    // If it's just a timestamp line, skip it or keep it depending on settings
    if (soloTimestampRegex.test(line)) {
      if (removeTimestamps) {
        continue;
      }
    }
    
    let timestamp = '';
    // Extract timestamp if present at start of line
    const tsMatch = line.match(timestampRegex);
    if (tsMatch) {
      timestamp = tsMatch[0].trim();
      if (removeTimestamps) {
        line = line.replace(timestampRegex, '');
      }
    }
    
    line = line.trim();
    if (!line) continue;
    
    // Speaker formatting
    if (formatSpeakers) {
      const spMatch = line.match(speakerRegex);
      if (spMatch) {
        const speakerName = spMatch[1] || spMatch[2];
        line = line.replace(speakerRegex, `\n\n**${speakerName.trim()}**: `);
      }
    }
    
    // Add line back with timestamp if kept
    if (!removeTimestamps && timestamp) {
      cleanedLines.push(`\`${timestamp}\` ${line}`);
    } else {
      cleanedLines.push(line);
    }
  }
  
  if (mergeLines) {
    // Combine consecutive short lines into paragraphs
    let paragraphs = [];
    let currentParagraph = [];
    
    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      
      // If line is a new speaker (has **Speaker**: prefix) or starts a new line explicitly, push current paragraph
      if (line.startsWith('\n\n**')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        paragraphs.push(line.replace('\n\n', '')); // Strip leading newlines as it will be separated by join
      } else {
        currentParagraph.push(line);
        // Break paragraph if it ends with punctuation or is too long (e.g. 8 sentences)
        if (line.endsWith('.') || line.endsWith('?') || line.endsWith('!') || line.endsWith('คลิก') || currentParagraph.length >= 6) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
      }
    }
    
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(' '));
    }
    
    return paragraphs.join('\n\n');
  }
  
  return cleanedLines.join('\n');
}
