export type PressureActionType = 'PROTEST' | 'COUP' | 'ELECTION_INTERFERENCE' | 'OPPOSITION_FUNDING' | 'TARGETED_REMOVAL';
export type EliteFactionAlignment = 'PRO_REGIME' | 'MODERATE' | 'OPPOSITION' | 'MILITARY';

export interface RegimePressureState {
  // Target regime stats
  legitimacy: number;           // 0-100
  eliteCohesion: number;        // 0-100
  oppositionStrength: number;   // 0-100
  protestTemperature: number;     // 0-100
  securityForceLoyalty: number; // 0-100
  mediaControl: number; // 0-100
  blowbackSensitivity: number;  // 0-100

  // Campaigns & Factions
  activeCampaigns: PressureCampaign[];
  blowbackHistory: BlowbackMemory[];
  eliteFactions: EliteFaction[];
}

export interface PressureCampaign {
  id: string;
  type: PressureActionType;
  initiatorId: string;
  targetCountryId: string;
  phase: number;
  maxPhases: number;
  progress: number; // 0-100 progress inside current phase
  exposure: number; // 0-100
  risk: number; // 0-100 (probability of failure/blowback tick-by-tick)
  investment: number; // Money/resources committed
  assignedOperatives: string[]; // IDs of assigned agents
  state: 'PREPARING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'EXPOSED';
  consequences: any; // specific data based on type
  tickStarted: number;
  lastUpdatedTick: number;
}

export interface EliteFaction {
  id: string;
  name: string;
  alignment: EliteFactionAlignment;
  power: number; // 0-100
  loyalty: number; // 0-100
  grievance: number; // 0-100
}

export interface BlowbackMemory {
  id: string;
  type: string;
  initiatorId: string;
  magnitude: number; // 1-100
  tickOccurred: number;
  decayRate: number; // per tick
}
