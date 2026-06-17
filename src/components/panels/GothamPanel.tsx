import React, { useMemo, useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useGothamStore } from '../../store/gothamStore';
import { RelationshipDimension, GraphNode, GraphEdge, ForecastSignal } from '../../types/gotham';
import { 
  Network, 
  Coins, 
  ShieldAlert, 
  EyeOff, 
  Activity, 
  TrendingUp, 
  Info, 
  Compass, 
  Layers, 
  Sliders, 
  Flame, 
  BookOpen, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { audio } from '../../utils/audio';

// Custom coordinate offset modifiers specifically curated for the Gotham sub-network representation mapping
const GOTHAM_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 80, y: 130 },
  GB: { x: 220, y: 90 },
  FR: { x: 250, y: 140 },
  DE: { x: 300, y: 100 },
  TR: { x: 330, y: 190 },
  RU: { x: 440, y: 80 },
  IL: { x: 380, y: 240 },
  PS: { x: 360, y: 280 },
  IR: { x: 460, y: 210 },
  SA: { x: 450, y: 290 },
  EG: { x: 310, y: 310 },
  ZA: { x: 340, y: 440 },
  PK: { x: 570, y: 240 },
  IN: { x: 620, y: 290 },
  AU: { x: 740, y: 420 },
  CN: { x: 720, y: 180 },
  TW: { x: 810, y: 220 },
  KR: { x: 830, y: 130 },
  JP: { x: 860, y: 90 },
  BR: { x: 120, y: 390 }
};

export default function GothamPanel() {
  const { 
    selectedNodeId, 
    setSelectedNodeId, 
    selectedEdgeId, 
    setSelectedEdgeId, 
    activeLens, 
    setActiveLens,
    minTensionThreshold,
    regionalFilter,
    showStrongOnly,
    setFilters,
    synthesizeGraph,
    getRivalryChain,
    getInfluenceChain,
    changeLog
  } = useGothamStore();

  const currentTick = useWorldStore((s) => s.currentTick);
  const worldState = useWorldStore();
  const playerCountryId = usePlayerStore((s) => s.countryId) || 'US';

  // State to filter change annotations inside panel
  const [timelineTab, setTimelineTab] = useState<'ALL' | 'CRITICAL'>('ALL');

  // Recalculate graph coordinates & dimensions using custom synthesized state
  const { nodes, edges } = useMemo(() => {
    return synthesizeGraph();
  }, [currentTick, worldState]);

  // Apply UI Filters to nodes & edges
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (regionalFilter !== 'ALL' && n.region !== regionalFilter) return false;
      return true;
    });
  }, [nodes, regionalFilter]);

  const filteredEdges = useMemo(() => {
    return edges.filter(e => {
      if (e.overallTensionScore < minTensionThreshold) return false;
      if (showStrongOnly) {
        // High core values filter
        const hasHighDimension = 
          e.tradeScore > 75 || 
          e.ideologyScore > 75 || 
          e.militaryLinkScore > 75 || 
          e.covertHostilityScore > 75;
        if (!hasHighDimension) return false;
      }
      
      // Node regional focus matching
      if (regionalFilter !== 'ALL') {
        const sourceNode = nodes.find(n => n.countryId === e.sourceCountryId);
        const targetNode = nodes.find(n => n.countryId === e.targetCountryId);
        if (sourceNode?.region !== regionalFilter && targetNode?.region !== regionalFilter) {
          return false;
        }
      }
      return true;
    });
  }, [edges, minTensionThreshold, showStrongOnly, regionalFilter, nodes]);

  // Selected entities details
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.countryId === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  const selectedEdgeData = useMemo(() => {
    if (!selectedEdgeId) return null;
    return edges.find(e => e.id === selectedEdgeId) || null;
  }, [selectedEdgeId, edges]);

  // Compute overall global health KPIs
  const globalStabilityIndex = Math.round(
    nodes.reduce((sum, n) => sum + (100 - n.graphMetrics.vulnerabilityIndex), 0) / nodes.length
  );
  
  const highRiskHotspotCount = nodes.filter(n => n.graphMetrics.vulnerabilityIndex > 65).length;

  const handleNodeClick = (nodeId: string) => {
    audio.sfxKeyClick();
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null); // Clear edge focus when node is focused
    }
  };

  const handleEdgeClick = (edgeId: string) => {
    audio.sfxKeyClick();
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    } else {
      setSelectedEdgeId(edgeId);
      setSelectedNodeId(null); // Clear node focus
    }
  };

  // Helper returns styled colors matching chosen strategic lens
  const getLensColor = (lens: typeof activeLens, val?: number) => {
    const alpha = val !== undefined ? Math.min(1.0, Math.max(0.2, val / 100)) : 0.8;
    switch (lens) {
      case 'trade': return `rgba(59, 130, 246, ${alpha})`; // Blue
      case 'ideology': return `rgba(168, 85, 247, ${alpha})`; // Purple
      case 'military': return `rgba(16, 185, 129, ${alpha})`; // Emerald Green
      case 'treaty': return `rgba(234, 179, 8, ${alpha})`; // Amber Gold
      case 'hostility': return `rgba(239, 68, 68, ${alpha})`; // Red Hotspots
      default: return `rgba(0, 255, 68, ${alpha})`; // Sovereign Neon Green
    }
  };

  return (
    <PanelFxShell panelId="nation_relationship" relevantFxTypes={['WAR_DECLARED','CEASEFIRE_SIGNED','ALLIANCE_FORMED','ALLIANCE_BROKEN','SANCTIONS_ESCALATION']}>
      <div id="gotham-strategic-analysis-console" className="flex flex-col h-full bg-[#030703]/95 text-gray-200 p-2 font-mono text-[10px] leading-relaxed select-none">
      
      {/* 1. TOP HEADER & TELEMETRY PANEL */}
      <div id="gotham-kpi-bar" className="flex flex-wrap justify-between items-center border-b border-[#143c14] pb-2 mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#00ff44]/10 border border-[#00ff44]/30 rounded">
            <Network className="w-5 h-5 text-[#00ff44] animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-widest text-[#00ff44]">GOTHAM RELATIONSHIP ENGINE v1.2</h2>
            <p className="text-[8px] text-gray-400">STRUCTURAL ALLIANCE ENTANGLEMENTS, TRADE LEVERAGES, & THREAT VECTOR CORRIDORS</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0a150a] border border-[#143c14] px-3 py-1.5 rounded text-[8px] tracking-wider">
          <div className="flex flex-col">
            <span className="text-gray-400">NET STABILITY</span>
            <span className="text-xs font-bold text-[#00ff44]">{globalStabilityIndex}%</span>
          </div>
          <div className="w-[1px] h-6 bg-[#143c14]" />
          <div className="flex flex-col">
            <span className="text-gray-400">CRITICAL FLASHPONS</span>
            <span className="text-xs font-bold text-red-500">{highRiskHotspotCount} NODES</span>
          </div>
          <div className="w-[1px] h-6 bg-[#143c14]" />
          <div className="flex flex-col">
            <span className="text-gray-400">ACTIVE TICK</span>
            <span className="text-xs font-bold font-mono text-[#00e5ff]">{currentTick}T</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN LENS CONTROL BAR */}
      <div id="gotham-selectors-grid" className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
        
        {/* Dimension Lenses Selector */}
        <div className="md:col-span-8 flex flex-wrap gap-1 bg-[#020502] p-1 border border-[#112d11] rounded">
          {[
            { id: 'blended', label: 'BLENDED WEB', icon: Layers },
            { id: 'trade', label: 'TRADE INFLOWS', icon: Coins },
            { id: 'ideology', label: 'IDEOLOGY TIES', icon: Compass },
            { id: 'military', label: 'DEFENSE LINKS', icon: ShieldCheck },
            { id: 'treaty', label: 'TREATY METRICS', icon: BookOpen },
            { id: 'hostility', label: 'SHADOW CLASHES', icon: Flame },
          ].map((lens) => {
            const Icon = lens.icon;
            const isSelected = activeLens === lens.id;
            return (
              <button
                key={lens.id}
                id={`lens-btn-${lens.id}`}
                onClick={() => { audio.sfxKeyClick(); setActiveLens(lens.id as any); }}
                className={`py-1 px-2.5 rounded flex items-center gap-1.5 transition-all text-[8.5px] cursor-pointer border ${
                  isSelected 
                    ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.1)]' 
                    : 'bg-transparent border-[#112d11] hover:border-green-800 text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lens.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Filters Configuration */}
        <div className="md:col-span-4 flex items-center justify-between gap-2 bg-[#020502] px-2.5 py-1 border border-[#112d11] rounded text-[8px]">
          <div className="flex items-center gap-2 w-full">
            <Sliders className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
            <span className="text-gray-400 shrink-0">MIN TENSION:</span>
            <input 
              id="gotham-tension-slider"
              type="range" 
              min="0" 
              max="100" 
              value={minTensionThreshold}
              onChange={(e) => setFilters({ minTensionThreshold: parseInt(e.target.value) })}
              className="w-full accent-[#00ff44] bg-[#112011] h-1 rounded cursor-pointer"
            />
            <span className="font-bold text-[#00ff44] w-6 text-right shrink-0">{minTensionThreshold}%</span>
          </div>

          <div className="flex items-center gap-1">
            <select
              id="gotham-region-dropdown"
              value={regionalFilter}
              onChange={(e) => setFilters({ regionalFilter: e.target.value as any })}
              className="bg-black border border-[#112d11] text-[#00ff44] py-0.5 px-1 rounded text-[8px] cursor-pointer"
            >
              <option value="ALL">ALL REGIONS</option>
              <option value="Middle East">MID-EAST</option>
              <option value="Asia">ASIA</option>
              <option value="Europe">EUROPE</option>
              <option value="North America">N. AMERICA</option>
              <option value="Africa">AFRICA</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. CORE ADJOINING WORKSPACE (GRAPH CANVAS & SIDEBAR DOSSIER) */}
      <div id="gotham-workspace-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-[300px]">
        
        {/* A. LEFT COLUMN: GRAPH INTERACTIVE VISUALIZER */}
        <div id="gotham-graph-column" className="lg:col-span-7 border border-[#112d11] bg-[#020402] rounded relative overflow-hidden flex flex-col p-1">
          <div className="absolute top-1 left-2 z-10 text-[7.5px] uppercase font-semibold text-[#00ff44]/75 tracking-wider bg-black/60 px-1.5 py-0.5 rounded border border-[#112d11] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#10b981]" />
            <span>GEO-CONSTELATION GRAPH LAYOUT — INTERACT TO TRACE REASONINGS</span>
          </div>

          {/* SVG Canvas Area */}
          <div id="gotham-svg-canvas" className="w-full flex-1 min-h-[250px] relative mt-4 bg-radial-cyber">
            <svg 
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 950 480"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <radialGradient id="cyber-bg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0c1d0c" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#020402" stopOpacity="1" />
                </radialGradient>
                {/* Marker Arrow for Directional Dependency */}
                <marker
                  id="arrow-dependency"
                  viewBox="0 0 10 10"
                  refX="33"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#00e5ff" />
                </marker>
                <marker
                  id="arrow-hostility"
                  viewBox="0 0 10 10"
                  refX="33"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff2244" />
                </marker>
              </defs>

              <rect width="950" height="480" fill="url(#cyber-bg)" />

              {/* Grid Background */}
              <g stroke="#163816" strokeWidth="0.4" strokeDasharray="3,8" opacity="0.3">
                {Array.from({ length: 19 }).map((_, idx) => (
                  <line key={`v-${idx}`} x1={idx * 50} y1="0" x2={idx * 50} y2="480" />
                ))}
                {Array.from({ length: 10 }).map((_, idx) => (
                  <line key={`h-${idx}`} x1="0" y1={idx * 50} x2="950" y2={idx * 50} />
                ))}
              </g>

              {/* RENDER NETWORK EDGES */}
              {filteredEdges.map((edge) => {
                const c1Coords = GOTHAM_COORDS[edge.sourceCountryId];
                const c2Coords = GOTHAM_COORDS[edge.targetCountryId];
                if (!c1Coords || !c2Coords) return null;

                const isEdgeSelected = selectedEdgeId === edge.id;
                const isLinkedToSelectedNode = 
                  selectedNodeId === edge.sourceCountryId || 
                  selectedNodeId === edge.targetCountryId;

                // Determine opacity based on focus state
                let strokeOpacity = 0.25;
                if (selectedEdgeId) {
                  strokeOpacity = isEdgeSelected ? 1.0 : 0.08;
                } else if (selectedNodeId) {
                  strokeOpacity = isLinkedToSelectedNode ? 0.9 : 0.08;
                } else {
                  strokeOpacity = 0.45;
                }

                // Determine stroke color and width matching current active lens
                let edgeColor = 'rgba(16, 185, 129, 0.45)';
                let strokeWidth = 1.25;

                if (activeLens === 'blended') {
                  if (edge.overallTensionScore > 65) {
                    edgeColor = '#ff2244';
                    strokeWidth = 2.0;
                  } else if (edge.overallAffinityScore > 65) {
                    edgeColor = '#00ff44';
                    strokeWidth = 1.75;
                  } else {
                    edgeColor = '#416641';
                  }
                } else {
                  // Dimensional Lens
                  const rawScore = 
                    activeLens === 'trade' ? edge.tradeScore :
                    activeLens === 'ideology' ? edge.ideologyScore :
                    activeLens === 'military' ? edge.militaryLinkScore :
                    activeLens === 'treaty' ? edge.treatyObligationScore :
                    edge.covertHostilityScore;

                  edgeColor = getLensColor(activeLens, rawScore);
                  strokeWidth = 1 + (rawScore / 40);
                }

                if (isEdgeSelected) {
                  strokeWidth += 1.5;
                }

                return (
                  <g key={edge.id} className="cursor-pointer" onClick={() => handleEdgeClick(edge.id)}>
                    {/* Shadow fat line to make clicking easy */}
                    <line
                      x1={c1Coords.x}
                      y1={c1Coords.y}
                      x2={c2Coords.x}
                      y2={c2Coords.y}
                      stroke="transparent"
                      strokeWidth="11"
                    />
                    <line
                      x1={c1Coords.x}
                      y1={c1Coords.y}
                      x2={c2Coords.x}
                      y2={c2Coords.y}
                      stroke={edgeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      strokeDasharray={
                        activeLens === 'hostility' || edge.relationshipStatus.includes('Friction') ? '3,4' : undefined
                      }
                      markerEnd={
                        edge.directional 
                          ? (activeLens === 'hostility' ? 'url(#arrow-hostility)' : 'url(#arrow-dependency)')
                          : undefined
                      }
                    />
                    {/* Tiny tension spark indicator on highlighted edges */}
                    {isEdgeSelected && (
                      <circle
                        cx={(c1Coords.x + c2Coords.x) / 2}
                        cy={(c1Coords.y + c2Coords.y) / 2}
                        r="3"
                        fill={edge.overallTensionScore > 50 ? '#ff2244' : '#00ff44'}
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}

              {/* RENDER COUNTRY NODES */}
              {filteredNodes.map((node) => {
                const coords = GOTHAM_COORDS[node.countryId];
                if (!coords) return null;

                const isNodeSelected = selectedNodeId === node.countryId;
                const isHostNationPlayer = node.countryId === playerCountryId;
                
                // Determine opacity based on focus state
                let nodeOpacity = 1.0;
                if (selectedNodeId) {
                  nodeOpacity = isNodeSelected ? 1.0 : 0.35;
                } else if (selectedEdgeId) {
                  const edge = selectedEdgeData;
                  if (edge) {
                    nodeOpacity = (edge.sourceCountryId === node.countryId || edge.targetCountryId === node.countryId) ? 1.0 : 0.15;
                  }
                }

                const metrics = node.graphMetrics;
                const radiusSize = Math.max(9, Math.min(22, 11 + (node.aggregateInfluenceScore / 10)));

                return (
                  <g 
                    key={node.countryId} 
                    className="cursor-pointer select-none" 
                    onClick={() => handleNodeClick(node.countryId)}
                  >
                    {/* Ring hover effect */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={radiusSize + 5}
                      fill="transparent"
                      stroke={isNodeSelected ? '#00e5ff' : 'transparent'}
                      strokeWidth="1.5"
                      strokeDasharray="2,3"
                      opacity={nodeOpacity}
                    />

                    {/* Nodes fill */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={radiusSize}
                      fill={isHostNationPlayer ? '#0c3d0d' : '#020502'}
                      stroke={
                        isNodeSelected 
                          ? '#00e5ff' 
                          : metrics.vulnerabilityIndex > 65 
                          ? '#ff2244' 
                          : isHostNationPlayer 
                          ? '#00ff44' 
                          : '#144c14'
                      }
                      strokeWidth={isNodeSelected ? 2.5 : 1.5}
                      opacity={nodeOpacity}
                    />

                    {/* Outer glow ring for vital strategic centers */}
                    {node.aggregateInfluenceScore > 65 && (
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={radiusSize + 2}
                        fill="none"
                        stroke="#00ff44"
                        strokeWidth="0.5"
                        opacity={nodeOpacity * 0.4}
                      />
                    )}

                    {/* Text Label */}
                    <text
                      x={coords.x}
                      y={coords.y - radiusSize - 4}
                      fill={isNodeSelected ? '#00e5ff' : '#00ff44'}
                      fontSize="8"
                      fontWeight={isNodeSelected ? 'bold' : 'normal'}
                      textAnchor="middle"
                      opacity={nodeOpacity}
                    >
                      {node.countryId}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Informational Legend overlays */}
            <div className="absolute bottom-2 left-2 z-10 bg-black/85 p-2 rounded border border-[#112d11] grid grid-cols-2 gap-x-3 gap-y-1 text-[7.5px] text-gray-400">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff44]" />
                <span>ALLIED TENSION LOW</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                <span>HOSTILE FRICTION STATE</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#00e5ff]" />
                <span>ASYMMETRIC DEP. LINK</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-gray-400" />
                <span>COVER HOSTILITY RAY</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. RIGHT COLUMN: DRILLDOWN PROFILE & FORECAST CABINET */}
        <div id="gotham-drilldown-column" className="lg:col-span-5 flex flex-col gap-2">
          
          {/* DOSSIER DRAWER CONTAINER */}
          <div id="gotham-dossier-drawer" className="border border-[#113d11] bg-[#020502] rounded p-2.5 flex-1 flex flex-col justify-between overflow-y-auto max-h-[360px] scrollbar-thin">
            
            {/* SCENARIO A: SELECTED COUNTRY NODE */}
            {selectedNodeData ? (
              <div id="selected-node-profile" className="flex flex-col gap-2 h-full">
                <div className="flex justify-between items-start border-b border-[#113d11] pb-1.5">
                  <div>
                    <span className="text-[7.5px] text-[#00e5ff] uppercase tracking-widest font-semibold font-mono">SOVEREIGN GRAPH DOSSIER</span>
                    <h3 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide flex items-center gap-1">
                      <span>{selectedNodeData.displayName}</span>
                      <span className="text-gray-400 font-normal">[{selectedNodeData.countryId}]</span>
                    </h3>
                  </div>
                  <button 
                    id="close-node-btn"
                    onClick={() => { audio.sfxKeyClick(); setSelectedNodeId(null); }}
                    className="text-gray-400 hover:text-white px-1.5 py-0.5 border border-[#113d11] hover:border-red-500 rounded text-[7.5px] cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-1.5 my-1 text-[8px]">
                  <div className="bg-[#0c140c] border border-[#112f11] p-1.5 rounded">
                    <span className="text-gray-400 block uppercase">REGION</span>
                    <span className="font-bold text-[#00ff44]">{selectedNodeData.region}</span>
                  </div>
                  <div className="bg-[#0c140c] border border-[#112f11] p-1.5 rounded">
                    <span className="text-gray-400 block uppercase">Strategic Posture</span>
                    <span className="font-bold text-[#00e5ff] overflow-ellipsis whitespace-nowrap overflow-hidden block">
                      {selectedNodeData.currentStrategicPostureSummary}
                    </span>
                  </div>
                  <div className="bg-[#0c140c] border border-[#112f11] p-1.5 rounded">
                    <span className="text-gray-400 block uppercase">INFLUENCE WEIGHT</span>
                    <span className="font-bold text-[#00ff44]">{selectedNodeData.aggregateInfluenceScore}/100</span>
                  </div>
                  <div className="bg-[#0c140c] border border-[#112f11] p-1.5 rounded text-red-400">
                    <span className="text-gray-400 block uppercase">Vulnerability</span>
                    <span className="font-bold text-red-500">{selectedNodeData.graphMetrics.vulnerabilityIndex}%</span>
                  </div>
                </div>

                {/* Graph metrics indices */}
                <div className="border border-[#112c11] bg-[#060c06] p-1.5 rounded text-[8px]">
                  <div className="flex justify-between border-b border-[#112c11] pb-1 mb-1">
                    <span className="text-gray-400">GRAPH RELATION CONNS (DEGREE):</span>
                    <span className="font-bold text-[#00ff44]">{selectedNodeData.graphMetrics.degree} nodes</span>
                  </div>
                  <div className="flex justify-between border-b border-[#112c11] pb-1 mb-1">
                    <span className="text-gray-400">CENTRALITY COEFFICIENT:</span>
                    <span className="font-bold text-[#00ff44]">{selectedNodeData.graphMetrics.centrality.toFixed(2)} / 1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">STRUCTURAL CO-DEPENDENTS:</span>
                    <span className="font-bold text-[#00ff44]">{selectedNodeData.graphMetrics.dependencyCount} target states</span>
                  </div>
                </div>

                {/* Custom Analytical chains logic */}
                <div className="mt-1 flex flex-col gap-1 text-[8px]">
                  <span className="font-black text-[#00ff44] uppercase tracking-wider block border-b border-[#112c11] pb-0.5">DYNAMIC SECURITY PATHWAYS</span>
                  
                  {/* Rivalry Chain */}
                  <div className="flex items-center gap-1 bg-[#1c0205]/20 p-1 rounded border border-[#ef4444]/15">
                    <span className="text-red-400 uppercase font-bold shrink-0">RIVALRY CYCLE:</span>
                    <div className="flex items-center gap-0.5 overflow-hidden whitespace-nowrap">
                      {getRivalryChain(selectedNodeData.countryId).map((rid, idx, arr) => (
                        <React.Fragment key={rid}>
                          <span className={`${rid === selectedNodeData.countryId ? 'text-[#00e5ff] font-bold' : 'text-gray-400'}`}>{rid}</span>
                          {idx < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-red-500/60" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Influence Chain */}
                  <div className="flex items-center gap-1 bg-[#021c10]/20 p-1 rounded border border-[#10b981]/15">
                    <span className="text-emerald-400 uppercase font-bold shrink-0">INFLUENCE CHAIN:</span>
                    <div className="flex items-center gap-0.5 overflow-hidden">
                      {getInfluenceChain(selectedNodeData.countryId).map((iid, idx, arr) => (
                        <React.Fragment key={iid}>
                          <span className={`${iid === selectedNodeData.countryId ? 'text-[#00e5ff] font-bold' : 'text-gray-400'}`}>{iid}</span>
                          {idx < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-emerald-500/60" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Flags tags */}
                {selectedNodeData.riskFlags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selectedNodeData.riskFlags.map(flag => (
                      <span key={flag} className="px-1.5 py-0.5 bg-red-950/40 border border-red-500/30 text-red-400 text-[6.5px] font-bold rounded">
                        ● {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedEdgeData ? (
              /* SCENARIO B: SELECTED RELATIONSHIP/EDGE */
              <div id="selected-edge-profile" className="flex flex-col gap-2 h-full">
                <div className="flex justify-between items-start border-b border-[#113d11] pb-1.5">
                  <div>
                    <span className="text-[7.5px] text-[#00e5ff] uppercase tracking-widest font-semibold font-mono">PAIRWISE STRATEGIC MATRIX</span>
                    <h3 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide flex items-center gap-1">
                      <span>{selectedEdgeData.sourceCountryId}</span>
                      <span className="text-gray-400">⟷</span>
                      <span>{selectedEdgeData.targetCountryId}</span>
                      <span className="text-[#00ff44] text-[8px] font-bold ml-1">({selectedEdgeData.relationshipStatus})</span>
                    </h3>
                  </div>
                  <button 
                    id="close-edge-btn"
                    onClick={() => { audio.sfxKeyClick(); setSelectedEdgeId(null); }}
                    className="text-gray-400 hover:text-white px-1.5 py-0.5 border border-[#113d11] hover:border-red-500 rounded text-[7.5px] cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>

                {/* Multi-Dimensional Ratings breakdown */}
                <div className="flex flex-col gap-1.5 text-[8.5px] my-1">
                  {[
                    { label: 'Trade Interdependence', val: selectedEdgeData.tradeScore, color: 'bg-blue-600', text: 'text-blue-400' },
                    { label: 'Ideological Alignment', val: selectedEdgeData.ideologyScore, color: 'bg-purple-600', text: 'text-purple-400' },
                    { label: 'Military Cooperation', val: selectedEdgeData.militaryLinkScore, color: 'bg-emerald-600', text: 'text-emerald-400' },
                    { label: 'Treaty Commitment', val: selectedEdgeData.treatyObligationScore, color: 'bg-amber-600', text: 'text-amber-400' },
                    { label: 'Clandestine Hostility', val: selectedEdgeData.covertHostilityScore, color: 'bg-red-600', text: 'text-red-400' },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center justify-between gap-1.5">
                      <span className="text-gray-400 w-28 text-[7.5px] uppercase">{dim.label}</span>
                      <div className="flex-1 bg-gray-950 rounded h-1.5 overflow-hidden max-w-[140px]">
                        <div className={`h-full ${dim.color}`} style={{ width: `${dim.val}%` }} />
                      </div>
                      <span className={`font-bold w-6 text-right ${dim.text}`}>{dim.val}%</span>
                    </div>
                  ))}
                </div>

                {/* Overall indexes */}
                <div className="grid grid-cols-2 gap-1.5 bg-[#0a140a] p-1.5 rounded border border-[#113411] text-[8px]">
                  <div>
                    <span className="text-gray-400 block font-light">COALITION AFFINITY</span>
                    <span className="font-bold text-[#00ff44] text-[9px]">{selectedEdgeData.overallAffinityScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-light">TENSION INDEX</span>
                    <span className="font-bold text-red-500 text-[9px]">{selectedEdgeData.overallTensionScore}%</span>
                  </div>
                </div>

                {/* Historical records specific to this edge */}
                <div className="mt-1">
                  <span className="text-[7.5px] text-[#00ff44] tracking-widest uppercase font-bold block border-b border-[#112d11] pb-0.5 mb-1">REASONING FOOTPRINT</span>
                  <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto scrollbar-thin pr-1 text-[7.5px]">
                    {selectedEdgeData.changeReasons.length > 0 ? (
                      selectedEdgeData.changeReasons.map((record, rIdx) => (
                        <div key={rIdx} className="bg-[#050c05] p-1 rounded border border-[#112711] flex gap-1 items-start">
                          <span className="text-[#00e5ff] font-bold shrink-0 font-mono">T{record.tick}:</span>
                          <span className="text-gray-300">{record.description}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 uppercase">NO DYNAMIC FLUCTUATIONS CAPTURED SINCE LOADED INITIAL CONDITIONS.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SCENARIO C: GENERAL INTELLIGENCE OVERVIEW / PRESETS */
              <div id="general-gotham-editorial" className="flex flex-col gap-2 h-full text-[8.5px]">
                <div className="flex items-center gap-1 border-b border-[#112d11] pb-1">
                  <Info className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span className="text-xs font-black uppercase text-white tracking-wide">SYSTEM INTELLIGENCE OVERVIEW</span>
                </div>

                <p className="text-gray-300 leading-snug">
                  Welcome to Gotham. Use this dashboard to analyze structural relationships between the 20 major Sovereign theater nations.
                </p>

                <div className="bg-[#0c140c] border border-[#113211] p-2 rounded">
                  <span className="font-bold text-[#00ff44] block mb-1">INTERACTION DIRECTIVES:</span>
                  <ul className="list-disc pl-3 text-gray-300 flex flex-col gap-1 text-[7.5px]">
                    <li>Click coordinates / bubbles to display deep bilateral threat files and strategic posture scores.</li>
                    <li>Toggle lenses above to highlight specific sectors like raw Trade Dependencies and Clandestine Hostility.</li>
                    <li>Utilize slider metrics to scrub background noise and outline key tactical networks.</li>
                  </ul>
                </div>

                {/* Seed scenarios selector guidance */}
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <span className="text-[7.5px] text-gray-400 uppercase tracking-widest font-black block">SIGNIFICANT KEY STRATEGIC ALLIANCES</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      id="focus-axis-us-ru"
                      onClick={() => { setSelectedEdgeId('RU-US'); setSelectedNodeId(null); audio.sfxKeyClick(); }}
                      className="text-left p-1 border border-[#ef4444]/20 hover:border-red-500 bg-red-950/10 text-red-400 rounded cursor-pointer transition-all"
                    >
                      ● US ⟷ RU RIVALRY
                    </button>
                    <button 
                      id="focus-axis-il-ir"
                      onClick={() => { setSelectedEdgeId('IL-IR'); setSelectedNodeId(null); audio.sfxKeyClick(); }}
                      className="text-left p-1 border border-[#ef4444]/20 hover:border-red-500 bg-red-950/10 text-red-400 rounded cursor-pointer transition-all"
                    >
                      ● IL ⟷ IR HOTSPOT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC THREAT FORECASTING CABINET */}
          <div id="gotham-forecast-cabinet" className="border border-[#113d11] bg-[#020502] rounded p-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-1 border-b border-[#113d11] pb-1 justify-between">
              <div className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                <span>THREAT FORECASTING CABINET</span>
              </div>
              <span className="text-[6.5px] bg-[#220a0a] px-1.5 py-0.5 rounded border border-red-500/20 text-red-400 font-bold uppercase">PREDICTOR ONLINE</span>
            </div>

            {/* Generated Forecasting Scenarios Cards */}
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              
              {/* Forecast 1: Israel-Iran Escalation Trigger */}
              <div className="bg-[#120404]/50 border border-red-500/25 p-1.5 rounded flex flex-col gap-0.5 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>PROVOCATION RISK: ISRAEL ⟷ IRAN</span>
                  </span>
                  <span className="text-[7.5px] font-black bg-red-950/30 text-red-500 border border-red-500/30 px-1 py-0.2 rounded">
                    88% RISK
                  </span>
                </div>
                <p className="text-gray-300 text-[7.5px]">
                  Covert Hostility is extremely high (90%+). Intercept logs capture proxy missile preparations and cyber attacks.
                </p>
                <div className="mt-1 flex gap-1">
                  <span className="bg-red-500/10 border border-red-500/20 text-[#ef4444] px-1 rounded text-[6.5px]">DRIVERS: SIGINT, CLANDESTINE SITES</span>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1 rounded text-[6.5px]">CONFIDENCE: HIGH</span>
                </div>
              </div>

              {/* Forecast 2: Alliance Strain (Turkey inside NATO) */}
              <div className="bg-[#121204]/40 border border-amber-500/25 p-1.5 rounded flex flex-col gap-0.5 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ALLIANCE STRAIN: TURKEY (NATO)</span>
                  </span>
                  <span className="text-[7.5px] font-black bg-amber-950/30 text-amber-500 border border-amber-500/30 px-1 py-0.2 rounded">
                    55% RISK
                  </span>
                </div>
                <p className="text-gray-300 text-[7.5px]">
                  Diverging ideological alignment and tactical trade dialogue with non-NATO blocs generating command frictions.
                </p>
                <div className="mt-1 flex gap-1">
                  <span className="bg-gray-500/10 text-gray-400 px-1 rounded text-[6.5px]">DRIVERS: ECONOMIC DRIFT, DIPLOMATIC MEDIATION</span>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1 rounded text-[6.5px]">CONFIDENCE: MEDIUM</span>
                </div>
              </div>

              {/* Forecast 3: Silicon Supply Chain Bottleneck (TW and US) */}
              <div className="bg-[#040812]/40 border border-blue-500/25 p-1.5 rounded flex flex-col gap-0.5 text-[8.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    <span>LEVERAGE / PRESSURE: TAIWAN SEMICONDUCTOR</span>
                  </span>
                  <span className="text-[7.5px] font-black bg-blue-950/30 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded">
                    95% POTENTIAL
                  </span>
                </div>
                <p className="text-gray-300 text-[7.5px]">
                  Asymmetric dependency index is locked at maximum score. Disruptions at chip foundries will spark immediate semiconductor shockwaves.
                </p>
                <div className="mt-1 flex gap-1">
                  <span className="bg-blue-500/10 text-blue-400 px-1 rounded text-[6.5px]">DRIVERS: SUPPLY CHAINS, GDP EXPOSURE</span>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-1 rounded text-[6.5px]">CONFIDENCE: HIGH</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 4. CHRONO TIMELINE LOG & RECENT CHANGE ALERTS */}
      <div id="gotham-chrono-timeline" className="mt-2 border border-[#112d11] bg-[#020502] p-2 rounded">
        <div className="flex justify-between items-center border-b border-[#112d11] pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#00ff44]" />
            <span className="font-black text-white uppercase tracking-wider text-[9px]">GOTHAM STRUCTURAL EVENTS TIMELINE</span>
          </div>

          <div className="flex gap-1.5 text-[7.5px]">
            <button 
              id="timeline-all-btn"
              onClick={() => { audio.sfxKeyClick(); setTimelineTab('ALL'); }}
              className={`py-0.5 px-2 rounded-sm border cursor-pointer ${
                timelineTab === 'ALL' 
                  ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44]' 
                  : 'bg-transparent border-[#112711] text-gray-500'
              }`}
            >
              ALL REASONS
            </button>
            <button 
              id="timeline-critical-btn"
              onClick={() => { audio.sfxKeyClick(); setTimelineTab('CRITICAL'); }}
              className={`py-0.5 px-2 rounded-sm border cursor-pointer ${
                timelineTab === 'CRITICAL' 
                  ? 'bg-[#00ff44]/10 border-[#00ff44] text-[#00ff44]' 
                  : 'bg-transparent border-[#112711] text-gray-500'
              }`}
            >
              CRITICAL LOGS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 overflow-y-auto max-h-[70px] scrollbar-thin pr-1 text-[7.5px]">
          {changeLog
            .filter(record => timelineTab === 'ALL' || record.changeType === 'DETERIORATED')
            .map((record, rIdx) => {
              const isCrit = record.changeType === 'DETERIORATED';
              return (
                <div 
                  key={rIdx} 
                  className={`p-1.5 rounded border ${
                    isCrit 
                      ? 'bg-red-950/20 border-red-500/20 text-red-300' 
                      : 'bg-[#050c05] border-[#112d11] text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5 font-bold">
                    <span className="text-[#00e5ff] font-bold">TICK {record.tick}</span>
                    <span className={`uppercase text-[6.5px] font-sans ${isCrit ? 'text-red-500' : 'text-emerald-500'}`}>
                      {record.dimension} ID
                    </span>
                  </div>
                  <p className="line-clamp-2 leading-snug">{record.description}</p>
                </div>
              );
            })}
        </div>
      </div>

    </div>
    </PanelFxShell>
  );
}
