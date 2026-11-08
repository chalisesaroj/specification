import { SpecSection, SpecRow } from '../types/spec';

/**
 * Parses raw text copied from technical bidding documents, Word, or Excel tables
 * into structured sections and rows.
 */
export function parseSpecificationText(text: string): SpecSection[] {
  if (!text || !text.trim()) {
    return [];
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections: SpecSection[] = [];
  let currentSection: SpecSection = {
    id: 'sec-p-' + Math.random().toString(36).substring(2, 7),
    title: '1. General Technical Specifications',
    order: 1,
    rows: [],
  };

  let rowCounter = 1;

  for (const line of lines) {
    // Check if line looks like a Section heading:
    // e.g., "1. Engine & Cooling", "Section 2: Transmission", "## Brakes", "A. Electrical System"
    const sectionMatch = line.match(/^(\d+\.|\bSection\s+\d+:?|[A-Z]\.|\#\#)\s*(.+)$/i);
    const isLikelyHeading =
      (sectionMatch && !line.includes(':') && line.length < 80) ||
      (line.toUpperCase() === line && line.length < 60 && !line.includes('\t'));

    if (isLikelyHeading && currentSection.rows.length > 0) {
      sections.push(currentSection);
      const nextOrder = sections.length + 1;
      currentSection = {
        id: 'sec-p-' + Math.random().toString(36).substring(2, 7),
        title: line.replace(/^[\#\*\s]+/, '').trim(),
        order: nextOrder,
        rows: [],
      };
      rowCounter = 1;
      continue;
    }

    // Try parsing row:
    // Case 1: Tab separated (e.g. copied from Excel/Word table: "1.1 \t Engine Displacement \t Min 2400cc")
    if (line.includes('\t')) {
      const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        let itemNum = `${currentSection.order}.${rowCounter}`;
        let param = parts[0];
        let req = parts[1];

        // If first part is just a number like "1.1" or "2"
        if (/^(\d+(\.\d+)?|[a-z]\.?)$/i.test(parts[0]) && parts.length >= 3) {
          itemNum = parts[0];
          param = parts[1];
          req = parts.slice(2).join('; ');
        }

        currentSection.rows.push({
          id: 'row-p-' + Math.random().toString(36).substring(2, 7),
          itemNumber: itemNum,
          parameter: param,
          requirement: req,
        });
        rowCounter++;
        continue;
      }
    }

    // Case 2: Colon or hyphen separated (e.g., "1.2 Engine Type: 4 Cylinder Turbo Diesel")
    const colonIndex = line.indexOf(':');
    const hyphenIndex = line.indexOf(' - ');
    const sepIndex = colonIndex > 0 ? colonIndex : hyphenIndex;

    if (sepIndex > 0) {
      const leftPart = line.substring(0, sepIndex).trim();
      const rightPart = line.substring(sepIndex + (colonIndex > 0 ? 1 : 3)).trim();

      // Check if left part starts with numbering
      const numMatch = leftPart.match(/^(\d+(\.\d+)?)\s*(.*)$/);
      let itemNum = String(rowCounter);
      let param = leftPart;

      if (numMatch) {
        const rawNum = numMatch[1];
        itemNum = rawNum.includes('.') ? rawNum.split('.').pop() || String(rowCounter) : rawNum;
        param = numMatch[3] || numMatch[1];
      }

      currentSection.rows.push({
        id: 'row-p-' + Math.random().toString(36).substring(2, 7),
        itemNumber: itemNum,
        parameter: param.replace(/^[-*•\s]+/, ''),
        requirement: rightPart,
      });
      rowCounter++;
      continue;
    }

    // Case 3: Just plain line, treat as row item
    currentSection.rows.push({
      id: 'row-p-' + Math.random().toString(36).substring(2, 7),
      itemNumber: String(rowCounter),
      parameter: line.replace(/^[-*•\s]+/, ''),
      requirement: 'As specified by manufacturer standard.',
    });
    rowCounter++;
  }

  if (currentSection.rows.length > 0 || sections.length === 0) {
    sections.push(currentSection);
  }

  return sections;
}
