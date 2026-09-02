import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MatrixData, KpiRecord } from '../types';
import { INITIAL_KPIS } from '../data/initialData';
import { formatKpiNumber } from '../utils/excelParser';
import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Check,
  ChevronDown,
  X,
  Layers,
  BarChart3,
  SlidersHorizontal,
  Table,
  LineChart as LineChartIcon,
  TrendingUp,
  Info,
} from 'lucide-react';

interface SegmentoKpiTabProps {
  records: KpiRecord[];
  useCommaDecimals: boolean;
  heatmapMode: boolean;
  onOpenDataViewer?: () => void;
}

export const SegmentoKpiTab: React.FC<SegmentoKpiTabProps> = ({
  records,
  useCommaDecimals,
  heatmapMode,
  onOpenDataViewer,
}) => {
  // 3 Interactive Filter Slicers: AÑO, PERIODO, SOCIEDAD
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([]);
  const [selectedSociedades, setSelectedSociedades] = useState<string[]>([]);

  // Search & sorting within the table
  const [searchSegmento, setSearchSegmento] = useState('');
  const [sortCol, setSortCol] = useState<string>('segmento');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [selectedSegmento, setSelectedSegmento] = useState<string | null>(null);

  // Dropdown open states for the 3 slicers
  const [openDropdown, setOpenDropdown] = useState<'ano' | 'periodo' | 'sociedad' | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute available options and counts for the 3 slicers based on cross-filters
  const yearOptions = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((r) => {
      if (selectedPeriodos.length > 0 && !selectedPeriodos.includes(r.periodo)) return;
      if (selectedSociedades.length > 0 && !selectedSociedades.includes(r.sociedad)) return;
      const y = String(r.ano);
      if (y) counts.set(y, (counts.get(y) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [records, selectedPeriodos, selectedSociedades]);

  const periodoOptions = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((r) => {
      if (selectedYears.length > 0 && !selectedYears.includes(String(r.ano))) return;
      if (selectedSociedades.length > 0 && !selectedSociedades.includes(r.sociedad)) return;
      const p = r.periodo;
      if (p) counts.set(p, (counts.get(p) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [records, selectedYears, selectedSociedades]);

  const sociedadOptions = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((r) => {
      if (selectedYears.length > 0 && !selectedYears.includes(String(r.ano))) return;
      if (selectedPeriodos.length > 0 && !selectedPeriodos.includes(r.periodo)) return;
      const s = r.sociedad;
      if (s) counts.set(s, (counts.get(s) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [records, selectedYears, selectedPeriodos]);

  // Filter records based on the 3 interactive slicers
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedYears.length > 0 && !selectedYears.includes(String(r.ano))) return false;
      if (selectedPeriodos.length > 0 && !selectedPeriodos.includes(r.periodo)) return false;
      if (selectedSociedades.length > 0 && !selectedSociedades.includes(r.sociedad)) return false;
      return true;
    });
  }, [records, selectedYears, selectedPeriodos, selectedSociedades]);

  // Compute Matrix: Rows = Segmento Comercial, Columns = KPI
  const matrix = useMemo(() => {
    const presentSegmentos = new Set<string>();
    const presentKpis = new Set<string>();

    filteredRecords.forEach((r) => {
      if (r.segmentoComercial && r.segmentoComercial.trim() !== '') {
        presentSegmentos.add(r.segmentoComercial.trim());
      }
      if (r.kpi && r.kpi.trim() !== '') {
        presentKpis.add(r.kpi.trim());
      }
    });

    const rows = Array.from(presentSegmentos).sort((a, b) => a.localeCompare(b, 'es'));
    
    // Sort columns strictly according to the Carátula Institucional (INITIAL_KPIS) order
    const fromPreferredKpis = INITIAL_KPIS.filter((k) => presentKpis.has(k));
    const remainingKpis = Array.from(presentKpis)
      .filter((k) => !INITIAL_KPIS.includes(k))
      .sort((a, b) => a.localeCompare(b, 'es'));
    const columns = [...fromPreferredKpis, ...remainingKpis];

    // Grid data maps: data[segmento][kpi] = { sum, count, average }
    const data: Record<string, Record<string, { sum: number; count: number; average: number }>> = {};
    const rowTotals: Record<string, { sum: number; count: number; average: number }> = {};
    const colTotals: Record<string, { sum: number; count: number; average: number }> = {};
    let grandSum = 0;
    let grandCount = 0;

    rows.forEach((row) => {
      data[row] = {};
      rowTotals[row] = { sum: 0, count: 0, average: 0 };
      columns.forEach((col) => {
        data[row][col] = { sum: 0, count: 0, average: 0 };
      });
    });

    columns.forEach((col) => {
      colTotals[col] = { sum: 0, count: 0, average: 0 };
    });

    filteredRecords.forEach((r) => {
      const seg = r.segmentoComercial ? r.segmentoComercial.trim() : '';
      const kpi = r.kpi ? r.kpi.trim() : '';
      const val = r.kpiFinal;

      if (seg && kpi && data[seg] && data[seg][kpi]) {
        data[seg][kpi].sum += val;
        data[seg][kpi].count += 1;
        data[seg][kpi].average = data[seg][kpi].sum / data[seg][kpi].count;

        rowTotals[seg].sum += val;
        rowTotals[seg].count += 1;
        rowTotals[seg].average = rowTotals[seg].sum / rowTotals[seg].count;

        colTotals[kpi].sum += val;
        colTotals[kpi].count += 1;
        colTotals[kpi].average = colTotals[kpi].sum / colTotals[kpi].count;

        grandSum += val;
        grandCount += 1;
      }
    });

    const grandAverage = grandCount > 0 ? grandSum / grandCount : 0;

    return {
      rows,
      columns,
      data,
      rowTotals,
      colTotals,
      grandAverage,
      grandCount,
    };
  }, [filteredRecords]);

  // Handle Sort
  const handleSort = (colKey: string) => {
    if (sortCol === colKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortOrder(colKey === 'segmento' ? 'asc' : 'desc');
    }
  };

  // Filter and sort row items
  const sortedRows = useMemo(() => {
    let list = [...matrix.rows];

    if (searchSegmento.trim()) {
      const q = searchSegmento.toLowerCase();
      list = list.filter((seg) => seg.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortCol === 'segmento') {
        comp = a.localeCompare(b, 'es');
      } else if (sortCol === 'total') {
        const valA = matrix.rowTotals[a]?.average ?? -999;
        const valB = matrix.rowTotals[b]?.average ?? -999;
        comp = valA - valB;
      } else {
        const valA = matrix.data[a]?.[sortCol]?.count > 0 ? matrix.data[a][sortCol].average : -999;
        const valB = matrix.data[b]?.[sortCol]?.count > 0 ? matrix.data[b][sortCol].average : -999;
        comp = valA - valB;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [matrix, searchSegmento, sortCol, sortOrder]);

  const activeSlicerCount =
    (selectedYears.length > 0 ? 1 : 0) +
    (selectedPeriodos.length > 0 ? 1 : 0) +
    (selectedSociedades.length > 0 ? 1 : 0);

  const handleResetSlicers = () => {
    setSelectedYears([]);
    setSelectedPeriodos([]);
    setSelectedSociedades([]);
  };

  // Semáforo de Desempeño corporativo Liverpool (idéntico a Resumen Ejecutivo):
  // Verde: 3.0 a 3.5 (fondo menta pastel #E8F8F0, texto verde #0B7D4B)
  // Amarillo: 2.0 a 2.99 (fondo marfil/crema #FEF9EC, texto ámbar/dorado #B86200)
  // Rojo: 1.0 a 1.99 (fondo rosa/rubor #FDF2F4, texto rojo #DC2626)
  const getLiverpoolCellColor = (val: number | undefined, count: number, isSelected: boolean) => {
    if (!count || val === undefined || isNaN(val) || val === 0) return 'text-slate-300 bg-white';
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

  // Slicer toggle helper
  const toggleSlicerValue = (
    type: 'ano' | 'periodo' | 'sociedad',
    value: string
  ) => {
    if (type === 'ano') {
      setSelectedYears((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else if (type === 'periodo') {
      setSelectedPeriodos((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else if (type === 'sociedad') {
      setSelectedSociedades((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  const handleSelectAll = (type: 'ano' | 'periodo' | 'sociedad') => {
    if (type === 'ano') setSelectedYears([]);
    else if (type === 'periodo') setSelectedPeriodos([]);
    else if (type === 'sociedad') setSelectedSociedades([]);
  };

  const handleClearSlicer = (type: 'ano' | 'periodo' | 'sociedad') => {
    if (type === 'ano') setSelectedYears([]);
    else if (type === 'periodo') setSelectedPeriodos([]);
    else if (type === 'sociedad') setSelectedSociedades([]);
  };

  const slicerConfigs: Array<{
    key: 'ano' | 'periodo' | 'sociedad';
    label: string;
    id: string;
    selectedValues: string[];
    options: Array<{ value: string; count: number }>;
  }> = [
    {
      key: 'ano',
      label: 'AÑO',
      id: 'slicer-ano',
      selectedValues: selectedYears,
      options: yearOptions,
    },
    {
      key: 'periodo',
      label: 'PERIODO',
      id: 'slicer-periodo',
      selectedValues: selectedPeriodos,
      options: periodoOptions,
    },
    {
      key: 'sociedad',
      label: 'SOCIEDAD',
      id: 'slicer-sociedad',
      selectedValues: selectedSociedades,
      options: sociedadOptions,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Interactive Slicers: AÑO, PERIODO, SOCIEDAD - Replicating Resumen Ejecutivo Filter Slicers */}
      <div ref={dropdownRef} className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 py-1">
        {slicerConfigs.map((slicer) => {
          const isOpen = openDropdown === slicer.key;
          const filteredOptions = slicer.options.filter((opt) =>
            opt.value.toLowerCase().includes(dropdownSearch.toLowerCase())
          );

          let displayText = 'Todas';
          if (slicer.selectedValues.length === 1) {
            displayText = slicer.selectedValues[0];
          } else if (slicer.selectedValues.length > 1) {
            displayText = `(${slicer.selectedValues.length}) Seleccionadas`;
          }

          return (
            <div
              key={slicer.key}
              id={slicer.id}
              className={`relative flex flex-col bg-[#8A185B] rounded-xl p-3.5 shadow-sm border border-[#7D1A56] hover:shadow-md transition-all group ${
                isOpen ? 'z-40 ring-2 ring-[#E86C1D]/40' : 'z-10'
              }`}
            >
              {/* Top decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl bg-gradient-to-r from-[#E86C1D] via-[#FF6C19] to-[#8A185B]" />

              {/* Slicer Header Label */}
              <div className="flex items-center justify-between mb-2 pt-1">
                <span
                  className="text-[14px] sm:text-[16px] font-extrabold tracking-wider text-white text-center w-full uppercase"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  {slicer.label}
                </span>
                {slicer.selectedValues.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlicer(slicer.key);
                    }}
                    className="absolute right-2.5 top-2.5 text-[13px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 font-bold shadow-xs border border-white/30 active:scale-95 z-10"
                    title="Restablecer este filtro"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>
                )}
              </div>

              {/* Dropdown Trigger Box */}
              <button
                type="button"
                id={`trigger-${slicer.key}`}
                onClick={() => {
                  setOpenDropdown(isOpen ? null : slicer.key);
                  setDropdownSearch('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-white/95 border ${
                  slicer.selectedValues.length > 0
                    ? 'border-[#E86C1D] ring-2 ring-[#E86C1D]/30 text-slate-900 font-bold'
                    : 'border-white/40 hover:border-white text-slate-800'
                } rounded-lg text-[14px] sm:text-[16px] font-medium transition-all cursor-pointer text-left shadow-2xs`}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className={`truncate font-semibold text-[14px] sm:text-[16px] ${slicer.selectedValues.length > 0 ? 'text-[#8A185B] font-bold' : 'text-slate-800'}`}>
                    {displayText}
                  </span>
                  {slicer.selectedValues.length > 0 && (
                    <span className="bg-[#E86C1D] text-white text-[13px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                      {slicer.selectedValues.length}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4.5 h-4.5 text-[#8A185B] transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu Popover */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white text-slate-800 rounded-xl shadow-2xl border border-pink-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[260px]">
                  {/* Search Bar */}
                  <div className="p-2.5 border-b border-pink-100 bg-[#FCF2FA] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#8A185B] shrink-0" />
                    <input
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder={`Buscar en ${slicer.label}...`}
                      className="w-full text-[14px] bg-transparent outline-none text-slate-800 placeholder-gray-400 focus:border-[#8A185B]"
                      autoFocus
                    />
                    {dropdownSearch && (
                      <button
                        onClick={() => setDropdownSearch('')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Quick actions (Todas / Select All) */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#FDF0F8] to-[#FFF4EE] border-b border-pink-100 text-[14px]">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(slicer.key)}
                      className="font-bold text-[#8A185B] hover:text-[#E86C1D] cursor-pointer transition-colors"
                    >
                      Seleccionar Todas
                    </button>
                    {slicer.selectedValues.length > 0 && (
                      <span className="text-[#E86C1D] font-bold text-[13px]">
                        {slicer.selectedValues.length} activas
                      </span>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 text-[14px] sm:text-[16px]">
                    {filteredOptions.length === 0 ? (
                      <div className="p-3 text-center text-gray-400 text-[14px]">
                        No se encontraron resultados
                      </div>
                    ) : (
                      filteredOptions.map((opt) => {
                        const isSelected = slicer.selectedValues.includes(opt.value);
                        return (
                          <div
                            key={opt.value}
                            onClick={() => toggleSlicerValue(slicer.key, opt.value)}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors ${
                              isSelected
                                ? 'bg-gradient-to-r from-pink-50 to-orange-50/50 text-[#8A185B] font-bold'
                                : 'hover:bg-pink-50/50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 w-full">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#E86C1D] to-[#FF6C19] border-transparent text-white shadow-2xs'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className="truncate">{opt.value}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer bar */}
                  <div className="p-2 border-t border-pink-100 bg-[#FCF2FA] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#8A185B] to-[#E86C1D] hover:opacity-90 text-white text-[14px] font-bold rounded-md cursor-pointer shadow-xs"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Filters Clear Indicator */}
      {activeSlicerCount > 0 && (
        <div className="w-full bg-[#FFFDFB] rounded-xl px-4 py-2.5 border border-[#8A185B]/25 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-[14px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[#8A185B] flex items-center gap-1">
              <span>Filtros Activos:</span>
            </span>

            {selectedYears.map((val) => (
              <span
                key={`chip-ano-${val}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#8A185B] font-bold text-[14px] shadow-2xs"
              >
                <span>Año: {val}</span>
                <button
                  onClick={() => toggleSlicerValue('ano', val)}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Quitar filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {selectedPeriodos.map((val) => (
              <span
                key={`chip-periodo-${val}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#8A185B] font-bold text-[14px] shadow-2xs"
              >
                <span>Periodo: {val}</span>
                <button
                  onClick={() => toggleSlicerValue('periodo', val)}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Quitar filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {selectedSociedades.map((val) => (
              <span
                key={`chip-sociedad-${val}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6E1E66] font-bold text-[14px] shadow-2xs"
              >
                <span>Sociedad: {val}</span>
                <button
                  onClick={() => toggleSlicerValue('sociedad', val)}
                  className="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Quitar filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={handleResetSlicers}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] font-bold text-[#8A185B] bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer Filtros Activos ({activeSlicerCount})</span>
          </button>
        </div>
      )}

      {/* Main Table: Segmento Comercial (Vertical) vs KPI's (Horizontal) */}
      <div id="segmento-kpi-matrix-container" className="w-full bg-white rounded-xl shadow-md border border-[#8A185B]/30 overflow-hidden flex flex-col transition-all">
        {/* Liverpool Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#8A185B] text-white text-[14px]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#E86C1D] ring-2 ring-white/40 shrink-0 inline-block shadow-xs" />
            <span
              className="font-extrabold tracking-wider uppercase text-[14px] sm:text-[16px] drop-shadow-xs text-white"
              style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
            >
              Matriz de Calificaciones: Segmento Comercial vs KPI's
            </span>
            <span className="text-[13px] bg-white/20 text-white font-semibold px-3 py-0.5 rounded-full hidden sm:inline-block border border-white/30 backdrop-blur-xs font-mono">
              {filteredRecords.length.toLocaleString()} registros evaluados
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
          </div>
        </div>

        {/* Decorative Accent Line (Orange #E86C1D) */}
        <div className="h-[2px] w-full bg-[#E86C1D]" />

        {/* Sub-bar with search and metrics */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[14px]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar segmento comercial..."
              value={searchSegmento}
              onChange={(e) => setSearchSegmento(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[14px] bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A185B]"
            />
          </div>

          <div className="flex items-center gap-3 text-[14px] text-gray-600">
            <span className="font-semibold">
              Segmentos: <strong className="text-gray-900">{sortedRows.length}</strong>
            </span>
            <span>•</span>
            <span className="font-semibold">
              KPI's: <strong className="text-gray-900">{matrix.columns.length}</strong>
            </span>
            <span>•</span>
            <span className="font-semibold">
              Promedio Global:{' '}
              <strong className="text-[#8A185B] font-mono font-black text-base sm:text-lg">
                {formatKpiNumber(matrix.grandAverage, useCommaDecimals, 1)}
              </strong>
            </span>
          </div>
        </div>

        {/* Matrix Table Container */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-[14px] sm:text-[16px] text-left border-collapse">
            {/* Table Header: Horizontal KPI's */}
            <thead className="sticky top-0 z-20 bg-[#8A185B] text-white font-semibold border-b-2 border-[#E86C1D]">
              <tr>
                {/* Vertical header label: SEGMENTO COMERCIAL */}
                <th
                  onClick={() => handleSort('segmento')}
                  className="py-3.5 px-4 border-r border-white/25 sticky left-0 z-30 bg-[#8A185B] font-black min-w-[240px] text-white uppercase tracking-wider text-[14px] sm:text-[16px] cursor-pointer hover:bg-[#9D286F] transition-colors"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-[14px] sm:text-[16px] tracking-wide">SEGMENTO COMERCIAL</span>
                    <ArrowUpDown className="w-4 h-4 text-[#E86C1D] stroke-[3]" />
                  </div>
                </th>

                {/* Horizontal columns for each KPI */}
                {matrix.columns.map((kpi) => {
                  const isKpiSelected = selectedKpi === kpi;
                  return (
                    <th
                      key={kpi}
                      onClick={() => handleSort(kpi)}
                      className={`py-3.5 px-4 text-right uppercase tracking-wider text-[14px] sm:text-[16px] font-black cursor-pointer border-r border-white/25 whitespace-nowrap transition-all select-none ${
                        isKpiSelected
                          ? 'bg-[#E86C1D] text-white font-black ring-2 ring-white/70 shadow-inner'
                          : 'hover:bg-[#9D286F] text-white'
                      }`}
                      title={`Ordenar o filtrar por ${kpi}`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className="truncate" title={kpi}>
                          {kpi}
                        </span>
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-70 shrink-0 text-amber-200" />
                      </div>
                    </th>
                  );
                })}

                {/* Total Column */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-3.5 px-4 text-right font-black text-white bg-[#8A185B] border-l-2 border-[#E86C1D] min-w-[100px] uppercase text-[14px] sm:text-[16px] tracking-wider cursor-pointer hover:bg-[#9D286F]"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>GLOBAL</span>
                    <ArrowUpDown className="w-4 h-4 text-[#E86C1D]" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200/80 bg-white text-slate-800 font-normal">
              {sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={matrix.columns.length + 2}
                    className="py-12 text-center text-gray-400 font-medium text-[14px]"
                  >
                    No se encontraron registros de Segmento Comercial que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                sortedRows.map((seg, idx) => {
                  const isSegSelected = selectedSegmento === seg;
                  const rowTotal = matrix.rowTotals[seg];

                  return (
                    <tr
                      key={seg}
                      className={`transition-colors ${
                        isSegSelected
                          ? 'bg-orange-50/50 font-semibold ring-1 ring-[#E86C1D]'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-gray-50/80'
                          : 'bg-gray-50/50 hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Vertical Column: Segmento Comercial */}
                      <td
                        onClick={() => setSelectedSegmento(selectedSegmento === seg ? null : seg)}
                        className={`py-3 px-3.5 border-r border-gray-200 sticky left-0 z-10 cursor-pointer font-bold text-[14px] sm:text-[16px] transition-colors ${
                          isSegSelected
                            ? 'bg-[#FEF2F8] text-[#8A185B] font-black border-l-4 border-l-[#8A185B]'
                            : 'bg-white text-slate-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8A185B] shrink-0" />
                          <span className="truncate" title={seg}>
                            {seg}
                          </span>
                        </div>
                      </td>

                      {/* Calificaciones de cada KPI */}
                      {matrix.columns.map((kpi) => {
                        const cell = matrix.data[seg]?.[kpi];
                        const count = cell?.count || 0;
                        const avg = cell?.average;
                        const isKpiSelected = selectedKpi === kpi;
                        const cellColorClass = getLiverpoolCellColor(avg, count, isSegSelected || isKpiSelected);

                        return (
                          <td
                            key={kpi}
                            onClick={() => setSelectedKpi(selectedKpi === kpi ? null : kpi)}
                            className={`py-2.5 px-3 text-right font-mono text-base sm:text-lg md:text-xl font-black tracking-tight border-r border-gray-200/70 transition-all ${
                              count > 0 ? 'cursor-pointer' : ''
                            } ${cellColorClass}`}
                            title={
                              count > 0
                                ? `${seg} • ${kpi}: Promedio ${formatKpiNumber(avg, useCommaDecimals, 1)} (${count} evals)`
                                : 'Sin registros'
                            }
                          >
                            {count > 0 ? formatKpiNumber(avg, useCommaDecimals, 1) : ''}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="py-2.5 px-3 text-right font-black text-[#8A185B] bg-[#FEF9EC] border-l-2 border-[#E86C1D]/40 font-mono text-base sm:text-lg md:text-xl">
                        {rowTotal?.count > 0 ? (
                          <span>
                            {formatKpiNumber(rowTotal.average, useCommaDecimals, 1)}
                          </span>
                        ) : (
                          ''
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: Total por KPI */}
            <tfoot className="sticky bottom-0 z-20 bg-[#8A185B] border-t-2 border-[#E86C1D] font-bold text-white shadow-md">
              <tr>
                {/* Total Title */}
                <td
                  className="py-3 px-3.5 sticky left-0 z-30 bg-[#8A185B] border-r border-white/25 font-black uppercase text-[14px] sm:text-[16px] tracking-wider text-white"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>GLOBAL</span>
                  </div>
                </td>

                {/* Column Totals for each KPI */}
                {matrix.columns.map((kpi) => {
                  const colTotal = matrix.colTotals[kpi];
                  const hasData = colTotal && colTotal.count > 0;
                  return (
                    <td
                      key={kpi}
                      className="py-3 px-3 text-right border-r border-white/20 font-mono text-base sm:text-lg md:text-xl font-black text-white bg-[#8A185B]"
                    >
                      {hasData ? formatKpiNumber(colTotal.average, useCommaDecimals, 1) : ''}
                    </td>
                  );
                })}

                {/* Grand Total */}
                <td className="py-3 px-3.5 text-right font-black bg-[#8A185B] font-mono text-base sm:text-lg md:text-xl text-white border-l-2 border-[#E86C1D]">
                  {formatKpiNumber(matrix.grandAverage, useCommaDecimals, 1)}
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

      {/* LINE CHART: Desempeño y Tendencia por KPI / Segmento Comercial */}
      {matrix.columns.length > 0 && (
        <div
          id="segmento-kpi-line-chart-card"
          className="w-full bg-white rounded-xl shadow-md border border-[#8A185B]/25 p-4 sm:p-5 mt-4 transition-all"
        >
          {/* Header of the Line Chart */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#8A185B] text-white shadow-xs">
                <LineChartIcon className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h2
                  className="text-[14px] sm:text-[16px] font-extrabold text-[#8A185B] uppercase tracking-wider flex items-center gap-1.5"
                  style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
                >
                  <span>Gráfica Lineal: Calificaciones Promedio por KPI</span>
                  <span className="text-[12px] text-gray-500 font-sans font-normal normal-case flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-[#E86C1D]" />
                    Tendencia de Desempeño
                  </span>
                </h2>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  Visualización de la media general por indicador y comparativa por segmento comercial activo.
                </p>
              </div>
            </div>

            {/* Quick Segment Filter / Highlight selector */}
            <div className="flex items-center gap-2 text-[14px]">
              <span className="text-gray-600 font-medium text-[13px] hidden sm:inline">Comparar Segmento:</span>
              <select
                value={selectedSegmento || ''}
                onChange={(e) => setSelectedSegmento(e.target.value ? e.target.value : null)}
                className="px-3 py-1.5 rounded-lg border border-[#8A185B]/30 bg-white text-[#8A185B] font-bold text-[14px] focus:outline-none focus:ring-1 focus:ring-[#8A185B]"
              >
                <option value="">-- Todos (Media Consolidada) --</option>
                {matrix.rows.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SVG Line Chart Content */}
          <div className="mt-4 pt-2">
            {(() => {
              const columns = matrix.columns;
              if (columns.length === 0) return null;

              // Chart dimension config
              const svgWidth = 980;
              const svgHeight = 330;
              const paddingLeft = 45;
              const paddingRight = 45;
              const paddingTop = 28;
              const paddingBottom = 72;

              const plotWidth = svgWidth - paddingLeft - paddingRight;
              const plotHeight = svgHeight - paddingTop - paddingBottom;

              const maxScore = 3.5;
              const minScore = 0;

              // Helper for clean 2-line horizontal KPI label formatting
              const getKpiLines = (kpiName: string): { line1: string; line2?: string } => {
                const upper = kpiName.toUpperCase();
                if (upper.includes('CARTERA')) return { line1: 'Cartera de', line2: 'Crédito' };
                if (upper.includes('INVENTARIO')) return { line1: 'Inventario /', line2: 'Cto. Vtas' };
                if (upper.includes('PAGOS')) return { line1: 'Pagos', line2: 'Anticipados' };
                if (upper.includes('PROVEEDORES')) return { line1: 'Proveedores' };
                if (upper.includes('IVA')) return { line1: 'IVA' };
                if (upper.includes('ISR')) return { line1: 'ISR' };
                if (upper.includes('INTERCIAS')) return { line1: 'Intercias' };
                if (upper.includes('ASOCIADOS')) return { line1: 'Asociados' };
                if (upper.includes('CUENTAS DE MAYOR') || upper.includes('BANCOS')) return { line1: 'Cuentas de', line2: 'Mayor' };
                if (upper.includes('CONTABILIDAD')) return { line1: 'Conc. Contab.', line2: 'Electrónica' };
                if (upper.includes('MERCADERIAS') || upper.includes('MERCADERÍAS')) return { line1: 'Conc. Ing.', line2: 'Mercaderías' };

                const words = kpiName.split(' ');
                if (words.length <= 2) return { line1: kpiName };
                const mid = Math.ceil(words.length / 2);
                return {
                  line1: words.slice(0, mid).join(' '),
                  line2: words.slice(mid).join(' '),
                };
              };

              // Calculate coordinates for average line
              const getX = (index: number) => {
                if (columns.length === 1) return paddingLeft + plotWidth / 2;
                return paddingLeft + (index / (columns.length - 1)) * plotWidth;
              };

              const getY = (val: number) => {
                const clamped = Math.max(minScore, Math.min(maxScore, val));
                return paddingTop + plotHeight - ((clamped - minScore) / (maxScore - minScore)) * plotHeight;
              };

              // Total Points (Consolidated Average)
              const totalPoints = columns.map((col, idx) => {
                const colTot = matrix.colTotals[col];
                const avg = colTot && colTot.count > 0 ? colTot.average : 0;
                return {
                  kpi: col,
                  val: avg,
                  x: getX(idx),
                  y: getY(avg),
                  count: colTot?.count || 0,
                };
              });

              // Segment Points (if a specific segment is chosen)
              const segmentPoints = selectedSegmento
                ? columns.map((col, idx) => {
                    const cell = matrix.data[selectedSegmento]?.[col];
                    const avg = cell && cell.count > 0 ? cell.average : 0;
                    return {
                      kpi: col,
                      val: avg,
                      x: getX(idx),
                      y: getY(avg),
                      count: cell?.count || 0,
                    };
                  })
                : null;

              // Build smooth SVG path data
              const generatePath = (points: { x: number; y: number }[]) => {
                if (points.length === 0) return '';
                return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
              };

              // Build Area path under curve
              const generateAreaPath = (points: { x: number; y: number }[]) => {
                if (points.length === 0) return '';
                const linePath = generatePath(points);
                const lastX = points[points.length - 1].x;
                const firstX = points[0].x;
                const baseY = paddingTop + plotHeight;
                return `${linePath} L ${lastX},${baseY} L ${firstX},${baseY} Z`;
              };

              const totalPathString = generatePath(totalPoints);
              const totalAreaPathString = generateAreaPath(totalPoints);

              const segmentPathString = segmentPoints ? generatePath(segmentPoints) : '';

              return (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[680px]">
                    <svg
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="w-full h-auto overflow-visible select-none"
                    >
                      <defs>
                        {/* Gradient Fill under Main Curve */}
                        <linearGradient id="totalLineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E86C1D" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8A185B" stopOpacity="0.01" />
                        </linearGradient>
                        {/* Stroke Gradient */}
                        <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8A185B" />
                          <stop offset="50%" stopColor="#E86C1D" />
                          <stop offset="100%" stopColor="#FF6C19" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      {[0, 1.0, 2.0, 3.0, 3.5].map((level) => {
                        const y = getY(level);
                        return (
                          <g key={level}>
                            <line
                              x1={paddingLeft}
                              y1={y}
                              x2={svgWidth - paddingRight}
                              y2={y}
                              stroke={level === 3.0 ? '#0B7D4B' : level === 2.0 ? '#B86200' : '#F1E8EC'}
                              strokeWidth={level === 3.0 || level === 2.0 ? '1' : '0.8'}
                              strokeDasharray={level === 3.0 || level === 2.0 ? '3 3' : 'none'}
                            />
                            <text
                              x={paddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[11px] font-mono fill-gray-500 font-bold"
                            >
                              {level.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill under Consolidated Line */}
                      <path d={totalAreaPathString} fill="url(#totalLineGradient)" />

                      {/* Consolidated Average Line */}
                      <path
                        d={totalPathString}
                        fill="none"
                        stroke="url(#strokeGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Specific Segment Line (if selected) */}
                      {segmentPoints && (
                        <path
                          d={segmentPathString}
                          fill="none"
                          stroke="#E86C1D"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Points and Values for Consolidated Average Line */}
                      {totalPoints.map((pt, idx) => {
                        const isKpiActive = selectedKpi === pt.kpi;
                        const isHigh = pt.val >= 3.0;
                        const isMid = pt.val >= 2.0;
                        const ptColor = isHigh ? '#0B7D4B' : isMid ? '#B86200' : '#DC2626';
                        const lines = getKpiLines(pt.kpi);

                        return (
                          <g
                            key={pt.kpi}
                            className="cursor-pointer group"
                            onClick={() => setSelectedKpi(isKpiActive ? null : pt.kpi)}
                          >
                            <title>{`${idx + 1}. ${pt.kpi}: ${formatKpiNumber(pt.val, useCommaDecimals, 1)} pts (${pt.count.toLocaleString('es-MX')} registros)`}</title>

                            {/* Vertical guideline on hover/active */}
                            <line
                              x1={pt.x}
                              y1={paddingTop}
                              x2={pt.x}
                              y2={paddingTop + plotHeight}
                              stroke={isKpiActive ? '#E86C1D' : '#F3D4E6'}
                              strokeWidth={isKpiActive ? '1.5' : '0.8'}
                              strokeDasharray={isKpiActive ? 'none' : '2 2'}
                            />

                            {/* Outer Halo on Hover / Active (strictly positioned at pt.x, pt.y) */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isKpiActive ? 10 : 8}
                              fill={isKpiActive ? '#E86C1D' : '#8A185B'}
                              fillOpacity={isKpiActive ? 0.25 : 0}
                              className="transition-all duration-150 group-hover:fill-opacity-20"
                            />

                            {/* Circle Node (strictly in place) */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isKpiActive ? 7.5 : 5.5}
                              fill="#FFFFFF"
                              stroke={isKpiActive ? '#E86C1D' : '#8A185B'}
                              strokeWidth={isKpiActive ? '3.5' : '2.5'}
                              className="transition-colors duration-150 group-hover:stroke-[#E86C1D] group-hover:stroke-[3.5px] shadow-xs"
                            />

                            {/* Inner Dot Color Coded by Target */}
                            <circle cx={pt.x} cy={pt.y} r={2.5} fill={ptColor} />

                            {/* Score Label Badge over point */}
                            <g transform={`translate(${pt.x}, ${pt.y - 14})`}>
                              <rect
                                x="-18"
                                y="-13"
                                width="36"
                                height="17"
                                rx="4"
                                fill={isKpiActive ? '#E86C1D' : '#8A185B'}
                                className="shadow-xs transition-colors duration-150 group-hover:fill-[#E86C1D]"
                              />
                              <text
                                x="0"
                                y="-1"
                                textAnchor="middle"
                                className="text-[11px] font-mono font-bold fill-white"
                              >
                                {formatKpiNumber(pt.val, useCommaDecimals, 1)}
                              </text>
                            </g>

                            {/* Numbered Index Pill on X-Axis */}
                            <g transform={`translate(${pt.x}, ${paddingTop + plotHeight + 6})`}>
                              <rect
                                x="-9"
                                y="0"
                                width="18"
                                height="16"
                                rx="4"
                                fill={isKpiActive ? '#E86C1D' : '#8A185B'}
                                className="transition-colors duration-150 group-hover:fill-[#E86C1D]"
                              />
                              <text
                                x="0"
                                y="12"
                                textAnchor="middle"
                                className="text-[10px] font-mono font-black fill-white"
                              >
                                {idx + 1}
                              </text>
                            </g>

                            {/* Horizontal 2-Line KPI Label (No rotation, perfectly centered & legible) */}
                            <text
                              x={pt.x}
                              y={paddingTop + plotHeight + 35}
                              textAnchor="middle"
                              className={`text-[9.5px] font-bold tracking-tight uppercase select-none transition-colors ${
                                isKpiActive ? 'fill-[#E86C1D] font-black' : 'fill-[#6E1E66] group-hover:fill-[#E86C1D]'
                              }`}
                            >
                              <tspan x={pt.x} dy="0">
                                {lines.line1}
                              </tspan>
                              {lines.line2 && (
                                <tspan x={pt.x} dy="11">
                                  {lines.line2}
                                </tspan>
                              )}
                            </text>
                          </g>
                        );
                      })}

                      {/* Segment Dots if selected */}
                      {segmentPoints &&
                        segmentPoints.map((pt) => (
                          <g key={`seg-${pt.kpi}`}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={4.5}
                              fill="#FFFFFF"
                              stroke="#E86C1D"
                              strokeWidth="2.5"
                            />
                            <text
                              x={pt.x}
                              y={pt.y + 16}
                              textAnchor="middle"
                              className="text-[11px] font-mono font-bold fill-[#B86200]"
                            >
                              {formatKpiNumber(pt.val, useCommaDecimals, 1)}
                            </text>
                          </g>
                        ))}
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* Line Chart Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 text-[13px] text-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-bold text-[#8A185B]">
                  <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-[#8A185B] to-[#E86C1D]" />
                  <span>Media General Consolidada</span>
                </div>
                {selectedSegmento && (
                  <div className="flex items-center gap-1.5 font-bold text-[#B86200]">
                    <span className="w-4 h-1.5 rounded-full bg-[#E86C1D] border-b border-dashed" />
                    <span>Segmento: {selectedSegmento}</span>
                  </div>
                )}
              </div>

              {/* Reference Targets */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0B7D4B]" />
                  <span className="text-[13px] font-semibold text-gray-600">Verde (≥ 3.0)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#B86200]" />
                  <span className="text-[13px] font-semibold text-gray-600">Amarillo (2.0 - 2.99)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                  <span className="text-[13px] font-semibold text-gray-600">Rojo (&lt; 2.0)</span>
                </div>
              </div>
            </div>

            {/* KPI Full Names Quick Interactive Reference Bar */}
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Índice de Indicadores (Clic para filtrar / resaltar):
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1.5">
                {matrix.columns.map((col, idx) => {
                  const isKpiActive = selectedKpi === col;
                  const colTot = matrix.colTotals[col];
                  const avg = colTot && colTot.count > 0 ? colTot.average : 0;
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedKpi(isKpiActive ? null : col)}
                      className={`p-1.5 rounded-lg text-left transition-all flex flex-col justify-between border cursor-pointer ${
                        isKpiActive
                          ? 'bg-gradient-to-r from-pink-50 to-orange-50/60 border-[#E86C1D] ring-1 ring-[#E86C1D]/30 shadow-2xs'
                          : 'bg-slate-50/70 hover:bg-pink-50/40 border-gray-200/80 text-slate-700'
                      }`}
                      title={`${idx + 1}. ${col} - Calificación: ${formatKpiNumber(avg, useCommaDecimals, 1)}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`w-4 h-4 rounded text-[10px] font-mono font-black flex items-center justify-center shrink-0 ${
                            isKpiActive ? 'bg-[#E86C1D] text-white' : 'bg-[#8A185B] text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-gray-700">
                          {formatKpiNumber(avg, useCommaDecimals, 1)}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-700 line-clamp-2 leading-tight">
                        {col}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
