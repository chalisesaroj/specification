import React from 'react';
import {
  X,
  Download,
  Printer,
  Edit3,
  FileText,
  Trash2,
  Calculator,
  Camera,
} from 'lucide-react';
import {
  WorkRecord,
  StandardSpecification,
  SpecContent,
  SpecRow,
  DocumentStage,
} from '../types/spec';
import { generateSpecificationPDF } from '../utils/pdfGenerator';
import {
  getStageTitle,
  resolveStage,
  getGeneralInspectionRows,
  buildConclusionText,
  isAcceptedConclusion,
} from '../utils/documentMeta';

interface DocumentViewerProps {
  document: WorkRecord | StandardSpecification;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCostEstimate?: () => void;
}

function complianceOf(row: SpecRow): string {
  if (row.compliance) return row.compliance;
  switch (row.inspectionResult) {
    case 'Rejected':
      return 'Not Complied';
    case 'Conditional':
      return 'Partial';
    case 'Pending':
      return 'Pending';
    default:
      return 'Complied';
  }
}

const complianceClass = (value: string) =>
  value === 'Complied'
    ? 'bg-emerald-100 text-emerald-800'
    : value === 'Not Complied'
    ? 'bg-red-100 text-red-800'
    : value === 'Partial'
    ? 'bg-amber-100 text-amber-800'
    : 'bg-slate-100 text-slate-700';

const resultClass = (value: string) =>
  value === 'Passed'
    ? 'bg-emerald-100 text-emerald-800'
    : value === 'Failed'
    ? 'bg-red-100 text-red-800'
    : 'bg-amber-100 text-amber-800';

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onEdit,
  onDelete,
  onCostEstimate,
}) => {
  const isWorkRecord = 'document_name' in document;
  const content: SpecContent = document.content;
  const stage: DocumentStage = resolveStage(
    isWorkRecord ? (document as WorkRecord).stage : undefined,
    content
  );
  const isInspection = stage === 'inspected';
  const isEvaluation = stage === 'evaluated';
  const details = content.inspectionDetails;
  const photos = details?.photos || [];
  const functionalTests = details?.functionalTests || [];
  const conclusion = details?.overallConclusion || 'Accepted';
  const accepted = isAcceptedConclusion(conclusion);
  const conclusionText =
    details?.conclusionText?.trim() || buildConclusionText(conclusion, details, content);
  const generalRows = getGeneralInspectionRows(content).filter(
    (r) => r.label?.trim() || r.value?.trim()
  );
  const totalSpecs = content.sections.reduce((acc, s) => acc + s.rows.length, 0);

  const handlePrint = () => {
    window.print();
  };

  const cleanSN = (itemNum: string | undefined, fallback: number): string => {
    if (!itemNum) return String(fallback);
    const match = itemNum.match(/^\d+\.(\d+)$/);
    if (match) return match[1];
    return itemNum;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:my-0">
        {/* Viewer Header / Toolbar (Hidden on print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-blue-600 rounded text-white">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold truncate max-w-md">
                {isWorkRecord ? (document as WorkRecord).document_name : document.title}
              </h2>
              <p className="text-[10px] text-slate-300">
                {isWorkRecord
                  ? 'Permanent Work Record Snapshot'
                  : `Standard Baseline v${(document as StandardSpecification).version}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isWorkRecord && onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                title="Delete this record from database to reduce memory consumption"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {isWorkRecord && onCostEstimate && (
              <button
                onClick={onCostEstimate}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors shadow-xs"
                title="Create or View Cost Estimate"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Cost Estimate</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={() => generateSpecificationPDF(document as any)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Print friendly paper style) */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white space-y-6 print:overflow-visible">
          {/* Official Document Header */}
          <div className="text-center border-b-2 border-slate-800 pb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {content.organizationName || 'NAME OF OFFICE'}
            </h1>
            {content.subDivision?.trim() && (
              <p className="text-sm sm:text-base font-semibold text-slate-800 mt-0.5">
                {content.subDivision}
              </p>
            )}
            {content.officeLocation?.trim() && (
              <p className="text-xs sm:text-sm text-slate-600">{content.officeLocation}</p>
            )}

            <h2
              className={`text-sm sm:text-lg font-bold uppercase mt-2 tracking-wide ${
                isInspection
                  ? 'text-emerald-800'
                  : isEvaluation
                  ? 'text-indigo-900'
                  : 'text-slate-800'
              }`}
            >
              {getStageTitle(stage)}
            </h2>

            <div className="mt-2 text-xs text-slate-700 space-y-0.5">
              <p>
                <span className="font-semibold">Project Name:</span>{' '}
                {content.projectName?.trim() || '—'}
              </p>
              <p>
                <span className="font-semibold">Fiscal Year:</span>{' '}
                {content.fiscalYear || '2083/84'}
              </p>
              {(isEvaluation || isInspection) && (
                <>
                  <p>
                    <span className="font-semibold">Bidder Name:</span>{' '}
                    {details?.selectedBidderName || content.bidderName || '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Reference Tender Name:</span>{' '}
                    {content.tenderNo || '—'}
                  </p>
                </>
              )}
            </div>

            {/* Custom Header Rows if present */}
            {content.customHeaderRows && content.customHeaderRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                {content.customHeaderRows
                  .filter((r) => r.label && r.value)
                  .map((r) => (
                    <span key={r.id} className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      <span className="font-semibold text-slate-700">{r.label}:</span>{' '}
                      <strong className="text-slate-900">{r.value}</strong>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* 1. General Details of Inspection */}
          {isInspection && (
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-emerald-900 border-b-2 border-emerald-700 pb-1">
                1. General Details of Inspection
              </h2>
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <tbody>
                  {Array.from({ length: Math.ceil(generalRows.length / 2) }).map((_, rIdx) => {
                    const left = generalRows[rIdx * 2];
                    const right = generalRows[rIdx * 2 + 1];
                    return (
                      <tr key={rIdx}>
                        <td className="py-1.5 px-2 border border-slate-200 bg-emerald-50/60 font-semibold text-emerald-900 w-1/5">
                          {left?.label || ''}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-200 text-slate-800 w-1/3">
                          {left?.value || '—'}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-200 bg-emerald-50/60 font-semibold text-emerald-900 w-1/5">
                          {right?.label || ''}
                        </td>
                        <td className="py-1.5 px-2 border border-slate-200 text-slate-800">
                          {right ? right.value || '—' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Compliance to the Specifications */}
          <div className="space-y-2">
            {isInspection && (
              <h2 className="text-base sm:text-lg font-bold text-emerald-900 border-b-2 border-emerald-700 pb-1">
                2. Compliance to the Specifications
              </h2>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr
                    className={`font-bold text-white ${
                      isInspection ? 'bg-emerald-800' : 'bg-slate-900'
                    }`}
                  >
                    <th className="py-2.5 px-3 border border-slate-700 text-center w-14">S.N.</th>
                    <th
                      className={`py-2.5 px-3 border border-slate-700 text-left ${
                        isEvaluation || isInspection ? 'w-1/4' : 'w-1/3'
                      }`}
                    >
                      Criteria / Component
                    </th>
                    <th
                      className={`py-2.5 px-3 border border-slate-700 text-left ${
                        isEvaluation || isInspection ? 'w-1/3' : 'w-5/12'
                      }`}
                    >
                      Requirement as per Specification
                    </th>
                    <th
                      className={`py-2.5 px-3 border border-slate-700 text-left ${
                        isEvaluation || isInspection ? 'w-1/4' : 'w-1/3'
                      }`}
                    >
                      {isInspection
                        ? 'Delivered / Inspected Specification'
                        : "Bidder's Offered Specification"}
                    </th>
                    {(isEvaluation || isInspection) && (
                      <th className="py-2.5 px-3 border border-slate-700 text-center w-24">
                        Compliance
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {content.sections.map((section) => (
                    <React.Fragment key={section.id}>
                      {content.sections.length > 1 && (
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td
                            colSpan={isEvaluation || isInspection ? 5 : 4}
                            className="py-2 px-3 border border-slate-300"
                          >
                            {section.title.toUpperCase()}
                          </td>
                        </tr>
                      )}
                      {section.rows.map((row, rIdx) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 border border-slate-200 text-center font-mono font-medium text-slate-700">
                            {cleanSN(row.itemNumber, rIdx + 1)}
                          </td>
                          <td className="py-2 px-3 border border-slate-200 font-medium text-slate-900">
                            {row.parameter}
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-slate-700 leading-relaxed">
                            {row.requirement}
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-slate-600">
                            {isInspection
                              ? row.inspectedValue || row.offeredSpecification || '—'
                              : row.offeredSpecification || '—'}
                          </td>
                          {(isEvaluation || isInspection) && (
                            <td className="py-2 px-3 border border-slate-200 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${complianceClass(
                                  complianceOf(row)
                                )}`}
                              >
                                {complianceOf(row)}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Functional Testing */}
          {isInspection && functionalTests.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-emerald-900 border-b-2 border-emerald-700 pb-1">
                3. Functional Testing
              </h2>
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold">
                    <th className="py-2 px-2 border border-emerald-700 text-center w-12">S.N.</th>
                    <th className="py-2 px-3 border border-emerald-700 text-left">Functional Test</th>
                    <th className="py-2 px-2 border border-emerald-700 text-center w-28">Result</th>
                    <th className="py-2 px-3 border border-emerald-700 text-left w-1/4">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {functionalTests.map((test, idx) => (
                    <tr key={test.id}>
                      <td className="py-1.5 px-2 border border-slate-200 text-center font-mono text-slate-700">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-200 text-slate-800">{test.test}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${resultClass(
                            test.result || 'Pending'
                          )}`}
                        >
                          {test.result || 'Pending'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-200 text-slate-600">
                        {test.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Conclusion */}
          {isInspection && (
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-emerald-900 border-b-2 border-emerald-700 pb-1">
                4. Conclusion
              </h2>
              <div
                className={`p-3.5 rounded-lg border text-xs leading-relaxed space-y-1.5 ${
                  accepted
                    ? 'bg-emerald-50 border-emerald-200 text-slate-800'
                    : 'bg-red-50 border-red-200 text-slate-800'
                }`}
              >
                <p
                  className={`font-bold uppercase text-[11px] ${
                    accepted ? 'text-emerald-900' : 'text-red-900'
                  }`}
                >
                  Inspection Decision: {conclusion}
                </p>
                <p>{conclusionText}</p>
              </div>
            </div>
          )}

          {/* Official Signatures Block */}
          <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">
                {content.preparedBy || 'Er. Saroj Chalise'}
              </p>
              <p className="text-slate-600">
                {content.designation || 'Mechanical Engineer / Automobile Instructor'}
              </p>
              <p className="text-[10px] text-slate-500">
                {content.nec || 'NEC Reg. No.: 2016, Mechanical Category A'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">
                Prepared By
              </p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="text-xs text-slate-900 font-bold uppercase tracking-wider mt-2">
                Approved By
              </p>
            </div>
          </div>

          {/* 5. Photographs — always the last page of the report */}
          {isInspection && photos.length > 0 && (
            <div className="space-y-2 print-break-before">
              <h2 className="text-base sm:text-lg font-bold text-emerald-900 border-b-2 border-emerald-700 pb-1 flex items-center space-x-1.5">
                <Camera className="w-4 h-4" />
                <span>5. Photographs</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo, idx) => (
                  <figure key={photo.id} className="border border-slate-300 rounded p-2 bg-white">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption || `Photograph ${idx + 1}`}
                      className="w-full h-48 object-contain bg-slate-50"
                    />
                    <figcaption className="text-center text-[10px] text-slate-600 mt-1">
                      {photo.caption?.trim() || `Photograph ${idx + 1}`}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 rounded-b-2xl print:hidden">
          <span>
            Total: {totalSpecs} Criteria across {content.sections.length} Sections
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
