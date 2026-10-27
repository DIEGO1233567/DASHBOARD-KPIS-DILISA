import React, { useState } from 'react';
import { ZoomIn, X, FileSpreadsheet } from 'lucide-react';

export const ISR_IMAGE_SRC = '/assets/aistudio/image_b4baa9c7.png';

export const IsrClasificacionTablaVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => {
  return (
    <img
      src={ISR_IMAGE_SRC}
      alt="Cuadro de Clasificación de KPIs – ISR"
      className={className}
      loading="lazy"
    />
  );
};

export const IsrClasificacionGraphic: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2.5 pt-2 border-t border-purple-200/70 max-w-[240px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#854E8D]" />
          <span className="text-[10px] font-bold text-[#502446] uppercase tracking-wider">
            Cuadro de Clasificación
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-[10px] text-[#854E8D] hover:text-[#502446] font-semibold transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3 h-3" />
          <span>Ampliar</span>
        </button>
      </div>

      <div
        onClick={() => setIsOpen(true)}
        className="group relative cursor-pointer rounded-lg border border-slate-300 overflow-hidden bg-white shadow-2xs hover:shadow-md hover:border-purple-300 transition-all max-w-[240px] max-h-[140px] flex items-center justify-center"
        title="Clic para ampliar imagen"
      >
        <img
          src={ISR_IMAGE_SRC}
          alt="Cuadro de Clasificación de KPIs – ISR"
          className="w-full h-auto object-contain block mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
        />
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
                  Cuadro de Clasificación de KPIs – ISR
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
            <div className="overflow-x-auto p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex items-center justify-center">
              <img
                src={ISR_IMAGE_SRC}
                alt="Cuadro de Clasificación de KPIs – ISR"
                className="w-full max-w-3xl h-auto object-contain mx-auto rounded-lg shadow-sm"
              />
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
