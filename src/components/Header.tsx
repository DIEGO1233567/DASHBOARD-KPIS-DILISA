import React from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Trash2,
  Cloud,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { DriveSyncConfig } from '../types';

interface HeaderProps {
  totalRecords: number;
  filteredCount: number;
  onOpenUpload: () => void;
  onDownloadTemplate: () => void;
  onGenerate104k: () => void;
  onClearData: () => void;
  isGeneratingLarge: boolean;
  onResetFilters: () => void;
  useCommaDecimals: boolean;
  setUseCommaDecimals: (val: boolean) => void;
  heatmapMode: boolean;
  setHeatmapMode: (val: boolean) => void;
  activeFilterCount: number;
  driveConfig: DriveSyncConfig;
  onOpenDriveSync: () => void;
  onTriggerDriveSync: () => void;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  isDriveSyncing: boolean;
  nextSyncCountdown: string | null;
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  filteredCount,
  onOpenUpload,
  onDownloadTemplate,
  onGenerate104k,
  onClearData,
  isGeneratingLarge,
  onResetFilters,
  useCommaDecimals,
  setUseCommaDecimals,
  heatmapMode,
  setHeatmapMode,
  activeFilterCount,
  driveConfig,
  onOpenDriveSync,
  onTriggerDriveSync,
  onGoogleLogin,
  onGoogleLogout,
  isDriveSyncing,
  nextSyncCountdown,
}) => {
  const isDriveConfigured = Boolean(driveConfig.fileUrl || driveConfig.fileId);
  const isLoggedIn = Boolean(driveConfig.googleUser && driveConfig.accessToken);

  return (
    <header className="w-full bg-gradient-to-r from-[#8A185B] via-[#7D1A56] to-[#661144] shadow-xl border-b border-white/20 relative overflow-hidden">
      {/* Decorative ambient subtle glow */}
      <div className="absolute -top-12 left-10 w-96 h-28 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 right-10 w-80 h-28 bg-[#E86C1D]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Main Luxury Header Bar */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        {/* Left: Main Executive Title */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-[#E86C1D] ring-4 ring-white/30 animate-pulse" />
            <span className="text-[12px] uppercase font-bold tracking-widest text-white/90 font-mono">
              El Puerto de Liverpool • Contraloría Corporativa
            </span>
          </div>
          <h1
            id="executive-title"
            className="text-[24px] sm:text-[32px] md:text-[36px] font-extrabold tracking-wide text-white uppercase drop-shadow-md leading-tight"
            style={{
              fontFamily: "'Playfair Display', 'Cinzel', 'Cormorant Garamond', Georgia, serif",
              letterSpacing: '0.04em',
            }}
          >
            RESUMEN EJECUTIVO KPI'S
          </h1>
          <div className="text-[13px] sm:text-[14px] text-white/90 font-medium mt-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span>Base Institucional: <strong className="text-white font-mono font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur-xs">{totalRecords.toLocaleString('es-MX')}</strong> registros</span>
            {filteredCount !== totalRecords && (
              <span className="bg-white text-[#8A185B] px-2 py-0.5 rounded text-[13px] font-bold shadow-xs">
                ({filteredCount.toLocaleString('es-MX')} filtrados)
              </span>
            )}

            {/* Google Drive Status Pill */}
            {isDriveConfigured && (
              <div
                onClick={isLoggedIn ? onTriggerDriveSync : onGoogleLogin}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                  driveConfig.lastSyncStatus === 'error'
                    ? 'bg-red-500/30 text-red-100 border-red-400'
                    : 'bg-emerald-500/25 text-emerald-100 border-emerald-400/50 hover:bg-emerald-500/40'
                }`}
                title="Clic para sincronizar con Google Sheets"
              >
                {driveConfig.lastSyncStatus === 'error' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span className="font-bold">{driveConfig.fileName || "BASE KPI'S 2026 FINAL VF"}</span>
                {driveConfig.lastSyncTime && (
                  <span className="text-white/75 font-mono text-[11px]">
                    ({driveConfig.lastSyncTime})
                  </span>
                )}
                {driveConfig.autoSyncEnabled && nextSyncCountdown && (
                  <span className="bg-white/20 text-white px-1.5 py-0.2 rounded text-[10px] font-mono">
                    ⏱ {nextSyncCountdown}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions and Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Main Google Login & Sync Button */}
          {isLoggedIn ? (
            <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-emerald-400/40 backdrop-blur-xs shadow-sm">
              <button
                id="btn-google-sync-active"
                onClick={onTriggerDriveSync}
                disabled={isDriveSyncing}
                className="flex items-center gap-2 px-3.5 py-2 text-[13px] sm:text-[14px] font-extrabold rounded-lg bg-white hover:bg-emerald-50 text-[#8A185B] shadow-sm transition-all cursor-pointer active:scale-98"
                title={`Conectado como ${driveConfig.googleUser?.email || 'Google'}. Clic para sincronizar datos en vivo.`}
              >
                <div className="relative flex items-center justify-center">
                  {driveConfig.googleUser?.picture ? (
                    <img
                      src={driveConfig.googleUser.picture}
                      alt="Google User"
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full ring-1 ring-emerald-500"
                    />
                  ) : (
                    <GoogleIcon className="w-4 h-4" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-600 ${isDriveSyncing ? 'animate-spin' : ''}`}
                />
                <span className="text-[#8A185B]">
                  {isDriveSyncing ? 'Sincronizando...' : 'Sincronizar Sheets'}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline">
                  En Vivo
                </span>
              </button>

              {/* Logout button */}
              <button
                id="btn-google-logout"
                onClick={onGoogleLogout}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                title={`Cerrar sesión de Google (${driveConfig.googleUser?.email || ''})`}
              >
                <LogOut className="w-4 h-4 text-white/90 hover:text-red-200" />
              </button>
            </div>
          ) : (
            /* Not Logged In: Direct Google Sign In Button */
            <button
              id="btn-google-login-direct"
              onClick={onGoogleLogin}
              disabled={isDriveSyncing}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] sm:text-[14px] font-extrabold rounded-xl bg-white hover:bg-gray-50 text-gray-800 shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200 active:scale-98"
              title="Haz clic para iniciar sesión con tu cuenta de Google y conectar la base de datos en vivo"
            >
              <GoogleIcon className="w-4 h-4" />
              <span className="text-[#8A185B] font-bold">
                {isDriveSyncing ? 'Conectando...' : 'Iniciar Sesión con Google'}
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Pendiente de autenticación" />
            </button>
          )}

          {/* Upload Excel Button */}
          <button
            id="btn-upload-excel"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 text-[#8A185B] font-bold text-[13px] sm:text-[14px] rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-white/60 active:scale-98"
            title="Subir archivo Excel (.xlsx) localmente"
          >
            <Upload className="w-4 h-4 text-[#8A185B]" />
            <span>Subir Excel</span>
          </button>

          {/* Download Template */}
          <button
            id="btn-download-template"
            onClick={onDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-[13px] sm:text-[14px] rounded-lg border border-white/30 transition-all cursor-pointer backdrop-blur-xs"
            title="Descargar plantilla de Excel con la estructura de BASE KPI'S"
          >
            <Download className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Plantilla</span>
          </button>

          {/* Clear / Delete Database button */}
          {totalRecords > 0 && (
            <button
              id="btn-clear-database"
              onClick={onClearData}
              className="flex items-center gap-1 px-2.5 py-2 bg-black/25 hover:bg-black/40 text-white hover:text-red-200 font-bold text-[13px] rounded-lg border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
              title="Eliminar la base de datos actual para cargar una nueva"
            >
              <Trash2 className="w-3.5 h-3.5 text-pink-200" />
              <span className="hidden xl:inline">Eliminar</span>
            </button>
          )}

          {/* Heatmap / Liverpool colors Toggle */}
          <button
            id="btn-toggle-heatmap"
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`flex items-center gap-1 px-3 py-2 text-[13px] font-bold rounded-lg border transition-all cursor-pointer ${
              heatmapMode
                ? 'bg-white text-[#8A185B] border-white shadow-xs'
                : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
            }`}
            title="Alternar formato de colores corporativos Liverpool"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{heatmapMode ? 'Gradiente: ON' : 'Gradiente: OFF'}</span>
          </button>

          {/* Decimal comma / point selector */}
          <button
            id="btn-toggle-comma"
            onClick={() => setUseCommaDecimals(!useCommaDecimals)}
            className="px-2.5 py-2 bg-white/15 hover:bg-white/25 text-white font-mono text-[13px] font-bold rounded-lg border border-white/30 transition-all cursor-pointer"
            title="Cambiar formato decimal (coma , o punto .)"
          >
            {useCommaDecimals ? '0,0' : '0.0'}
          </button>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <button
              id="btn-reset-filters-header"
              onClick={onResetFilters}
              className="flex items-center gap-1 px-3 py-2 bg-white text-[#8A185B] hover:bg-orange-50 font-bold text-[13px] rounded-lg transition-all cursor-pointer shadow-md border border-white"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
