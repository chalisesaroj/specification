import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Copy, 
  Download, 
  Trash2, 
  ArrowUpDown, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  PlusCircle,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { WorkRecord, VehicleCategory, VEHICLE_CATEGORIES, getRecordStage } from '../types/spec';
import { generateSpecificationPDF } from '../utils/pdfGenerator';
import { getVehicleTableName, generateProjectColumnPrefix } from '../utils/vehicleTableHelper';

interface WorkRecordsProps {
  workRecords: WorkRecord[];
  onOpenRecord: (record: WorkRecord) => void;
  onEditRecord: (record: WorkRecord) => void;
  onEvaluateRecord: (record: WorkRecord) => void;
  onInspectRecord: (record: WorkRecord) => void;
  onCostEstimateRecord: (record: WorkRecord) => void;
  onDuplicateRecord: (id: string) => void;
  onDeleteRecord: (id: string, name: string) => void;
  onNavigateToNew: () => void;
}

type SortField = 'document_name' | 'organization_name' | 'vehicle_category' | 'fiscal_year' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export const WorkRecords: React.FC<WorkRecordsProps> = ({
  workRecords,
  onOpenRecord,
  onEditRecord,
  onEvaluateRecord,
  onInspectRecord,
  onCostEstimateRecord,
  onDuplicateRecord,
  onDeleteRecord,
  onNavigateToNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Distinct fiscal years
  const fiscalYears = useMemo(() => {
    return Array.from(new Set(workRecords.map((r) => r.fiscal_year).filter(Boolean))).sort().reverse();
  }, [workRecords]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & Sorted Records
  const processedRecords = useMemo(() => {
    return workRecords
      .filter((record) => {
        const matchesCategory = selectedCategory === 'ALL' || record.vehicle_category === selectedCategory;
        const matchesFiscal = selectedFiscalYear === 'ALL' || record.fiscal_year === selectedFiscalYear;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          record.document_name.toLowerCase().includes(search) ||
          record.organization_name.toLowerCase().includes(search) ||
          record.vehicle_category.toLowerCase().includes(search) ||
          record.fiscal_year.toLowerCase().includes(search) ||
          (record.content.tenderNo && record.content.tenderNo.toLowerCase().includes(search));

        return matchesCategory && matchesFiscal && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (sortField === 'created_at' || sortField === 'updated_at') {
          const timeA = new Date(valA).getTime();
          const timeB = new Date(valB).getTime();
          return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortDirection === 'asc' ? comp : -comp;
      });
  }, [workRecords, searchTerm, selectedCategory, selectedFiscalYear, sortField, sortDirection]);

  const getCategoryBadgeColor = (cat: VehicleCategory) => {
    switch (cat) {
      case '4WD Double Cab Pickup':
      case 'Pickup Vehicle':
      case 'Four Wheel Drive Vehicle': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Car (Sedan / Hatchback)': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Jeep (2WD Hardtop)':
      case 'SUV': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'School Bus':
      case 'Bus': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Backhoe Loader':
      case 'Hydraulic Excavator': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Truck': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Tractor':
      case 'Mini Tiller':
      case 'Combine Mill': return 'bg-lime-100 text-lime-800 border-lime-200';
      case 'Motorcycle':
      case 'Scooter': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Ambulance': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">My Work Records History</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Every saved work record is a complete independent snapshot. Modifying or deleting standards will never alter these historical procurement records.
          </p>
        </div>

        <button
          onClick={onNavigateToNew}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Specification</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by name, organization, FY..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {VEHICLE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Fiscal Year Filter */}
          <div className="flex items-center space-x-1 text-xs text-slate-600">
            <span className="font-medium text-slate-500">Fiscal Year:</span>
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Fiscal Years</option>
              {fiscalYears.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Work Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {processedRecords.length === 0 ? (
          <div className="py-16 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Work Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'ALL' || selectedFiscalYear !== 'ALL'
                ? 'Try clearing your search or filters to locate historical work records.'
                : 'Select an automobile standard to customize and save your first permanent work record.'}
            </p>
            <button
              onClick={onNavigateToNew}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            >
              Start New Specification
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  {/* Document Name */}
                  <th 
                    onClick={() => handleSort('document_name')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Document Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Organization */}
                  <th 
                    onClick={() => handleSort('organization_name')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Organization</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Vehicle Category */}
                  <th 
                    onClick={() => handleSort('vehicle_category')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vehicle Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Fiscal Year */}
                  <th 
                    onClick={() => handleSort('fiscal_year')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Fiscal Year</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Date Created */}
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Date Created</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Last Modified */}
                  <th 
                    onClick={() => handleSort('updated_at')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Last Modified</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-4 text-center font-bold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedRecords.map((record) => {
                  const totalSpecs = record.content.sections.reduce(
                    (acc, sec) => acc + sec.rows.length,
                    0
                  );

                  return (
                    <tr 
                      key={record.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Document Name & Lifecycle Stage */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {record.document_name}
                          </span>
                          {(() => {
                            const stage = getRecordStage(record);
                            if (stage === 'inspected') {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center space-x-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Inspected</span>
                                </span>
                              );
                            }
                            if (stage === 'evaluated') {
                              return (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full shrink-0">
                                  Evaluated
                                </span>
                              );
                            }
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full shrink-0">
                                Spec Created
                              </span>
                            );
                          })()}

                          {/* Bidder Badge if present */}
                          {(record.bidder_name || record.content.bidderName || record.content.inspectionDetails?.selectedBidderName) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md shrink-0">
                              Bidder: {record.bidder_name || record.content.bidderName || record.content.inspectionDetails?.selectedBidderName}
                            </span>
                          )}

                          {/* Cost Estimate Badge if present */}
                          {(record.cost_estimate || record.content.costEstimate) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md shrink-0 flex items-center space-x-1 font-mono">
                              <Calculator className="w-3 h-3 text-amber-600" />
                              <span>Est: NPR {(record.cost_estimate?.totalAmount || record.content.costEstimate?.totalAmount || 0).toLocaleString('en-IN')}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          {record.content.tenderNo && (
                            <span>Ref: {record.content.tenderNo}</span>
                          )}
                          {record.content.make && (
                            <span>Make: {record.content.make}</span>
                          )}
                          {record.content.inspectionDetails?.chassisNo && (
                            <span className="font-mono text-emerald-700">VIN: {record.content.inspectionDetails.chassisNo}</span>
                          )}
                          <span>•</span>
                          <span>{totalSpecs} parameters</span>
                        </div>
                        <div className="text-[10px] font-mono text-blue-600 mt-0.5 flex items-center space-x-1">
                          <span className="text-slate-400 font-sans text-[9px] uppercase font-semibold">Column:</span>
                          <span className="truncate max-w-[220px]">{generateProjectColumnPrefix(record.organization_name, record.fiscal_year, record.created_at?.slice(0, 10))}_req</span>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {record.organization_name}
                      </td>

                      {/* Vehicle Category */}
                      <td className="py-3 px-4">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getCategoryBadgeColor(record.vehicle_category)}`}>
                          {record.vehicle_category}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[150px]" title={getVehicleTableName(record.vehicle_category)}>
                          {getVehicleTableName(record.vehicle_category)}
                        </div>
                      </td>

                      {/* Fiscal Year */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-slate-700 font-semibold px-1.5 py-0.5 bg-slate-100 rounded">
                          {record.fiscal_year}
                        </span>
                      </td>

                      {/* Date Created */}
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </td>

                      {/* Last Modified */}
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {new Date(record.updated_at).toLocaleDateString()}
                      </td>

                      {/* Actions: Evaluation, Inspection, or Download Only when inspected */}
                      <td className="py-3 px-4">
                        {(() => {
                          const stage = getRecordStage(record);

                          // Stage 3: Inspected -> "Download Only"
                          if (stage === 'inspected') {
                            return (
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => generateSpecificationPDF(record, { isInspection: true })}
                                  title="Download Final Inspected Technical Specification PDF"
                                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </button>

                                {/* Cost Estimate */}
                                <button
                                  onClick={() => onCostEstimateRecord(record)}
                                  title="View or Edit Cost Estimate"
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg shadow-xs flex items-center space-x-1 transition-colors"
                                >
                                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Estimate</span>
                                </button>

                                <button
                                  onClick={() => onOpenRecord(record)}
                                  title="Open Document Preview"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => onDeleteRecord(record.id, record.document_name)}
                                  title="Delete specification permanently from Supabase database to free memory"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          }

                          // Stage 1 & 2: "two buttons one for evaluation and another for Inspection" + Estimate
                          return (
                            <div className="flex items-center justify-center space-x-2">
                              {/* Cost Estimate Button */}
                              <button
                                onClick={() => onCostEstimateRecord(record)}
                                title="Create or View Cost Estimate for this vehicle specification"
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs flex items-center space-x-1 transition-colors ${
                                  record.cost_estimate || record.content.costEstimate
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                                <span>Estimate</span>
                              </button>

                              {/* 1. Evaluation Button */}
                              <button
                                onClick={() => onEvaluateRecord(record)}
                                title="Evaluate Technical Bid"
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs flex items-center space-x-1 transition-colors ${
                                  stage === 'evaluated'
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                                }`}
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" />
                                <span>{stage === 'evaluated' ? 'Re-Evaluate' : 'Evaluate'}</span>
                              </button>

                              {/* 2. Inspection Button (Available once evaluated) */}
                              {stage === 'evaluated' ? (
                                <button
                                  onClick={() => onInspectRecord(record)}
                                  title="Perform Physical Vehicle Technical Inspection & Delivery Verification"
                                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs flex items-center space-x-1 transition-colors"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Inspect</span>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  title="Inspection unlocks once technical evaluation is saved"
                                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 rounded-md flex items-center space-x-1 cursor-not-allowed opacity-60"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Inspect</span>
                                </button>
                              )}

                              {/* Aux tools */}
                              <button
                                onClick={() => onOpenRecord(record)}
                                title="Open Document Preview"
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onEditRecord(record)}
                                title="Edit Specification"
                                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteRecord(record.id, record.document_name)}
                                title="Delete specification permanently from Supabase database to free memory"
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer summary bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {processedRecords.length} of {workRecords.length} records</span>
          <span className="text-[11px] text-slate-400">Database Table: public.work_records</span>
        </div>
      </div>
    </div>
  );
};
