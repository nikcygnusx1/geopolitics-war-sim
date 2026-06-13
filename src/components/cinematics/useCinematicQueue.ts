import { create } from 'zustand';
import { CinematicEvent, CinematicEventType } from './types';

interface CinematicQueueState {
  queue: CinematicEvent[];
  activeCinematic: CinematicEvent | null;
  enqueueCinematic: (type: CinematicEventType, data: CinematicEvent['data'], duration?: number) => void;
  skipCurrent: () => void;
  finishCurrent: () => void;
  clearQueue: () => void;
}

export const useCinematicQueue = create<CinematicQueueState>((set, get) => ({
  queue: [],
  activeCinematic: null,

  enqueueCinematic: (type, data, duration = 2800) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const event: CinematicEvent = { id, type, duration, data };

    set((state) => {
      if (!state.activeCinematic) {
        return { activeCinematic: event };
      } else {
        // Prevent stacking duplicate identical events too quickly
        const isDuplicateInRange = state.queue.some(
          (e) => e.type === type && e.data.sourceCountry?.id === data.sourceCountry?.id && e.data.targetCountry?.id === data.targetCountry?.id
        );
        if (isDuplicateInRange) {
          return {}; // skip adding identical bursty duplicate
        }
        return { queue: [...state.queue, event] };
      }
    });
  },

  skipCurrent: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const next = queue[0];
      set({
        activeCinematic: next,
        queue: queue.slice(1)
      });
    } else {
      set({ activeCinematic: null });
    }
  },

  finishCurrent: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const next = queue[0];
      set({
        activeCinematic: next,
        queue: queue.slice(1)
      });
    } else {
      set({ activeCinematic: null });
    }
  },

  clearQueue: () => {
    set({ queue: [], activeCinematic: null });
  }
}));
