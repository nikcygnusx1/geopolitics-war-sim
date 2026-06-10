import { BallisticStrike, WorldState, Country } from '../types';
import { WorldScar, useConsequenceStore } from '../store/consequenceStore';

// Get center coordinates of country for scar display (D3 SVG center coordinates fallback)
export function getCountryCentroid(countryId: string): { lat: number; lon: number } {
  const coordinates: Record<string, { lat: number; lon: number }> = {
    US: { lat: 37, lon: -95 },
    CN: { lat: 35, lon: 104 },
    IN: { lat: 20, lon: 78 },
    PK: { lat: 30, lon: 69 },
    IL: { lat: 31, lon: 34 },
    PS: { lat: 31.9, lon: 35.2 },
    IR: { lat: 32, lon: 53 },
    RU: { lat: 61, lon: 105 },
    GB: { lat: 55, lon: -3 },
    FR: { lat: 46, lon: 2 },
    DE: { lat: 51, lon: 9 },
    JP: { lat: 36, lon: 138 },
    KR: { lat: 35.9, lon: 127.7 },
    SA: { lat: 23.8, lon: 45 },
    BR: { lat: -14, lon: -51 },
    ZA: { lat: -30, lon: 25 },
    AU: { lat: -25, lon: 133 },
    TR: { lat: 38.9, lon: 35 },
    EG: { lat: 26, lon: 30 },
    TW: { lat: 23.6, lon: 120.9 }
  };
  return coordinates[countryId] || { lat: 0, lon: 0 };
}

export function createScarFromStrike(strike: BallisticStrike, currentTick: number, worldCountries: Record<string, Country>): WorldScar {
  const targetId = strike.targetCountryId;
  const target = worldCountries[targetId];
  const coords = getCountryCentroid(targetId);

  if ((strike.weaponType === 'ICBM' || strike.weaponType === 'SLBM') && strike.warheadYieldMT && strike.warheadYieldMT > 0) {
    return {
      id: Math.random().toString(36).substring(7),
      type: 'NUCLEAR_EXCLUSION_ZONE',
      countryId: targetId,
      lat: coords.lat + (Math.random() - 0.5) * 1.5,
      lon: coords.lon + (Math.random() - 0.5) * 1.5,
      radiusKm: 20 + strike.warheadYieldMT * 50,
      createdTick: currentTick,
      severity: 3,
      healingRateTicksPerLevel: null,  // PERMANENT
      currentSeverity: 3,
      activeEffects: {
        gdpPenaltyBPerTick: target ? target.economic.gdpB * 0.001 : 1.5,
        populationLossPerTick: strike.warheadYieldMT * 0.5,
        radiationDeathsPerTick: 0.1 * strike.warheadYieldMT,
        unrestBonusPerTick: 5,
        stabilityPenaltyPerTick: 2,
      }
    };
  }

  // Conventional strike scar
  const infraDamage = strike.damageDealt ? strike.damageDealt.infrastructureDamage : 30;
  return {
    id: Math.random().toString(36).substring(7),
    type: 'MISSILE_CRATER',
    countryId: targetId,
    lat: coords.lat + (Math.random() - 0.5) * 2,
    lon: coords.lon + (Math.random() - 0.5) * 2,
    radiusKm: 5 + infraDamage * 0.5,
    createdTick: currentTick,
    severity: Math.max(1, Math.ceil(infraDamage / 33)) as 1 | 2 | 3,
    healingRateTicksPerLevel: 25,  // heals each level per 25 ticks
    currentSeverity: Math.max(1, Math.ceil(infraDamage / 33)),
    activeEffects: {
      gdpPenaltyBPerTick: target ? target.economic.gdpB * 0.0002 : 0.3,
      unrestBonusPerTick: 1,
    }
  };
}

// Process consequence tick changes in Country budgets/political stats
export function processConsequences(worldCountries: Record<string, Country>) {
  const scars = useConsequenceStore.getState().scars;
  scars.forEach((scar) => {
    const country = worldCountries[scar.countryId];
    if (country) {
      if (scar.activeEffects.gdpPenaltyBPerTick) {
        country.economic.gdpB = Math.max(1.0, country.economic.gdpB - scar.activeEffects.gdpPenaltyBPerTick * (scar.currentSeverity / scar.severity));
      }
      if (scar.activeEffects.unrestBonusPerTick) {
        country.political.popularUnrest = Math.min(100, country.political.popularUnrest + scar.activeEffects.unrestBonusPerTick * (scar.currentSeverity / scar.severity));
      }
      if (scar.activeEffects.stabilityPenaltyPerTick) {
        country.political.stabilityIndex = Math.max(1, country.political.stabilityIndex - scar.activeEffects.stabilityPenaltyPerTick * (scar.currentSeverity / scar.severity));
      }
      if (scar.activeEffects.radiationDeathsPerTick) {
        // Reduce population
        country.population = Math.max(0.1, country.population - scar.activeEffects.radiationDeathsPerTick * 0.1);
      }
    }
  });
}
