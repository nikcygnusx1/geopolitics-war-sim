import { create } from 'zustand';

export type CinematicSceneType =
  | 'SCENARIO_BOOT'           // Cold boot intro on first load
  | 'SCENARIO_START'        // When player starts a new scenario
  | 'PRESIDENTIAL_DAILY_BRIEF' // Session start / daily overview
  | 'DEFCON_1_LOCKDOWN'     // Full DEFCON 1 nuclear war protocols
  | 'NUCLEAR_EXCHANGE'      // Multiple strikes confirmed
  | 'NUCLEAR_AFTERMATH'     // Post-exchange epilogue
  | 'REGIME_CHANGE_SEQUENCE'// Country's government falls
  | 'COUP_NARRATIVE'        // Successful coup cinematic
  | 'CEASEFIRE_EPILOGUE'    // War ends, nations stand down
  | 'PEACE_TREATY_CEREMONY' // Full treaty ratification moment
  | 'ALLIANCE_SUMMIT'       // New bloc or pact formed
  | 'MARKET_CRASH_BROADCAST'// Economic collapse broadcast
  | 'CYBER_WAR_DECLARATION' // Full-scale cyber war begins
  | 'OPERATIVE_BURNED_REPORT'// Deep cover agent compromised
  | 'NUCLEAR_DETERRENCE_WIN' // MAD achieved, war prevented
  | 'GAME_OVER_DEFEAT'      // Total collapse ending
  | 'GAME_OVER_VICTORY';    // Sovereign dominance achieved

export interface CinematicScene {
  id: string;
  type: CinematicSceneType;
  phase: number;              // which step we're on (0-indexed)
  totalPhases: number;        // total steps in this scene
  isActive: boolean;
  isPaused: boolean;
  isSkippable: boolean;
  blocksInput: boolean;       // true = player cannot interact during scene
  startedAt: number;          // Date.now()
  phaseDurationMs: number;    // how long current phase lasts
  payload: Record<string, any>; // countryId, leaderName, etc.
  autoAdvance: boolean;       // true = phases advance automatically
}

export interface CinematicsStoreState {
  activeScene: CinematicScene | null;
  sceneQueue: CinematicScene[];    // scenes waiting to play
  sceneHistory: CinematicScene[];  // last 10 completed scenes
  isAnySceneActive: boolean;
  isInputBlocked: boolean;
  cinematicVolume: number;         // 0-1 for music during scenes
  
  queueScene: (input: Omit<CinematicScene, 'id' | 'phase' | 'isActive' | 'startedAt' | 'isPaused'>) => void;
  advancePhase: () => void;
  completeScene: () => void;
  skipScene: () => void;
  pauseScene: () => void;
  resumeScene: () => void;
  clearAllScenes: () => void;
}

// Module-level timer reference for scheduling auto-advances cleanly
let currentAdvanceTimeout: any = null;

function clearAdvanceTimer() {
  if (currentAdvanceTimeout !== null) {
    clearTimeout(currentAdvanceTimeout);
    currentAdvanceTimeout = null;
  }
}

export const useCinematicsStore = create<CinematicsStoreState>((set, get) => {
  
  const schedulePhaseAdvance = () => {
    clearAdvanceTimer();
    const { activeScene, advancePhase } = get();
    if (activeScene && activeScene.isActive && !activeScene.isPaused && activeScene.autoAdvance) {
      currentAdvanceTimeout = setTimeout(() => {
        advancePhase();
      }, activeScene.phaseDurationMs);
    }
  };

  const startNextScene = () => {
    const { sceneQueue } = get();
    if (sceneQueue.length === 0) return;

    const nextScene = { ...sceneQueue[0] };
    const remainingQueue = sceneQueue.slice(1);

    const activeScene: CinematicScene = {
      ...nextScene,
      isActive: true,
      phase: 0,
      isPaused: false,
      startedAt: Date.now(),
    };

    set({
      activeScene,
      sceneQueue: remainingQueue,
      isAnySceneActive: true,
      isInputBlocked: activeScene.blocksInput,
    });

    // Trigger audio routing dynamically based on custom active scene and phase
    try {
      const audioModule = (window as any).sovereignAudio || require('../utils/audio').audio;
      if (audioModule && typeof audioModule.playCinematicCue === 'function') {
        audioModule.playCinematicCue(activeScene.type, 0);
      }
    } catch (e) {
      console.warn('Cinematic audio routing direct integration failed:', e);
    }

    schedulePhaseAdvance();
  };

  return {
    activeScene: null,
    sceneQueue: [],
    sceneHistory: [],
    isAnySceneActive: false,
    isInputBlocked: false,
    cinematicVolume: 0.7,

    queueScene: (input) => {
      const id = `${input.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const pendingScene: CinematicScene = {
        ...input,
        id,
        phase: 0,
        isActive: false,
        isPaused: false,
        startedAt: 0,
      };

      set((state) => {
        const nextQueue = [...state.sceneQueue, pendingScene];
        return { sceneQueue: nextQueue };
      });

      // If no active scene is running, immediately boot next
      const { activeScene } = get();
      if (!activeScene) {
        startNextScene();
      }
    },

    advancePhase: () => {
      const { activeScene, completeScene } = get();
      if (!activeScene) return;

      const nextPhase = activeScene.phase + 1;
      if (nextPhase >= activeScene.totalPhases) {
        completeScene();
      } else {
        const updatedScene: CinematicScene = {
          ...activeScene,
          phase: nextPhase,
        };

        set({ activeScene: updatedScene });

        // Trigger cinematic audio routing for next phase
        try {
          const audioModule = (window as any).sovereignAudio || require('../utils/audio').audio;
          if (audioModule && typeof audioModule.playCinematicCue === 'function') {
            audioModule.playCinematicCue(updatedScene.type, nextPhase);
          }
        } catch (e) {
          // fallback
        }

        schedulePhaseAdvance();
      }
    },

    completeScene: () => {
      clearAdvanceTimer();
      const { activeScene, sceneHistory } = get();
      
      const newHistory = activeScene 
        ? [activeScene, ...sceneHistory].slice(0, 10)
        : sceneHistory;

      set({
        activeScene: null,
        isAnySceneActive: false,
        isInputBlocked: false,
        sceneHistory: newHistory,
      });

      // Restore system volume values
      try {
        const audioModule = (window as any).sovereignAudio || require('../utils/audio').audio;
        if (audioModule && typeof audioModule.restoreSimVolume === 'function') {
          audioModule.restoreSimVolume(1200);
        }
      } catch (e) {}

      // Start next queued item if any exists
      startNextScene();
    },

    skipScene: () => {
      const { activeScene, completeScene } = get();
      if (activeScene && activeScene.isSkippable) {
        completeScene();
      }
    },

    pauseScene: () => {
      const { activeScene } = get();
      if (activeScene) {
        clearAdvanceTimer();
        set({
          activeScene: {
            ...activeScene,
            isPaused: true,
          }
        });
      }
    },

    resumeScene: () => {
      const { activeScene } = get();
      if (activeScene && activeScene.isPaused) {
        set({
          activeScene: {
            ...activeScene,
            isPaused: false,
          }
        });
        schedulePhaseAdvance();
      }
    },

    clearAllScenes: () => {
      clearAdvanceTimer();
      set({
        activeScene: null,
        sceneQueue: [],
        isAnySceneActive: false,
        isInputBlocked: false,
      });
    },
  };
});
