// Sovereign Agent Core Types (Module 4.1)
import { ScenarioId } from '../types';

export interface IdeologyProfile {
  liberalInstitutionalist: number;     // 0-100, rules-based, global governance
  nationalistSovereigntist: number;    // 0-100, nation-first, autonomy
  revolutionaryRevisionist: number;    // 0-100, break current order
  pragmaticTransactional: number;      // 0-100, deal-making, no deep loyalty
  authoritarianPluralistic: number;    // 0-100, centralized ruling vs open polity
  religiousSecularGovernance: number;   // 0-100, religious vs secular laws
  civilizationalPosture: number;       // 0-100, civilizational defense/exceptionalism
  universalistVsParticularist: number;  // 0-100, export values vs respect local styles
  description: string;
}

export type EconomicDevelopmentModelTendency =
  | 'EXPORT_MANUFACTURING'
  | 'RENTIER_COMMODITY'
  | 'FINANCIALIZED_SERVICES'
  | 'DEVELOPMENTAL_INDUSTRIAL_POLICY'
  | 'TECHNOLOGY_INNOVATION'
  | 'AID_REMITTANCE_DEPENDENT'
  | 'SANCTIONS_EVASION_ADAPTIVE'
  | 'MILITARIZED_COMMAND'
  | 'MIXED_MARKET_DEVELOPMENTALISM';

export interface EconomicDevelopmentModelProfile {
  tendency: EconomicDevelopmentModelTendency;
  exportDependencyPct: number;    // 0-100
  rentierConcentrationPct: number; // 0-100
  sanctionsResilience: number;    // 0-100
  stateControlPct: number;        // 0-100
  description: string;
}

export type SecurityDoctrineTendency =
  | 'FORWARD_DEFENSE'
  | 'DETERRENCE_HEAVY'
  | 'STRATEGIC_AMBIGUITY'
  | 'FORTRESS_DEFENSE'
  | 'EXPEDITIONARY_INTERVENTIONISM'
  | 'PROXY_COMPETITION'
  | 'ESCALATION_DOMINANCE'
  | 'LIMITED_WAR_RESTRAINT'
  | 'NUCLEAR_SHADOW_CAUTION'
  | 'MARITIME_CHOKEPOINT'
  | 'INTERNAL_SECURITY_FIRST';

export interface SecurityDoctrineProfile {
  tendency: SecurityDoctrineTendency;
  forcePostureOffensive: number; // 0-100
  escalationThreshold: number;   // 0-100
  allianceCommitment: number;    // 0-100
  covertPropensity: number;      // 0-100
  description: string;
}

export type RegionalAmbitionTendency =
  | 'STATUS_QUO_BALANCER'
  | 'LOCAL_HEGEMON_ASPIRANT'
  | 'REVISIONIST_CHALLENGER'
  | 'PROTECTOR_PATRON'
  | 'AUTONOMY_MIDDLE_POWER'
  | 'SHELTERED_SMALL_STATE'
  | 'BRIDGE_MEDIATOR'
  | 'OFFSHORE_BALANCER';

export interface RegionalAmbitionProfile {
  tendency: RegionalAmbitionTendency;
  expansionistDesire: number; // 0-100
  blocLeadershipInterest: number; // 0-100
  mediationDisposition: number;   // 0-100
  description: string;
}

export type LeadershipVolatilityTendency =
  | 'INSTITUTIONAL_CONTINUITY'
  | 'FACTIONAL_INSTABILITY'
  | 'POPULIST_IMPROVISATION'
  | 'COUP_SUSCEPTIBILITY'
  | 'SUCCESSION_INSTABILITY'
  | 'PURGING_TENDENCY'
  | 'CABINET_FRAGMENTATION'
  | 'CRISIS_OVERREACTION';

export interface LeadershipVolatilityProfile {
  tendency: LeadershipVolatilityTendency;
  swingRate: number;              // 0-100 speed of priority pivot under stress
  unpredictabilityIndex: number;  // 0-100
  regimeSustenanceUrgency: number;// 0-100 focus on self-preservation
  description: string;
}

export interface NationalIdentityVector {
  countryId: string;
  ideology: IdeologyProfile;
  economy: EconomicDevelopmentModelProfile;
  security: SecurityDoctrineProfile;
  regional: RegionalAmbitionProfile;
  volatility: LeadershipVolatilityProfile;
}

export type StrategicGoalClass =
  | 'SURVIVAL'
  | 'DETERRENCE'
  | 'PRESTIGE'
  | 'ECONOMIC_RECOVERY'
  | 'ALLIANCE_PRESERVATION'
  | 'ADVERSARY_WEAKENING'
  | 'REGIONAL_DOMINANCE'
  | 'TERRITORIAL_DEFENSE'
  | 'SANCTIONS_RELIEF'
  | 'INSTITUTIONAL_LEGITIMACY'
  | 'REGIME_STABILIZATION'
  | 'MILITARY_BUILDUP'
  | 'TECHNOLOGICAL_CATCH_UP'
  | 'SOFT_POWER_ACCUMULATION'
  | 'COVERT_PREPARATION';

export interface StrategicGoal {
  id: string;
  countryId: string;
  goalClass: StrategicGoalClass;
  title: string;
  priorityScore: number; // 0-100
  targetCountryId?: string;
  ticksActive: number;
  successCondition: string;
}

export interface GoalPriorityRecord {
  goalId: string;
  basePriority: number;
  threatMultiplier: number;
  opportunityBonus: number;
  identityFitWeight: number;
  finalScore: number;
}

export interface GoalStack {
  countryId: string;
  activeGoals: StrategicGoal[];
  priorityRecords: GoalPriorityRecord[];
}

export type PlanStepAction =
  | 'BUILD_ECONOMIC_LEVERAGE'
  | 'CULTIVATE_ALLIANCE'
  | 'SHIFT_MILITARY_POSTURE'
  | 'TEST_RED_LINES'
  | 'PREPARE_SANCTIONS'
  | 'DIPLOMATIC_PRESSURE'
  | 'MOBILIZE_COVERT_ASSETS'
  | 'DISINFORMATION_INTELLIGENCE'
  | 'ACCUMULATE_LEGAL_CASE'
  | 'EXPLOIT_MARKET_DEPENDENCY'
  | 'SIGNAL_CONCILIATION'
  | 'DEESCALATE_BUY_TIME';

export interface PlanStep {
  stepIndex: number;
  actionType: PlanStepAction;
  targetCountryId?: string;
  description: string;
  durationTicks: number;
  executionProgressTicks: number;
  completed: boolean;
}

export interface PlanCommitmentState {
  planningThreshold: number; // 0-100 cost to start
  confidenceScore: number;   // 0-100 estimated confidence in success
  sunkCostWeight: number;    // cumulative ticks and capital invested
  backedDownPenalties: number;// loss of prestige if aborted
}

export interface PlanExecutionState {
  currentStepIndex: number;
  totalSteps: number;
  remainingTicks: number;
  isActive: boolean;
  status: 'PLANNING' | 'EXECUTING' | 'INTERRUPTED' | 'FALLBACK_TRIGGERED' | 'FINISHED' | 'ABORTED';
}

export interface StrategicPlan {
  id: string;
  countryId: string;
  parentGoalIds: string[];
  title: string;
  planningHorizonTicks: number; // 5-15 ticks
  desiredEndState: string;
  steps: PlanStep[];
  prerequisites: string[];
  resourceCostB: number;
  escalationRisk: number; // 0-100
  secrecyScore: number;   // 0-100 (high = invisible in dossiers without deep intel)
  abortConditions: string[];
  successCriteria: string;
  fallbackPathSteps: PlanStep[];
}

export type ReplanningType = 'SOFT_UPDATE' | 'MEDIUM_INTERRUPTION' | 'HARD_INTERRUPTION' | 'EMERGENCY_OVERRIDE';

export interface PlanInterruptionRecord {
  id: string;
  tick: number;
  triggerEvent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  actionTaken: ReplanningType;
  description: string;
}

export type ReplanningTriggerType =
  | 'WAR_OUTBREAK'
  | 'MILITARY_MOBILIZATION'
  | 'LEADERSHIP_CHANGE'
  | 'TREATY_VIOLATION'
  | 'SANCTIONS_SHOCK'
  | 'MARKET_COLLAPSE'
  | 'ALLIANCE_FRACTURE'
  | 'UNSC_VOTE_VETO'
  | 'CO_OP_EXPOSURE'
  | 'BLOC_ACCESSION'
  | 'DOMESTIC_FISCAL_CRISIS'
  | 'CYBER_ATTACK_ATTRIBUTION'
  | 'PLAYER_ACTION_CROSS_THRESHOLD';

export interface ReplanningTrigger {
  id: string;
  triggerType: ReplanningTriggerType;
  primaryActorCountryId?: string;
  linkedSector: string; // 'military' | 'finance' | 'bloc' | 'treaty' | 'un' | 'cyber'
  detectionThresholdPercent: number;
}

export type ThreatCategory =
  | 'EXISTENTIAL'
  | 'BORDER_SECURITY'
  | 'REGIME_SURVIVAL'
  | 'ECONOMIC_STRANGULATION'
  | 'COVERT_SUBVERSION'
  | 'INSTITUTIONAL_ISOLATION'
  | 'IDEOLOGICAL_CONTAMINATION'
  | 'PRESTIGE_HUMILIATION'
  | 'UNPREDICTABILITY'
  | 'OPPORTUNISM';

export interface ThreatMemoryRecord {
  id: string;
  targetCountryId: string;
  category: ThreatCategory;
  severityScore: number; // 0-100
  description: string;
  launchTick: number;
  lastReinforcedTick: number;
  decayRateIndex: number; // 0.05-0.2
}

export type TrustCategory =
  | 'PUBLIC_LEGITIMACY'
  | 'ELITE_OPERATIONAL'
  | 'STRATEGIC_RELIABILITY'
  | 'INSTITUTIONAL'
  | 'LEADER_PERSONAL';

export interface TrustMemoryRecord {
  id: string;
  targetCountryId: string;
  category: TrustCategory;
  trustScore: number; // 0-100 (high is cooperative, low is betrayer)
  description: string;
  establishedTick: number;
  lastVerifiedTick: number;
  promiseKeptCounter: number;
  promiseBrokenCounter: number;
}

export interface StrategicPerceptionState {
  countryId: string;
  adversaries: { [countryId: string]: boolean };
  reliableAllies: { [countryId: string]: boolean };
  distractionTargets: { [countryId: string]: string }; // descriptions of other states' focus
  perceivedRegionalTensions: number; // 0-100
  apparentDeceptionPostures: { [countryId: string]: 'TRANSPARENT' | 'DECEPTIVE' | 'UNCERTAIN' };
}

export interface OpportunityAssessment {
  targetCountryId: string;
  type: string;
  description: string;
  score: number; // 0-100
  militaryVulnerability: number; // 0-100
  diplomaticIsolation: number; // 0-100
  economicSanctionsFatigue: number; // 0-100
  allianceCohesionRank: number; // 0-100
}

export interface ConstraintAssessment {
  unrestRisk: number; // 0-100
  treasuryStress: number; // 0-100
  readinessDeficit: number; // 0-100
  treatyObligationsCount: number;
  sanctionsPainPercent: number; // 0-100
  recreationalSecurityBuffer: number; // defensive buffer
}

export interface AdversaryModel {
  countryId: string;
  estimatedMilitaryPower: number;
  estimatedNuclearOptionPercent: number;
  escalationRateRating: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE';
  sanctionConfidencePercent: number;
  bluffFrequency: number; // 0-100
}

export interface AllyModel {
  countryId: string;
  loyaltyPercent: number;
  jointResourceBudgetB: number;
  militaryInterventionProbability: number;
}

export interface StrategicLearningRecord {
  tick: number;
  learnedConcept: string;
  affectedThreatWeight: number;
  actionAdjusted: string;
}

export interface AgentIntentSnapshot {
  targetCountryId?: string;
  primaryActiveGoalClass: StrategicGoalClass;
  actionPreviewLabel: string;
  planningHorizonText: string;
  secrecyLevel: 'OPEN' | 'INFERRED' | 'VEILED' | 'CLASSIFIED';
  confidenceRatingPct: number;
}

export interface AgentActionPreview {
  countryId: string;
  actionName: string;
  targetCountryId?: string;
  expectedLaunchTickDelta: number;
}

export interface SovereignAgentState {
  countryId: string;
  identity: NationalIdentityVector;
  goalStack: GoalStack;
  activePlan: StrategicPlan | null;
  planExecution: PlanExecutionState;
  planCommitment: PlanCommitmentState;
  interruptionHistory: PlanInterruptionRecord[];
  threatMemory: ThreatMemoryRecord[];
  trustMemory: TrustMemoryRecord[];
  perception: StrategicPerceptionState;
  opportunities: OpportunityAssessment[];
  constraints: ConstraintAssessment;
  adversaryModels: { [countryId: string]: AdversaryModel };
  allyModels: { [countryId: string]: AllyModel };
  learningLog: StrategicLearningRecord[];
  intentSnapshot: AgentIntentSnapshot;
  actionPreview: AgentActionPreview | null;
  lastReplannedTick: number;
}
