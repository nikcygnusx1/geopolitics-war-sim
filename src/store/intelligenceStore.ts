import { create } from 'zustand';
import { produce } from 'immer';
import { CovertOp, CovertOpType } from '../types';
import { useWorldStore } from './worldStore';
import { usePlayerStore } from './playerStore';

interface IntelState {
  satelliteTaskings: { [satelliteId: string]: string }; // satelliteId -> countryId target
  activeHackingCampaigns: { id: string; targetId: string; opType: CovertOpType; progress: number }[];
  intelReports: { tick: number; title: string; content: string; severity: 'INFO' | 'WARNING' | 'CRITICAL' }[];
}

interface IntelStoreActions {
  taskSatellite: (satelliteId: string, countryId: string) => void;
  launchCovertIntelOp: (op: CovertOp) => boolean;
  addIntelReport: (title: string, content: string, severity?: IntelState['intelReports'][0]['severity']) => void;
  resetIntel: () => void;
}

export const useIntelligenceStore = create<IntelState & IntelStoreActions>((set) => ({
  satelliteTaskings: {},
  activeHackingCampaigns: [],
  intelReports: [],

  taskSatellite: (satelliteId, countryId) => set(produce((draft) => {
    draft.satelliteTaskings[satelliteId] = countryId;
    useWorldStore.getState().addGlobalEvent(`Orbital Recon: Satellite ${satelliteId} targeted onto coverage zone: ${countryId}. Calibration active.`, 'INFO');
  })),

  launchCovertIntelOp: (op) => {
    const playerCountryId = usePlayerStore.getState().countryId;
    const playerCash = usePlayerStore.getState().cashB;
    if (playerCash < op.costB) return false;

    // Deduct cost
    usePlayerStore.setState((state) => ({ cashB: state.cashB - op.costB }));
    usePlayerStore.getState().syncCashToCountry();

    // Add to player country intelligence covert ops list in the world state
    useWorldStore.getState().updateCountry(playerCountryId, (c) => {
      c.intelligence.activeCovertOps.push(op);
    });

    useWorldStore.getState().addGlobalEvent(`Signals command: Covert op assigned to target ${op.targetCountryId}. Penetration team dispatched.`, 'WARNING');
    return true;
  },

  addIntelReport: (title, content, severity = 'INFO') => set(produce((draft) => {
    draft.intelReports.unshift({
      tick: useWorldStore.getState().currentTick,
      title: title,
      content: content,
      severity: severity,
    });
    if (draft.intelReports.length > 100) {
      draft.intelReports.pop();
    }
  })),

  resetIntel: () => set({
    satelliteTaskings: {},
    activeHackingCampaigns: [],
    intelReports: [],
  }),
}));
