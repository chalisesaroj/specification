import React, { useState } from 'react';
import { 
  X, 
  Save, 
  ClipboardPaste, 
  Layers, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { StandardSpecification, VehicleCategory, VEHICLE_CATEGORIES, SpecSection, SpecRow } from '../types/spec';
import { parseSpecificationText } from '../utils/textParser';

interface StandardEditorModalProps {
  standard?: StandardSpecification | null;
  initialMode?: 'form' | 'paste';
  onSave: (standard: StandardSpecification) => Promise<void>;
  onClose: () => void;
}

export const StandardEditorModal: React.FC<StandardEditorModalProps> = ({
  standard,
  initialMode = 'form',
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(standard);
  const [activeTab, setActiveTab] = useState<'form' | 'paste'>(initialMode);
  const [title, setTitle] = useState(standard?.title || '');
  const [category, setCategory] = useState<VehicleCategory>(standard?.category || 'Four Wheel Drive Vehicle');
  const [description, setDescription] = useState(standard?.description || '');
  const [version, setVersion] = useState(standard?.version || '1.0');
  const [pasteText, setPasteText] = useState(standard?.sourceText || '');
  const [sections, setSections] = useState<SpecSection[]>(() => {
    if (standard?.content?.sections) {
      return JSON.parse(JSON.stringify(standard.content.sections));
    }
    return [
      {
        id: 'sec-1',
        title: '1. General Requirements',
        order: 1,
        rows: [
          {
            id: 'row-1',
            itemNumber: '1',
            parameter: 'Vehicle Type',
            requirement: 'Brand new, Right Hand Drive utility vehicle.',
          },
        ],
      },
    ];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [parseNotice, setParseNotice] = useState('');

  // Handle parsing text from clipboard/textarea
  const handleParseText = () => {
    if (!pasteText.trim()) {
      alert('Please paste some specification text first.');
      return;
    }
    const parsedSections = parseSpecificationText(pasteText);
    if (parsedSections.length > 0) {
      setSections(parsedSections);
      setParseNotice(`Successfully parsed ${parsedSections.length} sections and ${parsedSections.reduce((acc, s) => acc + s.rows.length, 0)} parameters!`);
      setActiveTab('form');
    } else {
      alert('Could not parse structured sections from the text. Check formatting.');
    }
  };

  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    const currentTotalRows = sections.reduce((acc, s) => acc + s.rows.length, 0);
    setSections((prev) => [
      ...prev,
      {
        id: 'sec-' + Date.now().toString(36),
        title: `${nextOrder}. Technical Section`,
        order: nextOrder,
        rows: [
          {
            id: 'row-' + Date.now().toString(36),
            itemNumber: String(currentTotalRows + 1),
            parameter: 'Parameter',
            requirement: 'Specification requirement',
          },
        ],
      },
    ]);
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((s) => s.id !== secId));
  };

  const handleAddRow = (secId: string) => {
    setSections((prev) => {
      const currentTotalRows = prev.reduce((acc, s) => acc + s.rows.length, 0);
      return prev.map((sec) => {
        if (sec.id === secId) {
          return {
            ...sec,
            rows: [
              ...sec.rows,
              {
                id: 'row-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
                itemNumber: String(currentTotalRows + 1),
                parameter: '',
                requirement: '',
              },
            ],
          };
        }
        return sec;
      });
    });
  };

  const handleDeleteRow = (secId: string, rowId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === secId) {
          return { ...sec, rows: sec.rows.filter((r) => r.id !== rowId) };
        }
        return sec;
      })
    );
  };

  const handleRowChange = (secId: string, rowId: string, field: 'itemNumber' | 'parameter' | 'requirement', val: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === secId) {
          return {
            ...sec,
            rows: sec.rows.map((r) => (r.id === rowId ? { ...r, [field]: val } : r)),
          };
        }
        return sec;
      })
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a Title for this standard specification.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const stdToSave: StandardSpecification = {
        id: standard?.id || 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        category,
        description: description.trim(),
        version: version.trim() || '1.0',
        sourceText: pasteText.trim(),
        created_at: standard?.created_at || now,
        updated_at: now,
        content: {
          documentTitle: `Standard Technical Specification of ${title.trim()}`,
          organizationName: 'Standard Municipal Engineering Department',
          fiscalYear: '2083/84',
          vehicleCategory: category,
          vehicleDescription: description.trim() || `${category} standard configuration`,
          sections,
        },
      };

      await onSave(stdToSave);
      onClose();
    } catch (err: any) {
      alert('Error saving standard: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Standard Specification: ${standard?.title}` : 'Add New Standard Specification'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Structured vs Paste Source Text */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center space-x-4 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('form')}
            className={`py-2 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Structured Sections & Rows ({sections.reduce((a, s) => a + s.rows.length, 0)})</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2 px-1 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Paste Source Text</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {parseNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
              {parseNotice}
            </div>
          )}

          {/* Standard Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Standard Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Heavy Duty Four Wheel Drive Vehicle"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of vehicle type, application, and capacity..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0 or 2.1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {activeTab === 'paste' ? (
            /* Paste Source Text Mode */
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                <strong>Paste Procurement Source Text:</strong> Paste text copied from Word, PDF, or Excel sheets. 
                The parser will automatically detect headings, section numbers, item parameters, and technical requirements.
              </div>

              <textarea
                rows={12}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Example source text:

1. Engine & Transmission
1.1 Engine Type: 4-Cylinder Turbocharged Diesel with Intercooler
1.2 Displacement: Minimum 2,400 cc
1.3 Maximum Power: Minimum 130 HP @ 3,600 RPM
1.4 Transmission: Manual 5-speed forward, 1 reverse

2. Dimensions & Suspension
2.1 Ground Clearance: Minimum 210 mm
2.2 Seating Capacity: 7 to 9 persons including driver`}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse into Structured Sections</span>
                </button>
              </div>
            </div>
          ) : (
            /* Structured Form Mode */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Baseline Technical Sections ({sections.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Section</span>
                </button>
              </div>

              {sections.map((section, sIdx) => (
                <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-2.5 flex items-center justify-between border-b border-slate-200">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((s) => (s.id === section.id ? { ...s, title: e.target.value } : s))
                        )
                      }
                      className="font-bold text-xs text-slate-800 bg-white px-2 py-1 rounded border border-slate-300 w-2/3"
                    />
                    <div className="flex items-center space-x-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleAddRow(section.id)}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-blue-600 font-semibold rounded border border-slate-200"
                      >
                        + Row
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    {section.rows.map((row) => (
                      <div key={row.id} className="flex items-center space-x-2 text-xs">
                        <input
                          type="text"
                          value={row.itemNumber}
                          onChange={(e) => handleRowChange(section.id, row.id, 'itemNumber', e.target.value)}
                          className="w-14 font-mono text-center px-1.5 py-1 border border-slate-200 rounded"
                        />
                        <input
                          type="text"
                          value={row.parameter}
                          onChange={(e) => handleRowChange(section.id, row.id, 'parameter', e.target.value)}
                          placeholder="Technical Parameter"
                          className="w-1/3 px-2 py-1 border border-slate-200 rounded"
                        />
                        <input
                          type="text"
                          value={row.requirement}
                          onChange={(e) => handleRowChange(section.id, row.id, 'requirement', e.target.value)}
                          placeholder="Purchaser's Requirement"
                          className="flex-1 px-2 py-1 border border-slate-200 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(section.id, row.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500">
            {isEditing ? 'Updates reusable baseline in standard library' : 'Will be available as a starting document'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Standard' : 'Save Standard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
