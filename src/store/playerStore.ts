import { create } from 'zustand';
import { produce } from 'immer';
import { PlayerState, HUDMode, ScenarioId, BallisticStrike } from '../types';
import { useWorldStore } from './worldStore';

interface PlayerStoreActions {
  setHUDMode: (mode: HUDMode) => void;
  setActiveTab: (tab: number) => void;
  setTickSpeed: (speed: PlayerState['tickSpeed']) => void;
  setTargetCountry: (id: string | undefined) => void;
  setPendingStrike: (strike: Partial<BallisticStrike> | undefined) => void;
  setGameOver: (reason: string | undefined) => void;
  setVictory: (reason: string | undefined) => void;
  syncCashFromCountry: () => void;
  syncCashToCountry: () => void;
  initPlayerScenario: (scenarioId: ScenarioId, countryId: string) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerStoreActions>((set, get) => ({
  countryId: 'US',
  hudMode: 'STATE',
  activeTab: 1,
  cashB: 1400.0,
  activeScenario: 'MENA_SPARK',
  scenarioStartTick: 0,
  totalTicks: 0,
  tickSpeed: 'PAUSED',
  selectedTargetCountryId: undefined,
  pendingStrike: undefined,
  gameOver: false,
  gameOverReason: undefined,
  victoryAchieved: false,
  victoryReason: undefined,

  setHUDMode: (mode) => set({ hudMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTickSpeed: (speed) => set({ tickSpeed: speed }),
  setTargetCountry: (id) => set({ selectedTargetCountryId: id }),
  setPendingStrike: (strike) => set({ pendingStrike: strike }),
  setGameOver: (reason) => set({ gameOver: !!reason, gameOverReason: reason }),
  setVictory: (reason) => set({ victoryAchieved: !!reason, victoryReason: reason }),

  syncCashFromCountry: () => {
    const { countryId } = get();
    const worldCountries = useWorldStore.getState().countries;
    const countryObj = worldCountries[countryId];
    if (countryObj) {
      set({ cashB: countryObj.economic.treasuryCashB });
    }
  },

  syncCashToCountry: () => {
    const { countryId, cashB } = get();
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB = cashB;
    });
  },

  initPlayerScenario: (scenarioId, countryId) => {
    set({
      countryId: countryId,
      activeScenario: scenarioId,
      scenarioStartTick: 0,
      totalTicks: 0,
      tickSpeed: 'PAUSED',
      selectedTargetCountryId: undefined,
      pendingStrike: undefined,
      gameOver: false,
      gameOverReason: undefined,
      victoryAchieved: false,
      victoryReason: undefined,
    });
    // Immediately sync starter cash
    const worldCountries = useWorldStore.getState().countries;
    const countryObj = worldCountries[countryId];
    if (countryObj) {
      set({ cashB: countryObj.economic.treasuryCashB });
    }
  },

  resetPlayer: () => set({
    countryId: 'US',
    hudMode: 'STATE',
    activeTab: 1,
    cashB: 1400.0,
    activeScenario: 'MENA_SPARK',
    scenarioStartTick: 0,
    totalTicks: 0,
    tickSpeed: 'PAUSED',
    selectedTargetCountryId: undefined,
    pendingStrike: undefined,
    gameOver: false,
    gameOverReason: undefined,
    victoryAchieved: false,
    victoryReason: undefined,
  }),
}));
