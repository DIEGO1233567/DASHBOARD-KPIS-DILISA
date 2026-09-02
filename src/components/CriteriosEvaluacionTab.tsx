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
  scales: EvaluationScale[];
}

const KPI_CRITERIA_DATA: KpiCriteria[] = [
  {
    id: 'cartera-credito',
    name: 'Cartera de Credito',
    category: 'Crédito y Cartera',
    maxScore: 3.5,
    objective: 'Evalúa la oportunidad de conciliación, control de provisiones, partidas en tránsito y recuperación de cartera de crédito.',
    scales: [
      { description: 'Conciliación al 100% sin partidas pendientes > 30 días', score: 3.5, level: 'excelente' },
      { description: 'Conciliación con diferencias menores debidamente identificadas', score: 3.0, level: 'excelente' },
      { description: 'Diferencias en aclaración con antigüedad de 31 a 60 días', score: 2.0, level: 'regular' },
      { description: 'Partidas sin soporte o antigüedad mayor a 60 días', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'inventario-cto-vtas',
    name: 'Inventario/Cto de vtas',
    category: 'Inventarios y Costo de Ventas',
    maxScore: 3.5,
    objective: 'Evalúa la integridad de la conciliación de existencias, valuación y partidas abiertas entre sistemas SAP y BW con rangos de materialidad.',
    scales: [
      { description: 'Integración de SAP/BW PA conciliadas al 100% (<200 mil)', score: 3.5, level: 'excelente' },
      { description: 'Integración de SAP <10 mdp / BW <15 mdp de diferencias', score: 2.5, level: 'bueno' },
      { description: 'Integración de SAP >10 mdp / BW >15 mdp de diferencias', score: 1.5, level: 'critico' },
    ],
  },
  {
    id: 'pagos-anticipados',
    name: 'Pagos Anticipados',
    category: 'Cuentas de Balance',
    maxScore: 3.5,
    objective: 'Monitorea la amortización oportuna de anticipos a proveedores, rentas, seguros y devengo contable correspondiente.',
    scales: [
      { description: 'Amortización correcta y oportuna al 100% con soporte fiscal', score: 3.5, level: 'excelente' },
      { description: 'Amortización con aclaraciones menores resueltas en el mes', score: 3.0, level: 'excelente' },
      { description: 'Anticipos sin amortizar con retraso de 30 a 60 días', score: 2.0, level: 'regular' },
      { description: 'Anticipos mayores a 60 días sin comprobante o devengo', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'proveedores',
    name: 'Proveedores',
    category: 'Pasivos y Proveeduría',
    maxScore: 3.5,
    objective: 'Supervisa la depuración de cuentas por pagar, conciliación de estados de cuenta y partidas abiertas con proveedores.',
    scales: [
      { description: 'Partidas Abiertas depuradas de 0 a 30 días sin diferencias', score: 3.5, level: 'excelente' },
      { description: 'Partidas Abiertas de 31 a 60 días con plan de aclaración', score: 3.0, level: 'excelente' },
      { description: 'Partidas Abiertas de 61 a 90 días en conciliación', score: 2.0, level: 'regular' },
      { description: 'Partidas Abiertas mayores a 90 días sin depurar', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'iva',
    name: 'IVA',
    category: 'Impuestos y Cumplimiento',
    maxScore: 3.5,
    objective: 'Determina el control y la oportunidad en la conciliación de diferencias de Impuesto al Valor Agregado respecto al pago.',
    scales: [
      { description: 'Sin diferencias', score: 3.5, level: 'excelente' },
      { description: 'Diferencias conciliadas antes del pago de Impto', score: 3.0, level: 'excelente' },
      { description: 'Diferencias conciliadas después del pago de Impto', score: 2.0, level: 'regular' },
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
      { description: 'Sin diferencias y con controles establecidos', score: 3.5, level: 'excelente' },
      { description: 'Sin diferencias', score: 3.0, level: 'excelente' },
      { description: 'Diferencias conciliadas', score: 2.5, level: 'bueno' },
      { description: 'Diferencias sin conciliar', score: 1.5, level: 'critico' },
    ],
  },
  {
    id: 'intercias',
    name: 'Intercias',
    category: 'Operaciones Intercompañía',
    maxScore: 3.5,
    objective: 'Monitorea el tiempo de permanencia y conciliación de Partidas Abiertas (PA) entre sociedades del grupo.',
    scales: [
      { description: 'PA Abiertas de 0-30 días', score: 3.5, level: 'excelente' },
      { description: 'PA Abiertas de 31-60 días', score: 3.0, level: 'excelente' },
      { description: 'PA Abiertas mayores a 60 días', score: 2.0, level: 'regular' },
    ],
  },
  {
    id: 'asociados',
    name: 'Asociados',
    category: 'Cuentas y Partidas Abiertas',
    maxScore: 3.0,
    objective: 'Evalúa la antigüedad de las partidas abiertas y la oportunidad de depuración en cuentas por cobrar / pagar con asociados.',
    scales: [
      { description: '1 a 90 días', score: 3.0, level: 'excelente' },
      { description: '91 a 120 días', score: 2.5, level: 'bueno' },
      { description: '121 a 180 días', score: 2.0, level: 'regular' },
      { description: 'Mayor a 180 días', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'cuentas-de-mayor',
    name: 'Cuentas De Mayor',
    category: 'Contabilidad General',
    maxScore: 3.0,
    objective: 'Evalúa la antigüedad y depuración periódica de saldos y partidas en cuentas de balance de mayor general.',
    scales: [
      { description: 'Saldos conciliados con antigüedad de 1 a 90 días', score: 3.0, level: 'excelente' },
      { description: 'Partidas con antigüedad de 91 a 120 días', score: 2.5, level: 'bueno' },
      { description: 'Partidas con antigüedad de 121 a 180 días', score: 2.0, level: 'regular' },
      { description: 'Partidas con antigüedad mayor a 180 días', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'conc-ing-contabilidad-electronica',
    name: 'Conc. Ing. Contabilidad Electronica',
    category: 'Ingresos y Fiscal',
    maxScore: 3.0,
    objective: 'Mide la exactitud en la conciliación de ingresos facturados vs contabilidad electrónica y timbrado fiscal SAT.',
    scales: [
      { description: 'Sin diferencias o trabajos pendientes conciliados al 100%', score: 3.0, level: 'excelente' },
      { description: 'Con diferencias menores o aclaraciones en proceso', score: 2.0, level: 'regular' },
      { description: 'Rechazada / Sin explicaciones suficientes / No entregada', score: 1.0, level: 'critico' },
    ],
  },
  {
    id: 'conc-ing-mercaderias',
    name: 'Conc. Ing. Mercaderias (Difer. Sis)',
    category: 'Ingresos y Mercaderías',
    maxScore: 3.5,
    objective: 'Supervisa el umbral monetario de diferencias de sistema tolerables en ingresos de mercaderías e inventarios.',
    scales: [
      { description: 'Sin diferencias significativas menor a $500', score: 3.5, level: 'excelente' },
      { description: 'Diferencia Aceptable menor a $5,000', score: 3.0, level: 'excelente' },
      { description: 'Diferencia Alta $5,001 hasta $100,000', score: 2.0, level: 'regular' },
      { description: 'Diferencia Crítica mayor a $100,000 sin conciliar', score: 1.0, level: 'critico' },
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
                            {kpi.objective}
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
