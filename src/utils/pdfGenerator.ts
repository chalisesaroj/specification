import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  WorkRecord,
  SpecContent,
  CostEstimateData,
  DocumentStage,
  FunctionalTestRow,
  InspectionPhoto,
  SpecRow,
} from '../types/spec';
import { numberToWordsNPR } from './numberToWords';
import {
  getStageTitle,
  resolveStage,
  buildConclusionText,
  getGeneralInspectionRows,
  isAcceptedConclusion,
} from './documentMeta';

export interface GeneratePDFOptions {
  isEvaluation?: boolean;
  isInspection?: boolean;
}

const PAGE_MARGIN = 14;
const BOTTOM_MARGIN = 20;

type Doc = jsPDF;

function pageWidth(doc: Doc) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: Doc) {
  return doc.internal.pageSize.getHeight();
}

/** Adds a page if the next block would not fit, returning the safe Y position. */
function ensureSpace(doc: Doc, y: number, needed: number): number {
  if (y + needed > pageHeight(doc) - BOTTOM_MARGIN) {
    doc.addPage();
    return 20;
  }
  return y;
}

/** Draws the shared document header used by every document type. */
function drawDocumentHeader(doc: Doc, content: SpecContent, stage: DocumentStage, startY: number): number {
  const w = pageWidth(doc);
  const center = w / 2;
  let y = startY;

  // Top rule
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.8);
  doc.line(PAGE_MARGIN, y - 6, w - PAGE_MARGIN, y - 6);

  // 1. Name of Office
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 43, 73);
  doc.text((content.organizationName || 'OFFICE NAME').toUpperCase(), center, y, { align: 'center' });
  y += 5.6;

  // 2. Sub division
  if (content.subDivision?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(content.subDivision.trim(), center, y, { align: 'center' });
    y += 4.4;
  }

  // 3. Office location
  if (content.officeLocation?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(content.officeLocation.trim(), center, y, { align: 'center' });
    y += 4.4;
  }

  // 4. Stage-specific document title
  const stageTitle = getStageTitle(stage).toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  if (stage === 'inspected') {
    doc.setTextColor(22, 101, 52);
  } else if (stage === 'evaluated') {
    doc.setTextColor(30, 58, 138);
  } else {
    doc.setTextColor(30, 41, 59);
  }
  doc.text(stageTitle, center, y, { align: 'center' });
  y += 4.8;

  // Thin accent underline
  const titleWidth = doc.getTextWidth(stageTitle);
  doc.setDrawColor(
    stage === 'inspected' ? 22 : 30,
    stage === 'inspected' ? 101 : 58,
    stage === 'inspected' ? 52 : 138
  );
  doc.setLineWidth(0.5);
  doc.line(center - titleWidth / 2, y - 1.4, center + titleWidth / 2, y - 1.4);
  y += 2.2;

  // 5. Project name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(51, 65, 85);
  doc.text(`Project Name: ${content.projectName?.trim() || '—'}`, center, y, { align: 'center' });
  y += 4.2;

  // 6. Fiscal year
  doc.text(`Fiscal Year: ${content.fiscalYear?.trim() || '2083/84'}`, center, y, { align: 'center' });
  y += 4.2;

  // 7 & 8. Bidder name and Reference Tender Name (evaluation / inspection only)
  if (stage === 'evaluated' || stage === 'inspected') {
    const bidder =
      content.inspectionDetails?.selectedBidderName || content.bidderName || '—';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.setTextColor(stage === 'inspected' ? 22 : 30, stage === 'inspected' ? 101 : 58, stage === 'inspected' ? 52 : 138);
    doc.text(`Bidder Name: ${bidder}`, center, y, { align: 'center' });
    y += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Reference Tender Name: ${content.tenderNo?.trim() || '—'}`, center, y, { align: 'center' });
    y += 4.2;
  }

  // User-defined additional header lines
  const validHeaders = (content.customHeaderRows || []).filter((r) => r.label && r.value);
  if (validHeaders.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    validHeaders.forEach((r) => {
      doc.text(`${r.label}: ${r.value}`, center, y, { align: 'center' });
      y += 3.7;
    });
  }

  // Bottom rule of the header
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, y - 1.5, w - PAGE_MARGIN, y - 1.5);
  return y + 4.5;
}

function drawSectionHeading(doc: Doc, text: string, y: number, accent: [number, number, number] = [30, 58, 138]): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(...accent);
  doc.roundedRect(PAGE_MARGIN, y - 4.2, 3, 6.4, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(24, 43, 73);
  doc.text(text, PAGE_MARGIN + 6, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, y, pageWidth(doc) - PAGE_MARGIN, y);
  return y + 4;
}

function resolveCompliance(row: SpecRow): string {
  if (row.compliance) return row.compliance;
  switch (row.inspectionResult) {
    case 'Rejected':
      return 'Not Complied';
    case 'Conditional':
      return 'Partial';
    case 'Pending':
      return 'Pending';
    case 'Accepted':
      return 'Complied';
    default:
      return 'Complied';
  }
}

/** Section 1: General Details of Inspection (inspection only). */
function drawGeneralDetails(doc: Doc, content: SpecContent, y: number): number {
  y = drawSectionHeading(doc, '1. General Details of Inspection', y, [22, 101, 52]);

  const rows = getGeneralInspectionRows(content);
  // Two label/value pairs per table row keeps the block compact on one page.
  const body: string[][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const a = rows[i];
    const b = rows[i + 1];
    body.push([a?.label || '', a?.value || '—', b?.label || '', b?.value || '']);
  }

  autoTable(doc, {
    startY: y,
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] },
      1: { cellWidth: 56 },
      2: { cellWidth: 34, fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] },
      3: { cellWidth: 58 },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: BOTTOM_MARGIN },
  });

  return (doc as any).lastAutoTable.finalY + 7;
}

function buildSpecificationTable(content: SpecContent, stage: DocumentStage) {
  const isInspect = stage === 'inspected';
  const isEval = stage === 'evaluated';
  const tableBody: any[] = [];
  let counter = 1;

  const cleanSN = (itemNum: string | undefined): string => {
    if (!itemNum) return String(counter++);
    const match = itemNum.match(/^\d+\.(\d+)$/);
    if (match) return match[1];
    return itemNum;
  };

  const allRowsFlat = content.sections.flatMap((s) => s.rows || []);
  const hasScope = allRowsFlat.some(
    (r) => r.parameter?.toLowerCase().includes('scope') || r.parameter?.toLowerCase().includes('general')
  );
  const hasDelivery = allRowsFlat.some((r) => r.parameter?.toLowerCase().includes('delivery'));

  const extraRows: any[] = [];
  if (!hasScope && content.vehicleDescription) {
    extraRows.push({
      sn: cleanSN(undefined),
      parameter: 'Vehicle Scope & General Description',
      requirement: content.vehicleDescription,
      offered: isInspect ? 'Verified as per specification' : '',
      compliance: 'Complied',
    });
  }
  if (!hasDelivery && content.deliveryPlace) {
    extraRows.push({
      sn: cleanSN(undefined),
      parameter: 'Delivery Destination',
      requirement: content.deliveryPlace,
      offered: isInspect ? 'Delivered at site' : '',
      compliance: 'Complied',
    });
  }

  const pushRow = (sn: string, parameter: string, requirement: string, offered: string, compliance: string) => {
    if (isInspect || isEval) {
      tableBody.push([sn, parameter, requirement, offered, compliance]);
    } else {
      tableBody.push([sn, parameter, requirement, offered]);
    }
  };

  content.sections.forEach((section, sIdx) => {
    if (content.sections.length > 1) {
      tableBody.push([
        {
          content: section.title.toUpperCase(),
          colSpan: isInspect || isEval ? 5 : 4,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold' as const,
            fontSize: 8,
            halign: 'left' as const,
            cellPadding: 2.5,
          },
        },
      ]);
    }

    if (sIdx === 0) {
      extraRows.forEach((r) => pushRow(r.sn, r.parameter, r.requirement, r.offered, r.compliance));
    }

    section.rows.forEach((row) => {
      pushRow(
        cleanSN(row.itemNumber),
        row.parameter || '',
        row.requirement || '',
        (isInspect ? row.inspectedValue || row.offeredSpecification : row.offeredSpecification) || '',
        resolveCompliance(row)
      );
    });
  });

  const head = isInspect
    ? [
        [
          { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 12 } },
          { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 42 } },
          { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 56 } },
          { content: 'Delivered / Inspected Specification', styles: { halign: 'left' as const, cellWidth: 44 } },
          { content: 'Compliance', styles: { halign: 'center' as const, cellWidth: 28 } },
        ],
      ]
    : isEval
    ? [
        [
          { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 12 } },
          { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 42 } },
          { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 60 } },
          { content: "Bidder's Offered Specification", styles: { halign: 'left' as const, cellWidth: 40 } },
          { content: 'Compliance', styles: { halign: 'center' as const, cellWidth: 28 } },
        ],
      ]
    : [
        [
          { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 14 } },
          { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 48 } },
          { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 76 } },
          { content: "Bidder's Offered Specification", styles: { halign: 'left' as const, cellWidth: 44 } },
        ],
      ];

  return { head, body: tableBody };
}

function drawSpecificationTable(doc: Doc, content: SpecContent, stage: DocumentStage, y: number): number {
  const { head, body } = buildSpecificationTable(content, stage);

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: stage === 'inspected' ? [22, 101, 52] : [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: BOTTOM_MARGIN },
  });

  return (doc as any).lastAutoTable.finalY + 7;
}

/** Section 3: Functional Testing (inspection only). */
function drawFunctionalTesting(doc: Doc, tests: FunctionalTestRow[], y: number): number {
  y = drawSectionHeading(doc, '3. Functional Testing', y, [22, 101, 52]);

  const body = tests.map((t, i) => [
    String(i + 1),
    t.test || '',
    t.result || 'Pending',
    t.remarks || '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 12 } },
        { content: 'Functional Test', styles: { halign: 'left' as const, cellWidth: 78 } },
        { content: 'Result', styles: { halign: 'center' as const, cellWidth: 28 } },
        { content: 'Remarks', styles: { halign: 'left' as const, cellWidth: 64 } },
      ],
    ],
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [22, 101, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: BOTTOM_MARGIN },
  });

  return (doc as any).lastAutoTable.finalY + 7;
}

/** Section 4: Conclusion (inspection only). */
function drawConclusion(doc: Doc, content: SpecContent, y: number): number {
  const details = content.inspectionDetails;
  const conclusion = details?.overallConclusion || 'Accepted';
  const accepted = isAcceptedConclusion(conclusion);
  const text =
    details?.conclusionText?.trim() ||
    buildConclusionText(conclusion, details, content);

  const w = pageWidth(doc);
  const innerWidth = w - PAGE_MARGIN * 2 - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  const lines = doc.splitTextToSize(text, innerWidth);
  const boxHeight = 14 + lines.length * 4.3;

  y = ensureSpace(doc, y, boxHeight + 16);
  y = drawSectionHeading(doc, '4. Conclusion', y, [22, 101, 52]);

  doc.setFillColor(accepted ? 240 : 254, accepted ? 253 : 242, accepted ? 244 : 242);
  doc.setDrawColor(accepted ? 187 : 252, accepted ? 247 : 165, accepted ? 208 : 165);
  doc.roundedRect(PAGE_MARGIN, y, w - PAGE_MARGIN * 2, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accepted ? 22 : 185, accepted ? 101 : 28, accepted ? 52 : 28);
  doc.text(`Inspection Decision: ${conclusion.toUpperCase()}`, PAGE_MARGIN + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);
  doc.text(lines, PAGE_MARGIN + 4, y + 12);

  return y + boxHeight + 8;
}

function getImageFormat(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/** Section 5: Photographs, always placed on the last page(s). */
function drawPhotographs(doc: Doc, photos: InspectionPhoto[]): void {
  if (!photos.length) return;

  const w = pageWidth(doc);
  const h = pageHeight(doc);
  const cols = 2;
  const rowsPerPage = 3;
  const gap = 6;
  const cellW = (w - PAGE_MARGIN * 2 - gap) / cols;

  let index = 0;
  let pageIndex = 0;

  while (index < photos.length) {
    doc.addPage();
    pageIndex += 1;
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text(pageIndex === 1 ? '5. Photographs' : '5. Photographs (continued)', PAGE_MARGIN, y);
    y += 5;
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.4);
    doc.line(PAGE_MARGIN, y, w - PAGE_MARGIN, y);
    y += 6;

    const availableH = h - y - BOTTOM_MARGIN - 6;
    const cellH = availableH / rowsPerPage;
    const imageMaxH = cellH - 12;

    for (let r = 0; r < rowsPerPage && index < photos.length; r += 1) {
      for (let c = 0; c < cols && index < photos.length; c += 1) {
        const photo = photos[index];
        const x = PAGE_MARGIN + c * (cellW + gap);
        const cellY = y + r * cellH;

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, cellY, cellW, cellH - 2, 1.5, 1.5, 'S');

        // Fit the image inside the cell while preserving its aspect ratio.
        const ratio = photo.width && photo.height ? photo.width / photo.height : 4 / 3;
        let imgW = cellW - 6;
        let imgH = imgW / ratio;
        if (imgH > imageMaxH) {
          imgH = imageMaxH;
          imgW = imgH * ratio;
        }
        const imgX = x + (cellW - imgW) / 2;
        const imgY = cellY + 3 + (imageMaxH - imgH) / 2;

        try {
          doc.addImage(photo.dataUrl, getImageFormat(photo.dataUrl), imgX, imgY, imgW, imgH);
        } catch {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text('Image could not be embedded', x + cellW / 2, cellY + cellH / 2, { align: 'center' });
        }

        if (photo.caption?.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          const caption = doc.splitTextToSize(photo.caption.trim(), cellW - 6);
          doc.text(caption.slice(0, 2), x + cellW / 2, cellY + cellH - 6, { align: 'center' });
        }

        index += 1;
      }
    }
  }
}

function drawSignatures(doc: Doc, content: SpecContent, y: number): void {
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  if (y + 40 > h - 18) {
    doc.addPage();
    y = 26;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  const col1X = PAGE_MARGIN + 6;
  doc.line(col1X, y + 14, col1X + 54, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Prepared By:', col1X, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(content.preparedBy || 'Er. Saroj Chalise', col1X, y + 22);
  doc.text(content.designation || 'Mechanical Engineer', col1X, y + 26);
  if (content.nec) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(content.nec, col1X, y + 30);
  }

  const col2X = w - PAGE_MARGIN - 60;
  doc.line(col2X, y + 14, col2X + 54, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Approved By:', col2X, y + 18);
}

/** Adds a professional footer with page numbers to every page. */
function drawPageFooters(doc: Doc, content: SpecContent): void {
  const total = doc.getNumberOfPages();
  const w = pageWidth(doc);
  const h = pageHeight(doc);
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, h - 12, w - PAGE_MARGIN, h - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${content.organizationName || ''}${content.organizationName ? ' — ' : ''}${getStageTitle(
        resolveStage(content.stage, content)
      )}`,
      PAGE_MARGIN,
      h - 7
    );
    doc.text(`Page ${i} of ${total}`, w - PAGE_MARGIN, h - 7, { align: 'right' });
  }
}

export function generateSpecificationPDF(
  record: WorkRecord | { content: SpecContent; document_name?: string; stage?: string },
  options: GeneratePDFOptions = {}
): void {
  const content = record.content;
  const stage = resolveStage(
    (options.isInspection ? 'inspected' : options.isEvaluation ? 'evaluated' : record.stage) as
      | DocumentStage
      | undefined,
    content
  );
  const isInspect = stage === 'inspected';
  const isEval = stage === 'evaluated';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let y = drawDocumentHeader(doc, content, stage, 20);

  if (isInspect) {
    // 1. General Details of Inspection
    y = drawGeneralDetails(doc, content, y);

    // 2. Compliance to the specifications
    y = drawSectionHeading(doc, '2. Compliance to the Specifications', y, [22, 101, 52]);
    y = drawSpecificationTable(doc, content, stage, y);

    // 3. Functional Testing
    const tests =
      content.inspectionDetails?.functionalTests?.length
        ? content.inspectionDetails.functionalTests
        : [];
    if (tests.length > 0) {
      y = drawFunctionalTesting(doc, tests, y);
    }

    // 4. Conclusion
    y = drawConclusion(doc, content, y);

    // Signatures before the photograph page so photos remain the last page.
    drawSignatures(doc, content, y);

    // 5. Photographs (always the last page)
    drawPhotographs(doc, content.inspectionDetails?.photos || []);
  } else {
    y = drawSpecificationTable(doc, content, stage, y);
    drawSignatures(doc, content, y);
  }

  drawPageFooters(doc, content);

  const safeFilename = (
    ('document_name' in record && record.document_name) ||
    content.documentTitle ||
    getStageTitle(stage)
  )
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 60);

  doc.save(`${safeFilename}.pdf`);
}

/**
 * Generates a clean 1-page Cost Estimate PDF document.
 */
export function generateCostEstimatePDF(estimate: CostEstimateData, filename?: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const w = pageWidth(doc);
  const h = pageHeight(doc);
  let currentY = 16;

  // 1. Name of Office
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73);
  doc.text((estimate.organizationName || 'OFFICIAL PROCURING ENTITY').toUpperCase(), w / 2, currentY, {
    align: 'center',
  });
  currentY += 5.5;

  // 2. Sub division
  if (estimate.subDivision?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(estimate.subDivision.trim(), w / 2, currentY, { align: 'center' });
    currentY += 4.2;
  }

  // 3. Office location
  if (estimate.officeLocation?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);
    doc.text(estimate.officeLocation.trim(), w / 2, currentY, { align: 'center' });
    currentY += 4.2;
  }

  // 4. Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text((estimate.documentTitle || 'COST ESTIMATES').toUpperCase(), w / 2, currentY, { align: 'center' });
  currentY += 4.8;

  // 5. Project name & fiscal year
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(51, 65, 85);
  doc.text(`Project Name: ${estimate.projectName?.trim() || '—'}`, w / 2, currentY, { align: 'center' });
  currentY += 4;
  doc.text(`Fiscal Year: ${estimate.fiscalYear || '2083/84'}`, w / 2, currentY, { align: 'center' });
  currentY += 4;

  // 6. User-defined additional header lines
  if (estimate.headerLines && estimate.headerLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    estimate.headerLines.forEach((line) => {
      if (line && line.trim()) {
        doc.text(line.trim(), w / 2, currentY, { align: 'center' });
        currentY += 3.8;
      }
    });
  }

  // Thin separator rule
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, currentY, w - PAGE_MARGIN, currentY);
  currentY += 5;

  // Table
  const head = [
    [
      { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 10 } },
      { content: 'Particulars', styles: { halign: 'left' as const, cellWidth: 68 } },
      { content: 'Qty', styles: { halign: 'center' as const, cellWidth: 12 } },
      { content: 'Unit', styles: { halign: 'center' as const, cellWidth: 16 } },
      { content: 'Rate (NPR)', styles: { halign: 'right' as const, cellWidth: 24 } },
      { content: 'Amount (NPR)', styles: { halign: 'right' as const, cellWidth: 26 } },
      { content: 'Remarks', styles: { halign: 'left' as const, cellWidth: 26 } },
    ],
  ];

  const body: any[] = estimate.items.map((item, idx) => {
    const remarks = item.isVatApplicable === false ? 'Non VATTABLE as per the prevailing laws' : '';
    return [
      item.sn || String(idx + 1),
      item.particulars || '',
      String(item.qty || 1),
      item.unit || 'Number',
      Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      Number(item.amount || item.qty * item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      remarks,
    ];
  });

  const nonVattableItems = estimate.items.filter((it) => it.isVatApplicable === false);
  const hasNonVattable = nonVattableItems.length > 0;
  const subTotal = estimate.items.reduce((sum, it) => sum + (it.amount || it.qty * it.rate), 0);
  const taxableAmount = estimate.items.reduce(
    (sum, it) => sum + (it.isVatApplicable !== false ? it.amount || it.qty * it.rate : 0),
    0
  );
  const vatAmount = Math.round(taxableAmount * 0.13 * 100) / 100;
  const grandTotal = Math.round((subTotal + vatAmount) * 100) / 100;

  if (!hasNonVattable) {
    body.push([
      {
        content: 'SUB-TOTAL (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [248, 250, 252] },
      },
      {
        content: subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [248, 250, 252] },
      },
      { content: '', styles: { fillColor: [248, 250, 252] } },
    ]);

    body.push([
      {
        content: 'VAT 13% (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [240, 253, 244] },
      },
      {
        content: vatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: {
          halign: 'right' as const,
          fontStyle: 'bold',
          fillColor: [240, 253, 244],
          textColor: [22, 101, 52],
        },
      },
      { content: '', styles: { fillColor: [240, 253, 244] } },
    ]);

    body.push([
      {
        content: 'GRAND TOTAL (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: {
          halign: 'right' as const,
          fontStyle: 'bold',
          fillColor: [241, 245, 249],
          textColor: [22, 101, 52],
        },
      },
      {
        content: 'NPR',
        styles: {
          halign: 'center' as const,
          fillColor: [241, 245, 249],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
      },
    ]);
  } else {
    body.push([
      {
        content: 'SUB-TOTAL (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [248, 250, 252] },
      },
      {
        content: subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [248, 250, 252] },
      },
      { content: '', styles: { fillColor: [248, 250, 252] } },
    ]);

    body.push([
      {
        content: 'TAXABLE AMOUNT (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'normal', fillColor: [255, 255, 255] },
      },
      {
        content: taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: { halign: 'right' as const, fillColor: [255, 255, 255] },
      },
      { content: '', styles: { fillColor: [255, 255, 255] } },
    ]);

    body.push([
      {
        content: 'VAT 13% (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [240, 253, 244] },
      },
      {
        content: vatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: {
          halign: 'right' as const,
          fontStyle: 'bold',
          fillColor: [240, 253, 244],
          textColor: [22, 101, 52],
        },
      },
      {
        content: '13% on Taxable',
        styles: {
          halign: 'center' as const,
          fillColor: [240, 253, 244],
          fontSize: 6.5,
          textColor: [22, 101, 52],
        },
      },
    ]);

    body.push([
      {
        content: 'GRAND TOTAL (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: {
          halign: 'right' as const,
          fontStyle: 'bold',
          fillColor: [241, 245, 249],
          textColor: [22, 101, 52],
        },
      },
      {
        content: 'NPR',
        styles: {
          halign: 'center' as const,
          fillColor: [241, 245, 249],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
      },
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head,
    body,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: BOTTOM_MARGIN },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('In Words:', PAGE_MARGIN, finalY);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text(numberToWordsNPR(grandTotal), PAGE_MARGIN + 16, finalY);

  let sigY = finalY + 12;
  if (sigY + 36 > h - 14) {
    sigY = h - 38;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  const col1X = PAGE_MARGIN + 6;
  doc.line(col1X, sigY + 12, col1X + 54, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Prepared By:', col1X, sigY + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(estimate.preparedBy || 'Er. Saroj Chalise', col1X, sigY + 20);
  doc.text(estimate.designation || 'Mechanical Engineer', col1X, sigY + 24);
  if (estimate.nec) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(estimate.nec, col1X, sigY + 28);
  }

  const col2X = w - PAGE_MARGIN - 60;
  doc.line(col2X, sigY + 12, col2X + 54, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Approved By:', col2X, sigY + 16);

  const safeName = (filename || `${estimate.organizationName}_Cost_Estimate`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 60);

  doc.save(`${safeName}.pdf`);
}
