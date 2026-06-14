import { LeaderPersonality } from '../types';

function createSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
    h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Procedural geometric portrait generator using HTML5 Canvas 2D.
 * Output is exactly 64x64 pixels.
 * Deterministic from seed, styled uniquely by personality.
 */
export function generateLeaderPortrait(personality: LeaderPersonality, seed: string): string {
  if (typeof document === 'undefined') {
    // Return empty or minimum mock if run in non-browser env (e.g. server-side/build testing)
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rand = createSeededRandom(seed);

  // 1. DETERMINE THEME & PALETTE BY PERSONALITY
  let bgGradientStart = '#1e1b4b'; // dark blue
  let bgGradientEnd = '#0f172a';   // slate-900
  let skinColor = '#ffdbac';       // default peach
  let hairColor = '#2b2b2b';       // dark brown
  let accentColor = '#3b82f6';     // blue

  const skinTones = ['#e0ac69', '#f1c27d', '#ffdbac', '#8d5524', '#c68642', '#e5a073'];
  skinColor = skinTones[Math.floor(rand() * skinTones.length)];

  const hairTones = ['#2b2b2b', '#1a0f0f', '#8c301b', '#d9a05b', '#5c4033', '#111827', '#ffffff'];
  hairColor = hairTones[Math.floor(rand() * hairTones.length)];

  switch (personality) {
    case LeaderPersonality.HAWK:
      bgGradientStart = '#450a0a'; // dark red
      bgGradientEnd = '#0f172a';
      accentColor = '#ef4444';     // vivid red
      break;
    case LeaderPersonality.DOVE:
      bgGradientStart = '#064e3b'; // dark emerald
      bgGradientEnd = '#0f172a';
      accentColor = '#10b981';     // green
      break;
    case LeaderPersonality.PRAGMATIST:
      bgGradientStart = '#111827'; // slate gray
      bgGradientEnd = '#1f2937';
      accentColor = '#6b7280';     // neutral gray
      break;
    case LeaderPersonality.IDEOLOGUE:
      bgGradientStart = '#1e3a8a'; // royal blue
      bgGradientEnd = '#78350f';   // amber/gold
      accentColor = '#3b82f6';
      break;
    case LeaderPersonality.UNPREDICTABLE:
      // Wild neon contrast background
      const colors = ['#701a75', '#4c1d95', '#022c22', '#180018', '#312e81', '#1c1917'];
      bgGradientStart = colors[Math.floor(rand() * colors.length)];
      bgGradientEnd = '#090514';
      accentColor = '#f43f5e'; // magenta
      break;
  }

  // Draw background
  const bgGrad = ctx.createLinearGradient(0, 0, 64, 64);
  bgGrad.addColorStop(0, bgGradientStart);
  bgGrad.addColorStop(1, bgGradientEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 64, 64);

  // Subtle border / geometric grid overlay for dossier military feel
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.25;
  ctx.strokeRect(2, 2, 60, 60);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(64, 4);
  ctx.moveTo(4, 0);
  ctx.lineTo(4, 64);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // 2. DRAW CHEST / SUIT (Geometric trapezoid)
  ctx.fillStyle = rand() > 0.5 ? '#1f2937' : '#111827'; // Dark suit
  ctx.beginPath();
  ctx.moveTo(12, 64);
  ctx.lineTo(18, 50);
  ctx.lineTo(46, 50);
  ctx.lineTo(52, 64);
  ctx.closePath();
  ctx.fill();

  // Draw Tie / Accent
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(30, 50);
  ctx.lineTo(34, 50);
  ctx.lineTo(35, 62);
  ctx.lineTo(32, 64);
  ctx.lineTo(29, 62);
  ctx.closePath();
  ctx.fill();

  // 3. DRAW INFRASTRUCTURE — HEAD / NECK (Oval head)
  // Neck
  ctx.fillStyle = skinColor;
  ctx.fillRect(27, 44, 10, 8);

  // Oval Face center (32, 30)
  const faceX = 32;
  const faceY = 28;
  const faceRx = 14;
  const faceRy = 18;

  ctx.beginPath();
  ctx.ellipse(faceX, faceY, faceRx, faceRy, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Geometric Shadow/Contrast on half of the face
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.ellipse(faceX, faceY, faceRx, faceRy, 0, 1.5 * Math.PI, 0.5 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 4. DRAW HAIR (Geometric shapes depending on personality)
  ctx.fillStyle = hairColor;
  switch (personality) {
    case LeaderPersonality.HAWK: {
      // Angular spiky/military severe hair
      ctx.beginPath();
      ctx.moveTo(32 - 16, 28 - 6);
      ctx.lineTo(32, 28 - 22); // sharp spike top
      ctx.lineTo(32 + 16, 28 - 6);
      ctx.lineTo(32 + 15, 28 + 2);
      ctx.lineTo(32 + 10, 28 - 14);
      ctx.lineTo(32 - 10, 28 - 14);
      ctx.lineTo(32 - 15, 28 + 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case LeaderPersonality.DOVE: {
      // Fluffy rounded/soft circular hair lobes
      ctx.beginPath();
      ctx.arc(32 - 10, 28 - 10, 8, 0, 2 * Math.PI);
      ctx.arc(32 + 10, 28 - 10, 8, 0, 2 * Math.PI);
      ctx.arc(32, 28 - 14, 9, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
    case LeaderPersonality.IDEOLOGUE: {
      // Symmetrical block helmet hair
      ctx.fillRect(17, 10, 30, 12);
      ctx.fillRect(15, 14, 4, 16);
      ctx.fillRect(45, 14, 4, 16);
      break;
    }
    case LeaderPersonality.PRAGMATIST: {
      // Clean side-part crop (asymmetric half hair)
      ctx.beginPath();
      ctx.moveTo(17, 24);
      ctx.lineTo(19, 14);
      ctx.lineTo(30, 11);
      ctx.lineTo(46, 15);
      ctx.lineTo(47, 26);
      ctx.lineTo(44, 26);
      ctx.lineTo(42, 17);
      ctx.lineTo(30, 16);
      ctx.lineTo(18, 22);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case LeaderPersonality.UNPREDICTABLE: {
      // Asymmetric wild shapes / points
      ctx.beginPath();
      ctx.moveTo(15, 22);
      ctx.lineTo(24, 7);
      ctx.lineTo(35, 18);
      ctx.lineTo(48, 5);
      ctx.lineTo(50, 28);
      ctx.lineTo(43, 20);
      ctx.lineTo(30, 24);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  // 5. DRAW FACIAL FEATURES (Eyes, Eyebrows, Mouth)
  // Base Eye Positions (Symmetric baseline)
  const eyeY = 26;
  const leftEyeX = 26;
  const rightEyeX = 38;

  // Eyebrow and eye styles
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5;

  switch (personality) {
    case LeaderPersonality.HAWK: {
      // Angry slanted inner brows \ /
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 3, eyeY - 4);
      ctx.lineTo(leftEyeX + 3, eyeY - 1);
      ctx.moveTo(rightEyeX + 3, eyeY - 4);
      ctx.lineTo(rightEyeX - 3, eyeY - 1);
      ctx.stroke();

      // Sharp squint slits
      ctx.fillStyle = '#000000';
      ctx.fillRect(leftEyeX - 2.5, eyeY - 1, 5, 1.5);
      ctx.fillRect(rightEyeX - 2.5, eyeY - 1, 5, 1.5);

      // Tight grimacing neutral-down mouth
      ctx.strokeStyle = '#2d0000';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(27, 39);
      ctx.lineTo(37, 39);
      ctx.stroke();
      break;
    }
    case LeaderPersonality.DOVE: {
      // Soft gentle high arched brows curve
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 2, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY - 2, 3, Math.PI, 0);
      ctx.stroke();

      // Clear circular soft pupils
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 1.5, 0, 2 * Math.PI);
      ctx.arc(rightEyeX, eyeY, 1.5, 0, 2 * Math.PI);
      ctx.fill();

      // Soft happy curved mouth smile
      ctx.strokeStyle = '#4a0404';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(32, 35, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    }
    case LeaderPersonality.PRAGMATIST: {
      // Flat straight professional brows
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 3, eyeY - 3);
      ctx.lineTo(leftEyeX + 3, eyeY - 3);
      ctx.moveTo(rightEyeX - 3, eyeY - 3);
      ctx.lineTo(rightEyeX + 3, eyeY - 3);
      ctx.stroke();

      // Simple stable dark eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 1.2, 0, 2 * Math.PI);
      ctx.arc(rightEyeX, eyeY, 1.2, 0, 2 * Math.PI);
      ctx.fill();

      // Flat straight professional expression line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(28, 38);
      ctx.lineTo(36, 38);
      ctx.stroke();
      break;
    }
    case LeaderPersonality.IDEOLOGUE: {
      // Symmetry, Stern, thick symmetric square glasses or serious look
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 3, eyeY - 4);
      ctx.lineTo(leftEyeX + 3, eyeY - 4);
      ctx.moveTo(rightEyeX - 3, eyeY - 4);
      ctx.lineTo(rightEyeX + 3, eyeY - 4);
      ctx.stroke();

      // Stern square-ish glasses or look
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(leftEyeX - 3.5, eyeY - 2.5, 7, 5);
      ctx.strokeRect(rightEyeX - 3.5, eyeY - 2.5, 7, 5);
      ctx.beginPath();
      ctx.moveTo(leftEyeX + 3.5, eyeY);
      ctx.lineTo(rightEyeX - 3.5, eyeY);
      ctx.stroke();

      // Serious heavy flat mouth bar
      ctx.fillStyle = '#0f0505';
      ctx.fillRect(26, 37, 12, 2.5);
      break;
    }
    case LeaderPersonality.UNPREDICTABLE: {
      // Highly asymmetric eyes/brows (one high angle brow, one flat low brow)
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 3, eyeY - 5);
      ctx.lineTo(leftEyeX + 3, eyeY - 2); // tilted down
      ctx.moveTo(rightEyeX - 3, eyeY - 1);
      ctx.lineTo(rightEyeX + 3, eyeY - 5); // raised high up!
      ctx.stroke();

      // Asymmetric pupil coordinates/different sizes!
      ctx.fillStyle = '#ea580c'; // glowing orange eccentric eyes
      ctx.beginPath();
      ctx.arc(leftEyeX - 1, eyeY - 1, 2.2, 0, 2 * Math.PI); // wider
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(rightEyeX + 1, eyeY + 1, 1.2, 0, 2 * Math.PI); // smaller squint
      ctx.fill();

      // Crooked / wavy or offset side-mouth
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(25, 36);
      ctx.bezierCurveTo(28, 41, 33, 34, 38, 39);
      ctx.stroke();
      break;
    }
  }

  return canvas.toDataURL('image/png');
}
