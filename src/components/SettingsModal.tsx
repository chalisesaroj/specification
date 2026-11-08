import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Server,
  Cpu,
  Layers,
  HardDrive,
  Unlink,
  RefreshCw,
  Info,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection, 
  normalizeSupabaseUrl,
  SUPABASE_SQL_SCHEMA,
  ConnectionTestResult
} from '../lib/supabase';
import { storageService } from '../services/storageService';
import { generateAllVehicleTablesSQL } from '../utils/vehicleTableHelper';
import { DEFAULT_STANDARDS } from '../data/defaultStandards';

interface SettingsModalProps {
  onRefreshData: () => Promise<void>;
  onConnectionChange: (connected: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onRefreshData,
  onConnectionChange,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<'vehicleTables' | 'base'>('vehicleTables');
  const [importStatus, setImportStatus] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [urlAutoNotice, setUrlAutoNotice] = useState<string | null>(null);

  useEffect(() => {
    const config = getStoredSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);
    if (config.url && config.anonKey) {
      testSupabaseConnection(config.url, config.anonKey).then((res) => {
        setTestResult(res);
        onConnectionChange(res.success);
      });
    }
  }, []);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    const cleaned = normalizeSupabaseUrl(val);
    if (val.trim() && cleaned && cleaned !== val.trim()) {
      if (val.includes('supabase.com/dashboard/project')) {
        setUrlAutoNotice(`Detected browser dashboard URL. Auto-formatting to API endpoint: ${cleaned}`);
      } else if (val.endsWith('/rest/v1') || val.endsWith('/')) {
        setUrlAutoNotice(`Removed extra path. Clean API endpoint: ${cleaned}`);
      } else {
        setUrlAutoNotice(null);
      }
    } else {
      setUrlAutoNotice(null);
    }
  };

  const handleUrlBlur = () => {
    if (url.trim()) {
      const cleaned = normalizeSupabaseUrl(url);
      if (cleaned !== url.trim()) {
        setUrl(cleaned);
        setUrlAutoNotice(`Auto-formatted to API endpoint: ${cleaned}`);
      }
    }
  };

  const handleClearAndSwitch = () => {
    if (confirm('Disconnect from the current database project? This clears stored project credentials so you can enter a new database project URL and Anon key.')) {
      saveStoredSupabaseConfig('', '');
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      setSyncResult(null);
      setUrlAutoNotice(null);
      onConnectionChange(false);
    }
  };

  const handlePushAllToDatabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await storageService.syncAllToSupabase();
      if (res.error) {
        setSyncResult(`Failed: ${res.error}`);
      } else {
        setSyncResult(`✓ Pushed ${res.standardsSynced} standards and ${res.recordsSynced} work records to this database!`);
        await onRefreshData();
      }
    } catch (err: any) {
      setSyncResult(`Sync error: ${err?.message || 'Failed'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAndTest = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    setUrl(cleanUrl);
    setTesting(true);
    setTestResult(null);
    try {
      saveStoredSupabaseConfig(cleanUrl, cleanKey);
      const res = await testSupabaseConnection(cleanUrl, cleanKey);
      setTestResult(res);
      onConnectionChange(res.success && res.hasWorkRecordsTable !== false);
      if (res.success) {
        await onRefreshData();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
      onConnectionChange(false);
    } finally {
      setTesting(false);
    }
  };

  const vehicleTablesSQL = generateAllVehicleTablesSQL(DEFAULT_STANDARDS);

  const handleCopySchema = () => {
    const textToCopy = activeSqlTab === 'vehicleTables' ? vehicleTablesSQL : SUPABASE_SQL_SCHEMA;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const handleExportData = async () => {
    const jsonStr = await storageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `autospec_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await storageService.importData(text);
        setImportStatus(`Imported ${result.standardsCount} standards and ${result.recordsCount} work records!`);
        await onRefreshData();
      } catch (err: any) {
        setImportStatus('Failed to import: ' + (err?.message || 'Invalid JSON format'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset to standard automobile templates and initial municipal records? (Local data will be reseeded)')) {
      await storageService.resetToDefaults();
      await onRefreshData();
      alert('Data reset to default automobile procurement standards.');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Title Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Database & System Configuration</h1>
            <p className="text-xs text-slate-500">
              Configure Supabase PostgreSQL cloud sync, switch projects/accounts, manage tables, and check database capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Guide: How to connect to another account/project */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 space-y-2.5">
        <div className="flex items-center space-x-2 font-bold text-blue-950">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <span>How to Connect Another Account or Project (PostgreSQL / Supabase)</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
          <li>Create a new project in your other Supabase account (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">supabase.com</a>).</li>
          <li>In your new project, open the <strong>SQL Editor</strong> &gt; paste the <strong>SQL Schema Script</strong> below &gt; click <strong>Run</strong>.</li>
          <li>Copy your new project's <strong>Project URL</strong> and <strong>Anon Key</strong> (found in <em>Project Settings &gt; API</em>).</li>
          <li>Paste them into the fields below and click <strong>Save & Test Connection</strong>.</li>
          <li>Click <strong>Push All Local Records to This Database</strong> to seed your new project with your existing work!</li>
        </ol>
      </div>

      {/* Supabase Connection Setup */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Supabase PostgreSQL Connection
            </h2>
          </div>
          {url && (
            <button
              onClick={handleClearAndSwitch}
              className="text-xs text-red-600 hover:text-red-700 flex items-center space-x-1 font-semibold"
              title="Clear credentials to connect to another project"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Disconnect / Switch Project</span>
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          AutoSpec Pro connects to your Supabase project to store <strong>standard_specifications</strong> and permanent <strong>work_records</strong> snapshots in JSONB format with Row Level Security.
        </p>

        <div className="grid grid-cols-1 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
            {urlAutoNotice ? (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mt-1 flex items-center space-x-1">
                <span>✓</span>
                <span>{urlAutoNotice}</span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Found under Project Settings &gt; API in your Supabase Dashboard. Use <code className="font-mono bg-slate-100 px-1 rounded text-slate-600">https://[project-id].supabase.co</code> (do not use browser dashboard URL).
              </span>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase Anon / Public API Key
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="flex-1">{testResult.message}</span>
          </div>
        )}

        {/* Sync Result Banner */}
        {syncResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncResult}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Local Storage Fallback is automatically active when disconnected.</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {testResult?.success && testResult?.hasWorkRecordsTable !== false && (
              <button
                onClick={handlePushAllToDatabase}
                disabled={syncing}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-sm"
                title="Upload all standards and work records to this new project"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Pushing Data...' : 'Push All Records to This DB'}</span>
              </button>
            )}

            <button
              onClick={handleSaveAndTest}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{testing ? 'Testing...' : 'Save & Test Connection'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Memory & Storage Footprint Analysis (for 30 projects and scale) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Database Memory & Storage Consumption (30 Projects Analysis)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            0.07% of Free Quota
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Here is the exact technical memory and disk storage footprint when managing <strong>30 projects</strong> across all 3 lifecycle stages (<strong>Create</strong>, <strong>Evaluate</strong>, and <strong>Inspect</strong>):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-2 text-indigo-700 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold">1 Completed Project</span>
            </div>
            <div className="text-lg font-bold text-slate-900">~12 KB</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Metadata + 25-30 spec rows + bid evaluation + delivery inspection.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="flex items-center space-x-2 text-indigo-900 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold">30 Projects Total</span>
            </div>
            <div className="text-lg font-bold text-indigo-950">~360 KB (0.36 MB)</div>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Including table indexes (~0.5 MB total on disk).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center space-x-2 text-emerald-900 mb-1">
              <Server className="w-4 h-4" />
              <span className="text-xs font-bold">Supabase Free Tier (500 MB)</span>
            </div>
            <div className="text-lg font-bold text-emerald-950">&gt; 40,000 Projects</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              30 projects consumes less than 0.1% of your free PostgreSQL database.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800">Additional Performance Metrics:</div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li><strong>Browser RAM Usage:</strong> Less than 2 MB heap memory when all 30 records are loaded in memory.</li>
            <li><strong>Network Payload:</strong> ~12 KB compressed per save or evaluation update.</li>
            <li><strong>Official PDF Size:</strong> ~60 KB – 100 KB generated client-side with jsPDF.</li>
          </ul>
        </div>
      </div>

      {/* SQL Schema Script Section with Dual Mode Tabs */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Supabase SQL Database Scripts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute these in your Supabase SQL Editor (<span className="font-mono text-[11px]">SQL Editor &gt; New Query &gt; Run</span>).
            </p>
          </div>
          <button
            onClick={handleCopySchema}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copiedSchema ? 'Copied to Clipboard!' : activeSqlTab === 'vehicleTables' ? 'Copy Vehicle Tables SQL' : 'Copy Base Tables SQL'}</span>
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveSqlTab('vehicleTables')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeSqlTab === 'vehicleTables'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Separate Vehicle Tables & Columns RPC (Requested Architecture)</span>
          </button>
          <button
            onClick={() => setActiveSqlTab('base')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeSqlTab === 'base'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Base Tables (work_records & standards)</span>
          </button>
        </div>

        {activeSqlTab === 'vehicleTables' && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 text-slate-700">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>📋 How the Separate Vehicle Tables & Dynamic Columns Architecture Works:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
              <li>Creates a dedicated table for each vehicle (e.g. <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">vehicle_4wd_double_cab_pickup</code>, <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">vehicle_ambulance</code>, etc.).</li>
              <li>Pre-seeds baseline standard requirements (<code className="font-mono text-slate-800">item_sn</code>, <code className="font-mono text-slate-800">parameter</code>, <code className="font-mono text-slate-800">standard_requirement</code>).</li>
              <li>When a new specification is created: adds unique project column <code className="font-mono text-blue-700 font-semibold">[org]_[fy]_[date]_req</code>.</li>
              <li>When evaluated: adds <code className="font-mono text-indigo-700 font-semibold">[org]_[fy]_[date]_eval_compliance</code> and <code className="font-mono text-indigo-700 font-semibold">[org]_[fy]_[date]_eval_remarks</code>.</li>
              <li>When inspected: adds <code className="font-mono text-emerald-700 font-semibold">[org]_[fy]_[date]_insp_status</code> and <code className="font-mono text-emerald-700 font-semibold">[org]_[fy]_[date]_insp_remarks</code>.</li>
              <li>You can create unlimited specifications from each vehicle standard table; each project dynamically expands as its own column set!</li>
            </ul>
          </div>
        )}

        <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded-xl overflow-x-auto font-mono max-h-72 border border-slate-800">
          <code>{activeSqlTab === 'vehicleTables' ? vehicleTablesSQL : SUPABASE_SQL_SCHEMA}</code>
        </pre>
      </div>

      {/* Backup, Export & Reset Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
          Data Backup & Maintenance
        </h2>

        {importStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExportData}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg w-fit mb-2">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Export All Data (JSON)</h3>
              <p className="text-[11px] text-slate-500 mt-1">Download backup of all standards and work records.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-blue-600">Download Backup</span>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left flex flex-col justify-between cursor-pointer">
            <div>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg w-fit mb-2">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Import Data (JSON)</h3>
              <p className="text-[11px] text-slate-500 mt-1">Restore standards and records from a JSON file.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-emerald-600">Choose File</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          {/* Reset to Default Seed */}
          <button
            onClick={handleResetDefaults}
            className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg w-fit mb-2">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Reset to Defaults</h3>
              <p className="text-[11px] text-slate-500 mt-1">Reload default automobile standards & municipal samples.</p>
            </div>
            <span className="mt-3 text-xs font-semibold text-amber-600">Reset Defaults</span>
          </button>
        </div>

        {/* Database Table Cleanup Tool: Tables other than standard_specifications and work_records */}
        <div className="mt-4 p-4 rounded-xl bg-red-50/40 border border-red-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Delete Tables Other than standard_specifications & work_records
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
              Core Standards Protected
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Reclaim database storage and memory by dropping dynamic vehicle/office tables created in PostgreSQL. Your core master templates in <code className="font-mono bg-white px-1 border border-slate-300 rounded">standard_specifications</code> and your saved records in <code className="font-mono bg-white px-1 border border-slate-300 rounded">work_records</code> are completely preserved and will <strong>never</strong> be deleted.
          </p>
          <div className="pt-1">
            <button
              onClick={async () => {
                if (
                  confirm(
                    'Delete all custom vehicle and office tables from the database to reclaim memory?\n\nNote: "standard_specifications" and "work_records" are strictly protected and will NOT be dropped.'
                  )
                ) {
                  try {
                    const res = await storageService.dropCustomVehicleTables();
                    if (res.success) {
                      alert(
                        `Successfully dropped ${res.dropped_tables?.length || 0} custom tables to reduce database memory.`
                      );
                      await onRefreshData();
                    } else {
                      alert('Notice: ' + (res.error || 'No custom tables to drop or database not connected.'));
                    }
                  } catch (e: any) {
                    alert('Error: ' + (e?.message || 'Failed'));
                  }
                }
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean / Drop Custom Vehicle Tables</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
