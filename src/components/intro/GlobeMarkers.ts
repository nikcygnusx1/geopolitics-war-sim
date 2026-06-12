import * as THREE from 'three';

export interface GlobeMarker {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  animPhase: number;  // increments each frame for pulse animation
  type: 'conflict' | 'military' | 'nuclear' | 'economic';
}

export interface HotspotData {
  lat: number;
  lon: number;
  type: GlobeMarker['type'];
  name: string;      // Appears in briefing text
  severity: string;  // "RED ALERT" | "AMBER WARNING" | "MONITORING" | etc.
  phase: number;     // Which phase reveals this marker (1=conflicts, 2=military, etc.)
}

export const GLOBE_HOTSPOTS: HotspotData[] = [
  // PHASE 1 — CONFLICT ZONES
  { lat: 49.0,  lon:  32.0, type: 'conflict', name: 'EASTERN UKRAINE',   severity: 'RED ALERT',      phase: 1 },
  { lat: 23.5,  lon: 121.0, type: 'conflict', name: 'TAIWAN STRAIT',     severity: 'CRITICAL SHIELD', phase: 1 },
  { lat: 33.5,  lon:  36.3, type: 'conflict', name: 'LEVANT BASIN',      severity: 'RED ALERT',      phase: 1 },
  { lat: 33.0,  lon:  44.0, type: 'conflict', name: 'MESOPOTAMIA ARC',   severity: 'AMBER WARNING',  phase: 1 },
  { lat: 15.4,  lon:  44.2, type: 'conflict', name: 'YEMEN THEATER',     severity: 'ACTIVE COMBAT',  phase: 1 },
  { lat: 34.5,  lon:  69.2, type: 'conflict', name: 'CENTRAL ASIA NODE', severity: 'MONITORING',     phase: 1 },
  { lat: 37.5,  lon:  15.1, type: 'conflict', name: 'SAHEL CORRIDOR',    severity: 'AMBER WARNING',  phase: 1 },
  { lat: 12.4,  lon: 104.0, type: 'conflict', name: 'SOUTH CHINA SEA',   severity: 'ELEVATED',       phase: 1 },
  { lat: 38.0,  lon: 127.5, type: 'conflict', name: 'DMZ KOREA',         severity: 'DEPLOYING',      phase: 1 },

  // PHASE 2 — MILITARY BASES
  { lat: 21.4,  lon: 157.9, type: 'military', name: 'PACIFIC CMD HQ',    severity: 'OPERATIONAL',    phase: 2 },
  { lat: 50.9,  lon:   6.9, type: 'military', name: 'NATO NORTH HQ',     severity: 'ACTIVE',         phase: 2 },
  { lat: 56.3,  lon: 101.7, type: 'military', name: 'SIBERIAN COMMAND',  severity: 'ELEVATED',       phase: 2 },
  { lat: 30.7,  lon: 114.3, type: 'military', name: 'CCSA EASTERN CMD',  severity: 'POSTURING',      phase: 2 },
  { lat: 24.9,  lon:  67.0, type: 'military', name: 'ARABIAN SEA GROUP', severity: 'CARRIER OPS',    phase: 2 },
  { lat: -6.4,  lon: 106.8, type: 'military', name: 'INDIAN OCEAN CMD',  severity: 'PATROL',         phase: 2 },
  { lat: 36.8,  lon:  10.2, type: 'military', name: 'MED NAVAL GROUP',   severity: 'ACTIVE',         phase: 2 },

  // PHASE 3 — NUCLEAR SITES
  { lat: 55.7,  lon:  37.6, type: 'nuclear',  name: 'MOSCOW-12 SILO',    severity: 'LAUNCH READY',   phase: 3 },
  { lat: 39.9,  lon: 116.4, type: 'nuclear',  name: 'BEIJING COMPLEX',   severity: 'HARDENED',       phase: 3 },
  { lat: 40.4,  lon: -74.0, type: 'nuclear',  name: 'CHEYENNE NODE',     severity: 'DEFCON 4',       phase: 3 },
  { lat: 33.6,  lon:  73.1, type: 'nuclear',  name: 'KAHUTA COMPLEX',    severity: 'ACTIVE',         phase: 3 },
  { lat: 30.1,  lon:  31.2, type: 'nuclear',  name: 'DIMONA SITE',       severity: 'CLASSIFIED',     phase: 3 },
  { lat: 35.7,  lon:  51.4, type: 'nuclear',  name: 'NATANZ FACILITY',   severity: 'ELEVATED',       phase: 3 },
  { lat: 39.0,  lon: 125.8, type: 'nuclear',  name: 'YONGBYON REACTOR',  severity: 'ACTIVE PROGRAM', phase: 3 },

  // PHASE 4 — ECONOMIC CHOKEPOINTS
  { lat: 26.5,  lon:  56.3, type: 'economic', name: 'STRAIT OF HORMUZ',  severity: 'CONTESTED',      phase: 4 },
  { lat:  1.3,  lon: 103.8, type: 'economic', name: 'STRAIT OF MALACCA', severity: 'HIGH TRAFFIC',   phase: 4 },
  { lat: 12.5,  lon:  43.2, type: 'economic', name: 'BAB AL-MANDAB',     severity: 'DISRUPTED',      phase: 4 },
  { lat: 31.0,  lon:  32.3, type: 'economic', name: 'SUEZ CORRIDOR',     severity: 'REROUTED',       phase: 4 },
  { lat: 50.0,  lon:   1.5, type: 'economic', name: 'CHANNEL SHIPPING',  severity: 'NOMINAL',        phase: 4 },
  { lat: 37.4,  lon: -122.1,type: 'economic', name: 'SILICON VALLEY',    severity: 'STRATEGIC',      phase: 4 },
];

export function latLonToVec3(lat: number, lon: number, radius = 1.02): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
     (radius * Math.cos(phi)),
     (radius * Math.sin(phi) * Math.sin(theta))
  );
}

export function createGlobeMarker(
  lat: number,
  lon: number,
  type: GlobeMarker['type'],
  scene: THREE.Object3D
): GlobeMarker {
  const SIZE = 128;  // canvas resolution
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,  // CRITICAL: glows on dark background
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);

  // Scale: conflict = larger, nuclear = medium, economic = smaller
  const SCALES = { conflict: 0.09, military: 0.06, nuclear: 0.08, economic: 0.05 };
  const s = SCALES[type];
  sprite.scale.set(s, s, s);

  sprite.position.copy(latLonToVec3(lat, lon));
  sprite.visible = false;  // Hidden until its phase activates
  scene.add(sprite);

  return { sprite, canvas, ctx, texture, animPhase: 0, type };
}

export function updateMarkerCanvas(marker: GlobeMarker) {
  const { ctx, canvas, type, animPhase } = marker;
  const S = canvas.width;
  const cx = S / 2, cy = S / 2;

  ctx.clearRect(0, 0, S, S);

  const COLORS = {
    conflict: { r: 255, g: 59,  b: 78  },
    military: { r: 245, g: 166, b: 35  },
    nuclear:  { r: 0,   g: 207, b: 255 },
    economic: { r: 57,  g: 217, b: 138 },
  };
  const c = COLORS[type];
  const colorStr = `rgb(${c.r},${c.g},${c.b})`;

  // === PULSE RING ===
  // Outer ring: pulses outward and fades
  const pulseProgress = (animPhase % 90) / 90;  // 0→1 every 90 frames
  const outerRadius = 14 + pulseProgress * 38;  // expands 14px → 52px
  const outerAlpha = (1 - pulseProgress) * 0.7;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${outerAlpha})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner ring: steady, semi-transparent
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.8)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = colorStr;
  ctx.fill();

  // Glow: radial gradient on center
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
  grd.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.25)`);
  grd.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Military type gets a diamond shape instead of ring
  if (type === 'military') {
    const d = 10;
    ctx.beginPath();
    ctx.moveTo(cx,   cy-d);
    ctx.lineTo(cx+d, cy  );
    ctx.lineTo(cx,   cy+d);
    ctx.lineTo(cx-d, cy  );
    ctx.closePath();
    ctx.strokeStyle = `rgba(245,166,35,0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Nuclear type gets radiating lines
  if (type === 'nuclear') {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const innerR = 8, outerR = 20;
      const fadeAlpha = 0.5 * Math.sin(animPhase * 0.05 + i * 0.5) + 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.strokeStyle = `rgba(0,207,255,${fadeAlpha * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  marker.texture.needsUpdate = true;
  marker.animPhase++;
}
