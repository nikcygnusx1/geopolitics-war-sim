import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ship, 
  TrendingUp, 
  AlertTriangle, 
  Anchor, 
  Activity, 
  FileText, 
  ShieldAlert, 
  ArrowRightLeft, 
  ArrowUpRight, 
  Percent, 
  Settings, 
  Globe, 
  Sliders, 
  X, 
  Zap, 
  CheckCircle2, 
  Lock,
  Compass,
  DollarSign
} from 'lucide-react';
import { useTradeStore, EscalationPreview } from '../../store/tradeStore';
import { useWorldStore } from '../../store/worldStore';
import { StrategicTradeCategory, BilateralTradeProfile, RouteNode, RouteSegment } from '../../types/trade';

// Category color mappings for UI badges and charts
const CATEGORY_METADATA: Record<StrategicTradeCategory, { label: string; icon: string; color: string; bg: string; border: string }> = {
  energy: { label: 'Energy / Fuels', icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-800/60' },
  food: { label: 'Agri-Nutrition', icon: '🌾', color: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/60' },
  minerals: { label: 'Critical Minerals', icon: '💎', color: 'text-cyan-400', bg: 'bg-cyan-950/40', border: 'border-cyan-800/60' },
  inputs: { label: 'Industrial Inputs', icon: '⚙️', color: 'text-sky-400', bg: 'bg-sky-950/40', border: 'border-sky-850/60' },
  consumer: { label: 'Consumer Goods', icon: '📦', color: 'text-purple-400', bg: 'bg-purple-950/40', border: 'border-purple-800/60' },
  tech: { label: 'Advanced Semiconductors', icon: '💾', color: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-800/60' },
  defense: { label: 'Tactical Dual-Use', icon: '🛡️', color: 'text-red-400', bg: 'bg-red-950/40', border: 'border-red-800/60' },
  pharma: { label: 'Biotechs & Pharma', icon: '🧬', color: 'text-pink-400', bg: 'bg-pink-950/40', border: 'border-pink-800/60' },
  services: { label: 'Digital Finance', icon: '🏦', color: 'text-teal-400', bg: 'bg-teal-950/40', border: 'border-teal-800/60' }
};

export default function TradeMatrixPanel() {
  const { 
    nodes, 
    segments, 
    profiles, 
    campaigns, 
    incidents, 
    selectedCountryId, 
    selectedRouteId, 
    selectedCategory, 
    compareBilateralPair,
    dependencySummaries,
    exposureScores,
    setSelectedCountryId,
    setSelectedRouteId,
    setSelectedCategory,
    setCompareBilateralPair,
    calculateEscalationPreview,
    executeEscalationAction,
    toggleRouteStatus,
    resolveRerouting
  } = useTradeStore();

  const countries = useWorldStore((s) => s.countries);
  
  // Tab panels: 'WATCHLIST' | 'MATRIX' | 'MAP' | 'SANDBOX'
  const [activeSubTab, setActiveSubTab] = useState<'WATCHLIST' | 'MATRIX' | 'MAP' | 'SANDBOX'>('WATCHLIST');

  // Escalation Sandbox form state
  const [builderActor, setBuilderActor] = useState<string>('US');
  const [builderTarget, setBuilderTarget] = useState<string>('CN');
  const [builderAction, setBuilderAction] = useState<'TARIFF' | 'SECTORAL' | 'TOTAL_RUPTURE'>('TARIFF');
  const [builderTariff, setBuilderTariff] = useState<number>(25);
  const [builderCats, setBuilderCats] = useState<StrategicTradeCategory[]>(['tech']);

  const getCountryFlagAndName = (id: string) => {
    const c = countries[id];
    if (!c) return { label: id, flag: '🌐' };
    return { label: c.name, flag: c.flagEmoji || '🌐' };
  };

  const activeProfile = compareBilateralPair ? profiles.find(
    p => (p.exporterCountryId === compareBilateralPair.countryA && p.importerCountryId === compareBilateralPair.countryB) ||
         (p.exporterCountryId === compareBilateralPair.countryB && p.importerCountryId === compareBilateralPair.countryA)
  ) : null;

  // Selected route detail
  const routeNode = nodes.find(n => n.id === selectedRouteId);
  const routeSegment = segments.find(s => s.id === selectedRouteId);

  // Auto calculate escalation Preview
  const previewData: EscalationPreview = calculateEscalationPreview(builderActor, builderTarget, builderAction, builderTariff, builderCats);

  const triggerCoercion = () => {
    executeEscalationAction(builderActor, builderTarget, builderAction, builderTariff, builderCats);
  };

  const handleToggleCat = (cat: StrategicTradeCategory) => {
    if (builderCats.includes(cat)) {
      setBuilderCats(builderCats.filter(c => c !== cat));
    } else {
      setBuilderCats([...builderCats, cat]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030703]/90 text-gray-300 font-sans border border-emerald-950/60 rounded p-4 text-[11px] overflow-hidden">
      
      {/* 2.2 Title & Sub-tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-emerald-950/60 pb-3 mb-3 gap-2 shrink-0">
        <div>
          <h2 className="text-sm font-black tracking-widest text-[#00ff44] uppercase flex items-center gap-2">
            <span className="animate-pulse">🌐</span> SOVEREIGN TRADE INTERDEPENDENCE TERMINAL
          </h2>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
            Bilateral dependencies, shipping lanes, pipelines, sea chokepoints & escalation controls
          </p>
        </div>
        <div className="flex bg-[#001004] p-1 border border-emerald-900/30 rounded gap-1 flex-wrap">
          {(['WATCHLIST', 'MATRIX', 'MAP', 'SANDBOX'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1 text-[9px] font-bold tracking-widest uppercase transition-all rounded ${
                activeSubTab === tab 
                  ? 'bg-emerald-900 border border-emerald-500 text-white' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-emerald-950/20'
              }`}
            >
              {tab === 'WATCHLIST' && '📋 Strategic Exposure'}
              {tab === 'MATRIX' && '📊 Dependence Matrix'}
              {tab === 'MAP' && '⚓ Shipping & Pipeline Network'}
              {tab === 'SANDBOX' && '⚡ Escalation Ladder'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-hidden">
        
        {/* Left Side: Vulnerability Watch list or Live Incident History ticker */}
        <div className="xl:col-span-1 bg-[#020502] border border-emerald-950/30 rounded p-3 flex flex-col h-full overflow-hidden">
          <div className="border-b border-emerald-950/40 pb-2 mb-2">
            <h3 className="font-bold text-gray-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5 font-mono">
              <ShieldAlert className="w-3 height-3 text-red-500" /> SYSTEM ARCHITECTURE SENSITIVITY
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {/* Seeded watch list showing country exposure totals */}
            <div>
              <span className="text-[9px] font-bold text-gray-500 block mb-1.5 uppercase font-mono tracking-wider">
                Sovereign Threat Profiles
              </span>
              <div className="space-y-1.5 font-mono">
                {Object.keys(exposureScores).length === 0 ? (
                  <div className="text-[10px] text-gray-500 py-1.5 italic">Awaiting calculation cycle...</div>
                ) : (
                  Object.entries(exposureScores).map(([countryId, score]) => {
                    const info = getCountryFlagAndName(countryId);
                    const summary = dependencySummaries[countryId];
                    return (
                      <div 
                        key={countryId} 
                        onClick={() => setSelectedCountryId(countryId)}
                        className={`p-2 border rounded cursor-pointer transition-all ${
                          selectedCountryId === countryId 
                            ? 'bg-emerald-950/30 border-emerald-500' 
                            : 'bg-[#040804] border-emerald-950/50 hover:border-emerald-900'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-200 text-[10px]">
                            {info.flag} {countryId}
                          </span>
                          <span className="text-[8px] px-1 py-0.5 rounded bg-[#100303] text-red-400 border border-red-950">
                            Shortage Risk: {score.criticalShortageRiskScore}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[8px] text-gray-400">
                          <div>GDP at Risk: <b className="text-[#00ccff]">${score.gdpImpactAtRiskB}B</b></div>
                          <div>CPI Exposure: <b className="text-amber-500">{score.inflationExposureScore}%</b></div>
                          <div>Leverage: <b className="text-emerald-400">{summary?.coerciveLeverageScore ?? 50}/100</b></div>
                          <div className="truncate">Vulnerable: <b className="text-purple-400">{score.primaryVulnerabilityCategory}</b></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Trade War Escalations List */}
            <div>
              <span className="text-[9px] font-bold text-gray-500 block mb-1.5 uppercase font-mono tracking-wider">
                Escalated Trade Campaigns
              </span>
              <div className="space-y-1 font-mono">
                {campaigns.length === 0 ? (
                  <div className="text-[9px] text-gray-600 p-2 italic bg-[#040704] border border-emerald-950/35 rounded">
                    No active sanctions escalation chains registered.
                  </div>
                ) : (
                  campaigns.map((c) => {
                    const act = getCountryFlagAndName(c.actorCountryId);
                    const targ = getCountryFlagAndName(c.targetCountryId);
                    return (
                      <div key={c.id} className="p-2 bg-[#0c0505] border border-red-950/50 rounded">
                        <div className="flex justify-between items-center text-[10px] font-bold text-red-400">
                          <span>{act.flag} ⚔️ {targ.flag}</span>
                          <span>STG {c.escalationStage}</span>
                        </div>
                        <p className="text-[8px] text-gray-400 mt-1 line-clamp-2">{c.intelligenceSummary}</p>
                        <div className="flex justify-between items-center text-[8px] font-bold text-gray-500 mt-1">
                          <span>Tariff: {c.activeTariffRate}%</span>
                          <span>Provocation: {c.provocationScore}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live shipping incident logs */}
            <div>
              <span className="text-[9px] font-bold text-gray-500 block mb-1.5 uppercase font-mono tracking-wider">
                Trade Logistics Incident Ledger
              </span>
              <div className="space-y-1 font-mono text-[9px]">
                {incidents.slice(-5).reverse().map((inc) => (
                  <div key={inc.id} className="p-1.5 border border-emerald-950/40 bg-[#001004]/20 rounded mb-1">
                    <div className="flex justify-between text-[8px] font-semibold text-[#00ff44]">
                      <span>[TICK {inc.tick}] {inc.type}</span>
                      <span className={inc.economicImpactRating === 'SEVERE' ? 'text-red-400' : 'text-amber-500'}>
                        {inc.economicImpactRating}
                      </span>
                    </div>
                    <p className="text-gray-400 mt-0.5 line-clamp-2">{inc.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Workspace Panel */}
        <div className="xl:col-span-3 bg-[#020502]/60 border border-emerald-950/30 rounded p-4 flex flex-col h-full overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* PANEL 1: WATCHLIST OVERVIEW */}
            {activeSubTab === 'WATCHLIST' && (
              <motion.div 
                key="watchlist" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden space-y-4"
              >
                
                {/* Visual Interdependence Graph Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Selected Country Details Card */}
                  <div className="p-3 bg-[#030b04] border border-emerald-950 rounded flex flex-col space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-950 pb-1.5">
                      <h4 className="font-bold text-[#00ff44] text-[10px] tracking-wide uppercase font-mono">
                        👤 Dossier Spotlight: {selectedCountryId ? getCountryFlagAndName(selectedCountryId).label : 'Select Active Country'}
                      </h4>
                      {selectedCountryId && (
                        <span className="text-[9px] text-[#00ccff] font-mono">{selectedCountryId} PROFILE</span>
                      )}
                    </div>

                    {selectedCountryId ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                          <div className="p-1.5 bg-[#010501] border border-emerald-950/60 rounded">
                            <span className="text-[8px] text-gray-500 block">GDP EXPOSURE</span>
                            <span className="text-[#00ccff] font-black">${exposureScores[selectedCountryId]?.gdpImpactAtRiskB ?? '0.0'}B</span>
                          </div>
                          <div className="p-1.5 bg-[#010501] border border-emerald-950/60 rounded">
                            <span className="text-[8px] text-gray-500 block">VULNERABILITY INDEX</span>
                            <span className="text-red-400 font-bold">{exposureScores[selectedCountryId]?.criticalShortageRiskScore ?? '0'}%</span>
                          </div>
                          <div className="p-1.5 bg-[#010501] border border-emerald-950/60 rounded">
                            <span className="text-[8px] text-gray-500 block">CONCENTRATION COEF</span>
                            <span className="text-purple-400 font-bold">{dependencySummaries[selectedCountryId]?.tradeConcentrationRatio ?? '25'}%</span>
                          </div>
                        </div>

                        {/* Top trade partners list */}
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div>
                            <span className="font-bold text-gray-400 block border-b border-emerald-950/40 pb-1 mb-1 font-mono text-[9px] uppercase">
                              ⬇️ Top Inbound Dependencies (Imports)
                            </span>
                            <div className="space-y-1 font-mono">
                              {dependencySummaries[selectedCountryId]?.topImportPartners.map((item) => (
                                <div 
                                  key={item.partnerCountryId} 
                                  onClick={() => setCompareBilateralPair({ countryA: selectedCountryId, countryB: item.partnerCountryId })}
                                  className="flex justify-between items-center p-1 hover:bg-emerald-950/30 rounded cursor-pointer"
                                >
                                  <span>{getCountryFlagAndName(item.partnerCountryId).flag} {item.partnerCountryId}</span>
                                  <span className="text-red-400">${item.valueB.toFixed(1)}B ({item.dependenceScore}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-bold text-gray-400 block border-b border-emerald-950/40 pb-1 mb-1 font-mono text-[9px] uppercase">
                              ⬆️ Primary Sovereign Outbound Buyers (Exports)
                            </span>
                            <div className="space-y-1 font-mono">
                              {dependencySummaries[selectedCountryId]?.topExportPartners.map((item) => (
                                <div 
                                  key={item.partnerCountryId} 
                                  onClick={() => setCompareBilateralPair({ countryA: selectedCountryId, countryB: item.partnerCountryId })}
                                  className="flex justify-between items-center p-1 hover:bg-emerald-950/30 rounded cursor-pointer"
                                >
                                  <span>{getCountryFlagAndName(item.partnerCountryId).flag} {item.partnerCountryId}</span>
                                  <span className="text-emerald-400">${item.valueB.toFixed(1)}B ({item.dependenceScore}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 p-8 italic">
                        Select a country from the Left Sensitivity List to drill down into active bilateral flows, concentration margins, and route chokepoint risks.
                      </div>
                    )}
                  </div>

                  {/* Interdependence Insights and summaries */}
                  <div className="p-3 bg-[#03090b] border border-[#0d222b] rounded flex flex-col space-y-2">
                    <h4 className="font-bold text-[#00ccff] text-[10px] uppercase font-mono border-b border-[#0f3442] pb-1.5 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#00ccff]" /> Strategic Coercion Matrix Insights
                    </h4>
                    
                    <div className="flex-1 space-y-2 text-[10px] text-gray-300 font-mono">
                      <div className="p-2 bg-[#020506]/80 border border-[#0f3442]/50 rounded">
                        <span className="text-[10px] font-bold text-red-400 block mb-1">⚠️ High Pipeline Asymmetry</span>
                        <p className="text-[9px] text-gray-400 leading-normal">
                          Russia (RU) holds a high-coercion energy corridor position over Germany (DE) conveying siberian natural gas. This physical link has extreme substitutability scores due to the landlocked static routing.
                        </p>
                      </div>

                      <div className="p-2 bg-[#020506]/80 border border-[#0f3442]/50 rounded">
                        <span className="text-[10px] font-bold text-indigo-400 block mb-1">💾 Semiconductor Security Chokepoint</span>
                        <p className="text-[9px] text-gray-400 leading-normal">
                          United States (US) depends heavily on Taiwan (TW) microchip foundries. A maritime blockade around Taiwan Strait instantly spikes US inflation indicators and locks tech sectors worldwide.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Primary exposer list cards */}
                <div className="flex-1 bg-[#010301] border border-emerald-950/35 rounded p-3 overflow-hidden flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 block mb-2 font-mono uppercase">
                    🌊 Global Route Chokepoint Status Watchlist
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                    {nodes.map((node) => (
                      <div 
                        key={node.id}
                        onClick={() => { setSelectedRouteId(node.id); setActiveSubTab('MAP'); }}
                        className="p-2 border border-emerald-950/50 bg-[#040804] hover:bg-[#08150a] rounded flex justify-between items-center cursor-pointer transition-all font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            node.operationalStatus === 'OPERATIONAL' ? 'bg-[#00ff44] animate-pulse' : 
                            node.operationalStatus === 'STRESSED' ? 'bg-amber-400' : 
                            node.operationalStatus === 'DISRUPTED' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <span className="font-bold text-gray-200 text-[10px]">{node.name}</span>
                            <span className="text-[8px] text-gray-500 ml-2 uppercase bg-emerald-950/30 px-1 rounded">
                              Type: {node.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-right">
                          <div className="text-[9px]">
                            <span className="text-gray-500 block text-[8px] uppercase">Throughput Capacity</span>
                            <span className="text-[#00ccff]">{node.currentUsage}% / {node.capacityIndex}%</span>
                          </div>
                          <div className="text-[9px]">
                            <span className="text-gray-500 block text-[8px] uppercase">Reroute Penalty</span>
                            <span className="text-red-400">+{node.vulnerabilityScore}% friction</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* PANEL 2: BILATERAL DEPENDENCE MATRIX */}
            {activeSubTab === 'MATRIX' && (
              <motion.div 
                key="matrix" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden space-y-4"
              >
                <div className="grid grid-cols-3 gap-3 p-2 bg-[#001004]/20 border border-emerald-950/45 rounded font-mono text-[10px]">
                  <div>
                    <label className="font-bold text-gray-400 block mb-1">COUNTRY A (Actor Target)</label>
                    <select 
                      value={compareBilateralPair?.countryA || 'US'} 
                      onChange={(e) => setCompareBilateralPair({ 
                        countryA: e.target.value, 
                        countryB: compareBilateralPair?.countryB || 'CN' 
                      })}
                      className="bg-black border border-emerald-950 text-emerald-400 rounded p-1.5 w-full uppercase outline-none focus:border-emerald-500 font-bold"
                    >
                      {Object.keys(countries).map(cid => (
                        <option key={cid} value={cid}>
                          {countries[cid].flagEmoji || '🌐'} {countries[cid].name} ({cid})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-center pt-4">
                    <ArrowRightLeft className="w-5 h-5 text-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-400 block mb-1">COUNTRY B (Bilateral Partner)</label>
                    <select 
                      value={compareBilateralPair?.countryB || 'CN'} 
                      onChange={(e) => setCompareBilateralPair({ 
                        countryA: compareBilateralPair?.countryA || 'US', 
                        countryB: e.target.value 
                      })}
                      className="bg-[#050505] border border-emerald-950 text-emerald-400 rounded p-1.5 w-full uppercase outline-none focus:border-emerald-500 font-bold"
                    >
                      {Object.keys(countries).map(cid => (
                        <option key={cid} value={cid}>
                          {countries[cid].flagEmoji || '🌐'} {countries[cid].name} ({cid})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
                  {activeProfile ? (
                    <div className="space-y-4">
                      {/* Bilateral Overview KPI Deck */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-[#0e0c03] border border-amber-950/60 rounded text-center">
                          <span className="text-[8px] text-gray-500 block uppercase font-mono">Bilateral Volume</span>
                          <span className="text-amber-400 text-sm font-black font-mono">
                            ${activeProfile.totalTradeValueB.toFixed(1)}B
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#030d07] border border-emerald-950/60 rounded text-center">
                          <span className="text-[8px] text-gray-500 block uppercase font-mono">Asymmetric Lever</span>
                          <span className="text-[#00ff44] text-sm font-black font-mono">
                            {activeProfile.importDependenceScore > activeProfile.exportDependenceScore ? 'Favors Exporter' : 'Balanced'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#030c0e] border border-cyan-950/60 rounded text-center">
                          <span className="text-[8px] text-gray-500 block uppercase font-mono">Imposed Restrictions</span>
                          <span className={`text-cyan-400 text-xs font-black font-mono uppercase bg-cyan-950/30 px-1 py-0.5 rounded border ${
                            activeProfile.currentRestrictionLevel !== 'NONE' ? 'border-cyan-500 text-cyan-200' : 'border-transparent'
                          }`}>
                            {activeProfile.currentRestrictionLevel}
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#0f0404] border border-red-950/60 rounded text-center">
                          <span className="text-[8px] text-gray-500 block uppercase font-mono">Trade Link Trend</span>
                          <span className="text-red-400 text-sm font-black font-mono uppercase">
                            {activeProfile.bilateralTradeTrend}
                          </span>
                        </div>
                      </div>

                      {/* Directional dependencies breakdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Exporter -> Importer */}
                        <div className="p-3 bg-[#030903] border border-emerald-950/60 rounded flex flex-col">
                          <span className="font-bold text-gray-300 block border-b border-emerald-900 pb-1 mb-2 font-mono text-[10px] uppercase">
                            EXPORT PORTFOLIO FROM {getCountryFlagAndName(activeProfile.exporterCountryId).label} TOWARD {getCountryFlagAndName(activeProfile.importerCountryId).label}
                          </span>
                          
                          <div className="space-y-2 flex-1">
                            {activeProfile.categoryBreakdown.map((link) => {
                              const meta = CATEGORY_METADATA[link.categoryId] || { label: link.categoryId, icon: '📦', color: 'text-gray-300', bg: 'bg-gray-900/45', border: 'border-gray-800' };
                              return (
                                <div key={link.categoryId} className={`p-2 border rounded ${meta.bg} ${meta.border} font-mono`}>
                                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                                    <span className={`${meta.color} flex items-center gap-1`}>
                                      {meta.icon} {meta.label}
                                    </span>
                                    <span>${link.valueIndexB.toFixed(1)}B</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 text-[8px] text-gray-400 text-center mt-1 pt-1 border-t border-emerald-950/40">
                                    <div>Strategic Importance: <b>{link.strategicImportance}/10</b></div>
                                    <div>Substitution Level: <b>{link.substitutability}/10</b></div>
                                    <div>Friction Delay: <b>{link.routeDependence}/10</b></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rerouting analysis on this connection */}
                        <div className="p-3 bg-[#03060a] border border-[#0d1622] rounded flex flex-col font-mono text-[10px]">
                          <span className="font-bold text-[#00ccff] block border-b border-[#0f1f35] pb-1 mb-2 uppercase">
                            ⛓️ ACTIVE ROUTE GEOPOLITICAL LINKAGES
                          </span>
                          
                          <div className="space-y-3">
                            <div className="p-2.5 bg-black/60 border border-emerald-950 rounded">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Route IDs Traversed</span>
                              <div className="flex gap-1 flex-wrap">
                                {activeProfile.routeIds.map(rid => (
                                  <span 
                                    key={rid} 
                                    onClick={() => { setSelectedRouteId(rid); setActiveSubTab('MAP'); }}
                                    className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 text-[9px] cursor-pointer hover:bg-emerald-900"
                                  >
                                    {rid}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Reroute dynamic resolver output */}
                            <div className="p-2.5 bg-black/60 border border-emerald-950 rounded">
                              <span className="text-gray-400 block text-[9px] uppercase font-bold mb-1">Dynamic Shipping Reroute Potential</span>
                              {(() => {
                                const routeResult = resolveRerouting(activeProfile);
                                return (
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <span>Feasible Bypass Channels:</span>
                                      <span className={routeResult.isRerouted ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                                        {routeResult.isRerouted ? 'ALTER SHIPMENT ACTIVE' : 'DIRECT FLIGHT STABLE'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span>Freight Markup Surcharge:</span>
                                      <span className="text-red-400 font-bold">
                                        {routeResult.costMultiplier > 1.0 ? `+${Math.round((routeResult.costMultiplier - 1.0) * 100)}%` : '0%'}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1">{routeResult.description}</p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 italic text-gray-500 font-mono text-xs">
                      No active bilateral data record found between those select countries. Use the dropdown matrices above to audit another pair.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PANEL 3: SHIPPING AND PIPELINE NETWORK GRAPH MAP */}
            {activeSubTab === 'MAP' && (
              <motion.div 
                key="map" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden space-y-3"
              >
                
                {/* SVG Route Interdependence Map */}
                <div className="relative flex-1 bg-[#010301] border border-emerald-950/60 rounded h-[180px] overflow-hidden select-none">
                  
                  {/* Cyber Grid Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,68,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                  {/* Interdependence topology map container */}
                  <svg viewBox="100 80 800 320" className="w-full h-full">
                    {/* Drawing static connection lanes */}
                    {segments.map((seg) => {
                      const orig = nodes.find(n => n.id === seg.originNodeId)?.coordinates;
                      const dest = nodes.find(n => n.id === seg.destNodeId)?.coordinates;
                      if (!orig || !dest) return null;

                      const isSelected = selectedRouteId === seg.id;
                      
                      let color = '#00e5ff'; // sealane default dash
                      if (seg.type === 'pipeline') color = '#f5a623'; // amber pipeline
                      if (seg.type === 'corridor') color = '#e57373'; // brown corridor

                      return (
                        <g key={seg.id} className="cursor-pointer" onClick={() => setSelectedRouteId(seg.id)}>
                          <line 
                            x1={orig.x} y1={orig.y} x2={dest.x} y2={dest.y}
                            stroke={color} 
                            strokeWidth={isSelected ? '3.5' : '1.5'}
                            strokeDasharray={seg.type === 'sealane' ? '4,4' : 'none'}
                            className="transition-all hover:stroke-white"
                          />
                          {/* Animated pulsing dots to show flow directions */}
                          <circle r={isSelected ? "3" : "2"} fill="#00ff44" opacity="0.8">
                            <animateMotion 
                              dur="6s" 
                              repeatCount="indefinite" 
                              path={`M ${orig.x},${orig.y} L ${dest.x},${dest.y}`} 
                            />
                          </circle>
                        </g>
                      );
                    })}

                    {/* Drwaing Node Anchors */}
                    {nodes.map((node) => {
                      const isSelected = selectedRouteId === node.id;
                      let statusCol = '#00ff44';
                      if (node.operationalStatus === 'STRESSED') statusCol = '#ffeb3b';
                      if (node.operationalStatus === 'DISRUPTED') statusCol = '#ff9800';
                      if (node.operationalStatus === 'BLOCKED') statusCol = '#f44336';

                      return (
                        <g 
                          key={node.id} 
                          onClick={() => setSelectedRouteId(node.id)} 
                          className="cursor-pointer"
                        >
                          {/* Pulse Ring for stress levels */}
                          {node.operationalStatus !== 'OPERATIONAL' && (
                            <circle 
                              cx={node.coordinates.x} cy={node.coordinates.y} 
                              r={isSelected ? "18" : "12"} 
                              fill="none" 
                              stroke={statusCol} 
                              strokeWidth="1"
                              opacity="0.4"
                            >
                              <animate attributeName="r" values="6;22;6" dur="3s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="3s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <circle 
                            cx={node.coordinates.x} cy={node.coordinates.y} 
                            r={isSelected ? "7" : "4.5"} 
                            fill="#010301" 
                            stroke={statusCol} 
                            strokeWidth={isSelected ? "3.5" : "1.8"} 
                          />
                          <text 
                            x={node.coordinates.x} y={node.coordinates.y - 8} 
                            fill={isSelected ? "#ffffff" : "#a1a1aa"} 
                            fontSize={isSelected ? "9" : "7"} 
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {node.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Selected Route / Node Detail Panel */}
                <div className="p-3 bg-[#020502] border border-emerald-950/45 rounded font-mono text-[10px]">
                  {selectedRouteId ? (
                    <div>
                      {routeNode ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center border-b border-emerald-950/40 pb-1.5">
                            <span className="font-bold text-[#00ff44] text-[11px] uppercase">⚓ ROUTE SPOTLIGHT: {routeNode.name}</span>
                            <span className={`text-[8px] px-1 py-0.5 rounded bg-black border ${
                              routeNode.operationalStatus === 'OPERATIONAL' ? 'border-emerald-900 text-emerald-400' : 'border-red-900 text-red-400'
                            }`}>
                              STATUS: {routeNode.operationalStatus}
                            </span>
                          </div>
                          
                          <p className="text-gray-400 leading-normal text-[9.5px]">{routeNode.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-[9px] pt-1">
                            <div className="p-1 bg-[#040804] border border-emerald-950 rounded">
                              <span className="text-gray-500 block">MAX CAPACITY</span>
                              <span>{routeNode.capacityIndex}% Volume</span>
                            </div>
                            <div className="p-1 bg-[#040804] border border-emerald-950 rounded">
                              <span className="text-gray-500 block">USAGE MULTIPLIER</span>
                              <span>{routeNode.currentUsage}% of Max</span>
                            </div>
                            <div className="p-1 bg-[#040804] border border-emerald-950 rounded">
                              <span className="text-gray-500 block">VULNERABILITY INDEX</span>
                              <span>{routeNode.vulnerabilityScore}/100 Risk</span>
                            </div>
                            <div className="p-1 bg-[#040804] border border-emerald-950 rounded">
                              <span className="text-gray-500 block">CONTROL SOVEREIGNTY</span>
                              <span>{routeNode.controllingCountryIds.join(' / ')}</span>
                            </div>
                          </div>

                          {/* Control toggle actions */}
                          <div className="flex gap-2 justify-end pt-2">
                            {(['OPERATIONAL', 'STRESSED', 'DISRUPTED', 'BLOCKED'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => toggleRouteStatus(routeNode.id, status)}
                                className={`px-2 py-1 tracking-widest text-[8px] font-bold uppercase transition-all rounded border ${
                                  routeNode.operationalStatus === status 
                                    ? 'bg-emerald-900 border-emerald-400 text-white shadow-[0_0_8px_rgba(0,255,68,0.2)]' 
                                    : 'bg-black border-emerald-950/70 text-gray-500 hover:text-emerald-400'
                                }`}
                              >
                                {status === 'OPERATIONAL' && '⚡ open'}
                                {status === 'STRESSED' && '⚠️ stress'}
                                {status === 'DISRUPTED' && '❌ disrupt'}
                                {status === 'BLOCKED' && '🔒 block'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : routeSegment ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center border-b border-emerald-950/40 pb-1.5">
                            <span className="font-bold text-[#f5a623] text-[11px] uppercase">⛓️ LINE SEGMENT: {routeSegment.name}</span>
                            <span className="text-gray-500 uppercase">TYPE: {routeSegment.type}</span>
                          </div>
                          
                          <p className="text-gray-400 leading-normal">{routeSegment.description}</p>
                          
                          <div className="flex gap-4 pt-1 text-[9px]">
                            <div>CHOKEPOINT RISK: <b className="text-red-400">{routeSegment.chokepointRisk}%</b></div>
                            <div>BELONGS TO ACCORD: <b className="text-amber-500">{routeSegment.controlCountryId || 'NEUTRAL'}</b></div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            {(['OPERATIONAL', 'STRESSED', 'BLOCKED'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => toggleRouteStatus(routeSegment.id, status)}
                                className={`px-2 py-0.5 tracking-wider text-[8px] font-bold uppercase rounded border ${
                                  routeSegment.status === status 
                                    ? 'bg-amber-950/40 border-amber-500 text-amber-300' 
                                    : 'bg-black border-emerald-950 text-gray-500 hover:text-amber-400'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center p-4 italic text-gray-600">
                      Select any map anchor node or shipping segment path to manipulate chokepoints and route-disruption settings.
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* PANEL 4: ESCALATION SANDBOX */}
            {activeSubTab === 'SANDBOX' && (
              <motion.div 
                key="sandbox" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col h-full overflow-hidden space-y-4"
              >
                
                {/* Parameter Setup Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Coercor Setup Column */}
                  <div className="p-3 bg-[#030904] border border-emerald-950/65 rounded flex flex-col space-y-3 font-mono text-[10px]">
                    <span className="font-bold text-[#00ff44] border-b border-emerald-950 pb-1 uppercase">
                      ⚓ GEOPOLITICAL ACTORS
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-500 text-[8px] uppercase font-bold block mb-1">COERCING ACTOR</label>
                        <select 
                          value={builderActor} 
                          onChange={(e) => setBuilderActor(e.target.value)}
                          className="bg-black border border-emerald-950 text-emerald-400 rounded p-1 w-full uppercase outline-none focus:border-emerald-500"
                        >
                          {Object.keys(countries).map(cid => (
                            <option key={cid} value={cid}>{cid} - {countries[cid].name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500 text-[8px] uppercase font-bold block mb-1">TARGET ADVERSARY</label>
                        <select 
                          value={builderTarget} 
                          onChange={(e) => setBuilderTarget(e.target.value)}
                          className="bg-black border border-emerald-950 text-emerald-500 rounded p-1 w-full uppercase outline-none focus:border-emerald-500"
                        >
                          {Object.keys(countries).map(cid => (
                            <option key={cid} value={cid}>{cid} - {countries[cid].name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[8px] uppercase font-bold block mb-1">Escalation Threat Severity</span>
                      <div className="flex bg-[#001004] p-0.5 border border-emerald-950 rounded gap-1">
                        {(['TARIFF', 'SECTORAL', 'TOTAL_RUPTURE'] as const).map(act => (
                          <button
                            key={act}
                            onClick={() => setBuilderAction(act)}
                            className={`flex-1 py-1 text-[8px] font-bold tracking-widest uppercase rounded ${
                              builderAction === act 
                                ? 'bg-emerald-900 text-emerald-200 border border-emerald-600' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {act === 'TARIFF' && '📊 tariff'}
                            {act === 'SECTORAL' && '🛡️ sectoral'}
                            {act === 'TOTAL_RUPTURE' && '⚡ rupture'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {builderAction === 'TARIFF' ? (
                      <div>
                        <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500 mb-1">
                          <span>Tariff Percentage</span>
                          <span className="text-emerald-400">{builderTariff}%</span>
                        </div>
                        <input 
                          type="range" min="5" max="100" step="5"
                          value={builderTariff} onChange={(e) => setBuilderTariff(parseInt(e.target.value))}
                          className="w-full accent-emerald-500 h-1 bg-emerald-950 rounded cursor-pointer"
                        />
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-500 text-[8px] uppercase font-bold block mb-1.5">Target Strategic Categories</span>
                        <div className="grid grid-cols-3 gap-1">
                          {(Object.keys(CATEGORY_METADATA) as StrategicTradeCategory[]).map(cat => {
                            const meta = CATEGORY_METADATA[cat];
                            const active = builderCats.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={() => handleToggleCat(cat)}
                                className={`py-1 rounded text-[8px] text-center border font-bold uppercase transition-all ${
                                  active 
                                    ? 'bg-emerald-900 border-emerald-500 text-white shadow-[0_0_5px_rgba(0,255,68,0.15)]' 
                                    : 'bg-black/50 border-emerald-950/70 text-gray-500 hover:text-gray-300'
                                }`}
                              >
                                {meta.icon} {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Coercive Preview Engine Block */}
                  <div className="p-3 bg-[#0d0707] border border-red-950/65 rounded flex flex-col space-y-3 font-mono text-[10px]">
                    <span className="font-bold text-red-400 border-b border-red-950 pb-1 uppercase flex items-center gap-1.5">
                      🔮 FORECAST PREVIEW: TRADE COERCION SPECTRUM
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                      <div className="p-1.5 bg-[#1a0808]/50 border border-red-950 rounded">
                        <span className="text-gray-500 text-[8px] block">TARGET GDP DRAG</span>
                        <span className="text-red-400 font-extrabold text-xs">
                          -{previewData.importerGdpFallPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="p-1.5 bg-[#1a0808]/50 border border-red-950 rounded">
                        <span className="text-gray-500 text-[8px] block">EXPECTED CPI INFLATION</span>
                        <span className="text-amber-400 font-extrabold text-xs">
                          +{previewData.inflationImpactPercent.toFixed(2)}% CPI
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[9px] leading-relaxed">
                      <div>
                        <span className="text-gray-500 uppercase block font-bold text-[8px]">Value exposed At Risk:</span>
                        <span className="text-[#00ccff] font-bold">${previewData.directValueAtRiskB.toFixed(1)}B USD Annualized</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase block font-bold text-[8px]">Partner Retaliation Branch Forecast:</span>
                        <span className="text-red-300 font-bold">{previewData.expectedRetaliationType}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase block font-bold text-[8px]">Allied Spillover blowback:</span>
                        <p className="text-gray-400">{previewData.predictedAlliedSpillover}</p>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-red-950/30">
                        <span>Lanes bypass Availability:</span>
                        <span className="text-[#00ff44]">{previewData.rerouteViability}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    onClick={triggerCoercion}
                    className="w-full bg-[#1b0808]/80 hover:bg-[#340b0b] text-red-400 border border-red-800/60 hover:border-red-500 rounded p-2.5 text-center transition-all flex justify-center items-center gap-2 font-mono font-black uppercase text-xs cursor-pointer shadow-[0_0_12px_rgba(244,67,54,0.1)] active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                    EXECUTE ESCALATION COERCION TRANSITION
                  </button>
                  <p className="text-[8.5px] text-gray-500 text-center font-mono mt-1.5 leading-normal">
                    Warning: Unilateral trade restrictions degrade diplomatic relations, trigger automatic retaliations on the Gotham Relationship Graph, and deteriorate GDP reserves of both the exporter and importer. 
                  </p>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
