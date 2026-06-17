import {
  LeaderPersonality,
  LeaderPsychologyState,
  LeaderTraitVector,
  LeaderEmotionalState,
  LeaderStressHistory,
  LeaderPublicPersona,
  LeaderPrivateDisposition,
  LeaderRiskAppetiteProfile,
  LeaderTrustStyleProfile,
  LeaderEscalationStyleProfile,
  LeaderCompromiseStyleProfile,
  LeaderMiscalculationProfile,
  LeaderSuccessionProfile,
  LeaderVulnerabilityProfile,
  LeaderIntelligenceExposureState,
  LeaderRedLineProfile,
  LeaderMemoryTrace,
  RedLineTriggerType,
  LeaderReactionModel
} from '../types';

/**
 * Deterministic PRNG helper for seed-based trait generation
 */
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
  h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
}

/**
 * Builds standard traits vector based on selected archetype
 */
export function generateTraitsForArchetype(archetype: string, seed: string): LeaderTraitVector {
  const r = () => seededRandom(seed + Math.random().toString());
  const scale = (min: number, max: number) => Math.round(min + r() * (max - min));

  switch (archetype) {
    case 'hawkish prestige-driven nationalist':
      return {
        hawkishness: scale(85, 98),
        prestigeHunger: scale(90, 100),
        paranoia: scale(50, 70),
        corruption: scale(30, 50),
        rigidity: scale(75, 88),
        riskTolerance: scale(80, 95),
        patience: scale(20, 35),
        ideologicalFixation: scale(70, 85),
        institutionalLoyalty: scale(50, 70),
        personalVanity: scale(85, 98),
        empathy: scale(10, 25),
        vindictiveness: scale(80, 95),
        bluffPropensity: scale(70, 88),
        crisisComposure: scale(65, 78),
        adaptability: scale(20, 42)
      };
    case 'paranoid besieged autocrat':
      return {
        hawkishness: scale(75, 92),
        prestigeHunger: scale(70, 85),
        paranoia: scale(88, 100),
        corruption: scale(60, 85),
        rigidity: scale(80, 98),
        riskTolerance: scale(50, 70),
        patience: scale(35, 52),
        ideologicalFixation: scale(60, 80),
        institutionalLoyalty: scale(30, 52),
        personalVanity: scale(70, 92),
        empathy: scale(5, 20),
        vindictiveness: scale(90, 100),
        bluffPropensity: scale(60, 80),
        crisisComposure: scale(40, 60),
        adaptability: scale(20, 35)
      };
    case 'corrupt transactional broker':
      return {
        hawkishness: scale(35, 55),
        prestigeHunger: scale(50, 72),
        paranoia: scale(40, 60),
        corruption: scale(82, 98),
        rigidity: scale(18, 35),
        riskTolerance: scale(40, 60),
        patience: scale(55, 75),
        ideologicalFixation: scale(10, 22),
        institutionalLoyalty: scale(20, 42),
        personalVanity: scale(60, 82),
        empathy: scale(20, 40),
        vindictiveness: scale(30, 52),
        bluffPropensity: scale(65, 82),
        crisisComposure: scale(65, 78),
        adaptability: scale(75, 92)
      };
    case 'rigid institutionalist':
      return {
        hawkishness: scale(50, 70),
        prestigeHunger: scale(50, 68),
        paranoia: scale(60, 78),
        corruption: scale(12, 30),
        rigidity: scale(85, 98),
        riskTolerance: scale(45, 62),
        patience: scale(60, 78),
        ideologicalFixation: scale(85, 98),
        institutionalLoyalty: scale(90, 100),
        personalVanity: scale(40, 62),
        empathy: scale(25, 45),
        vindictiveness: scale(55, 75),
        bluffPropensity: scale(30, 50),
        crisisComposure: scale(70, 88),
        adaptability: scale(10, 25)
      };
    case 'volatile populist':
      return {
        hawkishness: scale(60, 85),
        prestigeHunger: scale(80, 95),
        paranoia: scale(65, 85),
        corruption: scale(50, 78),
        rigidity: scale(60, 82),
        riskTolerance: scale(65, 92),
        patience: scale(15, 35),
        ideologicalFixation: scale(40, 72),
        institutionalLoyalty: scale(15, 38),
        personalVanity: scale(85, 100),
        empathy: scale(20, 42),
        vindictiveness: scale(75, 98),
        bluffPropensity: scale(80, 98),
        crisisComposure: scale(30, 52),
        adaptability: scale(50, 78)
      };
    case 'cautious technocrat':
      return {
        hawkishness: scale(10, 26),
        prestigeHunger: scale(20, 42),
        paranoia: scale(20, 38),
        corruption: scale(8, 25),
        rigidity: scale(30, 48),
        riskTolerance: scale(15, 35),
        patience: scale(80, 98),
        ideologicalFixation: scale(15, 32),
        institutionalLoyalty: scale(85, 98),
        personalVanity: scale(15, 38),
        empathy: scale(60, 82),
        vindictiveness: scale(10, 26),
        bluffPropensity: scale(15, 38),
        crisisComposure: scale(80, 98),
        adaptability: scale(70, 92)
      };
    case 'wounded revanchist':
      return {
        hawkishness: scale(80, 98),
        prestigeHunger: scale(85, 100),
        paranoia: scale(70, 88),
        corruption: scale(30, 50),
        rigidity: scale(75, 92),
        riskTolerance: scale(70, 88),
        patience: scale(40, 58),
        ideologicalFixation: scale(75, 92),
        institutionalLoyalty: scale(40, 68),
        personalVanity: scale(80, 98),
        empathy: scale(15, 32),
        vindictiveness: scale(90, 100),
        bluffPropensity: scale(50, 72),
        crisisComposure: scale(60, 75),
        adaptability: scale(30, 48)
      };
    case 'charismatic opportunist':
    default:
      return {
        hawkishness: scale(45, 68),
        prestigeHunger: scale(75, 92),
        paranoia: scale(30, 52),
        corruption: scale(50, 72),
        rigidity: scale(15, 32),
        riskTolerance: scale(60, 82),
        patience: scale(50, 68),
        ideologicalFixation: scale(20, 42),
        institutionalLoyalty: scale(45, 68),
        personalVanity: scale(80, 98),
        empathy: scale(35, 58),
        vindictiveness: scale(40, 62),
        bluffPropensity: scale(75, 92),
        crisisComposure: scale(70, 88),
        adaptability: scale(80, 98)
      };
  }
}

/**
 * Automatically determines appropriate archetype based on pre-defined personality type
 */
export function getArchetypeForPersonality(personality: LeaderPersonality, indexSeed: number): string {
  if (personality === LeaderPersonality.HAWK) {
    return indexSeed < 0.5 ? 'hawkish prestige-driven nationalist' : 'wounded revanchist';
  }
  if (personality === LeaderPersonality.DOVE) {
    return 'cautious technocrat';
  }
  if (personality === LeaderPersonality.PRAGMATIST) {
    return indexSeed < 0.6 ? 'charismatic opportunist' : 'corrupt transactional broker';
  }
  if (personality === LeaderPersonality.IDEOLOGUE) {
    return 'rigid institutionalist';
  }
  // UNPREDICTABLE
  return indexSeed < 0.5 ? 'volatile populist' : 'paranoid besieged autocrat';
}

/**
 * Creates persistent Red-Line triggers for countries based on context and style
 */
export function generateRedLinesForCountry(countryId: string, archetype: string, seed: string): LeaderRedLineProfile[] {
  const lines: LeaderRedLineProfile[] = [];
  const rand = seededRandom(seed + '_redlines');

  // Baseline Red Line 1: Territorial Integrity
  lines.push({
    id: `${countryId}_rl_territory`,
    type: RedLineTriggerType.TERRITORIAL_INTEGRITY,
    description: `Direct kinetic strike, military occupation, or regional annexation of sovereign ${countryId} soil.`,
    isTriggered: false,
    severityIndex: archetype.includes('nationalist') || archetype.includes('revanchist') ? 100 : 85,
    actionOnCross: 'DECLARE_WAR',
    discoveryProgress: Math.round(30 + rand * 30), // 30-60% initially inferred
    sourceOfDiscovery: 'SIGINT'
  });

  // Baseline Red Line 2: Regime Survival
  if (archetype.includes('autocrat') || archetype.includes('populist') || ['RU', 'CN', 'IR', 'KP'].includes(countryId)) {
    lines.push({
      id: `${countryId}_rl_regime`,
      type: RedLineTriggerType.REGIME_SURVIVAL,
      description: `Covert coup attempt, direct cyber-attack on regime command, or engineered popular unrest exceeding 75%.`,
      isTriggered: false,
      severityIndex: 95,
      actionOnCross: 'NUCLEAR_ESCALATION',
      discoveryProgress: Math.round(15 + rand * 25), // 15-40%
      sourceOfDiscovery: 'HUMINT'
    });
  }

  // Baseline Red Line 3: Economic Strangulation
  if (['CN', 'IR', 'KP', 'SA'].includes(countryId)) {
    lines.push({
      id: `${countryId}_rl_economy`,
      type: RedLineTriggerType.ECONOMIC_STRANGULATION,
      description: `Widespread unilateral maritime blockades or exhaustive embargo of vital petrochemical exports.`,
      isTriggered: false,
      severityIndex: archetype.includes('broker') ? 70 : 85,
      actionOnCross: 'IMPOSE_SANCTIONS',
      discoveryProgress: Math.round(25 + rand * 35),
      sourceOfDiscovery: 'FININT'
    });
  }

  // Special thematic red line for specific leaders
  if (countryId === 'US') {
    lines.push({
      id: `${countryId}_rl_betrayal`,
      type: RedLineTriggerType.ALLIANCE_BETRAYAL,
      description: `Major NATO or close Indo-Pacific ally exiting defensive pact or signing unilateral non-aggression treaties with Eurasian blocs.`,
      isTriggered: false,
      severityIndex: 80,
      actionOnCross: 'IMPOSE_SANCTIONS',
      discoveryProgress: Math.round(40 + rand * 30),
      sourceOfDiscovery: 'COVERT_INTERCEPT'
    });
  } else if (countryId === 'IL') {
    lines.push({
      id: `${countryId}_rl_existential`,
      type: RedLineTriggerType.NUCLEAR_STATUS,
      description: `Intelligence confirmation of hostile regional adversary preparing weaponized atomic detonation capabilities.`,
      isTriggered: false,
      severityIndex: 100,
      actionOnCross: 'LAUNCH_STRIKE',
      discoveryProgress: Math.round(20 + rand * 20),
      sourceOfDiscovery: 'HUMINT'
    });
  } else if (countryId === 'RU') {
    lines.push({
      id: `${countryId}_rl_encirclement`,
      type: RedLineTriggerType.MILITARY_ENCIRCLEMENT,
      description: `Direct permanent deployment of strategic thermonuclear strike interceptors or tactical infantry divisions in border states.`,
      isTriggered: false,
      severityIndex: 90,
      actionOnCross: 'LAUNCH_STRIKE',
      discoveryProgress: Math.round(25 + rand * 25),
      sourceOfDiscovery: 'SIGINT'
    });
  }

  return lines;
}

/**
 * Allocates a complete psychological state block for a leader
 */
export function generatePsychologyForLeader(
  countryId: string,
  personalityType: LeaderPersonality,
  seed: string,
  tick: number
): LeaderPsychologyState {
  const randNum = seededRandom(seed + '_psych_rand');
  const archetype = getArchetypeForPersonality(personalityType, randNum);
  const traits = generateTraitsForArchetype(archetype, seed);

  const emotions: LeaderEmotionalState = {
    humiliation: 0,
    fear: Math.round(seededRandom(seed + '_fear') * 10),
    emboldenment: Math.round(seededRandom(seed + '_embolden') * 15),
    anger: Math.round(seededRandom(seed + '_angry') * 5),
    anxiety: Math.round(seededRandom(seed + '_anxious') * 10),
    pride: Math.round(20 + seededRandom(seed + '_pride') * 30),
    resentment: Math.round(seededRandom(seed + '_resent') * 15),
    vindication: 0,
    desperation: 0,
    overconfidence: Math.round(seededRandom(seed + '_overconfidence') * 10),
    fatigue: 0,
    relief: 0,
    paranoiaSpike: 0,
    moralInjury: 0,
    shame: 0,
  };

  const stress: LeaderStressHistory = {
    currentStress: Math.round(10 + seededRandom(seed + '_stress') * 15),
    peakStress: 25,
    ticksAtMaxStress: 0,
    triggerLogs: []
  };

  let rhetoricStyle: LeaderPublicPersona['rhetoricStyle'] = 'REASSURING';
  if (personalityType === LeaderPersonality.HAWK) rhetoricStyle = 'BELLICOSE';
  else if (personalityType === LeaderPersonality.DOVE) rhetoricStyle = 'CONCILIATORY';
  else if (personalityType === LeaderPersonality.IDEOLOGUE) rhetoricStyle = 'TRIUMPHALIST';
  else if (personalityType === LeaderPersonality.UNPREDICTABLE) rhetoricStyle = 'BELLICOSE';

  const publicPersona: LeaderPublicPersona = {
    rhetoricStyle,
    mediaPresence: `Classified intelligence dossiers suggest a ${traits.personalVanity > 75 ? 'highly self-absorbed' : 'moderately dynamic'} public stance.`,
    propagandaFocus: personalityType === LeaderPersonality.HAWK ? 'National survival & preemption strength' : 'Sovereign peace & diplomatic treaties',
    un_stance: personalityType === LeaderPersonality.DOVE ? 'Resolutions & coalition agreements' : 'Independent veto policy'
  };

  const privateDisposition: LeaderPrivateDisposition = {
    negotiationStance: personalityType === LeaderPersonality.HAWK ? 'UNCOMPROMISING' : 'TRANSACTIONAL',
    coerciveTendency: traits.hawkishness,
    backchannelOpenness: 100 - traits.rigidity,
    innerCircleLoyaltyRequired: traits.paranoia
  };

  const riskAppetiteToEscalate: LeaderRiskAppetiteProfile = {
    militaryCoercionLimit: traits.riskTolerance,
    cyberOffensiveTolerance: Math.round((traits.riskTolerance + traits.paranoia) / 2),
    nuclearBrinkmanshipThreshold: Math.round(traits.riskTolerance * 0.8),
    covertOperationsExposureFear: 100 - traits.bluffPropensity
  };

  const trustStyle: LeaderTrustStyleProfile = {
    institutionalTrust: traits.institutionalLoyalty,
    personalTrust: Math.round((100 - traits.paranoia + traits.empathy) / 2),
    coercivePreference: Math.round((traits.hawkishness + traits.vindictiveness) / 2),
    economicInterdependenceTrust: Math.round((100 - traits.ideologicalFixation + traits.adaptability) / 2)
  };

  const escalationStyle: LeaderEscalationStyleProfile = {
    pacing: personalityType === LeaderPersonality.HAWK ? 'THEATRICAL_PUBLIC' : 'SLOW_METHODICAL',
    escalationCeiling: traits.riskTolerance,
    retaliationSpeed: traits.patience < 30 ? 'INSTANT' : 'CALCULATED_DELAYED',
    nuclearLaunchPrudence: 100 - traits.riskTolerance
  };

  const compromiseStyle: LeaderCompromiseStyleProfile = {
    faceSavingRequired: traits.personalVanity > 60 || traits.prestigeHunger > 60,
    concessionThreshold: 100 - traits.rigidity,
    alliedConsultationStance: traits.institutionalLoyalty > 70 ? 'CONSULTATIVE' : 'UNCOOPERATIVE',
    bribeAcceptanceScore: traits.corruption
  };

  const miscalculations: LeaderMiscalculationProfile = {
    influenceOfAdvisorFiltering: traits.paranoia,
    propagandaBeliefFactor: traits.ideologicalFixation,
    overconfidenceBias: traits.personalVanity,
    stressDistortionMultiplier: 1.0 + (traits.paranoia / 100) * 0.5
  };

  const succession: LeaderSuccessionProfile = {
    coupRiskScore: Math.round((traits.paranoia + (100 - traits.institutionalLoyalty)) / 3),
    successionInstabilityIndex: Math.round(traits.rigidity * 0.7),
    expectedTransitionType: 'ELECTION'
  };

  const vulnerability: LeaderVulnerabilityProfile = {
    corruptionVulnerability: traits.corruption,
    intelligencePenetrationScore: Math.round((traits.corruption + Math.max(0, 100 - traits.paranoia)) / 2),
    eliteDissentFractureIndex: Math.round((traits.paranoia + traits.rigidity) / 2),
    blackmailExposureLevel: traits.corruption
  };

  const exposure: LeaderIntelligenceExposureState = {
    kompromatAssetsTracked: [],
    buggedCommsActive: false,
    advisorInfiltrated: false,
    publicDossierCertainty: Math.round(35 + seededRandom(seed + '_cert') * 25)
  };

  const reactionModel: LeaderReactionModel = {
    customRhetoricHistory: []
  };

  const redLines = generateRedLinesForCountry(countryId, archetype, seed);

  const memories: LeaderMemoryTrace[] = [
    {
      id: `${countryId}_mem_1`,
      targetCountryId: 'US',
      type: personalityType === LeaderPersonality.HAWK ? 'COERCION_ATTEMPT' : 'PROMISE_KEPT',
      tickOccurred: -12,
      description: `Negotiations on global commercial maritime limits and logistics treaties.`,
      weight: 60
    }
  ];

  return {
    personality: {
      archetype,
      traits
    },
    emotions,
    stress,
    publicPersona,
    privateDisposition,
    riskAppetiteToEscalate,
    trustStyle,
    escalationStyle,
    compromiseStyle,
    miscalculations,
    succession,
    vulnerability,
    exposure,
    reactionModel,
    redLines,
    memories
  };
}
