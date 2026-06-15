import { create } from 'zustand';
import { produce } from 'immer';
import { ArachneIntelItem, ArachneFilterState, ArachneTheme, ArachneSourceClass, ArachneUrgency, ArachneConfidence, ArachneFreshness, ArachnePriority, ArachneBriefGroup } from '../types/arachne';
import { ScenarioId, WorldState, CountryState, WorldEvent } from '../types';
import { SCENARIO_SEEDS, GLOBAL_BASELINES, generateDynamicWhyItMatters } from '../data/arachneSeeded';
import { useWorldStore } from './worldStore';
import { usePlayerStore } from './playerStore';

interface ArachneState {
  feed: ArachneIntelItem[];
  filters: ArachneFilterState;
  pdbCards: ArachneIntelItem[];
  pdbActive: boolean;
  selectedItemId: string | null;
  unreadAlertCount: number;
}

interface ArachneActions {
  initArachneForScenario: (scenarioId: ScenarioId) => void;
  setPdbActive: (active: boolean) => void;
  dismissPdbCard: (cardId: string) => void;
  setSelectedItem: (itemId: string | null) => void;
  updateFilters: (updates: Partial<ArachneFilterState>) => void;
  resetFilters: () => void;
  addLiveIntelItem: (item: Partial<ArachneIntelItem>) => void;
  tickArachne: (currentTick: number) => void;
}

const initialFilters: ArachneFilterState = {
  searchQuery: '',
  country: 'ALL',
  region: 'ALL',
  theme: 'ALL',
  urgency: 'ALL',
  sourceType: 'ALL',
  confidence: 'ALL',
  freshness: 'ALL_ACTIVE'
};

export const useArachneStore = create<ArachneState & ArachneActions>((set, get) => ({
  feed: [],
  filters: initialFilters,
  pdbCards: [],
  pdbActive: false,
  selectedItemId: null,
  unreadAlertCount: 0,

  initArachneForScenario: (scenarioId: ScenarioId) => {
    const worldState = useWorldStore.getState();
    const seeds = SCENARIO_SEEDS[scenarioId] || [];
    const baselines = GLOBAL_BASELINES;

    // Ingest and build feed
    const initialFeed: ArachneIntelItem[] = [];

    const buildItem = (seed: typeof seeds[0], index: number, isBaseline: boolean): ArachneIntelItem => {
      // Determine strategic priority based on seeds
      let urgRank = 1;
      if (seed.urgency === 'MEDIUM') urgRank = 2;
      else if (seed.urgency === 'HIGH') urgRank = 3;
      else if (seed.urgency === 'CRITICAL') urgRank = 4;

      let confRank = 1;
      if (seed.confidence === 'MEDIUM') confRank = 2;
      if (seed.confidence === 'HIGH') confRank = 3;
      if (seed.confidence === 'TOTAL') confRank = 4;

      // Prioritization math: alertScore: urgency (10-40) + confidence (10-40) + seed bias
      const scoreBase = (urgRank * 10) + (confRank * 8);
      const isCritical = seed.urgency === 'CRITICAL' || seed.strategicPriority === 'CRITICAL';

      // Dynamic analytical "why it matters" summary
      const firstCountry = seed.countryIds[0] || 'US';
      const theme = seed.themeTags[0] || 'MILITARY';
      const dynamicMatters = generateDynamicWhyItMatters(firstCountry, theme, worldState);

      return {
        id: `arc_${scenarioId}_${isBaseline ? 'base' : 'seed'}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        title: seed.title,
        summary: seed.summary,
        fullBrief: seed.fullBrief,
        whyItMatters: seed.whyItMatters || dynamicMatters,
        countryIds: seed.countryIds,
        regionIds: seed.regionIds,
        relatedLeaderIds: [],
        themeTags: seed.themeTags,
        urgency: seed.urgency,
        confidence: seed.confidence,
        sourceType: seed.sourceType,
        sourceLabel: seed.sourceLabel,
        timestampTick: 0,
        freshnessState: isCritical ? 'BREAKING' : 'ACTIVE',
        linkedIntelFactIds: [],
        linkedWorldEventIds: [],
        linkedOperationIds: [],
        relatedTreatyIds: [],
        alertScore: scoreBase + (isBaseline ? 0 : 25),
        strategicPriority: seed.strategicPriority,
        visibility: 'PUBLIC',
        status: 'ACTIVE',
        requiresAttention: seed.requiresAttention,
        briefingCategory: seed.briefingCategory,
        storyId: seed.storyId
      };
    };

    // Build lists
    seeds.forEach((seed, i) => {
      initialFeed.push(buildItem(seed, i, false));
    });

    baselines.forEach((seed, i) => {
      // Avoid raw duplicates if already added as seed
      if (!initialFeed.some(f => f.storyId === seed.storyId)) {
        initialFeed.push(buildItem(seed, i, true));
      }
    });

    // Sort by alertScore descending
    initialFeed.sort((a, b) => b.alertScore - a.alertScore);

    // Filter Top Cart Stack for PDB: Needs 3 to 7 high strategic priority cards
    const pdbList = initialFeed
      .filter(item => item.requiresAttention || item.urgency === 'CRITICAL' || item.urgency === 'HIGH')
      .slice(0, 6);

    const fallbackPdb = pdbList.length >= 3 ? pdbList : initialFeed.slice(0, 4);

    set({
      feed: initialFeed,
      pdbCards: fallbackPdb,
      pdbActive: fallbackPdb.length > 0, // open automatically on scenario load
      selectedItemId: initialFeed[0]?.id || null,
      unreadAlertCount: initialFeed.filter(item => item.requiresAttention).length,
      filters: initialFilters
    });
  },

  setPdbActive: (active) => set({ pdbActive: active }),

  dismissPdbCard: (cardId) => set(produce((draft: ArachneState) => {
    draft.pdbCards = draft.pdbCards.filter(c => c.id !== cardId);
    // Auto close modal if stack is empty
    if (draft.pdbCards.length === 0) {
      draft.pdbActive = false;
    }
  })),

  setSelectedItem: (itemId) => set({ selectedItemId: itemId }),

  updateFilters: (updates) => set(produce((draft: ArachneState) => {
    draft.filters = { ...draft.filters, ...updates };
  })),

  resetFilters: () => set({ filters: initialFilters }),

  addLiveIntelItem: (item) => set(produce((draft: ArachneState) => {
    const worldState = useWorldStore.getState();
    const id = `arc_live_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newItem: ArachneIntelItem = {
      id,
      title: item.title || "SIGINT INTERCEPT: Satellite Telemetry Active",
      summary: item.summary || "High-amplitude signals processed on regional military node.",
      fullBrief: item.fullBrief || "Intermittent command communications indicate military units are verifying encryption sequences, suggesting preparation for posture shifts.",
      whyItMatters: item.whyItMatters || "Strategic coordination suggests heightened regional posture awareness.",
      countryIds: item.countryIds || [],
      regionIds: item.regionIds || ["Global Space Console"],
      relatedLeaderIds: item.relatedLeaderIds || [],
      themeTags: item.themeTags || ["INTELLIGENCE"],
      urgency: item.urgency || "LOW",
      confidence: item.confidence || "MEDIUM",
      sourceType: item.sourceType || "SIGINT",
      sourceLabel: item.sourceLabel || "Sovereign Strategic Constellation",
      timestampTick: worldState.currentTick,
      freshnessState: item.freshnessState || "BREAKING",
      linkedIntelFactIds: item.linkedIntelFactIds || [],
      linkedWorldEventIds: item.linkedWorldEventIds || [],
      linkedOperationIds: item.linkedOperationIds || [],
      relatedTreatyIds: item.relatedTreatyIds || [],
      alertScore: item.alertScore || 30,
      strategicPriority: item.strategicPriority || "BACKGROUND",
      visibility: item.visibility || "PUBLIC",
      status: 'ACTIVE',
      requiresAttention: item.requiresAttention !== undefined ? item.requiresAttention : true,
      briefingCategory: item.briefingCategory || "BACKGROUND_SIGNAL",
      icon: item.icon,
      storyId: item.storyId
    };

    // Prepend to feed and sort again
    draft.feed.unshift(newItem);
    if (newItem.requiresAttention) {
      draft.unreadAlertCount++;
    }

    // Story Clustering: Deduplicate or cluster if storyId matches
    if (newItem.storyId) {
      draft.feed = draft.feed.filter(f => f.id === id || f.storyId !== newItem.storyId);
    }

    // Keep feed length balanced
    if (draft.feed.length > 100) {
      draft.feed.pop();
    }
  })),

  tickArachne: (currentTick) => set(produce((draft: ArachneState) => {
    const worldState = useWorldStore.getState();
    const activeScenario = usePlayerStore.getState().activeScenario;

    // 1. Freshness decay & lifecycle updates
    draft.feed.forEach(item => {
      const age = currentTick - item.timestampTick;
      
      // Decay score slowly as it ages
      if (age > 0) {
        item.alertScore = Math.max(5, item.alertScore - (age * 0.5));
      }

      // Lifecycle status transitions
      if (item.freshnessState === 'BREAKING' && age >= 3) {
        item.freshnessState = 'ACTIVE';
      } else if (item.freshnessState === 'ACTIVE' && age >= 8) {
        item.freshnessState = 'WATCH';
      } else if (item.freshnessState === 'WATCH' && age >= 15) {
        item.freshnessState = 'BACKGROUND';
      } else if (item.freshnessState === 'BACKGROUND' && age >= 25) {
        item.freshnessState = 'STALE';
      }
    });

    // 2. Continuous dynamic report generation from simulated world state changes
    // Check if any major change occurred during this tick and publish an Arachne feed card
    const globalLog = worldState.globalEventLog;
    const latestEvent = globalLog[0]; // peek latest log string

    if (latestEvent && latestEvent.tick === currentTick) {
      const text = latestEvent.text.toUpperCase();
      let theme: ArachneTheme = "DIPLOMACY";
      let urgency: ArachneUrgency = "LOW";
      let confidence: ArachneConfidence = "HIGH";
      let sourceType: ArachneSourceClass = "OSINT";
      let sourceLabel = "Open Satellite Wire / News Agencies";
      let title = "WORLD BRIEF: Geopolitical Movement Recorded";
      let summary = latestEvent.text;
      let fullBrief = `A strategic event was recorded in the global central directory: "${latestEvent.text}". Automated intelligence engines have compiled public and tactical channels to monitor secondary regional effects.`;
      let countryIds: string[] = [];
      let regionIds: string[] = ["Global Arena"];
      let storyId = `log_evt_${currentTick}`;

      // Analyze keyword triggers
      if (text.includes("STRIKE") || text.includes("LAUNCH") || text.includes("MISSILE") || text.includes("IMPACT")) {
        theme = "MILITARY";
        urgency = "CRITICAL";
        confidence = "TOTAL";
        sourceType = "CONFIRMED";
        sourceLabel = "Early-Warning Radar / Airborne Sensors";
        title = "CRITICAL ALERT: Ballistic Missile Event Tracked";
        fullBrief = `Early-warning sensor profiles verified ballistics launching or impacting within sovereign borders. Local intercept shields actively calculated counter-vectors: "${latestEvent.text}".`;
      } else if (text.includes("WAR") || text.includes("DECLARE")) {
        theme = "MILITARY";
        urgency = "CRITICAL";
        confidence = "TOTAL";
        sourceType = "CONFIRMED";
        sourceLabel = "Joint Command Diplomatic Wire";
        title = "CRITICAL ALERT: Active War Status Triggered";
        fullBrief = `Bilateral war declarations have been uploaded to official registers: "${latestEvent.text}". Armed battalions are fully activated and logistics conduits have switched to martial distribution.`;
      } else if (text.includes("SANCTION") || text.includes("EMBARGO")) {
        theme = "SANCTIONS";
        urgency = "HIGH";
        confidence = "TOTAL";
        sourceType = "CONFIRMED";
        sourceLabel = "Sovereign Trade Regulation Desk";
        title = "ECONOMIC MONITOR: Sanctions Regime Enforced";
      } else if (text.includes("CYBER") || text.includes("HACK") || text.includes("INTRUSION")) {
        theme = "CYBER";
        urgency = "HIGH";
        confidence = "HIGH";
        sourceType = "SIGINT";
        sourceLabel = "Signal-Scribe Intrusion Detection System";
        title = "CYBER WATCH: Offensive Firewall Intrusion";
        fullBrief = `High-amplitude payload scans recorded inside state military networks: "${latestEvent.text}". Analysts suspect technical espionage designed to extract active tracking schemas.`;
      } else if (text.includes("UNREST") || text.includes("RIOT") || text.includes("PROTEST")) {
        theme = "UNREST";
        urgency = "HIGH";
        sourceType = "HUMINT";
        confidence = "HIGH";
        sourceLabel = "Local Liaison Informants / Social Media Feeds";
        title = "CIVIL DEFENSE: Spiking Civil Unrest";
        fullBrief = `Spontaneous civilian gathers and riots reported inside key population hubs: "${latestEvent.text}". Civil authority structures are deployed under emergency posture guidelines.`;
      } else if (text.includes("COUP") || text.includes("REBEL")) {
        theme = "LEADERSHIP";
        urgency = "CRITICAL";
        confidence = "HIGH";
        sourceType = "HUMINT";
        sourceLabel = "Defense Intelligence Agent Wire";
        title = "ALERT: Coup Risk Extremes Recorded";
      }

      // Sniff country codes
      Object.keys(worldState.countries).forEach(id => {
        if (text.includes(id) || text.includes(worldState.countries[id].name.toUpperCase())) {
          countryIds.push(id);
          const reg = worldState.countries[id].continent;
          if (reg && !regionIds.includes(reg)) regionIds.push(reg);
        }
      });

      const strategicPriority = (urgency === 'CRITICAL' || urgency === 'HIGH') ? 'CRITICAL' : 'MEDIUM';

      // Dynamic analytical "why it matters" summary
      const firstCountry = countryIds[0] || 'US';
      const dynamicMatters = generateDynamicWhyItMatters(firstCountry, theme, worldState);

      const newItem: ArachneIntelItem = {
        id: `arc_live_event_${currentTick}_${Math.random().toString(36).substring(2,6)}`,
        title,
        summary,
        fullBrief,
        whyItMatters: dynamicMatters,
        countryIds,
        regionIds,
        relatedLeaderIds: [],
        themeTags: [theme],
        urgency,
        confidence,
        sourceType,
        sourceLabel,
        timestampTick: currentTick,
        freshnessState: 'BREAKING',
        linkedIntelFactIds: [],
        linkedWorldEventIds: [],
        linkedOperationIds: [],
        relatedTreatyIds: [],
        alertScore: (urgency === 'CRITICAL' ? 80 : 50) + (confidence === 'TOTAL' ? 15 : 5),
        strategicPriority,
        visibility: 'PUBLIC',
        status: 'ACTIVE',
        requiresAttention: strategicPriority === 'CRITICAL',
        briefingCategory: strategicPriority === 'CRITICAL' ? 'TOP_STORY' : 'ACTIVE_WATCH',
        storyId
      };

      draft.feed.unshift(newItem);
      if (newItem.requiresAttention) {
        draft.unreadAlertCount++;
      }
    }

    // 3. Keep sorted
    draft.feed.sort((a, b) => b.alertScore - a.alertScore);
  }))
}));
