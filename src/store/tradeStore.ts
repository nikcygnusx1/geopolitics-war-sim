import { create } from 'zustand';
import { produce } from 'immer';
import { 
  StrategicTradeCategory, 
  RouteNode, 
  RouteSegment, 
  BilateralTradeProfile, 
  TradeWarCampaign, 
  TradeIncident, 
  RouteDisruptionRecord, 
  TradeDependencySummary, 
  TradeExposureScore, 
  RestrictionLevel,
  TradeLink
} from '../types/trade';
import { 
  INITIAL_ROUTE_NODES, 
  INITIAL_ROUTE_SEGMENTS, 
  INITIAL_BILATERAL_PROFILES, 
  INITIAL_TRADE_INCIDENTS 
} from '../data/tradeSeeded';
import { useWorldStore } from './worldStore';
import { useArachneStore } from './arachneStore';

export interface EscalationPreview {
  actorCountryId: string;
  targetCountryId: string;
  actionType: 'TARIFF' | 'SECTORAL' | 'TOTAL_RUPTURE';
  affectedCategories: StrategicTradeCategory[];
  directValueAtRiskB: number;
  importerPainScore: number; // 0-100
  exporterPainScore: number; // 0-100
  importerGdpFallPercent: number;
  exporterGdpGrowthDragPercent: number;
  inflationImpactPercent: number;
  expectedRetaliationType: string;
  predictedAlliedSpillover: string;
  rerouteViability: 'HIGH' | 'MEDIUM' | 'LOW' | 'IMPOSSIBLE';
  leverageAsymmetry: number; // Positive means actor has more leverage, Negative means target has more leverage
}

interface TradeState {
  nodes: RouteNode[];
  segments: RouteSegment[];
  profiles: BilateralTradeProfile[];
  campaigns: TradeWarCampaign[];
  incidents: TradeIncident[];
  disruptions: RouteDisruptionRecord[];

  // Filter Selections
  selectedCountryId: string | null;
  selectedRouteId: string | null;
  selectedCategory: StrategicTradeCategory | 'ALL';
  compareBilateralPair: { countryA: string; countryB: string } | null;

  // Cache of computed indices
  dependencySummaries: Record<string, TradeDependencySummary>;
  exposureScores: Record<string, TradeExposureScore>;
}

interface TradeActions {
  setSelectedCountryId: (id: string | null) => void;
  setSelectedRouteId: (id: string | null) => void;
  setSelectedCategory: (cat: StrategicTradeCategory | 'ALL') => void;
  setCompareBilateralPair: (pair: { countryA: string; countryB: string } | null) => void;
  
  // Escalation & Policy Actions
  calculateEscalationPreview: (
    actor: string,
    target: string,
    actionType: 'TARIFF' | 'SECTORAL' | 'TOTAL_RUPTURE',
    tariffRate: number,
    categories: StrategicTradeCategory[]
  ) => EscalationPreview;

  executeEscalationAction: (
    actor: string,
    target: string,
    actionType: 'TARIFF' | 'SECTORAL' | 'TOTAL_RUPTURE',
    tariffRate: number,
    categories: StrategicTradeCategory[]
  ) => void;

  toggleRouteStatus: (
    routeId: string,
    status: 'OPERATIONAL' | 'STRESSED' | 'DISRUPTED' | 'BLOCKED'
  ) => void;

  resolveRerouting: (profile: BilateralTradeProfile) => {
    isRerouted: boolean;
    costMultiplier: number;
    delayTicks: number;
    description: string;
  };

  recomputeMetrics: () => void;
  tickTradeSystem: (currentTick: number) => void;
}

export const useTradeStore = create<TradeState & TradeActions>((set, get) => ({
  nodes: INITIAL_ROUTE_NODES,
  segments: INITIAL_ROUTE_SEGMENTS,
  profiles: INITIAL_BILATERAL_PROFILES,
  campaigns: [],
  incidents: INITIAL_TRADE_INCIDENTS,
  disruptions: [],

  selectedCountryId: null,
  selectedRouteId: null,
  selectedCategory: 'ALL',
  compareBilateralPair: null,

  dependencySummaries: {},
  exposureScores: {},

  setSelectedCountryId: (id) => set({ selectedCountryId: id }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setCompareBilateralPair: (pair) => set({ compareBilateralPair: pair }),

  calculateEscalationPreview: (actor, target, actionType, tariffRate, categories) => {
    const state = get();
    // Locate standard profile
    const profile = state.profiles.find(
      (p) =>
        (p.exporterCountryId === actor && p.importerCountryId === target) ||
        (p.exporterCountryId === target && p.importerCountryId === actor)
    );

    const isActorExporter = profile?.exporterCountryId === actor;
    const valueAtRisk = profile ? profile.totalTradeValueB : 15.0;

    let importerPain = 15;
    let exporterPain = 10;
    let gdpDragImporter = 0.1;
    let gdpDragExporter = 0.05;
    let inflImpact = 0.2;
    let rerouteViability: 'HIGH' | 'MEDIUM' | 'LOW' | 'IMPOSSIBLE' = 'HIGH';

    // Base properties based on categories
    if (categories.includes('energy')) {
      importerPain += 40;
      gdpDragImporter += 1.2;
      inflImpact += 2.5;
      rerouteViability = 'LOW'; // pipelines are hard to shift
    }
    if (categories.includes('tech')) {
      importerPain += 35;
      gdpDragImporter += 1.5;
      gdpDragExporter += 0.4;
      rerouteViability = 'MEDIUM';
    }
    if (categories.includes('food')) {
      importerPain += 30;
      gdpDragImporter += 0.8;
      inflImpact += 1.8;
      rerouteViability = 'HIGH';
    }

    if (actionType === 'TARIFF') {
      const multiplier = tariffRate / 100;
      importerPain = Math.round(importerPain * 0.4 * multiplier + 10);
      exporterPain = Math.round(exporterPain * 0.3 * multiplier + 5);
      gdpDragImporter = parseFloat((gdpDragImporter * 0.2 * multiplier).toFixed(2));
      gdpDragExporter = parseFloat((gdpDragExporter * 0.1 * multiplier).toFixed(2));
      inflImpact = parseFloat((inflImpact * 0.4 * multiplier).toFixed(2));
    } else if (actionType === 'SECTORAL') {
      importerPain = Math.min(100, Math.round(importerPain * 1.1 + 20));
      exporterPain = Math.min(100, Math.round(exporterPain * 0.8 + 15));
      gdpDragImporter = parseFloat((gdpDragImporter * 0.9).toFixed(2));
      gdpDragExporter = parseFloat((gdpDragExporter * 0.6).toFixed(2));
      inflImpact = parseFloat((inflImpact * 1.2).toFixed(2));
    } else {
      // TOTAL EMBARGO RUPTURE
      importerPain = Math.min(100, Math.round(importerPain * 2.2 + 35));
      exporterPain = Math.min(100, Math.round(exporterPain * 1.8 + 25));
      gdpDragImporter = parseFloat((gdpDragImporter * 2.2).toFixed(2));
      gdpDragExporter = parseFloat((gdpDragExporter * 1.8).toFixed(2));
      inflImpact = parseFloat((inflImpact * 2.5).toFixed(2));
    }

    // Determine expected retaliations helper
    let retaliationType = 'Unilateral Counter-Tariffs';
    if (actionType === 'SECTORAL') {
      retaliationType = 'Symmetric Sector Sanctions & Asset Freezes';
    } else if (actionType === 'TOTAL_RUPTURE') {
      retaliationType = 'Near-Total Strategic Rupture, Alliance embargoes';
    }

    // Allied spillover reports
    let spillover = 'Limited trade shuffling through safe neutral borders.';
    if (profile?.importDependenceScore && profile.importDependenceScore > 75) {
      spillover = 'Forces alliance block partners to open backup sea pipelines, causing region-wide transport markup spikes.';
    }

    // leverage leverage asymmetry calculation
    const leverage = (profile?.importDependenceScore ?? 50) - (profile?.exportDependenceScore ?? 50);

    return {
      actorCountryId: actor,
      targetCountryId: target,
      actionType,
      affectedCategories: categories,
      directValueAtRiskB: valueAtRisk,
      importerPainScore: isActorExporter ? importerPain : exporterPain,
      exporterPainScore: isActorExporter ? exporterPain : importerPain,
      importerGdpFallPercent: isActorExporter ? gdpDragImporter : gdpDragExporter,
      exporterGdpGrowthDragPercent: isActorExporter ? gdpDragExporter : gdpDragImporter,
      inflationImpactPercent: inflImpact,
      expectedRetaliationType: retaliationType,
      predictedAlliedSpillover: spillover,
      rerouteViability,
      leverageAsymmetry: isActorExporter ? leverage : -leverage
    };
  },

  executeEscalationAction: (actor, target, actionType, tariffRate, categories) => {
    // Generate preview
    const preview = get().calculateEscalationPreview(actor, target, actionType, tariffRate, categories);

    set(produce((draft: TradeState) => {
      // Find matching bilateral profile
      const profileIdx = draft.profiles.findIndex(
        (p) =>
          (p.exporterCountryId === actor && p.importerCountryId === target) ||
          (p.exporterCountryId === target && p.importerCountryId === actor)
      );

      const targetLevel: RestrictionLevel = 
        actionType === 'TARIFF' ? 'TARIFFS' : 
        actionType === 'SECTORAL' ? 'SECTORAL' : 'TOTAL_RUPTURE';

      if (profileIdx !== -1) {
        draft.profiles[profileIdx].currentRestrictionLevel = targetLevel;
        if (actionType === 'TARIFF') {
          draft.profiles[profileIdx].currentTariffPressure = tariffRate;
        } else {
          draft.profiles[profileIdx].currentTariffPressure = 0;
        }
        draft.profiles[profileIdx].restrictedCategories = categories;
        draft.profiles[profileIdx].bilateralTradeTrend = 
          actionType === 'TOTAL_RUPTURE' ? 'COLLAPSED' : 
          actionType === 'SECTORAL' ? 'DECLINING' : 'STABLE';
        draft.profiles[profileIdx].lastUpdatedTick = useWorldStore.getState().currentTick;
      } else {
        // Create new profile dynamically to represent active barrier
        draft.profiles.push({
          exporterCountryId: actor,
          importerCountryId: target,
          totalTradeWeight: 50,
          totalTradeValueB: 12.0,
          categoryBreakdown: categories.map(cat => ({
            categoryId: cat,
            direction: 'EXPORT',
            weightShare: Math.round(100 / categories.length),
            valueIndexB: parseFloat((12.0 / categories.length).toFixed(1)),
            strategicImportance: 7,
            substitutability: 6,
            routeDependence: 5,
            disruptionSensitivity: 40,
            policyExposure: 50
          })),
          importDependenceScore: 50,
          exportDependenceScore: 50,
          substitutionDifficulty: 60,
          strategicSensitivity: 60,
          routeIds: ['node_shanghai'],
          currentRestrictionLevel: targetLevel,
          currentTariffPressure: actionType === 'TARIFF' ? tariffRate : 0,
          restrictedCategories: categories,
          bilateralTradeTrend: targetLevel === 'TOTAL_RUPTURE' ? 'COLLAPSED' : 'DECLINING',
          lastUpdatedTick: useWorldStore.getState().currentTick
        });
      }

      // Add a TradeWarCampaign tracker record
      const campaignIdx = draft.campaigns.findIndex(
        c => (c.actorCountryId === actor && c.targetCountryId === target)
      );
      const levelNum = actionType === 'TARIFF' ? 1 : actionType === 'SECTORAL' ? 2 : 3;

      if (campaignIdx !== -1) {
        draft.campaigns[campaignIdx].escalationStage = levelNum;
        draft.campaigns[campaignIdx].provocationScore = Math.min(100, draft.campaigns[campaignIdx].provocationScore + 20);
        draft.campaigns[campaignIdx].restrictedCategories = categories;
        draft.campaigns[campaignIdx].activeTariffRate = tariffRate;
        draft.campaigns[campaignIdx].history.push({
          tick: useWorldStore.getState().currentTick,
          actionSummary: `Escalated to ${actionType} targeting categories [${categories.join(', ')}]`
        });
      } else {
        draft.campaigns.push({
          id: `camp_${actor}_${target}_${Date.now()}`,
          actorCountryId: actor,
          targetCountryId: target,
          escalationStage: levelNum,
          activeTariffRate: tariffRate,
          restrictedCategories: categories,
          provocationScore: levelNum * 25,
          intelligenceSummary: `Interdependence friction campaign inaugurated by sovereignty actor against ${target}.`,
          retaliationLikelihood: Math.round(40 + levelNum * 15),
          history: [
            {
              tick: useWorldStore.getState().currentTick,
              actionSummary: `Campaign opened. Coercion level: ${actionType}`
            }
          ]
        });
      }

      // Catalog the Incident
      draft.incidents.push({
        id: `inc_${Date.now()}`,
        tick: useWorldStore.getState().currentTick,
        type: actionType === 'TARIFF' ? 'TARIFF_ALERT' : 'SECTORAL_EMBARGO',
        actorCountryId: actor,
        targetCountryId: target,
        summary: `Coercive trade campaign escalated from ${actor} against ${target} using ${actionType} controls.`,
        economicImpactRating: actionType === 'TOTAL_RUPTURE' ? 'SEVERE' : 'STRESSED'
      });
    }));

    // Trigger simulation event bus sync
    const eventBusType = 
      actionType === 'TARIFF' ? 'TRADE_TARIFF_ESCALATED' : 
      actionType === 'SECTORAL' ? 'SECTORAL_TRADE_RESTRICTION_IMPOSED' : 'TOTAL_TRADE_RUPTURE_RISK';

    // Broadcast into Arachne (Intelligence reports)
    useArachneStore.getState().addLiveIntelItem({
      id: `intel_trade_${Date.now()}`,
      title: `🚨 Coercive Trade Coercion: ${actor} Imposes ${actionType}`,
      summary: `Targeting strategic goods [${categories.join(', ')}]. Importer economic drag simulated at -${preview.importerGdpFallPercent}% GDP with an inflation impulse of +${preview.inflationImpactPercent}% on CPI baskets. Retaliation forecasted: ${preview.expectedRetaliationType}.`,
      fullBrief: `The trade-war escalation between ${actor} and ${target} has crossed new thresholds. Critical route nodes and strategic sectors represent immediate risks of allied spillover.`,
      whyItMatters: `This initiates severe pressure on supply chain networks and increases inflation risk across the economic bloc.`,
      countryIds: [target, actor],
      urgency: actionType === 'TOTAL_RUPTURE' ? 'CRITICAL' : 'HIGH',
      confidence: 'TOTAL',
      themeTags: ['ECONOMIC'],
      sourceLabel: 'FINANCIAL WARFARE DIVISION',
      sourceType: 'OSINT'
    });

    // Recompute scores on change
    get().recomputeMetrics();

    // Directly alter macro metrics on worldStore country entities to integrate seamlessly with standard National Macro Model simulation
    useWorldStore.getState().updateCountry(target, (draft) => {
      draft.economic.gdpGrowthRate = Math.max(-5.0, draft.economic.gdpGrowthRate - preview.importerGdpFallPercent);
      draft.economic.inflationRate = Math.min(25.0, draft.economic.inflationRate + preview.inflationImpactPercent);
      draft.economic.debtStressIndex = Math.min(100, draft.economic.debtStressIndex + (actionType === 'TOTAL_RUPTURE' ? 10 : 3));
      draft.economic.unemploymentRate = Math.min(20.0, draft.economic.unemploymentRate + (actionType === 'TOTAL_RUPTURE' ? 2.5 : 0.5));
    });

    useWorldStore.getState().updateCountry(actor, (draft) => {
      draft.economic.gdpGrowthRate = Math.max(-3.0, draft.economic.gdpGrowthRate - preview.exporterGdpGrowthDragPercent);
      draft.economic.treasuryCashB = Math.max(1.0, draft.economic.treasuryCashB - (actionType === 'TOTAL_RUPTURE' ? 4.5 : 1.0));
    });
  },

  toggleRouteStatus: (routeId, status) => {
    set(produce((draft: TradeState) => {
      const nodeIdx = draft.nodes.findIndex(n => n.id === routeId);
      if (nodeIdx !== -1) {
        draft.nodes[nodeIdx].operationalStatus = status;
        draft.nodes[nodeIdx].currentUsage = status === 'BLOCKED' ? 0 : status === 'DISRUPTED' ? 30 : status === 'STRESSED' ? 95 : 75;
      }
      
      const segIdx = draft.segments.findIndex(s => s.id === routeId);
      if (segIdx !== -1) {
        draft.segments[segIdx].status = status;
      }

      // Add disruption node logs
      draft.incidents.push({
        id: `inc_route_${Date.now()}`,
        tick: useWorldStore.getState().currentTick,
        type: 'ROUTE_DISRUPTION',
        routeId: routeId,
        actorCountryId: 'GLOBAL',
        summary: `Strategic corridor segment [${routeId}] reported status change to ${status}. All transit logistics re-routing evaluated.`,
        economicImpactRating: status === 'BLOCKED' || status === 'DISRUPTED' ? 'SEVERE' : 'STRESSED'
      });
    }));

    // Trigger Arachne alert for blocked lanes
    if (status === 'BLOCKED' || status === 'DISRUPTED') {
      useArachneStore.getState().addLiveIntelItem({
        id: `intel_route_disrupt_${Date.now()}`,
        title: `⚠️ ROUTE CRITICAL DEGRADATION: ${routeId}`,
        summary: `Cargo transit networks reported structural congestion or political blockages. Cargo capacity rerouting forced around regional chokepoints. Costs expected to spike systemically.`,
        fullBrief: `The transit corridor at ${routeId} is experiencing immediate operational disruptions, resulting in supply chain lag.`,
        whyItMatters: `Bypass logistics increase freight cost matrices by up to 45%.`,
        countryIds: ['US'],
        urgency: status === 'BLOCKED' ? 'CRITICAL' : 'HIGH',
        confidence: 'TOTAL',
        themeTags: ['DIPLOMACY'],
        sourceLabel: 'FOUNDRY LOGISTICS NETWORK',
        sourceType: 'SIGINT'
      });
    }

    get().recomputeMetrics();
  },

  resolveRerouting: (profile) => {
    // Check if any node in the routeIDs is blocked
    const state = get();
    const activeRouteNodes = state.nodes.filter(n => profile.routeIds.includes(n.id));
    const activeSegments = state.segments.filter(s => profile.routeIds.includes(s.id));

    const isBlocked = activeRouteNodes.some(n => n.operationalStatus === 'BLOCKED') || activeSegments.some(s => s.status === 'BLOCKED');
    const isStressed = activeRouteNodes.some(n => n.operationalStatus === 'DISRUPTED' || n.operationalStatus === 'STRESSED') ||
                       activeSegments.some(s => s.status === 'STRESSED' || s.status === 'DISRUPTED');

    if (isBlocked) {
      // Must reroute or completely disrupt
      const categoriesHardToReplace = profile.categoryBreakdown.filter(c => c.substitutability > 7).map(c => c.categoryId);
      if (categoriesHardToReplace.length > 0) {
        return {
          isRerouted: true,
          costMultiplier: 1.45,
          delayTicks: 3,
          description: `Vessel re-routing active. High-substitutability categories [${categoriesHardToReplace.join(', ')}] locked in bottlenecks. Freight surcharges +45%.`
        };
      }
      return {
        isRerouted: true,
        costMultiplier: 1.25,
        delayTicks: 2,
        description: 'Complete sea-lane bypass activated through Cape/Alternative channels. Minor delays expected.'
      };
    }

    if (isStressed) {
      return {
        isRerouted: false,
        costMultiplier: 1.12,
        delayTicks: 1,
        description: 'Traffic queues at transit lock portals. Surcharges +12% due to port idling and fuel burn.'
      };
    }

    return {
      isRerouted: false,
      costMultiplier: 1.0,
      delayTicks: 0,
      description: 'Lanes clear. Direct transit operational.'
    };
  },

  recomputeMetrics: () => {
    const state = get();
    const profiles = state.profiles;

    const Summaries: Record<string, TradeDependencySummary> = {};
    const Exposure: Record<string, TradeExposureScore> = {};

    // Get list of active countries from profiles
    const countryIds = Array.from(new Set([
      ...profiles.map(p => p.exporterCountryId),
      ...profiles.map(p => p.importerCountryId)
    ]));

    countryIds.forEach(cid => {
      const imports = profiles.filter(p => p.importerCountryId === cid);
      const exports = profiles.filter(p => p.exporterCountryId === cid);

      // Top import partners
      const topImports = imports
        .map(p => ({
          partnerCountryId: p.exporterCountryId,
          valueB: p.totalTradeValueB,
          dependenceScore: p.importDependenceScore
        }))
        .sort((a, b) => b.valueB - a.valueB);

      // Top export partners
      const topExports = exports
        .map(p => ({
          partnerCountryId: p.importerCountryId,
          valueB: p.totalTradeValueB,
          dependenceScore: p.exportDependenceScore
        }))
        .sort((a, b) => b.valueB - a.valueB);

      // Calculate concentration ratio (HHI index)
      const totalVol = imports.reduce((s, p) => s + p.totalTradeValueB, 0) + exports.reduce((s, p) => s + p.totalTradeValueB, 0);
      let hhi = 0;
      if (totalVol > 0) {
        imports.forEach(p => {
          const share = (p.totalTradeValueB / totalVol) * 100;
          hhi += share * share;
        });
        exports.forEach(p => {
          const share = (p.totalTradeValueB / totalVol) * 100;
          hhi += share * share;
        });
      }
      const tradeConcentration = Math.min(100, Math.round(hhi / 100));

      // Route vulnerability index
      let routeVuln = 30;
      const connectedRoutes = Array.from(new Set(imports.flatMap(p => p.routeIds)));
      const nodesRisk = state.nodes.filter(n => connectedRoutes.includes(n.id));
      if (nodesRisk.length > 0) {
        routeVuln = Math.round(nodesRisk.reduce((s, n) => s + n.vulnerabilityScore, 0) / nodesRisk.length);
      }

      // Leverage score
      let leverage = 0;
      imports.forEach(p => {
        leverage += p.exportDependenceScore - p.importDependenceScore; // negative = vulnerable
      });
      exports.forEach(p => {
        leverage += p.exportDependenceScore - p.importDependenceScore; // positive = leverage
      });
      const finalLeverage = Math.min(100, Math.max(-100, Math.round(leverage / Math.max(1, imports.length + exports.length)) + 50));

      Summaries[cid] = {
        countryId: cid,
        topImportPartners: topImports,
        topExportPartners: topExports,
        routeVulnerabilityIndex: routeVuln,
        tradeConcentrationRatio: tradeConcentration,
        coerciveLeverageScore: finalLeverage
      };

      // Recalculate exposures
      const maxImpDep = imports.length > 0 ? Math.max(...imports.map(p => p.importDependenceScore)) : 10;
      let atRiskB = imports.reduce((s, p) => s + (p.currentRestrictionLevel !== 'NONE' ? p.totalTradeValueB * 0.4 : 0), 0);
      atRiskB += exports.reduce((s, p) => s + (p.currentRestrictionLevel !== 'NONE' ? p.totalTradeValueB * 0.2 : 0), 0);

      // Principal category vulnerable
      let topCategory: StrategicTradeCategory = 'energy';
      const categoryTotals: Record<string, number> = {};
      imports.forEach(p => {
        p.categoryBreakdown.forEach(link => {
          categoryTotals[link.categoryId] = (categoryTotals[link.categoryId] || 0) + link.valueIndexB;
        });
      });
      const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 0) topCategory = sortedCats[0][0] as StrategicTradeCategory;

      Exposure[cid] = {
        gdpImpactAtRiskB: parseFloat(atRiskB.toFixed(1)),
        criticalShortageRiskScore: maxImpDep,
        inflationExposureScore: Math.round(maxImpDep * 0.9),
        primaryVulnerabilityCategory: topCategory
      };
    });

    set({ dependencySummaries: Summaries, exposureScores: Exposure });
  },

  tickTradeSystem: (currentTick) => {
    // 1. Process trade-war campaign counters, trigger auto-retaliation if escalation has occurred
    const state = get();
    const activeCampaigns = state.campaigns;

    activeCampaigns.forEach((camp) => {
      // If provocation score is high and target country is player or AI, trigger retaliation
      if (camp.provocationScore > 35 && Math.random() > 0.46) {
        // AI retaliation logic
        const existingCounter = activeCampaigns.find(
          (c) => c.actorCountryId === camp.targetCountryId && c.targetCountryId === camp.actorCountryId
        );

        if (!existingCounter || existingCounter.escalationStage < camp.escalationStage) {
          // AI counter retaliation!
          const actType = camp.escalationStage === 1 ? 'TARIFF' : camp.escalationStage === 2 ? 'SECTORAL' : 'TOTAL_RUPTURE';
          const tRate = camp.escalationStage === 1 ? camp.activeTariffRate : 0;
          const cats = camp.restrictedCategories.length > 0 ? camp.restrictedCategories : ['energy' as StrategicTradeCategory];
          
          setTimeout(() => {
            get().executeEscalationAction(
              camp.targetCountryId,
              camp.actorCountryId,
              actType,
              tRate,
              cats
            );
          }, 300);

          // Spawn intelligence feed
          useArachneStore.getState().addLiveIntelItem({
            id: `intel_trade_retaliation_${Date.now()}`,
            title: `🔄 Asymmetrical Trade Retaliation Implemented`,
            summary: `${camp.targetCountryId} executes automatic retaliatory trade coercion against ${camp.actorCountryId} in defense of sovereignty boundary. Escalation ladder fully active.`,
            fullBrief: `A symmetrical counter-measure has been launched to absorb cost and pressure buffers, establishing a bilateral trade war spiral.`,
            whyItMatters: `This trade war retaliation indicates an active escalation spiral under the Predictive Scenario Engine guidelines.`,
            countryIds: [camp.actorCountryId, camp.targetCountryId],
            urgency: 'HIGH',
            confidence: 'TOTAL',
            themeTags: ['ECONOMIC'],
            sourceLabel: 'ARACHNE GEOPOLITICAL LOG',
            sourceType: 'OSINT'
          });
        }
      }
    });

    // 2. Random chokepoint/sea lane friction events to keep UI alive
    if (Math.random() < 0.15) {
      const activeNodes = state.nodes;
      const randomNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      if (randomNode && randomNode.operationalStatus === 'OPERATIONAL') {
        get().toggleRouteStatus(randomNode.id, 'STRESSED');
      }
    }

    get().recomputeMetrics();
  }
}));
