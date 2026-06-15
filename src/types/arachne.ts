export type ArachneSourceClass = 'RUMINT' | 'OSINT' | 'SIGINT' | 'HUMINT' | 'CONFIRMED';

export type ArachneTheme = 
  | 'DIPLOMACY'
  | 'MILITARY'
  | 'ECONOMIC'
  | 'SANCTIONS'
  | 'CYBER'
  | 'UNREST'
  | 'LEADERSHIP'
  | 'ALLIANCES'
  | 'PROLIFERATION'
  | 'INTELLIGENCE'
  | 'ENERGY'
  | 'TRADE'
  | 'COVERT_RISK'
  | 'HUMANITARIAN';

export type ArachneUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ArachneConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'TOTAL';
export type ArachneFreshness = 'BREAKING' | 'ACTIVE' | 'WATCH' | 'BACKGROUND' | 'STALE' | 'RESOLVED' | 'ARCHIVED';
export type ArachnePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'BACKGROUND';
export type ArachneBriefGroup = 'TOP_STORY' | 'ACTIVE_WATCH' | 'BACKGROUND_SIGNAL';

export interface ArachneIntelItem {
  id: string;
  title: string;
  summary: string;
  fullBrief: string;
  whyItMatters: string;
  countryIds: string[];
  regionIds: string[];
  relatedLeaderIds: string[];
  themeTags: ArachneTheme[];
  urgency: ArachneUrgency;
  confidence: ArachneConfidence;
  sourceType: ArachneSourceClass;
  sourceLabel: string;
  timestampTick: number;
  freshnessState: ArachneFreshness;
  linkedIntelFactIds: string[];
  linkedWorldEventIds: string[];
  linkedOperationIds: string[];
  relatedTreatyIds: string[];
  alertScore: number;
  strategicPriority: ArachnePriority;
  visibility: 'PUBLIC' | 'PLAYER_ONLY' | 'CLASSIFIED';
  status: 'ACTIVE' | 'ARCHIVED';
  requiresAttention: boolean;
  briefingCategory: ArachneBriefGroup;
  icon?: string;
  hasFollowUp?: boolean;
  storyId?: string; // clustered storyline identifier
}

export interface ArachneFilterState {
  searchQuery: string;
  country: string;
  region: string;
  theme: ArachneTheme | 'ALL';
  urgency: ArachneUrgency | 'ALL';
  sourceType: ArachneSourceClass | 'ALL';
  confidence: ArachneConfidence | 'ALL';
  freshness: 'ALL_ACTIVE' | 'BREAKING_ONLY' | 'ARCHIVED' | 'ALL';
}
