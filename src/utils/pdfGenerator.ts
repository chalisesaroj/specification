import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkRecord, SpecContent, CostEstimateData } from '../types/spec';
import { numberToWordsNPR } from './numberToWords';

export interface GeneratePDFOptions {
  isEvaluation?: boolean;
  isInspection?: boolean;
}

export function generateSpecificationPDF(
  record: WorkRecord | { content: SpecContent; document_name?: string; stage?: string },
  options: GeneratePDFOptions = {}
): void {
  const content = record.content;
  const isInspect = options.isInspection ?? (record.stage === 'inspected' || content.stage === 'inspected' || Boolean(content.inspectionDetails?.chassisNo));
  const isEval = !isInspect && (options.isEvaluation ?? (record.stage === 'evaluated' || content.stage === 'evaluated' || Boolean(content.tenderNo || content.make || content.model)));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 16;

  // Header styling
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73); // Deep slate navy
  doc.text((content.organizationName || 'OFFICIAL TECHNICAL SPECIFICATION').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  if (isEval) {
    // User requirement: In Evaluation header put second row as "Technical Evaluation of Bid"
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138); // Deep Navy/Blue
    doc.text('Technical Evaluation of Bid', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;

    // Third row: Vehicle Specification Title
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const subTitle = (content.documentTitle || content.vehicleCategory || 'Technical Specification').toUpperCase();
    doc.text(subTitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
  } else if (isInspect) {
    doc.setFontSize(10.5);
    doc.setTextColor(22, 101, 52);
    const titleText = `VEHICLE TECHNICAL INSPECTION & DELIVERY REPORT: ${(content.vehicleCategory || 'AUTOMOBILE').toUpperCase()}`;
    doc.text(titleText, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
  } else {
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    const titleText = (content.documentTitle || 'Automobile Technical Specification').toUpperCase();
    doc.text(titleText, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4.5;
  }

  // Subtitle line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const subInfoParts = [
    content.fiscalYear ? `Fiscal Year: ${content.fiscalYear}` : '',
    (isEval || isInspect) && content.tenderNo ? `Ref/Tender No: ${content.tenderNo}` : '',
    `Category: ${content.vehicleCategory || 'Automobile'}`
  ].filter(Boolean);

  doc.text(subInfoParts.join('  |  '), pageWidth / 2, currentY, { align: 'center' });
  currentY += 3.5;

  // Optional Make, Model, Origin info line (only shown during Evaluation or Inspection mode)
  if (isEval || isInspect) {
    const vehicleMeta = [
      content.make ? `Make: ${content.make}` : '',
      content.model ? `Model: ${content.model}` : '',
      content.countryOfOrigin ? `Origin: ${content.countryOfOrigin}` : ''
    ].filter(Boolean).join('  |  ');

    if (vehicleMeta) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(vehicleMeta, pageWidth / 2, currentY, { align: 'center' });
      currentY += 3.5;
    }
  }

  // Bidder identification line
  if (isEval && content.bidderName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138); // Deep blue
    doc.text(`Bidder / Supplying Firm: ${content.bidderName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
  } else if (isInspect) {
    const winBidder = content.inspectionDetails?.selectedBidderName || content.bidderName;
    if (winBidder) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52); // Deep forest green
      doc.text(`Selected Winning Bidder: ${winBidder}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 3.5;
    }
  }

  // Dynamic Custom Header Rows
  if (content.customHeaderRows && content.customHeaderRows.length > 0) {
    const validHeaders = content.customHeaderRows.filter((r) => r.label && r.value);
    if (validHeaders.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const customText = validHeaders.map((r) => `${r.label}: ${r.value}`).join('   |   ');
      doc.text(customText, pageWidth / 2, currentY, { align: 'center' });
      currentY += 3.5;
    }
  }

  // Thin separator rule
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  // Physical Inspection Identification box (only in Inspection mode)
  if (isInspect && content.inspectionDetails) {
    const insp = content.inspectionDetails;
    const boxHeight = (insp.selectedBidderName || content.bidderName) ? 17 : 14;
    doc.setFillColor(240, 253, 244); // light green background
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(14, currentY, pageWidth - 28, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('Physical Identification & Delivery Verification:', 17, currentY + 4.5);

    let offset = 8.5;
    const winBidder = insp.selectedBidderName || content.bidderName;
    if (winBidder) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(22, 101, 52);
      doc.text(`Winning Bidder / Supplier: ${winBidder}`, 17, currentY + offset);
      offset += 3.5;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const line1 = [
      insp.chassisNo ? `Chassis / VIN: ${insp.chassisNo}` : '',
      insp.engineNo ? `Engine No: ${insp.engineNo}` : '',
      insp.color ? `Color: ${insp.color}` : '',
      insp.manufacturingYear ? `Mfg: ${insp.manufacturingYear}` : ''
    ].filter(Boolean).join('  |  ');
    doc.text(line1, 17, currentY + offset);

    const line2 = [
      insp.odometerReading ? `Odometer: ${insp.odometerReading}` : '',
      insp.batteryDetails ? `Battery: ${insp.batteryDetails}` : '',
      insp.tyreDetails ? `Tyres: ${insp.tyreDetails}` : '',
      `Status: ${insp.overallConclusion || 'Accepted'}`
    ].filter(Boolean).join('  |  ');
    doc.text(line2, 17, currentY + offset + 3.5);

    currentY += boxHeight + 4;
  }

  // Build table rows with clean S.N. points as 1, 2, 3...
  const tableBody: any[] = [];
  let globalRowCounter = 1;

  const cleanSN = (itemNum: string | undefined): string => {
    if (!itemNum) return String(globalRowCounter++);
    const match = itemNum.match(/^\d+\.(\d+)$/);
    if (match) return match[1];
    return itemNum;
  };

  // Ensure Vehicle Scope and Delivery Destination are in the table if not already present
  const allRowsFlat: { parameter: string; requirement: string }[] = [];
  content.sections.forEach((sec) => sec.rows.forEach((r) => allRowsFlat.push(r)));

  const hasScopeInTable = allRowsFlat.some(
    (r) => r.parameter.toLowerCase().includes('scope') || r.parameter.toLowerCase().includes('general')
  );
  const hasDeliveryInTable = allRowsFlat.some(
    (r) => r.parameter.toLowerCase().includes('delivery')
  );

  // If missing from sections, dynamically include them in the first section of the table
  const initialExtraRows: any[] = [];
  if (!hasScopeInTable && content.vehicleDescription) {
    initialExtraRows.push({
      itemNumber: cleanSN(undefined),
      parameter: 'Vehicle Scope & General Description',
      requirement: content.vehicleDescription,
      offeredSpecification: isInspect ? 'Verified as per spec' : '',
      inspectionResult: 'Accepted',
      remarks: '',
    });
  }
  if (!hasDeliveryInTable && content.deliveryPlace) {
    initialExtraRows.push({
      itemNumber: cleanSN(undefined),
      parameter: 'Delivery Destination',
      requirement: content.deliveryPlace,
      offeredSpecification: isInspect ? 'Delivered at site' : '',
      inspectionResult: 'Accepted',
      remarks: '',
    });
  }

  content.sections.forEach((section, sIdx) => {
    // Only add section span if multiple sections exist
    if (content.sections.length > 1) {
      tableBody.push([
        {
          content: section.title.toUpperCase(),
          colSpan: (isEval || isInspect) ? 5 : 4,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'left',
            cellPadding: 2.5,
          },
        },
      ]);
    }

    if (sIdx === 0 && initialExtraRows.length > 0) {
      initialExtraRows.forEach((extraRow) => {
        if (isInspect) {
          tableBody.push([
            extraRow.itemNumber,
            extraRow.parameter,
            extraRow.requirement,
            extraRow.offeredSpecification,
            extraRow.inspectionResult,
          ]);
        } else if (isEval) {
          tableBody.push([
            extraRow.itemNumber,
            extraRow.parameter,
            extraRow.requirement,
            extraRow.offeredSpecification,
            'Complied',
          ]);
        } else {
          tableBody.push([
            extraRow.itemNumber,
            extraRow.parameter,
            extraRow.requirement,
            extraRow.offeredSpecification,
          ]);
        }
      });
    }

    section.rows.forEach((row) => {
      const sn = cleanSN(row.itemNumber);
      if (isInspect) {
        tableBody.push([
          sn,
          row.parameter || '',
          row.requirement || '',
          row.inspectedValue || row.offeredSpecification || 'Verified as per spec',
          row.inspectionResult || 'Accepted',
        ]);
      } else if (isEval) {
        tableBody.push([
          sn,
          row.parameter || '',
          row.requirement || '',
          row.offeredSpecification || '',
          row.remarks || (row.compliance ? `[${row.compliance}]` : ''),
        ]);
      } else {
        // In specification creation mode: NO Compliance column!
        tableBody.push([
          sn,
          row.parameter || '',
          row.requirement || '',
          row.offeredSpecification || '',
        ]);
      }
    });
  });

  const inspectHeaders = [
    [
      { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 12 } },
      { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 42 } },
      { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 58 } },
      { content: 'Inspected / Delivered Specification', styles: { halign: 'left' as const, cellWidth: 42 } },
      { content: 'Inspection Result', styles: { halign: 'center' as const, cellWidth: 28 } },
    ],
  ];

  const evalHeaders = [
    [
      { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 12 } },
      { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 42 } },
      { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 60 } },
      { content: "Bidder's Offered Specification", styles: { halign: 'left' as const, cellWidth: 40 } },
      { content: 'Compliance', styles: { halign: 'center' as const, cellWidth: 28 } },
    ],
  ];

  const specHeaders = [
    [
      { content: 'S.N.', styles: { halign: 'center' as const, cellWidth: 14 } },
      { content: 'Criteria / Parameter', styles: { halign: 'left' as const, cellWidth: 48 } },
      { content: "Purchaser's Technical Requirement", styles: { halign: 'left' as const, cellWidth: 76 } },
      { content: "Bidder's Offered Specification", styles: { halign: 'left' as const, cellWidth: 44 } },
    ],
  ];

  const tableHeaders = isInspect ? inspectHeaders : isEval ? evalHeaders : specHeaders;

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // Check if we need a new page for signatures
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  let sigY = finalY;

  if (sigY + 36 > pageHeight - 16) {
    doc.addPage();
    sigY = 24;
  }

  // Signature Block (2 columns: Prepared By & Approved By)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  // Col 1: Prepared By
  const col1X = 20;
  doc.line(col1X, sigY + 14, col1X + 54, sigY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Prepared By:', col1X, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(content.preparedBy || 'Er. Saroj Chalise', col1X, sigY + 22);
  doc.text(content.designation || 'Mechanical Engineer / Automobile Instructor', col1X, sigY + 26);
  if (content.nec) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(content.nec, col1X, sigY + 30);
  }

  // Col 2: Approved By (Only "Approved By:" as requested)
  const col2X = pageWidth - 74;
  doc.line(col2X, sigY + 14, col2X + 54, sigY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Approved By:', col2X, sigY + 18);

  // Save PDF
  const safeFilename = (
    ('document_name' in record && record.document_name) ||
    content.documentTitle ||
    'Technical_Specification'
  )
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  doc.save(`${safeFilename}.pdf`);
}

/**
 * Generates a clean 1-page Cost Estimate PDF document
 * Matching headers (where Technical Specification is replaced by Cost Estimates),
 * customizable header lines, S.N, Particulars, Qty, Unit, Rate, Amount, Remarks table,
 * and Prepared By / Approved By with underline signature footer.
 */
export function generateCostEstimatePDF(
  estimate: CostEstimateData,
  filename?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 16;

  // 1. Organization Name (First line of the header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(24, 43, 73); // Deep slate navy
  doc.text((estimate.organizationName || 'OFFICIAL PROCURING ENTITY').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5.5;

  // 2. Provision to add few line in header row where user can write anything (after first line of header)
  if (estimate.headerLines && estimate.headerLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    estimate.headerLines.forEach((line) => {
      if (line && line.trim()) {
        doc.text(line.trim(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 4;
      }
    });
  }

  // 3. Document Title: "COST ESTIMATES" (Replacing Technical Specification)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text((estimate.documentTitle || 'COST ESTIMATES').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // 4. Subtitle line: Fiscal Year, Category, Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const subInfo = [
    estimate.fiscalYear ? `Fiscal Year: ${estimate.fiscalYear}` : '',
    `Category: ${estimate.vehicleCategory || 'Automobile'}`,
    estimate.updated_at ? `Date: ${estimate.updated_at.slice(0, 10)}` : '',
  ].filter(Boolean).join('   |   ');
  if (subInfo) {
    doc.text(subInfo, pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
  }

  // Thin separator rule
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  // 5. Table with columns: S.N, Particulars, Qty, Unit, Rate, Amount, Remarks
  // User Rule: Only non-vattable items are written as "Non VATTABLE as per the prevailing laws" in Remarks. Vattable items have no remarks.
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
    const remarks = item.isVatApplicable === false 
      ? 'Non VATTABLE as per the prevailing laws' 
      : '';
    return [
      item.sn || String(idx + 1),
      item.particulars || '',
      String(item.qty || 1),
      item.unit || 'Number',
      Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      Number(item.amount || (item.qty * item.rate) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      remarks,
    ];
  });

  // Calculations for VAT and Totals
  const nonVattableItems = estimate.items.filter((it) => it.isVatApplicable === false);
  const hasNonVattable = nonVattableItems.length > 0;
  const subTotal = estimate.items.reduce((sum, it) => sum + (it.amount || (it.qty * it.rate)), 0);
  const taxableAmount = estimate.items.reduce((sum, it) => sum + (it.isVatApplicable !== false ? (it.amount || (it.qty * it.rate)) : 0), 0);
  const vatAmount = Math.round(taxableAmount * 0.13 * 100) / 100;
  const grandTotal = Math.round((subTotal + vatAmount) * 100) / 100;

  if (!hasNonVattable) {
    // If no any non vattable items: just sum sub total, calculate vat, and add to sub total to get grand total
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
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] },
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
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [22, 101, 52] },
      },
      { content: 'NPR', styles: { halign: 'center' as const, fillColor: [241, 245, 249], fontStyle: 'bold', fontSize: 7.5 } },
    ]);
  } else {
    // Otherwise: Sub-total is sum of all total, taxable amount is sum of all VAT applicable amount,
    // VAT is 13 % on taxable amount and grand total is sub total plus VAT.
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
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [22, 101, 52] },
      },
      { content: '13% on Taxable', styles: { halign: 'center' as const, fillColor: [240, 253, 244], fontSize: 6.5, textColor: [22, 101, 52] } },
    ]);

    body.push([
      {
        content: 'GRAND TOTAL (NPR):',
        colSpan: 5,
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [241, 245, 249] },
      },
      {
        content: grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        styles: { halign: 'right' as const, fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [22, 101, 52] },
      },
      { content: 'NPR', styles: { halign: 'center' as const, fillColor: [241, 245, 249], fontStyle: 'bold', fontSize: 7.5 } },
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
      fillColor: [30, 58, 138], // Navy header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;
  
  // In Words Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('In Words:', 14, finalY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const wordsText = numberToWordsNPR(grandTotal);
  doc.text(wordsText, 30, finalY);

  let sigY = finalY + 12;

  // Single page guarantee: keep footer within page
  if (sigY + 36 > pageHeight - 14) {
    sigY = pageHeight - 38;
  }

  // Signature Block: Prepared By & Approved By with underline
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  // Col 1: Prepared By
  const col1X = 20;
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

  // Col 2: Approved By (with underline signature line)
  const col2X = pageWidth - 74;
  doc.line(col2X, sigY + 12, col2X + 54, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Approved By:', col2X, sigY + 16);

  const safeName = (filename || `${estimate.organizationName}_Cost_Estimate`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  doc.save(`${safeName}.pdf`);
}
