import { WorldState, Country, Province, PopulationProfile, Cabinet, EconomicSectors, SupplyChains, FinancialMarkets, MilitaryPersonnel, MilitaryLogistics, MilitaryReadiness, MilitaryCombat, SpyAsset, InformationCampaign, WeaponUnit } from '../types';
import { GEO_COORDS } from '../data/geoCoords';

/**
 * SOVEREIGN COMMAND SIMULATOR — PHASE 2 EVOLUTION ENGINES
 * Isolates and processes deep geopolitical mechanics atomically per tick.
 */

export function processComplexPhase2Geopolitics(draft: WorldState, playerCountryId: string) {
  // 1. Process Populations, Cabinets, Sectors, and Logistics for all countries
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    if (!c) return;

    // Safety checks for new data structures on old items
    ensurePhase2Structures(id, c);

    // Run core calculations
    processCabinetCabinetEffects(c);
    processPopulationDynamics(draft, c);
    processSectorsAndSupplyChains(draft, c);
    processMilitaryLogisticsAndPersonnel(draft, c);
    processInfoWarfareAndNarratives(draft, c);
    processSpyAssetsAndHumint(draft, c);
  });

  // 2. Resolve Province Captures and combat operations for active wars
  processStrategicProvinceCombat(draft);

  // 3. Process Decadal AI Agendas for major countries
  processDecadalAIAgendas(draft, playerCountryId);

  // 4. Trigger Dynamic Geopolitical Events Engine
  processDynamicEventsEngine(draft);
}

/**
 * Ensures all Phase 2 structural additions are allocated properly on the country draft.
 */
function ensurePhase2Structures(id: string, c: Country) {
  if (!c.provinces || c.provinces.length === 0) {
    c.provinces = [
      { id: `${id}_prov_cap`, name: `${c.name} Capital`, population: Math.round(c.population * 0.3 * 10) / 10 + 1, controllerCountryId: id, originalCountryId: id, integrity: 100, features: ['CITY'], resistanceLevel: 0 },
      { id: `${id}_prov_ind`, name: `${c.name} Industrial Area`, population: Math.round(c.population * 0.4 * 10) / 10 + 1, controllerCountryId: id, originalCountryId: id, integrity: 100, features: ['INDUSTRIAL_ZONE', 'AIRBASE'], resistanceLevel: 0 },
      { id: `${id}_prov_coastal`, name: `${c.name} Coastal Basin`, population: Math.round(c.population * 0.3 * 10) / 10 + 1, controllerCountryId: id, originalCountryId: id, integrity: 100, features: ['PORT', 'ENERGY_FACILITY'], resistanceLevel: 0 }
    ];
  }

  if (!c.populationSim) {
    c.populationSim = {
      ageDemographics: { youthPct: 22, adultPct: 60, elderlyPct: 18 },
      birthRate: 11,
      deathRate: 8,
      educationLevel: 80,
      urbanization: 75,
      poverty: 12,
      migration: 1,
      religiousComposition: { secular: 50, religiousA: 40, religiousB: 10 },
      ethnicComposition: { majority: 85, minorityA: 10, minorityB: 5 },
      workforceParticipation: 60
    };
  }

  if (!c.cabinet) {
    c.cabinet = {
      defenseMinister: { name: 'Portfolio Minister', competence: 75, loyalty: 80, corruption: 10, ideology: c.political.ideology },
      financeMinister: { name: 'Portfolio Minister', competence: 75, loyalty: 80, corruption: 10, ideology: c.political.ideology },
      foreignMinister: { name: 'Portfolio Minister', competence: 75, loyalty: 80, corruption: 10, ideology: c.political.ideology },
      intelligenceChief: { name: 'Portfolio Director', competence: 75, loyalty: 80, corruption: 10, ideology: c.political.ideology },
      centralBankGovernor: { name: 'Governor Bank', competence: 80, loyalty: 80, corruption: 5, ideology: 'TECHNOCRACY' }
    };
  }

  if (!c.economic.sectors) {
    c.economic.sectors = {
      agriculture: Math.round(c.economic.gdpB * 0.05),
      manufacturing: Math.round(c.economic.gdpB * 0.20),
      services: Math.round(c.economic.gdpB * 0.60),
      energy: Math.round(c.economic.gdpB * 0.05),
      mining: Math.round(c.economic.gdpB * 0.02),
      technology: Math.round(c.economic.gdpB * 0.05),
      tourism: Math.round(c.economic.gdpB * 0.02),
      defense: Math.round(c.economic.gdpB * 0.01)
    };
  }

  if (!c.economic.supplyChains) {
    c.economic.supplyChains = {
      energyDependency: id === 'RU' || id === 'SA' ? 5 : 40,
      foodDependency: 20,
      semiconductorDependency: id === 'TW' || id === 'KR' || id === 'US' ? 10 : 70,
      defenseDependency: id === 'US' || id === 'RU' || id === 'CN' ? 0 : 50
    };
  }

  if (!c.economic.financialMarkets) {
    c.economic.financialMarkets = {
      stockMarketIndex: 10000,
      bondYield: 4.5,
      currencyMarketValue: 100,
      sovereignRating: 'A'
    };
  }

  if (!c.political.infoWarfare) {
    c.political.infoWarfare = {
      socialMediaInfluence: 50,
      deepfakesActive: false,
      narrativeFocus: 'PRO_GOVERNMENT',
      mediaOwnershipCensorship: 15
    };
  }

  if (!c.intelligence.spyAssets) {
    c.intelligence.spyAssets = [
      { id: `${id}_spy_1`, alias: `Agent 01`, targetCountryId: 'US', competence: 75, status: 'ACTIVE', ticksActive: 0 }
    ];
    c.intelligence.intelReportConfidence = 85;
  }
}

/**
 * 1. Cabinets influence yields, military attrition, tax collections and covert successes.
 */
function processCabinetCabinetEffects(c: Country) {
  const econ = c.economic;
  const cab = c.cabinet!;
  const pol = c.political;

  // Finance Minister Competence reduces debt stress multiplier and slightly boosts tax income
  if (cab.financeMinister.competence > 80) {
    econ.debtStressIndex = Math.max(0, econ.debtStressIndex - 1);
    econ.treasuryCashB += econ.gdpB * 0.0001; // tiny bonus of efficiency
  }

  // Corrupt cabinet members siphon off funds to slush fund or decrease rating
  const totalCorruption = (cab.defenseMinister.corruption + cab.financeMinister.corruption + cab.intelligenceChief.corruption) / 3;
  if (totalCorruption > 25) {
    econ.treasuryCashB = Math.max(0, econ.treasuryCashB - (econ.gdpB * 0.0003));
    econ.offshoreSlushFundB += econ.gdpB * 0.0002;
    if (Math.random() < 0.08) {
      c.lastEventLog.unshift(`Slush investigation siphons treasury holdings into offshore funds.`);
    }
  }

  // Disloyal or incompetent Central Bank Governor prints money poorly or destabilizes currency
  if (cab.centralBankGovernor.loyalty < 40 && econ.printingPressActive) {
    econ.inflationRate += 0.8;
    econ.currencyStrength = Math.max(0, econ.currencyStrength - 2);
  }

  // Defense Minister competence buffers troop morale
  if (cab.defenseMinister.competence > 85 && c.arsenal.readinessLevel < 90) {
    c.arsenal.readinessLevel = Math.min(100, c.arsenal.readinessLevel + 1);
  }
}

/**
 * 2. Demographic drift, migrations, refugee waves resulting from wars.
 */
function processPopulationDynamics(draft: WorldState, c: Country) {
  const popSim = c.populationSim!;
  const pol = c.political;
  const econ = c.economic;

  // birth / death rates calculations
  let baseN = popSim.birthRate - popSim.deathRate;

  // Refugee wave triggers if at war or high popular unrest
  if (c.atWarWith.length > 0) {
    popSim.migration = -5; // negative net migration
    popSim.deathRate = Math.min(40, popSim.deathRate + 1); // casualties
    popSim.birthRate = Math.max(4, popSim.birthRate - 0.5);

    // War creates displacement of refugees to allies or safe partners
    const safePartnerId = c.tradePartners[0] || 'US';
    const targetRep = draft.countries[safePartnerId];
    if (targetRep && targetRep.populationSim) {
      const refugeeMil = c.population * 0.002; // 0.2% of people flee per tick
      c.population = Math.max(1.0, c.population - refugeeMil);
      targetRep.population += refugeeMil;
      targetRep.populationSim.migration += 0.4;
      
      if (Math.random() < 0.15) {
        targetRep.lastEventLog.unshift(`Refugee influx: War displacement wave of ${refugeeMil.toFixed(2)}M received from ${c.name}.`);
        c.lastEventLog.unshift(`War refugee wave exits across borders to friendly trade node ${safePartnerId}.`);
      }
    }
  } else {
    // Standard migration drift
    popSim.migration = econ.gdpGrowthRate > 3.5 ? 2 : econ.gdpGrowthRate < -1.0 ? -2 : 0;
  }

  // Drift population
  const totalNetRate = (baseN + popSim.migration) / 1000.0;
  c.population = Math.round((c.population * (1 + totalNetRate / 52)) * 100) / 100;

  // High poverty creates emigration and triggers unrest
  if (popSim.poverty > 35) {
    pol.popularUnrest = Math.min(100, pol.popularUnrest + 0.8);
    popSim.migration -= 0.5;
  }

  // High education level boosts technology expansion
  if (popSim.educationLevel > 80 && econ.sectors) {
    econ.sectors.technology *= 1.002; // compound passive tech expansion
  }
}

/**
 * 3. Economy sectorization growth, prices updates, semiconductor blockades.
 */
function processSectorsAndSupplyChains(draft: WorldState, c: Country) {
  const econ = c.economic;
  const sectors = econ.sectors!;
  const supply = econ.supplyChains!;
  const markets = econ.financialMarkets!;
  const pol = c.political;

  // Link sector sizes to form GDP
  let totalSectorGdp = 0;
  Object.keys(sectors).forEach((key) => {
    totalSectorGdp += sectors[key as keyof EconomicSectors];
  });
  
  // Re-adjust total sectors to GDP size or vice-versa
  econ.gdpB = totalSectorGdp;

  // Let commodity prices affect dependencies
  const oilMarket = draft.commodityMarkets.find((m) => m.type === 'OIL');
  const gasMarket = draft.commodityMarkets.find((m) => m.type === 'NATURAL_GAS');
  const rareEarth = draft.commodityMarkets.find((m) => m.type === 'RARE_EARTH');

  const oilPrice = oilMarket ? oilMarket.spotPriceUSD : 80;
  const gasPrice = gasMarket ? gasMarket.spotPriceUSD : 6;

  // Energy dependency drag
  if (supply.energyDependency > 40 && oilPrice > 120) {
    econ.inflationRate += 0.6;
    pol.popularUnrest = Math.min(100, pol.popularUnrest + 1.2);
    sectors.manufacturing *= 0.995; // manufacturing drops from high input costs
    sectors.services *= 0.997;
  }

  // Semiconductor global bottleneck checker
  const tw = draft.countries['TW'];
  const twAtWar = tw ? tw.atWarWith.length > 0 : false;
  if (twAtWar && supply.semiconductorDependency > 40) {
    sectors.technology *= 0.985; // semiconductor blockaged
    if (Math.random() < 0.12) {
      c.lastEventLog.unshift(`Supply Chain Shocks: Semiconductor supply lines collapsed due to Taiwan area emergency.`);
    }
  }

  // Research nodes benefit sectors directly
  if (c.researchUnlocked.includes('HYPERSONIC_TECH') && sectors.defense) {
    sectors.defense *= 1.02;
  }

  // Financial Markets drifts
  markets.stockMarketIndex = Math.max(500, markets.stockMarketIndex * (1 + (econ.gdpGrowthRate / 100 / 52) - (pol.popularUnrest * 0.0003)));
  
  // Bond yield & rating systems
  let stressToYieldRatio = Math.max(1, econ.debtToGdpRatio / 20);
  if (econ.debtToGdpRatio > 140) {
    markets.sovereignRating = 'BB';
    markets.bondYield = 8.5 + stressToYieldRatio;
  } else if (econ.debtToGdpRatio > 90) {
    markets.sovereignRating = 'BBB';
    markets.bondYield = 4.5 + stressToYieldRatio / 2;
  } else {
    markets.sovereignRating = 'AAA';
    markets.bondYield = 1.2 + stressToYieldRatio / 4;
  }

  // If currency falls down, import inflation spikes
  markets.currencyMarketValue = Math.max(20, 100 - (econ.inflationRate * 0.8) + (econ.gdpGrowthRate * 1.5));
}

/**
 * 4. Military parameters: personnel mobilization and equipment logistics.
 */
function processMilitaryLogisticsAndPersonnel(draft: WorldState, c: Country) {
  const ars = c.arsenal;
  const forces = ars.personnel!;
  const logs = ars.logistics!;
  const read = ars.readiness!;
  const realism = ars.combatRealism!;

  if (c.atWarWith.length > 0) {
    // Deplete logistics
    logs.ammunition = Math.max(20, logs.ammunition - 1.2);
    logs.fuel = Math.max(25, logs.fuel - 1.5);
    logs.spareParts = Math.max(30, logs.spareParts - 1.0);

    // Morale and attrition
    read.morale = Math.max(30, read.morale - 0.4);
    realism.attrition = Math.min(100, realism.attrition + 0.3);

    // Mobilize reserves to active troops
    if (forces.reserveTroops > 20) {
      const mobilized = Math.min(forces.reserveTroops, 15);
      forces.reserveTroops -= mobilized;
      forces.activeTroops += mobilized;
    }
  } else {
    // Recover logistics, training, and experience decay
    logs.ammunition = Math.min(100, logs.ammunition + 0.8);
    logs.fuel = Math.min(100, logs.fuel + 1.0);
    logs.spareParts = Math.min(100, logs.spareParts + 0.8);
    read.morale = Math.min(100, read.morale + 0.2);
    realism.attrition = Math.max(0, realism.attrition - 0.5);
  }
}

/**
 * 5. Narrative spreads, social media operations, media censorship.
 */
function processInfoWarfareAndNarratives(draft: WorldState, c: Country) {
  const iw = c.political.infoWarfare!;
  const pol = c.political;

  // Narratives spreading
  if (pol.popularUnrest > 45) {
    // opposition narratives surge
    iw.socialMediaInfluence = Math.min(100, iw.socialMediaInfluence + 1.0);
    pol.leaderApprovalRating = Math.max(5, pol.leaderApprovalRating - 0.5);
  } else {
    // gov narrative stabilizes
    pol.leaderApprovalRating = Math.min(95, pol.leaderApprovalRating + 0.1);
  }

  // Deep fakes activated? Sparks sudden confidence crash
  if (iw.deepfakesActive) {
    pol.leaderApprovalRating = Math.max(10, pol.leaderApprovalRating - 3);
    pol.stabilityIndex = Math.max(5, pol.stabilityIndex - 2);
  }
}

/**
 * 6. Spy asset missions drift.
 */
function processSpyAssetsAndHumint(draft: WorldState, c: Country) {
  const intel = c.intelligence;
  const spyNetwork = intel.spyAssets || [];

  spyNetwork.forEach((spy) => {
    if (spy.status === 'ACTIVE') {
      spy.ticksActive++;

      // Chance of being compromised based on target country's firewall and satellites
      const target = draft.countries[spy.targetCountryId];
      if (target) {
        const firewall = target.intelligence.cyberFirewallLevel;
        const detectionRoll = Math.random() * 100;
        if (detectionRoll < (firewall * 8)) {
          spy.status = 'EXPOSED';
          c.lastEventLog.unshift(`Espionage incident: Asset ${spy.alias} exposed by ${target.name} counterintelligence forces.`);
          target.lastEventLog.unshift(`Counterintelligence: Detected and tracked clandestine spy assets linked to ${c.id}!`);
        }
      }
    }
  });
}

/**
 * Resolve battles, occupation resistances, captured areas.
 */
function processStrategicProvinceCombat(draft: WorldState) {
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    if (!c || c.atWarWith.length === 0) return;

    c.atWarWith.forEach((enemyId) => {
      const e = draft.countries[enemyId];
      if (!e) return;

      // Ensure province features
      if (!e.provinces || e.provinces.length === 0) return;

      // Comparative military power rating
      const cPower = (c.arsenal.totalPowerRating * (c.arsenal.readinessLevel / 100)) + (c.cabinet?.defenseMinister.competence || 50) * 2;
      const ePower = (e.arsenal.totalPowerRating * (e.arsenal.readinessLevel / 100)) + (e.cabinet?.defenseMinister.competence || 50) * 2;

      // Large superiority roll leads to capturing target's un-occupied province
      if (cPower > ePower * 1.35 && Math.random() < 0.15) {
        const targetProvince = e.provinces.find((prov) => prov.controllerCountryId === enemyId);
        if (targetProvince) {
          targetProvince.controllerCountryId = id; // Overtake control!
          targetProvince.integrity = Math.max(15, targetProvince.integrity - 40); // collateral physical damage
          targetProvince.resistanceLevel = 60; // high insurgent activity

          // Charge occupier occupationCosts
          if (c.arsenal.combatRealism) {
            c.arsenal.combatRealism.occupationCosts += 1.5;
          }

          draft.globalEventLog.unshift({
            tick: draft.currentTick,
            text: `TERRITORIAL GAIN: ${c.flagEmoji} ${c.name} has breached defense grid lines and occupied ${targetProvince.name} inside ${e.name}! Strategic features captured.`,
            severity: 'CRITICAL'
          });

          c.lastEventLog.unshift(`Secured target strategic province district: ${targetProvince.name}.`);
          e.lastEventLog.unshift(`Tactical Breach: Enemy ground columns captured ${targetProvince.name} district!`);
        }
      }
    });

    // In occupied provinces, recover integrity and decay resistance over ticks
    if (c.provinces) {
      c.provinces.forEach((p) => {
        if (p.controllerCountryId !== p.originalCountryId) {
          // It's occupied by another country!
          p.resistanceLevel = Math.max(0, p.resistanceLevel + 1.5);
          
          if (p.resistanceLevel > 80 && Math.random() < 0.20) {
            // Insurgency sabotages occupier!
            const occupier = draft.countries[p.controllerCountryId];
            if (occupier && occupier.arsenal.combatRealism) {
              occupier.arsenal.combatRealism.insurgencies = Math.min(100, occupier.arsenal.combatRealism.insurgencies + 5);
              occupier.economic.treasuryCashB = Math.max(0, occupier.economic.treasuryCashB - 2);
              if (Math.random() < 0.4) {
                draft.globalEventLog.unshift({
                  tick: draft.currentTick,
                  text: `REBELLION STRIKE: Local partisan militias launched sabotage strikes against ${occupier.name} forces in ${p.name}.`,
                  severity: 'WARNING'
                });
              }
            }
          }
        } else {
          // Nominal owner: reduce resistance
          p.resistanceLevel = Math.max(0, p.resistanceLevel - 2);
          p.integrity = Math.min(100, p.integrity + 1); // self healing
        }
      });
    }
  });
}

/**
 * 3. AI long-term objectives and continuous decadal actions.
 */
function processDecadalAIAgendas(draft: WorldState, playerCountryId: string) {
  // China objectives: Silicon Rare Earth price controls and regional Taiwan/India pressure
  const cn = draft.countries['CN'];
  if (cn && cn.id !== playerCountryId) {
    const siliconMarket = draft.commodityMarkets.find(m => m.type === 'RARE_EARTH');
    if (siliconMarket && siliconMarket.spotPriceUSD < 150) {
      siliconMarket.spotPriceUSD *= 1.05; // China drives and siphons rare earth rates
    }
  }

  // US objectives: NATO cohesion
  const us = draft.countries['US'];
  if (us && us.id !== playerCountryId) {
    const de = draft.countries['DE'];
    if (de && us.opinions['DE'] < 70) {
      us.opinions['DE'] += 1;
      de.opinions['US'] += 1;
    }
  }

  // Russia objective: Arctic claim pipelines, oil output expansions
  const ru = draft.countries['RU'];
  if (ru && ru.id !== playerCountryId) {
    const oilMarket = draft.commodityMarkets.find(m => m.type === 'OIL');
    if (oilMarket && Math.random() < 0.15 && oilMarket.spotPriceUSD < 110) {
      oilMarket.spotPriceUSD *= 1.03; // Russia restricts output slightly to secure funds
    }
  }
}

/**
 * 4. Thousands of possible emergent/unscripted events.
 */
function processDynamicEventsEngine(draft: WorldState) {
  // Only trigger on random ticks (e.g. 15% chance per tick)
  if (Math.random() > 0.15) return;

  const countryIds = Object.keys(draft.countries);
  const randomCountryId = countryIds[Math.floor(Math.random() * countryIds.length)];
  const c = draft.countries[randomCountryId];
  if (!c) return;

  const eventsList = [
    {
      title: 'INDUSTRIAL_PANDEMIC',
      severity: 'CRITICAL' as const,
      trigger: (country: Country) => {
        country.populationSim!.birthRate = Math.max(3, country.populationSim!.birthRate - 1);
        country.populationSim!.deathRate = Math.min(45, country.populationSim!.deathRate + 2);
        country.political.popularUnrest = Math.min(100, country.political.popularUnrest + 15);
        country.economic.gdpB *= 0.96;
        return `HEALTH RISK: Bio-safety contagion outbreak detected in ${country.name} manufacturing core. Local workforce quarantined.`;
      }
    },
    {
      title: 'M8.1_EARTHQUAKE',
      severity: 'CRITICAL' as const,
      trigger: (country: Country) => {
        const capitalProv = country.provinces?.find(p => p.id.includes('cap'));
        if (capitalProv) {
          capitalProv.integrity = Math.max(20, capitalProv.integrity - 65);
        }
        country.political.stabilityIndex = Math.max(10, country.political.stabilityIndex - 20);
        country.economic.treasuryCashB = Math.max(10, country.economic.treasuryCashB - 25);
        return `NATURAL DISASTER: Tremendous M8.1 earthquake hits ${country.name} capital territory. Strategic infrastructure ruptured!`;
      }
    },
    {
      title: 'CYBER_GRID_ATTACK',
      severity: 'WARNING' as const,
      trigger: (country: Country) => {
        country.political.popularUnrest = Math.min(100, country.political.popularUnrest + 12);
        country.economic.gdpGrowthRate = Math.max(-5, country.economic.gdpGrowthRate - 1.5);
        return `SECURITY ESCALATION: Malicious ransomware code hacks municipal energy grid in ${country.name}. Immediate blackouts active!`;
      }
    },
    {
      title: 'ASSET_BUBBLE_BURST',
      severity: 'WARNING' as const,
      trigger: (country: Country) => {
        country.economic.financialMarkets!.stockMarketIndex *= 0.82; // 18% crash
        country.economic.financialMarkets!.bondYield += 1.8;
        country.political.leaderApprovalRating = Math.max(10, country.political.leaderApprovalRating - 10);
        return `MARKET CORRECTION: Excess asset liquidity bubble collapses in ${country.name} equities market. Broad indices slide in trading.`;
      }
    },
    {
      title: 'TERROR_ASSASSINATION',
      severity: 'CRITICAL' as const,
      trigger: (country: Country) => {
        country.political.stabilityIndex = Math.max(5, country.political.stabilityIndex - 25);
        country.political.popularUnrest = Math.min(100, country.political.popularUnrest + 18);
        
        // Re-generate intelligence chief
        country.cabinet!.intelligenceChief = {
          name: 'Interim Caretaker Director',
          competence: 55,
          loyalty: 88,
          corruption: 5,
          ideology: country.political.ideology
        };
        return `TACTICAL COMPROMISE: Extremist proxy cell assassinated the serving Intelligence Director of ${country.name} in transit.`;
      }
    },
    {
      title: 'AGRICULTURAL_BLIGHT',
      severity: 'WARNING' as const,
      trigger: (country: Country) => {
        country.populationSim!.poverty = Math.min(100, country.populationSim!.poverty + 8);
        country.economic.supplyChains!.foodDependency = Math.min(100, country.economic.supplyChains!.foodDependency + 20);
        return `RESOURCE DEFICIT: Spreading crop blight compromises critical wheat farms in country: ${country.name}. High food imports required.`;
      }
    },
    {
      title: 'SPACE_SATELLITE_COLLISION',
      severity: 'INFO' as const,
      trigger: (country: Country) => {
        const sats = country.intelligence.satellites;
        if (sats.length > 0) {
          sats.pop(); // destroy satellite
        }
        return `ORBITAL EMERGENCY: Multi-spectrum recon satellite assets linked to ${country.name} collided with space junk in LEO orbit. Constellation compromised.`;
      }
    }
  ];

  // Pick random event
  const picked = eventsList[Math.floor(Math.random() * eventsList.length)];
  const logText = picked.trigger(c);

  // Send to global and country log
  draft.globalEventLog.unshift({
    tick: draft.currentTick,
    text: logText,
    severity: picked.severity
  });
  c.lastEventLog.unshift(logText);
}
