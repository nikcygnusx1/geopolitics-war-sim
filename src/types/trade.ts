export type StrategicTradeCategory = 
  | 'energy'
  | 'food'
  | 'minerals'
  | 'inputs'
  | 'consumer'
  | 'tech'
  | 'defense'
  | 'pharma'
  | 'services';

export interface TradeLocation {
  x: number; // 0-100 grid mapping
  y: number; // 0-100 grid mapping
}

export type RouteType = 'port' | 'pipeline' | 'corridor' | 'sealane';

export interface RouteNode {
  id: string;
  name: string;
  type: RouteType;
  coordinates: TradeLocation;
  capacityIndex: number; // Scale 0-100 of max capacity flow
  currentUsage: number; // 0 - 100 actual percentage utilization
  vulnerabilityScore: number; // 0-100 chokepoint / static risk
  operationalStatus: 'OPERATIONAL' | 'STRESSED' | 'DISRUPTED' | 'BLOCKED';
  controllingCountryIds: string[];
  description: string;
}

export interface RouteSegment {
  id: string;
  name: string;
  type: RouteType;
  originNodeId: string;
  destNodeId: string;
  capacityIndex: number;
  status: 'OPERATIONAL' | 'STRESSED' | 'DISRUPTED' | 'BLOCKED';
  chokepointRisk: number; // 0-100
  controlCountryId?: string;
  description: string;
  geoPoints?: TradeLocation[]; // Midpoint offsets for map routing curved lines
}

export interface RoutePath {
  id: string;
  name: string;
  routeType: RouteType;
  segments: RouteSegment[];
  totalVulnerabilityScore: number; // Calculated combo
  isBlocked: boolean;
  reroutingCostMultiplier: number; // e.g. 1.35 if alternate is forced
}

export type RestrictionLevel = 'NONE' | 'TARIFFS' | 'SECTORAL' | 'TOTAL_RUPTURE';

export interface TradeRestriction {
  level: RestrictionLevel;
  tariffRate: number; // Percentage e.g. 25 for 25% tariff
  restrictedCategories: StrategicTradeCategory[];
  enforcedByActorCountryId: string;
}

export interface TradeLink {
  categoryId: StrategicTradeCategory;
  direction: 'IMPORT' | 'EXPORT';
  weightShare: number; // 0-100 percentage of category in bilateral mix
  valueIndexB: number; // Absolute annual value in $B
  strategicImportance: number; // 1-10 priority classification
  substitutability: number; // 1-10 difficulty to find alternative (closer to 10 is harder)
  routeDependence: number; // 1-10 vulnerability to route disruption
  disruptionSensitivity: number; // 0-100 multiplier of how fast it impacts GDP / Inflation
  policyExposure: number; // 0-100 susceptibility to coercion
}

export interface BilateralTradeProfile {
  exporterCountryId: string;
  importerCountryId: string;
  totalTradeWeight: number; // Overall weight
  totalTradeValueB: number; // Cumulative value in $B
  categoryBreakdown: TradeLink[];
  importDependenceScore: number; // calculated 0-100 exposure index for importer
  exportDependenceScore: number; // calculated 0-100 exposure index for exporter
  substitutionDifficulty: number; // blended weighted rating
  strategicSensitivity: number; // blended weighted rating
  routeIds: string[]; // Active route segment or node path IDs carrying this flow
  currentRestrictionLevel: RestrictionLevel;
  currentTariffPressure: number; // ACTIVE tariff rate imposed %
  restrictedCategories: StrategicTradeCategory[];
  bilateralTradeTrend: 'EXPANDING' | 'STABLE' | 'DECLINING' | 'COLLAPSED';
  lastUpdatedTick: number;
}

export interface TradeWarCampaign {
  id: string;
  actorCountryId: string;
  targetCountryId: string;
  escalationStage: number; // 0 = negotiations, 1 = tariffs, 2 = sectoral restriction, 3 = total rupture
  activeTariffRate: number;
  restrictedCategories: StrategicTradeCategory[];
  provocationScore: number; // 0-100 conflict intensity index
  intelligenceSummary: string;
  retaliationLikelihood: number; // 0-100
  history: { tick: number; actionSummary: string }[];
}

export interface RouteDisruptionRecord {
  routeId: string;
  severity: number; // 0-100
  disruptedByCategory: StrategicTradeCategory[];
  isRerouted: boolean;
  activeReroutePathId?: string;
  reroutingDelayTicks: number;
  costSurchargeB: number;
  summary: string;
}

export interface TradeDependencySummary {
  countryId: string;
  topImportPartners: { partnerCountryId: string; valueB: number; dependenceScore: number }[];
  topExportPartners: { partnerCountryId: string; valueB: number; dependenceScore: number }[];
  routeVulnerabilityIndex: number; // 0-100 index of route-dependent exposure
  tradeConcentrationRatio: number; // Herfindahl index style concentration 0-100
  coerciveLeverageScore: number; // Overall export asymmetrical dependency leverage
}

export interface TradeExposureScore {
  gdpImpactAtRiskB: number;
  criticalShortageRiskScore: number; // 0-100
  inflationExposureScore: number; // 0-100
  primaryVulnerabilityCategory: StrategicTradeCategory;
}

export interface RerouteOption {
  originalRouteId: string;
  alternateRouteId: string;
  capacityAvailableIndex: number;
  additionalCostFactor: number; // e.g. 1.25 (+25% shipping delay/fees)
  feasibilityIndex: number; // 0-100 approval/geopolitics score
}

export interface TradeIncident {
  id: string;
  tick: number;
  type: 'TARIFF_ALERT' | 'SECTORAL_EMBARGO' | 'ROUTE_DISRUPTION' | 'COERCIVE_LEVERAGE_PRESSURE' | 'REROUTE_INCIDENT';
  actorCountryId: string;
  targetCountryId?: string;
  routeId?: string;
  summary: string;
  economicImpactRating: 'MINIMAL' | 'STRESSED' | 'SEVERE';
}
