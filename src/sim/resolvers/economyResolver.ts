import { CanonicalWorld, CountryState, WorldEvent } from '../../types';

export function resolveEconomy(world: CanonicalWorld, currentTick: number): { updatedCountries: Record<string, CountryState>; logs: string[] } {
  const updatedCountries = { ...world.countriesById };
  const logs: string[] = [];

  Object.keys(updatedCountries).forEach((id) => {
    const country = { ...updatedCountries[id] };
    const economy = { ...country.economy };
    
    // Ensure nested macro properties exist (provide safe defaults if hydrated scenario lacks them)
    if (!economy.businessCyclePhase) economy.businessCyclePhase = 'EXPANSION';
    if (economy.fragilityScore === undefined) economy.fragilityScore = 30;
    if (economy.resilienceScore === undefined) economy.resilienceScore = 70;
    if (economy.externalExposureScore === undefined) economy.externalExposureScore = 40;
    if (economy.importDependenceScore === undefined) economy.importDependenceScore = 40;
    if (economy.exportConcentrationScore === undefined) economy.exportConcentrationScore = 30;
    if (economy.shockLoad === undefined) economy.shockLoad = 10;
    if (economy.recoveryMomentum === undefined) economy.recoveryMomentum = 50;
    if (economy.macroTrend === undefined) economy.macroTrend = 'STABLE';
    if (!economy.recentMacroDrivers) economy.recentMacroDrivers = ['Normal market conditions'];
    if (!economy.policyPosture) economy.policyPosture = 'PRO_GROWTH';
    if (economy.currencyStability === undefined) economy.currencyStability = 75;
    if (!economy.sectors) {
      economy.sectors = {
        energy: economy.sectorBreakdown?.energy || 10,
        agriculture: economy.sectorBreakdown?.agriculture || 10,
        manufacturing: economy.sectorBreakdown?.manufacturing || 30,
        tech: 15,
        services: economy.sectorBreakdown?.services || 35,
        defense: 5,
        state: 10
      };
    }

    // 1. Accumulate dynamic active shocks from different channels
    let activeShocks = 0;
    const shockExplanations: string[] = [];

    // Sanctions shock
    const isSanctioned = (economy.sanctionsExposure || 0) > 0;
    if (isSanctioned) {
      const sanctionIntensity = Math.min(100, (economy.sanctionsExposure || 15));
      activeShocks += sanctionIntensity * 0.4;
      shockExplanations.push(`Strict trade blockades (${Math.round(sanctionIntensity)}% intensity)`);
    }

    // Conflict / war mobilization shock
    const activeWars = country.atWarWith?.length || 0;
    const mobilization = country.military?.mobilizationLevel || 0;
    if (activeWars > 0 || mobilization > 15) {
      const warDisruption = (activeWars * 25) + (mobilization * 0.5);
      activeShocks += Math.min(50, warDisruption * 0.5);
      shockExplanations.push(`Kinetic conflict mobilization & defense burn`);
    }

    // Supply disruption shock
    const supplyRisk = economy.supplyRisk || 0;
    if (supplyRisk > 30) {
      activeShocks += (supplyRisk - 30) * 0.3;
      shockExplanations.push(`Severe high-tech/commodity supply-chain friction`);
    }

    // Cyber incident shock
    const activeCyberIncidents = country.cyber?.activeIncidents || 0;
    const civilianNetHealth = country.cyber?.civilianNetworkHealth || 100;
    if (activeCyberIncidents > 0 || civilianNetHealth < 90) {
      const cyberDisruption = (activeCyberIncidents * 15) + (100 - civilianNetHealth) * 0.5;
      activeShocks += Math.min(25, cyberDisruption * 0.3);
      shockExplanations.push(`Cyber-attacks degrading critical trading infrastructure`);
    }

    // Reserve depletion stress
    const currentReserves = economy.reserves || 0;
    const baseReserves = country.population * 0.5; // absolute scale relative to country size
    const reserveCoverageRatio = currentReserves / Math.max(1, baseReserves);
    if (reserveCoverageRatio < 0.3) {
      activeShocks += 20;
      shockExplanations.push(`Critical foreign reserves depletion`);
    } else if (reserveCoverageRatio < 0.6) {
      activeShocks += 8;
      shockExplanations.push(`Strained central bank liquidity buffers`);
    }

    // Debt ratios & Central Bank policy space limits
    const debtToGDP = economy.debtRatio || 0;
    if (debtToGDP > 120) {
      activeShocks += (debtToGDP - 120) * 0.15;
      shockExplanations.push(`Elevated debt servicing interest costs`);
    }

    // Apply policy adjustments that might add shock or offset them
    let policyStanceEffect = 0;
    if (economy.policyPosture === 'AUSTERITY') {
      // austerity reduces debt growth but cools immediate output, adding a temporary policy shock
      activeShocks += 5;
      policyStanceEffect = -1; // suppresses growth rate
    } else if (economy.policyPosture === 'CURRENCY_DEFENSE') {
      activeShocks += 10; // high interest rates stress credit
    }

    // 2. Shock load update with inertia (shock accumulates and decays)
    const baseDecay = 5 + (economy.recoveryMomentum || 50) * 0.1;
    // Fragility dampens shock decay
    const shockDecayModifier = Math.max(0.2, 1 - (economy.fragilityScore || 30) / 150);
    const actualDecay = baseDecay * shockDecayModifier;
    
    // Accumulate shockLoad
    economy.shockLoad = Math.min(100, Math.max(0, (economy.shockLoad || 0) + activeShocks - actualDecay));

    // 3. Dynamic Fragility and Resilience Scoring
    let computedFragility = 0;
    const fragilityDrivers: string[] = [];

    // Inflation driver
    if (economy.inflation > 7) {
      computedFragility += Math.min(20, (economy.inflation - 7) * 2);
      fragilityDrivers.push('Sticky Consumer Inflation');
    }
    // Unemployment driver
    if (economy.unemployment > 8) {
      computedFragility += Math.min(20, (economy.unemployment - 8) * 1.5);
      fragilityDrivers.push('Labor Market Disengagement Unrest');
    }
    // Debt load driver
    if (debtToGDP > 90) {
      computedFragility += Math.min(25, (debtToGDP - 90) * 0.4);
      fragilityDrivers.push('Sovereign Borrowing Vulnerability');
    }
    // Reserves cover driver
    if (reserveCoverageRatio < 0.4) {
      computedFragility += 20;
      fragilityDrivers.push('Depleted Balance-of-Payments Defense');
    }
    // Sector concentration driver (e.g. over-reliance on Energy or Agriculture)
    const sectors = economy.sectors;
    const maxSectorValue = Math.max(sectors.energy, sectors.agriculture, sectors.manufacturing, sectors.tech, sectors.services);
    if (maxSectorValue > 42) {
      computedFragility += 15;
      fragilityDrivers.push('Single Sector Export Dependency');
      economy.exportConcentrationScore = Math.round(maxSectorValue + 15);
    } else {
      economy.exportConcentrationScore = Math.round(maxSectorValue * 1.2);
    }
    // Shock load driver
    if (economy.shockLoad > 40) {
      computedFragility += (economy.shockLoad - 40) * 0.5;
      fragilityDrivers.push('Accumulated External Shocks');
    }
    // Currency instability driver
    if (economy.currencyStability < 60) {
      computedFragility += (60 - economy.currencyStability) * 0.4;
      fragilityDrivers.push('Exchange Rate Depreciation');
    }

    economy.fragilityScore = Math.round(Math.max(5, Math.min(98, computedFragility + (isSanctioned ? 15 : 0) + (activeWars * 10))));

    // Resilience scoring
    let computedResilience = 0;
    const stabilizers: string[] = [];

    // Diversification score from low sector variance
    const sectorValues = [sectors.energy, sectors.agriculture, sectors.manufacturing, sectors.tech, sectors.services];
    const meanSector = sectorValues.reduce((s, v) => s + v, 0) / sectorValues.length;
    const sectorVariance = sectorValues.reduce((s, v) => s + Math.pow(v - meanSector, 2), 0) / sectorValues.length;
    const diversificationBonus = Math.max(0, 30 - Math.sqrt(sectorVariance) * 1.5);
    computedResilience += diversificationBonus;
    if (diversificationBonus > 15) {
      stabilizers.push('High Industrial Diversification');
    }

    // Treasury / Reserves reserve buffer
    if (reserveCoverageRatio > 1.2) {
      computedResilience += 25;
      stabilizers.push('Strong Foreign Cash Reserves');
    } else if (reserveCoverageRatio > 0.8) {
      computedResilience += 15;
      stabilizers.push('Adequate Payment Buffer');
    }

    // Low Debt
    if (debtToGDP < 40) {
      computedResilience += 20;
      stabilizers.push('Fiscal Debt Policy Latitude');
    } else if (debtToGDP < 75) {
      computedResilience += 10;
    }

    // Strong Currency
    if (economy.currencyStability > 80) {
      computedResilience += 15;
      stabilizers.push('Stable Reserve Currency');
    }

    // Alliance buffer
    const hasAllianceBlock = country.allianceIds?.length > 0;
    if (hasAllianceBlock) {
      computedResilience += 10;
      stabilizers.push('Coalition Commercial Flow Shield');
    }

    economy.resilienceScore = Math.round(Math.max(8, Math.min(99, computedResilience + (economy.recoveryMomentum || 50) * 0.1)));

    // Expose import/export dependencies
    economy.importDependenceScore = Math.round(economy.importDependency || 40);

    // 4. Evolve Business-Cycle Phase & Macro progression
    const prevPhase = economy.businessCyclePhase;

    // Growth momentum & CB Interest Rate
    let baselineGrowth = 3.0; // default peacetime potential GDP growth
    if (sectors.tech > 20) baselineGrowth += 1.0; // tech sector gives growth acceleration
    if (sectors.energy > 30) {
      // commodity dependent is volatile
      baselineGrowth += (Math.random() > 0.5 ? 0.8 : -0.8);
    }

    let CB_Rate = economy.interestRate || 4.5;

    // Apply baseline modifiers depending on cycles
    let growthTarget = baselineGrowth;
    let inflationTarget = 2.2;
    let unemploymentTarget = 5.0;
    let stabilityTarget = 80;

    switch (economy.businessCyclePhase) {
      case 'EXPANSION':
        growthTarget = baselineGrowth + 1.2;
        inflationTarget = 2.8;
        unemploymentTarget = 4.0;
        stabilityTarget = 90;
        break;
      case 'OVERHEATING':
        growthTarget = baselineGrowth + 2.8;
        inflationTarget = 7.5;
        unemploymentTarget = 2.5;
        stabilityTarget = 70;
        // CB raises rates to curb overheating
        CB_Rate = Math.min(18.0, CB_Rate + 0.5);
        break;
      case 'SLOWDOWN':
        growthTarget = 0.8;
        inflationTarget = 4.0;
        unemploymentTarget = 6.2;
        stabilityTarget = 75;
        break;
      case 'CONTRACTION':
        growthTarget = -2.2;
        inflationTarget = 1.2;
        unemploymentTarget = 9.0;
        stabilityTarget = 50;
        // CB drops rates to stimulate or raises them if hyperinflationary
        if (economy.inflation > 10) {
          CB_Rate = Math.min(25.0, CB_Rate + 1.2); // distress defense
        } else {
          CB_Rate = Math.max(1.0, CB_Rate - 0.4);
        }
        break;
      case 'CRISIS':
        growthTarget = -5.8;
        inflationTarget = economy.inflation > 12 ? economy.inflation + 1.5 : 0.5; // spiral deflation or hyperinflation
        unemploymentTarget = 15.0;
        stabilityTarget = 28;
        CB_Rate = economy.inflation > 15 ? Math.min(45.0, CB_Rate + 2.5) : Math.max(0.5, CB_Rate - 0.8);
        break;
      case 'STABILIZATION':
        growthTarget = 0.2;
        inflationTarget = Math.max(2.5, economy.inflation - 0.8);
        unemploymentTarget = 11.0;
        stabilityTarget = 65;
        break;
      case 'RECOVERY':
        growthTarget = 2.0;
        inflationTarget = 2.0;
        unemploymentTarget = 7.5;
        stabilityTarget = 82;
        CB_Rate = Math.max(3.0, CB_Rate - 0.2);
        break;
    }

    // Factors from Shocks
    const shockIntensityFactor = economy.shockLoad / 100;
    growthTarget -= shockIntensityFactor * 6.5;
    inflationTarget += shockIntensityFactor * 8.0;
    unemploymentTarget += shockIntensityFactor * 5.5;

    // Apply Policy Stance Stethoscope
    if (economy.policyPosture === 'PRO_GROWTH') {
      growthTarget += 0.8;
      inflationTarget += 0.6;
      unemploymentTarget -= 0.6;
      // Reserves drain check
      economy.reserves = Math.max(1.0, economy.reserves - 0.1);
    } else if (economy.policyPosture === 'AUSTERITY') {
      growthTarget -= 1.0;
      inflationTarget -= 0.8;
      unemploymentTarget += 0.8;
      economy.reserves = Math.min(25000, economy.reserves + 0.3); // buffer buildup
    } else if (economy.policyPosture === 'CURRENCY_DEFENSE') {
      CB_Rate = Math.min(30.0, CB_Rate + 1.5);
      growthTarget -= 1.2;
      inflationTarget -= 1.0;
      // defends currency Stability but drains cash
      economy.reserves = Math.max(1.0, economy.reserves - 0.6);
    } else if (economy.policyPosture === 'IMPORT_SUPPORT') {
      inflationTarget -= 1.5;
      economy.reserves = Math.max(1.0, economy.reserves - 1.2); // high reserve burn
    } else if (economy.policyPosture === 'DEBT_STABILIZATION') {
      // temporary hit to growth but stabilizes stress
      growthTarget -= 1.5;
    }

    // Dynamic Central Bank rates interest rate pressure on debt
    economy.interestRate = CB_Rate;

    // 5. Momentum evolution (Lag)
    const inertia = 0.15; // smooth lag coefficient
    economy.growthRate = economy.growthRate + (growthTarget - economy.growthRate) * inertia;
    economy.inflation = Math.max(0.1, economy.inflation + (inflationTarget - economy.inflation) * inertia);
    economy.unemployment = Math.max(1.5, economy.unemployment + (unemploymentTarget - economy.unemployment) * inertia);

    // Apply GDP index change
    const deltaGDP = economy.gdp * (economy.growthRate / 100) / 12; // monthly compounding approx
    economy.gdp = Math.max(1.0, economy.gdp + deltaGDP);

    // Reserves and trade balance progression
    let tradeSurplus = economy.tradeBalance || 0;
    if (economy.growthRate > 3) {
      tradeSurplus += 0.2; // stronger exports/imports exchange
    } else {
      tradeSurplus -= 0.15;
    }
    if (isSanctioned) tradeSurplus -= 0.8;

    economy.tradeBalance = Number(tradeSurplus.toFixed(2));

    // Dynamic currency stability and strength
    let currencyTarget = 100; // 100 = neutral
    if (economy.growthRate < -2) currencyTarget -= 25;
    if (economy.inflation > 8) currencyTarget -= 30;
    if (economy.reserves < 15) currencyTarget -= 20;
    if (isSanctioned) currencyTarget -= 15;
    
    economy.currencyStrength = Math.max(10, Math.min(195, economy.currencyStrength + (currencyTarget - economy.currencyStrength) * inertia));
    // currencyStability maps stability of currency between 0 and 100
    economy.currencyStability = Math.round(Math.max(5, Math.min(98, 100 - (Math.abs(100 - economy.currencyStrength) * 0.7) - (economy.shockLoad * 0.3))));

    // Reserves burn/generation rate
    let reservesDrift = tradeSurplus * 0.1;
    if (economy.policyPosture === 'IMPORT_SUPPORT') reservesDrift -= 0.4;
    economy.reserves = Math.max(1.0, economy.reserves + reservesDrift);

    // Debt stress modeling
    if (economy.growthRate < 1.0) {
      economy.debtRatio = Math.min(300, economy.debtRatio + 0.25);
    } else {
      economy.debtRatio = Math.max(5, economy.debtRatio - 0.1);
    }
    economy.fiscalSpace = Math.max(0, Math.round(100 - economy.debtRatio * 0.35));
    // debtStressIndex
    economy.economicStress = Math.round(Math.max(5, Math.min(99, (economy.debtRatio * 0.25) + (100 - economy.currencyStability) * 0.4 + (economy.shockLoad * 0.35))));

    // Popular Unrest pass-through
    if (economy.inflation > 12) {
      country.unrest = Math.min(100, country.unrest + 1.5);
    }
    if (economy.unemployment > 10) {
      country.unrest = Math.min(100, country.unrest + 1.2);
    }
    if (economy.businessCyclePhase === 'CRISIS') {
      country.regimeStability = Math.max(0, country.regimeStability - 1.8);
      country.unrest = Math.min(100, country.unrest + 2.0);
    }

    // 6. PHASE TRANSITION STATE MACHINE
    if (economy.businessCyclePhase === 'EXPANSION') {
      if (economy.growthRate > 5.5 && economy.inflation > 5.5) {
        economy.businessCyclePhase = 'OVERHEATING';
      } else if (economy.shockLoad > 35 || economy.growthRate < 1.0) {
        economy.businessCyclePhase = 'SLOWDOWN';
      }
    } else if (economy.businessCyclePhase === 'OVERHEATING') {
      if (economy.growthRate < 4.0 || economy.shockLoad > 30) {
        economy.businessCyclePhase = 'SLOWDOWN';
      }
    } else if (economy.businessCyclePhase === 'SLOWDOWN') {
      if (economy.growthRate < 0) {
        economy.businessCyclePhase = 'CONTRACTION';
      } else if (economy.shockLoad < 15 && economy.growthRate > 2.0) {
        economy.businessCyclePhase = 'EXPANSION';
      }
    } else if (economy.businessCyclePhase === 'CONTRACTION') {
      if (economy.growthRate < -4.0 || economy.economicStress > 75 || economy.reserves < 10) {
        economy.businessCyclePhase = 'CRISIS';
      } else if (economy.growthRate >= 0) {
        economy.businessCyclePhase = 'STABILIZATION';
      }
    } else if (economy.businessCyclePhase === 'CRISIS') {
      if (economy.shockLoad < 40 && (economy.policyPosture === 'DEBT_STABILIZATION' || economy.policyPosture === 'AUSTERITY')) {
        economy.businessCyclePhase = 'STABILIZATION';
      }
    } else if (economy.businessCyclePhase === 'STABILIZATION') {
      if (economy.growthRate >= 0.5 && economy.shockLoad < 30) {
        economy.businessCyclePhase = 'RECOVERY';
      } else if (economy.growthRate < -1.0) {
        economy.businessCyclePhase = 'CONTRACTION';
      }
    } else if (economy.businessCyclePhase === 'RECOVERY') {
      if (economy.growthRate >= 2.0 && economy.shockLoad < 15) {
        economy.businessCyclePhase = 'EXPANSION';
      } else if (economy.shockLoad > 30) {
        economy.businessCyclePhase = 'SLOWDOWN';
      }
    }

    // Generate recent macro drivers explanations
    let macroTrendVal: 'BOOMING' | 'STABLE' | 'STAGNANT' | 'DETERIORATING' | 'CRISIS' = 'STABLE';
    if (economy.businessCyclePhase === 'CRISIS') macroTrendVal = 'CRISIS';
    else if (economy.growthRate > 4.5) macroTrendVal = 'BOOMING';
    else if (economy.growthRate < -1.5) macroTrendVal = 'DETERIORATING';
    else if (economy.growthRate < 1.0) macroTrendVal = 'STAGNANT';

    economy.macroTrend = macroTrendVal;

    // Compose explanatory explanations
    const drivers: string[] = [];
    if (economy.businessCyclePhase === 'EXPANSION') drivers.push('Sustained domestic supply chain growth');
    if (economy.businessCyclePhase === 'OVERHEATING') drivers.push('Over-leveraged capital expansion bubble');
    if (economy.businessCyclePhase === 'CRISIS') drivers.push('Severe macro-financial sovereign systemic collapse');
    if (shockExplanations.length > 0) {
      drivers.push(...shockExplanations.slice(0, 2));
    } else {
      drivers.push('Adequate balance-of-payments cushion');
    }
    if (economy.policyPosture === 'PRO_GROWTH') drivers.push('Subsidized developmental liquidity injection');
    if (economy.policyPosture === 'AUSTERITY') drivers.push('Deficit-slashing state expenditure austerity');
    if (economy.policyPosture === 'CURRENCY_DEFENSE') drivers.push('Defensive domestic rate hike currency shield');

    economy.recentMacroDrivers = drivers.slice(0, 3);

    // 7. EMIT EVENT BUS & TIMELINE WORLD SIGNALS
    if (economy.businessCyclePhase !== prevPhase) {
      const shiftMsg = `Sovereign Alert: ${country.name} business cycle shifted from ${prevPhase} to ${economy.businessCyclePhase}.`;
      logs.push(shiftMsg);

      // Create a WorldEvent and append to world.eventsById
      const freshEvtId = `evt_macro_shift_${country.id}_${currentTick}`;
      const shiftEvent: WorldEvent = {
        id: freshEvtId,
        type: 'ECONOMIC',
        title: `${country.name} Shifts to ${economy.businessCyclePhase}`,
        description: `Macroeconomic monitors indicate that ${country.name}'s business cycle has undergone a structural transition in response to accumulated fiscal pressure and shock vectors.`,
        severity: economy.businessCyclePhase === 'CRISIS' ? 'CRITICAL' : 'INFO',
        status: 'active',
        visibility: 'PUBLIC',
        startTick: currentTick,
        endTick: currentTick + 15,
        involvedCountryIds: [country.id],
        involvedLeaderIds: [country.leaderId],
        originatingSystem: 'MACRO_CYCLE_WATCHDOG',
        effects: [`Growth path set to target ${economy.growthRate.toFixed(1)}%`],
        tags: ['MACRO_CYCLES', 'BUSINESS_SHIFTS', country.id],
        linkedOperationIds: [],
        linkedIntelFactIds: [],
        escalationPotential: economy.businessCyclePhase === 'CRISIS' ? 55 : 10,
        historicalLogEntries: [`Phase change finalized on Tick ${currentTick}`]
      };
      world.eventsById[freshEvtId] = shiftEvent;
    }

    // Trigger explicit macro thresholds event alerts
    if (economy.inflation > 15 && currentTick % 10 === 0) {
      const inflId = `evt_inflation_alert_${country.id}_${currentTick}`;
      world.eventsById[inflId] = {
        id: inflId,
        type: 'ECONOMIC',
        title: `${country.name} Hyperinflation Alert`,
        description: `Consumer prices are compounding hyperinflationary signals inside ${country.name} at ${economy.inflation.toFixed(1)}%, triggering systemic wealth friction and public disapproval.`,
        severity: 'WARNING',
        status: 'active',
        visibility: 'PUBLIC',
        startTick: currentTick,
        endTick: currentTick + 10,
        involvedCountryIds: [country.id],
        involvedLeaderIds: [country.leaderId],
        originatingSystem: 'INFLATION_WATCH_CORE',
        effects: ['Unrest risk accelerated +25%'],
        tags: ['INFLATION_SPIKE', 'COST_OF_LIVING', country.id],
        linkedOperationIds: [],
        linkedIntelFactIds: [],
        escalationPotential: 34,
        historicalLogEntries: [`Commodity pass-through triggered alerts`]
      };
      logs.push(`Financial Warning: Hyperinflation spiraling inside ${country.name} at ${economy.inflation.toFixed(1)}%.`);
    }

    if (economy.fragilityScore > 75 && currentTick % 12 === 0) {
      const fragId = `evt_fragility_alert_${country.id}_${currentTick}`;
      world.eventsById[fragId] = {
        id: fragId,
        type: 'ECONOMIC',
        title: `Economic Fragility Warning: ${country.name}`,
        description: `Strained debt reserves, currency depreciation, and ongoing trade-route dependencies have pushed ${country.name}'s fragility score to a critical ${economy.fragilityScore}%. Risk of sovereign default or coup is critical.`,
        severity: 'CRITICAL',
        status: 'active',
        visibility: 'PUBLIC',
        startTick: currentTick,
        endTick: currentTick + 12,
        involvedCountryIds: [country.id],
        involvedLeaderIds: [country.leaderId],
        originatingSystem: 'IMF_SOVEREIGN_VULNERABILITY',
        effects: ['Rating outlook downgraded to selective stress'],
        tags: ['FRAGILITY_ALERT', 'SOVEREIGN_RISK', country.id],
        linkedOperationIds: [],
        linkedIntelFactIds: [],
        escalationPotential: 68,
        historicalLogEntries: [`Systemic collapse threshold risk monitored`]
      };
      logs.push(`Sovereign Alert: ${country.name} fragility crossed systemic critical range at ${economy.fragilityScore}%.`);
    }

    country.economy = economy;
    updatedCountries[id] = country;
  });

  return { updatedCountries, logs };
}
