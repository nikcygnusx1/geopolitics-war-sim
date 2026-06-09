import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';

export default function CyberFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countryId = usePlayerStore((s) => s.countryId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const colCount = 14;
    const colSpeeds = Array.from({ length: colCount }, () => 1 + Math.random() * 4);
    const colOffsets = Array.from({ length: colCount }, () => Math.random() * canvas.height);
    const alphabet = '0123456789ABCDEF>/[]_#%'.split('');

    const render = () => {
      frame++;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render Matrix Hex columns cascade
      ctx.font = '7px monospace';
      const colWidth = canvas.width / colCount;

      for (let i = 0; i < colCount; i++) {
        colOffsets[i] += colSpeeds[i];
        if (colOffsets[i] > canvas.height) {
          colOffsets[i] = -20;
          colSpeeds[i] = 1 + Math.random() * 3.5;
        }

        ctx.fillStyle = i % 3 === 0 ? '#38ffaa' : '#00b333';
        const char = alphabet[Math.floor(Math.random() * alphabet.length)];

        // Draw character blocks trailing upwards
        for (let tail = 0; tail < 6; tail++) {
          ctx.globalAlpha = 1.0 - tail * 0.15;
          ctx.fillText(
            char,
            i * colWidth + 5,
            colOffsets[i] - tail * 8
          );
        }
        ctx.globalAlpha = 1.0;
      }

      // Draw horizontal static noise grids
      ctx.fillStyle = 'rgba(0, 255, 68, 0.08)';
      for (let k = 0; k < canvas.height; k += 3) {
        ctx.fillRect(0, k, canvas.width, 1);
      }

      // Intrusion vector warning log flashes
      if (frame % 100 < 40) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.fillRect(40, 50, 220, 40);
        ctx.strokeStyle = '#00e5ff';
        ctx.strokeRect(40, 50, 220, 40);

        ctx.fillStyle = '#00e5ff';
        ctx.font = '8px monospace';
        ctx.fillText(`PACKET CAPTURED FROM PORT 3000`, 55, 66);
        ctx.fillText(`SYSTEM STATUS: BACKDOOR DEPLOYED`, 55, 78);
      }

      // UAV Flight instrumentation details HUD
      ctx.fillStyle = 'rgba(1, 15, 12, 0.9)';
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
      ctx.font = '7px monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(
        `MATRIX VECTOR: ${countryId}_ROUTING_LOCK  FIREWALL: AT-PEAK [NOMINAL]`,
        8,
        canvas.height - 6
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [countryId]);

  return (
    <div className="flex flex-col items-center border border-cyan-950 p-1 bg-black">
      <div className="text-[8px] font-mono tracking-wider text-[#00e5ff] opacity-75 uppercase mb-1 flex justify-between w-full px-1">
        <span>INTRUSION CONTROL CASCADE</span>
        <span className="blink-hud text-cyan-500 font-bold">● MATRIX LIVE</span>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={180}
        className="w-full h-auto block select-none border border-cyan-950"
      />
    </div>
  );
}
