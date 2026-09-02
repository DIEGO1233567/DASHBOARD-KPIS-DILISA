/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useTransition, useEffect, useRef, useCallback } from 'react';
import { FilterState, KpiRecord, DriveSyncConfig } from './types';
import { generateInitialDataset, generateLargeDataset, INITIAL_AREAS, INITIAL_KPIS } from './data/initialData';
import { computeMatrixData, computeKpiAverages, filterRecords } from './utils/matrixCalculations';
import { Header } from './components/Header';
import { FilterSlicers } from './components/FilterSlicers';
import { KpiMatrix } from './components/KpiMatrix';
import { KpiBarChart } from './components/KpiBarChart';
import { KpiSummaryTable } from './components/KpiSummaryTable';
import { SegmentoKpiTab } from './components/SegmentoKpiTab';
import { CriteriosEvaluacionTab } from './components/CriteriosEvaluacionTab';
import { CaratulaCover } from './components/CaratulaCover';
import { FileUploadModal } from './components/FileUploadModal';
import { DataGridModal } from './components/DataGridModal';
import { DriveSyncModal } from './components/DriveSyncModal';
import { downloadTemplateWorkbook } from './utils/excelParser';
import { loadDriveConfig, saveDriveConfig, syncFromGoogleDrive, DEFAULT_SHEET_URL } from './utils/driveSync';
import { requestGoogleAccessToken } from './utils/googleAuth';
import { loadRecordsFromStorage, saveRecordsToStorage } from './utils/dataStore';
import {
  LayoutDashboard,
  FileText,
  Building2,
  BookOpen,
  TableProperties,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function App() {
  // Navigation Tabs: 'caratula' | 'dashboard' | 'consolidado' | 'segmento' | 'criterios'
  const [activeTab, setActiveTab] = useState<'caratula' | 'dashboard' | 'consolidado' | 'segmento' | 'criterios'>('dashboard');

  const [records, setRecords] = useState<KpiRecord[]>(() => generateInitialDataset(104847));
  const [isGeneratingLarge, setIsGeneratingLarge] = useState(false);
  const [, startTransition] = useTransition();

  // Helper for empty initial filter state
  const createInitialFilterState = (): FilterState => ({
    ano: [],
    periodo: [],
    sociedad: [],
    responsable: [],
    segmentoComercial: [],
    selectedKpi: null,
    selectedArea: null,
  });

  // Independent filter state for Resumen Ejecutivo (Dashboard Tab)
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>(createInitialFilterState);

  // Independent filter state for Tablero Consolidado Tab
  const [consolidadoFilters, setConsolidadoFilters] = useState<FilterState>(createInitialFilterState);

  const [useCommaDecimals, setUseCommaDecimals] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDataGridOpen, setIsDataGridOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Google Drive Sync State
  const [driveConfig, setDriveConfig] = useState<DriveSyncConfig>(() => loadDriveConfig());
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number | null>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Timer reference for auto-sync countdown
  const timerRef = useRef<any>(null);

  // --- Resumen Ejecutivo Computations ---
  const dashboardFilteredRecords = useMemo(() => {
    return filterRecords(records, dashboardFilters);
  }, [records, dashboardFilters]);

  const dashboardMatrixData = useMemo(() => {
    return computeMatrixData(dashboardFilteredRecords, INITIAL_AREAS, INITIAL_KPIS);
  }, [dashboardFilteredRecords]);

  const dashboardKpiAverages = useMemo(() => {
    return computeKpiAverages(dashboardFilteredRecords, INITIAL_KPIS);
  }, [dashboardFilteredRecords]);

  // --- Tablero Consolidado Computations ---
  const consolidadoFilteredRecords = useMemo(() => {
    return filterRecords(records, consolidadoFilters);
  }, [records, consolidadoFilters]);

  const consolidadoMatrixData = useMemo(() => {
    return computeMatrixData(consolidadoFilteredRecords, INITIAL_AREAS, INITIAL_KPIS);
  }, [consolidadoFilteredRecords]);

  const consolidadoKpiAverages = useMemo(() => {
    return computeKpiAverages(consolidadoFilteredRecords, INITIAL_KPIS);
  }, [consolidadoFilteredRecords]);

  // Count active filters helper
  const countActiveFilters = (f: FilterState) => {
    let count = 0;
    if (f.ano.length > 0) count++;
    if (f.periodo.length > 0) count++;
    if (f.sociedad.length > 0) count++;
    if (f.responsable.length > 0) count++;
    if (f.segmentoComercial.length > 0) count++;
    if (f.selectedKpi) count++;
    if (f.selectedArea) count++;
    return count;
  };

  const dashboardFilterCount = useMemo(() => countActiveFilters(dashboardFilters), [dashboardFilters]);
  const consolidadoFilterCount = useMemo(() => countActiveFilters(consolidadoFilters), [consolidadoFilters]);

  const activeFilterCount = useMemo(() => {
    if (activeTab === 'dashboard') return dashboardFilterCount;
    if (activeTab === 'consolidado') return consolidadoFilterCount;
    return 0;
  }, [activeTab, dashboardFilterCount, consolidadoFilterCount]);

  const currentTabRecords = useMemo(() => {
    if (activeTab === 'dashboard') return dashboardFilteredRecords;
    if (activeTab === 'consolidado') return consolidadoFilteredRecords;
    return records;
  }, [activeTab, dashboardFilteredRecords, consolidadoFilteredRecords, records]);

  const handleResetCurrentTabFilters = () => {
    if (activeTab === 'dashboard') {
      setDashboardFilters(createInitialFilterState());
    } else if (activeTab === 'consolidado') {
      setConsolidadoFilters(createInitialFilterState());
    }
  };

  const handleResetAllFilters = () => {
    setDashboardFilters(createInitialFilterState());
    setConsolidadoFilters(createInitialFilterState());
  };

  const handleGenerate104k = () => {
    setIsGeneratingLarge(true);
    setTimeout(() => {
      startTransition(() => {
        const largeData = generateLargeDataset(104847);
        setRecords(largeData);
        setIsGeneratingLarge(false);
      });
    }, 50);
  };

  const handleDataLoaded = (newRecords: KpiRecord[], sourceName?: string) => {
    setRecords(newRecords);
    handleResetAllFilters();
    saveRecordsToStorage(newRecords, sourceName);
    if (sourceName) {
      setSyncToast({
        message: `Se actualizaron ${newRecords.length.toLocaleString('es-MX')} registros desde "${sourceName}"`,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  const handleClearData = () => {
    setRecords([]);
    handleResetAllFilters();
  };

  // Direct Google 1-Click Login and Sync
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsDriveSyncing(true);
      setSyncToast({
        message: 'Conectando con tu cuenta de Google...',
        type: 'success',
      });
      const authRes = await requestGoogleAccessToken();
      if (authRes.accessToken) {
        const targetUrl = driveConfig.fileUrl || driveConfig.fileId || DEFAULT_SHEET_URL;
        const updated: DriveSyncConfig = {
          ...driveConfig,
          fileUrl: targetUrl,
          accessToken: authRes.accessToken,
          googleUser: authRes.userInfo,
          authMethod: 'oauth',
        };
        setDriveConfig(updated);
        saveDriveConfig(updated);

        // Immediately fetch live sheet data with the fresh access token
        const result = await syncFromGoogleDrive(targetUrl, authRes.accessToken);
        const nowStr = new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const succCfg: DriveSyncConfig = {
          ...updated,
          fileName: result.fileName,
          lastSyncTime: nowStr,
          lastSyncStatus: 'success',
          lastSyncError: null,
          lastRecordCount: result.records.length,
        };

        setDriveConfig(succCfg);
        saveDriveConfig(succCfg);
        setRecords(result.records);
        saveRecordsToStorage(result.records, result.fileName);

        setSyncToast({
          message: `¡Sesión iniciada como ${authRes.userInfo?.email || 'Google'}! Sincronizados ${result.records.length.toLocaleString('es-MX')} registros`,
          type: 'success',
        });
        setTimeout(() => setSyncToast(null), 5000);
      }
    } catch (err: any) {
      if (err?.message !== 'POPUP_CLOSED') {
        console.error('Google login error:', err);
        setSyncToast({
          message: `Error al conectar con Google: ${err?.message || 'Revisa permisos'}`,
          type: 'error',
        });
        setTimeout(() => setSyncToast(null), 6000);
      }
    } finally {
      setIsDriveSyncing(false);
    }
  }, [driveConfig]);

  // Google Sign Out
  const handleGoogleLogout = useCallback(() => {
    const updated: DriveSyncConfig = {
      ...driveConfig,
      accessToken: '',
      googleUser: null,
      authMethod: 'public',
    };
    setDriveConfig(updated);
    saveDriveConfig(updated);
    setSyncToast({
      message: 'Sesión de Google cerrada',
      type: 'success',
    });
    setTimeout(() => setSyncToast(null), 4000);
  }, [driveConfig]);

  // Trigger Google Drive sync execution
  const executeDriveSync = useCallback(async (isSilentAutoSync: boolean = false) => {
    const targetUrl = driveConfig.fileUrl || driveConfig.fileId || DEFAULT_SHEET_URL;

    // If it's a silent background sync and we have no auth token, don't spam errors
    if (isSilentAutoSync && !driveConfig.accessToken) {
      return;
    }

    setIsDriveSyncing(true);
    if (!isSilentAutoSync) {
      setSyncToast({
        message: 'Sincronizando datos en vivo desde Google Sheets...',
        type: 'success',
      });
    }

    try {
      const result = await syncFromGoogleDrive(
        targetUrl,
        driveConfig.accessToken || undefined
      );

      const nowStr = new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const updated: DriveSyncConfig = {
        ...driveConfig,
        fileUrl: targetUrl,
        fileName: result.fileName,
        lastSyncTime: nowStr,
        lastSyncStatus: 'success',
        lastSyncError: null,
        lastRecordCount: result.records.length,
      };

      setDriveConfig(updated);
      saveDriveConfig(updated);
      setRecords(result.records);
      saveRecordsToStorage(result.records, result.fileName);

      setSyncToast({
        message: `¡Sincronización exitosa! Se actualizaron ${result.records.length.toLocaleString('es-MX')} registros desde "${result.fileName}" (${nowStr})`,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 5000);

      // Reset countdown timer
      if (driveConfig.autoSyncEnabled && driveConfig.syncIntervalMinutes > 0) {
        setNextSyncSeconds(driveConfig.syncIntervalMinutes * 60);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error al sincronizar con Google Drive';
      console.warn('Sync result:', errMsg);

      const updated: DriveSyncConfig = {
        ...driveConfig,
        lastSyncStatus: driveConfig.accessToken ? 'error' : 'idle',
        lastSyncError: driveConfig.accessToken ? errMsg : null,
      };
      setDriveConfig(updated);
      saveDriveConfig(updated);

      if (!isSilentAutoSync) {
        setSyncToast({
          message: driveConfig.accessToken
            ? `Error al sincronizar: ${errMsg}`
            : 'Para sincronizar esta hoja corporativa en vivo, haz clic en "Iniciar Sesión con Google".',
          type: driveConfig.accessToken ? 'error' : 'info',
        });
        setTimeout(() => setSyncToast(null), 7000);
      }
    } finally {
      setIsDriveSyncing(false);
    }
  }, [driveConfig]);

  // Initial load: restore cached data from IndexedDB or fetch live Google Sheets data
  useEffect(() => {
    // 1. Check if we have previously stored real user records in IndexedDB
    loadRecordsFromStorage().then((cached) => {
      if (cached && cached.records && cached.records.length > 0) {
        setRecords(cached.records);
      }
    });

    // 2. Check for URL parameters or saved Drive config to fetch fresh live data
    const params = new URLSearchParams(window.location.search);
    const sheetParam = params.get('sheet') || params.get('drive') || params.get('url');

    if (sheetParam) {
      const updated: DriveSyncConfig = {
        ...driveConfig,
        fileUrl: sheetParam,
      };
      setDriveConfig(updated);
      saveDriveConfig(updated);

      setIsDriveSyncing(true);
      syncFromGoogleDrive(sheetParam, driveConfig.accessToken || undefined)
        .then((res) => {
          setRecords(res.records);
          saveRecordsToStorage(res.records, res.fileName);
          const nowStr = new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const succCfg: DriveSyncConfig = {
            ...updated,
            fileName: res.fileName,
            lastSyncTime: nowStr,
            lastSyncStatus: 'success',
            lastSyncError: null,
            lastRecordCount: res.records.length,
          };
          setDriveConfig(succCfg);
          saveDriveConfig(succCfg);
          setSyncToast({
            message: `Base de datos sincronizada desde Google Sheets: ${res.records.length.toLocaleString('es-MX')} registros cargados`,
            type: 'success',
          });
          setTimeout(() => setSyncToast(null), 5000);
        })
        .catch((err) => {
          console.warn('Initial URL param sync error:', err);
        })
        .finally(() => {
          setIsDriveSyncing(false);
        });
    } else if (driveConfig.accessToken && (driveConfig.fileUrl || driveConfig.fileId)) {
      // If user is authenticated, silently refresh the latest data
      executeDriveSync(true);
    }
  }, []);

  // Interval timer for countdown and background auto-sync
  useEffect(() => {
    if (!driveConfig.autoSyncEnabled || driveConfig.syncIntervalMinutes <= 0 || !driveConfig.accessToken) {
      setNextSyncSeconds(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Set initial countdown in seconds
    const intervalSec = driveConfig.syncIntervalMinutes * 60;
    setNextSyncSeconds(intervalSec);

    timerRef.current = setInterval(() => {
      setNextSyncSeconds((prev) => {
        if (prev === null || prev <= 1) {
          // Trigger silent auto sync
          executeDriveSync(true);
          return intervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [driveConfig.autoSyncEnabled, driveConfig.syncIntervalMinutes, driveConfig.accessToken, executeDriveSync]);

  // Format countdown mm:ss
  const formattedCountdown = useMemo(() => {
    if (nextSyncSeconds === null) return null;
    const mins = Math.floor(nextSyncSeconds / 60);
    const secs = nextSyncSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [nextSyncSeconds]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans selection:bg-[#8A185B] selection:text-white">
      {/* Toast Notification for Auto-Sync */}
      {syncToast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            syncToast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-500/50 shadow-emerald-950/20'
              : 'bg-rose-950 text-white border-rose-500/50 shadow-rose-950/20'
          }`}
        >
          {syncToast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{syncToast.message}</span>
          <button
            onClick={() => setSyncToast(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <Header
        totalRecords={records.length}
        filteredCount={currentTabRecords.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onDownloadTemplate={() => downloadTemplateWorkbook(records.slice(0, 100))}
        onGenerate104k={handleGenerate104k}
        onClearData={handleClearData}
        isGeneratingLarge={isGeneratingLarge}
        onResetFilters={handleResetCurrentTabFilters}
        useCommaDecimals={useCommaDecimals}
        setUseCommaDecimals={setUseCommaDecimals}
        heatmapMode={heatmapMode}
        setHeatmapMode={setHeatmapMode}
        activeFilterCount={activeFilterCount}
        driveConfig={driveConfig}
        onOpenDriveSync={() => setIsDriveModalOpen(true)}
        onTriggerDriveSync={executeDriveSync}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        isDriveSyncing={isDriveSyncing}
        nextSyncCountdown={formattedCountdown}
      />

      {/* Main Tab Navigation Bar */}
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 pt-3">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-2 flex-wrap gap-2">
          <nav className="flex items-center gap-2 flex-wrap">
            {/* Tab 1: Carátula */}
            <button
              id="tab-caratula"
              onClick={() => setActiveTab('caratula')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[16px] transition-all cursor-pointer ${
                activeTab === 'caratula'
                  ? 'bg-[#8A185B] text-white shadow-md font-extrabold border-b-2 border-[#E86C1D]'
                  : 'bg-white text-slate-700 hover:bg-orange-50/60 hover:text-[#8A185B] border border-gray-200 shadow-2xs font-semibold'
              }`}
            >
              <FileText className={`w-4.5 h-4.5 ${activeTab === 'caratula' ? 'text-orange-300' : 'text-[#8A185B]'}`} />
              <span>Carátula Institucional</span>
            </button>

            {/* Tab 2: Resumen Ejecutivo */}
            <button
              id="tab-resumen-ejecutivo"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[16px] transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#8A185B] text-white shadow-md font-extrabold border-b-2 border-[#E86C1D]'
                  : 'bg-white text-slate-700 hover:bg-orange-50/60 hover:text-[#8A185B] border border-gray-200 shadow-2xs font-semibold'
              }`}
            >
              <LayoutDashboard className={`w-4.5 h-4.5 ${activeTab === 'dashboard' ? 'text-orange-300' : 'text-[#8A185B]'}`} />
              <span>Resumen Ejecutivo</span>
              {dashboardFilterCount > 0 && (
                <span className="ml-1 bg-[#E86C1D] text-white text-[12px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                  {dashboardFilterCount}
                </span>
              )}
            </button>

            {/* Tab 3: Tablero Consolidado de KPI's */}
            <button
              id="tab-consolidado-kpis"
              onClick={() => setActiveTab('consolidado')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[16px] transition-all cursor-pointer ${
                activeTab === 'consolidado'
                  ? 'bg-[#8A185B] text-white shadow-md font-extrabold border-b-2 border-[#E86C1D]'
                  : 'bg-white text-slate-700 hover:bg-orange-50/60 hover:text-[#8A185B] border border-gray-200 shadow-2xs font-semibold'
              }`}
            >
              <TableProperties className={`w-4.5 h-4.5 ${activeTab === 'consolidado' ? 'text-orange-300' : 'text-[#8A185B]'}`} />
              <span>Tablero Consolidado KPI's</span>
              {consolidadoFilterCount > 0 && (
                <span className="ml-1 bg-[#E86C1D] text-white text-[12px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                  {consolidadoFilterCount}
                </span>
              )}
            </button>

            {/* Tab 4: Segmento Comercial vs KPI */}
            <button
              id="tab-segmento-comercial"
              onClick={() => setActiveTab('segmento')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[16px] transition-all cursor-pointer ${
                activeTab === 'segmento'
                  ? 'bg-[#8A185B] text-white shadow-md font-extrabold border-b-2 border-[#E86C1D]'
                  : 'bg-white text-slate-700 hover:bg-orange-50/60 hover:text-[#8A185B] border border-gray-200 shadow-2xs font-semibold'
              }`}
            >
              <Building2 className={`w-4.5 h-4.5 ${activeTab === 'segmento' ? 'text-orange-300' : 'text-[#8A185B]'}`} />
              <span>Segmento Comercial vs KPI's</span>
            </button>

            {/* Tab 5: Criterios de Evaluación */}
            <button
              id="tab-criterios-evaluacion"
              onClick={() => setActiveTab('criterios')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[14px] sm:text-[16px] transition-all cursor-pointer ${
                activeTab === 'criterios'
                  ? 'bg-[#8A185B] text-white shadow-md font-extrabold border-b-2 border-[#E86C1D]'
                  : 'bg-white text-slate-700 hover:bg-orange-50/60 hover:text-[#8A185B] border border-gray-200 shadow-2xs font-semibold'
              }`}
            >
              <BookOpen className={`w-4.5 h-4.5 ${activeTab === 'criterios' ? 'text-orange-300' : 'text-[#8A185B]'}`} />
              <span>Criterios de Evaluación</span>
            </button>
          </nav>

          {/* Quick Drive Status Bar Action */}
          <div className="flex items-center gap-2">
            <button
              id="btn-quick-drive-bar"
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-[#8A185B]" />
              <span>
                {driveConfig.autoSyncEnabled ? `Auto-Sync: ${driveConfig.syncIntervalMinutes}m` : 'Google Drive'}
              </span>
              {driveConfig.lastSyncStatus === 'success' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View Switcher */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 py-4 space-y-4">
        {activeTab === 'caratula' && (
          /* TAB 1: CARÁTULA INSTITUCIONAL DE RESULTADOS */
          <CaratulaCover
            onGoToDashboard={() => setActiveTab('dashboard')}
            onSelectKpi={(kpiName) => {
              setDashboardFilters((prev) => ({ ...prev, selectedKpi: kpiName }));
              setActiveTab('dashboard');
            }}
            year={dashboardFilters.ano.length > 0 ? dashboardFilters.ano[0] : '2026'}
          />
        )}

        {activeTab === 'dashboard' && (
          /* TAB 2: RESUMEN EJECUTIVO (MATRIX + KPI BAR CHART) */
          <>
            {/* 1 - Filter Slicers Bar */}
            <FilterSlicers
              records={records}
              filters={dashboardFilters}
              onFilterChange={(newFilters) => setDashboardFilters(newFilters)}
            />

            {/* 2 - Executive KPI Matrix */}
            <KpiMatrix
              matrixData={dashboardMatrixData}
              useCommaDecimals={useCommaDecimals}
              heatmapMode={heatmapMode}
              selectedKpi={dashboardFilters.selectedKpi}
              selectedArea={dashboardFilters.selectedArea}
              onSelectKpi={(kpi) => setDashboardFilters((prev) => ({ ...prev, selectedKpi: kpi }))}
              onSelectArea={(area) => setDashboardFilters((prev) => ({ ...prev, selectedArea: area }))}
              onOpenDataViewer={() => setIsDataGridOpen(true)}
            />

            {/* 3 - KPI Final Average Bar Chart */}
            <KpiBarChart
              items={dashboardKpiAverages}
              selectedKpi={dashboardFilters.selectedKpi}
              onSelectKpi={(kpi) => setDashboardFilters((prev) => ({ ...prev, selectedKpi: kpi }))}
              useCommaDecimals={useCommaDecimals}
            />
          </>
        )}

        {activeTab === 'consolidado' && (
          /* TAB 3: TABLERO CONSOLIDADO DE KPI'S */
          <>
            {/* Slicers for Tablero Consolidado */}
            <FilterSlicers
              records={records}
              filters={consolidadoFilters}
              onFilterChange={(newFilters) => setConsolidadoFilters(newFilters)}
            />

            {/* Tablero Consolidado de KPI's (Vertical KPI list with Horizontal Q1-Q4 details and Total KPI) */}
            <KpiSummaryTable
              kpiAverages={consolidadoKpiAverages}
              matrixData={consolidadoMatrixData}
              selectedKpi={consolidadoFilters.selectedKpi}
              onSelectKpi={(kpi) => setConsolidadoFilters((prev) => ({ ...prev, selectedKpi: kpi }))}
              useCommaDecimals={useCommaDecimals}
            />
          </>
        )}

        {activeTab === 'segmento' && (
          /* TAB 4: TABLERO SEGMENTO COMERCIAL VS KPIS */
          <SegmentoKpiTab
            records={records}
            useCommaDecimals={useCommaDecimals}
            heatmapMode={heatmapMode}
            onOpenDataViewer={() => setIsDataGridOpen(true)}
          />
        )}

        {activeTab === 'criterios' && (
          /* TAB 5: CRITERIOS DE EVALUACIÓN OFICIALES */
          <CriteriosEvaluacionTab
            useCommaDecimals={useCommaDecimals}
          />
        )}
      </main>

      {/* Google Drive Sync Configuration Modal */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        config={driveConfig}
        onSaveConfig={(newConfig) => setDriveConfig(newConfig)}
        onDataLoaded={handleDataLoaded}
      />

      {/* Excel Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
      />

      {/* Raw Tabular Grid Modal */}
      <DataGridModal
        isOpen={isDataGridOpen}
        onClose={() => setIsDataGridOpen(false)}
        records={currentTabRecords}
        useCommaDecimals={useCommaDecimals}
      />
    </div>
  );
}
