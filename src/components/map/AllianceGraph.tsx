import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';
import {
  Globe,
  Shield,
  Activity,
  Zap,
  Radio,
  FileText,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  AlertOctagon,
  Scale,
  Users,
  Briefcase,
  AlertTriangle,
  Network,
  Cpu,
  Bookmark,
  TrendingUp,
  Fingerprint,
  TrendingDown,
  Info
} from 'lucide-react';

interface AnalyticalNode extends d3.SimulationNodeDatum {
  id: string; // ISO Country code
  name: string;
  flag: string;
  powerRating: number;
  gdpB: number;
  allianceBlock: string;
  ideology: string;
  threatLevel: string;
  hasNuclear: boolean;
  centrality: number; // Degree Centrality calculation
  influence: number; // Dynamic overall index
  vulnerabilityIndex: number; // Defensive vulnerabilities
}

interface OntologicalLink extends d3.SimulationLinkDatum<AnalyticalNode> {
  id: string;
  source: string | AnalyticalNode;
  target: string | AnalyticalNode;
  type: 'ALLIANCE' | 'TRADE' | 'WAR' | 'SANCTIONS';
  weight: number;
  details: string;
  bidirectional: boolean;
}

export default function AllianceGraph() {
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const hudMode = usePlayerStore((s) => s.hudMode);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  const svgRef = useRef<SVGSVGElement>(null);
  
  // Simulated Nodes and Links states
  const [nodes, setNodes] = useState<AnalyticalNode[]>([]);
  const [links, setLinks] = useState<OntologicalLink[]>([]);
  
  // Real-time coordinates tracking updated by D3 force tick
  const [coords, setCoords] = useState<{ id: string; x: number; y: number }[]>([]);
  
  // Custom Zoom transform state for viewport scaling math inside React
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // Inspection states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(playerCountryId);
  const [selectedLinkLabel, setSelectedLinkLabel] = useState<OntologicalLink | null>(null);
  
  // Search and Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFocusMode, setActiveFocusMode] = useState<'ALL' | 'EGO' | 'ALLIANCES' | 'WARS' | 'TRADE' | 'SANCTIONS'>('ALL');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Drag and drop tracking
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // Keep a mutable reference of nodes to update positions reliably in callbacks
  const simNodesRef = useRef<AnalyticalNode[]>([]);
  const simulationRef = useRef<d3.Simulation<AnalyticalNode, OntologicalLink> | null>(null);

  // 1. Build semantic analytical nodes and edges from world state
  useEffect(() => {
    // Generate analytical nodes
    const listNodes: AnalyticalNode[] = Object.keys(countries).map((id) => {
      const c = countries[id];
      return {
        id: id,
        name: c.name,
        flag: c.flagEmoji,
        powerRating: c.arsenal.totalPowerRating || 1,
        gdpB: c.economic.gdpB || 100,
        allianceBlock: c.allianceBlock,
        ideology: c.political.ideology,
        threatLevel: c.threatLevel,
        hasNuclear: c.arsenal.nuclearCapable || false,
        centrality: 0,
        influence: 0,
        vulnerabilityIndex: 0,
      };
    });

    // Generate semantic ontological links
    const listLinks: OntologicalLink[] = [];

    Object.keys(countries).forEach((srcId) => {
      const c = countries[srcId];

      // Alliance relations
      Object.keys(countries).forEach((tgtId) => {
        if (srcId >= tgtId) return; // avoid duplicates
        const target = countries[tgtId];

        if (c.allianceBlock !== 'NEUTRAL' && c.allianceBlock === target.allianceBlock) {
          listLinks.push({
            id: `alliance_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'ALLIANCE',
            weight: 90,
            details: `${c.allianceBlock} Defense Compact Alliance Protection`,
            bidirectional: true,
          });
        }
      });

      // Trade corridors
      c.tradePartners?.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        if (!target) return;

        // Strip duplicates with alliances
        const allianceExists = listLinks.some(
          (l) => l.type === 'ALLIANCE' && ((l.source === srcId && l.target === tgtId) || (l.source === tgtId && l.target === srcId))
        );
        if (!allianceExists) {
          listLinks.push({
            id: `trade_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'TRADE',
            weight: 45,
            details: `Bilateral commercial trade flows`,
            bidirectional: true,
          });
        }
      });

      // Kinetic War statuses
      c.atWarWith?.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        listLinks.push({
          id: `war_${srcId}_${tgtId}`,
          source: srcId,
          target: tgtId,
          type: 'WAR',
          weight: 100,
          details: `DIRECT KINETIC WAR - UNCOMPROMISING ESCALATION front`,
          bidirectional: true,
        });
      });

      // Sanctions blockades
      c.economic?.sanctionedBy?.forEach((tgtId) => {
        listLinks.push({
          id: `sanctions_${tgtId}_${srcId}`,
          source: tgtId, // source is embargo sender
          target: srcId, // target is embargo victim
          type: 'SANCTIONS',
          weight: 60,
          details: `Economic restriction barrier flow`,
          bidirectional: false,
        });
      });
    });

    // 2. Perform Link-Analysis Network calculations
    listNodes.forEach((node) => {
      const connected = listLinks.filter((l) => {
        const sId = l.source ? (typeof l.source === 'string' ? l.source : (l.source as any).id || '') : '';
        const tId = l.target ? (typeof l.target === 'string' ? l.target : (l.target as any).id || '') : '';
        return sId === node.id || tId === node.id;
      });

      // Degree Centrality metric
      node.centrality = connected.length;

      // Vulnerability metric based on war-fronts and external threat alerts
      const activeWars = connected.filter((l) => l.type === 'WAR').length;
      const embargos = connected.filter((l) => l.type === 'SANCTIONS' && (l.target ? (typeof l.target === 'string' ? l.target : (l.target as any).id || '') : '') === node.id).length;
      node.vulnerabilityIndex = Math.min(100, Math.round(
        (activeWars * 40) + (embargos * 15) + (node.threatLevel === 'RED' ? 25 : node.threatLevel === 'ORANGE' ? 10 : 0)
      ));

      // Strategic Influence Metric based on aggregate military and trade power factors
      const blockBonus = node.allianceBlock !== 'NEUTRAL' ? 15 : 0;
      node.influence = Math.min(100, Math.round(
        (node.powerRating / 2.5) + (node.gdpB / 400) + blockBonus
      ));
    });

    setNodes(listNodes);
    setLinks(listLinks);
    simNodesRef.current = listNodes;
  }, [countries]);

  // 3. Setup D3 Zoom & scale tracker
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 6])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
        d3.select('#link-analysis-workspace').attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // 4. Force-directed physics parameters setup
  useEffect(() => {
    if (nodes.length === 0) return;

    // Isolate graph objects for simulation mutations safely
    const simNodes: AnalyticalNode[] = JSON.parse(JSON.stringify(nodes));
    const simLinks: OntologicalLink[] = JSON.parse(JSON.stringify(links));

    // Consolidate original fx/fy positions so they don't reset when graph filters update
    simNodes.forEach((n) => {
      const match = simNodesRef.current.find((prev) => prev.id === n.id);
      if (match) {
        n.x = match.x;
        n.y = match.y;
        n.vx = match.vx;
        n.vy = match.vy;
      }
    });

    const width = 800;
    const height = 500;

    const simulation = d3.forceSimulation<AnalyticalNode>(simNodes)
      .force('link', d3.forceLink<AnalyticalNode, OntologicalLink>(simLinks).id((d) => d?.id || '').distance((d) => {
        if (d.type === 'WAR') return 240;
        if (d.type === 'ALLIANCE') return 80;
        if (d.type === 'SANCTIONS') return 140;
        return 120;
      }))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => {
        return Math.sqrt(d.powerRating || 1) * 0.9 + 25;
      }));

    simulationRef.current = simulation;

    simulation.on('tick', () => {
      simNodesRef.current = simNodes;
      const updatedCoords = simNodes.map((n) => ({
        id: n.id,
        x: n.x || 400,
        y: n.y || 250,
      }));
      setCoords(updatedCoords);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Handle Drag-and-drop mechanics in React using absolute model scale coordinates
  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, node: AnalyticalNode) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDraggedNode(node.id);
    audio.sfxKeyClick();

    const targetNode = simNodesRef.current.find((n) => n.id === node.id);
    if (targetNode) {
      targetNode.fx = targetNode.x;
      targetNode.fy = targetNode.y;
    }

    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>, node: AnalyticalNode) => {
    if (draggedNode !== node.id || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Inverse conversion through zoom scale and translate values
    const modelX = (mouseX - transform.x) / transform.k;
    const modelY = (mouseY - transform.y) / transform.k;

    const targetNode = simNodesRef.current.find((n) => n.id === node.id);
    if (targetNode) {
      targetNode.fx = modelX;
      targetNode.fy = modelY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>, node: AnalyticalNode) => {
    e.stopPropagation();
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    setDraggedNode(null);

    const targetNode = simNodesRef.current.find((n) => n.id === node.id);
    if (targetNode) {
      targetNode.fx = null;
      targetNode.fy = null;
    }

    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0);
    }
  };

  const resetZoom = () => {
    audio.sfxKeyClick();
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any, 
      d3.zoomIdentity
    );
  };

  const searchAndFocusNode = (id: string) => {
    audio.sfxKeyClick();
    setSelectedNodeId(id);
    const pt = coords.find((p) => p.id === id);
    if (pt && svgRef.current) {
      const svg = d3.select(svgRef.current);
      // Center on node location
      const cx = 400 - pt.x;
      const cy = 250 - pt.y;
      svg.transition().duration(500).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity.translate(cx, cy).scale(1.2)
      );
    }
  };

  const handleNodeClick = (id: string) => {
    setSelectedNodeId(id);
    setSelectedLinkLabel(null);
    audio.sfxKeyClick();

    if (hudMode === 'WAR_ROOM') {
      if (id !== playerCountryId) {
        setTargetCountry(id);
      }
    } else {
      setCountryInspector(id);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, link: OntologicalLink) => {
    e.stopPropagation();
    setSelectedLinkLabel(link);
    audio.sfxKeyClick();
  };

  // Graph logic metrics & filterings
  const getDossierNode = () => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes.find((n) => n.id === playerCountryId);
  };

  const activeFocusDossier = getDossierNode();

  // Edge and nodes filtering based on Mode state
  const displayedLinks = links.filter((link) => {
    const sId = link.source ? (typeof link.source === 'object' ? (link.source as any).id || '' : link.source) : '';
    const tId = link.target ? (typeof link.target === 'object' ? (link.target as any).id || '' : link.target) : '';
    
    // Mode specific filters
    if (activeFocusMode === 'ALLIANCES') return link.type === 'ALLIANCE';
    if (activeFocusMode === 'WARS') return link.type === 'WAR';
    if (activeFocusMode === 'TRADE') return link.type === 'TRADE';
    if (activeFocusMode === 'SANCTIONS') return link.type === 'SANCTIONS';
    
    if (activeFocusMode === 'EGO' && selectedNodeId) {
      return sId === selectedNodeId || tId === selectedNodeId;
    }
    
    return true;
  });

  const displayedNodes = nodes.filter((node) => {
    // Filter search query
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && !node.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeFocusMode === 'EGO' && selectedNodeId) {
      // Show only selected ego nodes or connected neighbors
      return node.id === selectedNodeId || links.some((l) => {
        const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id || '' : l.source) : '';
        const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id || '' : l.target) : '';
        return (sId === selectedNodeId && tId === node.id) || (tId === selectedNodeId && sId === node.id);
      });
    }

    return true;
  });

  // Calculate quick metrics
  const activeAlliancesCount = links.filter((l) => l.type === 'ALLIANCE').length;
  const activeWarsCount = links.filter((l) => l.type === 'WAR').length;
  const activeSanctionsCount = links.filter((l) => l.type === 'SANCTIONS').length;

  // Render a visual line highlight pattern depending on status
  const getLineStyles = (type: string, isMainSelected: boolean, isHovered: boolean) => {
    const defaultOpacity = isHovered ? '0.95' : isMainSelected ? '1' : '0.25';
    let stroke = 'rgba(0, 255, 68, 0.4)';
    let dash = undefined;
    let className = '';

    if (type === 'TRADE') {
      stroke = '#00e5ff';
      dash = '3,4';
      className = 'trade-animated-edge';
    } else if (type === 'WAR') {
      stroke = '#ff2244';
      className = 'war-pulse-edge';
    } else if (type === 'ALLIANCE') {
      stroke = '#10b981';
      className = 'alliance-glow-edge';
    } else if (type === 'SANCTIONS') {
      stroke = '#f97316';
      dash = '1,3';
    }

    return { stroke, strokeDasharray: dash, opacity: defaultOpacity, className };
  };

  return (
    <div className="w-full h-full bg-[#020503] text-green-400 font-mono flex flex-col md:flex-row border border-green-500/20 overflow-hidden relative select-none">
      {/* Visual cyber artifacts overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" 
           style={{ backgroundImage: 'radial-gradient(ellipse at center, #00ff44 0%, transparent 80%)' }} />
      <div className="scanlines absolute inset-0 pointer-events-none opacity-20" />

      {/* LEFT CONTROL PANEL AND DIRECTORIES (w-72 or 1/4 layout) */}
      <div className="w-full md:w-[320px] bg-[#020603]/95 border-r border-green-500/20 flex flex-col relative z-20 overflow-y-auto max-h-full">
        {/* TOP HUB SECTION */}
        <div className="p-3 border-b border-[#143217]/50 bg-black/60">
          <div className="flex items-center gap-1.5 text-xs text-[#00ff44] font-bold tracking-widest uppercase mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#00ff44]" />
            LINK ANALYSIS TERMINAL // V1.0
          </div>
          <p className="text-[9px] text-[#00e5ff] uppercase tracking-wider">
            SOCIETAL INTERACTION INTEL VECTOR MAP
          </p>
        </div>

        {/* WORKSPACE OPERATIONS FILTER PILLS */}
        <div className="p-2 bg-black/20 space-y-2 border-b border-[#143217]/30">
          <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-1">
            FOCUS REGIME FILTER
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] uppercase font-bold text-gray-400">
            {[
              { id: 'ALL', label: 'ALL NETWORKS' },
              { id: 'EGO', label: 'EGO ISOLATION' },
              { id: 'WARS', label: 'WAR FRONT' },
              { id: 'ALLIANCES', label: 'BLOCS' },
              { id: 'TRADE', label: 'COMMERCE' },
              { id: 'SANCTIONS', label: 'SANCTIONS' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => { audio.sfxKeyClick(); setActiveFocusMode(m.id as any); }}
                className={`py-1.5 px-2 border rounded text-left transition-all relative overflow-hidden ${
                  activeFocusMode === m.id
                    ? 'border-[#00ff44] bg-[#08200c] text-white font-extrabold shadow-[0_0_8px_rgba(0,255,68,0.15)]'
                    : 'border-green-900/40 bg-[#020502]/60 hover:bg-[#071309] hover:border-green-600/50'
                }`}
              >
                {activeFocusMode === m.id && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#00ff44] rounded-bl" />
                )}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* NODE SEARCH CRITERIA */}
        <div className="p-3 border-b border-[#143217]/30 bg-black/10">
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH ENTITY ID OR NAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#010402] border border-[#143217] text-[10px] pl-8 pr-2 py-2 rounded text-white placeholder-green-800 focus:border-[#00ff44] outline-none font-mono uppercase"
            />
            <Search className="w-3.5 h-3.5 text-green-700 absolute left-2.5 top-2.5" />
          </div>

          {/* Quick country results matches */}
          {searchQuery && (
            <div className="mt-2 text-[9px] bg-[#020502]/90 border border-[#143217] rounded max-h-32 overflow-y-auto divide-y divide-green-950/20 custom-scrollbar">
              {nodes
                .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => searchAndFocusNode(node.id)}
                    className="p-1.5 hover:bg-green-950/20 cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-bold text-white uppercase">{node.flag} {node.name}</span>
                    <span className="text-gray-500 text-[8px] font-mono">[{node.id}]</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* DIRECTORY LISTING NODES (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1.5 bg-black/10">
          <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-1 py-1 border-b border-green-950/15 mb-2">
            INTELLIGENCE NODE LISTING ({displayedNodes.length})
          </div>
          
          {displayedNodes.map((n) => {
            const isSelected = n.id === selectedNodeId;
            const isHovered = n.id === hoveredNodeId;
            const isPlayer = n.id === playerCountryId;
            const threatBorderColors = 
              n.threatLevel === 'RED' ? 'border-red-600/40 hover:border-red-500' :
              n.threatLevel === 'ORANGE' ? 'border-orange-500/40 hover:border-orange-400' :
              'border-[#143217]';

            return (
              <div
                key={n.id}
                onClick={() => handleNodeClick(n.id)}
                onMouseEnter={() => setHoveredNodeId(n.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={`p-2 border rounded cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-green-950/20 border-[#00ff44] shadow-[0_0_10px_rgba(0,255,68,0.1)]'
                    : isHovered
                    ? 'bg-green-950/10 border-green-500/50'
                    : `bg-black/30 ${threatBorderColors}`
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-sm shrink-0">{n.flag}</span>
                    <span className="font-bold text-[11px] text-white truncate uppercase">{n.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 select-none font-mono text-[8px]">
                    {isPlayer && (
                      <span className="text-[7px]_bg-[#00ff44]/10 border border-[#00ff44]/30 px-1 py-px text-[#00ff44] font-bold rounded">
                        HQ
                      </span>
                    )}
                    <span className="bg-green-950/60 border border-green-500/30 px-1 rounded font-bold">{n.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[8px] text-gray-500 uppercase mt-1 border-t border-green-950/10 pt-1 font-mono tracking-wider">
                  <div>
                    CENTAL: <span className="text-white font-bold">{n.centrality}</span>
                  </div>
                  <div>
                    INFLU: <span className="text-white font-bold">{n.influence}</span>
                  </div>
                  <div>
                    BLOC: <span className="text-gray-400 font-bold truncate block">{n.allianceBlock}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDDLE INTERACTIVE CANVAS AREA (Main visual space) */}
      <div className="flex-1 flex flex-col relative min-h-[350px] overflow-hidden">
        {/* CANVAS FLOATING HEADER BUTTONS */}
        <div className="absolute top-2.5 left-2.5 z-20 flex gap-2">
          <button
            onClick={resetZoom}
            className="p-1 px-2.5 bg-[#020503]/90 border border-green-500/30 hover:border-green-400 text-[10px] font-bold tracking-widest text-[#00ff44] rounded flex items-center gap-1.5 cursor-pointer uppercase shadow-md transition-all active:scale-95"
          >
            <Compass className="w-3.5 h-3.5" /> RE-ALIGN FOCUS
          </button>
        </div>

        {/* NETWORK GLOBAL OVERVIEW SNAPSHOT */}
        <div className="absolute top-2.5 right-2.5 z-20 bg-[#020503]/90 border border-green-500/30 p-2.5 rounded shadow-lg text-[9px] max-w-sm hidden lg:block select-none font-mono">
          <div className="text-[10px] text-[#00ff44] font-extrabold flex items-center gap-1 border-b border-[#143217]/50 pb-1 mb-1.5 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 animate-pulse text-[#00ff44]" /> NETWORK STAT INDICES
          </div>
          <div className="grid grid-cols-3 gap-3 text-gray-500 uppercase">
            <div>
              ALLIANCES: <span className="text-[#10b981] font-bold block text-sm mt-0.5">{activeAlliancesCount}</span>
            </div>
            <div>
              hostilities: <span className="text-[#ff2244] font-bold block text-sm mt-0.5">{activeWarsCount}</span>
            </div>
            <div>
              EMBARGOS: <span className="text-orange-500 font-bold block text-sm mt-0.5">{activeSanctionsCount}</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SVG GRID STAGE */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handlePointerMove as any} // Backup bounds mouse tracks
        >
          {/* Cyber Tech Grid background inside SVG */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 68, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Core transform grouping managed cleanly via D3 Zoom dynamics */}
          <g id="link-analysis-workspace">
            {/* 1. RENDER RELATIONSHIP LINKS (Strokes) */}
            {displayedLinks.map((link) => {
              const srcId = link.source ? (typeof link.source === 'object' ? (link.source as any).id || '' : link.source) : '';
              const tgtId = link.target ? (typeof link.target === 'object' ? (link.target as any).id || '' : link.target) : '';

              const srcPt = coords.find((p) => p.id === srcId);
              const tgtPt = coords.find((p) => p.id === tgtId);

              if (!srcPt || !tgtPt) return null;

              const isMainSelected = 
                selectedNodeId === srcId || 
                selectedNodeId === tgtId;

              const isHovered = 
                hoveredNodeId === srcId || 
                hoveredNodeId === tgtId;

              const isFocusModeEgo = activeFocusMode === 'EGO';
              
              // Determine final styles
              const lineStyle = getLineStyles(
                link.type, 
                isMainSelected, 
                isHovered
              );

              // Apply dimmed status to unrelated nodes in isolations modes
              const isDimmed = isFocusModeEgo && !isMainSelected;

              // Render direction flow markers / arrows for unilateral sanctions
              const showArrow = link.type === 'SANCTIONS';

              return (
                <g 
                  key={link.id} 
                  className={`cursor-pointer transition-opacity duration-350 ${isDimmed ? 'opacity-[0.06]' : 'opacity-100'}`}
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <line
                    x1={srcPt.x}
                    y1={srcPt.y}
                    x2={tgtPt.x}
                    y2={tgtPt.y}
                    stroke={lineStyle.stroke}
                    strokeWidth={isHovered ? '2.5' : isMainSelected ? '2' : '1'}
                    strokeDasharray={lineStyle.strokeDasharray}
                    opacity={lineStyle.opacity}
                    className={lineStyle.className}
                  />

                  {/* Draw small glowing label tags mid-way on hover or selection */}
                  {(isMainSelected || isHovered) && (
                    <g transform={`translate(${(srcPt.x + tgtPt.x) / 2}, ${(srcPt.y + tgtPt.y) / 2})`}>
                      <rect
                        x="-24"
                        y="-7"
                        width="48"
                        height="14"
                        fill="#020503"
                        stroke={lineStyle.stroke}
                        strokeWidth="0.5"
                        rx="2"
                        className="opacity-90 shadow-md"
                      />
                      <text
                        dy="3"
                        textAnchor="middle"
                        fill={lineStyle.stroke}
                        fontSize="6.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        className="uppercase select-none pointer-events-none"
                      >
                        {link.type}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 2. RENDER COUNTRY NODES (Glyphs) */}
            {displayedNodes.map((node) => {
              const pt = coords.find((p) => p.id === node.id);
              if (!pt) return null;

              const isSelected = node.id === selectedNodeId;
              const isHovered = node.id === hoveredNodeId;
              const isPlayer = node.id === playerCountryId;
              const radius = Math.max(22, Math.min(36, Math.sqrt(node.powerRating || 1) * 0.9 + 12));

              const isFocusModeEgo = activeFocusMode === 'EGO';
              // Check if node is part of ego connections
              const isDegreePartner = selectedNodeId && (
                node.id === selectedNodeId || 
                links.some((l) => {
                  const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id || '' : l.source) : '';
                  const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id || '' : l.target) : '';
                  return (sId === selectedNodeId && tId === node.id) || (tId === selectedNodeId && sId === node.id);
                })
              );

              const isDimmed = isFocusModeEgo && !isDegreePartner;

              // Node aesthetic definitions depends on political ideology and alert alerts
              let nodeFill = 'rgba(10, 30, 15, 0.85)';
              let nodeStroke = '#10b981';
              let pulseClass = '';

              if (node.ideology === 'AUTOCRACY') {
                nodeFill = 'rgba(40, 10, 15, 0.85)';
                nodeStroke = '#ff2244';
              } else if (node.ideology === 'THEOCRACY') {
                nodeFill = 'rgba(35, 20, 10, 0.85)';
                nodeStroke = '#f59e0b';
              } else if (node.ideology === 'TECHNOCRACY') {
                nodeFill = 'rgba(10, 25, 35, 0.85)';
                nodeStroke = '#00e5ff';
              }

              if (isSelected) {
                pulseClass = 'node-selected-glowing-ring';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className={`cursor-pointer transition-opacity duration-350 ${isDimmed ? 'opacity-[0.08]' : 'opacity-100'}`}
                  onClick={() => handleNodeClick(node.id)}
                  onPointerDown={(e) => handlePointerDown(e, node)}
                  onPointerMove={(e) => handlePointerMove(e, node)}
                  onPointerUp={(e) => handlePointerUp(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selector glowing Halo ring if active */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={nodeStroke}
                      strokeWidth="1"
                      strokeDasharray="4,4"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Pulsing indicator if country is at WAR */}
                  {node.threatLevel === 'RED' && (
                    <circle
                      r={radius + 5}
                      fill="none"
                      stroke="#ff2244"
                      strokeWidth="1.5"
                      className="ping-slow"
                    />
                  )}

                  {/* Main Node body circular backing */}
                  <circle
                    r={radius}
                    fill={nodeFill}
                    stroke={isSelected ? '#00ff44' : isHovered ? '#00e5ff' : nodeStroke}
                    strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.5'}
                    className="transition-all"
                  />

                  {/* Flag Representation */}
                  <text
                    dy="5"
                    textAnchor="middle"
                    fontSize={radius > 28 ? '18' : '15'}
                    className="select-none pointer-events-none"
                  >
                    {node.flag}
                  </text>

                  {/* Country ISO code and title badge base */}
                  <g transform={`translate(0, ${radius + 11})`}>
                    <rect
                      x="-14"
                      y="-6"
                      width="28"
                      height="11"
                      fill="#020503"
                      stroke={isSelected ? '#00ff44' : nodeStroke}
                      strokeWidth="0.5"
                      rx="2"
                    />
                    <text
                      dy="2.5"
                      textAnchor="middle"
                      fill={isSelected ? '#00ff44' : '#ffffff'}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="black"
                      className="tracking-widest uppercase transition-colors pointer-events-none select-none"
                    >
                      {node.id}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* BOTTOM QUICK LEGEND PANEL */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-20 bg-[#020503]/95 border border-green-500/20 rounded p-2 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between text-[8px] uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-1 text-[#00ff44] font-bold">
            <Radio className="w-3 h-3 text-[#00ff44]" /> ONTOLOGICAL DICTIONARY:
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-[#10b981]" />
            <span className="text-[#10b981] font-bold">MUTUAL ALLIANCE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-[#ff2244]" />
            <span className="text-[#ff2244] font-bold">KINETIC FRONT (WAR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-b border-dashed border-[#00e5ff]" />
            <span className="text-[#00e5ff] font-bold">TRADE CORRIDORS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-b border-dotted border-f97316 bg-[#f97316]" />
            <span className="text-[#f97316] font-bold">ECONOMIC SANCTION</span>
          </div>
          <div className="text-gray-600 font-mono hidden md:block">
            DRAG NODES TO ANCHOR POSITIONALS // WHEEL SCAMPERS FIELD
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR INSPECTOR / RELATION DOSSIER PANEL */}
      <div className="w-full md:w-[350px] bg-[#020603]/95 border-t md:border-t-0 md:border-l border-green-500/20 flex flex-col relative z-20 overflow-y-auto">
        <div className="p-3 border-b border-[#143217]/50 bg-black/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#00ff44] font-bold tracking-widest uppercase">
            <Fingerprint className="w-4 h-4 text-[#00ff44]" />
            02 // RELATION RECON DOSSIER
          </div>
          <span className="text-[8px] px-1 py-0.5 border border-green-500/30 font-bold bg-[#041206]">
            SECURE ACCESS
          </span>
        </div>

        {/* 1. SEPARATED SPECIFIC LINK INSPECTOR VIEW (if a user clicked on a link/edge) */}
        {selectedLinkLabel ? (
          <div className="p-4 space-y-4">
            <div className="p-3.5 bg-green-950/20 border border-green-500/30 rounded relative overflow-hidden">
              <span className="text-[8px] text-gray-500 font-bold block uppercase mb-1">RELATIONSHIP CATEGORY:</span>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold tracking-widest uppercase ${
                  selectedLinkLabel.type === 'WAR' ? 'text-red-500' :
                  selectedLinkLabel.type === 'ALLIANCE' ? 'text-[#10b981]' :
                  selectedLinkLabel.type === 'TRADE' ? 'text-[#00e5ff]' : 'text-orange-500'
                }`}>
                  {selectedLinkLabel.type} DIRECTIVE
                </span>
                <span className="text-[9px] font-mono select-none px-1.5 py-0.5 bg-black text-[#00ff44] border border-green-950 rounded">
                  WT: {selectedLinkLabel.weight}/100
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-normal lowercase first-letter:uppercase">
                "{selectedLinkLabel.details}"
              </p>
            </div>

            {/* Path details */}
            <div className="space-y-2.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">ONTOLOGICAL CONNECTORS:</span>
              <div className="grid grid-cols-3 gap-1.5 text-center items-center">
                <div className="p-2 border border-green-950 bg-black/40 rounded">
                  <span className="text-xl block mb-0.5">
                    {selectedLinkLabel.source ? (typeof selectedLinkLabel.source === 'object' ? (selectedLinkLabel.source as any).flag : (countries[selectedLinkLabel.source]?.flagEmoji || '')) : ''}
                  </span>
                  <span className="text-[9px] text-white font-bold uppercase block truncate">
                    {selectedLinkLabel.source ? (typeof selectedLinkLabel.source === 'object' ? (selectedLinkLabel.source as any).name : (countries[selectedLinkLabel.source]?.name || selectedLinkLabel.source)) : ''}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-gray-600">
                  {selectedLinkLabel.bidirectional ? '◀ ─ ─ ─ ▶' : '─ ─ ─ ─ ▶'}
                </div>
                <div className="p-2 border border-green-950 bg-black/40 rounded">
                  <span className="text-xl block mb-0.5">
                    {selectedLinkLabel.target ? (typeof selectedLinkLabel.target === 'object' ? (selectedLinkLabel.target as any).flag : (countries[selectedLinkLabel.target]?.flagEmoji || '')) : ''}
                  </span>
                  <span className="text-[9px] text-white font-bold uppercase block truncate">
                    {selectedLinkLabel.target ? (typeof selectedLinkLabel.target === 'object' ? (selectedLinkLabel.target as any).name : (countries[selectedLinkLabel.target]?.name || selectedLinkLabel.target)) : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-green-950/20">
              <button
                onClick={() => setSelectedLinkLabel(null)}
                className="w-full text-center py-2 border border-green-500/20 hover:border-[#00ff44] hover:bg-green-950/10 text-[10px] text-[#00ff44] font-bold rounded cursor-pointer transition-all uppercase"
              >
                RETURN TO ENTITY FOCUS
              </button>
            </div>
          </div>
        ) : activeFocusDossier ? (
          // 2. STANDARD CHRONICLE NATION STAT DOSSIER INSPECTOR
          <div className="p-3.5 space-y-4">
            
            {/* Header profile with Flag and name */}
            <div className="flex items-center gap-3 bg-black/40 p-3 border border-green-950 rounded">
              <div className="text-3xl shrink-0">{activeFocusDossier.flag}</div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white tracking-wide uppercase truncate">
                    {activeFocusDossier.name}
                  </h3>
                  <span className="text-[8px] bg-green-950 border border-green-500/20 px-1 py-0.5 text-gray-400 font-bold font-mono">
                    {activeFocusDossier.id}
                  </span>
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5 font-mono">
                  {activeFocusDossier.ideology} Regime Block • {activeFocusDossier.allianceBlock}
                </p>
              </div>
            </div>

            {/* Operational status alert metrics */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
              <div className="p-2.5 bg-black/30 border border-green-950 rounded-sm">
                <span className="text-gray-500 uppercase block text-[8px] tracking-wide">COMBAT ASSETS</span>
                <span className="text-white text-sm block mt-1 font-extrabold">{activeFocusDossier.powerRating}</span>
                <span className="text-[7px] text-gray-500 font-semibold block tracking-wider uppercase mt-1">POWER INDEX</span>
              </div>
              <div className="p-2.5 bg-black/30 border border-green-950 rounded-sm">
                <span className="text-gray-500 uppercase block text-[8px] tracking-wide">NATIONAL PRODUCT</span>
                <span className="text-white text-sm block mt-1 font-extrabold">${(activeFocusDossier.gdpB).toFixed(0)}B</span>
                <span className="text-[7px] text-gray-500 font-semibold block tracking-wider uppercase mt-1">GDP AGGREGATE</span>
              </div>
            </div>

            {/* High fidelity Network telemetry progress levels */}
            <div className="space-y-3 bg-black/20 p-3 rounded border border-green-950">
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest border-b border-green-950/30 pb-1 mb-2">
                STRATEGIC NETWORK METRICS
              </span>

              {/* Progress 1: Dynamic Centrality index */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-gray-500 uppercase">DEGREE CENTRALITY:</span>
                  <span className="text-[#00ff44]">{activeFocusDossier.centrality} CONNECTIONS</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00ff44]"
                    style={{ width: `${Math.min(100, (activeFocusDossier.centrality / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Progress 2: Dynamic Influence reach */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-gray-500 uppercase">GLOBAL INFLUENCE RATING:</span>
                  <span className="text-[#00e5ff]">{activeFocusDossier.influence}% WEIGHT</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00e5ff]"
                    style={{ width: `${activeFocusDossier.influence}%` }}
                  />
                </div>
              </div>

              {/* Progress 3: Vulnerability state */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-gray-500 uppercase">SYSTEM RISK COEFF:</span>
                  <span className="text-red-500">{activeFocusDossier.vulnerabilityIndex}% HAZARD</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${activeFocusDossier.vulnerabilityIndex}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Semantic Relationship lists */}
            <div className="space-y-2.5">
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">
                BILATERAL COMMITTALS DIRECTORY
              </span>

              {/* All linked partners listed as quick inspect triggers */}
              <div className="space-y-1 text-[9px] font-mono leading-none">
                {displayedLinks
                  .filter((l) => {
                    const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id || '' : l.source) : '';
                    const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id || '' : l.target) : '';
                    return sId === activeFocusDossier.id || tId === activeFocusDossier.id;
                  })
                  .map((link) => {
                    const sId = link.source ? (typeof link.source === 'object' ? (link.source as any).id || '' : link.source) : '';
                    const tId = link.target ? (typeof link.target === 'object' ? (link.target as any).id || '' : link.target) : '';
                    const counterpartId = sId === activeFocusDossier.id ? tId : sId;
                    const partner = nodes.find((n) => n.id === counterpartId);

                    let badgeColor = 'text-[#10b981] bg-green-950/30 border-green-500/20';
                    if (link.type === 'WAR') badgeColor = 'text-red-500 bg-red-950/20 border-red-500/20';
                    if (link.type === 'TRADE') badgeColor = 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/20';
                    if (link.type === 'SANCTIONS') badgeColor = 'text-orange-500 bg-orange-950/20 border-orange-500/10';

                    return (
                      <div
                        key={link.id}
                        onClick={() => searchAndFocusNode(counterpartId)}
                        className="p-1.5 bg-black/30 border border-green-950 hover:border-green-700 rounded-sm cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span>{partner?.flag}</span>
                          <span className="text-white uppercase truncate font-bold font-mono">
                            {partner?.name || counterpartId}
                          </span>
                        </div>
                        <span className={`text-[8px] uppercase px-1 py-0.5 border font-semibold ${badgeColor}`}>
                          {link.type}
                        </span>
                      </div>
                    );
                  })}

                {displayedLinks.filter(l => {
                  const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id || '' : l.source) : '';
                  const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id || '' : l.target) : '';
                  return sId === activeFocusDossier.id || tId === activeFocusDossier.id;
                }).length === 0 && (
                  <div className="text-center py-4 bg-black/10 border border-dashed border-green-950/50 text-gray-600 rounded text-[9px] uppercase font-bold">
                    No active connections logged for selection regime
                  </div>
                )}
              </div>
            </div>

            {/* Strategic cyber analyst notes generation */}
            <div className="p-3 bg-black/40 border border-green-950 rounded relative">
              <div className="absolute top-1.5 right-1.5 flex gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 bg-[#00e5ff] rounded-full" />
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              </div>
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider mb-1.5">
                AI ANALYST INSIGHT LOGS
              </span>
              <p className="text-[10px] text-gray-300 leading-normal leading-relaxed text-justify mt-1">
                {activeFocusDossier.vulnerabilityIndex > 50 ? (
                  `Tactical alerts raised for ${activeFocusDossier.name}. Multi-front friction and active hostiles elevate coup and economic system volatility thresholds. High priority intervention recommended.`
                ) : activeFocusDossier.influence > 45 ? (
                  `${activeFocusDossier.name} is acting as a major bridging pivot cluster. Ideological parameters match strong stability margins. Secure trade corridor status valid.`
                ) : (
                  `Standard monitoring operations active on ${activeFocusDossier.name}. Core GDP is stable under present conditions with moderate local unrest indicators.`
                ).toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              </p>
            </div>

            {/* External trigger link action hubs */}
            <div className="space-y-1.5 pt-3 border-t border-green-950/30 shrink-0">
              <button
                onClick={() => {
                  audio.sfxKlaxon();
                  setCountryInspector(activeFocusDossier.id);
                }}
                className="w-full text-center py-2 bg-[#0d2a13]/60 hover:bg-[#1a5124] border border-[#00ff44]/50 rounded text-[10px] font-bold text-[#00ff44] cursor-pointer transition-all uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <Cpu className="w-3.5 h-3.5" /> DETAILED COMMODITY DOSSIER
              </button>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center text-gray-600 space-y-2 uppercase text-[10px] select-none font-bold">
            <AlertOctagon className="w-8 h-8 text-gray-800 mx-auto" />
            <div>No nodes matched operational query index</div>
          </div>
        )}
      </div>
    </div>
  );
}
