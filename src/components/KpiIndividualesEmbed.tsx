import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  X,
  Check,
  Info,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const STORAGE_KEY = 'liverpool_kpi_individuales_embed_url';
export const DEFAULT_EMBED_URL = 'https://ai.studio/apps/b4ff6214-16eb-4755-8a95-4eef715a01d1';

export const KpiIndividualesEmbed: React.FC = () => {
  const [embedUrl, setEmbedUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim() !== '') {
        return saved.trim();
      }
    } catch {
      // ignore localStorage errors
    }
    return DEFAULT_EMBED_URL;
  });

  const [inputUrl, setInputUrl] = useState<string>(embedUrl);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync fullscreen state with document fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(embedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenConfig = () => {
    setInputUrl(embedUrl);
    setIsConfigOpen(true);
    setSaveSuccess(false);
  };

  const handleSaveConfig = () => {
    const cleanUrl = inputUrl.trim() || DEFAULT_EMBED_URL;
    setEmbedUrl(cleanUrl);
    try {
      localStorage.setItem(STORAGE_KEY, cleanUrl);
    } catch {
      // ignore
    }
    setSaveSuccess(true);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => {
      setIsConfigOpen(false);
      setSaveSuccess(false);
    }, 900);
  };

  const handleResetDefault = () => {
    setInputUrl(DEFAULT_EMBED_URL);
  };

  const isGoogleWorkspaceDirectUrl =
    embedUrl.includes('ai.studio/apps/') || embedUrl.includes('aistudio.google.com/apps/');

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-4 overflow-auto' : 'space-y-3'
      }`}
    >
      {/* Header Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8A185B] to-[#E86C1D] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                Dashboard: KPI&apos;S individuales
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#8A185B]/10 text-[#8A185B] font-extrabold text-[11px] uppercase tracking-wide border border-[#8A185B]/20">
                AI Studio Incrustado
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-md md:max-w-lg mt-0.5 font-medium">
              Fuente: <span className="font-mono text-[11px] text-slate-600">{embedUrl}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Info & Tips Toggle */}
          <button
            type="button"
            onClick={() => setShowTips((prev) => !prev)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              showTips
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-amber-50/70 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
            title="Consejos de visualización"
          >
            <Info className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Consejos</span>
          </button>

          {/* Reload Button */}
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title="Recargar vista de AI Studio"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8A185B]' : ''}`} />
            <span className="hidden sm:inline">Recargar</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Minimizar' : 'Pantalla Completa'}</span>
          </button>

          {/* Open in new tab */}
          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-pink-50 text-[#8A185B] border border-[#8A185B]/30 hover:border-[#8A185B] transition-colors cursor-pointer"
            title="Abrir en una nueva pestaña del navegador"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abrir en pestaña</span>
          </button>

          {/* Config URL */}
          <button
            type="button"
            onClick={handleOpenConfig}
            className="p-2 text-slate-500 hover:text-[#8A185B] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Configurar URL del Dashboard"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helpful Advice Banner */}
      {showTips && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 shadow-xs relative">
          <button
            type="button"
            onClick={() => setShowTips(false)}
            className="absolute top-3 right-3 text-amber-600 hover:text-amber-900"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 pr-6">
              <p className="font-bold text-[13px] text-amber-950">
                ¿Cómo garantizar la visualización fluida del otro AI Studio?
              </p>
              <p className="text-amber-900/90 leading-relaxed">
                1. <strong>URL de Publicación / Shared App URL (Recomendado):</strong> En el otro AI Studio,
                pulsa en <strong>&ldquo;Share&rdquo;</strong> o copia la URL pública compartida (la que termina en{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.run.app</code>). Al usar esa
                URL en lugar de la del editor, el dashboard se mostrará al 100% sin pedir inicio de sesión ni bloqueos de
                seguridad de Google.
              </p>
              <p className="text-amber-900/90 leading-relaxed">
                2. <strong>Enlace del Editor:</strong> Si usas la liga del editor (
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">ai.studio/apps/...</code>),
                Google puede requerir que tu cuenta de Google Workspace esté activa o abrir la ventana directa con el
                botón <strong>&ldquo;Abrir en pestaña&rdquo;</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Iframe Container */}
      <div className="relative w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[750px] flex-1 flex flex-col">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 transition-opacity">
            <Loader2 className="w-8 h-8 text-[#8A185B] animate-spin" />
            <p className="text-xs font-bold text-slate-600">Cargando AI Studio incrustado...</p>
          </div>
        )}

        {/* The Iframe */}
        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Dashboard de KPI'S individuales - AI Studio"
          onLoad={() => setIsLoading(false)}
          className="w-full h-[calc(100vh-250px)] min-h-[750px] border-0 rounded-2xl bg-white"
          allow="clipboard-read; clipboard-write; fullscreen; web-share"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-presentation"
        />

        {/* Bottom bar inside frame container */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Dashboard Incrustado</span>
            <span className="text-slate-400">•</span>
            <span>ID: b4ff6214-16eb-4755-8a95-4eef715a01d1</span>
          </div>

          <div className="flex items-center gap-3">
            {isGoogleWorkspaceDirectUrl && (
              <span className="hidden sm:inline text-amber-700 text-[11px] font-medium">
                ¿Problemas de visualización? Usa &ldquo;Abrir en pestaña&rdquo; o configura la Shared App URL
              </span>
            )}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="text-[#8A185B] hover:text-[#E86C1D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Abrir en ventana completa</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Config URL Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-[#8A185B] to-[#E86C1D] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-200" />
                <h3 className="font-bold text-sm sm:text-base">Configurar URL del Dashboard Incrustado</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡URL actualizada y dashboard recargado con éxito!</span>
                </div>
              )}

              <div>
                <label htmlFor="input-embed-url" className="block font-bold text-slate-800 mb-1">
                  Enlace del AI Studio / Dashboard:
                </label>
                <input
                  id="input-embed-url"
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://ai.studio/apps/... o https://ais-pre-...run.app"
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#8A185B] focus:border-[#8A185B] outline-hidden bg-white text-slate-800"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <p className="font-bold text-slate-700">Opciones recomendadas:</p>
                <p>
                  • <strong>Shared App URL:</strong> La liga que termina en{' '}
                  <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800">.run.app</code>{' '}
                  (obtenida al pulsar &ldquo;Share&rdquo; en el otro AI Studio) es la que se incrusta de manera más
                  rápida y directa.
                </p>
                <p>
                  • <strong>Applet URL:</strong>{' '}
                  <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800">
                    {DEFAULT_EMBED_URL}
                  </code>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer"
                >
                  Restaurar predeterminado
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-5 py-2 rounded-xl bg-[#8A185B] hover:bg-[#73124b] text-white font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar y Cargar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
