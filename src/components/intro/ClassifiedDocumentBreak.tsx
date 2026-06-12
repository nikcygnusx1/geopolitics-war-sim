export function playClassifiedDocumentBreak(onComplete: () => void): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    width: 100vw; height: 100vh; pointer-events: none;
  `;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const startTime = performance.now();
  const DURATION = 1800; // ms

  // === STAMP DEFINITIONS ===
  // Each stamp: text, x (0-1), y (0-1), rotation (deg), scale
  const STAMPS = [
    { text: 'TOP SECRET',     x: 0.18, y: 0.22, rot: -12, s: 1.2 },
    { text: 'CLASSIFIED',     x: 0.78, y: 0.55, rot:  8,  s: 1.0 },
    { text: 'EYES ONLY',      x: 0.48, y: 0.72, rot: -5,  s: 0.9 },
    { text: 'SCI // NOFORN',  x: 0.25, y: 0.65, rot:  15, s: 0.8 },
    { text: 'COSMIC SECRET',  x: 0.72, y: 0.28, rot: -9,  s: 1.1 },
  ];

  // Stamp state: each stamp has an individual emergence time + fly-off direction
  const stampStates = STAMPS.map((s, i) => ({
    ...s,
    emergeAt:   0.05 + i * 0.06,  // 0→1 normalized time
    flyOffAt:   0.45 + i * 0.04,
    flyDirX: (s.x - 0.5) * 3 + (Math.random() - 0.5) * 2,  // fly away from center
    flyDirY: (s.y - 0.5) * 3 + (Math.random() - 0.5) * 2,
    crackSpread: 0,                // grows 0→1 for crack lines from this stamp
  }));

  // === CRACK LINE GENERATOR ===
  // Each stamp generates 3-4 crack lines radiating outward
  interface CrackLine {
    ox: number; oy: number;  // origin (px)
    pts: Array<{x: number; y: number}>;  // crack path points
    progress: number;        // 0→1 draw progress
    growSpeed: number;
  }
  const crackLines: CrackLine[] = [];

  function generateCracksFrom(cx: number, cy: number): CrackLine[] {
    const lines: CrackLine[] = [];
    const numCracks = 3 + Math.floor(Math.random() * 2); // 3-4 cracks per stamp
    for (let i = 0; i < numCracks; i++) {
      const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.5;
      const length = 60 + Math.random() * 120;
      const pts: Array<{x: number; y: number}> = [{ x: cx, y: cy }];

      // Generate jagged crack path (3-6 segments)
      let curX = cx, curY = cy;
      const segments = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < segments; s++) {
        const segLen = (length / segments) * (0.7 + Math.random() * 0.6);
        const jitter = (Math.random() - 0.5) * 0.4; // angular jitter
        const segAngle = angle + jitter * Math.PI;
        curX += Math.cos(segAngle) * segLen;
        curY += Math.sin(segAngle) * segLen;
        pts.push({ x: curX, y: curY });
      }
      lines.push({
        ox: cx, oy: cy,
        pts,
        progress: 0,
        growSpeed: 0.04 + Math.random() * 0.03,
      });
    }
    return lines;
  }

  let cracksInitialized = false;

  function drawFrame(now: number) {
    const t = Math.min((now - startTime) / DURATION, 1);
    ctx.clearRect(0, 0, W, H);

    // === BACKGROUND: Phosphor green fade, then black as transition completes ===
    const bgAlpha = t < 0.7 ? 0.6 : 0.6 * (1 - (t - 0.7) / 0.3);
    ctx.fillStyle = `rgba(0, 20, 5, ${bgAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Subtle scanline overlay
    if (t < 0.8) {
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, y, W, 1);
      }
    }

    // === STAMPS ===
    stampStates.forEach((stamp) => {
      if (t < stamp.emergeAt) return;

      // Emerge: scale 0→1 over 0.08 normalized time
      const emergeProgress = Math.min((t - stamp.emergeAt) / 0.08, 1);
      const flyProgress = t >= stamp.flyOffAt
        ? Math.min((t - stamp.flyOffAt) / 0.25, 1)
        : 0;

      if (flyProgress === 0 && !cracksInitialized && emergeProgress > 0.9) {
        // Generate cracks when stamp is fully revealed
        const px = stamp.x * W, py = stamp.y * H;
        crackLines.push(...generateCracksFrom(px, py));
      }

      const px = stamp.x * W + flyProgress * stamp.flyDirX * W * 0.4;
      const py = stamp.y * H + flyProgress * stamp.flyDirY * H * 0.4;
      const alpha = emergeProgress * (1 - flyProgress * flyProgress);
      const stampScale = emergeProgress * stamp.s * (1 + flyProgress * 0.3);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((stamp.rot * Math.PI) / 180);
      ctx.globalAlpha = alpha;

      // Stamp border rectangle
      const textWidth = stamp.text.length * 14 * stampScale;
      const stampW = textWidth + 20 * stampScale;
      const stampH = 30 * stampScale;
      ctx.strokeStyle = `rgba(255, 59, 78, 0.9)`;
      ctx.lineWidth = 2.5 * stampScale;
      ctx.strokeRect(-stampW/2, -stampH/2, stampW, stampH);

      // Inner border (double border like real stamps)
      ctx.lineWidth = 0.8 * stampScale;
      ctx.strokeRect(-stampW/2 + 3*stampScale, -stampH/2 + 3*stampScale,
                     stampW - 6*stampScale, stampH - 6*stampScale);

      // Stamp text
      ctx.font = `700 ${13 * stampScale}px "Chakra Petch", "Share Tech Mono", monospace`;
      ctx.fillStyle = `rgba(255, 59, 78, 0.85)`;
      ctx.textAlign = 'center';
      
      // canvas context may not fully support letterSpacing property in all browsers natively, but we can set it
      try {
        (ctx as any).letterSpacing = `${0.2 * stampScale}em`;
      } catch (err) {}
      
      ctx.fillText(stamp.text, 0, 5 * stampScale);

      ctx.restore();
    });

    cracksInitialized = true;

    // === CRACK LINES ===
    if (t > 0.3) {
      // Grow crack lines
      crackLines.forEach(crack => {
        if (crack.progress < 1) {
          crack.progress = Math.min(crack.progress + crack.growSpeed, 1);
        }
      });

      crackLines.forEach(crack => {
        if (crack.progress <= 0) return;
        const alpha = t < 0.7 ? crack.progress * 0.8 : crack.progress * 0.8 * (1 - (t-0.7)/0.3);
        ctx.strokeStyle = `rgba(255, 59, 78, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();

        const totalPts = crack.pts.length;
        const visiblePts = Math.max(2, Math.floor(crack.progress * totalPts));

        ctx.moveTo(crack.pts[0].x, crack.pts[0].y);
        for (let i = 1; i < visiblePts; i++) {
          ctx.lineTo(crack.pts[i].x, crack.pts[i].y);
        }
        // Interpolate last partial segment
        if (visiblePts < totalPts) {
          const segProgress = crack.progress * totalPts - Math.floor(crack.progress * totalPts);
          const p0 = crack.pts[visiblePts - 1];
          const p1 = crack.pts[visiblePts];
          ctx.lineTo(
            p0.x + (p1.x - p0.x) * segProgress,
            p0.y + (p1.y - p0.y) * segProgress
          );
        }
        ctx.stroke();
      });
    }

    // === FINAL REVEAL: "CLEARANCE CONFIRMED" flash at T+0.65 ===
    if (t > 0.65 && t < 0.85) {
      const flashProgress = (t - 0.65) / 0.2;
      const flashAlpha = Math.sin(flashProgress * Math.PI);

      ctx.fillStyle = `rgba(0, 229, 200, ${flashAlpha * 0.12})`;
      ctx.fillRect(0, 0, W, H);

      ctx.font = `700 11px "Chakra Petch", monospace`;
      ctx.fillStyle = `rgba(0, 229, 200, ${flashAlpha})`;
      ctx.textAlign = 'center';
      try {
        (ctx as any).letterSpacing = '0.3em';
      } catch (err) {}
      ctx.fillText('CLEARANCE: CONFIRMED', W/2, H/2);
      ctx.fillText('ENTERING SOVEREIGN COMMAND ARCHITECTURE', W/2, H/2 + 22);
    }

    // === CRT SCANLINE WIPE: final reveal of HUD underneath ===
    if (t > 0.82) {
      const wipeProgress = (t - 0.82) / 0.18;
      const revealY = wipeProgress * H * 1.05;

      // Scanlines on revealed portion
      for (let y = 0; y < revealY; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(0, y, W, 1);
      }

      // Bright leading edge
      const edgeAlpha = 1 - wipeProgress * 0.7;
      ctx.fillStyle = `rgba(0, 229, 200, ${edgeAlpha})`;
      ctx.fillRect(0, revealY - 2, W, 3);
      ctx.fillRect(0, revealY - 2, W, 3);
    }

    if (t < 1) {
      requestAnimationFrame(drawFrame);
    } else {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      onComplete();
    }
  }

  requestAnimationFrame(drawFrame);
}
export default playClassifiedDocumentBreak;
