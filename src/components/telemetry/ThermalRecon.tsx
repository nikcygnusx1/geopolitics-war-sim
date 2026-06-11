import React, { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useWorldStore } from '../../store/worldStore';
import { useIntelligenceStore } from '../../store/intelligenceStore';
import { audio } from '../../utils/audio';

// Coordinates mapping for major command regions
const COUNTRY_PIXEL_COORDS: Record<string, { feedX: number; feedY: number }> = {
  US: { feedX: 45, feedY: 55 },
  CN: { feedX: 135, feedY: 65 },
  RU: { feedX: 120, feedY: 42 },
  IN: { feedX: 125, feedY: 78 },
  PK: { feedX: 118, feedY: 72 },
  IL: { feedX: 102, feedY: 74 },
  IR: { feedX: 108, feedY: 70 },
  GB: { feedX: 88, feedY: 48 },
  FR: { feedX: 90, feedY: 54 },
  DE: { feedX: 94, feedY: 52 },
  JP: { feedX: 154, feedY: 62 },
  KR: { feedX: 148, feedY: 64 },
  SA: { feedX: 105, feedY: 82 },
  BR: { feedX: 68, feedY: 105 },
  ZA: { feedX: 96, feedY: 118 },
  AU: { feedX: 150, feedY: 112 },
  TR: { feedX: 100, feedY: 60 },
  EG: { feedX: 98, feedY: 78 },
  TW: { feedX: 143, feedY: 71 },
};

const IRONBOW: [number, number, number][] = [
  [0, 0, 0],       // 0.00 cold
  [50, 0, 100],    // 0.15 purple
  [120, 0, 50],    // 0.30 dark red
  [200, 30, 0],    // 0.50 red
  [255, 100, 0],   // 0.65 orange
  [255, 200, 0],   // 0.80 yellow-orange
  [255, 255, 100], // 0.90 yellow
  [255, 255, 255], // 1.00 white-hot
];

const IRONBOW_STOPS = [0, 0.15, 0.30, 0.50, 0.65, 0.80, 0.90, 1.0];

function ironbow(h: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, h));
  for (let i = 0; i < IRONBOW_STOPS.length - 1; i++) {
    if (clamped <= IRONBOW_STOPS[i + 1]) {
      const t = (clamped - IRONBOW_STOPS[i]) / (IRONBOW_STOPS[i + 1] - IRONBOW_STOPS[i]);
      return IRONBOW[i].map((c, j) =>
        Math.round(c + t * (IRONBOW[i + 1][j] - c))
      ) as [number, number, number];
    }
  }
  return [255, 255, 255];
}

export default function ThermalRecon() {
  const targetCountryId = useUIStore((s) => s.countryInspectorId);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heat = useRef<Float32Array>(new Float32Array(16 * 12).fill(0.25));
  const crosshairPos = useRef({ x: 96, y: 74 }); // center
  const targetPos = useRef({ x: 96, y: 74 });
  const rafRef = useRef<number | null>(null);

  const [feedMode, setFeedMode] = useState<'THERMAL' | 'MOTION' | 'RADAR'>('THERMAL');

  // Smooth crosshair coordination update on target selection
  useEffect(() => {
    if (targetCountryId) {
      const coords = COUNTRY_PIXEL_COORDS[targetCountryId];
      if (coords) {
        targetPos.current = { x: coords.feedX, y: coords.feedY };
      }
    }
  }, [targetCountryId]);

  // Handle active strike impact flashes
  useEffect(() => {
    if (targetCountryId) {
      const impact = activeStrikes.find(
        (s) => s.targetCountryId === targetCountryId && s.status === 'IMPACT'
      );
      if (impact) {
        // Explode thermal heat array to absolute highest index
        for (let i = 0; i < heat.current.length; i++) {
          heat.current[i] = 0.95 + Math.random() * 0.05;
        }
      }
    }
  }, [activeStrikes, targetCountryId]);

  // Main canvas render thread
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLS = 16;
    const ROWS = 12;
    const cellW = canvas.width / COLS;
    const cellH = canvas.height / ROWS;

    // Static environmental hot spots (cities, tactical reactors)
    const hotSpots = [
      { ix: 5, iy: 3, baseHeat: 0.58 },
      { ix: 10, iy: 6, baseHeat: 0.65 },
      { ix: 3, iy: 8, baseHeat: 0.49 },
    ];

    let tick = 0;

    function renderLoop() {
      tick++;

      // Lerp crosshair position
      crosshairPos.current.x += (targetPos.current.x - crosshairPos.current.x) * 0.05;
      crosshairPos.current.y += (targetPos.current.y - crosshairPos.current.y) * 0.05;

      // Update thermal grid values
      for (let i = 0; i < heat.current.length; i++) {
        heat.current[i] += (Math.random() - 0.5) * 0.02;
        heat.current[i] = Math.max(0.04, Math.min(0.96, heat.current[i]));
      }

      // Heat boost for hot spots
      hotSpots.forEach(({ ix, iy, baseHeat }) => {
        const idx = iy * COLS + ix;
        const heatOscillation = Math.sin(Date.now() / 900) * 0.05;
        heat.current[idx] = Math.max(heat.current[idx], baseHeat + heatOscillation);
      });

      // Decay high heat peaks (simulating dissipation)
      for (let i = 0; i < heat.current.length; i++) {
        if (heat.current[i] > 0.72) {
          heat.current[i] *= 0.975;
        }
      }

      // Draw false-color pixel representation
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const h = heat.current[r * COLS + c];
          let color = '';

          if (feedMode === 'THERMAL') {
            const [red, green, blue] = ironbow(h);
            color = `rgb(${red}, ${green}, ${blue})`;
          } else if (feedMode === 'MOTION') {
            // Neon cyan motion overlay
            const motionVal = Math.floor(h * 200 + 55);
            color = `rgb(0, ${Math.floor(motionVal * 0.9)}, ${motionVal})`;
          } else {
            // RADAR/Greyscale scope
            const radarVal = Math.floor(h * 180 + 30);
            color = `rgb(0, ${radarVal}, 0)`;
          }

          ctx!.fillStyle = color;
          ctx!.fillRect(c * cellW, r * cellH, cellW + 0.3, cellH + 0.3);

          // Hot structure indicators
          if (h > 0.7 && feedMode === 'THERMAL') {
            ctx!.fillStyle = `rgba(255, 255, 255, ${(h - 0.7) * 2.5})`;
            ctx!.beginPath();
            ctx!.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, 2, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      }

      // CRT Scanlines Effect
      for (let y = 0; y < canvas.height; y += 3) {
        ctx!.fillStyle = 'rgba(2, 4, 2, 0.25)';
        ctx!.fillRect(0, y, canvas.width, 1);
      }

      // Reticle Box overlay
      const rx = crosshairPos.current.x;
      const ry = crosshairPos.current.y;

      ctx!.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx!.lineWidth = 1;

      // Draw cross lines with center gap
      [[rx - 15, ry, rx - 5, ry], [rx + 5, ry, rx + 15, ry],
       [rx, ry - 15, rx, ry - 5], [rx, ry + 5, rx, ry + 15]].forEach(([x1, y1, x2, y2]) => {
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.stroke();
      });

      // Bounding box corner ticks
      const bx = rx - 9;
      const by = ry - 9;
      const bw = 18;
      const bh = 18;
      ctx!.strokeStyle = 'rgba(255, 213, 79, 0.9)';
      [
        [bx, by, bx + 4, by], [bx + bw - 4, by, bx + bw, by],
        [bx, by, bx, by + 4], [bx + bw, by, bx + bw, by + 4],
        [bx, by + bh - 4, bx, by + bh], [bx + bw, by + bh - 4, bx + bw, by + bh],
        [bx, by + bh, bx + 4, by + bh], [bx + bw - 4, by + bh, bx + bw, by + bh]
      ].forEach(([x1, y1, x2, y2]) => {
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.stroke();
      });

      // Bottom Metadata bar
      ctx!.fillStyle = 'rgba(2, 5, 2, 0.82)';
      ctx!.fillRect(0, canvas.height - 15, canvas.width, 15);
      ctx!.fillStyle = '#00ff44';
      ctx!.font = '6.5px "JetBrains Mono", monospace';
      
      let peakHeat = 0.25;
      for (let i = 0; i < heat.current.length; i++) {
        if (heat.current[i] > peakHeat) {
          peakHeat = heat.current[i];
        }
      }
      const estTemp = Math.round(peakHeat * 380 + 200);

      ctx!.fillText(
        `SAT-07◆REC  [${targetCountryId || 'NO_LOCK'}]  TEMP:${estTemp}K`,
        4,
        canvas.height - 4
      );

      rafRef.current = requestAnimationFrame(renderLoop);
    }

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [feedMode, targetCountryId]);

  const handleTaskSat = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('Recon fail: No active territory lock-on identified inside tactical HUD.', 'WARNING');
      return;
    }
    useIntelligenceStore.getState().taskSatellite('SAT-07', targetCountryId);
    pushTerminalLine(`SAT-07 orbital recon array targeted on zone ${targetCountryId}. Calibration is operational.`, 'INFO');
  };

  const handleCaptureIntel = () => {
    audio.sfxKeyClick();
    if (!targetCountryId) {
      pushTerminalLine('Capture fail: Lock-on connection required.', 'WARNING');
      return;
    }
    audio.sfxRadarPing();
    pushTerminalLine(`Recon snapshots captured over ${targetCountryId}. High-resolution intel injected.`, 'SYSTEM');
  };

  return (
    <div className="flex flex-col gap-1 w-full border border-[#1a5c1a] p-1.5 bg-[#030603] rounded h-full justify-between">
      <div className="text-[8px] font-mono tracking-wider text-[#00ff44] uppercase flex justify-between px-0.5">
        <span>SATELLITE POV</span>
        <span className="text-[#ff2244] font-bold animate-pulse">◉ REC</span>
      </div>

      <canvas
        ref={canvasRef}
        width={192}
        height={148}
        className="w-full h-auto block select-none border border-[#0d2e0d]"
        style={{ background: '#000000', imageRendering: 'pixelated' }}
      />

      <div className="flex gap-1.5 mt-1">
        <button
          onClick={handleTaskSat}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center"
        >
          TASK SAT
        </button>
        <select
          value={feedMode}
          onChange={(e) => { audio.sfxKeyClick(); setFeedMode(e.target.value as any); }}
          className="feed-select rounded"
        >
          <option value="THERMAL">THERMAL</option>
          <option value="MOTION">MOTION</option>
          <option value="RADAR">RADAR</option>
        </select>
        <button
          onClick={handleCaptureIntel}
          className="feed-btn px-1 py-0.5 rounded flex-1 text-center"
        >
          CAPTURE INTEL
        </button>
      </div>
    </div>
  );
}
