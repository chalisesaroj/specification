import { StandardSpecification, WorkRecord, CostEstimateData } from '../types/spec';
import { DEFAULT_STANDARDS } from '../data/defaultStandards';
import { getSupabase, isUUID, generateUUID } from '../lib/supabase';
import { getVehicleTableName, generateProjectColumnPrefix } from '../utils/vehicleTableHelper';

const LS_KEY_STANDARDS = 'autospec_standard_specifications_v2';
const LS_KEY_WORK_RECORDS = 'autospec_work_records_v2';
const LS_KEY_DELETED_IDS = 'autospec_deleted_record_ids';
const LS_KEY_DELETED_DOCS = 'autospec_deleted_record_docnames';

function filterOutDeleted(records: WorkRecord[]): WorkRecord[] {
  try {
    const deletedIds: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_IDS) || '[]');
    const deletedDocs: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_DOCS) || '[]');
    if (deletedIds.length === 0 && deletedDocs.length === 0) return records;
    return records.filter(
      (r) => !deletedIds.includes(r.id) && (!r.document_name || !deletedDocs.includes(r.document_name))
    );
  } catch {
    return records;
  }
}

/**
 * Writes to localStorage without breaking the save flow when the browser quota
 * is exceeded (for example when inspection photographs are attached). The
 * Supabase copy is still written afterwards.
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`Could not cache "${key}" in localStorage (quota may be full).`, err);
    return false;
  }
}

export interface SaveWorkRecordResult {
  record: WorkRecord;
  syncedToSupabase: boolean;
  supabaseConfigured: boolean;
  supabaseError?: string;
  isTableMissing?: boolean;
  vehicleTable?: string;
  columnPrefix?: string;
}

// Seed demo work records if fresh user to demonstrate exact requested workflow
const INITIAL_DEMO_WORK_RECORDS: WorkRecord[] = [
  {
    id: '7f3a9e10-1234-4a5b-8c9d-e1f2a3b4c501',
    standard_spec_id: 'std-pickup-4wd-001',
    standard_spec_title: '4WD Double Cab Pickup Vehicle',
    document_name: 'Pokhara Metropolitan City – Four Wheel Drive – FY 2083/84',
    organization_name: 'Pokhara Metropolitan City',
    vehicle_category: '4WD Double Cab Pickup',
    vehicle_description: '4WD Double Cab Pickup, Right Hand Drive model with high ground clearance',
    fiscal_year: '2083/84',
    created_at: '2026-08-14T09:20:00Z',
    updated_at: '2026-10-24T15:10:00Z',
    content: {
      documentTitle: 'Technical Specifications of Four-Wheel Drive Double Cab Pickup Vehicle',
      organizationName: 'Pokhara Metropolitan City, Office of Municipal Executive',
      subDivision: 'Infrastructure Development & Procurement Division',
      officeLocation: 'Pokhara, Kaski, Gandaki Province',
      projectName: 'Procurement of 4WD Double Cab Pickup',
      fiscalYear: '2083/84',
      tenderNo: 'PMC/GOODS/NCB-04/2083-84',
      vehicleCategory: '4WD Double Cab Pickup',
      vehicleDescription: '4WD Double Cab Pickup, Right Hand Drive model with two- and four-wheel drive',
      make: 'Mahindra',
      model: 'Scorpio / Bolero 4x4',
      countryOfOrigin: 'India',
      deliveryPlace: 'Office of the Municipal Executive, Pokhara Metropolitan City',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer / Automobile Instructor',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      approvedBy: 'Chief Administrative Officer',
      warrantyPeriod: 'Minimum one year warranty after acceptance',
      sections: JSON.parse(JSON.stringify(DEFAULT_STANDARDS[0].content.sections))
    }
  },
  {
    id: '7f3a9e10-1234-4a5b-8c9d-e1f2a3b4c502',
    standard_spec_id: 'std-4wd-004',
    standard_spec_title: 'Four Wheel Drive Vehicle (Hardtop 4x4 Station Wagon)',
    document_name: 'Municipality A – Four Wheel Drive – FY 2083/84',
    organization_name: 'Putalibazar Municipality',
    vehicle_category: 'Four Wheel Drive Vehicle',
    vehicle_description: '4-Wheel Drive Inspection Vehicle for Infrastructure Unit',
    fiscal_year: '2083/84',
    created_at: '2026-09-02T11:15:00Z',
    updated_at: '2026-09-02T14:40:00Z',
    content: {
      documentTitle: 'Technical Specification of 4WD Field Vehicle',
      organizationName: 'Putalibazar Municipality',
      subDivision: 'Engineering Department',
      officeLocation: 'Putalibazar, Syangja, Gandaki Province',
      projectName: 'Procurement of 4WD Field Vehicle',
      fiscalYear: '2083/84',
      tenderNo: 'MUNA/NCB/GOODS/02/2083-84',
      vehicleCategory: 'Four Wheel Drive Vehicle',
      vehicleDescription: 'Rugged 4WD Utility Hardtop Station Wagon',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      approvedBy: 'Chief Administrative Officer',
      warrantyPeriod: '3 Years or 100,000 km',
      sections: JSON.parse(JSON.stringify(DEFAULT_STANDARDS[3].content.sections))
    }
  },
  {
    id: '7f3a9e10-1234-4a5b-8c9d-e1f2a3b4c503',
    standard_spec_id: 'std-pickup-4wd-001',
    standard_spec_title: '4WD Double Cab Pickup Vehicle',
    document_name: 'Municipality B – Four Wheel Drive – FY 2084/85',
    organization_name: 'Bhirkot Municipality',
    vehicle_category: '4WD Double Cab Pickup',
    vehicle_description: 'High Ground Clearance 4x4 Double Cab Pickup',
    fiscal_year: '2084/85',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-18T16:30:00Z',
    content: {
      documentTitle: 'Technical Specification of Four Wheel Drive Double Cab Pickup',
      organizationName: 'Bhirkot Municipality',
      subDivision: 'Infrastructure Development Division',
      officeLocation: 'Bhirkot, Syangja, Gandaki Province',
      projectName: 'Procurement of 4WD Double Cab Pickup',
      fiscalYear: '2084/85',
      tenderNo: 'BHIR/GOODS/2084-85/01',
      vehicleCategory: '4WD Double Cab Pickup',
      vehicleDescription: '4WD Double Cab Pickup for Rural Roads and Agriculture Monitoring',
      preparedBy: 'Er. Saroj Chalise',
      designation: 'Mechanical Engineer',
      nec: 'NEC Reg. No.: 2016, Mechanical Category A',
      approvedBy: 'Chief Administrative Officer',
      warrantyPeriod: 'Minimum one year warranty',
      sections: JSON.parse(JSON.stringify(DEFAULT_STANDARDS[0].content.sections))
    }
  }
];

export const storageService = {
  // Load Standard Specifications
  async getStandards(): Promise<StandardSpecification[]> {
    const supabase = getSupabase();

    // 1. Try Supabase if connected
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('standard_specifications')
          .select('*')
          .order('title', { ascending: true });

        if (!error && data && data.length > 0) {
          const standards: StandardSpecification[] = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            description: item.description || '',
            version: item.version || '1.0',
            sourceText: item.source_text || '',
            content: typeof item.content === 'string' ? JSON.parse(item.content) : item.content,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

          // Cache in localStorage
          localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(standards));
          return standards;
        } else if (!error && data && data.length === 0) {
          // If table exists but empty, seed it with default standards
          for (const std of DEFAULT_STANDARDS) {
            await supabase.from('standard_specifications').insert({
              id: std.id,
              title: std.title,
              category: std.category,
              description: std.description,
              version: std.version,
              source_text: std.sourceText || '',
              content: std.content,
              created_at: std.created_at,
              updated_at: std.updated_at,
            });
          }
          return DEFAULT_STANDARDS;
        }
      } catch (err) {
        console.warn('Supabase fetch standard specifications error, using local storage fallback:', err);
      }
    }

    // 2. LocalStorage fallback
    const raw = localStorage.getItem(LS_KEY_STANDARDS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing standards from localStorage:', e);
      }
    }

    // Default seed
    localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(DEFAULT_STANDARDS));
    return DEFAULT_STANDARDS;
  },

  // Save/Update Standard Specification
  async saveStandard(standard: StandardSpecification): Promise<StandardSpecification> {
    const standards = await this.getStandards();
    const index = standards.findIndex((s) => s.id === standard.id);
    const updatedStandard = {
      ...standard,
      updated_at: new Date().toISOString(),
    };

    if (index >= 0) {
      standards[index] = updatedStandard;
    } else {
      standards.unshift(updatedStandard);
    }

    localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(standards));

    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('standard_specifications').upsert({
          id: updatedStandard.id,
          title: updatedStandard.title,
          category: updatedStandard.category,
          description: updatedStandard.description,
          version: updatedStandard.version,
          source_text: updatedStandard.sourceText || '',
          content: updatedStandard.content,
          created_at: updatedStandard.created_at || new Date().toISOString(),
          updated_at: updatedStandard.updated_at,
        });
      } catch (err) {
        console.error('Failed to sync standard to Supabase:', err);
      }
    }

    return updatedStandard;
  },

  // Delete Standard Specification
  async deleteStandard(id: string): Promise<void> {
    const standards = await this.getStandards();
    const filtered = standards.filter((s) => s.id !== id);
    localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(filtered));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('standard_specifications').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete standard from Supabase:', err);
      }
    }
  },

  // Load Work Records
  async getWorkRecords(): Promise<WorkRecord[]> {
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('work_records')
          .select('*')
          .order('updated_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const records: WorkRecord[] = data.map((item: any) => {
            const parsedContent = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
            return {
              id: item.id,
              standard_spec_id: item.standard_spec_id,
              standard_spec_title: item.standard_spec_title,
              document_name: item.document_name,
              organization_name: item.organization_name,
              vehicle_category: item.vehicle_category,
              vehicle_description: item.vehicle_description || '',
              fiscal_year: item.fiscal_year,
              bidder_name: item.bidder_name || parsedContent?.bidderName || parsedContent?.inspectionDetails?.selectedBidderName || '',
              stage: item.stage || parsedContent?.stage || 'created',
              content: parsedContent,
              created_at: item.created_at,
              updated_at: item.updated_at,
            };
          });

          const validRecords = filterOutDeleted(records);
          safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(validRecords));
          return validRecords;
        } else if (!error && data && data.length === 0) {
          // If empty in Supabase, only seed if user has NEVER initialized or deleted
          const hasInitialized = localStorage.getItem('autospec_records_initialized');
          if (!hasInitialized) {
            localStorage.setItem('autospec_records_initialized', 'true');
            for (const rec of INITIAL_DEMO_WORK_RECORDS) {
              await supabase.from('work_records').insert({
                id: rec.id,
                standard_spec_id: rec.standard_spec_id,
                standard_spec_title: rec.standard_spec_title,
                document_name: rec.document_name,
                organization_name: rec.organization_name,
                vehicle_category: rec.vehicle_category,
                vehicle_description: rec.vehicle_description,
                fiscal_year: rec.fiscal_year,
                stage: rec.stage || 'created',
                content: rec.content,
                created_at: rec.created_at,
                updated_at: rec.updated_at,
              });
            }
            return filterOutDeleted(INITIAL_DEMO_WORK_RECORDS);
          }
          // User intentionally emptied or deleted records
          safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify([]));
          return [];
        }
      } catch (err) {
        console.warn('Supabase fetch work records error, using local fallback:', err);
      }
    }

    const raw = localStorage.getItem(LS_KEY_WORK_RECORDS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return filterOutDeleted(parsed);
      } catch (e) {
        console.error('Error parsing work records from localStorage:', e);
      }
    }

    const hasInitialized = localStorage.getItem('autospec_records_initialized');
    if (!hasInitialized) {
      localStorage.setItem('autospec_records_initialized', 'true');
      safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(INITIAL_DEMO_WORK_RECORDS));
      return filterOutDeleted(INITIAL_DEMO_WORK_RECORDS);
    }
    return [];
  },

  // Save/Update Work Record (ALWAYS an independent snapshot!)
  async saveWorkRecord(record: WorkRecord): Promise<SaveWorkRecordResult> {
    const records = await this.getWorkRecords();
    const index = records.findIndex((r) => r.id === record.id);
    const now = new Date().toISOString();

    // Ensure ID is a valid UUID so it works with PostgreSQL UUID and TEXT columns
    const recordId = record.id && record.id.trim() !== '' && isUUID(record.id) 
      ? record.id 
      : generateUUID();

    const snapshotRecord: WorkRecord = {
      ...record,
      id: recordId,
      stage: record.stage || record.content?.stage || 'created',
      // Deep clone content to guarantee complete independence
      content: JSON.parse(JSON.stringify(record.content)),
      created_at: record.created_at || now,
      updated_at: now,
    };

    if (index >= 0) {
      records[index] = snapshotRecord;
    } else {
      records.unshift(snapshotRecord);
    }

    // Un-blacklist if re-saving
    try {
      const delIds: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_IDS) || '[]');
      const filteredDelIds = delIds.filter((d) => d !== recordId && d !== record.id);
      localStorage.setItem(LS_KEY_DELETED_IDS, JSON.stringify(filteredDelIds));

      if (snapshotRecord.document_name) {
        const delDocs: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_DOCS) || '[]');
        const filteredDelDocs = delDocs.filter((d) => d !== snapshotRecord.document_name);
        localStorage.setItem(LS_KEY_DELETED_DOCS, JSON.stringify(filteredDelDocs));
      }
    } catch {}

    safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(records));

    // Save directly to Supabase as BaaS
    const supabase = getSupabase();
    if (!supabase) {
      return {
        record: snapshotRecord,
        syncedToSupabase: false,
        supabaseConfigured: false,
      };
    }

    try {
      const payload: any = {
        id: snapshotRecord.id,
        standard_spec_id: snapshotRecord.standard_spec_id || null,
        standard_spec_title: snapshotRecord.standard_spec_title || null,
        document_name: snapshotRecord.document_name,
        organization_name: snapshotRecord.organization_name,
        vehicle_category: snapshotRecord.vehicle_category,
        vehicle_description: snapshotRecord.vehicle_description || '',
        fiscal_year: snapshotRecord.fiscal_year,
        bidder_name: snapshotRecord.bidder_name || snapshotRecord.content?.bidderName || snapshotRecord.content?.inspectionDetails?.selectedBidderName || null,
        stage: snapshotRecord.stage,
        content: snapshotRecord.content,
        created_at: snapshotRecord.created_at,
        updated_at: snapshotRecord.updated_at,
      };

      let { error } = await supabase.from('work_records').upsert(payload);

      // Retry 1: UUID syntax error (if payload.id was not UUID and table expects UUID)
      if (error && (error.code === '22P02' || error.message?.includes('invalid input syntax for type uuid'))) {
        payload.id = generateUUID();
        snapshotRecord.id = payload.id;
        const retryRes = await supabase.from('work_records').upsert(payload);
        error = retryRes.error;
      }

      // Retry 2: If bidder_name or stage column does not exist in old table, retry gracefully
      if (error && (error.code === '42703' || error.message?.includes('bidder_name'))) {
        delete payload.bidder_name;
        const retryRes = await supabase.from('work_records').upsert(payload);
        error = retryRes.error;
      }

      if (error && (error.code === '42703' || error.message?.includes('stage'))) {
        delete payload.stage;
        const retryRes = await supabase.from('work_records').upsert(payload);
        error = retryRes.error;
      }

      // Retry 3: If foreign key constraint on standard_spec_id fails, clear it and retry
      if (error && (error.code === '23503' || error.message?.includes('standard_spec_id'))) {
        payload.standard_spec_id = null;
        const retryRes = await supabase.from('work_records').upsert(payload);
        error = retryRes.error;
      }

      if (error) {
        console.error('Supabase upsert failed with error:', error);
        const isTableMissing = error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist');
        let errorMsg = error.message || 'Unknown Supabase error';
        if (errorMsg.toLowerCase().includes('invalid path')) {
          errorMsg = 'Invalid URL path: Ensure your Supabase Project URL is "https://[id].supabase.co" without "/rest/v1" or dashboard paths.';
        }
        return {
          record: snapshotRecord,
          syncedToSupabase: false,
          supabaseConfigured: true,
          isTableMissing,
          supabaseError: errorMsg,
        };
      }

      // 2. Also sync to dedicated vehicle table as dynamic project columns
      const vehicleTable = getVehicleTableName(snapshotRecord.vehicle_category || snapshotRecord.standard_spec_title || 'vehicle');
      const datePart = (snapshotRecord.created_at || now).slice(0, 10);
      const columnPrefix = generateProjectColumnPrefix(
        snapshotRecord.organization_name || 'client',
        snapshotRecord.fiscal_year || '2083_84',
        datePart
      );
      snapshotRecord.column_prefix = columnPrefix;

      try {
        const rows: any[] = [];
        snapshotRecord.content.sections?.forEach((s) => {
          s.rows?.forEach((r) => {
            rows.push({
              itemNumber: r.itemNumber,
              parameter: r.parameter,
              requirement: r.requirement,
              compliance: r.compliance || 'Complied',
              offeredSpecification: r.offeredSpecification || '',
              inspectionResult: r.inspectionResult || 'Accepted',
              inspectedValue: r.inspectedValue || '',
            });
          });
        });

        const { error: rpcError } = await supabase.rpc('sync_vehicle_spec_columns', {
          p_table_name: vehicleTable,
          p_col_prefix: columnPrefix,
          p_stage: snapshotRecord.stage || 'created',
          p_rows: rows,
        });

        if (rpcError) {
          console.warn('Vehicle table column sync info:', rpcError.message);
        } else {
          console.log(`Synced project columns to ${vehicleTable} with prefix ${columnPrefix}`);
        }
      } catch (colErr) {
        console.warn('Vehicle dynamic column sync skipped:', colErr);
      }

      return {
        record: snapshotRecord,
        syncedToSupabase: true,
        supabaseConfigured: true,
        vehicleTable,
        columnPrefix,
      };
    } catch (err: any) {
      console.error('Failed to sync work record to Supabase:', err);
      return {
        record: snapshotRecord,
        syncedToSupabase: false,
        supabaseConfigured: true,
        supabaseError: err?.message || 'Network error syncing to Supabase',
      };
    }
  },

  // Duplicate Work Record (Independent clone)
  async duplicateWorkRecord(id: string): Promise<WorkRecord | null> {
    const records = await this.getWorkRecords();
    const original = records.find((r) => r.id === id);
    if (!original) return null;

    const newId = generateUUID();
    const duplicate: WorkRecord = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      document_name: `${original.document_name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await this.saveWorkRecord(duplicate);
    return result.record;
  },

  // Delete Work Record (from Supabase DB and local storage to reclaim memory)
  // Deleting means deleting from my_work_record, which applies to deleting the created specification
  // from the vehicle's table along with all bidder evaluations and inspection data.
  // CRITICAL INVARIANT: Standard specifications in standard_specifications and baseline vehicle table parameters are NEVER deleted.
  async deleteWorkRecord(id: string): Promise<{ success: boolean; deletedFromSupabase: boolean; error?: string }> {
    localStorage.setItem('autospec_records_initialized', 'true');
    const records = await this.getWorkRecords();
    const targetRecord = records.find((r) => r.id === id);
    
    // Add to deleted blacklist so it NEVER resurrects under any circumstance
    try {
      const delIds: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_IDS) || '[]');
      if (!delIds.includes(id)) {
        delIds.push(id);
        localStorage.setItem(LS_KEY_DELETED_IDS, JSON.stringify(delIds));
      }
      if (targetRecord?.document_name) {
        const delDocs: string[] = JSON.parse(localStorage.getItem(LS_KEY_DELETED_DOCS) || '[]');
        if (!delDocs.includes(targetRecord.document_name)) {
          delDocs.push(targetRecord.document_name);
          localStorage.setItem(LS_KEY_DELETED_DOCS, JSON.stringify(delDocs));
        }
      }
    } catch {}

    // Filter out target record and any associated evaluation/inspection records belonging to this created spec
    const filtered = records.filter((r) => {
      if (r.id === id) return false;
      if (targetRecord?.document_name && r.document_name === targetRecord.document_name) return false;
      return true;
    });
    safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(filtered));

    const supabase = getSupabase();
    let deletedFromSupabase = false;
    let errorMsg: string | undefined;

    if (supabase) {
      try {
        // 1. Delete from work_records table in Supabase by ID
        const { error: errId } = await supabase.from('work_records').delete().eq('id', id);
        if (!errId) {
          deletedFromSupabase = true;
        }

        // Also delete any records with matching document_name (e.g. associated bidder evaluations or inspection branches)
        if (targetRecord?.document_name) {
          const { error: errDoc } = await supabase.from('work_records').delete().eq('document_name', targetRecord.document_name);
          if (!errDoc) deletedFromSupabase = true;
        }

        // Also delete by organization, fiscal year, vehicle category if matched
        if (targetRecord?.organization_name && targetRecord?.fiscal_year && targetRecord?.vehicle_category) {
          await supabase.from('work_records').delete()
            .eq('organization_name', targetRecord.organization_name)
            .eq('fiscal_year', targetRecord.fiscal_year)
            .eq('vehicle_category', targetRecord.vehicle_category);
        }

        // 2. Drop dynamic project columns from dedicated vehicle table in database
        // This drops the created specification requirement column, bidder compliance & remarks columns,
        // inspection status & remarks columns, and cost estimate rate & quantity columns.
        // The baseline standard specification columns ('item_sn', 'parameter', 'standard_requirement') are NEVER dropped.
        if (targetRecord) {
          const vehicleTable = getVehicleTableName(targetRecord.vehicle_category || targetRecord.standard_spec_title || 'vehicle');
          const datePart = (targetRecord.created_at || '').slice(0, 10);
          const colPrefix = targetRecord.column_prefix || generateProjectColumnPrefix(targetRecord.organization_name, targetRecord.fiscal_year, datePart);

          try {
            await supabase.rpc('drop_vehicle_spec_columns', {
              p_table_name: vehicleTable,
              p_column_prefix: colPrefix,
            });
            console.log(`Dropped project columns with prefix ${colPrefix} from ${vehicleTable}`);
          } catch (colErr) {
            console.warn('Vehicle dynamic columns drop skipped or RPC missing:', colErr);
          }

          // Also attempt drop with base prefix (org + fy) to catch any variation
          const basePrefix = generateProjectColumnPrefix(targetRecord.organization_name, targetRecord.fiscal_year);
          if (basePrefix && basePrefix !== colPrefix) {
            try {
              await supabase.rpc('drop_vehicle_spec_columns', {
                p_table_name: vehicleTable,
                p_column_prefix: basePrefix,
              });
            } catch {}
          }
        }
      } catch (err: any) {
        console.error('Failed to delete work record from Supabase:', err);
        errorMsg = err?.message;
      }
    }

    return { success: true, deletedFromSupabase, error: errorMsg };
  },

  // Save Cost Estimate (creates 2 columns for rate and quantity in vehicle table & updates work record)
  async saveCostEstimate(recordId: string, estimate: CostEstimateData): Promise<SaveWorkRecordResult> {
    const records = await this.getWorkRecords();
    const rec = records.find((r) => r.id === recordId);
    if (!rec) {
      throw new Error(`Work record ${recordId} not found`);
    }

    // Attach cost estimate to work record
    rec.cost_estimate = estimate;
    rec.content.costEstimate = estimate;
    rec.updated_at = new Date().toISOString();

    // 1. Save work record
    const saveRes = await this.saveWorkRecord(rec);

    // 2. Push Rate & Quantity to vehicle table as 2 unique columns representing office & FY
    const supabase = getSupabase();
    if (supabase) {
      const vehicleTable = getVehicleTableName(rec.vehicle_category || rec.standard_spec_title || 'vehicle');
      const datePart = (rec.created_at || new Date().toISOString()).slice(0, 10);
      const colPrefix = generateProjectColumnPrefix(rec.organization_name, rec.fiscal_year, datePart);

      const primaryItem = estimate.items[0] || { qty: 1, rate: 100000 };

      try {
        await supabase.rpc('sync_vehicle_estimate_columns', {
          p_table_name: vehicleTable,
          p_col_prefix: colPrefix,
          p_qty: primaryItem.qty,
          p_rate: primaryItem.rate,
        });
      } catch (rpcErr) {
        console.warn('sync_vehicle_estimate_columns error:', rpcErr);
      }
    }

    return saveRes;
  },

  // Drop all custom vehicle/office tables other than standard_specifications and work_records
  async dropCustomVehicleTables(): Promise<{ success: boolean; dropped_tables?: string[]; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase database is not connected.' };
    }

    try {
      const { data, error } = await supabase.rpc('drop_custom_vehicle_tables');
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        dropped_tables: data?.dropped_tables || [],
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to drop tables' };
    }
  },

  // Reset to default seed data
  async resetToDefaults(): Promise<void> {
    localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(DEFAULT_STANDARDS));
    safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(INITIAL_DEMO_WORK_RECORDS));
  },

  // Full export JSON
  async exportAllData(): Promise<string> {
    const standards = await this.getStandards();
    const records = await this.getWorkRecords();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      app: 'AutoSpec Pro',
      standards,
      workRecords: records,
    }, null, 2);
  },

  // Full import JSON
  async importData(jsonString: string): Promise<{ standardsCount: number; recordsCount: number }> {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed.standards)) {
      localStorage.setItem(LS_KEY_STANDARDS, JSON.stringify(parsed.standards));
    }
    if (Array.isArray(parsed.workRecords)) {
      safeSetItem(LS_KEY_WORK_RECORDS, JSON.stringify(parsed.workRecords));
    }
    return {
      standardsCount: parsed.standards?.length || 0,
      recordsCount: parsed.workRecords?.length || 0,
    };
  },

  // Push all local standards and work records to connected Supabase database
  async syncAllToSupabase(): Promise<{ standardsSynced: number; recordsSynced: number; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) return { standardsSynced: 0, recordsSynced: 0, error: 'Supabase is not connected' };

    const standards = await this.getStandards();
    const records = await this.getWorkRecords();

    let standardsSynced = 0;
    let recordsSynced = 0;

    // 1. Sync standards
    for (const std of standards) {
      try {
        const { error } = await supabase.from('standard_specifications').upsert({
          id: std.id,
          title: std.title,
          category: std.category,
          description: std.description || '',
          version: std.version || '1.0',
          source_text: std.sourceText || '',
          content: std.content,
          created_at: std.created_at,
          updated_at: std.updated_at,
        });
        if (!error) standardsSynced++;
      } catch (e) {
        console.warn('Standard sync error:', e);
      }
    }

    // 2. Sync work records
    for (const rec of records) {
      try {
        const res = await this.saveWorkRecord(rec);
        if (res.syncedToSupabase) recordsSynced++;
      } catch (e) {
        console.warn('Record sync error:', e);
      }
    }

    return { standardsSynced, recordsSynced };
  }
};
