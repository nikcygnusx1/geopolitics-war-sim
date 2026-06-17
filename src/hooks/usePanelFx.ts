import { useFxStore, FxEvent, FxEventType } from '../store/fxStore';

export interface PanelFxState {
  isActive: boolean;
  activeSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC' | null;
  borderColor: string;
  borderIntensity: number;
  backgroundTint: string;
  isFlickering: boolean;
  isGlitching: boolean;
  pulseSpeed: string;
  noiseOpacity: number;
  activeEvent: FxEvent | null;
  eventLabel: string;
}

const SEVERITY_VALUE: Record<string, number> = {
  CATASTROPHIC: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const EVENT_LABELS: Record<FxEventType, string> = {
  NUCLEAR_DETONATION: '☢ NUCLEAR DETONATION',
  MISSILE_LAUNCH: '🚀 MISSILE AWAY',
  MISSILE_INTERCEPT: '🛰 MISSILE INTERCEPTED',
  COUP_SUCCESS: '✊ COUP SUCCESSFUL',
  COUP_ATTEMPT_FAILED: '⚡ COUP ATTEMPT FAILED',
  REGIME_CHANGE: '🔄 REGIME CHANGE',
  CEASEFIRE_SIGNED: '🕊 CEASEFIRE SIGNED',
  PEACE_TREATY_RATIFIED: '📜 PEACE TREATY RATIFIED',
  WAR_DECLARED: '⚔ WAR DECLARED',
  ALLIANCE_FORMED: '🤝 ALLIANCE FORMED',
  ALLIANCE_BROKEN: '💔 ALLIANCE BROKEN',
  SANCTIONS_ESCALATION: '🔒 SANCTIONS SCALED',
  MARKET_CRASH: '📉 RED SUNDAY CRASH',
  ECONOMIC_COLLAPSE: '🏚 ECONOMIC COLLAPSE',
  CYBER_BLACKOUT: '💀 CYBER BLACKOUT',
  CYBER_ATTACK: '⚠ INTRUSION DETECTED',
  UN_RESOLUTION_PASSED: '🌐 UN RES PASSED',
  UN_VETO_CAST: '⛔ UN VETO CAST',
  DEFCON_ESCALATION: '🔴 DEFCON ESCALATION',
  DEFCON_DEESCALATION: '🟢 DEFCON DEESCALATION',
  PERSONA_PROMOTED: '🎖 CLASS PROMOTION',
  PERSONA_DEMOTED: '🔻 CLASS DEMOTION',
  SAT_DESTROYED: '☄ SAT COLLISION',
  HAARP_ACTIVATED: '⚡ HAARP DISCHARGE',
  BLACK_MARKET_BUST: '👮 SYN BUST',
  NUCLEAR_DETERRENCE_ACHIEVED: '🛡 ATOMIC SHIELD',
  OPERATIVE_BURNED: '🔥 INTEL DEPLETED',
  REGIME_PRESSURE_CRITICAL: '⚖ PRESS CRITICAL',
};

export function usePanelFx(panelId: string, relevantFxTypes: FxEventType[]): PanelFxState {
  const activeFx = useFxStore((state) => state.activeFx);

  // Filter for matching unconsumed FX
  const matchingFx = activeFx.filter(
    (fx) => !fx.consumed && relevantFxTypes.includes(fx.type)
  );

  if (matchingFx.length === 0) {
    return {
      isActive: false,
      activeSeverity: null,
      borderColor: '',
      borderIntensity: 0,
      backgroundTint: '',
      isFlickering: false,
      isGlitching: false,
      pulseSpeed: '1s',
      noiseOpacity: 0,
      activeEvent: null,
      eventLabel: '',
    };
  }

  // Find the highest severity event
  let activeEvent = matchingFx[0];
  matchingFx.forEach((fx) => {
    const activeVal = SEVERITY_VALUE[activeEvent.severity] || 0;
    const currentVal = SEVERITY_VALUE[fx.severity] || 0;
    if (currentVal > activeVal) {
      activeEvent = fx;
    }
  });

  const severity = activeEvent.severity;
  let borderColor = '#00ff44';
  let borderIntensity = 0.25;
  let backgroundTint = 'rgba(0,255,68,0.03)';
  let isFlickering = false;
  let pulseSpeed = '2.5s';
  let noiseOpacity = 0;

  if (severity === 'CATASTROPHIC') {
    borderColor = '#ff0000';
    borderIntensity = 1.0;
    backgroundTint = 'rgba(255,0,0,0.06)';
    isFlickering = true;
    pulseSpeed = '0.3s';
    noiseOpacity = 0.12;
  } else if (severity === 'HIGH') {
    borderColor = '#ff6600';
    borderIntensity = 0.75;
    backgroundTint = 'rgba(255,80,0,0.05)';
    isFlickering = true;
    pulseSpeed = '0.6s';
    noiseOpacity = 0.08;
  } else if (severity === 'MEDIUM') {
    borderColor = '#ffcc00';
    borderIntensity = 0.5;
    backgroundTint = 'rgba(255,180,0,0.04)';
    isFlickering = false;
    pulseSpeed = '1.2s';
    noiseOpacity = 0.04;
  }

  const isGlitching = [
    'COUP_SUCCESS',
    'COUP_ATTEMPT_FAILED',
    'REGIME_CHANGE',
    'CYBER_BLACKOUT',
    'CYBER_ATTACK',
  ].includes(activeEvent.type);

  const eventLabel = EVENT_LABELS[activeEvent.type] || activeEvent.type;

  return {
    isActive: true,
    activeSeverity: severity,
    borderColor,
    borderIntensity,
    backgroundTint,
    isFlickering,
    isGlitching,
    pulseSpeed,
    noiseOpacity,
    activeEvent,
    eventLabel,
  };
}
