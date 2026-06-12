import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { useCopilotStore } from '../../store/copilotStore';
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
  centrality: number;       // Degree Centrality
  betweenness: number;      // Betweenness Centrality
  closeness: number;        // Closeness Centrality
  influence: number;        // Dynamic overall index
  vulnerabilityIndex: number; // Defensive vulnerabilities
  communityId: string;       // Calculated community grouping
}

interface OntologicalLink extends d3.SimulationLinkDatum<AnalyticalNode> {
  id: string;
  source: string | AnalyticalNode;
  target: string | AnalyticalNode;
  type: 'ALLIANCE' | 'TRADE' | 'WAR' | 'SANCTIONS' | 'INTEL_SHARING' | 'PROXY_SUPPORT' | 'NUCLEAR_DETERRENCE';
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

  const highlightedCountries = useCopilotStore((s) => s.highlightedCountries);

  const svgRef = useRef<SVGSVGElement>(null);

  // Core generated graph state
  const [nodes, setNodes] = useState<AnalyticalNode[]>([]);
  const [links, setLinks] = useState<OntologicalLink[]>([]);
  const [coords, setCoords] = useState<{ id: string; x: number; y: number }[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // Inspection & Interaction states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(playerCountryId);
  const [selectedLinkLabel, setSelectedLinkLabel] = useState<OntologicalLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tactical Workstation Focus Modes
  // 'WORKSTATION' = Standard explore, 'CENTRALITY' = Heatmap visualization, 'PATH' = Corridor tracer, 'NEIGHBORHOOD' = Search Around
  const [workstationMode, setWorkstationMode] = useState<'WORKSPACE' | 'CENTRALITY' | 'PATH' | 'NEIGHBORHOOD'>('WORKSPACE');

  // Semantic Link Category filter checkboxes
  const [activeEdgeFilters, setActiveEdgeFilters] = useState<{ [key: string]: boolean }>({
    ALLIANCE: true,
    WAR: true,
    TRADE: true,
    SANCTIONS: true,
    INTEL_SHARING: true,
    PROXY_SUPPORT: true,
    NUCLEAR_DETERRENCE: true,
  });

  // Action states for corridor pathway analyzer
  const [pathStartNodeId, setPathStartNodeId] = useState<string | null>(playerCountryId);
  const [pathEndNodeId, setPathEndNodeId] = useState<string | null>(null);
  const [calculatedPath, setCalculatedPath] = useState<string[]>([]);

  // Action states for neighborhood search-around explorer
  const [neighborhoodSeedId, setNeighborhoodSeedId] = useState<string | null>(playerCountryId);
  const [neighborhoodDegrees, setNeighborhoodDegrees] = useState<number>(1);
  const [neighborhoodRelationClass, setNeighborhoodRelationClass] = useState<'ALL' | 'ALLIANCE' | 'WAR' | 'TRADE' | 'COVERT'>('ALL');

  // Mouse hover tracking
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  // Custom Context Menu on Right-Click
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // Mutable references for D3 engine synchronization
  const simNodesRef = useRef<AnalyticalNode[]>([]);
  const simulationRef = useRef<d3.Simulation<AnalyticalNode, OntologicalLink> | null>(null);

  // 1. DYNAMIC NETWORK ANALYSIS INGEST & GRAPH ANALYSIS PARSING
  useEffect(() => {
    // Generate nodes
    const listNodes: AnalyticalNode[] = Object.keys(countries).map((id) => {
      const c = countries[id];
      return {
        id,
        name: c.name,
        flag: c.flagEmoji,
        powerRating: c.arsenal.totalPowerRating || 1,
        gdpB: c.economic.gdpB || 100,
        allianceBlock: c.allianceBlock,
        ideology: c.political.ideology,
        threatLevel: c.threatLevel,
        hasNuclear: c.arsenal.nuclearCapable || false,
        centrality: 0,
        betweenness: 0,
        closeness: 0,
        influence: 0,
        vulnerabilityIndex: 0,
        communityId: c.allianceBlock, // Initial community assignment
      };
    });

    // Generate link dictionary
    const listLinks: OntologicalLink[] = [];

    Object.keys(countries).forEach((srcId) => {
      const c = countries[srcId];

      // A. Alliances
      Object.keys(countries).forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        if (c.allianceBlock !== 'NEUTRAL' && c.allianceBlock === target.allianceBlock) {
          listLinks.push({
            id: `alliance_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'ALLIANCE',
            weight: 100,
            details: `${c.allianceBlock} Unified Mutual Defense Integration Pact. Full defensive containment umbrella is active.`,
            bidirectional: true,
          });
        }
      });

      // B. Hostility (Kinetic War)
      c.atWarWith?.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        listLinks.push({
          id: `war_${srcId}_${tgtId}`,
          source: srcId,
          target: tgtId,
          type: 'WAR',
          weight: 100,
          details: `Direct military clash active. Kinetic engagement parameters authorized on all operational theaters.`,
          bidirectional: true,
        });
      });

      // C. Trade Flows
      c.tradePartners?.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        if (!target) return;

        // Skip if alliance duplicate
        const allianceExists = listLinks.some(
          (l) => l.type === 'ALLIANCE' && ((l.source === srcId && l.target === tgtId) || (l.source === tgtId && l.target === srcId))
        );
        if (!allianceExists) {
          listLinks.push({
            id: `trade_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'TRADE',
            weight: 50,
            details: `Bilateral trade corridors. High dependency resource pipelines, technological exchanges, and mutual investment integration.`,
            bidirectional: true,
          });
        }
      });

      // D. Sanctions
      c.economic?.sanctionedBy?.forEach((tgtId) => {
        listLinks.push({
          id: `sanctions_${tgtId}_${srcId}`,
          source: tgtId, // Sender of embargo
          target: srcId, // Embargo target
          type: 'SANCTIONS',
          weight: 60,
          details: `Unilateral restrictive economic blockade target. Restricts sovereign cash flow pipelines and commercial transactions.`,
          bidirectional: false,
        });
      });

      // E. Intelligence Sharing
      Object.keys(countries).forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        // High mutual opinion + same alliance block suggests strong intelligence integration
        if (c.allianceBlock !== 'NEUTRAL' && c.allianceBlock === target.allianceBlock && (c.opinions?.[tgtId] || 0) > 40) {
          listLinks.push({
            id: `intel_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'INTEL_SHARING',
            weight: 75,
            details: `Direct counter-intelligence backchannels. Real-time satellite recon arrays, cyber signal intercepts, and covert threat profiling databases.`,
            bidirectional: true,
          });
        }
      });

      // F. Proxy Support
      c.political?.factions?.forEach((facet) => {
        if (facet.foreignBacker && facet.foreignBacker !== srcId) {
          listLinks.push({
            id: `proxy_${facet.foreignBacker}_${srcId}`,
            source: facet.foreignBacker,
            target: srcId,
            type: 'PROXY_SUPPORT',
            weight: 65,
            details: `Covert operational framework. Financial assets, black-market armaments, and tactical training programs dispatched to local faction blocks.`,
            bidirectional: false,
          });
        }
      });

      // G. Nuclear Deterrence
      Object.keys(countries).forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        // Nuclear nations of opposing blocks or highly negative opinions
        if (c.arsenal?.nuclearCapable && target.arsenal?.nuclearCapable && (c.opinions?.[tgtId] || 0) < -20) {
          listLinks.push({
            id: `deterrence_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'NUCLEAR_DETERRENCE',
            weight: 95,
            details: `Strategic Mutually Assured Destruction containment posture. ICBM / SLBM telemetry systems remain locked on strike coordinates.`,
            bidirectional: true,
          });
        }
      });
    });

    // 2. COMPUTE HIGH-FIDELITY GRAPH THEORY METRICS
    // Adjacency representations for calculations
    const nodeIds = listNodes.map((n) => n.id);
    const adjMap: { [id: string]: string[] } = {};
    nodeIds.forEach((id) => { adjMap[id] = []; });

    listLinks.forEach((l) => {
      const s = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
      const t = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
      if (s && t && adjMap[s] && adjMap[t]) {
        adjMap[s].push(t);
        // If bidirectional or trade or alliance, map both ways
        if (l.bidirectional || l.type === 'ALLIANCE' || l.type === 'TRADE' || l.type === 'WAR' || l.type === 'INTEL_SHARING' || l.type === 'NUCLEAR_DETERRENCE') {
          adjMap[t].push(s);
        }
      }
    });

    // Simple robust BFS Shortest Path Pair finder
    const findPathsBFS = (start: string, end: string): string[] => {
      if (start === end) return [start];
      const queue: string[][] = [[start]];
      const visited = new Set<string>([start]);

      while (queue.length > 0) {
        const path = queue.shift()!;
        const curr = path[path.length - 1];
        if (curr === end) return path;

        const neighbors = adjMap[curr] || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push([...path, n]);
          }
        }
      }
      return [];
    };

    // Calculate Betweenness Centrality
    const betweennessCount: { [id: string]: number } = {};
    nodeIds.forEach((id) => { betweennessCount[id] = 0; });

    let totalPairsCalculated = 0;
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const path = findPathsBFS(nodeIds[i], nodeIds[j]);
        if (path.length > 2) {
          totalPairsCalculated++;
          // Increment scores for intermediate nodes on shortest path
          for (let k = 1; k < path.length - 1; k++) {
            betweennessCount[path[k]]++;
          }
        }
      }
    }

    // Calculate Closeness Centrality
    const closenessSum: { [id: string]: number } = {};
    nodeIds.forEach((id) => {
      let sumDist = 0;
      let reachableCount = 0;

      // Run BFS to calculate distance to all reachable nodes
      const dist: { [nid: string]: number } = { [id]: 0 };
      const queue: string[] = [id];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const d = dist[curr];

        const neighbors = adjMap[curr] || [];
        for (const n of neighbors) {
          if (dist[n] === undefined) {
            dist[n] = d + 1;
            sumDist += (d + 1);
            reachableCount++;
            queue.push(n);
          }
        }
      }

      closenessSum[id] = sumDist > 0 ? reachableCount / sumDist : 0;
    });

    // Populate analytical metrics onto nodes
    listNodes.forEach((node) => {
      const connected = listLinks.filter((l) => {
        const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
        const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
        return sId === node.id || tId === node.id;
      });

      // A. Degree Centrality
      node.centrality = connected.length;

      // B. Betweenness score scaled 0-100
      const maxRawB = totalPairsCalculated || 1;
      node.betweenness = Math.round((betweennessCount[node.id] / maxRawB) * 100);

      // C. Closeness score scaled 0-100
      node.closeness = Math.round(closenessSum[node.id] * 100);

      // D. Tactical vulnerability coefficients (wars, embargoes, etc)
      const activeWars = connected.filter((l) => l.type === 'WAR').length;
      const embargosInput = connected.filter((l) => {
        if (l.type !== 'SANCTIONS') return false;
        const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
        return tId === node.id;
      }).length;
      node.vulnerabilityIndex = Math.min(100, Math.round(
        (activeWars * 35) + (embargosInput * 15) + (node.threatLevel === 'RED' ? 25 : node.threatLevel === 'ORANGE' ? 10 : 0)
      ));

      // E. Dynamic Overall Influence Rating
      const blocBonus = node.allianceBlock !== 'NEUTRAL' ? 12 : 0;
      node.influence = Math.min(100, Math.round(
        (node.powerRating / 2.3) + (node.gdpB / 380) + blocBonus + (node.closeness * 0.25)
      ));
    });

    // Preserve coordinates and physics states from previous simulation run to prevent jumping/freezing
    listNodes.forEach((n) => {
      const match = simNodesRef.current.find((prev) => prev.id === n.id);
      if (match) {
        if (match.x !== undefined) n.x = match.x;
        if (match.y !== undefined) n.y = match.y;
        if (match.vx !== undefined) n.vx = match.vx;
        if (match.vy !== undefined) n.vy = match.vy;
        if (match.fx !== undefined) n.fx = match.fx;
        if (match.fy !== undefined) n.fy = match.fy;
      }
    });

    setNodes(listNodes);
    setLinks(listLinks);
    simNodesRef.current = listNodes;
  }, [countries]);

  // 2. PATH ANALYSIS TRACER ENGINE
  useEffect(() => {
    if (workstationMode === 'PATH' && pathStartNodeId && pathEndNodeId) {
      // Re-map actual node ids
      const adjMap: { [id: string]: string[] } = {};
      const nodeIds = nodes.map((n) => n.id);
      nodeIds.forEach((id) => { adjMap[id] = []; });

      links.forEach((l) => {
        const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const t = typeof l.target === 'object' ? (l.target as any).id : l.target;

        // Ensure both ends are active in current filters
        const activeTypes = Object.keys(activeEdgeFilters).filter((k) => activeEdgeFilters[k]);
        if (s && t && activeTypes.includes(l.type)) {
          adjMap[s].push(t);
          if (l.bidirectional || l.type === 'ALLIANCE' || l.type === 'TRADE' || l.type === 'WAR' || l.type === 'INTEL_SHARING' || l.type === 'NUCLEAR_DETERRENCE') {
            adjMap[t].push(s);
          }
        }
      });

      // BFS lookup
      const queue: string[][] = [[pathStartNodeId]];
      const visited = new Set<string>([pathStartNodeId]);
      let pathFound: string[] = [];

      while (queue.length > 0) {
        const path = queue.shift()!;
        const curr = path[path.length - 1];
        if (curr === pathEndNodeId) {
          pathFound = path;
          break;
        }

        const neighbors = adjMap[curr] || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push([...path, n]);
          }
        }
      }
      setCalculatedPath(pathFound);
    } else {
      setCalculatedPath([]);
    }
  }, [workstationMode, pathStartNodeId, pathEndNodeId, activeEdgeFilters, nodes, links]);

  // 3. SEED COORDS UPDATE TRIGGERS D3 PHYSICAL SIMULATOR
  useEffect(() => {
    if (nodes.length === 0) return;

    const simNodes: AnalyticalNode[] = JSON.parse(JSON.stringify(nodes));
    const simLinks: OntologicalLink[] = JSON.parse(JSON.stringify(links));

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
      .force('link', d3.forceLink<AnalyticalNode, OntologicalLink>(simLinks).id((d) => d.id || '').distance((d) => {
        if (d.type === 'WAR' || d.type === 'NUCLEAR_DETERRENCE') return 230;
        if (d.type === 'ALLIANCE' || d.type === 'INTEL_SHARING') return 80;
        if (d.type === 'SANCTIONS') return 130;
        return 110;
      }))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => {
        return Math.sqrt(d.powerRating || 1) * 0.95 + 26;
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

  // D3 viewport zoom controller
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
        d3.select('#link-analysis-stage').attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // Bi-directional state integration sync with useLinkedAnalysisStore
  const globalSelectedCountryId = useLinkedAnalysisStore((s) => s.selectedCountryId);
  const globalSelectedEdge = useLinkedAnalysisStore((s) => s.selectedEdge);

  useEffect(() => {
    if (globalSelectedCountryId && globalSelectedCountryId !== selectedNodeId) {
      setSelectedNodeId(globalSelectedCountryId);
      setSelectedLinkLabel(null);
      searchAndFocusNode(globalSelectedCountryId);
    } else if (globalSelectedCountryId === null && selectedNodeId !== null && selectedNodeId !== playerCountryId) {
      setSelectedNodeId(playerCountryId);
    }
  }, [globalSelectedCountryId]);

  useEffect(() => {
    if (globalSelectedEdge) {
      const match = links.find((l) => {
        const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
        const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
        return (
          l.type === globalSelectedEdge.type &&
          ((sId === globalSelectedEdge.source && tId === globalSelectedEdge.target) ||
           (sId === globalSelectedEdge.target && tId === globalSelectedEdge.source))
        );
      });
      if (match) {
        setSelectedLinkLabel(match);
        setSelectedNodeId(null);
      }
    } else {
      setSelectedLinkLabel(null);
    }
  }, [globalSelectedEdge, links]);

  // DRAG & DROP PHYSICS callbacks
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
    const pt = coords.find((p) => p.id === id);
    if (pt && svgRef.current) {
      const svg = d3.select(svgRef.current);
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
    useLinkedAnalysisStore.getState().selectCountry(id);
  };

  const handleLinkClick = (e: React.MouseEvent, link: OntologicalLink) => {
    e.stopPropagation();
    setSelectedLinkLabel(link);
    audio.sfxKeyClick();

    const sId = link.source ? (typeof link.source === 'object' ? (link.source as any).id : link.source) : '';
    const tId = link.target ? (typeof link.target === 'object' ? (link.target as any).id : link.target) : '';
    useLinkedAnalysisStore.getState().selectEdge({
      source: sId,
      target: tId,
      type: link.type,
    });
  };

  // Node Context Menu operations
  const handleNodeContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    audio.sfxKeyClick();
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        nodeId: id,
      });
    }
  };

  // CLOSE CONTEXT MENU
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // Isolate Search Neighborhood calculator (BFS traversal up to N degrees)
  const computeReachableNeighborhood = (seed: string, degrees: number, relClass: string): Set<string> => {
    const reachable = new Set<string>([seed]);
    let currentGeneration = new Set<string>([seed]);

    for (let d = 0; d < degrees; d++) {
      const nextGeneration = new Set<string>();
      currentGeneration.forEach((curr) => {
        links.forEach((l) => {
          const s = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
          const t = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';

          let matchesRealClass = true;
          if (relClass === 'ALLIANCE') matchesRealClass = l.type === 'ALLIANCE';
          else if (relClass === 'WAR') matchesRealClass = l.type === 'WAR';
          else if (relClass === 'TRADE') matchesRealClass = l.type === 'TRADE';
          else if (relClass === 'COVERT') matchesRealClass = l.type === 'INTEL_SHARING' || l.type === 'PROXY_SUPPORT';

          if (matchesRealClass) {
            if (s === curr && !reachable.has(t)) {
              reachable.add(t);
              nextGeneration.add(t);
            } else if (t === curr && (l.bidirectional || l.type === 'ALLIANCE' || l.type === 'TRADE' || l.type === 'WAR') && !reachable.has(s)) {
              reachable.add(s);
              nextGeneration.add(s);
            }
          }
        });
      });
      currentGeneration = nextGeneration;
    }
    return reachable;
  };

  // 4. APPLY CORE GRAPH FILTERS (SEARCH, TOGGLE CHECKS, TIMELINE, NEIGHBORHOODS)
  const activeNeighborhoodSet = workstationMode === 'NEIGHBORHOOD' && neighborhoodSeedId
    ? computeReachableNeighborhood(neighborhoodSeedId, neighborhoodDegrees, neighborhoodRelationClass)
    : null;

  const displayedNodes = nodes.filter((node) => {
    // A. Query constraints
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase()) && !node.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // B. Neighborhood isolations constraints
    if (activeNeighborhoodSet && !activeNeighborhoodSet.has(node.id)) {
      return false;
    }

    return true;
  });

  const displayedLinks = links.filter((link) => {
    const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;

    // A. Category checkbox toggles
    if (!activeEdgeFilters[link.type]) {
      return false;
    }

    // B. Neighborhood boundaries
    if (activeNeighborhoodSet && (!activeNeighborhoodSet.has(sId) || !activeNeighborhoodSet.has(tId))) {
      return false;
    }

    return true;
  });

  // Calculate metrics
  const displayAlliancesCount = displayedLinks.filter((l) => l.type === 'ALLIANCE').length;
  const displayWarsCount = displayedLinks.filter((l) => l.type === 'WAR').length;
  const displaySanctionsCount = displayedLinks.filter((l) => l.type === 'SANCTIONS').length;
  const displayCovertCount = displayedLinks.filter((l) => l.type === 'INTEL_SHARING' || l.type === 'PROXY_SUPPORT').length;

  const getDossierNode = () => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes.find((n) => n.id === playerCountryId);
  };
  const activeFocusDossier = getDossierNode();

  // Highlight line styling rules
  const getLineStyles = (type: string, isMainSelected: boolean, isHovered: boolean, isPathCandidate: boolean) => {
    const defaultOpacity = isHovered ? '1.0' : isMainSelected ? '1.0' : '0.28';
    let stroke = 'rgba(0, 255, 68, 0.4)';
    let dash = undefined;
    let className = '';

    if (isPathCandidate) {
      stroke = '#f1c40f';
      className = 'stroke-[2.5px] animate-pulse glow-cyan-path';
      return { stroke, strokeDasharray: dash, opacity: '1.0', className };
    }

    if (type === 'TRADE') {
      stroke = '#00e5ff';
      dash = '3,4';
    } else if (type === 'WAR') {
      stroke = '#ff2244';
      className = 'war-pulse-edge stroke-[2px]';
    } else if (type === 'ALLIANCE') {
      stroke = '#10b981';
      className = 'alliance-glow-edge';
    } else if (type === 'SANCTIONS') {
      stroke = '#f39c12';
      dash = '1,3';
    } else if (type === 'INTEL_SHARING') {
      stroke = '#ac15b8';
      dash = '5,3';
    } else if (type === 'PROXY_SUPPORT') {
      stroke = '#3498db';
      dash = '4,4';
    } else if (type === 'NUCLEAR_DETERRENCE') {
      stroke = '#ff6b6b';
      className = 'ping-slow stroke-[1.5px]';
    }

    return { stroke, strokeDasharray: dash, opacity: defaultOpacity, className };
  };

  // Check if link is part of identified shortest path corridor
  const isLinkInShortestPath = (link: OntologicalLink) => {
    if (calculatedPath.length < 2) return false;
    const sId = link.source ? (typeof link.source === 'object' ? (link.source as any).id : link.source) : '';
    const tId = link.target ? (typeof link.target === 'object' ? (link.target as any).id : link.target) : '';

    for (let i = 0; i < calculatedPath.length - 1; i++) {
      const u = calculatedPath[i];
      const v = calculatedPath[i + 1];
      if ((sId === u && tId === v) || (sId === v && tId === u)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="w-full h-full bg-[#020503] text-green-400 font-mono flex flex-col xl:flex-row border border-green-500/20 overflow-hidden relative select-none">
      {/* Laser HUD scanning line */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, #00ff44 0%, transparent 80%)' }} />
      <div className="scanlines absolute inset-0 pointer-events-none opacity-20" />

      {/* LEFT CONTROL SYSTEM WORKBENCH (w-80 sidebar) */}
      <div className="w-full xl:w-[350px] bg-[#020603]/95 border-b xl:border-b-0 xl:border-r border-green-500/20 flex flex-col relative z-20 max-h-full overflow-y-auto">
        <div className="p-3 border-b border-[#143217]/50 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#00ff44] font-bold tracking-widest uppercase">
            <Radio className="w-4 h-4 animate-pulse text-[#00ff44]" />
            LINK ANALYSIS WORKSPACE // V1.5
          </div>
          <span className="text-[8px] px-1.5 py-0.5 border border-amber-500/40 text-amber-400 bg-amber-950/20 rounded font-bold uppercase select-none tracking-widest">
            TACTICAL RADAR
          </span>
        </div>

        {/* WORKSTATION MODE SWITCHER BAR */}
        <div className="p-2 border-b border-green-950 bg-black/30 space-y-1">
          <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest px-1 block mb-1">
            WORKSTATION OPERATIONAL LAYER
          </span>
          <div className="grid grid-cols-2 gap-1 text-[9px] uppercase font-bold text-gray-300">
            {[
              { id: 'WORKSPACE', label: '1. EXPLORE NETWORK', desc: 'Standard Relational' },
              { id: 'CENTRALITY', label: '2. CENTRALITY MAP', desc: 'Flow Importance' },
              { id: 'PATH', label: '3. CORRIDOR PATHS', desc: 'Shortest Route' },
              { id: 'NEIGHBORHOOD', label: '4. NEIGHBORHOOD', desc: 'Outward Expand' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  audio.sfxKeyClick();
                  setWorkstationMode(m.id as any);
                }}
                className={`p-1.5 border rounded text-left transition-all relative ${
                  workstationMode === m.id
                    ? 'border-green-400 bg-[#07240c] text-white font-extrabold shadow-[0_0_8px_rgba(0,255,68,0.2)]'
                    : 'border-green-900/45 bg-[#020502]/60 hover:bg-[#061808] hover:border-green-600/60'
                }`}
              >
                {workstationMode === m.id && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#00ff44] rounded-bl" />
                )}
                <div className="truncate text-[8.5px] tracking-wide">{m.label}</div>
                <div className="text-[7px] text-gray-500 leading-none truncate mt-0.5 font-normal">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* WORKSPACE OPERATIONS CONSTRUCTS */}
        <div className="p-2.5 border-b border-green-950 bg-black/10 space-y-2">
          {/* A. WORKSPACE OVERVIEW COGNITIVE FILTERS */}
          {workstationMode === 'WORKSPACE' && (
            <div className="space-y-1">
              <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest block">RELATIONSHIP CLASSES:</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] text-gray-400 font-medium">
                {Object.keys(activeEdgeFilters).map((f) => (
                  <label key={f} className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none py-0.5">
                    <input
                      type="checkbox"
                      checked={activeEdgeFilters[f]}
                      onChange={() => {
                        audio.sfxKeyClick();
                        setActiveEdgeFilters({ ...activeEdgeFilters, [f]: !activeEdgeFilters[f] });
                      }}
                      className="rounded border-[#143217] bg-[#020503] text-[#00ff44] focus:ring-0 w-3 h-3 cursor-pointer"
                    />
                    <span className="truncate">{f.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* B. CENTRALITY MAP METRIC REGIMES */}
          {workstationMode === 'CENTRALITY' && (
            <div className="space-y-1">
              <span className="text-[8.5px] font-bold text-amber-400 uppercase tracking-widest block">CENTRALITY FOCUS RATINGS</span>
              <p className="text-[8.5px] text-gray-400 leading-relaxed">
                Nodes are rescaled and highlighted dynamically using live topological graph metrics. Toggle centrality paradigms in dossier.
              </p>
              <div className="p-1 px-2 border border-amber-500/20 bg-amber-950/10 text-amber-400 rounded-[2px] text-[8px] uppercase font-bold tracking-wider">
                💡 Node size reflects dynamic betweenness index.
              </div>
            </div>
          )}

          {/* C. ROUTE CORRIDOR PATH FINDER ANALYZER */}
          {workstationMode === 'PATH' && (
            <div className="space-y-2">
              <span className="text-[8.5px] font-bold text-cyan-400 uppercase tracking-widest block">TACTICAL ESCALATION TRACER</span>
              <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[7.5px]">ORIGIN SECURE:</span>
                  <select
                    value={pathStartNodeId || ''}
                    onChange={(e) => { audio.sfxKeyClick(); setPathStartNodeId(e.target.value || null); }}
                    className="w-full bg-[#020503] border border-cyan-800/40 text-[#00e5ff] py-1 px-1.5 mt-0.5 outline-none font-mono text-[8.5px] rounded uppercase"
                  >
                    <option value="">(SELECT START)</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} - {n.name}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[7.5px]">TARGET TERMINAL:</span>
                  <select
                    value={pathEndNodeId || ''}
                    onChange={(e) => { audio.sfxKeyClick(); setPathEndNodeId(e.target.value || null); }}
                    className="w-full bg-[#020503] border border-cyan-800/40 text-[#00e5ff] py-1 px-1.5 mt-0.5 outline-none font-mono text-[8.5px] rounded uppercase"
                  >
                    <option value="">(SELECT END)</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} - {n.name}</option>)}
                  </select>
                </div>
              </div>

              {calculatedPath.length > 0 ? (
                <div className="p-2 border border-cyan-800/30 bg-[#00e5ff]/5 rounded-[2px] space-y-1.5 select-text">
                  <div className="text-[8.5px] text-cyan-400 font-extrabold tracking-wider uppercase flex justify-between">
                    <span>⚡ CORE HIGHWAY IDENTIFIED</span>
                    <span>{calculatedPath.length - 1} HOP INTERNALS</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] font-bold">
                    {calculatedPath.map((hop, hIdx) => (
                      <React.Fragment key={hop}>
                        {hIdx > 0 && <span className="text-gray-600">➜</span>}
                        <span
                          onClick={() => { audio.sfxKeyClick(); setSelectedNodeId(hop); searchAndFocusNode(hop); }}
                          className="px-1 py-0.5 bg-cyan-950/60 border border-cyan-500/30 text-white hover:border-[#00e5ff] hover:text-[#00e5ff] rounded transition-all cursor-pointer"
                        >
                          {hop}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-2 border border-red-500/20 bg-red-950/10 text-center rounded text-[8px] text-red-400 font-semibold uppercase">
                  No direct relation route with active filters. Try toggling other relation classes.
                </div>
              )}
            </div>
          )}

          {/* D. OUTWARD NEIGHBORHOOD SEARCH-AROUND */}
          {workstationMode === 'NEIGHBORHOOD' && (
            <div className="space-y-2">
              <span className="text-[8.5px] font-bold text-teal-400 uppercase tracking-widest block">NEIGHBORHOOD SEARCH-AROUND</span>
              <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[7.5px]">SEED FOCUS ACTOR:</span>
                  <select
                    value={neighborhoodSeedId || ''}
                    onChange={(e) => { audio.sfxKeyClick(); setNeighborhoodSeedId(e.target.value || null); }}
                    className="w-full bg-[#020503] border border-teal-800/40 text-teal-300 py-1 px-1.5 mt-0.5 outline-none font-mono text-[8.5px] rounded uppercase"
                  >
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.id} - {n.name}</option>)}
                  </select>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase font-bold text-[7.5px]">ISOLATE DEGREE:</span>
                  <select
                    value={neighborhoodDegrees}
                    onChange={(e) => { audio.sfxKeyClick(); setNeighborhoodDegrees(parseInt(e.target.value, 10)); }}
                    className="w-full bg-[#020503] border border-teal-800/40 text-teal-300 py-1 px-1.5 mt-0.5 outline-none font-mono text-[8.5px] rounded uppercase"
                  >
                    <option value="1">1 DEGREE (IMMEDIATE)</option>
                    <option value="2">2 DEGREES (TRANSITIVE)</option>
                    <option value="3">3 DEGREES (EXPANDED)</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block uppercase font-bold text-[7.5px] mb-0.5">FILTER RELATION CLASS:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'ALL', label: 'ALL LINKS' },
                    { id: 'ALLIANCE', label: 'ALLIANCE' },
                    { id: 'WAR', label: 'CONFLICT' },
                    { id: 'TRADE', label: 'COMMERCE' },
                  ].map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => { audio.sfxKeyClick(); setNeighborhoodRelationClass(rel.id as any); }}
                      className={`px-1.5 py-0.5 border text-[7.5px] font-bold rounded uppercase ${
                        neighborhoodRelationClass === rel.id
                          ? 'border-teal-400 bg-teal-900/30 text-teal-300'
                          : 'border-teal-900 bg-black/40 text-gray-500 hover:text-teal-400 hover:border-teal-700'
                      }`}
                    >
                      {rel.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH BAR CONSTRUCT */}
        <div className="p-2 border-b border-[#143217]/20 bg-black/5">
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH ACTOR BY KEYCODE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#010402] border border-[#143217] text-[9.5px] pl-8 pr-2 py-1.5 rounded text-white placeholder-green-800 focus:border-[#00ff44] outline-none font-mono uppercase"
            />
            <Search className="w-3.5 h-3.5 text-green-700 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* TACTICAL DIRECTORY LISTING */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-black/10 space-y-1">
          <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest px-1 py-1 border-b border-[#143217]/30 mb-1.5 flex justify-between">
            <span>TACTICAL ACTORS DETECTED ({displayedNodes.length})</span>
            {workstationMode === 'NEIGHBORHOOD' && <span className="text-teal-400 font-extrabold text-[7.5px]">Isolate Active</span>}
          </div>

          {displayedNodes.map((n) => {
            const isSelected = n.id === selectedNodeId;
            const isHovered = n.id === hoveredNodeId;
            const isPlayer = n.id === playerCountryId;
            const isOrigin = n.id === pathStartNodeId;
            const isTarget = n.id === pathEndNodeId;

            let borderStyle = isSelected ? 'border-[#00ff44] bg-green-950/15' : isHovered ? 'border-green-500/50 bg-[#020d04]' : 'border-green-950/40 bg-black/30';
            if (workstationMode === 'PATH') {
              if (isOrigin) borderStyle = 'border-cyan-500 bg-cyan-950/20';
              else if (isTarget) borderStyle = 'border-amber-400 bg-amber-950/15';
              else if (calculatedPath.includes(n.id)) borderStyle = 'border-cyan-600/60 bg-cyan-950/5';
            }

            return (
              <div
                key={n.id}
                onClick={() => handleNodeClick(n.id)}
                onMouseEnter={() => setHoveredNodeId(n.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onContextMenu={(e) => handleNodeContextMenu(e, n.id)}
                className={`p-1.5 border rounded cursor-pointer transition-all flex flex-col justify-between select-none ${borderStyle}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 overflow-hidden">
                    <span className="text-xs shrink-0 select-none">{n.flag}</span>
                    <span className="font-bold text-[10px] text-white truncate uppercase">{n.name}</span>
                  </div>
                  <div className="flex items-center gap-1 select-none font-mono text-[7.5px]">
                    {isPlayer && (
                      <span className="text-[7px] bg-[#00ff44]/10 border border-[#00ff44]/30 px-1 py-px text-[#00ff44] font-bold rounded">HQ</span>
                    )}
                    {isOrigin && workstationMode === 'PATH' && (
                      <span className="text-[7px] bg-cyan-950/80 border border-cyan-400 px-1 py-px text-cyan-400 font-bold rounded">SRC</span>
                    )}
                    {isTarget && workstationMode === 'PATH' && (
                      <span className="text-[7px] bg-amber-950/80 border border-amber-400 px-1 py-px text-amber-400 font-bold rounded">DST</span>
                    )}
                    <span className="bg-[#051105] border border-green-950 px-1 rounded font-bold text-gray-400">{n.id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[7.5px] text-gray-500 uppercase mt-1 border-t border-green-950/10 pt-1 font-mono tracking-wider">
                  <div>DEGREE: <span className="text-white font-bold">{n.centrality}</span></div>
                  <div>BTWNS: <span className="text-amber-500 font-bold">{n.betweenness}%</span></div>
                  <div>CLOSE: <span className="text-indigo-400 font-bold">{n.closeness}%</span></div>
                  <div className="truncate text-gray-400 text-right">{n.allianceBlock}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER INTERACTIVE SVG STAGE CANVASES */}
      <div className="flex-1 flex flex-col relative h-[400px] xl:h-auto overflow-hidden">
        {/* VIEWPORT CONTROLS */}
        <div className="absolute top-2.5 left-2.5 z-20 flex gap-1.5">
          <button
            onClick={resetZoom}
            className="p-1 px-2.5 bg-[#020503]/90 border border-green-500/30 hover:border-green-400 text-[10px] font-bold tracking-widest text-[#00ff44] rounded flex items-center gap-1.5 cursor-pointer uppercase shadow transition-all active:scale-95"
            title="Reset stage zoom transform coordinate scales"
          >
            <Compass className="w-3.5 h-3.5" /> RE-ALIGN EYEPIECE
          </button>
        </div>

        {/* TACTICAL FLOATING GRAPH METRICS */}
        <div className="absolute top-2.5 right-2.5 z-20 bg-[#020503]/95 border border-green-500/30 p-2.5 rounded shadow-lg max-w-sm font-mono hidden md:block">
          <div className="text-[10px] text-[#00ff44] font-extrabold flex items-center gap-1 border-b border-[#143217]/50 pb-1 mb-1.5 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 animate-pulse text-[#00ff44]" /> LIVE SURFACE SEGMENTS
          </div>
          <div className="grid grid-cols-4 gap-3 text-[8.5px] text-gray-500 uppercase">
            <div>NATO/BRICS/GCC: <span className="text-emerald-400 font-extrabold block text-xs mt-0.5">{displayAlliancesCount}</span></div>
            <div>冲突 KINETIC FRONT: <span className="text-red-500 font-extrabold block text-xs mt-0.5">{displayWarsCount}</span></div>
            <div>制裁 EMBARGOES: <span className="text-orange-500 font-extrabold block text-xs mt-0.5">{displaySanctionsCount}</span></div>
            <div>COVERT LINKS: <span className="text-[#ac15b8] font-extrabold block text-xs mt-0.5">{displayCovertCount}</span></div>
          </div>
        </div>

        {/* PORTAL RIGHT-CLICK TACTICAL HUD CONTEXT MENU */}
        {contextMenu && (
          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="absolute z-50 bg-[#020603] border border-cyan-500 text-[9px] text-[#00ff44] font-bold py-1 px-1.5 rounded shadow-[0_8px_16px_rgba(0,0,0,0.8)] w-44 font-mono divide-y divide-cyan-950/40 select-none animate-fade-in"
          >
            <div className="text-[7.5px] text-cyan-400 uppercase tracking-widest px-1 py-0.5 text-center bg-cyan-950/20 font-extrabold block mb-1">
              🔎 TACTICAL OPTS: {contextMenu.nodeId}
            </div>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                setWorkstationMode('PATH');
                setPathStartNodeId(contextMenu.nodeId);
              }}
              className="w-full text-left py-1 px-1 hover:bg-cyan-950 hover:text-white block"
            >
              📌 Set Path Origin
            </button>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                setWorkstationMode('PATH');
                setPathEndNodeId(contextMenu.nodeId);
                searchAndFocusNode(contextMenu.nodeId);
              }}
              className="w-full text-left py-1 px-1 hover:bg-cyan-950 hover:text-white block"
            >
              🎯 Set Path Target
            </button>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                setWorkstationMode('NEIGHBORHOOD');
                setNeighborhoodSeedId(contextMenu.nodeId);
                setNeighborhoodDegrees(1);
              }}
              className="w-full text-left py-1 px-1 hover:bg-cyan-950 hover:text-white block"
            >
              👁️ Isolate 1° Allies
            </button>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                setWorkstationMode('NEIGHBORHOOD');
                setNeighborhoodSeedId(contextMenu.nodeId);
                setNeighborhoodDegrees(2);
              }}
              className="w-full text-left py-1 px-1 hover:bg-cyan-950 hover:text-white block"
            >
              🔍 Isolate 2° Transitives
            </button>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                handleNodeClick(contextMenu.nodeId);
                searchAndFocusNode(contextMenu.nodeId);
              }}
              className="w-full text-left py-1 px-1 hover:bg-cyan-950 hover:text-white block"
            >
              👤 Select Dossier Focus
            </button>
            <button
              onClick={() => {
                audio.sfxKeyClick();
                setWorkstationMode('WORKSPACE');
                setNeighborhoodSeedId(null);
                setPathEndNodeId(null);
                setCalculatedPath([]);
              }}
              className="w-full text-left py-1 px-1 hover:bg-red-950 hover:text-white text-red-400 block font-normal"
            >
              ❌ Reset Workstation Isolations
            </button>
          </div>
        )}

        {/* SVG CONTAINER GRAPH WORKSPACE */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none bg-[#020503]"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handlePointerMove as any}
        >
          <defs>
            <pattern id="analysis-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 255, 68, 0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#analysis-grid)" />

          <g id="link-analysis-stage">
            {/* A. EDGE LINES */}
            {displayedLinks.map((link) => {
              const srcId = link.source ? (typeof link.source === 'object' ? (link.source as any).id : link.source) : '';
              const tgtId = link.target ? (typeof link.target === 'object' ? (link.target as any).id : link.target) : '';

              const srcPt = coords.find((p) => p.id === srcId);
              const tgtPt = coords.find((p) => p.id === tgtId);

              if (!srcPt || !tgtPt) return null;

              const isMainSelected = selectedNodeId === srcId || selectedNodeId === tgtId;
              const isHovered = hoveredNodeId === srcId || hoveredNodeId === tgtId;
              const isPathLink = isLinkInShortestPath(link);

              const lineStyle = getLineStyles(link.type, isMainSelected, isHovered, isPathLink);

              return (
                <g
                  key={link.id}
                  className="cursor-pointer"
                  onClick={(e) => handleLinkClick(e, link)}
                >
                  <line
                    x1={srcPt.x}
                    y1={srcPt.y}
                    x2={tgtPt.x}
                    y2={tgtPt.y}
                    stroke={lineStyle.stroke}
                    strokeWidth={isPathLink ? '3.5' : isHovered ? '2.5' : isMainSelected ? '2' : '1.2'}
                    strokeDasharray={lineStyle.strokeDasharray}
                    opacity={lineStyle.opacity}
                    className={lineStyle.className}
                  />

                  {/* Dynamic Edge labels display */}
                  {(isMainSelected || isHovered || isPathLink) && (
                    <g transform={`translate(${(srcPt.x + tgtPt.x) / 2}, ${(srcPt.y + tgtPt.y) / 2})`}>
                      <rect
                        x="-26"
                        y="-7"
                        width="52"
                        height="14"
                        fill="#020503"
                        stroke={isPathLink ? '#f1c40f' : lineStyle.stroke}
                        strokeWidth="0.6"
                        rx="1"
                        className="opacity-90"
                      />
                      <text
                        dy="3"
                        textAnchor="middle"
                        fill={isPathLink ? '#f1c40f' : lineStyle.stroke}
                        fontSize="6.5"
                        fontFamily="monospace"
                        fontWeight="black"
                        className="uppercase pointer-events-none select-none text-[6.5px]"
                      >
                        {link.type.replace('_', ' ')}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* B. ACTOR NODE GLYPHS */}
            {displayedNodes.map((node) => {
              const pt = coords.find((p) => p.id === node.id);
              if (!pt) return null;

              const isSelected = node.id === selectedNodeId;
              const isHovered = node.id === hoveredNodeId;
              const isPlayer = node.id === playerCountryId;
              const isPathMember = calculatedPath.includes(node.id);
              const isCopilotHighlighted = highlightedCountries.includes(node.id);

              // Centrality Visual Sizing Scale
              let radius = Math.max(22, Math.min(36, Math.sqrt(node.powerRating || 1) * 0.95 + 12));
              if (workstationMode === 'CENTRALITY') {
                // Resize based on dynamic Betweenness centrality score
                radius = Math.max(20, Math.min(42, (node.betweenness / 100) * 22 + 20));
              }

              let nodeFill = 'rgba(8, 26, 12, 0.85)';
              let nodeStroke = '#10b981';

              if (node.ideology === 'AUTOCRACY') {
                nodeFill = 'rgba(38, 8, 12, 0.85)';
                nodeStroke = '#ff2244';
              } else if (node.ideology === 'THEOCRACY') {
                nodeFill = 'rgba(34, 18, 8, 0.85)';
                nodeStroke = '#f39c12';
              } else if (node.ideology === 'TECHNOCRACY') {
                nodeFill = 'rgba(8, 22, 34, 0.85)';
                nodeStroke = '#00e5ff';
              }

              // Apply special styles if is Path Corridor node
              if (isPathMember && workstationMode === 'PATH') {
                nodeStroke = '#f1c40f'; // Highlight path
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer select-none"
                  onClick={() => handleNodeClick(node.id)}
                  onPointerDown={(e) => handlePointerDown(e, node)}
                  onPointerMove={(e) => handlePointerMove(e, node)}
                  onPointerUp={(e) => handlePointerUp(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                >
                  {/* Selector glowing ring */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={nodeStroke}
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Analyst Copilot highlighted targeting aura */}
                  {isCopilotHighlighted && (
                    <circle
                      r={radius + 12}
                      fill="none"
                      stroke="#ffb300"
                      strokeWidth="2.5"
                      strokeDasharray="3,3"
                      className="animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  )}

                  {/* Pulsing hazard ring if threat coefficients peaking */}
                  {node.vulnerabilityIndex > 60 && (
                    <circle
                      r={radius + 5}
                      fill="none"
                      stroke="#ff2244"
                      strokeWidth="1.2"
                      className="ping-slow"
                    />
                  )}

                  {/* Main core backing circle */}
                  <circle
                    r={radius}
                    fill={nodeFill}
                    stroke={isSelected ? '#00ff44' : isHovered ? '#00e5ff' : nodeStroke}
                    strokeWidth={isSelected ? '2.8' : isHovered ? '2' : '1.5'}
                    className="transition-all"
                  />

                  {/* Flag unicode identifier */}
                  <text
                    dy="5"
                    textAnchor="middle"
                    fontSize={radius > 28 ? '18' : '14'}
                    className="select-none pointer-events-none"
                  >
                    {node.flag}
                  </text>

                  {/* Key-code labels beneath node body */}
                  <g transform={`translate(0, ${radius + 11})`}>
                    <rect
                      x="-14"
                      y="-6"
                      width="28"
                      height="11"
                      fill="#020503"
                      stroke={isSelected ? '#00ff44' : nodeStroke}
                      strokeWidth="0.5"
                      rx="1"
                    />
                    <text
                      dy="2.5"
                      textAnchor="middle"
                      fill={isSelected ? '#00ff44' : '#ffffff'}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="black"
                      className="tracking-widest uppercase transition-colors pointer-events-none select-none text-[7px]"
                    >
                      {node.id}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* BOTTOM HUD LEGEND DICTIONARY */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 bg-[#020503]/95 border border-green-500/20 rounded p-2 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between text-[8px] uppercase tracking-wider text-gray-500 font-mono">
          <div className="flex items-center gap-1 text-[#00ff44] font-extrabold">
            <Radio className="w-3.5 h-3.5 text-[#00ff44]" /> LEGEND DICTIONARY:
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-[#10b981]" />
            <span className="text-[#10b981] font-bold">ALLIANCE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-[#ff2244]" />
            <span className="text-[#ff2244] font-bold">KINETIC CONFLICT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-b border-dashed border-[#00e5ff]" />
            <span className="text-[#00e5ff] font-bold">COMMERCE TRADE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-b border-dashed border-[#ac15b8]" />
            <span className="text-[#ac15b8] font-bold">CYBER INTEL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] border-b border-dotted border-[#ff6b6b]" />
            <span className="text-[#ff6b6b] font-bold">NUC DETERRENCE</span>
          </div>
          <div className="text-gray-600 hidden lg:block">
            🖱️ RIGHT-CLICK NODES FOR WORKSTATION ACTION OPTS • MOUSEWHEEL TO SCALING
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR INTELLIGENCE DOSSIER SECTION */}
      <div className="w-full xl:w-[350px] bg-[#020603]/95 border-t xl:border-t-0 xl:border-l border-green-500/20 flex flex-col relative z-20 overflow-y-auto shrink-0 max-h-full">
        <div className="p-3 border-b border-[#143217]/50 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#00ff44] font-bold tracking-widest uppercase">
            <Fingerprint className="w-4 h-4 text-[#00ff44]" />
            02 // COGNITIVE RECON DOSSIER
          </div>
          <span className="text-[8px] px-1.5 py-0.5 border border-green-500/30 font-bold bg-[#041206]">
            SECURE RECON
          </span>
        </div>

        {/* A. RELATION LINK DOSSIER DETAILS */}
        {selectedLinkLabel ? (
          <div className="p-4 space-y-4">
            <div className="p-3.5 bg-green-950/20 border border-green-500/30 rounded relative overflow-hidden">
              <span className="text-[8px] text-gray-500 font-bold block uppercase mb-1">RELATIONSHIP CLASS:</span>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-widest text-white uppercase font-sans">
                  {selectedLinkLabel.type.replace('_', ' ')}
                </span>
                <span className="text-[8.5px] font-mono select-none px-1.5 py-0.5 bg-black text-[#00ff44] border border-green-950 rounded">
                  STRENGTH: {selectedLinkLabel.weight}/100
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-relaxed font-sans first-letter:uppercase text-justify">
                "{selectedLinkLabel.details}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">ONTOLOGICAL TERMINALS:</span>
              <div className="grid grid-cols-3 gap-1 px-1 text-center items-center font-mono">
                <div className="p-2 border border-green-950 bg-black/40 rounded flex flex-col items-center">
                  <span className="text-2xl block mb-1">
                    {selectedLinkLabel.source ? (typeof selectedLinkLabel.source === 'object' ? (selectedLinkLabel.source as any).flag : (countries[selectedLinkLabel.source]?.flagEmoji || '')) : ''}
                  </span>
                  <span className="text-[9px] text-white font-extrabold uppercase truncate max-w-full block">
                    {selectedLinkLabel.source ? (typeof selectedLinkLabel.source === 'object' ? (selectedLinkLabel.source as any).name : (countries[selectedLinkLabel.source]?.name || selectedLinkLabel.source)) : ''}
                  </span>
                </div>
                <div className="text-[12px] font-bold text-gray-600 select-none">
                  {selectedLinkLabel.bidirectional ? '◀ ──── ▶' : '───── ▶'}
                </div>
                <div className="p-2 border border-green-950 bg-black/40 rounded flex flex-col items-center">
                  <span className="text-2xl block mb-1">
                    {selectedLinkLabel.target ? (typeof selectedLinkLabel.target === 'object' ? (selectedLinkLabel.target as any).flag : (countries[selectedLinkLabel.target]?.flagEmoji || '')) : ''}
                  </span>
                  <span className="text-[9px] text-white font-extrabold uppercase truncate max-w-full block">
                    {selectedLinkLabel.target ? (typeof selectedLinkLabel.target === 'object' ? (selectedLinkLabel.target as any).name : (countries[selectedLinkLabel.target]?.name || selectedLinkLabel.target)) : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-green-950/20">
              <button
                onClick={() => setSelectedLinkLabel(null)}
                className="w-full text-center py-2.5 border border-green-500/20 hover:border-[#00ff44] hover:bg-green-0/10 text-[10px] text-[#00ff44] font-bold rounded cursor-pointer transition-all uppercase"
              >
                RETURN TO FOCUS PROFILE
              </button>
            </div>
          </div>
        ) : activeFocusDossier ? (
          // B. ACTOR NODE PROFILE DOSSIER
          <div className="p-3.5 space-y-4">
            {/* Header Profiler */}
            <div className="flex items-center gap-3 bg-black/40 p-3 border border-green-950 rounded">
              <div className="text-3xl shrink-0 select-none">{activeFocusDossier.flag}</div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase truncate">
                    {activeFocusDossier.name}
                  </h3>
                  <span className="text-[8px] bg-green-950 border border-green-500/20 px-1 py-0.5 text-gray-400 font-bold font-mono">
                    {activeFocusDossier.id}
                  </span>
                </div>
                <p className="text-[8.5px] text-gray-500 uppercase tracking-widest mt-1">
                  {activeFocusDossier.ideology} Regime • {activeFocusDossier.allianceBlock} Bloc
                </p>
              </div>
            </div>

            {/* Combat Power & National Output Indicators */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
              <div className="p-2 bg-black/30 border border-green-950 rounded">
                <span className="text-gray-500 uppercase block text-[7.5px] tracking-wide">COMBAT CAPITAL</span>
                <span className="text-white text-xs block mt-1 font-extrabold font-mono">{activeFocusDossier.powerRating} RATIO</span>
              </div>
              <div className="p-2 bg-black/30 border border-green-950 rounded">
                <span className="text-gray-500 uppercase block text-[7.5px] tracking-wide">ECONOMIC INCOME</span>
                <span className="text-white text-xs block mt-1 font-extrabold font-mono">${activeFocusDossier.gdpB.toFixed(0)}B GDP</span>
              </div>
            </div>

            {/* STRATEGIC GRAPH THEORY METRICS */}
            <div className="space-y-3 bg-black/20 p-3 rounded border border-green-950">
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest border-b border-green-950/30 pb-1 mb-2">
                TOPOLOGICAL GRAPH THEORETIC ALIGNMENTS
              </span>

              {/* Progress 1: Degree connections count */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-extrabold">
                  <span className="text-gray-500 uppercase">DEGREE CENTRALITY (RELATIONAL SENSE):</span>
                  <span className="text-[#00ff44]">{activeFocusDossier.centrality} LINES REGISTERED</span>
                </div>
                <div className="h-1 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00ff44]"
                    style={{ width: `${Math.min(100, (activeFocusDossier.centrality / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Progress 2: Betweenness Centrality */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-extrabold">
                  <span className="text-gray-500 uppercase">BETWEENNESS CENTRALITY (TRANSIT CONNECTOR):</span>
                  <span className="text-amber-500">{activeFocusDossier.betweenness}% FLOW RATIO</span>
                </div>
                <div className="h-1 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${activeFocusDossier.betweenness}%` }}
                  />
                </div>
              </div>

              {/* Progress 3: Closeness Centrality */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-extrabold">
                  <span className="text-gray-500 uppercase">CLOSENESS CENTRALITY (EASE OF PROPAGATION):</span>
                  <span className="text-indigo-400">{activeFocusDossier.closeness}% DISTANCE COEFF</span>
                </div>
                <div className="h-1 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${activeFocusDossier.closeness}%` }}
                  />
                </div>
              </div>

              {/* Progress 4: Strategic Vulnerabilities */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8.5px] font-extrabold">
                  <span className="text-gray-500 uppercase">SOVEREIGN NETWORK FRICTION INDEX:</span>
                  <span className="text-red-500">{activeFocusDossier.vulnerabilityIndex}% SYSTEM SHOCK</span>
                </div>
                <div className="h-1 bg-black/40 rounded overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${activeFocusDossier.vulnerabilityIndex}%` }}
                  />
                </div>
              </div>
            </div>

            {/* DOCKED ACTIVE RELATION LINKS (FILTERS SENSITIVE) */}
            <div className="space-y-2">
              <span className="text-[8px] text-gray-500 font-bold block uppercase tracking-widest">
                ACTIVE RELATION CONNECTIONS ({displayedLinks.filter(l => {
                  const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
                  const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
                  return sId === activeFocusDossier.id || tId === activeFocusDossier.id;
                }).length})
              </span>

              <div className="space-y-1 text-[8.5px] max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {displayedLinks
                  .filter((l) => {
                    const sId = l.source ? (typeof l.source === 'object' ? (l.source as any).id : l.source) : '';
                    const tId = l.target ? (typeof l.target === 'object' ? (l.target as any).id : l.target) : '';
                    return sId === activeFocusDossier.id || tId === activeFocusDossier.id;
                  })
                  .map((link) => {
                    const sId = link.source ? (typeof link.source === 'object' ? (link.source as any).id : link.source) : '';
                    const tId = link.target ? (typeof link.target === 'object' ? (link.target as any).id : link.target) : '';
                    const counterpartId = sId === activeFocusDossier.id ? tId : sId;
                    const counterpart = nodes.find((n) => n.id === counterpartId);

                    let bColor = 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20';
                    if (link.type === 'WAR') bColor = 'text-red-500 bg-red-950/20 border-red-500/20';
                    else if (link.type === 'TRADE') bColor = 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20';
                    else if (link.type === 'SANCTIONS') bColor = 'text-orange-500 bg-orange-950/10 border-orange-500/20';
                    else if (link.type === 'INTEL_SHARING') bColor = 'text-[#ac15b8] bg-[#ac15b8]/10 border-[#ac15b8]/20';
                    else if (link.type === 'PROXY_SUPPORT') bColor = 'text-sky-400 bg-sky-950/20 border-sky-500/20';
                    else if (link.type === 'NUCLEAR_DETERRENCE') bColor = 'text-red-400 bg-red-950/40 border-red-400/40';

                    return (
                      <div
                        key={link.id}
                        onClick={() => { audio.sfxKeyClick(); setSelectedNodeId(counterpartId); searchAndFocusNode(counterpartId); }}
                        className="p-1.5 bg-black/30 border border-green-950/60 hover:border-green-600 rounded cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span>{counterpart?.flag}</span>
                          <span className="text-white font-extrabold uppercase truncate font-mono">{counterpart?.name || counterpartId}</span>
                        </div>
                        <span className={`text-[7.5px] uppercase px-1.5 py-0.5 border ${bColor}`}>
                          {link.type.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* ARTIFICIAL INTELLIGENCE LOG ANALYSES */}
            <div className="p-3 bg-black/40 border border-green-950 rounded relative font-sans leading-relaxed select-text">
              <div className="absolute top-1.5 right-1.5 flex gap-1 select-none animate-pulse">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[7.5px] text-gray-500 font-extrabold uppercase font-mono block tracking-wider mb-1.5">
                AI ANALYST INSIGHT LOGS
              </span>
              <p className="text-[10px] text-gray-300 text-justify">
                {activeFocusDossier.vulnerabilityIndex > 50 ? (
                  `Tactical alerts raised for ${activeFocusDossier.name}. Multi-front hostilities, sanction friction, and local rebellion risk elevate national vulnerability rating to ${activeFocusDossier.vulnerabilityIndex}%. Focus intelligence ops immediately to contain systemic damage.`
                ) : activeFocusDossier.influence > 45 ? (
                  `Strategic core pivot candidate. ${activeFocusDossier.name} acts as a vital structural bridge under current trade and closeness metrics. Optimal trade integration, robust border defensive infrastructure, and high ideological agreement with our HQ.`
                ) : (
                  `${activeFocusDossier.name} remains structurally isolated within active parameters. Closeness index evaluates to a standard ${activeFocusDossier.closeness}% rating, confirming a buffer state. Highly suited for passive economic surveillance and routine oversight operations.`
                )}
              </p>
            </div>

            {/* SPECIAL COGNITIVE TRIGGER ACTION PANEL */}
            <div className="pt-2 border-t border-green-950/30">
              <button
                onClick={() => {
                  audio.sfxKlaxon();
                  setCountryInspector(activeFocusDossier.id);
                }}
                className="w-full text-center py-2.5 bg-[#0d2a13]/60 hover:bg-[#1a5124] border border-[#00ff44]/50 hover:border-[#00ff44] rounded text-[10px] font-extrabold text-[#00ff44] cursor-pointer transition-all uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <Cpu className="w-3.5 h-3.5" /> GOTO NATIONAL STRATEGIC PROFILE
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-600 space-y-2 uppercase text-[10px] select-none font-bold">
            <AlertOctagon className="w-8 h-8 text-gray-800 mx-auto" />
            <div>No nodes matched operational query indexes</div>
          </div>
        )}
      </div>
    </div>
  );
}
