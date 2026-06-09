import { create } from 'zustand';
import { produce } from 'immer';
import { BallisticStrike, WeaponType } from '../types';
import { useWorldStore } from './worldStore';

interface InterceptorAlert {
  id: string;
  source: string;
  target: string;
  weapon: WeaponType;
  success: boolean;
  tick: number;
}

interface MilitaryState {
  queuedStrikes: Omit<BallisticStrike, 'progressPct' | 'bezier' | 'status'>[];
  interceptorAlerts: InterceptorAlert[];
  navyPatrolsActive: { [countryId: string]: boolean };
}

interface MilitaryStoreActions {
  queueStrike: (strike: Omit<BallisticStrike, 'progressPct' | 'bezier' | 'status'>) => void;
  dequeueStrike: (id: string) => void;
  clearQueue: () => void;
  addInterceptorAlert: (alert: InterceptorAlert) => void;
  toggleNavyPatrol: (countryId: string) => void;
  resetMilitary: () => void;
}

export const useMilitaryStore = create<MilitaryState & MilitaryStoreActions>((set) => ({
  queuedStrikes: [],
  interceptorAlerts: [],
  navyPatrolsActive: {},

  queueStrike: (strike) => set(produce((draft) => {
    draft.queuedStrikes.push(strike);
  })),

  dequeueStrike: (id) => set(produce((draft) => {
    draft.queuedStrikes = draft.queuedStrikes.filter((s: any) => s.id !== id);
  })),

  clearQueue: () => set({ queuedStrikes: [] }),

  addInterceptorAlert: (alert) => set(produce((draft) => {
    draft.interceptorAlerts.unshift(alert);
    if (draft.interceptorAlerts.length > 50) {
      draft.interceptorAlerts.pop();
    }
  })),

  toggleNavyPatrol: (countryId) => set(produce((draft) => {
    draft.navyPatrolsActive[countryId] = !draft.navyPatrolsActive[countryId];
  })),

  resetMilitary: () => set({
    queuedStrikes: [],
    interceptorAlerts: [],
    navyPatrolsActive: {},
  }),
}));
