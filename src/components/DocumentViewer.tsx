import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Edit3, 
  Calendar, 
  Building2, 
  FileText,
  ShieldCheck,
  Trash2,
  Calculator
} from 'lucide-react';
import { WorkRecord, StandardSpecification, SpecContent } from '../types/spec';
import { generateSpecificationPDF } from '../utils/pdfGenerator';

interface DocumentViewerProps {
  document: WorkRecord | StandardSpecification;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCostEstimate?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onEdit,
  onDelete,
  onCostEstimate,
}) => {
  const isWorkRecord = 'document_name' in document;
  const content: SpecContent = document.content;
  const isInspection = (isWorkRecord && (document as WorkRecord).stage === 'inspected') || Boolean(content.inspectionDetails?.chassisNo);
  const isEvaluation = !isInspection && ((isWorkRecord && (document as WorkRecord).stage === 'evaluated') || Boolean(content.bidderName || content.tenderNo || content.make));
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
                {isWorkRecord ? 'Permanent Work Record Snapshot' : `Standard Baseline v${(document as StandardSpecification).version}`}
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
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white space-y-6">
          {/* Official Document Header */}
          <div className="text-center border-b-2 border-slate-800 pb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {content.organizationName || 'OFFICIAL PROCURING ENTITY'}
            </h1>

            {isEvaluation ? (
              <>
                <h2 className="text-base sm:text-lg font-bold text-indigo-900 mt-1 tracking-wide">
                  Technical Evaluation of Bid
                </h2>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase mt-0.5">
                  {content.documentTitle || content.vehicleCategory || 'TECHNICAL SPECIFICATION'}
                </h3>
              </>
            ) : isInspection ? (
              <>
                <h2 className="text-base sm:text-lg font-bold text-emerald-900 mt-1 tracking-wide">
                  Vehicle Technical Inspection & Delivery Report
                </h2>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 uppercase mt-0.5">
                  {content.documentTitle || content.vehicleCategory || 'TECHNICAL SPECIFICATION'}
                </h3>
              </>
            ) : (
              <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase mt-1 tracking-wide">
                {content.documentTitle || 'TECHNICAL SPECIFICATION'}
              </h2>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs font-medium text-slate-600">
              {content.fiscalYear && <span>Fiscal Year: <strong>{content.fiscalYear}</strong></span>}
              {content.tenderNo && <span>| Tender Ref: <strong>{content.tenderNo}</strong></span>}
              <span>| Vehicle Category: <strong>{content.vehicleCategory}</strong></span>
              {content.bidderName && (
                <span className="bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200 font-bold">
                  Bidder: {content.bidderName}
                </span>
              )}
              {content.make && <span>| Make: <strong>{content.make}</strong></span>}
              {content.model && <span>| Model: <strong>{content.model}</strong></span>}
              {content.countryOfOrigin && <span>| Origin: <strong>{content.countryOfOrigin}</strong></span>}
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

          {/* Physical Vehicle Inspection Details (If Inspected) */}
          {content.inspectionDetails && (content.stage === 'inspected' || content.inspectionDetails.chassisNo) && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs leading-relaxed space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-bold text-emerald-900 uppercase">Physical Vehicle Delivery Inspection</span>
                <span className="font-bold px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px]">
                  {content.inspectionDetails.overallConclusion || 'Accepted'}
                </span>
              </div>
              {(content.inspectionDetails.selectedBidderName || content.bidderName) && (
                <div className="bg-white p-2 rounded border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900">Selected Winning Bidder:</span>{' '}
                  <strong className="text-slate-900">{content.inspectionDetails.selectedBidderName || content.bidderName}</strong>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div><span className="font-semibold text-slate-500">Chassis / VIN:</span> <span className="font-mono font-bold text-slate-800">{content.inspectionDetails.chassisNo || '—'}</span></div>
                <div><span className="font-semibold text-slate-500">Engine No:</span> <span className="font-mono font-bold text-slate-800">{content.inspectionDetails.engineNo || '—'}</span></div>
                <div><span className="font-semibold text-slate-500">Color:</span> <span className="text-slate-800">{content.inspectionDetails.color || '—'}</span></div>
                <div><span className="font-semibold text-slate-500">Mfg Year:</span> <span className="text-slate-800">{content.inspectionDetails.manufacturingYear || '—'}</span></div>
                <div><span className="font-semibold text-slate-500">Odometer:</span> <span className="text-slate-800">{content.inspectionDetails.odometerReading || '—'}</span></div>
                <div><span className="font-semibold text-slate-500">Battery:</span> <span className="text-slate-800">{content.inspectionDetails.batteryDetails || '—'}</span></div>
                <div className="col-span-2"><span className="font-semibold text-slate-500">Tyres:</span> <span className="text-slate-800">{content.inspectionDetails.tyreDetails || '—'}</span></div>
              </div>
            </div>
          )}

          {/* Technical Specifications Table */}
          {(() => {
            const isInspect = Boolean(content.stage === 'inspected' || content.inspectionDetails?.chassisNo);
            const hasEval = !isInspect && Boolean(content.tenderNo || content.make || content.model || content.countryOfOrigin);
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="py-2.5 px-3 border border-slate-700 text-center w-14">S.N.</th>
                      <th className={`py-2.5 px-3 border border-slate-700 text-left ${hasEval || isInspect ? 'w-1/4' : 'w-1/3'}`}>
                        Criteria / Component
                      </th>
                      <th className={`py-2.5 px-3 border border-slate-700 text-left ${hasEval || isInspect ? 'w-1/3' : 'w-5/12'}`}>
                        Requirement as per Specification
                      </th>
                      <th className={`py-2.5 px-3 border border-slate-700 text-left ${hasEval || isInspect ? 'w-1/4' : 'w-1/3'}`}>
                        {isInspect ? 'Delivered / Inspected Specification' : "Bidder's Offered Specification"}
                      </th>
                      {isInspect && (
                        <th className="py-2.5 px-3 border border-slate-700 text-center w-24">Inspection Result</th>
                      )}
                      {hasEval && (
                        <th className="py-2.5 px-3 border border-slate-700 text-center w-24">Compliance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {content.sections.map((section) => (
                      <React.Fragment key={section.id}>
                        {content.sections.length > 1 && (
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <td colSpan={hasEval || isInspect ? 5 : 4} className="py-2 px-3 border border-slate-300">
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
                              {isInspect ? (row.inspectedValue || row.offeredSpecification || '—') : (row.offeredSpecification || '—')}
                            </td>
                            {isInspect && (
                              <td className="py-2 px-3 border border-slate-200 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.inspectionResult === 'Conditional' ? 'bg-amber-100 text-amber-800' :
                                  row.inspectionResult === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {row.inspectionResult || 'Accepted'}
                                </span>
                              </td>
                            )}
                            {hasEval && (
                              <td className="py-2 px-3 border border-slate-200 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.compliance === 'Complied' ? 'bg-emerald-100 text-emerald-800' :
                                  row.compliance === 'Not Complied' ? 'bg-red-100 text-red-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {row.compliance || 'Complied'}
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
            );
          })()}

          {/* Official Signatures Block */}
          <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">{content.preparedBy || 'Er. Saroj Chalise'}</p>
              <p className="text-slate-600">{content.designation || 'Mechanical Engineer / Automobile Instructor'}</p>
              <p className="text-[10px] text-slate-500">{content.nec || 'NEC Reg. No.: 2016, Mechanical Category A'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">Prepared By</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="text-xs text-slate-900 font-bold uppercase tracking-wider mt-2">Approved By</p>
            </div>
          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 rounded-b-2xl print:hidden">
          <span>Total: {totalSpecs} Criteria across {content.sections.length} Sections</span>
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
