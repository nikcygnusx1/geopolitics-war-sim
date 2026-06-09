import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';

export default function DroneFeed() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetId = usePlayerStore((s) => s.selectedTargetCountryId) || 'CN';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    const render = () => {
      frame++;

      // Trigger 2% signal dropout flicker
      if (Math.random() < 0.02) {
        ctx.fillStyle = '#100000'; // noise static
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff2244';
        ctx.font = '14px monospace';
        ctx.fillText('NO SIGNAL / ENCRYPTING', 60, canvas.height / 2);
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#010501';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render scrolling terrain lines
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.1)';
      ctx.lineWidth = 1;
      const scrollOffset = (frame * 1.2) % 40;

      for (let y = scrollOffset; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // simple polygon trees/mountains scrolling upwards
        ctx.fillStyle = 'rgba(255, 179, 0, 0.04)';
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(60, y - 25);
        ctx.lineTo(80, y);
        ctx.closePath();
        ctx.fill();
      }

      // Animated dashed targeting bracket (Amber)
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1.2;
      const pulseSize = Math.sin(frame / 10) * 8;
      const tw = 80 + pulseSize;
      const th = 85 + pulseSize;
      const tx = canvas.width / 2 - tw / 2;
      const ty = canvas.height / 2 - th / 2;

      ctx.beginPath();
      // Corners only
      // top left
      ctx.moveTo(tx, ty + 20); ctx.lineTo(tx, ty); ctx.lineTo(tx + 20, ty);
      // top right
      ctx.moveTo(tx + tw - 20, ty); ctx.lineTo(tx + tw, ty); ctx.lineTo(tx + tw, ty + 20);
      // bottom left
      ctx.moveTo(tx, ty + th - 20); ctx.lineTo(tx, ty + th); ctx.lineTo(tx + 20, ty + th);
      // bottom right
      ctx.moveTo(tx + tw - 20, ty + th); ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx + tw, ty + th - 20);
      ctx.stroke();

      // Pitch indicator scales
      ctx.strokeStyle = 'rgba(255,179,0,0.35)';
      ctx.beginPath();
      ctx.moveTo(35, canvas.height / 2); ctx.lineTo(65, canvas.height / 2);
      ctx.moveTo(35, canvas.height / 2); ctx.lineTo(35, canvas.height / 2 - 10);
      ctx.moveTo(235, canvas.height / 2); ctx.lineTo(265, canvas.height / 2);
      ctx.moveTo(265, canvas.height / 2); ctx.lineTo(265, canvas.height / 2 - 10);
      ctx.stroke();

      // Draw horizontal static artifacts
      ctx.fillStyle = 'rgba(12, 10, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 5) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // UAV Flight instrumentation details HUD
      ctx.fillStyle = 'rgba(29, 20, 0, 0.85)';
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#ffb300';
      const heading = (230 + Math.floor(frame / 60)) % 360;
      const speed = Math.floor(412 + Math.sin(frame / 30) * 15);
      ctx.fillText(
        `TGT TRACK: ${targetId}   HDG: ${heading}°   SPD: ${speed}KTS   ALT: 2,410M`,
        8,
        canvas.height - 6
      );

      // Warning target acquire
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(255, 34, 68, 0.9)';
      ctx.fillText('WEAPONS SYS READY', 110, 25);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [targetId]);

  return (
    <div className="flex flex-col items-center border border-amber-900 p-1 bg-black">
      <div className="text-[8px] font-mono tracking-wider text-[#ffb300] opacity-75 uppercase mb-1 flex justify-between w-full px-1">
        <span>TAC DRONE MULTISPECTRAL FEED</span>
        <span className="blink-hud text-amber-500 font-bold">● FEED LOCK</span>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={180}
        className="w-full h-auto block select-none border border-amber-950"
      />
    </div>
  );
}
