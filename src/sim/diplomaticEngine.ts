import { WorldState } from '../types';
import { dampenOpinionDelta } from '../utils/pacing';
import { useLeaderStore } from '../store/leaderStore';

export function processRelations(draft: WorldState) {
  const countryIds = Object.keys(draft.countries);

  for (let i = 0; i < countryIds.length; i++) {
    for (let j = 0; j < countryIds.length; j++) {
      const aId = countryIds[i];
      const bId = countryIds[j];
      if (aId === bId) continue;

      const a = draft.countries[aId];
      const b = draft.countries[bId];

      if (!a || !b) continue;

      // Authoritative modifiers lookup
      const leaderStore = useLeaderStore.getState();
      const leaderMods = leaderStore.getLeaderModifiers(aId, bId, draft.currentTick);

      // 1. Natural opinion drift
      let currentOpinion = a.opinions[bId] ?? 0;
      currentOpinion += (0 - currentOpinion) * 0.005;

      // 2. Active war penalty (multiplied by escalation rate)
      if (a.atWarWith.includes(bId)) {
        const drop = dampenOpinionDelta(-3.5, draft.pacingPreset) * leaderMods.escalationRate;
        currentOpinion = Math.max(-100, currentOpinion + drop);
      }

      // 3. Shared alliance bonus
      if (a.allianceBlock !== 'NEUTRAL' && a.allianceBlock === b.allianceBlock) {
        currentOpinion = Math.min(100, currentOpinion + 0.8);
      }

      // 4. Shared enemy bonus
      const aEnemies = a.atWarWith;
      const bEnemies = b.atWarWith;
      const sharedEnemies = aEnemies.filter((enemyId) => bEnemies.includes(enemyId));
      if (sharedEnemies.length > 0) {
        currentOpinion = Math.min(100, currentOpinion + (sharedEnemies.length * 0.5));
      }

      // 5. HAARP targeting penalty (multiplied by escalation rate)
      if (b.haarpActive && b.haarpTargetCountryId === aId) {
        const drop = dampenOpinionDelta(-10.0, draft.pacingPreset) * leaderMods.escalationRate;
        currentOpinion = Math.max(-100, currentOpinion + drop);
        a.political.popularUnrest = Math.min(100, a.political.popularUnrest + 2);
      }

      // Save updated opinion
      a.opinions[bId] = Math.round(currentOpinion * 10) / 10;
    }
  }

  // Evaluate treaty and trade updates based on opinions
  countryIds.forEach((id) => {
    const c = draft.countries[id];

    // AI Alliance logic
    if (c.allianceBlock === 'NEUTRAL' && id !== 'US' && id !== 'CN') {
      // NATO anchor is US, SCO anchor is CN
      const usOpinion = c.opinions['US'] ?? 0;
      const cnOpinion = c.opinions['CN'] ?? 0;

      const leaderMods = useLeaderStore.getState().getLeaderModifiers(id, undefined, draft.currentTick);
      const joinThreshold = 70 / leaderMods.diplomacyAcceptMultiplier;

      if (usOpinion > joinThreshold) {
        c.allianceBlock = 'NATO';
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: `Diplomacy: ${c.name} formally joins NATO Alliance block.`,
          severity: 'INFO',
        });
      } else if (cnOpinion > joinThreshold) {
        c.allianceBlock = 'SCO';
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: `Diplomacy: ${c.name} signs mutual defense pact and enters SCO Block.`,
          severity: 'INFO',
        });
      }
    }

    // Dynamic trade partnerships reduction if opinions drop too low
    c.tradePartners = countryIds.filter((otherId) => {
      if (otherId === id) return false;
      const op = c.opinions[otherId] ?? 0;
      return op > -30;
    }).slice(0, 6);

    // Apply Tariffs decay on GDP growth rate
    if (c.tariffs) {
      Object.keys(c.tariffs).forEach((targetId) => {
        const tariff = c.tariffs?.[targetId] || 0;
        if (tariff > 10) {
          // Reduces GDP growth of both countries slightly
          c.economic.gdpGrowthRate *= 0.98;
          const target = draft.countries[targetId];
          if (target) {
            target.economic.gdpGrowthRate *= 0.98;
          }
        }
      });
    }
  });
}
