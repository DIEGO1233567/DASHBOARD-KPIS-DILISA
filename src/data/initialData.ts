import { KpiRecord } from '../types';

export const INITIAL_KPIS = [
  'Cartera de Credito',
  'Inventario/Cto de vtas',
  'Pagos Anticipados',
  'Proveedores',
  'IVA',
  'ISR',
  'Intercias',
  'Asociados',
  'Cuentas De Mayor',
  'Conc. Ing. Contabilidad Electronica',
  'Conc. Ing. Mercaderias (Difer. Sis)',
];

export const INITIAL_AREAS = [
  'Contraloría Boutiques',
  'Contraloría Corporativa',
  'Contraloría Fondos',
  'Contraloría Inmobiliaria',
  'Contraloría Operativa',
  'Contraloría Servicios',
  'Contraloría Suburbia',
  'Contraloría Suburbia (Operaciones)',
  'Control De Ingresos',
  'Finanzas Wholesale',
  'POR DEFINIR',
];

export const DEFAULT_YEARS = ['2026', '2025'];
export const DEFAULT_PERIODOS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const DEFAULT_SOCIEDADES = [
  '1000 - DISTRIBUIDORA LIVERPOOL, S.A. DE C.V.',
  '1001 - OPERADORA LIVERPOOL, S.A. DE C.V.',
  '1002 - SERVICIOS FINANCIEROS LIVERPOOL, S.A.P.I. DE C.V.',
  '2000 - SUBURBIA, S. DE R.L. DE C.V.',
  '2001 - OPERADORA SUBURBIA, S. DE R.L. DE C.V.',
  '3000 - SERVICIOS INTEGRALES LIVERPOOL, S.A. DE C.V.',
  '4000 - INMOBILIARIA LIVERPOOL, S.A. DE C.V.',
  '5000 - BOUTIQUES LIVERPOOL, S.A. DE C.V.',
  '6000 - BANCO LIVERPOOL / CRÉDITO',
  '7000 - FONDOS Y SERVICIOS INTEGRALES LIVERPOOL',
];
export const DEFAULT_RESPONSABLES = [
  'Gerardo García',
  'Jazmín Romero',
  'Carlos Mendoza',
  'María Elena Torres',
  'Roberto Sánchez',
  'Laura Gómez',
  'Jorge Ramírez',
  'Ana Patricia Silva',
  'Fernando Ortiz',
  'Patricia Hernández',
  'Alejandro Morales',
  'Verónica Castillo',
];
export const DEFAULT_SEGMENTOS = [
  'Tenedora',
  'Comercializadora',
  'Inmobiliaria',
  'Operadora',
  'Servicios',
  'Financiera / Crédito',
  'Boutiques',
  'Suburbia',
];

// Base matrix points for the 11 updated KPIs
const BASE_MATRIX_POINTS: Array<{ area: string; kpi: string; kpiFinal: number; weight: number }> = [
  // Contraloría Boutiques
  { area: 'Contraloría Boutiques', kpi: 'Inventario/Cto de vtas', kpiFinal: 2.80, weight: 120 },
  { area: 'Contraloría Boutiques', kpi: 'Proveedores', kpiFinal: 2.90, weight: 130 },
  { area: 'Contraloría Boutiques', kpi: 'IVA', kpiFinal: 3.50, weight: 110 },
  { area: 'Contraloría Boutiques', kpi: 'ISR', kpiFinal: 1.50, weight: 60 },
  { area: 'Contraloría Boutiques', kpi: 'Intercias', kpiFinal: 2.70, weight: 140 },
  { area: 'Contraloría Boutiques', kpi: 'Asociados', kpiFinal: 1.70, weight: 120 },
  { area: 'Contraloría Boutiques', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 1.30, weight: 80 },

  // Contraloría Corporativa
  { area: 'Contraloría Corporativa', kpi: 'Cartera de Credito', kpiFinal: 3.00, weight: 140 },
  { area: 'Contraloría Corporativa', kpi: 'Pagos Anticipados', kpiFinal: 3.20, weight: 110 },
  { area: 'Contraloría Corporativa', kpi: 'Proveedores', kpiFinal: 3.00, weight: 150 },
  { area: 'Contraloría Corporativa', kpi: 'IVA', kpiFinal: 2.00, weight: 130 },
  { area: 'Contraloría Corporativa', kpi: 'ISR', kpiFinal: 3.50, weight: 120 },
  { area: 'Contraloría Corporativa', kpi: 'Intercias', kpiFinal: 3.40, weight: 350 },
  { area: 'Contraloría Corporativa', kpi: 'Asociados', kpiFinal: 2.40, weight: 150 },
  { area: 'Contraloría Corporativa', kpi: 'Cuentas De Mayor', kpiFinal: 2.10, weight: 200 },

  // Contraloría Fondos
  { area: 'Contraloría Fondos', kpi: 'Intercias', kpiFinal: 2.90, weight: 110 },
  { area: 'Contraloría Fondos', kpi: 'Asociados', kpiFinal: 2.20, weight: 90 },
  { area: 'Contraloría Fondos', kpi: 'Cuentas De Mayor', kpiFinal: 2.80, weight: 100 },

  // Contraloría Inmobiliaria
  { area: 'Contraloría Inmobiliaria', kpi: 'Pagos Anticipados', kpiFinal: 2.60, weight: 105 },
  { area: 'Contraloría Inmobiliaria', kpi: 'Proveedores', kpiFinal: 2.80, weight: 120 },
  { area: 'Contraloría Inmobiliaria', kpi: 'IVA', kpiFinal: 2.60, weight: 115 },
  { area: 'Contraloría Inmobiliaria', kpi: 'ISR', kpiFinal: 2.20, weight: 95 },
  { area: 'Contraloría Inmobiliaria', kpi: 'Intercias', kpiFinal: 3.50, weight: 220 },
  { area: 'Contraloría Inmobiliaria', kpi: 'Asociados', kpiFinal: 2.20, weight: 100 },
  { area: 'Contraloría Inmobiliaria', kpi: 'Cuentas De Mayor', kpiFinal: 2.10, weight: 140 },
  { area: 'Contraloría Inmobiliaria', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.00, weight: 120 },

  // Contraloría Operativa
  { area: 'Contraloría Operativa', kpi: 'Inventario/Cto de vtas', kpiFinal: 3.10, weight: 140 },
  { area: 'Contraloría Operativa', kpi: 'Proveedores', kpiFinal: 2.90, weight: 130 },
  { area: 'Contraloría Operativa', kpi: 'IVA', kpiFinal: 3.00, weight: 140 },
  { area: 'Contraloría Operativa', kpi: 'ISR', kpiFinal: 2.10, weight: 90 },
  { area: 'Contraloría Operativa', kpi: 'Intercias', kpiFinal: 3.50, weight: 260 },
  { area: 'Contraloría Operativa', kpi: 'Asociados', kpiFinal: 1.90, weight: 110 },
  { area: 'Contraloría Operativa', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.00, weight: 130 },

  // Contraloría Servicios
  { area: 'Contraloría Servicios', kpi: 'Pagos Anticipados', kpiFinal: 2.90, weight: 130 },
  { area: 'Contraloría Servicios', kpi: 'Proveedores', kpiFinal: 2.70, weight: 120 },
  { area: 'Contraloría Servicios', kpi: 'IVA', kpiFinal: 2.60, weight: 110 },
  { area: 'Contraloría Servicios', kpi: 'ISR', kpiFinal: 2.20, weight: 90 },
  { area: 'Contraloría Servicios', kpi: 'Intercias', kpiFinal: 3.30, weight: 210 },
  { area: 'Contraloría Servicios', kpi: 'Asociados', kpiFinal: 2.00, weight: 100 },
  { area: 'Contraloría Servicios', kpi: 'Cuentas De Mayor', kpiFinal: 2.10, weight: 110 },
  { area: 'Contraloría Servicios', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.00, weight: 120 },

  // Contraloría Suburbia
  { area: 'Contraloría Suburbia', kpi: 'Inventario/Cto de vtas', kpiFinal: 3.00, weight: 180 },
  { area: 'Contraloría Suburbia', kpi: 'Proveedores', kpiFinal: 2.90, weight: 150 },
  { area: 'Contraloría Suburbia', kpi: 'IVA', kpiFinal: 2.30, weight: 120 },
  { area: 'Contraloría Suburbia', kpi: 'ISR', kpiFinal: 2.80, weight: 160 },
  { area: 'Contraloría Suburbia', kpi: 'Intercias', kpiFinal: 3.50, weight: 340 },
  { area: 'Contraloría Suburbia', kpi: 'Asociados', kpiFinal: 2.10, weight: 150 },
  { area: 'Contraloría Suburbia', kpi: 'Cuentas De Mayor', kpiFinal: 2.10, weight: 130 },
  { area: 'Contraloría Suburbia', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.00, weight: 140 },

  // Contraloría Suburbia (Operaciones)
  { area: 'Contraloría Suburbia (Operaciones)', kpi: 'Inventario/Cto de vtas', kpiFinal: 1.00, weight: 60 },
  { area: 'Contraloría Suburbia (Operaciones)', kpi: 'IVA', kpiFinal: 2.30, weight: 90 },
  { area: 'Contraloría Suburbia (Operaciones)', kpi: 'ISR', kpiFinal: 1.50, weight: 70 },
  { area: 'Contraloría Suburbia (Operaciones)', kpi: 'Intercias', kpiFinal: 2.50, weight: 130 },
  { area: 'Contraloría Suburbia (Operaciones)', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.00, weight: 80 },

  // Control De Ingresos
  { area: 'Control De Ingresos', kpi: 'Conc. Ing. Mercaderias (Difer. Sis)', kpiFinal: 3.10, weight: 320 },
  { area: 'Control De Ingresos', kpi: 'Conc. Ing. Contabilidad Electronica', kpiFinal: 3.20, weight: 280 },

  // Finanzas Wholesale
  { area: 'Finanzas Wholesale', kpi: 'Cartera de Credito', kpiFinal: 3.40, weight: 220 },
  { area: 'Finanzas Wholesale', kpi: 'Intercias', kpiFinal: 3.50, weight: 280 },
  { area: 'Finanzas Wholesale', kpi: 'Asociados', kpiFinal: 2.10, weight: 110 },

  // POR DEFINIR
  { area: 'POR DEFINIR', kpi: 'Asociados', kpiFinal: 1.00, weight: 50 },
];

export function generateInitialDataset(targetCount: number = 104847): KpiRecord[] {
  return generateLargeDataset(targetCount);
}

/**
 * Fast memory-efficient synthetic generator for the 104,847 rows dataset
 */
export function generateLargeDataset(count: number = 104847, onProgress?: (pct: number) => void): KpiRecord[] {
  const records: KpiRecord[] = new Array(count);
  const baseLen = BASE_MATRIX_POINTS.length;

  for (let i = 0; i < count; i++) {
    const point = BASE_MATRIX_POINTS[i % baseLen];
    const year = DEFAULT_YEARS[i % DEFAULT_YEARS.length];
    const periodo = DEFAULT_PERIODOS[i % DEFAULT_PERIODOS.length];
    const sociedad = DEFAULT_SOCIEDADES[(i + (i % 3)) % DEFAULT_SOCIEDADES.length];
    const responsable = DEFAULT_RESPONSABLES[(i * 2 + (i % 5)) % DEFAULT_RESPONSABLES.length];
    const segmento = DEFAULT_SEGMENTOS[(i * 3 + (i % 4)) % DEFAULT_SEGMENTOS.length];

    records[i] = {
      id: i + 1,
      ano: year,
      periodo: periodo,
      sociedad: sociedad,
      responsable: responsable,
      segmentoComercial: segmento,
      areaResponsable: point.area,
      kpi: point.kpi,
      kpiFinal: point.kpiFinal,
      meta: 3.0,
      ponderacion: 1.0,
      comentarios: `Registro ${i + 1} para ${point.kpi} - ${point.area}`,
    };

    if (onProgress && i % 25000 === 0) {
      onProgress(Math.round((i / count) * 100));
    }
  }

  if (onProgress) onProgress(100);
  return records;
}
