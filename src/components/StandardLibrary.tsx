import React, { useState } from 'react';
import { 
  FileText, 
  PlusCircle, 
  ClipboardPaste, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StandardSpecification, VehicleCategory, VEHICLE_CATEGORIES } from '../types/spec';
import { getVehicleTableName } from '../utils/vehicleTableHelper';

interface StandardLibraryProps {
  standards: StandardSpecification[];
  onCreateNewFromStandard: (standard: StandardSpecification) => void;
  onEditStandard: (standard: StandardSpecification) => void;
  onAddNewStandard: () => void;
  onPasteSourceText: () => void;
  onDeleteStandard: (id: string, title: string) => void;
  onPreviewStandard: (standard: StandardSpecification) => void;
}

export const StandardLibrary: React.FC<StandardLibraryProps> = ({
  standards,
  onCreateNewFromStandard,
  onEditStandard,
  onAddNewStandard,
  onPasteSourceText,
  onDeleteStandard,
  onPreviewStandard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredStandards = standards.filter((std) => {
    const matchesCategory = selectedCategory === 'ALL' || std.category === selectedCategory;
    const matchesSearch =
      std.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.content.sections.some((sec) =>
        sec.rows.some((r) => r.parameter.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    return matchesCategory && matchesSearch;
  });

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
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Standard Specifications Library</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            These are your original reusable baseline templates. Selecting a standard lets you create an independent work record.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onPasteSourceText}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1.5 border border-slate-300"
          >
            <ClipboardPaste className="w-4 h-4 text-slate-600" />
            <span>Paste Source Text</span>
          </button>

          <button
            onClick={onAddNewStandard}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Standard Specification</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search standards by vehicle, component, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({standards.length})
          </button>
          {VEHICLE_CATEGORIES.map((cat) => {
            const count = standards.filter((s) => s.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Standards Grid */}
      {filteredStandards.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Standard Specifications Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'Try adjusting your search criteria or filter to locate the required automobile standard.'
              : 'Add your first standard specification or paste source text to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStandards.map((standard) => {
            const totalRows = standard.content.sections.reduce(
              (acc, sec) => acc + sec.rows.length,
              0
            );

            return (
              <div
                key={standard.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Category & Version */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                        standard.category
                      )}`}
                    >
                      {standard.category}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      v{standard.version}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {standard.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {standard.description || 'Standard technical specifications for automobile procurement.'}
                  </p>

                  {/* Summary Badges */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>{standard.content.sections.length} Sections</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{totalRows} Parameters</span>
                    </div>
                  </div>

                  {/* Database Table Name */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    <span className="text-slate-400 font-sans text-[10px] uppercase font-semibold">DB Table:</span>
                    <span className="font-semibold text-blue-700 truncate max-w-[180px]">{getVehicleTableName(standard.category)}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex flex-col space-y-2">
                  {/* Primary Action: Create New Specification */}
                  <button
                    onClick={() => onCreateNewFromStandard(standard)}
                    className="w-full py-2 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm group"
                  >
                    <span>Create New Specification</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Secondary Utility Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
                    <button
                      onClick={() => onPreviewStandard(standard)}
                      className="hover:text-blue-600 flex items-center space-x-1 py-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onEditStandard(standard)}
                      className="hover:text-emerald-600 flex items-center space-x-1 py-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Standard</span>
                    </button>

                    <button
                      onClick={() => onDeleteStandard(standard.id, standard.title)}
                      className="hover:text-red-600 flex items-center space-x-1 py-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
