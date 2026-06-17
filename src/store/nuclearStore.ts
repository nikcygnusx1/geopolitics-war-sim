import { create } from 'zustand';
import { useDefconStore, DefconLevel } from './defconStore';
import { useWorldStore } from './worldStore';

export interface NuclearScar {
  id: string;
  lat: number;
  lon: number;
  radius: number;
  megatons: number;
  timestamp: number;
}

interface NuclearState {
  nuclearScars: NuclearScar[];
  totalMegatons: number;
  flashOpacity: number; // 0 to 1
  addScar: (lat: number, lon: number, megatons: number) => void;
  triggerFlash: () => void;
  decrementFlash: (delta: number) => void;
  clearScars: () => void;
}

// Read initial values from localStorage for persistent preservation across reloads
const LOCAL_STORAGE_SCARS_KEY = 'sovereign_nuclear_scars';
const LOCAL_STORAGE_MEGATONS_KEY = 'sovereign_nuclear_megatons';

const initialScars: NuclearScar[] = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCARS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved nuclear scars:', e);
      }
    }
  }
  return [];
})();

const initialMegatons = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_MEGATONS_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      return isNaN(parsed) ? 0 : parsed;
    }
  }
  return 0;
})();

export const useNuclearStore = create<NuclearState>((set, get) => ({
  nuclearScars: initialScars,
  totalMegatons: initialMegatons,
  flashOpacity: 0,

  addScar: (lat, lon, megatons) => {
    const newScar: NuclearScar = {
      id: `scar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lat,
      lon,
      radius: 0.05 + Math.min(0.03, megatons * 0.008), // size scales slightly with megatons, approx 200km to 300km
      megatons,
      timestamp: Date.now()
    };

    const nextScars = [...get().nuclearScars, newScar].slice(-15); // Keep last 15 scars for shader/perf safety
    const nextMegatons = get().totalMegatons + megatons;

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_SCARS_KEY, JSON.stringify(nextScars));
      localStorage.setItem(LOCAL_STORAGE_MEGATONS_KEY, nextMegatons.toString());
    }

    set({
      nuclearScars: nextScars,
      totalMegatons: nextMegatons
    });

    // Decrease DEFCON level on nuclear impact of any yield
    const currentDefcon = useDefconStore.getState().currentDefconLevel;
    if (currentDefcon > 1) {
      const nextDefcon = (currentDefcon - 1) as DefconLevel;
      const currentTick = useWorldStore.getState().currentTick;
      useDefconStore.getState().setDefconLevel(nextDefcon, 'SYSTEM', 'Nuclear detonation detected', currentTick);
    }
  },

  triggerFlash: () => {
    set({ flashOpacity: 1.0 });
  },

  decrementFlash: (delta) => {
    set((state) => ({ flashOpacity: Math.max(0, state.flashOpacity - delta) }));
  },

  clearScars: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_SCARS_KEY);
      localStorage.setItem(LOCAL_STORAGE_MEGATONS_KEY, '0');
    }
    set({ nuclearScars: [], totalMegatons: 0 });
  }
}));
