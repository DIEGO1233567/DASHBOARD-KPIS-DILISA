import React, { useMemo, useState } from 'react';
import { Gauge, Award, Users, ChevronRight, Sparkles } from 'lucide-react';
import { KpiRecord, FilterState } from '../types';

interface ContralorGaugeProps {
  records: KpiRecord[];
  activeResponsableFilter: string[];
  onFilterByResponsable: (contralor: string) => void;
  useCommaDecimals?: boolean;
}

export function ContralorGauge({
  records,
  activeResponsableFilter = [],
  onFilterByResponsable,
  useCommaDecimals = false,
}: ContralorGaugeProps) {
  // Aggregate stats per contralor
  const stats = useMemo(() => {
    const map = new Map<string, { total: number; count: number; areas: Set<string> }>();

    records.forEach((r) => {
      const resp = r.responsable?.trim() || 'Sin Asignar';
      if (!map.has(resp)) {
        map.set(resp, { total: 0, count: 0, areas: new Set() });
      }
      const item = map.get(resp)!;
      item.total += r.kpiFinal;
      item.count += 1;
      if (r.areaResponsable) item.areas.add(r.areaResponsable);
    });

    const list = Array.from(map.entries()).map(([name, data]) => {
      const avg = data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0;
      return {
        name,
        avg,
        count: data.count,
        areasCount: data.areas.size,
      };
    });

    return list.sort((a, b) => b.avg - a.avg);
  }, [records]);

  // Contralor previewed in gauge (or single filtered one)
  const [selectedContralorName, setSelectedContralorName] = useState<string>('');

  const currentContralor = useMemo(() => {
    if (selectedContralorName && stats.some((s) => s.name === selectedContralorName)) {
      return stats.find((s) => s.name === selectedContralorName)!;
    }
    if (activeResponsableFilter.length === 1) {
      const matched = stats.find((s) => s.name === activeResponsableFilter[0]);
      if (matched) return matched;
    }
    return stats[0] || null;
  }, [selectedContralorName, activeResponsableFilter, stats]);

  const formatNumber = (val: number) => {
    const str = val.toFixed(2);
    return useCommaDecimals ? str.replace('.', ',') : str;
  };

  // Performance calculations (Scale 1.0 to 4.0)
  const minScale = 1.0;
  const maxScale = 4.0;
  const score = currentContralor ? currentContralor.avg : 0;
  const clampedScore = Math.max(minScale, Math.min(maxScale, score));
  const progressRatio = (clampedScore - minScale) / (maxScale - minScale); // 0 to 1
  const needleAngle = -180 + progressRatio * 180; // -180 deg to 0 deg

  const getStatus = (val: number) => {
    if (val >= 3.0) return { label: 'Verde (3.0 a 3.5)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' };
    if (val >= 2.0) return { label: 'Amarillo (2.0 a 2.99)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' };
    return { label: 'Rojo (1.0 a 1.99)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-300' };
  };

  const status = getStatus(score);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div
      id="contralor-gauge-strip"
      className="w-full bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 transition-all"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Title & Gauge Section */}
        <div className="flex items-center gap-4 w-full lg:w-auto shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#B80F56]/10 rounded-lg text-[#B80F56]">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#B80F56] uppercase">
                Métrica Clave
              </span>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                Desempeño por Contralor
              </h2>
            </div>
          </div>

          {/* Semicircle Gauge Graphic */}
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
            <div className="relative w-28 h-14 flex items-end justify-center overflow-hidden">
              <svg viewBox="0 0 100 55" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />     {/* Rojo 1.0 */}
                    <stop offset="35%" stopColor="#fbbf24" />    {/* Amarillo 2.0 */}
                    <stop offset="70%" stopColor="#3b82f6" />    {/* Azul 3.0 */}
                    <stop offset="100%" stopColor="#10b981" />   {/* Verde 4.0 */}
                  </linearGradient>
                </defs>

                {/* Base Track */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Colored Gradient Track */}
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="url(#gaugeBarGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset="0"
                  opacity="0.95"
                />
              </svg>

              {/* Needle Indicator */}
              <div
                className="absolute bottom-1 left-1/2 w-1 h-12 bg-gray-900 rounded-t origin-bottom transform transition-transform duration-500 ease-out shadow"
                style={{
                  transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                }}
              >
                <div className="w-1.5 h-1.5 -top-1 -left-0.25 absolute bg-[#B80F56] rounded-full" />
              </div>

              {/* Pivot Point */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>

            {/* Score & Active Name */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {formatNumber(score)}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">/ 4.00</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 line-clamp-1 max-w-[140px]">
                {currentContralor?.name}
              </p>
              <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${status.bg} ${status.color} mt-0.5 w-fit`}>
                <Award className="w-2.5 h-2.5" />
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Contralores Direct Comparison Pills & Fast Filter */}
        <div className="w-full lg:w-auto flex-1 flex flex-wrap items-center justify-end gap-1.5">
          {stats.map((c, i) => {
            const isCurrent = currentContralor?.name === c.name;
            const isFiltered = activeResponsableFilter.includes(c.name);
            const st = getStatus(c.avg);

            return (
              <button
                key={c.name}
                id={`btn-contralor-${i}`}
                onClick={() => {
                  setSelectedContralorName(c.name);
                  onFilterByResponsable(c.name);
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isFiltered
                    ? 'bg-[#B80F56] text-white border-[#B80F56] shadow-sm ring-2 ring-[#B80F56]/20'
                    : isCurrent
                    ? 'bg-pink-50/70 border-pink-300 text-gray-900 shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                }`}
                title={`Filtrar por ${c.name} (${c.count} registros evaluados)`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isFiltered
                        ? 'bg-white/20 text-white'
                        : i === 0
                        ? 'bg-amber-300 text-amber-950'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold text-xs whitespace-nowrap">{c.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded ${
                      isFiltered ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-900'
                    }`}
                  >
                    {formatNumber(c.avg)}
                  </span>
                  {!isFiltered && (
                    <span className={`text-[9px] font-bold px-1 rounded border ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
