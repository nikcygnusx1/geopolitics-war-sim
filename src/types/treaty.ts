import { TreatyState } from '../types';

export interface TreatyObligation {
  id: string;
  category: 'MILITARY' | 'ECONOMIC' | 'INTELLIGENCE' | 'SANCTIONS' | 'CYBER' | 'POSTURE' | 'BASE_ACCESS';
  description: string;
  scope: string; // e.g. "Mutual defense on sovereign breach", "Tariff flat rate of 5%"
  triggerCondition: string;
  observability: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET';
  complianceScore: number; // 0-100
  violationSeverityWeight: number; // 0-100
  attachedPenalties: string[]; // Penalty ID references
}

export interface TreatyDurationProfile {
  startTick: number;
  durationTicks: number | null; // null for indefinite
  probationaryTicksEndTime: number | null;
  renewalWindowStartTicksDelta: number; // Ticks before expiration where negotiation/renewal is active
  sunsetClauseDescription: string | null;
  reviewIntervalTicks: number | null;
  lastReviewTick: number | null;
  withdrawalNoticeTicks: number; // Ticks of notice required to exit honorably
}

export interface TreatyPenaltyProfile {
  id: string;
  type: 'CREDIBILITY_DEGRADATION' | 'TARIFF_SNAPBACK' | 'COLLAPSE' | 'MILITARY_MOBILIZATION' | 'SANCTIONS_ALIGNMENT' | 'FINANCIAL_RESTRAINT';
  severity: 'SOFT' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  description: string;
  automaticTriggerTickCount: number;
}

export interface TreatyHiddenProtocol {
  id: string;
  title: string;
  clauseSummaryPublic: string; // What the public thinks this section says
  clauseSummaryPrivate: string; // The real hidden commitment/exemption
  signatoriesAllowed: string[]; // Countries privy to this protocol
  leverageOffset: number; // Leverage value added to negotiations
  exposed: boolean;
  exposureImpactScore: number; // Credibility penalty multiplier if secret is leaked
}

export interface TreatyInspectionRule {
  id: string;
  agencyType: 'UN_INSPECTORS' | 'JOINT_MILITARY' | 'SATELLITE_SURVEILLANCE' | 'COVERT_INTELLIGENCE';
  frequencyTicks: number;
  lastInspectionTick: number | null;
  evasionDifficulty: number; // 0-100
  effectivenessIndex: number; // 0-100
}

export interface TreatyViolationRecord {
  tick: number;
  treatyId: string;
  treatyName: string;
  violatorId: string;
  clauseId: string;
  severity: 'SOFT' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  breachType: 'TECHNICAL_NON_COMPLIANCE' | 'DELAYED_COMPLIANCE' | 'AMBIGUOUS_INTERPRETATION' | 'CONCEALED_VIOLATION' | 'INTENTIONAL_BREACH' | 'COERCED_BREACH';
  resolved: boolean;
  notes: string;
}

export interface TreatyCredibilityMemory {
  countryId: string;
  overallScore: number; // 0-100
  categoryScores: {
    military: number;
    trade: number;
    inspection: number;
    intelligence: number;
    sanctions: number;
  };
  violationCount: number;
  goodFaithFulfilmentStreak: number;
  history: {
    tick: number;
    treatyId: string;
    treatyName: string;
    actionType: 'FULFILLED' | 'SUSPECTED_BREACH' | 'CONFIRMED_BREACH' | 'CONCEALED_BREACH' | 'OPPORTUNISTIC_EXIT' | 'HONORABLE_EXIT';
    credibilityDelta: number;
    description: string;
  }[];
}

// Complete rich treaty extension of current TreatyState
export interface RichTreatyState extends TreatyState {
  detailedObligations: TreatyObligation[];
  durationProfile: TreatyDurationProfile;
  penalties: TreatyPenaltyProfile[];
  hiddenProtocols: TreatyHiddenProtocol[];
  inspectionRules: TreatyInspectionRule[];
  credibilityImpactToDate: Record<string, number>;
  publicText: string;
  privateText: string;
  isMultilateral: boolean;
  fatigueCostPerTick: number; // How much domestic tension is added per tick for keeping this active
  legacyEffects: string[]; // Past repercussions that stay active after treaty expires or collapses
}

// Negotiation structures
export interface TreatyConcessionItem {
  id: string;
  type: 'TARIFF_REDUCTION' | 'TERRITORIAL_ACCESS' | 'INTELLIGENCE_SHARING' | 'WEAPONS_LIMIT_AGREEMENT' | 'COVERT_FINANCING' | 'SANCTIONS_ALIGNMENT' | 'MUTUAL_DEFENSE_UPGRADE';
  description: string;
  offeredBy: string;
  recipientId: string;
  concessionValue: number; // Relative utility score
  leverageOffset: number;
  politicalCost: number; // 0-100 cost to domestic political capital
}

export interface TreatyOfferPackage {
  title: string;
  type: 'ALLIANCE' | 'NON_AGGRESSION' | 'TRADE' | 'DENUCLEARIZATION' | 'CEASE_FIRE' | 'INTEL_SHARING' | 'BASE_ACCESS';
  proposerId: string;
  recipientId: string;
  publicTextSummary: string;
  privateTextSummary: string;
  durationTicks: number;
  detailedObligations: TreatyObligation[];
  hiddenProtocols: TreatyHiddenProtocol[];
  offeredConcessions: TreatyConcessionItem[];
  demandedConcessions: TreatyConcessionItem[];
  isMultilateral: boolean;
  secrecyLevel: number; // 0-100
  enforcementStrength: number; // 0-100
}

export interface TreatyCounteroffer {
  id: string;
  roundIndex: number;
  timestampTick: number;
  offeredBy: string;
  package: TreatyOfferPackage;
  justificationText: string;
}

export interface TreatyRedLineProfile {
  id: string;
  category: 'TERRITORY' | 'MILITARY_EXPANSION' | 'SECRECY_LEAK' | 'TARIFFS' | 'INSPECTIONS' | 'INTELLIGENCE_VIOLATION' | 'COVERT_AGREED_LIMITS';
  description: string;
  associatedCountryId: string;
  severity: number; // Trigger threshold
  currentTriggerScore: number;
  breachEventDescription: string;
}

export interface TreatyBargainingLeverageState {
  militaryBalanceRatio: number; // Relative balance
  sanctionsPressureIndex: number; // 0-100
  tradeDependencePct: number; // 0-100
  energyDependencePct: number; // 0-100
  financialStressIndex: number; // 0-100
  allianceSupportRating: number; // 0-100
  urgencyAsymmetryFactor: number; // Positive = player urgent, negative = adversary urgent
  intelligenceAdvantageScore: number; // 0-100 based on Sigint/Humint
  currentCredibilityRating: number; // 0-100
  domesticStabilityBuffer: number; // 0-100
  treatyFatigueIndex: number; // 0-100
}

export interface TreatyNegotiationLog {
  tick: number;
  roundIndex: number;
  actorId: string;
  action: 'PROPOSAL' | 'COUNTEROFFER' | 'RED_LINE_SIGNALED' | 'CONCESSION_TRADED' | 'ACCEPTED' | 'WALKED_AWAY';
  description: string;
}

export interface TreatyNegotiationSession {
  id: string;
  title: string;
  playerId: string;
  adversaryId: string;
  stage: 'INITIAL_PROPOSAL' | 'CONCESSION_TRADING' | 'RED_LINE_ALERT' | 'DRAFT_FINAL' | 'COMPLETE' | 'FAILED_LIMIT' | 'WALKED_AWAY';
  currentOfferPackage: TreatyOfferPackage;
  negotiationHistory: TreatyCounteroffer[];
  negotiationLogs: TreatyNegotiationLog[];
  adversaryRedLines: TreatyRedLineProfile[];
  playerAssessedLeverage: TreatyBargainingLeverageState;
  zoneOfPossibleAgreementEstimated: {
    overlapExisted: boolean;
    confidenceLevel: number;
    frictionPoints: string[];
    partnerPriorities: string[];
    feasibilityRating: number; // 0-100
  };
  roundsRemaining: number;
  deadlineTicks: number; // Crisis duration / timer pressure count
  provisionalAccepted: boolean;
}

export interface TreatyLegacyEffect {
  id: string;
  sourceTreatyId: string;
  originalName: string;
  type: 'SCARRED_TRUST' | 'INSTITUTIONAL_PRECEDENT' | 'TERRITORIAL_PRECEDENT' | 'MILITARY_DOCTRINE_RESTRICTION' | 'TRADE_SKEW_LEGACY';
  durationTicksRemaining: number;
  description: string;
  opinionModValue: number;
  economicTractionFactor: number;
}
