import { create } from 'zustand';
import { audio } from '../utils/audio';

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
  setDefconLevel: (level: DefconLevel) => void;
  resetDefcon: () => void;
}

export const useDefconStore = create<{ currentDefconLevel: DefconLevel } & DefconStoreActions>((set, get) => ({
  currentDefconLevel: 5,

  setDefconLevel: (level) => {
    const current = get().currentDefconLevel;
    if (current !== level) {
      set({ currentDefconLevel: level });
      applyDefconPalette(level);
      
      // Fire SFX
      if (level < current) {
        if (level === 1) {
          audio.sfxKlaxon();
        } else {
          audio.sfxKlaxon();
        }
      }
      audio.updateAmbientScore(level);
    }
  },

  resetDefcon: () => {
    set({ currentDefconLevel: 5 });
    applyDefconPalette(5);
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
