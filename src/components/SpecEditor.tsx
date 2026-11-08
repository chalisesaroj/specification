import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  SpecContent, 
  SpecRow, 
  WorkRecord, 
  VehicleCategory,
  StandardSpecification,
  CustomHeaderRow
} from '../types/spec';
import { generateSpecificationPDF } from '../utils/pdfGenerator';
import { SaveWorkRecordResult } from '../services/storageService';
import { getSupabase } from '../lib/supabase';
import { SupabaseConnectModal } from './SupabaseConnectModal';

interface SpecEditorProps {
  initialContent: SpecContent;
  mode?: 'specification' | 'evaluate' | 'inspect';
  standardSpecId?: string;
  standardSpecTitle?: string;
  existingRecordId?: string;
  initialDocumentName?: string;
  isSupabaseConnected?: boolean;
  onRefreshConnection?: () => Promise<void>;
  onSaveWorkRecord: (record: WorkRecord) => Promise<SaveWorkRecordResult>;
  onDeleteRecord?: (id: string, name?: string) => Promise<void>;
  onUpdateStandardSpecification?: (stdId: string, updatedContent: SpecContent) => Promise<void>;
  onSaveAsNewStandard?: (title: string, category: VehicleCategory, content: SpecContent) => Promise<void>;
  availableStandards?: StandardSpecification[];
  onCancel: () => void;
}

export const SpecEditor: React.FC<SpecEditorProps> = ({
  initialContent,
  mode = 'specification',
  standardSpecId,
  standardSpecTitle,
  existingRecordId,
  initialDocumentName,
  isSupabaseConnected = false,
  onRefreshConnection,
  onSaveWorkRecord,
  onDeleteRecord,
  onCancel,
}) => {
  const isInspection = mode === 'inspect';
  const isEvaluation = mode === 'evaluate';
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Bidder evaluation and inspection fields
  const [bidderName, setBidderName] = useState(initialContent.bidderName || '');
  const [selectedBidderName, setSelectedBidderName] = useState(
    initialContent.inspectionDetails?.selectedBidderName || initialContent.bidderName || ''
  );

  // Custom dynamically added header rows (e.g. Project Name, Contract No, Date, etc.)
  const [customHeaderRows, setCustomHeaderRows] = useState<CustomHeaderRow[]>(
    initialContent.customHeaderRows || []
  );

  // Flatten initial rows from all sections into a single plain list for maximum simplicity
  const [documentTitle, setDocumentTitle] = useState(
    initialContent.documentTitle || 
      (isInspection 
        ? 'Vehicle Technical Inspection & Delivery Report' 
        : isEvaluation 
        ? 'Technical Bid Evaluation' 
        : 'Technical Specifications')
  );
  const [organizationName, setOrganizationName] = useState(
    initialContent.organizationName || 'Pokhara Metropolitan City'
  );
  const [fiscalYear, setFiscalYear] = useState(initialContent.fiscalYear || '2083/84');
  const [tenderNo, setTenderNo] = useState(initialContent.tenderNo || '');
  const [vehicleCategory] = useState<VehicleCategory>(
    (initialContent.vehicleCategory as VehicleCategory) || '4WD Double Cab Pickup'
  );
  const [vehicleDescription, setVehicleDescription] = useState(
    initialContent.vehicleDescription || ''
  );
  const [make, setMake] = useState(initialContent.make || '');
  const [model, setModel] = useState(initialContent.model || '');
  const [countryOfOrigin, setCountryOfOrigin] = useState(initialContent.countryOfOrigin || '');
  const [deliveryPlace, setDeliveryPlace] = useState(
    initialContent.deliveryPlace || 'Office of the Municipal Executive, Pokhara Metropolitan City'
  );
  const [preparedBy, setPreparedBy] = useState(initialContent.preparedBy || 'Er. Saroj Chalise');
  const [designation, setDesignation] = useState(
    initialContent.designation || 
      (isInspection 
        ? 'Mechanical Engineer / Technical Inspector' 
        : isEvaluation 
        ? 'Mechanical Engineer / Technical Evaluator' 
        : 'Mechanical Engineer / Automobile Instructor')
  );
  const [nec, setNec] = useState(
    initialContent.nec || 'NEC Reg. No.: 2016, Mechanical Category A'
  );
  const [approvedBy, setApprovedBy] = useState(
    initialContent.approvedBy || 'Chief Administrative Officer'
  );

  // Inspection physical vehicle details
  const [chassisNo, setChassisNo] = useState(initialContent.inspectionDetails?.chassisNo || '');
  const [engineNo, setEngineNo] = useState(initialContent.inspectionDetails?.engineNo || '');
  const [color, setColor] = useState(initialContent.inspectionDetails?.color || '');
  const [manufacturingYear, setManufacturingYear] = useState(initialContent.inspectionDetails?.manufacturingYear || '2026');
  const [odometerReading, setOdometerReading] = useState(initialContent.inspectionDetails?.odometerReading || '30 km');
  const [batteryDetails, setBatteryDetails] = useState(initialContent.inspectionDetails?.batteryDetails || '12V 70Ah');
  const [tyreDetails, setTyreDetails] = useState(initialContent.inspectionDetails?.tyreDetails || 'Bridgestone / Brand New');
  const [overallConclusion, setOverallConclusion] = useState<'Accepted' | 'Accepted with Conditions' | 'Rejected'>(
    initialContent.inspectionDetails?.overallConclusion || 'Accepted'
  );

  // Extract all rows cleanly with sequential S.N. points 1, 2, 3... and include Scope & Delivery in table
  const [rows, setRows] = useState<SpecRow[]>(() => {
    let allRows: SpecRow[] = [];
    if (initialContent.sections && initialContent.sections.length > 0) {
      initialContent.sections.forEach((sec) => {
        sec.rows.forEach((r) => {
          allRows.push({
            ...r,
            inspectedValue: r.inspectedValue || r.offeredSpecification || '',
            inspectionResult: r.inspectionResult || 'Accepted',
          });
        });
      });
    }

    // Ensure Scope and Delivery Destination are inside the specification table
    const hasScope = allRows.some((r) => r.parameter.toLowerCase().includes('scope') || r.parameter.toLowerCase().includes('general'));
    const hasDelivery = allRows.some((r) => r.parameter.toLowerCase().includes('delivery'));

    if (!hasScope && (initialContent.vehicleDescription || vehicleCategory)) {
      allRows.unshift({
        id: 'r-scope-' + Date.now().toString(36),
        itemNumber: '1',
        parameter: 'Vehicle Scope & General Description',
        requirement: initialContent.vehicleDescription || `${vehicleCategory}, Right Hand Drive model suitable for road conditions of Nepal.`,
        compliance: 'Complied',
        inspectionResult: 'Accepted',
        inspectedValue: 'Verified as per requirement',
      });
    }

    if (!hasDelivery) {
      allRows.push({
        id: 'r-delivery-' + Date.now().toString(36),
        itemNumber: '2',
        parameter: 'Delivery Destination',
        requirement: initialContent.deliveryPlace || 'Office of the Municipal Executive / designated division office',
        compliance: 'Complied',
        inspectionResult: 'Accepted',
        inspectedValue: 'Delivered at site',
      });
    }

    if (allRows.length === 0) {
      allRows = [
        {
          id: 'r-1',
          itemNumber: '1',
          parameter: 'Vehicle Scope & General Description',
          requirement: 'Right Hand Drive model suitable for road conditions of Nepal.',
          compliance: 'Complied',
          inspectionResult: 'Accepted',
          inspectedValue: 'Verified as per requirement.',
        },
      ];
    }

    // Number all S.N. points sequentially as 1, 2, 3... rather than 1.1, 1.2
    return allRows.map((r, idx) => ({
      ...r,
      itemNumber: String(idx + 1),
    }));
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dynamic custom header row handlers
  const handleAddHeaderRow = () => {
    setCustomHeaderRows((prev) => [
      ...prev,
      { id: 'hdr-' + Date.now().toString(36), label: 'Project Name', value: '' },
    ]);
  };

  const handleHeaderRowChange = (index: number, field: 'label' | 'value', value: string) => {
    setCustomHeaderRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteHeaderRow = (index: number) => {
    setCustomHeaderRows((prev) => prev.filter((_, i) => i !== index));
  };

  const assembleCurrentContent = (): SpecContent => {
    const stage = isInspection ? 'inspected' : isEvaluation ? 'evaluated' : 'created';
    const scopeRow = rows.find(
      (r) => r.parameter.toLowerCase().includes('scope') || r.parameter.toLowerCase().includes('general')
    );
    const deliveryRow = rows.find(
      (r) => r.parameter.toLowerCase().includes('delivery')
    );
    const effScope = scopeRow?.requirement || vehicleDescription || `${vehicleCategory} Technical Specification`;
    const effDelivery = deliveryRow?.requirement || deliveryPlace || '';

    return {
      ...initialContent,
      organizationName,
      documentTitle,
      fiscalYear,
      tenderNo,
      bidderName: isEvaluation ? bidderName.trim() : (isInspection ? (selectedBidderName.trim() || bidderName.trim()) : bidderName.trim() || undefined),
      vehicleCategory,
      vehicleDescription: effScope,
      make,
      model,
      countryOfOrigin,
      deliveryPlace: effDelivery,
      preparedBy,
      designation,
      nec,
      approvedBy,
      customHeaderRows,
      stage,
      inspectionDetails: isInspection ? {
        chassisNo,
        engineNo,
        color,
        manufacturingYear,
        odometerReading,
        batteryDetails,
        tyreDetails,
        overallConclusion,
        deliveryDate: new Date().toISOString().split('T')[0],
        inspectorName: preparedBy,
        inspectorDesignation: designation,
        selectedBidderName: selectedBidderName.trim() || bidderName.trim(),
      } : initialContent.inspectionDetails,
      sections: [
        {
          id: 'sec-main',
          title: isInspection 
            ? 'Vehicle Technical Inspection & Verification' 
            : isEvaluation 
            ? 'Technical Bid Evaluation' 
            : 'Technical Specifications',
          order: 1,
          rows,
        },
      ],
    };
  };

  // 1. Top Button: Save (saves directly to Supabase BaaS)
  const executeSave = async (forceOffline = false) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const customContent = assembleCurrentContent();
      const stage = isInspection ? 'inspected' : isEvaluation ? 'evaluated' : 'created';
      
      const effBidder = isInspection ? (selectedBidderName.trim() || bidderName.trim()) : bidderName.trim();
      let docName = initialDocumentName;
      if (!docName) {
        if (effBidder) {
          docName = `${organizationName.trim() || 'Client'} – ${vehicleCategory} [${effBidder}] – FY ${fiscalYear.trim() || '2083/84'}`;
        } else {
          docName = `${organizationName.trim() || 'Client'} – ${vehicleCategory} – FY ${fiscalYear.trim() || '2083/84'}`;
        }
      }

      const recordToSave: WorkRecord = {
        id: existingRecordId || '',
        standard_spec_id: standardSpecId || 'std-custom',
        standard_spec_title: standardSpecTitle || 'Standard Automobile Specification',
        document_name: docName,
        organization_name: organizationName.trim(),
        vehicle_category: vehicleCategory,
        vehicle_description: vehicleDescription.trim(),
        fiscal_year: fiscalYear.trim(),
        bidder_name: effBidder || undefined,
        stage,
        content: customContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await onSaveWorkRecord(recordToSave);

      if (result?.syncedToSupabase) {
        setStatusMessage({ 
          text: `✓ Saved successfully to database!`, 
          type: 'success' 
        });
      } else if (result?.isTableMissing) {
        setStatusMessage({ 
          text: `⚠️ Saved locally, but Supabase table "work_records" does not exist yet. Click "Connect Supabase" to view/copy the SQL schema.`, 
          type: 'error' 
        });
        setConnectModalOpen(true);
      } else if (result?.supabaseError) {
        setStatusMessage({ 
          text: `⚠️ Saved locally, but cloud sync failed: ${result.supabaseError}`, 
          type: 'error' 
        });
      } else if (!result?.supabaseConfigured) {
        if (!forceOffline) {
          setConnectModalOpen(true);
        }
        setStatusMessage({ 
          text: `Saved to Local Storage. Supabase is not connected yet (click "Connect Supabase" to sync with cloud DB).`, 
          type: 'error' 
        });
      } else {
        setStatusMessage({ 
          text: 'Saved successfully!', 
          type: 'success' 
        });
      }
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ text: 'Error saving: ' + (err?.message || 'Unknown error'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (!isSupabaseConnected && !getSupabase()) {
      // Prompt user to connect Supabase or continue offline
      setConnectModalOpen(true);
    } else {
      executeSave();
    }
  };

  // 2. Top Button: Download (PDF Format)
  const handleDownloadPDF = () => {
    const customContent = assembleCurrentContent();
    const stage = isInspection ? 'inspected' : isEvaluation ? 'evaluated' : 'created';
    const docName =
      initialDocumentName ||
      `${organizationName.trim()} – ${vehicleCategory} – FY ${fiscalYear.trim()}`;
    generateSpecificationPDF(
      { content: customContent, document_name: docName, stage },
      { isInspection, isEvaluation }
    );
  };

  // Row editing handlers
  const handleRowChange = (index: number, field: keyof SpecRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRow = () => {
    const nextNum = rows.length + 1;
    setRows((prev) => [
      ...prev,
      {
        id: 'r-' + Date.now().toString(36) + '-' + nextNum,
        itemNumber: String(nextNum),
        parameter: '',
        requirement: '',
        offeredSpecification: '',
        compliance: 'Complied',
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-number sequentially 1, 2, 3...
      return filtered.map((r, i) => ({ ...r, itemNumber: String(i + 1) }));
    });
  };

  // Delete specification handler
  const confirmDeleteSpecification = async () => {
    if (!existingRecordId) return;
    setIsDeleting(true);
    setShowDeleteModal(false);
    try {
      if (onDeleteRecord) {
        await onDeleteRecord(existingRecordId, documentTitle);
      }
      onCancel();
    } catch (err: any) {
      setStatusMessage({
        text: `Failed to delete specification: ${err?.message || 'Error'}`,
        type: 'error',
      });
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20 -mt-6 sm:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Top Header Bar with EXACTLY TWO PRIMARY ACTION BUTTONS */}
      <header className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Left: Minimal back link and document context */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center space-x-1 text-xs font-semibold"
              title="Return to library"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="border-l border-slate-300 pl-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                  {isInspection 
                    ? `Vehicle Delivery Inspection: ${vehicleCategory}`
                    : isEvaluation 
                    ? `Technical Evaluation: ${vehicleCategory}` 
                    : `Custom Specification: ${vehicleCategory}`}
                </span>
                {isInspection ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                    Inspection Mode
                  </span>
                ) : isEvaluation ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded">
                    Evaluation Mode
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded">
                    Specification Mode
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block">
                {isInspection
                  ? `Verifying delivered physical vehicle & components against requirements (${rows.length} parameters)`
                  : isEvaluation
                  ? `Evaluating bidder compliance & specifications (${rows.length} parameters)`
                  : `Custom procurement specification (${rows.length} parameters)`}
              </span>
            </div>
          </div>

          {/* Right: The Two Requested Top Buttons + DB Connection status */}
          <div className="flex items-center space-x-2.5">
            {/* Supabase status indicator badge */}
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
              }`}
              title={isSupabaseConnected ? "Connected to Supabase PostgreSQL (Click to view details)" : "Supabase Not Connected - Click to configure cloud database"}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            </button>

            {/* Delete button (Reclaims memory when not required) */}
            {existingRecordId && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Delete this specification from database to reduce memory consumption"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}

            {/* 1. Save (saves directly to database) */}
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* 2. Download (PDF format of custom technical specification) */}
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div className="max-w-5xl mx-auto px-4 mt-3">
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Plain, Professional Document Canvas */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-12 space-y-6 font-serif">
          {/* Document Header (Direct inline editing) */}
          <div className="text-center border-b-2 border-slate-800 pb-5 space-y-1">
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="ORGANIZATION NAME"
              className="w-full text-center text-lg sm:text-xl font-bold uppercase tracking-wide border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1 text-slate-900"
            />
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="TECHNICAL SPECIFICATION TITLE"
              className="w-full text-center text-sm sm:text-base font-semibold uppercase tracking-wide border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1 text-slate-800"
            />

            {/* Document Meta Row */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-sans text-slate-600">
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

              {/* Evaluation Mode: Specific Bidder Name input */}
              {isEvaluation && (
                <div className="flex items-center space-x-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-200">
                  <span className="font-bold text-indigo-900">Bidder / Supplier:</span>
                  <input
                    type="text"
                    value={bidderName}
                    onChange={(e) => setBidderName(e.target.value)}
                    placeholder="e.g. United Traders Syndicate (Toyota)"
                    className="w-56 px-2 py-0.5 bg-white border border-indigo-300 rounded text-xs font-semibold text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Ref Tender number, Make, Model and origin are shown during Evaluation and Inspection */}
              {(isEvaluation || isInspection) && (
                <>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-slate-700">Ref/Tender No:</span>
                    <input
                      type="text"
                      value={tenderNo}
                      onChange={(e) => setTenderNo(e.target.value)}
                      placeholder="e.g. PMC/NCB/083-84/01"
                      className="w-40 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-slate-50/70"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-slate-700">Make:</span>
                    <input
                      type="text"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Toyota"
                      className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-slate-50/70"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-slate-700">Model:</span>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Hilux"
                      className="w-28 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-slate-50/70"
                    />
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-slate-700">Origin:</span>
                    <input
                      type="text"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      placeholder="e.g. Japan"
                      className="w-24 px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-slate-50/70"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Dynamic Custom Header Rows (Provision to add few rows in the header) */}
            {customHeaderRows.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {customHeaderRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-300 text-xs font-sans shadow-2xs"
                  >
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => handleHeaderRowChange(idx, 'label', e.target.value)}
                      placeholder="Field Name (e.g. Department)"
                      className="w-28 font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-400 focus:outline-none py-0.5 text-right"
                    />
                    <span className="text-slate-400 font-bold">:</span>
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => handleHeaderRowChange(idx, 'value', e.target.value)}
                      placeholder="Field Value..."
                      className="w-40 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteHeaderRow(idx)}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors"
                      title="Remove this header row"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* "+ Add Header Row" Button */}
            <div className="pt-1.5 flex justify-center">
              <button
                type="button"
                onClick={handleAddHeaderRow}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors border border-dashed border-blue-300"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Header Row</span>
              </button>
            </div>
          </div>

          {/* Physical Vehicle Identification Section (Only in Inspection Mode) */}
          {isInspection && (
            <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200 text-xs font-sans space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold text-emerald-900 uppercase tracking-wide">
                  Physical Vehicle Identification & Verification
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-emerald-800">Inspection Decision:</span>
                  <select
                    value={overallConclusion}
                    onChange={(e) => setOverallConclusion(e.target.value as any)}
                    className="px-2 py-1 bg-white font-bold text-emerald-800 border border-emerald-300 rounded focus:outline-none"
                  >
                    <option value="Accepted">Accepted / Passed</option>
                    <option value="Accepted with Conditions">Accepted with Conditions</option>
                    <option value="Rejected">Rejected / Failed</option>
                  </select>
                </div>
              </div>

              {/* Selected Winning Bidder for Inspection */}
              <div className="bg-white p-2.5 rounded border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1">
                  <span className="block text-[11px] font-bold text-emerald-950 mb-0.5">
                    Selected Winning Bidder / Supplying Firm:
                  </span>
                  <input
                    type="text"
                    value={selectedBidderName}
                    onChange={(e) => setSelectedBidderName(e.target.value)}
                    placeholder="e.g. United Traders Syndicate Pvt. Ltd. (Authorized Toyota Distributor)"
                    className="w-full px-2 py-1 bg-emerald-50/40 border border-emerald-300 rounded text-xs font-semibold text-emerald-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Chassis / VIN:</span>
                  <input
                    type="text"
                    value={chassisNo}
                    onChange={(e) => setChassisNo(e.target.value)}
                    placeholder="e.g. MROBA3CD12345"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Engine No:</span>
                  <input
                    type="text"
                    value={engineNo}
                    onChange={(e) => setEngineNo(e.target.value)}
                    placeholder="e.g. 2GD-987654"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Color:</span>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. White"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Mfg Year:</span>
                  <input
                    type="text"
                    value={manufacturingYear}
                    onChange={(e) => setManufacturingYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Odometer:</span>
                  <input
                    type="text"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder="e.g. 25 km"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Battery:</span>
                  <input
                    type="text"
                    value={batteryDetails}
                    onChange={(e) => setBatteryDetails(e.target.value)}
                    placeholder="e.g. 12V 70Ah"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <span className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tyres & Accessories:</span>
                  <input
                    type="text"
                    value={tyreDetails}
                    onChange={(e) => setTyreDetails(e.target.value)}
                    placeholder="e.g. 265/65R17 Brand New, Jack & Tools"
                    className="w-full bg-white px-2 py-1 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>
          )}


          {/* Technical Specifications Table */}
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-2 px-2 border border-slate-300 text-center w-12">S.N.</th>
                  <th className={`py-2 px-3 border border-slate-300 text-left ${isEvaluation || isInspection ? 'w-1/4' : 'w-1/3'}`}>
                    Criteria / Parameter
                  </th>
                  <th className={`py-2 px-3 border border-slate-300 text-left ${isEvaluation || isInspection ? 'w-4/12' : 'w-5/12'}`}>
                    Requirement as per Specification
                  </th>
                  <th className={`py-2 px-3 border border-slate-300 text-left ${isEvaluation || isInspection ? 'w-1/5' : 'w-1/4'}`}>
                    {isInspection ? 'Delivered / Inspected Specification' : "Bidder's Offered Specification"}
                  </th>
                  {/* Inspection Result column: ONLY rendered during Inspection */}
                  {isInspection && (
                    <th className="py-2 px-2 border border-slate-300 text-center w-28">Inspection Result</th>
                  )}
                  {/* Compliance column: ONLY rendered during Evaluation */}
                  {isEvaluation && (
                    <th className="py-2 px-2 border border-slate-300 text-center w-28">Compliance</th>
                  )}
                  <th className="py-2 px-1 border border-slate-300 text-center w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* S.N. */}
                    <td className="py-2 px-1 border border-slate-300 text-center font-mono align-top">
                      <input
                        type="text"
                        value={row.itemNumber}
                        onChange={(e) => handleRowChange(idx, 'itemNumber', e.target.value)}
                        className="w-full text-center bg-transparent border-0 focus:outline-none font-semibold text-slate-700"
                      />
                    </td>

                    {/* Criteria / Parameter */}
                    <td className="py-2 px-2 border border-slate-300 align-top">
                      <textarea
                        rows={2}
                        value={row.parameter}
                        onChange={(e) => handleRowChange(idx, 'parameter', e.target.value)}
                        placeholder="Criteria (e.g. Engine, Brakes)"
                        className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white resize-y font-semibold text-slate-800 focus:outline-none"
                      />
                    </td>

                    {/* Requirement */}
                    <td className="py-2 px-2 border border-slate-300 align-top">
                      <textarea
                        rows={3}
                        value={row.requirement}
                        onChange={(e) => handleRowChange(idx, 'requirement', e.target.value)}
                        placeholder="Technical requirement description..."
                        className="w-full p-1 text-xs border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white resize-y text-slate-700 leading-relaxed focus:outline-none"
                      />
                    </td>

                    {/* Inspected Specification or Bidder's Offered Specification */}
                    <td className="py-2 px-2 border border-slate-300 align-top">
                      <textarea
                        rows={3}
                        value={isInspection ? (row.inspectedValue || row.offeredSpecification || '') : (row.offeredSpecification || '')}
                        onChange={(e) => handleRowChange(idx, isInspection ? 'inspectedValue' : 'offeredSpecification', e.target.value)}
                        placeholder={
                          isInspection
                            ? "Delivered specification verified on vehicle..."
                            : isEvaluation
                            ? "Bidder's submitted specification..."
                            : "Bidder to specify..."
                        }
                        className={`w-full p-1 text-xs border rounded resize-y focus:outline-none ${
                          isInspection
                            ? 'border-emerald-200 bg-white text-slate-800 focus:border-emerald-500'
                            : isEvaluation 
                            ? 'border-slate-200 bg-white text-slate-800 focus:border-blue-500' 
                            : 'border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent focus:bg-white text-slate-600'
                        }`}
                      />
                    </td>

                    {/* Inspection Result (ONLY in Inspection mode) */}
                    {isInspection && (
                      <td className="py-2 px-1 border border-slate-300 text-center align-top">
                        <select
                          value={row.inspectionResult || 'Accepted'}
                          onChange={(e) => handleRowChange(idx, 'inspectionResult', e.target.value as any)}
                          className={`w-full py-1.5 px-1 text-[11px] font-semibold rounded border focus:outline-none cursor-pointer ${
                            row.inspectionResult === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.inspectionResult === 'Rejected'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="Accepted">Accepted</option>
                          <option value="Conditional">Conditional</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>
                    )}

                    {/* Compliance (ONLY in Evaluation mode) */}
                    {isEvaluation && (
                      <td className="py-2 px-1 border border-slate-300 text-center align-top">
                        <select
                          value={row.compliance || 'Complied'}
                          onChange={(e) => handleRowChange(idx, 'compliance', e.target.value as any)}
                          className={`w-full py-1.5 px-1 text-[11px] font-semibold rounded border focus:outline-none cursor-pointer ${
                            row.compliance === 'Complied'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.compliance === 'Not Complied'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : row.compliance === 'Partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="Complied">Complied</option>
                          <option value="Not Complied">Not Complied</option>
                          <option value="Partial">Partial</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>
                    )}

                    {/* Delete row */}
                    <td className="py-2 px-1 border border-slate-300 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-300 hover:text-red-600 p-1 rounded"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Plain "+ Add Row" text button */}
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 py-1 px-2 rounded hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Row</span>
              </button>
            </div>
          </div>

          {/* Official Signatures Section */}
          <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-sans text-slate-700">
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

            <div className="border-t border-slate-400 pt-2 space-y-0.5">
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full text-center font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:outline-none"
              />
              <p className="text-slate-600 pt-0.5">Executive Procurement Authority</p>
              <p className="text-[11px] text-slate-500">{organizationName}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold pt-1">
                Approved By
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Connect Dialog */}
      <SupabaseConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onConnected={async () => {
          if (onRefreshConnection) await onRefreshConnection();
          executeSave();
        }}
        onContinueOffline={() => executeSave(true)}
        actionReason="Connect Supabase to push this specification directly to your cloud PostgreSQL database."
      />

      {/* Delete Confirmation Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-start space-x-3 bg-red-50/50">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Specification Record?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  This will remove this specific procurement record from the database to reclaim memory.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Standard Specification is Safe:</strong> Deleting this custom work record will <strong>never</strong> delete or affect the baseline standard specification for <em>{vehicleCategory}</em> in your library.
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Document to delete: <span className="font-semibold text-slate-800">{documentTitle}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSpecification}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
