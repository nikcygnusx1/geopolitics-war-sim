import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';

const COUNTRY_IDS = ['US', 'CN', 'RU', 'IN', 'PK', 'IL', 'IR', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW'];

type HaarpMode = 'SCATTER' | 'HEATING' | 'COMM_JAM' | 'CLOUD_SEED';

interface AtmosphereLayer {
  name: string;
  altitude: string;
  density: number; // base factor
}

const ATMOSPHERE_LAYERS: AtmosphereLayer[] = [
  { name: 'D-LAYER (IONOSPHERE)', altitude: '60-90KM', density: 0.25 },
  { name: 'E-LAYER (IONOSPHERE)', altitude: '90-150KM', density: 0.55 },
  { name: 'F1-LAYER (THERMOSPHERE)', altitude: '150-220KM', density: 0.72 },
  { name: 'F2-LAYER (THERMOSPHERE)', altitude: '220-400KM', density: 0.95 },
];

export default function HaarpRadar() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Tunable UI Control Parameters
  const [frequency, setFrequency] = useState(4.8); // MHz
  const [erpPower, setErpPower] = useState(2.5); // Gigawatts (GW)
  const [azimuth, setAzimuth] = useState(135); // Degrees
  const [elevation, setElevation] = useState(45); // Degrees
  const [haarpMode, setHaarpMode] = useState<HaarpMode>('HEATING');
  const [haarpActive, setHaarpActive] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');

  // Auto-slew beam coordinate when standard targetCountryId updates
  useEffect(() => {
    if (targetCountryId) {
      setSelectedTarget(targetCountryId);
      // Map standard country into custom azimuth angle
      const index = COUNTRY_IDS.indexOf(targetCountryId);
      if (index !== -1) {
        setAzimuth((index * 20) % 360);
      }
    }
  }, [targetCountryId]);

  // Main canvas atmospheric sweep paint thread
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

      // Deep phosphor persistence decay in physical backing pixels
      const dprW = Math.round(baseW * dpr);
      const dprH = Math.round(baseH * dpr);
      const imageData = ctx!.getImageData(0, 0, dprW, dprH);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.85;          // red decay
        data[i + 1] = data[i + 1] * 0.92;  // green/phosphor persistence is longest
        data[i + 2] = data[i + 2] * 0.87;  // blue decay
      }
      ctx!.putImageData(imageData, 0, 0);

      // Dark atmospheric core base backplate
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? 'rgba(10, 4, 0, 0.22)' : 'rgba(0, 5, 1, 0.22)';
      ctx!.fill();

      ctx!.strokeStyle = haarpActive ? 'rgba(255, 120, 0, 0.5)' : 'rgba(0, 255, 68, 0.3)';
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Concentration rings representing Ionosphere Layers instead of plain mileage circles
      [0.25, 0.5, 0.75, 1.0].forEach((frac, idx) => {
        const layer = ATMOSPHERE_LAYERS[idx];
        ctx!.beginPath();
        ctx!.arc(cx, cy, R * frac, 0, Math.PI * 2);
        
        ctx!.strokeStyle = haarpActive
          ? `rgba(255, 140, 0, ${idx === 3 ? 0.4 : 0.16})`
          : `rgba(0, 180, 50, ${idx === 3 ? 0.35 : 0.15})`;
        ctx!.lineWidth = 0.55;
        ctx!.stroke();

        // Print Layer Labels along the ring arcs
        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.55)' : 'rgba(0, 180, 50, 0.55)';
        ctx!.font = '4.8px "JetBrains Mono", monospace';
        const labelR = R * frac - 5;
        const anglePos = -Math.PI / 4;
        ctx!.fillText(
          `${layer.name.substring(0, 8)}`,
          cx + labelR * Math.cos(anglePos),
          cy + labelR * Math.sin(anglePos)
        );
      });

      // Azimuth grid lines
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = ((angle - 90) * Math.PI) / 180;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
        ctx!.strokeStyle = haarpActive ? 'rgba(255, 100, 0, 0.08)' : 'rgba(0, 120, 20, 0.08)';
        ctx!.stroke();

        // Angle Markers
        ctx!.fillStyle = haarpActive ? 'rgba(255, 140, 0, 0.5)' : 'rgba(0, 160, 40, 0.5)';
        ctx!.font = '5.5px "JetBrains Mono", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillText(`${angle}°`, cx + (R + 6.5) * Math.cos(rad), cy + (R + 6.5) * Math.sin(rad) + 2);
      }

      // 1. ACTIVE emitter heating beam sector slice
      const beamRad = ((azimuth - 90) * Math.PI) / 180;
      const beamWidthRad = (25 * Math.PI) / 180; // beam divergence

      if (haarpActive) {
        // Draw the directional power beam wedge
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

        // Pulsate outer disturbance rings
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

        // Target locator dot
        const bx = cx + R * (elevation / 90) * Math.cos(beamRad);
        const by = cy + R * (elevation / 90) * Math.sin(beamRad);
        ctx!.beginPath();
        ctx!.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx!.fillStyle = '#ffffff';
        ctx!.shadowColor = '#ff6600';
        ctx!.shadowBlur = 10;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // 2. Linear radar sweep line
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

      // Atmospheric noise cloud rendering (simulation of density bubbles)
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

      // Center antenna reference point
      ctx!.beginPath();
      ctx!.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? '#ff5500' : '#00ff44';
      ctx!.fill();

      // Scope readout metadata
      ctx!.fillStyle = haarpActive ? '#ff9900' : '#00ff44';
      ctx!.font = '6.5px "JetBrains Mono", monospace';
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
      audio.sfxKlaxon();

      // Inflict real stability damage or infrastructure changes into target countries
      useWorldStore.getState().applyTickDelta((draft) => {
        const c = draft.countries[selectedTarget];
        if (c && c.political && c.economic) {
          c.political.stabilityIndex = Math.max(5, c.political.stabilityIndex - 14);
          if (c.economic.gdpB) {
            c.economic.gdpB = Math.max(10, c.economic.gdpB - 4);
          }
        }
      });
      useWorldStore.getState().addGlobalEvent(`CLIMATE EMISSION: HAARP focused high energy ionospheric beams over sector: ${selectedTarget}. Atmospheric stability degraded.`, 'WARNING');
    }
  };

  // Forecast consequences based on dialed parameters
  const getConsequenceReadout = () => {
    const isPowerHigh = erpPower > 3.0;
    switch (haarpMode) {
      case 'COMM_JAM':
        return {
          impact: 'HF COMMS SEVERELY DEGRADED',
          uplift: 'RADAR DISTURED: -45% COHERENCE',
          storm: 'NEGLIGIBLE TRACK PERTURBATION',
          theatre: `COMMUNICATION BLOCKED Over ${selectedTarget || 'GRID'}`,
        };
      case 'HEATING':
        return {
          impact: 'THERMAL RIPPLES INDUCED IN F2-LAYER',
          uplift: isPowerHigh ? 'RADAR REFLECTIVE EXTRA_UPLIFT' : 'RADAR COEFFICIENT FLAT',
          storm: isPowerHigh ? 'MEDIUM HURRICANE GUST PERTURB' : 'MINOR ATMOSPHERE DISPERSAL',
          theatre: `STABILITY DEPRECIATED Over ${selectedTarget || 'GRID'}`,
        };
      case 'CLOUD_SEED':
        return {
          impact: 'CYCLONIC HUMIDITY AGGREGATION',
          uplift: 'WEATHER CLUTTER ON MIL-RADAR',
          storm: 'HIGH STORM TRAJECTORY RISK',
          theatre: `FLOOD WARNING POSTURE Over ${selectedTarget || 'GRID'}`,
        };
      case 'SCATTER':
        return {
          impact: 'SUB-AURAL BACKSCATTER COMPLETED',
          uplift: 'RADAR SURVEILLANCE AMPLIFIED BY +30%',
          storm: 'NONE',
          theatre: `INTELLIGENCE GATHER AMPLIFIED Over ${selectedTarget || 'GRID'}`,
        };
    }
  };

  const consequences = getConsequenceReadout();

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      {/* Scope Header */}
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] p-1 border border-[#1a5c1a]/30">
        <span className="flex items-center gap-1 font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${haarpActive ? 'bg-orange-500 animate-pulse' : 'bg-[#00d5ff]'}`} />
          HAARP CLIMATE EMITTER
        </span>
        <span style={{ color: haarpActive ? '#ff8c00' : '#00e5ff' }}>
          {haarpActive ? '◉ EMITTING WAVE' : '◯ STANDBY'}
        </span>
      </div>

      {/* Atmospheric parameter control dials */}
      <div className="grid grid-cols-2 gap-1.5 bg-black/45 p-1 border border-[#1a5c1a]/15 text-[7px] font-mono">
        {/* Left Dial controls */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-gray-500">FREQ (BAND):</span>
            <span className="text-[#00ff44] font-bold">{frequency.toFixed(1)} MHz</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="8.5"
            step="0.1"
            value={frequency}
            onChange={(e) => { audio.sfxKeyClick(); setFrequency(parseFloat(e.target.value)); }}
            className="w-full accent-green-600 h-1 bg-green-950 rounded-lg outline-none cursor-pointer"
          />

          <div className="flex justify-between">
            <span className="text-gray-500">ERP (POWER):</span>
            <span className="text-orange-500 font-black">{erpPower.toFixed(2)} GW</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.05"
            value={erpPower}
            onChange={(e) => { audio.sfxKeyClick(); setErpPower(parseFloat(e.target.value)); }}
            className="w-full accent-orange-600 h-1 bg-green-950 rounded-lg outline-none cursor-pointer"
          />
        </div>

        {/* Right Dial coordinates */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-gray-500">BEAM AZM:</span>
            <span className="text-[#00e5ff] font-bold">{azimuth}° N</span>
          </div>
          <input
            type="range"
            min="0"
            max="359"
            step="1"
            value={azimuth}
            onChange={(e) => { audio.sfxKeyClick(); setAzimuth(parseInt(e.target.value)); }}
            className="w-full accent-cyan-600 h-1 bg-green-950 rounded-lg outline-none cursor-pointer"
          />

          <div className="flex justify-between">
            <span className="text-gray-500">BEAM ELV:</span>
            <span className="text-white font-bold">{elevation}° TILT</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={elevation}
            onChange={(e) => { audio.sfxKeyClick(); setElevation(parseInt(e.target.value)); }}
            className="w-full accent-white h-1 bg-green-950 rounded-lg outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Primary Atmospheric diagnostic scope viewport */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[110px] block border border-[#0d2e0d]"
          style={{ background: '#020402' }}
        />
        <div className="absolute bottom-1 right-2 text-[5.5px] text-gray-500 font-mono">
          IONOSPHERIC_HEATING_CALIBRATION
        </div>
      </div>

      {/* Fictional operating modes selector */}
      <div className="flex gap-1 justify-between bg-[#010401] p-0.5 border border-[#1a5c1a]/30">
        {(['SCATTER', 'HEATING', 'COMM_JAM', 'CLOUD_SEED'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { audio.sfxKeyClick(); setHaarpMode(m); }}
            className={`px-0.5 py-0.5 text-[6.5px] font-black uppercase rounded-[1px] ${
              haarpMode === m
                ? 'bg-orange-950/40 text-orange-400 border border-orange-500/50'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Real-time Atmospheric forecasting output */}
      <div className="bg-[#050a05] p-1 border border-[#1a5c1a]/30 rounded-[1px] text-[6.5px] font-mono text-gray-400 flex flex-col gap-0.5">
        <div>📡 COMMS IMPACT: <span className="text-white font-bold">{consequences.impact}</span></div>
        <div>🔍 RADAR INDEX: <span className="text-[#00e5ff] font-bold">{consequences.uplift}</span></div>
        <div>⛈️ STORM RISK: <span className="text-amber-500 font-bold">{consequences.storm}</span></div>
        <div className="text-orange-400 font-bold">📍 TARGET MET: {consequences.theatre}</div>
      </div>

      {/* Target Slew beam alignment select dropdown and force button */}
      <div className="flex gap-1 mt-0.5 font-mono text-[8px]">
        <select
          value={selectedTarget}
          onChange={(e) => {
            audio.sfxKeyClick();
            const val = e.target.value;
            setSelectedTarget(val);
            if (val) {
              const index = COUNTRY_IDS.indexOf(val);
              setAzimuth((index * 20) % 360);
              pushTerminalLine(`HAARP: Slewed beam coordinates to align on bearing for country zone: ${val}.`, 'INFO');
            }
          }}
          className="feed-select rounded bg-[#030603] border border-[#1a5c1a] text-gray-300 px-1 text-[7.5px]"
          style={{ width: '65%' }}
        >
          <option value="">-- ALIGN BEAM --</option>
          {COUNTRY_IDS.map((id) => (
            <option key={id} value={id}>
              ALIGN ZONE: {id}
            </option>
          ))}
        </select>
        <button
          onClick={toggleHaarp}
          className={`feed-btn px-1 py-1 rounded flex-1 text-center font-bold ${
            haarpActive ? 'active text-orange-500 border-orange-500/40 bg-orange-950/20' : 'text-gray-400 hover:text-white'
          }`}
          title="Fires climate emitter ionospheric disruption waves"
        >
          {haarpActive ? '🔴 CEASE' : '🔥 FORCE EMIT'}
        </button>
      </div>
    </div>
  );
}
