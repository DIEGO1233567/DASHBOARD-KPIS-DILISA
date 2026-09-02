import { FilterState, KpiRecord, MatrixCellData, MatrixData } from '../types';

export function filterRecords(records: KpiRecord[], filters: FilterState): KpiRecord[] {
  return records.filter((r) => {
    if (filters.ano.length > 0 && !filters.ano.includes(String(r.ano))) {
      return false;
    }
    if (filters.periodo.length > 0 && !filters.periodo.includes(r.periodo)) {
      return false;
    }
    if (filters.sociedad.length > 0 && !filters.sociedad.includes(r.sociedad)) {
      return false;
    }
    if (filters.responsable.length > 0 && !filters.responsable.includes(r.responsable)) {
      return false;
    }
    if (filters.segmentoComercial.length > 0 && !filters.segmentoComercial.includes(r.segmentoComercial)) {
      return false;
    }
    if (filters.selectedKpi && r.kpi !== filters.selectedKpi) {
      return false;
    }
    if (filters.selectedArea && r.areaResponsable !== filters.selectedArea) {
      return false;
    }
    return true;
  });
}

function createEmptyCell(): MatrixCellData {
  return {
    count: 0,
    sum: 0,
    average: 0,
    min: Infinity,
    max: -Infinity,
    values: [],
  };
}

function addValueToCell(cell: MatrixCellData, value: number) {
  cell.count += 1;
  cell.sum += value;
  cell.average = cell.sum / cell.count;
  if (value < cell.min) cell.min = value;
  if (value > cell.max) cell.max = value;
  if (cell.values.length < 500) {
    cell.values.push(value);
  }
}

export function computeMatrixData(
  records: KpiRecord[],
  preferredRows?: string[],
  preferredCols?: string[]
): MatrixData {
  const presentRows = new Set<string>();
  const presentCols = new Set<string>();

  records.forEach((r) => {
    if (r.areaResponsable && r.areaResponsable.trim() !== '') {
      presentRows.add(r.areaResponsable.trim());
    }
    if (r.kpi && r.kpi.trim() !== '') {
      presentCols.add(r.kpi.trim());
    }
  });

  // Sort rows: prioritize preferred order if provided, followed by any new rows from database
  let rows: string[] = [];
  if (preferredRows && preferredRows.length > 0) {
    const fromPreferred = preferredRows.filter((r) => presentRows.has(r));
    const remaining = Array.from(presentRows)
      .filter((r) => !preferredRows.includes(r))
      .sort((a, b) => a.localeCompare(b, 'es'));
    rows = [...fromPreferred, ...remaining];
  } else {
    rows = Array.from(presentRows).sort((a, b) => a.localeCompare(b, 'es'));
  }

  // Sort columns: prioritize preferred order if provided, followed by any new KPIs from database
  let columns: string[] = [];
  if (preferredCols && preferredCols.length > 0) {
    const fromPreferred = preferredCols.filter((c) => presentCols.has(c));
    const remaining = Array.from(presentCols)
      .filter((c) => !preferredCols.includes(c))
      .sort((a, b) => a.localeCompare(b, 'es'));
    columns = [...fromPreferred, ...remaining];
  } else {
    columns = Array.from(presentCols).sort((a, b) => a.localeCompare(b, 'es'));
  }

  const data: Record<string, Record<string, MatrixCellData>> = {};
  const rowTotals: Record<string, MatrixCellData> = {};
  const colTotals: Record<string, MatrixCellData> = {};
  const grandTotal = createEmptyCell();

  // Initialize cells
  rows.forEach((r) => {
    data[r] = {};
    rowTotals[r] = createEmptyCell();
    columns.forEach((c) => {
      data[r][c] = createEmptyCell();
    });
  });

  columns.forEach((c) => {
    colTotals[c] = createEmptyCell();
  });

  // Populate data
  records.forEach((r) => {
    const area = r.areaResponsable ? r.areaResponsable.trim() : '';
    const kpi = r.kpi ? r.kpi.trim() : '';
    const val = r.kpiFinal;

    if (area && kpi && data[area] && data[area][kpi]) {
      addValueToCell(data[area][kpi], val);
      addValueToCell(rowTotals[area], val);
      addValueToCell(colTotals[kpi], val);
      addValueToCell(grandTotal, val);
    }
  });

  return {
    rows,
    columns,
    data,
    rowTotals,
    colTotals,
    grandTotal,
  };
}

export function computeSegmentoMatrixData(
  records: KpiRecord[],
  preferredRows?: string[],
  preferredCols?: string[]
): MatrixData {
  const presentRows = new Set<string>();
  const presentCols = new Set<string>();

  records.forEach((r) => {
    if (r.segmentoComercial && r.segmentoComercial.trim() !== '') {
      presentRows.add(r.segmentoComercial.trim());
    }
    if (r.kpi && r.kpi.trim() !== '') {
      presentCols.add(r.kpi.trim());
    }
  });

  let rows: string[] = [];
  if (preferredRows && preferredRows.length > 0) {
    const fromPreferred = preferredRows.filter((r) => presentRows.has(r));
    const remaining = Array.from(presentRows)
      .filter((r) => !preferredRows.includes(r))
      .sort((a, b) => a.localeCompare(b, 'es'));
    rows = [...fromPreferred, ...remaining];
  } else {
    rows = Array.from(presentRows).sort((a, b) => a.localeCompare(b, 'es'));
  }

  let columns: string[] = [];
  if (preferredCols && preferredCols.length > 0) {
    const fromPreferred = preferredCols.filter((c) => presentCols.has(c));
    const remaining = Array.from(presentCols)
      .filter((c) => !preferredCols.includes(c))
      .sort((a, b) => a.localeCompare(b, 'es'));
    columns = [...fromPreferred, ...remaining];
  } else {
    columns = Array.from(presentCols).sort((a, b) => a.localeCompare(b, 'es'));
  }

  const data: Record<string, Record<string, MatrixCellData>> = {};
  const rowTotals: Record<string, MatrixCellData> = {};
  const colTotals: Record<string, MatrixCellData> = {};
  const grandTotal = createEmptyCell();

  // Initialize cells
  rows.forEach((r) => {
    data[r] = {};
    rowTotals[r] = createEmptyCell();
    columns.forEach((c) => {
      data[r][c] = createEmptyCell();
    });
  });

  columns.forEach((c) => {
    colTotals[c] = createEmptyCell();
  });

  // Populate data
  records.forEach((r) => {
    const seg = r.segmentoComercial ? r.segmentoComercial.trim() : '';
    const kpi = r.kpi ? r.kpi.trim() : '';
    const val = r.kpiFinal;

    if (seg && kpi && data[seg] && data[seg][kpi]) {
      addValueToCell(data[seg][kpi], val);
      addValueToCell(rowTotals[seg], val);
      addValueToCell(colTotals[kpi], val);
      addValueToCell(grandTotal, val);
    }
  });

  return {
    rows,
    columns,
    data,
    rowTotals,
    colTotals,
    grandTotal,
  };
}

export function normalizeQuarter(periodo?: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null {
  if (!periodo) return null;
  const p = periodo.trim().toUpperCase();
  if (p === 'Q1' || p === '1' || p === 'T1' || p.includes('Q1') || p.includes('TRIMESTRE 1') || p.includes('1ER') || p.includes('PRIMER')) return 'Q1';
  if (p === 'Q2' || p === '2' || p === 'T2' || p.includes('Q2') || p.includes('TRIMESTRE 2') || p.includes('2DO') || p.includes('SEGUNDO')) return 'Q2';
  if (p === 'Q3' || p === '3' || p === 'T3' || p.includes('Q3') || p.includes('TRIMESTRE 3') || p.includes('3ER') || p.includes('TERCER')) return 'Q3';
  if (p === 'Q4' || p === '4' || p === 'T4' || p.includes('Q4') || p.includes('TRIMESTRE 4') || p.includes('4TO') || p.includes('CUARTO')) return 'Q4';
  return null;
}

export interface KpiAverageItem {
  kpi: string;
  average: number;
  count: number;
  sum?: number;
  periodos?: string[];
  periodo?: string;
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  q1Count?: number;
  q2Count?: number;
  q3Count?: number;
  q4Count?: number;
  q1Sum?: number;
  q2Sum?: number;
  q3Sum?: number;
  q4Sum?: number;
}

export function computeKpiAverages(records: KpiRecord[], preferredOrder?: string[]): KpiAverageItem[] {
  const map = new Map<
    string,
    {
      sum: number;
      count: number;
      periodos: Set<string>;
      quarters: {
        Q1: { sum: number; count: number };
        Q2: { sum: number; count: number };
        Q3: { sum: number; count: number };
        Q4: { sum: number; count: number };
      };
    }
  >();

  records.forEach((r) => {
    if (!r.kpi) return;
    const current = map.get(r.kpi) || {
      sum: 0,
      count: 0,
      periodos: new Set<string>(),
      quarters: {
        Q1: { sum: 0, count: 0 },
        Q2: { sum: 0, count: 0 },
        Q3: { sum: 0, count: 0 },
        Q4: { sum: 0, count: 0 },
      },
    };
    current.sum += r.kpiFinal;
    current.count += 1;
    if (r.periodo) {
      current.periodos.add(r.periodo.trim());
      const q = normalizeQuarter(r.periodo);
      if (q) {
        current.quarters[q].sum += r.kpiFinal;
        current.quarters[q].count += 1;
      }
    }
    map.set(r.kpi, current);
  });

  const result: KpiAverageItem[] = [];
  map.forEach((value, key) => {
    const sortedPeriodos = Array.from(value.periodos).sort();
    const q1 = value.quarters.Q1.count > 0 ? value.quarters.Q1.sum / value.quarters.Q1.count : null;
    const q2 = value.quarters.Q2.count > 0 ? value.quarters.Q2.sum / value.quarters.Q2.count : null;
    const q3 = value.quarters.Q3.count > 0 ? value.quarters.Q3.sum / value.quarters.Q3.count : null;
    const q4 = value.quarters.Q4.count > 0 ? value.quarters.Q4.sum / value.quarters.Q4.count : null;

    result.push({
      kpi: key,
      average: value.count > 0 ? value.sum / value.count : 0,
      count: value.count,
      sum: value.sum,
      periodos: sortedPeriodos,
      periodo: sortedPeriodos.join(', ') || 'N/A',
      q1,
      q2,
      q3,
      q4,
      q1Count: value.quarters.Q1.count,
      q2Count: value.quarters.Q2.count,
      q3Count: value.quarters.Q3.count,
      q4Count: value.quarters.Q4.count,
      q1Sum: value.quarters.Q1.sum,
      q2Sum: value.quarters.Q2.sum,
      q3Sum: value.quarters.Q3.sum,
      q4Sum: value.quarters.Q4.sum,
    });
  });

  // Sort by preferred order if provided, otherwise descending by average
  if (preferredOrder && preferredOrder.length > 0) {
    return result.sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.kpi);
      const idxB = preferredOrder.indexOf(b.kpi);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.kpi.localeCompare(b.kpi, 'es');
    });
  }

  // Sort descending by average
  return result.sort((a, b) => b.average - a.average);
}
