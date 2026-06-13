import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { audio } from '../../utils/audio';

const COUNTRY_IDS = ['US', 'CN', 'RU', 'IN', 'PK', 'IL', 'IR', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW'];

type HaarpMode = 'SCATTER' | 'HEATING' | 'COMM_JAM' | 'CLOUD_SEED';

interface AtmosphereLayer {
  name: string;
  altitude: string;
  density: number;
}

const ATMOSPHERE_LAYERS: AtmosphereLayer[] = [
  { name: 'D-LAYER (IONOSPHERE)', altitude: '60-90KM', density: 0.25 },
  { name: 'E-LAYER (IONOSPHERE)', altitude: '90-150KM', density: 0.55 },
  { name: 'F1-LAYER (THERMOSPHERE)', altitude: '150-220KM', density: 0.72 },
  { name: 'F2-LAYER (THERMOSPHERE)', altitude: '220-400KM', density: 0.95 },
];

export default function HaarpRadar() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const setExpandedWorkstation = useUIStore((s) => s.setExpandedWorkstation);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [frequency, setFrequency] = useState(4.8);
  const [erpPower, setErpPower] = useState(2.5);
  const [azimuth, setAzimuth] = useState(135);
  const [elevation, setElevation] = useState(45);
  const [haarpMode, setHaarpMode] = useState<HaarpMode>('HEATING');
  const [haarpActive, setHaarpActive] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');

  useEffect(() => {
    if (targetCountryId) {
      setSelectedTarget(targetCountryId);
      const index = COUNTRY_IDS.indexOf(targetCountryId);
      if (index !== -1) {
        setAzimuth((index * 20) % 360);
      }
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
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 9;

    let sweepAngle = 0;
    let ticks = 0;

    function renderLoop() {
      ticks++;
      sweepAngle = (sweepAngle + (haarpActive ? 4.2 : 1.8)) % 360;

      const dprW = Math.round(baseW * dpr);
      const dprH = Math.round(baseH * dpr);
      const imageData = ctx!.getImageData(0, 0, dprW, dprH);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.85;
        data[i + 1] = data[i + 1] * 0.92;
        data[i + 2] = data[i + 2] * 0.87;
      }
      ctx!.putImageData(imageData, 0, 0);

      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? 'rgba(10, 4, 0, 0.22)' : 'rgba(0, 5, 1, 0.22)';
      ctx!.fill();

      ctx!.strokeStyle = haarpActive ? 'rgba(255, 120, 0, 0.5)' : 'rgba(0, 255, 68, 0.3)';
      ctx!.lineWidth = 1;
      ctx!.stroke();

      [0.25, 0.5, 0.75, 1.0].forEach((frac, idx) => {
        const layer = ATMOSPHERE_LAYERS[idx];
        ctx!.beginPath();
        ctx!.arc(cx, cy, R * frac, 0, Math.PI * 2);
        
        ctx!.strokeStyle = haarpActive
          ? `rgba(255, 140, 0, ${idx === 3 ? 0.4 : 0.16})`
          : `rgba(0, 180, 50, ${idx === 3 ? 0.35 : 0.15})`;
        ctx!.lineWidth = 0.55;
        ctx!.stroke();

        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.55)' : 'rgba(0, 180, 50, 0.55)';
        ctx!.font = '4px "JetBrains Mono", monospace';
        const labelR = R * frac - 5;
        const anglePos = -Math.PI / 4;
        ctx!.fillText(
          `${layer.name.substring(0, 8)}`,
          cx + labelR * Math.cos(anglePos),
          cy + labelR * Math.sin(anglePos)
        );
      });

      for (let angle = 0; angle < 360; angle += 45) {
        const rad = ((angle - 90) * Math.PI) / 180;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
        ctx!.strokeStyle = haarpActive ? 'rgba(255, 100, 0, 0.08)' : 'rgba(0, 120, 20, 0.08)';
        ctx!.stroke();

        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.5)' : 'rgba(0, 160, 40, 0.5)';
        ctx!.font = '5px "JetBrains Mono", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillText(`${angle}°`, cx + (R + 6.5) * Math.cos(rad), cy + (R + 6.5) * Math.sin(rad) + 2);
      }

      const beamRad = ((azimuth - 90) * Math.PI) / 180;
      const beamWidthRad = (25 * Math.PI) / 180;

      if (haarpActive) {
        ctx!.fillStyle =
          haarpMode === 'HEATING'
            ? 'rgba(255, 60, 0, 0.12)'
            : haarpMode === 'COMM_JAM'
            ? 'rgba(0, 191, 255, 0.12)'
            : haarpMode === 'CLOUD_SEED'
            ? 'rgba(128, 0, 128, 0.12)'
            : 'rgba(255, 191, 0, 0.12)';

        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R * (elevation / 90), beamRad - beamWidthRad / 2, beamRad + beamWidthRad / 2);
        ctx!.closePath();
        ctx!.fill();

        ctx!.strokeStyle =
          haarpMode === 'HEATING'
            ? '#ff3300'
            : haarpMode === 'COMM_JAM'
            ? '#00bfff'
            : haarpMode === 'CLOUD_SEED'
            ? '#da70d6'
            : '#ffbf00';

        ctx!.lineWidth = 1;
        const pulseR = R * (elevation / 90) * (0.4 + Math.sin(ticks * 0.15) * 0.15 + 0.4);
        ctx!.beginPath();
        ctx!.arc(cx, cy, Math.max(5, pulseR), beamRad - beamWidthRad / 3, beamRad + beamWidthRad / 3);
        ctx!.stroke();

        const bx = cx + R * (elevation / 90) * Math.cos(beamRad);
        const by = cy + R * (elevation / 90) * Math.sin(beamRad);
        ctx!.beginPath();
        ctx!.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx!.fillStyle = '#ffffff';
        ctx!.fill();
      }

      const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
      const scanGrad = ctx!.createLinearGradient(cx, cy, cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      scanGrad.addColorStop(0, 'rgba(0,0,0,0)');
      scanGrad.addColorStop(0.8, haarpActive ? 'rgba(255,102,0,0.2)' : 'rgba(0,180,50,0.15)');
      scanGrad.addColorStop(1, haarpActive ? '#ffb300' : '#00ff44');

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      ctx!.strokeStyle = scanGrad;
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      for (let d = 0; d < 5; d++) {
        const noiseAngle = (((d * 75) + ticks * 0.1) % 360) * Math.PI / 180;
        const noiseDist = R * (0.35 + (d * 0.1));
        const nx = cx + noiseDist * Math.cos(noiseAngle);
        const ny = cy + noiseDist * Math.sin(noiseAngle);
        ctx!.fillStyle = haarpActive ? 'rgba(255, 60, 0, 0.04)' : 'rgba(0, 255, 100, 0.04)';
        ctx!.beginPath();
        ctx!.arc(nx, ny, 12, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.beginPath();
      ctx!.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? '#ff5500' : '#00ff44';
      ctx!.fill();

      ctx!.fillStyle = haarpActive ? '#ff9900' : '#00ff44';
      ctx!.font = '6px "JetBrains Mono", monospace';
      ctx!.textAlign = 'left';
      ctx!.fillText(`AZM:${azimuth}° ELV:${elevation}° ERP:${erpPower.toFixed(2)}GW`, 4, 11);

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [haarpActive, azimuth, elevation, erpPower, haarpMode]);

  const toggleHaarp = () => {
    audio.sfxKeyClick();
    if (haarpActive) {
      setHaarpActive(false);
      pushTerminalLine('HAARP Matrix: Ionospheric emitter antennas powered down. Thermal output stabilized.', 'INFO');
    } else {
      if (!selectedTarget) {
        pushTerminalLine('HAARP Abort: Direct antenna target field blank. Align beam azimuth first.', 'WARNING');
        return;
      }
      setHaarpActive(true);
      pushTerminalLine(`HAARP Matrix: ACTIVE. Emitting high-power atmospheric warmup [Mode: ${haarpMode}] over ${selectedTarget}.`, 'WARNING');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
          HAARP CLIMATE MATRIX
        </span>
        <button
          onClick={() => { audio.playPhaseReveal(); setExpandedWorkstation('HAARP'); }}
          className="text-[7.5px] text-[#00e5ff] border border-[#00e5ff]/40 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/20 px-1 py-0.2 rounded font-black cursor-pointer uppercase transition-all"
        >
          ▲ WORKSTATION
        </button>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[100px] block border border-[#0d2e0d]"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute top-1 right-2 text-[6px] text-[#00ff44]/60 font-mono pointer-events-none">
          HF_IONOSPHERE_SCAN
        </div>
      </div>

      <div className="grid grid-cols-4 gap-0.5 text-[7px] font-mono">
        {(['SCATTER', 'HEATING', 'COMM_JAM', 'CLOUD_SEED'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { audio.sfxKeyClick(); setHaarpMode(m); }}
            className={`px-0.5 py-0.5 uppercase tracking-tighter ${
              haarpMode === m
                ? 'bg-amber-950/40 text-amber-500 border border-amber-500/50 font-bold'
                : 'bg-black text-gray-500 hover:text-white'
            }`}
          >
            {m === 'COMM_JAM' ? 'JAM' : m === 'CLOUD_SEED' ? 'SEED' : m}
          </button>
        ))}
      </div>

      <button
        onClick={toggleHaarp}
        className={`w-full py-0.5 text-center font-black text-[7.5px] uppercase rounded transition-all ${
          haarpActive
            ? 'bg-red-950/40 text-[#ff2244] border border-red-500/50 animate-pulse'
            : 'bg-green-950/30 text-[#00ff44] border border-[#00ff44]/40 hover:bg-green-900/30'
        }`}
      >
        {haarpActive ? '🔴 KINETIC CEASE EMISSION' : '⚡ INITIATE BEAM WEDGE'}
      </button>
    </div>
  );
}

// =========================================================================
// HAARP EXPANDED WORKSTATION
// =========================================================================
export function HaarpWorkstation({ onClose }: { onClose: () => void }) {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const addIntelReport = useIntelligenceStore((s) => s.addIntelReport);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // States
  const [frequency, setFrequency] = useState(5.4); // MHz
  const [erpPower, setErpPower] = useState(3.5);     // GW
  const [azimuth, setAzimuth] = useState(120);     // Degrees
  const [elevation, setElevation] = useState(60);   // Degrees
  const [haarpMode, setHaarpMode] = useState<HaarpMode>('HEATING');
  const [haarpActive, setHaarpActive] = useState(false);
  const [targetTerritory, setTargetTerritory] = useState(targetCountryId || 'US');

  // Diagnostics
  const [instabilityRisk, setInstabilityRisk] = useState(24); // %
  const [overdriveSafety, setOverdriveSafety] = useState(0);  // %
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>([]);

  useEffect(() => {
    if (targetCountryId) {
      setTargetTerritory(targetCountryId);
      const index = COUNTRY_IDS.indexOf(targetCountryId);
      if (index !== -1) {
        setAzimuth((index * 22) % 360);
      }
    }
  }, [targetCountryId]);

  // Risk parameters drift
  useEffect(() => {
    const riskInterval = setInterval(() => {
      setInstabilityRisk((prev) => {
        const factor = haarpActive ? (erpPower * 3) : 0.5;
        const delta = (Math.random() - 0.5) * 4 + factor;
        return Math.max(10, Math.min(100, Math.round(prev + delta)));
      });
      setOverdriveSafety((prev) => {
        if (haarpActive && erpPower > 4.0) {
          if (Math.random() < 0.25) audio.sfxKlaxon();
          return Math.min(100, prev + 12);
        }
        return Math.max(0, prev - 8);
      });
    }, 1500);
    return () => clearInterval(riskInterval);
  }, [haarpActive, erpPower]);

  // Medium Size Screen Radar Emitter Rendering
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
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 20;

    let sweepAngle = 0;
    let ticks = 0;

    function renderLoop() {
      ticks++;
      sweepAngle = (sweepAngle + (haarpActive ? 5.2 : 2.0)) % 360;

      // Persistence Decay
      const dprW = Math.round(baseW * dpr);
      const dprH = Math.round(baseH * dpr);
      const imageData = ctx!.getImageData(0, 0, dprW, dprH);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.84;
        data[i + 1] = data[i + 1] * 0.91;
        data[i + 2] = data[i + 2] * 0.86;
      }
      ctx!.putImageData(imageData, 0, 0);

      // Sphere base
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? 'rgba(15, 6, 0, 0.25)' : 'rgba(0, 8, 2, 0.22)';
      ctx!.fill();

      // Border outer
      ctx!.strokeStyle = haarpActive ? '#ff4800' : 'rgba(0, 255, 68, 0.35)';
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // Ionosphere layers rings
      [0.25, 0.5, 0.75, 1.0].forEach((f, idx) => {
        const layer = ATMOSPHERE_LAYERS[idx];
        ctx!.beginPath();
        ctx!.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx!.strokeStyle = haarpActive ? 'rgba(255,140,0,0.18)' : 'rgba(0,180,50,0.12)';
        ctx!.lineWidth = 0.8;
        ctx!.stroke();

        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.6)' : 'rgba(0, 180, 50, 0.6)';
        ctx!.font = '5px "JetBrains Mono", monospace';
        const labelR = R * f - 8;
        ctx!.fillText(layer.name, cx + labelR * Math.cos(-Math.PI / 3), cy + labelR * Math.sin(-Math.PI / 3));
      });

      // Azimuth spokes
      for (let d = 0; d < 360; d += 30) {
        const rad = ((d - 90) * Math.PI) / 180;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
        ctx!.strokeStyle = haarpActive ? 'rgba(255, 100, 0, 0.1)' : 'rgba(0, 120, 20, 0.08)';
        ctx!.stroke();

        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.55)' : 'rgba(0, 160, 40, 0.55)';
        ctx!.font = '6px "JetBrains Mono", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillText(`${d}°`, cx + (R + 10) * Math.cos(rad), cy + (R + 10) * Math.sin(rad) + 2);
      }

      // 1. DIRECTIONAL ENERGY BEAM WEDGE
      const beamRad = ((azimuth - 90) * Math.PI) / 180;
      const bWidth = (30 * Math.PI) / 180;

      if (haarpActive) {
        ctx!.fillStyle =
          haarpMode === 'HEATING'
            ? 'rgba(255, 50, 0, 0.14)'
            : haarpMode === 'COMM_JAM'
            ? 'rgba(0, 180, 255, 0.14)'
            : haarpMode === 'CLOUD_SEED'
            ? 'rgba(160, 10, 160, 0.14)'
            : 'rgba(255, 180, 0, 0.14)';

        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.arc(cx, cy, R * (elevation / 90), beamRad - bWidth / 2, beamRad + bWidth / 2);
        ctx!.closePath();
        ctx!.fill();

        ctx!.strokeStyle =
          haarpMode === 'HEATING'
            ? '#ff3300'
            : haarpMode === 'COMM_JAM'
            ? '#00bfff'
            : haarpMode === 'CLOUD_SEED'
            ? '#da70d6'
            : '#ffbf00';

        ctx!.lineWidth = 1.5;
        const pulseRatio = R * (elevation / 90) * (0.3 + Math.sin(ticks * 0.12) * 0.15 + 0.5);
        ctx!.beginPath();
        ctx!.arc(cx, cy, Math.max(10, pulseRatio), beamRad - bWidth / 2, beamRad + bWidth / 2);
        ctx!.stroke();

        const bx = cx + R * (elevation / 90) * Math.cos(beamRad);
        const by = cy + R * (elevation / 90) * Math.sin(beamRad);
        
        ctx!.beginPath();
        ctx!.arc(bx, by, 5, 0, Math.PI * 2);
        ctx!.fillStyle = '#ffffff';
        ctx!.fill();
      }

      // Linear sweep line
      const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
      const scanGrad = ctx!.createLinearGradient(cx, cy, cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      scanGrad.addColorStop(0, 'rgba(0,0,0,0)');
      scanGrad.addColorStop(0.8, haarpActive ? 'rgba(255,80,0,0.22)' : 'rgba(0,180,50,0.18)');
      scanGrad.addColorStop(1, haarpActive ? '#ff5500' : '#00ff44');

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      ctx!.strokeStyle = scanGrad;
      ctx!.lineWidth = 1.6;
      ctx!.stroke();

      // Atmospheric thermal blobs
      for (let d = 0; d < 6; d++) {
        const noiseAngle = (((d * 60) + ticks * 0.08) % 360) * Math.PI / 180;
        const noiseDist = R * (0.3 + (d * 0.08));
        const nx = cx + noiseDist * Math.cos(noiseAngle);
        const ny = cy + noiseDist * Math.sin(noiseAngle);
        ctx!.fillStyle = haarpActive ? 'rgba(255, 80, 0, 0.05)' : 'rgba(0, 220, 80, 0.04)';
        ctx!.beginPath();
        ctx!.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.beginPath();
      ctx!.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? '#ff2200' : '#00ff44';
      ctx!.fill();

      // Dial readout Overlay context
      ctx!.fillStyle = '#ffffff';
      ctx!.font = 'bold 8px "JetBrains Mono", monospace';
      ctx!.textAlign = 'left';
      ctx!.fillText(`HF BEAM ALIGNED // AZM ${azimuth}° ELEV ${elevation}°`, 12, H - 12);

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [haarpActive, azimuth, elevation, erpPower, haarpMode]);

  const handleLaunchEmission = () => {
    audio.sfxKeyClick();
    if (haarpActive) {
      setHaarpActive(false);
      pushTerminalLine('HAARP WORKSTATION: Terminated active HF excitation. Atmospheric layers normalizing.', 'INFO');
      return;
    }

    if (!targetTerritory) {
      pushTerminalLine('HAARP WORKSTATION: Aborted. Active target area undefined.', 'WARNING');
      return;
    }

    setHaarpActive(true);
    audio.sfxRadarPing();

    setTimeout(() => {
      useWorldStore.getState().applyTickDelta((draft) => {
        const country = draft.countries[targetTerritory];
        if (!country) return;

        if (haarpMode === 'COMM_JAM') {
          // Jams communication: decrease general military readiness indices
          country.arsenal.totalPowerRating = Math.max(10, country.arsenal.totalPowerRating - 5);
          if (country.arsenal) {
            country.arsenal.readinessLevel = Math.max(10, country.arsenal.readinessLevel - 15);
          }
          pushTerminalLine(`IONOSPHERE REPORT: RF Comm Jamming finalized over ${targetTerritory}. Ground radar jammed.`, 'SYSTEM');
        } else if (haarpMode === 'HEATING') {
          // Intense environmental heating: drops GDP, contracts stability, raises inflation
          country.economic.gdpB = Math.max(10, country.economic.gdpB - 35);
          country.economic.gdpGrowthRate = Math.max(-10, country.economic.gdpGrowthRate - 1.0);
          country.economic.inflationRate = Math.min(100, country.economic.inflationRate + 3);
          if (country.political) {
            country.political.stabilityIndex = Math.max(10, country.political.stabilityIndex - 8);
          }
          pushTerminalLine(`IONOSPHERE REPORT: Mega-heating payload triggered crop failures and grid brownouts. Stability reduced.`, 'SYSTEM');
        } else if (haarpMode === 'CLOUD_SEED') {
          // Cloud seeding: Severe storms, flooding ruins infrastructure and increases popular unrest
          country.economic.gdpGrowthRate = Math.max(-10, country.economic.gdpGrowthRate - 2.0);
          if (country.political) {
            country.political.popularUnrest = Math.min(100, country.political.popularUnrest + 18);
          }
          pushTerminalLine(`IONOSPHERE REPORT: Cyclonic rain patterns fully seeded. Catastrophic weather disaster alert emitted.`, 'SYSTEM');
        }
      });

      const entryId = `${haarpMode}_ANOMALY_${Date.now().toString().substring(8)}`;
      setActiveAnomalies((prev) => [...prev, entryId]);

      // Write intel reports
      const rTitle = `METEOROLOGICAL HEATING: ${targetTerritory}`;
      const rText = `An active HF emission project [Mode: ${haarpMode}] successfully excitation-aligned layer density over sector ${targetTerritory}. Re-calendered environmental variables completely. Ground metrics influenced.`;
      addIntelReport(rTitle, rText, 'INFO');

      useWorldStore.getState().addGlobalEvent(`CLIMATE MODIFICATION: High frequency weather transmitter HAARP active over target ${targetTerritory} [Mode: ${haarpMode}].`, 'WARNING');

    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-[#020502]/98 backdrop-blur-md z-50 flex flex-col p-4 border border-[#1a5c1a]/55 select-none font-mono text-xs text-stone-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
          <h1 className="text-sm font-black tracking-widest text-orange-400 uppercase">
            IONOSPHERE INSTRUMENTS // HAARP CLIMATE EMITTER WORKSTATION
          </h1>
        </div>
        <button
          onClick={() => { audio.sfxKeyClick(); onClose(); }}
          className="px-3 py-1 bg-red-950/45 hover:bg-red-900/60 border border-red-500/50 text-red-400 text-[10px] font-black uppercase transition-all"
        >
          ✖ COLLAPSE WORKSTATION
        </button>
      </div>

      {/* Main Core */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* Left Column: Frequency and Azimuth steering dials */}
        <div className="col-span-3 flex flex-col gap-2.5 border border-[#1a5c1a]/40 p-2.5 bg-[#030603] rounded">
          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
            📻 HF WAVE RESONANCE
          </h2>

          <div className="space-y-3.5 mt-1.5 flex-1">
            <div>
              <div className="flex justify-between text-[8px] text-gray-400">
                <span>HF WAVE FREQUENCY:</span>
                <span className="text-[#00ff44]">{frequency.toFixed(2)} MHz</span>
              </div>
              <input
                type="range" min="3.0" max="8.5" step="0.1" value={frequency}
                onChange={(e) => setFrequency(parseFloat(e.target.value))}
                className="w-full accent-green-600 h-1 bg-green-950 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[8px] text-gray-400">
                <span>ERP POWER EXCITATION:</span>
                <span className="text-[#00ff44]">{erpPower.toFixed(2)} GW</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1" value={erpPower}
                onChange={(e) => setErpPower(parseFloat(e.target.value))}
                className="w-full accent-green-600 h-1 bg-green-950 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[8px] text-gray-400">
                <span>BEAM DIRECTION STEER (AZIMUTH):</span>
                <span className="text-orange-400 font-bold">{azimuth}°</span>
              </div>
              <input
                type="range" min="0" max="360" step="5" value={azimuth}
                onChange={(e) => setAzimuth(parseInt(e.target.value))}
                className="w-full accent-orange-600 h-1 bg-green-950 rounded"
              />
            </div>

            <div>
              <div className="flex justify-between text-[8px] text-gray-400">
                <span>ATMOSPHERE ELEVATION (ANGLE):</span>
                <span className="text-orange-400 font-bold">{elevation}°</span>
              </div>
              <input
                type="range" min="10" max="90" step="5" value={elevation}
                onChange={(e) => setElevation(parseInt(e.target.value))}
                className="w-full accent-orange-600 h-1 bg-green-950 rounded"
              />
            </div>
          </div>

          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-2 uppercase">
            ⚠️ ENVIRONMENT RISKS
          </h2>
          <div className="grid grid-cols-2 gap-1.5 text-[8px] text-gray-400 mt-1">
            <div className={`p-1.5 border border-green-950 ${instabilityRisk > 50 ? 'bg-red-950/20 text-red-400' : 'bg-black/45'}`}>
              <span className="block text-gray-500">LAYER INSTABILITY</span>
              <strong className="text-[9px]">{instabilityRisk}%</strong>
            </div>
            <div className={`p-1.5 border border-green-950 ${overdriveSafety > 50 ? 'bg-red-950/25 text-red-500 animate-pulse' : 'bg-black/45'}`}>
              <span className="block text-gray-500">OVERDRIVE TEMP</span>
              <strong className="text-[9px]">{overdriveSafety}%</strong>
            </div>
          </div>
        </div>

        {/* Center Column: Radar Scope Screen */}
        <div className="col-span-6 flex flex-col gap-1.5 border border-[#1a5c1a]/40 p-1.5 bg-black rounded relative">
          <div className="absolute top-2.5 right-3 text-[7px] text-orange-400 font-bold tracking-widest bg-black/75 p-1 border border-orange-950 pointer-events-none uppercase z-10 animate-pulse">
            ● REC STATE HF_HARMONIC_DIAL
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

        {/* Right Column: Meterological Modification */}
        <div className="col-span-3 flex flex-col gap-2 border border-[#1a5c1a]/40 p-2 bg-[#030603] rounded min-h-0 justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
              ⛈️ METEOROLOGICAL DIRECTIVES
            </h2>

            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { id: 'SCATTER', name: 'ION PREIP SCATTER', desc: 'Induces high scattering. Minimizes hostile radar lock precision.' },
                { id: 'HEATING', name: 'ION THERM HEATING', desc: 'Accelerates regional temperatures, ruining agricultural GDP yields.' },
                { id: 'COMM_JAM', name: 'ION COM JAMMING', desc: 'Emits heavy radio clutter. Blocks enemy communications and readiness.' },
                { id: 'CLOUD_SEED', name: 'ION CLOUD SEEDING', desc: 'Forces heavy cyclonic rainfall, triggering flooding disasters.' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => { audio.sfxKeyClick(); setHaarpMode(m.id as any); }}
                  className={`p-1.5 border text-[7.5px] cursor-pointer transition-all ${
                    haarpMode === m.id
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-green-950 hover:border-green-800 text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <strong className="block">{m.name}</strong>
                  <span className="text-gray-400 block mt-0.5 leading-tight">{m.desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLaunchEmission}
              className={`w-full mt-2.5 py-1.5 font-bold text-[9px] uppercase rounded-[1px] cursor-pointer transition-all ${
                haarpActive
                  ? 'bg-red-950/40 text-[#ff2244] border border-red-500/60 animate-pulse'
                  : 'bg-green-950/30 text-[#00ff44] border border-[#00ff44]/70 hover:bg-green-9050'
              }`}
            >
              {haarpActive ? '🔴 KINETIC CEASE EMISSION' : '⚡ POWER UP IONOSPHERIC TRANSMITTER'}
            </button>
          </div>

          <div>
            <h2 className="text-[8px] font-bold text-gray-400 border-b border-green-950 pb-1 mb-1.5 uppercase">
              📋 ATMOSPHERE NOISE ANOMALIES
            </h2>
            <div className="text-[7px]/tight text-gray-500 space-y-1 bg-black/45 p-1 border border-green-950 max-h-[90px] overflow-y-auto font-mono">
              {activeAnomalies.length === 0 ? (
                <div className="italic text-gray-600 text-center py-1">No electromagnetic anomalies generated. Engage heater.</div>
              ) : (
                activeAnomalies.map((a) => <div key={a} className="text-orange-400">{a}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
