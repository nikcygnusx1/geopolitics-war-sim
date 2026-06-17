import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { audio } from '../../utils/audio';

interface CyberNode {
  id: string;
  label: string;
  status: 'ONLINE' | 'COMPROMISED' | 'ALERT';
  gdpWeight: number;
}

const INITIAL_CYBER_NODES: CyberNode[] = [
  { id: 'US_NET', label: 'US-FED.GRID', status: 'ONLINE', gdpWeight: 95 },
  { id: 'CN_NET', label: 'CN-HUB.GRID', status: 'ONLINE', gdpWeight: 90 },
  { id: 'RU_NET', label: 'RU-COR.GRID', status: 'ONLINE', gdpWeight: 65 },
  { id: 'GB_NET', label: 'GB-SEC.CORE', status: 'ONLINE', gdpWeight: 75 },
  { id: 'JP_NET', label: 'JP-FAC.NODE', status: 'ONLINE', gdpWeight: 80 },
  { id: 'IL_NET', label: 'IL-TAC.WAN', status: 'ONLINE', gdpWeight: 70 },
  { id: 'DE_NET', label: 'DE-COM.GATE', status: 'ONLINE', gdpWeight: 60 },
  { id: 'TW_NET', label: 'TW-FAB.SYS', status: 'ONLINE', gdpWeight: 85 },
];

export default function CyberFeed() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const setExpandedWorkstation = useUIStore((s) => s.setExpandedWorkstation);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [networkNodes, setNetworkNodes] = useState<CyberNode[]>(INITIAL_CYBER_NODES);
  const [firewallRating, setFirewallRating] = useState(2.8);
  const [isTracingActive, setIsTracingActive] = useState(false);
  const [traceCoord, setTraceCoord] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    activeAlerts: 0,
    blockedAttempts: 148,
    exfilBytes: 12.4,
    mttd: 45,
    mttr: 125,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setNetworkNodes((nodes) =>
        nodes.map((n) => {
          if (targetCountryId && n.id.startsWith(targetCountryId)) {
            return { ...n, status: Math.random() < 0.6 ? 'ALERT' : n.status };
          }
          if (Math.random() < 0.08) {
            const nextStatus: CyberNode['status'] =
              Math.random() < 0.45 ? 'ALERT' : Math.random() < 0.15 ? 'COMPROMISED' : 'ONLINE';
            return { ...n, status: nextStatus };
          }
          return n;
        })
      );

      setMetrics((prev) => {
        const hasAlerts = networkNodes.some((n) => n.status === 'ALERT' || n.status === 'COMPROMISED');
        return {
          activeAlerts: networkNodes.filter((n) => n.status === 'ALERT' || n.status === 'COMPROMISED').length,
          blockedAttempts: prev.blockedAttempts + Math.floor(Math.random() * 3),
          exfilBytes: parseFloat(Math.max(1, prev.exfilBytes + (hasAlerts ? 1.5 : -1.2) * (Math.random() - 0.5)).toFixed(1)),
          mttd: Math.max(25, Math.min(120, prev.mttd + Math.floor((Math.random() - 0.5) * 5))),
          mttr: Math.max(90, Math.min(300, prev.mttr + Math.floor((Math.random() - 0.5) * 8))),
        };
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [targetCountryId, networkNodes]);

  useEffect(() => {
    if (targetCountryId) {
      setNetworkNodes((nodes) =>
        nodes.map((n) => {
          if (n.id.startsWith(targetCountryId)) {
            return { ...n, status: 'ALERT' };
          }
          return n;
        })
      );
    }
  }, [targetCountryId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const baseW = 192;
    const baseH = 148;

    canvas.width = baseW * dpr;
    canvas.height = baseH * dpr;
    ctx.scale(dpr, dpr);

    const W = baseW;
    const H = baseH;

    const nodeCoords: Record<string, { x: number; y: number }> = {
      US_NET: { x: 25, y: 30 },
      CN_NET: { x: 135, y: 35 },
      RU_NET: { x: 95, y: 22 },
      GB_NET: { x: 60, y: 28 },
      JP_NET: { x: 165, y: 48 },
      IL_NET: { x: 125, y: 65 },
      DE_NET: { x: 80, y: 55 },
      TW_NET: { x: 160, y: 80 },
    };

    const edges = [
      ['US_NET', 'GB_NET'],
      ['GB_NET', 'DE_NET'],
      ['DE_NET', 'RU_NET'],
      ['RU_NET', 'CN_NET'],
      ['CN_NET', 'TW_NET'],
      ['TW_NET', 'JP_NET'],
      ['IL_NET', 'DE_NET'],
      ['US_NET', 'DE_NET'],
      ['RU_NET', 'IL_NET'],
      ['CN_NET', 'JP_NET'],
    ];

    let tick = 0;

    function renderLoop() {
      tick++;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#020302';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(0, 255, 68, 0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 12) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 12) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      edges.forEach(([src, dst]) => {
        const sPt = nodeCoords[src];
        const dPt = nodeCoords[dst];
        if (!sPt || !dPt) return;

        const srcNode = networkNodes.find((n) => n.id === src);
        const dstNode = networkNodes.find((n) => n.id === dst);

        let color = 'rgba(0, 255, 68, 0.16)';
        let lineDash: number[] = [];

        if (srcNode?.status === 'COMPROMISED' && dstNode?.status === 'COMPROMISED') {
          color = 'rgba(255, 34, 68, 0.65)';
        } else if (srcNode?.status === 'ALERT' || dstNode?.status === 'ALERT') {
          color = 'rgba(255, 179, 0, 0.45)';
          lineDash = [2, 2];
        }

        if (isTracingActive && (src === traceCoord || dst === traceCoord)) {
          color = '#00ffff';
          ctx.lineWidth = 1.2;
        } else {
          ctx.lineWidth = 0.8;
         }

        ctx.strokeStyle = color;
        ctx.setLineDash(lineDash);
        ctx.beginPath();
        ctx.moveTo(sPt.x, sPt.y);
        ctx.lineTo(dPt.x, dPt.y);
        ctx.stroke();

        const packetOffset = (tick * 0.45) % 1;
        const pX = sPt.x + (dPt.x - sPt.x) * packetOffset;
        const pY = sPt.y + (dPt.y - sPt.y) * packetOffset;
        ctx.fillStyle = srcNode?.status === 'COMPROMISED' ? '#ff2244' : '#00ff44';
        ctx.fillRect(pX - 1, pY - 1, 2, 2);
      });
      ctx.setLineDash([]);

      networkNodes.forEach((node) => {
        const pt = nodeCoords[node.id];
        if (!pt) return;

        let nodeColor = '#00ff44';
        let isBreached = false;

        if (node.status === 'COMPROMISED') {
          nodeColor = '#ff2244';
          isBreached = true;
        } else if (node.status === 'ALERT') {
          nodeColor = '#ffb300';
        }

        if (isTracingActive && node.id === traceCoord) {
          nodeColor = '#00ffff';
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = isBreached && tick % 20 < 10 ? 'rgba(255,34,68,0.2)' : `rgba(0, 255, 68, 0.12)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '5px "JetBrains Mono", monospace';
        ctx.fillText(node.label, pt.x - 14, pt.y - 7);
      });

      const timelineY = H - 24;
      ctx.fillStyle = 'rgba(2, 6, 2, 0.88)';
      ctx.fillRect(4, timelineY, W - 8, 12);
      ctx.strokeStyle = '#1a5c1a';
      ctx.strokeRect(4, timelineY, W - 8, 12);

      ctx.strokeStyle = networkNodes.some((n) => n.status === 'COMPROMISED') ? '#ff2244' : '#00e5ff';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      for (let tx = 0; tx < W - 10; tx += 3) {
        const compromisedCount = networkNodes.filter((n) => n.status === 'COMPROMISED' || n.status === 'ALERT').length;
        const amplitude = compromisedCount > 0 ? compromisedCount * 3.5 : 1.2;
        const ampNoise = Math.sin((tx + tick) * 0.15) * amplitude;
        const ty = timelineY + 6 + ampNoise;
        if (tx === 0) {
          ctx.moveTo(8 + tx, ty);
        } else {
          ctx.lineTo(8 + tx, ty);
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#888888';
      ctx.font = '5.5px "Chakra Petch", sans-serif';
      ctx.fillText('SOC SCAN FLOW INTENSITY', 10, timelineY + 4);

      const compromisedNodes = networkNodes.filter((n) => n.status === 'COMPROMISED');
      if (compromisedNodes.length > 0 && tick % 16 < 8) {
        ctx.fillStyle = 'rgba(255, 34, 68, 0.15)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff2244';
        ctx.font = 'bold 7px "JetBrains Mono", monospace';
        ctx.fillText(`🚨 NODE BREACH DETECTED: [${compromisedNodes[0].label}]`, 12, H - 40);
      }

      ctx.fillStyle = 'rgba(0, 255, 68, 0.45)';
      ctx.font = '5px monospace';
      ctx.fillText(`PACKET TRACE_OK: CL-MULTIPLIER [${firewallRating.toFixed(1)}x]`, 4, 11);

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [networkNodes, isTracingActive, traceCoord, firewallRating]);

  const handleHackGrid = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('HACK REJECTED: Target country coordinate not specified on console map.', 'WARNING');
      return;
    }

    pushTerminalLine(`Deploying payload 'STUX_COBALT.bin' into sector network: ${targetCountryId}...`, 'WARNING');
    audio.sfxKlaxon();

    setTimeout(() => {
      setNetworkNodes((nodes) =>
        nodes.map((n) => {
          if (n.id.startsWith(targetCountryId)) {
            return { ...n, status: 'COMPROMISED' };
          }
          return n;
        })
      );
      pushTerminalLine(`Infiltration complete. Grid node for ${targetCountryId} successfully isolated. Data pipeline captured.`, 'SYSTEM');
      audio.sfxRadarPing();
    }, 2800);
  };

  const handleBoostFirewall = () => {
    audio.sfxKeyClick();
    if (firewallRating >= 4.9) {
      pushTerminalLine('FIREWALL: Infrastructure defenses already operating at peak security load.', 'INFO');
      return;
    }
    const nextRating = parseFloat((firewallRating + 0.5).toFixed(1));
    setFirewallRating(nextRating);

    setNetworkNodes((nodes) => nodes.map((n) => ({ ...n, status: n.status === 'COMPROMISED' ? 'ONLINE' : n.status })));
    pushTerminalLine(`Calibrating cyber-physical shield arrays. Firewall security factor hoisted to [${nextRating}x]. Alerts pruned.`, 'SYSTEM');
  };

  const handleTrace = () => {
    audio.sfxKeyClick();
    setIsTracingActive(true);
    const alertNode = networkNodes.find((n) => n.status === 'ALERT' || n.status === 'COMPROMISED');
    const nodeToTrace = alertNode ? alertNode.id : 'RU_NET';
    setTraceCoord(nodeToTrace);
    
    pushTerminalLine(`Initializing SOC backtrack traceroute coordinates to pinpoint compromise origins...`, 'INFO');

    setTimeout(() => {
      setIsTracingActive(false);
      setTraceCoord(null);
      setNetworkNodes((nodes) => nodes.map((n) => (n.id === nodeToTrace ? { ...n, status: 'ONLINE' } : n)));
      pushTerminalLine(`Trace route isolate: Malicious source coordinates neutralized completely. Tunnel resolved.`, 'SYSTEM');
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          COVERT CYBER FEED
        </span>
        <button
          onClick={() => { audio.playPhaseReveal(); setExpandedWorkstation('CYBER'); }}
          className="text-[7.5px] text-[#00e5ff] border border-[#00e5ff]/40 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/20 px-1 py-0.2 rounded font-black cursor-pointer uppercase transition-all"
        >
          ▲ WORKSTATION
        </button>
      </div>

      <div className="grid grid-cols-5 gap-0.5 text-[6px]/tight font-mono bg-black/45 px-1 py-0.5 border border-[#1a5c1a]/15 text-gray-400">
        <div>ALERTS: <span className={`${metrics.activeAlerts > 0 ? 'text-[#ff2244] font-bold' : 'text-[#00ff44]'}`}>{metrics.activeAlerts}</span></div>
        <div>BLOCKS: <span className="text-[#00e5ff] font-bold">{metrics.blockedAttempts}</span></div>
        <div>EXFIL: <span className="text-amber-500 font-bold">{metrics.exfilBytes}M</span></div>
        <div>MTTD: <span className="text-white">{metrics.mttd}s</span></div>
        <div>MTTR: <span className="text-white">{metrics.mttr}s</span></div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[100px] block border border-[#0d2e0d]"
          style={{ background: '#020302' }}
        />
        <div className="absolute top-1 right-2 text-[6px] text-gray-500 font-mono pointer-events-none">
          SOC_WAN_TOPOLOGY
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-0.5 text-[7.5px] font-mono">
        <button
          onClick={handleHackGrid}
          className="feed-btn px-0.5 py-0.5 rounded text-center font-bold"
        >
          HACK GRID
        </button>

        <button
          onClick={handleBoostFirewall}
          className="feed-btn px-0.5 py-0.5 rounded text-center font-bold text-[#00e5ff]"
        >
          FW BOOST
        </button>

        <button
          onClick={handleTrace}
          className="feed-btn px-0.5 py-0.5 rounded text-center font-bold text-[#ffb300]"
        >
          TRACE NODE
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// COVERT CYBER WORKSTATION
// =========================================================================
export function CyberWorkstation({ onClose }: { onClose: () => void }) {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const addIntelReport = useIntelligenceStore((s) => s.addIntelReport);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Core interactive states
  const [activeSegment, setActiveSegment] = useState<'INDUSTRIAL' | 'FINANCIAL' | 'GOVERNMENT'>('INDUSTRIAL');
  const [networkNodes, setNetworkNodes] = useState<CyberNode[]>(INITIAL_CYBER_NODES);
  const [firewallRating, setFirewallRating] = useState(3.4);
  const [frequencyAlign, setFrequencyAlign] = useState(14.5); // MHz
  const [selectedHack, setSelectedHack] = useState<'STUX_GRID' | 'SLUSH_FUN_EXFIL' | 'MEDIA_HIJACK'>('STUX_GRID');
  
  // Real statistical telemetry
  const [alertsCount, setAlertsCount] = useState(1);
  const [exfilMB, setExfilMB] = useState(24.5);
  const [deflectCount, setDeflectCount] = useState(128);
  const [historyAttacks, setHistoryAttacks] = useState<string[]>([]);
  const [isTracingAttack, setIsTracingAttack] = useState(false);

  useEffect(() => {
    const driftInterval = setInterval(() => {
      setExfilMB((prev) => {
        const d = (Math.random() - 0.5) * 2;
        return Math.max(1, parseFloat((prev + d).toFixed(1)));
      });
      setDeflectCount((prev) => prev + Math.floor(Math.random() * 2));
      setAlertsCount((prev) => {
        if (Math.random() < 0.15) {
          audio.sfxKlaxon();
          return Math.min(10, prev + 1);
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(driftInterval);
  }, []);

  // Large Interactive Network Graph Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const baseW = 400;
    const baseH = 280;

    canvas.width = baseW * dpr;
    canvas.height = baseH * dpr;
    ctx.scale(dpr, dpr);

    const W = baseW;
    const H = baseH;

    const nodeCoords: Record<string, { x: number; y: number }> = {
      US_NET: { x: 50, y: 70 },
      CN_NET: { x: 330, y: 90 },
      RU_NET: { x: 230, y: 50 },
      GB_NET: { x: 130, y: 60 },
      JP_NET: { x: 340, y: 170 },
      IL_NET: { x: 260, y: 220 },
      DE_NET: { x: 150, y: 180 },
      TW_NET: { x: 300, y: 240 },
    };

    const edges = [
      ['US_NET', 'GB_NET'],
      ['GB_NET', 'DE_NET'],
      ['DE_NET', 'RU_NET'],
      ['RU_NET', 'CN_NET'],
      ['CN_NET', 'TW_NET'],
      ['TW_NET', 'JP_NET'],
      ['IL_NET', 'DE_NET'],
      ['US_NET', 'DE_NET'],
      ['RU_NET', 'IL_NET'],
      ['CN_NET', 'JP_NET'],
    ];

    let tick = 0;

    function renderLoop() {
      tick++;
      ctx.clearRect(0, 0, W, H);

      // Deep Space Blue Plate
      ctx.fillStyle = '#010502';
      ctx.fillRect(0, 0, W, H);

      // Electronic grid lines
      ctx.strokeStyle = 'rgba(0, 255, 68, 0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // 1. Draw connections
      edges.forEach(([src, dst]) => {
        const sPt = nodeCoords[src];
        const dPt = nodeCoords[dst];
        if (!sPt || !dPt) return;

        const srcNode = networkNodes.find((n) => n.id === src);
        const dstNode = networkNodes.find((n) => n.id === dst);

        let col = 'rgba(0, 255, 68, 0.2)';
        let dash: number[] = [];

        if (srcNode?.status === 'COMPROMISED' || dstNode?.status === 'COMPROMISED') {
          col = 'rgba(255, 10, 40, 0.75)';
          dash = [4, 4];
        } else if (srcNode?.status === 'ALERT' || dstNode?.status === 'ALERT') {
          col = 'rgba(255, 180, 0, 0.5)';
          dash = [2, 2];
        }

        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(sPt.x, sPt.y);
        ctx.lineTo(dPt.x, dPt.y);
        ctx.stroke();

        // Animated packet flows
        const packetFactor = (tick * 0.3) % 1;
        const px = sPt.x + (dPt.x - sPt.x) * packetFactor;
        const py = sPt.y + (dPt.y - sPt.y) * packetFactor;
        ctx.fillStyle = srcNode?.status === 'COMPROMISED' ? '#ff3b42' : '#00ff44';
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      });
      ctx.setLineDash([]);

      // 2. Draw Nodes
      networkNodes.forEach((node) => {
        const pt = nodeCoords[node.id];
        if (!pt) return;

        let nodeColor = '#00ff44';
        let isCompro = false;

        if (node.status === 'COMPROMISED') {
          nodeColor = '#ff2244';
          isCompro = true;
        } else if (node.status === 'ALERT') {
          nodeColor = '#ffb300';
        }

        // Concentric ripples
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = isCompro && tick % 16 < 8 ? 'rgba(255,10,40,0.15)' : 'rgba(0, 255, 68, 0.08)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText(node.label, pt.x - 20, pt.y - 12);

        // State label badge
        ctx.fillStyle = nodeColor;
        ctx.font = '5px "JetBrains Mono", monospace';
        ctx.fillText(node.status, pt.x - 10, pt.y + 16);
      });

      // 3. Cyber monitor intensity wave
      const waveY = H - 35;
      ctx.fillStyle = 'rgba(2, 6, 2, 0.9)';
      ctx.fillRect(10, waveY, W - 20, 25);
      ctx.strokeStyle = '#1a5c1a';
      ctx.strokeRect(10, waveY, W - 20, 25);

      ctx.strokeStyle = networkNodes.some((n) => n.status === 'COMPROMISED') ? '#ff1122' : '#00ffff';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let tx = 0; tx < W - 25; tx += 4) {
        const sizeMultiplier = networkNodes.filter((n) => n.status === 'COMPROMISED').length * 5 + 2;
        const waveH = Math.sin((tx + tick) * 0.12) * sizeMultiplier;
        const deltaY = waveY + 12 + waveH;
        if (tx === 0) ctx.moveTo(15 + tx, deltaY);
        else ctx.lineTo(15 + tx, deltaY);
      }
      ctx.stroke();

      ctx.fillStyle = '#999999';
      ctx.font = 'bold 6px "JetBrains Mono", monospace';
      ctx.fillText('INTRUSION WAVEFORM INTENSITY ANALYTICAL REPORT', 20, waveY + 8);

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [networkNodes, firewallRating]);

  // Execute hack actions
  const handleLaunchHack = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('CYBER WORKSTATION: Penetration aborted. Secure a target first.', 'WARNING');
      return;
    }

    pushTerminalLine(`CYBER ACTIONS: Triggering ${selectedHack} covert vector on sector ${targetCountryId}...`, 'WARNING');
    audio.sfxKlaxon();

    setTimeout(() => {
      // Apply different downstream outcomes depending on specific selected covert hack
      useWorldStore.getState().applyTickDelta((draft) => {
        const country = draft.countries[targetCountryId];
        if (!country) return;

        if (selectedHack === 'STUX_GRID') {
          // Disrupt infrastructure: collapse GDP B, gdpGrowthRate and raise inflation
          country.economic.gdpB = Math.max(10, country.economic.gdpB - 45);
          country.economic.gdpGrowthRate = Math.max(-10, country.economic.gdpGrowthRate - 1.5);
          country.economic.inflationRate = Math.min(100, country.economic.inflationRate + 4);
          audio.sfxRadarPing();
          pushTerminalLine(`OVERRUN LOG: Trojan 'STUX_GRID' fully loaded. Sector energy nodes deactivated. Target GDP decreased.`, 'SYSTEM');
        } else if (selectedHack === 'SLUSH_FUN_EXFIL') {
          // Exfiltrate cash: subtract cash from enemy and transfer straight to player!
          const cashStolen = 15; // Billion B
          country.economic.treasuryCashB = Math.max(0, country.economic.treasuryCashB - cashStolen);
          
          const playerCountryId = usePlayerStore.getState().countryId;
          const playerCountry = draft.countries[playerCountryId];
          if (playerCountry) {
            playerCountry.economic.treasuryCashB += cashStolen;
          }
          
          usePlayerStore.setState((s) => ({ cashB: s.cashB + cashStolen }));
          audio.sfxKeyClick();
          pushTerminalLine(`EXFIL LOG: Siphoned $${cashStolen}B from target offshore shell companies directly into Treasury.`, 'SUCCESS' as any);
        } else if (selectedHack === 'MEDIA_HIJACK') {
          // Hijack media narrative: ruin leader approval and elevate unrest
          if (country.political) {
            country.political.leaderApprovalRating = Math.max(5, country.political.leaderApprovalRating - 15);
            country.political.popularUnrest = Math.min(100, country.political.popularUnrest + 22);
            country.political.stabilityIndex = Math.max(10, country.political.stabilityIndex - 12);
          }
          pushTerminalLine(`INJECT LOG: Broadcast server narrative hijack successful. Citizen approval ratings dropping fast!`, 'SYSTEM');
        }
      });

      // Capture node compromise
      setNetworkNodes((nodes) =>
        nodes.map((n) => (n.id.startsWith(targetCountryId) ? { ...n, status: 'COMPROMISED' } : n))
      );

      const hId = `${selectedHack}_COMP_${Date.now().toString().substring(8)}`;
      setHistoryAttacks((prev) => [...prev, hId]);

      // Write intelligence dossier
      const repTitle = `CYBER BREACH REPORT: ${targetCountryId}`;
      const repText = `A precise cyber attack of index ${selectedHack} infiltrated target defenses. Exfiltrated encrypted system databases and compromised routing hubs. Security footprint masked smoothly.`;
      addIntelReport(repTitle, repText, 'WARNING');

      useWorldStore.getState().addGlobalEvent(`CYBER PENETRATION: Covert cyber operations team successfully overran internal database controllers in ${targetCountryId}.`, 'WARNING');

    }, 3000);
  };

  const handleMitigateThreats = () => {
    audio.sfxKeyClick();
    if (firewallRating >= 4.9) {
      pushTerminalLine('Mitigation Canceled: Critical security configurations optimal.', 'INFO');
      return;
    }
    const nextF = parseFloat((firewallRating + 0.3).toFixed(1));
    setFirewallRating(nextF);
    setAlertsCount(0);
    setNetworkNodes(INITIAL_CYBER_NODES);
    pushTerminalLine(`CYBER SECURITY: Firewall rating elevated. Block lists and IP rules flushed. Passive threat traces resolved.`, 'SYSTEM');
  };

  return (
    <div className="fixed inset-0 bg-[#020502]/98 backdrop-blur-md z-50 flex flex-col p-4 border border-[#1a5c1a]/55 select-none font-mono text-xs text-stone-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h1 className="text-sm font-black tracking-widest text-[#00ff44] uppercase">
            SEC OP RECON // COVERT CYBER GRID DIAGRAM WORKSTATION
          </h1>
        </div>
        <button
          onClick={() => { audio.sfxKeyClick(); onClose(); }}
          className="px-3 py-1 bg-red-950/45 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[10px] font-black uppercase transition-all"
        >
          ✖ COLLAPSE WORKSTATION
        </button>
      </div>

      {/* Main Core 3-Column */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* Left Column: Firewall and SOC stats */}
        <div className="col-span-3 flex flex-col gap-2.5 border border-[#1a5c1a]/40 p-2.5 bg-[#030603] rounded">
          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
            🛡️ DEFENDED ASSET PROFILE
          </h2>

          <div className="space-y-2 mt-1.5 flex-1">
            <div className="bg-black/45 border border-green-950 p-2">
              <div className="text-[11px] font-bold text-[#00ff44] flex justify-between">
                <span>FIREWALL SECURITY</span>
                <span>{firewallRating}/5</span>
              </div>
              <div className="w-full bg-green-950 h-1.5 mt-1 rounded overflow-hidden">
                <div className="bg-green-400 h-full animate-pulse" style={{ width: `${firewallRating * 20}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[8px] text-gray-400">
              <div className="bg-[#010401] p-1.5 border border-green-950">
                <span className="block text-gray-500">EXFILTRATED RATE</span>
                <strong className="text-white text-[9.5px]">{exfilMB} MB/s</strong>
              </div>
              <div className="bg-[#010401] p-1.5 border border-green-950">
                <span className="block text-gray-500">DEFLECT ATTACKS</span>
                <strong className="text-[#00e5ff] text-[9.5px]">{deflectCount}</strong>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[7.5px] text-gray-500">
                <span>FW FREQUENCY NOISE ACCORD:</span>
                <strong className="text-cyan-400 font-bold">{frequencyAlign} MHz</strong>
              </div>
              <input
                type="range" min="3" max="30" step="0.5" value={frequencyAlign}
                onChange={(e) => setFrequencyAlign(parseFloat(e.target.value))}
                className="w-full accent-cyan-600 h-1 bg-green-950 rounded"
              />
            </div>
          </div>

          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-2 uppercase">
            🚨 RECON RESPONSE GATE
          </h2>
          <button
            onClick={handleMitigateThreats}
            className="w-full py-2 bg-green-950/45 hover:bg-green-900/65 border border-[#00ff44]/70 text-[#00ff44] hover:text-white font-black text-[9px] uppercase rounded"
          >
            🛡️ RE-FLUSH SECURITY FIREWALLS
          </button>
        </div>

        {/* Center Column: Animated Topology Canvas */}
        <div className="col-span-6 flex flex-col gap-1.5 border border-[#1a5c1a]/40 p-1.5 bg-black rounded relative">
          <div className="absolute top-2.5 right-3 text-[7px] text-cyan-400 font-bold tracking-widest bg-black/75 p-1 border border-cyan-900 pointer-events-none uppercase z-10 animate-pulse">
            ● SOC NETWORK TOPOLOGY CORE
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={280}
              className="w-full h-full block bg-black border border-green-950"
            />
          </div>
        </div>

        {/* Right Column: Offensive Action Selection */}
        <div className="col-span-3 flex flex-col gap-2 border border-[#1a5c1a]/40 p-2 bg-[#030603] rounded min-h-0 justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
              ☠️ COVERT CYBER DIRECTIVES
            </h2>

            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { id: 'STUX_GRID', name: 'STUX_GRID INFRA EXPLOIT', desc: 'Isolates and overloads physical power utilities. Depletes target GDP assets.' },
                { id: 'SLUSH_FUN_EXFIL', name: 'SLUSH_FUND EXFIL SYSTEM', desc: 'Exfiltrates hidden bank accounts. Subsidizes player Treasury Cash directly.' },
                { id: 'MEDIA_HIJACK', name: 'MEDIA_HIJACK PROPAGANDA', desc: 'Overruns government media streams. Triggers major unrest and approval decline.' },
              ].map((hack) => (
                <div
                  key={hack.id}
                  onClick={() => { audio.sfxKeyClick(); setSelectedHack(hack.id as any); }}
                  className={`p-1.5 border text-[7.5px] cursor-pointer transition-all ${
                    selectedHack === hack.id
                      ? 'border-[#00ff44] bg-[#00ff44]/10 text-[#00ff44]'
                      : 'border-green-950 hover:border-green-800 text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <strong className="block">{hack.name}</strong>
                  <span className="text-gray-400 block mt-0.5 leading-tight">{hack.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLaunchHack}
              className="w-full mt-2.5 py-2 bg-red-950/40 hover:bg-red-900/65 border border-red-500/75 text-red-400 font-bold text-[9px] uppercase rounded"
            >
              🚀 INITIATE CYBER TARGET VECTOR
            </button>
          </div>

          <div>
            <h2 className="text-[8px] font-bold text-gray-400 border-b border-green-950 pb-1 mb-1.5 uppercase">
              📋 LOCAL SOC INCIDENT LOGS
            </h2>
            <div className="text-[7px]/tight text-gray-500 space-y-1 bg-black/45 p-1 border border-green-950 max-h-[90px] overflow-y-auto font-mono">
              {historyAttacks.length === 0 ? (
                <div className="italic text-gray-600 text-center py-1">No active hacks compiled. Select targets in command workspace.</div>
              ) : (
                historyAttacks.map((h) => <div key={h} className="text-[#00ff44]">{h}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
