import { CinematicEvent } from '../types';

export function renderNuclearLaunch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  data: CinematicEvent['data'],
  frame: number
) {
  // REQUIREMENT: the white flash must fill the entire screen for exactly 2 frames
  if (frame <= 2) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const srcName = data.sourceCountry?.name || 'UNKNOWN LAUNCH VECTOR';
  const tgtName = data.targetCountry?.name || 'TARGET AREA';

  // Red Screen background
  ctx.fillStyle = '#99000a';
  ctx.fillRect(0, 0, width, height);

  // Background radar sweeps
  ctx.save();
  ctx.translate(width / 2, height / 2);
  const rotationAngle = (frame * 1.5 * Math.PI) / 180;
  ctx.rotate(rotationAngle);

  // Glowing warning circle lines
  ctx.strokeStyle = '#ff3344';
  ctx.lineWidth = 1;
  for (let r = 80; r <= 320; r += 60) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crosshair spoke lines
  ctx.strokeStyle = '#ff3344';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-width, 0);
  ctx.lineTo(width, 0);
  ctx.moveTo(0, -height);
  ctx.lineTo(0, height);
  ctx.stroke();

  // Spinning fan blades (hazard symbol)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  for (let i = 0; i < 3; i++) {
    ctx.rotate((120 * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 180, -0.3, 0.3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Draw concentric target sonar lock circles on center width
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#00ff44'; // green lock line
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 90, rotationAngle, rotationAngle + Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 90, rotationAngle + Math.PI, rotationAngle + Math.PI * 1.5);
  ctx.stroke();

  // Display Countdown Status Text
  let countdownText = '03';
  if (progress > 0.45 && progress <= 0.7) countdownText = '02';
  if (progress > 0.7 && progress <= 0.9) countdownText = '01';
  if (progress > 0.9) countdownText = 'LAUNCH';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Countdown Number/Alert Box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(width / 2 - 140, height / 2 - 120, 280, 48);
  ctx.strokeStyle = '#00ff44';
  ctx.lineWidth = 2;
  ctx.strokeRect(width / 2 - 140, height / 2 - 120, 280, 48);

  ctx.fillStyle = '#00ff44';
  ctx.font = '900 18px "JetBrains Mono", monospace';
  ctx.fillText(countdownText === 'LAUNCH' ? '🔥 SILO OPEN - IN FLIGHT' : `🚀 COUNTDOWN T- ${countdownText}`, width / 2, height / 2 - 96);

  // Big warning header
  ctx.fillStyle = '#ffffff';
  ctx.font = '950 28px "Chakra Petch", sans-serif';
  ctx.fillText('☢️ BALISTIC NUCLEAR LAUNCH ☢️', width / 2, height / 2 - 160);

  // Subtitle/Source and Target details
  ctx.fillStyle = '#ff8899';
  ctx.font = '700 14px "JetBrains Mono", monospace';
  ctx.fillText(`VECTOR: ${srcName.toUpperCase()} ➔ TARGET: ${tgtName.toUpperCase()}`, width / 2, height / 2 + 130);

  // Flashing red warning banner at bottom
  const flashFreq = Math.floor(frame / 6) % 2 === 0;
  if (flashFreq) {
    ctx.fillStyle = '#ff3344';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('⚡ THERMONUCLEAR THREAT EXTREME // SEEK COMMAND COVER IMMEDIATELY ⚡', width / 2, height - 60);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText('⚡ EMERGENCY WARNING MESSAGE // SOVEREIGN RADAR CELL ENGAGED ⚡', width / 2, height - 60);
  }

  ctx.restore();
}
