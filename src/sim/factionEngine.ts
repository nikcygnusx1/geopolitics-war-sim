import { WorldState, Country } from '../types';
import { useLeaderStore } from '../store/leaderStore';
import { ConsequenceEngine } from './consequenceEngine';

export function processFactions(draft: WorldState) {
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const pol = c.political;
    const econ = c.economic;

    pol.factions.forEach((faction) => {
      // 1. Evaluate demand satisfied score based on nation's policies
      let demandsSatisfied = 50;

      if (faction.type === 'MILITARY_HARDLINERS') {
        // satisfaction depends on military budget and active conflicts
        const milAlloc = econ.spendingAllocation.military;
        demandsSatisfied = milAlloc > 0.25 ? 80 : milAlloc < 0.15 ? 20 : 50;
        if (c.atWarWith.length > 0) demandsSatisfied += 15;
      } else if (faction.type === 'REFORMERS') {
        // Reformers demand low censorship, high education and healthcare
        const wellnessAlloc = econ.spendingAllocation.healthcare + econ.spendingAllocation.education;
        demandsSatisfied = pol.censorship < 30 ? 75 : pol.censorship > 70 ? 25 : 50;
        if (wellnessAlloc > 0.35) demandsSatisfied += 15;
      } else if (faction.type === 'OLIGARCHS') {
        // Oligarchs demand low corporate tax rates and printing press
        demandsSatisfied = econ.corporateTaxRate < 15 ? 80 : econ.corporateTaxRate > 25 ? 30 : 50;
        if (econ.printingPressActive) demandsSatisfied += 15;
      }

      faction.demandsMetScore = Math.max(0, Math.min(100, demandsSatisfied));

      // 2. Faction strength growth/decay
      if (faction.demandsMetScore < 40) {
        faction.strengthIndex = Math.min(100, faction.strengthIndex + 2);
      } else if (faction.demandsMetScore > 75) {
        faction.strengthIndex = Math.max(5, faction.strengthIndex - 1.5);
      }

      // 3. Rebellion trigger if strength is peak and stability is crushed
      if (faction.strengthIndex > 78 && pol.stabilityIndex < 35 && !faction.isRebelling) {
        // 10% chance per tick of outright civil war
        if (Math.random() < 0.12) {
          faction.isRebelling = true;
          pol.popularUnrest = Math.min(100, pol.popularUnrest + 25);
          pol.stabilityIndex = Math.max(0, pol.stabilityIndex - 20);
          econ.gdpB *= 0.94; // 6% GDP drop from rebellion

          draft.globalEventLog.unshift({
            tick: draft.currentTick,
            text: `CIVIL OUTBREAK: Armed rebellion by ${faction.type} reported in ${c.name}! Regional command divisions are split.`,
            severity: 'CRITICAL',
          });
          c.lastEventLog.unshift(`Civil combat! Armed faction rebels claim regional quarters.`);
        }
      }
    });

    // 4. Coup check for non-democratic systems (Autocracies, Military Juntas, Theocracies)
    if (pol.ideology !== 'DEMOCRACY' && pol.ideology !== 'TECHNOCRACY' && !pol.martialLawActive) {
      const milFaction = pol.factions.find(f => f.type === 'MILITARY_HARDLINERS');
      const militaryMuscle = milFaction ? milFaction.strengthIndex : 30;

      const coupRisk = (pol.popularUnrest * 0.4) + (100 - pol.stabilityIndex) * 0.4 + (militaryMuscle * 0.2);
      pol.coupRiskLevel = Math.round(coupRisk);

      if (coupRisk > 85 && Math.random() < 0.1) {
        executeCoup(draft, c);
      }
    }
  });
}

function executeCoup(draft: WorldState, c: Country) {
  const pol = c.political;
  const econ = c.economic;

  // Register the consequence chain
  ConsequenceEngine.register('STAGE_COUP', { sourceCountryId: c.id }, draft);

  // Generate and set junta leader deterministically
  const juntaLeader = useLeaderStore.getState().generateNewLeader(c.id, 'COUP', draft.currentTick);
  useLeaderStore.getState().setLeader(c.id, juntaLeader);

  pol.leaderName = juntaLeader.name;
  econ.treasuryCashB = Math.max(0, econ.treasuryCashB - (econ.gdpB * 0.05)); // Looting
  pol.popularUnrest = Math.min(100, pol.popularUnrest + 25);
  pol.stabilityIndex = Math.max(5, pol.stabilityIndex - 30);
  pol.ideology = 'MILITARY_JUNTA';

  // Dissolve active wars or escalate arbitrarily
  c.atWarWith = [];

  draft.globalEventLog.unshift({
    tick: draft.currentTick,
    text: `COUP DETAT: Military hardliners declare Martial Emergency in ${c.name}. General ${juntaLeader.name} (TEMPERAMENT: ${juntaLeader.type}) gains full executive power!`,
    severity: 'CRITICAL',
  });
  c.lastEventLog.unshift(`Government overthrown! General ${juntaLeader.name} takes control of supreme defense nodes.`);
}
