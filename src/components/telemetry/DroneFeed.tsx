import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { audio } from '../../utils/audio';

type MultispectralMode = 'EO' | 'IR' | 'SWIR' | 'MULTI' | 'INDEX';

export default function DroneFeed() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const setExpandedWorkstation = useUIStore((s) => s.setExpandedWorkstation);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Operational States
  const [droneArmed, setDroneArmed] = useState(false);
  const [isLoitering, setIsLoitering] = useState(true);
  const [spectralMode, setSpectralMode] = useState<MultispectralMode>('IR');
  const [pendingStrike, setPendingStrike] = useState(false);

  // Real Flight-Control telemetry state
  const state = useRef({
    altitude: 4850,
    airspeed: 135,
    heading: 182,
    pitch: 0,
    roll: 0,
    lockBlink: true,
    terrains: Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * 192,
      scale: (i + 1) * 0.45,
      height: 10 + Math.random() * 32,
      dots: Array.from({ length: 4 }, () => ({
        dx: Math.random() * 40,
        dy: Math.random() * 12,
      })),
    })),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      state.current.lockBlink = !state.current.lockBlink;
    }, 400);
    return () => clearInterval(interval);
  }, []);

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

    function renderLoop() {
      const s = state.current;
      ctx.clearRect(0, 0, W, H);

      let bgStyle = '#020502';
      let edgeColor = 'rgba(0, 255, 68, 0.4)';
      let contrastGlow = false;

      switch (spectralMode) {
        case 'EO':
          bgStyle = '#0a1209';
          edgeColor = 'rgba(0, 230, 80, 0.55)';
          break;
        case 'IR':
          bgStyle = '#030503';
          edgeColor = 'rgba(255, 255, 255, 0.5)';
          break;
        case 'SWIR':
          bgStyle = '#0f0502';
          edgeColor = 'rgba(255, 120, 0, 0.6)';
          break;
        case 'MULTI':
          bgStyle = '#021015';
          edgeColor = 'rgba(0, 240, 255, 0.7)';
          contrastGlow = true;
          break;
        case 'INDEX':
          bgStyle = '#000000';
          edgeColor = 'rgba(255, 191, 0, 0.65)';
          break;
      }

      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, W, H);

      const terrainMovementMultiplier = isLoitering ? 0.15 : 0.95;
      s.terrains.forEach((layer, li) => {
        layer.x -= layer.scale * terrainMovementMultiplier;
        if (layer.x < -60) {
          layer.x = W + Math.random() * 30;
        }

        ctx.fillStyle =
          spectralMode === 'EO'
            ? `rgba(18, 48, 20, ${0.1 * li + 0.15})`
            : spectralMode === 'IR'
            ? `rgba(45, 45, 45, ${0.12 * li + 0.1})`
            : spectralMode === 'SWIR'
            ? `rgba(90, 40, 10, ${0.08 * li + 0.1})`
            : spectralMode === 'MULTI'
            ? `rgba(5, 52, 65, ${0.1 * li + 0.2})`
            : `rgba(25, 40, 12, ${0.1 * li + 0.15})`;

        ctx.beginPath();
        ctx.moveTo(layer.x, H - 20);
        ctx.lineTo(layer.x + 15, H - 20 - layer.height);
        ctx.lineTo(layer.x + 45, H - 20 - layer.height * 0.6);
        ctx.lineTo(layer.x + 60, H - 20);
        ctx.closePath();
        ctx.fill();

        layer.dots.forEach((dot) => {
          const dotX = layer.x + dot.dx;
          const dotY = H - 20 - layer.height * 0.4 + dot.dy;
          if (dotX > 0 && dotX < W) {
            ctx.fillStyle =
              spectralMode === 'IR'
                ? 'rgba(255, 255, 255, 0.8)'
                : spectralMode === 'SWIR'
                ? 'rgba(255, 140, 0, 0.9)'
                : spectralMode === 'MULTI'
                ? '#00ffff'
                : 'rgba(0, 255, 68, 0.7)';
            ctx.fillRect(dotX, dotY, 2, 2);
          }
        });
      });

      s.pitch = Math.sin(Date.now() / 2500) * 4;
      s.roll = Math.cos(Date.now() / 3200) * (isLoitering ? 4 : 1.2);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((s.roll * Math.PI) / 180);

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);

      const pY = s.pitch * 3.5;
      ctx.beginPath();
      ctx.moveTo(-25, pY - 15); ctx.lineTo(25, pY - 15);
      ctx.moveTo(-15, pY + 15); ctx.lineTo(15, pY + 15);
      ctx.stroke();

      ctx.fillStyle = edgeColor;
      ctx.font = '5px "JetBrains Mono", monospace';
      ctx.fillText('+10', 28, pY - 13);
      ctx.fillText('-10', 18, pY + 17);

      ctx.restore();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#00ff44';
      if (contrastGlow) ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.2;

      const cx = W / 2;
      const cy = H / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 5, cy);
      ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 16);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.stroke();

      if (targetCountryId) {
        const lockX = cx + Math.sin(Date.now() / 1500) * 6;
        const lockY = cy + 10 + Math.cos(Date.now() / 1200) * 4;
        const lockSize = 16 + Math.sin(Date.now() / 300) * 1;

        ctx.strokeStyle = droneArmed ? '#ff2244' : '#ffb300';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(lockX - lockSize / 2, lockY - lockSize / 2, lockSize, lockSize);

        if (s.lockBlink) {
          ctx.beginPath();
          ctx.arc(lockX, lockY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = droneArmed ? '#ff2244' : '#ffb300';
          ctx.fill();

          ctx.font = 'bold 6.5px "JetBrains Mono", monospace';
          ctx.fillText(`◆ TGT_${targetCountryId}`, lockX + lockSize / 2 + 3, lockY + 2);
        }
      }

      ctx.fillStyle = 'rgba(2, 6, 2, 0.7)';
      ctx.fillRect(4, cy - 35, 20, 70);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(4, cy - 35, 20, 70);

      const spd = s.airspeed;
      for (let i = -2; i <= 2; i++) {
        const roundedSpd = Math.round(spd / 10) * 10 + i * 10;
        const yCoord = cy + i * -13;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.45)';
        ctx.fillText(String(roundedSpd), 6, yCoord + 2.5);
      }
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('IAS', 5, cy - 38);

      ctx.fillStyle = 'rgba(2, 6, 2, 0.7)';
      ctx.fillRect(W - 24, cy - 35, 20, 70);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(W - 24, cy - 35, 20, 70);

      const alt = s.altitude;
      for (let i = -2; i <= 2; i++) {
        const roundedAlt = Math.round(alt / 100) * 100 + i * 100;
        const yCoord = cy + i * -13;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.45)';
        ctx.fillText(String(roundedAlt), W - 22, yCoord + 2.5);
      }
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 5px sans-serif';
      ctx.fillText('BARO', W - 24, cy - 38);

      ctx.fillStyle = 'rgba(2, 6, 2, 0.7)';
      ctx.fillRect(cx - 45, 4, 90, 11);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(cx - 45, 4, 90, 11);

      const hdg = s.heading;
      for (let i = -3; i <= 3; i++) {
        const tickHdg = (Math.round(hdg / 10) * 10 + i * 10 + 360) % 360;
        const xCoord = cx + i * 12;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.45)';
        ctx.fillText(String(tickHdg), xCoord - 4, 12);
        if (i === 0) {
          ctx.fillStyle = '#00ff44';
          ctx.fillRect(xCoord - 0.5, 12, 1, 2.5);
        }
      }

      s.airspeed += (Math.random() - 0.5) * 0.4;
      s.altitude += (Math.random() - 0.5) * 0.8;
      s.heading = (s.heading + (isLoitering ? 0.05 : 0.35)) % 360;

      ctx.fillStyle = '#ffb300';
      ctx.font = '5.5px "JetBrains Mono", monospace';
      ctx.fillText(`POSTURE: ${isLoitering ? 'LOITER_HOLD [STABLE]' : 'COMBAT_STEER [HOT]'}`, 4, H - 24);

      if (droneArmed) {
        ctx.fillStyle = '#ff2244';
        ctx.fillText('⚡ PAYLOAD ARMED - STRIKE AUTHORIZED', 4, H - 17);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 68, 0.5)';
        ctx.fillText('SYSTEM OK - COLD DISCIPLINE ACTIVE', 4, H - 17);
      }

      ctx.fillStyle = 'rgba(2, 5, 2, 0.88)';
      ctx.fillRect(0, H - 12, W, 12);
      ctx.fillStyle = droneArmed ? '#ff2244' : '#00ff44';
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.fillText(
        `WPN:${droneArmed ? 'ARMED' : 'SAFE'}  MODE:${spectralMode}  ALT:${alt.toFixed(0)}m  SPD:${spd.toFixed(0)}kts`,
        4,
        H - 4
      );

      if (pendingStrike && Math.random() < 0.15) {
        ctx.fillStyle = 'rgba(255, 34, 68, 0.3)';
        ctx.fillRect(0, Math.random() * H, W, 1.5);
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spectralMode, isLoitering, droneArmed, targetCountryId, pendingStrike]);

  const toggleArmed = () => {
    audio.sfxKeyClick();
    setDroneArmed(!droneArmed);
    pushTerminalLine(`TAC DRONE: Safety locks ${!droneArmed ? 'RELEASED' : 'RESTORED'}. Weapons module is ${!droneArmed ? 'ARMED / HOT' : 'SAFE'}.`, !droneArmed ? 'WARNING' : 'INFO');
  };

  const toggleLoiter = () => {
    audio.sfxKeyClick();
    setIsLoitering(!isLoitering);
    pushTerminalLine(`TAC DRONE: Flight pattern changed. Mode calibrated to: ${!isLoitering ? 'LOITER HOLD' : 'COMBAT TRANSIT VECTOR'}.`, 'INFO');
  };

  const handleFireStrike = () => {
    if (!droneArmed) {
      pushTerminalLine('Strike Aborted: Master safety lock active. Secure weapon switch first.', 'WARNING');
      return;
    }
    if (!playerCountryId || !targetCountryId) {
      pushTerminalLine('Strike Fail: Target coordinate trace unsuccessful. Establish focal territory first.', 'WARNING');
      return;
    }

    setPendingStrike(true);
    audio.sfxKlaxon();

    const scGeo = GEO_COORDS[playerCountryId];
    const tgGeo = GEO_COORDS[targetCountryId];
    const sx = scGeo ? scGeo.cx : 500;
    const sy = scGeo ? scGeo.cy : 250;
    const tx = tgGeo ? tgGeo.cx : 400;
    const ty = tgGeo ? tgGeo.cy : 200;

    const currentTick = useWorldStore.getState().currentTick;
    const tickDist = 12;

    useWorldStore.getState().applyTickDelta((draft) => {
      draft.activeStrikes.push({
        id: `strike_${Math.random().toString().substring(2, 8)}`,
        sourceCountryId: playerCountryId,
        targetCountryId: targetCountryId,
        weaponType: 'DRONE_AIRSTRIKE' as any,
        progressPct: 0,
        status: 'IN_FLIGHT',
        bezier: {
          startX: sx,
          startY: sy,
          controlX: (sx + tx) / 2,
          controlY: Math.min(sy, ty) - 120,
          endX: tx,
          endY: ty,
        },
        launchTick: currentTick,
        impactTick: currentTick + tickDist,
        isRetaliatory: false,
        interceptAttempted: false,
      });
    });

    useWorldStore.getState().addGlobalEvent(`DRONE ATTACK: Tactical drone launched laser-guided payload into locked zone: ${targetCountryId}`, 'CRITICAL');
    pushTerminalLine(`SENTINEL COMP: Payload deployed. Active trajectory locks verified coordinates for ${targetCountryId}. Impact in T-12.`, 'CRITICAL');

    setTimeout(() => {
      setPendingStrike(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between select-none">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] border border-[#1a5c1a]/30 p-1">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${droneArmed ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          TAC DRONE FEED
        </span>
        <button
          onClick={() => { audio.playPhaseReveal(); setExpandedWorkstation('DRONE'); }}
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
          style={{ background: '#020502' }}
        />
        <div className="absolute top-1 left-2 text-[6.5px] tracking-wider text-green-500/60 font-mono pointer-events-none">
          UAV_REC_ACTIVE_STEALTH
        </div>
        <div className="absolute bottom-1 right-2 text-[6.5px] text-[#ffb300]/60 font-mono pointer-events-none">
          LOCK_C_AOA: {isLoitering ? '3.5' : '1.1'}°
        </div>
      </div>

      <div className="flex gap-1 mt-1 font-mono text-[9px]">
        <button
          onClick={toggleArmed}
          className={`feed-btn px-1 py-0.5 rounded flex-1 text-center font-bold transition-all uppercase ${
            droneArmed ? 'bg-red-950/45 text-[#ff2244] border-red-500/40 text-[7px]' : 'text-gray-400 hover:text-white text-[7px]'
          }`}
        >
          {droneArmed ? 'DISARM' : 'ARM'}
        </button>

        <button
          onClick={handleFireStrike}
          disabled={!droneArmed || !targetCountryId || pendingStrike}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center font-black text-[#ff2244] disabled:opacity-20 text-[7px] transition-all uppercase"
        >
          {pendingStrike ? 'FIRING...' : 'LAUNCH'}
        </button>

        <button
          onClick={toggleLoiter}
          className={`feed-btn px-1 py-0.5 rounded flex-1 text-center font-bold text-[7px] transition-all uppercase ${
            isLoitering ? 'text-[#00e5ff] border-[#00e5ff]/40 bg-[#00e5ff]/5' : 'text-gray-400 hover:text-white'
          }`}
        >
          {isLoitering ? 'LOITER ◆' : 'VECTOR'}
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// TAC DRONE EXPANDED WORKSTATION
// =========================================================================
export function DroneWorkstation({ onClose }: { onClose: () => void }) {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  const addIntelReport = useIntelligenceStore((s) => s.addIntelReport);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Expanded Workstation States
  const [droneArmed, setDroneArmed] = useState(false);
  const [flightPosture, setFlightPosture] = useState<'LOITER_STABLE' | 'COMBAT_VECTOR' | 'DEEP_STEALTH'>('LOITER_STABLE');
  const [spectralMode, setSpectralMode] = useState<MultispectralMode>('IR');
  const [ordnanceSelected, setOrdnanceSelected] = useState<'GBU-39' | 'GBU-12' | 'CYBER_INTRUDER' | 'EMP_GRAVITY'>('GBU-39');
  const [flightAlt, setFlightAlt] = useState(5200);   // meters
  const [flightSpd, setFlightSpd] = useState(145);    // knots
  const [lockConfidence, setLockConfidence] = useState(85); // 0-100%
  const [launchedBursts, setLaunchedBursts] = useState<string[]>([]);
  const [pendingStrike, setPendingStrike] = useState(false);

  // Drone diagnostics
  const [fuelGauge, setFuelGauge] = useState(78);
  const [commLinkStrength, setCommLinkStrength] = useState(94);
  const [droneHealth] = useState(98);

  const state = useRef({
    heading: 210,
    pitch: 0,
    roll: 0,
    lockBlink: true,
    terrains: Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * 400,
      scale: (i + 1) * 0.4,
      height: 20 + Math.random() * 45,
      dots: Array.from({ length: 6 }, () => ({
        dx: Math.random() * 80,
        dy: Math.random() * 20,
      })),
    })),
  });

  // Lock status variations
  useEffect(() => {
    const lockTimer = setInterval(() => {
      setLockConfidence((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(60, Math.min(100, Math.round(prev + delta)));
      });
      setFuelGauge((prev) => Math.max(0, prev - 1));
      setCommLinkStrength((prev) => {
        const delta = (Math.random() - 0.5) * 3;
        return Math.max(70, Math.min(100, Math.round(prev + delta)));
      });
      state.current.lockBlink = !state.current.lockBlink;
    }, 1500);
    return () => clearInterval(lockTimer);
  }, []);

  // Full-screen rendering
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

    function renderLoop() {
      const s = state.current;
      ctx.clearRect(0, 0, W, H);

      let bgStyle = '#020502';
      let edgeColor = 'rgba(0, 255, 68, 0.4)';
      let contrastGlow = false;

      switch (spectralMode) {
        case 'EO':
          bgStyle = '#091007';
          edgeColor = 'rgba(0, 240, 90, 0.6)';
          break;
        case 'IR':
          bgStyle = '#040604';
          edgeColor = 'rgba(255, 255, 255, 0.45)';
          break;
        case 'SWIR':
          bgStyle = '#120703';
          edgeColor = 'rgba(255, 130, 0, 0.55)';
          break;
        case 'MULTI':
          bgStyle = '#031218';
          edgeColor = 'rgba(0, 242, 254, 0.65)';
          contrastGlow = true;
          break;
        case 'INDEX':
          bgStyle = '#000000';
          edgeColor = 'rgba(255, 185, 0, 0.6)';
          break;
      }

      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, W, H);

      // Parallax scroll
      const moveCoeff = flightPosture === 'LOITER_STABLE' ? 0.2 : flightPosture === 'COMBAT_VECTOR' ? 1.0 : 0.08;
      s.terrains.forEach((layer, li) => {
        layer.x -= layer.scale * moveCoeff;
        if (layer.x < -100) {
          layer.x = W + Math.random() * 50;
        }

        ctx.fillStyle =
          spectralMode === 'EO'
            ? `rgba(15, 45, 18, ${0.08 * li + 0.15})`
            : spectralMode === 'IR'
            ? `rgba(40, 40, 40, ${0.1 * li + 0.12})`
            : spectralMode === 'SWIR'
            ? `rgba(80, 40, 15, ${0.07 * li + 0.1})`
            : spectralMode === 'MULTI'
            ? `rgba(5, 48, 62, ${0.1 * li + 0.18})`
            : `rgba(20, 36, 10, ${0.09 * li + 0.12})`;

        ctx.beginPath();
        ctx.moveTo(layer.x, H - 40);
        ctx.lineTo(layer.x + 35, H - 40 - layer.height);
        ctx.lineTo(layer.x + 95, H - 40 - layer.height * 0.5);
        ctx.lineTo(layer.x + 140, H - 40);
        ctx.closePath();
        ctx.fill();

        layer.dots.forEach((dot) => {
          const dx = layer.x + dot.dx;
          const dy = H - 40 - layer.height * 0.3 + dot.dy;
          if (dx > 0 && dx < W) {
            ctx.fillStyle =
              spectralMode === 'IR'
                ? 'rgba(255, 255, 255, 0.95)'
                : spectralMode === 'SWIR'
                ? 'rgba(255, 150, 10, 0.9)'
                : spectralMode === 'MULTI'
                ? '#00ffff'
                : 'rgba(50, 255, 100, 0.8)';
            ctx.fillRect(dx, dy, 2.5, 2.5);
          }
        });
      });

      // Air pitch & roll
      s.pitch = Math.sin(Date.now() / 2000) * 5;
      s.roll = Math.cos(Date.now() / 2400) * (flightPosture === 'LOITER_STABLE' ? 5 : 10);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((s.roll * Math.PI) / 180);

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 5]);

      const pY = s.pitch * 4.2;
      ctx.beginPath();
      ctx.moveTo(-50, pY - 30); ctx.lineTo(50, pY - 30);
      ctx.moveTo(-35, pY + 30); ctx.lineTo(35, pY + 30);
      ctx.stroke();

      ctx.fillStyle = edgeColor;
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillText('+20 PITCH_DEG', 55, pY - 27);
      ctx.fillText('-20 PITCH_DEG', 40, pY + 33);

      ctx.restore();
      ctx.setLineDash([]);

      // Flight Vector center ring
      ctx.strokeStyle = contrastGlow ? '#00e5ff' : '#00ff44';
      ctx.lineWidth = 1.5;
      const cx = W / 2;
      const cy = H / 2;

      ctx.beginPath();
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 8, cy);
      ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 8);
      ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Lock status indicators
      if (targetCountryId) {
        const lx = cx + Math.sin(Date.now() / 1200) * 12;
        const ly = cy + 20 + Math.cos(Date.now() / 1000) * 8;
        const lSz = 34 + Math.sin(Date.now() / 250) * 2;

        ctx.strokeStyle = droneArmed ? '#ff1122' : '#ffaa00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx - lSz / 2, ly - lSz / 2, lSz, lSz);

        if (s.lockBlink) {
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillStyle = droneArmed ? '#ff1122' : '#ffaa00';
          ctx.fillText(`LASER_LOCK_CONFIRMED // ◆ TGT_${targetCountryId}`, lx - 44, ly - lSz / 2 - 6);
          ctx.fillText(`CONF: ${lockConfidence}%`, lx - 18, ly + lSz / 2 + 10);
        }
      }

      // Left velocity tape
      ctx.fillStyle = 'rgba(2, 5, 2, 0.85)';
      ctx.fillRect(10, cy - 60, 24, 120);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(10, cy - 60, 24, 120);

      for (let i = -3; i <= 3; i++) {
        const tickSpd = Math.round(flightSpd / 10) * 10 + i * 10;
        const yCoord = cy + i * -16;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0,250,50,0.45)';
        ctx.font = '7px sans-serif';
        ctx.fillText(`${tickSpd}`, 14, yCoord + 3.5);
      }
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 6px "JetBrains Mono", monospace';
      ctx.fillText('SPD', 14, cy - 64);

      // Right altitude tape
      ctx.fillStyle = 'rgba(2, 5, 2, 0.85)';
      ctx.fillRect(W - 34, cy - 60, 24, 120);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(W - 34, cy - 60, 24, 120);

      for (let i = -3; i <= 3; i++) {
        const tickAlt = Math.round(flightAlt / 100) * 100 + i * 100;
        const yCoord = cy + i * -16;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0,250,50,0.45)';
        ctx.fillText(`${tickAlt}`, W - 30, yCoord + 3.5);
      }
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 6px "JetBrains Mono", monospace';
      ctx.fillText('ALT', W - 32, cy - 64);

      // Top heading scale
      ctx.fillStyle = 'rgba(2, 5, 2, 0.85)';
      ctx.fillRect(cx - 80, 8, 160, 14);
      ctx.strokeStyle = edgeColor;
      ctx.strokeRect(cx - 80, 8, 160, 14);

      const hdg = s.heading;
      for (let i = -5; i <= 5; i++) {
        const tickHdg = (Math.round(hdg / 10) * 10 + i * 10 + 360) % 360;
        const xCoord = cx + i * 15;
        ctx.fillStyle = i === 0 ? '#00ff44' : 'rgba(0,240,40,0.45)';
        ctx.fillText(`${tickHdg}`, xCoord - 6, 17);
        if (i === 0) {
          ctx.fillStyle = '#00ff44';
          ctx.fillRect(xCoord - 0.5, 18, 1.2, 4);
        }
      }

      s.heading = (hdg + (flightPosture === 'COMBAT_VECTOR' ? 0.4 : 0.08)) % 360;

      // Fuel, comm diagnostics bar
      ctx.fillStyle = 'rgba(1, 4, 1, 0.85)';
      ctx.fillRect(10, H - 36, 160, 24);
      ctx.strokeStyle = '#1a5c1a';
      ctx.strokeRect(10, H - 36, 160, 24);

      ctx.fillStyle = '#888888';
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.fillText(`FUEL PROFILE: ${fuelGauge}%`, 16, H - 26);
      ctx.fillText(`SIG LINK STR: ${commLinkStrength}%`, 16, H - 18);

      ctx.fillStyle = droneArmed ? '#ff2244' : '#00e5ff';
      ctx.fillText(`POSTURE: ${flightPosture}`, 104, H - 26);
      ctx.fillText(`ORDNANCE: ${ordnanceSelected}`, 104, H - 18);

      if (pendingStrike && Math.random() < 0.2) {
        ctx.fillStyle = 'rgba(255, 10, 40, 0.5)';
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spectralMode, flightPosture, droneArmed, targetCountryId, ordnanceSelected, flightAlt, flightSpd, lockConfidence, fuelGauge, commLinkStrength, pendingStrike]);

  const handleLaunchWeapon = () => {
    if (!droneArmed) {
      pushTerminalLine('Strike Canceled: Master safety switch locked.', 'WARNING');
      return;
    }
    if (!playerCountryId || !targetCountryId) {
      pushTerminalLine('Strike Abandoned: Ensure target sector lock established.', 'WARNING');
      return;
    }

    setPendingStrike(true);
    audio.sfxKlaxon();

    const scGeo = GEO_COORDS[playerCountryId];
    const tgGeo = GEO_COORDS[targetCountryId];
    const sx = scGeo ? scGeo.cx : 500;
    const sy = scGeo ? scGeo.cy : 250;
    const tx = tgGeo ? tgGeo.cx : 400;
    const ty = tgGeo ? tgGeo.cy : 200;

    const currentTick = useWorldStore.getState().currentTick;
    const duration = 12;

    // Allocate ballistic strike
    useWorldStore.getState().applyTickDelta((draft) => {
      draft.activeStrikes.push({
        id: `drone_${Math.random().toString().substring(2, 8)}`,
        sourceCountryId: playerCountryId,
        targetCountryId: targetCountryId,
        weaponType: 'DRONE_SWARM',
        progressPct: 0,
        status: 'IN_FLIGHT',
        bezier: {
          startX: sx,
          startY: sy,
          controlX: (sx + tx) / 2,
          controlY: Math.min(sy, ty) - 150,
          endX: tx,
          endY: ty,
        },
        launchTick: currentTick,
        impactTick: currentTick + duration,
        isRetaliatory: false,
        interceptAttempted: false,
      });

      // Downstream consequence: decrease targets military readiness & capability and increase resting inflation
      const enemy = draft.countries[targetCountryId];
      if (enemy) {
        enemy.arsenal.totalPowerRating = Math.max(10, enemy.arsenal.totalPowerRating - 8);
        enemy.economic.inflationRate = Math.min(100, enemy.economic.inflationRate + 3);
        if (enemy.political) {
          enemy.political.popularUnrest = Math.min(100, enemy.political.popularUnrest + 12);
        }
      }
    });

    const impactId = `${ordnanceSelected}_BURST_${Date.now().toString().substring(8)}`;
    setLaunchedBursts((prev) => [...prev, impactId]);

    // Add analytical reporting log
    const repTitle = `UAV DEPLOYMENT LOG: TGT ${targetCountryId}`;
    const repText = `A tactical UAV kinetic run was executed successfully. Kinetic payload ${ordnanceSelected} deployed successfully with laserlock feedback confidence ${lockConfidence}%. Targeted industrial defenses dismantled. Escalation trigger emitted immediately.`;
    addIntelReport(repTitle, repText, 'WARNING');

    pushTerminalLine(`UAV WORKSTATION: Released ${ordnanceSelected} projectile. Telemetry locks established. Impact coordinates confirmed.`, 'CRITICAL');
    useWorldStore.getState().addGlobalEvent(`KINETIC STRIKE: Aerial drone deployed tactical explosive swarm payload into ${targetCountryId}.`, 'CRITICAL');

    setTimeout(() => {
      setPendingStrike(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-[#020502]/98 backdrop-blur-md z-50 flex flex-col p-4 border border-[#1a5c1a]/55 select-none font-mono text-xs text-stone-200">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <h1 className="text-sm font-black tracking-widest text-[#ff2244] uppercase">
            TAC DRONE WORKSTATION // UAV MULTISPECTRAL WEAPONS PLATFORM
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
        
        {/* Left Column: UAV flight dashboard control */}
        <div className="col-span-3 flex flex-col gap-2.5 border border-[#1a5c1a]/40 p-2.5 bg-[#030603] rounded">
          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
            📡 FLIGHT CONFIGURATION
          </h2>

          {/* Posture matrices */}
          <div className="space-y-1.5 mt-1">
            <label className="text-[8px] text-gray-400 uppercase font-bold">FLIGHT POSTURE SELECTOR:</label>
            <div className="grid grid-cols-3 gap-1">
              {(['LOITER_STABLE', 'COMBAT_VECTOR', 'DEEP_STEALTH'] as const).map((posture) => (
                <button
                  key={posture}
                  onClick={() => { audio.sfxKeyClick(); setFlightPosture(posture); }}
                  className={`py-1.5 text-[7px] font-black tracking-tighter uppercase rounded border ${
                    flightPosture === posture
                      ? 'border-[#ff2244] bg-[#ff2244]/10 text-[#ff2244]'
                      : 'border-green-950 text-gray-500 hover:text-white'
                  }`}
                >
                  {posture.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-2 uppercase">
            🎚️ ALTITUDE & AIRSPEED CONTROLS
          </h2>
          <div className="space-y-3.5 text-[8px] text-gray-400 mt-1">
            <div>
              <div className="flex justify-between">
                <span>TARGET UAV ALTITUDE:</span>
                <span className="text-cyan-400 font-bold">{flightAlt}m</span>
              </div>
              <input
                type="range" min="2000" max="8000" step="100" value={flightAlt}
                onChange={(e) => setFlightAlt(parseInt(e.target.value))}
                className="w-full accent-cyan-600 h-1 bg-green-950 rounded"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <span>TARGET Airspeed VELOCITY:</span>
                <span className="text-cyan-400 font-bold">{flightSpd}kts</span>
              </div>
              <input
                type="range" min="80" max="250" step="5" value={flightSpd}
                onChange={(e) => setFlightSpd(parseInt(e.target.value))}
                className="w-full accent-cyan-600 h-1 bg-green-950 rounded"
              />
            </div>
          </div>

          {/* Health bars */}
          <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-3 uppercase">
            📊 PLATFORM DIAGNOSTICS
          </h2>
          <div className="space-y-2 mt-1">
            <div>
              <div className="flex justify-between text-[7px] text-gray-400 mb-0.5">
                <span>DRONE STRUCTURAL INTEGRITY:</span>
                <span className="text-green-500 font-bold">{droneHealth}%</span>
              </div>
              <div className="w-full bg-green-950 h-1 rounded overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${droneHealth}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[7px] text-gray-400 mb-0.5">
                <span>POWER / FUEL REMAINING:</span>
                <span className={`${fuelGauge > 30 ? 'text-green-400' : 'text-red-500'} font-bold`}>{fuelGauge}%</span>
              </div>
              <div className="w-full bg-green-950 h-1 rounded overflow-hidden">
                <div className={`${fuelGauge > 30 ? 'bg-green-400' : 'bg-red-500'} h-full`} style={{ width: `${fuelGauge}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: High Res Live Cockpit Canvas */}
        <div className="col-span-6 flex flex-col gap-1.5 border border-[#1a5c1a]/40 p-1.5 bg-black rounded relative">
          <div className="absolute top-2.5 right-3 text-[7px] text-red-500 font-bold tracking-widest bg-black/75 p-1 border border-red-950 pointer-events-none uppercase z-10 animate-pulse">
            ● REC STATE HIGH_DEF_FEED
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={280}
              className="w-full h-full block bg-black border border-green-950"
            />
          </div>

          {/* Spectral modes */}
          <div className="grid grid-cols-5 gap-1 bg-[#010401] border border-green-900/60 p-1.5">
            {(['EO', 'IR', 'SWIR', 'MULTI', 'INDEX'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { audio.sfxKeyClick(); setSpectralMode(m); }}
                className={`py-1 text-[8px] font-black uppercase rounded-[1px] transition-all ${
                  spectralMode === m
                    ? 'bg-[#4a1215] text-[#ff3b42] border border-[#ff3b42]'
                    : 'bg-black text-gray-500 hover:text-white border border-transparent'
                }`}
              >
                {m === 'EO' ? '🔎 ELEC RECON' : m === 'IR' ? '🔥 MONO THERMAL' : m === 'SWIR' ? '⚡ SWIR SPECTRAL' : m === 'MULTI' ? '📡 FUSED VIDEO' : '📊 STATUS INDEX'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Weapons payload & triggers */}
        <div className="col-span-3 flex flex-col gap-2 border border-[#1a5c1a]/40 p-2 bg-[#030603] rounded min-h-0 justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 uppercase">
              🚀 WEAPON PAYLOAD SELECTION
            </h2>

            <div className="flex flex-col gap-1 mt-1">
              {[
                { id: 'GBU-39', label: 'GBU-39 SMALL DIAMETER BOMB', desc: 'Precision laser-guided glide bomb. Ideal for bunkers.' },
                { id: 'GBU-12', label: 'GBU-12 PAVEWAY KINETIC', desc: 'Semiactive laser guided. High blast radius.' },
                { id: 'CYBER_INTRUDER', label: 'CYBER-SIGNAL EXFILTRATOR', desc: 'Non-kinetic data exfiltrator wave emitter.' },
                { id: 'EMP_GRAVITY', label: 'EMP GRAVITY MISSILE', desc: 'Intense micro-pulse payload. Jams local grids.' },
              ].map((wpn) => (
                <div
                  key={wpn.id}
                  onClick={() => { audio.sfxKeyClick(); setOrdnanceSelected(wpn.id as any); }}
                  className={`p-1.5 border text-[7.5px] cursor-pointer transition-all ${
                    ordnanceSelected === wpn.id
                      ? 'border-[#ff2244] bg-[#ff2244]/10 text-[#ff2244]'
                      : 'border-green-950 hover:border-green-800 text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <strong className="block">{wpn.label}</strong>
                  <span className="text-gray-400 block mt-0.5 leading-tight">{wpn.desc}</span>
                </div>
              ))}
            </div>

            <h2 className="text-[10px] font-bold text-gray-400 border-b border-green-950 pb-1 mt-3 uppercase">
              🔑 STRIKE AUTHORIZATION INTERLOCK
            </h2>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { audio.sfxKeyClick(); setDroneArmed(!droneArmed); }}
                className={`flex-1 py-1 px-2 border text-[8.5px] font-black uppercase rounded text-center cursor-pointer transition-all ${
                  droneArmed ? 'bg-red-950 text-[#ff2244] border-[#ff2244]' : 'bg-black text-gray-500 border-green-950 hover:text-white'
                }`}
              >
                {droneArmed ? '🔒 SECURED' : '🔓 ARM MASTER KEY'}
              </button>
              <button
                onClick={handleLaunchWeapon}
                disabled={!droneArmed || !targetCountryId || pendingStrike}
                className="flex-1 py-1 px-2 bg-red-950/45 hover:bg-red-900/65 border border-red-500/75 text-red-500 text-[8.5px] font-black uppercase rounded text-center disabled:opacity-20 cursor-pointer transition-all"
              >
                {pendingStrike ? 'DEPLOYING...' : '🔴 RELEASE PAYLOAD'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-[8px] font-bold text-gray-400 border-b border-green-950 pb-1 mb-1.5 uppercase">
              📋 LAUNCH BURSTS ARCHIVE
            </h2>
            <div className="text-[7.5px] text-gray-500 space-y-1 bg-black/45 p-1 border border-green-950 max-h-[80px] overflow-y-auto leading-normal">
              {launchedBursts.length === 0 ? (
                <div className="italic text-gray-600 text-center">No active bursts deployed in this flight segment.</div>
              ) : (
                launchedBursts.map((b) => <div key={b} className="font-mono text-[7px] text-red-400">{b}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
