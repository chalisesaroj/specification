import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Calculator,
  Percent,
  Check,
  X
} from 'lucide-react';
import { WorkRecord, CostEstimateData, CostEstimateItem } from '../types/spec';
import { generateCostEstimatePDF } from '../utils/pdfGenerator';
import { SaveWorkRecordResult } from '../services/storageService';
import { numberToWordsNPR } from '../utils/numberToWords';

interface CostEstimateEditorProps {
  record: WorkRecord;
  onSave: (recordId: string, estimate: CostEstimateData) => Promise<SaveWorkRecordResult>;
  onClose: () => void;
}

export const CostEstimateEditor: React.FC<CostEstimateEditorProps> = ({
  record,
  onSave,
  onClose,
}) => {
  const existingEstimate = record.cost_estimate || record.content.costEstimate;

  // Extract initial particulars from vehicle scope & general description row
  const getInitialParticulars = (): string => {
    if (existingEstimate?.items?.[0]?.particulars) {
      return existingEstimate.items[0].particulars;
    }
    const scopeRow = record.content.sections?.[0]?.rows?.find(
      (r) => r.parameter.toLowerCase().includes('scope') || r.parameter.toLowerCase().includes('general')
    );
    if (scopeRow?.requirement) {
      return `Vehicle Specification & General Description: ${scopeRow.requirement}`;
    }
    return record.vehicle_description || `${record.vehicle_category}, Right Hand Drive model suitable for road conditions of Nepal.`;
  };

  const [organizationName, setOrganizationName] = useState(
    existingEstimate?.organizationName || record.organization_name || 'Pokhara Metropolitan City'
  );
  const [documentTitle, setDocumentTitle] = useState(
    existingEstimate?.documentTitle || 'Cost Estimates'
  );
  const [fiscalYear, setFiscalYear] = useState(
    existingEstimate?.fiscalYear || record.fiscal_year || '2083/84'
  );
  const [vehicleCategory] = useState(
    existingEstimate?.vehicleCategory || record.vehicle_category || '4WD Double Cab Pickup'
  );

  // Provision to add few line in header row where user can write anything (after first line of header)
  const [headerLines, setHeaderLines] = useState<string[]>(() => {
    if (existingEstimate?.headerLines && existingEstimate.headerLines.length > 0) {
      return existingEstimate.headerLines;
    }
    return [
      'Office of the Municipal Executive, Gandaki Province',
      'Infrastructure Development & Procurement Division'
    ];
  });

  // Table items: S.N, Particulars, Qty, Unit, Rate, Amount, VAT Applicable, Remarks
  // Qty is by default 1, Unit is by default Number, Rate is by default 100000, Amount is rate * qty
  // VAT: Not all items apply for VAT, so each item has a toggle isVatApplicable
  const [items, setItems] = useState<CostEstimateItem[]>(() => {
    if (existingEstimate?.items && existingEstimate.items.length > 0) {
      return existingEstimate.items.map((it, idx) => ({
        ...it,
        sn: String(idx + 1),
        isVatApplicable: it.isVatApplicable !== undefined ? it.isVatApplicable : true,
        amount: Number(it.qty || 1) * Number(it.rate || 100000),
      }));
    }
    return [
      {
        id: 'est-item-1',
        sn: '1',
        particulars: getInitialParticulars(),
        qty: 1,
        unit: 'Number',
        rate: 100000,
        amount: 100000,
        isVatApplicable: true,
        remarks: 'As per technical specification',
      },
    ];
  });

  const [preparedBy, setPreparedBy] = useState(
    existingEstimate?.preparedBy || record.content.preparedBy || 'Er. Saroj Chalise'
  );
  const [designation, setDesignation] = useState(
    existingEstimate?.designation || record.content.designation || 'Mechanical Engineer'
  );
  const [nec, setNec] = useState(
    existingEstimate?.nec || record.content.nec || 'NEC Reg. No.: 2016, Mechanical Category A'
  );
  const [approvedBy, setApprovedBy] = useState(
    existingEstimate?.approvedBy || record.content.approvedBy || 'Chief Administrative Officer'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Handle header lines manipulation
  const handleAddHeaderLine = () => {
    setHeaderLines((prev) => [...prev, '']);
  };

  const handleUpdateHeaderLine = (index: number, val: string) => {
    setHeaderLines((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleDeleteHeaderLine = (index: number) => {
    setHeaderLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle items table manipulation
  const handleItemChange = (index: number, field: keyof CostEstimateItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };
      
      // Auto-calculate amount whenever qty or rate changes
      if (field === 'qty' || field === 'rate') {
        const q = field === 'qty' ? parseFloat(value) || 0 : target.qty;
        const r = field === 'rate' ? parseFloat(value) || 0 : target.rate;
        target.amount = q * r;
      }
      next[index] = target;
      return next;
    });
  };

  const handleToggleVat = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const willBeVatApplicable = current.isVatApplicable === false ? true : false;
      next[index] = {
        ...current,
        isVatApplicable: willBeVatApplicable,
        // Rule: Only non-vattable items are written as "Non VATTABLE as per the prevailing laws" in Remarks. Vattable items have no remarks.
        remarks: willBeVatApplicable ? '' : 'Non VATTABLE as per the prevailing laws',
      };
      return next;
    });
  };

  const handleAddItem = () => {
    const nextNum = items.length + 1;
    setItems((prev) => [
      ...prev,
      {
        id: 'est-item-' + Date.now().toString(36),
        sn: String(nextNum),
        particulars: '',
        qty: 1,
        unit: 'Number',
        rate: 0,
        amount: 0,
        isVatApplicable: true,
        remarks: '',
      },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((it, idx) => ({ ...it, sn: String(idx + 1) }));
    });
  };

  // VAT and Total Calculations
  // If no any non vattable items: just sum sub total, calculate vat and add to sub total to get grand total.
  // Otherwise: Sub-total is sum of all total, taxable amount is sum of all VAT applicable amount, VAT is 13 % on taxable amount and grand total is sub total plus VAT.
  const calculations = useMemo(() => {
    const hasNonVattable = items.some((it) => it.isVatApplicable === false);
    const subTotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
    const taxableAmount = items.reduce(
      (sum, it) => sum + (it.isVatApplicable !== false ? (it.amount || 0) : 0),
      0
    );
    const nonTaxableAmount = items.reduce(
      (sum, it) => sum + (it.isVatApplicable === false ? (it.amount || 0) : 0),
      0
    );
    const vatRatePercent = 13;
    const vatAmount = Math.round(taxableAmount * (vatRatePercent / 100) * 100) / 100;
    const totalAmount = Math.round((subTotal + vatAmount) * 100) / 100;

    return {
      hasNonVattable,
      subTotal,
      taxableAmount,
      nonTaxableAmount,
      vatRatePercent,
      vatAmount,
      totalAmount,
      inWords: numberToWordsNPR(totalAmount),
    };
  }, [items]);

  // Assemble full payload
  const assembleEstimateData = (): CostEstimateData => {
    return {
      documentTitle,
      organizationName,
      headerLines: headerLines.filter((l) => l.trim() !== ''),
      fiscalYear,
      vehicleCategory,
      items,
      subTotal: calculations.subTotal,
      taxableAmount: calculations.taxableAmount,
      nonTaxableAmount: calculations.nonTaxableAmount,
      vatRatePercent: calculations.vatRatePercent,
      vatAmount: calculations.vatAmount,
      totalAmount: calculations.totalAmount,
      preparedBy,
      designation,
      nec,
      approvedBy,
      updated_at: new Date().toISOString(),
    };
  };

  // Save to database
  const handleSaveEstimate = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const estimateData = assembleEstimateData();
      const res = await onSave(record.id, estimateData);

      if (res?.syncedToSupabase) {
        setStatusMessage({
          text: `✓ Cost Estimate saved! Rate & Quantity columns added to vehicle database table.`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: '✓ Cost Estimate saved successfully!',
          type: 'success',
        });
      }
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({
        text: 'Error saving cost estimate: ' + (err?.message || 'Error'),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const estimateData = assembleEstimateData();
    const filename = `${organizationName}_Cost_Estimate_${fiscalYear.replace(/\//g, '_')}`;
    generateCostEstimatePDF(estimateData, filename);
  };

  // Browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Action & Navigation Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1"
            title="Back to Work Records"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold hidden md:inline">Back</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Calculator className="w-4 h-4" />
              </div>
              <h1 className="text-base font-bold text-slate-900">
                Cost Estimates – {vehicleCategory}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              One-page engineering estimate with 13% VAT provision. All fields editable except auto-calculated Amount and VAT totals.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
            title="Print Estimate Document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
            title="Download One-Page PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveEstimate}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            title="Save Cost Estimate to database"
          >
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border flex items-center space-x-2 print:hidden ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Sheet Container: Designed as standard A4 1-page document */}
      <div className="bg-slate-100 p-2 sm:p-6 rounded-xl flex justify-center">
        <div className="bg-white w-full max-w-4xl p-6 sm:p-10 rounded-xl shadow-md border border-slate-200 text-slate-900 font-serif min-h-[700px] flex flex-col justify-between">
          
          <div>
            {/* Header Area */}
            <div className="text-center space-y-1.5 border-b border-slate-300 pb-4 mb-6">
              
              {/* Line 1: Organization Name (First line of the header) */}
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="ORGANIZATION NAME"
                className="w-full text-center text-lg sm:text-xl font-bold uppercase tracking-wide border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1 text-slate-900 font-sans"
              />

              {/* Provision to add few line in header row where user can write anything (AFTER first line of header) */}
              <div className="space-y-1 pt-0.5">
                {headerLines.map((line, idx) => (
                  <div key={idx} className="flex items-center justify-center space-x-1 group">
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleUpdateHeaderLine(idx, e.target.value)}
                      placeholder="Enter additional office / division / tender details here..."
                      className="w-full max-w-xl text-center text-xs font-sans text-slate-600 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteHeaderLine(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity print:hidden"
                      title="Remove header line"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="pt-1 flex justify-center print:hidden">
                  <button
                    type="button"
                    onClick={handleAddHeaderLine}
                    className="text-[11px] font-sans font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Header Line</span>
                  </button>
                </div>
              </div>

              {/* Document Title: Cost Estimates (Replacing Technical Specification) */}
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="COST ESTIMATES"
                className="w-full text-center text-sm sm:text-base font-bold uppercase tracking-wide border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1 text-slate-800 font-sans"
              />

              {/* Subtitle row */}
              <div className="pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-sans text-slate-600">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-700">Fiscal Year:</span>
                  <input
                    type="text"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    placeholder="2083/84"
                    className="w-20 px-1.5 py-0.5 border border-slate-300 rounded font-mono text-center text-xs"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-700">Category:</span>
                  <span className="font-semibold text-slate-900">{vehicleCategory}</span>
                </div>
              </div>
            </div>

            {/* Table with columns: S.N, Particulars, Qty, Unit, Rate, Amount, VAT (13%), Remarks */}
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-2 border border-slate-300 text-center w-10">S.N.</th>
                    <th className="py-2.5 px-3 border border-slate-300 text-left">
                      Particulars
                    </th>
                    <th className="py-2.5 px-2 border border-slate-300 text-center w-14">
                      Qty
                    </th>
                    <th className="py-2.5 px-2 border border-slate-300 text-center w-16">
                      Unit
                    </th>
                    <th className="py-2.5 px-3 border border-slate-300 text-right w-24">
                      Rate (NPR)
                    </th>
                    <th className="py-2.5 px-3 border border-slate-300 text-right w-28 bg-slate-200/50">
                      Amount (NPR)
                    </th>
                    <th className="py-2.5 px-2 border border-slate-300 text-center w-24">
                      VAT (13%)
                    </th>
                    <th className="py-2.5 px-3 border border-slate-300 text-left w-24">
                      Remarks
                    </th>
                    <th className="py-2.5 px-1 border border-slate-300 text-center w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* S.N */}
                      <td className="py-2 px-1 border border-slate-300 text-center font-mono align-top">
                        <input
                          type="text"
                          value={item.sn}
                          onChange={(e) => handleItemChange(idx, 'sn', e.target.value)}
                          className="w-full text-center bg-transparent border-0 focus:outline-none font-semibold text-slate-700"
                        />
                      </td>

                      {/* Particulars (text same as Vehicle Specification and general Description) */}
                      <td className="py-2 px-2 border border-slate-300 align-top">
                        <textarea
                          rows={2}
                          value={item.particulars}
                          onChange={(e) => handleItemChange(idx, 'particulars', e.target.value)}
                          placeholder="Vehicle Scope & General Description..."
                          className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white resize-y font-medium text-slate-800 focus:outline-none leading-relaxed"
                        />
                      </td>

                      {/* Qty (by default 1, editable) */}
                      <td className="py-2 px-1 border border-slate-300 text-center align-top">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-full p-1 text-center font-mono font-semibold text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                        />
                      </td>

                      {/* Unit (by default Number, editable) */}
                      <td className="py-2 px-1 border border-slate-300 text-center align-top">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          placeholder="Number"
                          className="w-full p-1 text-center text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none"
                        />
                      </td>

                      {/* Rate (by default 100000, editable) */}
                      <td className="py-2 px-2 border border-slate-300 text-right align-top">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full p-1 text-right font-mono font-semibold text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none text-slate-900"
                        />
                      </td>

                      {/* Amount (Auto-calculated: Qty * Rate, not editable directly) */}
                      <td className="py-2 px-3 border border-slate-300 text-right font-mono font-bold text-xs align-top bg-slate-50 text-slate-900">
                        {Number(item.amount || (item.qty * item.rate) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* VAT (13%) Provision: Not all items apply for VAT */}
                      <td className="py-2 px-1.5 border border-slate-300 text-center align-top">
                        <button
                          type="button"
                          onClick={() => handleToggleVat(idx)}
                          className={`w-full py-1 px-1 rounded text-[11px] font-semibold border flex items-center justify-center space-x-1 transition-all ${
                            item.isVatApplicable !== false
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                          }`}
                          title={
                            item.isVatApplicable !== false
                              ? '13% VAT applies to this item. Click to make Exempt.'
                              : 'VAT Exempt / Non-Taxable. Click to apply 13% VAT.'
                          }
                        >
                          {item.isVatApplicable !== false ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>13% VAT</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-slate-400" />
                              <span>Exempt</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Remarks (editable) */}
                      <td className="py-2 px-2 border border-slate-300 align-top">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                          placeholder="Optional remarks..."
                          className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none text-slate-600"
                        />
                      </td>

                      {/* Delete item action */}
                      <td className="py-2 px-1 border border-slate-300 text-center align-top print:hidden">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-300 hover:text-red-600 p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Rows with VAT Calculation */}
                  {/* 1. Sub-total (Sum of all total) */}
                  <tr className="bg-slate-50 font-semibold border-t-2 border-slate-400">
                    <td colSpan={5} className="py-2 px-3 border border-slate-300 text-right uppercase tracking-wider text-slate-800 font-bold">
                      Sub-total:
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono text-slate-900 font-bold">
                      {calculations.subTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={3} className="py-2 px-2 border border-slate-300 text-slate-500 text-[11px] italic">
                      Sum of all items
                    </td>
                  </tr>

                  {/* 2. Taxable Amount (Shown ONLY if there are non-vattable items) */}
                  {calculations.hasNonVattable && (
                    <tr className="bg-slate-50/60 font-semibold">
                      <td colSpan={5} className="py-1.5 px-3 border border-slate-300 text-right text-slate-700 font-semibold">
                        Taxable Amount:
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 text-right font-mono text-slate-800">
                        {calculations.taxableAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td colSpan={3} className="py-1.5 px-2 border border-slate-300 text-slate-400 text-[10px]">
                        Sum of VAT applicable items
                      </td>
                    </tr>
                  )}

                  {/* 3. VAT 13% */}
                  <tr className="bg-emerald-50/40 font-semibold">
                    <td colSpan={5} className="py-1.5 px-3 border border-slate-300 text-right text-emerald-900 font-bold">
                      VAT 13%:
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 text-right font-mono text-emerald-800 font-bold">
                      {calculations.vatAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={3} className="py-1.5 px-2 border border-slate-300 text-emerald-700 text-[10px] font-medium">
                      {calculations.hasNonVattable ? '13% on Taxable Amount' : '13% on Sub-total'}
                    </td>
                  </tr>

                  {/* 4. Grand Total */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-500">
                    <td colSpan={5} className="py-2.5 px-3 border border-slate-300 text-right uppercase tracking-wider text-slate-900 font-black">
                      Grand Total:
                    </td>
                    <td className="py-2.5 px-3 border border-slate-300 text-right font-mono text-emerald-900 text-sm font-black bg-emerald-50/60">
                      {calculations.totalAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={3} className="py-2.5 px-2 border border-slate-300 text-slate-600 font-semibold text-[11px]">
                      NPR (Sub-total + VAT)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* In Words Callout */}
              <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 flex items-start space-x-1.5">
                <span className="font-bold text-slate-900 shrink-0">In Words:</span>
                <span className="font-medium italic text-slate-800">{calculations.inWords}</span>
              </div>

              {/* "+ Add Item / Row" Button */}
              <div className="pt-2 flex justify-start print:hidden">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 py-1 px-2 rounded hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item / Row</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer: Same footer where prepared by is already defined and only approved by and a underline */}
          <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs font-sans text-slate-700">
            {/* Left: Prepared By */}
            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full text-center font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:outline-none"
              />
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full text-center text-slate-600 border-b border-transparent hover:border-slate-300 focus:outline-none"
              />
              <input
                type="text"
                value={nec}
                onChange={(e) => setNec(e.target.value)}
                className="w-full text-center text-[11px] text-slate-500 border-b border-transparent hover:border-slate-300 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold pt-1">
                Prepared By
              </p>
            </div>

            {/* Right: Only approved by and a underline */}
            <div className="pt-2 space-y-0.5">
              <div className="border-t border-slate-800 w-48 mx-auto mt-7 mb-2"></div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Approved By
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
