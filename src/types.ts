export type Ideology = 'DEMOCRACY' | 'AUTOCRACY' | 'MILITARY_JUNTA' | 'THEOCRACY' | 'TECHNOCRACY' | 'OLIGARCHY';

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
}

export interface WorldState {
  countries: { [id: string]: Country };
  activeStrikes: BallisticStrike[];
  commodityMarkets: CommodityMarket[];
  activeArmsDeals: ArmsDeal[];
  globalThreatLevel: ThreatLevel;
  nuclearExchangeOccurred: boolean;
  globalEventLog: { tick: number; text: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SYSTEM' }[];
  currentTick: number;
  lastWarDeclarationTick?: number;
  pacingPreset?: PacingPreset;
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

