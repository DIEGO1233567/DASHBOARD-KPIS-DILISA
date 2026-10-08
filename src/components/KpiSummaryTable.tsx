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
        dotClass: 'bg-white shadow-xs',
      };
    } else if (avg >= 2.0) {
      return {
        barGradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500',
        badgeClass: 'bg-amber-500 text-slate-900 shadow-2xs font-extrabold',
        textColor: 'text-amber-700',
        dotClass: 'bg-slate-900 shadow-xs',
      };
    } else {
      return {
        barGradient: 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600',
        badgeClass: 'bg-rose-600 text-white shadow-2xs font-extrabold',
        textColor: 'text-rose-700',
        dotClass: 'bg-white shadow-xs',
      };
    }
  };

  // Semáforo de Desempeño pastel idéntico al de las matrices corporativas (sin badges/pastillas):
  // Verde: 3.0 a 3.5 (fondo menta pastel #E8F8F0, texto verde #0B7D4B)
  // Amarillo: 2.0 a 2.99 (fondo marfil/crema #FEF9EC, texto ámbar/dorado #B86200)
  // Rojo: 1.0 a 1.99 (fondo rosa/rubor #FDF2F4, texto rojo #DC2626)
  const getPastelCellClasses = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val) || val === 0) {
      return 'bg-white text-slate-300';
    }
    if (val >= 3.0) {
      return 'bg-[#E8F8F0] text-[#0B7D4B] font-extrabold hover:bg-[#D5F3E4]';
    }
    if (val >= 2.0) {
      return 'bg-[#FEF9EC] text-[#B86200] font-extrabold hover:bg-[#FDF0D5]';
    }
    return 'bg-[#FDF2F4] text-[#DC2626] font-extrabold hover:bg-[#FCE4E8]';
  };

  return (
    <div
      id="kpi-summary-table-board"
      className="w-full bg-white rounded-xl shadow-md border border-[#8A185B]/30 overflow-hidden flex flex-col transition-all"
    >
      {/* Top Corporate Toolbar matching reference scheme */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2.5 bg-[#8A185B] text-white text-[14px] gap-2.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="w-3.5 h-3.5 rounded-full bg-[#E86C1D] ring-2 ring-white/40 shrink-0 inline-block shadow-xs" />
          <span
            className="font-extrabold tracking-wider uppercase text-[14px] sm:text-[16px] drop-shadow-xs text-white"
            style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
          >
            TABLERO CONSOLIDADO DE KPI'S
          </span>
          <span className="text-[13px] bg-white/20 text-white font-semibold px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-xs">
            {kpiAverages.length} KPI's
          </span>
          <span className="text-[13px] bg-white/20 text-white font-semibold px-3 py-0.5 rounded-full hidden md:inline-block border border-white/30 backdrop-blur-xs">
            Liverpool Analytics
          </span>
        </div>

        {/* Search & Filter Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedKpi && (
            <button
              onClick={() => onSelectKpi(null)}
              className="text-[13px] text-white hover:bg-white/30 bg-white/20 px-3 py-1 rounded-lg border border-white/30 font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
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
              className="px-3 py-1 text-[13px] bg-white/15 hover:bg-white/25 focus:bg-white text-white focus:text-slate-900 placeholder:text-white/70 focus:placeholder:text-gray-400 border border-white/30 focus:border-[#E86C1D] rounded-lg outline-none w-36 sm:w-52 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1 text-white/80 hover:text-white text-[13px] font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Layout with Fluid Pastel Fills */}
      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-[14px] sm:text-[16px]">
          {/* Table Header with Grouped PERIODO */}
          <thead className="sticky top-0 z-20 bg-[#8A185B] text-white font-semibold border-b-2 border-[#E86C1D]">
            {/* Header Row 1 */}
            <tr>
              <th
                rowSpan={2}
                onClick={() => handleSort('kpi')}
                className="py-3.5 px-4 font-black uppercase tracking-wider cursor-pointer hover:bg-[#9D286F] transition-colors border-r border-white/25 min-w-[260px] align-middle text-[14px] sm:text-[16px] sticky left-0 z-30 bg-[#8A185B] select-none"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-black tracking-wide">RUBROS EVALUADOS (KPIS)</span>
                  <ArrowUpDown className="w-4 h-4 opacity-90 text-amber-300" />
                </div>
              </th>

              {/* Grouped Header: PERIODO */}
              <th
                colSpan={4}
                className="py-2.5 px-3 font-black text-center uppercase tracking-wider border-r border-b border-white/25 bg-[#7D1552] text-white text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                PERIODO
              </th>

              {/* Total KPI Column */}
              <th
                rowSpan={2}
                onClick={() => handleSort('average')}
                className="py-3.5 px-3 font-black text-center uppercase tracking-wider cursor-pointer hover:bg-[#9D286F] transition-colors border-l-2 border-[#E86C1D] border-r border-white/25 min-w-[110px] align-middle text-[14px] sm:text-[16px] select-none"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>GLOBAL</span>
                  {sortField === 'average' && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                </div>
              </th>

              {/* Desempeño Visual */}
              <th
                rowSpan={2}
                className="py-3.5 px-4 font-black text-center uppercase tracking-wider bg-[#8A185B] text-white min-w-[200px] align-middle text-[14px] sm:text-[16px]"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                DESEMPEÑO VISUAL
              </th>
            </tr>

            {/* Header Row 2: Sub-columns for Q1, Q2, Q3, Q4 */}
            <tr className="bg-[#8A185B] text-white select-none text-center text-[13px] sm:text-[14px] border-b-2 border-[#E86C1D]">
              {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                <th
                  key={q}
                  onClick={() => handleSort(q)}
                  className="py-2 px-3 font-black cursor-pointer hover:bg-[#9D286F] transition-colors border-r border-white/25 w-20 uppercase"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{q.toUpperCase()}</span>
                    {sortField === q && <ArrowUpDown className="w-3.5 h-3.5 opacity-90 text-amber-300" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body: KPI rows with Soft Pastel Cell Fills */}
          <tbody className="divide-y divide-gray-200/80 bg-white font-sans text-slate-800">
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
                        ? 'bg-orange-50/50 font-bold ring-1 ring-[#8A185B]'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-gray-50/60'
                        : 'bg-gray-50/40 hover:bg-gray-50/80'
                    }`}
                  >
                    {/* Column: Rubro Evaluado (KPI) */}
                    <td className="py-3 px-4 border-r border-b border-gray-200/80 sticky left-0 z-10 bg-white group-hover:bg-gray-50/90 transition-colors">
                      <span
                        className={`font-bold tracking-wide uppercase truncate block text-[14px] sm:text-[16px] ${
                          isSelected
                            ? 'text-[#8A185B] font-black'
                            : 'text-slate-800 group-hover:text-[#8A185B]'
                        }`}
                        title={item.kpi}
                      >
                        {item.kpi}
                      </span>
                    </td>

                    {/* Column: Q1 */}
                    <td
                      className={`py-2.5 px-3 text-center border-r border-b border-gray-200/80 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${getPastelCellClasses(item.q1)}`}
                      title={item.q1 !== null && item.q1 !== undefined ? `Q1: ${formatKpiNumber(item.q1, useCommaDecimals, 1)}` : ''}
                    >
                      {item.q1 !== null && item.q1 !== undefined
                        ? formatKpiNumber(item.q1, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q2 */}
                    <td
                      className={`py-2.5 px-3 text-center border-r border-b border-gray-200/80 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${getPastelCellClasses(item.q2)}`}
                      title={item.q2 !== null && item.q2 !== undefined ? `Q2: ${formatKpiNumber(item.q2, useCommaDecimals, 1)}` : ''}
                    >
                      {item.q2 !== null && item.q2 !== undefined
                        ? formatKpiNumber(item.q2, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q3 */}
                    <td
                      className={`py-2.5 px-3 text-center border-r border-b border-gray-200/80 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${getPastelCellClasses(item.q3)}`}
                      title={item.q3 !== null && item.q3 !== undefined ? `Q3: ${formatKpiNumber(item.q3, useCommaDecimals, 1)}` : ''}
                    >
                      {item.q3 !== null && item.q3 !== undefined
                        ? formatKpiNumber(item.q3, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Column: Q4 */}
                    <td
                      className={`py-2.5 px-3 text-center border-r border-b border-gray-200/80 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${getPastelCellClasses(item.q4)}`}
                      title={item.q4 !== null && item.q4 !== undefined ? `Q4: ${formatKpiNumber(item.q4, useCommaDecimals, 1)}` : ''}
                    >
                      {item.q4 !== null && item.q4 !== undefined
                        ? formatKpiNumber(item.q4, useCommaDecimals, 1)
                        : ''}
                    </td>

                    {/* Total (Promedio del KPI - GLOBAL) */}
                    <td
                      className={`py-2.5 px-3 text-center border-l-2 border-[#E86C1D]/40 border-r border-b border-gray-200/80 font-mono text-base sm:text-lg md:text-xl font-black tracking-tight transition-all ${getPastelCellClasses(item.average)}`}
                      title={`Promedio ${item.kpi}: ${formatKpiNumber(item.average, useCommaDecimals, 1)}`}
                    >
                      {formatKpiNumber(item.average, useCommaDecimals, 1)}
                    </td>

                    {/* Desempeño Visual Bar */}
                    <td className="py-2.5 px-4 text-center border-b border-gray-200/80 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${perfStyle.barGradient}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className={`text-[13px] sm:text-[14px] font-mono font-black w-12 text-right ${perfStyle.textColor}`}>
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
          <tfoot className="sticky bottom-0 z-20 bg-[#8A185B] border-t-2 border-[#E86C1D] font-bold text-white shadow-md">
            <tr>
              <td
                className="py-3 px-3.5 sticky left-0 z-30 uppercase tracking-wider text-[14px] sm:text-[16px] bg-[#8A185B] text-white font-extrabold border-r border-white/25"
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                GLOBAL
              </td>

              {/* Total Q1 */}
              {(() => {
                const val = grandTotal.q1;
                const hasVal = val !== null && val !== undefined;
                const hoverColorClass = hasVal
                  ? val >= 3.0
                    ? 'hover:bg-[#E8F8F0] hover:text-[#0B7D4B]'
                    : val >= 2.0
                    ? 'hover:bg-[#FEF9EC] hover:text-[#B86200]'
                    : 'hover:bg-[#FDF2F4] hover:text-[#DC2626]'
                  : '';
                return (
                  <td
                    className={`py-2.5 px-3 text-center border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black bg-[#8A185B] text-white transition-all duration-200 cursor-pointer ${hoverColorClass}`}
                    title={hasVal ? `Q1: ${formatKpiNumber(val, useCommaDecimals, 1)}` : 'Q1'}
                  >
                    {hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                  </td>
                );
              })()}

              {/* Total Q2 */}
              {(() => {
                const val = grandTotal.q2;
                const hasVal = val !== null && val !== undefined;
                const hoverColorClass = hasVal
                  ? val >= 3.0
                    ? 'hover:bg-[#E8F8F0] hover:text-[#0B7D4B]'
                    : val >= 2.0
                    ? 'hover:bg-[#FEF9EC] hover:text-[#B86200]'
                    : 'hover:bg-[#FDF2F4] hover:text-[#DC2626]'
                  : '';
                return (
                  <td
                    className={`py-2.5 px-3 text-center border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black bg-[#8A185B] text-white transition-all duration-200 cursor-pointer ${hoverColorClass}`}
                    title={hasVal ? `Q2: ${formatKpiNumber(val, useCommaDecimals, 1)}` : 'Q2'}
                  >
                    {hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                  </td>
                );
              })()}

              {/* Total Q3 */}
              {(() => {
                const val = grandTotal.q3;
                const hasVal = val !== null && val !== undefined;
                const hoverColorClass = hasVal
                  ? val >= 3.0
                    ? 'hover:bg-[#E8F8F0] hover:text-[#0B7D4B]'
                    : val >= 2.0
                    ? 'hover:bg-[#FEF9EC] hover:text-[#B86200]'
                    : 'hover:bg-[#FDF2F4] hover:text-[#DC2626]'
                  : '';
                return (
                  <td
                    className={`py-2.5 px-3 text-center border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black bg-[#8A185B] text-white transition-all duration-200 cursor-pointer ${hoverColorClass}`}
                    title={hasVal ? `Q3: ${formatKpiNumber(val, useCommaDecimals, 1)}` : 'Q3'}
                  >
                    {hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                  </td>
                );
              })()}

              {/* Total Q4 */}
              {(() => {
                const val = grandTotal.q4;
                const hasVal = val !== null && val !== undefined;
                const hoverColorClass = hasVal
                  ? val >= 3.0
                    ? 'hover:bg-[#E8F8F0] hover:text-[#0B7D4B]'
                    : val >= 2.0
                    ? 'hover:bg-[#FEF9EC] hover:text-[#B86200]'
                    : 'hover:bg-[#FDF2F4] hover:text-[#DC2626]'
                  : '';
                return (
                  <td
                    className={`py-2.5 px-3 text-center border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black bg-[#8A185B] text-white transition-all duration-200 cursor-pointer ${hoverColorClass}`}
                    title={hasVal ? `Q4: ${formatKpiNumber(val, useCommaDecimals, 1)}` : 'Q4'}
                  >
                    {hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                  </td>
                );
              })()}

              {/* Gran Total (Promedio Global) */}
              {(() => {
                const val = grandTotal.average;
                const hasVal = val !== undefined && val > 0;
                const hoverColorClass = hasVal
                  ? val >= 3.0
                    ? 'hover:bg-[#E8F8F0] hover:text-[#0B7D4B]'
                    : val >= 2.0
                    ? 'hover:bg-[#FEF9EC] hover:text-[#B86200]'
                    : 'hover:bg-[#FDF2F4] hover:text-[#DC2626]'
                  : '';
                return (
                  <td
                    className={`py-2.5 px-3.5 text-center font-black font-mono text-base sm:text-lg md:text-xl border-l-2 border-[#E86C1D] border-r border-white/20 bg-[#8A185B] text-white transition-all duration-200 cursor-pointer ${hoverColorClass}`}
                    title={`Gran Total Global: ${hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : '-'}`}
                  >
                    {hasVal ? formatKpiNumber(val, useCommaDecimals, 1) : ''}
                  </td>
                );
              })()}

              {/* Total Bar */}
              <td className="py-2.5 px-4 text-center bg-[#8A185B]">
                {(() => {
                  const totalPercentage = Math.min(100, Math.max(0, (grandTotal.average / 3.5) * 100));
                  const totalStyle = getPerformanceStyle(grandTotal.average);
                  return (
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-3.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${totalStyle.barGradient}`}
                          style={{
                            width: `${totalPercentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-[13px] font-mono text-white w-12 text-right font-black">
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

      {/* Color Scale Legend matching standard Liverpool Analytics */}
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
