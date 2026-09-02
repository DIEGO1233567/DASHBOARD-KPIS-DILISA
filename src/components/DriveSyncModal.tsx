import React, { useState, useEffect } from 'react';
import {
  Cloud,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Link as LinkIcon,
  HelpCircle,
  ShieldCheck,
  Zap,
  LogIn,
  LogOut,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { DriveSyncConfig, GoogleUserInfo, KpiRecord } from '../types';
import { extractDriveFileId, syncFromGoogleDrive, saveDriveConfig, DEFAULT_SHEET_URL } from '../utils/driveSync';
import {
  requestGoogleAccessToken,
  getSavedClientId,
  saveClientId,
  fetchGoogleUserInfo,
} from '../utils/googleAuth';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DriveSyncConfig;
  onSaveConfig: (newConfig: DriveSyncConfig) => void;
  onDataLoaded: (records: KpiRecord[], sourceName: string) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onDataLoaded,
}) => {
  const [urlInput, setUrlInput] = useState(config.fileUrl || DEFAULT_SHEET_URL);
  const [tokenInput, setTokenInput] = useState(config.accessToken || '');
  const [clientIdInput, setClientIdInput] = useState(config.googleClientId || getSavedClientId() || '');
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(config.googleUser || null);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(config.syncIntervalMinutes || 5);
  const [autoSync, setAutoSync] = useState<boolean>(config.autoSyncEnabled || false);

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; name: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(config.fileUrl || DEFAULT_SHEET_URL);
      setTokenInput(config.accessToken || '');
      setClientIdInput(config.googleClientId || getSavedClientId() || '');
      setGoogleUser(config.googleUser || null);
      setIntervalMinutes(config.syncIntervalMinutes || 5);
      setAutoSync(config.autoSyncEnabled || false);
      setErrorMessage(config.lastSyncError || null);
      setSuccessInfo(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const detectedFileId = extractDriveFileId(urlInput);

  // Handle Google OAuth 2.0 Sign In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      if (clientIdInput.trim()) {
        saveClientId(clientIdInput.trim());
      }

      const { accessToken, userInfo } = await requestGoogleAccessToken(
        clientIdInput.trim() || undefined
      );

      setTokenInput(accessToken);
      setGoogleUser(userInfo);

      const updated: DriveSyncConfig = {
        ...config,
        accessToken,
        googleUser: userInfo,
        googleClientId: clientIdInput.trim(),
        authMethod: 'oauth',
      };
      saveDriveConfig(updated);
      onSaveConfig(updated);

      // If URL is already provided, immediately trigger sync!
      if (urlInput.trim()) {
        handleTestAndSyncWithToken(accessToken, userInfo);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.message === 'CLIENT_ID_REQUIRED') {
        setShowAdvanced(true);
        setErrorMessage(
          'Para conectar con OAuth interactivo de Google, ingresa tu Google Client ID en Opciones Avanzadas o pega tu Token de Acceso directamente.'
        );
      } else if (err.message === 'POPUP_CLOSED' || err.message?.includes('Popup window closed')) {
        setErrorMessage(
          'La ventana de inicio de sesión de Google se cerró antes de completar la autorización. Asegúrate de seleccionar tu cuenta corporativa y otorgar permisos.'
        );
      } else {
        setErrorMessage(err.message || 'Error al iniciar sesión con Google.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOutGoogle = () => {
    setTokenInput('');
    setGoogleUser(null);
    const updated: DriveSyncConfig = {
      ...config,
      accessToken: '',
      googleUser: null,
      authMethod: 'public',
    };
    saveDriveConfig(updated);
    onSaveConfig(updated);
  };

  const handleTestAndSyncWithToken = async (
    overrideToken?: string,
    overrideUser?: GoogleUserInfo | null
  ) => {
    const activeToken = overrideToken !== undefined ? overrideToken : tokenInput;
    const activeUser = overrideUser !== undefined ? overrideUser : googleUser;

    if (!urlInput.trim()) {
      setErrorMessage('Por favor ingresa o pega la liga de tu archivo de Google Sheets en el campo de arriba.');
      const inputEl = document.getElementById('drive-url-input');
      inputEl?.focus();
      return;
    }

    setErrorMessage(null);
    setSuccessInfo(null);
    setIsLoading(true);
    setProgressPercent(10);
    setProgressMsg('Iniciando conexión con Google Drive...');

    try {
      const result = await syncFromGoogleDrive(
        urlInput.trim(),
        activeToken.trim() || undefined,
        (pct, msg) => {
          setProgressPercent(pct);
          setProgressMsg(msg);
        }
      );

      const nowStr = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const updatedConfig: DriveSyncConfig = {
        ...config,
        fileUrl: urlInput.trim(),
        fileId: detectedFileId,
        fileName: result.fileName,
        fileType: result.fileName.endsWith('.csv') ? 'csv' : 'excel',
        accessToken: activeToken.trim(),
        googleUser: activeUser,
        googleClientId: clientIdInput.trim(),
        syncIntervalMinutes: intervalMinutes,
        autoSyncEnabled: autoSync,
        lastSyncTime: nowStr,
        lastSyncStatus: 'success',
        lastSyncError: null,
        lastRecordCount: result.records.length,
      };

      saveDriveConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      onDataLoaded(result.records, result.fileName);

      setSuccessInfo({
        count: result.records.length,
        name: result.fileName,
      });
    } catch (err: any) {
      console.error('Error during Drive sync:', err);
      const errMsg = err?.message || 'Error desconocido al conectar con Google Drive.';
      setErrorMessage(errMsg);

      const failedConfig: DriveSyncConfig = {
        ...config,
        fileUrl: urlInput.trim(),
        fileId: detectedFileId,
        accessToken: activeToken.trim(),
        googleUser: activeUser,
        googleClientId: clientIdInput.trim(),
        syncIntervalMinutes: intervalMinutes,
        autoSyncEnabled: autoSync,
        lastSyncStatus: 'error',
        lastSyncError: errMsg,
      };
      saveDriveConfig(failedConfig);
      onSaveConfig(failedConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAndSync = () => {
    handleTestAndSyncWithToken();
  };

  const handleSaveSettingsOnly = () => {
    if (clientIdInput.trim()) {
      saveClientId(clientIdInput.trim());
    }
    const updatedConfig: DriveSyncConfig = {
      ...config,
      fileUrl: urlInput.trim(),
      fileId: detectedFileId,
      accessToken: tokenInput.trim(),
      googleUser,
      googleClientId: clientIdInput.trim(),
      syncIntervalMinutes: intervalMinutes,
      autoSyncEnabled: autoSync,
    };
    saveDriveConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-[#8A185B] via-[#74154D] to-[#5C103D] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Sincronización en Vivo con Google</span>
                <span className="text-[11px] bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  OAuth & API
                </span>
              </h2>
              <p className="text-xs text-pink-100/90">
                Conecta tu cuenta de Google y tu archivo de Sheets o Excel para sincronizar con 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pink-100 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* Section 1: Google Account Connection Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="w-10 h-10 rounded-full border-2 border-[#8A185B] shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8A185B] to-[#E86C1D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {googleUser?.name ? googleUser.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  {googleUser ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{googleUser.name}</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500 font-mono">{googleUser.email}</p>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-slate-900 text-sm">Cuenta de Google</h4>
                      <p className="text-xs text-slate-500">Conecta tu cuenta corporativa para acceso sin restricciones</p>
                    </>
                  )}
                </div>
              </div>

              {googleUser ? (
                <button
                  type="button"
                  onClick={handleSignOutGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-modal-google-signin"
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#E10098] hover:bg-[#C90087] active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl border border-pink-400/50 shadow-md hover:shadow-lg hover:shadow-pink-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="bg-white p-1 rounded-full flex items-center justify-center shadow-xs">
                    {isAuthenticating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E10098]" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-white font-bold">{isAuthenticating ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Google Drive / Google Sheets URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Liga o Enlace del Archivo de Google Drive o Google Sheets <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                      setUrlInput(text.trim());
                      setErrorMessage(null);
                    }
                  } catch (e) {
                    const inputEl = document.getElementById('drive-url-input');
                    inputEl?.focus();
                  }
                }}
                className="text-xs text-[#8A185B] hover:text-[#74154D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>📋 Pegar desde portapapeles</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                id="drive-url-input"
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Pega aquí la URL de tu Google Sheet (ej. https://docs.google.com/spreadsheets/d/.../edit)"
                className="w-full pl-10 pr-24 py-2.5 bg-white border-2 border-slate-300 focus:border-[#8A185B] rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8A185B]/20 transition-all font-mono text-xs sm:text-sm shadow-xs"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {detectedFileId ? (
              <div className="text-[12px] text-emerald-700 font-mono flex items-center gap-2 mt-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-sans font-medium text-emerald-900">Enlace válido detectado:</span>
                <strong className="bg-white text-[#8A185B] px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                  {detectedFileId}
                </strong>
                <span className="text-emerald-700 text-xs font-sans">
                  {urlInput.includes('spreadsheets') ? '📊 Google Sheet' : '📁 Archivo en Drive'}
                </span>
              </div>
            ) : urlInput.trim().length > 0 ? (
              <p className="text-[11px] text-amber-700 mt-1">
                ⚠️ No se reconoció un ID de archivo en la URL ingresada. Asegúrate de copiar el enlace completo del navegador.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Abre tu hoja de cálculo <em>"BASE KPI'S 2026 FINAL VF"</em> en Google Sheets, copia la liga de la barra de direcciones de tu navegador y pégala aquí.
              </p>
            )}
          </div>

          {/* Section 3: Auto-Sync Frequency & Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-[#8A185B]" />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Actualización Periódica Automática</h4>
                  <p className="text-[11px] text-slate-500">Recargar datos en segundo plano automáticamente</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8A185B]"></div>
              </label>
            </div>

            {autoSync && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">Frecuencia de sincronización:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '1 min', val: 1 },
                    { label: '5 min', val: 5 },
                    { label: '15 min', val: 15 },
                    { label: '30 min', val: 30 },
                    { label: '1 hora', val: 60 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setIntervalMinutes(item.val)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        intervalMinutes === item.val
                          ? 'bg-[#8A185B] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#8A185B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{showAdvanced ? '▼ Ocultar opciones avanzadas' : '▶ Mostrar opciones avanzadas (Token / Client ID)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Google OAuth Client ID (Opcional para Popup de Google)
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="123456789-abcdef.apps.googleusercontent.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-[#8A185B] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Si tu organización tiene un Client ID de Google Cloud registrado, ingrésalo aquí.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Token de Acceso Directo (Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ya29.a0AfH6SM..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-[#8A185B] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Progress / Loading State */}
          {isLoading && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#8A185B]" />
                  {progressMsg}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8A185B] to-[#E86C1D] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-950">Aviso / Error al sincronizar:</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-950">¡Sincronización Exitosa!</p>
                <p className="text-emerald-800">
                  Se descargaron y procesaron <strong>{successInfo.count.toLocaleString('es-MX')}</strong> registros desde <em>"{successInfo.name}"</em>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSettingsOnly}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Guardar
            </button>

            <button
              id="btn-sync-drive-now"
              type="button"
              onClick={handleTestAndSync}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8A185B] to-[#E86C1D] hover:from-[#74154D] hover:to-[#D45E15] active:scale-98 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Sincronizar Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
