import React from 'react';
import { MatrixData } from '../types';
import { formatKpiNumber } from '../utils/excelParser';
import {
  Pin,
  Copy,
  Bell,
  Filter,
  Maximize2,
  MoreHorizontal,
  ChevronUp,
  Table,
  Sparkles,
} from 'lucide-react';

interface KpiMatrixProps {
  matrixData?: MatrixData;
  data?: MatrixData;
  useCommaDecimals: boolean;
  heatmapMode: boolean;
  selectedKpi: string | null;
  selectedArea: string | null;
  onSelectKpi: (kpi: string | null) => void;
  onSelectArea: (area: string | null) => void;
  onOpenDataViewer?: () => void;
}

export const KpiMatrix: React.FC<KpiMatrixProps> = ({
  matrixData: propMatrixData,
  data: altMatrixData,
  useCommaDecimals,
  heatmapMode,
  selectedKpi,
  selectedArea,
  onSelectKpi,
  onSelectArea,
  onOpenDataViewer,
}) => {
  const currentMatrix = propMatrixData || altMatrixData || {
    rows: [],
    columns: [],
    data: {},
    rowTotals: {},
    colTotals: {},
    grandTotal: { sum: 0, count: 0, average: 0 },
  };

  const {
    rows = [],
    columns = [],
    data = {},
    rowTotals = {},
    colTotals = {},
    grandTotal = { sum: 0, count: 0, average: 0 },
  } = currentMatrix;

  // Semáforo de Desempeño solicitado:
  // Verde: 3.0 a 3.5 (fondo menta pastel #E8F8F0, texto verde #0B7D4B)
  // Amarillo: 2.0 a 2.99 (fondo marfil/crema #FEF9EC, texto ámbar/dorado #B86200)
  // Rojo: 1.0 a 1.99 (fondo rosa/rubor #FDF2F4, texto rojo #DC2626)
  const getLiverpoolCellColor = (val: number | undefined, isSelected: boolean) => {
    if (val === undefined || isNaN(val) || val === 0) return 'text-slate-300 bg-white';
    if (isSelected) return 'bg-[#E86C1D] text-white font-black shadow-md scale-105 ring-2 ring-white';

    if (heatmapMode) {
      if (val >= 3.0) return 'bg-[#E8F8F0] text-[#0B7D4B] font-extrabold hover:bg-[#D5F3E4]'; // Verde (3.0 - 3.5)
      if (val >= 2.0) return 'bg-[#FEF9EC] text-[#B86200] font-extrabold hover:bg-[#FDF0D5]'; // Amarillo (2.0 - 2.99)
      return 'bg-[#FDF2F4] text-[#DC2626] font-extrabold hover:bg-[#FCE4E8]'; // Rojo (1.0 - 1.99)
    }

    if (val >= 3.0) return 'text-[#0B7D4B] hover:bg-[#E8F8F0]';
    if (val >= 2.0) return 'text-[#B86200] hover:bg-[#FEF9EC]';
    return 'text-[#DC2626] hover:bg-[#FDF2F4]';
  };
  return (
    <div id="kpi-matrix-container" className="w-full bg-white rounded-xl shadow-md border border-[#8A185B]/30 overflow-hidden flex flex-col transition-all">
      {/* Top Corporate Toolbar matching the reference color scheme */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#8A185B] text-white text-[14px]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#E86C1D] ring-2 ring-white/40 shrink-0 inline-block shadow-xs" />
          <span
            className="font-extrabold tracking-wider uppercase text-[14px] sm:text-[16px] drop-shadow-xs text-white"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
          >
            Matriz de Evaluación por Área y KPI
          </span>
          <span className="text-[13px] bg-white/20 text-white font-semibold px-3 py-0.5 rounded-full hidden sm:inline-block border border-white/30 backdrop-blur-xs">
            Liverpool Analytics
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          {onOpenDataViewer && (
            <button
              onClick={onOpenDataViewer}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded cursor-pointer font-bold border border-white/30 transition-all text-[14px] shadow-xs"
              title="Ver registros tabulares detallados"
            >
              <Table className="w-4 h-4 text-yellow-300" />
              <span className="hidden sm:inline">Ver datos en tabla</span>
            </button>
          )}
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Fijar visualización">
            <Pin className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Copiar visual">
            <Copy className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Crear alerta">
            <Bell className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Filtros aplicados">
            <Filter className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Modo enfoque">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="hover:text-white transition-colors cursor-pointer p-1.5 rounded hover:bg-white/15" title="Más opciones">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Decorative Accent Line (Orange #E86C1D) */}
      <div className="h-[2px] w-full bg-[#E86C1D]" />

      {/* Matrix Table with Formatted Header & Rows */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-[14px] sm:text-[16px] text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-[#8A185B] text-white font-semibold border-b-2 border-[#E86C1D]">
            <tr>
              <th
                className="py-3.5 px-4 border-r border-white/25 sticky left-0 z-30 bg-[#8A185B] font-black min-w-[260px] text-white uppercase tracking-wider text-[14px] sm:text-[16px] shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-[14px] sm:text-[16px] tracking-wide">ÁREA RESPONSABLE</span>
                  <ChevronUp className="w-4 h-4 text-[#E86C1D] stroke-[3]" />
                </div>
              </th>
              {columns.map((col) => {
                const isSelected = selectedKpi === col;
                return (
                  <th
                    key={col}
                    onClick={() => onSelectKpi(isSelected ? null : col)}
                    className={`py-3.5 px-4 text-right uppercase tracking-wider text-[14px] sm:text-[16px] font-black cursor-pointer border-r border-white/25 whitespace-nowrap transition-all select-none ${
                      isSelected
                        ? 'bg-[#E86C1D] text-white font-black ring-2 ring-white/70 shadow-inner'
                        : 'hover:bg-[#9D286F] text-white'
                    }`}
                    title={`Filtrar por KPI: ${col}`}
                  >
                    {col}
                  </th>
                );
              })}
              <th className="py-3.5 px-4 text-right font-black text-white bg-[#8A185B] border-l-2 border-[#E86C1D] min-w-[90px] uppercase text-[14px] sm:text-[16px] tracking-wider">
                GLOBAL
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200/80 bg-white text-slate-800 font-normal">
            {rows.map((rowName) => {
              const isAreaSelected = selectedArea === rowName;
              const rowTot = rowTotals[rowName]?.average;

              return (
                <tr
                  key={rowName}
                  className={`transition-colors ${
                    isAreaSelected ? 'bg-orange-50/50 font-semibold ring-1 ring-[#E86C1D]' : 'hover:bg-gray-50/80'
                  }`}
                >
                  {/* Row header: Área Responsable */}
                  <td
                    onClick={() => onSelectArea(isAreaSelected ? null : rowName)}
                    className={`py-3 px-3.5 border-r border-gray-200 sticky left-0 z-10 cursor-pointer font-bold text-[14px] sm:text-[16px] transition-colors ${
                      isAreaSelected
                        ? 'bg-[#FEF2F8] text-[#8A185B] font-black border-l-4 border-l-[#8A185B]'
                        : 'bg-white text-slate-900 hover:bg-gray-50'
                    }`}
                    title={`Filtrar por Área: ${rowName}`}
                  >
                    {rowName}
                  </td>

                  {/* Cell KPI values with Fluid Color Formatting */}
                  {columns.map((colName) => {
                    const cell = data[rowName]?.[colName];
                    const hasValue = cell && cell.count > 0;
                    const val = hasValue ? cell.average : undefined;
                    const isKpiSelected = selectedKpi === colName;
                    const cellColorClass = getLiverpoolCellColor(val, isKpiSelected);

                    return (
                      <td
                        key={colName}
                        onClick={() => {
                          if (hasValue) {
                            onSelectKpi(isKpiSelected ? null : colName);
                            onSelectArea(isAreaSelected ? null : rowName);
                          }
                        }}
                        className={`py-2.5 px-3 text-right border-r border-gray-200/70 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${
                          hasValue ? 'cursor-pointer' : ''
                        } ${cellColorClass}`}
                        title={hasValue ? `${rowName} - ${colName}: ${formatKpiNumber(val, useCommaDecimals, 1)} (${cell.count} registros)` : ''}
                      >
                        {hasValue ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                      </td>
                    );
                  })}

                  {/* Row Total */}
                  <td className="py-2.5 px-3 text-right font-black text-[#8A185B] bg-[#FEF9EC] border-l-2 border-[#E86C1D]/40 font-mono text-base sm:text-lg md:text-xl">
                    {rowTot ? formatKpiNumber(rowTot, useCommaDecimals, 1) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Total Footer matching the reference image */}
          <tfoot className="sticky bottom-0 z-20 bg-[#8A185B] border-t-2 border-[#E86C1D] font-bold text-white shadow-md">
            <tr>
              <td className="py-3 px-3.5 sticky left-0 z-30 bg-[#8A185B] border-r border-white/25 font-black uppercase text-[14px] sm:text-[16px] tracking-wider text-white">
                GLOBAL
              </td>
              {columns.map((colName) => {
                const colTot = colTotals[colName]?.average;
                return (
                  <td key={colName} className="py-3 px-3 text-right border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black text-white">
                    {colTot ? formatKpiNumber(colTot, useCommaDecimals, 1) : ''}
                  </td>
                );
              })}
              <td className="py-3 px-3.5 text-right font-black bg-[#8A185B] font-mono text-base sm:text-lg md:text-xl text-white border-l-2 border-[#E86C1D]">
                {grandTotal.count > 0 ? formatKpiNumber(grandTotal.average, useCommaDecimals, 1) : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Color Scale Legend */}
      <div className="bg-[#FFFDFB] px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[13px] text-gray-700">
        <div className="flex items-center gap-1.5 font-bold text-[#8A185B] text-[13px]">
          <Sparkles className="w-4 h-4 text-[#E86C1D]" />
          <span>Semáforo de Desempeño:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#E8F8F0] border border-[#0B7D4B] ring-1 ring-[#0B7D4B]/30" />
            <span className="font-bold text-[#0B7D4B] text-[13px]">Verde (3.0 a 3.5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#FEF9EC] border border-[#B86200] ring-1 ring-[#B86200]/30" />
            <span className="font-bold text-[#B86200] text-[13px]">Amarillo (2.0 a 2.99)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#FDF2F4] border border-[#DC2626] ring-1 ring-[#DC2626]/30" />
            <span className="font-bold text-[#DC2626] text-[13px]">Rojo (1.0 a 1.99)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
