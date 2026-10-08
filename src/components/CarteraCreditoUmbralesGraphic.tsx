import React, { useState } from 'react';
import { ZoomIn, X, FileSpreadsheet } from 'lucide-react';

export const CarteraCreditoTablaVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 880 295"
      className={className}
      style={{ background: '#ffffff', fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
    >
      {/* Outer table border with Liverpool plum/purple tone */}
      <rect x="1" y="1" width="878" height="293" fill="#ffffff" stroke="#701A5B" strokeWidth="1.5" />

      {/* Header background (Liverpool Plum / Magenta #701A5B) */}
      <rect x="1" y="1" width="878" height="37" fill="#701A5B" />

      {/* Border below header */}
      <line x1="1" y1="38" x2="879" y2="38" stroke="#701A5B" strokeWidth="1.2" />

      {/* Vertical white dividers in header */}
      <line x1="295" y1="1" x2="295" y2="38" stroke="#ffffff" strokeWidth="1.2" />
      <line x1="480" y1="1" x2="480" y2="38" stroke="#ffffff" strokeWidth="1.2" />

      {/* Column headers */}
      <text x="20" y="25" fontSize="16" fontWeight="bold" fill="#ffffff">Descripción</text>
      <text x="388" y="25" fontSize="16" fontWeight="bold" fill="#ffffff" textAnchor="middle">Monto</text>
      <text x="680" y="25" fontSize="16" fontWeight="bold" fill="#ffffff" textAnchor="middle">KPI</text>

      {/* Row 1: Partidas en conciliación */}
      <text x="20" y="60" fontSize="15" fontWeight="bold" fill="#701A5B">Partidas en conciliación</text>

      {/* Row 2: Acumulado a diciembre 2025 */}
      <text x="20" y="93" fontSize="15" fontWeight="bold" fill="#701A5B">Acumulado a diciembre 2025</text>
      <text x="388" y="93" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">143,265,866</text>
      <line x1="305" y1="99" x2="470" y2="99" stroke="#000000" strokeWidth="1.2" />
      <line x1="305" y1="102" x2="470" y2="102" stroke="#000000" strokeWidth="1.2" />

      {/* Row 3: Umbral + 5% (Red) */}
      <text x="20" y="125" fontSize="15" fontWeight="bold" fill="#701A5B">Umbral</text>
      <text x="388" y="125" fontSize="15.5" fontWeight="bold" fill="#C00000" textAnchor="middle">5%</text>

      {/* Row 4: Umbral Definido 2026 + 150,429,159 */}
      <text x="20" y="158" fontSize="15" fontWeight="bold" fill="#701A5B">Umbral Definido 2026</text>
      <text x="388" y="158" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">150,429,159</text>
      <line x1="305" y1="164" x2="470" y2="164" stroke="#000000" strokeWidth="1.2" />
      <line x1="305" y1="167" x2="470" y2="167" stroke="#000000" strokeWidth="1.2" />

      {/* Green Upward Block Arrow with black border */}
      <polygon points="496,138 486,149 491,149 491,162 501,162 501,149 506,149" fill="#2E7D32" stroke="#000000" strokeWidth="1" />

      {/* Pastel Green Status Box with black border */}
      <rect x="515" y="137" width="225" height="30" fill="#E2EFDA" stroke="#000000" strokeWidth="1" />
      <text x="627.5" y="157" fontSize="14" fontWeight="bold" fill="#000000" textAnchor="middle">Menor o igual al Umbral</text>

      {/* Calificación 2.5 Pill (light sage green) with black border */}
      <rect x="754" y="130" width="112" height="44" rx="14" fill="#C6E0B4" stroke="#000000" strokeWidth="1" />
      <text x="810" y="146" fontSize="10" fontWeight="bold" fill="#000000" textAnchor="middle" letterSpacing="0.5">CALIFICACIÓN</text>
      <text x="810" y="165" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">2.5</text>

      {/* Row 5: De 150,429,159 a 157,592,453 */}
      <text x="388" y="196" fontSize="14.5" fontWeight="bold" fill="#000000" textAnchor="middle">De 150,429,159</text>
      <text x="388" y="214" fontSize="14.5" fontWeight="bold" fill="#000000" textAnchor="middle">a 157,592,453</text>
      <line x1="305" y1="220" x2="470" y2="220" stroke="#000000" strokeWidth="1.2" />
      <line x1="305" y1="223" x2="470" y2="223" stroke="#000000" strokeWidth="1.2" />

      {/* Pastel Yellow Status Box with black border (NO arrow) */}
      <rect x="515" y="180" width="225" height="40" fill="#FFF2CC" stroke="#000000" strokeWidth="1" />
      <text x="627.5" y="205" fontSize="14.5" fontWeight="bold" fill="#000000" textAnchor="middle">Umbral Intermedio</text>

      {/* Calificación 1.5 Pill (light pastel peach) with black border */}
      <rect x="754" y="178" width="112" height="44" rx="14" fill="#FCE5CD" stroke="#000000" strokeWidth="1" />
      <text x="810" y="194" fontSize="10" fontWeight="bold" fill="#000000" textAnchor="middle" letterSpacing="0.5">CALIFICACIÓN</text>
      <text x="810" y="213" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">1.5</text>

      {/* Row 6: 10% (Red) */}
      <text x="388" y="244" fontSize="15.5" fontWeight="bold" fill="#C00000" textAnchor="middle">10%</text>

      {/* Row 7: 157,592,453 */}
      <text x="388" y="271" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">157,592,453</text>
      <line x1="305" y1="277" x2="470" y2="277" stroke="#000000" strokeWidth="1.2" />
      <line x1="305" y1="280" x2="470" y2="280" stroke="#000000" strokeWidth="1.2" />

      {/* Red Downward Block Arrow with black border */}
      <polygon points="491,248 501,248 501,261 506,261 496,271 486,261 491,261" fill="#C00000" stroke="#000000" strokeWidth="1" />

      {/* Pastel Red Status Box with black border */}
      <rect x="515" y="246" width="225" height="30" fill="#FCE4D6" stroke="#000000" strokeWidth="1" />
      <text x="627.5" y="266" fontSize="14" fontWeight="bold" fill="#000000" textAnchor="middle">Umbral excedido</text>

      {/* Calificación 1.0 Pill (light pastel red) with black border */}
      <rect x="754" y="239" width="112" height="44" rx="14" fill="#F4CCCC" stroke="#000000" strokeWidth="1" />
      <text x="810" y="255" fontSize="10" fontWeight="bold" fill="#000000" textAnchor="middle" letterSpacing="0.5">CALIFICACIÓN</text>
      <text x="810" y="274" fontSize="15.5" fontWeight="bold" fill="#000000" textAnchor="middle">1.0</text>
    </svg>
  );
};

export const CarteraCreditoUmbralesGraphic: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 pt-2.5 border-t border-purple-200/70 max-w-[480px]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#854E8D]" />
          <span className="text-[11px] font-bold text-[#502446] uppercase tracking-wider">
            Tabla de Referencia y Umbrales
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] text-[#854E8D] hover:text-[#502446] font-semibold transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3 h-3" />
          <span>Ampliar</span>
        </button>
      </div>

      <div
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer rounded-lg border border-slate-300 overflow-hidden bg-white shadow-2xs hover:shadow-md hover:border-purple-300 transition-all max-w-[480px]"
        title="Clic para ampliar imagen"
      >
        <CarteraCreditoTablaVisual className="w-full h-auto object-contain block mx-auto transition-transform duration-200 group-hover:scale-[1.01]" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-purple-900/5 transition-colors flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 bg-[#502446]/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow transition-opacity flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3" /> Clic para ampliar
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#854E8D]" />
                <h3 className="font-bold text-gray-900 text-lg">
                  Cartera de Crédito – Tabla de Umbrales 2026
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto p-2 bg-slate-50/50 rounded-xl border border-slate-200">
              <CarteraCreditoTablaVisual className="w-full min-w-[700px] h-auto object-contain mx-auto" />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#502446] hover:bg-[#3D1432] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
