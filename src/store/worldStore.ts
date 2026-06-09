import { create } from 'zustand';
import { produce } from 'immer';
import { WorldState, Country, BallisticStrike, CommodityMarket, ArmsDeal, ThreatLevel } from '../types';
import { INITIAL_COUNTRIES } from '../data/countries';
import { COMMODITY_BASELINES } from '../constants';

interface WorldStoreActions {
  applyTickDelta: (updater: (draft: WorldState) => void) => void;
  updateCountry: (id: string, updater: (country: Country) => void) => void;
  addStrike: (strike: BallisticStrike) => void;
  resolveStrike: (strikeId: string, status: BallisticStrike['status']) => void;
  updateCommodity: (type: keyof typeof COMMODITY_BASELINES, updater: (market: CommodityMarket) => void) => void;
  addGlobalEvent: (text: string, severity?: WorldState['globalEventLog'][0]['severity']) => void;
  setGlobalThreatLevel: (level: ThreatLevel) => void;
  resetWorld: () => void;
}

export const useWorldStore = create<WorldState & WorldStoreActions>((set) => ({
  countries: JSON.parse(JSON.stringify(INITIAL_COUNTRIES)), // Deep copy of seed
  activeStrikes: [],
  commodityMarkets: Object.keys(COMMODITY_BASELINES).map((key) => {
    const baseline = COMMODITY_BASELINES[key as keyof typeof COMMODITY_BASELINES];
    return {
      type: key as any,
      spotPriceUSD: baseline.base,
      baselinePrice: baseline.base,
      volatilityIndex: baseline.volatility,
      supplyShockActive: false,
      embargoed: false,
      embargoedBy: [],
      priceHistory: [baseline.base],
    };
  }),
  activeArmsDeals: [],
  globalThreatLevel: 'GREEN',
  nuclearExchangeOccurred: false,
  globalEventLog: [
    { tick: 0, text: 'Sovereign Command Simulator systems loaded.', severity: 'SYSTEM' },
    { tick: 0, text: 'Space Reconnaissance constellation online. Multi-spectrum radars standing by.', severity: 'INFO' }
  ],
  currentTick: 0,

  applyTickDelta: (updater) => set(produce((draft: WorldState & WorldStoreActions) => {
    updater(draft);
  })),

  updateCountry: (id, updater) => set(produce((draft: WorldState & WorldStoreActions) => {
    if (draft.countries[id]) {
      updater(draft.countries[id]);
    }
  })),

  addStrike: (strike) => set(produce((draft: WorldState & WorldStoreActions) => {
    draft.activeStrikes.push(strike);
    draft.globalEventLog.unshift({
      tick: draft.currentTick,
      text: `Tactical Warning: Ballistic target trace detected in airspace! Source: ${strike.sourceCountryId} → Target: ${strike.targetCountryId}. Classified unit type: ${strike.weaponType}.`,
      severity: 'CRITICAL',
    });
  })),

  resolveStrike: (strikeId, status) => set(produce((draft: WorldState & WorldStoreActions) => {
    const s = draft.activeStrikes.find((x) => x.id === strikeId);
    if (s) {
      s.status = status;
    }
  })),

  updateCommodity: (type, updater) => set(produce((draft: WorldState & WorldStoreActions) => {
    const market = draft.commodityMarkets.find((m) => m.type === type);
    if (market) {
      updater(market);
    }
  })),

  addGlobalEvent: (text, severity = 'INFO') => set(produce((draft: WorldState & WorldStoreActions) => {
    draft.globalEventLog.unshift({
      tick: draft.currentTick,
      text: text,
      severity: severity,
    });
    // Keep logs manageable
    if (draft.globalEventLog.length > 200) {
      draft.globalEventLog.pop();
    }
  })),

  setGlobalThreatLevel: (level) => set(produce((draft: WorldState & WorldStoreActions) => {
    draft.globalThreatLevel = level;
  })),

  resetWorld: () => set({
    countries: JSON.parse(JSON.stringify(INITIAL_COUNTRIES)),
    activeStrikes: [],
    commodityMarkets: Object.keys(COMMODITY_BASELINES).map((key) => {
      const baseline = COMMODITY_BASELINES[key as keyof typeof COMMODITY_BASELINES];
      return {
        type: key as any,
        spotPriceUSD: baseline.base,
        baselinePrice: baseline.base,
        volatilityIndex: baseline.volatility,
        supplyShockActive: false,
        embargoed: false,
        embargoedBy: [],
        priceHistory: [baseline.base],
      };
    }),
    activeArmsDeals: [],
    globalThreatLevel: 'GREEN',
    nuclearExchangeOccurred: false,
    globalEventLog: [
      { tick: 0, text: 'Sovereign Command Simulator systems reset. Stand by for directive input.', severity: 'SYSTEM' }
    ],
    currentTick: 0,
  }),
}));
