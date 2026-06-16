import { Country, Leader, CanonicalWorld, CountryState, LeaderState, WorldEvent, OperationState, IntelFact, TreatyState, Ideology } from '../types';
import { resolveEvents } from '../sim/resolvers/eventResolver';
import { resolveOperations } from '../sim/resolvers/operationResolver';
import { resolveIntel } from '../sim/resolvers/intelResolver';
import { resolveTreaties } from '../sim/resolvers/treatyResolver';
import { resolveEconomy } from '../sim/resolvers/economyResolver';
import { resolveMilitary } from '../sim/resolvers/militaryResolver';
import { resolveCyber } from '../sim/resolvers/cyberResolver';
import { resolveAI } from '../sim/resolvers/aiResolver';
import { computeDerivedMetrics } from '../sim/derived/derivedMetrics';
import { processBusEventQueue } from '../sim/eventBus/dispatcher';

export function getCapital(countryId: string): string {
  const capitals: Record<string, string> = {
    US: 'Washington D.C.',
    CN: 'Beijing',
    IN: 'New Delhi',
    PK: 'Islamabad',
    IL: 'Jerusalem',
    PS: 'Ramallah',
    IR: 'Tehran',
    RU: 'Moscow',
    GB: 'London',
    FR: 'Paris',
    DE: 'Berlin',
    JP: 'Tokyo',
    KR: 'Seoul',
    SA: 'Riyadh',
    BR: 'Brasilia',
    ZA: 'Pretoria',
    AU: 'Canberra',
    TR: 'Ankara',
    EG: 'Cairo',
    TW: 'Taipei',
  };
  return capitals[countryId] || 'Capital City';
}

export function getRegion(countryId: string): { region: string; subregion: string } {
  const regions: Record<string, { region: string; subregion: string }> = {
    US: { region: 'Americas', subregion: 'Northern America' },
    CN: { region: 'Asia', subregion: 'Eastern Asia' },
    IN: { region: 'Asia', subregion: 'Southern Asia' },
    PK: { region: 'Asia', subregion: 'Southern Asia' },
    IL: { region: 'Middle East', subregion: 'Western Asia' },
    PS: { region: 'Middle East', subregion: 'Western Asia' },
    IR: { region: 'Middle East', subregion: 'Western Asia' },
    RU: { region: 'Europe/Asia', subregion: 'Eastern Europe' },
    GB: { region: 'Europe', subregion: 'Western Europe' },
    FR: { region: 'Europe', subregion: 'Western Europe' },
    DE: { region: 'Europe', subregion: 'Western Europe' },
    JP: { region: 'Asia', subregion: 'Eastern Asia' },
    KR: { region: 'Asia', subregion: 'Eastern Asia' },
    SA: { region: 'Middle East', subregion: 'Western Asia' },
    BR: { region: 'Americas', subregion: 'South America' },
    ZA: { region: 'Africa', subregion: 'Southern Africa' },
    AU: { region: 'Oceania', subregion: 'Australia and New Zealand' },
    TR: { region: 'Middle East/Europe', subregion: 'Western Asia' },
    EG: { region: 'Africa', subregion: 'Northern Africa' },
    TW: { region: 'Asia', subregion: 'Eastern Asia' },
  };
  return regions[countryId] || { region: 'Global', subregion: 'Global' };
}

export function getResources(countryId: string): string[] {
  const resources: Record<string, string[]> = {
    US: ['Rare Earth Materials', 'Natural Gas', 'Shale Oil', 'Agriculture', 'Technology'],
    CN: ['Silicon', 'Lithium', 'Rare Earth Metals', 'Industry Scalability', 'Solar Panels'],
    RU: ['Natural Gas', 'Crude Oil', 'Wheat', 'Enriched Uranium', 'Nickel'],
    SA: ['Crude Oil', 'Chemical Refineries', 'Solar potential'],
    AU: ['Coal', 'Iron Ore', 'Natural Gas', 'Uranium', 'Gold'],
    BR: ['Soybeans', 'Iron Ore', 'Biofuels', 'Timber', 'Deepwater Petroleum'],
    ZA: ['Platinum', 'Gold', 'Chromium', 'Diamonds', 'Coal'],
    IR: ['Crude Oil', 'Natural Gas', 'Copper', 'Pistachios'],
  };
  return resources[countryId] || ['Heavy Industry', 'Local Resources', 'Agriculture'];
}

export function getGovernmentType(countryId: string, ideology: Ideology): string {
  if (ideology === 'DEMOCRACY') return 'Federal Constitutional Republic';
  if (ideology === 'AUTOCRACY') return 'De Facto One-Party State';
  if (ideology === 'MILITARY_JUNTA') return 'Transitional Military Dictatorship';
  if (ideology === 'THEOCRACY') return 'Unitary Islamic Republic (Theocratic)';
  if (ideology === 'TECHNOCRACY') return 'Oligarchical Technocratic Bureaucracy';
  if (ideology === 'COMMUNISM') return 'Leninist-Socialist Republic';
  if (ideology === 'MONARCHY') return 'Absolute Executive Monarchy';
  return 'Sovereign Administration Council';
}

function getInitialMacroData(id: string, rawGDP: number, rawDebt: number, rawStress: number) {
  const defaults: Record<string, any> = {
    US: {
      businessCyclePhase: 'EXPANSION',
      fragilityScore: 12,
      resilienceScore: 92,
      externalExposureScore: 20,
      importDependenceScore: 30,
      exportConcentrationScore: 15,
      shockLoad: 5,
      recoveryMomentum: 85,
      macroTrend: 'BOOMING',
      currencyStability: 95,
      recentMacroDrivers: ['Tech sector expansion', 'Strong consumer demand', 'US dollar reserve status hegemony'],
      policyPosture: 'PRO_GROWTH',
      sectors: { energy: 15, agriculture: 5, manufacturing: 15, tech: 25, services: 35, defense: 5, state: 10 }
    },
    DE: {
      businessCyclePhase: 'SLOWDOWN',
      fragilityScore: 25,
      resilienceScore: 80,
      externalExposureScore: 45,
      importDependenceScore: 55,
      exportConcentrationScore: 30,
      shockLoad: 15,
      recoveryMomentum: 65,
      macroTrend: 'STAGNANT',
      currencyStability: 88,
      recentMacroDrivers: ['Energy import shift transition', 'Export automotive slowdown', 'Fiscal constraints'],
      policyPosture: 'AUSTERITY',
      sectors: { energy: 5, agriculture: 3, manufacturing: 35, tech: 15, services: 35, defense: 2, state: 15 }
    },
    FR: {
      businessCyclePhase: 'SLOWDOWN',
      fragilityScore: 28,
      resilienceScore: 78,
      externalExposureScore: 40,
      importDependenceScore: 50,
      exportConcentrationScore: 25,
      shockLoad: 12,
      recoveryMomentum: 68,
      macroTrend: 'STABLE',
      currencyStability: 85,
      recentMacroDrivers: ['High state sector presence', 'Labor market slack', 'European Central Bank interest rate normalization'],
      policyPosture: 'AUSTERITY',
      sectors: { energy: 8, agriculture: 10, manufacturing: 20, tech: 12, services: 30, defense: 5, state: 25 }
    },
    GB: {
      businessCyclePhase: 'SLOWDOWN',
      fragilityScore: 32,
      resilienceScore: 74,
      externalExposureScore: 50,
      importDependenceScore: 55,
      exportConcentrationScore: 20,
      shockLoad: 18,
      recoveryMomentum: 62,
      macroTrend: 'STAGNANT',
      currencyStability: 80,
      recentMacroDrivers: ['Imported food & energy friction', 'Services sector stagnation', 'Sovereign interest debt burden'],
      policyPosture: 'AUSTERITY',
      sectors: { energy: 10, agriculture: 3, manufacturing: 15, tech: 15, services: 40, defense: 4, state: 18 }
    },
    CN: {
      businessCyclePhase: 'EXPANSION',
      fragilityScore: 28,
      resilienceScore: 85,
      externalExposureScore: 35,
      importDependenceScore: 25,
      exportConcentrationScore: 40,
      shockLoad: 10,
      recoveryMomentum: 80,
      macroTrend: 'STABLE',
      currencyStability: 85,
      recentMacroDrivers: ['Manufacturing leadership', 'Supply chain dominance', 'Real estate deleveraging'],
      policyPosture: 'INDUSTRIAL_ALLOCATION',
      sectors: { energy: 10, agriculture: 8, manufacturing: 40, tech: 20, services: 12, defense: 5, state: 25 }
    },
    PK: {
      businessCyclePhase: 'CRISIS',
      fragilityScore: 85,
      resilienceScore: 22,
      externalExposureScore: 85,
      importDependenceScore: 75,
      exportConcentrationScore: 55,
      shockLoad: 65,
      recoveryMomentum: 25,
      macroTrend: 'CRISIS',
      currencyStability: 25,
      recentMacroDrivers: ['Severe balance of payment stress', 'External debt amortization', 'Import food & energy inflation'],
      policyPosture: 'DEBT_STABILIZATION',
      sectors: { energy: 5, agriculture: 30, manufacturing: 15, tech: 5, services: 25, defense: 5, state: 15 }
    },
    EG: {
      businessCyclePhase: 'SLOWDOWN',
      fragilityScore: 72,
      resilienceScore: 35,
      externalExposureScore: 70,
      importDependenceScore: 65,
      exportConcentrationScore: 45,
      shockLoad: 40,
      recoveryMomentum: 40,
      macroTrend: 'DETERIORATING',
      currencyStability: 40,
      recentMacroDrivers: ['Suez Canal revenue drop', 'Heavy food import dependencies', 'Sovereign interest burdens'],
      policyPosture: 'AUSTERITY',
      sectors: { energy: 15, agriculture: 20, manufacturing: 15, tech: 5, services: 30, defense: 3, state: 17 }
    },
    SA: {
      businessCyclePhase: 'EXPANSION',
      fragilityScore: 18,
      resilienceScore: 88,
      externalExposureScore: 60,
      importDependenceScore: 40,
      exportConcentrationScore: 75,
      shockLoad: 5,
      recoveryMomentum: 80,
      macroTrend: 'BOOMING',
      currencyStability: 95,
      recentMacroDrivers: ['Elevated crude export pricing', 'Sovereign wealth diversification', 'State strategic investments'],
      policyPosture: 'INDUSTRIAL_ALLOCATION',
      sectors: { energy: 50, agriculture: 2, manufacturing: 10, tech: 8, services: 20, defense: 2, state: 40 }
    },
    RU: {
      businessCyclePhase: 'STABILIZATION',
      fragilityScore: 58,
      resilienceScore: 60,
      externalExposureScore: 50,
      importDependenceScore: 45,
      exportConcentrationScore: 70,
      shockLoad: 50,
      recoveryMomentum: 55,
      macroTrend: 'STABLE',
      currencyStability: 58,
      recentMacroDrivers: ['Sanctions evasion networks', 'State military-industrial mobilization', 'Vostro rupee-ruble pipeline adaptation'],
      policyPosture: 'INDUSTRIAL_ALLOCATION',
      sectors: { energy: 35, agriculture: 10, manufacturing: 15, tech: 5, services: 12, defense: 18, state: 35 }
    },
    IR: {
      businessCyclePhase: 'CONTRACTION',
      fragilityScore: 78,
      resilienceScore: 30,
      externalExposureScore: 70,
      importDependenceScore: 50,
      exportConcentrationScore: 65,
      shockLoad: 55,
      recoveryMomentum: 35,
      macroTrend: 'DETERIORATING',
      currencyStability: 28,
      recentMacroDrivers: ['Strict secondary sanctions blockade', 'Over-printing rial devaluation', 'Severe black market premium leakage'],
      policyPosture: 'CURRENCY_DEFENSE',
      sectors: { energy: 25, agriculture: 15, manufacturing: 18, tech: 4, services: 15, defense: 10, state: 28 }
    },
    BR: {
      businessCyclePhase: 'EXPANSION',
      fragilityScore: 48,
      resilienceScore: 58,
      externalExposureScore: 35,
      importDependenceScore: 25,
      exportConcentrationScore: 45,
      shockLoad: 20,
      recoveryMomentum: 60,
      macroTrend: 'STABLE',
      currencyStability: 70,
      recentMacroDrivers: ['Agricultural export boom', 'Elevated state debt servicing costs', 'Commodity demand fluctuations'],
      policyPosture: 'STIMULUS',
      sectors: { energy: 15, agriculture: 22, manufacturing: 18, tech: 8, services: 25, defense: 2, state: 20 }
    },
    IN: {
      businessCyclePhase: 'OVERHEATING',
      fragilityScore: 32,
      resilienceScore: 75,
      externalExposureScore: 40,
      importDependenceScore: 45,
      exportConcentrationScore: 20,
      shockLoad: 15,
      recoveryMomentum: 88,
      macroTrend: 'BOOMING',
      currencyStability: 82,
      recentMacroDrivers: ['Intense service export expansion', 'Public infrastructure capital surge', 'Core energy import basket inflation'],
      policyPosture: 'PRO_GROWTH',
      sectors: { energy: 8, agriculture: 15, manufacturing: 18, tech: 18, services: 32, defense: 4, state: 15 }
    },
    IL: {
      businessCyclePhase: 'CONTRACTION',
      fragilityScore: 52,
      resilienceScore: 68,
      externalExposureScore: 60,
      importDependenceScore: 50,
      exportConcentrationScore: 35,
      shadowLoad: 45,
      recoveryMomentum: 50,
      macroTrend: 'DETERIORATING',
      currencyStability: 75,
      recentMacroDrivers: ['Military mobilization cost surge', 'High-tech sector continuity risk', 'Leisure tourism collapse'],
      policyPosture: 'DEBT_STABILIZATION',
      sectors: { energy: 5, agriculture: 2, manufacturing: 10, tech: 30, services: 32, defense: 12, state: 15 }
    },
    PS: {
      businessCyclePhase: 'CRISIS',
      fragilityScore: 95,
      resilienceScore: 10,
      externalExposureScore: 95,
      importDependenceScore: 85,
      exportConcentrationScore: 60,
      shockLoad: 85,
      recoveryMomentum: 10,
      macroTrend: 'CRISIS',
      currencyStability: 10,
      recentMacroDrivers: ['Total infrastructure disruption', 'External transfers withholding', 'Civilian employment paralysis'],
      policyPosture: 'IMPORT_SUPPORT',
      sectors: { energy: 2, agriculture: 15, manufacturing: 8, tech: 2, services: 35, defense: 0, state: 48 }
    },
    JP: {
      businessCyclePhase: 'RECOVERY',
      fragilityScore: 30,
      resilienceScore: 78,
      externalExposureScore: 55,
      importDependenceScore: 78,
      exportConcentrationScore: 35,
      shockLoad: 20,
      recoveryMomentum: 70,
      macroTrend: 'STABLE',
      currencyStability: 80,
      recentMacroDrivers: ['Global tech cycle rebound', 'Import food & fossil fuels price adaptation', 'Sovereign structural reforms'],
      policyPosture: 'PRO_GROWTH',
      sectors: { energy: 2, agriculture: 2, manufacturing: 38, tech: 25, services: 25, defense: 3, state: 10 }
    },
    KR: {
      businessCyclePhase: 'RECOVERY',
      fragilityScore: 28,
      resilienceScore: 79,
      externalExposureScore: 60,
      importDependenceScore: 75,
      exportConcentrationScore: 40,
      shockLoad: 18,
      recoveryMomentum: 72,
      macroTrend: 'STABLE',
      currencyStability: 82,
      recentMacroDrivers: ['Semiconductor industrial demand rebound', 'Export electronics recovery', 'Pragmatic state micro-stimulus'],
      policyPosture: 'PRO_GROWTH',
      sectors: { energy: 2, agriculture: 2, manufacturing: 35, tech: 30, services: 23, defense: 3, state: 10 }
    },
    TW: {
      businessCyclePhase: 'EXPANSION',
      fragilityScore: 35,
      resilienceScore: 72,
      externalExposureScore: 75,
      importDependenceScore: 65,
      exportConcentrationScore: 65,
      shockLoad: 25,
      recoveryMomentum: 68,
      macroTrend: 'STABLE',
      currencyStability: 78,
      recentMacroDrivers: ['Silicon semiconductor fab hegemony', 'Geopolitical isolation risks', 'Industrial tech capital inflows'],
      policyPosture: 'PRO_GROWTH',
      sectors: { energy: 2, agriculture: 2, manufacturing: 20, tech: 45, services: 20, defense: 6, state: 10 }
    }
  };

  const selected = defaults[id] || {
    businessCyclePhase: 'EXPANSION',
    fragilityScore: Math.round(rawStress * 0.8) || 30,
    resilienceScore: Math.round(100 - (rawStress * 0.8)) || 70,
    externalExposureScore: 40,
    importDependenceScore: 40,
    exportConcentrationScore: 30,
    shockLoad: Math.round(rawStress * 0.4) || 12,
    recoveryMomentum: 50,
    macroTrend: 'STABLE',
    currencyStability: 70,
    recentMacroDrivers: ['Inherent economic stabilization', 'Default baseline activity'],
    policyPosture: 'PRO_GROWTH',
    sectors: { energy: 10, agriculture: 15, manufacturing: 25, tech: 10, services: 30, defense: 5, state: 10 }
  };

  return selected;
}

export function generateInitialCanonicalWorld(
  countries: Record<string, Country>,
  leaders: Record<string, Leader>,
  currentTick: number = 0
): CanonicalWorld {
  const countriesById: Record<string, CountryState> = {};
  const leadersById: Record<string, LeaderState> = {};

  // For each country in the active roster, hydrate into rich CountryState & LeaderState
  Object.keys(countries).forEach((id) => {
    const raw = countries[id];
    const leader = leaders[id];
    const { region, subregion } = getRegion(id);

    // Build the leader first if one exists
    let leaderId = `ldr_${id}_unknown`;
    if (leader) {
      leaderId = leader.id;
      
      const traits: string[] = [];
      if (leader.hawkDoveScore > 70) traits.push('Hawkish', 'Assertive');
      else if (leader.hawkDoveScore < 30) traits.push('Diplomatic', 'Pacifistic');
      else traits.push('Pragmatic', 'Negotiator');

      if (leader.riskTolerance > 75) traits.push('Risk-Taking', 'Sovereign Centered');
      else if (leader.riskTolerance < 30) traits.push('Highly Cautious', 'Defensive');

      const isUnstableCountry = id === 'PS' || id === 'PK' || id === 'IR';
      if (isUnstableCountry) {
        traits.push('Paranoid', 'Vigilant');
      }

      leadersById[leader.id] = {
        id: leader.id,
        countryId: id,
        fullName: leader.name,
        title: raw.political.ideology === 'MONARCHY' ? 'His Majesty' : raw.political.ideology === 'MILITARY_JUNTA' ? 'Chairman of Supreme Command' : 'President',
        ideologyAlignment: raw.political.ideology,
        traits,
        aggression: Math.round(leader.hawkDoveScore),
        caution: Math.round(100 - leader.riskTolerance),
        ambition: Math.round((leader.hawkDoveScore + leader.riskTolerance) / 2),
        paranoia: isUnstableCountry ? 85 : Math.round(100 - raw.political.stabilityIndex),
        popularity: Math.round(raw.political.leaderApprovalRating),
        health: 100,
        legitimacyBonus: raw.political.stabilityIndex > 60 ? 15 : -10,
        diplomacyStyle: leader.hawkDoveScore > 60 ? 'Assertive unilateral' : 'Multilateral coalition-builder',
        militaryPosturePreference: leader.hawkDoveScore > 70 ? 'Forward Interventionism' : 'Strategic Deterrence',
        hiddenRedLines: id === 'CN' ? ['Taiwan declaration of independent sovereignty', 'Naval incursions inside the First Island Chain'] : id === 'IL' ? ['Existential threat to civilian airspace', 'Enrichment of weapons grade fissile material past 90%'] : ['Direct attack targeting sovereign territory'],
        publicPersona: `National Leader of ${raw.name}, prioritizing sovereign security and structural development.`,
        internalNotes: `Geopolitical Profile. Alignment: ${leader.type}. Risk Factor: ${leader.riskTolerance}%`,
        memoryHooks: [],
      };
    }

    // Dynamic Country State building
    countriesById[id] = {
      id,
      name: raw.name,
      shortName: raw.name,
      isoCode: id,
      region,
      subregion,
      capital: getCapital(id),
      population: raw.population,
      ideology: raw.political.ideology,
      governmentType: getGovernmentType(id, raw.political.ideology),
      regimeStability: Math.round(raw.political.stabilityIndex),
      publicSentiment: Math.round(raw.political.leaderApprovalRating),
      unrest: Math.round(raw.political.popularUnrest),
      legitimacy: Math.round(raw.political.stabilityIndex),
      corruption: id === 'PS' ? 75 : id === 'RU' ? 60 : 15,
      strategicResources: getResources(id),
      allianceIds: raw.allianceBlock !== 'NEUTRAL' ? [raw.allianceBlock] : [],
      rivalIds: id === 'US' ? ['CN', 'RU', 'IR'] : id === 'CN' ? ['US', 'TW'] : id === 'RU' ? ['US', 'GB'] : [],
      treatyIds: raw.allianceBlock === 'NATO' ? ['NATO_TREATY_OBLIGATION'] : [],
      leaderId,
      economy: {
        gdp: raw.economic.gdpB,
        growthRate: raw.economic.gdpGrowthRate,
        inflation: raw.economic.inflationRate,
        unemployment: raw.economic.unemploymentRate,
        debtRatio: raw.economic.debtToGdpRatio,
        reserves: raw.economic.treasuryCashB,
        currencyStrength: raw.economic.currencyStrength,
        tradeBalance: raw.economic.tradeSurplusDeficitB,
        sanctionsExposure: raw.economic.sanctionedBy.length * 15,
        importDependency: id === 'JP' || id === 'KR' ? 80 : 35,
        exportDependency: id === 'CN' || id === 'SA' ? 65 : 25,
        energyProfile: id === 'SA' ? 'Self-Sustaining Net Exporter' : 'Import Dependent Grid',
        sectorBreakdown: {
          agriculture: raw.economic.sectors?.agriculture || 10,
          manufacturing: raw.economic.sectors?.manufacturing || 30,
          services: raw.economic.sectors?.services || 50,
          energy: raw.economic.sectors?.energy || 10,
        },
        supplyRisk: id === 'TW' ? 70 : 20,
        fiscalSpace: Math.max(0, Math.round(100 - raw.economic.debtToGdpRatio)),
        economicStress: Math.round(raw.economic.debtStressIndex),
        recoveryRate: 5,
        ...getInitialMacroData(id, raw.economic.gdpB, raw.economic.debtToGdpRatio, raw.economic.debtStressIndex)
      },
      military: {
        manpower: Math.round(raw.population * 0.05), // Abstraction of force size
        readiness: Math.round(raw.arsenal?.readinessLevel || 75),
        morale: Math.round(raw.arsenal?.readiness?.morale || 80),
        logisticsCapacity: Math.round(raw.arsenal?.logistics?.ammunition || 85),
        mobilizationLevel: 10, // Base peacetime
        nuclearStatus: raw.arsenal?.nuclearCapable || false,
        commandIntegrity: 95,
        forceProjection: id === 'US' ? 98 : id === 'CN' ? 70 : 40,
        unitAbstractions: raw.arsenal?.units?.filter(u => u.count > 0).map(u => `${u.count}x ${u.type}`) || [],
        strategicDeterrence: raw.arsenal?.nuclearCapable ? 100 : 0,
        missileDefense: Math.round(raw.arsenal?.abmShieldStrength || 5),
        a2adStrength: id === 'RU' || id === 'CN' ? 85 : 40,
        activeTheaters: [],
        warFatigue: 0,
        equipmentHealth: 90,
      },
      cyber: {
        offensiveCapability: id === 'US' ? 95 : id === 'CN' ? 90 : id === 'RU' ? 92 : 55,
        defensiveCapability: Math.round(raw.intelligence.cyberFirewallLevel || 60),
        infrastructureResilience: 70,
        activeIncidents: 0,
        intrusionLevel: 0,
        attributionExposure: 15,
        cyberDoctrine: id === 'US' ? 'Active Cyber Defense' : 'Strategic Network Interference',
        aptStrength: id === 'RU' ? 88 : id === 'CN' ? 85 : 30,
        civilianNetworkHealth: 95,
        militaryNetworkHealth: 99,
        financialNetworkHealth: 98,
        recoveryCapacity: 80,
      },
      ai: {
        personalityVector: { hawk: leader?.hawkDoveScore || 50, pragmatism: 50 },
        threatPerceptions: {},
        trustByCountry: {},
        hostilityByCountry: {},
        strategicGoals: id === 'US' ? ['Maintain Indo-Pacific freedom of navigation', 'Deter Eastern European nuclear escalations'] : id === 'CN' ? ['Achieve complete integration with Taiwan province', 'Expand Belt and Road infrastructure corridors'] : ['Secure regional alignment spheres'],
        activePlans: [],
        memoryLog: [],
        redLines: id === 'CN' ? ['Direct interference in Taiwan sovereignty'] : ['Assault targeting command communication assets'],
        decisionStyle: leader?.hawkDoveScore && leader.hawkDoveScore > 75 ? 'Assertive Military Deterrence' : 'Risk-Balanced Diplomacy',
        currentFocus: 'Sovereign security stabilization',
        escalationTolerance: leader?.riskTolerance || 50,
        deceptionPreference: id === 'RU' ? 85 : 30,
        riskTolerance: leader?.riskTolerance || 50,
        allianceReliabilityScores: {},
      },
      tags: id === 'US' ? ['NATO_LEADER', 'HYPERPOWER'] : id === 'CN' ? ['SCO_LEADER', 'INDUSTRIAL_GIANT'] : [],
      createdFromScenarioPreset: false,
      lastUpdatedTick: currentTick,
    };

    // Calculate initial country-to-country threat perception maps dynamically
    Object.keys(countries).forEach((otherId) => {
      if (id !== otherId) {
        const opinion = raw.opinions[otherId] ?? 0;
        countriesById[id].ai.threatPerceptions[otherId] = Math.max(0, Math.round(50 - opinion * 0.5));
        countriesById[id].ai.trustByCountry[otherId] = Math.max(0, Math.round(50 + opinion * 0.5));
        countriesById[id].ai.hostilityByCountry[otherId] = Math.max(0, Math.round(-opinion));
      }
    });
  });

  // 7. Seeded Dataset (crisis, operations, intel, treaties)
  
  // World Event 1: South China Sea Maritime Crisis (Active regional flashpoint)
  const event1: WorldEvent = {
    id: 'evt_south_china_sea_crisis',
    type: 'MILITARY',
    title: 'SCS Destroyer Blockade Incursion',
    description: 'An armed naval standoff occurred inside contested territorial waters near Mischief Reef. Direct sovereign combat signals registered.',
    severity: 'CRITICAL',
    status: 'active',
    visibility: 'PUBLIC',
    startTick: currentTick,
    endTick: null,
    involvedCountryIds: ['CN', 'US', 'TW'],
    involvedLeaderIds: ['ldr_CN_unknown', 'ldr_US_unknown'].map(id => leaders[id.split('_')[1]]?.id || id),
    originatingSystem: 'NAVY_RADAR_WARNING',
    effects: ['Bilateral opinion dropped by -25 between US and CN', 'Global Tension index elevated +12%'],
    tags: ['FLASHPOINT', 'SOUTH_CHINA_SEA', 'NAVAL_BLOCKADE'],
    linkedOperationIds: [],
    linkedIntelFactIds: ['inf_scs_satellite_proof'],
    escalationPotential: 82,
    historicalLogEntries: ['Standoff initialized at dawn.', 'Carrier Strike Group 5 locked missile radars.'],
  };

  // World Event 2: NATO-Kyiv Joint Cybersecurity Accord
  const event2: WorldEvent = {
    id: 'evt_cybersecurity_alliance',
    type: 'DIPLOMATIC',
    title: 'Trilateral Intelligence Firewall Treaty',
    description: 'Bilateral cybersecurity command hubs activated across Paris, London and Washington. Secure data pipelines constructed.',
    severity: 'INFO',
    status: 'active',
    visibility: 'PUBLIC',
    startTick: currentTick - 3,
    endTick: null,
    involvedCountryIds: ['US', 'GB', 'FR', 'DE'],
    involvedLeaderIds: [],
    originatingSystem: 'DIPLOMACY_REGISTRY',
    effects: ['Constructed passive +10 firewall multiplier', 'Strengthened Western European military network health'],
    tags: ['COALITION', 'CYBER_DEFENSE', 'INTELLIGENCE_SHARING'],
    linkedOperationIds: [],
    linkedIntelFactIds: [],
    escalationPotential: 15,
    historicalLogEntries: ['Signatures finalized in Brussels.'],
  };

  // World Event 3: BlackOut-26 Cyber Incident
  const event3: WorldEvent = {
    id: 'evt_powergrid_infiltration',
    type: 'CYBER',
    title: 'Financial Node Pipeline Intrusion',
    description: 'Classified malware patterns identified embedded in central trading routers in New York, originating from Eastern European server clusters.',
    severity: 'WARNING',
    status: 'active',
    visibility: 'CLASSIFIED',
    startTick: currentTick - 1,
    endTick: null,
    involvedCountryIds: ['RU', 'US'],
    involvedLeaderIds: [],
    originatingSystem: 'CYBER_COMMAND_ALERTS',
    effects: ['Industrial router infrastructure degraded', 'Attribution confidence scored at 88%'],
    tags: ['MALWARE', 'INFRASTRUCTURE_ATTACK', 'CLASSIFIED_MALWARE'],
    linkedOperationIds: ['op_covert_firewall_infiltration'],
    linkedIntelFactIds: ['inf_pipeline_signature'],
    escalationPotential: 52,
    historicalLogEntries: ['Heuristic engines flagged un-authorized tunnel transfers.'],
  };

  // Operation 1: "Operation Sovereign Shield"
  const op1: OperationState = {
    id: 'op_covert_firewall_infiltration',
    type: 'CYBER_EXPLOIT',
    subtype: 'INDUSTRIAL_SABOTAGE',
    sponsorCountryId: 'US',
    targetCountryIds: ['RU'],
    status: 'ACTIVE',
    secrecyLevel: 78,
    attributionRisk: 35,
    startTick: currentTick - 4,
    projectedEndTick: currentTick + 10,
    requiredAssets: ['NSA Signal Core', 'Elite Cyber Operator Delta'],
    allocatedBudget: 3.2,
    expectedEffects: ['Degrade commercial electrical power grid networks', 'Determine retaliatory redline limits'],
    actualEffects: ['Electrical grid stability dropped by 5%'],
    exposed: false,
    failureReason: null,
    linkedEventIds: ['evt_powergrid_infiltration'],
    linkedIntelFactIds: ['inf_pipeline_signature'],
    ownerSystem: 'COVERT_INTELLIGENCE_BRANCH',
  };

  // Intel Fact 1: Suspected Centrifuge Enrichment Site
  const intel1: IntelFact = {
    id: 'inf_scs_satellite_proof',
    subjectType: 'EVENT',
    subjectId: 'evt_south_china_sea_crisis',
    title: 'ASBM Launcher Battery Movement',
    summary: 'IMINT reconnaissance reveals active DF-21D anti-ship ballistic missile squads deploying along Hainan Island coastlines.',
    sourceType: 'IMINT',
    confidence: 90,
    discoveredTick: currentTick,
    expiresTick: currentTick + 30,
    verified: true,
    disputed: false,
    visibilityScope: 'PLAYER',
    relatedCountryIds: ['CN', 'US'],
    relatedEventIds: ['evt_south_china_sea_crisis'],
    relatedOperationIds: [],
    tags: ['SATELLITE_RECON', 'MISSILE_WARNING', 'ASBM_CONFIRMED'],
    metadata: { azimuth: 145.2, orbitsPassed: 4 },
  };

  const intel2: IntelFact = {
    id: 'inf_pipeline_signature',
    subjectType: 'OPERATION',
    subjectId: 'op_covert_firewall_infiltration',
    title: 'APT-29 Custom Shell Registry',
    summary: 'Incursion hashes match exactly previously documented state-sponsored intelligence campaigns, proving state direction.',
    sourceType: 'SIGINT',
    confidence: 65,
    discoveredTick: currentTick - 1,
    expiresTick: null,
    verified: false,
    disputed: true,
    visibilityScope: 'CLASSIFIED',
    relatedCountryIds: ['RU', 'US'],
    relatedEventIds: ['evt_powergrid_infiltration'],
    relatedOperationIds: ['op_covert_firewall_infiltration'],
    tags: ['MALWARE_HASHES', 'ATTRIBUTION_PROOF', 'DISPUTED_INTEL'],
    metadata: { compilerVersion: 'C++ Build 7.2.1400' },
  };

  // Treaty 1: North Atlantic Defensive Treaty
  const treaty1: TreatyState = {
    id: 'NATO_CHARTER_ART_5',
    name: 'North Atlantic Mutual Defense Accord',
    type: 'ALLIANCE',
    signatoryCountryIds: ['US', 'GB', 'FR', 'DE'],
    obligations: ['Mutual Defense via military assistance under Article 5', 'Joint naval warfare synchronization'],
    enforcementStrength: 98,
    secrecyLevel: 0, // Fully public
    startTick: -100,
    expirationTick: null,
    complianceByCountry: { US: 100, GB: 98, FR: 92, DE: 85 },
    violationHistory: [],
    status: 'ACTIVE',
    blocEffects: { defenceBudgetCapPct: 2.0 },
    tags: ['PUBLIC_ACCORD', 'WESTERN_SHIELD', 'NATO'],
  };

  // Base state definition
  const eventsById: Record<string, WorldEvent> = {
    evt_south_china_sea_crisis: event1,
    evt_cybersecurity_alliance: event2,
    evt_powergrid_infiltration: event3,
  };

  const operationsById: Record<string, OperationState> = {
    op_covert_firewall_infiltration: op1,
  };

  const intelFactsById: Record<string, IntelFact> = {
    inf_scs_satellite_proof: intel1,
    inf_pipeline_signature: intel2,
  };

  const treatiesById: Record<string, TreatyState> = {
    NATO_CHARTER_ART_5: treaty1,
  };

  // Derived indices
  const unstableCountries = Object.keys(countriesById)
    .filter(cid => countriesById[cid].regimeStability < 45)
    .map(cid => cid);

  const nuclearCountries = Object.keys(countriesById)
    .filter(cid => countriesById[cid].military.nuclearStatus)
    .map(cid => cid);

  const sanctionedCountries = Object.keys(countries)
    .filter(cid => countries[cid].economic.sanctionedBy.length > 0)
    .map(cid => cid);

  // Compute average stability
  const totalStab = Object.values(countriesById).reduce((a, b) => a + b.regimeStability, 0);
  const globalAverageStability = Math.round(totalStab / Object.keys(countriesById).length);

  // High risk flashpoints calculation helper
  const highRiskFlashpoints = Object.keys(countriesById).map(cid => {
    let score = 0;
    let hazardReason = 'Stable Baseline';
    
    const opinionSum = Object.values(countriesById[cid].ai.hostilityByCountry).reduce((a, b) => a + b, 0);
    const instability = 100 - countriesById[cid].regimeStability;
    
    score = Math.round((opinionSum / Object.keys(countriesById).length) * 0.4 + instability * 0.6);

    if (cid === 'PS') {
      hazardReason = 'Severe sectarian political friction and armed borders.';
      score = 95;
    } else if (cid === 'TW') {
      hazardReason = 'Constested sovereign claim by high-aggression rival.';
      score = 88;
    } else if (cid === 'PK') {
      hazardReason = 'Nuclear-armed regime stability strains and cross-border tension.';
      score = 78;
    } else if (score > 60) {
      hazardReason = 'Elevated regional rivalries and internal stress index.';
    }

    return { countryId: cid, score, hazardReason };
  }).sort((a,b) => b.score - a.score);

  // Compute global tension score based on active strikes, severe events, and average opinions
  const totalHostility = Object.values(countriesById).reduce((sum, c) => {
    return sum + Object.values(c.ai.hostilityByCountry).reduce((s, h) => s + h, 0);
  }, 0);
  const averageHostility = totalHostility / (Object.keys(countriesById).length * (Object.keys(countriesById).length - 1));
  const globalTensionIndex = Math.min(100, Math.max(10, Math.round(averageHostility + 15)));

  return {
    countriesById,
    leadersById,
    eventsById,
    operationsById,
    intelFactsById,
    treatiesById,
    tick: currentTick,
    selectedCountryId: 'US',
    selectedLeaderId: leaders['US']?.id || null,
    timeline: [
      { tick: currentTick - 5, desc: 'Tensions rose in South China Sea Mischief Coral reef blocks.', category: 'MILITARY' },
      { tick: currentTick - 3, desc: 'Firewall Security Sharing Treaty agreed upon between Washington and London.', category: 'DIPLOMATIC' },
      { tick: currentTick, desc: 'Sovereign Command Simulation Canonical World State activated.', category: 'SYSTEM' },
    ],
    derivedIndexes: {
      unstableCountries,
      nuclearCountries,
      sanctionedCountries,
      highRiskFlashpoints,
      globalAverageStability,
      globalTensionIndex,
    },
    scenarioMeta: {},
  };
}

export function advanceCanonicalWorldTick(world: CanonicalWorld, updatedCountriesRoster: Record<string, Country>, currentTick: number): CanonicalWorld {
  // Update core stats on CountryState based on the simulation outputs in worldStore.countries
  const updatedCountries: Record<string, CountryState> = { ...world.countriesById };
  
  Object.keys(updatedCountriesRoster).forEach((id) => {
    const raw = updatedCountriesRoster[id];
    const canonical = updatedCountries[id];
    if (canonical && raw) {
      // Keep GDP, reserves, stability, sentiment, unrest, ideology in lock-step
      canonical.ideology = raw.political.ideology;
      canonical.regimeStability = Math.round(raw.political.stabilityIndex);
      canonical.publicSentiment = Math.round(raw.political.leaderApprovalRating);
      canonical.unrest = Math.round(raw.political.popularUnrest);
      canonical.lastUpdatedTick = currentTick;

      // Update nested values
      canonical.economy.gdp = raw.economic.gdpB;
      canonical.economy.reserves = raw.economic.treasuryCashB;
      canonical.economy.inflation = raw.economic.inflationRate;
      canonical.economy.unemployment = raw.economic.unemploymentRate;
      canonical.economy.debtRatio = raw.economic.debtToGdpRatio;
      canonical.economy.economicStress = Math.round(raw.economic.debtStressIndex);
      canonical.economy.currencyStrength = raw.economic.currencyStrength;
      canonical.economy.tradeBalance = raw.economic.tradeSurplusDeficitB;
      canonical.economy.policyPosture = raw.economic.policyPosture || 'PRO_GROWTH';

      // Update military readiness
      canonical.military.readiness = Math.round(raw.arsenal?.readinessLevel || 75);
      canonical.military.morale = Math.round(raw.arsenal?.readiness?.morale || 80);
      canonical.military.logisticsCapacity = Math.round(raw.arsenal?.logistics?.ammunition || 85);
      canonical.military.nuclearStatus = raw.arsenal?.nuclearCapable || false;
      canonical.military.unitAbstractions = raw.arsenal?.units?.filter(u => u.count > 0).map(u => `${u.count}x ${u.type}`) || [];

      // Update opinion matrices
      Object.keys(updatedCountriesRoster).forEach((otherId) => {
        if (id !== otherId) {
          const opinion = raw.opinions[otherId] ?? 0;
          canonical.ai.threatPerceptions[otherId] = Math.max(0, Math.round(50 - opinion * 0.5));
          canonical.ai.trustByCountry[otherId] = Math.max(0, Math.round(50 + opinion * 0.5));
          canonical.ai.hostilityByCountry[otherId] = Math.max(0, Math.round(-opinion));
        }
      });
    }
  });

  // Base nextWorld container
  let nextWorld: CanonicalWorld = {
    ...world,
    countriesById: updatedCountries,
    tick: currentTick,
    busEventQueue: world.busEventQueue || [],
    busEventHistory: world.busEventHistory || [],
  };

  const logsCollector: string[] = [];

  // Resolution 1: World Event progression
  const eventRes = resolveEvents(nextWorld, currentTick);
  nextWorld.eventsById = eventRes.updatedEvents;
  logsCollector.push(...eventRes.logs);

  // Resolution 2: Covert Operation progression
  const opRes = resolveOperations(nextWorld, currentTick);
  nextWorld.operationsById = opRes.updatedOperations;
  logsCollector.push(...opRes.logs);

  // Resolution 3: Intel Facts aging & discovery
  const intelRes = resolveIntel(nextWorld, currentTick);
  nextWorld.intelFactsById = intelRes.updatedIntel;
  logsCollector.push(...intelRes.logs);

  // Resolution 4: Treaty status and compliance checks
  const treatyRes = resolveTreaties(nextWorld, currentTick);
  nextWorld.treatiesById = treatyRes.updatedTreaties;
  logsCollector.push(...treatyRes.logs);

  // Resolution 5: Economic drift & stress propagation
  const econRes = resolveEconomy(nextWorld, currentTick);
  nextWorld.countriesById = econRes.updatedCountries;
  logsCollector.push(...econRes.logs);

  // Resolution 6: Military readiness & mobilization
  const milRes = resolveMilitary(nextWorld, currentTick);
  nextWorld.countriesById = milRes.updatedCountries;
  logsCollector.push(...milRes.logs);

  // Resolution 7: Cyber incident Containment & Health
  const cyberRes = resolveCyber(nextWorld, currentTick);
  nextWorld.countriesById = cyberRes.updatedCountries;
  logsCollector.push(...cyberRes.logs);

  // Resolution 8: AI priorities/focus periodic assessment
  const aiRes = resolveAI(nextWorld, currentTick);
  nextWorld.countriesById = aiRes.updatedCountries;
  logsCollector.push(...aiRes.logs);

  // Resolution 8.5: Shared World Event Bus processing
  const busRes = processBusEventQueue(nextWorld, updatedCountriesRoster, currentTick);
  logsCollector.push(...busRes.logs);

  // Resolution 9: Recalculate derived indices & flashpoint heat
  const derived = computeDerivedMetrics(nextWorld.countriesById, nextWorld.eventsById);
  nextWorld.derivedIndexes = derived;

  // Resolution 10: Timeline writebacks
  const formattedLogs = logsCollector.map(log => ({
    tick: currentTick,
    desc: log,
    category: 'SYSTEM' as const
  }));

  nextWorld.timeline = [
    ...formattedLogs,
    ...nextWorld.timeline
  ].slice(0, 100);

  // Proactively sync-back computed macro values to interactive roster so UI elements stay congruent
  Object.keys(updatedCountriesRoster).forEach((id) => {
    const raw = updatedCountriesRoster[id];
    const canonical = nextWorld.countriesById[id];
    if (raw && canonical) {
      raw.economic.businessCyclePhase = canonical.economy.businessCyclePhase;
      raw.economic.policyPosture = canonical.economy.policyPosture;
      
      // Keep primary metrics in sync
      raw.economic.gdpB = canonical.economy.gdp;
      raw.economic.treasuryCashB = canonical.economy.reserves;
      raw.economic.inflationRate = canonical.economy.inflation;
      raw.economic.unemploymentRate = canonical.economy.unemployment;
      raw.economic.debtToGdpRatio = canonical.economy.debtRatio;
      raw.economic.debtStressIndex = canonical.economy.economicStress;
      raw.economic.gdpGrowthRate = canonical.economy.growthRate;
      raw.economic.currencyStrength = canonical.economy.currencyStrength;
      raw.economic.tradeSurplusDeficitB = canonical.economy.tradeBalance;
    }
  });

  return nextWorld;
}
