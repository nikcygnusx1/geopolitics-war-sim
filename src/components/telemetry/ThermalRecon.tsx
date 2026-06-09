import React, { useRef, useEffect } from 'react';

export default function ThermalRecon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animId: number;

    // Grid size: 12 cols by 8 rows
    const cols = 12;
    const rows = 8;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    // Seed thermal matrix cells
    const cellTemps = Array.from({ length: cols * rows }, () => Math.random() * 255);

    const render = () => {
      frame++;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render thermal blocks
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;

          // Slow drift over time
          cellTemps[idx] += (Math.random() - 0.5) * 4;
          cellTemps[idx] = Math.max(20, Math.min(255, cellTemps[idx]));

          const val = Math.round(cellTemps[idx]);

          // RGB green/yellow intensity
          let color = `rgb(0, ${Math.floor(val * 0.45)}, 0)`; // Cold shades
          if (val > 150) {
            color = `rgb(0, ${val}, ${Math.floor((val - 150) * 0.3)})`; // Hot yellow-green
          }
          if (val > 220) {
            color = `rgb(${Math.floor((val - 220) * 3)}, ${val}, ${Math.floor((val - 220) * 3)})`; // Peak white-hot
          }

          ctx.fillStyle = color;
          ctx.fillRect(c * cellW, r * cellH, cellW - 1, cellH - 1);
        }
      }

      // Draw horizontal scanning coordinates overlay
      ctx.strokeStyle = 'rgba(0, 255, 68, 0.2)';
      ctx.lineWidth = 1;
      const scanY = (frame * 1.5) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();

      // Render center crosshair reticle (zooming scale 1 to 2 to 1)
      const scale = 1 + Math.abs(Math.sin(frame / 60)) * 0.8;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const size = 15 * scale;

      ctx.strokeStyle = '#00ff44';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      // center box
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      // crossing lines
      ctx.moveTo(cx - size - 5, cy); ctx.lineTo(cx + size + 5, cy);
      ctx.moveTo(cx, cy - size - 5); ctx.lineTo(cx, cy + size + 5);
      ctx.stroke();

      // Scanlines CRT effect overlays
      ctx.fillStyle = 'rgba(0, 8, 0, 0.15)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 2);
      }

      // Telemetry HUD bar
      ctx.fillStyle = 'rgba(4, 12, 4, 0.85)';
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#00ff44';
      const driftTemp = Math.round(280 + Math.sin(frame / 40) * 12);
      ctx.fillText(
        `LAT: 33.84°N  LON: 35.49°E  ALT: 8,450M  TEMP: ${driftTemp}K`,
        8,
        canvas.height - 6
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center border border-green-950 p-1 bg-black">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] opacity-75 uppercase mb-1 flex justify-between w-full px-1">
        <span>SATELLITE POV</span>
        <span className="blink-hud text-red-500 font-bold">● REC</span>
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
