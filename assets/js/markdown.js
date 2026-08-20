/**
 * assets/js/markdown.js
 * Builds structured markdown using output presets and applies PDPA anonymization.
 */

// PDPA Anonymizer: Scans text for company names and replaces them consistently with Company A, B, C...
export function anonymizeText(text, customKeywords = []) {
  if (!text) return '';
  
  const companyMap = new Map(); // Maps original company name -> placeholder (Company A)
  let placeholderCount = 0;
  
  function getPlaceholder() {
    const char = String.fromCharCode(65 + placeholderCount); // A, B, C...
    placeholderCount++;
    return `[Company ${char}]`;
  }
  
  let sanitizedText = text;
  
  // 1. Process custom keywords first (exact case-insensitive match)
  if (customKeywords && customKeywords.length > 0) {
    customKeywords.forEach(kw => {
      const cleanKw = kw.trim();
      if (!cleanKw) return;
      
      // Escape special characters for regex
      const escapedKw = cleanKw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedKw, 'gi');
      
      // Find matches
      const matches = sanitizedText.match(regex);
      if (matches) {
        matches.forEach(match => {
          const matchKey = match.toLowerCase().trim();
          if (!companyMap.has(matchKey)) {
            companyMap.set(matchKey, getPlaceholder());
          }
          sanitizedText = sanitizedText.replace(new RegExp(escapedKw, 'gi'), companyMap.get(matchKey));
        });
      }
    });
  }
  
  // 2. Process standard corporate regex patterns
  const patterns = [
    // Thai: บริษัท สมชาย จำกัด (มหาชน), บริษัท ไอที จำกัด
    /บริษัท\s+([ก-๙a-zA-Z0-9_.-]+(?:\s+[ก-๙a-zA-Z0-9_.-]+)*)\s+(?:จำกัด\(มหาชน\)|จำกัด)/g,
    // Thai: บจก. สมชาย, บมจ. สมชาย
    /(?:บจก\.|บมจ\.)\s*([ก-๙a-zA-Z0-9_.-]+(?:\s+[ก-๙a-zA-Z0-9_.-]+)*)/g,
    // English: Acme Co., Ltd., Cyberdyne Systems Ltd, Initech LLC
    /\b([A-Z][a-zA-Z0-9_.-]*(?:\s+[A-Z][a-zA-Z0-9_.-]*)*)\s+(?:Co\.,?\s*Ltd\.|Ltd\.|LLC|Corp\.|Inc\.)/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    // We run exec in a loop to capture all instances
    const matchedNames = [];
    
    // Find all matches
    while ((match = pattern.exec(sanitizedText)) !== null) {
      matchedNames.push(match[0].trim());
    }
    
    // Replace all matches
    matchedNames.forEach(fullName => {
      const key = fullName.toLowerCase();
      if (!companyMap.has(key)) {
        companyMap.set(key, getPlaceholder());
      }
      // Replace all occurrences of this specific full name
      const escapedName = fullName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      sanitizedText = sanitizedText.replace(new RegExp(escapedName, 'g'), companyMap.get(key));
    });
  });
  
  return sanitizedText;
}

// Build structured markdown from raw text and preset
export function buildMarkdown(filename, rawContent, preset = 'standard', options = {}) {
  const stem = filename.replace(/\.[^.]+$/, '');
  let content = rawContent || '';
  
  // Apply PDPA anonymization if enabled
  if (options.pdpa) {
    const customKws = options.pdpaKeywords || [];
    content = anonymizeText(content, customKws);
  }
  
  // Standard paragraph separation
  const processParagraphs = (txt) => {
    return txt.split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean)
      .join('\n\n');
  };
  
  switch (preset) {
    case 'meeting':
      return `# Meeting Notes: ${stem}

## Summary
*Auto-structured from document contents.*

## Discussion
${processParagraphs(content)}

## Decisions
- [Decision 1]
- [Decision 2]

## Action Items
- [ ] **Action 1**: Responsible party
- [ ] **Action 2**: Responsible party
`;

    case 'lecture':
      return `# Lecture Notes: ${stem}

## Topic
*Main subject of the document.*

## Key Concepts
- **Concept 1**: Brief description
- **Concept 2**: Brief description

## Detailed Notes
${processParagraphs(content)}

## Summary & Review
*Key takeaways and follow-up study items.*
`;

    case 'research':
      return `# Research Notes: ${stem}

## Source / Metadata
- **Source File**: ${filename}
- **Date Processed**: ${new Date().toLocaleDateString('th-TH')}

## Abstract / Executive Summary
*Summary of research goals and scope.*

## Key Findings
- **Finding 1**: Description of result
- **Finding 2**: Description of result

## Important Quotes
> "Highlight crucial sentences from the original source here."

## Detailed Content & Analysis
${processParagraphs(content)}
`;

    case 'transcript':
      return `# Transcript: ${stem}

## Metadata
- **Source**: ${filename}
- **Processing Mode**: ${options.audioMode || 'Local/Static'}
- **Date**: ${new Date().toLocaleString('th-TH')}

## Transcript Draft
${processParagraphs(content)}

## Summary / Notes
*AI-generated transcription draft. Manual verification recommended.*
`;

    case 'standard':
    default:
      // If it already has headings, just keep it, otherwise format nicely
      if (content.startsWith('#')) {
        return content;
      }
      return `# ${stem}\n\n${processParagraphs(content)}`;
  }
}
