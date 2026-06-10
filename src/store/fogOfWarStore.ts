import { create } from 'zustand';
import { produce } from 'immer';

export type IntelLevel = 0 | 1 | 2 | 3;

export interface FogEntry {
  intelLevel: IntelLevel;
  lastUpdatedTick: number;
  decayRateTicks: number;
}

export interface FogState {
  [countryId: string]: FogEntry;
}

interface FogOfWarActions {
  initFog: (playerCountryId: string, alliancePartners: string[], startingIntelMode?: 'BLIND' | 'PARTIAL' | 'FULL') => void;
  setIntelLevel: (countryId: string, level: IntelLevel, tick: number) => void;
  decayIntel: (currentTick: number) => void;
  investIntel: (countryId: string, costB: number, tick: number) => void;
  resetFog: () => void;
}

export const useFogOfWarStore = create< { fog: FogState } & FogOfWarActions>((set, get) => ({
  fog: {},

  initFog: (playerCountryId, alliancePartners, startingIntelMode = 'PARTIAL') => set(produce((draft: { fog: FogState }) => {
    const defaultDecay = 30;
    draft.fog = {};

    // Seed defaults first for standard country list (we'll support any country ID)
    const allIds = ['US', 'CN', 'IN', 'PK', 'IL', 'PS', 'IR', 'RU', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW', 'UA', 'NG', 'ID', 'MX', 'VN', 'PL', 'NL', 'ES', 'IT', 'CA', 'AR', 'CO', 'ET', 'KE', 'MA', 'DZ', 'LY', 'SY', 'IQ', 'YE', 'KZ', 'UZ', 'MM', 'TH', 'MY', 'BD', 'PH', 'FI', 'SE', 'BY', 'RS', 'AZ', 'AM'];

    allIds.forEach(id => {
      let startingLevel: IntelLevel = 0;
      if (startingIntelMode === 'FULL') {
        startingLevel = 3;
      } else if (startingIntelMode === 'BLIND') {
        startingLevel = id === playerCountryId ? 3 : 0;
      } else {
        // PARTIAL MODE
        if (id === playerCountryId) {
          startingLevel = 3;
        } else if (alliancePartners.includes(id)) {
          startingLevel = 2;
        } else {
          startingLevel = 1; // BASIC default for partial map
        }
      }

      draft.fog[id] = {
        intelLevel: startingLevel,
        lastUpdatedTick: 0,
        decayRateTicks: defaultDecay,
      };
    });
  })),

  setIntelLevel: (countryId, level, tick) => set(produce((draft: { fog: FogState }) => {
    if (!draft.fog[countryId]) {
      draft.fog[countryId] = { intelLevel: 0, lastUpdatedTick: 0, decayRateTicks: 30 };
    }
    draft.fog[countryId].intelLevel = level;
    draft.fog[countryId].lastUpdatedTick = tick;
  })),

  decayIntel: (currentTick) => set(produce((draft: { fog: FogState }) => {
    Object.keys(draft.fog).forEach((id) => {
      const entry = draft.fog[id];
      if (entry.intelLevel > 0) {
        const elapsed = currentTick - entry.lastUpdatedTick;
        if (elapsed > entry.decayRateTicks) {
          entry.intelLevel = Math.max(0, entry.intelLevel - 1) as IntelLevel;
          entry.lastUpdatedTick = currentTick;
          entry.decayRateTicks = 30; // resets or degrades
        }
      }
    });
  })),

  investIntel: (countryId, costB, tick) => set(produce((draft: { fog: FogState }) => {
    const entry = draft.fog[countryId];
    if (entry) {
      entry.intelLevel = Math.min(3, entry.intelLevel + 1) as IntelLevel;
      entry.lastUpdatedTick = tick;
    }
  })),

  resetFog: () => set({ fog: {} }),
}));
export default useFogOfWarStore;
