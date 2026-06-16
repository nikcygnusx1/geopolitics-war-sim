import { CanonicalWorld, TreatyState } from '../../types';
import { useTreatyStore } from '../../store/treatyStore';
import { RichTreatyState } from '../../types/treaty';

export function resolveTreaties(world: CanonicalWorld, currentTick: number): { updatedTreaties: Record<string, TreatyState>; logs: string[] } {
  const updatedTreaties = { ...world.treatiesById };
  const logs: string[] = [];

  // Ticking hook for the treaty store to process legacy effects and store fatigue
  try {
    useTreatyStore.getState().tickTreatySimulation(currentTick);
  } catch (err) {
    console.error("Error ticking treaty store", err);
  }

  const fatigueMap = useTreatyStore.getState().treatyFatigueByCountry;

  Object.keys(updatedTreaties).forEach((id) => {
    const treaty = { ...updatedTreaties[id] };

    if (treaty.status === 'ACTIVE') {
      // Compliance drift over time relative to signatory stability
      Object.keys(treaty.complianceByCountry).forEach((cid) => {
        const countryState = world.countriesById[cid];
        if (countryState) {
          let compliance = treaty.complianceByCountry[cid];
          
          // Strains inside the sovereign country reduce compliance
          if (countryState.regimeStability < 50) {
            compliance = Math.max(20, compliance - 1);
          } else if (countryState.regimeStability > 75) {
            compliance = Math.min(100, compliance + 1);
          }

          // Serious popular unrest causes compliance risk
          if (countryState.unrest > 75) {
            compliance = Math.max(10, compliance - 1.5);
          }

          // Treaty fatigue compliance penalty
          const fatigue = fatigueMap[cid] ?? 0;
          if (fatigue > 60) {
            compliance = Math.max(10, compliance - 0.8);
          }

          treaty.complianceByCountry[cid] = Math.round(compliance);

          // Log major non-compliance
          if (compliance < 45 && !treaty.violationHistory.includes(`${cid}_unstable_${currentTick}`)) {
            treaty.violationHistory.push(`${cid}_unstable_${currentTick}`);
            logs.push(`Treaty Compliance Risk: Signature partner ${cid} reports falling compliance on "${treaty.name}"!`);
          }
        }
      });

      // Secret protocol leak exposure simulation
      const rich = treaty as RichTreatyState;
      if (rich.hiddenProtocols && rich.hiddenProtocols.length > 0) {
        rich.hiddenProtocols.forEach((p) => {
          if (!p.exposed && Math.random() < 0.05) { // 5% chance of SIGINT exposure per tick under tension
            p.exposed = true;
            logs.push(`Intelligence Leak: Secret annex "${p.title}" of "${treaty.name}" exposed by external SIGINT intercept!`);
            
            // Scar trust in signatories
            rich.signatoryCountryIds.forEach(scid => {
              if (world.countriesById[scid]) {
                const draftMemory = useTreatyStore.getState().credibilityMemories[scid];
                if (draftMemory) {
                  draftMemory.overallScore = Math.max(5, draftMemory.overallScore - 12);
                }
              }
            });
          }
        });
      }

      // Expiration check
      if (treaty.expirationTick !== null && currentTick >= treaty.expirationTick) {
        treaty.status = 'EXPIRED';
        logs.push(`Treaty Expiration: Mutual Accord "${treaty.name}" expired naturally.`);
      }
    }

    updatedTreaties[id] = treaty;
  });

  return { updatedTreaties, logs };
}
