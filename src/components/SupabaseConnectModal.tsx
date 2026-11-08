import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Key, 
  Globe, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection, 
  normalizeSupabaseUrl,
  SUPABASE_SQL_SCHEMA,
  ConnectionTestResult
} from '../lib/supabase';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  onContinueOffline?: () => void;
  actionReason?: string; // e.g. "Save specification to Supabase"
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  onContinueOffline,
  actionReason,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [urlAutoNotice, setUrlAutoNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setTestResult(null);
      setUrlAutoNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        setUrlAutoNotice(`Auto-formatted to: ${cleaned}`);
      }
    }
  };

  const handleTestAndSave = async () => {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Please provide both the Supabase Project URL and Anon Key.',
      });
      return;
    }

    setUrl(cleanUrl);
    setTesting(true);
    setTestResult(null);

    try {
      saveStoredSupabaseConfig(cleanUrl, cleanKey);
      const res = await testSupabaseConnection(cleanUrl, cleanKey);
      setTestResult(res);

      if (res.success && res.hasWorkRecordsTable !== false) {
        setTimeout(() => {
          onConnected();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to connect to Supabase.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connect Supabase Database
              </h2>
              <p className="text-xs text-slate-500">
                {actionReason || 'Push specifications and work records directly to your Supabase PostgreSQL cloud table.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600 space-y-1.5">
            <p>
              AutoSpec Pro runs directly against Supabase as Backend-as-a-Service (BaaS). To push and store your vehicle specifications in the cloud database, enter your Supabase project credentials below.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Supabase Project URL</span>
                </label>
                {(url || anonKey) && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('');
                      setAnonKey('');
                      setTestResult(null);
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 underline"
                  >
                    Clear / Switch to Another Project
                  </button>
                )}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              {urlAutoNotice ? (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mt-1 flex items-center space-x-1">
                  <span>✓</span>
                  <span>{urlAutoNotice}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found in Supabase Dashboard &gt; Project Settings &gt; API. Use <code className="font-mono bg-slate-100 px-1 rounded text-slate-600">https://[id].supabase.co</code> (not dashboard URL).
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Anon / Public API Key</span>
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The public anon key safe for browser client requests.
              </span>
            </div>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs space-y-2 border ${
                testResult.success && testResult.hasWorkRecordsTable !== false
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {testResult.success && testResult.hasWorkRecordsTable !== false ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium">{testResult.message}</div>
              </div>

              {testResult.hasWorkRecordsTable === false && (
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                  <span>Tables need to be created in your Supabase SQL editor:</span>
                  <button
                    onClick={handleCopySchema}
                    className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 flex items-center space-x-1 text-[10px]"
                  >
                    {copiedSchema ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collapsible SQL Script instructions */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors"
            >
              <span className="flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-slate-500" />
                <span>Supabase SQL Setup Script (Create Tables & RLS)</span>
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                {showSql ? 'Hide Script' : 'View Script'}
              </span>
            </button>

            {showSql && (
              <div className="p-3 bg-slate-900 text-slate-200 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Paste into Supabase SQL Editor:</span>
                  <button
                    onClick={handleCopySchema}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-medium flex items-center space-x-1"
                  >
                    {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono max-h-40 overflow-y-auto leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {onContinueOffline ? (
            <button
              onClick={() => {
                onContinueOffline();
                onClose();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline order-2 sm:order-1"
            >
              Save to Local Storage Only (Offline)
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={testing || !url.trim() || !anonKey.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{testing ? 'Testing & Connecting...' : 'Connect & Push to Supabase'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
