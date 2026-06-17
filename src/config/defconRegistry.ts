import { PersonaDef, PanelRegistryDef, PersonaId } from '../types/defconPersona';
import { DefconLevel } from '../store/defconStore';

export const PERSONAS: Record<PersonaId, PersonaDef> = {
  ANALYST: {
    id: 'ANALYST',
    name: 'Strategic Analyst | Peacetime Coordinator',
    authorityTier: 1,
    minDefconLevel: 5,
    description: 'Responsible for intelligence gathering, economic posturing, and global state monitoring.'
  },
  WATCH_OFFICER: {
    id: 'WATCH_OFFICER',
    name: 'Watch Officer | Threat Monitor',
    authorityTier: 2,
    minDefconLevel: 5,
    description: 'Responsible for surveillance, threat tracking, and alert processing.'
  },
  CRISIS_LEAD: {
    id: 'CRISIS_LEAD',
    name: 'Crisis Cell Lead | Theater Coordinator',
    authorityTier: 3,
    minDefconLevel: 4,
    description: 'Manages crisis response, covert operations, regime pressure, and counter-moves.'
  },
  JOINT_COMMANDER: {
    id: 'JOINT_COMMANDER',
    name: 'Joint Commander | Armed Posture',
    authorityTier: 4,
    minDefconLevel: 3,
    description: 'Manages military readiness, active conflict command, and kinetic options.'
  },
  STRATEGIC_COMMAND: {
    id: 'STRATEGIC_COMMAND',
    name: 'Strategic Command | National Authority',
    authorityTier: 5,
    minDefconLevel: 2,
    description: 'Highest authority. Controls strategic deterrence, nuclear launch posture, and catastrophic response.'
  }
};

// Panel associations based on the ids in App.tsx
export const PANEL_REGISTRY: Record<number, PanelRegistryDef> = {
  1: { id: 1, name: 'GOVERNMENT', category: 'ECONOMY', primaryPurpose: 'Domestic policy and stability', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'PRIMARY' },
  2: { id: 2, name: 'CENTRAL BANK', category: 'ECONOMY', primaryPurpose: 'Monetary policy and reserves', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'SECONDARY' },
  3: { id: 3, name: 'ARSENAL', category: 'MILITARY', primaryPurpose: 'Conventional readiness', minDefconAvailability: 5, minPersonaTier: 3, layoutPriority: 'PRIMARY' },
  4: { id: 4, name: 'DIPLOMACY', category: 'DIPLOMACY', primaryPurpose: 'Treaties and foreign policy', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'PRIMARY' },
  5: { id: 5, name: 'RESEARCH', category: 'SYSTEM', primaryPurpose: 'Technology progression', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  6: { id: 6, name: 'INTELLIGENCE', category: 'INTELLIGENCE', primaryPurpose: 'Recon and early warning', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'PRIMARY' },
  7: { id: 7, name: 'SPACE', category: 'MILITARY', primaryPurpose: 'Orbital assets', minDefconAvailability: 5, minPersonaTier: 2, layoutPriority: 'SECONDARY' },
  8: { id: 8, name: 'POPULATION', category: 'ECONOMY', primaryPurpose: 'Demographics and unrest', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  9: { id: 9, name: 'PROPAGANDA', category: 'COVERT', primaryPurpose: 'Information control', minDefconAvailability: 5, minPersonaTier: 2, layoutPriority: 'SECONDARY' },
  10: { id: 10, name: 'SIGNAL TRACE', category: 'SYSTEM', primaryPurpose: 'System command bus logs', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  11: { id: 11, name: 'SCENARIOS', category: 'SYSTEM', primaryPurpose: 'Scenario management', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  12: { id: 12, name: 'GOTHAM GRAPH', category: 'INTELLIGENCE', primaryPurpose: 'Entity relationships', minDefconAvailability: 5, minPersonaTier: 2, layoutPriority: 'SECONDARY' },
  13: { id: 13, name: 'FOUNDRY LOGISTICS', category: 'ECONOMY', primaryPurpose: 'Military industrial base', minDefconAvailability: 5, minPersonaTier: 3, layoutPriority: 'LOWER' },
  14: { id: 14, name: 'FINANCIAL WARFARE', category: 'ECONOMY', primaryPurpose: 'Capital disruption', minDefconAvailability: 4, minPersonaTier: 2, layoutPriority: 'SECONDARY' },
  15: { id: 15, name: 'TRADE COERCION', category: 'ECONOMY', primaryPurpose: 'Resource blocking', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  16: { id: 16, name: 'ENERGY INTEGRITY', category: 'ECONOMY', primaryPurpose: 'Grid defense', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  17: { id: 17, name: 'COERCIVE SANCTIONS', category: 'DIPLOMACY', primaryPurpose: 'International embargo', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'SECONDARY' },
  18: { id: 18, name: 'FINANCIAL HORIZONS', category: 'ECONOMY', primaryPurpose: 'Macro forecast', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  19: { id: 19, name: 'UN & LEGAL INQ', category: 'DIPLOMACY', primaryPurpose: 'Global consensus', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'SECONDARY' },
  20: { id: 20, name: 'REGIONAL BLOCS', category: 'DIPLOMACY', primaryPurpose: 'Alliances', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  21: { id: 21, name: 'SOFT POWER', category: 'DIPLOMACY', primaryPurpose: 'Cultural influence', minDefconAvailability: 5, minPersonaTier: 1, layoutPriority: 'LOWER' },
  22: { id: 22, name: 'MIRROR ADAPTATION', category: 'COVERT', primaryPurpose: 'Threat emulation', minDefconAvailability: 4, minPersonaTier: 3, layoutPriority: 'SECONDARY' },
  23: { id: 23, name: 'COGNITIVE SHIELD', category: 'CYBER', primaryPurpose: 'Counter-influence', minDefconAvailability: 5, minPersonaTier: 2, layoutPriority: 'LOWER' },
  24: { id: 24, name: 'OPERATIVE NETWORK', category: 'COVERT', primaryPurpose: 'Agent handling', minDefconAvailability: 5, minPersonaTier: 3, layoutPriority: 'PRIMARY' },
  25: { id: 25, name: 'REGIME PRESSURE', category: 'REGIME_PRESSURE', primaryPurpose: 'Political destabilization', minDefconAvailability: 4, minPersonaTier: 3, layoutPriority: 'PRIMARY' },
  
  // Virtual panels for nuclear/command
  100: { id: 100, name: 'NUCLEAR POSTURE', category: 'NUCLEAR', primaryPurpose: 'Strategic deterrence', minDefconAvailability: 3, minPersonaTier: 4, layoutPriority: 'PRIMARY', isNuclearRestricted: true },
};

export function getAvailablePersonas(defcon: DefconLevel): PersonaDef[] {
  return Object.values(PERSONAS).filter(p => defcon <= p.minDefconLevel);
}

export function getDefaultPersona(defcon: DefconLevel): PersonaId {
  switch (defcon) {
    case 5: return 'ANALYST';
    case 4: return 'WATCH_OFFICER';
    case 3: return 'CRISIS_LEAD';
    case 2: return 'JOINT_COMMANDER';
    case 1: return 'STRATEGIC_COMMAND';
    default: return 'ANALYST';
  }
}

export function getAvailablePanels(defcon: DefconLevel, personaTier: number): PanelRegistryDef[] {
  return Object.values(PANEL_REGISTRY).filter(p => 
    defcon <= p.minDefconAvailability && 
    personaTier >= p.minPersonaTier
  );
}
