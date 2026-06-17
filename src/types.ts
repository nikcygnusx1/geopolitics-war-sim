import { RegimePressureState } from './types/regimePressure';
import { BusEvent } from './sim/eventBus/types';

export type Ideology = 'DEMOCRACY' | 'AUTOCRACY' | 'MILITARY_JUNTA' | 'THEOCRACY' | 'TECHNOCRACY' | 'OLIGARCHY' | 'COMMUNISM' | 'MONARCHY';

export const IDEOLOGIES: Ideology[] = [
  'DEMOCRACY',
  'AUTOCRACY',
  'MILITARY_JUNTA',
  'THEOCRACY',
  'TECHNOCRACY',
  'OLIGARCHY',
  'COMMUNISM',
  'MONARCHY'
];

export interface CountryStartConfig {
  ideology: Ideology;
  military: number;       // 1 - 100 power scale
  gdp: number;            // GDP in Billions USD
  opinion: number;        // -100 to 100 sentiment
  alliance: AllianceBlock; // NATO, BRICS, GCC, etc.
  nuclear: boolean;       // Nuclear status
}

export type WorldConfig = Record<string, CountryStartConfig>;

export type AllianceBlock = 'NATO' | 'BRICS' | 'GCC' | 'QUAD' | 'SCO' | 'NEUTRAL';

export type WeaponType = 'ICBM' | 'SLBM' | 'CRUISE_MISSILE' | 'HYPERSONIC' | 'FIGHTER_JET' |
                 'STEALTH_BOMBER' | 'CARRIER_GROUP' | 'SUBMARINE' | 'TANK_DIVISION' |
                 'ARTILLERY' | 'DRONE_SWARM' | 'CYBER_WEAPON' | 'EMP_DEVICE' | 'DIRTY_BOMB';

export type CommodityType = 'OIL' | 'NATURAL_GAS' | 'WHEAT' | 'RARE_EARTH' | 'SILICON' | 'WEAPONS_GRADE_URANIUM' | 'ARMS';

export type FactionType = 'MILITARY_HARDLINERS' | 'REFORMERS' | 'ISLAMISTS' | 'NATIONALISTS' |
                  'OLIGARCHS' | 'TECHNOCRATS' | 'SEPARATISTS' | 'FOREIGN_BACKED';

export type StrikeStatus = 'QUEUED' | 'IN_FLIGHT' | 'INTERCEPTED' | 'IMPACT' | 'FAILED';

export type ThreatLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'BLACK'; // BLACK = nuclear exchange imminent

export type HUDMode = 'STATE' | 'WAR_ROOM' | 'ANALYST';

export type CovertOpType = 'ASSASSINATE_LEADER' | 'DESTABILIZE_FACTION' | 'HACK_GRID' |
                   'SABOTAGE_OIL' | 'ELECTION_RIG' | 'PLANT_PROPAGANDA' |
                   'FUND_REBELS' | 'ARMS_SMUGGLE' | 'FINANCIAL_ATTACK';

export type ScenarioId = 'MENA_SPARK' | 'KASHMIR_FLASHPOINT' | 'STRAIT_CLOSURE' |
                 'SOVEREIGN_DEFAULT' | 'TECH_WAR' | 'ARCTIC_CLAIM';

export type ResearchNode = 'HAARP_V1' | 'HAARP_V2' | 'HAARP_V3' |
                   'IRON_DOME_V1' | 'IRON_DOME_V2' | 'IRON_DOME_V3' |
                   'CYBER_FIREWALL_V1' | 'CYBER_FIREWALL_V2' | 'CYBER_FIREWALL_V3' |
                   'HYPERSONIC_TECH' | 'SATELLITE_RECON' | 'QUANTUM_COMMS' |
                   'BIO_WEAPON_DETECT' | 'EMP_SHIELD' | 'DEEP_STRIKE';

export interface WeaponUnit {
  type: WeaponType;
  count: number;
  operational: number;           // count minus damaged/destroyed
  maintenanceCostPerTick: number; // in $B
  combatPowerRating: number;      // 1-100
  fuelLevel: number;              // 0-100%
  pilotMorale: number;            // 0-100% — affects sortie effectiveness
  supplyChainStatus: 'NOMINAL' | 'STRAINED' | 'CRITICAL' | 'SEVERED';
  blackMarketSource: boolean;     // acquired via arms black market
}

export interface Arsenal {
  units: WeaponUnit[];
  totalPowerRating: number;       // computed sum
  totalMaintenanceCost: number;   // computed sum
  nuclearCapable: boolean;
  abmShieldStrength: number;      // 0-100% — upgraded via R&D
  abmIntercepts: number;          // successful intercepts this tick
  readinessLevel: number;         // 0-100% — affected by morale + supply
  personnel?: MilitaryPersonnel;
  logistics?: MilitaryLogistics;
  readiness?: MilitaryReadiness;
  combatRealism?: MilitaryCombat;
}

export interface BondIssuance {
  id: string;
  amount: number;       // $B
  interestRate: number; // %
  maturityTicks: number;
  remainingTicks: number;
  holder: string;       // countryId or 'IMF' or 'MARKET'
}

export interface OligarchNetwork {
  id: string;
  name: string;
  wealthB: number;        // $B net worth
  influenceScore: number; // 0-100
  sector: string;         // 'ENERGY' | 'MEDIA' | 'BANKING' | 'DEFENSE'
  loyalty: number;        // 0-100 — can flip if repressed or bribed
  offshoreAccountsB: number;
}

export interface SpendingAllocation {
  military: number;    // fraction 0-1
  healthcare: number;
  education: number;
  infrastructure: number;
  intelligence: number;
  debtService: number;
  propaganda: number;
}

export interface EconomicProfile {
  gdpB: number;
  gdpGrowthRate: number;       // % per tick annualized
  inflationRate: number;       // %
  unemploymentRate: number;    // %
  treasuryCashB: number;
  debtToGdpRatio: number;      // %
  debtStressIndex: number;     // 0-100
  interestRate: number;        // central bank rate %
  currencyStrength: number;    // 0-200, 100 = neutral
  taxRate: number;             // % of GDP collected
  corporateTaxRate: number;    // %
  printingPressActive: boolean;
  printingPressIntensity: number; // 1-5 multiplier
  bonds: BondIssuance[];
  oligarchs: OligarchNetwork[];
  offshoreSlushFundB: number;
  sanctionedBy: string[];      // countryIds
  tradeSurplusDeficitB: number;
  spendingAllocation: SpendingAllocation;
  policyPosture?: 'PRO_GROWTH' | 'AUSTERITY' | 'CURRENCY_DEFENSE' | 'IMPORT_SUPPORT' | 'DEBT_STABILIZATION' | 'INDUSTRIAL_ALLOCATION';
  businessCyclePhase?: 'EXPANSION' | 'OVERHEATING' | 'SLOWDOWN' | 'CONTRACTION' | 'CRISIS' | 'STABILIZATION' | 'RECOVERY';
  sectors?: EconomicSectors;
  supplyChains?: SupplyChains;
  financialMarkets?: FinancialMarkets;
}

export interface Faction {
  type: FactionType;
  strengthIndex: number;    // 0-100
  isGoverning: boolean;
  demandsMetScore: number;  // 0-100 — how satisfied this faction is
  foreignBacker?: string;   // countryId sponsoring this faction
  isRebelling: boolean;
  armamentLevel: number;    // 0-100 if armed
}

export interface MediaChannel {
  id: string;
  name: string;
  reach: number;            // 0-100% of population
  stateControlled: boolean;
  foreignInfluence?: string; // countryId running influence
  narrativeBias: number;     // -100 (opposition) to +100 (pro-government)
}

export interface PoliticalProfile {
  ideology: Ideology;
  leaderName: string;
  leaderApprovalRating: number;   // 0-100%
  popularUnrest: number;          // 0-100
  stabilityIndex: number;         // 0-100
  electionDueTick?: number;       // tick when election is due
  coupRiskLevel: number;          // 0-100
  martialLawActive: boolean;
  martialLawTicksRemaining: number;
  factions: Faction[];
  mediaChannels: MediaChannel[];
  propagandaEffectiveness: number; // 0-100
  censorship: number;              // 0-100
  diasporaInfluence: number;       // 0-100 — expats sending money/info back
  infoWarfare?: InformationCampaign;
  regimePressure?: RegimePressureState;
}

export interface SatelliteAsset {
  id: string;
  orbitType: 'LEO' | 'GEO' | 'POLAR';
  coverageCountryIds: string[];
  reconQuality: number;       // 0-100
  isCompromised: boolean;
  launchCostB: number;
}

export interface CyberAsset {
  id: string;
  type: 'OFFENSIVE' | 'DEFENSIVE' | 'DUAL_USE';
  targetCountryId?: string;
  powerLevel: number;         // 0-100
  isDeployed: boolean;
  firewallRating: number;     // defensive only
}

export interface CovertOp {
  id: string;
  type: CovertOpType;
  targetCountryId: string;
  successProbability: number;
  costB: number;
  ticksToComplete: number;
  remainingTicks: number;
  status: 'PLANNING' | 'ACTIVE' | 'BLOWN' | 'SUCCESS' | 'FAILED';
  blowbackRisk: number;       // 0-100
}

export interface Province {
  id: string;
  name: string;
  population: number; // millions
  controllerCountryId: string;
  originalCountryId: string;
  integrity: number; // 0-100% infrastructure status
  features: Array<'CITY' | 'PORT' | 'AIRBASE' | 'ENERGY_FACILITY' | 'INDUSTRIAL_ZONE'>;
  resistanceLevel: number; // 0-100
}

export interface PopulationProfile {
  ageDemographics: { youthPct: number; adultPct: number; elderlyPct: number };
  birthRate: number; // births per year per 1000
  deathRate: number; // deaths per year per 1000
  educationLevel: number; // 0-100
  urbanization: number; // 0-100
  poverty: number; // 0-100
  migration: number; // monthly net migration
  religiousComposition: { secular: number; religiousA: number; religiousB: number };
  ethnicComposition: { majority: number; minorityA: number; minorityB: number };
  workforceParticipation: number; // 0-100
}

export interface CabinetMember {
  name: string;
  competence: number; // 0-100
  loyalty: number; // 0-100
  corruption: number; // 0-100
  ideology: Ideology;
}

export interface Cabinet {
  defenseMinister: CabinetMember;
  financeMinister: CabinetMember;
  foreignMinister: CabinetMember;
  intelligenceChief: CabinetMember;
  centralBankGovernor: CabinetMember;
}

export interface EconomicSectors {
  agriculture: number; // value $B
  manufacturing: number;
  services: number;
  energy: number;
  mining: number;
  technology: number;
  tourism: number;
  defense: number;
}

export interface SupplyChains {
  energyDependency: number; // 0-100%
  foodDependency: number; // 0-100%
  semiconductorDependency: number; // 0-100%
  defenseDependency: number; // 0-100%
}

export interface FinancialMarkets {
  stockMarketIndex: number;
  bondYield: number; // %
  currencyMarketValue: number; // e.g. 100 is baseline
  sovereignRating: string; // e.g. 'AAA', 'A', 'BBB', etc.
}

export interface MilitaryPersonnel {
  activeTroops: number; // thousands
  reserveTroops: number; // thousands
  specialForces: number; // thousands
}

export interface MilitaryLogistics {
  ammunition: number; // 0-100
  fuel: number; // 0-100
  spareParts: number; // 0-100
  supplyDepots: number; // count
}

export interface MilitaryReadiness {
  training: number; // 0-100
  morale: number; // 0-100
  combatExperience: number; // 0-100
}

export interface MilitaryCombat {
  attrition: number; // 0-100
  supplyLineStatus: number; // 0-100
  occupationCosts: number; // $B per tick
  insurgencies: number; // 0-100
}

export interface SpyAsset {
  id: string;
  alias: string;
  targetCountryId: string;
  competence: number; // 0-100
  status: 'ACTIVE' | 'DORMANT' | 'DOUBLE_AGENT' | 'EXPOSED';
  ticksActive: number;
}

export interface InformationCampaign {
  socialMediaInfluence: number; // 0-100
  deepfakesActive: boolean;
  narrativeFocus: 'PRO_GOVERNMENT' | 'ANTAGONIZE' | 'FOREIGN_DISINFO';
  mediaOwnershipCensorship: number; // 0-100
}

export interface IntelligenceProfile {
  satellites: SatelliteAsset[];
  cyberAssets: CyberAsset[];
  activeCovertOps: CovertOp[];
  humintNetworks: { [countryId: string]: number }; // 0-100 penetration per country
  signalIntelScore: number;   // 0-100
  cyberFirewallLevel: number; // upgraded via R&D
  knownThreats: string[];     // countryIds with confirmed hostile intent
  blackBudgetB: number;       // hidden budget not visible in public spending
  spyAssets?: SpyAsset[];
  intelReportConfidence?: number; // 0-100
}

export interface Country {
  id: string;                         // ISO 2-letter e.g. 'US', 'CN'
  name: string;
  flagEmoji: string;
  continent: string;
  population: number;                 // millions
  allianceBlock: AllianceBlock;
  atWarWith: string[];                // countryIds
  tradePartners: string[];            // countryIds
  opinions: { [countryId: string]: number }; // -100 hostile to +100 allied
  threatLevel: ThreatLevel;
  nuclearDoctrineFirstStrike: boolean;
  researchUnlocked: ResearchNode[];
  researchInProgress?: { node: ResearchNode; ticksRemaining: number };
  haarpActive: boolean;
  haarpTargetCountryId?: string;
  economic: EconomicProfile;
  political: PoliticalProfile;
  arsenal: Arsenal;
  intelligence: IntelligenceProfile;
  lastEventLog: string[];            // last 5 event strings for this country
  tariffs?: { [countryId: string]: number }; // Tariff rate percentages (0-50%)
  provinces?: Province[];
  populationSim?: PopulationProfile;
  cabinet?: Cabinet;
  
  // T3.2 Propaganda / Narrative Warfare System properties
  domesticNarrative?: number;          // 0-100 score representing state/regime narrative alignment
  mediaResistance?: number;            // 0-1 scaling resistance/resilience to external influence
  recentNarrativeDelta?: number;       // Change in narrative score in the last tick
  hasCivilUnrestTriggered?: boolean;   // civil unrest threshold flag (<20)
  hasElectionInterferenceTriggered?: boolean; // election interference threshold flag (>80)
}

export interface BezierCurve {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
}

export interface StrikeDamage {
  stabilityLoss: number;
  gdpLoss: number;
  militaryAssetsDestroyed: { type: WeaponType; count: number }[];
  casualtiesEstimate: number;
  infrastructureDamage: number;   // 0-100
  radiationContamination: boolean;
  empBlackout: boolean;
}

export interface BallisticStrike {
  id: string;
  sourceCountryId: string;
  targetCountryId: string;
  weaponType: WeaponType;
  warheadYieldMT?: number;         // megatons, for nuclear
  progressPct: number;             // 0-100
  status: StrikeStatus;
  bezier: BezierCurve;
  launchTick: number;
  impactTick: number;
  isRetaliatory: boolean;
  interceptAttempted: boolean;
  interceptSuccess?: boolean;
  damageDealt?: StrikeDamage;
}

export interface CommodityMarket {
  type: CommodityType;
  spotPriceUSD: number;
  baselinePrice: number;
  volatilityIndex: number;    // 0-100
  supplyShockActive: boolean;
  embargoed: boolean;
  embargoedBy: string[];
  priceHistory: number[];     // last 20 ticks
}

export interface ArmsDeal {
  id: string;
  sellerId: string;
  buyerId: string;
  weaponType: WeaponType;
  quantity: number;
  priceB: number;
  isBlackMarket: boolean;
  deliveryTick: number;
}

export interface PlayerState {
  countryId: string;
  hudMode: HUDMode;
  activeTab: number;           // 1-6 for F1-F6
  cashB: number;               // synced from/to country treasury
  activeScenario: ScenarioId;
  scenarioStartTick: number;
  totalTicks: number;
  tickSpeed: 'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA';
  selectedTargetCountryId?: string;
  pendingStrike?: Partial<BallisticStrike>;
  gameOver: boolean;
  gameOverReason?: string;
  victoryAchieved: boolean;
  victoryReason?: string;
  aftermathActive: boolean;
  aftermathType: 'VICTORY' | 'DEFEAT' | 'NONE';
  aftermathReason?: string;
  checkpointState?: any;
}

export interface AIOperationLogEntry {
  tick: number;
  countryId: string;
  countryName: string;
  action: string;
  targetCountryId?: string;
  targetCountryName?: string;
  description: string;
  secrecyScore: number;
  impactScore: number;
}

export interface WorldState {
  countries: { [id: string]: Country };
  activeStrikes: BallisticStrike[];
  commodityMarkets: CommodityMarket[];
  activeArmsDeals: ArmsDeal[];
  globalThreatLevel: ThreatLevel;
  globalEventLog: { tick: number; text: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SYSTEM' }[];
  currentTick: number;
  lastWarDeclarationTick?: number;
  pacingPreset?: PacingPreset;
  scheduledConsequences?: ScheduledConsequence[];
  recentResolvedConsequences?: ScheduledConsequence[];
  aiOperationsLog?: AIOperationLogEntry[];
  worldBuilderConfig?: WorldConfig;
  nuclearExchangeOccurred: boolean;
  world: CanonicalWorld;
}

export type TickDuration = "day" | "week" | "month";
export type MaxTicks = number | "endless";

export interface PacingPreset {
  tickDuration: TickDuration;
  maxTicks: MaxTicks;
  warDeclarationCooldown: number;
  escalationDamper: number;
  earlyGameProtection: number;
}

export type DurationMode = "scenario" | "timed" | "endless";

export interface DurationConfig {
  mode: DurationMode;
  tickDuration: TickDuration;
  tickBudget?: number;
}

// ==========================================
// T3.1 - UNIT MANAGEMENT SYSTEM SHAPES
// ==========================================
export type UnitType = 'CarrierGroup' | 'Submarine' | 'ICBMSilo' | 'AirWing' | 'SpecForce';
export type UnitStatus = 'IDLE' | 'MOVING' | 'DEPLOYED' | 'ON_MISSION' | 'RECON' | 'COMBAT' | 'PATROL' | 'DESTROYED';
export type UnitMissionType = 'NONE' | 'PATROL' | 'STRIKE' | 'AIR_SUPPORT' | 'INFILTRATING';

export interface MissionTarget {
  name: string;
  lat: number;
  lon: number;
  countryId?: string;
}

export interface UnitRoute {
  source: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  startTick: number;
  endTick: number;
  totalTicks: number;
  path: [number, number][]; // Great-circle interpolated points as [lon, lat] for rendering trails/current positions
}

export interface BaseUnit {
  id: string;
  name: string;
  type: UnitType;
  owner: string; // CountryId e.g. 'US', 'CN', 'RU'
  position: { lat: number; lon: number };
  status: UnitStatus;
  missionTarget: MissionTarget | null;
  missionType: UnitMissionType;
  eta: number | null;
  route: UnitRoute | null;
  health: number; // 0-100%
  fuel: number; // 0-100%
  recentActivity?: string[];
}

export interface CarrierGroupUnit extends BaseUnit {
  type: 'CarrierGroup';
  embarkedAirWings: number;
  strikeCapacity: number;
  wakeTrail: [number, number][]; // Historical [lon, lat] trace
}

export interface SubmarineUnit extends BaseUnit {
  type: 'Submarine';
  stealthProfile: number; // 0-100
  missileCapacity: number;
}

export interface ICBMSiloUnit extends BaseUnit {
  type: 'ICBMSilo';
  missileReadiness: number; // 0-100
  warheadType: string;
  hardened: boolean;
}

export interface AirWingUnit extends BaseUnit {
  type: 'AirWing';
  aircraftCount: number;
  rangeKm: number;
  homeBase: string;
}

export interface SpecForceUnit extends BaseUnit {
  type: 'SpecForce';
  squadSize: number;
  infiltrationState: 'STAGED' | 'INFILTRATED' | 'COMPROMISED' | 'EXTRACTED';
  stagingArea: string;
}

export type Unit = CarrierGroupUnit | SubmarineUnit | ICBMSiloUnit | AirWingUnit | SpecForceUnit;

// ==========================================
// T3.3 - BLACK MARKET TYPES
// ==========================================
export type BlackMarketItemType = 'MANPADS' | 'NUCLEAR_TRIGGERS' | 'SATELLITE_JAMMERS' | 'CRUISE_MISSILE';

export interface AuctionLot {
  id: string;
  itemType: BlackMarketItemType;
  title: string;
  description: string;
  sellerTag: string;
  rarity: 'COMMON' | 'RARE';
  basePrice: number;
  currentBid: number;
  currentLeaderId: string | null; // 'PLAYER' or AI countryId (e.g. 'CN', 'RU', etc.)
  expiresAtTick: number;
  spawnedAtTick: number;
  status: 'LIVE' | 'RESOLVED' | 'DELIVERING' | 'DELIVERED' | 'EXPIRED';
  deliveryTick: number | null;
  suspicionOnWin: number;
  aiInterestProfile?: {
    baseDesire: number; // 0-100 rating of how much AI wants this
    interestedAIs: string[]; // countryIds that are competing
  };
}

// ==========================================
// T3.4 - LEADER PERSONALITY TYPES
// ==========================================
export const LeaderPersonality = {
  HAWK: 'HAWK',
  DOVE: 'DOVE',
  PRAGMATIST: 'PRAGMATIST',
  IDEOLOGUE: 'IDEOLOGUE',
  UNPREDICTABLE: 'UNPREDICTABLE'
} as const;

export type LeaderPersonality = typeof LeaderPersonality[keyof typeof LeaderPersonality];

export interface LeaderTraitVector {
  hawkishness: number;         // 0-100
  prestigeHunger: number;      // 0-100
  paranoia: number;            // 0-100
  corruption: number;          // 0-100
  rigidity: number;            // 0-100
  riskTolerance: number;       // 0-100
  patience: number;            // 0-100
  ideologicalFixation: number; // 0-100
  institutionalLoyalty: number;// 0-100
  personalVanity: number;      // 0-100
  empathy: number;             // 0-100
  vindictiveness: number;      // 0-100
  bluffPropensity: number;     // 0-100
  crisisComposure: number;     // 0-100
  adaptability: number;        // 0-100
}

export interface LeaderPersonalityProfile {
  archetype: string;           // e.g. "Hawkish prestige-driven nationalist", "Paranoid besieged autocrat", etc.
  traits: LeaderTraitVector;
}

export interface LeaderEmotionalState {
  humiliation: number;         // 0-100 (decaying)
  fear: number;                // 0-100 (decaying)
  emboldenment: number;        // 0-100 (decaying)
  anger: number;               // 0-100
  anxiety: number;             // 0-100
  pride: number;               // 0-100
  resentment: number;          // 0-100
  vindication: number;         // 0-100
  desperation: number;         // 0-100
  overconfidence: number;      // 0-100
  fatigue: number;             // 0-100
  relief: number;              // 0-100
  paranoiaSpike: number;       // 0-100
  moralInjury: number;         // 0-100
  shame: number;               // 0-100
}

export interface LeaderTriggerRecord {
  triggerType: string;         // e.g. "PUBLIC_DEFEAT", "BORDER_PRESSURE", "DIPLOMATIC_CONCESSION"
  tickOccurred: number;
  emotionShifted: string;
  magnitude: number;
}

export interface LeaderStressHistory {
  currentStress: number;       // 0-100
  peakStress: number;
  ticksAtMaxStress: number;
  triggerLogs: LeaderTriggerRecord[];
}

export interface LeaderPublicPersona {
  rhetoricStyle: 'BELLICOSE' | 'CONCILIATORY' | 'REASSURING' | 'VICTIMHOOD' | 'TRIUMPHALIST' | 'DEFLECTIVE';
  mediaPresence: string;
  propagandaFocus: string;
  un_stance: string;
}

export interface LeaderPrivateDisposition {
  negotiationStance: 'UNCOMPROMISING' | 'TRANSACTIONAL' | 'CONCILIATORY' | 'REVOLUTIONARY';
  coerciveTendency: number; // 0-100
  backchannelOpenness: number; // 0-100
  innerCircleLoyaltyRequired: number; // 0-100
}

export interface LeaderRiskAppetiteProfile {
  militaryCoercionLimit: number; // 0-100
  cyberOffensiveTolerance: number; // 0-100
  nuclearBrinkmanshipThreshold: number; // 0-100
  covertOperationsExposureFear: number; // 0-100
}

export interface LeaderTrustStyleProfile {
  institutionalTrust: number; // 0-100
  personalTrust: number;      // 0-100
  coercivePreference: number; // 0-100
  economicInterdependenceTrust: number; // 0-100
}

export interface LeaderEscalationStyleProfile {
  pacing: 'SLOW_METHODICAL' | 'THEATRICAL_PUBLIC' | 'SECRETIVE_DENIABLE' | 'IMPULSIVE_HOT_BLOODED' | 'BRINKMANSHIP_HEAVY';
  escalationCeiling: number; // 0-100
  retaliationSpeed: 'INSTANT' | 'CALCULATED_DELAYED' | 'ASYMMETRIC';
  nuclearLaunchPrudence: number; // 0-100
}

export interface LeaderCompromiseStyleProfile {
  faceSavingRequired: boolean;
  concessionThreshold: number; // 0-100
  alliedConsultationStance: 'UNCOOPERATIVE' | 'CONSULTATIVE' | 'DEPENDENT';
  bribeAcceptanceScore: number; // 0-100
}

export interface LeaderMiscalculationProfile {
  influenceOfAdvisorFiltering: number; // 0-100
  propagandaBeliefFactor: number; // 0-100
  overconfidenceBias: number; // 0-100
  stressDistortionMultiplier: number; // e.g. 1.0 - 2.0
}

export interface LeaderSuccessionProfile {
  coupRiskScore: number; // 0-100
  successionInstabilityIndex: number; // 0-100
  designatedSuccessorId?: string;
  expectedTransitionType: 'ELECTION' | 'COUP' | 'RESPONSES' | 'HANDOFF' | 'ILLNESS';
}

export interface LeaderVulnerabilityProfile {
  corruptionVulnerability: number; // 0-100
  intelligencePenetrationScore: number; // 0-100
  eliteDissentFractureIndex: number; // 0-100
  blackmailExposureLevel: number; // 0-100
}

export const RedLineTriggerType = {
  TERRITORIAL_INTEGRITY: 'TERRITORIAL_INTEGRITY',
  REGIME_SURVIVAL: 'REGIME_SURVIVAL',
  FAMILY_ELITE_SECURITY: 'FAMILY_ELITE_SECURITY',
  PUBLIC_HUMILIATION: 'PUBLIC_HUMILIATION',
  ALLIANCE_BETRAYAL: 'ALLIANCE_BETRAYAL',
  NUCLEAR_STATUS: 'NUCLEAR_STATUS',
  SYMBOLIC_SOVEREIGNTY: 'SYMBOLIC_SOVEREIGNTY',
  IDEOLOGICAL_CHALLENGE: 'IDEOLOGICAL_CHALLENGE',
  ECONOMIC_STRANGULATION: 'ECONOMIC_STRANGULATION',
  MILITARY_ENCIRCLEMENT: 'MILITARY_ENCIRCLEMENT'
} as const;

export type RedLineTriggerType = typeof RedLineTriggerType[keyof typeof RedLineTriggerType];

export interface LeaderRedLineProfile {
  id: string;
  type: RedLineTriggerType;
  description: string;
  isTriggered: boolean;
  severityIndex: number;    // 0-100
  actionOnCross: string;
  discoveryProgress: number; // 0-100 progress towards being known
  sourceOfDiscovery?: string;
}

export interface LeaderIntelligenceExposureState {
  kompromatAssetsTracked: string[];
  buggedCommsActive: boolean;
  advisorInfiltrated: boolean;
  publicDossierCertainty: number; // 0-100
}

export interface LeaderReactionModel {
  lastEventReactedTo?: string;
  lastReactionTick?: number;
  customRhetoricHistory: string[];
}

export interface LeaderMemoryTrace {
  id: string;
  targetCountryId: string;
  type: 'PROMISE_KEPT' | 'PROMISE_BROKEN' | 'COERCION_ATTEMPT' | 'BLUFF_SUCCESS' | 'BETRAYAL' | 'PUBLIC_HUMILIATION' | 'PERSONAL_SLIGHT';
  tickOccurred: number;
  description: string;
  weight: number;
}

export interface LeaderPsychologyState {
  personality: LeaderPersonalityProfile;
  emotions: LeaderEmotionalState;
  stress: LeaderStressHistory;
  publicPersona: LeaderPublicPersona;
  privateDisposition: LeaderPrivateDisposition;
  riskAppetiteToEscalate: LeaderRiskAppetiteProfile;
  trustStyle: LeaderTrustStyleProfile;
  escalationStyle: LeaderEscalationStyleProfile;
  compromiseStyle: LeaderCompromiseStyleProfile;
  miscalculations: LeaderMiscalculationProfile;
  succession: LeaderSuccessionProfile;
  vulnerability: LeaderVulnerabilityProfile;
  exposure: LeaderIntelligenceExposureState;
  reactionModel: LeaderReactionModel;
  redLines: LeaderRedLineProfile[];
  memories: LeaderMemoryTrace[];
}

export interface Leader {
  id: string;
  countryId: string;
  name: string;
  type: LeaderPersonality;
  hawkDoveScore: number;
  riskTolerance: number;
  portraitSeed: string;
  portraitDataUrl?: string;
  installedAtTick: number;
  source: 'INITIAL' | 'ELECTION' | 'COUP';
  psychology?: LeaderPsychologyState;
}

// ==========================================
// T3.5 - CONSEQUENCE CHAIN TYPES
// ==========================================
export const ConsequenceEffectType = {
  SANCTIONS: 'SANCTIONS',
  UN_RESOLUTION: 'UN_RESOLUTION',
  REFUGEE_FLOW: 'REFUGEE_FLOW',
  MARKET_REACTION: 'MARKET_REACTION',
  ALLIANCE_INVITATION: 'ALLIANCE_INVITATION',
  COUP_RISK_INCREASE: 'COUP_RISK_INCREASE'
} as const;

export type ConsequenceEffectType = typeof ConsequenceEffectType[keyof typeof ConsequenceEffectType];

export type MajorActionType =
  | 'DECLARE_WAR'
  | 'IMPOSE_SANCTIONS'
  | 'SIGN_ALLIANCE'
  | 'LAUNCH_STRIKE'
  | 'NUCLEAR_ESCALATION'
  | 'DISPATCH_FOREIGN_AID'
  | 'STAGE_COUP'
  | 'REGIME_CHANGE';

export interface ConsequenceEffect {
  delay: number;
  effectType: ConsequenceEffectType;
  probability: number;
  params: Record<string, any>;
}

export interface ConsequenceTemplate {
  actionType: MajorActionType;
  effects: ConsequenceEffect[];
}

export interface ScheduledConsequence {
  id: string;
  sourceActionId: string;
  sourceCountryId: string;
  targetCountryId?: string;
  actionType: MajorActionType;
  scheduledTick: number;
  createdAtTick: number;
  effectType: ConsequenceEffectType;
  probability: number;
  params: Record<string, any>;
  resolved: boolean;
  cancelled?: boolean;
}



// ==========================================
// T4.5 - COUNTRY HOTSPOT TYPES
// ==========================================
export type HotspotType =
  | 'NAVAL_BASE'
  | 'AIR_BASE'
  | 'NUCLEAR_FACILITY'
  | 'MISSILE_SITE'
  | 'DIPLOMATIC_COMPOUND'
  | 'COVERT_SITE'
  | 'INDUSTRIAL_SITE'
  | 'CYBER_FACILITY'
  | 'OTHER';

export interface HotspotImageAsset {
  id: string;
  hotspotId: string;
  kind: 'HERO' | 'DETAIL' | 'SATELLITE' | 'DOSSIER' | 'RENDER';
  src: string;
  thumbSrc?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface CountryHotspot {
  id: string;
  countryId: string;
  name: string;
  type: HotspotType;
  lat: number;
  lon: number;
  importance: number; // e.g. 1-5 scale or similar
  status?: string;
  summary?: string;
  imageUrls?: string[];
  description?: string;
  classification?: string;
  tags?: string[];
  imageAssets?: HotspotImageAsset[];
  lastUpdatedTick?: number;
  threatLevel?: string;
  confidenceScore?: number;
  strategicValue?: number;
}

// ==========================================
// CANONICAL WORLD STATE - SIMULATION CORE MODELS
// ==========================================

export interface EconomicState {
  gdp: number;
  growthRate: number;
  inflation: number;
  unemployment: number;
  debtRatio: number;
  reserves: number;
  currencyStrength: number;
  tradeBalance: number;
  sanctionsExposure: number;
  importDependency: number;
  exportDependency: number;
  energyProfile: string;
  sectorBreakdown: Record<string, number>;
  supplyRisk: number;
  fiscalSpace: number;
  economicStress: number;
  recoveryRate: number;
  interestRate?: number; // central bank rate %

  // Module 2.1 Macro additions (backward compatible)
  businessCyclePhase?: 'EXPANSION' | 'OVERHEATING' | 'SLOWDOWN' | 'CONTRACTION' | 'CRISIS' | 'STABILIZATION' | 'RECOVERY';
  fragilityScore?: number;      // 0 - 100 scale
  resilienceScore?: number;     // 0 - 100 scale
  externalExposureScore?: number; // 0 - 100 scale
  importDependenceScore?: number; // 0 - 100 scale
  exportConcentrationScore?: number; // 0 - 100 scale
  shockLoad?: number;           // 0 - 100 score of active accumulated economic strain
  recoveryMomentum?: number;    // 0 - 100 index of speed of shock decay
  macroTrend?: 'BOOMING' | 'STABLE' | 'STAGNANT' | 'DETERIORATING' | 'CRISIS';
  recentMacroDrivers?: string[];
  policyPosture?: 'PRO_GROWTH' | 'AUSTERITY' | 'CURRENCY_DEFENSE' | 'IMPORT_SUPPORT' | 'DEBT_STABILIZATION' | 'INDUSTRIAL_ALLOCATION';
  currencyStability?: number;  // 0 - 100 scale
  sectors?: {
    energy: number;            // extractive % of GDP
    agriculture: number;       // agriculture/food %
    manufacturing: number;     // factory output %
    tech: number;              // high tech %
    services: number;          // service/finance %
    defense: number;           // defense-industrial output %
    state: number;             // public sector burden %
  };
}

export interface MilitaryState {
  manpower: number;
  readiness: number;
  morale: number;
  logisticsCapacity: number;
  mobilizationLevel: number;
  nuclearStatus: boolean;
  commandIntegrity: number;
  forceProjection: number;
  unitAbstractions: string[];
  strategicDeterrence: number;
  missileDefense: number;
  a2adStrength: number;
  activeTheaters: string[];
  warFatigue: number;
  equipmentHealth: number;
}

export interface CyberState {
  offensiveCapability: number;
  defensiveCapability: number;
  infrastructureResilience: number;
  activeIncidents: number;
  intrusionLevel: number;
  attributionExposure: number;
  cyberDoctrine: string;
  aptStrength: number;
  civilianNetworkHealth: number;
  militaryNetworkHealth: number;
  financialNetworkHealth: number;
  recoveryCapacity: number;
}

export interface AIState {
  personalityVector: Record<string, number>;
  threatPerceptions: Record<string, number>;
  trustByCountry: Record<string, number>;
  hostilityByCountry: Record<string, number>;
  strategicGoals: string[];
  activePlans: string[];
  memoryLog: string[];
  redLines: string[];
  decisionStyle: string;
  currentFocus: string;
  escalationTolerance: number;
  deceptionPreference: number;
  riskTolerance: number;
  allianceReliabilityScores: Record<string, number>;
}

export interface CountryState {
  id: string;
  name: string;
  shortName: string;
  isoCode: string; // stable identifier
  region: string;
  subregion: string;
  capital: string;
  population: number; // millions
  territory?: any; // optional geographic metadata
  ideology: Ideology;
  governmentType: string;
  regimeStability: number; // 0-100
  publicSentiment: number; // 0-100
  unrest: number; // 0-100
  legitimacy: number; // 0-100
  corruption: number; // 0-100
  strategicResources: string[];
  allianceIds: string[];
  rivalIds: string[];
  treatyIds: string[];
  atWarWith?: string[]; // active war front state tracker
  leaderId: string;
  economy: EconomicState;
  military: MilitaryState;
  cyber: CyberState;
  ai: AIState;
  tags: string[];
  createdFromScenarioPreset: boolean;
  lastUpdatedTick: number;
}

export interface LeaderState {
  id: string;
  countryId: string;
  fullName: string;
  title: string;
  ideologyAlignment: Ideology;
  traits: string[];
  aggression: number; // 0-100
  caution: number; // 0-100
  ambition: number; // 0-100
  paranoia: number; // 0-100
  popularity: number; // 0-100
  health: number; // 0-100
  legitimacyBonus: number;
  diplomacyStyle: string;
  militaryPosturePreference: string;
  hiddenRedLines: string[];
  publicPersona: string;
  internalNotes?: string;
  memoryHooks: string[];
}

export interface WorldEvent {
  id: string;
  type: 'CRISIS' | 'DIPLOMATIC' | 'MILITARY' | 'ECONOMIC' | 'CYBER' | 'COVERT';
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'CLANDESTINE';
  status: 'emerging' | 'active' | 'resolved' | 'archived';
  visibility: 'PUBLIC' | 'PLAYER_ONLY' | 'CLASSIFIED';
  startTick: number;
  endTick: number | null;
  involvedCountryIds: string[];
  involvedLeaderIds: string[];
  originatingSystem: string;
  effects: any[];
  tags: string[];
  linkedOperationIds: string[];
  linkedIntelFactIds: string[];
  escalationPotential: number; // 0-100
  historicalLogEntries: string[];
}

export interface OperationState {
  id: string;
  type: string;
  subtype: string;
  sponsorCountryId: string;
  targetCountryIds: string[];
  status: 'PLANNING' | 'ACTIVE' | 'EXPOSED' | 'COMPLETED' | 'FAILED' | 'ABORTED';
  secrecyLevel: number;
  attributionRisk: number;
  startTick: number;
  projectedEndTick: number;
  requiredAssets: string[];
  allocatedBudget: number; // in $B
  expectedEffects: string[];
  actualEffects: string[];
  exposed: boolean;
  failureReason: string | null;
  linkedEventIds: string[];
  linkedIntelFactIds: string[];
  ownerSystem: string;
}

export interface IntelFact {
  id: string;
  subjectType: 'EVENT' | 'OPERATION' | 'COUNTRY' | 'LEADER' | 'OTHER';
  subjectId: string;
  title: string;
  summary: string;
  sourceType: 'SIGINT' | 'HUMINT' | 'IMINT' | 'OSINT' | 'DEFAULT';
  confidence: number; // 0-100
  discoveredTick: number;
  expiresTick: number | null;
  verified: boolean;
  disputed: boolean;
  visibilityScope: 'PUBLIC' | 'PLAYER' | 'CLASSIFIED';
  relatedCountryIds: string[];
  relatedEventIds: string[];
  relatedOperationIds: string[];
  tags: string[];
  metadata: Record<string, any>;
}

export interface TreatyState {
  id: string;
  name: string;
  type: 'ALLIANCE' | 'NON_AGGRESSION' | 'TRADE' | 'DENUCLEARIZATION' | 'CEASE_FIRE';
  signatoryCountryIds: string[];
  obligations: string[];
  enforcementStrength: number; // 0-100
  secrecyLevel: number; // 0-100
  startTick: number;
  expirationTick: number | null;
  complianceByCountry: Record<string, number>; // 0-100 compliance scores
  violationHistory: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'TERMINATED';
  blocEffects: Record<string, any>;
  tags: string[];
}

export interface CanonicalWorld {
  countriesById: Record<string, CountryState>;
  leadersById: Record<string, LeaderState>;
  eventsById: Record<string, WorldEvent>;
  operationsById: Record<string, OperationState>;
  intelFactsById: Record<string, IntelFact>;
  treatiesById: Record<string, TreatyState>;
  tick: number;
  selectedCountryId: string | null;
  selectedLeaderId: string | null;
  timeline: { tick: number; desc: string; category: string }[];
  derivedIndexes: {
    unstableCountries: string[];
    nuclearCountries: string[];
    sanctionedCountries: string[];
    highRiskFlashpoints: { countryId: string; score: number; hazardReason: string }[];
    globalAverageStability: number;
    globalTensionIndex: number; // 0-100
  };
  scenarioMeta: Record<string, any>;
  busEventQueue?: BusEvent[];
  busEventHistory?: BusEvent[];
}
