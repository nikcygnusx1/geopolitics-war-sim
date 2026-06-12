import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { audio } from '../../utils/audio';

// Coordinates mapping for major command regions for satellite scan centering
const COUNTRY_PIXEL_COORDS: Record<string, { feedX: number; feedY: number }> = {
  US: { feedX: 45, feedY: 55 },
  CN: { feedX: 135, feedY: 65 },
  RU: { feedX: 120, feedY: 42 },
  IN: { feedX: 125, feedY: 78 },
  PK: { feedX: 118, feedY: 72 },
  IL: { feedX: 102, feedY: 74 },
  IR: { feedX: 108, feedY: 70 },
  GB: { feedX: 88, feedY: 48 },
  FR: { feedX: 90, feedY: 54 },
  DE: { feedX: 94, feedY: 52 },
  JP: { feedX: 154, feedY: 62 },
  KR: { feedX: 148, feedY: 64 },
  SA: { feedX: 105, feedY: 82 },
  BR: { feedX: 68, feedY: 105 },
  ZA: { feedX: 96, feedY: 118 },
  AU: { feedX: 150, feedY: 112 },
  TR: { feedX: 100, feedY: 60 },
  EG: { feedX: 98, feedY: 78 },
  TW: { feedX: 143, feedY: 71 },
};

// Ironbow thermal map stops
const IRONBOW: [number, number, number][] = [
  [0, 5, 20],       // cold dark blue
  [45, 10, 95],     // deep purple
  [120, 10, 140],   // indigo/violet
  [195, 30, 80],    // rust red
  [240, 95, 15],    // hot orange
  [255, 180, 5],    // bright yellow
  [255, 255, 120],  // yellow-white
  [255, 255, 255],  // white-hot
];
const IRONBOW_STOPS = [0, 0.15, 0.3, 0.48, 0.65, 0.8, 0.92, 1.0];

function ironbow(h: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, h));
  for (let i = 0; i < IRONBOW_STOPS.length - 1; i++) {
    if (clamped <= IRONBOW_STOPS[i + 1]) {
      const t = (clamped - IRONBOW_STOPS[i]) / (IRONBOW_STOPS[i + 1] - IRONBOW_STOPS[i]);
      return IRONBOW[i].map((val, j) =>
        Math.round(val + t * (IRONBOW[i + 1][j] - val))
      ) as [number, number, number];
    }
  }
  return [255, 255, 255];
}

interface SatelliteAsset {
  id: string;
  name: string;
  orbitClass: string;
  resolution: string;
  cloudsPct: number;
  nadirAngle: number;
}

const SATELLITE_ASSETS: SatelliteAsset[] = [
  { id: 'SAT_07', name: 'SAT-07 COBALT', orbitClass: 'SSO (LEO)', resolution: '0.12m/px', cloudsPct: 12, nadirAngle: 4.8 },
  { id: 'SAT_12', name: 'SAT-12 TITAN', orbitClass: 'Polar Orbit', resolution: '0.15m/px', cloudsPct: 5, nadirAngle: 11.2 },
  { id: 'SAT_15', name: 'SAT-15 ARGON', orbitClass: 'HEO Elliptic', resolution: '0.28m/px', cloudsPct: 24, nadirAngle: 23.5 },
];

export default function ThermalRecon() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heat = useRef<Float32Array>(new Float32Array(16 * 12).fill(0.3));
  const crosshairPos = useRef({ x: 96, y: 74 });
  const targetPos = useRef({ x: 96, y: 74 });
  const rafRef = useRef<number | null>(null);

  // Active States
  const [activeSatIndex, setActiveSatIndex] = useState(0);
  const [sensorMode, setSensorMode] = useState<'SAR' | 'IR' | 'VIS' | 'CHANGE' | 'INDICATORS'>('IR');
  const [queueStatus, setQueueStatus] = useState<'IDLE' | 'TASKED' | 'COLLECTING' | 'PROCESSING' | 'DELIVERED'>('IDLE');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAoiLocked, setIsAoiLocked] = useState(false);

  const currentSat = SATELLITE_ASSETS[activeSatIndex];

  // Auto lock-on & target transition
  useEffect(() => {
    if (targetCountryId) {
      const coords = COUNTRY_PIXEL_COORDS[targetCountryId];
      if (coords) {
        targetPos.current = { x: coords.feedX, y: coords.feedY };
        setIsAoiLocked(true);
        if (queueStatus === 'IDLE' || queueStatus === 'DELIVERED') {
          setQueueStatus('TASKED');
        }
      }
    } else {
      setIsAoiLocked(false);
      setQueueStatus('IDLE');
    }
  }, [targetCountryId]);

  // Handle active strike impact flash
  useEffect(() => {
    if (targetCountryId) {
      const impact = activeStrikes.find(
        (st) => st.targetCountryId === targetCountryId && st.status === 'IMPACT'
      );
      if (impact) {
        for (let i = 0; i < heat.current.length; i++) {
          heat.current[i] = 0.98 + Math.random() * 0.02;
        }
        setQueueStatus('COLLECTING');
        setCountdown(3);
      }
    }
  }, [activeStrikes, targetCountryId]);

  // Handle count timers
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      if (queueStatus === 'COLLECTING') {
        setQueueStatus('PROCESSING');
        setCountdown(4);
      } else if (queueStatus === 'PROCESSING') {
        setQueueStatus('DELIVERED');
        pushTerminalLine(`SAT TASK: [${currentSat.name}] telemetry and imagery payload for ${targetCountryId || 'AOI'} analyzed completely.`, 'SYSTEM');
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, queueStatus]);

  // Dynamic canvas paint thread
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
    const COLS = 16;
    const ROWS = 12;
    const cellW = W / COLS;
    const cellH = H / ROWS;

    // Static structures overlays (concrete military structures)
    const structures = [
      { ix: 3, iy: 4, signature: 0.8 },
      { ix: 12, iy: 3, signature: 0.45 },
      { ix: 8, iy: 8, signature: 0.65 },
      { ix: 13, iy: 9, signature: 0.9 },
    ];

    function renderLoop() {
      // Lerp crosshair targeting position smoothly
      const speed = queueStatus === 'PROCESSING' || queueStatus === 'COLLECTING' ? 0.15 : 0.06;
      crosshairPos.current.x += (targetPos.current.x - crosshairPos.current.x) * speed;
      crosshairPos.current.y += (targetPos.current.y - crosshairPos.current.y) * speed;

      // Update background thermal noise values
      for (let i = 0; i < heat.current.length; i++) {
        heat.current[i] += (Math.random() - 0.5) * 0.015;
        // Keep within beautiful boundary levels
        heat.current[i] = Math.max(0.1, Math.min(0.9, heat.current[i]));
      }

      // Add structural signature noise
      structures.forEach((struct) => {
        const idx = struct.iy * COLS + struct.ix;
        heat.current[idx] = heat.current[idx] * 0.4 + struct.signature * 0.6;
      });

      // Ambient scan sweep bar for SAR
      const sweepY = (Date.now() / 25) % H;

      // Render the tile canvas according to active sensorMode
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const h = heat.current[r * COLS + c];
          let color = '';

          switch (sensorMode) {
            case 'IR': {
              const [rCol, gCol, bCol] = ironbow(h);
              color = `rgb(${rCol}, ${gCol}, ${bCol})`;
              break;
            }
            case 'SAR': {
              // Synthetic Aperture Radar: high-contrast monochrome with glowing sweep line
              const distToSweep = Math.abs(r * cellH - sweepY);
              const sweepGlow = distToSweep < 8 ? (1 - distToSweep / 8) * 0.5 : 0;
              const brightness = Math.floor((h * 0.6 + sweepGlow) * 255);
              color = `rgb(${Math.max(10, Math.min(255, brightness - 30))}, ${Math.max(10, Math.min(255, brightness + 10))}, ${Math.max(20, Math.min(255, brightness + 40))})`;
              break;
            }
            case 'VIS': {
              // Visible Imagery spectrum: dark ocean blues, olive land coordinates, cloudy whites
              const landFactor = h;
              const red = Math.floor(25 + landFactor * 45);
              const green = Math.floor(40 + landFactor * 75);
              const blue = Math.floor(55 + (1 - landFactor) * 85);
              color = `rgb(${red}, ${green}, ${blue})`;
              break;
            }
            case 'CHANGE': {
              // Red/Cyan difference changes mapping
              const diff = Math.abs(h - 0.5) * 2;
              if (diff > 0.4) {
                color = `rgb(${Math.floor(diff * 220 + 35)}, 12, 50)`;
              } else {
                color = `rgb(10, ${Math.floor((1 - diff) * 65 + 15)}, ${Math.floor((1 - diff) * 85 + 20)})`;
              }
              break;
            }
            case 'INDICATORS': {
              // Diagnostic analytical contours
              const band = Math.floor(h * 8);
              if (band % 2 === 0) {
                color = '#020d04';
              } else {
                color = `rgb(${Math.floor(h * 32)}, ${Math.floor(128 + h * 90)}, ${Math.floor(h * 48)})`;
              }
              break;
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);

          // Hot point outlines for IR
          if (sensorMode === 'IR' && h > 0.72) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Structure indicator borders for SAR
          if (sensorMode === 'SAR' && h > 0.65) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // SAR scan sweep line draw
      if (sensorMode === 'SAR') {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(W, sweepY);
        ctx.stroke();
      }

      // Draw satellite coordinates lines / tracking lock
      const rx = crosshairPos.current.x;
      const ry = crosshairPos.current.y;

      ctx.strokeStyle = isAoiLocked ? 'rgba(0, 255, 68, 0.65)' : 'rgba(100, 100, 100, 0.4)';
      ctx.lineWidth = 0.5;
      
      // Fine target reticle grid
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx, H);
      ctx.moveTo(0, ry); ctx.lineTo(W, ry);
      ctx.stroke();

      // Outer focus bracket
      ctx.strokeStyle = isAoiLocked ? '#00ff44' : '#ffb300';
      ctx.lineWidth = 1;
      const bracketSize = 14;
      ctx.strokeRect(rx - bracketSize / 2, ry - bracketSize / 2, bracketSize, bracketSize);

      // Inner locking core
      ctx.fillStyle = isAoiLocked ? '#00ff44' : '#ffb300';
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);

      // Overlay status telemetry
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(4, 4, 110, 13);
      ctx.strokeStyle = isAoiLocked ? '#00ff44' : '#ff9900';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(4, 4, 110, 13);

      ctx.fillStyle = '#ffffff';
      ctx.font = '5px "JetBrains Mono", monospace';
      ctx.fillText(
        `AOI: ${targetCountryId || 'UNSECTORIZED'} LOCK: ${isAoiLocked ? 'READY' : 'SCANNING'}`,
        7,
        12
      );

      // Processing Status indicator
      if (queueStatus !== 'IDLE') {
        const pulse = Math.sin(Date.now() / 150) > 0;
        ctx.fillStyle = 'rgba(2, 6, 2, 0.9)';
        ctx.fillRect(W - 85, 4, 81, 13);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(W - 85, 4, 81, 13);

        ctx.fillStyle = pulse ? '#00e5ff' : '#007799';
        ctx.fillText(
          `${queueStatus} ${countdown !== null ? `(${countdown}s)` : ''}`,
          W - 81,
          12
        );
      }

      // Glitch effect if actively collecting or processing (re-routing telemetry)
      if ((queueStatus === 'COLLECTING' || queueStatus === 'PROCESSING') && Math.random() < 0.08) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 4;
        ctx.fillRect(Math.random() * W, Math.random() * H, 10, 0.8);
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sensorMode, targetCountryId, queueStatus, countdown, isAoiLocked]);

  const handleTaskSat = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('ISR Alert: Unable to task orbital array without active sector lock-on. Select a country.', 'WARNING');
      return;
    }
    setQueueStatus('COLLECTING');
    setCountdown(3);
    useIntelligenceStore.getState().taskSatellite(currentSat.id, targetCountryId);
    pushTerminalLine(`Orbit queue calibrated: TASKED ${currentSat.name} to sector ${targetCountryId}. Gathering multispectral sweeps.`, 'INFO');
  };

  const handleDefineAoi = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('AOI Error: No focal region. Center coordinate manually via map view.', 'WARNING');
      return;
    }
    setIsAoiLocked(true);
    pushTerminalLine(`AOI bound defined on ${targetCountryId}. Coordinates anchored at [Lat/Lon Centroid]. Lock confirmed.`, 'SYSTEM');
  };

  const handleRunChangeDetect = () => {
    if (queueStatus !== 'DELIVERED') {
      pushTerminalLine(`Coherence payload outstanding: Must process and deliver imagery from ${currentSat.name} first.`, 'WARNING');
      return;
    }
    audio.sfxRadarPing();
    setSensorMode('CHANGE');
    pushTerminalLine(`Coherent change detection (CCD) computed over ${targetCountryId}. Thermal and building shifts highlighted in RED.`, 'SYSTEM');
  };

  const handleCaptureIntel = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('ISR Error: Intelligence capture requires target focus.', 'WARNING');
      return;
    }
    pushTerminalLine(`Captured high-res satellite dossier snapshots. Metadata logged under Active Intelligence.`, 'SYSTEM');
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      {/* Active Satellite selection list header */}
      <div className="flex justify-between items-center text-[8.5px] font-mono tracking-wider text-[#00ff44] uppercase bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          SATELLITE POV
        </span>
        <div className="flex gap-1.5 text-gray-500">
          {SATELLITE_ASSETS.map((sat, idx) => (
            <button
              key={sat.id}
              onClick={() => { audio.sfxKeyClick(); setActiveSatIndex(idx); }}
              className={`px-1 py-0.5 border text-[7.5px] font-bold ${
                idx === activeSatIndex
                  ? 'border-[#00ff44] text-[#00ff44] bg-[#00ff44]/10'
                  : 'border-green-950 text-green-700 hover:text-green-500 hover:border-green-800'
              }`}
            >
              SAT-{sat.id.substring(4)}
            </button>
          ))}
        </div>
      </div>

      {/* Orbit metrics readout row */}
      <div className="grid grid-cols-4 gap-1 text-[7px] font-mono text-gray-400 bg-black/40 px-1 py-0.5 border-b border-[#1a5c1a]/10">
        <div>ORBIT: <span className="text-white font-bold">{currentSat.orbitClass}</span></div>
        <div>RESOLVE: <span className="text-cyan-400 font-bold">{currentSat.resolution}</span></div>
        <div>CLOUDS: <span className="text-amber-500 font-bold">{currentSat.cloudsPct}%</span></div>
        <div>TILT: <span className="text-white">{currentSat.nadirAngle}°</span></div>
      </div>

      {/* Primary Imaging Canvas Frame */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[120px] block border border-[#0d2e0d]"
          style={{ background: '#000000', imageRendering: 'pixelated' }}
        />
        {/* Little tactical corner labels */}
        <div className="absolute top-1 left-1.5 text-[6px] font-bold text-[#00e5ff] font-mono select-none pointer-events-none">
          SYSTEM_SAT_LINK_SECURE
        </div>
        <div className="absolute bottom-1 right-2 text-[6px] font-bold text-gray-500 font-mono select-none pointer-events-none">
          {currentSat.name}
        </div>
      </div>

      {/* Advanced mode sliders and action decks */}
      <div className="flex gap-1 items-center bg-[#010401] p-1 border border-[#1a5c1a]/40 text-[8px] font-mono">
        <span className="text-gray-500 font-bold uppercase text-[7.5px]">SENSOR_MODE:</span>
        <div className="flex gap-0.5 flex-1 justify-between">
          {(['SAR', 'IR', 'VIS', 'CHANGE', 'INDICATORS'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { audio.sfxKeyClick(); setSensorMode(m); }}
              className={`px-1 py-0.5 text-[7px] font-black uppercase rounded-[1px] transition-all ${
                sensorMode === m
                  ? 'bg-[#153a15] text-[#00ff44] border border-[#00ff44]/70 shadow-[0_0_2px_rgba(0,255,68,0.25)]'
                  : 'bg-black text-gray-500 hover:text-white border border-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Live command action keys */}
      <div className="grid grid-cols-4 gap-1 mt-0.5">
        <button
          onClick={handleDefineAoi}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
          title="Anchors coordinate region context on selected territory"
        >
          DEF AOI
        </button>
        <button
          onClick={handleTaskSat}
          className={`feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold ${
            isAoiLocked && queueStatus === 'IDLE' ? 'animate-pulse text-[#00ff44] border-[#00ff44]/50' : ''
          }`}
          title="Queue satellite orbital pass and begin imaging gather"
        >
          TASK SAT
        </button>
        <button
          onClick={handleRunChangeDetect}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
          title="Run differential change detection overlays between runs"
        >
          CHANGE DET
        </button>
        <button
          onClick={handleCaptureIntel}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
          title="Export high-res target snapshot dossier to intelligence records"
        >
          CAP INTEL
        </button>
      </div>
    </div>
  );
}
