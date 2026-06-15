import { WorldState, PlayerState, Country, BallisticStrike, AIOperationLogEntry } from '../types';

export interface TurningPoint {
  tick: number;
  type: 'WAR' | 'ALLIANCE' | 'NUCLEAR' | 'ECONOMIC' | 'DOMESTIC_CRISIS' | 'COVERT';
  title: string;
  description: string;
  importance: number; // 1-10
  whyItMatters: string;
}

export interface PhaseSegments {
  opening: { name: string; range: string; description: string; count: number };
  escalation: { name: string; range: string; description: string; count: number };
  climax: { name: string; range: string; description: string; count: number };
  resolution: { name: string; range: string; description: string; count: number };
}

export interface DoctrineAxis {
  label: string;
  score: number; // 0 to 100
  leftLabel: string;
  rightLabel: string;
  description: string;
}

export interface PlayerStrategyAssessment {
  classification: string;
  title: string;
  summary: string;
  axes: DoctrineAxis[];
  traits: string[];
}

export interface DeclassifiedAIOperation {
  operatorName: string;
  operatorId: string;
  flag: string;
  codename: string;
  focusType: 'CONTAINMENT' | 'SABOTAGE' | 'INFLUENCE' | 'REGIONAL' | 'BRINKMANSHIP' | 'COALESCENCE';
  intent: string;
  consequence: string;
  secrecyScore: number;
  impactScore: number;
  tickFirstActive: number;
  relatedEventsCount: number;
  logs: AIOperationLogEntry[];
}

export interface DerivedAnalyticsBreakdown {
  casualtyByNation: { countryId: string; name: string; flag: string; count: number; percentage: number }[];
  gdpLossByNation: { countryId: string; name: string; flag: string; loss: number; percentage: number }[];
  warsByRegion: { region: string; count: number }[];
  diplomaticBalance: { allies: number; hostile: number; neutral: number; activeSanctions: number };
  crisisIntensityTimeline: { phase: string; score: number }[];
}

/**
 * Safe utility to parse the campaign data and output rich structural insights.
 */
export function deriveDebriefAnalysis(
  worldState: WorldState,
  playerState: PlayerState
): {
  turningPoints: TurningPoint[];
  phases: PhaseSegments;
  playerAssessment: PlayerStrategyAssessment;
  aiCampaigns: DeclassifiedAIOperation[];
  analytics: DerivedAnalyticsBreakdown;
  sessionDiagnosis: string;
} {
  const durationTicks = worldState.currentTick || 1;
  const playerCountryId = playerState.countryId;
  const playerCountry = worldState.countries[playerCountryId];
  
  // ----------------------------------------------------
  // Part 1: Segment Chronological Phases
  // ----------------------------------------------------
  const tickSegments = {
    openingEnd: Math.max(2, Math.round(durationTicks * 0.25)),
    escalationEnd: Math.max(4, Math.round(durationTicks * 0.50)),
    climaxEnd: Math.max(6, Math.round(durationTicks * 0.80)),
  };

  const getEventPhase = (tick: number): 'OPENING' | 'ESCALATION' | 'CLIMAX' | 'RESOLUTION' => {
    if (tick <= tickSegments.openingEnd) return 'OPENING';
    if (tick <= tickSegments.escalationEnd) return 'ESCALATION';
    if (tick <= tickSegments.climaxEnd) return 'CLIMAX';
    return 'RESOLUTION';
  };

  // Pre-calculate count of events for each phase
  const phaseCounts = { OPENING: 0, ESCALATION: 0, CLIMAX: 0, RESOLUTION: 0 };
  (worldState.globalEventLog || []).forEach(ev => {
    const p = getEventPhase(ev.tick);
    phaseCounts[p]++;
  });

  const phases: PhaseSegments = {
    opening: {
      name: 'Act I: Initial Posturing & Trade Rubrics',
      range: `Ticks 1–${tickSegments.openingEnd}`,
      description: 'Superpowers asserted sovereign redlines and secured initial trade routes. Defensive ABM systems operationalized.',
      count: phaseCounts.OPENING,
    },
    escalation: {
      name: 'Act II: Regional Fractures & Alignments',
      range: `Ticks ${tickSegments.openingEnd + 1}–${tickSegments.escalationEnd}`,
      description: 'Border flashpoints escalated opinions. Cyber incursions launched as proxy friction channels.',
      count: phaseCounts.ESCALATION,
    },
    climax: {
      name: 'Act III: Attrition Climax',
      range: `Ticks ${tickSegments.escalationEnd + 1}–${tickSegments.climaxEnd}`,
      description: 'High-severity strikes initialized. Mutual defense alliance triggers pulled global theaters into open war.',
      count: phaseCounts.CLIMAX,
    },
    resolution: {
      name: 'Act IV: Outcome Aftermath',
      range: `Ticks ${tickSegments.climaxEnd + 1}–${durationTicks}`,
      description: 'Simulation stabilization triggered either through complete subjection of targets or state failure of core modules.',
      count: phaseCounts.RESOLUTION,
    },
  };

  // ----------------------------------------------------
  // Part 1.5: Detailed Session Diagnosis
  // ----------------------------------------------------
  let sessionDiagnosis = '';
  const totalGlobalCasualties = worldState.activeStrikes
    .filter(s => s.status === 'IMPACT')
    .reduce((sum, s) => sum + (s.damageDealt?.casualtiesEstimate || 0), 0);
  
  const totalNuclearStrikes = worldState.activeStrikes
    .filter(s => s.status === 'IMPACT' && (s.weaponType === 'ICBM' || s.weaponType === 'SLBM'))
    .length;

  if (totalNuclearStrikes >= 3) {
    sessionDiagnosis = 'The session collapsed because deterrence systems failed entirely, culminating in rapid escalation from local kinetic strikes to an unrestrained thermonuclear aftermath.';
  } else if (totalGlobalCasualties > 5000000) {
    sessionDiagnosis = 'A war of attrition drained the world\'s defensive resources. Severe metropolitan devastation eroded state stability, leaving the victor with a fractured planetary husk.';
  } else {
    // Check if player economic was strong
    const playerTreasury = playerCountry?.economic?.treasuryCashB || 0;
    const playerAllies = Object.keys(worldState.countries).filter(
      (id) => id !== playerCountryId && (worldState.countries[id]?.opinions[playerCountryId] ?? 0) > 50
    ).length;

    if (playerAllies >= 3) {
      sessionDiagnosis = 'Sovereign command successfully contained regional outbreaks by building an ironclad multilateral diplomatic security circle, absorbing shocks without direct kinetic defeat.';
    } else if (playerTreasury > 1200) {
      sessionDiagnosis = 'Economic sovereignty defined this campaign. Your command leveraged massive fiscal capital as defensive armor, outlasting adversarial attempts of trade-containment.';
    } else {
      sessionDiagnosis = 'A campaign of tactical precision. Regional leverage and calculated defensive interventions prevented general nuclear exchange, preserving sovereign systems on the boundary of ruin.';
    }
  }

  // ----------------------------------------------------
  // Part 2: Detection and Ranking of Turning Points
  // ----------------------------------------------------
  const turningPoints: TurningPoint[] = [];

  // Scrape event logs for critical patterns
  const seenTypes = new Set<string>();
  const addTP = (tp: TurningPoint) => {
    // Avoid spamming of the exact same category on the exact same tick
    const key = `${tp.type}-${tp.tick}`;
    if (!seenTypes.has(key)) {
      turningPoints.push(tp);
      seenTypes.add(key);
    }
  };

  (worldState.globalEventLog || []).forEach((ev) => {
    const text = ev.text;
    const lower = text.toLowerCase();

    // 1. First kinetic strike / nuclear strike
    if (lower.includes('projected') && (lower.includes('icbm') || lower.includes('slbm')) && ev.severity === 'CRITICAL') {
      addTP({
        tick: ev.tick,
        type: 'NUCLEAR',
        title: 'Strategic Nuclear Launch Detected',
        description: text,
        importance: 10,
        whyItMatters: 'The ultimate deterrent failed. Launch protocols initialized, shifting the conflict from regional deterrence to total global annihilation.'
      });
    }

    // 2. Direct war declarations
    else if ((lower.includes('declared war') || lower.includes('declared combat') || lower.includes('initiated hostil')) && ev.severity === 'CRITICAL') {
      const isPlayerSrc = lower.includes(playerCountry?.name?.toLowerCase() || 'never_match');
      addTP({
        tick: ev.tick,
        type: 'WAR',
        title: isPlayerSrc ? 'Sovereign Offensive Order' : 'Sovereign Theater Collision',
        description: text,
        importance: isPlayerSrc ? 9 : 8,
        whyItMatters: isPlayerSrc
          ? 'You crossed the Rubicon. Resorting to physical subjection destroyed existing diplomatic avenues and forced surrounding blocks to pick sides.'
          : 'Geopolitical containment broke down entirely, dragging sovereign entities into active hardware collision.'
      });
    }

    // 3. Debt Default or Financial Meltdown
    else if (lower.includes('defaulted') || lower.includes('debt stress') || lower.includes('quantitative easing') || lower.includes('bankruptcy')) {
      addTP({
        tick: ev.tick,
        type: 'ECONOMIC',
        title: 'Economic Sovereign Collapse',
        description: text,
        importance: 7,
        whyItMatters: 'Sovereign capacity cannot exist without financial energy. The default severed bond supply chains and instantly spiked domestic popular unrest.'
      });
    }

    // 4. Alliance or Coalition
    else if ((lower.includes('alliance') || lower.includes('mutual alliance') || lower.includes('coalition signed')) && ev.severity === 'INFO') {
      addTP({
        tick: ev.tick,
        type: 'ALLIANCE',
        title: 'Major Security Pact Solidified',
        description: text,
        importance: 6,
        whyItMatters: 'Collective security blocks formed, shifting isolated bilateral frictions into multi-state bloc deterrents.'
      });
    }

    // 5. Popular Unrest / Rebellion
    else if (lower.includes('unrest sparked') || lower.includes('coup risk') || lower.includes('mutiny') || lower.includes('rebel')) {
      addTP({
        tick: ev.tick,
        type: 'DOMESTIC_CRISIS',
        title: 'Popular Instability Outbreak',
        description: text,
        importance: 8,
        whyItMatters: 'Internal systems decayed quicker than external defense shields, presenting domestic collapse risks from civil insurgency.'
      });
    }
  });

  // Also parse active strikes for high-damage incidents
  worldState.activeStrikes.forEach((strike) => {
    if (strike.status === 'IMPACT' && strike.damageDealt) {
      const dam = strike.damageDealt;
      const targetCountryName = worldState.countries[strike.targetCountryId]?.name || 'Adversary';

      if (strike.weaponType === 'ICBM' || strike.weaponType === 'SLBM') {
        addTP({
          tick: strike.impactTick,
          type: 'NUCLEAR',
          title: `atomic Impact: ${targetCountryName}`,
          description: `Strategic missile impact reported in ${targetCountryName}. Casualties: ${dam.casualtiesEstimate.toLocaleString()}.`,
          importance: 10,
          whyItMatters: 'Tactical shields breached. A major metropole suffered catastrophic impact, rewriting demographic matrices instantly.'
        });
      } else if (dam.casualtiesEstimate > 100000) {
        addTP({
          tick: strike.impactTick,
          type: 'WAR',
          title: `Catastrophic Strike: ${targetCountryName}`,
          description: `Kinetic missile bombardment breached local interceptors in ${targetCountryName}. Casualties exceed hundreds of thousands.`,
          importance: 8,
          whyItMatters: 'Overwhelming bombardment saturation overwhelmed localized defense arrays, creating severe infrastructural ruin.'
        });
      }
    }
  });

  // Sort by Importance (descending) then Tick (ascending)
  // Ensure we limit to top 5 turning points, and that they are truly distinctive
  const refinedTurningPoints = turningPoints
    .sort((a, b) => b.importance - a.importance || a.tick - b.tick)
    .filter((tp, index, self) => self.findIndex(t => t.title === tp.title) === index) // unique titles
    .slice(0, 5)
    .sort((a, b) => a.tick - b.tick); // show them back in chronological timeline order for story readability

  // ----------------------------------------------------
  // Part 3: Player Strategy Assessment (Doctrine)
  // ----------------------------------------------------
  // We compute scores from 0 to 100 on key axes:
  
  // Axis A: Restrained vs Aggressive
  const strikesLaunched = worldState.activeStrikes.filter(s => s.sourceCountryId === playerCountryId).length;
  const playerWarsCount = playerCountry?.atWarWith?.length || 0;
  const aggressionScore = Math.min(100, (strikesLaunched * 25) + (playerWarsCount * 25));

  // Axis B: Defensive vs Expansionist (Military spending vs Domestic unrest or territorial controllers)
  const isHypersonicUnlocked = playerCountry?.researchUnlocked?.includes('HYPERSONIC_TECH') || false;
  const isIronDomeV3Unlocked = playerCountry?.researchUnlocked?.includes('IRON_DOME_V3') || false;
  const milSpending = playerCountry?.economic?.spendingAllocation?.military || 0.2;
  const defenseScore = Math.round(Math.max(0, Math.min(100, (milSpending * 100) + (isIronDomeV3Unlocked ? 30 : 0) - (isHypersonicUnlocked ? 15 : 0))));

  // Axis C: Isolationist vs Coalition-Driven (Count of friends, trade alliances)
  const allies = Object.keys(worldState.countries).filter(
    (id) => id !== playerCountryId && (worldState.countries[id]?.opinions[playerCountryId] ?? 0) > 40
  ).length;
  const alliancesScore = Math.min(100, allies * 25);

  // Axis D: Economic Coercion vs Military Reliance
  const tradeSize = playerCountry?.tradePartners?.length || 0;
  const treasuryCash = playerCountry?.economic?.treasuryCashB || 1000;
  const cashScore = Math.min(100, Math.round((treasuryCash / 2500) * 100));
  const econMetric = Math.min(100, Math.max(0, (tradeSize * 20) + (cashScore / 2)));

  // Ground traits in measured data
  const traits: string[] = [];
  if (strikesLaunched >= 3) traits.push('AUTHORIZED LARGE-SCALE BOMBARDMENT OPERATIONS');
  if (allies >= 3) traits.push('FORGED STABLE UNIFIED DEFENSIVE BLOCK WITH GEOPOLITICAL ALLIES');
  if (playerCountry?.political?.leaderApprovalRating && playerCountry.political.leaderApprovalRating > 75) {
    traits.push('MAINTAINED HIGH STRUCTURAL APPROVAL DESPITE SEVERE SIMULATION STRESS');
  }
  if (playerCountry?.economic?.inflationRate && playerCountry.economic.inflationRate > 20) {
    traits.push('SUFFERED RUNAWAY HYPERINFLATION DURING INTENSE RESOURCES ATTRITION');
  }
  if (worldState.nuclearExchangeOccurred && strikesLaunched > 0) {
    traits.push('INITIATED AT CONVERSE RANGE TERMINAL THERMONUCLEAR EXCHANGE');
  }
  if (strikesLaunched === 0 && playerWarsCount === 0) {
    traits.push('ACHIEVED COMPLETE STRATEGIC KINETIC RESTRAINT');
  }

  // Formulate strategic doctrine classification
  let classification = 'ACTIVE_PRAGMATIST';
  let title = 'Active Pragmatist';
  let summary = 'Your administration reacted dynamically to situational threats, balancing diplomatic defensive shielding with targeted sanction campaigns without locking into unilateral extremism.';

  if (strikesLaunched >= 3 && worldState.nuclearExchangeOccurred) {
    classification = 'PREEMPTIVE_DESTROYER';
    title = 'Armageddon Shield Doctrine';
    summary = 'Your leadership operationalized preemptive total bombardment. Convinced that deterrence failure was inevitable, you prioritized absolute terminal annihilation of adversary grid quadrants.';
  } else if (strikesLaunched >= 2 && playerWarsCount >= 1) {
    classification = 'MILITANT_EXPANSIONIST';
    title = 'Strategic Hegemonic Hawk';
    summary = 'A campaign defined by offensive unilateral actions. You leveraged superior tactical strike modules to suppress adversarial capabilities before multi-state containment could fuse.';
  } else if (allies >= 3 && strikesLaunched === 0) {
    classification = 'DIPLOMATIC_PACIFIER';
    title = 'Multilateral Coalition Guardian';
    summary = 'Perfect synchronization of defensive alliance blocks. By ensuring constant security agreements and high global opinion rankings, you transformed your nation into an untouchable fortress.';
  } else if (treasuryCash > 1800 && strikesLaunched === 0) {
    classification = 'MERCANTILE_GUARDIAN';
    title = 'Sovereign Fiscal Autocrat';
    summary = 'You utilized financial reserves as an unyielding ballistic defense. Shielded by absolute macroeconomic liquidity, your sovereignty outpaced adversarial aggression structures without deploying kinetic hardware.';
  } else if (playerCountry?.political?.popularUnrest && playerCountry.political.popularUnrest > 80) {
    classification = 'INTERNAL_DECAY';
    title = 'Sovereign Under Siege';
    summary = 'External conflicts were overshadowed by catastrophic domestic fractures. Failing to pacify local segments, administrative command fell under critical civil coup risks.';
  }

  const axes: DoctrineAxis[] = [
    {
      label: 'Engagement Posture',
      score: aggressionScore,
      leftLabel: 'Total Strategic Restraint',
      rightLabel: 'Offensive Primacy',
      description: 'Measures your use of offensive military orders. High scores represent a preference for kinetic decimation over diplomatic resolution.',
    },
    {
      label: 'Security Alignment',
      score: alliancesScore,
      leftLabel: 'Absolute Sovereign Isolationism',
      rightLabel: 'Multilateral Integration',
      description: 'Tracks opinions and formal blocks. Coalition guardians preserve deep webs of mutual defense, while isolationists operate unilaterally.',
    },
    {
      label: 'Infrastructural Focus',
      score: defenseScore,
      leftLabel: 'Sovereign Hardpower Attrition',
      rightLabel: 'Domestic Fortification',
      description: 'Reflects investments inside defensive grids (interceptors, firewalls, ABM shielding) versus frontline armament serialization.',
    },
    {
      label: 'Resource Warfare Style',
      score: econMetric,
      leftLabel: 'Pure Kinetic Reliance',
      rightLabel: 'Treasury / Sanctions Dominance',
      description: 'Compares your deployment of trade networks, Treasury reserves, and financial trade embargoes against physical missile payloads.',
    }
  ];

  const playerAssessment: PlayerStrategyAssessment = {
    classification,
    title,
    summary,
    axes,
    traits: traits.length > 0 ? traits : ['MAINTAINED STEADY ADMINISTRATIVE RESTRAINT'],
  };

  // ----------------------------------------------------
  // Part 4: AI Reveal Upgrade -> Operational groupings
  // ----------------------------------------------------
  // Group related AI actions into high-insight campaigns
  const operations = worldState.aiOperationsLog || [];
  const campaignsMap = new Map<string, DeclassifiedAIOperation>();

  operations.forEach((op) => {
    const operatorCountry = worldState.countries[op.countryId];
    const flag = operatorCountry?.flagEmoji || '🌐';
    const countryName = operatorCountry?.name || op.countryName;
    
    // Group keys based on countryId + general strategic focus
    let focusType: DeclassifiedAIOperation['focusType'] = 'INFLUENCE';
    let codename = 'OPERATION WHITE COAL';
    let intent = `Destabilize adversary command.`;
    let consequence = 'Erosion of localized institutional trust.';

    const descLower = op.description.toLowerCase();
    const actionLower = op.action.toLowerCase();

    if (descLower.includes('sanction') || descLower.includes('embargo') || descLower.includes('default')) {
      focusType = 'CONTAINMENT';
      codename = `EMBARGO CODE ${op.countryId}-77`;
      intent = `Isolate the target nation financially, severing trade routes and stripping cash B capital reserves.`;
      consequence = `Induced severe debt stress indices and reduced corporate outputs inside target domains.`;
    } else if (descLower.includes('nuke') || descLower.includes('icbm') || descLower.includes('slbm') || descLower.includes('bomber') || descLower.includes('silo')) {
      focusType = 'BRINKMANSHIP';
      codename = `OPERATION RED DAWN`;
      intent = `Signal immediate thermonuclear retaliatory intent to deter impending kinetic incursions.`;
      consequence = `Shifted global strategic threat levels to RED, locking in automatic launch systems.`;
    } else if (descLower.includes('rebel') || descLower.includes('propaganda') || descLower.includes('unrest') || descLower.includes('social media')) {
      focusType = 'SABOTAGE';
      codename = `PROJECT CHRONOS BLANK`;
      intent = `Inject severe synthetic dissent into communications networks to spike domestic popular unrest.`;
      consequence = `Degraded state stability index, increasing structural Coup d\'État risks.`;
    } else if (descLower.includes('alliance') || descLower.includes('opinions') || descLower.includes('pact')) {
      focusType = 'COALESCENCE';
      codename = `GEOPOLITICAL SHIELD MATRIX`;
      intent = `Forge an impenetrable democratic/autocratic coalition block to encircle strategic rivals.`;
      consequence = `Created unified defensive spheres, changing regional equations into multi-national defense walls.`;
    } else if (actionLower.includes('cyber') || descLower.includes('hack') || descLower.includes('firewall')) {
      focusType = 'SABOTAGE';
      codename = `GRIDBREAKER ${op.countryId}-V`;
      intent = `Exfiltrate operational tactical coordinate grids and inject malware into local energy grids.`;
      consequence = `Sovereign signals compromised, decreasing military readiness percentages.`;
    }

    const mapKey = `${op.countryId}-${focusType}`;
    if (!campaignsMap.has(mapKey)) {
      campaignsMap.set(mapKey, {
        operatorName: countryName,
        operatorId: op.countryId,
        flag,
        codename,
        focusType,
        intent,
        consequence,
        secrecyScore: op.secrecyScore || 50,
        impactScore: op.impactScore || 50,
        tickFirstActive: op.tick,
        relatedEventsCount: 1,
        logs: [op]
      });
    } else {
      const existing = campaignsMap.get(mapKey)!;
      existing.relatedEventsCount++;
      // Average scores
      existing.secrecyScore = Math.round((existing.secrecyScore + (op.secrecyScore || 50)) / 2);
      existing.impactScore = Math.round((existing.impactScore + (op.impactScore || 50)) / 2);
      // Track minimum tick as launch tick
      if (op.tick < existing.tickFirstActive) {
        existing.tickFirstActive = op.tick;
      }
      existing.logs.push(op);
    }
  });

  // Convert map to list and sort by Impact Score then related events
  const aiCampaigns = Array.from(campaignsMap.values())
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 4); // Top 4 high-fidelity campaigns

  // ----------------------------------------------------
  // Part 5: Deeper Analytical Data Breakdown
  // ----------------------------------------------------
  // 1. Casualty Concentration by Theater
  const casualtiesMap = new Map<string, number>();
  // 2. GDP losses by Nation
  const gdpLossMap = new Map<string, number>();

  // Ensure all countries exist inside our maps
  Object.keys(worldState.countries).forEach((cId) => {
    casualtiesMap.set(cId, 0);
    gdpLossMap.set(cId, 0);
  });

  worldState.activeStrikes
    .filter(s => s.status === 'IMPACT' && s.damageDealt)
    .forEach((strike) => {
      const target = strike.targetCountryId;
      const cas = strike.damageDealt?.casualtiesEstimate || 0;
      const gdp = strike.damageDealt?.gdpLoss || 0;

      casualtiesMap.set(target, (casualtiesMap.get(target) || 0) + cas);
      gdpLossMap.set(target, (gdpLossMap.get(target) || 0) + gdp);
    });

  // Calculate percentages
  const grandTotalCasualties = Array.from(casualtiesMap.values()).reduce((sum, v) => sum + v, 0) || 1;
  const grandTotalGdpLost = Array.from(gdpLossMap.values()).reduce((sum, v) => sum + v, 0) || 1;

  const casualtyByNation = Array.from(casualtiesMap.entries())
    .map(([cId, count]) => {
      const country = worldState.countries[cId];
      return {
        countryId: cId,
        name: country?.name || cId,
        flag: country?.flagEmoji || '🌐',
        count,
        percentage: Math.round((count / grandTotalCasualties) * 100)
      };
    })
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const gdpLossByNation = Array.from(gdpLossMap.entries())
    .map(([cId, loss]) => {
      const country = worldState.countries[cId];
      return {
        countryId: cId,
        name: country?.name || cId,
        flag: country?.flagEmoji || '🌐',
        loss,
        percentage: Math.round((loss / grandTotalGdpLost) * 100)
      };
    })
    .filter(item => item.loss > 0)
    .sort((a, b) => b.loss - a.loss);

  // Wars by continent/region
  const warsRegionMap = new Map<string, number>();
  Object.entries(worldState.countries).forEach(([cId, countryItem]) => {
    const c = countryItem as Country;
    if (c?.atWarWith && c.atWarWith.length > 0) {
      const continent = c.continent || 'Global Coast';
      warsRegionMap.set(continent, (warsRegionMap.get(continent) || 0) + c.atWarWith.length);
    }
  });

  const warsByRegion = Array.from(warsRegionMap.entries())
    .map(([region, count]) => ({
      region,
      count: Math.round(count / 2) // Divid dyads count
    }))
    .filter(item => item.count > 0);

  // Diplomatic opinions stats for player
  let activeSanctionsCount = playerCountry?.economic?.sanctionedBy?.length || 0;
  let friendlyCount = 0;
  let hostileCount = 0;
  let neutralCount = 0;

  Object.entries(worldState.countries).forEach(([cId, countryItem]) => {
    if (cId !== playerCountryId) {
      const c = countryItem as Country;
      const op = c.opinions[playerCountryId] ?? 0;
      if (op > 40) friendlyCount++;
      else if (op < -40) hostileCount++;
      else neutralCount++;
    }
  });

  const diplomaticBalance = {
    allies: friendlyCount,
    hostile: hostileCount,
    neutral: neutralCount,
    activeSanctions: activeSanctionsCount,
  };

  // Crisis intensity scorecard per phase
  const getPhaseScore = (phase: 'OPENING' | 'ESCALATION' | 'CLIMAX' | 'RESOLUTION'): number => {
    let score = 5;
    // Count strikes and wars in this segment
    const strikesInPhase = worldState.activeStrikes.filter(s => getEventPhase(s.impactTick) === phase).length;
    score += (strikesInPhase * 15);
    // Include event severity multipliers
    const severeEvents = (worldState.globalEventLog || []).filter(e => getEventPhase(e.tick) === phase && e.severity === 'CRITICAL').length;
    score += (severeEvents * 10);
    return Math.min(100, score);
  };

  const crisisIntensityTimeline = [
    { phase: 'OPENING', score: getPhaseScore('OPENING') },
    { phase: 'ESCALATION', score: getPhaseScore('ESCALATION') },
    { phase: 'CLIMAX', score: getPhaseScore('CLIMAX') },
    { phase: 'RESOLUTION', score: getPhaseScore('RESOLUTION') },
  ];

  const analytics: DerivedAnalyticsBreakdown = {
    casualtyByNation,
    gdpLossByNation,
    warsByRegion: warsByRegion.length > 0 ? warsByRegion : [{ region: 'Neutral Domains', count: 0 }],
    diplomaticBalance,
    crisisIntensityTimeline,
  };

  return {
    turningPoints: refinedTurningPoints,
    phases,
    playerAssessment,
    aiCampaigns,
    analytics,
    sessionDiagnosis,
  };
}
