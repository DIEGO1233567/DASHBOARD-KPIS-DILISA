import React, { useMemo, useState } from 'react';
import { PieChart as PieIcon, User, Layers, Award } from 'lucide-react';
import { KpiRecord } from '../types';
import { formatKpiNumber } from '../utils/excelParser';

interface ContralorPieChartProps {
  records: KpiRecord[];
  selectedContralor: string[];
  onSelectContralor: (contralor: string) => void;
  useCommaDecimals: boolean;
}

// Liverpool brand & executive color palette
const CONTRALOR_COLORS = [
  '#FF6200', // Vibrant Orange
  '#B80F56', // Liverpool Magenta
  '#502446', // Deep Plum
  '#0284C7', // Sky Blue
  '#059669', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#0D9488', // Teal
  '#6366F1', // Indigo
  '#10B981', // Green
  '#F43F5E', // Rose
];

const KPI_COLORS: Record<string, string> = {
  'INTERCOMPAÑIAS': '#FF6200',
  'MERCADERIAS': '#F97316',
  'CONCILIACION INGRESOS': '#F59E0B',
  'LIGADO': '#10B981',
  'IVA': '#06B6D4',
  'PROVEEDORES': '#3B82F6',
  'ISR': '#8B5CF6',
  'ASOCIADOS': '#EC4899',
  'CUENTAS DE MAYOR': '#64748B',
  'INVENTARIO - CTO DE VTAS': '#502446',
};

interface SliceData {
  name: string;
  value: number;
  count: number;
  color: string;
}

export const ContralorPieChart: React.FC<ContralorPieChartProps> = ({
  records,
  selectedContralor,
  onSelectContralor,
  useCommaDecimals,
}) => {
  const [viewMode, setViewMode] = useState<'contralores' | 'kpisPorContralor'>('contralores');
  const [focusedContralor, setFocusedContralor] = useState<string>('');
  const [hoveredSlice, setHoveredSlice] = useState<SliceData | null>(null);

  // 1. Group records by Contralor
  const contraloresData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; kpiMap: Map<string, { sum: number; count: number }> }>();

    records.forEach((r) => {
      const name = r.responsable?.trim() || 'Sin Asignar';
      if (!map.has(name)) {
        map.set(name, { total: 0, count: 0, kpiMap: new Map() });
      }
      const item = map.get(name)!;
      item.total += r.kpiFinal;
      item.count += 1;

      const kpiName = r.kpi?.trim() || 'OTRO';
      if (!item.kpiMap.has(kpiName)) {
        item.kpiMap.set(kpiName, { sum: 0, count: 0 });
      }
      const kpiItem = item.kpiMap.get(kpiName)!;
      kpiItem.sum += r.kpiFinal;
      kpiItem.count += 1;
    });

    const result = Array.from(map.entries()).map(([name, data]) => {
      const avg = data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0;
      const kpiBreakdown = Array.from(data.kpiMap.entries()).map(([kpiName, kpiStats]) => ({
        kpi: kpiName,
        avg: Number((kpiStats.sum / kpiStats.count).toFixed(2)),
        count: kpiStats.count,
      })).sort((a, b) => b.avg - a.avg);

      return {
        name,
        avg,
        count: data.count,
        kpiBreakdown,
      };
    });

    return result.sort((a, b) => b.avg - a.avg);
  }, [records]);

  // Active contralor for detailed KPI breakdown
  const activeContralor = useMemo(() => {
    if (focusedContralor) {
      const found = contraloresData.find((c) => c.name === focusedContralor);
      if (found) return found;
    }
    if (selectedContralor.length === 1) {
      const found = contraloresData.find((c) => c.name === selectedContralor[0]);
      if (found) return found;
    }
    return contraloresData[0] || null;
  }, [focusedContralor, selectedContralor, contraloresData]);

  // Current slices based on view mode
  const currentSlices: SliceData[] = useMemo(() => {
    if (viewMode === 'contralores') {
      return contraloresData.map((c, idx) => ({
        name: c.name,
        value: c.avg,
        count: c.count,
        color: CONTRALOR_COLORS[idx % CONTRALOR_COLORS.length],
      }));
    } else {
      if (!activeContralor) return [];
      return activeContralor.kpiBreakdown.map((item, idx) => ({
        name: item.kpi,
        value: item.avg,
        count: item.count,
        color: KPI_COLORS[item.kpi] || CONTRALOR_COLORS[idx % CONTRALOR_COLORS.length],
      }));
    }
  }, [viewMode, contraloresData, activeContralor]);

  if (contraloresData.length === 0) {
    return null;
  }

  // Calculate SVG Pie Segments
  const totalScoreSum = currentSlices.reduce((sum, slice) => sum + slice.value, 0);

  // Generate SVG arcs
  let accumulatedAngle = 0;
  const radius = 90;
  const innerRadius = 52;
  const centerX = 120;
  const centerY = 120;

  const slicePaths = currentSlices.map((slice) => {
    const sliceAngle = totalScoreSum > 0 ? (slice.value / totalScoreSum) * 360 : 0;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return {
      slice,
      pathData,
      startAngle,
      endAngle,
    };
  });

  const getStatusBadge = (val: number) => {
    if (val >= 3.2) return { label: 'Sobresaliente', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (val >= 2.5) return { label: 'Satisfactorio', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (val >= 2.0) return { label: 'En Regularización', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { label: 'Atención Requerida', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  };

  const displayedScore = hoveredSlice
    ? hoveredSlice.value
    : viewMode === 'kpisPorContralor' && activeContralor
    ? activeContralor.avg
    : contraloresData[0]?.avg || 0;

  const displayedLabel = hoveredSlice
    ? hoveredSlice.name
    : viewMode === 'kpisPorContralor' && activeContralor
    ? activeContralor.name
    : 'Promedio';

  return (
    <div
      id="contralor-pie-chart-section"
      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 mt-4 transition-all"
    >
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#502446]/10 rounded-lg text-[#502446]">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Desempeño por Contralor y Calificación de KPI
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6200] border border-orange-200">
                Gráfica de Pastel (1 Decimal)
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Distribución de calificaciones y promedios ponderados según los filtros activos
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 self-start sm:self-auto">
          <button
            onClick={() => {
              setViewMode('contralores');
              setHoveredSlice(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'contralores'
                ? 'bg-white text-[#502446] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Por Contralor
          </button>
          <button
            onClick={() => {
              setViewMode('kpisPorContralor');
              setHoveredSlice(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'kpisPorContralor'
                ? 'bg-white text-[#502446] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Calificación por KPI
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 items-center">
        {/* Left Side: SVG Donut / Pie Chart with Center Stats */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-2">
          {viewMode === 'kpisPorContralor' && activeContralor && (
            <div className="mb-2 text-center">
              <span className="text-xs text-gray-500 font-medium">Contralor analizado:</span>
              <div className="font-bold text-gray-900 text-sm flex items-center justify-center gap-1.5 mt-0.5">
                <span>{activeContralor.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-[#FF6200] border border-orange-200 font-mono">
                  Promedio: {formatKpiNumber(activeContralor.avg, useCommaDecimals, 1)}
                </span>
              </div>
            </div>
          )}

          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90">
              {slicePaths.map(({ slice, pathData }, idx) => {
                const isSelected =
                  viewMode === 'contralores'
                    ? selectedContralor.includes(slice.name) || activeContralor?.name === slice.name
                    : hoveredSlice?.name === slice.name;

                const isHovered = hoveredSlice?.name === slice.name;

                return (
                  <path
                    key={`slice-${idx}`}
                    d={pathData}
                    fill={slice.color}
                    stroke={isSelected ? '#111827' : '#ffffff'}
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-200 hover:opacity-85"
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => {
                      if (viewMode === 'contralores') {
                        setFocusedContralor(slice.name);
                        onSelectContralor(slice.name);
                      }
                    }}
                  />
                );
              })}
            </svg>

            {/* Central Score Card Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-3xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">
                {formatKpiNumber(displayedScore, useCommaDecimals, 1)}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 max-w-[110px] truncate mt-1">
                {displayedLabel}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">Escala 1.0 - 4.0</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-2">
            {viewMode === 'contralores'
              ? 'Haz clic en una rebanada para filtrar la matriz por ese contralor'
              : 'Muestra la calificación a 1 decimal para cada concepto de KPI evaluado'}
          </p>
        </div>

        {/* Right Side: Contralor Ranking & KPI Breakdown Cards */}
        <div className="lg:col-span-6 flex flex-col gap-2.5">
          {viewMode === 'contralores' ? (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Contralor / Responsable</span>
                <span>Calificación</span>
              </div>
              {contraloresData.map((c, idx) => {
                const color = CONTRALOR_COLORS[idx % CONTRALOR_COLORS.length];
                const isFiltered = selectedContralor.includes(c.name);
                const isFocused = activeContralor?.name === c.name;
                const status = getStatusBadge(c.avg);

                return (
                  <div
                    key={c.name}
                    onClick={() => {
                      setFocusedContralor(c.name);
                      onSelectContralor(c.name);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isFiltered
                        ? 'bg-orange-50/80 border-[#FF6200] ring-1 ring-[#FF6200]/30 shadow-xs'
                        : isFocused
                        ? 'bg-purple-50/50 border-[#502446] shadow-2xs'
                        : 'bg-gray-50/60 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="font-bold text-xs text-gray-900">{c.name}</p>
                        <p className="text-[11px] text-gray-500">{c.count} registros evaluados</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-mono font-bold text-sm text-gray-900 min-w-[32px] text-right">
                        {formatKpiNumber(c.avg, useCommaDecimals, 1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {/* Contralor selector row */}
              <div className="flex items-center gap-1.5 pb-2 overflow-x-auto">
                {contraloresData.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setFocusedContralor(c.name)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                      activeContralor?.name === c.name
                        ? 'bg-[#502446] text-white border-[#502446] shadow-xs'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {c.name} ({formatKpiNumber(c.avg, useCommaDecimals, 1)})
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Concepto de KPI</span>
                <span>Calificación</span>
              </div>

              {activeContralor?.kpiBreakdown.map((item, idx) => {
                const color = KPI_COLORS[item.kpi] || CONTRALOR_COLORS[idx % CONTRALOR_COLORS.length];
                const status = getStatusBadge(item.avg);

                return (
                  <div
                    key={item.kpi}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 border border-gray-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-xs text-gray-800">{item.kpi}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-mono font-bold text-xs text-gray-900 min-w-[28px] text-right">
                        {formatKpiNumber(item.avg, useCommaDecimals, 1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
