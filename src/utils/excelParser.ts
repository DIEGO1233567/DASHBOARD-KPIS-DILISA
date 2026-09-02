import * as XLSX from 'xlsx';
import { ColumnMapping, KpiRecord } from '../types';

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  ano: 'AÑO',
  periodo: 'PERIODO',
  sociedad: 'CONCATENADO',
  responsable: 'CONTRALOR',
  segmentoComercial: 'SEGMENTO COMERCIAL',
  areaResponsable: 'AREA RESPONSABLE',
  kpi: 'KPI',
  kpiFinal: 'KPI FINAL',
};

// Helper to sanitize and fix UTF-8 mojibake encoding issues (e.g., ContralorÃ­a -> Contraloría)
function cleanText(str: string): string {
  if (!str) return '';
  let res = String(str).trim();
  try {
    if (/[\u00C2\u00C3]/.test(res)) {
      const decoded = decodeURIComponent(escape(res));
      if (decoded && !decoded.includes('')) {
        res = decoded;
      }
    }
  } catch {
    // manual fallback
  }
  return res
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã“/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã‘/g, 'Ñ');
}

// Normalize string for fuzzy header matching
function normalizeHeader(str: string): string {
  return cleanText(str || '')
    .toString()
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Z0-9]/g, '_');
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { ...DEFAULT_COLUMN_MAPPING };

  const normalized = headers.map((h, idx) => ({
    index: idx,
    original: h,
    norm: normalizeHeader(h),
  }));

  // Matcher: first exact, then contains
  const findMatch = (patterns: string[]): string | undefined => {
    // 1. Exact match first
    for (const pattern of patterns) {
      const exact = normalized.find((item) => item.norm === pattern);
      if (exact) return exact.original;
    }
    // 2. Starts with / includes keyword
    for (const pattern of patterns) {
      const partial = normalized.find((item) => item.norm.includes(pattern));
      if (partial) return partial.original;
    }
    return undefined;
  };

  const anoMatch = findMatch(['ANO', 'ANIO', 'YEAR', 'EJERCICIO', 'FECHA_ANO']);
  if (anoMatch) mapping.ano = anoMatch;

  const periodoMatch = findMatch(['PERIODO', 'MES', 'MONTH', 'TRIMESTRE', 'QUARTER', 'SEMANA']);
  if (periodoMatch) mapping.periodo = periodoMatch;

  // Sociedad: MUST strictly take CONCATENADO / Column F (index 5)
  // 1. Look specifically for CONCATENADO / CONCAT in header names
  const concatHeader = normalized.find((item) => item.norm === 'CONCATENADO' || item.norm.includes('CONCAT'));
  if (concatHeader) {
    mapping.sociedad = concatHeader.original;
  } else if (headers.length > 5 && headers[5]) {
    // Column F in Excel is index 5
    mapping.sociedad = headers[5];
  } else {
    const sociedadMatch = findMatch([
      'SOCIEDAD_CONCATENADA',
      'SOCIEDAD_NOMBRE',
      'SOCIEDAD',
      'EMPRESA',
      'COMPANIA',
      'COMPANY',
      'ENTIDAD',
    ]);
    if (sociedadMatch) mapping.sociedad = sociedadMatch;
  }

  // Responsable: prioritize CONTRALOR / Column I (index 8)
  const contralorHeader = normalized.find((item) => item.norm.includes('CONTRALOR'));
  if (contralorHeader) {
    mapping.responsable = contralorHeader.original;
  } else if (headers.length > 8 && headers[8]) {
    // Column I in Excel is index 8
    mapping.responsable = headers[8];
  } else {
    const respMatch = findMatch([
      'RESPONSABLE',
      'ENCARGADO',
      'LIDER',
      'OWNER',
      'PERSONA',
      'GERENTE',
    ]);
    if (respMatch) mapping.responsable = respMatch;
  }

  // Segmento Comercial
  const segMatch = findMatch([
    'SEGMENTO_COMERCIAL',
    'SEGMENTO',
    'LINEA_NEGOCIO',
    'UNIDAD_NEGOCIO',
    'CANAL',
    'FORMATO',
  ]);
  if (segMatch) mapping.segmentoComercial = segMatch;

  const areaMatch = findMatch([
    'AREA_RESPONSABLE',
    'AREA',
    'DEPARTAMENTO',
    'DIRECCION',
    'SUBDIRECCION',
    'CENTRO_COSTOS',
  ]);
  if (areaMatch) mapping.areaResponsable = areaMatch;

  const kpiMatch = findMatch(['NOMBRE_KPI', 'KPI', 'INDICADOR', 'METRICA', 'CONCEPTO_KPI', 'NOMBRE']);
  if (kpiMatch) mapping.kpi = kpiMatch;

  const kpiFinalMatch = findMatch([
    'KPI_FINAL',
    'KPI_FINAL_VALOR',
    'VALOR_FINAL',
    'CALIFICACION_FINAL',
    'CALIFICACION',
    'PROMEDIO_KPI',
    'RESULTADO_FINAL',
    'RESULTADO',
    'PUNTUACION',
    'VALOR',
    'SCORE',
  ]);
  if (kpiFinalMatch) mapping.kpiFinal = kpiFinalMatch;

  return mapping;
}

export interface ParseExcelResult {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  records: KpiRecord[];
  totalRows: number;
  mapping: ColumnMapping;
}

/**
 * Parse an Excel ArrayBuffer / Uint8Array (.xlsx / .xls / .csv) into structured KpiRecords
 */
export async function parseExcelBuffer(
  arrayBuffer: ArrayBuffer | Uint8Array,
  customMapping?: Partial<ColumnMapping>,
  sheetName?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<ParseExcelResult> {
  onProgress?.(30, 'Decodificando hojas de cálculo...');
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheetNames = workbook.SheetNames;
  
  // Smart sheet selector: if no sheet is explicitly specified, find the sheet with the most valid KPI data
  let targetSheet = sheetName || sheetNames[0];
  if (!sheetName && sheetNames.length > 1) {
    let bestSheet = sheetNames[0];
    let bestScore = -1;

    for (const sName of sheetNames) {
      const ws = workbook.Sheets[sName];
      if (!ws) continue;
      const sampleRows: any[] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      if (sampleRows.length > 0) {
        // Score based on header matching + row count + sheet name
        const sampleHeaders = (sampleRows[0] || []).map((c: any) => String(c).toUpperCase());
        let matchCount = 0;
        if (sName.toUpperCase() === 'BASE' || sName.toUpperCase().includes('BASE')) matchCount += 5;
        if (sampleHeaders.some((h: string) => h.includes('KPI'))) matchCount += 3;
        if (sampleHeaders.some((h: string) => h.includes('PERIODO') || h.includes('MES'))) matchCount += 2;
        if (sampleHeaders.some((h: string) => h.includes('CONCAT') || h.includes('SOCIEDAD'))) matchCount += 2;
        if (sampleHeaders.some((h: string) => h.includes('AREA') || h.includes('RESPONSABLE'))) matchCount += 2;
        if (sampleHeaders.some((h: string) => h.includes('CONTRALOR'))) matchCount += 2;

        const score = matchCount * 1000 + Math.min(sampleRows.length, 5000);
        if (score > bestScore) {
          bestScore = score;
          bestSheet = sName;
        }
      }
    }
    targetSheet = bestSheet;
  }

  const worksheet = workbook.Sheets[targetSheet];

  onProgress?.(50, `Convirtiendo datos de hoja "${targetSheet}" a formato estructurado...`);
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('La hoja de cálculo está vacía o no contiene datos válidos.');
  }

  // Find header row (usually first non-empty row)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (Array.isArray(row) && row.filter(Boolean).length >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = rawRows[headerRowIndex] as any[];
  const headers = headerRow.map((h, idx) => (h ? String(h).trim() : `Columna_${idx + 1}`));

  const detectedMapping = detectColumnMapping(headers);
  const activeMapping: ColumnMapping = {
    ...detectedMapping,
    ...(customMapping || {}),
  };

  onProgress?.(70, `Procesando ${rawRows.length - headerRowIndex - 1} filas de datos...`);

  // Build column index map with normalized header matching fallback
  const findColIndex = (key: keyof ColumnMapping): number => {
    const targetName = activeMapping[key];
    if (!targetName) return -1;
    // 1. Direct match
    let idx = headers.findIndex((h) => h === targetName);
    if (idx !== -1) return idx;
    // 2. Normalized match
    const targetNorm = normalizeHeader(targetName);
    idx = headers.findIndex((h) => normalizeHeader(h) === targetNorm);
    if (idx !== -1) return idx;
    // 3. Partial match
    idx = headers.findIndex((h) => normalizeHeader(h).includes(targetNorm));
    return idx;
  };

  const colIndexMap: Record<keyof ColumnMapping, number> = {
    ano: findColIndex('ano'),
    periodo: findColIndex('periodo'),
    sociedad: findColIndex('sociedad'),
    responsable: findColIndex('responsable'),
    segmentoComercial: findColIndex('segmentoComercial'),
    areaResponsable: findColIndex('areaResponsable'),
    kpi: findColIndex('kpi'),
    kpiFinal: findColIndex('kpiFinal'),
  };

  // Explicit Column F (index 5) / CONCATENADO resolver
  let concatColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return norm === 'CONCATENADO' || norm.includes('CONCAT');
  });
  if (concatColIndex === -1 && colIndexMap.sociedad !== -1) {
    concatColIndex = colIndexMap.sociedad;
  }
  if (concatColIndex === -1 && headers.length > 5) {
    concatColIndex = 5; // Column F in Excel is index 5
  }

  // Explicit Column I (index 8) / CONTRALOR resolver
  let contralorColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return norm === 'CONTRALOR' || norm.includes('CONTRALOR');
  });
  if (contralorColIndex === -1 && colIndexMap.responsable !== -1) {
    contralorColIndex = colIndexMap.responsable;
  }
  if (contralorColIndex === -1 && headers.length > 8) {
    contralorColIndex = 8; // Column I in Excel is index 8
  }

  // Explicit SEGMENTO COMERCIAL resolver
  let segmentoColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return norm === 'SEGMENTO_COMERCIAL' || norm === 'SEGMENTO COMERCIAL' || norm.includes('SEGMENTO');
  });
  if (segmentoColIndex === -1 && colIndexMap.segmentoComercial !== -1) {
    segmentoColIndex = colIndexMap.segmentoComercial;
  }

  // Explicit ÁREA RESPONSABLE resolver (determines the rows of the matrix)
  let areaColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return (
      norm === 'AREA_RESPONSABLE' ||
      norm === 'AREA RESPONSABLE' ||
      norm === 'ÁREA RESPONSABLE' ||
      norm === 'AREA' ||
      norm === 'ÁREA' ||
      norm.includes('AREA') ||
      norm.includes('RESPONSABLE') ||
      norm.includes('DEPARTAMENTO') ||
      norm.includes('GERENCIA')
    );
  });
  if (areaColIndex === -1 && colIndexMap.areaResponsable !== -1) {
    areaColIndex = colIndexMap.areaResponsable;
  }

  // Explicit KPI column resolver (determines columns of the matrix)
  let kpiColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return norm === 'KPI' || norm === 'NOMBRE_KPI' || norm === 'INDICADOR' || norm === 'CONCEPTO';
  });
  if (kpiColIndex === -1 && colIndexMap.kpi !== -1) {
    kpiColIndex = colIndexMap.kpi;
  }

  // Explicit KPI FINAL / Calificación resolver
  let kpiFinalColIndex = headers.findIndex((h) => {
    const norm = normalizeHeader(h);
    return (
      norm === 'KPI_FINAL' ||
      norm === 'KPI FINAL' ||
      norm.includes('KPI_FINAL') ||
      norm.includes('FINAL') ||
      norm.includes('CALIFICACION') ||
      norm.includes('RESULTADO') ||
      norm.includes('PROMEDIO') ||
      norm.includes('SCORE')
    );
  });
  if (kpiFinalColIndex === -1 && colIndexMap.kpiFinal !== -1) {
    kpiFinalColIndex = colIndexMap.kpiFinal;
  }

  const records: KpiRecord[] = [];
  const totalDataRows = rawRows.length - (headerRowIndex + 1);

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row) || row.every((c) => c === '' || c === null || c === undefined)) {
      continue;
    }

    const getValue = (key: keyof ColumnMapping): string => {
      const idx = colIndexMap[key];
      if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
        return String(row[idx]).trim();
      }
      return '';
    };

    const getNumberValue = (key: keyof ColumnMapping): number => {
      const idx = colIndexMap[key];
      if (idx !== -1 && row[idx] !== undefined && row[idx] !== null) {
        let val = row[idx];
        if (typeof val === 'number') return isNaN(val) ? 0 : val;
        let str = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
        let num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    // Extract Area Responsable (Rows of matrix)
    let area = '';
    if (areaColIndex !== -1 && row[areaColIndex] !== undefined && row[areaColIndex] !== null && String(row[areaColIndex]).trim() !== '') {
      area = cleanText(String(row[areaColIndex]));
    } else {
      area = cleanText(getValue('areaResponsable')) || 'SIN ÁREA';
    }

    // Extract KPI (Columns of matrix)
    let kpi = '';
    if (kpiColIndex !== -1 && row[kpiColIndex] !== undefined && row[kpiColIndex] !== null && String(row[kpiColIndex]).trim() !== '') {
      kpi = cleanText(String(row[kpiColIndex]));
    } else {
      kpi = cleanText(getValue('kpi')) || 'GENERAL';
    }

    // Extract KPI Final numeric value
    let kpiFinal = 0;
    if (kpiFinalColIndex !== -1 && row[kpiFinalColIndex] !== undefined && row[kpiFinalColIndex] !== null) {
      let rawVal = row[kpiFinalColIndex];
      if (typeof rawVal === 'number') {
        kpiFinal = isNaN(rawVal) ? 0 : rawVal;
      } else {
        let str = String(rawVal).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
        let num = parseFloat(str);
        kpiFinal = isNaN(num) ? 0 : num;
      }
    } else {
      kpiFinal = getNumberValue('kpiFinal');
    }

    // Extract Sociedad strictly prioritizing Column F / CONCATENADO
    let sociedad = '';
    if (concatColIndex !== -1 && row[concatColIndex] !== undefined && row[concatColIndex] !== null && String(row[concatColIndex]).trim() !== '') {
      sociedad = cleanText(String(row[concatColIndex]));
    } else if (row[5] !== undefined && row[5] !== null && String(row[5]).trim() !== '') {
      sociedad = cleanText(String(row[5]));
    } else {
      sociedad = cleanText(getValue('sociedad')) || 'General';
    }

    // Extract Contralor strictly prioritizing Column I / CONTRALOR
    let contralor = '';
    if (contralorColIndex !== -1 && row[contralorColIndex] !== undefined && row[contralorColIndex] !== null && String(row[contralorColIndex]).trim() !== '') {
      contralor = cleanText(String(row[contralorColIndex]));
    } else if (row[8] !== undefined && row[8] !== null && String(row[8]).trim() !== '') {
      contralor = cleanText(String(row[8]));
    } else {
      contralor = cleanText(getValue('responsable')) || 'General';
    }

    // Extract Segmento Comercial strictly prioritizing SEGMENTO COMERCIAL
    let segmento = '';
    if (segmentoColIndex !== -1 && row[segmentoColIndex] !== undefined && row[segmentoColIndex] !== null && String(row[segmentoColIndex]).trim() !== '') {
      segmento = cleanText(String(row[segmentoColIndex]));
    } else {
      segmento = cleanText(getValue('segmentoComercial')) || 'General';
    }

    records.push({
      id: `ROW-${i}`,
      ano: cleanText(getValue('ano')) || '2026',
      periodo: cleanText(getValue('periodo')) || 'Q1',
      sociedad: sociedad,
      responsable: contralor,
      segmentoComercial: segmento,
      areaResponsable: area,
      kpi: kpi,
      kpiFinal: kpiFinal,
    });
  }

  onProgress?.(100, `¡Carga completada exitosamente con ${records.length.toLocaleString('es-MX')} filas!`);

  return {
    sheetNames,
    selectedSheet: targetSheet,
    headers,
    records,
    totalRows: records.length,
    mapping: activeMapping,
  };
}

/**
 * Parse an Excel file (.xlsx / .xls / .csv) into structured KpiRecords
 */
export async function parseExcelFile(
  file: File,
  customMapping?: Partial<ColumnMapping>,
  sheetName?: string,
  onProgress?: (progress: number, message: string) => void
): Promise<ParseExcelResult> {
  onProgress?.(10, 'Leyendo archivo binario de Excel...');
  const arrayBuffer = await file.arrayBuffer();
  return parseExcelBuffer(arrayBuffer, customMapping, sheetName, onProgress);
}

/**
 * Generate and download an Excel template workbook for "BASE KPI'S.xlsx"
 */
export function downloadTemplateWorkbook(sampleRecords?: KpiRecord[]) {
  const data = (sampleRecords && sampleRecords.length > 0 ? sampleRecords : [
    {
      'AÑO': 2026,
      'PERIODO': 'Q1',
      'CONCATENADO': '1000 - DISTRIBUIDORA LIVERPOOL, S.A. DE C.V.',
      'CONTRALOR': 'Gerardo García',
      'SEGMENTO COMERCIAL': 'Tenedora',
      'ÁREA RESPONSABLE': 'Contraloría Boutiques',
      'KPI': 'Inventario/Cto de vtas',
      'KPI FINAL': 2.80,
      'META': 3.0,
      'COMENTARIOS': 'Registro primer trimestre 2026',
    },
    {
      'AÑO': 2026,
      'PERIODO': 'Q1',
      'CONCATENADO': '1000 - DISTRIBUIDORA LIVERPOOL, S.A. DE C.V.',
      'CONTRALOR': 'Gerardo García',
      'SEGMENTO COMERCIAL': 'Comercializadora',
      'ÁREA RESPONSABLE': 'Contraloría Corporativa',
      'KPI': 'Intercias',
      'KPI FINAL': 3.40,
      'META': 3.0,
      'COMENTARIOS': 'Conciliación interco completada',
    },
    {
      'AÑO': 2026,
      'PERIODO': 'Q2',
      'CONCATENADO': '2000 - SUBURBIA, S. DE R.L. DE C.V.',
      'CONTRALOR': 'Jazmín Romero',
      'SEGMENTO COMERCIAL': 'Tenedora',
      'ÁREA RESPONSABLE': 'Contraloría Suburbia',
      'KPI': 'Conc. Ing. Contabilidad Electronica',
      'KPI FINAL': 3.00,
      'META': 3.0,
      'COMENTARIOS': 'Auditoría Q2',
    },
    {
      'AÑO': 2026,
      'PERIODO': 'Q2',
      'CONCATENADO': '1000 - DISTRIBUIDORA LIVERPOOL, S.A. DE C.V.',
      'CONTRALOR': 'Jazmín Romero',
      'SEGMENTO COMERCIAL': 'Comercializadora',
      'ÁREA RESPONSABLE': 'Control De Ingresos',
      'KPI': 'Conc. Ing. Mercaderias (Difer. Sis)',
      'KPI FINAL': 3.10,
      'META': 3.0,
      'COMENTARIOS': 'Revisión de conciliación mercaderías Q2',
    },
  ]).map((r: any) => {
    if ('areaResponsable' in r) {
      return {
        'AÑO': r.ano,
        'PERIODO': r.periodo,
        'CONCATENADO': r.sociedad,
        'CONTRALOR': r.responsable,
        'SEGMENTO COMERCIAL': r.segmentoComercial,
        'ÁREA RESPONSABLE': r.areaResponsable,
        'KPI': r.kpi,
        'KPI FINAL': r.kpiFinal,
      };
    }
    return r;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BASE KPI'S");

  // Format header row style width
  ws['!cols'] = [
    { wch: 10 }, // AÑO
    { wch: 14 }, // PERIODO
    { wch: 34 }, // SOCIEDAD
    { wch: 28 }, // RESPONSABLE
    { wch: 28 }, // SEGMENTO COMERCIAL
    { wch: 32 }, // ÁREA RESPONSABLE
    { wch: 26 }, // KPI
    { wch: 14 }, // KPI FINAL
  ];

  XLSX.writeFile(wb, "BASE_KPIS_PLANTILLA.xlsx");
}

/**
 * Format number with comma decimals as in the user's reference image (e.g. 2,6)
 */
export function formatKpiNumber(
  value: number | null | undefined,
  useComma: boolean = false,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  const formatted = value.toFixed(decimals);
  return useComma ? formatted.replace('.', ',') : formatted;
}
