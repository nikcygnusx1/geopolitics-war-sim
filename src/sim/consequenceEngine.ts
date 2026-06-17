import { BallisticStrike, WorldState, Country, ConsequenceEffectType, MajorActionType, ConsequenceEffect, ScheduledConsequence } from '../types';
import { WorldScar, useConsequenceStore } from '../store/consequenceStore';
import { useLeaderStore } from '../store/leaderStore';
import { useSovereignStore } from '../store/sovereignStore';

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

// MANDATORY T3.5 CONSEQUENCE CHAIN TEMPLATES DEFINED CENTRALLY
export const CONSEQUENCE_TEMPLATES: Record<MajorActionType, ConsequenceEffect[]> = {
  DECLARE_WAR: [
    { delay: 5, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.90, params: { severity: 'MEDIUM' } },
    { delay: 8, effectType: ConsequenceEffectType.UN_RESOLUTION, probability: 0.85, params: { resolutionType: 'CONDEMNATION' } },
    { delay: 12, effectType: ConsequenceEffectType.REFUGEE_FLOW, probability: 0.75, params: { flowAmount: 1.5 } },
    { delay: 15, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.80, params: { marketShock: 35 } },
    { delay: 20, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.60, params: { alignmentShift: 20 } },
    { delay: 18, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.50, params: { riskBoost: 25 } }
  ],
  IMPOSE_SANCTIONS: [
    { delay: 5, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.75, params: { marketShock: 20 } },
    { delay: 10, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.65, params: { riskBoost: 30 } },
    { delay: 15, effectType: ConsequenceEffectType.UN_RESOLUTION, probability: 0.55, params: { resolutionType: 'EMBARGO_DEBATE' } },
    { delay: 20, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.50, params: { alignmentShift: 15 } }
  ],
  SIGN_ALLIANCE: [
    { delay: 6, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.70, params: { marketShock: 10 } },
    { delay: 12, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.65, params: { alignmentShift: 25 } },
    { delay: 18, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.50, params: { riskBoost: 15 } },
    { delay: 24, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.40, params: { severity: 'LIGHT' } }
  ],
  LAUNCH_STRIKE: [
    { delay: 5, effectType: ConsequenceEffectType.UN_RESOLUTION, probability: 0.80, params: { resolutionType: 'STRIKE_CONDEMNATION' } },
    { delay: 9, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.70, params: { severity: 'MEDIUM' } },
    { delay: 13, effectType: ConsequenceEffectType.REFUGEE_FLOW, probability: 0.75, params: { flowAmount: 2.0 } },
    { delay: 17, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.65, params: { marketShock: 25 } },
    { delay: 22, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.60, params: { riskBoost: 20 } }
  ],
  NUCLEAR_ESCALATION: [
    { delay: 2, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 1.00, params: { marketShock: 60 } },
    { delay: 5, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.95, params: { severity: 'CATASTROPHIC' } },
    { delay: 8, effectType: ConsequenceEffectType.UN_RESOLUTION, probability: 0.90, params: { resolutionType: 'EMERGENCY_SECURITY' } },
    { delay: 12, effectType: ConsequenceEffectType.REFUGEE_FLOW, probability: 0.90, params: { flowAmount: 5.0 } },
    { delay: 16, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.80, params: { riskBoost: 40 } },
    { delay: 22, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.70, params: { alignmentShift: 30 } }
  ],
  DISPATCH_FOREIGN_AID: [
    { delay: 4, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.60, params: { marketShock: -10 } },
    { delay: 10, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.50, params: { alignmentShift: 20 } },
    { delay: 16, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.55, params: { riskBoost: -15 } }
  ],
  STAGE_COUP: [
    { delay: 4, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.70, params: { marketShock: 15 } },
    { delay: 8, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.75, params: { riskBoost: 30 } },
    { delay: 12, effectType: ConsequenceEffectType.UN_RESOLUTION, probability: 0.60, params: { resolutionType: 'COUP_INVESTIGATION' } },
    { delay: 18, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.50, params: { severity: 'LIGHT' } }
  ],
  REGIME_CHANGE: [
    { delay: 5, effectType: ConsequenceEffectType.MARKET_REACTION, probability: 0.65, params: { marketShock: 12 } },
    { delay: 10, effectType: ConsequenceEffectType.ALLIANCE_INVITATION, probability: 0.55, params: { alignmentShift: 15 } },
    { delay: 15, effectType: ConsequenceEffectType.SANCTIONS, probability: 0.50, params: { severity: 'MINIMAL_ADJUSTMENT' } },
    { delay: 22, effectType: ConsequenceEffectType.COUP_RISK_INCREASE, probability: 0.45, params: { riskBoost: 15 } }
  ]
};

export class ConsequenceEngine {
  /**
   * Translates a major action context into 3-7 scheduled future tick consequences.
   */
  static register(
    actionType: MajorActionType,
    context: { sourceCountryId: string; targetCountryId?: string; [key: string]: any },
    draft: WorldState
  ) {
    // Notify Sovereign Agents of major geopolitical event
    try {
      useSovereignStore.getState().handleWorldEvent(
        draft,
        actionType,
        context.sourceCountryId,
        context.targetCountryId,
        'HIGH',
        context
      );
    } catch (e) {
      console.warn('Failed to notify Sovereign Agents of event:', e);
    }

    if (!draft.scheduledConsequences) {
      draft.scheduledConsequences = [];
    }

    const effects = CONSEQUENCE_TEMPLATES[actionType];
    if (!effects) {
      console.warn(`No consequence template found for major action: ${actionType}`);
      return;
    }

    const sourceActionId = Math.random().toString(36).substring(7);

    effects.forEach((eff) => {
      const scheduledTick = draft.currentTick + eff.delay;
      const scheduled: ScheduledConsequence = {
        id: Math.random().toString(36).substring(7),
        sourceActionId,
        sourceCountryId: context.sourceCountryId,
        targetCountryId: context.targetCountryId,
        actionType,
        scheduledTick,
        createdAtTick: draft.currentTick,
        effectType: eff.effectType,
        probability: eff.probability,
        params: { ...eff.params, ...context },
        resolved: false,
      };

      draft.scheduledConsequences!.push(scheduled);
    });
  }

  /**
   * Scans due and unresolved consequences, rolls probability, and applies real mutation.
   */
  static tick(currentTick: number, draft: WorldState) {
    if (!draft.scheduledConsequences) {
      draft.scheduledConsequences = [];
    }
    if (!draft.recentResolvedConsequences) {
      draft.recentResolvedConsequences = [];
    }

    // Process all due consequences
    draft.scheduledConsequences.forEach((c) => {
      if (!c.resolved && c.scheduledTick <= currentTick) {
        c.resolved = true;

        // Roll probability
        if (Math.random() <= c.probability) {
          const success = this.resolveEffect(c, draft);
          if (success) {
            draft.recentResolvedConsequences!.push({ ...c, resolved: true });
          }
        }
      }
    });

    // Pacing: Cap history list at 100 entries to prevent memory bloating
    if (draft.recentResolvedConsequences.length > 100) {
      draft.recentResolvedConsequences = draft.recentResolvedConsequences.slice(-100);
    }
  }

  /**
   * Applies the core game-state changes and appends the live-operations command stream warnings.
   */
  private static resolveEffect(c: ScheduledConsequence, draft: WorldState): boolean {
    const source = draft.countries[c.sourceCountryId];
    if (!source) return false;

    const target = c.targetCountryId ? draft.countries[c.targetCountryId] : undefined;
    const sourceName = source.name;
    const targetName = target ? target.name : 'REGIONAL ASSETS';
    const currentTick = draft.currentTick;
    const delayFromAction = currentTick - c.createdAtTick;

    switch (c.effectType) {
      case ConsequenceEffectType.SANCTIONS: {
        if (target) {
          if (!target.economic.sanctionedBy.includes(c.sourceCountryId)) {
            target.economic.sanctionedBy.push(c.sourceCountryId);
          }
          target.economic.gdpGrowthRate = Math.max(-15.0, target.economic.gdpGrowthRate - 0.7);
          target.economic.treasuryCashB = Math.max(0.0, target.economic.treasuryCashB - 14.5);
          target.opinions[c.sourceCountryId] = Math.max(-100, (target.opinions[c.sourceCountryId] ?? 0) - 22);

          // sever mutual trade links
          source.tradePartners = source.tradePartners.filter((id) => id !== c.targetCountryId);
          target.tradePartners = target.tradePartners.filter((id) => id !== c.sourceCountryId);
        } else {
          // Broad fallout: multi-country impact
          Object.keys(draft.countries).forEach((cid) => {
            if (cid !== c.sourceCountryId) {
              const country = draft.countries[cid];
              country.economic.gdpGrowthRate = Math.max(-15.0, country.economic.gdpGrowthRate - 0.25);
            }
          });
        }

        const text = `TICK+${delayFromAction}: GLOBAL SANCTIONS ACTIVATED AGAINST ${targetName.toUpperCase()} BY ${sourceName.toUpperCase()} RESPONSE PROTOCOL`;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: 'WARNING',
        });
        break;
      }

      case ConsequenceEffectType.UN_RESOLUTION: {
        const agressorId = ['DECLARE_WAR', 'LAUNCH_STRIKE', 'NUCLEAR_ESCALATION'].includes(c.actionType)
          ? c.sourceCountryId
          : (c.targetCountryId || c.sourceCountryId);
        
        const offender = draft.countries[agressorId];
        if (offender) {
          offender.political.leaderApprovalRating = Math.max(1, offender.political.leaderApprovalRating - 18);
          offender.political.stabilityIndex = Math.max(5, offender.political.stabilityIndex - 12);

          // Allied block condemns offender
          Object.keys(draft.countries).forEach((cid) => {
            const country = draft.countries[cid];
            if (cid !== agressorId && country.allianceBlock === 'NATO') {
              country.opinions[agressorId] = Math.max(-100, (country.opinions[agressorId] ?? 0) - 20);
            }
          });
        }

        const offenderName = offender ? offender.name : sourceName;
        const text = `TICK+${delayFromAction}: UN SECURITY COUNCIL PASSES RESOLUTION CONDEMNING ${offenderName.toUpperCase()}'S ESCALATORY STANCE`;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: 'INFO',
        });
        break;
      }

      case ConsequenceEffectType.REFUGEE_FLOW: {
        const distressedId = c.targetCountryId || c.sourceCountryId;
        const distressed = draft.countries[distressedId];

        if (distressed) {
          distressed.political.popularUnrest = Math.min(100, distressed.political.popularUnrest + 15);
          distressed.political.stabilityIndex = Math.max(5, distressed.political.stabilityIndex - 12);
          distressed.population = Math.max(0.1, distressed.population - 0.45); // Millions flee

          // visual physical scar placement on map
          try {
            useConsequenceStore.getState().addScar({
              id: 'camp_' + Math.random().toString(36).substring(7),
              type: 'REFUGEE_CAMP',
              countryId: distressedId,
              lat: getCountryCentroid(distressedId).lat + (Math.random() - 0.5) * 1.5,
              lon: getCountryCentroid(distressedId).lon + (Math.random() - 0.5) * 1.5,
              radiusKm: 32,
              createdTick: currentTick,
              severity: 2,
              healingRateTicksPerLevel: 40,
              currentSeverity: 2,
              activeEffects: {
                gdpPenaltyBPerTick: 0.5,
                unrestBonusPerTick: 2,
                stabilityPenaltyPerTick: 1,
              }
            });
          } catch (e) {
            console.error('Error adding map refugee scar', e);
          }

          // Spills into neighbors
          Object.keys(draft.countries).forEach((cid) => {
            const neigh = draft.countries[cid];
            if (cid !== distressedId && neigh.continent === distressed.continent) {
              neigh.economic.treasuryCashB = Math.max(0, neigh.economic.treasuryCashB - 5.0);
              neigh.political.popularUnrest = Math.min(100, neigh.political.popularUnrest + 6);
            }
          });
        }

        const distressedName = distressed ? distressed.name : targetName;
        const text = `TICK+${delayFromAction}: REFUGEE FLOWS DETECTED ESCAPING ${distressedName.toUpperCase()} CROSS-BORDER ESCALATION DEPLOYMENTS`;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: 'WARNING',
        });
        break;
      }

      case ConsequenceEffectType.MARKET_REACTION: {
        const shock = c.params.marketShock || 25;

        if (target) {
          target.economic.gdpB = Math.max(1.0, target.economic.gdpB * (1.0 - (Math.abs(shock) / 300)));
          target.economic.debtStressIndex = Math.min(100, target.economic.debtStressIndex + Math.abs(shock) * 0.45);
        }

        // Global multi-asset shock: spikes oil, natural gas, etc.
        draft.commodityMarkets.forEach((m) => {
          if (['OIL', 'NATURAL_GAS', 'WHEAT'].includes(m.type)) {
            const multiplier = 1.0 + (shock / 100);
            m.spotPriceUSD = Math.round(m.spotPriceUSD * multiplier * 10) / 10;
          }
        });

        const locationName = target ? targetName : 'GLOBAL COMMODITY NETWORKS';
        const panicDir = shock > 0 ? 'CRASH' : 'STABILITY RECOVERY';
        const text = `TICK+${delayFromAction}: ASSET FLIGHT TRIGGERS MARKET ${panicDir} FOR ${locationName.toUpperCase()} EXCHANGE NODES`;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: shock > 0 ? 'CRITICAL' : 'INFO',
        });
        break;
      }

      case ConsequenceEffectType.ALLIANCE_INVITATION: {
        if (target) {
          target.opinions[c.sourceCountryId] = Math.min(100, (target.opinions[c.sourceCountryId] ?? 0) + 30);

          if (target.allianceBlock === 'NEUTRAL' && source.allianceBlock !== 'NEUTRAL') {
            const opinionOfActor = target.opinions[c.sourceCountryId] ?? 0;
            if (opinionOfActor > 65) {
              target.allianceBlock = source.allianceBlock;
            }
          }
        }

        if (source.allianceBlock !== 'NEUTRAL') {
          Object.keys(draft.countries).forEach((cid) => {
            const countryObj = draft.countries[cid];
            if (countryObj.allianceBlock === source.allianceBlock) {
              countryObj.opinions[c.sourceCountryId] = Math.min(100, (countryObj.opinions[c.sourceCountryId] ?? 0) + 15);
            }
          });
        }

        const text = `TICK+${delayFromAction}: BLOC ALIGNMENT PACT PRESSURE DETECTED SIDING WITH president ${sourceName.toUpperCase()}`;
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: 'INFO',
        });
        break;
      }

      case ConsequenceEffectType.COUP_RISK_INCREASE: {
        const boost = c.params.riskBoost || 15;
        const subjectId = c.targetCountryId || c.sourceCountryId;
        const subject = draft.countries[subjectId];

        if (subject) {
          if (boost > 0) {
            subject.political.coupRiskLevel = Math.min(100, subject.political.coupRiskLevel + boost);
            subject.political.stabilityIndex = Math.max(5, subject.political.stabilityIndex - (boost * 0.45));
            subject.political.popularUnrest = Math.min(100, subject.political.popularUnrest + (boost * 0.5));

            // Escalating Coups check
            if (subject.political.coupRiskLevel > 78 && Math.random() < 0.35) {
              const junta = useLeaderStore.getState().generateNewLeader(subjectId, 'COUP', currentTick);
              useLeaderStore.getState().setLeader(subjectId, junta);

              subject.political.leaderName = junta.name;
              subject.economic.treasuryCashB = Math.max(0, subject.economic.treasuryCashB - (subject.economic.gdpB * 0.05));
              subject.political.popularUnrest = Math.min(100, subject.political.popularUnrest + 25);
              subject.political.stabilityIndex = Math.max(5, subject.political.stabilityIndex - 30);
              subject.political.ideology = 'MILITARY_JUNTA';
              subject.atWarWith = [];

              draft.globalEventLog.unshift({
                tick: currentTick,
                text: `COUP DETAT: Military junta overthrows civil administration in ${subject.name}! Gen. ${junta.name} assumes decree.`,
                severity: 'CRITICAL'
              });
            }
          } else {
            // aid, positive stabilizing decrease
            subject.political.coupRiskLevel = Math.max(0, subject.political.coupRiskLevel + boost);
            subject.political.stabilityIndex = Math.min(100, subject.political.stabilityIndex + Math.abs(boost) * 0.5);
            subject.political.popularUnrest = Math.max(0, subject.political.popularUnrest - Math.abs(boost) * 0.4);
          }
        }

        const subjectName = subject ? subject.name : 'Unknown Terrains';
        const text = boost > 0
          ? `TICK+${delayFromAction}: COUP RISK INCREASES IN ${subjectName.toUpperCase()} AS SECUROCRATS MOBILIZE CODES`
          : `TICK+${delayFromAction}: REGIME CORRIDOR STABILIZED: COUP PROBABILITY DAMPENED IN ${subjectName.toUpperCase()}`;
        
        draft.globalEventLog.unshift({
          tick: currentTick,
          text,
          severity: boost > 0 ? 'CRITICAL' : 'INFO',
        });
        break;
      }
    }

    return true;
  }
}
