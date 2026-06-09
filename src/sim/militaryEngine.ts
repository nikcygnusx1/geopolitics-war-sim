import { WorldState, BallisticStrike, StrikeDamage, WeaponType } from '../types';
import { WEAPON_METADATA } from '../constants';
import { useMilitaryStore } from '../store/militaryStore';

export function getTickIncrement(type: WeaponType): number {
  switch (type) {
    case 'ICBM': return 4;
    case 'HYPERSONIC': return 8;
    case 'CRUISE_MISSILE': return 6;
    case 'SLBM': return 5;
    case 'FIGHTER_JET': return 10;
    case 'DRONE_SWARM': return 7;
    case 'CYBER_WEAPON': return 15;
    case 'EMP_DEVICE': return 12;
    default: return 7;
  }
}

export function advanceStrikes(draft: WorldState) {
  // 1. Process active ballistic strikes in flight
  draft.activeStrikes.forEach((strike) => {
    if (strike.status !== 'IN_FLIGHT') return;

    strike.progressPct = Math.min(100, strike.progressPct + getTickIncrement(strike.weaponType));

    // Abm Shield Interception triggers near terminal approach (>= 90% progress)
    if (strike.progressPct >= 90 && !strike.interceptAttempted) {
      strike.interceptAttempted = true;

      const target = draft.countries[strike.targetCountryId];
      if (target) {
        let abmShield = target.arsenal.abmShieldStrength;

        // Add technology bonuses
        if (target.researchUnlocked.includes('IRON_DOME_V3')) abmShield += 25;
        else if (target.researchUnlocked.includes('IRON_DOME_V2')) abmShield += 15;
        else if (target.researchUnlocked.includes('IRON_DOME_V1')) abmShield += 8;

        // Apply weapon counters
        if (strike.weaponType === 'HYPERSONIC') {
          abmShield -= 30; // Hypersonics evade standard ABMs
        }
        if (strike.warheadYieldMT && strike.warheadYieldMT > 1) {
          abmShield -= 20; // Heavy warheads are harder to stop
        }

        abmShield = Math.max(5, Math.min(95, abmShield));
        const interceptRoll = Math.random() * 100;

        if (interceptRoll < abmShield) {
          strike.status = 'INTERCEPTED';
          strike.interceptSuccess = true;
          target.arsenal.abmIntercepts++;
          
          draft.globalEventLog.unshift({
            tick: draft.currentTick,
            text: `Air Defense Success: ${target.name} ABM battery successfully intercepted incoming ${strike.weaponType} launched by ${strike.sourceCountryId}!`,
            severity: 'INFO',
          });

          // Send to military log store
          useMilitaryStore.getState().addInterceptorAlert({
            id: Math.random().toString(),
            source: strike.sourceCountryId,
            target: strike.targetCountryId,
            weapon: strike.weaponType,
            success: true,
            tick: draft.currentTick,
          });

        } else {
          strike.interceptSuccess = false;
        }
      }
    }

    // Impact triggers at 100%
    if (strike.progressPct >= 100 && strike.status === 'IN_FLIGHT') {
      strike.status = 'IMPACT';
      applyStrikeDamage(draft, strike);
    }
  });

  // 2. Process non-player fuel logistics, supply chain, and morale per country
  const oilMarket = draft.commodityMarkets.find(m => m.type === 'OIL');
  const oilPriceUSD = oilMarket ? oilMarket.spotPriceUSD : 75.0;

  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const defenseSpends = c.economic.spendingAllocation.military * c.economic.gdpB;

    c.arsenal.units.forEach((unit) => {
      // Morale delta updates
      let moraleDelta = 0;
      moraleDelta += (c.political.stabilityIndex - 50) * 0.1;
      moraleDelta -= (c.atWarWith.length * 4);
      if (c.political.leaderApprovalRating < 40) moraleDelta -= 3;
      
      unit.pilotMorale = Math.max(10, Math.min(100, unit.pilotMorale + moraleDelta));

      // Fuel consumption and supply cost
      const operationalRate = c.atWarWith.length > 0 ? 3.0 : 1.0;
      unit.fuelLevel = Math.max(0, unit.fuelLevel - (0.5 * operationalRate));

      // Automatic refuel using treasury if cash available
      if (unit.fuelLevel < 30 && c.economic.treasuryCashB > 0) {
        // Cost of fuel increases or decreases based on oil index prices
        const refuelCostB = (unit.count * 0.005) * (oilPriceUSD / 75.0);
        if (c.economic.treasuryCashB >= refuelCostB) {
          c.economic.treasuryCashB -= refuelCostB;
          unit.fuelLevel = 100;
          unit.supplyChainStatus = 'NOMINAL';
        } else {
          unit.supplyChainStatus = 'CRITICAL';
        }
      }

      if (unit.fuelLevel < 5) {
        unit.supplyChainStatus = 'SEVERED';
        unit.operational = Math.floor(unit.count * 0.1); // grounded
      } else {
        unit.operational = unit.count;
      }
    });

    // Recompute power scores and maintenance
    c.arsenal.totalPowerRating = c.arsenal.units.reduce((acc, u) => acc + (u.operational * u.combatPowerRating), 0);
    c.arsenal.totalMaintenanceCost = c.arsenal.units.reduce((acc, u) => acc + u.maintenanceCostPerTick, 0);
  });
}

function applyStrikeDamage(draft: WorldState, strike: BallisticStrike) {
  const source = draft.countries[strike.sourceCountryId];
  const target = draft.countries[strike.targetCountryId];
  if (!target || !source) return;

  const metadata = WEAPON_METADATA[strike.weaponType];
  const powerFactor = metadata ? metadata.combatPower / 100 : 0.5;

  let yieldsMultiplier = 1.0;
  let casualties = 1000 + Math.floor(Math.random() * 5000);
  let rawGdpLoss = target.economic.gdpB * powerFactor * 0.05;
  let stabilityLoss = powerFactor * 25 * (1 + (target.political.popularUnrest / 100));

  let radiationContamination = false;
  let empBlackout = false;

  if (strike.warheadYieldMT) {
    yieldsMultiplier = strike.warheadYieldMT * 3.5;
    casualties = Math.floor(strike.warheadYieldMT * 450000 + Math.random() * 200000);
    rawGdpLoss = target.economic.gdpB * 0.18 * strike.warheadYieldMT;
    stabilityLoss = 45 * strike.warheadYieldMT;
    radiationContamination = true;
    draft.nuclearExchangeOccurred = true;
  }

  if (strike.weaponType === 'EMP_DEVICE') {
    empBlackout = true;
    casualties = 50; // EMPs trigger fewer immediate casualties but crush grids
    rawGdpLoss = target.economic.gdpB * 0.22;
    stabilityLoss = 38;
  }

  // Destroy 10-20% of random weapon unit holdings
  const militaryAssetsDestroyed: StrikeDamage['militaryAssetsDestroyed'] = [];
  target.arsenal.units.forEach((u) => {
    if (u.count > 0) {
      const lost = Math.floor(u.count * (0.1 + Math.random() * 0.15));
      if (lost > 0) {
        u.count -= lost;
        u.operational = u.count;
        militaryAssetsDestroyed.push({ type: u.type, count: lost });
      }
    }
  });

  // Apply losses to metrics
  target.political.stabilityIndex = Math.max(0, target.political.stabilityIndex - stabilityLoss);
  target.political.popularUnrest = Math.min(100, target.political.popularUnrest + (powerFactor * 35));
  target.economic.gdpB = Math.max(1.0, target.economic.gdpB - rawGdpLoss);

  // Set as atWarWith each other automatically
  if (!source.atWarWith.includes(target.id)) source.atWarWith.push(target.id);
  if (!target.atWarWith.includes(source.id)) target.atWarWith.push(source.id);

  const damageReport: StrikeDamage = {
    stabilityLoss: Math.round(stabilityLoss * 10) / 10,
    gdpLoss: Math.round(rawGdpLoss * 10) / 10,
    militaryAssetsDestroyed: militaryAssetsDestroyed,
    casualtiesEstimate: casualties,
    infrastructureDamage: Math.round((powerFactor * 60 + Math.random() * 10) * yieldsMultiplier),
    radiationContamination: radiationContamination,
    empBlackout: empBlackout,
  };

  strike.damageDealt = damageReport;

  // Append logs
  draft.globalEventLog.unshift({
    tick: draft.currentTick,
    text: `CRITICAL IMPACT DETECTED! ${strike.weaponType} hit ${target.name}. Casualty Estimates: ${casualties.toLocaleString()}; infrastructure damage score: ${damageReport.infrastructureDamage}%.`,
    severity: 'CRITICAL',
  });

  target.lastEventLog.unshift(`Direct strike hit! ${strike.weaponType} exploded overhead. Stability falls -${damageReport.stabilityLoss}%.`);
}
