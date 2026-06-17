export type OperativeSkill =
  | 'SURVEILLANCE'
  | 'RECRUITMENT'
  | 'SABOTAGE'
  | 'INFILTRATION'
  | 'TECHNICAL_COLLECTION'
  | 'COUNTER_SURVEILLANCE'
  | 'EXFILTRATION_SUPPORT'
  | 'INFLUENCE_PERSUASION'
  | 'DECEPTION_HANDLING'
  | 'REGION_NAVIGATION';

export type CoverType =
  | 'DIPLOMATIC'
  | 'COMMERCIAL'
  | 'MEDIA'
  | 'ACADEMIC'
  | 'HUMANITARIAN'
  | 'CRIMINAL'
  | 'CUTOUT';

export type MotivationChannel =
  | 'IDEOLOGY'
  | 'MONEY'
  | 'COERCION'
  | 'EGO';

export type OperativeState =
  | 'ACTIVE'
  | 'DORMANT'
  | 'COMPROMISED'
  | 'BURNED'
  | 'EXTRACTED';

export interface RegionFamiliarity {
  regionId: string; // e.g., 'NORTH_AMERICA', 'EAST_ASIA'
  score: number;    // 0-100
}

export interface OperationalHistoryEntry {
  tick: number;
  missionType: string;
  success: boolean;
  notes: string;
}

export interface Operative {
  id: string;
  name: string;
  alias: string;
  trueIdentity: string | null;
  cellId: string | null;
  handlerId: string | null;
  
  regionOfOperation: string;
  regionFamiliarity: Record<string, number>; // Object mapping region ID to 0-100 score
  
  coverType: CoverType;
  coverQuality: number; // 0-100
  coverExposureRisk: number; // 0-100
  coverConsistency: number; // 0-100
  
  skills: Record<OperativeSkill, number>; // Mapping skill to 0-100 score
  
  loyalty: number; // 0-100
  stress: number;  // 0-100
  burnRisk: number; // 0-100
  exposureLevel: number; // 0-100
  accessLevel: number; // 0-100
  
  motivationProfile: Record<MotivationChannel, number>; // 0-100 weight per channel
  leverageProfile: string[]; // specific tags of leverage
  recruitmentSource: MotivationChannel;
  
  lastContactTick: number;
  lastMissionTick: number;
  
  state: OperativeState;
  
  compromiseHistory: { tick: number; reason: string }[];
  missionHistory: OperationalHistoryEntry[];
  
  operationalValue: number; // 0-100
  reliability: number; // 0-100
  volatility: number; // 0-100
  
  currentAssignment: string | null;
}

export interface Handler {
  id: string;
  name: string;
  codeName: string;
  trustLevel: number; // 0-100
  operationalStyle: 'CAUTIOUS' | 'AGGRESSIVE' | 'METHODICAL' | 'ERRATIC';
  riskTolerance: number; // 0-100
  disciplineScore: number; // 0-100
  state: 'ACTIVE' | 'COMPROMISED' | 'BURNED';
}

export interface Cell {
  id: string;
  name: string; // E.g. "Orion Group"
  regionScope: string;
  missionScope: string;
  handlerId: string;
  exposureBoundary: number; // 0-100 resistance to cascade failure
  crossContactRules: 'STRICT' | 'PERMISSIVE' | 'ISOLATED';
  fallbackProtocol: string;
}

export interface CompartmentalizationGraph {
  nodes: string[]; // operative IDs
  links: { source: string; target: string; type: 'KNOWS' | 'CONTACT' | 'FUNDS' }[];
}
