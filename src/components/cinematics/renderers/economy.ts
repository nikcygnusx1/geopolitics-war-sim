import { CinematicEvent } from '../types';

export function renderEconomicCollapse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  data: CinematicEvent['data'],
  frame: number
) {
  const countryName = data.targetCountry?.name || 'DOMESTIC ECONOMY';

  // Dark charcoal backdrop
  ctx.fillStyle = '#0a0203';
  ctx.fillRect(0, 0, width, height);

  // Background Grid Matrix
  ctx.strokeStyle = 'rgba(255, 34, 51, 0.04)';
  ctx.lineWidth = 1;
  const gridW = 40;
  for (let x = 0; x < width; x += gridW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridW) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Crashing Graph Line (plunges downwards)
  ctx.save();
  ctx.strokeStyle = '#ff2b3e';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff2b3e';
  ctx.shadowBlur = 12;

  const startX = width * 0.15;
  const endX = width * 0.85;
  const plotWidth = endX - startX;
  const graphY = height * 0.45;
  const graphHeight = height * 0.45;

  ctx.beginPath();
  // We feed a deterministic list of crash vertices
  const points = [
    { x: 0, y: 0.1 },
    { x: 0.15, y: 0.12 },
    { x: 0.28, y: 0.35 },
    { x: 0.4, y: 0.28 },
    { x: 0.52, y: 0.65 },
    { x: 0.61, y: 0.58 },
    { x: 0.72, y: 0.95 },
    { x: 0.85, y: 0.92 },
    { x: 1.0, y: 1.35 }, // plunges off bottom
  ];

  const currentMaxX = startX + plotWidth * Math.min(1.0, progress * 1.3);

  let isFirst = true;
  for (const pt of points) {
    const px = startX + pt.x * plotWidth;
    const py = graphY + pt.y * graphHeight * 0.6;

    if (px <= currentMaxX) {
      if (isFirst) {
        ctx.moveTo(px, py);
        isFirst = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // Glow points and data ticks
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff2b3e';
  for (const pt of points) {
    const px = startX + pt.x * plotWidth;
    const py = graphY + pt.y * graphHeight * 0.6;
    if (px <= currentMaxX) {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Draw Scrolling Panic Ticker (Header & Footer)
  const tickerItems = [
    'USD -74.5%', 'EUR DUMPED', 'BOND YIELD 980%', 'TREASURY DEPRECIATED',
    'FTSE COLLAPSED', 'RES_INDEX CRASHED', 'COMMODITY DEFAULT',
    'LIQUIDATION DECREE ON', 'OIL RES -48.2%'
  ];
  const itemStr = tickerItems.join('  ///  ');

  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, width, 25);
  ctx.fillRect(0, height - 25, width, 25);

  ctx.fillStyle = '#ff2b3e';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  
  // Slide offset
  const tickerX = -(frame * 1.5) % (width / 2);
  ctx.fillText(itemStr + '  ///  ' + itemStr, tickerX, 16);
  ctx.fillText(itemStr + '  ///  ' + itemStr, tickerX + (width / 2), 16);
  ctx.fillText(itemStr + '  ///  ' + itemStr, -tickerX - (width / 4), height - 9);

  // Distressed Rubber Stamp: "DEFAULTED"
  // Stamp slams down at progress 0.4
  if (progress >= 0.3) {
    ctx.save();
    const stampProgress = Math.min(1.0, (progress - 0.3) * 6.0);
    // Draw giant stamped text slightly rotated
    ctx.translate(width / 2, height / 2 - 30);
    ctx.rotate(-12 * Math.PI / 180);

    // Fade-in + slam scale
    const stampScale = 3.0 - (stampProgress * 2.0); // slam down from large
    ctx.scale(stampScale, stampScale);
    ctx.globalAlpha = Math.min(1.0, stampProgress * 1.5);

    // Stamp outline
    ctx.strokeStyle = '#ff1122';
    ctx.lineWidth = 6;
    ctx.strokeRect(-180, -35, 360, 70);

    // Inner outline
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-174, -29, 348, 58);

    // Stamp text
    ctx.fillStyle = '#ff1122';
    ctx.font = '950 48px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S O V E R E I G N   D E F A U L T', 0, 0);

    // Stamp texture overlay (adds distress speckles)
    ctx.fillStyle = '#0a0203'; // matches background to punch holes
    for (let s = 0; s < 40; s++) {
      const sx = Math.sin(s * 73) * 160;
      const sy = Math.cos(s * 29) * 25;
      const sr = Math.random() * 2.5 + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Panel details & descriptions
  ctx.save();
  const infoProgress = Math.min(1.0, Math.max(0, (progress - 0.5) * 2.0));
  ctx.globalAlpha = infoProgress;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px "Chakra Petch", sans-serif';
  ctx.fillText(`FINANCIAL INSOLVENCY RECORDED IN: ${countryName.toUpperCase()}`, width / 2, height / 2 + 65);

  ctx.fillStyle = '#8a99a6';
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.fillText('LIQUID RESERVES TO DEBT LIQUIDITY LIMIT EXCEEDED // EMERGENCY BAILOUT VOID', width / 2, height / 2 + 90);

  ctx.restore();
}
