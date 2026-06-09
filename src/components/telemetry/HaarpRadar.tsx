import React, { useRef, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';

export default function HaarpRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const blips = [
      { r: 40, a: 1.2, size: 3, speed: 0.1 },
      { r: 80, a: 3.5, size: 4, speed: -0.05 },
      { r: 110, a: 5.1, size: 5, speed: 0.08 },
    ];

    const render = () => {
      // 1. Radar Background Sweep Setup
      ctx.fillStyle = '#020502';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = (canvas.height - 18) / 2;
      const maxRadius = Math.min(cx, cy) - 10;

      // Draw radar concentrics
      ctx.strokeStyle = 'rgba(0, 255, 68, 0.15)';
      ctx.lineWidth = 0.5;

      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      // Horizontal and vertical crossing lines
      ctx.beginPath();
      ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy);
      ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius);
      ctx.stroke();

      // 2. Draw rotating sweep line and trailing fade
      angle += 0.025;

      const numFadeTrails = 18;
      for (let i = 0; i < numFadeTrails; i++) {
        const sweepAngle = angle - (i * 0.04);
        const intensity = 1.0 - (i / numFadeTrails);
        ctx.strokeStyle = `rgba(0, 255, 68, ${intensity * 0.55})`;
        ctx.lineWidth = i === 0 ? 1.5 : 0.75;

        const sx = cx + Math.cos(sweepAngle) * maxRadius;
        const sy = cy + Math.sin(sweepAngle) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      // 3. Draw storm blips
      blips.forEach((blip) => {
        blip.a += blip.speed * 0.03;
        const bx = cx + Math.cos(blip.a) * blip.r * 0.8;
        const by = cy + Math.sin(blip.a) * blip.r * 0.8;

        // Check if cursor sweep is pointing in relative proximity to draw highly glowing blip
        const angleDiff = Math.abs((angle % (Math.PI * 2)) - (blip.a % (Math.PI * 2)));
        let alpha = 0.15;
        if (angleDiff < 0.25) {
          alpha = 0.95;
        } else if (angleDiff < 1.0) {
          alpha = 0.55;
        }

        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 255, 68, ${alpha})`;
        ctx.stroke();
      });

      // Overlay Scan grid overlay
      ctx.fillStyle = 'rgba(0, 15, 0, 0.12)';
      for (let j = 0; j < canvas.height; j += 4) {
        ctx.fillRect(0, j, canvas.width, 1);
      }

      // Check current targeted country of HAARP project
      const pc = countries[playerCountryId];
      const targetCountryId = pc && pc.haarpActive ? pc.haarpTargetCountryId : 'NONE';

      // Flight telemetry HUD bar
      ctx.fillStyle = 'rgba(1, 15, 4, 0.9)';
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#00ff44';
      ctx.fillText(
        `ARR: CLIMATE RECON  FREQ: 3.4MHz  HAARP TARGET: ${targetCountryId}`,
        8,
        canvas.height - 6
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerCountryId, countries]);

  return (
    <div className="flex flex-col items-center border border-green-950 p-1 bg-black">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] opacity-75 uppercase mb-1 flex justify-between w-full px-1">
        <span>HAARP WEATHER DISRUPTER RADAR</span>
        <span className="blink-hud text-[#00e5ff] font-bold">● ANTENNA PULSING</span>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={180}
        className="w-full h-auto block select-none border border-green-950"
      />
    </div>
  );
}
