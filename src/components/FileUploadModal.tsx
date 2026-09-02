import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ColumnMapping, KpiRecord } from '../types';
import { parseExcelFile, downloadTemplateWorkbook } from '../utils/excelParser';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (records: KpiRecord[], filename: string) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Por favor selecciona un archivo de Excel válido (.xlsx, .xls o .csv).');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const res = await parseExcelFile(
        selectedFile,
        undefined,
        undefined,
        (pct, msg) => setProgressMsg(msg)
      );

      onDataLoaded(res.records, selectedFile.name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#B80F56] text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-pink-200" />
            <h2 className="text-lg font-bold">Subir Base de Datos KPI's (.xlsx)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-pink-100 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Carga tu archivo de Excel con los registros de KPI's. El sistema detectará
            automáticamente las columnas necesarias (Año, Periodo, Sociedad, Contralor,
            Segmento Comercial, Área Responsable, KPI y KPI Final).
          </p>

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-[#B80F56] bg-pink-50/50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
            }`}
            onClick={() => document.getElementById('excel-file-input')?.click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 text-[#B80F56] mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Arrastra tu archivo Excel aquí o haz clic para examinar
              </p>
              <p className="text-xs text-gray-500 mt-1">Soporta formatos .xlsx, .xls y .csv</p>
            </div>
          </div>

          {/* Progress / Status */}
          {loading && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center gap-3 text-purple-900 text-xs sm:text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#B80F56] shrink-0" />
              <span>{progressMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => downloadTemplateWorkbook()}
              className="text-xs text-[#B80F56] hover:underline font-semibold cursor-pointer"
            >
              Descargar plantilla modelo
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold rounded-md cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
