import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Eye, ShieldCheck, Heart, Skull, Activity, Compass } from 'lucide-react';
import { WorldState } from '../../types';
import { audio } from '../../utils/audio';

interface TacticalRadarMapProps {
  worldState: WorldState;
  playerCountryId: string;
}

const METRIC_COORDINATES: Record<string, { x: number; y: number; name: string }> = {
  US: { x: 130, y: 110, name: 'United States' },
  CN: { x: 440, y: 130, name: 'China' },
  RU: { x: 370, y: 80, name: 'Russia' },
  IN: { x: 405, y: 160, name: 'India' },
  GB: { x: 260, y: 90, name: 'United Kingdom' },
  FR: { x: 265, y: 110, name: 'France' },
  DE: { x: 285, y: 100, name: 'Germany' },
  JP: { x: 490, y: 120, name: 'Japan' },
  KR: { x: 470, y: 125, name: 'South Korea' },
  KP: { x: 468, y: 112, name: 'North Korea' },
  TW: { x: 462, y: 145, name: 'Taiwan' },
  PK: { x: 388, y: 145, name: 'Pakistan' },
  CA: { x: 140, y: 75, name: 'Canada' },
  AU: { x: 495, y: 240, name: 'Australia' },
  BR: { x: 210, y: 200, name: 'Brazil' },
  ZA: { x: 300, y: 245, name: 'South Africa' },
  IL: { x: 322, y: 135, name: 'Israel' },
  IR: { x: 350, y: 130, name: 'Iran' },
  SA: { x: 335, y: 155, name: 'Saudi Arabia' },
  UA: { x: 310, y: 95, name: 'Ukraine' }
};

export const TacticalRadarMap: React.FC<TacticalRadarMapProps> = ({ worldState, playerCountryId }) => {
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [pinnedCountryId, setPinnedCountryId] = useState<string | null>(playerCountryId);
  const [feedLogs, setFeedLogs] = useState<string[]>([]);
  const [radarAngle, setRadarAngle] = useState(0);

  // Animate map sweep line angle
  useEffect(() => {
    let frameId: number;
    const updateSweep = () => {
      setRadarAngle((prev) => (prev + 0.65) % 360);
      frameId = requestAnimationFrame(updateSweep);
    };
    frameId = requestAnimationFrame(updateSweep);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Generate dynamic, realistic sovereign surveillance log streams periodically
  useEffect(() => {
    const logPool = [
      '⚡ SECURE SIGNAL ESTABLISHED (COORDINATES DETECTED: AUTO)',
      '🛰️ SAT-RECON ORBIT-ALPHA ONLINE - RECON LEVEL 5',
      '🟢 SIGINT DATA RECOVERED // UNREST THRESHOLD ADJUSTED',
      '🔍 MONITORED COMMUNICATIONS SHOW DIPLOMATIC PRESSURE ACCELERATED',
      '📊 FINANCIAL EMBARGO REALLOCATION DETECTED // BOND YIELDS SHIFTED',
      '⚠️ RETALIATION COEFFICIENT CALIBRATION SEQUENCE... REGISTERED',
      '📡 FREQUENCY INTERCEPT AT 2400 MHZ - CLASSIFIED SIGNALS CORPS',
      '💀 MASS SATURATION BOMBARDMENT SIMULATION CALCULATED',
      '⚔️ CONFLICT INTENSITY WEIGHT DETECTED IN THE GLOBAL CRITICAL PATH'
    ];

    setFeedLogs([
      '⚡ CORE INTERLUDE ACTIVE // RADAR SENSORS NOMINAL',
      '🛰️ surveillance stream locked onto ' + playerCountryId,
      '🔍 PARSING CHRONOLOGICAL THREAT RECORDS...'
    ]);

    const interval = setInterval(() => {
      const newLine = logPool[Math.floor(Math.random() * logPool.length)];
      setFeedLogs((prev) => {
        const next = [newLine, ...prev];
        return next.slice(0, 5); // Keep the latest 5 lines
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [playerCountryId]);

  // Robustly derive countries geometry nodes
  const nodes = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      threat: string;
      isPlayer: boolean;
      data: any;
    }> = [];

    Object.entries(worldState.countries).forEach(([id, c]: [string, any]) => {
      // Resolve coordinates or fallback deterministically
      let coords = METRIC_COORDINATES[id];
      if (!coords) {
        // Deterministic placement within map margins of 600x300
        let sum = 0;
        for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
        const x = 100 + (sum % 400);
        const y = 80 + ((sum * 13) % 160);
        coords = { x, y, name: c.name };
      }

      list.push({
        id,
        name: c.name,
        x: coords.x,
        y: coords.y,
        threat: c.threatLevel,
        isPlayer: id === playerCountryId,
        data: c
      });
    });

    return list;
  }, [worldState.countries, playerCountryId]);

  // Derive war lines
  const warBridges = useMemo(() => {
    const paths: Array<{
      key: string;
      idA: string;
      idB: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      intensity: number;
    }> = [];

    const processed = new Set<string>();

    nodes.forEach((node) => {
      const atWar = node.data.atWarWith || [];
      atWar.forEach((oppId: string) => {
        // Find opponent coordinates
        const oppNode = nodes.find((n) => n.id === oppId);
        if (oppNode) {
          const key = node.id < oppId ? `${node.id}-${oppId}` : `${oppId}-${node.id}`;
          if (!processed.has(key)) {
            processed.add(key);
            paths.push({
              key,
              idA: node.id,
              idB: oppId,
              x1: node.x,
              y1: node.y,
              x2: oppNode.x,
              y2: oppNode.y,
              intensity: node.data.political?.popularUnrest > 60 ? 3 : 1
            });
          }
        }
      });
    });

    return paths;
  }, [nodes]);

  // Derive trade / alliance lines (only draw positive treaties)
  const allianceBridges = useMemo(() => {
    const paths: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      opinionsAvg: number;
    }> = [];

    const processed = new Set<string>();

    nodes.forEach((node) => {
      const opinions = node.data.opinions || {};
      Object.entries(opinions).forEach(([targetId, score]: [string, any]) => {
        if (score > 45) {
          const oppNode = nodes.find((n) => n.id === targetId);
          if (oppNode) {
            const key = node.id < targetId ? `${node.id}-${targetId}` : `${targetId}-${node.id}`;
            if (!processed.has(key)) {
              processed.add(key);
              paths.push({
                key,
                x1: node.x,
                y1: node.y,
                x2: oppNode.x,
                y2: oppNode.y,
                opinionsAvg: score
              });
            }
          }
        }
      });
    });

    return paths;
  }, [nodes]);

  // Derive hits / launches positions
  const hits = useMemo(() => {
    return worldState.activeStrikes
      .filter((s) => s.status === 'IMPACT')
      .map((s) => {
        const srcNode = nodes.find((n) => n.id === s.sourceCountryId);
        const tgtNode = nodes.find((n) => n.id === s.targetCountryId);
        return {
          id: s.id,
          source: s.sourceCountryId,
          target: s.targetCountryId,
          weapon: s.weaponType,
          x1: srcNode?.x || 150,
          y1: srcNode?.y || 150,
          x2: tgtNode?.x || 350,
          y2: tgtNode?.y || 150
        };
      });
  }, [worldState.activeStrikes, nodes]);

  const activeFocusId = hoveredCountryId || pinnedCountryId;
  const focusNode = nodes.find((n) => n.id === activeFocusId);

  const handleNodeClick = (nodeId: string) => {
    audio.resume();
    audio.sfxKeyClick();
    setPinnedCountryId(nodeId);
  };

  return (
    <div className="border border-slate-900 bg-slate-950 p-4 rounded-[2.5px] shadow-lg flex flex-col relative overflow-hidden group">
      
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3.5 font-mono text-[9.5px]">
        <div className="flex items-center gap-2 text-cyan-400">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span className="font-bold tracking-widest uppercase">TACTICAL COMMAND RADAR ACTIVE</span>
        </div>
        <span className="text-[7.5px] bg-red-950/20 text-red-400 border border-red-500/10 px-1.5 py-0.5 rounded uppercase">
          SECURE SATELLITE PLOT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left Side: SVG Map Canvas (Span 8) */}
        <div className="lg:col-span-8 bg-slate-950/40 border border-slate-900/60 rounded-[1px] relative h-[280px] overflow-hidden select-none">
          {/* Concentric grid circles decoration mimicking real sonar scope */}
          <div className="absolute inset-x-0 h-[1.2px] bg-cyan-500/5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute inset-y-0 w-[1.2px] bg-cyan-500/5 left-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-dashed border-cyan-500/[0.03] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full border border-cyan-500/[0.02] pointer-events-none" />
          
          {/* Interactive Radar Sweeping Sector Vector */}
          <div 
            className="absolute top-1/2 left-1/2 w-[350px] h-[350px] origin-top-left pointer-events-none opacity-[0.06]"
            style={{
              background: 'conic-gradient(from 0deg, rgba(16,185,129,0.2) 0deg, transparent 75deg)',
              transform: `translate(-50%, -50%) rotate(${radarAngle}deg)`,
              transformOrigin: 'center center'
            }}
          />

          <svg className="w-full h-full" viewBox="0 0 600 280">
            {/* 1. Alliance Paths Representation (Subtle emerald lanes) */}
            {allianceBridges.map((p) => (
              <line
                key={p.key}
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                stroke="#10b981"
                strokeWidth="0.5"
                strokeOpacity="0.18"
                strokeDasharray="2 3"
              />
            ))}

            {/* 2. active war vectors (Glowing pulsating neon pathways) */}
            {warBridges.map((p) => (
              <g key={p.key}>
                <line
                  x1={p.x1}
                  y1={p.y1}
                  x2={p.x2}
                  y2={p.y2}
                  stroke="#ef4444"
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                  className="animate-pulse"
                />
                <line
                  x1={p.x1}
                  y1={p.y1}
                  x2={p.x2}
                  y2={p.y2}
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeOpacity="0.75"
                  strokeDasharray="4 6"
                  style={{
                    strokeDashoffset: radarAngle * 0.45
                  }}
                />
              </g>
            ))}

            {/* 3. Ballistic impact trajectories (Parabolic launch arcs) */}
            {hits.map((h) => {
              // Calculate midpoint with peak height offset for arc curving
              const midX = (h.x1 + h.x2) / 2;
              const midY = Math.min(h.y1, h.y2) - 40;
              const pathD = `M ${h.x1} ${h.y1} Q ${midX} ${midY} ${h.x2} ${h.y2}`;
              return (
                <g key={h.id}>
                  {/* Glowing thin wire path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="0.75"
                    strokeOpacity="0.3"
                  />
                  {/* Flashing target impact ring */}
                  <circle
                    cx={h.x2}
                    cy={h.y2}
                    r="8"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.75"
                    strokeOpacity="0.4"
                    className="animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <circle
                    cx={h.x2}
                    cy={h.y2}
                    r="3.5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.5"
                    strokeOpacity="0.6"
                  />
                </g>
              );
            })}

            {/* 4. Sovereign Sovereign Nodes (Surgical target vector pointers) */}
            {nodes.map((node) => {
              const isTargetActive = hoveredCountryId === node.id || pinnedCountryId === node.id;
              let markerColor = '#64748b'; // Stable Neutral
              if (node.threat === 'RED' || node.threat === 'BLACK') markerColor = '#f43f5e';
              else if (node.threat === 'ORANGE') markerColor = '#fb923c';
              else if (node.threat === 'YELLOW') markerColor = '#eab308';
              else if (node.threat === 'GREEN') markerColor = '#10b981';

              if (node.isPlayer) markerColor = '#00e1ff'; // Cyan theme color indicator

              return (
                <g 
                  key={node.id}
                  className="cursor-pointer group/node"
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredCountryId(node.id)}
                  onMouseLeave={() => setHoveredCountryId(null)}
                >
                  {/* Hover ring projection */}
                  {isTargetActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill="none"
                      stroke={markerColor}
                      strokeWidth="0.75"
                      strokeOpacity="0.5"
                      className="animate-pulse"
                    />
                  )}

                  {/* Intersecting dotted target lines */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="4.5"
                    fill="none"
                    stroke={markerColor}
                    strokeWidth="0.75"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="1.2"
                    fill={node.isPlayer ? '#fff' : markerColor}
                  />

                  {/* Sovereign ID Monospace text labels */}
                  <text
                    x={node.x}
                    y={node.y - 8}
                    fill={isTargetActive ? '#fff' : '#64748b'}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight={isTargetActive ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* HUD Scale Indicator */}
          <div className="absolute left-3 bottom-2.5 font-mono text-[7px] text-slate-650 uppercase select-none leading-none">
            <span>MAP RESOLUTION: GRID-AXIS T5X // DETECTOR: RAD-SAT LEO-1</span>
          </div>
        </div>

        {/* Right Side: Telemetry Metrics Docket (Span 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between font-mono text-[9.5px]">
          
          {/* Active target data packet board */}
          <div className="bg-slate-950 border border-slate-900 rounded p-3 flex flex-col justify-between flex-1">
            {focusNode ? (
              <div className="space-y-3 select-text">
                <div className="border-b border-dashed border-slate-900 pb-1.5 flex justify-between items-center text-[10px]">
                  <span className="font-extrabold uppercase text-white tracking-widest">
                    TARGET: {focusNode.name} [{focusNode.id}]
                  </span>
                  {focusNode.isPlayer && (
                    <span className="text-[#00e1ff] font-bold text-[7px] border border-[#00e1ff]/30 px-1 py-0.5 rounded leading-none uppercase animate-pulse">
                      CMD SEC
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 leading-relaxed text-slate-400">
                  <div className="flex justify-between">
                    <span>DOMESTIC STABILITY INDEX:</span>
                    <strong className="text-slate-200">{Math.round(focusNode.data.political?.stabilityIndex || 50)}/100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>LEADER APPROVAL TAXA:</span>
                    <strong className="text-slate-200">{Math.round(focusNode.data.political?.leaderApprovalRating || 50)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>POPULAR UNREST LEVEL:</span>
                    <strong className="text-slate-200">{Math.round(focusNode.data.political?.popularUnrest || 15)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TOTAL LIQUID COURIER CASHB:</span>
                    <strong className="text-slate-200">${Math.round(focusNode.data.economic?.treasuryCashB || 900)}B</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-1.5">
                    <span>ACTIVE THEATRE ENEMIES:</span>
                    <strong className="text-rose-450 uppercase font-bold text-[9px]">
                      {focusNode.data.atWarWith?.length > 0 
                        ? focusNode.data.atWarWith.join(', ') 
                        : 'NONE SECURE'}
                    </strong>
                  </div>
                </div>

                {/* Conflict history log summaries */}
                <div className="border-t border-slate-900/60 pt-2 text-[8px] text-slate-500">
                  <span className="font-bold text-slate-400 uppercase tracking-tight block mb-1">Surveillance Log Feed:</span>
                  <div className="italic h-[50px] overflow-y-auto leading-relaxed pl-1.5 border-l border-slate-900 space-y-1">
                    {focusNode.data.lastEventLog && focusNode.data.lastEventLog.length > 0 ? (
                      focusNode.data.lastEventLog.slice(0, 3).map((log: string, lIdx: number) => (
                        <div key={lIdx} className="line-clamp-1">"{log}"</div>
                      ))
                    ) : (
                      <em className="text-slate-650">No immediate threat activity logs available.</em>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 text-slate-600">
                <Compass className="w-8 h-8 opacity-25 animate-spin-slow mb-2" />
                <span>SELECT SOVEREIGN NODE PLOT FOR TARGET FOCUS READOUT</span>
              </div>
            )}
          </div>

          {/* Rolling Secure alphanumeric feed terminal logs at bottom right */}
          <div className="mt-3.5 h-[65px] bg-black border border-slate-950 p-2 text-[7px] text-emerald-500/80 rounded flex flex-col justify-end overflow-hidden leading-tight font-black select-none opacity-90">
            {feedLogs.map((log, lIdx) => (
              <div key={lIdx} className="line-clamp-1 mb-[1.5px] truncate last:mb-0">
                &#62; {log}
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
