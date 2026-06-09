import { WorldState } from '../types';

export function processSentiment(draft: WorldState) {
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const pol = c.political;
    const econ = c.economic;

    // 1. Domestic propaganda influence on public approval
    const mediaPower = pol.propagandaEffectiveness * (pol.censorship / 100);
    const domesticSpendingShift = (econ.spendingAllocation.propaganda * 15.0);
    const grossShift = (mediaPower * 0.05) + domesticSpendingShift;

    // Leader approval decays naturally or increases based on stability
    let baseApproval = pol.leaderApprovalRating;
    baseApproval += (pol.stabilityIndex - baseApproval) * 0.04 + grossShift;

    // Unrest penalties on approval
    baseApproval -= pol.popularUnrest * 0.15;

    // 2. Active Oligarch corporate control on public messaging
    const loyalOligarchs = econ.oligarchs.filter((o) => o.loyalty > 60);
    loyalOligarchs.forEach((o) => {
      if (o.sector === 'MEDIA') {
        baseApproval += (o.influenceScore / 100) * 2;
      }
    });

    pol.leaderApprovalRating = Math.max(1, Math.min(100, baseApproval));

    // Dynamic unrest decay or increase based on economy and approval
    let unrestDelta = 0;
    if (econ.inflationRate > 15) unrestDelta += 1.8;
    if (pol.leaderApprovalRating < 30) unrestDelta += 2.0;
    if (econ.unemploymentRate > 8.0) unrestDelta += 1.2;

    // Martial law dampening
    if (pol.martialLawActive) {
      unrestDelta -= 3.5;
    } else {
      unrestDelta -= (pol.stabilityIndex / 50); // General peaceful decay
    }

    pol.popularUnrest = Math.max(0, Math.min(100, Math.round((pol.popularUnrest + unrestDelta) * 10) / 10));

    // Decaying martial law duration
    if (pol.martialLawActive && pol.martialLawTicksRemaining > 0) {
      pol.martialLawTicksRemaining--;
      if (pol.martialLawTicksRemaining <= 0) {
        pol.martialLawActive = false;
        c.lastEventLog.unshift('Martial Law rescinded. Sovereign military units returned to barracks.');
      }
    }
  });
}
