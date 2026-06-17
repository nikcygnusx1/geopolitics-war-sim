import { create } from 'zustand';
import { audio } from '../utils/audio';
import { PersonaId, DefconTransitionLog } from '../types/defconPersona';
import { getDefaultPersona } from '../config/defconRegistry';

export type DefconLevel = 5 | 4 | 3 | 2 | 1;

export interface DefconPalette {
  primary: string;
  secondary: string;
  border: string;
  panelBg: string;
  glow: string;
  alertText: string;
  alertColor: string;
}

export const DEFCON_PALETTES: Record<DefconLevel, DefconPalette> = {
  5: {
    primary: '#00ff44', // standard phosphor green
    secondary: '#ffb300',
    border: '#1a5c1a',
    panelBg: '#050a05',
    glow: '0 0 6px rgba(0,255,68,0.8)',
    alertText: 'PEACETIME',
    alertColor: '#00ff44',
  },
  4: {
    primary: '#00ff44',
    secondary: '#ffc107',
    border: '#2a6c2a',
    panelBg: '#060c05',
    glow: '0 0 6px rgba(0,255,68,0.8), 0 0 20px rgba(255,193,7,0.1)',
    alertText: 'WATCH',
    alertColor: '#ffc107',
  },
  3: {
    primary: '#ffb300', // amber takes over as primary
    secondary: '#ff6b00',
    border: '#5c3a00',
    panelBg: '#0a0800',
    glow: '0 0 8px rgba(255,179,0,0.9)',
    alertText: 'ELEVATED',
    alertColor: '#ff6b00',
  },
  2: {
    primary: '#ff6b00', // deep orange
    secondary: '#ff2244',
    border: '#5c1500',
    panelBg: '#0d0300',
    glow: '0 0 10px rgba(255,107,0,0.9), 0 0 30px rgba(255,34,68,0.3)',
    alertText: 'ARMED',
    alertColor: '#ff2244',
  },
  1: {
    primary: '#ff2244', // full red
    secondary: '#ff0000',
    border: '#5c0010',
    panelBg: '#100000',
    glow: '0 0 12px rgba(255,34,68,1.0), 0 0 40px rgba(255,0,0,0.4)',
    alertText: 'NUCLEAR WAR IMMINENT',
    alertColor: '#ff0000',
  },
};

export function applyDefconPalette(level: DefconLevel) {
  const palette = DEFCON_PALETTES[level];
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-secondary', palette.secondary);
  root.style.setProperty('--border-mid', `1px solid ${palette.border}`);
  root.style.setProperty('--color-border', palette.border);
  root.style.setProperty('--bg-panel', palette.panelBg);
  root.style.setProperty('--glow-primary', palette.glow);

  if (typeof document !== 'undefined' && document.body) {
    const body = document.body;
    // Remove any existing defcon classes
    Array.from(body.classList).forEach((cls) => {
      if (cls.startsWith('defcon-')) {
        body.classList.remove(cls);
      }
    });
    // Add the new class
    body.classList.add(`defcon-${level}`);
  }
}

interface DefconStoreActions {
  setDefconLevel: (level: DefconLevel, source: 'SYSTEM' | 'PLAYER' | 'SCENARIO', reason: string, currentTick: number) => void;
  setPersona: (personaId: PersonaId) => void;
  resetDefcon: () => void;
}

interface DefconStoreState {
  currentDefconLevel: DefconLevel;
  activePersona: PersonaId;
  transitionHistory: DefconTransitionLog[];
}

export const useDefconStore = create<DefconStoreState & DefconStoreActions>((set, get) => ({
  currentDefconLevel: 5,
  activePersona: 'ANALYST',
  transitionHistory: [],

  setDefconLevel: (level, source, reason, currentTick) => {
    const current = get().currentDefconLevel;
    if (current !== level) {
      
      const newLog: DefconTransitionLog = {
        id: `defcon_${Date.now()}`,
        tick: currentTick,
        fromLevel: current,
        toLevel: level,
        reason,
        source
      };

      set((state) => ({ 
        currentDefconLevel: level,
        transitionHistory: [newLog, ...state.transitionHistory]
      }));

      // Automatically upgrade persona if required
      const newDefaultPersona = getDefaultPersona(level);
      get().setPersona(newDefaultPersona);

      applyDefconPalette(level);
      
      // Fire synthesized harmony chord signature on DEFCON level transition
      audio.playDefconTransition(level);
      audio.updateAmbientScore(level);
    }
  },

  setPersona: (personaId) => {
    set({ activePersona: personaId });
  },

  resetDefcon: () => {
    set({ 
      currentDefconLevel: 5, 
      activePersona: 'ANALYST',
      transitionHistory: []
    });
    applyDefconPalette(5);
    audio.playDefconTransition(5);
    audio.updateAmbientScore(5);
  },
}));

// Automatic client-side synchronization subscription
if (typeof window !== 'undefined') {
  // Synchronous initial call
  setTimeout(() => {
    applyDefconPalette(useDefconStore.getState().currentDefconLevel);
  }, 0);

  useDefconStore.subscribe((state) => {
    applyDefconPalette(state.currentDefconLevel);
  });
}

export default useDefconStore;
