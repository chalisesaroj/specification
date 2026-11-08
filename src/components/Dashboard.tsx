import React from 'react';
import { 
  FileText, 
  History, 
  Building2, 
  Calendar, 
  ArrowRight, 
  Download, 
  Edit3, 
  Eye, 
  PlusCircle, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StandardSpecification, WorkRecord, VehicleCategory, VEHICLE_CATEGORIES } from '../types/spec';
import { generateSpecificationPDF } from '../utils/pdfGenerator';

interface DashboardProps {
  standards: StandardSpecification[];
  workRecords: WorkRecord[];
  onSelectStandardForNewRecord: (standard: StandardSpecification) => void;
  onOpenRecord: (record: WorkRecord) => void;
  onEditRecord: (record: WorkRecord) => void;
  onNavigate: (tab: 'standards' | 'work-records' | 'new-spec' | 'settings') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  standards,
  workRecords,
  onSelectStandardForNewRecord,
  onOpenRecord,
  onEditRecord,
  onNavigate,
}) => {
  // Compute metrics
  const uniqueOrgs = Array.from(new Set(workRecords.map((r) => r.organization_name).filter(Boolean)));
  const uniqueFiscalYears = Array.from(new Set(workRecords.map((r) => r.fiscal_year).filter(Boolean)));

  // Recently saved records (sorted by created_at desc)
  const recentlySaved = [...workRecords]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Recently modified records (sorted by updated_at desc)
  const recentlyModified = [...workRecords]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const getCategoryColor = (cat: VehicleCategory) => {
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

  const handleQuickCreateByCategory = (category: VehicleCategory) => {
    const match = standards.find((s) => s.category === category) || standards[0];
    if (match) {
      onSelectStandardForNewRecord(match);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / Workflow Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/30">
            <ShieldCheck className="w-4 h-4" />
            <span>Professional Mechanical & Automobile Engineering Workflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Automobile Technical Specification Generator
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Standard specification library and permanent work-history management. Select your standard starting document, 
            customize for your specific procurement or assignment, and preserve an independent snapshot.
          </p>
        </div>

        {/* 5-Step Visual Workflow */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Standard Engineering Documentation Workflow:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
              <span className="font-medium text-slate-200">Select Category</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
              <span className="font-medium text-slate-200">Load Standard</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
              <span className="font-medium text-slate-200">Customize Spec</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">4</span>
              <span className="font-medium text-emerald-300">Save Work Record</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">5</span>
              <span className="font-medium text-slate-200">Download PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigate('standards')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard Specs</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{standards.length}</p>
          <div className="mt-2 flex items-center text-xs text-blue-600 font-medium">
            <span>Browse library templates</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('work-records')}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Work Records</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{workRecords.length}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
            <span>View historical records</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Organizations</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{uniqueOrgs.length}</p>
          <p className="mt-2 text-xs text-slate-500">
            {uniqueOrgs.slice(0, 2).join(', ') || 'No clients recorded yet'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fiscal Years</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{uniqueFiscalYears.length || 1}</p>
          <p className="mt-2 text-xs text-slate-500">
            Active: {uniqueFiscalYears.join(', ') || 'Current FY'}
          </p>
        </div>
      </div>

      {/* Quick Category Launchpad */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Start New Assignment from Vehicle Standard</h2>
            <p className="text-xs text-slate-500">Select an automobile category to load its standard specification directly into the editor.</p>
          </div>
          <button
            onClick={() => onNavigate('new-spec')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {VEHICLE_CATEGORIES.slice(0, 8).map((cat) => {
            const std = standards.find((s) => s.category === cat);
            const recordsCount = workRecords.filter((r) => r.vehicle_category === cat).length;
            return (
              <div
                key={cat}
                onClick={() => handleQuickCreateByCategory(cat)}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getCategoryColor(cat)}`}>
                      {cat.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {recordsCount} records
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {cat}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {std?.title || 'Standard Template'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-600">
                  <span>Create Spec</span>
                  <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Section: Recently Saved Work Records & Recently Modified Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Saved Records */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Recently Saved Work Records</h2>
              </div>
              <button
                onClick={() => onNavigate('work-records')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View all ({workRecords.length})
              </button>
            </div>

            {recentlySaved.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No work records saved yet. Create your first assignment specification.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentlySaved.map((record) => (
                  <div key={record.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                    <div className="pr-2 min-w-0 flex-1">
                      <h3 
                        onClick={() => onOpenRecord(record)}
                        className="text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {record.document_name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">{record.organization_name}</span>
                        <span>•</span>
                        <span>FY {record.fiscal_year}</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {new Date(record.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => onOpenRecord(record)}
                        title="View Document"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditRecord(record)}
                        title="Edit Record"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateSpecificationPDF(record)}
                        title="Download PDF"
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('work-records')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg text-center transition-colors"
            >
              Go to Full Work Record History Table
            </button>
          </div>
        </div>

        {/* Recently Modified Documents */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Recently Modified Documents</h2>
              </div>
              <span className="text-xs text-slate-400">Latest revisions</span>
            </div>

            {recentlyModified.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No modified documents to display.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentlyModified.map((record) => (
                  <div key={record.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                    <div className="pr-2 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getCategoryColor(record.vehicle_category)}`}>
                          {record.vehicle_category.split(' ')[0]}
                        </span>
                        <h3 
                          onClick={() => onEditRecord(record)}
                          className="text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {record.document_name}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                        <span>Updated: {new Date(record.updated_at).toLocaleDateString()} {new Date(record.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{record.content.sections.reduce((acc, s) => acc + s.rows.length, 0)} specs</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => onEditRecord(record)}
                        className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('standards')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg text-center transition-colors shadow-sm"
            >
              + Create New Technical Specification from Standard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
