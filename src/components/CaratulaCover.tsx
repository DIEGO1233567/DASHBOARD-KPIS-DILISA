import React from 'react';
import { ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';

interface CaratulaCoverProps {
  onGoToDashboard: () => void;
  onSelectKpi?: (kpi: string) => void;
  year?: number | string;
}

interface KpiItem {
  id: number;
  label: string;
  dataKey: string;
}

const KPIS_COL1: KpiItem[] = [
  { id: 1, label: 'CARTERA DE CREDITO', dataKey: 'Cartera de Credito' },
  { id: 2, label: 'INVENTARIO/CTO DE VTAS', dataKey: 'Inventario/Cto de vtas' },
  { id: 3, label: 'PAGOS ANTICIPADOS', dataKey: 'Pagos Anticipados' },
  { id: 4, label: 'PROVEEDORES', dataKey: 'Proveedores' },
  { id: 5, label: 'IVA', dataKey: 'IVA' },
  { id: 6, label: 'ISR', dataKey: 'ISR' },
];

const KPIS_COL2: KpiItem[] = [
  { id: 7, label: 'INTEREMPRESAS', dataKey: 'INTEREMPRESAS' },
  { id: 8, label: 'ASOCIADOS', dataKey: 'Asociados' },
  { id: 9, label: 'CUENTAS DE MAYOR', dataKey: 'Cuentas De Mayor' },
  { id: 10, label: 'LIGADO CONT. ELECT.', dataKey: 'LIGADO CONT. ELECT.' },
  { id: 11, label: 'CONCILIACIÓN DE INGRESOS MERCADERIAS PDM-BW-CO-ECC', dataKey: 'CONCILIACIÓN DE INGRESOS MERCADERIAS PDM-BW-CO-ECC' },
];

export const CaratulaCover: React.FC<CaratulaCoverProps> = ({
  onGoToDashboard,
  onSelectKpi,
  year = '2026',
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center my-1 sm:my-2">
      {/* 16:9 Slide Presentation Frame replicating the exact uploaded slide */}
      <div className="w-full max-w-[1550px] bg-white rounded-2xl shadow-2xl border-2 sm:border-4 border-[#25081E] overflow-hidden relative flex flex-col">
        
        {/* Main Content Area with Diagonal Split */}
        <div className="relative min-h-[620px] lg:min-h-[700px] flex flex-col lg:flex-row">
          
          {/* Left Column: Corporate Info & Text (approx 58% width) */}
          <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10 bg-white">
            <div>
              {/* Header: El Puerto de Liverpool with purple & orange underline */}
              <div className="inline-block mb-8 sm:mb-10">
                <span
                  className="text-2xl sm:text-3xl lg:text-4xl font-normal text-[#38112E] tracking-tight block"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif" }}
                >
                  El Puerto de Liverpool
                </span>
                <div className="h-[3px] w-full flex mt-2">
                  <div className="w-[60%] bg-[#38112E]" />
                  <div className="w-[40%] bg-[#FF5500]" />
                </div>
              </div>

              {/* Title Section with Vertical Deep Purple Bar */}
              <div className="flex items-stretch gap-5 sm:gap-6 mb-8">
                {/* Vertical solid purple bar */}
                <div className="w-1.5 bg-[#38112E] rounded-full shrink-0" />
                
                <div className="flex flex-col">
                  <h1
                    className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#38112E] tracking-tight leading-none"
                    style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                  >
                    KPI´s {year}
                  </h1>
                  <h2 className="text-xl sm:text-2xl font-light text-slate-700 mt-3 tracking-wide">
                    El Puerto de Liverpool y Subsidiarias
                  </h2>
                  {/* Small orange accent line */}
                  <div className="h-0.5 w-24 bg-[#FF5500] mt-4" />
                </div>
              </div>

              {/* Explanatory Body Paragraphs */}
              <div className="space-y-5 text-slate-700 text-[16px] sm:text-[17px] lg:text-[18px] leading-relaxed max-w-2xl font-normal">
                <p>
                  El Puerto de Liverpool, S.A.B. de C.V., es una empresa que cotiza en la BMV y en consecuencia tiene diversas obligaciones tanto legales, como éticas, para garantizar la transparencia y la confianza de los inversionistas.
                </p>
                <p>
                  Uno de los objetivos estratégicos de la Contraloría Corporativa es consolidar el entorno de control y garantizar la exactitud de los estados financieros. Para ello, ha diseñado e implementado un conjunto de indicadores de evaluación para los principales rubros financieros, de aplicación obligatoria para todas las contralorías de la organización.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <button
                id="btn-caratula-ir-resumen"
                onClick={onGoToDashboard}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#6E1E66] hover:bg-[#5A1653] active:scale-[0.98] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ir al Resumen Ejecutivo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Contraloría Corporativa • Monitoreo Institucional {year}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Facade with Diagonal Angular Mask, KPIs List & Liverpool Monogram */}
          <div className="w-full lg:w-[48%] relative min-h-[550px] lg:min-h-[750px] bg-[#7B1953] overflow-hidden flex flex-col justify-between p-6 sm:p-8 lg:p-10 z-0">
            {/* Diagonal Clip Path Background */}
            <div
              className="absolute inset-0 bg-[#74154D]"
              style={{
                clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)',
              }}
            >
              {/* Photo of modern curved architectural building with Liverpool neon sign */}
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-25"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=1200&q=80')`,
                }}
              />

              {/* Rich Liverpool Magenta Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#5A0F3B] via-[#7B1953]/95 to-[#8E2164]/90" />
            </div>

            {/* Top Brand Title */}
            <div className="relative z-10 text-right select-none pl-6 sm:pl-10">
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-wider drop-shadow-md"
                style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
              >
                Liverpool
              </div>
              <div className="text-[11px] sm:text-xs text-[#FF9E00] uppercase tracking-widest font-mono mt-1 font-semibold">
                Contraloría Corporativa
              </div>
            </div>

            {/* Centered KPI Indicators List inside Image Area */}
            <div className="relative z-10 my-auto pl-4 sm:pl-8 lg:pl-10 pr-2 py-4">
              <div className="flex items-center justify-between border-b-2 border-white/25 pb-3 mb-6">
                <span
                  className="text-[20px] sm:text-[24px] lg:text-[28px] font-bold tracking-wider uppercase text-[#FFB347] drop-shadow-sm"
                  style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
                >
                  RUBROS EVALUADOS (KPIS)
                </span>
              </div>

              {/* 2-Column Vertical Flow List of KPIs matching Institutional Cover */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5">
                {/* Columna Izquierda: 1 a 6 */}
                <div className="flex flex-col gap-2.5">
                  {KPIS_COL1.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectKpi) onSelectKpi(item.dataKey);
                        else onGoToDashboard();
                      }}
                      className="flex items-center gap-3 text-white py-0.5 px-1.5 rounded-xl hover:bg-white/20 transition-all cursor-pointer group"
                      title={`Ir a ${item.label} en Resumen Ejecutivo`}
                    >
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#FF1A8B] to-[#E1007A] text-white font-mono text-xs sm:text-sm font-black flex items-center justify-center shrink-0 shadow-md border border-white/40 group-hover:scale-110 transition-transform">
                        {item.id}
                      </span>
                      <span
                        className="text-[15px] sm:text-[18px] lg:text-[20px] font-semibold text-white tracking-wide uppercase leading-tight drop-shadow-md group-hover:text-[#FFB347] transition-colors"
                        style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Columna Derecha: 7 a 11 */}
                <div className="flex flex-col gap-2.5">
                  {KPIS_COL2.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectKpi) onSelectKpi(item.dataKey);
                        else onGoToDashboard();
                      }}
                      className="flex items-center gap-3 text-white py-0.5 px-1.5 rounded-xl hover:bg-white/20 transition-all cursor-pointer group"
                      title={`Ir a ${item.label} en Resumen Ejecutivo`}
                    >
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#FF1A8B] to-[#E1007A] text-white font-mono text-xs sm:text-sm font-black flex items-center justify-center shrink-0 shadow-md border border-white/40 group-hover:scale-110 transition-transform">
                        {item.id}
                      </span>
                      <span
                        className="text-[15px] sm:text-[18px] lg:text-[20px] font-semibold text-white tracking-wide uppercase leading-tight drop-shadow-md group-hover:text-[#FFB347] transition-colors"
                        style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom space */}
            <div className="relative z-10 select-none pl-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

