import React, { useMemo, useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFoundryStore } from '../../store/foundryStore';
import { CommodityType, RouteStatus, ChokepointStatus, CommodityFlow, Chokepoint, SupplyDependencyRecord } from '../../types/foundry';
import { 
  Anchor, 
  Droplet, 
  Flame, 
  Cpu, 
  Wheat, 
  Activity, 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  Zap, 
  Globe, 
  CornerDownRight, 
  ArrowRight, 
  Layers, 
  Lock, 
  Unlock, 
  Eye, 
  X,
  Plus,
  Compass,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { audio } from '../../utils/audio';

// Dynamic Mercator-style linear scaling of geo-centroids into 950x450 canvas
const getProportionateCoords = (id: string, width = 940, height = 370) => {
  const centroids: Record<string, [number, number]> = {
    US: [-95.7, 37.1],
    RU: [105.3, 58.5], // Russia pulled slightly south to look better on standard view bounds
    CN: [104.2, 35.8],
    JP: [138.2, 36.2],
    DE: [10.4, 51.1],
    FR: [2.2, 46.2],
    GB: [-3.4, 55.4],
    TR: [35.2, 38.9],
    SA: [45.1, 23.9],
    IR: [53.7, 32.4],
    IL: [34.8, 31.0],
    EG: [30.8, 26.8],
    IN: [78.9, 20.6],
    PK: [69.3, 30.4],
    UA: [31.1, 48.4],
    BR: [-51.9, -14.2],
    TW: [120.5, 23.5], // Expanded offsets to highlight taiwan separate from chinamainland
    KR: [127.8, 35.9],
    AU: [133.8, -25.3],
    ZA: [22.9, -30.5]
  };

  const coords = centroids[id] || [0, 0];
  const lng = coords[0];
  const lat = coords[1];

  // Map ranges to wrap world inside a tactile widescreen viewport bounds:
  // Longitude range: -115 to +155 (delta: 270)
  // Latitude range: -35 to +68 (delta: 103)
  const x = ((lng + 115) / 270) * width;
  const y = ((68 - lat) / 103) * height;

  return { x: Math.max(15, Math.min(width - 15, x)), y: Math.max(15, Math.min(height - 15, y)) };
};

export default function FoundryPanel() {
  const { 
    flows, 
    chokepoints, 
    dependencies, 
    disruptionSignals, 
    changeLog,
    selectedFlowId,
    selectedChokepointId,
    activeCommodity,
    selectedCountryId,
    minVolumeThreshold,
    showOnlyStressed,
    setSelectedFlowId,
    setSelectedChokepointId,
    setActiveCommodity,
    setSelectedCountryId,
    setFilters,
    calculatePreActionImpact,
    executeCoerciveAction,
    toggleChokepointStatus
  } = useFoundryStore();

  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId) || 'US';

  // State for Pre-action Coercive move sandbox
  const [sandboxAction, setSandboxAction] = useState<'EMBARGO' | 'SANCTION' | 'INTERDICTION' | 'ROUTE_CLOSURE'>('EMBARGO');
  const [sandboxTarget, setSandboxTarget] = useState<string>('RU');
  const [sandboxCommodities, setSandboxCommodities] = useState<CommodityType[]>(['oil']);
  const [activePreview, setActivePreview] = useState<any | null>(null);

  // Filtered flows mapping
  const filteredFlows = useMemo(() => {
    return flows.filter(flow => {
      // 1. Commodity type filter
      if (activeCommodity !== 'ALL' && flow.commodityType !== activeCommodity) return false;
      // 2. Volume filter
      if (flow.volumeScore < minVolumeThreshold) return false;
      // 3. Stressed filter
      if (showOnlyStressed && flow.routeStatus === 'STABLE') return false;
      // 4. Country relation filter
      if (selectedCountryId && flow.sourceCountryId !== selectedCountryId && flow.destinationCountryId !== selectedCountryId) return false;
      return true;
    });
  }, [flows, activeCommodity, minVolumeThreshold, showOnlyStressed, selectedCountryId]);

  // Derived selected profile items
  const selectedFlowData = useMemo(() => {
    if (!selectedFlowId) return null;
    return flows.find(f => f.id === selectedFlowId) || null;
  }, [selectedFlowId, flows]);

  const selectedChokepointData = useMemo(() => {
    if (!selectedChokepointId) return null;
    return chokepoints.find(c => c.id === selectedChokepointId) || null;
  }, [selectedChokepointId, chokepoints]);

  const selectedCountryData = useMemo(() => {
    if (!selectedCountryId) return null;
    return countries[selectedCountryId] || null;
  }, [selectedCountryId, countries]);

  // Global aggregate KPIs
  const averageChokepointExposure = useMemo(() => {
    if (chokepoints.length === 0) return 0;
    return Math.round(chokepoints.reduce((sum, c) => sum + c.exposureScore, 0) / chokepoints.length);
  }, [chokepoints]);

  const activeStressedFlowsCount = useMemo(() => {
    return flows.filter(f => f.routeStatus !== 'STABLE').length;
  }, [flows]);

  const handleCountryClick = (id: string) => {
    audio.sfxKeyClick();
    if (selectedCountryId === id) {
      setSelectedCountryId(null);
    } else {
      setSelectedCountryId(id);
      setSelectedFlowId(null);
      setSelectedChokepointId(null);
    }
  };

  const handleFlowClick = (id: string) => {
    audio.sfxKeyClick();
    if (selectedFlowId === id) {
      setSelectedFlowId(null);
    } else {
      setSelectedFlowId(id);
      setSelectedChokepointId(null);
      setSelectedCountryId(null);
    }
  };

  const handleChokepointClick = (id: string) => {
    audio.sfxKeyClick();
    if (selectedChokepointId === id) {
      setSelectedChokepointId(null);
    } else {
      setSelectedChokepointId(id);
      setSelectedFlowId(null);
      setSelectedCountryId(null);
    }
  };

  const listCommodityColor = (com: CommodityType) => {
    switch (com) {
      case 'oil': return '#3182ce'; // Blue
      case 'gas': return '#9f7aea'; // Purple
      case 'semiconductors': return '#00e5ff'; // Cyan
      case 'food': return '#ecc94b'; // Gold
      case 'rareearths': return '#48bb78'; // Green
      case 'strategic': return '#ed8936'; // Orange
    }
  };

  const listCommodityIcon = (com: CommodityType) => {
    switch (com) {
      case 'oil': return <Droplet className="w-3.5 h-3.5 text-blue-400" />;
      case 'gas': return <Flame className="w-3.5 h-3.5 text-purple-400" />;
      case 'semiconductors': return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case 'food': return <Wheat className="w-3.5 h-3.5 text-amber-400" />;
      case 'rareearths': return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'strategic': return <Zap className="w-3.5 h-3.5 text-orange-400" />;
    }
  };

  // Generate impact preview calculation inside state context
  const handleGeneratePreview = () => {
    audio.sfxKeyClick();
    const result = calculatePreActionImpact(sandboxAction, playerCountryId, sandboxTarget, sandboxCommodities);
    setActivePreview(result);
  };

  // Execute coercive block and dispatch events
  const handleExecuteAction = () => {
    if (!activePreview) return;
    audio.sfxKeyClick();
    executeCoerciveAction(sandboxAction, playerCountryId, sandboxTarget, sandboxCommodities);
    setActivePreview(null);
  };

  return (
    <PanelFxShell panelId="military_oob" relevantFxTypes={['WAR_DECLARED','MISSILE_LAUNCH','DEFCON_ESCALATION','ALLIANCE_FORMED','ALLIANCE_BROKEN']}>
      <div id="foundry-supply-chain-console" className="flex flex-col h-full bg-[#030703]/95 text-gray-200 p-2 font-mono text-[10px] leading-relaxed select-none">
      
      {/* 1. TOP STATS telemetry header */}
      <div id="foundry-kpi-bar" className="flex flex-wrap justify-between items-center border-b border-[#143c14] pb-2 mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#00ff44]/10 border border-[#00ff44]/30 rounded">
            <Anchor className="w-5 h-5 text-[#00ff44]" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-widest text-[#00ff44]">FOUNDRY SUPPLY CHAIN INTELLIGENCE (L1)</h2>
            <p className="text-[8px] text-gray-400">PHYSICAL AND ECONOMIC FLUID CHOKEPOINTS, CARGO INTERDICTIONS, & STRATEGIC DEP. FORECASTS</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0a150a] border border-[#143c14] px-3 py-1 rounded text-[8px] tracking-wider">
          <div className="flex flex-col">
            <span className="text-gray-400 font-light">CHOKEPOINT ALIVE STATUS</span>
            <span className="text-xs font-bold text-[#00ff44]">{100 - averageChokepointExposure}% SECURE</span>
          </div>
          <div className="w-[1px] h-6 bg-[#143c14]" />
          <div className="flex flex-col">
            <span className="text-gray-400 font-light">BLOCKED/STRESSED CORES</span>
            <span className={`text-xs font-bold ${activeStressedFlowsCount > 0 ? 'text-amber-500 animate-pulse' : 'text-[#00ff44]'}`}>
              {activeStressedFlowsCount} LANES
            </span>
          </div>
          <div className="w-[1px] h-6 bg-[#143c14]" />
          <div className="flex flex-col">
            <span className="text-gray-400 font-light">GLOBAL ACTIVE SYSTRACE</span>
            <span className="text-xs font-bold text-[#00e5ff]">{disruptionSignals.length} SIGNALS</span>
          </div>
        </div>
      </div>

      {/* 2. MODE SELECTORS AND LENS REGISTERS */}
      <div id="foundry-mode-bar" className="flex flex-wrap gap-2 items-center justify-between mb-2">
        {/* Dynamic Commodity Selector Buttons */}
        <div className="flex flex-wrap gap-1 bg-[#020502] p-1 border border-[#112d11] rounded">
          <button
            onClick={() => { audio.sfxKeyClick(); setActiveCommodity('ALL'); }}
            className={`py-1 px-2 rounded font-sans text-[8px] border cursor-pointer ${
              activeCommodity === 'ALL'
                ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44] shadow-[0_0_6px_rgba(0,255,68,0.1)]'
                : 'bg-transparent border-[#112d11] text-gray-400 hover:border-green-800'
            }`}
          >
            ● BLENDED WORLD FLOWS
          </button>
          
          {([
            { id: 'oil', label: 'CRUDE OIL' },
            { id: 'gas', label: 'PIPE/LNG GAS' },
            { id: 'semiconductors', label: 'SILICON CHIPS' },
            { id: 'food', label: 'GRAIN FOOD' },
            { id: 'rareearths', label: 'RARE EARTHS' },
            { id: 'strategic', label: 'STRATEGIC MATS' }
          ] as { id: CommodityType; label: string }[]).map((com) => {
            const isSelected = activeCommodity === com.id;
            return (
              <button
                key={com.id}
                onClick={() => { audio.sfxKeyClick(); setActiveCommodity(com.id); }}
                className={`py-1 px-2 rounded flex items-center gap-1 font-sans text-[8px] border cursor-pointer ${
                  isSelected
                    ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44] shadow-[0_0_6px_rgba(0,255,68,0.1)]'
                    : 'bg-transparent border-[#112d11] text-gray-400 hover:border-green-800'
                }`}
              >
                {listCommodityIcon(com.id)}
                <span>{com.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sliders and custom filters toggles */}
        <div className="flex flex-wrap items-center gap-2.5 bg-[#020502] border border-[#112d11] px-2 py-1 rounded text-[8px]">
          <div className="flex items-center gap-1.5 font-bold">
            <Sliders className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span className="text-gray-400 uppercase">VOL MIN:</span>
            <input 
              id="volume-filter-slider"
              type="range"
              min="0"
              max="100"
              value={minVolumeThreshold}
              onChange={(e) => setFilters({ minVolumeThreshold: parseInt(e.target.value) })}
              className="accent-[#00ff44] bg-[#112011] h-1 rounded cursor-pointer w-20"
            />
            <span className="text-[#00ff44] w-6 text-right">{minVolumeThreshold}%</span>
          </div>

          <div className="w-[1px] h-4 bg-[#112d11]" />

          <button
            onClick={() => { audio.sfxKeyClick(); setFilters({ showOnlyStressed: !showOnlyStressed }); }}
            className={`px-2 py-0.5 border rounded cursor-pointer ${
              showOnlyStressed 
                ? 'bg-red-950/30 border-red-500/50 text-red-400' 
                : 'border-[#112d11] text-gray-400 hover:border-green-800'
            }`}
          >
            SHOW ONLY COMMODITY SHOCKS
          </button>
        </div>
      </div>

      {/* 3. CORE ADJOINING WORKSPACE (SCHEMATIC MAP & ACTION DRILLDOWNS) */}
      <div id="foundry-workspace-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-[300px]">
        
        {/* A. LEFT AREA: SVG COMMODITY ROUTE MAP VISUAL SYSTEM */}
        <div id="foundry-map-column" className="lg:col-span-8 border border-[#112d11] bg-[#020402] rounded relative overflow-hidden flex flex-col p-1">
          <div className="absolute top-1 left-2 z-10 text-[7.5px] uppercase font-bold text-[#00ff44]/75 tracking-wider bg-black/60 px-1.5 py-0.5 rounded border border-[#112d11] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>GEO-SCHEMATIC SUPPLY CHAINS GRID — INTERACT FOR DOSSIERS</span>
          </div>

          <div id="foundry-custom-svg-canvas" className="w-full flex-1 min-h-[260px] relative mt-4 bg-radial-cyber">
            <svg 
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 940 370"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="cyber-marine" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0a1d0d" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#010301" stopOpacity="1" />
                </radialGradient>
              </defs>

              <rect width="940" height="370" fill="url(#cyber-marine)" />

              {/* Grid matrix overlay */}
              <g stroke="#1a4c1a" strokeWidth="0.4" strokeDasharray="2,6" opacity="0.35">
                {Array.from({ length: 19 }).map((_, idx) => (
                  <line key={`fv-${idx}`} x1={idx * 50} y1="0" x2={idx * 50} y2="370" />
                ))}
                {Array.from({ length: 8 }).map((_, idx) => (
                  <line key={`fh-${idx}`} x1="0" y1={idx * 50} x2="940" y2={idx * 50} />
                ))}
              </g>

              {/* RENDER ACTIVE ROUTE FLOWS */}
              {filteredFlows.map((flow) => {
                const start = getProportionateCoords(flow.sourceCountryId);
                const end = getProportionateCoords(flow.destinationCountryId);
                const isFlowSelected = selectedFlowId === flow.id;
                
                // Opacity logic depending on selectors
                let opacity = 0.45;
                if (selectedFlowId) {
                  opacity = isFlowSelected ? 1.0 : 0.08;
                } else if (selectedCountryId) {
                  const isLinked = flow.sourceCountryId === selectedCountryId || flow.destinationCountryId === selectedCountryId;
                  opacity = isLinked ? 0.9 : 0.08;
                } else if (selectedChokepointId) {
                  const isCrossed = flow.transitChokepointIds.includes(selectedChokepointId);
                  opacity = isCrossed ? 0.9 : 0.08;
                }

                const color = listCommodityColor(flow.commodityType);
                // Map volume scale to stroke thickness range
                const strokeWidth = 1 + (flow.volumeScore / 35);
                const isStressed = flow.routeStatus !== 'STABLE';

                return (
                  <g key={flow.id} className="cursor-pointer" onClick={() => handleFlowClick(flow.id)}>
                    {/* Outer thick clickable buffer */}
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="transparent"
                      strokeWidth="12"
                    />

                    {/* Main flow line */}
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={isStressed ? '4,4' : undefined}
                    />

                    {/* Ping indicators inside stressed lanes */}
                    {isStressed && (
                      <circle
                        cx={(start.x + end.x) / 2}
                        cy={(start.y + end.y) / 2}
                        r="3"
                        fill="#ff2244"
                        className="animate-ping"
                      />
                    )}

                    {/* Highlights border */}
                    {isFlowSelected && (
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#00e5ff"
                        strokeWidth={strokeWidth + 2}
                        strokeOpacity="0.4"
                      />
                    )}
                  </g>
                );
              })}

              {/* RENDER CHOKEPOINTS ON THE OVERLAY */}
              {chokepoints.map((choke) => {
                const pos = choke.coordinates;
                const isSelected = selectedChokepointId === choke.id;
                
                let chokeOpacity = 1.0;
                if (selectedChokepointId) {
                  chokeOpacity = isSelected ? 1.0 : 0.25;
                } else if (selectedFlowId) {
                  const wasCrossed = selectedFlowData?.transitChokepointIds.includes(choke.id);
                  chokeOpacity = wasCrossed ? 1.0 : 0.15;
                }

                // Choke statuses color
                const color = 
                  choke.currentDisruptionStatus === 'BLOCKED' ? '#ef4444' :
                  choke.currentDisruptionStatus === 'CONGESTED' ? '#f59e0b' :
                  '#10b981';

                return (
                  <g 
                    key={choke.id} 
                    className="cursor-pointer" 
                    onClick={() => handleChokepointClick(choke.id)}
                    opacity={chokeOpacity}
                  >
                    {/* Ring indicator radar loops */}
                    <circle
                      cx={pos.x * 9.4} // Scale visual offsets nicely to fit box dimensions 0-100 basis
                      cy={pos.y * 3.7}
                      r={isSelected ? 11 : 7}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.2"
                      className="animate-pulse"
                    />

                    <circle
                      cx={pos.x * 9.4}
                      cy={pos.y * 3.7}
                      r="4"
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />

                    <text
                      x={pos.x * 9.4}
                      y={(pos.y * 3.7) - 10}
                      fill={isSelected ? '#00e5ff' : '#00ff44'}
                      fontSize="7"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {choke.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* SYSTEM COUNTRY CENTROIDS FOR DIRECT CLICKS */}
              {Object.keys(countries)
                .map(id => {
                  const pos = getProportionateCoords(id);
                  const isSelected = selectedCountryId === id;
                  const isPlayer = id === playerCountryId;
                  
                  let nodeOpacity = 0.85;
                  if (selectedCountryId) {
                    nodeOpacity = isSelected ? 1.0 : 0.35;
                  }

                  return (
                    <g 
                      key={id} 
                      className="cursor-pointer" 
                      onClick={() => handleCountryClick(id)}
                      opacity={nodeOpacity}
                    >
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="6"
                        fill={isPlayer ? '#0c350d' : '#020502'}
                        stroke={isSelected ? '#00e5ff' : isPlayer ? '#00ff44' : '#143814'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 11}
                        fill={isSelected ? '#00e5ff' : isPlayer ? '#00ff44' : '#4a5d4a'}
                        fontSize="7"
                        textAnchor="middle"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* Compact Legend Overlay */}
            <div className="absolute bottom-2 left-2 z-10 bg-black/90 p-1.5 rounded border border-[#112d11] grid grid-cols-3 gap-x-2.5 gap-y-1 text-[6.5px] text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('oil') }} />
                <span>OIL CORP</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('gas') }} />
                <span>LNG/GAS</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('semiconductors') }} />
                <span>SILICON</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('food') }} />
                <span>GRAINS</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('rareearths') }} />
                <span>RARE EARTH</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: listCommodityColor('strategic') }} />
                <span>STRATEGIC</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. RIGHT AREA: DETAIL PROFILE & COERCIVE SANDBOX PANEL */}
        <div id="foundry-drilldown-column" className="lg:col-span-4 flex flex-col gap-2">
          
          {/* PROFILE CARD */}
          <div className="border border-[#112d11] bg-[#020502] p-2 rounded flex flex-col justify-between overflow-y-auto max-h-[190px] scrollbar-thin">
            {selectedFlowData ? (
              <div id="selected-flow-card" className="flex flex-col gap-1.5 text-[8px]">
                <div className="flex justify-between items-start border-b border-[#112d11] pb-1">
                  <div>
                    <span className="text-[6.5px] text-[#00e5ff] uppercase font-bold">FLOW LEDGER ENTRY</span>
                    <h4 className="text-xs font-black text-white uppercase flex items-center gap-1 mt-0.5">
                      <span>{selectedFlowData.sourceCountryId}</span>
                      <ArrowRight className="w-3 h-3 text-[#00ff44]" />
                      <span>{selectedFlowData.destinationCountryId}</span>
                    </h4>
                  </div>
                  <button 
                    onClick={() => { audio.sfxKeyClick(); setSelectedFlowId(null); }}
                    className="text-gray-400 hover:text-white border border-[#112d11] px-1 py-0.2 rounded text-[6.5px]"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[7.5px] text-gray-300">
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded">
                    <span className="text-gray-400 block font-light">COMMODITY</span>
                    <span className="font-bold text-[#00ff44] uppercase flex items-center gap-0.5">
                      {listCommodityIcon(selectedFlowData.commodityType)}
                      {selectedFlowData.commodityType}
                    </span>
                  </div>
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded">
                    <span className="text-gray-400 block font-light">ROUTE STATUS</span>
                    <span className={`font-bold ${selectedFlowData.routeStatus === 'STABLE' ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>
                      {selectedFlowData.routeStatus}
                    </span>
                  </div>
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded">
                    <span className="text-gray-400 block font-light">VOLUME RATING</span>
                    <span className="font-bold text-white">{selectedFlowData.volumeScore}/100</span>
                  </div>
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded">
                    <span className="text-gray-400 block font-light">SUBSTITUTABILITY</span>
                    <span className="font-bold text-white">{selectedFlowData.substitutability}/100</span>
                  </div>
                </div>

                <div className="bg-[#050c05] border border-[#112d11] p-1 rounded text-[7.5px]">
                  <span className="text-gray-400 uppercase font-bold block mb-0.5">Downstream Dependencies:</span>
                  <p className="text-gray-200 text-[6.8px] leading-relaxed">{selectedFlowData.dependenciesSummary}</p>
                </div>

                {selectedFlowData.transitChokepointIds.length > 0 && (
                  <div className="text-[7px] text-gray-400 flex items-center gap-1 font-bold">
                    <span>CROSSES CHOKEPOINTS:</span>
                    {selectedFlowData.transitChokepointIds.map(cId => (
                      <span key={cId} className="px-1 text-[#00e5ff] border border-[#112d11] bg-black/40 rounded">
                        {cId.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedChokepointData ? (
              <div id="selected-choke-card" className="flex flex-col gap-1.5 text-[8px]">
                <div className="flex justify-between items-start border-b border-[#112d11] pb-1">
                  <div>
                    <span className="text-[6.5px] text-red-400 uppercase font-bold">TACTICAL BOTTLENECK WATCH</span>
                    <h4 className="text-xs font-black text-white uppercase mt-0.5">{selectedChokepointData.name}</h4>
                  </div>
                  <button 
                    onClick={() => { audio.sfxKeyClick(); setSelectedChokepointId(null); }}
                    className="text-gray-400 hover:text-white border border-[#112d11] px-1 py-0.2 rounded text-[6.5px]"
                  >
                    CLOSE
                  </button>
                </div>

                <p className="text-gray-300 text-[7px] leading-tight mb-1">{selectedChokepointData.strategicSummary}</p>

                <div className="grid grid-cols-2 gap-1 text-[7.5px] items-center">
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded">
                    <span className="text-gray-400 block">THROUGHPUT RAT.</span>
                    <span className="font-bold text-amber-400">{selectedChokepointData.throughputImportance}%</span>
                  </div>
                  <div className="bg-[#0b120b] border border-[#112711] p-1 rounded flex justify-between items-center">
                    <div>
                      <span className="text-gray-400 block">STATUS</span>
                      <span className={`font-bold ${
                        selectedChokepointData.currentDisruptionStatus === 'SECURE' ? 'text-emerald-400' : 'text-red-500 font-black'
                      }`}>
                        {selectedChokepointData.currentDisruptionStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle Action testing button */}
                <button
                  onClick={() => { audio.sfxKeyClick(); toggleChokepointStatus(selectedChokepointData.id); }}
                  className="bg-[#220c0c] border border-red-500/40 hover:border-red-500 text-red-400 py-1 rounded text-[7.5px] font-bold cursor-pointer text-center"
                >
                  ⚠ SIMULATE DYNAMIC CRISIS STATUS FLIP
                </button>
              </div>
            ) : selectedCountryId ? (
              <div id="selected-country-corridor-card" className="flex flex-col gap-1.5 text-[8px]">
                <div className="flex justify-between items-start border-b border-[#112d11] pb-1">
                  <div>
                    <span className="text-[6.5px] text-[#00ff44] uppercase font-bold">SOVEREIGN EXP. EXPOSURES</span>
                    <h4 className="text-xs font-black text-white uppercase mt-0.5">
                      {selectedCountryData ? selectedCountryData.name : selectedCountryId} [{selectedCountryId}]
                    </h4>
                  </div>
                  <button 
                    onClick={() => { audio.sfxKeyClick(); setSelectedCountryId(null); }}
                    className="text-gray-400 hover:text-white border border-[#112d11] px-1 py-0.2 rounded text-[6.5px]"
                  >
                    DISMISS
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto scrollbar-thin pr-1 text-[7px]">
                  <span className="text-gray-400 font-bold block">REGISTERED EXPOSURE METRICS:</span>
                  {dependencies.filter(d => d.countryId === selectedCountryId).length > 0 ? (
                    dependencies.filter(d => d.countryId === selectedCountryId).map((dep, dIdx) => (
                      <div key={dIdx} className="bg-black/50 p-1 rounded border border-[#112711] flex flex-col gap-0.5">
                        <div className="flex justify-between font-bold text-[#00ff44]">
                          <span className="uppercase flex items-center gap-0.5">
                            {listCommodityIcon(dep.commodityType)} {dep.commodityType}
                          </span>
                          <span>{dep.dependenceRatio}% DEP</span>
                        </div>
                        <div className="text-gray-400 flex justify-between">
                          <span>PRIMARY PARTNER: {dep.primarySourceCountryId}</span>
                          <span>CHOKE RISK: {dep.chokepointExposureScore}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 italic uppercase">No high level single-source exposures tracked for this partner node.</span>
                  )}
                </div>
              </div>
            ) : (
              <div id="foundry-general-dossier" className="flex flex-col gap-1.5 text-[8px]">
                <div className="flex items-center gap-1 border-b border-[#112d11] pb-1">
                  <Globe className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span className="font-black text-white uppercase tracking-wider">FOUNDRY DIRECTIVES</span>
                </div>
                <p className="text-gray-300 leading-snug text-[7.5px]">
                  Physical commodities govern sovereign security. Click a path, chokepoint, or state on the canvas above to examine dynamic logistics profiles.
                </p>
                <div className="bg-[#050c05] p-1.5 rounded border border-[#112d11] flex flex-col gap-0.5 text-[7px] text-[#00ff44]">
                  <span>● DRILLDOWNS EXPOSE UPSTREAM SATELLITE DEPENDENCIES</span>
                  <span>● Crisises on chokepoints trigger reroutings</span>
                  <span>● Use variables below to simulate embargoes & sanctions</span>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC SHIELD PREVIEW SANDBOX */}
          <div id="foundry-action-sandbox" className="border border-[#113d11] bg-[#020502] p-2.5 rounded flex flex-col gap-1.8">
            <div className="flex items-center justify-between border-b border-[#113d11] pb-1">
              <div className="flex items-center gap-1 font-bold text-red-400 text-xs tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>COERCIVE DISRUPTION SANDBOX</span>
              </div>
              <span className="text-[6.5px] bg-[#220a0a] border border-red-500/20 text-red-400 font-bold px-1 rounded">PRE-ACTION PREDICTIONS</span>
            </div>

            {/* Sandbox input controls */}
            <div className="flex flex-col gap-1.5 text-[7.5px] my-1">
              
              {/* Select Actor/Coercive tactic */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-gray-400 uppercase w-20 shrink-0">SELECT TACTIC:</span>
                <select
                  value={sandboxAction}
                  onChange={(e) => setSandboxAction(e.target.value as any)}
                  className="bg-black border border-[#143414] text-[#00ff44] rounded py-0.5 px-1 flex-1 text-[7.5px] cursor-pointer"
                >
                  <option value="EMBARGO">CRITICAL EMBARGO</option>
                  <option value="SANCTION">ECONOMIC SANCTION</option>
                  <option value="INTERDICTION">TACTICAL INTERDICTION</option>
                  <option value="ROUTE_CLOSURE">ROUTE CLOSURE</option>
                </select>
              </div>

              {/* Select Target Sovereign */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-gray-400 uppercase w-20 shrink-0">TARGET NATION:</span>
                <select
                  value={sandboxTarget}
                  onChange={(e) => setSandboxTarget(e.target.value)}
                  className="bg-black border border-[#143414] text-[#00ff44] rounded py-0.5 px-1 flex-1 text-[7.5px] cursor-pointer"
                >
                  {Object.keys(countries)
                    .filter(id => id !== playerCountryId)
                    .map(id => (
                      <option key={id} value={id}>{id} — {countries[id]?.name || id}</option>
                    ))}
                </select>
              </div>

              {/* Select Target Commodities */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-gray-400 uppercase w-20 shrink-0">SECTOR CORES:</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {(['oil', 'gas', 'semiconductors', 'food', 'rareearths', 'strategic'] as CommodityType[]).map(com => {
                    const isSelected = sandboxCommodities.includes(com);
                    return (
                      <button
                        key={com}
                        onClick={() => {
                          audio.sfxKeyClick();
                          if (isSelected) {
                            setSandboxCommodities(sandboxCommodities.filter(c => c !== com));
                          } else {
                            setSandboxCommodities([...sandboxCommodities, com]);
                          }
                        }}
                        className={`px-1 rounded-sm border text-[6.5px] uppercase cursor-pointer ${
                          isSelected 
                            ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44]' 
                            : 'border-[#112d11] text-gray-500'
                        }`}
                      >
                        {com}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trigger Prediction button */}
              <button
                onClick={handleGeneratePreview}
                disabled={sandboxCommodities.length === 0}
                className="bg-[#0d2d0d] border border-[#22ff22]/30 hover:border-[#22ff22] text-[#00ff44] py-1.2 rounded text-[8px] font-bold cursor-pointer text-center disabled:opacity-50 transition-all uppercase"
              >
                PROMPT IMPACT ANALYSIS SIMULATION
              </button>
            </div>

            {/* PRE-ACTION PREVIEW CARD DRAWING */}
            {activePreview ? (
              <div className="bg-[#120404]/70 border border-red-500/30 p-2 rounded flex flex-col gap-1.5 text-[7.5px] animate-fade-in">
                <div className="flex justify-between items-center border-b border-red-500/20 pb-1">
                  <span className="font-bold text-red-400 flex items-center gap-1 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>PREDICTED ESCALATION FALLOUT</span>
                  </span>
                  <span className="text-[6.5px] font-black bg-red-950/20 text-red-500 px-1 border border-red-500/30 rounded">
                    {activePreview.disruptionSeverity}% SHOCK
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-gray-400 font-bold block">1ST-ORDER ECONOMIC IMPACT:</span>
                    <p className="text-gray-200 text-[6.8px] leading-relaxed">{activePreview.firstOrderEconomicImpact}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block">1ST-ORDER LOGISTICAL/MILITARY EFFECT:</span>
                    <p className="text-gray-200 text-[6.8px] leading-relaxed">{activePreview.firstOrderMilitaryImpact}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[6.5px] border-t border-red-500/10 pt-1.5">
                    <div>
                      <span className="text-gray-400 block">ALLIANCE FALLOUT</span>
                      <span className="font-bold text-red-400">{activePreview.diplomaticFalloutRisk} RISK</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">REROUTING DIFFICULTY</span>
                      <span className="font-bold text-white">{activePreview.expectRerouting ? `8 TICKS DELAY` : 'HIGHLY IMPAIRED'}</span>
                    </div>
                  </div>
                </div>

                {/* Final dispatch warning button */}
                <button
                  onClick={handleExecuteAction}
                  className="bg-red-950 border border-red-500 hover:border-red-400 text-red-400 py-1 rounded text-[7.5px] font-bold text-center cursor-pointer transition-all uppercase"
                >
                  ⚠ EXECUTE ACTION AND DISPATCH DISRUPTION ALERTS
                </button>
              </div>
            ) : (
              <div className="text-center text-[7px] text-gray-500 uppercase border border-dashed border-[#112d11] py-5 rounded">
                NO ESCALATION PROJECTIONS LAUNCHED. SECURE SCENARIO SELECTED.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. RECENT GLOBAL DISRUPTION EVENTS TIMELINE */}
      <div id="foundry-chrono-timeline" className="mt-2 border border-[#112d11] bg-[#020502] p-2 rounded">
        <div className="flex justify-between items-center border-b border-[#112d11] pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#00ff44]" />
            <span className="font-black text-white uppercase tracking-wider text-[8.5px]">FOUNDRY PHYSICAL ANOMALIES LOGS</span>
          </div>
          <span className="text-[6.5px] text-[#00e5ff] font-bold uppercase tracking-wider">ONLINE SHADOW OBSERVATION POST</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 overflow-y-auto max-h-[60px] scrollbar-thin pr-1 text-[7px]">
          {changeLog.length > 0 ? (
            changeLog.map((record, rIdx) => {
              const isCrit = record.summary.includes('COERCIVE');
              return (
                <div 
                  key={rIdx}
                  className={`p-1.5 rounded border ${
                    isCrit 
                      ? 'bg-red-950/20 border-red-500/25 text-red-300' 
                      : 'bg-[#050c05] border-[#112d11] text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5 font-bold">
                    <span className="text-[#00e5ff]">TICK {record.tick}</span>
                    <span className={`uppercase text-[6px] ${isCrit ? 'text-red-500' : 'text-emerald-500'}`}>
                      {record.type}
                    </span>
                  </div>
                  <p className="line-clamp-2 leading-relaxed">{record.summary}</p>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-2 text-gray-500 uppercase">
              No physical anomalies recorded on dynamic ocean paths or pipelines. Channels remain secure.
            </div>
          )}
        </div>
      </div>

    </div>
    </PanelFxShell>
  );
}
