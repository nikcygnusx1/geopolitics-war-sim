import { CinematicEvent } from '../types';

export function renderCoup(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  data: CinematicEvent['data'],
  frame: number
) {
  const targetCountry = data.targetCountry?.name || 'SOVEREIGN SYSTEM';
  const newLeader = data.leaderName || 'MILITARY JUNTA BOARD';
  const oldLeader = data.oldLeaderName || 'FORMER GOVERNMENT';

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Television screen noise / static lines
  const grainSize = 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let i = 0; i < 350; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    const rw = Math.random() * 4 + 1;
    const rh = Math.random() * 2 + 1;
    ctx.fillRect(rx, ry, rw, rh);
  }

  // Draw scrolling scanline bar
  const scanlineY = (frame * 6) % height;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, scanlineY, width, 18);

  // Horizontal screen tear/slice displacement offsets (glitch effect)
  if (Math.random() < 0.3) {
    const sliceY = Math.random() * height;
    const sliceH = Math.random() * 40 + 5;
    const offsetX = (Math.random() - 0.5) * 50;
    
    // Copy/displace a segment of canvas horizontally
    try {
      ctx.drawImage(ctx.canvas, 0, sliceY, width, sliceH, offsetX, sliceY, width, sliceH);
    } catch (e) {
      // safe fallback
    }
  }

  ctx.save();

  // Inverted Silhouette leader box (Center)
  const boxW = 160;
  const boxH = 200;
  const boxX = width / 2 - boxW / 2;
  const boxY = height / 2 - boxH / 2 - 30;

  // Frame Border
  ctx.strokeStyle = '#00ff44';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Draw diagonal lines crosshair background in the portrait box
  ctx.strokeStyle = 'rgba(0, 255, 68, 0.15)';
  ctx.beginPath();
  ctx.moveTo(boxX, boxY);
  ctx.lineTo(boxX + boxW, boxY + boxH);
  ctx.moveTo(boxX + boxW, boxY);
  ctx.lineTo(boxX, boxY + boxH);
  ctx.stroke();

  // Draw inverted silhouette
  // We draw a solid inverted background then black silhouette inside (regime seizure/censored)
  // Or vice versa depending on frame count (creates flickering inversion look)
  const isInverted = Math.floor(frame / 4) % 2 === 0;
  ctx.fillStyle = isInverted ? '#00ff44' : '#051405';
  ctx.fillRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

  // Draw head and shoulder silhouette
  ctx.fillStyle = isInverted ? '#000000' : '#00ff44';
  ctx.beginPath();
  // Head
  ctx.arc(width / 2, boxY + 75, 32, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.moveTo(width / 2 - 60, boxY + 185);
  ctx.quadraticCurveTo(width / 2 - 50, boxY + 115, width / 2 - 25, boxY + 110);
  ctx.lineTo(width / 2 + 25, boxY + 110);
  ctx.quadraticCurveTo(width / 2 + 50, boxY + 115, width / 2 + 60, boxY + 185);
  ctx.closePath();
  ctx.fill();

  // Glitched static label inside frame
  ctx.fillStyle = isInverted ? '#000000' : '#00ff44';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IDENT_CLASS: REDACTED', width / 2, boxY + boxH - 12);

  // Title Headers (Takeover indicators)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '950 24px "Chakra Petch", sans-serif';
  ctx.fillText('📡 OVERRIDE: REGIME TRANSITION 📡', width / 2, boxY - 50);

  ctx.fillStyle = '#00ff44';
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillText(`BROADCAST FREQUENCY OVERRUN // ${targetCountry.toUpperCase()}`, width / 2, boxY - 24);

  // Bottom Area: New Leader Reveal Text
  const revealProgress = Math.min(1.0, Math.max(0, (progress - 0.25) * 1.5));
  ctx.globalAlpha = revealProgress;

  ctx.fillStyle = '#ffffff';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.fillText(`PREVIOUS LEADERSHIP (${oldLeader.toUpperCase()}) REMOVED FROM POST`, width / 2, boxY + boxH + 34);

  // High hazard flashing red banner for New Regime
  ctx.fillStyle = '#ff2233';
  ctx.font = 'bold 18px "Chakra Petch", sans-serif';
  ctx.fillText(`NEW SOVEREIGN COMMANDER: ${newLeader.toUpperCase()}`, width / 2, boxY + boxH + 68);

  ctx.fillStyle = 'rgba(0, 255, 68, 0.45)';
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillText('🚨 STATUS: COMMAND REORGANIZATION COMPLETE // POPULAR ELECTIONS SUSPENDED // MARTIAL DECREE ON 🚨', width / 2, height - 25);

  ctx.restore();
}
