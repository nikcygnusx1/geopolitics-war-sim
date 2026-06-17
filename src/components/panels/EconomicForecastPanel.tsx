import React, { useState, useMemo } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileText,
  Layers,
  MapPin,
  HelpCircle,
  Briefcase,
  Activity,
  Globe,
  Settings,
  ChevronRight,
  Database,
  ArrowRight,
  User,
  Zap,
  RotateCcw,
  PlusCircle,
  DollarSign
} from 'lucide-react';
import { useEconomicForecastStore } from '../../store/economicForecastStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useEnergyStore } from '../../store/energyStore';
import { useTradeStore } from '../../store/tradeStore';
import { useSanctionsStore } from '../../store/sanctionsStore';
import { useFinintStore } from '../../store/finintStore';
import { useArachneStore } from '../../store/arachneStore';
import { CommodityType } from '../../types';

export default function EconomicForecastPanel() {
  const {
    selection,
    customPreviews,
    focusedActionId,
    completionsHistory,
    viewMode,
    setUISelection,
    setFocusedActionId,
    setViewMode,
    commitActionPreview,
    generateDynamicForecast,
    calculateSectorDrilldowns,
    calculateCommodityStress,
    calculateWorldEconomicStress,
    calculateCountryMacroSummaries,
    calculateRiskFlags,
    calculateWatchlist
  } = useEconomicForecastStore();

  const countries = useWorldStore((state) => state.countries);
  const currentTick = useWorldStore((state) => state.currentTick);
  const playerCountryId = usePlayerStore((state) => state.countryId) || 'US';

  // Local state for inspecting elements
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; colId: string; value: number } | null>(null);
  const [sectorExpanded, setSectorExpanded] = useState<string>('manufacturing');

  // Dynamic calculations from our views-model layer
  const worldStress = useMemo(() => calculateWorldEconomicStress(), [countries, currentTick]);
  const countrySummaries = useMemo(() => calculateCountryMacroSummaries(), [countries, currentTick]);
  const sectorDrilldowns = useMemo(() => calculateSectorDrilldowns(selection.activeCountryId), [selection.activeCountryId, countries, currentTick]);
  const commodityStress = useMemo(() => calculateCommodityStress(), [countries, currentTick]);
  const riskFlags = useMemo(() => calculateRiskFlags(), [countries, currentTick]);
  const watchlist = useMemo(() => calculateWatchlist(), [countries, currentTick]);
  const activeForecast = useMemo(() => generateDynamicForecast(selection.activeCountryId), [selection.activeCountryId, countries, currentTick]);

  const activeCountryData = countries[selection.activeCountryId] || countries['US'];

  // Handler helpers
  const handleCountrySelect = (id: string) => {
    setUISelection((sel) => {
      sel.activeCountryId = id;
    });
    // Highlight target on global map context if possible
    usePlayerStore.setState({ selectedTargetCountryId: id });
  };

  const selectedActionPreview = useMemo(() => {
    return customPreviews.find(p => p.id === focusedActionId) || customPreviews[0];
  }, [customPreviews, focusedActionId]);

  // SVG Chart points calculation helper
  const renderProjectionPath = (path: number[], base: number, height: number, width: number, color: string, strokeDash?: string) => {
    if (path.length === 0) return null;
    const minVal = Math.min(...path) * 0.95;
    const maxVal = Math.max(...path) * 1.05;
    const padding = 10;
    
    const points = path.map((val, idx) => {
      const x = padding + (idx / (path.length - 1)) * (width - 2 * padding);
      const ratio = (val - minVal) / (maxVal - minVal || 1);
      const y = height - padding - ratio * (height - 2 * padding);
      return `${x},${y}`;
    });

    return (
      <path
        d={`M ${points.join(' L ')}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={strokeDash}
        className="transition-all duration-300"
      />
    );
  };

  return (
    <PanelFxShell panelId="economic_forecast" relevantFxTypes={['MARKET_CRASH','ECONOMIC_COLLAPSE','SANCTIONS_ESCALATION']}>
      <div className="w-full flex flex-col gap-3 py-1 text-[#e5e7eb] font-sans antialiased text-xs">
      
      {/* 1. TOP-LEVEL WORLD ECONOMIC STRESS RIBBON */}
      <div id="world-stress-ribbon-bar" className="w-full border border-[#1b5c1b] bg-[#020502] rounded-md p-3 shadow-inner">
        <div className="flex gap-4 items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00ff66] animate-pulse" />
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Global Economic Stability Monitor</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-mono text-[9px] text-[#00e5ff] px-1.5 py-0.5 bg-[#00e5ff]/10 rounded border border-[#00e5ff]/20">TICK {currentTick}</span>
            <span className="text-[10px] text-[#eab308] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#eab308] inline-block animate-ping"></span>
              {worldStress.synchronizedScale.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Global Stress Core Indicator strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-3 flex flex-col justify-center border-r border-[#1a3c1a] pr-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono text-[#00ff66] tracking-tighter">{worldStress.globalStressIndex}%</span>
              <div className="flex flex-col items-start">
                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${worldStress.directionVelocity >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {worldStress.directionVelocity >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {worldStress.directionVelocity >= 0 ? '+' : ''}{worldStress.directionVelocity}
                </span>
                <span className="text-[8px] text-gray-500 font-mono tracking-wide">STRESS VELOCITY</span>
              </div>
            </div>
            <div className="text-[11px] font-medium text-white tracking-tight mt-1">
              CLASSIFICATION: <span className="text-[#00ffff] font-mono">{worldStress.label.toUpperCase()}</span>
            </div>
          </div>

          <div className="md:col-span-9 flex gap-1.5 overflow-x-auto py-1.5 scrollbar-none">
            {worldStress.components.map((c) => {
              const isSelected = selection.heatmapGridMode === 'COMMODITY_X_DIMENSION' && selection.activeCountryId === c.dimension;
              return (
                <div
                  key={c.dimension}
                  onClick={() => {
                    setUISelection((sel) => {
                      sel.heatmapGridMode = 'COMMODITY_X_DIMENSION';
                    });
                  }}
                  className={`min-w-[100px] flex-1 border ${
                    c.stressScore > 75 
                      ? 'border-red-800 bg-red-950/25 hover:bg-red-950/40' 
                      : c.stressScore > 50 
                      ? 'border-amber-800 bg-amber-950/20 hover:bg-amber-950/30' 
                      : 'border-[#1b5c1b] bg-[#020502] hover:bg-[#060b06]'
                  } rounded p-1.5 cursor-pointer transition-all flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between text-[8.5px] font-mono text-gray-400 uppercase">
                    <span>{c.dimension}</span>
                    <span className={c.trend === 'UP' ? 'text-red-400' : 'text-emerald-400'}>
                      {c.trend === 'UP' ? '▲' : '■'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm font-semibold font-mono text-white">{c.stressScore}%</span>
                    <span className="text-[7.5px] text-[#00ff66] font-mono">wt:{c.weight}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1">
                    <div
                      className={`h-full ${c.stressScore > 75 ? 'bg-red-500' : c.stressScore > 50 ? 'bg-amber-500' : 'bg-[#00ff66]'}`}
                      style={{ width: `${c.stressScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-[10.5px] text-gray-400 leading-normal border-t border-[#113211] pt-1.5 flex justify-between items-center bg-[#040804] px-2 py-1 rounded">
          <span>
            <strong className="text-white">OPERATIONAL DIRECTIVE:</strong> {worldStress.narrativeOverview}
          </span>
          <span className="text-[9px] font-mono text-gray-500 hidden lg:inline select-none">DATA-LATENCY: NOMINAL STATE-SYNCED</span>
        </div>
      </div>

      {/* 2. SUB-CONSOLE NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-[#1b5c1b] pb-1.5">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('SUMMARY')}
            className={`px-3 py-1 font-mono transition-all border ${
              viewMode === 'SUMMARY'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/10 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            } rounded`}
          >
            NATION SUMMARY & HORIZON
          </button>
          <button
            onClick={() => setViewMode('PREVIEWS')}
            className={`px-3 py-1 font-mono transition-all border relative ${
              viewMode === 'PREVIEWS'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/10 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            } rounded`}
          >
            ACTION PREVIEW ENGINE
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
          <button
            onClick={() => setViewMode('HEATMAPS')}
            className={`px-3 py-1 font-mono transition-all border ${
              viewMode === 'HEATMAPS'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/10 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            } rounded`}
          >
            COMMODITY HEATMAPS
          </button>
          <button
            onClick={() => setViewMode('SECTORS')}
            className={`px-3 py-1 font-mono transition-all border ${
              viewMode === 'SECTORS'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/10 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            } rounded`}
          >
            12-SECTOR DRILLDOWNS
          </button>
          <button
            onClick={() => setViewMode('WORKSPACE')}
            className={`px-3 py-1 font-mono transition-all border ${
              viewMode === 'WORKSPACE'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/10 font-bold'
                : 'border-transparent text-gray-400 hover:text-white'
            } rounded`}
          >
            DECISION COMPARATOR WORKSPACE
          </button>
        </div>

        {/* Rapid Country selector context */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-mono">SOVEREIGN CASE FOCUS:</span>
          <select
            value={selection.activeCountryId}
            onChange={(e) => handleCountrySelect(e.target.value)}
            className="bg-[#020502] text-[#00ff66] border border-[#1b5c1b] rounded py-0.5 px-2 font-mono text-[11px] focus:outline-none focus:border-[#00ff66]"
          >
            {Object.keys(countries).map((id) => (
              <option key={id} value={id}>{countries[id].name} ({id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. PRIMARY BODY CHANNELS */}

      {/* ============================================================== */}
      {/* CHANNEL A: SUMMARY & HORIZON TRACKER */}
      {/* ============================================================== */}
      {viewMode === 'SUMMARY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          
          {/* Active sovereign dossier brief */}
          <div className="border border-[#113d11] bg-[#020402] rounded p-3 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white">{activeCountryData.name} ({activeCountryData.id})</h3>
                  <p className="text-[10px] text-[#00ffff] font-mono uppercase">{activeCountryData.continent}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                  activeForecast.latestNarrative.includes('baseline') 
                    ? 'border-emerald-600/30 text-emerald-400 bg-emerald-900/10' 
                    : 'border-amber-600/30 text-amber-400 bg-amber-900/10'
                }`}>
                  {activeCountryData.economic.businessCyclePhase || 'EXPANSION'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#050905] p-2 rounded border border-[#1a3c1a]">
                  <span className="text-[8.5px] font-mono text-gray-500 block uppercase">HEADLINE GDP</span>
                  <span className="text-sm font-mono text-white font-semibold">${activeCountryData.economic.gdpB.toFixed(1)}B</span>
                </div>
                <div className="bg-[#050905] p-2 rounded border border-[#1a3c1a]">
                  <span className="text-[8.5px] font-mono text-gray-500 block uppercase">GROWTH TIMESTEP</span>
                  <span className={`text-sm font-mono font-semibold ${activeCountryData.economic.gdpGrowthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {activeCountryData.economic.gdpGrowthRate >= 0 ? '+' : ''}{activeCountryData.economic.gdpGrowthRate.toFixed(2)}%
                  </span>
                </div>
                <div className="bg-[#050905] p-2 rounded border border-[#1a3c1a]">
                  <span className="text-[8.5px] font-mono text-gray-500 block uppercase">ANNUALIZED CPI BASKET</span>
                  <span className="text-sm font-mono text-[#eab308] font-semibold">{activeCountryData.economic.inflationRate.toFixed(1)}%</span>
                </div>
                <div className="bg-[#050905] p-2 rounded border border-[#1a3c1a]">
                  <span className="text-[8.5px] font-mono text-gray-500 block uppercase">DEBT TO GDP RATIO</span>
                  <span className="text-sm font-mono text-red-400 font-semibold">{activeCountryData.economic.debtToGdpRatio.toFixed(1)}%</span>
                </div>
              </div>

              <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">VULNERABILITY & TRANSMISSION FLUIDITY</span>
              <div className="space-y-1.5 mb-3 text-[10px]">
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-gray-400">Trade Contraction Vulnerability</span>
                    <span className="font-mono text-white">{((activeCountryData.economic as any).importDependency || 35)}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1 rounded overflow-hidden">
                    <div className="h-full bg-[#00ff66]" style={{ width: `${((activeCountryData.economic as any).importDependency || 35)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-gray-400">Energy Import Dependence</span>
                    <span className="font-mono text-white">{((activeCountryData.economic as any).energyProfile === 'DEFICIT' ? 82 : 18)}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1 rounded overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${((activeCountryData.economic as any).energyProfile === 'DEFICIT' ? 82 : 18)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-gray-400">Sanctions Blowback / Retaliatory Exposure</span>
                    <span className="font-mono text-white">{((activeCountryData.economic as any).sanctionsExposure || 15).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1 rounded overflow-hidden">
                    <div className="h-full bg-red-500" style={{ width: `${((activeCountryData.economic as any).sanctionsExposure || 15)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#113211] pt-2 mt-2">
              <div className="flex items-center gap-1 text-[9px] font-mono text-[#00e5ff] uppercase mb-1">
                <Database className="w-3 h-3" />
                <span>Upstream System Drivers</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[8px] font-mono bg-[#113111]/30 border border-[#1b5c1b]/40 text-gray-300 rounded px-1">Policy: {activeCountryData.economic.policyPosture || 'PRO_GROWTH'}</span>
                <span className="text-[8px] font-mono bg-[#113111]/30 border border-[#1b5c1b]/40 text-gray-300 rounded px-1">Resilience Score: {((activeCountryData.economic as any).resilienceScore || 70)}</span>
                <span className="text-[8px] font-mono bg-[#113111]/30 border border-[#1b5c1b]/40 text-gray-300 rounded px-1">Fiscal Space: {((activeCountryData.economic as any).fiscalSpace || 'HIGH')}</span>
              </div>
            </div>
          </div>

          {/* Forecast horizon and branch comparative */}
          <div className="md:col-span-2 border border-[#113d11] bg-[#020402] rounded p-3 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#00e5ff]" />
                  <span className="font-bold text-white text-xs">Prediction Horizon Matrix: GDP & Inflation Trajectory</span>
                </div>
                <div className="flex gap-1">
                  {(['BASELINE', 'PROPOSED', 'STRESS_ALT'] as const).map((bId) => (
                    <button
                      key={bId}
                      onClick={() => setUISelection((s) => { s.forecastBranchId = bId; })}
                      className={`text-[9px] px-2 py-0.5 border font-mono rounded ${
                        selection.forecastBranchId === bId
                          ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/5'
                          : 'border-[#1b5c1b] text-gray-400'
                      }`}
                    >
                      {bId}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic spline drawing area using inline SVG */}
              <div className="bg-[#030603] border border-[#112911] rounded p-3 h-44 mb-3 relative overflow-hidden">
                <div className="absolute top-2 left-2 flex gap-3 text-[9px] font-mono select-none">
                  <span className="text-[#00ff66] flex items-center gap-1">🟢 Baseline Forecast</span>
                  <span className="text-[#00e5ff] flex items-center gap-1">🔵 Proposed Alternative</span>
                  <span className="text-red-400 flex items-center gap-1">🔴 adverse Shock Corridor</span>
                </div>

                <div className="absolute right-2 top-2 flex items-center gap-1 text-[8px] font-mono text-gray-500">
                  <Info className="w-2.5 h-2.5 text-[#00e5ff]" />
                  <span>Uncertainty increases over horizons</span>
                </div>

                {/* SVG Visualizing branch outputs */}
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="10" y1="130" x2="390" y2="130" stroke="#113111" strokeWidth="1" />
                  <line x1="10" y1="75" x2="390" y2="75" stroke="#112111" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="10" y1="20" x2="390" y2="20" stroke="#112111" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="100" y1="10" x2="100" y2="140" stroke="#112111" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="200" y1="10" x2="200" y2="140" stroke="#112111" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="300" y1="10" x2="300" y2="140" stroke="#112111" strokeWidth="0.5" strokeDasharray="2" />

                  {/* Axis labels */}
                  <text x="10" y="145" fill="#558855" fontSize="7" fontFamily="monospace">NOW</text>
                  <text x="100" y="145" fill="#558855" fontSize="7" fontFamily="monospace">1 TICK</text>
                  <text x="200" y="145" fill="#558855" fontSize="7" fontFamily="monospace">3 TICKS</text>
                  <text x="300" y="145" fill="#558855" fontSize="7" fontFamily="monospace">6 TICKS</text>
                  <text x="375" y="145" fill="#558855" fontSize="7" fontFamily="monospace">12T</text>

                  {/* Draw Confidence band as shadow */}
                  <path
                    d="M 10,75 L 100,68 L 200,60 L 300,52 L 390,40 L 390,110 L 300,98 L 200,90 L 100,82 Z"
                    fill="#00e5ff"
                    fillOpacity="0.06"
                  />

                  {/* Draw Baseline Spline */}
                  {renderProjectionPath([100, 102, 105, 107, 109], 100, 150, 400, '#00ff66')}
                  {/* Draw Proposed Action Spline */}
                  {renderProjectionPath([100, 98, 96, 94, 91], 100, 150, 400, '#00e5ff', '2')}
                  {/* Draw Adverse Spline */}
                  {renderProjectionPath([100, 92, 85, 78, 69], 100, 150, 400, '#ef4444')}
                </svg>
              </div>

              {/* Narratives details */}
              <div className="flex gap-2.5 items-start bg-[#040904] p-2.5 rounded border border-[#1b3c1b]/50">
                <FileText className="w-5 h-5 text-[#00ff66] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-[10.5px] font-bold text-white uppercase tracking-tight">Intelligence Briefing Narrative // {activeForecast.countryId}</h4>
                  <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{activeForecast.latestNarrative}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#113211] text-[10px]">
              <div>
                <span className="text-gray-500 block">Forecast Revision:</span>
                <span className="font-mono text-white flex items-center gap-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Calibrated (Tick {currentTick})
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Confidence Rating:</span>
                <span className="font-mono text-[#00e5ff] font-bold">HIGH (88/100)</span>
              </div>
              <div>
                <span className="text-gray-500 block">Horizon Volatility:</span>
                <span className="font-mono text-[#eab308]">MODERATE DECAY</span>
              </div>
              <div>
                <span className="text-gray-500 block">Next Model Sync:</span>
                <span className="font-mono text-gray-400">Automatic on Tick Change</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CHANNEL B: WORKING ACTION PREVIEWS */}
      {/* ============================================================== */}
      {viewMode === 'PREVIEWS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Action List Selector */}
          <div className="lg:col-span-4 border border-[#113d11] bg-[#020402] rounded p-2.5 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white px-1 mb-1 border-b border-[#1b5c1b] pb-1 uppercase tracking-wider">Candidate Directives</h3>
            <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto scrollbar-thin">
              {customPreviews.map((p) => {
                const isActive = p.id === focusedActionId;
                const isCommitted = !!p.realizedImpact;
                return (
                  <div
                    key={p.id}
                    onClick={() => setFocusedActionId(p.id)}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-[#00ff66] bg-[#00ff66]/10' 
                        : 'border-[#1b5c1b]/50 bg-[#030603] hover:border-[#00e5ff]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-[#00e5ff] uppercase tracking-tighter">{p.actionKey}</span>
                      {isCommitted && (
                        <span className="text-[8px] bg-[#113111] text-[#00ff66] border border-[#00ff66]/30 px-1 rounded font-mono">
                          DIRECTIVE COMMIT
                        </span>
                      )}
                    </div>
                    <h4 className="text-[11px] font-semibold text-white tracking-tight mt-1 leading-normal">{p.title}</h4>
                    <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1.5 pt-1.5 border-t border-[#112311]">
                      <span>Source: <strong className="text-white font-mono">{p.initiatingActor}</strong></span>
                      <span>Target: <strong className="text-red-400 font-mono">{p.targetActor || 'SYSTEM'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#050c05] p-2.5 rounded border border-[#1b3d1b]/40 mt-auto text-[10px]">
              <div className="flex items-center gap-1 text-[#00ff66] uppercase font-mono text-[9px] mb-1">
                <HelpCircle className="w-3 h-3" />
                <span>Forecasting Ledger</span>
              </div>
              <p className="text-gray-400 leading-normal">
                Authorize any candidate directive overlay card. The system resolves general economic transmissions across downstream branches immediately upon action deployment.
              </p>
            </div>
          </div>

          {/* Action Detailed Preview panel */}
          <div className="lg:col-span-8 border border-[#113d11] bg-[#020402] rounded p-3 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-[#1b5c1b] pb-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedActionPreview.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 rounded font-mono text-[8.5px]">ACTION DIRECTIVE: {selectedActionPreview.actionKey}</span>
                    <span className="text-gray-500 font-mono text-[9px]">Sovereign Alignment: {selectedActionPreview.initiatingActor} → {selectedActionPreview.targetActor || 'GLOBAL'}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block">Confidence Probability</span>
                  <span className="text-sm font-mono text-[#00ff66] font-bold">{selectedActionPreview.confidenceScore}%</span>
                </div>
              </div>

              {/* Comparative Matrix table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                
                {/* Expected primary metrics */}
                <div className="bg-[#030603] border border-[#112a11] rounded p-2.5">
                  <div className="text-[10px] font-mono text-[#00ff66] border-b border-[#112a11] pb-1 uppercase mb-1.5 flex justify-between">
                    <span>Expected Primary Transmission</span>
                    <span>12-T horizon</span>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between items-center bg-[#050b05] p-1.5 rounded">
                      <span className="text-gray-400">Target GDP Correction</span>
                      <span className="font-mono font-semibold text-red-400">
                        {selectedActionPreview.gdpImpactPercentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#050b05] p-1.5 rounded">
                      <span className="text-gray-400">Target Secondary CPI Impulse</span>
                      <span className="font-mono font-semibold text-[#eab308]">
                        +{selectedActionPreview.inflationImpactPercentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-[#050b05] p-1.5 rounded">
                      <span className="text-gray-400">Coercive Blowback / Escalation Risk</span>
                      <span className={`font-mono font-semibold ${selectedActionPreview.blowbackEscalationRisk > 70 ? 'text-red-500' : 'text-amber-500'}`}>
                        {selectedActionPreview.blowbackEscalationRisk}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scope Winners and Losers */}
                <div className="bg-[#030603] border border-[#112a11] rounded p-2.5">
                  <div className="text-[10px] font-mono text-[#00e5ff] border-b border-[#112a11] pb-1 uppercase mb-1.5">
                    Sector & Spillover Vectors
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                    <div>
                      <span className="text-gray-500 uppercase block mb-1">Impact Winners</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedActionPreview.winners.map(w => (
                          <span key={w} className="bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 px-1 rounded font-mono">{w}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase block mb-1">Contraction Losers</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedActionPreview.losers.map(l => (
                          <span key={l} className="bg-red-950/30 text-red-500 border border-red-800/30 px-1 rounded font-mono">{l}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-[9px] text-gray-400 border-t border-[#112211] pt-1.5">
                    <span className="uppercase text-[8px] text-gray-500 block">Exposed Commodities: </span>
                    <strong className="text-white font-mono">{selectedActionPreview.mostAffectedCommodities.join(', ')}</strong>
                  </div>
                </div>
              </div>

              {/* Second order effects list */}
              <div className="mb-3">
                <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1.5">Expected Second-Order Transmission Feedback</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedActionPreview.secondOrderEffects.map((eff, i) => (
                    <div key={i} className="bg-[#040804] border border-[#143214] p-2 rounded">
                      <div className="flex justify-between items-start text-[9.5px] font-mono mb-1">
                        <span className="text-white font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#00ffff]" />
                          {eff.title}
                        </span>
                        <span className="text-[8.5px] text-gray-500 uppercase">{eff.sourceSystem}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-normal">{eff.description}</p>
                      <div className="flex justify-between mt-1.5 text-[8.5px] font-mono border-t border-[#112111] pt-1">
                        <span className="text-[#eab308]">Probability: {eff.probability}</span>
                        <span className="text-red-400">Escalation Score: {eff.escalationRiskScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assumptions and accuracy outputs */}
              <div className="bg-[#030603] p-2.5 rounded border border-[#1b5c1b]/30 text-[9.5px] text-gray-400">
                <span className="text-[9px] font-mono text-white block uppercase mb-1">Underlying Assumptions / Verification Safeguards:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {selectedActionPreview.underlyingAssumptions.map((asm, i) => (
                    <li key={i}>{asm}</li>
                  ))}
                </ul>
              </div>

              {selectedActionPreview.realizedImpact && (
                <div className="mt-3 p-2 bg-[#113111]/25 border border-[#1b5c1b]/60 rounded text-[10px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
                    <span>
                      <strong className="text-white">Realized Post-Action Impact Resolved:</strong> accuracy rating was <strong className="text-[#00ff66]">{selectedActionPreview.realizedImpact.accuracyScore}%</strong>. Trace resolved on tick {currentTick}.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#113211] pt-3 mt-3 flex justify-between items-center">
              <span className="text-[9.5px] text-gray-500 font-mono">WARNING: EXECUTING DIRECTIVES MODIFIES CANONICAL RESERVES</span>
              {!selectedActionPreview.realizedImpact ? (
                <button
                  onClick={() => {
                    commitActionPreview(selectedActionPreview.id);
                  }}
                  className="bg-red-950 border border-red-700 hover:bg-red-900 text-red-200 transition-all font-mono py-1.5 px-4 rounded text-xs select-none"
                >
                  DECREE POLICY INTERVENTION
                </button>
              ) : (
                <span className="text-[#00ff66] font-mono flex items-center gap-1 p-1 bg-[#113111]/20 border border-[#00ff66]/30 rounded">
                  ✓ DEPLOYED & LOGGED TO SYSTEMS
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CHANNEL C: COMMODITY HEATMAPS GIRD */}
      {/* ============================================================== */}
      {viewMode === 'HEATMAPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Heatmap settings controller and cells */}
          <div className="lg:col-span-8 border border-[#113d11] bg-[#020402] rounded p-3">
            <div className="flex justify-between items-center border-b border-[#1b5c1b] pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00ff66]" />
                <span className="font-bold text-white text-xs">Tactical Commodities Matrix</span>
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'COMMODITY_X_COUNTRY', label: 'By Country focus' },
                  { id: 'COMMODITY_X_DIMENSION', label: 'By Stress Dimension' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setUISelection((sel) => {
                        sel.heatmapGridMode = mode.id as any;
                      });
                      setSelectedCell(null);
                    }}
                    className={`text-[9px] px-2 py-0.5 border font-mono rounded ${
                      selection.heatmapGridMode === mode.id
                        ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/5 font-semibold'
                        : 'border-[#1b5c1b] text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix headers */}
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left font-mono text-[9.5px]">
                <thead>
                  <tr className="border-b border-[#112811]">
                    <th className="py-2 text-gray-400">COMMODITY BASELINE</th>
                    {selection.heatmapGridMode === 'COMMODITY_X_COUNTRY' ? (
                      ['US', 'CN', 'RU', 'IN', 'IL', 'IR', 'SA', 'EG'].map(id => (
                        <th key={id} className="py-2 text-center text-gray-300">{id}</th>
                      ))
                    ) : (
                      ['Price stress', 'Supply tightness', 'Demand surge', 'Route fragility', 'Sanctions exposure', 'Importer vulnerability', 'Volatility'].map(d => (
                        <th key={d} className="py-2 text-center text-gray-300 capitalize">{d.replace(' ', '\n')}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#112a11]">
                  {commodityStress.map((c) => (
                    <tr key={c.commodity} className="hover:bg-[#030703]/60 transition-all">
                      <td className="py-2.5 font-bold text-white">{c.commodity}</td>
                      {selection.heatmapGridMode === 'COMMODITY_X_COUNTRY' ? (
                        ['US', 'CN', 'RU', 'IN', 'IL', 'IR', 'SA', 'EG'].map((id) => {
                          const baseCValue = id === 'RU' || id === 'IL' || id === 'IR' ? c.priceStress * 1.25 : c.priceStress * 0.85;
                          const normVal = Math.min(100, Math.round(baseCValue));
                          const colorClass = normVal > 80 ? 'bg-red-800/80 hover:bg-red-700' : normVal > 55 ? 'bg-amber-800/70 hover:bg-amber-700' : 'bg-emerald-950/40 hover:bg-emerald-900';
                          const isInspected = selectedCell?.rowId === c.commodity && selectedCell?.colId === id;
                          return (
                            <td
                              key={id}
                              onClick={() => {
                                setSelectedCell({ rowId: c.commodity, colId: id, value: normVal });
                                setUISelection((s) => { s.activeCommodityKey = c.commodity; });
                              }}
                              className={`py-2.5 text-center cursor-pointer transition-all ${colorClass} text-white font-bold p-1 ${isInspected ? 'ring-2 ring-white scale-105' : ''}`}
                            >
                              {normVal}%
                            </td>
                          );
                        })
                      ) : (
                        [
                          c.priceStress,
                          c.supplyTightness,
                          c.demandSurge,
                          c.routeFragility,
                          c.sanctionsExposure,
                          c.importerVulnerability,
                          c.volatilityIndex
                        ].map((v, idx) => {
                          const dims = ['Price stress', 'Supply tightness', 'Demand surge', 'Route fragility', 'Sanctions exposure', 'Importer vulnerability', 'Volatility'];
                          const normVal = Math.min(100, Math.round(v));
                          const colorClass = normVal > 80 ? 'bg-red-800/80 hover:bg-red-700' : normVal > 55 ? 'bg-amber-800/70 hover:bg-amber-700' : 'bg-emerald-950/40 hover:bg-emerald-900';
                          const isInspected = selectedCell?.rowId === c.commodity && selectedCell?.colId === dims[idx];
                          return (
                            <td
                              key={idx}
                              onClick={() => {
                                setSelectedCell({ rowId: c.commodity, colId: dims[idx], value: normVal });
                                setUISelection((s) => { s.activeCommodityKey = c.commodity; });
                              }}
                              className={`py-2.5 text-center cursor-pointer transition-all ${colorClass} text-white font-bold p-1 ${isInspected ? 'ring-2 ring-white scale-105' : ''}`}
                            >
                              {normVal}%
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 items-center justify-start mt-3 pt-3 border-t border-[#112311] text-[9.5px] select-none text-gray-500 font-mono">
              <span className="flex items-center gap-1">🟢 &lt;45% NOMINAL</span>
              <span className="flex items-center gap-1">🟡 45-70% TIGHTENING CRISIS</span>
              <span className="flex items-center gap-1">🔴 &gt;70% SUPPLY INTERDICTION BLOCK</span>
            </div>
          </div>

          {/* Heatmap Drilldown Slider panel */}
          <div className="lg:col-span-4 border border-[#113d11] bg-[#020402] rounded p-3 flex flex-col justify-between shadow-lg">
            {selectedCell ? (
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 pb-1.5 border-b border-[#1b5c1b] flex items-center justify-between">
                  <span>Drill-Through inspector</span>
                  <button onClick={() => setSelectedCell(null)} className="text-gray-500 hover:text-white">&times;</button>
                </h3>

                <div className="bg-[#040804] p-2.5 rounded border border-[#1a3c1a] mb-3">
                  <span className="text-[8px] font-mono text-gray-400 block uppercase">Inspected cell point</span>
                  <span className="text-sm font-semibold text-white mt-1 block">
                    {selectedCell.rowId} x {selectedCell.colId}
                  </span>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <span className="text-gray-400">Normalized Index Load:</span>
                    <strong className="text-red-400 font-mono text-md">{selectedCell.value}%</strong>
                  </div>
                </div>

                <div className="space-y-3 text-[10.5px]">
                  <div>
                    <h4 className="font-bold text-gray-300 uppercase text-[9px] mb-1">Key Producer Cartels</h4>
                    <div className="space-y-1">
                      {selectedCell.rowId === 'OIL' ? (
                        <>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>Saudi Arabia (OPEC)</span><span>38% export</span></div>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>Russia (OPEC+)</span><span>22% export</span></div>
                        </>
                      ) : selectedCell.rowId === 'SILICON' ? (
                        <>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>Taiwan (TSMC)</span><span>65% export</span></div>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>South Korea</span><span>20% export</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>China (BRICS)</span><span>45% output</span></div>
                          <div className="flex justify-between text-gray-400 font-mono text-[9.5px]"><span>United States</span><span>15% output</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-300 uppercase text-[9px] mb-1">Route & Carrier Vulnerability</h4>
                    <p className="text-gray-400 leading-normal text-[10px]">
                      {selectedCell.rowId === 'OIL' || selectedCell.rowId === 'NATURAL_GAS'
                        ? 'Chokepoint transit at Bab el-Mandeb carries an insurance markup coefficient of 1.45 due to asymmetrical drone strikes.'
                        : 'Tech components transshipment pathways are vulnerable to regional air defense deployments in South China corridors.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-300 uppercase text-[9px] mb-1">Arachne Briefing Reference</h4>
                    <div className="bg-[#051105]/40 border border-[#113211] p-2 rounded text-[9.5px] font-mono leading-tight">
                      <span>ALERT CODE 429: Trans-Pacific luxury cargo vessels report transit re-routings away from active naval strike coordinates. Spot prices affected.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-52 text-center text-gray-500 p-4 shrink-0">
                <Layers className="w-10 h-10 text-gray-600 mb-2" />
                <p>Click any cell in the commodity heatmap to launch the tactical drill-through inspector board details.</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#112311] text-[9.5px] text-gray-400 flex flex-col gap-1 bg-[#040804] p-2 rounded">
              <span className="font-mono text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                FOUNDRY CORE SYSTEM ATTACHMENT
              </span>
              <span>All commodity vectors and spot rates reflect bilateral logistics channels tracked in Foundry.</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CHANNEL D: 12-SECTOR DRILLDOWNS PANEL */}
      {/* ============================================================== */}
      {viewMode === 'SECTORS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Sector matrix selectors */}
          <div className="lg:col-span-5 border border-[#113d11] bg-[#020402] rounded p-2.5 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white border-b border-[#1b5c1b] pb-1.5 uppercase tracking-wider mb-2">
              National Sector Allocation Matrix
            </h3>

            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[385px] scrollbar-thin">
              {sectorDrilldowns.map((sec) => {
                const isExpanded = sectorExpanded === sec.sectorKey;
                return (
                  <div
                    key={sec.sectorKey}
                    onClick={() => setSectorExpanded(sec.sectorKey)}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      isExpanded 
                        ? 'border-[#00ff66] bg-[#00ff66]/10' 
                        : 'border-[#1b5c1b]/30 bg-[#030603] hover:border-[#00e5ff]/50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold text-white">{sec.displayName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        sec.status === 'RESILIENT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/30' :
                        sec.status === 'CRITICAL' ? 'bg-red-950 text-red-500 border border-red-800/30' : 'bg-amber-950 text-amber-500 border border-amber-800/30'
                      }`}>
                        {sec.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-gray-400 mt-2">
                      <span>Valuation: <strong className="text-white">${sec.currentValueUSD.toFixed(1)}B</strong></span>
                      <span>GDP Share: <strong className="text-white">{sec.shareOfGDP.toFixed(1)}%</strong></span>
                      <span className="text-[#00e5ff] font-mono select-none">Trend: {sec.trend}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sector Explanatory drilldown card */}
          <div className="lg:col-span-7 border border-[#113d11] bg-[#020402] rounded p-3 flex flex-col justify-between">
            {sectorExpanded ? (
              <div>
                {(() => {
                  const s = sectorDrilldowns.find(sec => sec.sectorKey === sectorExpanded);
                  if (!s) return null;
                  return (
                    <>
                      <div className="flex justify-between items-start border-b border-[#1b5c1b] pb-2 mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{s.displayName}</h3>
                          <span className="text-[9.5px] font-mono text-gray-500 uppercase">Upstream Decomposition & Exposure metrics</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-500 font-mono block">Resilience Capacity</span>
                          <span className="text-sm font-bold text-[#00ff66] font-mono">{s.substitutionCapacityScore}/100</span>
                        </div>
                      </div>

                      {/* Structural causal attribution list */}
                      <span className="text-[9.5px] font-mono text-[#00ff66] uppercase block mb-1.5">Upstream Bottlenecks & Friction Load (0-10 index)</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        
                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Import Cutoff Shortage</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.importShortageImpact}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-red-400" style={{ width: `${s.decomposition.importShortageImpact * 10}%` }} />
                          </div>
                        </div>

                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Export Restrictions Tariff</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.exportConstraintImpact}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-amber-400" style={{ width: `${s.decomposition.exportConstraintImpact * 10}%` }} />
                          </div>
                        </div>

                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Energy Price Surcharge</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.energyShockVulnerability}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-[#00ff66]" style={{ width: `${s.decomposition.energyShockVulnerability * 10}%` }} />
                          </div>
                        </div>

                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Rival Blockade Sanctions</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.sanctionsExposureScore}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-red-500" style={{ width: `${s.decomposition.sanctionsExposureScore * 10}%` }} />
                          </div>
                        </div>

                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Marine Route Friction</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.routeFrictionImpact}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-[#00e5ff]" style={{ width: `${s.decomposition.routeFrictionImpact * 10}%` }} />
                          </div>
                        </div>

                        <div className="bg-[#030603] p-2 rounded border border-[#112a11] text-center">
                          <span className="text-[8.5px] font-mono text-gray-500 block">Labor & Unrest Contraction</span>
                          <span className="text-lg font-bold font-mono text-white mt-1 block">{s.decomposition.laborStressScore}</span>
                          <div className="w-full bg-gray-900 h-1 rounded overflow-hidden mt-1.5">
                            <div className="h-full bg-amber-500" style={{ width: `${s.decomposition.laborStressScore * 10}%` }} />
                          </div>
                        </div>

                      </div>

                      <div className="bg-[#040804] p-3 rounded border border-[#1b5c1b]/40">
                        <span className="text-[9.5px] font-mono text-[#00e5ff] uppercase block mb-1">Causal Resolution summary:</span>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          The {s.displayName} sector shows a status of <strong className="text-white">{s.status}</strong>. Upstream decomposition indicates that {
                            s.decomposition.importShortageImpact > 6 ? 'vulnerability in semiconductor/rare-earth imports is bottlenecking production' : 'domestic supply corridors are stabilizing against external shocks.'
                          } Future horizon outlook predicted for immediate timestep remains <strong className="text-white">{s.forecastHorizonOutlook['1T']}</strong> under active sovereign alignment constraints.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-[#558855]">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                <span>Select a sector from the left list matrix to unpack its causal upstream attribution parameters.</span>
              </div>
            )}

            <div className="border-t border-[#113211] pt-3 mt-3 flex justify-between items-center text-[9.5px] text-gray-500">
              <span>SECTOR SIM CORE VERIFIED</span>
              <span>CALIBRATED WITH NATIONAL MACRO INDICATORS</span>
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* CHANNEL E: WORKSPACE COMPARATOR */}
      {/* ============================================================== */}
      {viewMode === 'WORKSPACE' && (
        <div className="border border-[#113d11] bg-[#020402] rounded p-3">
          <div className="border-b border-[#1b5c1b] pb-2 mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Geopolitical Economic Comparator Board</h3>
            <p className="text-[9.5px] text-gray-400 capitalize">Compare primary macro buffers across major active global trade players side-by-side.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {countrySummaries.filter(c => selection.workspaceComparableCountries.includes(c.countryId)).map((s) => (
              <div key={s.countryId} className="bg-[#030603] border border-[#1b5c1b]/55 rounded p-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-[#113211] pb-1.5 mb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">{s.name} ({s.countryId})</h4>
                      <span className="text-[8.5px] font-mono text-[#00ffff] uppercase tracking-tighter">Iso Reference: {s.isoCode}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-950/40 text-emerald-400 px-1 rounded uppercase">
                      {s.macroTrend}
                    </span>
                  </div>

                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">CANONICAL GDP:</span>
                      <span className="text-white font-bold">${s.currentGdpB.toFixed(1)}B</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">GROWTH INTERVAL:</span>
                      <span className={s.headlineGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {s.headlineGrowth >= 0 ? '+' : ''}{s.headlineGrowth.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">INFLATION RATE:</span>
                      <span className="text-[#eab308] font-bold">{s.headlineInflation.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">DEBT LOAD TO GDP:</span>
                      <span className="text-red-400">{s.debtToGdpRatio.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Top stressed indicators */}
                  <div className="mt-3.5 pt-2 border-t border-[#112111]">
                    <span className="text-[8.5px] font-mono text-gray-500 uppercase block mb-1">Top Stressed Sectors:</span>
                    <div className="space-y-1 text-[9.5px]">
                      {s.topStressedSectors.map((sec, i) => (
                        <div key={i} className="flex justify-between font-mono text-gray-400">
                          <span>{sec.sector}</span>
                          <strong className="text-amber-400">{sec.score}% Stress</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#112111] text-[9.5px]">
                  <div className="flex justify-between text-gray-500">
                    <span>Global Stress Contrib:</span>
                    <strong className="text-[#00ff66] font-mono">{s.worldStressContributionPct}%</strong>
                  </div>
                  <div className="flex justify-between text-gray-500 mt-1">
                    <span>Campaign Blowback Risk:</span>
                    <strong className="text-red-400 font-mono">{s.sanctionsBlowbackExposure}/100</strong>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DOWN-PANEL ALERTS & RISK MATRIX (COLLAPSED FEED LOGS) */}
      <div id="economy-risk-logs" className="border border-[#113d11] bg-[#020502]/95 rounded p-2.5">
        <div className="flex gap-2 items-center text-[10px] font-mono text-red-400 border-b border-[#113d11] pb-1.5 mb-2 uppercase select-none">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Active Operations Alerts & Warnings ({riskFlags.length})</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto scrollbar-thin">
          {riskFlags.map((flag) => (
            <div key={flag.id} className="flex items-start gap-2.5 text-[9.5px] bg-[#050905]/70 p-2 rounded border border-[#1b311b]/35">
              <span className="px-1 bg-red-950/50 text-red-400 border border-red-800/40 rounded font-mono text-[8px] tracking-tight shrink-0 mt-0.5">
                {flag.severity}
              </span>
              <div className="flex-1">
                <span className="font-bold text-white block uppercase">{flag.title} // Country: {flag.countryId}</span>
                <span className="text-gray-400 leading-normal block mt-0.5">{flag.description}</span>
                <span className="text-[8px] font-mono text-gray-500 block mt-1">MODULE TRACE: {flag.systemSource} // BOUNDS: {flag.triggerCondition}</span>
              </div>
            </div>
          ))}
          {riskFlags.length === 0 && (
            <div className="text-center text-gray-500 font-mono text-[9px] py-1 select-none">
              ✓ Operational thresholds nominal. No critical micro-shocks propagating.
            </div>
          )}
        </div>
      </div>

    </div>
    </PanelFxShell>
  );
}
