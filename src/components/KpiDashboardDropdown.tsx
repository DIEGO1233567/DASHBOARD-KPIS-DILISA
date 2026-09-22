import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Settings,
  Sparkles,
  Link2,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';

export interface KpiDropdownItem {
  id: number;
  label: string;
  dataKey: string;
  defaultUrl: string;
  description: string;
}

// 11 official KPIs in exact order of the Carátula Institucional
export const CARATULA_KPIS: KpiDropdownItem[] = [
  {
    id: 1,
    label: 'CARTERA DE CREDITO',
    dataKey: 'Cartera de Credito',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard analítico de Cartera de Crédito',
  },
  {
    id: 2,
    label: 'INVENTARIO/CTO DE VTAS',
    dataKey: 'Inventario/Cto de vtas',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Inventarios y Costo de Ventas',
  },
  {
    id: 3,
    label: 'PAGOS ANTICIPADOS',
    dataKey: 'Pagos Anticipados',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Pagos Anticipados y Amortizaciones',
  },
  {
    id: 4,
    label: 'PROVEEDORES',
    dataKey: 'Proveedores',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Cuentas por Pagar a Proveedores',
  },
  {
    id: 5,
    label: 'IVA',
    dataKey: 'IVA',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard fiscal de Impuesto al Valor Agregado',
  },
  {
    id: 6,
    label: 'ISR',
    dataKey: 'ISR',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard fiscal de Impuesto Sobre la Renta',
  },
  {
    id: 7,
    label: 'INTERCOMPAÑIAS',
    dataKey: 'INTERCOMPAÑIAS',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Partidas Abiertas Intercompañías',
  },
  {
    id: 8,
    label: 'ASOCIADOS',
    dataKey: 'Asociados',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Nómina y Cuentas de Asociados',
  },
  {
    id: 9,
    label: 'CUENTAS DE MAYOR',
    dataKey: 'Cuentas De Mayor',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard contable de Cuentas de Mayor y Balanza',
  },
  {
    id: 10,
    label: 'LIGADO CONT. ELECT.',
    dataKey: 'LIGADO CONT. ELECT.',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Ligado con Contabilidad Electrónica SAT',
  },
  {
    id: 11,
    label: 'CONC. ING. MERCADERIAS (DIFER. SIS)',
    dataKey: 'Conc. Ing. Mercaderias (Difer. Sis)',
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de Conciliación Ingresos Mercaderías vs Sistemas',
  },
  {
    id: 12,
    label: "KPI'S (OTROS)",
    dataKey: "KPI'S (OTROS)",
    defaultUrl: 'https://aistudio.google.com/',
    description: 'Dashboard de otros KPI\'s e indicadores complementarios',
  },
];

const STORAGE_KEY = 'liverpool_kpi_dashboard_urls';
const MAIN_DASHBOARD_ID = 0;
const DEFAULT_MAIN_URL = 'https://aistudio.google.com/';

interface KpiDashboardDropdownProps {
  onSelectKpi?: (kpiName: string) => void;
}

export const KpiDashboardDropdown: React.FC<KpiDashboardDropdownProps> = ({ onSelectKpi }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customUrls, setCustomUrls] = useState<Record<number, string>>({});
  const [draftUrls, setDraftUrls] = useState<Record<number, string>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Load custom URLs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomUrls(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const getMainUrl = (): string => {
    if (customUrls[MAIN_DASHBOARD_ID] && customUrls[MAIN_DASHBOARD_ID].trim() !== '') {
      return customUrls[MAIN_DASHBOARD_ID].trim();
    }
    return DEFAULT_MAIN_URL;
  };

  const handleOpenMainDashboard = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const targetUrl = getMainUrl();
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (onSelectKpi) {
      onSelectKpi("KPI'S individuales");
    }
  };

  const handleOpenConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftUrls({ ...customUrls });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftUrls));
      setCustomUrls(draftUrls);
      setSaveSuccessMessage('Enlaces guardados correctamente');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        setIsConfigOpen(false);
      }, 1000);
    } catch {
      // ignore
    }
  };

  const handleResetConfig = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCustomUrls({});
      setDraftUrls({});
      setSaveSuccessMessage('Enlaces restablecidos a los valores predeterminados');
      setTimeout(() => setSaveSuccessMessage(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Botón directo KPI'S individuales sin desplegable */}
      <div className="relative inline-flex items-center gap-1.5">
        <button
          id="btn-kpi-individuales"
          type="button"
          onClick={handleOpenMainDashboard}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[15px] bg-white hover:bg-gradient-to-r hover:from-[#8A185B]/5 hover:to-orange-50/60 text-[#8A185B] border border-[#8A185B]/30 hover:border-[#8A185B] shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none group"
          title="KPI'S individuales: Clic para abrir automáticamente el dashboard en AI Studio"
        >
          {/* Sparkle Icon */}
          <Sparkles className="w-4.5 h-4.5 text-[#E86C1D]" />

          {/* Button Text */}
          <span className="font-extrabold tracking-tight">
            KPI&apos;S individuales
          </span>

          {/* AI Studio Badge */}
          <span className="hidden sm:inline-flex items-center text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-100 text-[#E86C1D]">
            AI Studio
          </span>

          {/* External Link Icon */}
          <ExternalLink className="w-3.5 h-3.5 text-[#8A185B]/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ml-0.5" />
        </button>

        {/* Config button to customize the destination AI Studio URL */}
        <button
          id="btn-config-kpi-url"
          type="button"
          onClick={handleOpenConfig}
          className="p-2.5 text-gray-400 hover:text-[#8A185B] hover:bg-pink-50 rounded-xl border border-gray-200/80 hover:border-[#8A185B]/30 transition-colors cursor-pointer shadow-2xs bg-white"
          title="Configurar URL de AI Studio para KPI'S individuales"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Modal for Configuring Custom URLs */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#8A185B] via-[#78144f] to-[#5a0c3a] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                  <Link2 className="w-5 h-5 text-orange-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[17px] tracking-tight">
                    Configurar Enlaces de Dashboards AI Studio
                  </h3>
                  <p className="text-pink-100 text-xs">
                    Ingresa la URL del dashboard de AI Studio correspondiente a cada rubro de KPI.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of KPI URL Inputs */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 divide-y divide-gray-100">
              {saveSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Row 0: Dashboard Principal KPI'S individuales */}
              <div className="pb-3 bg-pink-50/60 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-b-2 border-dashed border-[#8A185B]/20">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E86C1D] text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                      ★
                    </span>
                    <label
                      htmlFor="kpi-url-input-main"
                      className="text-[13px] font-black text-[#8A185B] uppercase tracking-tight"
                    >
                      Dashboard Principal: KPI&apos;S individuales (Botón Directo)
                    </label>
                  </div>

                  {draftUrls[MAIN_DASHBOARD_ID]?.trim() && (
                    <a
                      href={draftUrls[MAIN_DASHBOARD_ID].trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#8A185B] hover:text-[#E86C1D] font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>Probar enlace</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="kpi-url-input-main"
                    type="url"
                    placeholder={`URL principal de AI Studio para KPI'S individuales (por defecto: ${DEFAULT_MAIN_URL})`}
                    value={draftUrls[MAIN_DASHBOARD_ID] ?? ''}
                    onChange={(e) =>
                      setDraftUrls((prev) => ({
                        ...prev,
                        [MAIN_DASHBOARD_ID]: e.target.value,
                      }))
                    }
                    className="flex-1 text-xs border border-[#8A185B]/40 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8A185B] focus:border-[#8A185B] outline-hidden transition-all bg-white font-medium"
                  />
                  {draftUrls[MAIN_DASHBOARD_ID] && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftUrls((prev) => ({
                          ...prev,
                          [MAIN_DASHBOARD_ID]: '',
                        }))
                      }
                      className="text-gray-400 hover:text-red-600 text-xs px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="Limpiar URL (usar predeterminada)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {CARATULA_KPIS.map((kpi) => {
                const currentVal = draftUrls[kpi.id] ?? '';
                return (
                  <div key={kpi.id} className="pt-3 first:pt-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#8A185B] text-white font-extrabold text-[10.5px] flex items-center justify-center shrink-0">
                          {kpi.id}
                        </span>
                        <label
                          htmlFor={`kpi-url-input-${kpi.id}`}
                          className="text-[12.5px] font-bold text-gray-800 uppercase"
                        >
                          {kpi.label}
                        </label>
                      </div>

                      {/* Test link button */}
                      {currentVal.trim() && (
                        <a
                          href={currentVal.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#8A185B] hover:text-[#E86C1D] font-bold flex items-center gap-1 hover:underline"
                        >
                          <span>Probar enlace</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id={`kpi-url-input-${kpi.id}`}
                        type="url"
                        placeholder={`URL dashboard AI Studio (por defecto: ${kpi.defaultUrl})`}
                        value={currentVal}
                        onChange={(e) =>
                          setDraftUrls((prev) => ({
                            ...prev,
                            [kpi.id]: e.target.value,
                          }))
                        }
                        className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8A185B] focus:border-[#8A185B] outline-hidden transition-all bg-gray-50/50 focus:bg-white"
                      />
                      {currentVal && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftUrls((prev) => ({
                              ...prev,
                              [kpi.id]: '',
                            }))
                          }
                          className="text-gray-400 hover:text-red-600 text-xs px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                          title="Limpiar URL (usar predeterminada)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetConfig}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer todas</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#8A185B] hover:bg-[#78144f] shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Enlaces</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
