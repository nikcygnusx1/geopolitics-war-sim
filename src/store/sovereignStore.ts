import { create } from 'zustand';
import { produce } from 'immer';
import { 
  SovereignAgentState, 
  NationalIdentityVector, 
  IdeologyProfile, 
  EconomicDevelopmentModelProfile, 
  SecurityDoctrineProfile, 
  RegionalAmbitionProfile, 
  LeadershipVolatilityProfile, 
  StrategicGoal, 
  GoalStack, 
  GoalPriorityRecord, 
  StrategicPlan, 
  PlanStep, 
  PlanExecutionState, 
  PlanCommitmentState, 
  PlanInterruptionRecord, 
  ReplanningTrigger, 
  ThreatMemoryRecord, 
  TrustMemoryRecord, 
  StrategicPerceptionState, 
  OpportunityAssessment, 
  ConstraintAssessment, 
  AdversaryModel, 
  AllyModel, 
  StrategicLearningRecord, 
  AgentIntentSnapshot, 
  AgentActionPreview,
  StrategicGoalClass,
  PlanStepAction,
  ThreatCategory,
  TrustCategory,
  ReplanningType
} from '../types/sovereign';
import { WorldState, Country } from '../types';
import { INITIAL_COUNTRIES } from '../data/countries';
import { ConsequenceEngine } from '../sim/consequenceEngine';

interface SovereignStoreActions {
  initializeAgents: () => void;
  tickSovereignAgents: (worldDraft: WorldState, playerCountryId: string) => void;
  handleWorldEvent: (
    worldDraft: WorldState,
    eventType: string,
    actorCountryId: string,
    targetCountryId?: string,
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY',
    metadata?: Record<string, any>
  ) => void;
  addThreatMemory: (countryId: string, targetId: string, category: ThreatCategory, severity: number, desc: string) => void;
  addTrustMemory: (countryId: string, targetId: string, category: TrustCategory, score: number, desc: string) => void;
  setAgentState: (countryId: string, state: Partial<SovereignAgentState>) => void;
  resetSovereignStore: () => void;
}

// 5-Vector Identity Profiles seeding generator
export function generateIdentityVector(countryId: string): NationalIdentityVector {
  const c = INITIAL_COUNTRIES[countryId];
  const name = c?.name || countryId;

  // 1. Ideology Profile Default Template
  const ideology: IdeologyProfile = {
    liberalInstitutionalist: 10,
    nationalistSovereigntist: 40,
    revolutionaryRevisionist: 10,
    pragmaticTransactional: 40,
    authoritarianPluralistic: 50,
    religiousSecularGovernance: 50,
    civilizationalPosture: 30,
    universalistVsParticularist: 50,
    description: 'Pragmatic state balancing domestic autonomy and regional trade stability.'
  };

  if (countryId === 'US') {
    ideology.liberalInstitutionalist = 90;
    ideology.nationalistSovereigntist = 20;
    ideology.revolutionaryRevisionist = 2;
    ideology.pragmaticTransactional = 45;
    ideology.authoritarianPluralistic = 15; // highly pluralistic
    ideology.religiousSecularGovernance = 15; // secular law
    ideology.civilizationalPosture = 45;
    ideology.universalistVsParticularist = 90; // universalist - exports values
    ideology.description = 'Liberal internationalist superpower prioritizing a rule-based order, open markets, and democratic alliance security umbrella.';
  } else if (countryId === 'CN') {
    ideology.liberalInstitutionalist = 15;
    ideology.nationalistSovereigntist = 90;
    ideology.revolutionaryRevisionist = 15;
    ideology.pragmaticTransactional = 60;
    ideology.authoritarianPluralistic = 95; // authoritarian
    ideology.religiousSecularGovernance = 10; // secular marxist
    ideology.civilizationalPosture = 85; // highly civilizational
    ideology.universalistVsParticularist = 20; // particularist - respect sovereignty
    ideology.description = 'Sovereigntist near-peer actor asserting historic continental and civilizational security parameters, guided by centralized, long-term industrial planning.';
  } else if (countryId === 'RU') {
    ideology.liberalInstitutionalist = 5;
    ideology.nationalistSovereigntist = 95;
    ideology.revolutionaryRevisionist = 80; // highly revisionist
    ideology.pragmaticTransactional = 50;
    ideology.authoritarianPluralistic = 90;
    ideology.religiousSecularGovernance = 45;
    ideology.civilizationalPosture = 90;
    ideology.universalistVsParticularist = 30;
    ideology.description = 'Revisionist multi-polar challenger motivated by defensive borders expansion, ideological sovereigntism, and high-intensity hybrid operations posture.';
  } else if (countryId === 'IR') {
    ideology.liberalInstitutionalist = 2;
    ideology.nationalistSovereigntist = 85;
    ideology.revolutionaryRevisionist = 95; // highly revisionist
    ideology.pragmaticTransactional = 25;
    ideology.authoritarianPluralistic = 95;
    ideology.religiousSecularGovernance = 95; // highly religious theocratic
    ideology.civilizationalPosture = 80;
    ideology.universalistVsParticularist = 80; // universal export of revolution
    ideology.description = 'Theocratic revolutionary state utilizing asymmetric warfare, extensive proxy forces, and active deterrence architectures to dominate regional theater.';
  } else if (countryId === 'IL') {
    ideology.liberalInstitutionalist = 30;
    ideology.nationalistSovereigntist = 95;
    ideology.revolutionaryRevisionist = 10;
    ideology.pragmaticTransactional = 50;
    ideology.authoritarianPluralistic = 45;
    ideology.religiousSecularGovernance = 65;
    ideology.civilizationalPosture = 85;
    ideology.universalistVsParticularist = 30;
    ideology.description = 'Secluded security-first national homeland prioritizing forward deterrence, intelligence supremacy, and unilateral defensive action.';
  } else if (countryId === 'IN') {
    ideology.liberalInstitutionalist = 45;
    ideology.nationalistSovereigntist = 80;
    ideology.revolutionaryRevisionist = 10;
    ideology.pragmaticTransactional = 75; // transactional
    ideology.authoritarianPluralistic = 40;
    ideology.religiousSecularGovernance = 55;
    ideology.civilizationalPosture = 75;
    ideology.universalistVsParticularist = 25;
    ideology.description = 'Strategic-autonomy focused power leveraging multiaxial transactional partnerships to enhance regional positioning.';
  } else if (countryId === 'PK') {
    ideology.liberalInstitutionalist = 15;
    ideology.nationalistSovereigntist = 85;
    ideology.revolutionaryRevisionist = 30;
    ideology.pragmaticTransactional = 60;
    ideology.authoritarianPluralistic = 85;
    ideology.religiousSecularGovernance = 75;
    ideology.civilizationalPosture = 60;
    ideology.universalistVsParticularist = 40;
    ideology.description = 'Military-junta led sovereignty focused state governed by intense rivalry and regional survival paradigms.';
  } else if (countryId === 'TW') {
    ideology.liberalInstitutionalist = 85;
    ideology.nationalistSovereigntist = 70;
    ideology.revolutionaryRevisionist = 5;
    ideology.pragmaticTransactional = 40;
    ideology.authoritarianPluralistic = 10;
    ideology.religiousSecularGovernance = 10;
    ideology.civilizationalPosture = 30;
    ideology.universalistVsParticularist = 40;
    ideology.description = 'Vulnerable pluralistic democracy seeking institutional legitimacy and preservation under strategic blockade shadow.';
  }

  // 2. Economic Development Model Profile
  let econTendency: EconomicDevelopmentModelProfile['tendency'] = 'MIXED_MARKET_DEVELOPMENTALISM';
  let sanctionsRes = 40;
  let stateCtrl = 30;

  if (countryId === 'US') {
    econTendency = 'TECHNOLOGY_INNOVATION';
    sanctionsRes = 85;
    stateCtrl = 15;
  } else if (countryId === 'CN') {
    econTendency = 'DEVELOPMENTAL_INDUSTRIAL_POLICY';
    sanctionsRes = 90;
    stateCtrl = 75;
  } else if (countryId === 'RU' || countryId === 'SA') {
    econTendency = 'RENTIER_COMMODITY';
    sanctionsRes = 75;
    stateCtrl = 65;
  } else if (countryId === 'IR') {
    econTendency = 'SANCTIONS_EVASION_ADAPTIVE';
    sanctionsRes = 85;
    stateCtrl = 80;
  } else if (countryId === 'DE' || countryId === 'JP' || countryId === 'KR') {
    econTendency = 'EXPORT_MANUFACTURING';
    sanctionsRes = 60;
    stateCtrl = 30;
  } else if (countryId === 'IL') {
    econTendency = 'TECHNOLOGY_INNOVATION';
    sanctionsRes = 70;
    stateCtrl = 25;
  } else if (countryId === 'GB' || countryId === 'FR') {
    econTendency = 'FINANCIALIZED_SERVICES';
    sanctionsRes = 75;
    stateCtrl = 20;
  }

  const economy: EconomicDevelopmentModelProfile = {
    tendency: econTendency,
    exportDependencyPct: econTendency === 'EXPORT_MANUFACTURING' ? 75 : 35,
    rentierConcentrationPct: econTendency === 'RENTIER_COMMODITY' ? 80 : 15,
    sanctionsResilience: sanctionsRes,
    stateControlPct: stateCtrl,
    description: `Economic strategy centered on ${econTendency.toLowerCase().replace(/_/g, ' ')} for stability.`
  };

  // 3. Security Doctrine Profile
  let secTendency: SecurityDoctrineProfile['tendency'] = 'DETERRENCE_HEAVY';
  let offPosture = 45;
  let escThresh = 50;

  if (countryId === 'US') {
    secTendency = 'EXPEDITIONARY_INTERVENTIONISM';
    offPosture = 80;
    escThresh = 40;
  } else if (countryId === 'CN') {
    secTendency = 'ESCALATION_DOMINANCE';
    offPosture = 65;
    escThresh = 30;
  } else if (countryId === 'RU') {
    secTendency = 'FORWARD_DEFENSE';
    offPosture = 85;
    escThresh = 25; // high trigger-happy
  } else if (countryId === 'IL') {
    secTendency = 'ESCALATION_DOMINANCE';
    offPosture = 90;
    escThresh = 20;
  } else if (countryId === 'IR') {
    secTendency = 'PROXY_COMPETITION';
    offPosture = 75;
    escThresh = 45;
  } else if (countryId === 'TW') {
    secTendency = 'FORTRESS_DEFENSE';
    offPosture = 10;
    escThresh = 60;
  } else if (countryId === 'JP' || countryId === 'KR' || countryId === 'DE') {
    if (countryId === 'KR') secTendency = 'FORWARD_DEFENSE';
    else secTendency = 'LIMITED_WAR_RESTRAINT';
    offPosture = 25;
    escThresh = 65;
  }

  const security: SecurityDoctrineProfile = {
    tendency: secTendency,
    forcePostureOffensive: offPosture,
    escalationThreshold: escThresh,
    allianceCommitment: (countryId === 'US' || countryId === 'GB' || countryId === 'FR' || countryId === 'DE') ? 85 : 40,
    covertPropensity: (countryId === 'US' || countryId === 'RU' || countryId === 'IR' || countryId === 'IL') ? 80 : 30,
    description: `Security doctrine prioritizing ${secTendency.toLowerCase().replace(/_/g, ' ')}.`
  };

  // 4. Regional Hegemony Ambition Profile
  let regTendency: RegionalAmbitionProfile['tendency'] = 'STATUS_QUO_BALANCER';
  let expDesire = 20;
  let leadInterest = 50;

  if (countryId === 'US') {
    regTendency = 'OFFSHORE_BALANCER';
    expDesire = 5;
    leadInterest = 85;
  } else if (countryId === 'CN' || countryId === 'RU') {
    regTendency = 'LOCAL_HEGEMON_ASPIRANT';
    expDesire = countryId === 'CN' ? 70 : 85;
    leadInterest = 90;
  } else if (countryId === 'IR') {
    regTendency = 'REVISIONIST_CHALLENGER';
    expDesire = 75;
    leadInterest = 80;
  } else if (countryId === 'IN' || countryId === 'SA') {
    regTendency = 'AUTONOMY_MIDDLE_POWER';
    expDesire = 25;
    leadInterest = 70;
  } else if (countryId === 'TW' || countryId === 'PK') {
    regTendency = 'SHELTERED_SMALL_STATE';
    expDesire = 5;
    leadInterest = 10;
  } else if (countryId === 'TR' || countryId === 'EG') {
    regTendency = 'BRIDGE_MEDIATOR';
    expDesire = 20;
    leadInterest = 65;
  }

  const regional: RegionalAmbitionProfile = {
    tendency: regTendency,
    expansionistDesire: expDesire,
    blocLeadershipInterest: leadInterest,
    mediationDisposition: regTendency === 'BRIDGE_MEDIATOR' ? 85 : 20,
    description: `Regional posture aligns as ${regTendency.toLowerCase().replace(/_/g, ' ')}.`
  };

  // 5. Leadership Volatility Profile
  let volTendency: LeadershipVolatilityProfile['tendency'] = 'INSTITUTIONAL_CONTINUITY';
  let swing = 15;
  let unpredict = 15;

  if (countryId === 'US' || countryId === 'GB' || countryId === 'DE' || countryId === 'JP') {
    volTendency = 'INSTITUTIONAL_CONTINUITY';
    swing = 10;
    unpredict = 20;
  } else if (countryId === 'RU' || countryId === 'CN') {
    volTendency = countryId === 'RU' ? 'FACTIONAL_INSTABILITY' : 'INSTITUTIONAL_CONTINUITY';
    swing = countryId === 'RU' ? 35 : 12;
    unpredict = countryId === 'RU' ? 45 : 15;
  } else if (countryId === 'PK' || countryId === 'EG') {
    volTendency = 'COUP_SUSCEPTIBILITY';
    swing = 55;
    unpredict = 65;
  } else if (countryId === 'IL') {
    volTendency = 'CRISIS_OVERREACTION';
    swing = 45;
    unpredict = 50;
  } else if (countryId === 'IR') {
    volTendency = 'CABINET_FRAGMENTATION';
    swing = 30;
    unpredict = 40;
  }

  const volatility: LeadershipVolatilityProfile = {
    tendency: volTendency,
    swingRate: swing,
    unpredictabilityIndex: unpredict,
    regimeSustenanceUrgency: volTendency === 'COUP_SUSCEPTIBILITY' ? 85 : 40,
    description: `Governance profile defined by ${volTendency.toLowerCase().replace(/_/g, ' ')}.`
  };

  return {
    countryId,
    ideology,
    economy,
    security,
    regional,
    volatility
  };
}

// Generate starting goals for each country archetype
export function generateStartingGoals(countryId: string): StrategicGoal[] {
  const list: StrategicGoal[] = [];

  // Add regime/survival core goal
  list.push({
    id: `goal_${countryId}_regime_survival`,
    countryId,
    goalClass: 'REGIME_STABILIZATION',
    title: 'Maintain Sovereign Leadership & Stability',
    priorityScore: 90,
    ticksActive: 0,
    successCondition: 'Avoid coup risk > 60% and maintain popular unrest below 50%'
  });

  if (countryId === 'US') {
    list.push({
      id: `goal_US_liberal_pact`,
      countryId,
      goalClass: 'ALLIANCE_PRESERVATION',
      title: 'Cement Liberal Transatlantic Alliance Hegemony',
      priorityScore: 85,
      ticksActive: 0,
      successCondition: 'Average alliance opinion > 70 with NATO members and containment of revisionist capabilities'
    });
    list.push({
      id: `goal_US_deter_rivals`,
      countryId,
      goalClass: 'DETERRENCE',
      title: 'Encircle & Deter Revisionist Powers',
      targetCountryId: 'RU',
      priorityScore: 75,
      ticksActive: 0,
      successCondition: 'Subjugate adversarial force projection below threshold limit.'
    });
  } else if (countryId === 'CN') {
    list.push({
      id: `goal_CN_regional_hegemony`,
      countryId,
      goalClass: 'REGIONAL_DOMINANCE',
      title: 'Assert Indo-Pacific Regional Supremacy',
      priorityScore: 88,
      ticksActive: 0,
      successCondition: 'Displace Western maritime logistics anchors and consolidate direct regional influence'
    });
    list.push({
      id: `goal_CN_tech_catchup`,
      countryId,
      goalClass: 'TECHNOLOGICAL_CATCH_UP',
      title: 'Semiconductor Fabrication Autonomy',
      priorityScore: 80,
      ticksActive: 0,
      successCondition: 'Upgrade domestic industrial supply parameters'
    });
  } else if (countryId === 'RU') {
    list.push({
      id: `goal_RU_adversary_weakening`,
      countryId,
      goalClass: 'ADVERSARY_WEAKENING',
      title: 'Erode Transatlantic Alliance Cohesion',
      targetCountryId: 'US',
      priorityScore: 85,
      ticksActive: 0,
      successCondition: 'Trigger political fragmentation in forward defensive border networks'
    });
    list.push({
      id: `goal_RU_sanctions_relief`,
      countryId,
      goalClass: 'SANCTIONS_RELIEF',
      title: 'Evade and Roll Back Trade embargoes',
      priorityScore: 78,
      ticksActive: 0,
      successCondition: 'Build sovereign shadow finance networks and divide sanctioning coalitions'
    });
  } else if (countryId === 'IR') {
    list.push({
      id: `goal_IR_asymmetric_pressure`,
      countryId,
      goalClass: 'COVERT_PREPARATION',
      title: 'Consolidate Asymmetric Resistance Proxy Axis',
      targetCountryId: 'IL',
      priorityScore: 85,
      ticksActive: 0,
      successCondition: 'Deploy high-impact cyber operations and finance militant subversion channels'
    });
  } else if (countryId === 'IL') {
    list.push({
      id: `goal_IL_deter_proxies`,
      countryId,
      goalClass: 'TERRITORIAL_DEFENSE',
      title: 'Eradicate Threat Vectors on Border Margins',
      targetCountryId: 'IR',
      priorityScore: 92,
      ticksActive: 0,
      successCondition: 'Eradicate hostiles and maintain complete Iron Dome shield supremacy'
    });
  } else if (countryId === 'TW') {
    list.push({
      id: `goal_TW_survival_defense`,
      countryId,
      goalClass: 'SURVIVAL',
      title: 'Deter Sea-Blockade & Preserve Autonomy',
      targetCountryId: 'CN',
      priorityScore: 95,
      ticksActive: 0,
      successCondition: 'Secure global semiconductor supply trade routes and obtain direct security guarantees'
    });
  }

  return list;
}

// Plan Generator Engine - Generates dynamic multi-step plan based on goals & identity vectors
export function generateStrategicPlan(
  countryId: string,
  goal: StrategicGoal,
  identity: NationalIdentityVector,
  worldTick: number
): StrategicPlan {
  const steps: PlanStep[] = [];
  const sec = identity.security.tendency;
  const eco = identity.economy.tendency;

  // Let's customize steps based on selected Goal and Identity
  switch (goal.goalClass) {
    case 'ALLIANCE_PRESERVATION':
    case 'SOFT_POWER_ACCUMULATION':
      steps.push({
        stepIndex: 1,
        actionType: 'SIGNAL_CONCILIATION',
        targetCountryId: goal.targetCountryId || 'US',
        description: 'Initiate diplomatic rounds and propose secure defense coordinate syncs.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 2,
        actionType: 'CULTIVATE_ALLIANCE',
        targetCountryId: goal.targetCountryId || 'US',
        description: 'Propose multilateral joint drills, expanding the integration scope.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 3,
        actionType: 'DIPLOMATIC_PRESSURE',
        targetCountryId: goal.targetCountryId || 'US',
        description: 'Exert coordinated pressure on regional non-aligned nodes to join.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      });
      break;

    case 'ADVERSARY_WEAKENING':
    case 'COVERT_PREPARATION':
      steps.push({
        stepIndex: 1,
        actionType: 'SIGNAL_CONCILIATION',
        targetCountryId: goal.targetCountryId,
        description: 'Concliatially engage in superficial trade dialogs to mask long-term hostile intentions.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 2,
        actionType: 'MOBILIZE_COVERT_ASSETS',
        targetCountryId: goal.targetCountryId,
        description: 'Activate sleeper intelligence cadres and bypass local firewall layers.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      if (sec === 'PROXY_COMPETITION' || sec === 'INTERNAL_SECURITY_FIRST') {
        steps.push({
          stepIndex: 3,
          actionType: 'DISINFORMATION_INTELLIGENCE',
          targetCountryId: goal.targetCountryId,
          description: 'Launch massive targeted disinformation, seeding civil unrest across provinces.',
          durationTicks: 4,
          executionProgressTicks: 0,
          completed: false
        });
      } else {
        steps.push({
          stepIndex: 3,
          actionType: 'TEST_RED_LINES',
          targetCountryId: goal.targetCountryId,
          description: 'Stage border military maneuvers and test maritime chokepoints alerts.',
          durationTicks: 2,
          executionProgressTicks: 0,
          completed: false
        });
      }
      break;

    case 'REGIONAL_DOMINANCE':
    case 'MILITARY_BUILDUP':
      steps.push({
        stepIndex: 1,
        actionType: 'SHIFT_MILITARY_POSTURE',
        targetCountryId: goal.targetCountryId,
        description: 'Mobilize ground battalions and allocate auxiliary logistics funds to fortress lines.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 2,
        actionType: 'TEST_RED_LINES',
        targetCountryId: goal.targetCountryId,
        description: 'Encroach on target territorial lines, analyzing defensive shield responses.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 3,
        actionType: 'EXPLOIT_MARKET_DEPENDENCY',
        targetCountryId: goal.targetCountryId,
        description: 'Weaponize commodity networks, raising spot prices of critical silicon/energy exports.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      break;

    case 'SANCTIONS_RELIEF':
    case 'ECONOMIC_RECOVERY':
      steps.push({
        stepIndex: 1,
        actionType: 'BUILD_ECONOMIC_LEVERAGE',
        targetCountryId: goal.targetCountryId,
        description: 'Diversify sovereign holdings, redirecting commodity trade routes through un-aligned states.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 2,
        actionType: 'SIGNAL_CONCILIATION',
        targetCountryId: goal.targetCountryId || 'US',
        description: 'Dispatch diplomatic envoys offering high-volume trade concessions for asset de-freezing.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      break;

    case 'SURVIVAL':
    case 'TERRITORIAL_DEFENSE':
    default:
      steps.push({
        stepIndex: 1,
        actionType: 'SHIFT_MILITARY_POSTURE',
        targetCountryId: goal.targetCountryId,
        description: 'Drastically ramp up border defense readiness and fortify radar stations.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 2,
        actionType: 'CULTIVATE_ALLIANCE',
        targetCountryId: 'US', // seeking backing superpower
        description: 'Formally appeal to direct global backing partners, secure missile technology pipelines.',
        durationTicks: 4,
        executionProgressTicks: 0,
        completed: false
      });
      steps.push({
        stepIndex: 3,
        actionType: 'DEESCALATE_BUY_TIME',
        targetCountryId: goal.targetCountryId,
        description: 'Trigger international arbitration or propose formal cooling-off ceasefires.',
        durationTicks: 3,
        executionProgressTicks: 0,
        completed: false
      });
      break;
  }

  // Calculate generic planning horizon
  const planningHorizon = steps.reduce((sum, s) => sum + s.durationTicks, 0);

  return {
    id: `plan_${countryId}_${goal.id}_${Math.random().toString().substring(2,6)}`,
    countryId,
    parentGoalIds: [goal.id],
    title: `Sovereign Initiative: ${goal.title}`,
    planningHorizonTicks: Math.min(15, Math.max(5, planningHorizon)),
    desiredEndState: goal.successCondition,
    steps,
    prerequisites: [],
    resourceCostB: steps.length * 3.5,
    escalationRisk: goal.goalClass === 'REGIONAL_DOMINANCE' ? 65 : 15,
    secrecyScore: (sec === 'PROXY_COMPETITION' || identity.security.covertPropensity > 70) ? 80 : 30,
    abortConditions: ['Stability drops below 25%', 'Active internal coup detected'],
    successCriteria: goal.successCondition,
    fallbackPathSteps: [
      {
        stepIndex: 1,
        actionType: 'DEESCALATE_BUY_TIME',
        description: 'Urgent fallback: deploy backup diplomatic assets, accept temporary tension cooling.',
        durationTicks: 2,
        executionProgressTicks: 0,
        completed: false
      }
    ]
  };
}

export const useSovereignStore = create<Record<string, any> & SovereignStoreActions>((set, get) => ({
  sovereignStates: {},

  initializeAgents: () => {
    const states: { [id: string]: SovereignAgentState } = {};
    const worldStore = INITIAL_COUNTRIES;

    Object.keys(worldStore).forEach((countryId) => {
      const identity = generateIdentityVector(countryId);
      const goals = generateStartingGoals(countryId);

      const stack: GoalStack = {
        countryId,
        activeGoals: goals,
        priorityRecords: goals.map((g) => ({
          goalId: g.id,
          basePriority: g.priorityScore,
          threatMultiplier: 1.0,
          opportunityBonus: 0,
          identityFitWeight: 1.0,
          finalScore: g.priorityScore
        }))
      };

      const primaryGoal = stack.activeGoals.sort((a,b) => b.priorityScore - a.priorityScore)[0];
      const activePlan = generateStrategicPlan(countryId, primaryGoal, identity, 0);

      const planExecution: PlanExecutionState = {
        currentStepIndex: 0,
        totalSteps: activePlan.steps.length,
        remainingTicks: activePlan.planningHorizonTicks,
        isActive: true,
        status: 'EXECUTING'
      };

      const planCommitment: PlanCommitmentState = {
        planningThreshold: 30,
        confidenceScore: 75,
        sunkCostWeight: 0,
        backedDownPenalties: activePlan.escalationRisk * 0.4
      };

      const perception: StrategicPerceptionState = {
        countryId,
        adversaries: {},
        reliableAllies: {},
        distractionTargets: {},
        perceivedRegionalTensions: 40,
        apparentDeceptionPostures: {}
      };

      const constraints: ConstraintAssessment = {
        unrestRisk: 10,
        treasuryStress: 10,
        readinessDeficit: 5,
        treatyObligationsCount: 0,
        sanctionsPainPercent: 0,
        recreationalSecurityBuffer: 15
      };

      const intentSnapshot: AgentIntentSnapshot = {
        primaryActiveGoalClass: primaryGoal.goalClass,
        actionPreviewLabel: activePlan.steps[0]?.description || 'Formulating strategy',
        planningHorizonText: `${activePlan.planningHorizonTicks} ticks`,
        secrecyLevel: activePlan.secrecyScore > 75 ? 'VEILED' : 'OPEN',
        confidenceRatingPct: 78
      };

      states[countryId] = {
        countryId,
        identity,
        goalStack: stack,
        activePlan,
        planExecution,
        planCommitment,
        interruptionHistory: [],
        threatMemory: [],
        trustMemory: [],
        perception,
        opportunities: [],
        constraints,
        adversaryModels: {},
        allyModels: {},
        learningLog: [],
        intentSnapshot,
        actionPreview: {
          countryId,
          actionName: activePlan.steps[0]?.actionType || 'PLANNING',
          expectedLaunchTickDelta: 1
        },
        lastReplannedTick: 0
      };
    });

    set({ sovereignStates: states });
  },

  tickSovereignAgents: (worldDraft: WorldState, playerCountryId: string) => {
    const states = get().sovereignStates;
    if (Object.keys(states).length === 0) {
      get().initializeAgents();
    }

    set(produce((draft) => {
      Object.keys(draft.sovereignStates).forEach((countryId) => {
        if (countryId === playerCountryId) return;

        const agent: SovereignAgentState = draft.sovereignStates[countryId];
        const country = worldDraft.countries[countryId];
        if (!agent || !country) return;

        // I. Decay threat memory slightly, maintain persistent trust memory
        agent.threatMemory.forEach((tm) => {
          tm.severityScore = Math.max(0, tm.severityScore - tm.decayRateIndex);
        });
        agent.threatMemory = agent.threatMemory.filter((tm) => tm.severityScore > 2);

        // II. Calculate Opportunity and Constraint assessments
        const constraints: ConstraintAssessment = {
          unrestRisk: country.political.popularUnrest || 0,
          treasuryStress: country.economic.debtStressIndex || 0,
          readinessDeficit: 100 - (country.arsenal.readinessLevel || 80),
          treatyObligationsCount: country.tradePartners.length,
          sanctionsPainPercent: country.economic.sanctionedBy.length * 15,
          recreationalSecurityBuffer: Math.max(10, 50 - country.political.stabilityIndex)
        };
        agent.constraints = constraints;

        // Generate opportunities relative to standard threat metrics or players
        const playerCountry = worldDraft.countries[playerCountryId];
        if (playerCountry) {
          const opp: OpportunityAssessment = {
            targetCountryId: playerCountryId,
            type: 'DISTRACTION',
            description: playerCountry.atWarWith.length > 0 ? 'Player distracted with active warlike state.' : 'Superpower maintaining status quo duties',
            score: playerCountry.atWarWith.length > 0 ? 80 : 35,
            militaryVulnerability: Math.max(0, 100 - (playerCountry.arsenal.readinessLevel || 80)),
            diplomaticIsolation: Math.max(0, 100 - playerCountry.political.stabilityIndex),
            economicSanctionsFatigue: playerCountry.economic.debtStressIndex || 20,
            allianceCohesionRank: Object.values(playerCountry.opinions).filter((x) => x < 0).length * 10
          };
          agent.opportunities = [opp];
        }

        // III. Evaluate Goal Priority Stack
        agent.goalStack.activeGoals.forEach((goal) => {
          let multiplier = 1.0;
          if (goal.targetCountryId) {
            // Check threat memories regarding that target
            const relevantThreats = agent.threatMemory.filter((t) => t.targetCountryId === goal.targetCountryId);
            if (relevantThreats.length > 0) {
              const maxThreat = Math.max(...relevantThreats.map((t) => t.severityScore));
              multiplier += maxThreat / 100;
            }
          }
          goal.ticksActive++;

          const record = agent.goalStack.priorityRecords.find((r) => r.goalId === goal.id);
          if (record) {
            record.threatMultiplier = multiplier;
            record.finalScore = Math.min(100, goal.priorityScore * multiplier + record.opportunityBonus);
          }
        });

        // Sort by priority final score
        agent.goalStack.activeGoals.sort((a, b) => {
          const scoreA = agent.goalStack.priorityRecords.find((r) => r.goalId === a.id)?.finalScore || 0;
          const scoreB = agent.goalStack.priorityRecords.find((r) => r.goalId === b.id)?.finalScore || 0;
          return scoreB - scoreA;
        });

        // IV. Process active plan or generate a plan
        const activeTopGoal = agent.goalStack.activeGoals[0];
        if (!agent.activePlan || !agent.planExecution.isActive || agent.planExecution.status === 'FINISHED') {
          // Select top goal
          agent.activePlan = generateStrategicPlan(countryId, activeTopGoal, agent.identity, worldDraft.currentTick);
          agent.planExecution = {
            currentStepIndex: 0,
            totalSteps: agent.activePlan.steps.length,
            remainingTicks: agent.activePlan.planningHorizonTicks,
            isActive: true,
            status: 'EXECUTING'
          };
          agent.lastReplannedTick = worldDraft.currentTick;
          agent.intentSnapshot.primaryActiveGoalClass = activeTopGoal.goalClass;
        }

        // Execute current plan step material rewards and adjustments
        const execution = agent.planExecution;
        const plan = agent.activePlan;
        if (execution.isActive && plan && execution.currentStepIndex < plan.steps.length) {
          const step = plan.steps[execution.currentStepIndex];
          step.executionProgressTicks++;

          // Execute action logic dynamically modifying the canonical worldState
          switch (step.actionType) {
            case 'SHIFT_MILITARY_POSTURE':
              country.arsenal.readinessLevel = Math.min(100, (country.arsenal.readinessLevel || 80) + 4);
              country.economic.treasuryCashB = Math.max(0, country.economic.treasuryCashB - 1.5);
              break;

            case 'MOBILIZE_COVERT_ASSETS':
              country.intelligence.blackBudgetB += 1.0;
              country.intelligence.signalIntelScore = Math.min(100, (country.intelligence.signalIntelScore || 50) + 5);
              break;

            case 'BUILD_ECONOMIC_LEVERAGE':
              country.economic.treasuryCashB += 2.0;
              // expand trade
              const randomTrader = Object.keys(INITIAL_COUNTRIES).find((x) => x !== countryId && !country.tradePartners.includes(x));
              if (randomTrader) {
                country.tradePartners.push(randomTrader);
              }
              break;

            case 'SIGNAL_CONCILIATION':
              if (step.targetCountryId) {
                country.opinions[step.targetCountryId] = Math.min(100, (country.opinions[step.targetCountryId] || 0) + 5);
                const tgt = worldDraft.countries[step.targetCountryId];
                if (tgt) {
                  tgt.opinions[countryId] = Math.min(100, (tgt.opinions[countryId] || 0) + 5);
                }
              }
              break;

            case 'CULTIVATE_ALLIANCE':
              if (step.targetCountryId) {
                country.opinions[step.targetCountryId] = Math.min(100, (country.opinions[step.targetCountryId] || 0) + 8);
              }
              break;

            case 'TEST_RED_LINES':
              if (step.targetCountryId) {
                country.opinions[step.targetCountryId] = Math.max(-100, (country.opinions[step.targetCountryId] || 0) - 10);
                const tgt = worldDraft.countries[step.targetCountryId];
                if (tgt) {
                  tgt.opinions[countryId] = Math.max(-100, (tgt.opinions[countryId] || 0) - 10);
                  tgt.lastEventLog.unshift(`ALERT: ${country.name} encroaches on security red lines! Defensive patrols heightened.`);
                }
              }
              break;

            case 'PREPARE_SANCTIONS':
              if (step.targetCountryId) {
                const tgt = worldDraft.countries[step.targetCountryId];
                if (tgt && !tgt.economic.sanctionedBy.includes(countryId)) {
                  tgt.economic.sanctionedBy.push(countryId);
                  worldDraft.globalEventLog.unshift({
                    tick: worldDraft.currentTick,
                    text: `Diplomacy: ${country.name} implements planned asset blocks targeting ${tgt.name}.`,
                    severity: 'WARNING'
                  });
                }
              }
              break;

            case 'DEESCALATE_BUY_TIME':
              country.political.stabilityIndex = Math.min(100, country.political.stabilityIndex + 5);
              if (country.atWarWith.length > 0) {
                // Seek ceasefires
                const oppId = country.atWarWith[0];
                const opposing = worldDraft.countries[oppId];
                if (opposing) {
                  country.atWarWith = country.atWarWith.filter((x) => x !== oppId);
                  opposing.atWarWith = opposing.atWarWith.filter((x) => x !== countryId);
                  worldDraft.globalEventLog.unshift({
                    tick: worldDraft.currentTick,
                    text: `Peace Treaty: Strategic ceasefire brokered between ${country.name} and ${opposing.name} to buy time.`,
                    severity: 'INFO'
                  });
                }
              }
              break;
          }

          // Advance progression of active step
          if (step.executionProgressTicks >= step.durationTicks) {
            step.completed = true;
            execution.currentStepIndex++;
            if (execution.currentStepIndex >= plan.steps.length) {
              execution.status = 'FINISHED';
              execution.isActive = false;
            }
          }

          // Render appropriate snapshot details for inspectability
          const currentStep = plan.steps[execution.currentStepIndex];
          agent.intentSnapshot = {
            primaryActiveGoalClass: activeTopGoal.goalClass,
            actionPreviewLabel: currentStep ? `${currentStep.actionType}: ${currentStep.description}` : 'Strategizing next initiative',
            planningHorizonText: `${execution.remainingTicks} ticks remaining`,
            secrecyLevel: plan.secrecyScore > 75 ? 'VEILED' : 'OPEN',
            confidenceRatingPct: Math.round(agent.planCommitment.confidenceScore)
          };

          agent.actionPreview = currentStep ? {
            countryId,
            actionName: currentStep.actionType,
            targetCountryId: currentStep.targetCountryId,
            expectedLaunchTickDelta: currentStep.durationTicks - currentStep.executionProgressTicks
          } : null;
        }

        execution.remainingTicks--;
        if (execution.remainingTicks <= 0 && execution.status === 'EXECUTING') {
          execution.status = 'FINISHED';
          execution.isActive = false;
        }
      });
    }));
  },

  handleWorldEvent: (
    worldDraft: WorldState,
    eventType: string,
    actorCountryId: string,
    targetCountryId?: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' = 'LOW',
    metadata?: Record<string, any>
  ) => {
    set(produce((draft) => {
      // Loop through all countries to check if their active plans are interrupted
      Object.keys(draft.sovereignStates).forEach((countryId) => {
        const agent: SovereignAgentState = draft.sovereignStates[countryId];
        const country = worldDraft.countries[countryId];
        if (!agent || !country) return;

        // Is this event a direct red line crossed for this country?
        let isCriticalEvent = false;
        let interruptionText = '';
        let penalty = 0;

        if (eventType === 'WAR_OUTBREAK') {
          if (countryId === actorCountryId || countryId === targetCountryId) {
            isCriticalEvent = true;
            interruptionText = 'Immediate involvement in hostilities requires force mobilization.';
            penalty = 30;
          } else {
            // regional check
            const actor = worldDraft.countries[actorCountryId];
            if (actor && actor.continent === country.continent) {
              isCriticalEvent = Math.random() < 0.6;
              interruptionText = `Neighborhood war breaks out neighboring boundaries (${actorCountryId} vs ${targetCountryId}).`;
              penalty = 15;
            }
          }
        } else if (eventType === 'SANCTIONS_SHOCK' && targetCountryId === countryId) {
          isCriticalEvent = true;
          interruptionText = 'Imposed trade sanctions throttle sovereign financial flows.';
          penalty = 20;
        } else if (eventType === 'CYBER_ATTACK' && targetCountryId === countryId) {
          isCriticalEvent = Math.random() < 0.5;
          interruptionText = 'Direct cyber asset intrusion compromises infrastructure nodes.';
          penalty = 10;
        } else if (eventType === 'PLAYER_STRIKE' && targetCountryId === countryId) {
          isCriticalEvent = true;
          interruptionText = 'EMERGENCY: Tactical ballistic missile strike detaches territorial limits!';
          penalty = 50;
        }

        if (isCriticalEvent && agent.activePlan) {
          // Calculate if interruption is soft, medium, hard or emergency
          let type: ReplanningType = 'SOFT_UPDATE';
          if (severity === 'EMERGENCY' || country.political.stabilityIndex < 35) {
            type = 'EMERGENCY_OVERRIDE';
          } else if (penalty > 25) {
            type = 'HARD_INTERRUPTION';
          } else {
            type = 'MEDIUM_INTERRUPTION';
          }

          // Log the interruption
          agent.interruptionHistory.push({
            id: `irr_${worldDraft.currentTick}_${Math.random().toString().substring(2,6)}`,
            tick: worldDraft.currentTick,
            triggerEvent: eventType,
            severity: (severity as string) === 'CRITICAL' ? 'HIGH' : severity,
            actionTaken: type,
            description: `${interruptionText} Triggers sovereign ${type.toLowerCase().replace(/_/g, ' ')}.`
          });

          // Execute interruption penalty
          if (type === 'EMERGENCY_OVERRIDE' || type === 'HARD_INTERRUPTION') {
            // Discard plan immediately
            agent.activePlan = null;
            agent.planExecution.isActive = false;
            agent.planExecution.status = 'INTERRUPTED';

            // Pivot priorities toward urgent goals (SURVIVAL/REGIME_STABILIZATION)
            const crisisGoal = agent.goalStack.activeGoals.find(
              (g) => g.goalClass === 'SURVIVAL' || g.goalClass === 'REGIME_STABILIZATION'
            );
            if (crisisGoal) {
              crisisGoal.priorityScore = Math.min(100, crisisGoal.priorityScore + 30);
            }
          } else if (type === 'MEDIUM_INTERRUPTION') {
            // Freeze step briefly
            agent.planExecution.status = 'INTERRUPTED';
            // pause execution progress
          }

          // Register threat memory against actor country
          if (actorCountryId && actorCountryId !== countryId) {
            const index = agent.threatMemory.findIndex((t) => t.targetCountryId === actorCountryId);
            if (index !== -1) {
              agent.threatMemory[index].severityScore = Math.min(100, agent.threatMemory[index].severityScore + penalty);
              agent.threatMemory[index].lastReinforcedTick = worldDraft.currentTick;
            } else {
              agent.threatMemory.push({
                id: `thr_${worldDraft.currentTick}_${Math.random().toString().substring(2,6)}`,
                targetCountryId: actorCountryId,
                category: eventType === 'SANCTIONS_SHOCK' ? 'ECONOMIC_STRANGULATION' : 'EXISTENTIAL',
                severityScore: Math.min(100, 30 + penalty),
                description: `Triggered by international incident: ${eventType}`,
                launchTick: worldDraft.currentTick,
                lastReinforcedTick: worldDraft.currentTick,
                decayRateIndex: 0.1
              });
            }
          }
        }
      });
    }));
  },

  addThreatMemory: (countryId: string, targetId: string, category: ThreatCategory, severity: number, desc: string) => {
    set(produce((draft) => {
      const agent: SovereignAgentState = draft.sovereignStates[countryId];
      if (agent) {
        agent.threatMemory.push({
          id: `thr_${Date.now()}_${Math.random().toString().substring(2,6)}`,
          targetCountryId: targetId,
          category,
          severityScore: severity,
          description: desc,
          launchTick: 0,
          lastReinforcedTick: 0,
          decayRateIndex: 0.1
        });
      }
    }));
  },

  addTrustMemory: (countryId: string, targetId: string, category: TrustCategory, score: number, desc: string) => {
    set(produce((draft) => {
      const agent: SovereignAgentState = draft.sovereignStates[countryId];
      if (agent) {
        agent.trustMemory.push({
          id: `tru_${Date.now()}_${Math.random().toString().substring(2,6)}`,
          targetCountryId: targetId,
          category,
          trustScore: score,
          description: desc,
          establishedTick: 0,
          lastVerifiedTick: 0,
          promiseKeptCounter: 1,
          promiseBrokenCounter: 0
        });
      }
    }));
  },

  setAgentState: (countryId: string, state: Partial<SovereignAgentState>) => {
    set(produce((draft) => {
      if (draft.sovereignStates[countryId]) {
        draft.sovereignStates[countryId] = {
          ...draft.sovereignStates[countryId],
          ...state
        };
      }
    }));
  },

  resetSovereignStore: () => {
    set({ sovereignStates: {} });
    get().initializeAgents();
  }
}));

// Export top-level getter matching top goals (Zustand primitive)
const topGoal = () => {
  return {
    goalClass: 'REGIME_STABILIZATION' as StrategicGoalClass,
    priorityScore: 90
  };
};
