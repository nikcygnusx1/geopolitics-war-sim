export type SoftPowerVectorType = 
  | 'HUMANITARIAN_LEGITIMACY' 
  | 'ASPIRATIONAL_MODERNITY' 
  | 'EDUCATIONAL_PRESTIGE' 
  | 'ENTERTAINMENT_ATTRACTION' 
  | 'CIVILIZATIONAL_PRESTIGE' 
  | 'MORAL_AUTHORITY' 
  | 'DEVELOPMENT_COMPETENCE' 
  | 'ANTI_IMPERIAL_CREDIBILITY' 
  | 'INNOVATION_PRESTIGE' 
  | 'SPORTS_PRESTIGE' 
  | 'NARRATIVE_REACH';

export type AidProgramType = 
  | 'HUMANITARIAN_RELIEF' 
  | 'PUBLIC_HEALTH_SUPPORT' 
  | 'FOOD_AID' 
  | 'REFUGEE_SUPPORT' 
  | 'TECHNICAL_ASSISTANCE' 
  | 'RECONSTRUCTION_SUPPORT' 
  | 'CONCESSIONAL_LOAN' 
  | 'PURE_GRANT' 
  | 'INFRASTRUCTURE_FINANCING' 
  | 'CLIMATE_RESILIENCE' 
  | 'EDUCATION_SECTOR';

export type InvestmentDiplomacyType = 
  | 'STRATEGIC_INFRASTRUCTURE' 
  | 'INDUSTRIAL_PARK' 
  | 'DIGITAL_INFRASTRUCTURE' 
  | 'ENERGY_INFRASTRUCTURE' 
  | 'PORT_RAIL_LOGISTICS' 
  | 'EDUCATION_CAMPUS' 
  | 'MEDIA_CULTURAL_CENTER' 
  | 'PRESTIGE_ARCHITECTURE';

export type PrestigeEventType = 
  | 'OLYMPICS_MEGA' 
  | 'REGIONAL_GAMES' 
  | 'WORLD_EXPO' 
  | 'GLOBAL_SUMMIT_HOSTING' 
  | 'DONOR_CONFERENCE_HOSTING' 
  | 'CLIMATE_SUMMIT_HOSTING' 
  | 'CULTURAL_PRESTIGE_FESTIVAL';

export type BoycottStyle = 
  | 'NONE' 
  | 'SYMBOLIC_DIPLOMATIC_BOYCOTT' 
  | 'FULL_BOYCOTT' 
  | 'PARTIAL_TEAM' 
  | 'SPONSOR_WITHDRAWAL' 
  | 'MEDIA_COUNTER_CAMPAIGN';

export type DiasporaActivationMode = 
  | 'LOBBYING_HOST_GOVERNMENT' 
  | 'REMITTANCE_MOBILIZATION' 
  | 'BUSINESS_CORRIDOR' 
  | 'NARRATIVE_AMPLIFICATION' 
  | 'PROTEST_SOLIDARITY' 
  | 'SANCTIONS_EVASION_BRIDGE';

export type AudienceSegmentId = 
  | 'MASS_PUBLIC' 
  | 'URBAN_YOUTH' 
  | 'RURAL_CONSERVATIVES' 
  | 'ELITE_TECHNOCRATS' 
  | 'MILITARY_ESTABLISHMENT' 
  | 'CIVIL_SOCIETY' 
  | 'DIASPORA_COMMUNITIES' 
  | 'BUSINESS_ELITES' 
  | 'UNIVERSITY_POPULATIONS' 
  | 'REGIME_LOYALISTS';

export interface SoftPowerVector {
  type: SoftPowerVectorType;
  score: number; // 0-100
  recentDelta: number;
}

export interface CulturalReachChannel {
  id: string;
  name: string;
  medium: 'BROADCASTER' | 'DIGITAL_PLATFORM' | 'NEWS_SYNDICATE' | 'STREAMING_ENTERTAINMENT' | 'LANGUAGE_INSTITUTE';
  targetCountryId: string;
  penetrationRate: number; // 0-100%
  censored: boolean;
}

export interface MediaReachNetwork {
  channels: CulturalReachChannel[];
  globalBroadcasterReach: number; // 0-100
  digitalFootprintScore: number; // 0-100
}

export interface AudienceSegmentProfile {
  id: AudienceSegmentId;
  name: string;
  trustFactor: number; // 0-100
  receptivity: number; // 0-100
  dissidentSymphaty: number; // 0-100
}

export interface NarrativeResonanceState {
  countryId: string;
  segments: Record<AudienceSegmentId, AudienceSegmentProfile>;
  priorTrust: number; // 0-100
  fatigueWithForeignInfluence: number; // 0-100
}

export interface CulturalInfluenceIndex {
  languageReach: number; // 0-100
  mediaPenetration: number; // 0-100
  educationAttractiveness: number; // 0-100
  culturalBrandRecognition: number; // 0-100
  entertainmentExportStrength: number; // 0-100
  eliteFamiliarity: number; // 0-100
  symbolicPrestige: number; // 0-100
  trustLegitimacyResonance: number; // 0-100
  diasporaAmplification: number; // 0-100
  globalCompositeScore: number; // 0-100
}

export interface CulturalInfluenceProfile {
  countryId: string;
  index: CulturalInfluenceIndex;
  regionalReachMultiplier: Record<string, number>; // targetCountryId -> multiplier (e.g. 0.5 to 1.5)
  vectors: Record<SoftPowerVectorType, SoftPowerVector>;
}

export interface AidProgramRecord {
  id: string;
  sourceCountryId: string;
  targetCountryId: string;
  type: AidProgramType;
  fundingAmountB: number;
  unresolvedTicks: number;
  tiedProcurement: boolean;
  politicallyConditional: boolean;
  corruptionLeakage: number; // percentage 0-100
  repaymentResentment: number; // 0-100 scaling or index
  goodwillRemaining: number; // 0-100
}

export interface InvestmentDiplomacyRecord {
  id: string;
  sourceCountryId: string;
  targetCountryId: string;
  type: InvestmentDiplomacyType;
  fundingB: number;
  deliveryProgress: number; // 0-100
  eliteGratitude: number; // 0-100
  dependencyIndex: number; // 0-100
  corruptionRisk: number; // 0-100
  futureSovereignLeverage: number; // 0-100
}

export interface PrestigeEventRecord {
  id: string;
  title: string;
  type: PrestigeEventType;
  hostCountryId: string;
  tickScheduled: number;
  boycottingNations: Record<string, BoycottStyle>; // countryId -> style
  scandalOccurred: boolean;
  narrativeControlIndex: number; // 0-100
  tourismCapitalInflowB: number;
  overallPrestigeYield: number; // 0-100
}

export interface EliteFormationPipeline {
  countryId: string;
  alumniInCabinet: number; // counter of alumni in host or foreign cabinets
  technocratAffinitiesCount: number;
  militaryCollegeExchangesCount: number;
}

export interface ExchangeProgramRecord {
  id: string;
  sourceCountryId: string;
  targetCountryId: string;
  activeTicks: number; // accumulated duration (e.g. 10–20 ticks requirement)
  scholarshipsAllocatedCount: number;
  durableInfluenceScore: number; // 0-100
  brainDrainMultiplier: number; // 0.1 to 2.0
  pipeline: EliteFormationPipeline;
}

export interface DiasporaNetworkProfile {
  hostCountryId: string;
  sizeMillions: number;
  wealthRemittanceCapacity: number; // 0-100 scale
  politicalMobilizationScore: number; // 0-100
  assimilationScore: number; // 0-100
  homelandLoyaltyScore: number; // 0-100
  vulnerabilityToIntimidation: number; // 0-100
}

export interface DiasporaActivationRecord {
  id: string;
  sponsorCountryId: string;
  hostCountryId: string;
  activationMode: DiasporaActivationMode;
  successIndex: number; // 0-100
  backlashSeverity: number; // 0-100
  hostCountrySuspicionDelta: number; // 0-100 increase
  active: boolean;
}

export interface LegitimacyBonusRecord {
  countryId: string;
  humanitarianLegitimacy: number; // 0-100
  moralAuthority: number; // 0-100
  developmentalCredibility: number; // 0-100
  culturalPrestige: number; // 0-100
  eliteTrust: number; // 0-100
  antiImperialCredibility: number; // 0-100
}

export interface SymbolicPressureEvent {
  id: string;
  awardTitle: string; // e.g. "Global Human Rights Prize"
  recipientDissidentId: string;
  adversaryCountryId: string;
  moralPrestigeTransferred: number; // 0-100
  regimeEmbarrassmentIndex: number; // 0-100
  crackdownBacklashSeverity: number; // 0-100
  expiryTick: number;
}

export interface InfluenceAccumulationRecord {
  countryId: string;
  cumulativeTractionPoints: number;
  ticksActive: number;
}

export interface InfluenceDecayRecord {
  vectorType: SoftPowerVectorType;
  lastActiveTick: number;
  decayRateFactor: number; // e.g. 0.95 per tick
}

export interface PublicPrestigeMemory {
  id: string;
  countryId: string;
  description: string;
  tickRegistered: number;
  prestigeYieldPoints: number; // can be negative for scandals
  hypocrisyPenaltyActive: boolean;
}

export interface SoftPowerActionPreview {
  targetedAudiences: AudienceSegmentId[];
  shortTermInfluenceGain: number; // 0-100
  longTermInfluenceGain: number; // 0-100
  legitimacyBonusPotential: number; // 0-50
  backlashRiskIndex: number; // 0-100
  corruptionLeakageRisk: number; // 0-100
  boycottProbability: number; // 0-100
  fiscalCostB: number;
}

export interface InfluenceConversionRecord {
  id: string;
  countryId: string;
  targetCountryId: string;
  convertedAsso: 'TREATY_FORMATION' | 'SANCTIONS_ASSEMBLY' | 'CRISIS_NARRATIVE' | 'BLOC_LEAD_CLAIM';
  efficiencyRate: number; // 0-100
}

export interface SoftPowerBacklashRecord {
  id: string;
  offendingCountryId: string;
  targetCountryId: string;
  reason: 
    | 'AID_COERCIVE_TIE' 
    | 'PRESTIGE_CORRUPTION_SCANDAL' 
    | 'DIASPORA_OVER_MOBILIZATION' 
    | 'EDUCATION_POLITICIZATION' 
    | 'DOUBLE_STANDARD_HYPOCRISY' 
    | 'MEDIA_CREDIBILITY_COLLAPSE';
  severity: number; // 0-100
}
