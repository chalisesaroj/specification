import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'autospec_supabase_url';
const STORAGE_KEY_KEY = 'autospec_supabase_anon_key';

/**
 * Normalizes any Supabase URL provided by the user.
 * Eliminates "invalid path specified in requested url" errors caused by:
 * - Pasting dashboard URL from browser (e.g. https://supabase.com/dashboard/project/<ref>)
 * - Appending /rest/v1, /auth/v1, or /editor
 * - Trailing slashes
 * - Pasting only the 20-character project ref ID
 * - Pasting PostgreSQL connection strings containing the project ref
 */
export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();

  // Strip wrapping quotes if user pasted with quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');

  // 1. Check if user pasted Supabase dashboard URL from browser:
  // e.g. https://supabase.com/dashboard/project/abcxyz12345/settings/api
  // or supabase.com/dashboard/project/abcxyz12345
  const dashboardMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?supabase\.com\/(?:dashboard\/)?project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // 2. Check if user pasted database pooler or direct DB host:
  // e.g. postgresql://postgres.abcxyz12345:... or db.abcxyz12345.supabase.co
  const dbMatch = cleaned.match(/(?:db\.|postgres\.)([a-z0-9_-]+)\.supabase\.co/i);
  if (dbMatch && dbMatch[1]) {
    return `https://${dbMatch[1]}.supabase.co`;
  }

  // 3. If user pasted just the project reference ID (e.g. "whcbvquwvyeprvtqgtyl")
  if (/^[a-z0-9_-]{15,30}$/i.test(cleaned) && !cleaned.includes('.') && !cleaned.includes('/')) {
    return `https://${cleaned}.supabase.co`;
  }

  // 4. Ensure protocol is https://
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    // If domain is supabase.com (e.g. app.supabase.com/project/xyz)
    if (parsed.hostname.endsWith('supabase.com')) {
      const match = parsed.pathname.match(/project\/([a-z0-9_-]+)/i);
      if (match && match[1]) {
        return `https://${match[1]}.supabase.co`;
      }
    }

    // Always strip subpaths like /rest/v1, /rest, /auth/v1, /editor, trailing slash
    // createClient only expects the origin base URL: https://[ref].supabase.co
    return parsed.origin;
  } catch {
    // Fallback regex cleaning
    return cleaned
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/auth\/v1\/?$/i, '')
      .replace(/\/+$/, '');
  }
}

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : '';

  const rawUrl = (storedUrl || envUrl || '').trim();
  const normalizedUrl = normalizeSupabaseUrl(rawUrl);

  // Auto-heal localStorage if the stored URL was malformed with dashboard path or /rest/v1
  if (typeof window !== 'undefined' && storedUrl && normalizedUrl && storedUrl.trim() !== normalizedUrl) {
    localStorage.setItem(STORAGE_KEY_URL, normalizedUrl);
  }

  return {
    url: normalizedUrl,
    anonKey: (storedKey || envKey || '').trim(),
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    const normalizedUrl = normalizeSupabaseUrl(url);
    if (normalizedUrl) localStorage.setItem(STORAGE_KEY_URL, normalizedUrl);
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  const normalizedUrl = normalizeSupabaseUrl(url);

  if (supabaseInstance && lastUsedUrl === normalizedUrl && lastUsedKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(normalizedUrl, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = normalizedUrl;
    lastUsedKey = anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  hasWorkRecordsTable?: boolean;
  hasStandardsTable?: boolean;
  canWriteWorkRecords?: boolean;
  tableError?: string;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<ConnectionTestResult> {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey ? anonKey.trim() : '';

  if (!cleanUrl || !cleanKey) {
    return { success: false, message: 'URL and Anon Key must not be empty.' };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey);
    
    // Check standard_specifications table
    const stdRes = await testClient.from('standard_specifications').select('count', { count: 'exact', head: true });
    // Check work_records table
    const recRes = await testClient.from('work_records').select('count', { count: 'exact', head: true });

    // Detect if "invalid path specified in requested url" occurred
    const hasPathError = (
      stdRes.error?.message?.toLowerCase().includes('invalid path') ||
      recRes.error?.message?.toLowerCase().includes('invalid path')
    );

    if (hasPathError) {
      return {
        success: false,
        message: 'Invalid URL format ("invalid path specified in requested url"). Make sure you are using your Project API URL (https://<project-ref>.supabase.co) from Project Settings > API, and not the dashboard URL or /rest/v1.',
      };
    }

    const stdMissing = stdRes.error && (stdRes.error.code === 'PGRST205' || stdRes.error.code === '42P01' || stdRes.error.message.includes('does not exist'));
    const recMissing = recRes.error && (recRes.error.code === 'PGRST205' || recRes.error.code === '42P01' || recRes.error.message.includes('does not exist'));

    if (stdMissing || recMissing) {
      return {
        success: true,
        hasStandardsTable: !stdMissing,
        hasWorkRecordsTable: !recMissing,
        message: 'Connected to Supabase! However, the required tables (work_records / standard_specifications) have not been created yet in your Supabase SQL editor.',
        tableError: 'Tables missing in Supabase project.',
      };
    }

    if (stdRes.error && !stdMissing) {
      return { success: false, message: `Supabase Error: ${stdRes.error.message}` };
    }

    if (recRes.error && !recMissing) {
      return { success: false, message: `Supabase Error: ${recRes.error.message}` };
    }

    return { 
      success: true, 
      hasStandardsTable: true,
      hasWorkRecordsTable: true,
      canWriteWorkRecords: true,
      message: 'Connected successfully to Supabase! Both tables are accessible.' 
    };
  } catch (err: any) {
    const errMsg = err?.message || '';
    if (errMsg.toLowerCase().includes('invalid path')) {
      return {
        success: false,
        message: 'Invalid URL format: Detected an invalid path in the Supabase URL. Please use https://<project-ref>.supabase.co without extra path segments.',
      };
    }
    return { success: false, message: errMsg || 'Connection failed. Please verify your Supabase project URL.' };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- AutoSpec Pro: Supabase PostgreSQL Database Schema
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run

-- 1. Create standard_specifications table
CREATE TABLE IF NOT EXISTS public.standard_specifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    source_text TEXT,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create work_records table (with complete JSONB snapshot & lifecycle stage)
CREATE TABLE IF NOT EXISTS public.work_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    standard_spec_id TEXT,
    standard_spec_title TEXT,
    document_name TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    vehicle_category TEXT NOT NULL,
    vehicle_description TEXT,
    fiscal_year TEXT NOT NULL,
    bidder_name TEXT,
    stage TEXT DEFAULT 'created',
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure stage and bidder_name columns exist on pre-existing work_records table
ALTER TABLE public.work_records ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'created';
ALTER TABLE public.work_records ADD COLUMN IF NOT EXISTS bidder_name TEXT;

-- 3. Indexes for fast search and sorting
CREATE INDEX IF NOT EXISTS idx_std_spec_cat ON public.standard_specifications (category);
CREATE INDEX IF NOT EXISTS idx_work_records_org ON public.work_records (organization_name);
CREATE INDEX IF NOT EXISTS idx_work_records_fiscal ON public.work_records (fiscal_year);
CREATE INDEX IF NOT EXISTS idx_work_records_stage ON public.work_records (stage);
CREATE INDEX IF NOT EXISTS idx_work_records_updated ON public.work_records (updated_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.standard_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;

-- 5. Full read/write access policies for anon & authenticated users
DROP POLICY IF EXISTS "Allow all on standard_specifications" ON public.standard_specifications;
CREATE POLICY "Allow all on standard_specifications" 
ON public.standard_specifications FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on work_records" ON public.work_records;
CREATE POLICY "Allow all on work_records" 
ON public.work_records FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);
`;
