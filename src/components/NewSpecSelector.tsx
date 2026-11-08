import React, { useState } from 'react';
import { 
  PlusCircle, 
  ArrowRight, 
  Layers, 
  CheckCircle, 
  Search, 
  Sparkles,
  FileText
} from 'lucide-react';
import { StandardSpecification, VehicleCategory, VEHICLE_CATEGORIES } from '../types/spec';

interface NewSpecSelectorProps {
  standards: StandardSpecification[];
  onSelectStandard: (standard: StandardSpecification) => void;
  onStartBlank: (category: VehicleCategory) => void;
}

export const NewSpecSelector: React.FC<NewSpecSelectorProps> = ({
  standards,
  onSelectStandard,
  onStartBlank,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const filteredStandards = standards.filter((std) => {
    const matchesCategory = selectedCategoryFilter === 'ALL' || std.category === selectedCategoryFilter;
    const matchesSearch =
      std.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm text-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Workflow Step 1 & 2
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">
          Select Vehicle Category & Baseline Standard
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1">
          Choose a standard specification from your library as your starting baseline. The editor will create a completely independent copy that can be tailored for your specific municipal or commercial assignment.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search baseline standards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Standards ({standards.length})
          </button>
          {VEHICLE_CATEGORIES.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Standards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStandards.map((std) => {
          const totalRows = std.content.sections.reduce((acc, s) => acc + s.rows.length, 0);

          return (
            <div
              key={std.id}
              onClick={() => onSelectStandard(std)}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(std.category)}`}>
                    {std.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">v{std.version}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {std.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {std.description || 'Predefined standard technical specification for procurement.'}
                </p>

                <div className="mt-4 flex items-center space-x-4 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>{std.content.sections.length} Sections</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{totalRows} Requirements</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Load into Editor & Customize</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Blank Option Box */}
      <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 text-center">
        <h3 className="text-sm font-bold text-slate-800">Need to create a custom vehicle category?</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Start from a clean slate and build your sections and technical rows from scratch.
        </p>
        <button
          onClick={() => onStartBlank('Other Vehicle')}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 shadow-xs inline-flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>Start with Blank Specification</span>
        </button>
      </div>
    </div>
  );
};
