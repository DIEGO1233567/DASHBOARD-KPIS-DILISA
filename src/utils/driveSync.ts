import { DriveSyncConfig, KpiRecord } from '../types';
import { parseExcelBuffer, ParseExcelResult } from './excelParser';

const STORAGE_KEY = 'kpi_dashboard_drive_config';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Xv3Bf8-lfCXVWoqy2iPP2R5AOEs84BHbO_m2Sb-PrpM/edit?gid=1486132296#gid=1486132296';
export const DEFAULT_FILE_ID = '1Xv3Bf8-lfCXVWoqy2iPP2R5AOEs84BHbO_m2Sb-PrpM';
export const DEFAULT_SHEET_GID = '1486132296';

export const DEFAULT_DRIVE_CONFIG: DriveSyncConfig = {
  fileUrl: DEFAULT_SHEET_URL,
  fileId: DEFAULT_FILE_ID,
  fileName: "BASE KPI'S 2026 FINAL VF",
  fileType: 'sheets',
  autoSyncEnabled: true,
  syncIntervalMinutes: 5, // Default to 5 minutes
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastSyncError: null,
  lastRecordCount: 107444,
  accessToken: '',
  authMethod: 'public',
};

/**
 * Extracts Google Drive File ID or Google Sheet ID from any valid URL or string
 */
export function extractDriveFileId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Pattern 1: /file/d/FILE_ID/view or /file/u/0/d/FILE_ID
  const fileDMatch = trimmed.match(/\/file(?:\/u\/\d+)?\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern 2: /spreadsheets/d/FILE_ID/edit
  const sheetsDMatch = trimmed.match(/\/spreadsheets(?:\/u\/\d+)?\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsDMatch && sheetsDMatch[1]) return sheetsDMatch[1];

  // Pattern 3: id=FILE_ID in query params (e.g. uc?id=... or open?id=...)
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryIdMatch && queryIdMatch[1]) return queryIdMatch[1];

  // Pattern 4: /folders/FOLDER_ID or /drive/folders/
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // Pattern 5: Raw ID string (typically 25 to 60 alphanumeric chars, underscores, hyphens)
  if (/^[a-zA-Z0-9_-]{20,70}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Saves Drive Sync configuration in localStorage
 */
export function saveDriveConfig(config: Partial<DriveSyncConfig>): DriveSyncConfig {
  try {
    const existing = loadDriveConfig();
    const updated: DriveSyncConfig = {
      ...existing,
      ...config,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving Drive config to localStorage', err);
    return { ...DEFAULT_DRIVE_CONFIG, ...config };
  }
}

/**
 * Loads Drive Sync configuration from localStorage
 */
export function loadDriveConfig(): DriveSyncConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DRIVE_CONFIG;
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_DRIVE_CONFIG,
      ...parsed,
      fileUrl: parsed.fileUrl || DEFAULT_SHEET_URL,
      fileId: parsed.fileId || DEFAULT_FILE_ID,
      fileName: parsed.fileName || "BASE KPI'S 2026 FINAL VF",
      fileType: 'sheets',
    };
  } catch (err) {
    console.error('Error reading Drive config from localStorage', err);
    return DEFAULT_DRIVE_CONFIG;
  }
}

export interface DriveFetchResult {
  records: KpiRecord[];
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  source: string;
  totalRows: number;
}

/**
 * Robustly fetches and parses a file from Google Drive.
 * 
 * IMPORTANT: Fixes the 'exportSizeLimitExceeded' (403 "This file is too large to be exported") error:
 * - Uses `files.get?alt=media` for raw binary files (.xlsx / .xls / .csv) which has NO export limit.
 * - Falls back to direct download link / proxy / chunked Sheets if needed.
 */
export async function syncFromGoogleDrive(
  fileUrlOrId: string,
  accessToken?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<DriveFetchResult> {
  const fileId = extractDriveFileId(fileUrlOrId);

  if (!fileId) {
    throw new Error('Por favor ingresa una URL válida de Google Drive o el ID del archivo.');
  }

  onProgress?.(10, 'Iniciando conexión con Google Drive...');

  let fileName = "BASE KPI'S 2026 FINAL VF";
  let mimeType = '';
  let arrayBuffer: ArrayBuffer | null = null;
  let rawText: string | null = null;

  const authHeaders: Record<string, string> = {};
  if (accessToken && accessToken.trim() !== '') {
    authHeaders['Authorization'] = `Bearer ${accessToken.trim()}`;
  }

  // 1. Primary Strategy: Call our backend /api/drive/download proxy
  // This completely eliminates browser CORS blocks and handles both Sheets and XLSX files
  const nowTs = Date.now();
  try {
    onProgress?.(30, 'Descargando datos en vivo desde Google Drive / Google Sheets...');
    const proxyHeaders: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
    };
    if (accessToken && accessToken.trim() !== '') {
      proxyHeaders['Authorization'] = accessToken.trim();
    }

    const proxyRes = await fetch(`/api/drive/download?fileId=${fileId}&_t=${nowTs}`, {
      headers: proxyHeaders,
      cache: 'no-store',
    });

    if (proxyRes.ok) {
      arrayBuffer = await proxyRes.arrayBuffer();
    } else {
      const errJson = await proxyRes.json().catch(() => null);
      console.warn('Backend proxy download returned error:', errJson);
    }
  } catch (proxyErr) {
    console.warn('Backend proxy fetch failed, trying direct browser fallbacks:', proxyErr);
  }

  // 2. Direct browser fallbacks if backend proxy was unavailable
  if (!arrayBuffer) {
    onProgress?.(45, 'Intentando conexión alternativa...');
    const directUrls: { url: string; useAuth: boolean }[] = [];
    if (accessToken) {
      directUrls.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&tq=&_t=${nowTs}`,
        useAuth: true,
      });
      directUrls.push({
        url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&_t=${nowTs}`,
        useAuth: true,
      });
      directUrls.push({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&_t=${nowTs}`,
        useAuth: true,
      });
    }

    directUrls.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&_t=${nowTs}`,
      useAuth: false,
    });
    directUrls.push({
      url: `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&_t=${nowTs}`,
      useAuth: false,
    });
    directUrls.push({
      url: `https://drive.google.com/uc?export=download&id=${fileId}&_t=${nowTs}`,
      useAuth: false,
    });

    for (const item of directUrls) {
      try {
        const res = await fetch(item.url, {
          headers: item.useAuth ? authHeaders : { 'Cache-Control': 'no-cache' },
          cache: 'no-store',
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 200) {
            arrayBuffer = buf;
            break;
          }
        }
      } catch (e) {
        // continue
      }
    }
  }

  if (!arrayBuffer) {
    throw new Error(
      'No se pudo sincronizar el archivo de Google Drive / Google Sheets. Verifica que hayas iniciado sesión con tu cuenta de Google o que el archivo tenga permisos de lectura.'
    );
  }

  onProgress?.(70, 'Procesando y validando matriz de KPI\'s...');

  const parseResult: ParseExcelResult = await parseExcelBuffer(
    arrayBuffer,
    undefined,
    undefined,
    (pct, msg) => onProgress?.(70 + Math.round(pct * 0.25), msg)
  );

  if (!parseResult.records || parseResult.records.length === 0) {
    throw new Error('El archivo descargado no contiene registros válidos de KPI\'s.');
  }

  onProgress?.(100, `¡Sincronización completada! ${parseResult.records.length.toLocaleString('es-MX')} registros.`);

  return {
    records: parseResult.records,
    fileName,
    totalRows: parseResult.records.length,
    source: `Google Drive (${fileId.slice(0, 8)}...)`,
  };
}
