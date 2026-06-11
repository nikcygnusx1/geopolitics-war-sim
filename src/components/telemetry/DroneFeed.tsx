import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { audio } from '../../utils/audio';

// Feed dimensions: width={192} height={148}

export default function DroneFeed() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [droneArmed, setDroneArmed] = useState(false);
  const [isLoitering, setIsLoitering] = useState(true);

  const state = useRef({
    altitude: 1240 + Math.random() * 200,
    airspeed: 310 + Math.random() * 40,
    heading: 247 + Math.random() * 10,
    pitch: 0,
    roll: 0,
    lockBlink: true,
    // Parallax terrain scrolling layers
    layers: Array.from({ length: 5 }, (_, i) => ({
      speed: (i + 1) * 0.45,
      color: `hsl(${135 + i * 3}, ${16 + i * 2}%, ${5 + i * 2}%)`,
      features: Array.from({ length: 6 }, () => ({
        x: Math.random() * 192,
        w: 6 + Math.random() * 14,
        h: 3 + Math.random() * 8,
      })),
    })),
  });

  // Handle active status blinking
  useEffect(() => {
    const interval = setInterval(() => {
      state.current.lockBlink = !state.current.lockBlink;
    }, 450);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    function drawAltitudeTape(alt: number) {
      ctx!.strokeStyle = 'rgba(0, 255, 68, 0.65)';
      ctx!.lineWidth = 1;
      ctx!.strokeRect(W - 26, H / 2 - 30, 22, 60);
      ctx!.fillStyle = 'rgba(2, 6, 2, 0.55)';
      ctx!.fillRect(W - 26, H / 2 - 30, 22, 60);

      for (let i = -2; i <= 2; i++) {
        const tapAlt = Math.round(alt / 50) * 50 + i * 50;
        const y = H / 2 + i * -11;
        ctx!.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.48)';
        ctx!.font = `${i === 0 ? 7.5 : 6}px "JetBrains Mono", monospace`;
        ctx!.textAlign = 'right';
        ctx!.fillText(String(tapAlt), W - 7, y + 2.5);
      }
      ctx!.textAlign = 'left';
    }

    function drawAirspeedTape(spd: number) {
      ctx!.strokeStyle = 'rgba(0, 255, 68, 0.65)';
      ctx!.lineWidth = 1;
      ctx!.strokeRect(4, H / 2 - 30, 22, 60);
      ctx!.fillStyle = 'rgba(2, 6, 2, 0.55)';
      ctx!.fillRect(4, H / 2 - 30, 22, 60);

      for (let i = -2; i <= 2; i++) {
        const tapSpd = Math.round(spd / 10) * 10 + i * 10;
        const y = H / 2 + i * -11;
        ctx!.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.48)';
        ctx!.font = `${i === 0 ? 7.5 : 6}px "JetBrains Mono", monospace`;
        ctx!.textAlign = 'left';
        ctx!.fillText(String(tapSpd), 7, y + 2.5);
      }
    }

    function drawHeadingTape(hdg: number) {
      ctx!.fillStyle = 'rgba(2, 6, 2, 0.6)';
      ctx!.fillRect(W / 2 - 40, 2, 80, 13);
      ctx!.strokeStyle = 'rgba(0, 255, 68, 0.65)';
      ctx!.lineWidth = 1;
      ctx!.strokeRect(W / 2 - 40, 2, 80, 13);

      for (let i = -3; i <= 3; i++) {
        const tapHdg = ((Math.round(hdg / 10) * 10 + i * 10) + 360) % 360;
        const x = W / 2 + i * 11;
        ctx!.fillStyle = i === 0 ? '#00ff44' : 'rgba(0, 210, 50, 0.48)';
        ctx!.font = `${i === 0 ? 7.5 : 6}px "JetBrains Mono", monospace`;
        ctx!.textAlign = 'center';
        ctx!.fillText(String(tapHdg), x, 10);
      }
      // Center reference tick
      ctx!.fillStyle = '#00ff44';
      ctx!.fillRect(W / 2 - 0.5, 12, 1, 3);
    }

    function frameLoop() {
      const s = state.current;
      ctx!.clearRect(0, 0, W, H);

      // Solid background
      ctx!.fillStyle = '#020502';
      ctx!.fillRect(0, 0, W, H);

      // Scrolling terrain features
      s.layers.forEach((layer, li) => {
        layer.features.forEach((f) => {
          f.x -= isLoitering ? layer.speed * 0.3 : layer.speed;
          if (f.x + f.w < 0) {
            f.x = W + Math.random() * 30;
          }
          const baseY = H - 18 - li * 9;
          ctx!.fillStyle = layer.color;
          ctx!.fillRect(f.x, baseY - f.h, f.w, f.h + 20);
        });
      });

      // Dynamic Horizon Line
      const horizY = H / 2 + s.pitch * 2.2;
      ctx!.strokeStyle = 'rgba(0, 255, 68, 0.55)';
      ctx!.lineWidth = 1;
      ctx!.setLineDash([]);

      // Horizon left sweep
      ctx!.beginPath();
      ctx!.moveTo(W * 0.15, horizY);
      ctx!.lineTo(W / 2 - 16, horizY);
      ctx!.stroke();

      // Horizon right sweep
      ctx!.beginPath();
      ctx!.moveTo(W / 2 + 16, horizY);
      ctx!.lineTo(W * 0.85, horizY);
      ctx!.stroke();

      // Center reference chevron
      ctx!.fillStyle = 'rgba(0, 255, 68, 0.8)';
      ctx!.beginPath();
      ctx!.moveTo(W / 2, horizY - 3);
      ctx!.lineTo(W / 2 - 5, horizY + 3);
      ctx!.lineTo(W / 2 + 5, horizY + 3);
      ctx!.closePath();
      ctx!.fill();

      // Velocity flight vector dot
      ctx!.beginPath();
      ctx!.arc(W / 2 + s.roll * 3, horizY - 6, 2.5, 0, Math.PI * 2);
      ctx!.strokeStyle = '#00ff44';
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      // Active target diamond lock-on reticle
      if (targetCountryId) {
        const tx = W / 2;
        const ty = H / 2 + 10;
        const pulse = 24 + Math.sin(Date.now() / 250) * 1.5;

        ctx!.save();
        ctx!.translate(tx, ty);
        ctx!.rotate(Math.PI / 4);
        ctx!.strokeStyle = s.lockBlink ? '#ffb300' : 'rgba(255, 179, 0, 0.35)';
        ctx!.lineWidth = 1.2;
        ctx!.strokeRect(-pulse / 2, -pulse / 2, pulse, pulse);
        ctx!.restore();

        // Target box corner ticks
        const br = pulse * 0.82;
        ctx!.strokeStyle = '#ffb300';
        ctx!.lineWidth = 0.8;
        [[-br, -br], [br, -br], [br, br], [-br, br]].forEach(([dx, dy]) => {
          const px = tx + dx;
          const py = ty + dy;
          const ex = dx > 0 ? 3 : -3;
          const ey = dy > 0 ? 3 : -3;
          ctx!.beginPath();
          ctx!.moveTo(px, py);
          ctx!.lineTo(px + ex, py);
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.moveTo(px, py);
          ctx!.lineTo(px, py + ey);
          ctx!.stroke();
        });

        // LOCK-ON HUD indicators
        if (s.lockBlink) {
          ctx!.fillStyle = '#ffb300';
          ctx!.font = '6.5px "JetBrains Mono", monospace';
          ctx!.textAlign = 'left';
          ctx!.fillText('◆ TGT LOCK', tx + br + 4, ty + 2);
          ctx!.fillText(targetCountryId, tx + br + 4, ty + 10);
        }
      }

      // Draw flight UI tapes
      drawHeadingTape(s.heading);
      drawAltitudeTape(s.altitude);
      drawAirspeedTape(s.airspeed);

      // Simulation drifting noise
      s.heading += (Math.random() - 0.5) * 0.25;
      s.altitude += (Math.random() - 0.5) * 1.8;
      s.airspeed += (Math.random() - 0.5) * 0.8;
      s.pitch = Math.sin(Date.now() / 3500) * 2.5;

      // HUD footer
      ctx!.fillStyle = 'rgba(2, 5, 2, 0.8)';
      ctx!.fillRect(0, H - 13, W, 13);
      ctx!.fillStyle = '#00ff44';
      ctx!.font = '6px "JetBrains Mono", monospace';
      ctx!.fillText(
        `HDG:${s.heading.toFixed(0)}° SPD:${s.airspeed.toFixed(0)}KTS ALT:${s.altitude.toFixed(0)}M ${droneArmed ? '⚡ARMED' : 'SAFE'}`,
        4,
        H - 4
      );

      // Dropout glitch lines (1.2% chance)
      if (Math.random() < 0.012) {
        const gy = Math.random() * H;
        const gd = ctx!.getImageData(0, gy, W, 1);
        ctx!.putImageData(gd, Math.random() * 8 - 4, gy);
      }

      rafRef.current = requestAnimationFrame(frameLoop);
    }

    rafRef.current = requestAnimationFrame(frameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetCountryId, droneArmed, isLoitering]);

  const toggleArmed = () => {
    audio.sfxKeyClick();
    setDroneArmed(!droneArmed);
    pushTerminalLine(`Sentinel drone matrix weapons system toggled to ${!droneArmed ? 'ARMED' : 'SAFE'}.`, !droneArmed ? 'WARNING' : 'INFO');
  };

  const toggleLoiter = () => {
    audio.sfxKeyClick();
    setIsLoitering(!isLoitering);
    pushTerminalLine(`Sentinel flight path calibrated: ${!isLoitering ? 'LOITER_LOCK ACTIVE' : 'COMBAT_VECTOR STEER'}.`, 'INFO');
  };

  const handleFireStrike = () => {
    audio.sfxKlaxon();
    if (!playerCountryId || !targetCountryId) return;

    const scGeo = GEO_COORDS[playerCountryId];
    const tgGeo = GEO_COORDS[targetCountryId];
    const sx = scGeo ? scGeo.cx : 500;
    const sy = scGeo ? scGeo.cy : 250;
    const tx = tgGeo ? tgGeo.cx : 400;
    const ty = tgGeo ? tgGeo.cy : 200;

    const currentTick = useWorldStore.getState().currentTick;
    const tickDist = 12; // strikes take some time to traverse map

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

    useWorldStore.getState().addGlobalEvent(`DRONE COMMAND: Sentinel airborne drone launched kinetic paystrike on locked zone: ${targetCountryId}.`, 'CRITICAL');
    pushTerminalLine(`SENTINEL UAV: Precision payloads deployed targeting coordinates in ${targetCountryId}. Impact in T-12 ticks.`, 'CRITICAL');
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5">
        <span>TAC DRONE MULTISPECTRAL FEED</span>
        <span style={{ color: droneArmed ? '#ff2244' : '#ffb300' }}>
          {droneArmed ? '⚡ ARMED' : '+ FEED LOCK'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={192}
        height={148}
        className="w-full h-auto block select-none border border-[#0d2e0d]"
        style={{ background: '#020502' }}
      />

      <div className="flex gap-1 mt-1">
        <button
          onClick={toggleArmed}
          className={`feed-btn px-1 py-0.5 rounded flex-1 text-center ${droneArmed ? 'armed text-[#ff2244]' : ''}`}
        >
          {droneArmed ? '🔴 SAFE' : '⚡ ARM'}
        </button>
        <button
          onClick={handleFireStrike}
          disabled={!droneArmed || !targetCountryId}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center text-[#ff2244] disabled:opacity-20"
        >
          FIRE STRIKE
        </button>
        <button
          onClick={toggleLoiter}
          className={`feed-btn px-1 py-0.5 rounded flex-1 text-center ${isLoitering ? 'text-[#00e5ff]' : ''}`}
        >
          {isLoitering ? 'LOITER ◆' : 'LOITER'}
        </button>
      </div>
    </div>
  );
}
