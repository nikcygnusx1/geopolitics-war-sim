import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';

interface CyberNode {
  id: string;
  label: string;
  status: 'ONLINE' | 'COMPROMISED' | 'ALERT';
  gdpWeight: number;
}

// Critical infrastructure network nodes which link back to simulated operations
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
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // SOC States
  const [networkNodes, setNetworkNodes] = useState<CyberNode[]>(INITIAL_CYBER_NODES);
  const [firewallRating, setFirewallRating] = useState(2.8);
  const [isTracingActive, setIsTracingActive] = useState(false);
  const [traceCoord, setTraceCoord] = useState<string | null>(null);
  
  // Dynamic SOC metrics
  const [metrics, setMetrics] = useState({
    activeAlerts: 0,
    blockedAttempts: 148,
    exfilBytes: 12.4, // MB/s
    mttd: 45, // seconds
    mttr: 125, // seconds
  });

  // Dynamic status simulation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setNetworkNodes((nodes) =>
        nodes.map((n) => {
          // If node country corresponds to the active target and we are hacking or targeting, flag alerts!
          if (targetCountryId && n.id.startsWith(targetCountryId)) {
            return { ...n, status: Math.random() < 0.6 ? 'ALERT' : n.status };
          }
          // Normal background threat fluctuation
          if (Math.random() < 0.08) {
            const nextStatus: CyberNode['status'] =
              Math.random() < 0.45 ? 'ALERT' : Math.random() < 0.15 ? 'COMPROMISED' : 'ONLINE';
            return { ...n, status: nextStatus };
          }
          return n;
        })
      );

      // Mutate background metrics slightly
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

  // Synchronize targetCountryId into direct cyber nodes alerts
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

  // Canvas paint thread
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

    // Fixed network node rendering centroids inside canvas boundary
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

    // Connection infrastructure pipelines
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

      // Deep security backroom canvas plate
      ctx.fillStyle = '#020302';
      ctx.fillRect(0, 0, W, H);

      // Draw subtle electronic scan grid lines
      ctx.strokeStyle = 'rgba(0, 255, 68, 0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 12) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 12) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // 1. Draw Network Connections (EDGES)
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

        // Trace active coordinate highlighting
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

        // Animate microscopic connection data packets flowing across lines
        const packetOffset = (tick * 0.45) % 1;
        const pX = sPt.x + (dPt.x - sPt.x) * packetOffset;
        const pY = sPt.y + (dPt.y - sPt.y) * packetOffset;
        ctx.fillStyle = srcNode?.status === 'COMPROMISED' ? '#ff2244' : '#00ff44';
        ctx.fillRect(pX - 1, pY - 1, 2, 2);
      });
      ctx.setLineDash([]);

      // 2. Draw Network Node Controllers
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

        // Concentric safety rings around main node hubs
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = isBreached && tick % 20 < 10 ? 'rgba(255,34,68,0.2)' : `rgba(0, 255, 68, 0.12)`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Center hub dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // Node ID label tag
        ctx.fillStyle = '#ffffff';
        ctx.font = '5px "JetBrains Mono", monospace';
        ctx.fillText(node.label, pt.x - 14, pt.y - 7);
      });

      // 3. Draw rolling anomaly timeline at bottom section of canvas
      const timelineY = H - 24;
      ctx.fillStyle = 'rgba(2, 6, 2, 0.88)';
      ctx.fillRect(4, timelineY, W - 8, 12);
      ctx.strokeStyle = '#1a5c1a';
      ctx.strokeRect(4, timelineY, W - 8, 12);

      // Visual line waveform of intrusion intensity
      ctx.strokeStyle = networkNodes.some((n) => n.status === 'COMPROMISED') ? '#ff2244' : '#00e5ff';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      for (let tx = 0; tx < W - 10; tx += 3) {
        // Create fluctuating noise proportional to compromised nodes count
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
      ctx.font = '5px sans-serif';
      ctx.fillText('SOC SCAN FLOW INTENSITY', 10, timelineY + 4);

      // Warning prompt for compromise state
      const compromisedNodes = networkNodes.filter((n) => n.status === 'COMPROMISED');
      if (compromisedNodes.length > 0 && tick % 16 < 8) {
        ctx.fillStyle = 'rgba(255, 34, 68, 0.15)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff2244';
        ctx.font = 'bold 7px "JetBrains Mono", monospace';
        ctx.fillText(`🚨 NODE BREACH DETECTED: [${compromisedNodes[0].label}]`, 12, H - 40);
      }

      // Matrix scrolling terminal alert feed overlays on upper left
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

  // Offensive action: hack grid
  const handleHackGrid = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('HACK REJECTED: Target country coordinate not specified on console map.', 'WARNING');
      return;
    }

    pushTerminalLine(`Deploying payload 'STUX_COBALT.bin' into sector network: ${targetCountryId}...`, 'WARNING');
    audio.sfxKlaxon();

    setTimeout(() => {
      // Find matching cyber node to compromise it
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

  // Defensive boost: fw boost
  const handleBoostFirewall = () => {
    audio.sfxKeyClick();
    if (firewallRating >= 4.9) {
      pushTerminalLine('FIREWALL: Infrastructure defenses already operating at peak security load.', 'INFO');
      return;
    }
    const nextRating = parseFloat((firewallRating + 0.5).toFixed(1));
    setFirewallRating(nextRating);

    // Wipe compromises
    setNetworkNodes((nodes) => nodes.map((n) => ({ ...n, status: n.status === 'COMPROMISED' ? 'ONLINE' : n.status })));
    pushTerminalLine(`Calibrating cyber-physical shield arrays. Firewall security factor hoisted to [${nextRating}x]. Alerts pruned.`, 'SYSTEM');
  };

  // Trace Attack action
  const handleTrace = () => {
    audio.sfxKeyClick();
    setIsTracingActive(true);
    // Find alert nodes or pick a random node to trace
    const alertNode = networkNodes.find((n) => n.status === 'ALERT' || n.status === 'COMPROMISED');
    const nodeToTrace = alertNode ? alertNode.id : 'RU_NET';
    setTraceCoord(nodeToTrace);
    
    pushTerminalLine(`Initializing SOC backtrack traceroute coordinates to pinpoint compromise origins...`, 'INFO');

    setTimeout(() => {
      setIsTracingActive(false);
      setTraceCoord(null);
      // Clean target country cyber node back to ONLINE
      setNetworkNodes((nodes) => nodes.map((n) => (n.id === nodeToTrace ? { ...n, status: 'ONLINE' } : n)));
      pushTerminalLine(`Trace route isolate: Malicious source coordinates neutralized completely. Tunnel resolved.`, 'SYSTEM');
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      {/* SOC Header and alerts */}
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          COVERT CYBER GRID DIAGRAM
        </span>
        <span className="font-bold text-[#00e5ff]">
          🛡️ FW_SEC: {firewallRating.toFixed(1)}/5
        </span>
      </div>

      {/* Cyber SOC dynamic metrics panel */}
      <div className="grid grid-cols-5 gap-0.5 text-[6.5px] font-mono bg-black/45 px-1 py-0.5 border border-[#1a5c1a]/15 text-gray-400">
        <div>ALERTS: <span className={`${metrics.activeAlerts > 0 ? 'text-[#ff2244] font-bold' : 'text-[#00ff44]'}`}>{metrics.activeAlerts}</span></div>
        <div>BLOCKS: <span className="text-[#00e5ff] font-bold">{metrics.blockedAttempts}</span></div>
        <div>EXFIL: <span className="text-amber-500 font-bold">{metrics.exfilBytes}M/s</span></div>
        <div>MTTD: <span className="text-white">{metrics.mttd}s</span></div>
        <div>MTTR: <span className="text-white">{metrics.mttr}s</span></div>
      </div>

      {/* Primary Grid topology display board */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[120px] block border border-[#0d2e0d]"
          style={{ background: '#020302' }}
        />
        <div className="absolute top-1 right-2 text-[6px] text-gray-500 font-mono">
          SOC_WAN_TOPOLOGY
        </div>
        <div className="absolute top-7 left-2.5 text-[6.5px] text-[#00ff44]/60 font-mono bg-[#030603]/85 px-1 py-0.5 rounded-[1px] border border-green-950">
          SECURE_WAN_CHANNELS: ENABLED
        </div>
      </div>

      {/* SOC Tactical command row */}
      <div className="grid grid-cols-3 gap-1 mt-0.5 text-[8.5px] font-mono">
        <button
          onClick={handleHackGrid}
          className="feed-btn px-0.5 py-1 rounded text-center font-bold"
          title="Offensive Infiltration: deploy trojan malware payload into selected sector grid"
        >
          HACK GRID
        </button>

        <button
          onClick={handleBoostFirewall}
          className="feed-btn px-0.5 py-1 rounded text-center font-bold text-[#00e5ff]"
          title="Defensive hardening: elevates packet firewall strength and prunes compromised files"
        >
          FW BOOST
        </button>

        <button
          onClick={handleTrace}
          className="feed-btn px-0.5 py-1 rounded text-center font-bold text-[#ffb300]"
          title="Traces malicious connection routes and blocks intrusion pathways"
        >
          TRACE NODE
        </button>
      </div>
    </div>
  );
}
