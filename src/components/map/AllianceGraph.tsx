import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  flag: string;
  powerRating: number;
  ideology: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'ALLIANCE' | 'TRADE' | 'WAR';
  value: number;
}

export default function AllianceGraph() {
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const hudMode = usePlayerStore((s) => s.hudMode);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Construct nodes and links from country alignments
  useEffect(() => {
    const listNodes: GraphNode[] = Object.keys(countries).map((id) => {
      const c = countries[id];
      return {
        id: id,
        name: c.name,
        flag: c.flagEmoji,
        powerRating: c.arsenal.totalPowerRating,
        ideology: c.political.ideology,
      };
    });

    const listLinks: GraphLink[] = [];

    Object.keys(countries).forEach((srcId) => {
      const c = countries[srcId];

      // Alliance links
      Object.keys(countries).forEach((tgtId) => {
        if (srcId >= tgtId) return; // avoid duplicates
        const target = countries[tgtId];

        if (c.allianceBlock !== 'NEUTRAL' && c.allianceBlock === target.allianceBlock) {
          listLinks.push({
            id: `alliance_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'ALLIANCE',
            value: 30,
          });
        }
      });

      // Trade links
      c.tradePartners.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        const target = countries[tgtId];
        if (!target) return;

        // Ensure we do not duplicate with alliance
        const allianceExists = listLinks.some(
          (l) => l.type === 'ALLIANCE' && ((l.source === srcId && l.target === tgtId) || (l.source === tgtId && l.target === srcId))
        );
        if (!allianceExists) {
          listLinks.push({
            id: `trade_${srcId}_${tgtId}`,
            source: srcId,
            target: tgtId,
            type: 'TRADE',
            value: 10,
          });
        }
      });

      // War links
      c.atWarWith.forEach((tgtId) => {
        if (srcId >= tgtId) return;
        listLinks.push({
          id: `war_${srcId}_${tgtId}`,
          source: srcId,
          target: tgtId,
          type: 'WAR',
          value: 50,
        });
      });
    });

    setNodes(listNodes);
    setLinks(listLinks);
  }, [countries]);

  // Bind D3 Force Simulation
  const [coords, setCoords] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Deep clones to prevent simulation mutations from feeding back in circular loops
    const simNodes: GraphNode[] = JSON.parse(JSON.stringify(nodes));
    const simLinks: GraphLink[] = JSON.parse(JSON.stringify(links));

    const width = 600;
    const height = 300;

    const simulation = d3.forceSimulation<GraphNode>(simNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(simLinks).id((d) => d.id).distance((d) => {
        if (d.type === 'WAR') return 160;
        if (d.type === 'ALLIANCE') return 60;
        return 100;
      }))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => Math.sqrt(d.powerRating || 1) + 12));

    let isDisposed = false;

    simulation.on('tick', () => {
      if (isDisposed) return;
      const updatedCoords = simNodes.map((n) => ({
        id: n.id,
        x: n.x || 300,
        y: n.y || 150,
      }));
      setCoords(updatedCoords);
    });

    return () => {
      isDisposed = true;
      simulation.stop();
    };
  }, [nodes, links]);

  const handleNodeClick = (id: string) => {
    if (hudMode === 'WAR_ROOM') {
      if (id !== playerCountryId) {
        setTargetCountry(id);
      }
    } else {
      setCountryInspector(id);
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#010401]">
      <div className="absolute top-1 left-2 text-[8px] font-mono text-[#00ff44] opacity-50 tracking-wider">
        D3 BILATERAL ALLIANCE STRATEGY FORCE GRAPH MODEL
      </div>

      <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
        {/* Render lines */}
        {links.map((link) => {
          // Resolve exact coordinates
          const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
          const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;

          const srcPt = coords.find((p) => p.id === srcId);
          const tgtPt = coords.find((p) => p.id === tgtId);

          if (!srcPt || !tgtPt) return null;

          let color = '#00ff44';
          let strokeWidth = '1';
          let dash = undefined;

          if (link.type === 'TRADE') {
            color = '#00e5ff';
            strokeWidth = '0.75';
            dash = '3,3';
          } else if (link.type === 'WAR') {
            color = '#ff2244';
            strokeWidth = '1.8';
          } else if (link.type === 'ALLIANCE') {
            color = '#00ff44';
            strokeWidth = '2';
          }

          return (
            <line
              key={link.id}
              x1={srcPt.x}
              y1={srcPt.y}
              x2={tgtPt.x}
              y2={tgtPt.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              opacity="0.65"
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const pt = coords.find((p) => p.id === node.id);
          if (!pt) return null;

          const isPlayer = node.id === playerCountryId;
          const radius = Math.max(14, Math.min(30, Math.sqrt(node.powerRating || 1) * 0.8));

          let fill = 'rgba(10, 35, 10, 0.8)';
          let stroke = '#1a3a1a';
          if (isPlayer) {
            fill = 'rgba(0, 255, 68, 0.25)';
            stroke = '#00ff44';
          } else if (node.ideology === 'AUTOCRACY') {
            fill = 'rgba(255, 34, 68, 0.15)';
            stroke = '#ff2244';
          } else if (node.ideology === 'THEOCRACY') {
            fill = 'rgba(0, 229, 255, 0.15)';
            stroke = '#00e5ff';
          }

          return (
            <g
              key={node.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer group"
              onClick={() => handleNodeClick(node.id)}
            >
              <circle
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={isPlayer ? '2' : '1'}
                className="transition-all hover:fill-opacity-50"
              />
              <text
                dy="4"
                textAnchor="middle"
                fontSize="12"
                className="select-none pointer-events-none"
              >
                {node.flag}
              </text>
              <text
                dy={radius + 10}
                textAnchor="middle"
                fill={isPlayer ? '#00ff44' : 'rgba(0, 255, 68, 0.5)'}
                fontSize="8"
                fontFamily="monospace"
                className="font-bold tracking-widest uppercase transition-colors group-hover:fill-[#00ff44]"
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
