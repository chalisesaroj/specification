import { StandardSpecification, SpecRow } from '../types/spec';

/**
 * Normalizes vehicle category to a valid PostgreSQL table name
 * e.g. "4WD Double Cab Pickup" -> "vehicle_4wd_double_cab_pickup"
 */
export function getVehicleTableName(categoryOrTitle: string): string {
  const clean = categoryOrTitle
    .toLowerCase()
    .replace(/[()\/,\.-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return `vehicle_${clean}`;
}

/**
 * Generates unique column prefix preserving Organization, Fiscal Year, and Date
 * PostgreSQL identifier max length is 63 characters.
 * Suffixes added:
 *   _req (4 chars)
 *   _eval_compliance (16 chars)
 *   _eval_remarks (13 chars)
 *   _insp_status (12 chars)
 *   _insp_remarks (13 chars)
 * Maximum prefix length = 63 - 16 = 47 chars.
 */
export function generateProjectColumnPrefix(
  organizationName: string,
  fiscalYear: string,
  dateStr?: string
): string {
  // Format date as YYYYMMDD
  let datePart = '';
  if (dateStr) {
    datePart = dateStr.replace(/[^0-9]/g, '').slice(0, 8);
  }
  if (!datePart || datePart.length < 8) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    datePart = `${y}${m}${d}`;
  }

  // Clean Fiscal Year (e.g. "2083/84" -> "2083_84")
  const fyClean = fiscalYear
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'fy';

  // Clean Organization Name (take first 3 words, alphanumeric only)
  const orgClean = organizationName
    .toLowerCase()
    .replace(/[()\/,\.-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('_') || 'client';

  // Target prefix: e.g. pokhara_metro_2083_84_20261106
  const rawPrefix = `${orgClean}_${fyClean}_${datePart}`;
  
  // Truncate to 45 chars to be safe with max PostgreSQL 63-character limit
  if (rawPrefix.length > 45) {
    return rawPrefix.slice(0, 45).replace(/_$/, '');
  }
  return rawPrefix;
}

export interface ProjectColumnsInfo {
  prefix: string;
  reqColumn: string;
  evalComplianceColumn: string;
  evalRemarksColumn: string;
  inspStatusColumn: string;
  inspRemarksColumn: string;
}

export function getProjectColumns(prefix: string): ProjectColumnsInfo {
  return {
    prefix,
    reqColumn: `${prefix}_req`,
    evalComplianceColumn: `${prefix}_eval_compliance`,
    evalRemarksColumn: `${prefix}_eval_remarks`,
    inspStatusColumn: `${prefix}_insp_status`,
    inspRemarksColumn: `${prefix}_insp_remarks`,
  };
}

/**
 * Returns SQL DDL script to create the dynamic column sync RPC function in Supabase
 */
export function generateVehicleRPCSQL(): string {
  return `-- AutoSpec Pro: Dynamic Vehicle Table Column Management RPC
-- Creates vehicle table if not exists and adds unique columns per project
-- Preserving Organization, Fiscal Year, and Date

CREATE OR REPLACE FUNCTION public.sync_vehicle_spec_columns(
  p_table_name text,
  p_col_prefix text,
  p_stage text,
  p_rows jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_col_req text;
  v_col_eval_comp text;
  v_col_eval_rem text;
  v_col_insp_stat text;
  v_col_insp_rem text;
  v_item jsonb;
  v_row_sn text;
  v_row_param text;
  v_req_val text;
  v_eval_comp_val text;
  v_eval_rem_val text;
  v_insp_stat_val text;
  v_insp_rem_val text;
BEGIN
  -- 1. Ensure vehicle table exists
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I (
      item_sn TEXT NOT NULL,
      parameter TEXT NOT NULL,
      standard_requirement TEXT NOT NULL,
      PRIMARY KEY (item_sn, parameter)
    )', p_table_name);

  -- 2. Define unique project columns preserving org, fy, date
  v_col_req := p_col_prefix || '_req';
  v_col_eval_comp := p_col_prefix || '_eval_compliance';
  v_col_eval_rem := p_col_prefix || '_eval_remarks';
  v_col_insp_stat := p_col_prefix || '_insp_status';
  v_col_insp_rem := p_col_prefix || '_insp_remarks';

  -- 3. Always ensure the requirement column is added
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I TEXT', p_table_name, v_col_req);

  -- 4. If in evaluation or inspected stage, add evaluation columns
  IF p_stage IN ('evaluated', 'inspected') THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I TEXT', p_table_name, v_col_eval_comp);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I TEXT', p_table_name, v_col_eval_rem);
  END IF;

  -- 5. If in inspection stage, add inspection columns
  IF p_stage = 'inspected' THEN
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I TEXT', p_table_name, v_col_insp_stat);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I TEXT', p_table_name, v_col_insp_rem);
  END IF;

  -- 6. Upsert the baseline rows and update the project column values
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_row_sn := COALESCE(v_item->>'itemNumber', '1');
    v_row_param := COALESCE(v_item->>'parameter', 'Parameter');
    v_req_val := COALESCE(v_item->>'requirement', '');
    v_eval_comp_val := COALESCE(v_item->>'compliance', 'Complied');
    v_eval_rem_val := COALESCE(v_item->>'offeredSpecification', '');
    v_insp_stat_val := COALESCE(v_item->>'inspectionResult', 'Accepted');
    v_insp_rem_val := COALESCE(v_item->>'inspectedValue', '');

    -- Insert baseline standard row if missing
    EXECUTE format('
      INSERT INTO public.%I (item_sn, parameter, standard_requirement)
      VALUES (%L, %L, %L)
      ON CONFLICT (item_sn, parameter) DO NOTHING',
      p_table_name, v_row_sn, v_row_param, v_req_val
    );

    -- Update customized requirement column
    EXECUTE format('
      UPDATE public.%I SET %I = %L WHERE item_sn = %L AND parameter = %L',
      p_table_name, v_col_req, v_req_val, v_row_sn, v_row_param
    );

    -- Update evaluation columns if evaluated or inspected
    IF p_stage IN ('evaluated', 'inspected') THEN
      EXECUTE format('
        UPDATE public.%I SET %I = %L, %I = %L WHERE item_sn = %L AND parameter = %L',
        p_table_name, v_col_eval_comp, v_eval_comp_val, v_col_eval_rem, v_eval_rem_val, v_row_sn, v_row_param
      );
    END IF;

    -- Update inspection columns if inspected
    IF p_stage = 'inspected' THEN
      EXECUTE format('
        UPDATE public.%I SET %I = %L, %I = %L WHERE item_sn = %L AND parameter = %L',
        p_table_name, v_col_insp_stat, v_insp_stat_val, v_col_insp_rem, v_insp_rem_val, v_row_sn, v_row_param
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'column_prefix', p_col_prefix,
    'stage', p_stage
  );
END;
$$;

-- Grant execution permission to both anon and authenticated users
GRANT EXECUTE ON FUNCTION public.sync_vehicle_spec_columns TO anon, authenticated;

-- Function to save Cost Estimate Rate and Quantity as two new unique columns representing office name and FY
CREATE OR REPLACE FUNCTION public.sync_vehicle_estimate_columns(
  p_table_name text,
  p_col_prefix text,
  p_qty numeric,
  p_rate numeric
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_col_qty text;
  v_col_rate text;
BEGIN
  -- 1. Ensure table exists
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I (
      item_sn TEXT NOT NULL,
      parameter TEXT NOT NULL,
      standard_requirement TEXT NOT NULL,
      PRIMARY KEY (item_sn, parameter)
    )', p_table_name);

  -- 2. Define unique columns for quantity and rate representing office and FY
  v_col_qty := p_col_prefix || '_est_qty';
  v_col_rate := p_col_prefix || '_est_rate';

  -- 3. Add columns if not exist
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I NUMERIC', p_table_name, v_col_qty);
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I NUMERIC', p_table_name, v_col_rate);

  -- 4. Update the primary vehicle row with qty and rate
  IF EXISTS (SELECT 1 FROM public.%I LIMIT 1) THEN
    EXECUTE format('
      UPDATE public.%I SET %I = %L, %I = %L
      WHERE ctid = (SELECT ctid FROM public.%I LIMIT 1)',
      p_table_name, v_col_qty, p_qty, v_col_rate, p_rate, p_table_name
    );
  ELSE
    EXECUTE format('
      INSERT INTO public.%I (item_sn, parameter, standard_requirement, %I, %I)
      VALUES (''1'', ''Vehicle Unit Estimate'', ''Standard unit procurement'', %L, %L)',
      p_table_name, v_col_qty, v_col_rate, p_qty, p_rate
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'col_qty', v_col_qty,
    'col_rate', v_col_rate
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_vehicle_estimate_columns TO anon, authenticated;

-- Function to drop project columns when a specification is deleted to free database memory
CREATE OR REPLACE FUNCTION public.drop_vehicle_spec_columns(
  p_table_name TEXT,
  p_column_prefix TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_col RECORD;
  v_dropped INT := 0;
BEGIN
  FOR v_col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = p_table_name 
      AND column_name LIKE p_column_prefix || '%'
      AND column_name NOT IN ('item_sn', 'parameter', 'standard_requirement', 'created_at', 'id', 'sn', 'updated_at')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I', p_table_name, v_col.column_name);
    v_dropped := v_dropped + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'table', p_table_name, 'columns_dropped', v_dropped);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.drop_vehicle_spec_columns TO anon, authenticated;

-- Function to drop custom vehicle or office tables other than standard_specifications and work_records
CREATE OR REPLACE FUNCTION public.drop_custom_vehicle_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tbl RECORD;
  v_dropped text[] := ARRAY[]::text[];
BEGIN
  FOR v_tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('standard_specifications', 'work_records')
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', v_tbl.table_name);
    v_dropped := array_append(v_dropped, v_tbl.table_name);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'dropped_tables', v_dropped
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.drop_custom_vehicle_tables TO anon, authenticated;
`;
}

/**
 * Generates the full initial SQL creation script for all individual vehicle tables
 */
export function generateAllVehicleTablesSQL(standards: StandardSpecification[]): string {
  const rpcScript = generateVehicleRPCSQL();
  
  const tablesScript = standards.map((std) => {
    const tableName = getVehicleTableName(std.category || std.title);
    
    // Extract rows
    const rows: { sn: string; param: string; req: string }[] = [];
    std.content.sections?.forEach((sec) => {
      sec.rows?.forEach((r, idx) => {
        rows.push({
          sn: r.itemNumber || String(idx + 1),
          param: r.parameter.replace(/'/g, "''"),
          req: r.requirement.replace(/'/g, "''"),
        });
      });
    });

    const insertStatements = rows.map((r) => 
      `INSERT INTO public.${tableName} (item_sn, parameter, standard_requirement) VALUES ('${r.sn}', '${r.param}', '${r.req}') ON CONFLICT (item_sn, parameter) DO UPDATE SET standard_requirement = EXCLUDED.standard_requirement;`
    ).join('\n');

    return `-- Table for Vehicle: ${std.title}
CREATE TABLE IF NOT EXISTS public.${tableName} (
    item_sn TEXT NOT NULL,
    parameter TEXT NOT NULL,
    standard_requirement TEXT NOT NULL,
    PRIMARY KEY (item_sn, parameter)
);

ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on ${tableName}" ON public.${tableName};
CREATE POLICY "Allow all on ${tableName}" 
ON public.${tableName} FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

-- Seed baseline standard parameters
${insertStatements}
`;
  }).join('\n\n');

  return `${rpcScript}\n\n-- =========================================================\n-- INDIVIDUAL VEHICLE TABLES & STANDARD BASELINE PARAMETERS\n-- =========================================================\n\n${tablesScript}`;
}
