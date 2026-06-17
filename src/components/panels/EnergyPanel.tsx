import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { produce } from 'immer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Flame, 
  Droplet, 
  Sun, 
  Wind, 
  ChevronRight, 
  AlertTriangle, 
  ShieldCheck, 
  Globe, 
  Sliders, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Compass, 
  Settings, 
  AlertOctagon, 
  HelpCircle, 
  Database, 
  Plus, 
  Minus, 
  Check, 
  Lock, 
  Ban, 
  FileText, 
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { useEnergyStore, EnergyEmbargoPreview } from '../../store/energyStore';
import { useWorldStore } from '../../store/worldStore';
import { EnergySourceType } from '../../types/energy';

// SOURCE METADATA
const SOURCE_INFO: Record<EnergySourceType, { label: string; icon: any; color: string; bg: string; border: string; desc: string }> = {
  oil: {
    label: 'Liquid Petroleum (Oil)',
    icon: Droplet,
    color: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-900/40',
    desc: 'Globally tradable. Highly vulnerable to maritime chokepoints but offers high physical rerouting potential.'
  },
  gas: {
    label: 'Natural Gas (Pipeline/LNG)',
    icon: Flame,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-900/40',
    desc: 'Infrastructure dependent. Relies heavily on rigid physical pipelines & LNG berths. Extremely hard to substitute.'
  },
  coal: {
    label: 'Solid Hydrocarbons (Coal)',
    icon: HardHatIcon, // Custom or fallback
    color: 'text-amber-500',
    bg: 'bg-amber-950/40',
    border: 'border-amber-900/40',
    desc: 'Abundant but carbon heavy. Serves as a quick emergency fallback to absorb gas pipeline deficits.'
  },
  nuclear: {
    label: 'Fission Nuclear Baseload',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-900/40',
    desc: 'Highly resilient baseload generation. Safe from short-term route blockages, but fuel-cycle rigid.'
  },
  hydro: {
    label: 'Hydroelectric Reservoir Flow',
    icon: Activity,
    color: 'text-sky-400',
    bg: 'bg-sky-950/40',
    border: 'border-sky-900/40',
    desc: 'Purely domestic geographical generator. Low import reliance but vulnerable to climate droughts.'
  },
  solar: {
    label: 'Solar PV Harvesting',
    icon: Sun,
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-900/40',
    desc: 'Intermittent. Rapidly expanding domestic resiliency buffer. Reduces reliance on imported grids.'
  },
  wind: {
    label: 'Wind Turbine Logistics',
    icon: Wind,
    color: 'text-teal-400',
    bg: 'bg-teal-950/40',
    border: 'border-teal-900/40',
    desc: 'Intermittent. High local balancing overhead, but decreases sovereignty exposure.'
  }
};

function HardHatIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12a10 10 0 0 1 20 0Z" />
      <path d="M5 12a7 7 0 0 1 14 0Z" />
      <path d="M12 2v3" />
      <path d="M12 12v3" />
    </svg>
  );
}

export default function EnergyPanel() {
  const {
    profiles,
    incidents,
    selectedCountryId,
    compareSupplierId,
    activeEmbargoes,
    activeMapOverlay,
    setSelectedCountryId,
    setCompareSupplierId,
    setActiveMapOverlay,
    calculateEmbargoPreview,
    imposeEnergyEmbargo,
    liftEnergyEmbargo,
    triggerPipelineRupture,
    bufferStrategicReserves,
    tickEnergySystem
  } = useEnergyStore();

  const countries = useWorldStore((s) => s.countries);

  // Sub tab tracking
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'FLOWS' | 'COERCION' | 'LOGS'>('MONITOR');

  // Coercion sandbox state
  const [actorId, setActorId] = useState<string>('RU');
  const [targetId, setTargetId] = useState<string>('DE');
  const [selectedSources, setSelectedSources] = useState<EnergySourceType[]>(['gas']);

  // Selected Country details
  const profile = profiles[selectedCountryId] || profiles['US'];

  // Calculate sandbox preview
  const sandboxPreview: EnergyEmbargoPreview = calculateEmbargoPreview(actorId, targetId, selectedSources);

  const handleToggleSource = (src: EnergySourceType) => {
    if (selectedSources.includes(src)) {
      setSelectedSources(selectedSources.filter(s => s !== src));
    } else {
      setSelectedSources([...selectedSources, src]);
    }
  };

  const executeEmbargo = () => {
    imposeEnergyEmbargo(actorId, targetId, selectedSources);
  };

  const getCountryName = (cid: string) => {
    return countries[cid]?.name || cid;
  };

  const getCountryFlag = (cid: string) => {
    return countries[cid]?.flagEmoji || '🌐';
  };

  return (
    <PanelFxShell panelId="energy_dependency" relevantFxTypes={['SANCTIONS_ESCALATION','MARKET_CRASH','ECONOMIC_COLLAPSE']}>
      <div className="flex flex-col h-full bg-[#050505] text-gray-200 font-sans border border-zinc-900 rounded-lg overflow-hidden" id="energy_integrity_deck">
      {/* 1. STATUS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#070707] border-b border-zinc-900 px-6 py-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-amber-950/60 border border-amber-600/40 rounded text-[9px] font-bold text-amber-400 leading-none">
              SECURE SEC-OVERLAY
            </span>
            <span className="text-[10px] font-mono text-zinc-500">SYS_DEC: MODULE_2.3_ENERGY</span>
          </div>
          <h2 className="text-xl font-medium tracking-tight text-white mt-1">
            ENERGY INTEGRITY &amp; EXPOSURE MATRIX
          </h2>
        </div>

        {/* Dynamic Map Overlays Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500">MAP PREVIEW MODE:</span>
          {([
            { id: 'NONE', label: 'STANDARD' },
            { id: 'VULNERABILITY', label: 'VULNERABILITY' },
            { id: 'STRESS', label: 'DOMESTIC STRESS' },
            { id: 'DIVERSIFICATION', label: 'DIVERSIFICATION' },
            { id: 'OIL_DEPENDENCE', label: 'OIL CONC' },
            { id: 'GAS_DEPENDENCE', label: 'GAS CONC' }
          ] as const).map((o) => (
            <button
              key={o.id}
              onClick={() => setActiveMapOverlay(o.id)}
              className={`p-1 px-2.5 font-mono text-[10px] font-bold rounded border transition-all ${
                activeMapOverlay === o.id
                  ? 'bg-amber-950/80 text-amber-400 border-amber-500/60 shadow-md shadow-amber-950/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200 hover:border-zinc-800'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. SUB-NAVIGATION BAR */}
      <div className="flex bg-[#080808] border-b border-zinc-900 px-6 py-2 gap-4">
        {[
          { id: 'MONITOR', label: 'ENERGY SECURITY MONITOR', icon: Activity },
          { id: 'FLOWS', label: 'IMPORT VULNERABILITY FLOWS', icon: Globe },
          { id: 'COERCION', label: 'PETRO-COERCION SANDBOX', icon: Sliders },
          { id: 'LOGS', label: 'CRITICAL SECURITY LOGS', icon: FileText }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 p-1.5 px-4 rounded text-xs font-mono font-medium transition-all ${
                isActive 
                  ? 'bg-zinc-900 border border-zinc-800 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : ''}`} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 3. WORKING GRID */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* LEFT VIEW: SECTIONS */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-zinc-900 bg-[#060606] custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* SUB-TAB 1: SECURITY MONITOR */}
            {activeTab === 'MONITOR' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
                key="sub_monitor"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
                      National Energy Security Registry
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Cross-border energy dependence model evaluating sufficiency profiles under localized route embargo scenarios.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const state = useWorldStore.getState();
                      tickEnergySystem(state.currentTick);
                    }}
                    className="flex items-center gap-2 p-1.5 px-3 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all font-mono text-[10px] uppercase font-bold text-zinc-400 hover:text-zinc-200"
                  >
                    <RefreshCw className="w-3 h-3 anim-spin" />
                    Propagate Ticks (Sim)
                  </button>
                </div>

                <div className="border border-zinc-900 rounded bg-zinc-950/60 overflow-hidden">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="bg-[#090909] text-zinc-500 border-b border-zinc-950">
                        <th className="p-3">COUNTRY</th>
                        <th className="p-3">ROLE</th>
                        <th className="p-3 text-center">SUFFICIENCY INDEX</th>
                        <th className="p-3 text-center">IMPORT DEP %</th>
                        <th className="p-3 text-center">DIVERSIFICATION</th>
                        <th className="p-3 text-center">ROUTE CONC</th>
                        <th className="p-3 text-center">DOMESTIC STRESS</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-950">
                      {Object.keys(profiles).map((cid) => {
                        const prof = profiles[cid];
                        const isCurrent = selectedCountryId === cid;
                        return (
                          <tr 
                            key={cid} 
                            className={`transition-colors hover:bg-zinc-900/40 ${
                              isCurrent ? 'bg-zinc-900/60 border-l-2 border-amber-500' : ''
                            }`}
                          >
                            <td className="p-3 font-bold flex items-center gap-2 text-zinc-200">
                              <span className="text-base">{getCountryFlag(cid)}</span>
                              <span>{getCountryName(cid)} ({cid})</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                prof.exportRole === 'EXPORTER' 
                                  ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400' 
                                  : prof.exportRole === 'SELF_SUFFICIENT' 
                                    ? 'bg-sky-950/40 border border-sky-800/40 text-sky-400' 
                                    : 'bg-zinc-900/60 border border-zinc-800/40 text-zinc-400'
                              }`}>
                                {prof.exportRole}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className={prof.energySufficiencyIndex >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
                                  {prof.energySufficiencyIndex}%
                                </span>
                                <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-1 border border-zinc-800">
                                  <div 
                                    className={`h-full ${prof.energySufficiencyIndex >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, prof.energySufficiencyIndex)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-semibold text-zinc-300">
                              {prof.importDependencyPct}%
                            </td>
                            <td className="p-3 text-center">
                              <span className={prof.diversificationScore > 75 ? 'text-emerald-400' : prof.diversificationScore > 50 ? 'text-zinc-300' : 'text-rose-400'}>
                                {prof.diversificationScore}
                              </span>
                            </td>
                            <td className="p-3 text-center text-zinc-400">
                              {prof.routeConcentration}%
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`font-bold ${
                                  prof.stressState.aggregatedStressScore > 50 
                                    ? 'text-rose-400 blink' 
                                    : prof.stressState.aggregatedStressScore > 20 
                                      ? 'text-amber-400' 
                                      : 'text-zinc-500'
                                }`}>
                                  {prof.stressState.aggregatedStressScore}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedCountryId(cid)}
                                className="font-mono text-[10px] text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded uppercase"
                              >
                                Drill down
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* System Safeguards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded flex items-start gap-3">
                    <div className="p-2 rounded bg-amber-950/60 border border-amber-900 text-amber-400 mt-1">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        Vulnerability Index triggers
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Vulnerabilities of gaseous supply links spike when route concentration exceeds 60%. If chokepoint blockages occur, countries with reserves &lt;90 days immediately trigger factory allocation halts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-900 bg-zinc-950/40 rounded flex items-start gap-3">
                    <div className="p-2 rounded bg-sky-950/60 border border-sky-900 text-sky-400 mt-1">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        Adaptation &amp; Substitutions
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Hydroelectric baseload is safe from interdiction bounds, but solar photovoltaic installations scale up dynamically during active oil bans, boosting adaptation momentum by 15% tick-by-tick.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 2: VULNERABILITY FLOWS (INTERACTIVE SVG MAP ARCHITECTURE) */}
            {activeTab === 'FLOWS' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
                key="sub_flows"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
                    Interactive Dependency &amp; Transit Flow Graph
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sovereign trade links showing flow of raw materials. Solid arcs represent high-capacity pipelines, dashed represent maritime lanes. Red represents disrupted channels.
                  </p>
                </div>

                <div className="relative border border-zinc-900 bg-[#030303] rounded-lg p-4 h-[440px] flex items-center justify-center overflow-hidden">
                  {/* Legend Overlay */}
                  <div className="absolute top-4 left-4 p-3 bg-[#080808]/90 border border-zinc-950 rounded font-mono text-[9px] text-zinc-500 space-y-1.5 z-10 w-44">
                    <span className="font-bold text-zinc-300 block mb-1">NODE SYMBOLOGY</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                      <span>Net Supplier (Exporter)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                      <span>Aggregated Importer</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-sky-400 block" />
                      <span>Selected Focus</span>
                    </div>
                    <div className="h-px bg-zinc-900 my-1" />
                    <span className="font-bold text-zinc-300 block mb-1">FLOW CHANNELS</span>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-cyan-400 w-6" />
                      <span>Gas Pipelines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-px border-t border-dashed border-rose-400 w-6" />
                      <span>Oil Tanker Sea Lanes</span>
                    </div>
                    <div className="flex items-center gap-2 flex-nowrap">
                      <div className="h-px bg-rose-600 w-6 animate-pulse" />
                      <span className="text-rose-400 font-bold">Disrupted or Embargoed</span>
                    </div>
                  </div>

                  {/* SVG Flow Canvas */}
                  <svg className="w-full h-full" id="dependency_svg_chart">
                    {/* Definitions for arrow markers */}
                    <defs>
                      <marker id="arrow-operational" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
                      </marker>
                      <marker id="arrow-blocked" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
                      </marker>
                    </defs>

                    {/* Pipelines & Lanes */}
                    {/* Exporters RU, SA, IR -> Importers CN, DE, JP, IN, TW */}
                    {/* Node Coordinates Mapping */}
                    {/* RU: (200, 100), SA: (150, 300), IR: (320, 220) */}
                    {/* US: (100, 150) */}
                    {/* CN: (480, 180), DE: (350, 80), JP: (620, 120), IN: (450, 340), TW: (600, 220), FR: (250, 380) */}
                    
                    {(() => {
                      const points: Record<string, { x: number; y: number }> = {
                        RU: { x: 250, y: 100 },
                        SA: { x: 180, y: 320 },
                        IR: { x: 340, y: 220 },
                        US: { x: 80, y: 180 },
                        CN: { x: 500, y: 170 },
                        DE: { x: 380, y: 80 },
                        JP: { x: 620, y: 130 },
                        IN: { x: 480, y: 330 },
                        TW: { x: 630, y: 240 },
                        FR: { x: 140, y: 80 }
                      };

                      const flowArcs: Array<{ from: string; to: string; type: EnergySourceType; routeType: 'pipeline' | 'sealane'; label: string }> = [
                        { from: 'RU', to: 'DE', type: 'gas', routeType: 'pipeline', label: 'Nordstream Stub' },
                        { from: 'SA', to: 'DE', type: 'gas', routeType: 'pipeline', label: 'Pipe Norway' },
                        { from: 'RU', to: 'CN', type: 'oil', routeType: 'pipeline', label: 'Siberian Pipe' },
                        { from: 'RU', to: 'CN', type: 'gas', routeType: 'pipeline', label: 'Power of Siberia' },
                        { from: 'SA', to: 'CN', type: 'oil', routeType: 'sealane', label: 'Malacca Lane' },
                        { from: 'IR', to: 'CN', type: 'gas', routeType: 'sealane', label: 'Gulf LNG Berth' },
                        { from: 'SA', to: 'JP', type: 'oil', routeType: 'sealane', label: 'Malacca Chokepoint' },
                        { from: 'SA', to: 'IN', type: 'oil', routeType: 'sealane', label: 'Hormuz Lane' },
                        { from: 'RU', to: 'IN', type: 'oil', routeType: 'sealane', label: 'Capesize Channel' },
                        { from: 'SA', to: 'TW', type: 'oil', routeType: 'sealane', label: 'Taiwan Strait' }
                      ];

                      return (
                        <>
                          {/* Arcs Renders */}
                          {flowArcs.map((arc, idx) => {
                            const p1 = points[arc.from];
                            const p2 = points[arc.to];
                            if (!p1 || !p2) return null;

                            // Compute if disrupted from state profiles
                            const targetProf = profiles[arc.to];
                            const isDisrupted = targetProf?.dependencies.some(
                              d => d.supplierCountryId === arc.from && d.sourceType === arc.type && d.isDisrupted
                            ) || false;

                            // Draw a quadratic bezier curve for aesthetic curvature
                            const midX = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.15;
                            const midY = (p1.y + p2.y) / 2 - (p2.x - p1.x) * 0.15;
                            const pathData = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

                            return (
                              <g key={idx}>
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke={isDisrupted ? '#ef4444' : arc.type === 'gas' ? '#22d3ee' : '#f87171'}
                                  strokeWidth={isDisrupted ? '2' : arc.routeType === 'pipeline' ? '2.5' : '1.5'}
                                  strokeDasharray={arc.routeType === 'sealane' ? '5,5' : '0'}
                                  className={`transition-all duration-300 ${isDisrupted ? 'animate-pulse' : ''}`}
                                  markerEnd={isDisrupted ? 'url(#arrow-blocked)' : 'url(#arrow-operational)'}
                                />
                                {/* Route Label Bubble */}
                                <g transform={`translate(${midX}, ${midY})`}>
                                  <rect 
                                    x="-40" 
                                    y="-10" 
                                    width="80" 
                                    height="18" 
                                    rx="3" 
                                    fill="#000" 
                                    stroke="currentColor" 
                                    className={`${isDisrupted ? 'stroke-rose-600' : 'stroke-zinc-900'} opacity-75`}
                                  />
                                  <text 
                                    className="font-mono font-semibold" 
                                    fontSize="7.5px" 
                                    fill={isDisrupted ? '#ef4444' : '#fff'}
                                    textAnchor="middle" 
                                    y="1.5"
                                  >
                                    {isDisrupted ? 'BLOCKED' : arc.label.toUpperCase()}
                                  </text>
                                </g>
                              </g>
                            );
                          })}

                          {/* Nodes Renders */}
                          {Object.keys(points).map((cid) => {
                            const p = points[cid];
                            const isSelected = selectedCountryId === cid;
                            const isSupplier = profiles[cid]?.exportRole === 'EXPORTER';
                            return (
                              <g 
                                key={cid} 
                                transform={`translate(${p.x}, ${p.y})`}
                                className="cursor-pointer group"
                                onClick={() => setSelectedCountryId(cid)}
                              >
                                {/* Glow Circle */}
                                <circle 
                                  r="24" 
                                  fill="none" 
                                  stroke={isSelected ? '#f59e0b' : 'none'} 
                                  strokeWidth="2.5" 
                                  className="transition-all scale-110 opacity-70"
                                />
                                {/* Solid Base */}
                                <circle 
                                  r="16" 
                                  fill={isSupplier ? '#022c22' : '#3f2b11'} 
                                  stroke={isSelected ? '#f59e0b' : isSupplier ? '#059669' : '#d97706'} 
                                  strokeWidth="1.5"
                                  className="transition-all hover:scale-110"
                                />
                                <text 
                                  textAnchor="middle" 
                                  y="4"
                                  className="font-mono font-bold text-[10px]" 
                                  fill="#fff"
                                >
                                  {cid}
                                </text>
                                {/* Tooltip label */}
                                <g transform="translate(0, -25)" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#0c0c0c" stroke="#27272a" strokeWidth="1" />
                                  <text fill="#a1a1aa" fontSize="7px" textAnchor="middle" y="0">
                                    {getCountryName(cid).toUpperCase()}
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}

                  </svg>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 3: COERCIVE SANDBOX (EMBARGO MODEL) */}
            {activeTab === 'COERCION' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
                key="sub_coercion"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
                    Petroleum &amp; Gas Weaponization Sandbox
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Model and execute energy restriction actions as coercive state pressure. Sourcing alternate deliveries triggers real rerouting fees on target treasuries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Selector Actor Exporter */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded space-y-3">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold block uppercase">
                      1. Actor Exporter Country
                    </span>
                    <select
                      value={actorId}
                      onChange={(e) => {
                        setActorId(e.target.value);
                        // Make sure we select target distinct
                        if (e.target.value === targetId) {
                          setTargetId(e.target.value === 'RU' ? 'SU' : 'RU');
                        }
                      }}
                      className="bg-[#050505] border border-zinc-800 text-zinc-200 text-xs font-bold rounded p-2.5 w-full uppercase outline-none focus:border-amber-500/60"
                    >
                      {Object.keys(profiles).map(cid => (
                        <option key={cid} value={cid}>
                          {getCountryFlag(cid)} {getCountryName(cid)} ({cid})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Primary supplier enforcing active interdiction of gaseous or petroleum flow routes. Exporters face minimal domestic blowback but experience diplomatic pressure drifts.
                    </p>
                  </div>

                  {/* Target Importer Country */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded space-y-3">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold block uppercase">
                      2. Target Importer Country
                    </span>
                    <select
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        if (e.target.value === actorId) {
                          setActorId(e.target.value === 'RU' ? 'SA' : 'RU');
                        }
                      }}
                      className="bg-[#050505] border border-zinc-800 text-zinc-200 text-xs font-bold rounded p-2.5 w-full uppercase outline-none focus:border-amber-500/60"
                    >
                      {Object.keys(profiles).map(cid => (
                        <option key={cid} value={cid}>
                          {getCountryFlag(cid)} {getCountryName(cid)} ({cid})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500">
                      Destination economy receiving energy assets. Vulnerable importers experience rising domestic aggregate stress and stagflationary macro penalties if alternate routing is low.
                    </p>
                  </div>

                  {/* Sources affected checklist */}
                  <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded space-y-3">
                    <span className="font-mono text-[10px] text-zinc-500 font-bold block uppercase">
                      3. Target Energy Sources
                    </span>
                    <div className="space-y-1.5">
                      {(['oil', 'gas', 'coal'] as EnergySourceType[]).map((src) => {
                        const isChecked = selectedSources.includes(src);
                        const Meta = SOURCE_INFO[src];
                        return (
                          <label 
                            key={src} 
                            onClick={() => handleToggleSource(src)}
                            className={`flex items-center gap-2 cursor-pointer p-1.5 px-3 rounded border text-xs font-mono select-none transition-all ${
                              isChecked
                                ? 'bg-rose-950/20 text-rose-300 border-rose-500/60'
                                : 'bg-zinc-950/60 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} // handled by click of label
                              className="sr-only" 
                            />
                            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-rose-500 border-rose-500' : 'border-zinc-800'}`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                            </div>
                            <span className="capitalize">{src.toUpperCase()}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ADVANCED FORECAST PREVIEW BOARD */}
                <div className="border border-zinc-900 rounded bg-[#090909]/40 overflow-hidden">
                  <div className="p-3 bg-zinc-950 border-b border-zinc-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span className="font-mono font-bold text-[10px] tracking-wide text-zinc-300 uppercase">
                      ESTIMATED EMBARGO FORECAST REPORT
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-[11px]">
                    <div className="space-y-1">
                      <span className="text-zinc-500 block">VALUE EXPOSURE:</span>
                      <span className="text-[15px] font-bold text-white">${sandboxPreview.directValueExposureB} Billion / Yr</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500 block">EXPECTED IMPORT LOSS:</span>
                      <span className="text-[15px] font-bold text-rose-400 leading-none block">
                        -{sandboxPreview.expectedImportLossPct}% Volume
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500 block">REROUTE ADAPTABILITY:</span>
                      <span className="text-[15px] font-bold text-emerald-400 block">
                        {sandboxPreview.expectedRerouteSharePct}% Alternate
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-500 block">ESTIMATED STRESS SPIKE:</span>
                      <span className="text-[15px] font-bold text-amber-500 block">
                        +{sandboxPreview.estimatedDomesticStressIncrease}% Severity
                      </span>
                    </div>
                  </div>

                  {/* Reroute alternatives notes */}
                  <div className="p-4 px-5 border-t border-zinc-900/40 bg-zinc-950/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10.5px]">
                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-zinc-500">MUTUAL RETALIATION CONFIDENCE:</span>
                      <span className="p-0.5 px-2 bg-zinc-900 border border-zinc-800 text-amber-500 font-bold rounded">
                        {sandboxPreview.confidenceScore} INDEX
                      </span>
                    </div>

                    <button
                      onClick={executeEmbargo}
                      disabled={selectedSources.length === 0}
                      className={`flex items-center gap-2 p-2 px-6 rounded text-xs font-bold leading-none select-none transition-all ${
                        selectedSources.length > 0
                          ? 'bg-rose-500 text-black hover:bg-rose-400 shadow-md active:scale-95'
                          : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-950'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      IMPOSE PETRO-COERCION EMBARGO
                    </button>
                  </div>
                </div>

                {/* List Active Embargoes */}
                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-zinc-400 font-bold tracking-wide uppercase">
                    Active Energy Sanctions Ledger ({activeEmbargoes.length})
                  </span>
                  
                  {activeEmbargoes.length === 0 ? (
                    <div className="p-4 bg-zinc-950/10 border border-dashed border-zinc-900 rounded text-center text-zinc-500 font-mono text-[10.5px]">
                      No active petro-coercive embargo restrictions currently logged across international networks.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeEmbargoes.map((emb) => (
                        <div 
                          key={emb.id}
                          className="flex justify-between items-center p-3 bg-[#0a0a0a] border border-rose-950/40 rounded text-xs font-mono"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-rose-400">🚨 ACTIVE EXTORTION</span>
                            <span className="text-zinc-300">
                              {emb.actorCountryId} banned energy exports to {emb.targetCountryId}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-400 font-bold uppercase">
                              {emb.affectedSources.join(' & ')}
                            </span>
                          </div>

                          <button 
                            onClick={() => liftEnergyEmbargo(emb.id)}
                            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1 rounded text-[10.5px] uppercase font-bold"
                          >
                            Lift Embargo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* SUB-TAB 4: CRITICAL INCIDENT LOGS */}
            {activeTab === 'LOGS' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
                key="sub_logs"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">
                    Geopolitical Energy incident Chronicles
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sovereign logging of pipeline ruptures, chokepoint blockades, and adaptation fallback adjustments.
                  </p>
                </div>

                <div className="divide-y divide-zinc-950 border border-zinc-900 rounded bg-[#030303] overflow-hidden">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-4 flex items-start gap-4 transition-colors hover:bg-zinc-950/40">
                      <div className={`p-1.5 rounded border mt-0.5 ${
                        inc.economicSeverity === 'SEVERE'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                          : inc.economicSeverity === 'STRESSED'
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}>
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                          <span className={`${
                            inc.economicSeverity === 'SEVERE' ? 'text-rose-400' : 'text-zinc-500'
                          }`}>
                            {inc.type}
                          </span>
                          <span className="text-zinc-600">
                            SIMUL Tick #{inc.tick}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200">{inc.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sandbox Disaster Overrides */}
                <div className="p-4 border border-zinc-900 bg-zinc-950/20 rounded space-y-3">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span className="font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wide">
                      OPERATIONAL DISASTER OVERRIDES (CRISIS SIMULATION)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
                    <button
                      onClick={() => triggerPipelineRupture('siberian_pipeline', 'Siberian Altai Pipeline')}
                      className="p-2 border border-zinc-900 hover:border-rose-950/60 bg-zinc-950 hover:bg-rose-950/10 text-rose-400 rounded font-semibold text-left transition-colors"
                    >
                      💥 Sabotage Siberian Altai Pipeline (RU ➜ CN)
                    </button>
                    <button
                      onClick={() => triggerPipelineRupture('pipeline_norway', 'Norway-Europe Sea Pipeline')}
                      className="p-2 border border-zinc-900 hover:border-rose-950/60 bg-zinc-950 hover:bg-rose-950/10 text-rose-400 rounded font-semibold text-left transition-colors"
                    >
                      💥 Sabotage Northern Sea Gas Link (SA ➜ DE)
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* RIGHT SIDEBAR: COUNTRY DETAIL DRILL DOWN */}
        <div className="w-full lg:w-[350px] overflow-y-auto p-6 bg-[#040404] flex flex-col justify-between custom-scrollbar" id="energy_sidebar_drilldown">
          
          <div className="space-y-6">
            
            {/* Header profile select */}
            <div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                  Focus Dossier Drilldown
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  Last Checked: T#{profile.lastUpdatedTick}
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 mt-2">
                <span className="text-3xl leading-none">{getCountryFlag(profile.countryId)}</span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight leading-none">
                    {getCountryName(profile.countryId)}
                  </h3>
                  <span className="text-[10.5px] text-zinc-400 font-mono mt-1 block">
                    Energy Role: <b className="font-bold text-amber-500 uppercase">{profile.exportRole}</b>
                  </span>
                </div>

                <select
                  value={profile.countryId}
                  onChange={(e) => setSelectedCountryId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-[10.5px] font-mono p-1 rounded font-bold"
                >
                  {Object.keys(profiles).map(cid => (
                    <option key={cid} value={cid}>{cid}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Strategic Gauges (Vulnerability / Resilience / Stress) */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-2 bg-zinc-950/60 border border-zinc-900/65 rounded text-center">
                <span className="text-[8px] text-zinc-500 block uppercase">STRESS INDEX</span>
                <span className={`text-[15px] font-bold block mt-1 ${
                  profile.domesticStressScore > 40 ? 'text-rose-400' : 'text-zinc-300'
                }`}>{profile.domesticStressScore}%</span>
              </div>
              <div className="p-2 bg-zinc-950/60 border border-zinc-900/65 rounded text-center">
                <span className="text-[8px] text-zinc-500 block uppercase">VULNERABILITY</span>
                <span className={`text-[15px] font-bold block mt-1 ${
                  profile.vulnerabilityScore > 50 ? 'text-rose-400' : 'text-emerald-400'
                }`}>{profile.vulnerabilityScore}%</span>
              </div>
              <div className="p-2 bg-zinc-950/60 border border-zinc-900/65 rounded text-center">
                <span className="text-[8px] text-zinc-500 block uppercase">RESILIENCE</span>
                <span className="text-[15px] font-bold block text-sky-400 mt-1">{profile.resilienceScore}%</span>
              </div>
            </div>

            {/* Seven-Source Abstract mix */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wide border-b border-zinc-900 pb-1">
                <span>7-Source Capacity Balance</span>
                <span>(Net Gen / Demand)</span>
              </div>

              <div className="space-y-2.5">
                {(Object.keys(profile.sourceStates) as EnergySourceType[]).map((src) => {
                  const s = profile.sourceStates[src];
                  const info = SOURCE_INFO[src];
                  const Icon = info.icon;
                  const ratio = s.domesticConsumption > 0 ? (s.domesticProduction / s.domesticConsumption) : 1;
                  
                  return (
                    <div key={src} className="space-y-1 group">
                      <div className="flex justify-between items-center text-[10.5px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3 h-3 ${info.color}`} />
                          <span className="capitalize font-bold text-zinc-300">{src}</span>
                        </div>
                        <span className="text-zinc-500 text-[10px]">
                          {s.domesticProduction} / {s.domesticConsumption} Mtoe
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-900/80 overflow-hidden flex">
                        <div 
                          className={`h-full ${
                            ratio >= 1 
                              ? 'bg-emerald-500' 
                              : ratio >= 0.6 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        />
                      </div>

                      {/* hover hint */}
                      <span className="hidden group-hover:block text-[9px] text-zinc-500 font-mono transition-all leading-normal pt-0.5">
                        {info.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* active import supplier connections */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-zinc-400 font-bold block uppercase tracking-wide border-b border-zinc-900 pb-1">
                External Dependency Supply Chains
              </span>

              {profile.dependencies.length === 0 ? (
                <div className="p-3 bg-zinc-950/10 border border-dashed border-zinc-900 text-center text-zinc-500 text-[9.5px] font-mono leading-relaxed rounded">
                  {getCountryName(profile.countryId)} operates on a complete domestic self-sufficient matrix. No active imports required.
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.dependencies.map((dep, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 bg-zinc-950/60 rounded border font-mono text-[10.5px] space-y-1.5 ${
                        dep.isDisrupted ? 'border-rose-900/50 bg-rose-950/5' : 'border-zinc-900'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{getCountryFlag(dep.supplierCountryId)}</span>
                          <span className="font-bold text-zinc-300">{dep.supplierCountryId} ({dep.sourceType.toUpperCase()})</span>
                        </div>
                        <span className={`text-[9px] font-bold p-0.5 px-1.5 rounded uppercase leading-none ${
                          dep.isDisrupted ? 'bg-rose-950 text-rose-400 border border-rose-900/60' : 'bg-zinc-900 text-teal-400'
                        }`}>
                          {dep.isDisrupted ? `Disrupted (${dep.actualDeliveryPct}%)` : 'Operational'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500">
                        <div>
                          <span>Route: <b className="font-bold text-zinc-400 capitalize">{dep.routeType}</b></span>
                        </div>
                        <div className="text-right">
                          <span>Volume: <b className="font-bold text-zinc-400">{dep.volumeMtoe} Mtoe</b></span>
                        </div>
                        <div>
                          <span>Chokepoint: <b className="font-bold text-rose-400">{dep.routeChokepointRisk}% Risk</b></span>
                        </div>
                        <div className="text-right">
                          <span>Reroute factor: <b className="font-bold text-emerald-400">{dep.rerouteFlexibility}%</b></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* STATE MITIGATION POLICY ACTIONS */}
          <div className="mt-8 pt-4 border-t border-zinc-900 space-y-2">
            <span className="font-mono text-[9px] text-zinc-500 font-bold block uppercase tracking-wide">
              INTEGRITY MITIGATION PROTOCOLS (COERCIONAL SHIELDS)
            </span>

            <div className="space-y-2">
              <button
                onClick={() => {
                  bufferStrategicReserves(profile.countryId, 15);
                  useWorldStore.getState().updateCountry(profile.countryId, (c) => {
                    // Cost $5.0 B in treasury cash for the reserve purchases
                    c.economic.treasuryCashB = Math.max(1.0, c.economic.treasuryCashB - 5.0);
                  });
                  useWorldStore.getState().addGlobalEvent(
                    `🛡️ DEFENSE BUFFER: ${profile.countryId} spent $5.0B to purchasing oil reserves adding +15 Days of SPR inventory.`,
                    'INFO'
                  );
                }}
                className="w-full flex items-center justify-between p-2 bg-zinc-900 hover:bg-zinc-800 text-[10.5px] font-mono text-zinc-300 rounded border border-zinc-800 transition-colors"
                id="mitigation_petro_buffer"
              >
                <span>🛡️ BUFFER STRATEGIC RESERVES (-$5.0B)</span>
                <span>+15 SPR Days</span>
              </button>

              <button
                onClick={() => {
                  // Direct adaptation momentum increase
                  useEnergyStore.setState(produce((draft) => {
                    const prof = draft.profiles[profile.countryId];
                    if (prof) {
                      prof.recoveryAdaptationMomentum = Math.min(100, prof.recoveryAdaptationMomentum + 10);
                    }
                  }));
                  useWorldStore.getState().updateCountry(profile.countryId, (c) => {
                    // Costs $8.0 B
                    c.economic.treasuryCashB = Math.max(1.0, c.economic.treasuryCashB - 8.0);
                  });
                  useWorldStore.getState().addGlobalEvent(
                    `🌱 GREEN ADAPTATION: ${profile.countryId} allocated $8.0B to fast-track municipal wind/solar storage infrastructure.`,
                    'INFO'
                  );
                }}
                className="w-full flex items-center justify-between p-2 bg-zinc-900 hover:bg-zinc-800 text-[10.5px] font-mono text-zinc-300 rounded border border-zinc-800 transition-colors"
                id="mitigation_green_adv"
              >
                <span>🌱 ACCELERATE SOLAR/WIND (-$8.0B)</span>
                <span>+10 Adaptation</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
    </PanelFxShell>
  );
}
