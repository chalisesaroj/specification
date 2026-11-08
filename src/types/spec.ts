export interface ParameterClause {
  parameter: string;
  operator: string;
  value: string;
  unit: string;
}

export type DocumentStage = 'created' | 'evaluated' | 'inspected';

export interface CustomHeaderRow {
  id: string;
  label: string;
  value: string;
}

export interface InspectionDetails {
  chassisNo?: string;
  engineNo?: string;
  color?: string;
  manufacturingYear?: string;
  odometerReading?: string;
  batteryDetails?: string;
  tyreDetails?: string;
  deliveryDate?: string;
  inspectorName?: string;
  inspectorDesignation?: string;
  selectedBidderName?: string;
  overallConclusion?: 'Accepted' | 'Accepted with Conditions' | 'Rejected';
}

export interface SpecRow {
  id: string;
  itemNumber: string;
  parameter: string;
  requirement: string;
  offeredSpecification?: string;
  compliance?: 'Complied' | 'Not Complied' | 'Partial' | 'Pending';
  inspectedValue?: string;
  inspectionResult?: 'Accepted' | 'Rejected' | 'Conditional' | 'Pending';
  remarks?: string;
  clauses?: ParameterClause[];
}

export interface SpecSection {
  id: string;
  title: string;
  order: number;
  rows: SpecRow[];
}

export interface CostEstimateItem {
  id: string;
  sn: string;
  particulars: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number; // auto-calculated qty * rate
  isVatApplicable?: boolean; // true = 13% VAT applies, false = Exempt / Non-VAT
  remarks: string;
}

export interface CostEstimateData {
  id?: string;
  documentTitle: string;
  organizationName: string;
  headerLines?: string[];
  fiscalYear: string;
  vehicleCategory: string;
  items: CostEstimateItem[];
  subTotal?: number;
  taxableAmount?: number;
  nonTaxableAmount?: number;
  vatRatePercent?: number; // default 13%
  vatAmount?: number;
  totalAmount: number; // Grand total (subTotal + vatAmount)
  preparedBy: string;
  designation: string;
  nec?: string;
  approvedBy?: string;
  updated_at?: string;
}


export interface SpecContent {
  documentTitle: string;
  organizationName: string;
  fiscalYear: string;
  tenderNo?: string;
  bidderName?: string;
  vehicleCategory: string;
  vehicleDescription: string;
  make?: string;
  model?: string;
  countryOfOrigin?: string;
  deliveryPlace?: string;
  preparedBy?: string;
  designation?: string;
  nec?: string;
  approvedBy?: string;
  customHeaderRows?: CustomHeaderRow[];
  headerLines?: string[];
  costEstimate?: CostEstimateData;
  sections: SpecSection[];
  generalNotes?: string;
  warrantyPeriod?: string;
  stage?: DocumentStage;
  inspectionDetails?: InspectionDetails;
}

export interface StandardSpecification {
  id: string;
  title: string;
  category: VehicleCategory;
  description: string;
  version: string;
  sourceText?: string;
  content: SpecContent;
  created_at: string;
  updated_at: string;
}

export interface WorkRecord {
  id: string;
  standard_spec_id?: string;
  standard_spec_title?: string;
  document_name: string;
  organization_name: string;
  vehicle_category: VehicleCategory;
  vehicle_description: string;
  fiscal_year: string;
  bidder_name?: string;
  stage?: DocumentStage;
  column_prefix?: string;
  cost_estimate?: CostEstimateData;
  content: SpecContent;
  created_at: string;
  updated_at: string;
}

export function getRecordStage(record: WorkRecord): DocumentStage {
  if (record.stage) return record.stage;
  if (record.content?.stage) return record.content.stage;
  if (
    record.content?.inspectionDetails?.chassisNo ||
    record.content?.inspectionDetails?.engineNo ||
    record.content?.sections?.some((s) => s.rows?.some((r) => r.inspectionResult && r.inspectionResult !== 'Pending'))
  ) {
    return 'inspected';
  }
  if (
    record.content?.tenderNo ||
    record.content?.make ||
    record.content?.model ||
    record.content?.sections?.some((s) => s.rows?.some((r) => r.compliance && r.compliance !== 'Complied'))
  ) {
    return 'evaluated';
  }
  return 'created';
}

export type VehicleCategory =
  | '4WD Double Cab Pickup'
  | 'Car (Sedan / Hatchback)'
  | 'Jeep (2WD Hardtop)'
  | 'Four Wheel Drive Vehicle'
  | 'School Bus'
  | 'Backhoe Loader'
  | 'Hydraulic Excavator'
  | 'Motorcycle'
  | 'Scooter'
  | 'Combine Mill'
  | 'Mini Tiller'
  | 'Truck'
  | 'Tractor'
  | 'Ambulance'
  | 'SUV'
  | 'Pickup Vehicle'
  | 'Bus'
  | 'Other Vehicle';

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  '4WD Double Cab Pickup',
  'Car (Sedan / Hatchback)',
  'Jeep (2WD Hardtop)',
  'Four Wheel Drive Vehicle',
  'School Bus',
  'Backhoe Loader',
  'Hydraulic Excavator',
  'Motorcycle',
  'Scooter',
  'Combine Mill',
  'Mini Tiller',
  'Truck',
  'Tractor',
  'Ambulance',
  'SUV',
  'Other Vehicle',
];

export interface OfficeEntry {
  ne: string;
  addrNe: string;
  en: string;
  addrEn: string;
  province: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}
