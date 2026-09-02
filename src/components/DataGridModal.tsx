import React, { useState, useMemo } from 'react';
import { X, Search, Download, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { KpiRecord } from '../types';
import { formatKpiNumber, downloadTemplateWorkbook } from '../utils/excelParser';

interface DataGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: KpiRecord[];
  useCommaDecimals: boolean;
}

export const DataGridModal: React.FC<DataGridModalProps> = ({
  isOpen,
  onClose,
  records,
  useCommaDecimals,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        String(r.ano).includes(q) ||
        r.periodo.toLowerCase().includes(q) ||
        r.sociedad.toLowerCase().includes(q) ||
        r.responsable.toLowerCase().includes(q) ||
        r.segmentoComercial.toLowerCase().includes(q) ||
        r.areaResponsable.toLowerCase().includes(q) ||
        r.kpi.toLowerCase().includes(q)
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-300 w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#B80F56] text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-pink-200" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Base de Datos KPI'S (104,847 Filas)</h2>
              <p className="text-xs text-pink-100 font-medium">
                Mostrando {filtered.length.toLocaleString('es-MX')} registros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadTemplateWorkbook(records)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#B80F56] hover:bg-pink-50 text-xs font-bold rounded shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar XLSX</span>
            </button>
            <button
              onClick={onClose}
              className="text-pink-100 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por área, kpi, responsable, sociedad..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-gray-100 text-slate-700 font-bold border-b border-gray-300 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 border-r border-gray-200">#</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Año</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Periodo</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Sociedad</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Contralor</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Segmento Comercial</th>
                <th className="py-2.5 px-3 border-r border-gray-200">Área Responsable</th>
                <th className="py-2.5 px-3 border-r border-gray-200">KPI</th>
                <th className="py-2.5 px-3 text-right">KPI Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-slate-700 font-mono">
              {paginated.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-purple-50/50">
                  <td className="py-2 px-3 border-r border-gray-200 text-gray-400 text-[11px]">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans">{r.ano}</td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans">{r.periodo}</td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans truncate max-w-[200px]" title={r.sociedad}>
                    {r.sociedad}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans truncate max-w-[180px]" title={r.responsable}>
                    {r.responsable}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans truncate max-w-[180px]" title={r.segmentoComercial}>
                    {r.segmentoComercial}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans font-semibold text-slate-900">
                    {r.areaResponsable}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-sans font-medium text-purple-900">
                    {r.kpi}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatKpiNumber(r.kpiFinal, useCommaDecimals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div>
            Página <span className="font-bold text-slate-900">{page}</span> de{' '}
            <span className="font-bold text-slate-900">{totalPages.toLocaleString('es-MX')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
