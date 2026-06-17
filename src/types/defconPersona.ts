import { DefconLevel } from '../store/defconStore';

export type PersonaId = 
  | 'ANALYST' // Peacetime Coordinator
  | 'WATCH_OFFICER' 
  | 'CRISIS_LEAD' 
  | 'JOINT_COMMANDER' 
  | 'STRATEGIC_COMMAND'; // National Authority

export interface PersonaDef {
  id: PersonaId;
  name: string;
  authorityTier: number; // 1-5
  minDefconLevel: DefconLevel; // What DEFCON levels this persona is valid for. e.g. Analyst is 1-5, Strategic command is 1-3.
  description: string;
}

export type PanelCategory = 
  | 'STRATEGIC_MAP'
  | 'INTELLIGENCE'
  | 'DIPLOMACY'
  | 'ECONOMY'
  | 'COVERT'
  | 'REGIME_PRESSURE'
  | 'MILITARY'
  | 'CYBER'
  | 'NUCLEAR'
  | 'ALERTS'
  | 'SYSTEM'
  | 'COMMAND_SUMMARY';

export interface PanelRegistryDef {
  id: number;
  name: string;
  category: PanelCategory;
  primaryPurpose: string;
  minDefconAvailability: DefconLevel; // e.g. 5 means available at 5 through 1
  minPersonaTier: number; // 1 to 5
  layoutPriority: 'PRIMARY' | 'SECONDARY' | 'LOWER' | 'CONTEXTUAL';
  isNuclearRestricted?: boolean;
}

export interface DefconTransitionLog {
  id: string;
  tick: number;
  fromLevel: DefconLevel;
  toLevel: DefconLevel;
  reason: string;
  source: 'SYSTEM' | 'PLAYER' | 'SCENARIO';
}
