import React, { useState, useMemo } from 'react';
import { KpiAverageItem } from '../utils/matrixCalculations';
import { INITIAL_KPIS } from '../data/initialData';
import { formatKpiNumber } from '../utils/excelParser';
import { BarChart3, ArrowDownWideNarrow, Sparkles, ListOrdered, ArrowUpDown } from 'lucide-react';

interface KpiBarChartProps {
  items?: KpiAverageItem[];
  kpiAverages?: KpiAverageItem[];
  selectedKpi: string | null;
  onSelectKpi: (kpi: string | null) => void;
  useCommaDecimals: boolean;
}

/**
 * Traffic light performance color styling:
 * - Verde (Sobresaliente / Óptimo): 3.0 al 3.5
 * - Amarillo (Regular / Proceso): 2.0 a 2.99
 * - Rojo (Atención / Crítico): 1.0 a 1.99
 */
function getPerformanceColorMeta(avg: number): {
  background: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  category: 'green' | 'yellow' | 'red';
  categoryLabel: string;
} {
  if (avg >= 3.0) {
    return {
      background: 'linear-gradient(90deg, #10B981 0%, #0B7D4B 100%)',
      textColor: 'text-[#0B7D4B]',
      badgeBg: '#0B7D4B',
      badgeText: '#FFFFFF',
      category: 'green',
      categoryLabel: 'Verde (3.0 - 3.5)',
    };
  } else if (avg >= 2.0) {
    return {
      background: 'linear-gradient(90deg, #F59E0B 0%, #B86200 100%)',
      textColor: 'text-[#B86200]',
      badgeBg: '#B86200',
      badgeText: '#FFFFFF',
      category: 'yellow',
      categoryLabel: 'Amarillo (2.0 - 2.99)',
    };
  } else {
    return {
      background: 'linear-gradient(90deg, #F43F5E 0%, #DC2626 100%)',
      textColor: 'text-[#DC2626]',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF',
      category: 'red',
      categoryLabel: 'Rojo (1.0 - 1.99)',
    };
  }
}

export const KpiBarChart: React.FC<KpiBarChartProps> = ({
  items,
  kpiAverages,
  selectedKpi,
  onSelectKpi,
  useCommaDecimals,
}) => {
  const [sortMode, setSortMode] = useState<'caratula' | 'desc' | 'asc'>('caratula');
  const dataList = items || kpiAverages || [];

  // Sort according to official Carátula Institucional order (1 to 11) by default
  const sortedData = useMemo(() => {
    const list = [...dataList];
    if (sortMode === 'caratula') {
      return list.sort((a, b) => {
        const idxA = INITIAL_KPIS.indexOf(a.kpi);
        const idxB = INITIAL_KPIS.indexOf(b.kpi);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.kpi.localeCompare(b.kpi, 'es');
      });
    } else if (sortMode === 'desc') {
      return list.sort((a, b) => b.average - a.average);
    } else {
      return list.sort((a, b) => a.average - b.average);
    }
  }, [dataList, sortMode]);

  const maxScale = 4.0; // KPI Scale (0.0 to 4.0)

  return (
    <div
      id="kpi-bar-chart-container"
      className="w-full bg-white rounded-xl shadow-md border border-[#8A185B]/25 p-4 sm:p-5 mt-4 transition-all"
    >
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#8A185B] text-white shadow-xs">
            <BarChart3 className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h2
              className="text-[14px] sm:text-[16px] font-extrabold text-[#8A185B] uppercase tracking-wider flex items-center gap-1.5 flex-wrap"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              <span>Promedio de KPI FINAL por NOMBRE KPI</span>
              <span className="text-[12px] text-gray-500 font-sans font-normal normal-case flex items-center gap-1">
                <ListOrdered className="w-4 h-4 text-[#E86C1D]" /> 
                {sortMode === 'caratula' ? '(Orden Carátula Institucional)' : sortMode === 'desc' ? '(Mayor a Menor)' : '(Menor a Mayor)'}
              </span>
            </h2>
            <p className="text-[13px] text-gray-500">
              Escala de desempeño ordenada de acuerdo a los Rubros Evaluados de la Carátula Institucional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Selector Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[13px]">
            <button
              onClick={() => setSortMode('caratula')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                sortMode === 'caratula'
                  ? 'bg-[#8A185B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#8A185B]'
              }`}
              title="Ordenar según Carátula Institucional (1 a 11)"
            >
              Carátula (1-11)
            </button>
            <button
              onClick={() => setSortMode('desc')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                sortMode === 'desc'
                  ? 'bg-[#8A185B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#8A185B]'
              }`}
              title="Ordenar de Mayor a Menor Calificación"
            >
              Mayor a Menor
            </button>
          </div>

          {selectedKpi && (
            <button
              onClick={() => onSelectKpi(null)}
              className="text-[13px] text-[#8A185B] bg-pink-50 hover:bg-pink-100 border border-[#8A185B]/30 px-3 py-1 rounded-lg font-bold transition-all shadow-2xs cursor-pointer"
            >
              Quitar filtro: {selectedKpi} ×
            </button>
          )}
        </div>
      </div>

      {/* Bar Chart list with Desempeño Visual */}
      <div className="flex flex-col gap-2.5 pt-1">
        {sortedData.map((item) => {
          const isSelected = selectedKpi === item.kpi;
          const percentage = Math.min(100, Math.max(0, (item.average / maxScale) * 100));
          const colorMeta = getPerformanceColorMeta(item.average);
          const caratulaIndex = INITIAL_KPIS.indexOf(item.kpi);
          const displayIndex = caratulaIndex !== -1 ? caratulaIndex + 1 : null;

          return (
            <div
              key={item.kpi}
              onClick={() => onSelectKpi(isSelected ? null : item.kpi)}
              className={`group flex items-center gap-3 cursor-pointer p-1.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-orange-50/70 ring-2 ring-[#E86C1D] shadow-xs'
                  : 'hover:bg-gray-50'
              }`}
              title={`Filtrar por ${item.kpi}: Promedio ${formatKpiNumber(item.average, useCommaDecimals, 2)} (${colorMeta.categoryLabel})`}
            >
              {/* Left Label */}
              <div className="w-56 sm:w-72 text-right shrink-0 flex items-center justify-end gap-1.5">
                {displayIndex !== null && (
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center border border-slate-200 shrink-0 group-hover:bg-[#8A185B] group-hover:text-white transition-colors">
                    {displayIndex}
                  </span>
                )}
                <span
                  className={`text-[13px] sm:text-[14px] font-bold uppercase truncate transition-colors ${
                    isSelected
                      ? 'text-[#E86C1D] font-extrabold'
                      : 'text-slate-800 group-hover:text-[#8A185B]'
                  }`}
                  title={item.kpi}
                >
                  {item.kpi}
                </span>
              </div>

              {/* Progress Bar Container with Desempeño Visual */}
              <div className="flex-1 flex items-center">
                <div className="w-full bg-gray-100 h-6 rounded-lg overflow-hidden relative shadow-inner">
                  <div
                    className="h-full transition-all duration-700 ease-out rounded-lg shadow-2xs"
                    style={{
                      width: `${percentage}%`,
                      background: colorMeta.background,
                      boxShadow: isSelected ? '0 0 10px rgba(232, 108, 29, 0.4)' : undefined,
                    }}
                  />
                </div>

                {/* Score Number on the Right */}
                <span
                  className={`ml-3 font-mono text-base sm:text-lg font-black min-w-[44px] text-right ${colorMeta.textColor}`}
                >
                  {formatKpiNumber(item.average, useCommaDecimals, 1)}
                </span>
              </div>
            </div>
          );
        })}

        {/* X Axis Ticks */}
        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
          <div className="w-56 sm:w-72 shrink-0" />
          <div className="flex-1 flex justify-between text-[12px] font-mono text-gray-400">
            {[0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map((t) => (
              <span key={t}>{formatKpiNumber(t, useCommaDecimals, 1)}</span>
            ))}
          </div>
          <div className="min-w-[40px]" />
        </div>
      </div>

      {/* Desempeño Visual Semáforo Legend */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[13px] text-gray-500">
        <div className="flex items-center gap-1.5 font-bold text-gray-700 text-[13px]">
          <Sparkles className="w-4 h-4 text-[#E86C1D]" />
          <span>Semáforo de desempeño:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-bold text-[13px]">
          <span className="flex items-center gap-1.5 text-[#0B7D4B] bg-[#E8F8F0] px-2.5 py-0.5 rounded border border-[#0B7D4B]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B7D4B] shadow-2xs" />
            <span>Verde (3.0 al 3.5)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#B86200] bg-[#FEF9EC] px-2.5 py-0.5 rounded border border-[#B86200]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B86200] shadow-2xs" />
            <span>Amarillo (2.0 a 2.99)</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#DC2626] bg-[#FDF2F4] px-2.5 py-0.5 rounded border border-[#DC2626]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] shadow-2xs" />
            <span>Rojo (1.0 a 1.99)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
