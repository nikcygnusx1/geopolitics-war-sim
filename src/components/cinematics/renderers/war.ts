import { CinematicEvent } from '../types';

export function renderWarDeclaration(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  data: CinematicEvent['data'],
  frame: number
) {
  const sourceName = data.sourceCountry?.name || 'NATION A';
  const sourceFlag = data.sourceCountry?.flagEmoji || '⚔️';
  const targetName = data.targetCountry?.name || 'NATION B';
  const targetFlag = data.targetCountry?.flagEmoji || '⚔️';

  // Background: fade to dark charcoal
  ctx.fillStyle = 'rgba(2, 4, 2, 0.9)';
  ctx.fillRect(0, 0, width, height);

  // Background scanned pattern
  ctx.strokeStyle = 'rgba(255, 59, 78, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }

  // Draw military-grade diagonal slashes belt
  const beltWidth = Math.min(220, height * 0.28) * Math.min(1.0, progress * 4.0); // slide/expand width-wise
  const slope = -0.5; // diagonal slope
  const centerY = height / 2;

  // Let's draw a beautiful shaded red hazard diagonal belt
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-15 * Math.PI / 180); // tilt 15 degrees

  // Red backing belt
  ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.85, progress * 10)})`;
  ctx.fillRect(-width * 1.5, -beltWidth / 2, width * 3, beltWidth);

  // Yellow/Orange nested danger safety line
  ctx.fillStyle = `rgba(245, 158, 11, ${Math.min(0.9, progress * 8)})`;
  ctx.fillRect(-width * 1.5, -beltWidth / 2, width * 3, 4);
  ctx.fillRect(-width * 1.5, beltWidth / 2 - 4, width * 3, 4);

  // Render repeating hazard slashes on the belt
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 14;
  const spacing = 60;
  const tOffset = (frame * 1.5) % spacing;
  for (let x = -width * 1.5 - tOffset; x < width * 1.5; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, -beltWidth / 2);
    ctx.lineTo(x + 25, beltWidth / 2);
    ctx.stroke();
  }

  // Draw "WARNING: DIRECT COMBAT VERIFIED" on the belt
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.font = '900 13px "JetBrains Mono", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const warningText = '🚨 COMBAT ENGAGEMENT DIRECTIVE / WARNING STATE CRITICAL / HOSTILITIES VERIFIED 🚨';
  ctx.fillText(warningText, 0, 0);

  ctx.restore();

  // Draw Title Text & Sovereign Labels
  const textProgress = Math.min(1.0, Math.max(0, (progress - 0.15) * 1.5));
  ctx.save();
  ctx.globalAlpha = textProgress;

  // Stamped Warning Title
  ctx.fillStyle = '#ff2233';
  ctx.font = '950 36px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WAR DECLARED', width / 2, height / 2 - beltWidth - 40);

  // Underline
  ctx.strokeStyle = '#ff2233';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, height / 2 - beltWidth - 25);
  ctx.lineTo(width / 2 + 200, height / 2 - beltWidth - 25);
  ctx.stroke();

  // Nation Side A vs Nation Side B
  // Source Nation (Left/Top)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Chakra Petch", sans-serif';
  ctx.fillText(`${sourceFlag} ${sourceName.toUpperCase()}`, width / 2 - 80, height / 2 - 15);

  // Vs Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3b4e';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText('VS', width / 2, height / 2 + 5);

  // Target Nation (Right/Bottom)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px "Chakra Petch", sans-serif';
  ctx.fillText(`${targetName.toUpperCase()} ${targetFlag}`, width / 2 + 80, height / 2 + 25);

  // Tactical subtext and telemetry logs at the bottom
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8899a6';
  ctx.font = '600 10px "JetBrains Mono", monospace';

  const tick = Math.floor(frame / 6) % 4;
  const caret = tick === 0 ? '_' : '';
  ctx.fillText(`COMMAND STATUS: KINETIC ENGAGEMENT AUTHORIZED // PENDING RESOLUTION${caret}`, width / 2, height / 2 + beltWidth + 50);

  // Bottom telemetry columns
  ctx.fillStyle = 'rgba(255, 34, 51, 0.35)';
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillText(`SYS_LATENCY: 14MS // TARGETING_SOLUTION_SECURED: TRUE // RULES_OF_ENGAGEMENT: FULL_RETALIATION`, width / 2, height - 30);

  ctx.restore();
}
