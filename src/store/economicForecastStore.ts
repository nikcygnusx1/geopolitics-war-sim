import { create } from 'zustand';
import { produce } from 'immer';
import { useWorldStore } from './worldStore';
import { usePlayerStore } from './playerStore';
import { useEnergyStore } from './energyStore';
import { useTradeStore } from './tradeStore';
import { useSanctionsStore } from './sanctionsStore';
import { useFinintStore } from './finintStore';
import { useArachneStore } from './arachneStore';
import { useGothamStore } from './gothamStore';
import { CommodityType, Country } from '../types';
import {
  ActionEconomicPreview,
  SectorDrilldownModel,
  CommodityStressRecord,
  WorldEconomicStressState,
  CountryEconomicSummary,
  EconomicRiskFlag,
  EconomicWatchItem,
  EconomicUISelectionState,
  StressLabel,
  WorldStressRibbonSegment,
  ForestHorizon,
  ForecastConfidenceBand,
  ForecastBranch,
  EconomicForecastSnapshot,
} from '../types/economicForecast';

interface EconomicForecastStoreState {
  selection: EconomicUISelectionState;
  customPreviews: ActionEconomicPreview[];
  focusedActionId: string | null;
  completionsHistory: Record<string, { tick: number; baselineGdp: number; actualGdp: number; error: number }>;
  viewMode: 'SUMMARY' | 'WORKSPACE' | 'PREVIEWS' | 'HEATMAPS' | 'SECTORS';
}

interface EconomicForecastStoreActions {
  setUISelection: (updater: (draft: EconomicUISelectionState) => void) => void;
  setFocusedActionId: (id: string | null) => void;
  setViewMode: (mode: 'SUMMARY' | 'WORKSPACE' | 'PREVIEWS' | 'HEATMAPS' | 'SECTORS') => void;
  commitActionPreview: (actionId: string) => void;
  generateDynamicForecast: (countryId: string) => EconomicForecastSnapshot;
  calculateSectorDrilldowns: (countryId: string) => SectorDrilldownModel[];
  calculateCommodityStress: () => CommodityStressRecord[];
  calculateWorldEconomicStress: () => WorldEconomicStressState;
  calculateCountryMacroSummaries: () => CountryEconomicSummary[];
  calculateRiskFlags: () => EconomicRiskFlag[];
  calculateWatchlist: () => EconomicWatchItem[];
  resetForecastStore: () => void;
}

const INITIAL_SELECTION: EconomicUISelectionState = {
  activeCountryId: 'US',
  activeSectorKey: 'manufacturing',
  activeCommodityKey: 'OIL',
  heatmapGridMode: 'COMMODITY_X_COUNTRY',
  forecastHorizon: '3T',
  forecastBranchId: 'BASELINE',
  workspaceComparableCountries: ['US', 'CN', 'RU'],
  workspaceComparableSectors: ['manufacturing', 'energy', 'tech'],
  workspaceComparableCommodities: ['OIL', 'NATURAL_GAS', 'SILICON'],
};

export const useEconomicForecastStore = create<EconomicForecastStoreState & EconomicForecastStoreActions>((set, get) => ({
  selection: INITIAL_SELECTION,
  focusedActionId: 'sanctions_strait_closure_coercion',
  viewMode: 'SUMMARY',
  completionsHistory: {
    'energy_embargo_bric_bloc': { tick: 2, baselineGdp: 25400, actualGdp: 25310, error: 0.35 }
  },
  customPreviews: [
    {
      id: 'sanctions_strait_closure_coercion',
      actionKey: 'COERCIVE_SANCTIONS',
      title: 'Multilateral Tech Blockade & Luxury Embargo on RU',
      initiatingActor: 'US',
      targetActor: 'RU',
      likelihoodTopLine: 'High Coercive Signal Transmission',
      winners: ['US', 'DE', 'GB'],
      losers: ['RU', 'CN'],
      mostExposedSectors: ['tech', 'energy', 'manufacturing'],
      mostAffectedCommodities: ['OIL', 'SILICON', 'RARE_EARTH'],
      gdpImpactPercentage: -4.3,
      inflationImpactPercentage: 2.1,
      confidenceScore: 82,
      blowbackEscalationRisk: 45,
      underlyingAssumptions: [
        'EU coalition enforces 95% compliance',
        'Suez chokepoints remain unblocked',
        'Evasion activity via covert channels is capped at 15%',
      ],
      secondOrderEffects: [
        {
          title: 'Asymmetrical Hacker Retaliation',
          sourceSystem: 'FININT',
          description: 'High-probability cyber penetration on Western asset clearing centers.',
          probability: 'HIGH',
          escalationRiskScore: 68,
        },
        {
          title: 'Rare Earth Transit Divergence',
          sourceSystem: 'TRADE',
          description: 'Bilateral rare earth trade routing moves exclusively through BRICS channels.',
          probability: 'MEDIUM',
          escalationRiskScore: 50,
        },
      ],
    },
    {
      id: 'trade_disruption_east_asia',
      actionKey: 'TARIFF_EXCLUSION_ACT',
      title: 'Tactical Semiconductor Tariffs Escalation on CN',
      initiatingActor: 'US',
      targetActor: 'CN',
      likelihoodTopLine: 'Severe Supply Chain Strangling',
      winners: ['US', 'TW', 'KR'],
      losers: ['CN', 'JP'],
      mostExposedSectors: ['tech', 'manufacturing', 'services'],
      mostAffectedCommodities: ['SILICON', 'RARE_EARTH'],
      gdpImpactPercentage: -2.8,
      inflationImpactPercentage: 1.4,
      confidenceScore: 75,
      blowbackEscalationRisk: 60,
      underlyingAssumptions: [
        'Third-party transshipment is fully monitored',
        'Domestic silicon foundries ramp up within 3 ticks',
      ],
      secondOrderEffects: [
        {
          title: 'Rare Earth Quota Reductions',
          sourceSystem: 'SANCTIONS',
          description: 'Counter-sanctions placed on rare-earth exports affecting global aerospace defense grids.',
          probability: 'HIGH',
          escalationRiskScore: 78,
        },
        {
          title: 'Yuan Depreciation Flight',
          sourceSystem: 'FININT',
          description: 'Capital flight from domestic equities leads to rapid reserve drain.',
          probability: 'HIGH',
          escalationRiskScore: 40,
        },
      ],
    },
    {
      id: 'energy_shock_persian_gulf',
      actionKey: 'ENERGY_EMBARGO',
      title: 'Strategic Strait of Hormuz Tanker Interdiction',
      initiatingActor: 'IR',
      targetActor: 'US',
      likelihoodTopLine: 'Systemic Hydrocarbon Chokepoint Shock',
      winners: ['RU', 'SA'],
      losers: ['US', 'EG', 'DE', 'JP', 'IN'],
      mostExposedSectors: ['energy', 'transportation', 'agriculture'],
      mostAffectedCommodities: ['OIL', 'NATURAL_GAS'],
      gdpImpactPercentage: -5.7,
      inflationImpactPercentage: 4.8,
      confidenceScore: 90,
      blowbackEscalationRisk: 95,
      underlyingAssumptions: [
        'US Strategic Reserve Release satisfies demand for 4 weeks only',
        'Insurance carriers suspend shipping coverage in secondary orbits',
      ],
      secondOrderEffects: [
        {
          title: 'Hyper-Inflationary Spirals',
          sourceSystem: 'ENERGY',
          description: 'Energy pass-through costs directly trigger massive price increases across standard CPI baskets.',
          probability: 'HIGH',
          escalationRiskScore: 88,
        },
        {
          title: 'Alliance Integration Strain',
          sourceSystem: 'GOTHAM',
          description: 'Partner nations dispute heavy fuel allocative ratios, causing localized strategic fatigue.',
          probability: 'HIGH',
          escalationRiskScore: 55,
        },
      ],
    },
  ],

  setUISelection: (updater) => set(produce((draft: EconomicForecastStoreState) => {
    updater(draft.selection);
  })),

  setFocusedActionId: (id) => set({ focusedActionId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  commitActionPreview: (actionId) => {
    const action = get().customPreviews.find(p => p.id === actionId);
    if (!action) return;

    // Execute on the live world state using tick delta!
    useWorldStore.getState().applyTickDelta((draft) => {
      // Modify target country slightly to reflect policy enforcement
      const targetId = action.targetActor;
      if (targetId && draft.countries[targetId]) {
        const c = draft.countries[targetId];
        c.economic.debtStressIndex = Math.min(100, c.economic.debtStressIndex + 12);
        c.economic.gdpB *= (1 + action.gdpImpactPercentage / 100);
        c.economic.inflationRate += action.inflationImpactPercentage;
        c.political.popularUnrest = Math.min(100, c.political.popularUnrest + 8);
        c.lastEventLog.unshift(`ECON FORCE: Ratified policy "${action.title}". Industry forecasts active.`);
      }

      // Modify source country which bears blowback
      const sourceId = action.initiatingActor;
      if (sourceId && draft.countries[sourceId]) {
        const c = draft.countries[sourceId];
        c.economic.inflationRate += Math.abs(action.inflationImpactPercentage) * 0.2;
        c.economic.gdpB *= 0.998; // Minor cost of enforcement
      }
    });

    // Mark as completed/realized
    set(produce((draft: EconomicForecastStoreState) => {
      const act = draft.customPreviews.find(p => p.id === actionId);
      if (act) {
        const tick = useWorldStore.getState().currentTick;
        act.realizedImpact = {
          ticksElapsed: 0,
          realizedGdpChange: act.gdpImpactPercentage * 0.9 + (Math.random() - 0.5) * 0.3,
          realizedInflationChange: act.inflationImpactPercentage * 0.95 + (Math.random() - 0.5) * 0.2,
          accuracyScore: Math.round(92 - Math.random() * 8),
        };
        draft.completionsHistory[actionId] = {
          tick,
          baselineGdp: 100,
          actualGdp: 100 + act.gdpImpactPercentage,
          error: parseFloat((Math.random() * 0.8).toFixed(2))
        };
      }
    }));

    useWorldStore.getState().addGlobalEvent(`War Room: Economic warfare ordinance "${action.title}" officially deployed. Transmission active.`, 'WARNING');
  },

  generateDynamicForecast: (countryId) => {
    const target = useWorldStore.getState().countries[countryId];
    const baseGdpResult = target?.economic.gdpB || 100;
    const baseInflation = target?.economic.inflationRate || 3;
    const baseStress = target?.economic.debtStressIndex || 25;
    const baseUnrest = target?.political.popularUnrest || 15;

    // Derive deterministic horizons
    const horizons: Record<ForestHorizon, { gdpGrowth: number; inflation: number; unemployment: number; economicStress: number; confidence: number }> = {
      '1T': {
        gdpGrowth: target?.economic.gdpGrowthRate ?? 2.5,
        inflation: baseInflation,
        unemployment: target?.economic.unemploymentRate ?? 5.5,
        economicStress: baseStress,
        confidence: Math.round(95 - baseStress * 0.1),
      },
      '3T': {
        gdpGrowth: Math.max(-10, (target?.economic.gdpGrowthRate ?? 2.5) - 0.4),
        inflation: Math.max(0, baseInflation + 0.3),
        unemployment: Math.min(25, (target?.economic.unemploymentRate ?? 5.5) + 0.2),
        economicStress: Math.min(100, baseStress + 4),
        confidence: Math.round(88 - baseStress * 0.15),
      },
      '6T': {
        gdpGrowth: Math.max(-10, (target?.economic.gdpGrowthRate ?? 2.5) - 0.7),
        inflation: Math.max(0, baseInflation + 0.8),
        unemployment: Math.min(25, (target?.economic.unemploymentRate ?? 5.5) + 0.6),
        economicStress: Math.min(100, baseStress + 8),
        confidence: Math.round(76 - baseStress * 0.2),
      },
      '12T': {
        gdpGrowth: Math.max(-10, (target?.economic.gdpGrowthRate ?? 2.5) - 1.1),
        inflation: Math.max(0, baseInflation + 1.5),
        unemployment: Math.min(25, (target?.economic.unemploymentRate ?? 5.5) + 1.1),
        economicStress: Math.min(100, baseStress + 15),
        confidence: Math.round(60 - baseStress * 0.3),
      },
    };

    const confidenceBands: Record<string, ForecastConfidenceBand> = {
      GDP: { horizon: '6T', low: (target?.economic.gdpGrowthRate ?? 2.5) - 2.5, high: (target?.economic.gdpGrowthRate ?? 2.5) + 1.2, confidence: 76, volatilityWarning: baseStress > 50 },
      Inflation: { horizon: '6T', low: Math.max(0, baseInflation - 1.0), high: baseInflation + 3.5, confidence: 72, volatilityWarning: baseInflation > 6 },
    };

    const branches: ForecastBranch[] = [
      {
        branchId: 'BASELINE',
        name: 'Model Baseline Corridor',
        probability: 60,
        narrative: `${target?.name ?? 'National'} macro outlook is stable under standard trading corridors with minimal external shocks.`,
        gdpPath: [baseGdpResult, baseGdpResult * 1.005, baseGdpResult * 1.011, baseGdpResult * 1.025],
        inflationPath: [baseInflation, baseInflation, baseInflation + 0.1, baseInflation],
        unrestPath: [baseUnrest, baseUnrest, baseUnrest, baseUnrest],
      },
      {
        branchId: 'PROPOSED',
        name: 'Action Deviation Horizon',
        probability: 25,
        narrative: `Aggressive sanctions integration propagates sector contractions in services and technology.`,
        gdpPath: [baseGdpResult, baseGdpResult * 0.99, baseGdpResult * 0.97, baseGdpResult * 0.95],
        inflationPath: [baseInflation, baseInflation + 1.2, baseInflation + 2.4, baseInflation + 3.8],
        unrestPath: [baseUnrest, baseUnrest + 5, baseUnrest + 12, baseUnrest + 22],
      },
      {
        branchId: 'STRESS_ALT',
        name: 'synchronized Geopolitical Strain',
        probability: 10,
        narrative: `Systemic supply blockade triggered by escalation spirals, oil price peaking, and route shutoff.`,
        gdpPath: [baseGdpResult, baseGdpResult * 0.97, baseGdpResult * 0.93, baseGdpResult * 0.88],
        inflationPath: [baseInflation, baseInflation + 2.5, baseInflation + 5.8, baseInflation + 8.9],
        unrestPath: [baseUnrest, baseUnrest + 10, baseUnrest + 28, baseUnrest + 45],
      },
    ];

    return {
      countryId,
      baseTick: useWorldStore.getState().currentTick,
      horizons,
      confidenceBands,
      branches,
      latestNarrative: `Forecast engine predicts a ${branches[0].probability}% probability of standard baseline trajectory. However, trade vulnerabilities and energy transition variables indicate high sector sensitivity in downstream manufacturing, which could drag real outputs by up to 3% if sanctions campaigns intensify.`,
    };
  },

  calculateSectorDrilldowns: (countryId) => {
    const c = useWorldStore.getState().countries[countryId];
    if (!c) return [];

    const baseSectors = c.economic.sectors ?? {
      energy: 15,
      agriculture: 8,
      manufacturing: 22,
      technology: 18,
      services: 25,
      defense: 10,
      tourism: 3,
      mining: 5,
    };

    const sumGdpB = c.economic.gdpB;
    const stress = c.economic.debtStressIndex;

    // We mapping and expanding the core sectors to the 12 required sectors
    const coreSectorsConfig = [
      { key: 'energy', label: 'Energy & Utility Corridors', share: baseSectors.energy ?? 15, keyProducer: 'OIL' },
      { key: 'manufacturing', label: 'Advanced Industrial Manufacturing', share: baseSectors.manufacturing ?? 20, keyProducer: 'SILICON' },
      { key: 'agriculture', label: 'Acreage & Food Security', share: baseSectors.agriculture ?? 10, keyProducer: 'WHEAT' },
      { key: 'finance', label: 'Banking & Liquidity Intermediaries', share: (baseSectors.services ?? 25) * 0.4 },
      { key: 'technology', label: 'High-Density Chip Assembly & Tech', share: baseSectors.technology ?? 18, keyProducer: 'SILICON' },
      { key: 'defense', label: 'Sovereign Combat Defense Logistics', share: baseSectors.defense ?? 10 },
      { key: 'services', label: 'Services & Dynamic Commerce', share: (baseSectors.services ?? 25) * 0.6 },
      { key: 'construction', label: 'Infrastructure & Real Property', share: 6 },
      { key: 'mining', label: 'Extractive Minerals & Smelting', share: baseSectors.mining ?? 5, keyProducer: 'RARE_EARTH' },
      { key: 'pharmaceuticals', label: 'Pharmaceutical Bio-Synthetics', share: 4 },
      { key: 'transportation', label: 'Bilateral Route Logistics & Marine', share: 5 },
      { key: 'tourism', label: 'Global Hospitality Transit', share: baseSectors.tourism ?? 3 },
    ];

    return coreSectorsConfig.map((s) => {
      // Calculate dynamic stress outputs
      let baseFactor = stress * 0.1;
      let importFriction = Math.max(0, Math.min(10, baseFactor + Math.round((((c.economic as any).importDependency) || 30) / 10)));
      let exportFriction = Math.max(0, Math.min(10, baseFactor + Math.round((((c.economic as any).exportDependency) || 20) / 10)));
      let sanctionsRisk = Math.max(0, Math.min(10, Math.round(((c.economic as any).sanctionsExposure || 10) * 0.1)));

      if (s.key === 'energy') {
        baseFactor *= 1.4;
        importFriction += 2;
      } else if (s.key === 'technology' || s.key === 'manufacturing') {
        baseFactor *= 1.2;
        importFriction = Math.min(10, importFriction + 3);
      } else if (s.key === 'tourism' || s.key === 'finance') {
        baseFactor += (c.political.popularUnrest * 0.1);
      }

      const rawStressScore = (importFriction + exportFriction + sanctionsRisk + baseFactor) / 4;
      const status = rawStressScore > 7 ? 'CRITICAL' : rawStressScore > 5 ? 'STRESSED' : rawStressScore > 3 ? 'NOMINAL' : 'RESILIENT';
      const trend = rawStressScore > 6 ? 'COLLAPSING' : rawStressScore > 4 ? 'DECLINING' : rawStressScore > 2.5 ? 'STABLE' : 'GROWING';

      return {
        countryId,
        sectorKey: s.key,
        displayName: s.label,
        currentValueUSD: sumGdpB * (s.share / 100),
        shareOfGDP: s.share,
        status,
        trend,
        substitutionCapacityScore: Math.round(50 + (100 - (((c.economic as any).importDependency) || 30)) * 0.4),
        decomposition: {
          contributionToGdpPct: s.share,
          growthContribution: parseFloat((c.economic.gdpGrowthRate * (s.share / 100) * (status === 'RESILIENT' ? 1.2 : status === 'CRITICAL' ? -0.5 : 0.8)).toFixed(2)),
          importShortageImpact: Math.round(Math.min(10, importFriction)),
          exportConstraintImpact: Math.round(Math.min(10, exportFriction)),
          energyShockVulnerability: Math.round(Math.min(10, s.key === 'energy' ? 1 : Math.round(((c.economic as any).energyProfile) === 'DEFICIT' ? 8 : 3))),
          sanctionsExposureScore: Math.round(Math.min(10, sanctionsRisk)),
          routeFrictionImpact: Math.round(Math.min(10, s.key === 'transportation' ? 8 : Math.round(stress * 0.08))),
          laborStressScore: Math.round(Math.min(10, c.political.popularUnrest * 0.1)),
        },
        forecastHorizonOutlook: {
          '1T': rawStressScore > 7 ? 'CRITICAL' : rawStressScore > 5 ? 'SLOWDOWN' : 'STABLE',
          '3T': rawStressScore > 6 ? 'CONTRACTION' : rawStressScore > 4 ? 'SLOWDOWN' : 'STABLE',
          '6T': rawStressScore > 6 ? 'CONTRACTION' : 'EXPANSION',
          '12T': 'EXPANSION', // default optimistic baseline
        },
      };
    });
  },

  calculateCommodityStress: () => {
    const markets = useWorldStore.getState().commodityMarkets;
    const countries = useWorldStore.getState().countries;

    return markets.map((m) => {
      // Dynamic linkages with existing files
      const spotRatio = m.spotPriceUSD / m.baselinePrice;
      const priceStress = Math.min(100, Math.round(spotRatio * 50));
      const supplyTightness = m.supplyShockActive ? 85 : Math.min(100, Math.round(spotRatio * 45));
      const demandSurge = Math.round(40 + Math.random() * 20 + (m.spotPriceUSD > m.baselinePrice ? 15 : -10));

      const isEmbargoed = m.embargoed || m.embargoedBy?.length > 0;
      const sanctionsExposure = isEmbargoed ? 90 : m.embargoedBy?.length > 0 ? 55 : 20;

      // Calculate route fragility (integrating Trade routes)
      let routeFragility = 30;
      if (m.type === 'OIL') routeFragility = 80; // Hormuz, Bab el-Mandeb exposure
      else if (m.type === 'NATURAL_GAS') routeFragility = 65; // Pipeline networks
      else if (m.type === 'SILICON') routeFragility = 70; // Strait of Taiwan transit

      const importerVulnerability = Math.round(35 + spotRatio * 25);
      const volatilityIndex = Math.round(m.volatilityIndex * 10);

      const forecastedDirection = spotRatio > 1.3 ? 'SPIKING' : spotRatio > 1.05 ? 'RISING' : spotRatio < 0.85 ? 'CRASHING' : spotRatio < 0.97 ? 'SOFTENING' : 'STABLE';

      return {
        commodity: m.type,
        priceStress,
        supplyTightness,
        demandSurge,
        routeFragility,
        sanctionsExposure,
        importerVulnerability,
        volatilityIndex,
        forecastedDirection,
        confidenceScore: Math.round(92 - (spotRatio > 1.5 ? 15 : 0)),
      };
    });
  },

  calculateWorldEconomicStress: () => {
    const countries = useWorldStore.getState().countries;
    const list = Object.values(countries);

    // Compute metrics
    const avgStress = list.reduce((acc, c) => acc + (c.economic.debtStressIndex || 20), 0) / list.length;
    const avgInflation = list.reduce((acc, c) => acc + (c.economic.inflationRate || 3), 0) / list.length;
    const activeSanctionsCount = list.reduce((acc, c) => acc + (c.economic.sanctionedBy?.length || 0), 0);
    const totalTensions = useWorldStore.getState().globalThreatLevel === 'GREEN' ? 10 : useWorldStore.getState().globalThreatLevel === 'RED' ? 70 : 45;

    // Decomposed segmented contributions
    const components: WorldStressRibbonSegment[] = [
      {
        dimension: 'INFLATION',
        stressScore: Math.round(Math.min(100, avgInflation * 8)),
        weight: 15,
        trend: avgInflation > 6 ? 'UP' : 'STABLE',
        primaryHotspots: ['RU', 'IR'],
      },
      {
        dimension: 'ENERGY',
        stressScore: Math.round(Math.min(100, (useEnergyStore.getState().activeEmbargoes?.length || 0) * 15 + (useWorldStore.getState().commodityMarkets.find(m => m.type === 'OIL')?.spotPriceUSD || 80) * 0.5)),
        weight: 15,
        trend: 'UP',
        primaryHotspots: ['IL', 'PS', 'SA'],
      },
      {
        dimension: 'TRADE',
        stressScore: Math.round(Math.min(100, Math.max(20, (useTradeStore.getState().campaigns?.length || 0) * 10 + avgStress))),
        weight: 15,
        trend: 'STABLE',
        primaryHotspots: ['CN', 'US'],
      },
      {
        dimension: 'SANCTIONS',
        stressScore: Math.round(Math.min(100, activeSanctionsCount * 12 + 20)),
        weight: 15,
        trend: activeSanctionsCount > 3 ? 'UP' : 'STABLE',
        primaryHotspots: ['RU', 'CN'],
      },
      {
        dimension: 'FINANCE',
        stressScore: Math.round(useFinintStore.getState().globalAggregatedBlowback || 30),
        weight: 10,
        trend: 'STABLE',
        primaryHotspots: ['US'],
      },
      {
        dimension: 'COMMODITY',
        stressScore: Math.round(Math.max(15, avgStress * 1.1)),
        weight: 10,
        trend: 'UP',
        primaryHotspots: ['CN', 'RU'],
      },
      {
        dimension: 'DEBT',
        stressScore: Math.round(Math.min(100, list.reduce((acc, c) => acc + (c.economic.debtToGdpRatio || 50), 0) / list.length * 0.8)),
        weight: 10,
        trend: 'STABLE',
        primaryHotspots: ['US', 'EG'],
      },
      {
        dimension: 'CHOKEPOINT',
        stressScore: useWorldStore.getState().commodityMarkets.find(m => m.type === 'OIL')?.supplyShockActive ? 85 : 30,
        weight: 10,
        trend: 'STABLE',
        primaryHotspots: ['EG', 'IR'],
      },
    ];

    const globalStressIndex = Math.round(
      components.reduce((acc, c) => acc + (c.stressScore * c.weight) / 100, 0)
    );

    const prevTickIndex = Math.round(globalStressIndex * 0.95 + (Math.random() - 0.5) * 4);
    const directionVelocity = parseFloat((globalStressIndex - prevTickIndex).toFixed(1));

    let label: StressLabel = 'Stable';
    if (globalStressIndex > 75) label = 'Systemic Stress';
    else if (globalStressIndex > 60) label = 'Crisis Transmission';
    else if (globalStressIndex > 45) label = 'Shock Propagation';
    else if (globalStressIndex > 35) label = 'Fragile';
    else if (globalStressIndex > 25) label = 'Tightening';

    let synchronizedScale: WorldEconomicStressState['synchronizedScale'] = 'LOCALIZED';
    if (globalStressIndex > 70) synchronizedScale = 'GLOBAL_SYSTEMIC_CRISIS';
    else if (globalStressIndex > 50) synchronizedScale = 'SYNCHRONIZED_STRESS';
    else if (globalStressIndex > 35) synchronizedScale = 'REGIONAL_PROPAGATION';

    return {
      globalStressIndex,
      prevTickIndex,
      directionVelocity,
      synchronizedScale,
      label,
      components,
      narrativeOverview: `World economy is in state of ${label}. Subsystems show high load in ${
        components.sort((a,b) => b.stressScore - a.stressScore)[0].dimension
      } stress, transmitting contagion from primary geographic hotbeds including ${components[0].primaryHotspots.join(' and ')}.`,
    };
  },

  calculateCountryMacroSummaries: () => {
    const countries = useWorldStore.getState().countries;
    const globalStress = get().calculateWorldEconomicStress().globalStressIndex;

    return Object.keys(countries).map((id) => {
      const c = countries[id];
      const econ = c.economic;
      const stress = econ.debtStressIndex ?? 30;

      // Extract top sectors and commodities
      const sectorModel = get().calculateSectorDrilldowns(id);
      const topStressedSectors = sectorModel
        .sort((a, b) => b.decomposition.importShortageImpact - a.decomposition.importShortageImpact)
        .slice(0, 2)
        .map(s => ({ sector: s.displayName, score: s.decomposition.importShortageImpact * 10 }));

      const comModel = get().calculateCommodityStress();
      const topStressedCommodities = comModel
        .sort((a,b) => b.priceStress - a.priceStress)
        .slice(0, 2)
        .map(c => ({ commodity: c.commodity, stress: c.priceStress }));

      // Integration indicators
      const tradeVulnerabilityIndex = Math.round((((econ as any).importDependency) || 30) * 0.6 + (((econ as any).exportDependency) || 25) * 0.4);
      const energyVulnerabilityIndex = Math.round(((econ as any).energyProfile) === 'DEFICIT' ? 85 : 20 + stress * 0.2);
      const financeFragilityIndex = Math.round(econ.debtToGdpRatio * 0.7 + (100 - (econ.currencyStrength || 100)) * 0.3);
      const sanctionsBlowbackExposure = Math.round(((econ as any).sanctionsExposure || 15) + (maturedWeight[id] || 15));

      const calculatedTrend: 'BOOMING' | 'STABLE' | 'STAGNANT' | 'DETERIORATING' | 'CRISIS' = 
        stress > 65 ? 'CRISIS' : 
        stress > 45 ? 'DETERIORATING' : 
        stress > 25 ? 'STAGNANT' : 
        (econ.gdpGrowthRate || 2.1) > 4.0 ? 'BOOMING' : 'STABLE';

      return {
        countryId: id,
        name: c.name,
        isoCode: id,
        currentGdpB: econ.gdpB,
        headlineGrowth: econ.gdpGrowthRate,
        headlineInflation: econ.inflationRate,
        debtToGdpRatio: econ.debtToGdpRatio,
        macroTrend: calculatedTrend,
        topStressedSectors,
        topStressedCommodities,
        tradeVulnerabilityIndex,
        energyVulnerabilityIndex,
        financeFragilityIndex,
        sanctionsBlowbackExposure,
        worldStressContributionPct: parseFloat(((stress / globalStress) * 100).toFixed(1)),
      };
    });
  },

  calculateRiskFlags: () => {
    const list = get().calculateCountryMacroSummaries();
    const flags: EconomicRiskFlag[] = [];

    list.forEach((c) => {
      if (c.headlineInflation > 12) {
        flags.push({
          id: `risk_hyperinflation_${c.countryId}`,
          countryId: c.countryId,
          severity: 'CRITICAL',
          systemSource: 'MACRO',
          title: `Severe Inflation Spiral: ${c.name}`,
          triggerCondition: 'Inflation rate exceeding CPI tolerance (>12%)',
          description: `Localized monetary breakdown underway in ${c.name}. Currencies trading is heavily degraded with black market workarounds spreading.`,
        });
      }
      if (c.debtToGdpRatio > 110) {
        flags.push({
          id: `risk_debtstress_${c.countryId}`,
          countryId: c.countryId,
          severity: 'WARNING',
          systemSource: 'MACRO',
          title: `Fiscal Runway Exhaustion: ${c.name}`,
          triggerCondition: 'Debt-to-GDP ratio exceeding 110%',
          description: `Sovereign rating downgrade risk. High interest cost burdens direct capital output programs.`,
        });
      }
      if (c.tradeVulnerabilityIndex > 70 && c.worldStressContributionPct > 15) {
        flags.push({
          id: `risk_tradechoke_${c.countryId}`,
          countryId: c.countryId,
          severity: 'CRITICAL',
          systemSource: 'TRADE',
          title: `Supply Chain Strangling: ${c.name}`,
          triggerCondition: 'High Import Dependence coupled with Route Contraction',
          description: `Key industrial sectors in manufacturing cannot secure raw inputs. Assembly factories reported output pauses.`,
        });
      }
    });

    // Global seeded risk flags if empty
    if (flags.length === 0) {
      flags.push({
        id: `global_chokepoint_hormuz`,
        countryId: 'IR',
        severity: 'CATASTROPHIC',
        systemSource: 'ENERGY',
        title: 'Hormuz Liquefied Transit Closure Alert',
        triggerCondition: 'Asymmetrical interdictions on regional carrier corridors',
        description: 'Synchronized price shockpropagation through OIL and GAS markets. Secondary manufacturing buffers degraded.',
      });
    }

    return flags;
  },

  calculateWatchlist: () => {
    const com = get().calculateCommodityStress().filter(c => c.priceStress > 50);
    const flags = get().calculateRiskFlags();

    const watchItems: EconomicWatchItem[] = com.map((c, i) => ({
      id: `watch_com_${c.commodity}`,
      title: `${c.commodity} Sector Pressure`,
      type: 'COMMODITY',
      targetLabel: c.commodity,
      activeTrend: c.priceStress > 70 ? 'HEATING_UP' : 'STABLE_STRESS',
      stressLevel: c.priceStress,
    }));

    if (flags.length > 0) {
      watchItems.push({
        id: 'watch_risk_trans',
        title: 'Middle East Ship Insurance Shock',
        type: 'ROUTE',
        targetLabel: 'Bab-el-Mandeb & Suez Corridor',
        activeTrend: 'HEATING_UP',
        stressLevel: 82,
      });
    }

    return watchItems;
  },

  resetForecastStore: () => set({
    selection: INITIAL_SELECTION,
    viewMode: 'SUMMARY',
    focusedActionId: 'sanctions_strait_closure_coercion',
  }),
}));

const maturedWeight: Record<string, number> = {
  US: 50, CN: 35, RU: 25, IN: 15, DE: 8, GB: 8, FR: 5
};
