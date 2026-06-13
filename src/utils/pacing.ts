import { PacingPreset } from '../types';

/**
 * Dampens any negative opinion delta by a factor of 5 and applies the pacing preset's escalation damper.
 */
export function dampenOpinionDelta(delta: number, preset?: PacingPreset): number {
  if (delta < 0) {
    const baseDampened = delta / 5.0;
    const damper = preset ? preset.escalationDamper : 1.0;
    return baseDampened * damper;
  }
  return delta;
}
