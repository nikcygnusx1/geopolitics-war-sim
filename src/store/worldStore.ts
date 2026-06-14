import { create } from 'zustand';
import { produce } from 'immer';
import { WorldState, Country, BallisticStrike, CommodityMarket, ArmsDeal, ThreatLevel, LeaderPersonality, MajorActionType, ScheduledConsequence } from '../types';
import { INITIAL_COUNTRIES } from '../data/countries';
import { COMMODITY_BASELINES } from '../constants';
import { useBlackMarketStore } from './blackMarketStore';
import { useLeaderStore } from './leaderStore';
import { ConsequenceEngine } from '../sim/consequenceEngine';

interface WorldStoreActions {
  applyTickDelta: (updater: (draft: WorldState) => void) => void;
  updateCountry: (id: string, updater: (country: Country) => void) => void;
  addStrike: (strike: BallisticStrike) => void;
  resolveStrike: (strikeId: string, status: BallisticStrike['status']) => void;
  updateCommodity: (type: keyof typeof COMMODITY_BASELINES, updater: (market: CommodityMarket) => void) => void;
  addGlobalEvent: (text: string, severity?: WorldState['globalEventLog'][0]['severity']) => void;
  setGlobalThreatLevel: (level: ThreatLevel) => void;
  resetWorld: (leaderOverrides?: Record<string, LeaderPersonality>) => void;
  registerConsequenceChain: (actionType: MajorActionType, context: { sourceCountryId: string; targetCountryId?: string; [key: string]: any }) => void;
  enqueueConsequence: (consequence: ScheduledConsequence) => void;
  resolveScheduledConsequence: (id: string) => void;
  tickConsequences: (currentTick: number) => void;
  clearExpiredHistory: () => void;
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
  scheduledConsequences: [],
  recentResolvedConsequences: [],
  aiOperationsLog: [
    {
      tick: -12,
      countryId: 'RU',
      countryName: 'Russia',
      action: 'FSB Cyber Infiltration',
      targetCountryId: 'US',
      targetCountryName: 'United States',
      description: 'Breached command communications targeting classified nuclear submarine coordinates in the North Sea.',
      secrecyScore: 88,
      impactScore: 65,
    },
    {
      tick: -8,
      countryId: 'CN',
      countryName: 'China',
      action: 'Industrial Espionage',
      targetCountryId: 'US',
      targetCountryName: 'United States',
      description: 'Acquired advanced semiconductor fabrication blueprint schemas using front commercial logistics corporations.',
      secrecyScore: 92,
      impactScore: 78,
    },
    {
      tick: -5,
      countryId: 'IR',
      countryName: 'Iran',
      action: 'Proxy Centrifuges Funding',
      targetCountryId: 'KP',
      targetCountryName: 'North Korea',
      description: 'Financed raw military centrifuge parts shipment undetected via custom registered maritime container vessels.',
      secrecyScore: 85,
      impactScore: 70,
    }
  ],

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

    const isNuclear = strike.weaponType === 'ICBM' || strike.weaponType === 'SLBM' || (strike.warheadYieldMT !== undefined && strike.warheadYieldMT > 0);
    const actionType = isNuclear ? 'NUCLEAR_ESCALATION' : 'LAUNCH_STRIKE';
    ConsequenceEngine.register(actionType, { sourceCountryId: strike.sourceCountryId, targetCountryId: strike.targetCountryId }, draft);
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

  resetWorld: (leaderOverrides) => {
    useBlackMarketStore.getState().resetMarket();
    useLeaderStore.getState().initializeLeadersForAllCountries(0, leaderOverrides);
    set({
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
      scheduledConsequences: [],
      recentResolvedConsequences: [],
      aiOperationsLog: [
        {
          tick: -12,
          countryId: 'RU',
          countryName: 'Russia',
          action: 'FSB Cyber Infiltration',
          targetCountryId: 'US',
          targetCountryName: 'United States',
          description: 'Breached command communications targeting classified nuclear submarine coordinates in the North Sea.',
          secrecyScore: 88,
          impactScore: 65,
        },
        {
          tick: -8,
          countryId: 'CN',
          countryName: 'China',
          action: 'Industrial Espionage',
          targetCountryId: 'US',
          targetCountryName: 'United States',
          description: 'Acquired advanced semiconductor fabrication blueprint schemas using front commercial logistics corporations.',
          secrecyScore: 92,
          impactScore: 78,
        },
        {
          tick: -5,
          countryId: 'IR',
          countryName: 'Iran',
          action: 'Proxy Centrifuges Funding',
          targetCountryId: 'KP',
          targetCountryName: 'North Korea',
          description: 'Financed raw military centrifuge parts shipment undetected via custom registered maritime container vessels.',
          secrecyScore: 85,
          impactScore: 70,
        }
      ],
    });
  },

  registerConsequenceChain: (actionType, context) => set(produce((draft: WorldState & WorldStoreActions) => {
    ConsequenceEngine.register(actionType, context, draft);
  })),

  enqueueConsequence: (consequence) => set(produce((draft: WorldState & WorldStoreActions) => {
    if (!draft.scheduledConsequences) draft.scheduledConsequences = [];
    draft.scheduledConsequences.push(consequence);
  })),

  resolveScheduledConsequence: (id) => set(produce((draft: WorldState & WorldStoreActions) => {
    if (!draft.scheduledConsequences) draft.scheduledConsequences = [];
    const c = draft.scheduledConsequences.find((x) => x.id === id);
    if (c) c.resolved = true;
  })),

  tickConsequences: (currentTick) => set(produce((draft: WorldState & WorldStoreActions) => {
    ConsequenceEngine.tick(currentTick, draft);
  })),

  clearExpiredHistory: () => set(produce((draft: WorldState & WorldStoreActions) => {
    draft.recentResolvedConsequences = [];
  })),
}));
