export interface KpiRecord {
  id: string | number;
  ano: string | number;
  periodo: string;
  sociedad: string;
  responsable: string;
  segmentoComercial: string;
  areaResponsable: string;
  kpi: string;
  kpiFinal: number;
  meta?: number;
  ponderacion?: number;
  comentarios?: string;
}

export interface FilterState {
  ano: string[];
  periodo: string[];
  sociedad: string[];
  responsable: string[];
  segmentoComercial: string[];
  selectedKpi: string | null;
  selectedArea: string | null;
}

export interface MatrixCellData {
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  values: number[];
}

export interface MatrixData {
  rows: string[];
  columns: string[];
  data: Record<string, Record<string, MatrixCellData>>;
  rowTotals: Record<string, MatrixCellData>;
  colTotals: Record<string, MatrixCellData>;
  grandTotal: MatrixCellData;
}

export interface ColumnMapping {
  ano: string;
  periodo: string;
  sociedad: string;
  responsable: string;
  segmentoComercial: string;
  areaResponsable: string;
  kpi: string;
  kpiFinal: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  hd?: string; // e.g. liverpool.com.mx
}

export interface DriveSyncConfig {
  fileUrl: string;
  fileId: string;
  fileName: string;
  fileType: 'excel' | 'sheets' | 'csv' | 'unknown';
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // 0 = manual, 1, 5, 10, 15, 30, 60
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError: string | null;
  lastRecordCount: number;
  accessToken: string;
  tokenExpiresAt?: number;
  googleUser?: GoogleUserInfo | null;
  googleClientId?: string;
  authMethod: 'oauth' | 'token' | 'public' | 'gsi' | 'proxy';
}
