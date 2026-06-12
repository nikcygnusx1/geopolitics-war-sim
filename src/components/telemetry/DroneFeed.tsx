import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { audio } from '../../utils/audio';

// Drone multispectral modes
type MultispectralMode = 'EO' | 'IR' | 'SWIR' | 'MULTI' | 'INDEX';

interface TargetThreatData {
  id: string;
  name: string;
  lat: number;
  long: number;
}

export default function DroneFeed() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

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
    // Terrain scroll objects
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

  // Toggle blinking locks
  useEffect(() => {
    const interval = setInterval(() => {
      state.current.lockBlink = !state.current.lockBlink;
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Update canvas
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

      // 1. SCENE RENDERER - Spectral Base styling
      let bgStyle = '#020502';
      let edgeColor = 'rgba(0, 255, 68, 0.4)';
      let contrastGlow = false;

      switch (spectralMode) {
        case 'EO':
          bgStyle = '#0a1209'; // Daylight low light
          edgeColor = 'rgba(0, 230, 80, 0.55)';
          break;
        case 'IR':
          bgStyle = '#030503'; // Monochrome heat signature
          edgeColor = 'rgba(255, 255, 255, 0.5)';
          break;
        case 'SWIR':
          bgStyle = '#0f0502'; // Infrared thermal
          edgeColor = 'rgba(255, 120, 0, 0.6)';
          break;
        case 'MULTI':
          bgStyle = '#021015'; // Fused cyan/yellow surveillance
          edgeColor = 'rgba(0, 240, 255, 0.7)';
          contrastGlow = true;
          break;
        case 'INDEX':
          bgStyle = '#000000'; // Pure data values
          edgeColor = 'rgba(255, 191, 0, 0.65)';
          break;
      }

      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, W, H);

      // 2. PARALLAX TERRAIN scrolling
      const terrainMovementMultiplier = isLoitering ? 0.15 : 0.95;
      s.terrains.forEach((layer, li) => {
        layer.x -= layer.scale * terrainMovementMultiplier;
        if (layer.x < -60) {
          layer.x = W + Math.random() * 30;
        }

        // Draw terrain structures based on current spectrum
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

        // Draw small structural thermal dots representing settlements/outposts
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

      // 3. FLIGHT COCKPIT ATTITUDE HUD (Responsive to pitch/roll)
      s.pitch = Math.sin(Date.now() / 2500) * 4;
      s.roll = Math.cos(Date.now() / 3200) * (isLoitering ? 4 : 1.2);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate((s.roll * Math.PI) / 180);

      // Pitch lines
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);

      // Pitch up bar
      const pY = s.pitch * 3.5;
      ctx.beginPath();
      ctx.moveTo(-25, pY - 15); ctx.lineTo(25, pY - 15);
      ctx.moveTo(-15, pY + 15); ctx.lineTo(15, pY + 15);
      ctx.stroke();

      // Pitch reference scale numbers
      ctx.fillStyle = edgeColor;
      ctx.font = '5px "JetBrains Mono", monospace';
      ctx.fillText('+10', 28, pY - 13);
      ctx.fillText('-10', 18, pY + 17);

      ctx.restore();
      ctx.setLineDash([]);

      // 4. CENTRAL RETICLE / FLIGHT VECTOR
      ctx.strokeStyle = '#00ff44';
      if (contrastGlow) ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.2;

      // Center crosshair with open center gap
      const cx = W / 2;
      const cy = H / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy); ctx.lineTo(cx - 5, cy);
      ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 16, cy);
      ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy - 5);
      ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 16);
      ctx.stroke();

      // Mini concentric ring
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.stroke();

      // 5. LOCK ON BOX (Target tracking box)
      if (targetCountryId) {
        const lockX = cx + Math.sin(Date.now() / 1500) * 6;
        const lockY = cy + 10 + Math.cos(Date.now() / 1200) * 4;
        const lockSize = 16 + Math.sin(Date.now() / 300) * 1;

        ctx.strokeStyle = droneArmed ? '#ff2244' : '#ffb300';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(lockX - lockSize / 2, lockY - lockSize / 2, lockSize, lockSize);

        // Blinking sector lock indicators
        if (s.lockBlink) {
          ctx.beginPath();
          ctx.arc(lockX, lockY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = droneArmed ? '#ff2244' : '#ffb300';
          ctx.fill();

          ctx.font = 'bold 6.5px "JetBrains Mono", monospace';
          ctx.fillText(`◆ TGT_${targetCountryId}`, lockX + lockSize / 2 + 3, lockY + 2);
        }
      }

      // 6. SPEED & ALTITUDE TAPES
      // Speed (Left tape)
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

      // Altitude (Right tape)
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

      // 7. COMPASS TAPE (TOP)
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

      // Dynamic flight drifting state
      s.airspeed += (Math.random() - 0.5) * 0.4;
      s.altitude += (Math.random() - 0.5) * 0.8;
      // Change heading faster when combat-vector steering (not loitering)
      s.heading = (s.heading + (isLoitering ? 0.05 : 0.35)) % 360;

      // 8. TACTICAL CORNER BADGES
      ctx.fillStyle = '#ffb300';
      ctx.font = '5.5px "JetBrains Mono", monospace';
      ctx.fillText(`POSTURE: ${isLoitering ? 'LOITER_HOLD [STABLE]' : 'COMBAT_STEER [HOT]'}`, 4, H - 24);

      // ARMED warning panel under-critical state
      if (droneArmed) {
        ctx.fillStyle = '#ff2244';
        ctx.fillText('⚡ PAYLOAD ARMED - STRIKE AUTHORIZED', 4, H - 17);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 68, 0.5)';
        ctx.fillText('SYSTEM OK - COLD DISCIPLINE ACTIVE', 4, H - 17);
      }

      // HUD Bottom overlay
      ctx.fillStyle = 'rgba(2, 5, 2, 0.88)';
      ctx.fillRect(0, H - 12, W, 12);
      ctx.fillStyle = droneArmed ? '#ff2244' : '#00ff44';
      ctx.font = '6px "JetBrains Mono", monospace';
      ctx.fillText(
        `WPN:${droneArmed ? 'ARMED' : 'SAFE'}  MODE:${spectralMode}  ALT:${alt.toFixed(0)}m  SPD:${spd.toFixed(0)}kts`,
        4,
        H - 4
      );

      // Glitch effect on high velocity or strike tracking
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
      {/* Dynamic spectral selection strip */}
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5 items-center bg-[#010401] border border-[#1a5c1a]/30 p-1">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${droneArmed ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          TAC DRONE MULTISPECTRAL FEED
        </span>
        <div className="flex gap-1 text-[7.5px] font-black">
          {(['EO', 'IR', 'SWIR', 'MULTI', 'INDEX'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { audio.sfxKeyClick(); setSpectralMode(mode); }}
              className={`px-1 py-0.5 rounded-[1px] ${
                spectralMode === mode
                  ? 'text-[#00ff44] bg-[#00ff44]/10 border border-[#00ff44]/50'
                  : 'text-gray-500 hover:text-white border border-transparent'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Index spectral legend box */}
      {spectralMode === 'INDEX' && (
        <div className="flex justify-between items-center text-[6px] font-mono bg-[#050c05] p-0.5 px-2 border-b border-[#1a5c1a]/20">
          <span className="text-gray-500">SURFACE INDEX ALBEDO:</span>
          <div className="flex gap-1.5">
            <span className="text-[#3399ff]">● SHIELD [35%]</span>
            <span className="text-[#ff9900]">● INFRA [65%]</span>
            <span className="text-[#ff2244]">● THERMAL [95%]</span>
          </div>
        </div>
      )}

      {/* Primary Cockpit Canvas HUD */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={192}
          height={148}
          className="w-full h-[120px] block border border-[#0d2e0d]"
          style={{ background: '#020502' }}
        />
        <div className="absolute top-1 left-2 text-[6.5px] tracking-wider text-green-500/60 font-mono">
          UAV_REC_ACTIVE_STEALTH
        </div>
        <div className="absolute bottom-1 right-2 text-[6.5px] text-[#ffb300]/60 font-mono">
          LOCK_C_AOA: {isLoitering ? '3.5' : '1.1'}°
        </div>
      </div>

      {/* Core Operational buttons */}
      <div className="flex gap-1 mt-1 font-mono text-[9px]">
        <button
          onClick={toggleArmed}
          className={`feed-btn px-1 py-1 rounded flex-1 text-center font-bold transition-all uppercase ${
            droneArmed ? 'bg-red-950/45 text-[#ff2244] border-[#ff2244]/60' : 'text-gray-400 hover:text-white'
          }`}
          title="Toggles Master safety lever between safety lock and operational hot state"
        >
          {droneArmed ? '⚡ DISARM' : '⚡ ARM PAYLOAD'}
        </button>

        <button
          onClick={handleFireStrike}
          disabled={!droneArmed || !targetCountryId || pendingStrike}
          className="feed-btn px-1 py-1 rounded flex-1 text-center font-black text-[#ff2244] disabled:opacity-20 transition-all uppercase"
          title="Fires laser-guided target payload on current territory"
        >
          {pendingStrike ? 'FIRING...' : '🔴 LAUNCH STRIKE'}
        </button>

        <button
          onClick={toggleLoiter}
          className={`feed-btn px-1 py-1 rounded flex-1 text-center font-bold transition-all uppercase ${
            isLoitering ? 'text-[#00e5ff] border-[#00e5ff]/40 bg-[#00e5ff]/5' : 'text-gray-400 hover:text-white'
          }`}
          title="Switches flight pattern: LOITER HOLD sweeps versus dynamic transit vectors"
        >
          {isLoitering ? 'LOITER ◆' : 'LOITER'}
        </button>
      </div>
    </div>
  );
}
