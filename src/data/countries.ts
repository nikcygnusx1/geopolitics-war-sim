import { WeaponType, FactionType, Ideology, AllianceBlock, SatelliteAsset, Province, Cabinet, PopulationProfile, EconomicSectors, SupplyChains, FinancialMarkets, MilitaryPersonnel, MilitaryLogistics, MilitaryReadiness, MilitaryCombat, InformationCampaign, SpyAsset, Country } from '../types';

const BASE_WEAPONS: { type: WeaponType; baseCount: number; power: number; cost: number }[] = [
  { type: 'ICBM', baseCount: 0, power: 95, cost: 2.0 },
  { type: 'SLBM', baseCount: 0, power: 90, cost: 2.5 },
  { type: 'CRUISE_MISSILE', baseCount: 50, power: 45, cost: 0.5 },
  { type: 'HYPERSONIC', baseCount: 0, power: 80, cost: 1.5 },
  { type: 'FIGHTER_JET', baseCount: 80, power: 35, cost: 0.8 },
  { type: 'STEALTH_BOMBER', baseCount: 10, power: 75, cost: 1.8 },
  { type: 'CARRIER_GROUP', baseCount: 1, power: 85, cost: 3.5 },
  { type: 'SUBMARINE', baseCount: 8, power: 60, cost: 1.2 },
  { type: 'TANK_DIVISION', baseCount: 15, power: 30, cost: 0.3 },
  { type: 'ARTILLERY', baseCount: 40, power: 20, cost: 0.1 },
  { type: 'DRONE_SWARM', baseCount: 30, power: 25, cost: 0.2 },
  { type: 'CYBER_WEAPON', baseCount: 5, power: 15, cost: 0.4 },
  { type: 'EMP_DEVICE', baseCount: 1, power: 40, cost: 0.6 },
  { type: 'DIRTY_BOMB', baseCount: 0, power: 50, cost: 0.5 },
];

const SEED_TEMPLATES: Record<string, {
  name: string;
  flag: string;
  continent: string;
  pop: number;
  ideology: Ideology;
  block: AllianceBlock;
  gdp: number;
  power: number;
  nuclear: boolean;
  notes: string;
}> = {
  US: { name: 'United States', flag: '🇺🇸', continent: 'North America', pop: 335, ideology: 'DEMOCRACY', block: 'NATO', gdp: 28000, power: 95, nuclear: true, notes: 'Hyperpower, 11 aircraft carriers' },
  CN: { name: 'China', flag: '🇨🇳', continent: 'Asia', pop: 1410, ideology: 'AUTOCRACY', block: 'SCO', gdp: 19000, power: 88, nuclear: true, notes: 'Near-peer rival, production giant' },
  IN: { name: 'India', flag: '🇮🇳', continent: 'Asia', pop: 1420, ideology: 'DEMOCRACY', block: 'QUAD', gdp: 3900, power: 72, nuclear: true, notes: 'Rapid growth, non-aligned anchor' },
  PK: { name: 'Pakistan', flag: '🇵🇰', continent: 'Asia', pop: 240, ideology: 'MILITARY_JUNTA', block: 'NEUTRAL', gdp: 350, power: 55, nuclear: true, notes: 'Nuclear-armed regional pivot' },
  IL: { name: 'Israel', flag: '🇮🇱', continent: 'Middle East', pop: 9.8, ideology: 'DEMOCRACY', block: 'NEUTRAL', gdp: 520, power: 78, nuclear: true, notes: 'Technological edge, Iron Dome' },
  PS: { name: 'Palestine', flag: '🇵🇸', continent: 'Middle East', pop: 5.5, ideology: 'THEOCRACY', block: 'NEUTRAL', gdp: 20, power: 12, nuclear: false, notes: 'Severely unstable conflict zone' },
  IR: { name: 'Iran', flag: '🇮🇷', continent: 'Middle East', pop: 89, ideology: 'THEOCRACY', block: 'SCO', gdp: 400, power: 60, nuclear: false, notes: 'Asymmetric threat, missile proxy network' },
  RU: { name: 'Russia', flag: '🇷🇺', continent: 'Europe/Asia', pop: 144, ideology: 'AUTOCRACY', block: 'SCO', gdp: 2100, power: 90, nuclear: true, notes: 'Massive nuclear stockpile, energy power' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe', pop: 67, ideology: 'DEMOCRACY', block: 'NATO', gdp: 3100, power: 70, nuclear: true, notes: 'Global influence, advanced carrier force' },
  FR: { name: 'France', flag: '🇫🇷', continent: 'Europe', pop: 68, ideology: 'DEMOCRACY', block: 'NATO', gdp: 3000, power: 68, nuclear: true, notes: 'Independent deterrent, global footprint' },
  DE: { name: 'Germany', flag: '🇩🇪', continent: 'Europe', pop: 84, ideology: 'DEMOCRACY', block: 'NATO', gdp: 4500, power: 62, nuclear: false, notes: 'Economic engine of Europe' },
  JP: { name: 'Japan', flag: '🇯🇵', continent: 'Asia', pop: 125, ideology: 'DEMOCRACY', block: 'QUAD', gdp: 4200, power: 58, nuclear: false, notes: 'Technological defense specialist' },
  KR: { name: 'South Korea', flag: '🇰🇷', continent: 'Asia', pop: 51, ideology: 'DEMOCRACY', block: 'QUAD', gdp: 1800, power: 60, nuclear: false, notes: 'Advanced chips, immediate northern threat' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', continent: 'Middle East', pop: 36, ideology: 'THEOCRACY', block: 'GCC', gdp: 1100, power: 65, nuclear: false, notes: 'Energy export critical anchor' },
  BR: { name: 'Brazil', flag: '🇧🇷', continent: 'South America', pop: 215, ideology: 'DEMOCRACY', block: 'NEUTRAL', gdp: 2100, power: 48, nuclear: false, notes: 'Regional resource core' },
  ZA: { name: 'South Africa', flag: '🇿🇦', continent: 'Africa', pop: 60, ideology: 'DEMOCRACY', block: 'BRICS', gdp: 400, power: 35, nuclear: false, notes: 'Sub-Saharan mineral anchor' },
  AU: { name: 'Australia', flag: '🇦🇺', continent: 'Oceania', pop: 26, ideology: 'DEMOCRACY', block: 'QUAD', gdp: 1700, power: 55, nuclear: false, notes: 'Deep ocean maritime patrol' },
  TR: { name: 'Turkey', flag: '🇹🇷', continent: 'Europe/Asia', pop: 85, ideology: 'AUTOCRACY', block: 'NATO', gdp: 1100, power: 62, nuclear: false, notes: 'Strategic straits, regional mediator' },
  EG: { name: 'Egypt', flag: '🇪🇬', continent: 'Africa', pop: 110, ideology: 'MILITARY_JUNTA', block: 'NEUTRAL', gdp: 470, power: 50, nuclear: false, notes: 'Suez control, large infantry power' },
  TW: { name: 'Taiwan', flag: '🇹🇼', continent: 'Asia', pop: 24, ideology: 'DEMOCRACY', block: 'NEUTRAL', gdp: 790, power: 64, nuclear: false, notes: 'Semiconductor capital under constant watch' },
};

export const INITIAL_COUNTRIES: Record<string, Country> = {};

// Build countries using the template pattern to ensure robust, non-empty, clean records
Object.keys(SEED_TEMPLATES).forEach((id) => {
  const t = SEED_TEMPLATES[id];

  // Opinions matrix
  const opinions: Record<string, number> = {};
  Object.keys(SEED_TEMPLATES).forEach((otherId) => {
    if (id === otherId) {
      opinions[otherId] = 100;
    } else {
      opinions[otherId] = 0; // Neutral baseline
    }
  });

  // Tailored opinions
  if (id === 'US') {
    opinions['CN'] = -40; opinions['RU'] = -70; opinions['IL'] = 80; opinions['GB'] = 90; opinions['FR'] = 85; opinions['DE'] = 80; opinions['JP'] = 85; opinions['KR'] = 80; opinions['AU'] = 85; opinions['TW'] = 75; opinions['IR'] = -60;
  } else if (id === 'CN') {
    opinions['US'] = -45; opinions['RU'] = 75; opinions['TW'] = -90; opinions['JP'] = -55; opinions['IN'] = -30; opinions['PK'] = 80; opinions['KP'] = 70;
  } else if (id === 'RU') {
    opinions['US'] = -75; opinions['GB'] = -70; opinions['FR'] = -65; opinions['DE'] = -50; opinions['CN'] = 70; opinions['IN'] = 45; opinions['IR'] = 50;
  } else if (id === 'IN') {
    opinions['PK'] = -85; opinions['CN'] = -30; opinions['US'] = 50; opinions['RU'] = 55;
  } else if (id === 'PK') {
    opinions['IN'] = -85; opinions['CN'] = 80; opinions['US'] = 20;
  } else if (id === 'IL') {
    opinions['IR'] = -95; opinions['PS'] = -90; opinions['US'] = 85; opinions['SA'] = 20; opinions['EG'] = 40;
  } else if (id === 'IR') {
    opinions['IL'] = -95; opinions['US'] = -80; opinions['SA'] = -40; opinions['RU'] = 50;
  } else if (id === 'TW') {
    opinions['CN'] = -90; opinions['US'] = 80; opinions['JP'] = 70;
  }

  // Factions setup
  const factions = [
    { type: 'MILITARY_HARDLINERS' as FactionType, strengthIndex: id === 'PK' || id === 'EG' ? 75 : 40, isGoverning: id === 'PK' || id === 'EG', demandsMetScore: 65, isRebelling: false, armamentLevel: 80 },
    { type: 'REFORMERS' as FactionType, strengthIndex: id === 'US' || id === 'GB' ? 60 : 35, isGoverning: id === 'US' || id === 'GB', demandsMetScore: 70, isRebelling: false, armamentLevel: 10 },
    { type: 'OLIGARCHS' as FactionType, strengthIndex: id === 'RU' || id === 'UA' ? 78 : 25, isGoverning: id === 'RU', demandsMetScore: 55, isRebelling: false, armamentLevel: 30 },
  ];

  if (t.ideology === 'THEOCRACY') {
    factions.push({ type: 'ISLAMISTS' as FactionType, strengthIndex: 80, isGoverning: true, demandsMetScore: 80, isRebelling: false, armamentLevel: 90 });
  }

  // Oligarchs lists
  const oligarchs = [
    { id: `${id}_oligarch_1`, name: `${id} Industry Magnate`, wealthB: Math.round(t.gdp * 0.002 * 10) / 10 + 1, influenceScore: 72, sector: 'DEFENSE', loyalty: 75, offshoreAccountsB: Math.round(t.gdp * 0.0005) },
    { id: `${id}_oligarch_2`, name: `${id} Energy Consortium`, wealthB: Math.round(t.gdp * 0.003 * 10) / 10 + 2, influenceScore: 80, sector: 'ENERGY', loyalty: id === 'RU' ? 90 : 60, offshoreAccountsB: Math.round(t.gdp * 0.0008) },
  ];

  // Media channels
  const mediaChannels = [
    { id: `${id}_media_1`, name: `${t.name} Core Broadcasting`, reach: 75, stateControlled: t.ideology !== 'DEMOCRACY', narrativeBias: t.ideology === 'DEMOCRACY' ? 10 : 70 },
    { id: `${id}_media_2`, name: `Global ${id} Watch`, reach: 45, stateControlled: false, narrativeBias: -15 },
  ];

  // Base weapons units count tailoring
  const weaponUnits = BASE_WEAPONS.map((bw) => {
    let multiplier = t.power / 60;
    let count = Math.round(bw.baseCount * multiplier);

    // Give nuclear powers operational warheads
    if (t.nuclear && bw.type === 'ICBM') {
      count = id === 'US' || id === 'RU' ? 450 : 30;
    }
    if (t.nuclear && bw.type === 'SLBM') {
      count = id === 'US' || id === 'RU' ? 280 : 12;
    }
    if (bw.type === 'HYPERSONIC' && (id === 'CN' || id === 'RU' || id === 'US')) {
      count = 20;
    }
    if (bw.type === 'CARRIER_GROUP' && id !== 'US') {
      count = id === 'CN' || id === 'GB' || id === 'FR' ? 2 : 0;
    }

    return {
      type: bw.type,
      count: count,
      operational: count,
      maintenanceCostPerTick: Math.round(bw.cost * count * 0.02 * 100) / 100,
      combatPowerRating: bw.power,
      fuelLevel: 95,
      pilotMorale: 85,
      supplyChainStatus: 'NOMINAL' as const,
      blackMarketSource: false,
    };
  });

  const totalPowerRating = weaponUnits.reduce((acc, u) => acc + (u.operational * u.combatPowerRating), 0);
  const totalMaintenanceCost = weaponUnits.reduce((acc, u) => acc + u.maintenanceCostPerTick, 0);

  // Satellite and cyber initialization
  const satellites: SatelliteAsset[] = [
    { id: `${id}_sat_1`, orbitType: 'LEO' as const, coverageCountryIds: [id], reconQuality: 80, isCompromised: false, launchCostB: 1.5 },
  ];
  if (t.power > 70) {
    satellites.push({ id: `${id}_sat_2`, orbitType: 'GEO' as const, coverageCountryIds: ['US', 'CN', 'RU', 'IL', 'IR'], reconQuality: 92, isCompromised: false, launchCostB: 3.0 });
  }

  const cyberAssets = [
    { id: `${id}_cyber_def`, type: 'DEFENSIVE' as const, powerLevel: Math.round(t.power * 0.9), isDeployed: true, firewallRating: Math.round(t.power * 0.9) },
    { id: `${id}_cyber_off`, type: 'OFFENSIVE' as const, targetCountryId: undefined, powerLevel: Math.round(t.power * 0.8), isDeployed: false, firewallRating: 0 },
  ];

  // Provincial level data
  const provinces: Province[] = [
    {
      id: `${id}_prov_cap`,
      name: `${t.name} Capital District`,
      population: Math.round(t.pop * 0.3 * 10) / 10 + 1,
      controllerCountryId: id,
      originalCountryId: id,
      integrity: 100,
      features: ['CITY', 'ENERGY_FACILITY'],
      resistanceLevel: 0
    },
    {
      id: `${id}_prov_ind`,
      name: `${t.name} Industrial Zone`,
      population: Math.round(t.pop * 0.4 * 10) / 10 + 2,
      controllerCountryId: id,
      originalCountryId: id,
      integrity: 100,
      features: ['INDUSTRIAL_ZONE', 'AIRBASE'],
      resistanceLevel: 0
    },
    {
      id: `${id}_prov_port`,
      name: `${t.name} Coastal Reach`,
      population: Math.round(t.pop * 0.3 * 10) / 10 + 1,
      controllerCountryId: id,
      originalCountryId: id,
      integrity: 100,
      features: ['PORT'],
      resistanceLevel: 0
    }
  ];

  // Specific cabinet configurations
  const cabinName = (role: string) => {
    switch(id) {
      case 'US':
        if(role === 'DEF') return 'Gen. Lloyd Austin';
        if(role === 'FIN') return 'Dr. Janet Yellen';
        if(role === 'FOR') return 'Sec. Antony Blinken';
        if(role === 'INT') return 'Director William Burns';
        return 'Gov. Jerome Powell';
      case 'CN':
        if(role === 'DEF') return 'Gen. Dong Jun';
        if(role === 'FIN') return 'Minister Lan Foan';
        if(role === 'FOR') return 'Minister Wang Yi';
        if(role === 'INT') return 'Director Chen Yixin';
        return 'Gov. Pan Gongsheng';
      case 'RU':
        if(role === 'DEF') return 'Gen. Andrey Belousov';
        if(role === 'FIN') return 'Minister Anton Siluanov';
        if(role === 'FOR') return 'Minister Sergey Lavrov';
        if(role === 'INT') return 'Director Sergey Naryshkin';
        return 'Gov. Elvira Nabiullina';
      case 'IN':
        if(role === 'DEF') return 'Gen. Rajnath Singh';
        if(role === 'FIN') return 'Minister Nirmala Sitharaman';
        if(role === 'FOR') return 'Minister S. Jaishankar';
        if(role === 'INT') return 'Advisor Ajit Doval';
        return 'Gov. Shaktikanta Das';
      case 'GB':
        if(role === 'DEF') return 'John Healey';
        if(role === 'FIN') return 'Rachel Reeves';
        if(role === 'FOR') return 'David Lammy';
        if(role === 'INT') return 'Richard Moore';
        return 'Gov. Andrew Bailey';
      default:
        return `${t.flag} Portfolio ${role}`;
    }
  };

  const cabinet: Cabinet = {
    defenseMinister: {
      name: cabinName('DEF'),
      competence: Math.round(75 + Math.random() * 20),
      loyalty: Math.round(80 + Math.random() * 15),
      corruption: id === 'RU' || id === 'PK' ? 35 : 12,
      ideology: t.ideology
    },
    financeMinister: {
      name: cabinName('FIN'),
      competence: Math.round(70 + Math.random() * 25),
      loyalty: Math.round(75 + Math.random() * 20),
      corruption: id === 'RU' || id === 'PK' ? 40 : 10,
      ideology: t.ideology
    },
    foreignMinister: {
      name: cabinName('FOR'),
      competence: Math.round(80 + Math.random() * 15),
      loyalty: Math.round(80 + Math.random() * 15),
      corruption: id === 'RU' || id === 'PK' ? 25 : 8,
      ideology: t.ideology
    },
    intelligenceChief: {
      name: cabinName('INT'),
      competence: Math.round(85 + Math.random() * 12),
      loyalty: Math.round(85 + Math.random() * 12),
      corruption: id === 'RU' || id === 'PK' ? 30 : 15,
      ideology: t.ideology
    },
    centralBankGovernor: {
      name: cabinName('CB'),
      competence: Math.round(88 + Math.random() * 10),
      loyalty: Math.round(70 + Math.random() * 25),
      corruption: 5,
      ideology: 'TECHNOCRACY'
    }
  };

  const ageDemographics = id === 'DE' || id === 'JP'
    ? { youthPct: 12, adultPct: 58, elderlyPct: 30 }
    : id === 'IN' || id === 'PK' || id === 'PS'
    ? { youthPct: 38, adultPct: 54, elderlyPct: 8 }
    : { youthPct: 20, adultPct: 62, elderlyPct: 18 };

  const birthRate = id === 'PS' || id === 'PK' ? 28 : id === 'IN' ? 17 : id === 'JP' ? 7 : 11;
  const deathRate = id === 'JP' || id === 'RU' ? 12 : id === 'IN' || id === 'PK' ? 7 : 8;
  const poverty = id === 'PS' ? 62 : id === 'PK' ? 40 : id === 'IN' ? 21 : id === 'CN' ? 8 : 4;

  const populationSim: PopulationProfile = {
    ageDemographics,
    birthRate,
    deathRate,
    educationLevel: id === 'US' || id === 'GB' || id === 'DE' || id === 'JP' ? 88 : id === 'CN' || id === 'KR' || id === 'TW' ? 92 : id === 'IN' ? 74 : 58,
    urbanization: id === 'US' || id === 'DE' ? 83 : id === 'CN' ? 65 : id === 'IN' ? 36 : 80,
    poverty,
    migration: id === 'US' || id === 'GB' || id === 'DE' ? 5 : id === 'PK' || id === 'PS' || id === 'RU' ? -3 : 0,
    religiousComposition: id === 'IR' || id === 'SA' || id === 'PS'
      ? { secular: 5, religiousA: 85, religiousB: 10 }
      : id === 'US' || id === 'BR'
      ? { secular: 25, religiousA: 65, religiousB: 10 }
      : { secular: 60, religiousA: 30, religiousB: 10 },
    ethnicComposition: id === 'US'
      ? { majority: 60, minorityA: 18, minorityB: 22 }
      : { majority: 90, minorityA: 7, minorityB: 3 },
    workforceParticipation: id === 'CN' || id === 'DE' ? 68 : id === 'US' ? 62 : id === 'IN' ? 48 : 55
  };

  const sectors: EconomicSectors = {
    agriculture: Math.round(t.gdp * (id === 'IN' || id === 'PK' ? 0.18 : 0.02)),
    manufacturing: Math.round(t.gdp * (id === 'CN' ? 0.38 : id === 'DE' || id === 'KR' ? 0.26 : 0.12)),
    services: Math.round(t.gdp * (id === 'US' || id === 'GB' ? 0.76 : 0.50)),
    energy: Math.round(t.gdp * (id === 'RU' || id === 'SA' ? 0.35 : 0.05)),
    mining: Math.round(t.gdp * (id === 'ZA' || id === 'AU' ? 0.15 : 0.03)),
    technology: Math.round(t.gdp * (id === 'US' || id === 'JP' || id === 'TW' || id === 'KR' ? 0.18 : 0.05)),
    tourism: Math.round(t.gdp * (id === 'FR' ? 0.10 : 0.03)),
    defense: Math.round(t.gdp * (id === 'RU' || id === 'US' || id === 'IL' ? 0.08 : 0.02))
  };

  const supplyChains: SupplyChains = {
    energyDependency: id === 'SA' || id === 'RU' ? 0 : id === 'DE' || id === 'JP' ? 82 : id === 'US' ? 12 : 45,
    foodDependency: id === 'PS' || id === 'SA' ? 75 : id === 'US' || id === 'BR' || id === 'FR' ? 5 : 25,
    semiconductorDependency: id === 'TW' || id === 'KR' || id === 'JP' ? 5 : id === 'RU' || id === 'IR' ? 95 : id === 'US' || id === 'CN' ? 55 : 85,
    defenseDependency: id === 'US' || id === 'RU' || id === 'CN' || id === 'FR' ? 2 : id === 'PS' || id === 'SA' || id === 'PK' ? 85 : 45
  };

  const ratingId = id === 'US' || id === 'DE' || id === 'JP' ? 'AAA' : id === 'CN' || id === 'GB' || id === 'FR' || id === 'KR' || id === 'TW' ? 'AA' : id === 'IN' || id === 'BR' || id === 'ZA' || id === 'IL' || id === 'SA' || id === 'TR' ? 'BBB' : id === 'RU' || id === 'IR' || id === 'EG' || id === 'PK' ? 'B' : 'CCC';

  const financialMarkets: FinancialMarkets = {
    stockMarketIndex: id === 'US' ? 39500 : id === 'CN' ? 9500 : id === 'GB' ? 8200 : id === 'IN' ? 73000 : 1500,
    bondYield: id === 'US' ? 4.35 : id === 'DE' ? 2.45 : id === 'TR' ? 45.0 : id === 'PK' ? 22.0 : 5.0,
    currencyMarketValue: 100,
    sovereignRating: ratingId
  };

  const personnel: MilitaryPersonnel = {
    activeTroops: id === 'CN' ? 2000 : id === 'US' ? 1350 : id === 'IN' ? 1400 : id === 'RU' ? 1150 : id === 'PK' ? 650 : 120,
    reserveTroops: id === 'KR' ? 3100 : id === 'RU' ? 2000 : id === 'CN' ? 510 : id === 'US' ? 800 : id === 'IN' ? 1150 : 250,
    specialForces: id === 'US' ? 70 : id === 'RU' ? 45 : id === 'CN' ? 35 : id === 'GB' || id === 'FR' || id === 'IL' ? 15 : 5
  };

  const logistics: MilitaryLogistics = {
    ammunition: 92,
    fuel: 88,
    spareParts: 85,
    supplyDepots: id === 'US' ? 45 : id === 'CN' || id === 'RU' ? 30 : 10
  };

  const readiness: MilitaryReadiness = {
    training: id === 'US' || id === 'GB' || id === 'IL' ? 90 : id === 'CN' || id === 'RU' || id === 'KR' ? 80 : 65,
    morale: id === 'IL' || id === 'TW' ? 88 : id === 'US' ? 80 : id === 'RU' || id === 'PK' ? 62 : 72,
    combatExperience: id === 'US' || id === 'RU' || id === 'IL' ? 85 : id === 'GB' || id === 'FR' ? 60 : 25
  };

  const combatRealism: MilitaryCombat = {
    attrition: 0,
    supplyLineStatus: 100,
    occupationCosts: 0,
    insurgencies: id === 'PS' || id === 'PK' ? 15 : 0
  };

  const infoWarfare: InformationCampaign = {
    socialMediaInfluence: id === 'US' || id === 'CN' ? 85 : 45,
    deepfakesActive: false,
    narrativeFocus: 'PRO_GOVERNMENT',
    mediaOwnershipCensorship: t.ideology === 'DEMOCRACY' ? 15 : 75
  };

  const spyAssets: SpyAsset[] = [
    {
      id: `${id}_spy_1`,
      alias: `Op Agent ${id}-A`,
      targetCountryId: id === 'US' ? 'CN' : id === 'CN' ? 'US' : 'US',
      competence: 72 + Math.round(Math.random() * 20),
      status: 'ACTIVE',
      ticksActive: 0
    },
    {
      id: `${id}_spy_2`,
      alias: `Op Agent ${id}-B`,
      targetCountryId: id === 'IL' ? 'IR' : id === 'IR' ? 'IL' : 'RU',
      competence: 65 + Math.round(Math.random() * 25),
      status: 'ACTIVE',
      ticksActive: 0
    }
  ];

  // Assemble full country details
  INITIAL_COUNTRIES[id] = {
    id: id,
    name: t.name,
    flagEmoji: t.flag,
    continent: t.continent,
    population: t.pop,
    allianceBlock: t.block,
    atWarWith: [],
    tradePartners: Object.keys(SEED_TEMPLATES).filter((x) => x !== id && opinions[x] > -20).slice(0, 5),
    opinions: opinions,
    threatLevel: t.power > 80 ? 'YELLOW' : 'GREEN',
    nuclearDoctrineFirstStrike: id === 'US' || id === 'RU' || id === 'CN',
    researchUnlocked: id === 'US' || id === 'RU' ? ['HAARP_V1', 'IRON_DOME_V1', 'CYBER_FIREWALL_V1'] : ['IRON_DOME_V1'],
    haarpActive: false,
    provinces,
    populationSim,
    cabinet,
    economic: {
      gdpB: t.gdp,
      gdpGrowthRate: id === 'CN' || id === 'IN' ? 6.2 : 2.1,
      inflationRate: id === 'PK' || id === 'TR' ? 35.0 : 3.2,
      unemploymentRate: 5.5,
      treasuryCashB: Math.round(t.gdp * 0.05 * 10) / 10 + 5.0,
      debtToGdpRatio: id === 'JP' ? 240 : id === 'US' ? 120 : 65,
      debtStressIndex: id === 'PK' ? 75 : 20,
      interestRate: id === 'TR' ? 40 : id === 'US' ? 5.25 : 3.5,
      currencyStrength: 100,
      taxRate: 25,
      corporateTaxRate: 21,
      printingPressActive: false,
      printingPressIntensity: 1,
      bonds: [],
      oligarchs: oligarchs,
      offshoreSlushFundB: id === 'RU' ? 120 : 10,
      sanctionedBy: [],
      tradeSurplusDeficitB: id === 'CN' || id === 'DE' ? 250 : -600,
      spendingAllocation: {
        military: 0.25,
        healthcare: 0.20,
        education: 0.15,
        infrastructure: 0.20,
        intelligence: 0.10,
        debtService: 0.05,
        propaganda: 0.05,
      },
      sectors,
      supplyChains,
      financialMarkets
    },
    political: {
      ideology: t.ideology,
      leaderName: `${t.name} Premier`,
      leaderApprovalRating: 62,
      popularUnrest: 15,
      stabilityIndex: 75,
      coupRiskLevel: 5,
      martialLawActive: false,
      martialLawTicksRemaining: 0,
      factions: factions,
      mediaChannels: mediaChannels,
      propagandaEffectiveness: t.ideology === 'DEMOCRACY' ? 45 : 75,
      censorship: t.ideology === 'DEMOCRACY' ? 20 : 80,
      diasporaInfluence: 30,
      infoWarfare
    },
    arsenal: {
      units: weaponUnits,
      totalPowerRating: totalPowerRating,
      totalMaintenanceCost: totalMaintenanceCost,
      nuclearCapable: t.nuclear,
      abmShieldStrength: id === 'IL' ? 70 : id === 'US' ? 45 : 15,
      abmIntercepts: 0,
      readinessLevel: 80,
      personnel,
      logistics,
      readiness,
      combatRealism
    },
    intelligence: {
      satellites: satellites,
      cyberAssets: cyberAssets,
      activeCovertOps: [],
      humintNetworks: {},
      signalIntelScore: t.power,
      cyberFirewallLevel: id === 'US' || id === 'CN' ? 2 : 1,
      knownThreats: [],
      blackBudgetB: id === 'US' || id === 'CN' ? 25 : 2,
      spyAssets,
      intelReportConfidence: 95
    },
    lastEventLog: [`System online for ${t.name}. Ready for sovereign directives.`],
    tariffs: {}
  };
});
