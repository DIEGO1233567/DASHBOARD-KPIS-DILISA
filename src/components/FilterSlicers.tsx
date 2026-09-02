import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { FilterState, KpiRecord } from '../types';

interface FilterSlicersProps {
  records: KpiRecord[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

interface SlicerTheme {
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  clearBg: string;
  clearText: string;
  clearBorder: string;
  triggerBorderActive: string;
  triggerRingActive: string;
  iconColor: string;
  badgeBg: string;
  gradientBar: string;
}

interface SlicerConfig {
  key: keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>;
  label: string;
  id: string;
  theme: SlicerTheme;
}

const SLICERS: SlicerConfig[] = [
  {
    key: 'ano',
    label: 'Año',
    id: 'slicer-ano',
    theme: {
      cardBg: 'bg-[#8A185B]',
      cardBorder: 'border-[#7D1A56]',
      titleColor: 'text-white',
      clearBg: 'bg-white/20 hover:bg-white/30',
      clearText: 'text-white',
      clearBorder: 'border-white/30',
      triggerBorderActive: 'border-[#E86C1D]',
      triggerRingActive: 'ring-[#E86C1D]/40',
      iconColor: 'text-[#8A185B]',
      badgeBg: 'bg-[#E86C1D] text-white',
      gradientBar: 'from-[#E86C1D] via-[#FF6C19] to-[#8A185B]',
    },
  },
  {
    key: 'periodo',
    label: 'Periodo',
    id: 'slicer-periodo',
    theme: {
      cardBg: 'bg-[#8A185B]',
      cardBorder: 'border-[#7D1A56]',
      titleColor: 'text-white',
      clearBg: 'bg-white/20 hover:bg-white/30',
      clearText: 'text-white',
      clearBorder: 'border-white/30',
      triggerBorderActive: 'border-[#E86C1D]',
      triggerRingActive: 'ring-[#E86C1D]/40',
      iconColor: 'text-[#8A185B]',
      badgeBg: 'bg-[#E86C1D] text-white',
      gradientBar: 'from-[#E86C1D] via-[#FF6C19] to-[#8A185B]',
    },
  },
  {
    key: 'sociedad',
    label: 'Sociedad',
    id: 'slicer-sociedad',
    theme: {
      cardBg: 'bg-[#8A185B]',
      cardBorder: 'border-[#7D1A56]',
      titleColor: 'text-white',
      clearBg: 'bg-white/20 hover:bg-white/30',
      clearText: 'text-white',
      clearBorder: 'border-white/30',
      triggerBorderActive: 'border-[#E86C1D]',
      triggerRingActive: 'ring-[#E86C1D]/40',
      iconColor: 'text-[#8A185B]',
      badgeBg: 'bg-[#E86C1D] text-white',
      gradientBar: 'from-[#E86C1D] via-[#FF6C19] to-[#8A185B]',
    },
  },
  {
    key: 'responsable',
    label: 'Responsable',
    id: 'slicer-responsable',
    theme: {
      cardBg: 'bg-[#8A185B]',
      cardBorder: 'border-[#7D1A56]',
      titleColor: 'text-white',
      clearBg: 'bg-white/20 hover:bg-white/30',
      clearText: 'text-white',
      clearBorder: 'border-white/30',
      triggerBorderActive: 'border-[#E86C1D]',
      triggerRingActive: 'ring-[#E86C1D]/40',
      iconColor: 'text-[#8A185B]',
      badgeBg: 'bg-[#E86C1D] text-white',
      gradientBar: 'from-[#E86C1D] via-[#FF6C19] to-[#8A185B]',
    },
  },
  {
    key: 'segmentoComercial',
    label: 'Segmento Comercial',
    id: 'slicer-segmento',
    theme: {
      cardBg: 'bg-[#8A185B]',
      cardBorder: 'border-[#7D1A56]',
      titleColor: 'text-white',
      clearBg: 'bg-white/20 hover:bg-white/30',
      clearText: 'text-white',
      clearBorder: 'border-white/30',
      triggerBorderActive: 'border-[#E86C1D]',
      triggerRingActive: 'ring-[#E86C1D]/40',
      iconColor: 'text-[#8A185B]',
      badgeBg: 'bg-[#E86C1D] text-white',
      gradientBar: 'from-[#E86C1D] via-[#FF6C19] to-[#8A185B]',
    },
  },
];

export const FilterSlicers: React.FC<FilterSlicersProps> = ({
  records,
  filters,
  onFilterChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute available unique values and their record counts for each slicer based on the other active filters
  const getOptionsForSlicer = (key: keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>) => {
    const counts = new Map<string, number>();

    // Filter records by all OTHER active filters so each slicer reflects the cross-filtered subset
    const matchingRecords = records.filter((r) => {
      if (key !== 'ano' && filters.ano.length > 0 && !filters.ano.includes(String(r.ano))) return false;
      if (key !== 'periodo' && filters.periodo.length > 0 && !filters.periodo.includes(r.periodo)) return false;
      if (key !== 'sociedad' && filters.sociedad.length > 0 && !filters.sociedad.includes(r.sociedad)) return false;
      if (key !== 'responsable' && filters.responsable.length > 0 && !filters.responsable.includes(r.responsable)) return false;
      if (key !== 'segmentoComercial' && filters.segmentoComercial.length > 0 && !filters.segmentoComercial.includes(r.segmentoComercial)) return false;
      if (filters.selectedKpi && r.kpi !== filters.selectedKpi) return false;
      if (filters.selectedArea && r.areaResponsable !== filters.selectedArea) return false;
      return true;
    });

    matchingRecords.forEach((r) => {
      let val = '';
      if (key === 'ano') val = String(r.ano);
      else if (key === 'periodo') val = r.periodo;
      else if (key === 'sociedad') val = r.sociedad;
      else if (key === 'responsable') val = r.responsable;
      else if (key === 'segmentoComercial') val = r.segmentoComercial;

      if (val && val.trim() !== '') {
        counts.set(val, (counts.get(val) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  };

  // Clean up any selections in other slicers that become invalid after a filter change
  const sanitizeFilters = (newFilters: FilterState): FilterState => {
    const slicerKeys: (keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>)[] = [
      'ano',
      'periodo',
      'sociedad',
      'responsable',
      'segmentoComercial',
    ];

    const result = { ...newFilters };

    slicerKeys.forEach((k) => {
      if (result[k] && result[k].length > 0) {
        const validValues = new Set<string>();
        records.forEach((r) => {
          if (k !== 'ano' && result.ano.length > 0 && !result.ano.includes(String(r.ano))) return;
          if (k !== 'periodo' && result.periodo.length > 0 && !result.periodo.includes(r.periodo)) return;
          if (k !== 'sociedad' && result.sociedad.length > 0 && !result.sociedad.includes(r.sociedad)) return;
          if (k !== 'responsable' && result.responsable.length > 0 && !result.responsable.includes(r.responsable)) return;
          if (k !== 'segmentoComercial' && result.segmentoComercial.length > 0 && !result.segmentoComercial.includes(r.segmentoComercial)) return;

          let val = '';
          if (k === 'ano') val = String(r.ano);
          else if (k === 'periodo') val = r.periodo;
          else if (k === 'sociedad') val = r.sociedad;
          else if (k === 'responsable') val = r.responsable;
          else if (k === 'segmentoComercial') val = r.segmentoComercial;

          if (val && val.trim() !== '') validValues.add(val);
        });

        result[k] = result[k].filter((v) => validValues.has(v));
      }
    });

    return result;
  };

  const handleToggleOption = (
    key: keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>,
    value: string
  ) => {
    const current = filters[key] || [];
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];
    const newFilters = sanitizeFilters({
      ...filters,
      [key]: updated,
    });
    onFilterChange(newFilters);
  };

  const handleSelectAll = (key: keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>) => {
    const newFilters = sanitizeFilters({
      ...filters,
      [key]: [],
    });
    onFilterChange(newFilters);
  };

  const handleClearSlicer = (
    key: keyof Omit<FilterState, 'selectedKpi' | 'selectedArea'>,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newFilters = sanitizeFilters({
      ...filters,
      [key]: [],
    });
    onFilterChange(newFilters);
  };

  return (
    <div ref={dropdownRef} className="w-full flex flex-col gap-2 py-2">
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {SLICERS.map((slicer) => {
        const selectedValues = filters[slicer.key] || [];
        const isOpen = openDropdown === slicer.key;
        const options = getOptionsForSlicer(slicer.key);
        const filteredOptions = options.filter((opt) =>
          opt.value.toLowerCase().includes(searchTerm.toLowerCase())
        );

        let displayText = 'Todas';
        if (selectedValues.length === 1) {
          displayText = selectedValues[0];
        } else if (selectedValues.length > 1) {
          displayText = `(${selectedValues.length}) Seleccionadas`;
        }

        return (
          <div
            key={slicer.key}
            id={slicer.id}
            className={`relative flex flex-col ${slicer.theme.cardBg} rounded-xl p-3.5 shadow-sm border ${slicer.theme.cardBorder} hover:border-[#E1007A]/60 hover:shadow-md transition-all group ${
              isOpen ? 'z-40 ring-2 ring-[#E1007A]/30' : 'z-10'
            }`}
          >
            {/* Top decorative Sunset Pink to Coral accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-xl bg-gradient-to-r ${slicer.theme.gradientBar}`} />

            {/* Slicer Header Label */}
            <div className="flex items-center justify-between mb-2 pt-1">
              <span
                className={`text-[14px] sm:text-[16px] font-extrabold tracking-wider ${slicer.theme.titleColor} text-center w-full uppercase`}
                style={{ fontFamily: "'Playfair Display', 'Cinzel', Georgia, serif" }}
              >
                {slicer.label}
              </span>
              {selectedValues.length > 0 && (
                <button
                  onClick={(e) => handleClearSlicer(slicer.key, e)}
                  className={`absolute right-2.5 top-2.5 text-[12px] ${slicer.theme.clearBg} ${slicer.theme.clearText} px-2.5 py-0.5 rounded-md cursor-pointer transition-all flex items-center gap-0.5 font-bold shadow-xs border ${slicer.theme.clearBorder} active:scale-95 z-10 hover:opacity-90`}
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
                setSearchTerm('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-white/95 border ${
                selectedValues.length > 0
                  ? `${slicer.theme.triggerBorderActive} bg-gradient-to-r from-pink-50/50 to-orange-50/40 text-[#8C165C] font-bold ring-2 ${slicer.theme.triggerRingActive}`
                  : `border-[#EACFE2] hover:border-[#E1007A]/70 text-slate-800`
              } rounded-lg text-[14px] sm:text-[16px] font-medium transition-all cursor-pointer text-left shadow-2xs`}
            >
              <div className="flex items-center gap-1.5 truncate pr-2">
                <span className={`truncate font-semibold text-[14px] sm:text-[16px] ${selectedValues.length > 0 ? 'text-[#8C165C] font-bold' : 'text-slate-800'}`}>
                  {displayText}
                </span>
                {selectedValues.length > 0 && (
                  <span className="bg-gradient-to-r from-[#E1007A] to-[#FF6E52] text-white text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                    {selectedValues.length}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 ${slicer.theme.iconColor} transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popover */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white text-slate-800 rounded-xl shadow-2xl border border-pink-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[240px]">
                {/* Search Bar */}
                <div className="p-2 border-b border-pink-100 bg-[#FCF2FA] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#E1007A] shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Buscar en ${slicer.label}...`}
                    className="w-full text-[14px] sm:text-[16px] bg-transparent outline-none text-slate-800 placeholder-gray-400 focus:border-[#E1007A]"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick actions (Todas / Select All) */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-[#FDF0F8] to-[#FFF4EE] border-b border-pink-100 text-[14px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(slicer.key)}
                    className="font-bold text-[#E1007A] hover:text-[#FF6E52] cursor-pointer transition-colors"
                  >
                    Seleccionar Todas
                  </button>
                  {selectedValues.length > 0 && (
                    <span className="text-[#FF6E52] font-bold text-[13px]">
                      {selectedValues.length} activas
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
                      const isSelected = selectedValues.includes(opt.value);
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleToggleOption(slicer.key, opt.value)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-50 to-orange-50/40 text-[#8C165C] font-bold'
                              : 'hover:bg-pink-50/50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 w-full">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#E1007A] to-[#FF6E52] border-transparent text-white shadow-2xs'
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
                <div className="p-2 border-t border-pink-100 bg-[#FCF2FA]/70 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(null)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#E1007A] to-[#FF6E52] hover:opacity-90 text-white text-[14px] font-bold rounded-md cursor-pointer transition-opacity shadow-xs"
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

    {/* Active Filters Summary Bar for High Interactivity */}
    {(filters.ano.length > 0 ||
      filters.periodo.length > 0 ||
      filters.sociedad.length > 0 ||
      filters.responsable.length > 0 ||
      filters.segmentoComercial.length > 0 ||
      filters.selectedKpi ||
      filters.selectedArea) && (
      <div className="w-full bg-[#FFFDFB] rounded-xl px-4 py-2.5 border border-[#E1007A]/25 shadow-xs flex flex-wrap items-center justify-between gap-2.5 -mt-1 text-[14px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-[#94266F] flex items-center gap-1">
            <span>Filtros Activos:</span>
          </span>

          {filters.ano.map((val) => (
            <span
              key={`chip-ano-${val}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#94266F] font-bold text-[14px] shadow-2xs"
            >
              <span>Año: {val}</span>
              <button
                onClick={() => handleToggleOption('ano', val)}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Quitar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {filters.periodo.map((val) => (
            <span
              key={`chip-periodo-${val}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#94266F] font-bold text-[14px] shadow-2xs"
            >
              <span>Periodo: {val}</span>
              <button
                onClick={() => handleToggleOption('periodo', val)}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Quitar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {filters.sociedad.map((val) => (
            <span
              key={`chip-sociedad-${val}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#6E1E66] font-bold text-[14px] shadow-2xs"
            >
              <span>Sociedad: {val}</span>
              <button
                onClick={() => handleToggleOption('sociedad', val)}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Quitar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {filters.responsable.map((val) => (
            <span
              key={`chip-responsable-${val}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#C2410C] font-bold text-[14px] shadow-2xs"
            >
              <span>Responsable: {val}</span>
              <button
                onClick={() => handleToggleOption('responsable', val)}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Quitar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {filters.segmentoComercial.map((val) => (
            <span
              key={`chip-segmento-${val}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#B45309] font-bold text-[14px] shadow-2xs"
            >
              <span>Segmento: {val}</span>
              <button
                onClick={() => handleToggleOption('segmentoComercial', val)}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Quitar filtro"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {filters.selectedKpi && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#E1007A] to-[#FF6E52] text-white font-extrabold text-[14px] shadow-xs">
              <span>KPI: {filters.selectedKpi}</span>
              <button
                onClick={() => onFilterChange({ ...filters, selectedKpi: null })}
                className="hover:text-yellow-200 cursor-pointer ml-0.5"
                title="Quitar filtro de KPI"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {filters.selectedArea && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6E1E66] text-white font-extrabold text-[14px] shadow-xs">
              <span>Área: {filters.selectedArea}</span>
              <button
                onClick={() => onFilterChange({ ...filters, selectedArea: null })}
                className="hover:text-orange-200 cursor-pointer ml-0.5"
                title="Quitar filtro de Área"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>

        <button
          onClick={() =>
            onFilterChange({
              ano: [],
              periodo: [],
              sociedad: [],
              responsable: [],
              segmentoComercial: [],
              selectedKpi: null,
              selectedArea: null,
            })
          }
          className="text-[14px] font-bold text-[#DC2626] hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
        >
          <X className="w-4 h-4" />
          <span>Restablecer todos</span>
        </button>
      </div>
    )}
  </div>
  );
};
