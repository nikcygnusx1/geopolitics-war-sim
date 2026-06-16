import { CommodityType } from '../types';

export type ForestHorizon = '1T' | '3T' | '6T' | '12T'; // ticks
export type StressLabel = 'Stable' | 'Tightening' | 'Fragile' | 'Shock Propagation' | 'Systemic Stress' | 'Crisis Transmission' | 'Partial Recovery';

export interface ForecastTimelinePoint {
  tick: number;
  baselineValue: number;
  proposedValue: number;
  bestCaseValue: number;
  worstCaseValue: number;
  volatility: number;
}

export interface ForecastConfidenceBand {
  horizon: ForestHorizon;
  low: number;
  high: number;
  confidence: number; // 0-100%
  volatilityWarning: boolean;
}

export interface ForecastBranch {
  branchId: 'BASELINE' | 'PROPOSED' | 'STRESS_ALT' | 'RECOVERY_ALT';
  name: string;
  probability: number; // %
  narrative: string;
  gdpPath: number[]; // future values
  inflationPath: number[];
  unrestPath: number[];
}

export interface EconomicForecastSnapshot {
  countryId: string;
  baseTick: number;
  horizons: Record<ForestHorizon, {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    economicStress: number;
    confidence: number;
  }>;
  confidenceBands: Record<string, ForecastConfidenceBand>;
  branches: ForecastBranch[];
  latestNarrative: string;
}

export interface ActionSecondOrderEffect {
  title: string;
  sourceSystem: 'TRADE' | 'ENERGY' | 'SANCTIONS' | 'FININT' | 'GOTHAM';
  description: string;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  escalationRiskScore: number; // 0-100
}

export interface ActionEconomicPreview {
  id: string;
  actionKey: string;
  title: string;
  initiatingActor: string;
  targetActor?: string;
  likelihoodTopLine: string;
  winners: string[];
  losers: string[];
  mostExposedSectors: string[];
  mostAffectedCommodities: CommodityType[];
  gdpImpactPercentage: number; // proposed delta % vs baseline
  inflationImpactPercentage: number; // proposed delta CPI
  secondOrderEffects: ActionSecondOrderEffect[];
  confidenceScore: number; // 0-100
  blowbackEscalationRisk: number; // 0-100
  underlyingAssumptions: string[];
  realizedImpact?: {
    ticksElapsed: number;
    realizedGdpChange: number;
    realizedInflationChange: number;
    accuracyScore: number; // how close forecast was vs actual
  };
}

export interface SectorContributionBreakdown {
  contributionToGdpPct: number;
  growthContribution: number; // raw value contribution to local growth rate
  importShortageImpact: number; // 0-10
  exportConstraintImpact: number; // 0-10
  energyShockVulnerability: number; // 0-10
  sanctionsExposureScore: number; // 0-10
  routeFrictionImpact: number; // 0-10
  laborStressScore: number; // 0-10
}

export interface SectorDrilldownModel {
  countryId: string;
  sectorKey: string;
  displayName: string;
  currentValueUSD: number; // in billions
  shareOfGDP: number; // % of country GDP
  status: 'RESILIENT' | 'NOMINAL' | 'STRESSED' | 'CRITICAL';
  trend: 'STABLE' | 'GROWING' | 'RECOVERING' | 'DECLINING' | 'COLLAPSING';
  decomposition: SectorContributionBreakdown;
  substitutionCapacityScore: number; // 0-100 (resilience indicator)
  forecastHorizonOutlook: Record<ForestHorizon, 'STABLE' | 'EXPANSION' | 'SLOWDOWN' | 'CONTRACTION' | 'CRITICAL'>;
}

export interface CommodityStressRecord {
  commodity: CommodityType;
  priceStress: number; // 0-100
  supplyTightness: number; // 0-100
  demandSurge: number; // 0-100
  routeFragility: number; // 0-100
  sanctionsExposure: number; // 0-100
  importerVulnerability: number; // 0-100
  volatilityIndex: number; // 0-100
  forecastedDirection: 'SPIKING' | 'RISING' | 'STABLE' | 'SOFTENING' | 'CRASHING';
  confidenceScore: number; // 0-100
}

export interface CommodityHeatmapCell {
  rowId: string; // commodity
  colId: string; // country ID or Region or Horizon or Stress Dimension
  value: number; // normalized 0-100 for the color gradient
  rawString: string; // readable hover representation
}

export interface WorldStressRibbonSegment {
  dimension: 'INFLATION' | 'ENERGY' | 'TRADE' | 'SANCTIONS' | 'FINANCE' | 'COMMODITY' | 'DEBT' | 'CHOKEPOINT' | 'CONFIDENCE';
  stressScore: number; // 0-100
  weight: number; // contribution to overall ribbon sum
  trend: 'UP' | 'DOWN' | 'STABLE';
  primaryHotspots: string[]; // countries or regions driving the stress
}

export interface WorldEconomicStressState {
  globalStressIndex: number; // 0-100 overall score
  prevTickIndex: number;
  directionVelocity: number; // rate of change
  synchronizedScale: 'LOCALIZED' | 'REGIONAL_PROPAGATION' | 'SECTORAL_CRISIS' | 'SYNCHRONIZED_STRESS' | 'GLOBAL_SYSTEMIC_CRISIS';
  label: StressLabel;
  components: WorldStressRibbonSegment[];
  narrativeOverview: string;
}

export interface CountryEconomicSummary {
  countryId: string;
  name: string;
  isoCode: string;
  currentGdpB: number;
  headlineGrowth: number;
  headlineInflation: number;
  debtToGdpRatio: number;
  macroTrend: 'BOOMING' | 'STABLE' | 'STAGNANT' | 'DETERIORATING' | 'CRISIS';
  topStressedSectors: { sector: string; score: number }[];
  topStressedCommodities: { commodity: CommodityType; stress: number }[];
  tradeVulnerabilityIndex: number; // 0-100
  energyVulnerabilityIndex: number; // 0-100
  financeFragilityIndex: number; // 0-100
  sanctionsBlowbackExposure: number; // 0-100
  worldStressContributionPct: number; // % contribution to global stress index
}

export interface EconomicRiskFlag {
  id: string;
  countryId: string;
  severity: 'WARNING' | 'CRITICAL' | 'CATASTROPHIC';
  systemSource: 'MACRO' | 'TRADE' | 'ENERGY' | 'SANCTIONS' | 'FININT';
  title: string;
  triggerCondition: string;
  description: string;
}

export interface EconomicWatchItem {
  id: string;
  title: string;
  type: 'COMMODITY' | 'ROUTE' | 'NATION' | 'SECTOR';
  targetLabel: string;
  activeTrend: 'HEATING_UP' | 'COOLING_DOWN' | 'STABLE_STRESS';
  stressLevel: number;
  arachneReferenceAlertId?: string;
}

export interface EconomicUISelectionState {
  activeCountryId: string;
  activeSectorKey: string;
  activeCommodityKey: CommodityType;
  heatmapGridMode: 'COMMODITY_X_COUNTRY' | 'COMMODITY_X_REGION' | 'COMMODITY_X_HORIZON' | 'COMMODITY_X_DIMENSION';
  forecastHorizon: ForestHorizon;
  forecastBranchId: 'BASELINE' | 'PROPOSED' | 'STRESS_ALT' | 'RECOVERY_ALT';
  workspaceComparableCountries: string[];
  workspaceComparableSectors: string[];
  workspaceComparableCommodities: CommodityType[];
}
