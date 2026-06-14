import { create } from 'zustand';
import { produce } from 'immer';
import { ArmsDeal, CommodityType } from '../types';
import { useWorldStore } from './worldStore';
import { usePlayerStore } from './playerStore';

interface LedgerEntry {
  id: string;
  tick: number;
  type: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | 'EMBARGO' | 'TARIFF';
  details: string;
  financialImpactB: number;
}

interface EconomyState {
  portfolioFutures: { [key in CommodityType]?: number }; // holds in billions worth
  portfolioShorts: { [key in CommodityType]?: number };  // short holdings
  tradeLedger: LedgerEntry[];
  activeSanctions: { source: string; target: string }[];
}

interface EconomyStoreActions {
  buyFutures: (commodity: CommodityType, amountB: number, costPerUnit: number) => boolean;
  shortCommodity: (commodity: CommodityType, amountB: number, costPerUnit: number) => boolean;
  addArmsDeal: (deal: ArmsDeal) => void;
  imposeSanction: (sourceId: string, targetId: string) => void;
  removeSanction: (sourceId: string, targetId: string) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'tick'>) => void;
  resetEconomy: () => void;
}

export const useEconomyStore = create<EconomyState & EconomyStoreActions>((set, get) => ({
  portfolioFutures: {},
  portfolioShorts: {},
  tradeLedger: [],
  activeSanctions: [],

  buyFutures: (commodity, amountB, costPerUnit) => {
    const playerCash = usePlayerStore.getState().cashB;
    if (playerCash < amountB) return false;

    // Deduct cash from player store
    usePlayerStore.setState((state) => ({ cashB: state.cashB - amountB }));
    usePlayerStore.getState().syncCashToCountry();

    set(produce((draft) => {
      draft.portfolioFutures[commodity] = (draft.portfolioFutures[commodity] || 0) + (amountB / costPerUnit);
      draft.tradeLedger.unshift({
        id: Math.random().toString(),
        tick: useWorldStore.getState().currentTick,
        type: 'BUY',
        details: `Purchased $${amountB}B futures in ${commodity} at spot rate of $${costPerUnit.toFixed(2)}`,
        financialImpactB: -amountB,
      });
    }));

    useWorldStore.getState().addGlobalEvent(`Financial desk: Institutional client locks $${amountB}B futures in ${commodity} index.`, 'INFO');
    return true;
  },

  shortCommodity: (commodity, amountB, costPerUnit) => {
    const playerCash = usePlayerStore.getState().cashB;
    if (playerCash < amountB) return false;

    usePlayerStore.setState((state) => ({ cashB: state.cashB - amountB }));
    usePlayerStore.getState().syncCashToCountry();

    set(produce((draft) => {
      draft.portfolioShorts[commodity] = (draft.portfolioShorts[commodity] || 0) + (amountB / costPerUnit);
      draft.tradeLedger.unshift({
        id: Math.random().toString(),
        tick: useWorldStore.getState().currentTick,
        type: 'SHORT',
        details: `Shorted $${amountB}B in ${commodity} at spot rate of $${costPerUnit.toFixed(2)}`,
        financialImpactB: -amountB,
      });
    }));

    useWorldStore.getState().addGlobalEvent(`Financial desk: Short positions opened on ${commodity} index totaling $${amountB}B.`, 'INFO');
    return true;
  },

  addArmsDeal: (deal) => {
    useWorldStore.getState().applyTickDelta((draft) => {
      draft.activeArmsDeals.push(deal);
    });
  },

  imposeSanction: (sourceId, targetId) => {
    set(produce((draft) => {
      const exists = draft.activeSanctions.some((s) => s.source === sourceId && s.target === targetId);
      if (!exists) {
        draft.activeSanctions.push({ source: sourceId, target: targetId });
      }
    }));
    useWorldStore.getState().updateCountry(targetId, (c) => {
      if (!c.economic.sanctionedBy.includes(sourceId)) {
        c.economic.sanctionedBy.push(sourceId);
      }
    });
    useWorldStore.getState().registerConsequenceChain('IMPOSE_SANCTIONS', { sourceCountryId: sourceId, targetCountryId: targetId });
    useWorldStore.getState().addGlobalEvent(`Sanctions: ${sourceId} imposes strict trade embargo on all imports/exports with ${targetId}.`, 'WARNING');
  },

  removeSanction: (sourceId, targetId) => {
    set(produce((draft) => {
      draft.activeSanctions = draft.activeSanctions.filter((s) => !(s.source === sourceId && s.target === targetId));
    }));
    useWorldStore.getState().updateCountry(targetId, (c) => {
      c.economic.sanctionedBy = c.economic.sanctionedBy.filter((id) => id !== sourceId);
    });
    useWorldStore.getState().addGlobalEvent(`Diplomacy: ${sourceId} eases sanctions against ${targetId}. Rebuilding commercial pipelines.`, 'INFO');
  },

  addLedgerEntry: (entry) => set(produce((draft) => {
    draft.tradeLedger.unshift({
      id: Math.random().toString(),
      tick: useWorldStore.getState().currentTick,
      ...entry,
    });
  })),

  resetEconomy: () => set({
    portfolioFutures: {},
    portfolioShorts: {},
    tradeLedger: [],
    activeSanctions: [],
  }),
}));
