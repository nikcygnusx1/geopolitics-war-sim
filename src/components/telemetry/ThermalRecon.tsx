import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { usePlayerStore } from '../../store/playerStore';
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
  health: number;
}

const SATELLITE_ASSETS: SatelliteAsset[] = [
  { id: 'SAT_07', name: 'SAT-07 COBALT', orbitClass: 'SSO (LEO)', resolution: '0.12m/px', cloudsPct: 12, nadirAngle: 4.8, health: 98 },
  { id: 'SAT_12', name: 'SAT-12 TITAN', orbitClass: 'Polar Orbit', resolution: '0.15m/px', cloudsPct: 5, nadirAngle: 11.2, health: 95 },
  { id: 'SAT_15', name: 'SAT-15 ARGON', orbitClass: 'HEO Elliptic', resolution: '0.28m/px', cloudsPct: 24, nadirAngle: 23.5, health: 89 },
];

export default function ThermalRecon() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const setExpandedWorkstation = useUIStore((s) => s.setExpandedWorkstation);

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

    // Static structures overlays
    const structures = [
      { ix: 3, iy: 4, signature: 0.8 },
      { ix: 12, iy: 3, signature: 0.45 },
      { ix: 8, iy: 8, signature: 0.65 },
      { ix: 13, iy: 9, signature: 0.9 },
    ];

    function renderLoop() {
      const speed = queueStatus === 'PROCESSING' || queueStatus === 'COLLECTING' ? 0.15 : 0.06;
      crosshairPos.current.x += (targetPos.current.x - crosshairPos.current.x) * speed;
      crosshairPos.current.y += (targetPos.current.y - crosshairPos.current.y) * speed;

      for (let i = 0; i < heat.current.length; i++) {
        heat.current[i] += (Math.random() - 0.5) * 0.015;
        heat.current[i] = Math.max(0.1, Math.min(0.9, heat.current[i]));
      }

      structures.forEach((struct) => {
        const idx = struct.iy * COLS + struct.ix;
        heat.current[idx] = heat.current[idx] * 0.4 + struct.signature * 0.6;
      });

      const sweepY = (Date.now() / 25) % H;

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
              const distToSweep = Math.abs(r * cellH - sweepY);
              const sweepGlow = distToSweep < 8 ? (1 - distToSweep / 8) * 0.5 : 0;
              const brightness = Math.floor((h * 0.6 + sweepGlow) * 255);
              color = `rgb(${Math.max(10, Math.min(255, brightness - 30))}, ${Math.max(10, Math.min(255, brightness + 10))}, ${Math.max(20, Math.min(255, brightness + 40))})`;
              break;
            }
            case 'VIS': {
              const landFactor = h;
              const red = Math.floor(25 + landFactor * 45);
              const green = Math.floor(40 + landFactor * 75);
              const blue = Math.floor(55 + (1 - landFactor) * 85);
              color = `rgb(${red}, ${green}, ${blue})`;
              break;
            }
            case 'CHANGE': {
              const diff = Math.abs(h - 0.5) * 2;
              if (diff > 0.4) {
                color = `rgb(${Math.floor(diff * 220 + 35)}, 12, 50)`;
              } else {
                color = `rgb(10, ${Math.floor((1 - diff) * 65 + 15)}, ${Math.floor((1 - diff) * 85 + 20)})`;
              }
              break;
            }
            case 'INDICATORS': {
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

          if (sensorMode === 'IR' && h > 0.72) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          if (sensorMode === 'SAR' && h > 0.65) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      if (sensorMode === 'SAR') {
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(W, sweepY);
        ctx.stroke();
      }

      const rx = crosshairPos.current.x;
      const ry = crosshairPos.current.y;

      ctx.strokeStyle = isAoiLocked ? 'rgba(0, 255, 68, 0.65)' : 'rgba(100, 100, 100, 0.4)';
      ctx.lineWidth = 0.5;
      
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx, H);
      ctx.moveTo(0, ry); ctx.lineTo(W, ry);
      ctx.stroke();

      ctx.strokeStyle = isAoiLocked ? '#00ff44' : '#ffb300';
      ctx.lineWidth = 1;
      const bracketSize = 14;
      ctx.strokeRect(rx - bracketSize / 2, ry - bracketSize / 2, bracketSize, bracketSize);

      ctx.fillStyle = isAoiLocked ? '#00ff44' : '#ffb300';
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);

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

      if (queueStatus !== 'IDLE') {
        const pulse = Math.sin(Date.now() / 150) > 0;
        ctx.fillStyle = 'rgba(2, 6, 2, 0.9)';
        ctx.fillRect(W - 85, 4, 81, 13);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(W - 85, 4, 81, 13);

        ctx.fillStyle = pulse ? '#00e5ff' : '#007799';
        ctx.font = '5px "JetBrains Mono", monospace';
        ctx.fillText(
          `${queueStatus} ${countdown !== null ? `(${countdown}s)` : ''}`,
          W - 81,
          12
        );
      }

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
      {/* Selection strip */}
      <div className="flex justify-between items-center text-[8.5px] font-mono tracking-wider text-[#00ff44] uppercase bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
          SATELLITE POV
        </span>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { audio.playPhaseReveal(); setExpandedWorkstation('SATELLITE'); }}
            className="text-[7.5px] text-[#00e5ff] border border-[#00e5ff]/40 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/20 px-1 py-0.2 rounded font-black cursor-pointer uppercase transition-all"
          >
            ▲ WORKSTATION
          </button>
        </div>
      </div>

      {/* Orbit metrics readout row */}
      <div className="grid grid-cols-4 gap-1 text-[7px] font-mono text-gray-400 bg-black/40 px-1 py-0.5 border-b border-[#1a5c1a]/10">
        <div>ORBIT: <span className="text-white font-bold">{currentSat.orbitClass}</span></div>
        <div>RESOLVE: <span className="text-cyan-400 font-bold">{currentSat.resolution}</span></div>
        <div>CLOUDS: <span className="text-amber-500 font-bold">{currentSat.cloudsPct}%</span></div>
        <div>TILT: <span className="text-white">{currentSat.nadirAngle}°</span></div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[100px] block border border-[#0d2e0d]"
          style={{ background: '#000000', imageRendering: 'pixelated' }}
        />
        <div className="absolute top-1 left-1.5 text-[6px] font-bold text-[#00e5ff]/80 font-mono pointer-events-none">
          SYS_SAT_LINK_SECURE
        </div>
        <div className="absolute bottom-1 right-2 text-[6px] font-bold text-gray-500 font-mono pointer-events-none">
          {currentSat.name}
        </div>
      </div>

      {/* Sensor control */}
      <div className="flex gap-1 items-center bg-[#010401] p-1 border border-[#1a5c1a]/40 text-[8px] font-mono">
        <span className="text-gray-500 font-bold uppercase text-[6.5px]">SENSOR:</span>
        <div className="flex gap-0.5 flex-1 justify-between">
          {(['SAR', 'IR', 'VIS', 'CHANGE', 'INDICATORS'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { audio.sfxKeyClick(); setSensorMode(m); }}
              className={`px-0.5 py-0.5 text-[6.5px] font-black uppercase rounded-[1px] transition-all ${
                sensorMode === m
                  ? 'bg-[#153a15] text-[#00ff44] border border-[#00ff44]/70'
                  : 'bg-black text-gray-500 hover:text-white border border-transparent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-1 mt-0.5">
        <button
          onClick={handleDefineAoi}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
        >
          DEF AOI
        </button>
        <button
          onClick={handleTaskSat}
          className={`feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold ${
            isAoiLocked && queueStatus === 'IDLE' ? 'animate-pulse text-[#00ff44]' : ''
          }`}
        >
          TASK SAT
        </button>
        <button
          onClick={handleRunChangeDetect}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
        >
          CHANGE
        </button>
        <button
          onClick={handleCaptureIntel}
          className="feed-btn px-0.5 py-0.5 text-[7.5px] rounded text-center font-bold"
        >
          CAP INTEL
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// SATELLITE EXPANDED WORKSTATION
// =========================================================================
export function SatelliteWorkstation({ onClose }: { onClose: () => void }) {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const addIntelReport = useIntelligenceStore((s) => s.addIntelReport);
  const intelReports = useIntelligenceStore((s) => s.intelReports);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heat = useRef<Float32Array>(new Float32Array(32 * 24).fill(0.35));
  const crosshairPos = useRef({ x: 200, y: 150 });
  const targetPos = useRef({ x: 200, y: 150 });
  const rafRef = useRef<number | null>(null);

  const [activeSatIndex, setActiveSatIndex] = useState(0);
  const [sensorMode, setSensorMode] = useState<'SAR' | 'IR' | 'VIS' | 'CHANGE' | 'INDICATORS'>('IR');
  const [queueStatus, setQueueStatus] = useState<'IDLE' | 'TASKED' | 'COLLECTING' | 'PROCESSING' | 'DELIVERED'>('IDLE');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAoiLocked, setIsAoiLocked] = useState(!!targetCountryId);

  // Expanded local tuning sliders
  const [slewX, setSlewX] = useState(0.0);
  const [slewY, setSlewY] = useState(0.0);
  const [revisitCycle, setRevisitCycle] = useState(8); // hours
  const [tiltLimit, setTiltLimit] = useState(24); // degrees
  const [resolutionFilter, setResolutionFilter] = useState('HIGH');
  const [inspectedTargets, setInspectedTargets] = useState<string[]>([]);

  const currentSat = SATELLITE_ASSETS[activeSatIndex];

  // Map of target coordinators for satellite workstation
  const COUNTRY_PIXEL_LARGE_COORDS: Record<string, { x: number; y: number }> = {
    US: { x: 90, y: 110 },
    CN: { x: 280, y: 130 },
    RU: { x: 240, y: 84 },
    IN: { x: 260, y: 160 },
    PK: { x: 246, y: 148 },
    IL: { x: 210, y: 152 },
    IR: { x: 226, y: 140 },
    GB: { x: 176, y: 100 },
    FR: { x: 180, y: 112 },
    DE: { x: 188, y: 108 },
    JP: { x: 310, y: 128 },
    KR: { x: 298, y: 132 },
    SA: { x: 216, y: 170 },
    BR: { x: 140, y: 220 },
    ZA: { x: 196, y: 240 },
    AU: { x: 300, y: 230 },
  };

  useEffect(() => {
    if (targetCountryId) {
      const coord = COUNTRY_PIXEL_LARGE_COORDS[targetCountryId];
      if (coord) {
        targetPos.current = { x: coord.x, y: coord.y };
        setIsAoiLocked(true);
      }
    }
  }, [targetCountryId]);

  // Calibration sequence countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      if (queueStatus === 'COLLECTING') {
        setQueueStatus('PROCESSING');
        setCountdown(3);
      } else if (queueStatus === 'PROCESSING') {
        setQueueStatus('DELIVERED');
        const target = targetCountryId || 'AOI';
        audio.sfxRadarPing();

        // 1. Generate Intelligence Report
        const reportTitle = `CLASSIFIED ORBITAL SWEEP: ${target}`;
        const reportContent = `Reconnaissance from ${currentSat.name} confirms structural heat signature clusters matching 12 active subterranean complexes over sector ${target}. Confidence: 94%. Slew alignment locked at ${tiltLimit.toFixed(1)}° nadir angle. Resolution capability validated at ${currentSat.resolution}.`;
        addIntelReport(reportTitle, reportContent, 'INFO');

        // 2. Adjust target country attributes in worldState as downstream consequence!
        useWorldStore.getState().applyTickDelta((draft) => {
          const country = draft.countries[target];
          if (country && country.political) {
            // Uncover secrets: slightly nudge general parameters reflecting exposure
            country.political.coupRiskLevel = Math.min(100, country.political.coupRiskLevel + 3);
            country.political.stabilityIndex = Math.max(10, country.political.stabilityIndex - 5);
          }
        });

        // 3. Log to tactical panel and global logs
        pushTerminalLine(`ISR WORKSTATION: Slew sweep complete. Imagery processed and committed to main intelligence archives for ${target}.`, 'SYSTEM');
        useWorldStore.getState().addGlobalEvent(`HIGH-RES SAT INTEL: Constellation ${currentSat.name} has compiled spatial telemetry and infrastructure shifting maps for ${target}.`, 'INFO');
      }
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, queueStatus]);

  // Drawing canvas logic
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

    const COLS = 32;
    const ROWS = 24;
    const cellW = W / COLS;
    const cellH = H / ROWS;

    // Structural coordinates
    const militaryHangarOverlay = [
      { ix: 8, iy: 6, sig: 0.9, label: 'SILO_01_HOT' },
      { ix: 9, iy: 6, sig: 0.85, label: 'COMM_TWR' },
      { ix: 21, iy: 14, sig: 0.72, label: 'HANGAR_B' },
      { ix: 25, iy: 18, sig: 0.95, label: 'PROPULSION_LAB' },
      { ix: 14, iy: 10, sig: 0.6, label: 'RADAR_ARRAY_04' },
    ];

    function renderLoop() {
      // Smooth targeting crosshair track
      const speed = queueStatus === 'PROCESSING' || queueStatus === 'COLLECTING' ? 0.2 : 0.08;
      crosshairPos.current.x += (targetPos.current.x - crosshairPos.current.x) * speed + slewX * 3;
      crosshairPos.current.y += (targetPos.current.y - crosshairPos.current.y) * speed + slewY * 3;

      // Restrain boundaries
      crosshairPos.current.x = Math.max(10, Math.min(W - 10, crosshairPos.current.x));
      crosshairPos.current.y = Math.max(10, Math.min(H - 10, crosshairPos.current.y));

      // Thermal field ripple updates
      for (let i = 0; i < heat.current.length; i++) {
        heat.current[i] += (Math.random() - 0.5) * 0.012;
        heat.current[i] = Math.max(0.15, Math.min(0.95, heat.current[i]));
      }

      // Heat footprints
      militaryHangarOverlay.forEach((m) => {
        const idx = m.iy * COLS + m.ix;
        heat.current[idx] = heat.current[idx] * 0.3 + m.sig * 0.7;
      });

      const sweepY = (Date.now() / 32) % H;

      // Draw sensor grid values
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const h = heat.current[r * COLS + c];
          let fillStyle = '';

          switch (sensorMode) {
            case 'IR': {
              const [rCol, gCol, bCol] = ironbow(h);
              fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
              break;
            }
            case 'SAR': {
              const dY = Math.abs(r * cellH - sweepY);
              const sweepGlow = dY < 12 ? (1 - dY / 12) * 0.65 : 0;
              const b = Math.floor((h * 0.55 + sweepGlow) * 255);
              fillStyle = `rgb(${Math.max(10, Math.min(255, b - 20))}, ${Math.max(20, Math.min(255, b + 15))}, ${Math.max(40, Math.min(255, b + 55))})`;
              break;
            }
            case 'VIS': {
              const LF = h;
              fillStyle = `rgb(${Math.floor(20 + LF * 40)}, ${Math.floor(35 + LF * 80)}, ${Math.floor(50 + (1 - LF) * 90)})`;
              break;
            }
            case 'CHANGE': {
              const df = Math.abs(h - 0.45) * 2;
              if (df > 0.42) {
                fillStyle = `rgb(${Math.floor(df * 230 + 25)}, 10, 40)`;
              } else {
                fillStyle = `rgb(5, ${Math.floor((1 - df) * 55 + 10)}, ${Math.floor((1 - df) * 80 + 15)})`;
              }
              break;
            }
            case 'INDICATORS': {
              const group = Math.floor(h * 10);
              fillStyle = group % 2 === 0 ? '#011003' : `rgb(${Math.floor(h * 45)}, ${Math.floor(140 + h * 80)}, ${Math.floor(h * 60)})`;
              break;
            }
          }

          ctx.fillStyle = fillStyle;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);

          // Hotspots highlights
          if (sensorMode === 'IR' && h > 0.74) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw SAR emitter line
      if (sensorMode === 'SAR') {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(W, sweepY);
        ctx.stroke();
      }

      // Radar Crosshair overlays
      const rx = crosshairPos.current.x;
      const ry = crosshairPos.current.y;

      ctx.strokeStyle = isAoiLocked ? '#00ff44' : '#ff9900';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx, H);
      ctx.moveTo(0, ry); ctx.lineTo(W, ry);
      ctx.stroke();

      // Outer focus bracket
      const bSz = 22;
      ctx.strokeRect(rx - bSz / 2, ry - bSz / 2, bSz, bSz);
      ctx.beginPath();
      ctx.arc(rx, ry, bSz * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 68, 0.15)';
      ctx.stroke();

      // Label pinpoint indicators
      militaryHangarOverlay.forEach((m) => {
        const mx = m.ix * cellW + cellW / 2;
        const my = m.iy * cellH + cellH / 2;
        const dist = Math.hypot(rx - mx, ry - my);

        // Highlight structure tags when close to crosshair focus
        if (dist < 40) {
          ctx.strokeStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(mx, my, 6, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 5px "JetBrains Mono", monospace';
          ctx.fillText(m.label, mx + 8, my + 2);
        }
      });

      // Target banner metadata
      ctx.fillStyle = 'rgba(1, 4, 1, 0.9)';
      ctx.fillRect(8, 8, 200, 32);
      ctx.strokeStyle = isAoiLocked ? '#00ff44' : '#ff2244';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 200, 32);

      ctx.fillStyle = '#00ff44';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.fillText(`TARGET ZONE: ${targetCountryId || 'AOI_COORD_LOCK'}`, 14, 21);
      ctx.fillStyle = '#999999';
      ctx.font = '7px sans-serif';
      ctx.fillText(`LAT/LON: ${(45.2 + rx / 10).toFixed(4)}°N / ${(12.8 + ry / 10).toFixed(4)}°E`, 14, 32);

      // Status notifications
      if (queueStatus !== 'IDLE') {
        ctx.fillStyle = 'rgba(2, 6, 2, 0.9)';
        ctx.fillRect(W - 140, 8, 132, 22);
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(W - 140, 8, 132, 22);
        
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 7px "JetBrains Mono", monospace';
        ctx.fillText(`WARPING CONSTELLATION:`, W - 134, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${queueStatus} ${countdown !== null ? `(${countdown}s)` : 'COM_READY'}`, W - 134, 25);
      }

      // Orbital azimuth pointer
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(W - 30, H - 30, 20, 0, Math.PI * 2);
      ctx.stroke();

      const arrowRad = (tiltLimit * Math.PI) / 180;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(W - 30, H - 30);
      ctx.lineTo(W - 30 + 18 * Math.cos(arrowRad), H - 30 + 18 * Math.sin(arrowRad));
      ctx.stroke();

      ctx.fillStyle = '#888888';
      ctx.font = '5px "JetBrains Mono", monospace';
      ctx.fillText(`N_TILT: ${tiltLimit}°`, W - 52, H - 6);

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sensorMode, targetCountryId, queueStatus, countdown, isAoiLocked, slewX, slewY, tiltLimit]);

  const handleTaskSatClicked = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('ISR WORKSTATION: Slew abort. Align target territory with tactical coordinate first.', 'WARNING');
      return;
    }
    setQueueStatus('COLLECTING');
    setCountdown(3);
    useIntelligenceStore.getState().taskSatellite(SATELLITE_ASSETS[activeSatIndex].id, targetCountryId);
    pushTerminalLine(`ISR WORKSTATION: Satellite tasking committed. ${SATELLITE_ASSETS[activeSatIndex].name} performing precise orbital slew.`, 'INFO');
  };

  const handleExportIntelSnapshot = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('Export Fail: Active target dossier empty. Slew over a territory.', 'WARNING');
      return;
    }
    if (queueStatus !== 'DELIVERED') {
      pushTerminalLine('Dossier Lock: Process image queue before exporting payload archives.', 'WARNING');
      return;
    }

    // Capture intelligence creates immediate economic and resources benefit
    usePlayerStore.setState((s) => ({ cashB: s.cashB + 5 }));
    usePlayerStore.getState().syncCashToCountry();

    setInspectedTargets((prev) => [...prev, `${targetCountryId}_SAT_${Date.now().toString().substring(8)}`]);
    pushTerminalLine(`TACTICAL REPORT: Exported high-fidelity imagery files into Command Center database. Strategic intelligence bonus credited (+$5B Treasury Funding).`, 'SUCCESS' as any);
    audio.sfxRadarPing();
  };

  return (
    <div className="fixed inset-0 bg-[#020502]/98 backdrop-blur-md z-50 flex flex-col p-4 border border-[#1a5c1a]/55 select-none font-mono text-xs text-stone-200">
      
      {/* Workstation Header */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h1 className="text-sm font-black tracking-widest text-[#00ff44] uppercase">
            ISR WORKSTATION // SATELLITE POV ORBITAL RECON CONSOLE
          </h1>
        </div>
        <button
          onClick={() => { audio.sfxKeyClick(); onClose(); }}
          className="px-3 py-1 bg-red-950/45 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[10px] font-black uppercase transition-all"
        >
          ✖ COLLAPSE WORKSTATION
        </button>
      </div>

      {/* Main Core 3-Column Workstation Panel */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* Left Column: Bird configuration & specs */}
        <div className="col-span-3 flex flex-col gap-2.5 border border-[#1a5c1a]/40 p-2.5 bg-[#030603] rounded">
          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
            🛰️ CONSTELLATION SELECTION
          </h2>
          
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            {SATELLITE_ASSETS.map((sat, idx) => (
              <div
                key={sat.id}
                onClick={() => { audio.sfxKeyClick(); setActiveSatIndex(idx); }}
                className={`p-2 border transition-all cursor-pointer ${
                  activeSatIndex === idx
                    ? 'border-[#00ff44] bg-[#00ff44]/10 text-[#00ff44]'
                    : 'border-green-950 hover:border-green-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="flex justify-between font-bold text-[9.5px]">
                  <span>{sat.name}</span>
                  <span className={`${sat.health > 90 ? 'text-green-500' : 'text-amber-500'}`}>
                    HLTH: {sat.health}%
                  </span>
                </div>
                <div className="text-[7.5px] mt-1 space-y-0.5 text-gray-400">
                  <div>ORBIT PROFILE: {sat.orbitClass}</div>
                  <div>GROUND SPATIAL RESOLUTION: {sat.resolution}</div>
                  <div>THERMAL METADATA CLOUD BIAS: {sat.cloudsPct}%</div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-2 uppercase">
            ⚙️ PRECISION COV SLIDERS
          </h2>
          <div className="space-y-2 text-[8px] text-gray-400">
            <div>
              <div className="flex justify-between">
                <span>FINE SLEW OFFSET X:</span>
                <span className="text-[#00ff44]">{slewX.toFixed(2)}m</span>
              </div>
              <input
                type="range" min="-10" max="10" step="0.1" value={slewX}
                onChange={(e) => setSlewX(parseFloat(e.target.value))}
                className="w-full accent-green-600 h-1 bg-green-950 rounded-lg outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>FINE SLEW OFFSET Y:</span>
                <span className="text-[#00ff44]">{slewY.toFixed(2)}m</span>
              </div>
              <input
                type="range" min="-10" max="10" step="0.1" value={slewY}
                onChange={(e) => setSlewY(parseFloat(e.target.value))}
                className="w-full accent-green-600 h-1 bg-green-950 rounded-lg outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>REVISIT CYCLE MIN:</span>
                <span className="text-cyan-400 font-bold">{revisitCycle} Hours</span>
              </div>
              <input
                type="range" min="2" max="24" step="1" value={revisitCycle}
                onChange={(e) => setRevisitCycle(parseInt(e.target.value))}
                className="w-full accent-cyan-600 h-1 bg-green-950 rounded-lg outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>SLEW TILT CONSTRAINT:</span>
                <span className="text-orange-400 font-bold">{tiltLimit}°</span>
              </div>
              <input
                type="range" min="5" max="45" step="1" value={tiltLimit}
                onChange={(e) => setTiltLimit(parseInt(e.target.value))}
                className="w-full accent-orange-600 h-1 bg-green-950 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>

        {/* Center Column: High Res Live Canvas HUD */}
        <div className="col-span-6 flex flex-col gap-1.5 border border-[#1a5c1a]/40 p-1.5 bg-black rounded relative">
          <div className="absolute top-2.5 right-3 text-[7px] text-red-500 font-bold tracking-widest bg-black/75 p-1 border border-red-900 pointer-events-none uppercase z-10 animate-pulse">
            ● REC STATE HIGH_DEF_FEED
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={280}
              className="w-full h-full block bg-black border border-green-950"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Sensor selection matrix */}
          <div className="grid grid-cols-5 gap-1 bg-[#010401] border border-green-900/60 p-1.5">
            {(['SAR', 'IR', 'VIS', 'CHANGE', 'INDICATORS'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { audio.sfxKeyClick(); setSensorMode(m); }}
                className={`py-1 text-[8px] font-black uppercase rounded-[1px] transition-all ${
                  sensorMode === m
                    ? 'bg-[#124d12] text-[#00ff44] border border-[#00ff44]'
                    : 'bg-black text-gray-500 hover:text-white border border-transparent'
                }`}
              >
                {m === 'SAR' ? '📡 SYNTHETIC APERTURE' : m === 'IR' ? '🔥 THERMAL IR' : m === 'VIS' ? '🔎 VISIBLE SENSOR' : m === 'CHANGE' ? '⚡ CHANGE DIFFERENCE' : '📊 DIAGNOSTIC SCAN'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Workflow target selection, analytical reports */}
        <div className="col-span-3 flex flex-col gap-2 border border-[#1a5c1a]/40 p-2 bg-[#030603] rounded min-h-0 justify-between">
          
          <div className="flex flex-col gap-2 overflow-y-auto">
            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
              🛸 CRITICAL EXPORT ACTIONS
            </h2>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={handleTaskSatClicked}
                className="py-1.5 bg-green-950/40 hover:bg-green-900/60 border border-[#00ff44]/75 text-[#00ff44] hover:text-white text-[9px] font-black uppercase text-center rounded"
              >
                ▶ TASK SCANNER
              </button>
              <button
                onClick={handleExportIntelSnapshot}
                className="py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-400/75 text-cyan-400 hover:text-white text-[9px] font-black uppercase text-center rounded"
              >
                💾 EXPORT INTEL
              </button>
            </div>

            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-3 uppercase">
              📁 STRATEGIC INTELLIGENCE DOSSIER FILE
            </h2>
            <div className="text-[7.5px] text-gray-500 space-y-1 bg-black/45 p-1.5 border border-green-950 max-h-[100px] overflow-y-auto font-sans leading-relaxed">
              <div>TARGET COUNTRY: <strong className="text-white">{targetCountryId || 'AOI'}</strong></div>
              <div>COOP SEC REVISIT RECURRENCE: <strong>81 PERCENT CONFIDENCE</strong></div>
              <div>INTEL COHERENCE EXPORT RECORDS:</div>
              <ul className="list-disc pl-3 text-cyan-600 mt-1 space-y-0.5">
                {inspectedTargets.length === 0 ? (
                  <li>No active snapshots exported yet.</li>
                ) : (
                  inspectedTargets.map((tag) => <li key={tag} className="font-mono text-[7px]">{tag}</li>)
                )}
              </ul>
            </div>

            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-3 uppercase">
              📰 SYSTEM RECON LOG STREAM
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[140px] border border-green-950/50 bg-[#010401] p-1.5 rounded space-y-1.5 font-mono text-[7.5px]">
              {intelReports.slice(0, 5).map((r, i) => (
                <div key={i} className="border-b border-[#1a5c1a]/20 pb-1">
                  <span className="text-cyan-400 font-bold block">{r.title}</span>
                  <p className="text-gray-400 leading-tight mt-0.5">{r.content}</p>
                </div>
              ))}
              {intelReports.length === 0 && (
                <div className="text-gray-600 italic text-center py-2">No regional sweep scans registered. Initiate scan above.</div>
              )}
            </div>
          </div>

          <div className="border-t border-green-950/80 pt-2 text-[7px] text-gray-500 uppercase leading-normal">
            <div>ORBITAL TRACKER METADATA: CONSOLE STABLE</div>
            <div>COBALT RESIDUAL SIG FACTOR: 0.12 ArcSec</div>
          </div>
        </div>
      </div>
    </div>
  );
}
