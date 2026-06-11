import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';

// Feed dimensions: width={192} height={148}

const COUNTRY_IDS = ['US', 'CN', 'RU', 'IN', 'PK', 'IL', 'IR', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW'];

interface RadarBlip {
  bearing: number;
  range: number;
  brightness: number;
  isHaarp: boolean;
}

export default function HaarpRadar() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Synchronized States
  const [haarpTarget, setHaarpTarget] = useState('');
  const [haarpActive, setHaarpActive] = useState(false);
  const [haarpLevel, setHaarpLevel] = useState(3); // default level

  const sweepAngle = useRef(0);
  const blips = useRef<RadarBlip[]>([
    { bearing: 45, range: 0.45, brightness: 0, isHaarp: false },
    { bearing: 120, range: 0.72, brightness: 0, isHaarp: false },
    { bearing: 210, range: 0.35, brightness: 0, isHaarp: false },
    { bearing: 285, range: 0.8, brightness: 0, isHaarp: true },
    { bearing: 330, range: 0.58, brightness: 0, isHaarp: false }
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(cx, cy) - 9;
    const sweepSpeed = haarpActive ? 3.3 : 1.6;

    function frameLoop() {
      sweepAngle.current = (sweepAngle.current + sweepSpeed) % 360;
      const sa = sweepAngle.current;

      // Pixel-level phosphor persistence decay (comet tail trailing)
      const imageData = ctx!.getImageData(0, 0, W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Simple distance check to keep decay bounded within active screen circles
        data[i] = data[i] * 0.89;          // red decay
        data[i + 1] = data[i + 1] * 0.93;  // green persistence is longest
        data[i + 2] = data[i + 2] * 0.87;  // blue decay
      }
      ctx!.putImageData(imageData, 0, 0);

      // Render dark radar circle backdrop
      ctx!.beginPath();
      ctx!.arc(cx, cy, R, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? 'rgba(0, 8, 12, 0.28)' : 'rgba(0, 8, 1, 0.28)';
      ctx!.fill();
      ctx!.strokeStyle = haarpActive ? '#00e5ff' : '#00aa22';
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      // Range rings (concentric lines)
      [0.25, 0.5, 0.75, 1.0].forEach((frac, ri) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, R * frac, 0, Math.PI * 2);
        ctx!.strokeStyle = haarpActive
          ? `rgba(0, 229, 255, ${ri === 3 ? 0.35 : 0.16})`
          : `rgba(0, 180, 50, ${ri === 3 ? 0.35 : 0.16})`;
        ctx!.lineWidth = 0.5;
        ctx!.stroke();

        // Print Range values
        const labelR = R * frac + 1.5;
        ctx!.fillStyle = haarpActive ? 'rgba(0, 229, 255, 0.55)' : 'rgba(0, 160, 40, 0.55)';
        ctx!.font = '5.5px "JetBrains Mono", monospace';
        ctx!.fillText(`${Math.round(frac * 1200)}KM`, cx + labelR * Math.cos(-Math.PI / 6), cy + labelR * Math.sin(-Math.PI / 6));
      });

      // Bearing degree lines (every 45 degrees)
      for (let b = 0; b < 360; b += 45) {
        const rad = ((b - 90) * Math.PI) / 180;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad));
        ctx!.strokeStyle = haarpActive ? 'rgba(0, 150, 200, 0.15)' : 'rgba(0, 120, 20, 0.15)';
        ctx!.lineWidth = 0.5;
        ctx!.stroke();

        // Bearing markers
        ctx!.fillStyle = haarpActive ? 'rgba(0, 229, 255, 0.55)' : 'rgba(0, 160, 40, 0.55)';
        ctx!.font = '5.5px "JetBrains Mono", monospace';
        ctx!.textAlign = 'center';
        ctx!.fillText(`${b}°`, cx + (R + 6.5) * Math.cos(rad), cy + (R + 6.5) * Math.sin(rad) + 2);
      }

      // Dynamic sweep line gradient
      const sweepRad = ((sa - 90) * Math.PI) / 180;
      const grad = ctx!.createLinearGradient(cx, cy, cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      grad.addColorStop(0, 'rgba(0, 255, 68, 0.0)');
      grad.addColorStop(0.5, haarpActive ? 'rgba(0, 200, 255, 0.08)' : 'rgba(0, 150, 30, 0.08)');
      grad.addColorStop(0.85, haarpActive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(0, 180, 50, 0.25)');
      grad.addColorStop(1, haarpActive ? 'rgba(100, 240, 255, 0.95)' : 'rgba(136, 255, 170, 0.9)');

      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + R * Math.cos(sweepRad), cy + R * Math.sin(sweepRad));
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 1.6;
      ctx!.stroke();

      // Render fading active blips
      blips.current.forEach((blip) => {
        const blipRad = ((blip.bearing - 90) * Math.PI) / 180;
        const bx = cx + R * blip.range * Math.cos(blipRad);
        const by = cy + R * blip.range * Math.sin(blipRad);

        // Compute angle proximity to charge peak brightness
        const angleDiff = Math.abs(((sa - blip.bearing) + 360) % 360);
        if (angleDiff < sweepSpeed * 2.2) {
          blip.brightness = haarpActive && blip.isHaarp ? 1.0 : 0.85;
        }

        if (blip.brightness > 0.04) {
          ctx!.beginPath();
          ctx!.arc(bx, by, blip.isHaarp ? 3.5 : 2, 0, Math.PI * 2);
          const activeColor = haarpActive && blip.isHaarp ? '#00e5ff' : '#00ff44';
          ctx!.fillStyle = activeColor;
          ctx!.shadowColor = activeColor;
          ctx!.shadowBlur = blip.brightness * 7;
          ctx!.fill();
          ctx!.shadowBlur = 0;
          blip.brightness *= 0.94; // slow fade decay
        }
      });

      // Active weather disruption targeting rings
      if (haarpActive && haarpTarget) {
        // Map target country id to a fixed bearing inside the radar scope
        const index = COUNTRY_IDS.indexOf(haarpTarget);
        const targetBearing = (index * 19) % 360;
        const tRad = ((targetBearing - 90) * Math.PI) / 180;
        const tx = cx + R * 0.65 * Math.cos(tRad);
        const ty = cy + R * 0.65 * Math.sin(tRad);

        const pulseSize = ((Date.now() / 900) % 1) * 16;
        ctx!.beginPath();
        ctx!.arc(tx, ty, pulseSize, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(0, 229, 255, ${1 - pulseSize / 16})`;
        ctx!.lineWidth = 1.0;
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx!.fillStyle = '#00e5ff';
        ctx!.shadowColor = '#00e5ff';
        ctx!.shadowBlur = 8;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      // Scope Center dot
      ctx!.beginPath();
      ctx!.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx!.fillStyle = haarpActive ? '#00e5ff' : '#00ff44';
      ctx!.fill();

      // Radar console footer
      ctx!.fillStyle = 'rgba(2, 5, 2, 0.85)';
      ctx!.fillRect(0, H - 13, W, 13);
      ctx!.fillStyle = haarpActive ? '#00e5ff' : '#00cc33';
      ctx!.font = '6px "JetBrains Mono", monospace';
      ctx!.textAlign = 'left';
      ctx!.fillText(
        `FREQ:${(3.1 + haarpLevel * 0.35).toFixed(1)}MHz  ${haarpActive ? `HAARP_ON: ${haarpTarget || 'WIDE_BEAM'}` : 'ANT_STANDBY'}`,
        4,
        H - 4
      );

      rafRef.current = requestAnimationFrame(frameLoop);
    }

    rafRef.current = requestAnimationFrame(frameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [haarpActive, haarpTarget, haarpLevel]);

  const toggleHaarp = () => {
    audio.sfxKeyClick();
    if (haarpActive) {
      setHaarpActive(false);
      pushTerminalLine('HAARP array: Ionospheric pulse system deactivated. Standing by.', 'INFO');
    } else {
      if (!haarpTarget) {
        pushTerminalLine('HAARP fail: Set a climate grid sector target prior to node activation.', 'WARNING');
        return;
      }
      setHaarpActive(true);
      pushTerminalLine(`HAARP array: Active. Emitting ionospheric warming beams over ${haarpTarget}.`, 'WARNING');
      audio.sfxKlaxon();

      // Trigger world state climate impacts!
      useWorldStore.getState().applyTickDelta((draft) => {
        const c = draft.countries[haarpTarget];
        if (c && c.political) {
          // Increase substate tension or deplete infrastructure slightly to show real simulation effects!
          c.political.stabilityIndex = Math.max(10, c.political.stabilityIndex - 12);
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5">
        <span>HAARP CLIMATE EMITTER</span>
        <span style={{ animation: haarpActive ? 'blink 0.8s infinite' : 'none', color: haarpActive ? '#00e5ff' : '#666' }}>
          {haarpActive ? '◉ ANT_EMITTING' : '◯ ANT_STANDBY'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={192}
        height={148}
        className="w-full h-auto block select-none border border-[#0d2e0d]"
        style={{ background: '#020402' }}
      />

      <div className="flex gap-1 mt-1">
        <select
          value={haarpTarget}
          onChange={(e) => { audio.sfxKeyClick(); setHaarpTarget(e.target.value); }}
          className="feed-select rounded text-[6px]"
          style={{ width: '65%' }}
        >
          <option value="">-- BEAM DIRECT --</option>
          {COUNTRY_IDS.map((id) => (
            <option key={id} value={id}>
              {id} ZONE
            </option>
          ))}
        </select>
        <button
          onClick={toggleHaarp}
          className={`feed-btn px-1 py-0.5 rounded flex-1 text-center ${haarpActive ? 'active text-[#00e5ff]' : ''}`}
        >
          {haarpActive ? 'D_ACT' : 'FORCE'}
        </button>
      </div>
    </div>
  );
}
