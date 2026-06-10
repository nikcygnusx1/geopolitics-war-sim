import { create } from 'zustand';
import { produce } from 'immer';

export type ScarType = 
  | 'MISSILE_CRATER'         // conventional strike impact
  | 'NUCLEAR_EXCLUSION_ZONE' // nuclear detonation — permanent, never heals
  | 'INFRASTRUCTURE_RUIN'    // sustained bombing campaign
  | 'REFUGEE_CAMP'           // mass displacement visible on map
  | 'OIL_FIELD_FIRE'         // resource sabotage
  | 'CYBER_BLACKOUT_ZONE'    // sustained EMP/cyber attack
  | 'HAARP_FLOOD_ZONE'       // HAARP weather damage
  | 'FAMINE_ZONE';           // population crisis visible

export interface WorldScar {
  id: string;
  type: ScarType;
  countryId: string;
  lat: number;
  lon: number;
  radiusKm: number;          // affects visual size on map
  createdTick: number;
  severity: 1 | 2 | 3;      // 1=minor, 3=catastrophic
  healingRateTicksPerLevel: number | null;  // null = permanent
  currentSeverity: number;   // can degrade from severity toward 0 (healed)
  activeEffects: {
    gdpPenaltyBPerTick?: number;
    populationLossPerTick?: number;
    unrestBonusPerTick?: number;
    stabilityPenaltyPerTick?: number;
    radiationDeathsPerTick?: number;  // only NUCLEAR
  };
}

interface ConsequenceStoreActions {
  addScar: (scar: WorldScar) => void;
  decayScars: (currentTick: number) => void;
  removeScar: (id: string) => void;
  resetScars: () => void;
}

export const useConsequenceStore = create<{ scars: WorldScar[] } & ConsequenceStoreActions>((set) => ({
  scars: [],

  addScar: (scar) => set(produce((draft: { scars: WorldScar[] }) => {
    draft.scars.push(scar);
  })),

  decayScars: (currentTick) => set(produce((draft: { scars: WorldScar[] }) => {
    draft.scars.forEach((scar) => {
      if (scar.healingRateTicksPerLevel !== null) {
        const ticksSinceCreated = currentTick - scar.createdTick;
        scar.currentSeverity = scar.severity - Math.floor(ticksSinceCreated / scar.healingRateTicksPerLevel);
      }
    });
    // Remove completely healed scars
    draft.scars = draft.scars.filter(s => s.healingRateTicksPerLevel === null || s.currentSeverity > 0);
  })),

  removeScar: (id) => set(produce((draft: { scars: WorldScar[] }) => {
    draft.scars = draft.scars.filter(s => s.id !== id);
  })),

  resetScars: () => set({ scars: [] }),
}));
export default useConsequenceStore;
