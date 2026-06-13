import { CinematicEvent } from '../types';

export function renderPeaceAgreement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  data: CinematicEvent['data'],
  frame: number
) {
  const sourceName = data.sourceCountry?.name || 'NATION A';
  const sourceFlag = data.sourceCountry?.flagEmoji || '🕊️';
  const targetName = data.targetCountry?.name || 'NATION B';
  const targetFlag = data.targetCountry?.flagEmoji || '🕊️';

  // Soft Teal Wash background gradient
  const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.7);
  grad.addColorStop(0, '#0a2e2d'); // core slate teal
  grad.addColorStop(1, '#020d0d'); // dark off-black teal edge
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Draw floating zen particle orbs (slow rising)
  ctx.save();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
  for (let s = 0; s < 15; s++) {
    const pOffset = (s * 41 + frame * 0.4) % height;
    const px = (s * 87 + Math.sin(frame * 0.01 + s) * 20) % width;
    const py = height - pOffset;
    const radius = 1.5 + (s % 3) * 1.5;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Decorative laurels/lines
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const easeInAlpha = Math.min(1.0, progress * 4); // fast fade-in, long hold
  const easeOutAlpha = Math.min(1.0, (1.0 - progress) * 4); // smooth fade-out
  ctx.globalAlpha = Math.min(easeInAlpha, easeOutAlpha);

  // Ceasefire Title Banner
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ffcc';
  ctx.font = '950 28px "Chakra Petch", sans-serif';
  ctx.fillText('🕊️ CEASEFIRE AGREEMENT RATIFIED 🕊️', width / 2, height / 2 - 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText('SOVEREIGN ACCORD UNDER GLOBAL DIPLOMATIC MONITORING', width / 2, height / 2 - 80);

  // Separate line
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 160, height / 2 - 64);
  ctx.lineTo(width / 2 + 160, height / 2 - 64);
  ctx.stroke();

  // Nation flags and names Side-by-Side
  // Left Flag Card
  ctx.fillStyle = 'rgba(3, 20, 20, 0.6)';
  ctx.fillRect(width / 2 - 250, height / 2 - 30, 200, 90);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(width / 2 - 250, height / 2 - 30, 200, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${sourceFlag}  ${sourceName.toUpperCase()}`, width / 2 - 150, height / 2 + 12);
  ctx.font = '500 10px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#8ab3b3';
  ctx.fillText('CO-SIGNATORY SECTOR', width / 2 - 150, height / 2 + 35);

  // Link icon or text
  ctx.fillStyle = '#00ffcc';
  ctx.font = '900 16px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('◀ ✦ ACCORD ✦ ▶', width / 2, height / 2 + 20);

  // Right Flag Card
  ctx.fillStyle = 'rgba(3, 20, 20, 0.6)';
  ctx.fillRect(width / 2 + 50, height / 2 - 30, 200, 90);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
  ctx.strokeRect(width / 2 + 50, height / 2 - 30, 200, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px "Chakra Petch", sans-serif';
  ctx.fillText(`${targetName.toUpperCase()}  ${targetFlag}`, width / 2 + 150, height / 2 + 12);
  ctx.font = '500 10px "JetBrains Mono", sans-serif';
  ctx.fillStyle = '#8ab3b3';
  ctx.fillText('CO-SIGNATORY SECTOR', width / 2 + 150, height / 2 + 35);

  // Secondary description
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 500 11px "JetBrains Mono", monospace';
  ctx.fillText('Borders locked. Sanctions minimized. Mutual diplomatic corridors active.', width / 2, height / 2 + 105);

  ctx.restore();
}
