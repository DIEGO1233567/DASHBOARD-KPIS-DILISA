import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  BookOpen
} from 'lucide-react';
import { formatKpiNumber } from '../utils/excelParser';

interface EvaluationScale {
  description: string;
  score: number;
  level: 'excelente' | 'bueno' | 'regular' | 'critico';
}

interface KpiCriteria {
  id: string;
  name: string;
  category: string;
  objective: string;
  maxScore: number;
  note?: string;
  scales: EvaluationScale[];
}

const KPI_CRITERIA_DATA: KpiCriteria[] = [
  {
    id: 'asociados-ctas-mayor',
    name: "KPI'S ASOCIADOS y CTAS DE MAYOR",
    category: 'Cuentas y Partidas Abiertas',
    maxScore: 3.0,
    objective: 'Evalúa la clasificación y depuración de partidas por antigüedad en cuentas con asociados y balance de mayor general.',
    scales: [
      { description: '1 a 90 días', score: 3.0, level: 'excelente' },
      { description: '91 a 120 días', score: 2.5, level: 'bueno' },
      { description: '121 a 180 días', score: 2.0, level: 'regular' },
      { description: 'Mayor a 180 días', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'iva',
    name: 'IVA',
    category: 'Impuestos y Cumplimiento',
    maxScore: 3.5,
    objective: 'Determina el control y la oportunidad en la conciliación de diferencias de Impuesto al Valor Agregado respecto al pago de impuesto.',
    scales: [
      { description: 'Si diferencias', score: 3.5, level: 'excelente' },
      { description: 'Diferencias conciliadas antes del pago de Impto', score: 3.0, level: 'excelente' },
      { description: 'Diferencias conciliadas despues del pago de Impto', score: 2.0, level: 'regular' },
      { description: 'Diferencias sin conciliar', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'isr',
    name: 'ISR',
    category: 'Impuestos y Cumplimiento',
    maxScore: 3.5,
    objective: 'Valora la conciliación de diferencias y la implementación de controles establecidos para el Impuesto Sobre la Renta.',
    scales: [
      { description: 'Si diferencias y con controles establecidos', score: 3.5, level: 'excelente' },
      { description: 'Sin diferencias', score: 3.0, level: 'excelente' },
      { description: 'Diferencias conciliadas', score: 2.5, level: 'bueno' },
      { description: 'Diferencias sin conciliar', score: 1.5, level: 'critico' },
    ],
  },
  {
    id: 'intercias',
    name: 'INTERCOMPAÑIAS',
    category: 'Operaciones Intercompañía',
    maxScore: 3.5,
    objective: 'Monitorea el tiempo de permanencia y conciliación de Partidas Abiertas (PA) entre intercompañías del grupo.',
    scales: [
      { description: 'PA Abiertas de 0-30 días', score: 3.5, level: 'excelente' },
      { description: 'PA Abiertas de 31-60 días', score: 3.0, level: 'excelente' },
      { description: 'PA Abiertas mayores a 60 días', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'inventarios-cto-vtas',
    name: 'INVENTARIOS Y COSTO DE VENTAS',
    category: 'Inventarios y Costo de Ventas',
    maxScore: 3.5,
    objective: 'Evalúa la conciliación de inventarios y costo de ventas en la integración de SAP/BW y límites de diferencias en partidas abiertas.',
    scales: [
      { description: 'Integración de SAP/BW PA conciliadas al 100% (<200 mil)', score: 3.5, level: 'excelente' },
      { description: 'Integración de SAP <10 mdp/BW <15 mdp de diferencias', score: 2.5, level: 'bueno' },
      { description: 'Integración de SAP >10 mdp/BW >15 mdp de diferencias', score: 1.5, level: 'critico' },
    ],
  },
  {
    id: 'pagos-anticipados-seguros',
    name: 'PAGOS ANTICIPADOS / PRIMAS DE SEGUROS Y FIANZAS',
    category: 'Pagos Anticipados',
    maxScore: 3.0,
    objective: 'Monitorea el estatus de pólizas de seguros y fianzas, vigencia de coberturas y amortización mensual.',
    scales: [
      { description: 'Pólizas vigentes, cobertura activa y al corriente.', score: 3.0, level: 'excelente' },
      { description: 'Vencen en 15-30 días sin pago, desfase contable de 1 mes.', score: 2.0, level: 'regular' },
      { description: 'Pólizas vencidas sin renovar, saldo congelado >60 días.', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'conc-ing-mercaderias',
    name: 'CONC. ING. MERCADERIAS (DIFER. SIS)',
    category: 'Ingresos y Mercaderías',
    maxScore: 3.5,
    objective: 'Supervisa el umbral monetario de diferencias de sistema tolerables en conciliación de ingresos por mercaderías.',
    scales: [
      { description: 'Sin diferencias significativas menor a $500', score: 3.5, level: 'excelente' },
      { description: 'Diferencia Aceptable menor a $5,000.', score: 3.0, level: 'excelente' },
      { description: 'Diferencia Alta $5,001 hasta - $100,000', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'cartera-credito',
    name: 'CARTERA DE CRÉDITO',
    category: 'Crédito y Cartera',
    maxScore: 2.5,
    objective: 'Supervisa la variación mensual de la cartera de crédito y el control sobre incrementos o acumulaciones excedentes.',
    scales: [
      { description: 'Variación mensual dentro del rango.', score: 2.5, level: 'bueno' },
      { description: 'Variación superior al 5%, sujeta a análisis.', score: 1.5, level: 'regular' },
      { description: 'Incrementos recurrentes o acumulaciones que excedan.', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'pagos-anticipados-garantia',
    name: 'PAGOS ANTICIPADOS / DEPOSITOS EN GARANTIA',
    category: 'Pagos Anticipados',
    maxScore: 3.0,
    objective: 'Supervisa el amparo contractual, vigencia y conciliación oportuna de los depósitos en garantía.',
    scales: [
      { description: '100% amparado y vigente, conciliación confirmada al día.', score: 3.0, level: 'excelente' },
      { description: 'Contrato vencido 30-90 días, devolución demorada 1-2 meses.', score: 2.0, level: 'regular' },
      { description: 'Sin devolución >90 días, saldo sin contrato.', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'pagos-anticipados-anticipos',
    name: 'PAGOS ANTICIPADOS / ANTICIPOS PROVEEDORES',
    category: 'Pagos Anticipados',
    maxScore: 3.0,
    objective: 'Supervisa la antigüedad de anticipos otorgados a proveedores, su amortización puntual y comprobación fiscal.',
    scales: [
      { description: 'Antigüedad menor a 30 días, amortización puntual y comprobada.', score: 3.0, level: 'excelente' },
      { description: 'Antigüedad 31-60 días sin factura, desfase de 1 mes en devengo.', score: 2.0, level: 'regular' },
      { description: 'Antigüedad >60 días sin entrega, riesgo fiscal o incobrable.', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'pagos-anticipados-suministros',
    name: 'PAGOS ANTICIPADOS / INVENTARIOS Y SUMINISTROS',
    category: 'Pagos Anticipados',
    maxScore: 3.0,
    objective: 'Evalúa la conciliación física de inventarios y suministros, niveles óptimos de stock y rotación de materiales.',
    scales: [
      { description: 'Stock óptimo y exacto, conciliación física al 100%.', score: 3.0, level: 'excelente' },
      { description: 'Sobrestock (45-90 días), sin rotación entre 90 y 180 días.', score: 2.0, level: 'regular' },
      { description: 'Exceso >90 días o desabasto, material obsoleto >180 días.', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'ligado',
    name: 'LIGADO CONT. ELECT.',
    category: 'Ingresos y Fiscal',
    maxScore: 3.0,
    objective: 'Mide la exactitud del porcentaje de ligado entre la facturación de ingresos y la contabilidad electrónica SAT (LIGADO CONT. ELECT.).',
    scales: [
      { description: 'Ligado 100%', score: 3.0, level: 'excelente' },
      { description: 'Ligado 97% - 99.9%', score: 2.9, level: 'bueno' },
      { description: 'Ligado 95% - 96.9%', score: 2.8, level: 'bueno' },
      { description: 'Ligado 85% - 94.9%', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'proveedores-domiciliacion',
    name: 'PROVEEDORES / INCORPORACIÓN DOMICILIACIÓN',
    category: 'Proveedores y Servicios Financieros',
    maxScore: 3.5,
    objective: 'Monitorea el número de altas mensuales en el proceso de incorporación a domiciliación de pagos de servicios financieros (SSFF).',
    scales: [
      { description: 'Altas: 101 a 200 (SSFF)', score: 3.5, level: 'excelente' },
      { description: 'Altas: 75 a 100 (SSFF)', score: 3.2, level: 'excelente' },
      { description: 'Altas: 74 (SSFF)', score: 3.0, level: 'excelente' },
      { description: 'Altas: 50 a 73 (SSFF)', score: 2.5, level: 'bueno' },
      { description: 'Altas: 0 a 49 (SSFF)', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-propuestas-pago',
    name: 'PROVEEDORES / PROPUESTAS DE PAGO',
    category: 'Proveedores y Tesorería',
    maxScore: 4.0,
    objective: 'Evalúa la ejecución en tiempo, nivel de automatización y tasa de error en la generación de propuestas de pago a proveedores.',
    scales: [
      { description: '100% Automatizadas sin error', score: 4.0, level: 'excelente' },
      { description: 'Pagos ejecutados 100%', score: 3.5, level: 'excelente' },
      { description: 'Con error .5 a 1%', score: 2.5, level: 'bueno' },
      { description: 'Con error 1.1 a 3.5%', score: 2.0, level: 'regular' },
      { description: 'Con error 3.6 a 5%', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-facturas-nacional',
    name: 'PROVEEDORES / REGISTRO FACTURAS NACIONAL',
    category: 'Proveedores y Cuentas por Pagar',
    maxScore: 4.0,
    objective: 'Mide el porcentaje de facturas automáticas de proveedores nacionales registradas sin errores.',
    scales: [
      { description: 'Fact. Automáticas: 100%', score: 4.0, level: 'excelente' },
      { description: 'Fact. Automáticas: 90%', score: 3.5, level: 'excelente' },
      { description: 'Fact. Automáticas: 80%', score: 3.0, level: 'excelente' },
      { description: 'Fact. Automáticas: 70%', score: 2.5, level: 'bueno' },
      { description: 'Fact. Automáticas: 50%', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'proveedores-facturas-importacion',
    name: 'PROVEEDORES / REGISTRO FACTURAS IMPORTACIÓN',
    category: 'Proveedores y Cuentas por Pagar',
    maxScore: 4.0,
    objective: 'Evalúa el grado de automatización (Proceso Auto) y exactitud en el registro de facturas de proveedores de importación.',
    scales: [
      { description: 'Proceso Auto: 100%', score: 4.0, level: 'excelente' },
      { description: 'Proceso Auto: 90%', score: 3.5, level: 'excelente' },
      { description: 'Proceso Auto: 70%', score: 3.0, level: 'excelente' },
      { description: 'Proceso Auto: 60%', score: 2.7, level: 'bueno' },
      { description: 'Proceso Auto: 40%', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'proveedores-cxp',
    name: 'PROVEEDORES / CUENTAS POR PAGAR',
    category: 'Proveedores y Cuentas por Pagar',
    maxScore: 3.5,
    objective: 'Supervisa la antigüedad de partidas en cuentas por pagar a proveedores y su nivel de cumplimiento en escala SSFF.',
    scales: [
      { description: '0-90 días (Escala 1: 100 / SSFF: 3.5)', score: 3.5, level: 'excelente' },
      { description: '91-180 días (Escala 1: 110 / SSFF: 3.2)', score: 3.2, level: 'excelente' },
      { description: '181-360 días (Escala 1: 100 / SSFF: 3.0)', score: 3.0, level: 'excelente' },
      { description: '> 361 días (Escala 1: 90 / SSFF: 2.5)', score: 2.5, level: 'bueno' },
      { description: '> 361 días (Escala 1: 70 / SSFF: 1.0)', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-cierre-partidas',
    name: 'PROVEEDORES / CIERRE DE PARTIDAS',
    category: 'Proveedores y Depuración',
    maxScore: 4.0,
    objective: 'Monitorea la depuración y cierre oportuno de partidas abiertas por antigüedad de años en cuentas de proveedores.',
    scales: [
      { description: 'Antigüedad 1 año', score: 4.0, level: 'excelente' },
      { description: 'Antigüedad 1 a 3 años', score: 3.5, level: 'excelente' },
      { description: 'Antigüedad 3 a 5 años (80% 3 años y 20% 5 años)', score: 3.0, level: 'excelente' },
      { description: 'Antigüedad 3 a 5 años mas 20% 5 años', score: 2.7, level: 'bueno' },
      { description: '(+) 5 años con justificación', score: 2.5, level: 'bueno' },
      { description: '(+) 5 años sin justificación', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-gastos-viaje',
    name: 'PROVEEDORES / GASTOS DE VIAJE',
    category: 'Proveedores y Gastos',
    maxScore: 3.5,
    objective: 'Control y seguimiento de comprobaciones de gastos de viaje y boletos de avión no utilizados.',
    note: 'Nota: Para boletos de avión no utilizados se toma una antigüedad de < 365 días.',
    scales: [
      { description: '> 30 días - Sin partidas', score: 3.5, level: 'excelente' },
      { description: '> 60 días - Viajes Vigentes', score: 3.0, level: 'excelente' },
      { description: '> 60 días (46,143) Con comentarios', score: 2.7, level: 'bueno' },
      { description: '> 60 días (43,983) Con comentarios', score: 2.5, level: 'bueno' },
      { description: '> 60 días (>20) Sin comentarios', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-saldos-deudores',
    name: 'PROVEEDORES / SALDOS DEUDORES MERCANCIAS',
    category: 'Proveedores y Mercancías',
    maxScore: 3.5,
    objective: 'Supervisión de saldos deudores con proveedores por concepto de mercancías y su gestión de recuperación.',
    scales: [
      { description: 'Antigüedad 0-90 días', score: 3.5, level: 'excelente' },
      { description: 'Antigüedad > 360 días - C/comentarios recuperación', score: 3.0, level: 'excelente' },
      { description: 'Antigüedad > 360 días - Sin comentarios', score: 2.7, level: 'bueno' },
      { description: 'Antigüedad > 420 días - Sin comentarios', score: 2.0, level: 'regular' },
      { description: 'Antigüedad > 480 días - Sin comentarios', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores-cxp-importaciones',
    name: 'PROVEEDORES / CUENTAS POR PAGAR IMPORTACIONES',
    category: 'Proveedores y Cuentas por Pagar',
    maxScore: 3.5,
    objective: 'Depuración y control de partidas abiertas en cuentas por pagar de importaciones a proveedores del exterior.',
    scales: [
      { description: 'Antigüedad > 180 días - n/a', score: 3.5, level: 'excelente' },
      { description: 'Antigüedad > 360 días - con comentarios', score: 3.0, level: 'excelente' },
      { description: 'Antigüedad > 360 días - en proceso de cierre', score: 2.7, level: 'bueno' },
      { description: 'Antigüedad > 360 días - Sin comentarios', score: 2.0, level: 'regular' },
      { description: 'Antigüedad > 490 días - Sin comentarios', score: 1.0, level: 'critico' },
    ],
  },
];

interface CriteriosEvaluacionTabProps {
  useCommaDecimals: boolean;
}

export const CriteriosEvaluacionTab: React.FC<CriteriosEvaluacionTabProps> = ({ useCommaDecimals }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCriteria = KPI_CRITERIA_DATA.filter((kpi) => {
    const term = searchTerm.toLowerCase();
    return (
      kpi.name.toLowerCase().includes(term) ||
      kpi.category.toLowerCase().includes(term) ||
      kpi.objective.toLowerCase().includes(term) ||
      kpi.scales.some((s) => s.description.toLowerCase().includes(term))
    );
  });

  const renderBadge = (score: number) => {
    const scoreFormatted = formatKpiNumber(score, useCommaDecimals, 1);
    if (score >= 3.0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[84px] px-4 py-1.5 rounded-full text-[17px] sm:text-[18px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs font-mono">
          {scoreFormatted}
        </span>
      );
    }
    if (score >= 2.0) {
      return (
        <span className="inline-flex items-center justify-center min-w-[84px] px-4 py-1.5 rounded-full text-[17px] sm:text-[18px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-mono">
          {scoreFormatted}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center min-w-[84px] px-4 py-1.5 rounded-full text-[17px] sm:text-[18px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs font-mono">
        {scoreFormatted}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por KPI, descripción, objetivo o rango..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-gray-50/90 border border-gray-200 rounded-lg text-[16px] sm:text-[17px] focus:outline-none focus:ring-2 focus:ring-[#8F2366] focus:bg-white transition-all"
          />
        </div>

        <div className="text-[16px] sm:text-[17px] text-gray-600 font-medium">
          Mostrando <strong className="text-slate-800 font-bold">{filteredCriteria.length}</strong> de {KPI_CRITERIA_DATA.length} KPI's evaluados
        </div>
      </div>

      {/* MATRIZ EJECUTIVA TABULAR */}
      <div className="bg-white rounded-2xl shadow-md border border-[#8F2366]/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-[#8F2366] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-pink-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3
                className="font-bold text-[18px] sm:text-[21px] tracking-wider uppercase text-white"
                style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
              >
                Matriz de Ponderación y Criterios Oficiales de Evaluación
              </h3>
            </div>
          </div>
          <span className="text-[16px] sm:text-[17px] bg-white/15 px-4 py-1 rounded-full font-mono font-bold text-white self-start sm:self-auto border border-white/20">
            {KPI_CRITERIA_DATA.length} Indicadores
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[17px] sm:text-[18px] border-collapse">
            <thead>
              <tr className="bg-[#8F2366] text-white border-b-2 border-[#FF6E52] uppercase text-[16px] tracking-wider">
                <th
                  className="py-4 px-4 w-64 border-r border-white/10 font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  KPI / Módulo
                </th>
                <th
                  className="py-4 px-4 w-96 border-r border-white/10 font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  Objetivo de Control
                </th>
                <th
                  className="py-4 px-4 border-r border-white/10 font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  Descripción / Clasificación
                </th>
                <th
                  className="py-4 px-4 text-center w-40 font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  Calificación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCriteria.map((kpi) => (
                <React.Fragment key={kpi.id}>
                  {kpi.scales.map((scale, sIdx) => {
                    const isFirst = sIdx === 0;

                    return (
                      <tr
                        key={`${kpi.id}-${sIdx}`}
                        className="hover:bg-purple-50/30 transition-colors"
                      >
                        {isFirst && (
                          <td
                            rowSpan={kpi.scales.length}
                            className="py-4 px-4 align-top font-bold text-slate-900 border-r border-gray-200 bg-gray-50/60"
                          >
                            <span
                              className="block uppercase text-[18px] sm:text-[19px] text-[#502446] font-extrabold"
                              style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                            >
                              {kpi.name}
                            </span>
                            <span className="text-[15px] text-gray-500 font-semibold block mt-1">
                              {kpi.category}
                            </span>
                            <span className="inline-block mt-2.5 font-mono text-[15px] font-bold text-[#854E8D] bg-purple-100/70 px-3 py-1 rounded border border-purple-200">
                              Máx: {formatKpiNumber(kpi.maxScore, useCommaDecimals, 1)} pts
                            </span>
                          </td>
                        )}

                        {isFirst && (
                          <td
                            rowSpan={kpi.scales.length}
                            className="py-4 px-4 align-top text-gray-700 text-[17px] leading-relaxed border-r border-gray-200 bg-gray-50/30"
                          >
                            <div>{kpi.objective}</div>
                            {kpi.note && (
                              <div className="mt-2.5 text-[14px] text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 font-medium leading-normal">
                                {kpi.note}
                              </div>
                            )}
                          </td>
                        )}

                        <td className="py-3.5 px-4 text-gray-800 font-medium text-[17px] border-r border-gray-200">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#854E8D] shrink-0" />
                            <span>{scale.description}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {renderBadge(scale.score)}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCriteria.length === 0 && (
        <div className="w-full bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 text-base mb-1">No se encontraron criterios de evaluación</h4>
          <p className="text-xs text-gray-500 mb-4">No hay resultados que coincidan con "{searchTerm}".</p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 bg-[#502446] hover:bg-[#3D1432] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Limpiar Búsqueda
          </button>
        </div>
      )}
    </div>
  );
};
