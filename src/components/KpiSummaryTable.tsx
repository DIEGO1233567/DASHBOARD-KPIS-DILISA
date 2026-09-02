import React, { useState, useMemo } from 'react';
import { KpiAverageItem } from '../utils/matrixCalculations';
import { INITIAL_KPIS } from '../data/initialData';
import { MatrixData } from '../types';
import { formatKpiNumber } from '../utils/excelParser';
import {
  Table,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface KpiSummaryTableProps {
  kpiAverages: KpiAverageItem[];
  matrixData?: MatrixData;
  selectedKpi: string | null;
  onSelectKpi: (kpi: string | null) => void;
  useCommaDecimals: boolean;
}

type SortField = 'kpi' | 'q1' | 'q2' | 'q3' | 'q4' | 'average';
type SortOrder = 'asc' | 'desc';

export const KpiSummaryTable: React.FC<KpiSummaryTableProps> = ({
  kpiAverages,
  selectedKpi,
  onSelectKpi,
  useCommaDecimals,
}) => {
  const [sortField, setSortField] = useState<SortField>('kpi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate totals
  const grandTotal = useMemo(() => {
    let totalCount = 0;
    let totalSum = 0;
    let q1Sum = 0;
    let q1Count = 0;
    let q2Sum = 0;
    let q2Count = 0;
    let q3Sum = 0;
    let q3Count = 0;
    let q4Sum = 0;
    let q4Count = 0;

    kpiAverages.forEach((item) => {
      totalCount += item.count;
      totalSum += item.sum ?? (item.average * item.count);

      if (item.q1Sum !== undefined && item.q1Count !== undefined) {
        q1Sum += item.q1Sum;
        q1Count += item.q1Count;
      } else if (item.q1 !== null && item.q1 !== undefined) {
        q1Sum += item.q1 * item.count;
        q1Count += item.count;
      }

      if (item.q2Sum !== undefined && item.q2Count !== undefined) {
        q2Sum += item.q2Sum;
        q2Count += item.q2Count;
      } else if (item.q2 !== null && item.q2 !== undefined) {
        q2Sum += item.q2 * item.count;
        q2Count += item.count;
      }

      if (item.q3Sum !== undefined && item.q3Count !== undefined) {
        q3Sum += item.q3Sum;
        q3Count += item.q3Count;
      } else if (item.q3 !== null && item.q3 !== undefined) {
        q3Sum += item.q3 * item.count;
        q3Count += item.count;
      }

      if (item.q4Sum !== undefined && item.q4Count !== undefined) {
        q4Sum += item.q4Sum;
        q4Count += item.q4Count;
      } else if (item.q4 !== null && item.q4 !== undefined) {
        q4Sum += item.q4 * item.count;
        q4Count += item.count;
      }
    });

    const weightedAvg = totalCount > 0 ? totalSum / totalCount : 0;
    const q1Avg = q1Count > 0 ? q1Sum / q1Count : null;
    const q2Avg = q2Count > 0 ? q2Sum / q2Count : null;
    const q3Avg = q3Count > 0 ? q3Sum / q3Count : null;
    const q4Avg = q4Count > 0 ? q4Sum / q4Count : null;

    return {
      count: totalCount,
      sum: totalSum,
      average: weightedAvg,
      q1: q1Avg,
      q2: q2Avg,
      q3: q3Avg,
      q4: q4Avg,
    };
  }, [kpiAverages]);

  // Sort and filter data
  const sortedAndFilteredData = useMemo(() => {
    let result = [...kpiAverages];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.kpi.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let comp = 0;
      if (sortField === 'kpi') {
        const idxA = INITIAL_KPIS.indexOf(a.kpi);
        const idxB = INITIAL_KPIS.indexOf(b.kpi);
        if (idxA !== -1 && idxB !== -1) {
          comp = idxA - idxB;
        } else if (idxA !== -1) {
          comp = -1;
        } else if (idxB !== -1) {
          comp = 1;
        } else {
          comp = a.kpi.localeCompare(b.kpi, 'es');
        }
      } else if (sortField === 'q1') {
        comp = (a.q1 ?? -999) - (b.q1 ?? -999);
      } else if (sortField === 'q2') {
        comp = (a.q2 ?? -999) - (b.q2 ?? -999);
      } else if (sortField === 'q3') {
        comp = (a.q3 ?? -999) - (b.q3 ?? -999);
      } else if (sortField === 'q4') {
        comp = (a.q4 ?? -999) - (b.q4 ?? -999);
      } else if (sortField === 'average') {
        comp = a.average - b.average;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return result;
  }, [kpiAverages, sortField, sortOrder, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Helper to determine status and visual gradient based on requested thresholds:
  // Verde: 3.0 a 3.5
  // Amarillo: 2.0 a 2.99
  // Rojo: 1.0 a 1.99
  const getPerformanceStyle = (avg: number) => {
    if (avg >= 3.0) {
      return {
        barGradient: 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600',
        badgeClass: 'bg-emerald-600 text-white shadow-2xs font-extrabold',
        textColor: 'text-emerald-700',
      };
    } else if (avg >= 2.0) {
      return {
        barGradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
        badgeClass: 'bg-amber-500 text-slate-900 shadow-2xs font-extrabold',
        textColor: 'text-amber-700',
      };
    } else {
      return {
        barGradient: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600',
        badgeClass: 'bg-rose-600 text-white shadow-2xs font-extrabold',
        textColor: 'text-rose-700',
      };
    }
  };

  return (
    <div
      id="kpi-summary-table-board"
      className="w-full bg-white rounded-xl shadow-md border border-[#E1007A]/20 p-4 sm:p-5 mt-4 transition-all"
    >
      {/* Board Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#94266F] to-[#E1007A] text-white shadow-xs">
            <Table className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h2
              className="text-[16px] sm:text-[18px] font-bold text-[#94266F] uppercase tracking-wide flex items-center gap-2"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              <span>TABLERO CONSOLIDADO DE KPI'S</span>
              <span className="text-[13px] font-sans font-semibold bg-gradient-to-r from-[#E1007A] to-[#FF6E52] text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                {kpiAverages.length} KPI's
              </span>
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Visualización desglosada por periodo (Q1, Q2, Q3, Q4) y total de calificación por KPI
            </p>
          </div>
        </div>

        {/* Search & Filter Actions */}
        <div className="flex items-center gap-2">
          {selectedKpi && (
            <button
              onClick={() => onSelectKpi(null)}
              className="text-[14px] text-[#E1007A] hover:text-white hover:bg-[#E1007A] bg-pink-50 px-3.5 py-1.5 rounded-lg border border-[#E1007A]/30 font-bold transition-all cursor-pointer shadow-2xs"
            >
              Filtro: {selectedKpi} ×
            </button>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar KPI..."
              className="px-3.5 py-1.5 text-[14px] bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-[#E1007A] rounded-lg outline-none w-44 sm:w-56 transition-all font-medium text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-[14px] font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="overflow-x-auto mt-3 rounded-lg border border-pink-100 shadow-2xs">
        <table className="w-full text-left border-collapse text-[14px] sm:text-[16px]">
          {/* Table Header with Grouped PERIODO */}
          <thead>
            {/* Header Row 1 */}
            <tr className="bg-[#94266F] text-white select-none border-b border-white/10">
              <th
                rowSpan={2}
                onClick={() => handleSort('kpi')}
                className="py-3.5 px-4 font-bold uppercase tracking-wider cursor-pointer hover:bg-[#AC2F83] transition-colors border-r border-white/15 min-w-[240px] align-middle text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center justify-between">
                  <span>NOMBRE DEL KPI</span>
                  <ArrowUpDown className="w-4 h-4 opacity-80 text-amber-200" />
                </div>
              </th>

              {/* Grouped Header: PERIODO */}
              <th
                colSpan={4}
                className="py-2 px-2 font-bold text-center uppercase tracking-wider border-r border-b border-white/15 bg-[#7E1E5E] text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>PERIODO</span>
                </div>
              </th>

              {/* Total KPI Column */}
              <th
                rowSpan={2}
                onClick={() => handleSort('average')}
                className="py-3.5 px-3 font-bold text-center uppercase tracking-wider cursor-pointer hover:bg-[#AC2F83] transition-colors border-r border-white/15 min-w-[120px] align-middle text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>GLOBAL</span>
                  <ArrowUpDown className="w-4 h-4 opacity-80 text-amber-200" />
                </div>
              </th>

              {/* Desempeño Visual */}
              <th
                rowSpan={2}
                className="py-3.5 px-4 font-bold text-center uppercase tracking-wider bg-[#94266F] text-white min-w-[200px] align-middle text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                DESEMPEÑO VISUAL
              </th>
            </tr>

            {/* Header Row 2: Sub-columns for Q1, Q2, Q3, Q4 */}
            <tr className="bg-[#852264] text-white select-none text-center text-[13px] sm:text-[14px] border-b-2 border-[#FF6E52]">
              <th
                onClick={() => handleSort('q1')}
                className="py-2 px-3 font-bold cursor-pointer hover:bg-[#9B2A75] transition-colors border-r border-white/15 w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Q1</span>
                  {sortField === 'q1' && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                </div>
              </th>

              <th
                onClick={() => handleSort('q2')}
                className="py-2 px-3 font-bold cursor-pointer hover:bg-[#9B2A75] transition-colors border-r border-white/15 w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Q2</span>
                  {sortField === 'q2' && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                </div>
              </th>

              <th
                onClick={() => handleSort('q3')}
                className="py-2 px-3 font-bold cursor-pointer hover:bg-[#9B2A75] transition-colors border-r border-white/15 w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Q3</span>
                  {sortField === 'q3' && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                </div>
              </th>

              <th
                onClick={() => handleSort('q4')}
                className="py-2 px-3 font-bold cursor-pointer hover:bg-[#9B2A75] transition-colors border-r border-white/15 w-20"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Q4</span>
                  {sortField === 'q4' && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body: KPI rows */}
          <tbody className="divide-y divide-gray-100 bg-white font-sans">
            {sortedAndFilteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-[14px]">
                  No se encontraron KPI's que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              sortedAndFilteredData.map((item, idx) => {
                const isSelected = selectedKpi === item.kpi;
                const percentage = Math.min(100, Math.max(0, (item.average / 3.5) * 100));
                const perfStyle = getPerformanceStyle(item.average);

                return (
                  <tr
                    key={item.kpi}
                    onClick={() => onSelectKpi(isSelected ? null : item.kpi)}
                    className={`cursor-pointer transition-colors group select-none ${
                      isSelected
                        ? 'bg-pink-50/90 font-bold ring-1 ring-[#E1007A]'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-purple-50/40'
                        : 'bg-gray-50/60 hover:bg-purple-50/40'
                    }`}
                  >
                    {/* Column: Nombre del KPI */}
                    <td className="py-3.5 px-4 border-r border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E1007A] shrink-0" />
                        <span
                          className={`font-bold tracking-wide uppercase truncate transition-colors text-[14px] sm:text-[16px] ${
                            isSelected
                              ? 'text-[#E1007A]'
                              : 'text-slate-800 group-hover:text-[#502446]'
                          }`}
                          title={item.kpi}
                        >
                          {item.kpi}
                        </span>
                      </div>
                    </td>

                    {/* Column: Q1 */}
                    <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-800 border-r border-gray-100">
                      {item.q1 !== null && item.q1 !== undefined
                        ? formatKpiNumber(item.q1, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q2 */}
                    <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-800 border-r border-gray-100">
                      {item.q2 !== null && item.q2 !== undefined
                        ? formatKpiNumber(item.q2, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q3 */}
                    <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-800 border-r border-gray-100">
                      {item.q3 !== null && item.q3 !== undefined
                        ? formatKpiNumber(item.q3, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q4 */}
                    <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-800 border-r border-gray-100">
                      {item.q4 !== null && item.q4 !== undefined
                        ? formatKpiNumber(item.q4, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Total (Promedio del KPI) */}
                    <td className="py-3.5 px-3 text-center border-r border-gray-100">
                      <span
                        className={`inline-block px-3 py-1 rounded-md font-mono text-base sm:text-lg md:text-xl font-black tracking-tight ${perfStyle.badgeClass}`}
                      >
                        {formatKpiNumber(item.average, useCommaDecimals, 1)}
                      </span>
                    </td>

                    {/* Desempeño Visual Bar */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${perfStyle.barGradient}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className={`text-[14px] sm:text-[15px] font-mono font-black w-12 text-right ${perfStyle.textColor}`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer: TOTAL KPI AT THE END */}
          <tfoot className="bg-[#94266F] text-white font-bold border-t-2 border-[#FF6E52]">
            <tr className="divide-x divide-white/10">
              <td
                className="py-3.5 px-4 uppercase tracking-wider text-[14px] sm:text-[16px] bg-[#94266F]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-white font-extrabold text-[14px] sm:text-[16px]">GLOBAL</span>
                </div>
              </td>

              {/* Total Q1 */}
              <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-white bg-[#7E1E5E]">
                {grandTotal.q1 !== null && grandTotal.q1 !== undefined
                  ? formatKpiNumber(grandTotal.q1, useCommaDecimals, 1)
                  : ''}
              </td>

              {/* Total Q2 */}
              <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-white bg-[#7E1E5E]">
                {grandTotal.q2 !== null && grandTotal.q2 !== undefined
                  ? formatKpiNumber(grandTotal.q2, useCommaDecimals, 1)
                  : ''}
              </td>

              {/* Total Q3 */}
              <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-white bg-[#7E1E5E]">
                {grandTotal.q3 !== null && grandTotal.q3 !== undefined
                  ? formatKpiNumber(grandTotal.q3, useCommaDecimals, 1)
                  : ''}
              </td>

              {/* Total Q4 */}
              <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-white bg-[#7E1E5E]">
                {grandTotal.q4 !== null && grandTotal.q4 !== undefined
                  ? formatKpiNumber(grandTotal.q4, useCommaDecimals, 1)
                  : ''}
              </td>

              {/* Grand Total Average */}
              <td className="py-3.5 px-3 text-center font-mono text-base sm:text-lg md:text-xl font-black tracking-tight text-white bg-[#7E1E5E]">
                {formatKpiNumber(grandTotal.average, useCommaDecimals, 1)}
              </td>

              {/* Total Bar */}
              <td className="py-3.5 px-4 text-center bg-[#94266F]">
                {(() => {
                  const totalPercentage = Math.min(100, Math.max(0, (grandTotal.average / 3.5) * 100));
                  const totalStyle = getPerformanceStyle(grandTotal.average);
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-4 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full shadow-xs ${totalStyle.barGradient}`}
                          style={{
                            width: `${totalPercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-[13px] font-mono text-white w-12 text-right font-bold">
                        {Math.round(totalPercentage)}%
                      </span>
                    </div>
                  );
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer info & Scale Legend */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[13px] text-gray-500 gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#E1007A]" />
          <span>
            Haz clic en cualquier fila para filtrar y sincronizar todo el resumen ejecutivo.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 font-bold text-slate-700 text-[13px]">
          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">Escala: 1.0 - 3.5 (3.5 = 100%)</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Verde (3.0 - 3.5)
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            Amarillo (2.0 - 2.99)
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Rojo (1.0 - 1.99)
          </span>
        </div>
      </div>
    </div>
  );
};
