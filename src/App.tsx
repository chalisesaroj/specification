/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from './components/Navigation';
import { Trash2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StandardLibrary } from './components/StandardLibrary';
import { WorkRecords } from './components/WorkRecords';
import { NewSpecSelector } from './components/NewSpecSelector';
import { SpecEditor } from './components/SpecEditor';
import { DocumentViewer } from './components/DocumentViewer';
import { StandardEditorModal } from './components/StandardEditorModal';
import { SettingsModal } from './components/SettingsModal';
import { CostEstimateEditor } from './components/CostEstimateEditor';
import { storageService, SaveWorkRecordResult } from './services/storageService';
import { getStoredSupabaseConfig, testSupabaseConnection } from './lib/supabase';
import { 
  StandardSpecification, 
  WorkRecord, 
  SpecContent, 
  VehicleCategory,
  CostEstimateData
} from './types/spec';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [standards, setStandards] = useState<StandardSpecification[]>([]);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Cost Estimate state
  const [costEstimateRecord, setCostEstimateRecord] = useState<WorkRecord | null>(null);

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editorMode, setEditorMode] = useState<'specification' | 'evaluate' | 'inspect'>('specification');
  const [activeEditingRecordId, setActiveEditingRecordId] = useState<string | undefined>(undefined);
  const [activeStandardSpecId, setActiveStandardSpecId] = useState<string | undefined>(undefined);
  const [activeStandardTitle, setActiveStandardTitle] = useState<string | undefined>(undefined);
  const [activeEditingContent, setActiveEditingContent] = useState<SpecContent | null>(null);
  const [activeEditingDocName, setActiveEditingDocName] = useState<string | undefined>(undefined);

  // Modal states
  const [viewingDoc, setViewingDoc] = useState<WorkRecord | StandardSpecification | null>(null);
  const [standardModalOpen, setStandardModalOpen] = useState(false);
  const [standardToEdit, setStandardToEdit] = useState<StandardSpecification | null>(null);
  const [standardModalMode, setStandardModalMode] = useState<'form' | 'paste'>('form');

  // In-App Delete Confirmation Modal State (Reliable across iframes)
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [loadedStandards, loadedRecords] = await Promise.all([
        storageService.getStandards(),
        storageService.getWorkRecords(),
      ]);
      setStandards(loadedStandards);
      setWorkRecords(loadedRecords);

      // Check Supabase connection
      const { url, anonKey } = getStoredSupabaseConfig();
      if (url && anonKey) {
        const testRes = await testSupabaseConnection(url, anonKey);
        setIsSupabaseConnected(testRes.success && testRes.hasWorkRecordsTable !== false);
      } else {
        setIsSupabaseConnected(false);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Workflow Action: Select vehicle standard -> load into editor as independent copy
  const handleCreateNewFromStandard = (standard: StandardSpecification) => {
    // 1. Retrieve selected standard specification
    // 2. Create an independent deep copy in editor
    const independentCopy: SpecContent = JSON.parse(JSON.stringify(standard.content));
    setActiveEditingContent(independentCopy);
    setActiveStandardSpecId(standard.id);
    setActiveStandardTitle(standard.title);
    setActiveEditingRecordId(undefined); // New record
    setActiveEditingDocName('');
    setEditorMode('specification');
    setIsEditing(true);
  };

  // Start with blank template
  const handleStartBlank = (category: VehicleCategory) => {
    const blankContent: SpecContent = {
      documentTitle: `Technical Specification of ${category}`,
      organizationName: 'Pokhara Metropolitan City',
      fiscalYear: '2083/84',
      vehicleCategory: category,
      vehicleDescription: `${category} standard configuration`,
      sections: [
        {
          id: 'sec-1',
          title: '1. General & Operational Requirements',
          order: 1,
          rows: [
            {
              id: 'row-1',
              itemNumber: '1',
              parameter: 'Vehicle Type',
              requirement: `Brand new ${category}, current manufacture year.`,
              compliance: 'Complied',
            },
          ],
        },
      ],
    };
    setActiveEditingContent(blankContent);
    setActiveStandardSpecId(undefined);
    setActiveStandardTitle(undefined);
    setActiveEditingRecordId(undefined);
    setActiveEditingDocName('');
    setEditorMode('specification');
    setIsEditing(true);
  };

  // Open record (view snapshot)
  const handleOpenRecord = (record: WorkRecord) => {
    setViewingDoc(record);
  };

  // Edit existing record (edits that record only)
  const handleEditRecord = (record: WorkRecord) => {
    // Retrieve its saved customized content, not the latest standard
    const independentSnapshot: SpecContent = JSON.parse(JSON.stringify(record.content));
    setActiveEditingContent(independentSnapshot);
    setActiveStandardSpecId(record.standard_spec_id);
    setActiveStandardTitle(record.standard_spec_title);
    setActiveEditingRecordId(record.id);
    setActiveEditingDocName(record.document_name);
    setViewingDoc(null);
    setEditorMode('specification');
    setIsEditing(true);
  };

  // Evaluate existing record (bid evaluation with make, model, tender ref & compliance)
  const handleEvaluateRecord = (record: WorkRecord) => {
    const independentSnapshot: SpecContent = JSON.parse(JSON.stringify(record.content));
    setActiveEditingContent(independentSnapshot);
    setActiveStandardSpecId(record.standard_spec_id);
    setActiveStandardTitle(record.standard_spec_title);
    setActiveEditingRecordId(record.id);
    setActiveEditingDocName(record.document_name);
    setViewingDoc(null);
    setEditorMode('evaluate');
    setIsEditing(true);
  };

  // Inspect existing record (physical vehicle delivery inspection)
  const handleInspectRecord = (record: WorkRecord) => {
    const independentSnapshot: SpecContent = JSON.parse(JSON.stringify(record.content));
    setActiveEditingContent(independentSnapshot);
    setActiveStandardSpecId(record.standard_spec_id);
    setActiveStandardTitle(record.standard_spec_title);
    setActiveEditingRecordId(record.id);
    setActiveEditingDocName(record.document_name);
    setViewingDoc(null);
    setEditorMode('inspect');
    setIsEditing(true);
  };

  // Duplicate record
  const handleDuplicateRecord = async (id: string) => {
    try {
      const duplicated = await storageService.duplicateWorkRecord(id);
      if (duplicated) {
        const updatedList = await storageService.getWorkRecords();
        setWorkRecords(updatedList);
        showNotification(`Duplicated "${duplicated.document_name}" as an independent record.`);
      }
    } catch (err: any) {
      alert('Failed to duplicate record: ' + (err?.message || ''));
    }
  };

  // Trigger In-App Delete Confirmation Modal (100% reliable inside iframes)
  const handleDeleteRecord = (id: string, name?: string) => {
    setRecordToDelete({ id, name: name || 'Specification Record' });
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeletingRecord(true);
    const { id, name } = recordToDelete;
    try {
      const res = await storageService.deleteWorkRecord(id);
      const updatedList = await storageService.getWorkRecords();
      setWorkRecords(updatedList);
      setRecordToDelete(null);
      if (viewingDoc && viewingDoc.id === id) {
        setViewingDoc(null);
      }
      if (res.deletedFromSupabase) {
        showNotification(`✓ Permanently deleted "${name}" from database and freed memory.`);
      } else {
        showNotification(`Deleted "${name}" from local records.`);
      }
    } catch (err: any) {
      showNotification(`Failed to delete record: ${err?.message || 'Error'}`);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // Save Work Record: pushes directly to Supabase BaaS, fetches updated records from database, and displays in My Work Records
  const handleSaveWorkRecord = async (record: WorkRecord): Promise<SaveWorkRecordResult> => {
    try {
      const result = await storageService.saveWorkRecord(record);
      // Fetch latest data directly from the database
      const updatedList = await storageService.getWorkRecords();
      setWorkRecords(updatedList);
      setActiveEditingRecordId(result.record.id);
      setActiveEditingDocName(result.record.document_name);

      if (result.syncedToSupabase) {
        const colNote = result.vehicleTable && result.columnPrefix 
          ? ` (Synced to table "${result.vehicleTable}" as column "${result.columnPrefix}_req")` 
          : '';
        showNotification(`✓ Successfully saved "${result.record.document_name}"!${colNote}`);
        setIsEditing(false);
        setCurrentTab('work-records');
      } else if (result.isTableMissing) {
        showNotification(`⚠️ Saved locally, but Supabase table "work_records" is missing. Please run the SQL schema in Supabase.`);
      } else if (result.supabaseError) {
        showNotification(`⚠️ Saved locally, but Supabase rejected sync: ${result.supabaseError}`);
      } else if (!result.supabaseConfigured) {
        showNotification(`Saved "${result.record.document_name}" to Local Storage. Supabase is not connected yet.`);
        setIsEditing(false);
        setCurrentTab('work-records');
      }
      return result;
    } catch (err: any) {
      console.error('Save to database error:', err);
      showNotification(`Failed to save to database: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  // Cost Estimate saving handler
  const handleSaveCostEstimate = async (recordId: string, estimate: CostEstimateData) => {
    try {
      const result = await storageService.saveCostEstimate(recordId, estimate);
      const updatedList = await storageService.getWorkRecords();
      setWorkRecords(updatedList);
      showNotification('✓ Cost Estimate saved! Rate & Quantity pushed to database table.');
      return result;
    } catch (err: any) {
      console.error('Save cost estimate error:', err);
      showNotification(`Failed to save estimate: ${err?.message || 'Error'}`);
      throw err;
    }
  };

  // Section E: Update Standard Specification (Requires Confirmation)
  const handleUpdateStandardSpecification = async (standardId: string, updatedContent: SpecContent) => {
    const currentStd = standards.find((s) => s.id === standardId);
    if (!currentStd) return;

    const nextVer = (parseFloat(currentStd.version || '1.0') + 0.1).toFixed(1);
    const updatedStd: StandardSpecification = {
      ...currentStd,
      version: nextVer,
      content: JSON.parse(JSON.stringify(updatedContent)),
      updated_at: new Date().toISOString(),
    };

    await storageService.saveStandard(updatedStd);
    const updatedStandards = await storageService.getStandards();
    setStandards(updatedStandards);
    showNotification(`Updated standard specification "${updatedStd.title}" (v${nextVer}) in standard library.`);
  };

  // Section E: Save as New Standard
  const handleSaveAsNewStandard = async (title: string, category: VehicleCategory, content: SpecContent) => {
    const newStd: StandardSpecification = {
      id: 'std-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      title,
      category,
      description: content.vehicleDescription || `${category} specification template`,
      version: '1.0',
      content: JSON.parse(JSON.stringify(content)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await storageService.saveStandard(newStd);
    const updatedStandards = await storageService.getStandards();
    setStandards(updatedStandards);
    showNotification(`Created new standard "${newStd.title}" in library!`);
  };

  // Standard library management
  const handleAddNewStandard = () => {
    setStandardToEdit(null);
    setStandardModalMode('form');
    setStandardModalOpen(true);
  };

  const handlePasteSourceText = () => {
    setStandardToEdit(null);
    setStandardModalMode('paste');
    setStandardModalOpen(true);
  };

  const handleEditStandardDirectly = (standard: StandardSpecification) => {
    setStandardToEdit(standard);
    setStandardModalMode('form');
    setStandardModalOpen(true);
  };

  const handleDeleteStandard = async (id: string, title: string) => {
    if (confirm(`Delete standard specification "${title}"? Historical work records will remain safely preserved.`)) {
      try {
        await storageService.deleteStandard(id);
        const updated = await storageService.getStandards();
        setStandards(updated);
        showNotification(`Deleted standard "${title}".`);
      } catch (err: any) {
        alert('Failed to delete standard: ' + (err?.message || ''));
      }
    }
  };

  const handleSaveStandardFromModal = async (standard: StandardSpecification) => {
    await storageService.saveStandard(standard);
    const updated = await storageService.getStandards();
    setStandards(updated);
    showNotification(`Standard specification "${standard.title}" saved.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setIsEditing(false);
          setCurrentTab(tab);
        }}
        isSupabaseConnected={isSupabaseConnected}
        workRecordsCount={workRecords.length}
        standardsCount={standards.length}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-slate-700">Loading AutoSpec Pro Database...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving standard specifications and work history</p>
          </div>
        ) : costEstimateRecord ? (
          /* Active Cost Estimate Editor */
          <CostEstimateEditor
            record={costEstimateRecord}
            onSave={handleSaveCostEstimate}
            onClose={() => setCostEstimateRecord(null)}
          />
        ) : isEditing && activeEditingContent ? (
          /* Active Specification Editor */
          <SpecEditor
            initialContent={activeEditingContent}
            mode={editorMode}
            standardSpecId={activeStandardSpecId}
            standardSpecTitle={activeStandardTitle}
            existingRecordId={activeEditingRecordId}
            initialDocumentName={activeEditingDocName}
            isSupabaseConnected={isSupabaseConnected}
            onRefreshConnection={async () => {
              const { url, anonKey } = getStoredSupabaseConfig();
              if (url && anonKey) {
                const testRes = await testSupabaseConnection(url, anonKey);
                setIsSupabaseConnected(testRes.success && testRes.hasWorkRecordsTable !== false);
              }
            }}
            onSaveWorkRecord={handleSaveWorkRecord}
            onDeleteRecord={handleDeleteRecord}
            onUpdateStandardSpecification={handleUpdateStandardSpecification}
            onSaveAsNewStandard={handleSaveAsNewStandard}
            onCancel={() => {
              setIsEditing(false);
              setCurrentTab('work-records');
            }}
            availableStandards={standards}
          />
        ) : (
          /* Normal Tab Navigation */
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                standards={standards}
                workRecords={workRecords}
                onSelectStandardForNewRecord={handleCreateNewFromStandard}
                onOpenRecord={handleOpenRecord}
                onEditRecord={handleEditRecord}
                onNavigate={(tab) => {
                  if (tab === 'new-spec') {
                    setCurrentTab('new-spec');
                  } else {
                    setCurrentTab(tab);
                  }
                }}
              />
            )}

            {currentTab === 'standards' && (
              <StandardLibrary
                standards={standards}
                onCreateNewFromStandard={handleCreateNewFromStandard}
                onEditStandard={handleEditStandardDirectly}
                onAddNewStandard={handleAddNewStandard}
                onPasteSourceText={handlePasteSourceText}
                onDeleteStandard={handleDeleteStandard}
                onPreviewStandard={(std) => setViewingDoc(std)}
              />
            )}

            {currentTab === 'work-records' && (
              <WorkRecords
                workRecords={workRecords}
                onOpenRecord={handleOpenRecord}
                onEditRecord={handleEditRecord}
                onEvaluateRecord={handleEvaluateRecord}
                onInspectRecord={handleInspectRecord}
                onCostEstimateRecord={(record) => setCostEstimateRecord(record)}
                onDuplicateRecord={handleDuplicateRecord}
                onDeleteRecord={handleDeleteRecord}
                onNavigateToNew={() => setCurrentTab('new-spec')}
              />
            )}

            {currentTab === 'new-spec' && (
              <NewSpecSelector
                standards={standards}
                onSelectStandard={handleCreateNewFromStandard}
                onStartBlank={handleStartBlank}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsModal
                onRefreshData={loadInitialData}
                onConnectionChange={(conn) => setIsSupabaseConnected(conn)}
              />
            )}
          </>
        )}
      </main>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onEdit={() => {
            if ('document_name' in viewingDoc) {
              handleEditRecord(viewingDoc as WorkRecord);
            } else {
              handleCreateNewFromStandard(viewingDoc as StandardSpecification);
            }
          }}
          onDelete={() => {
            if ('document_name' in viewingDoc) {
              handleDeleteRecord(viewingDoc.id, (viewingDoc as WorkRecord).document_name);
            }
          }}
          onCostEstimate={() => {
            if ('document_name' in viewingDoc) {
              const rec = viewingDoc as WorkRecord;
              setViewingDoc(null);
              setCostEstimateRecord(rec);
            }
          }}
        />
      )}

      {/* Standard Editor / Paste Source Modal */}
      {standardModalOpen && (
        <StandardEditorModal
          standard={standardToEdit}
          initialMode={standardModalMode}
          onSave={handleSaveStandardFromModal}
          onClose={() => setStandardModalOpen(false)}
        />
      )}

      {/* In-App Delete Confirmation Modal (100% reliable inside sandbox iframes) */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Specification</h3>
                <p className="text-xs text-slate-500">Permanently delete from database & free memory</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900 text-xs">
                  {recordToDelete.name}
                </p>
              </div>
              <p>
                This will permanently delete this created specification, all bidder evaluations, inspection data, and cost estimates from the database, and remove all project columns from the vehicle's table.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-start space-x-2">
                <span className="font-bold shrink-0">✓ Safety Guarantee:</span>
                <span>Master standard specifications for this vehicle are <strong>NEVER</strong> deleted and remain 100% safe.</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={confirmDeleteRecord}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeletingRecord ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete from Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
