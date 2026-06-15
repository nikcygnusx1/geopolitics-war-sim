import { useWorldStore } from '../store/worldStore';
import { useLeaderStore } from '../store/leaderStore';
import { usePlayerStore } from '../store/playerStore';
import { useUnitStore } from '../store/unitStore';
import { useClockStore } from '../store/clockStore';
import { useBlackMarketStore } from '../store/blackMarketStore';
import { ScenarioId, ThreatLevel } from '../types';

export interface ScenarioPackage {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  scenarioVersion: string;
  createdAt: string;
  updatedAt: string;
  sourceType: 'preset' | 'generated' | 'imported' | 'shared-link' | 'custom';
  tags: string[];
  appVersion: string;
  schemaVersion: string;
  compatibilityVersion: string;
  
  // Serialized stores states
  worldState: {
    countries: any;
    world: any;
    worldBuilderConfig: any;
    activeStrikes: any;
    commodityMarkets: any;
    activeArmsDeals: any;
    globalThreatLevel: ThreatLevel;
    nuclearExchangeOccurred: boolean;
    globalEventLog: any[];
    currentTick: number;
    scheduledConsequences: any[];
    recentResolvedConsequences: any[];
    aiOperationsLog: any[];
  };
  leaderState: {
    leadersByCountryId: any;
  };
  playerState: {
    countryId: string;
    hudMode: any;
    activeTab: number;
    cashB: number;
    activeScenario: ScenarioId;
    scenarioStartTick: number;
    totalTicks: number;
    selectedTargetCountryId: string | undefined;
    gameOver: boolean;
    gameOverReason: string | undefined;
    victoryAchieved: boolean;
    victoryReason: string | undefined;
    aftermathActive: boolean;
    aftermathType: any;
    aftermathReason: string | undefined;
  };
  unitState: {
    units: any[];
  };
  clockState: {
    tickDuration: any;
    calendarStartDate: string;
    currentCalendarDate: string;
    currentTick: number;
    durationMode: any;
    timedDurationTicks: number;
  };
  blackMarketState: {
    activeLots: any[];
    playerBids: any[];
    pendingDeliveries: any[];
    internationalSuspicion: number;
    unInvestigationTriggered: boolean;
    sanctionsTriggered: boolean;
  };
}

// IndexedDB Helper
const DB_NAME = 'SovereignCommandPersistDB';
const DB_VERSION = 1;
const STORE_NAME = 'scenarios';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'scenarioId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveScenarioToBrowser(pkg: ScenarioPackage): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(pkg);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadScenarioFromBrowser(scenarioId: string): Promise<ScenarioPackage | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(scenarioId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteScenarioFromBrowser(scenarioId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(scenarioId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listSavedScenarios(): Promise<ScenarioPackage[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      // Sort: recent first
      const list = request.result as ScenarioPackage[];
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

// Native Compression Helpers (Standard Gzip inside stream)
export async function compressString(str: string): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    // Basic base64 fallback for environments where stream compression isn't supported (highly unlikely)
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  const stream = new Blob([new TextEncoder().encode(str)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  const response = new Response(stream);
  const blob = await response.blob();
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1];
      const safe = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      resolve(safe);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function decompressString(base64: string): Promise<string> {
  let binary = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (binary.length % 4) binary += '=';
  
  if (typeof DecompressionStream === 'undefined') {
    return decodeURIComponent(escape(atob(binary)));
  }

  const strBytes = atob(binary);
  const buffer = new Uint8Array(strBytes.length);
  for (let i = 0; i < strBytes.length; i++) {
    buffer[i] = strBytes.charCodeAt(i);
  }
  const stream = new Blob([buffer])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(stream);
  const blob = await response.blob();
  return blob.text();
}

// Core Snapshot Generator
export function createScenarioSnapshot(
  name: string,
  description: string,
  sourceType: ScenarioPackage['sourceType'] = 'custom',
  customId?: string
): ScenarioPackage {
  const worldState = useWorldStore.getState();
  const leaderState = useLeaderStore.getState();
  const playerState = usePlayerStore.getState();
  const unitState = useUnitStore.getState();
  const clockState = useClockStore.getState();
  const blackMarketState = useBlackMarketStore.getState();

  const pkgId = customId || `scen_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  const now = new Date().toISOString();

  // Extract count of sovereign nations
  const countryCount = Object.keys(worldState.countries || {}).length;

  return {
    scenarioId: pkgId,
    scenarioName: name,
    scenarioDescription: description,
    scenarioVersion: '1.0.0',
    createdAt: now,
    updatedAt: now,
    sourceType,
    tags: [
      `${countryCount} Nations`,
      `Tick ${worldState.currentTick}`,
      `Threat: ${worldState.globalThreatLevel}`
    ],
    appVersion: '0.9.0',
    schemaVersion: '1.0.0',
    compatibilityVersion: '1.0.0',

    worldState: {
      countries: JSON.parse(JSON.stringify(worldState.countries)),
      world: JSON.parse(JSON.stringify(worldState.world || null)),
      worldBuilderConfig: JSON.parse(JSON.stringify(worldState.worldBuilderConfig || null)),
      activeStrikes: JSON.parse(JSON.stringify(worldState.activeStrikes || [])),
      commodityMarkets: JSON.parse(JSON.stringify(worldState.commodityMarkets || [])),
      activeArmsDeals: JSON.parse(JSON.stringify(worldState.activeArmsDeals || [])),
      globalThreatLevel: worldState.globalThreatLevel,
      nuclearExchangeOccurred: worldState.nuclearExchangeOccurred,
      globalEventLog: JSON.parse(JSON.stringify(worldState.globalEventLog || [])),
      currentTick: worldState.currentTick,
      scheduledConsequences: JSON.parse(JSON.stringify(worldState.scheduledConsequences || [])),
      recentResolvedConsequences: JSON.parse(JSON.stringify(worldState.recentResolvedConsequences || [])),
      aiOperationsLog: JSON.parse(JSON.stringify(worldState.aiOperationsLog || [])),
    },

    leaderState: {
      leadersByCountryId: JSON.parse(JSON.stringify(leaderState.leadersByCountryId || {})),
    },

    playerState: {
      countryId: playerState.countryId,
      hudMode: playerState.hudMode,
      activeTab: playerState.activeTab,
      cashB: playerState.cashB,
      activeScenario: playerState.activeScenario,
      scenarioStartTick: playerState.scenarioStartTick,
      totalTicks: playerState.totalTicks,
      selectedTargetCountryId: playerState.selectedTargetCountryId,
      gameOver: playerState.gameOver,
      gameOverReason: playerState.gameOverReason,
      victoryAchieved: playerState.victoryAchieved,
      victoryReason: playerState.victoryReason,
      aftermathActive: playerState.aftermathActive,
      aftermathType: playerState.aftermathType,
      aftermathReason: playerState.aftermathReason,
    },

    unitState: {
      units: JSON.parse(JSON.stringify(unitState.units || [])),
    },

    clockState: {
      tickDuration: clockState.tickDuration,
      calendarStartDate: clockState.calendarStartDate,
      currentCalendarDate: clockState.currentCalendarDate,
      currentTick: clockState.currentTick,
      durationMode: clockState.durationMode,
      timedDurationTicks: clockState.timedDurationTicks,
    },

    blackMarketState: {
      activeLots: JSON.parse(JSON.stringify(blackMarketState.activeLots || [])),
      playerBids: JSON.parse(JSON.stringify(blackMarketState.playerBids || [])),
      pendingDeliveries: JSON.parse(JSON.stringify(blackMarketState.pendingDeliveries || [])),
      internationalSuspicion: blackMarketState.internationalSuspicion,
      unInvestigationTriggered: blackMarketState.unInvestigationTriggered,
      sanctionsTriggered: blackMarketState.sanctionsTriggered,
    },
  };
}

// Main Hydrator
export function hydrateScenario(pkg: ScenarioPackage): { success: boolean; error?: string } {
  try {
    // 1. Schemas compatibility validation
    if (!pkg.schemaVersion || !pkg.worldState || !pkg.playerState) {
      throw new Error('Malformed or missing core state properties.');
    }

    // 2. Hydrate worldStore
    useWorldStore.setState({
      countries: JSON.parse(JSON.stringify(pkg.worldState.countries)),
      world: JSON.parse(JSON.stringify(pkg.worldState.world || null)),
      worldBuilderConfig: JSON.parse(JSON.stringify(pkg.worldState.worldBuilderConfig || null)),
      activeStrikes: JSON.parse(JSON.stringify(pkg.worldState.activeStrikes || [])),
      commodityMarkets: JSON.parse(JSON.stringify(pkg.worldState.commodityMarkets || [])),
      activeArmsDeals: JSON.parse(JSON.stringify(pkg.worldState.activeArmsDeals || [])),
      globalThreatLevel: pkg.worldState.globalThreatLevel || 'GREEN',
      nuclearExchangeOccurred: pkg.worldState.nuclearExchangeOccurred || false,
      globalEventLog: JSON.parse(JSON.stringify(pkg.worldState.globalEventLog || [])),
      currentTick: pkg.worldState.currentTick || 0,
      scheduledConsequences: JSON.parse(JSON.stringify(pkg.worldState.scheduledConsequences || [])),
      recentResolvedConsequences: JSON.parse(JSON.stringify(pkg.worldState.recentResolvedConsequences || [])),
      aiOperationsLog: JSON.parse(JSON.stringify(pkg.worldState.aiOperationsLog || [])),
    });

    // 3. Hydrate leaderStore
    if (pkg.leaderState && pkg.leaderState.leadersByCountryId) {
      useLeaderStore.setState({
        leadersByCountryId: JSON.parse(JSON.stringify(pkg.leaderState.leadersByCountryId)),
      });
    }

    // 4. Hydrate playerStore
    usePlayerStore.setState({
      countryId: pkg.playerState.countryId,
      hudMode: pkg.playerState.hudMode || 'STATE',
      activeTab: pkg.playerState.activeTab || 1,
      cashB: pkg.playerState.cashB,
      activeScenario: pkg.playerState.activeScenario,
      scenarioStartTick: pkg.playerState.scenarioStartTick || 0,
      totalTicks: pkg.playerState.totalTicks || 0,
      selectedTargetCountryId: pkg.playerState.selectedTargetCountryId,
      gameOver: pkg.playerState.gameOver || false,
      gameOverReason: pkg.playerState.gameOverReason,
      victoryAchieved: pkg.playerState.victoryAchieved || false,
      victoryReason: pkg.playerState.victoryReason,
      aftermathActive: pkg.playerState.aftermathActive || false,
      aftermathType: pkg.playerState.aftermathType || 'NONE',
      aftermathReason: pkg.playerState.aftermathReason,
      tickSpeed: 'PAUSED', // Always resume in paused status for briefing orientation
    });

    // 5. Hydrate unitStore
    if (pkg.unitState && pkg.unitState.units) {
      useUnitStore.setState({
        units: JSON.parse(JSON.stringify(pkg.unitState.units)),
        selectedUnitId: null,
      });
    }

    // 6. Hydrate clockStore
    if (pkg.clockState) {
      useClockStore.setState({
        tickDuration: pkg.clockState.tickDuration || 'WEEK',
        calendarStartDate: pkg.clockState.calendarStartDate || '2027-01-01',
        currentCalendarDate: pkg.clockState.currentCalendarDate || '2027-01-01',
        currentTick: pkg.clockState.currentTick || 0,
        durationMode: pkg.clockState.durationMode || 'SCENARIO',
        timedDurationTicks: pkg.clockState.timedDurationTicks || 100,
      });
    }

    // 7. Hydrate black market
    if (pkg.blackMarketState) {
      useBlackMarketStore.setState({
        activeLots: JSON.parse(JSON.stringify(pkg.blackMarketState.activeLots || [])),
        playerBids: JSON.parse(JSON.stringify(pkg.blackMarketState.playerBids || [])),
        pendingDeliveries: JSON.parse(JSON.stringify(pkg.blackMarketState.pendingDeliveries || [])),
        internationalSuspicion: pkg.blackMarketState.internationalSuspicion || 0,
        unInvestigationTriggered: pkg.blackMarketState.unInvestigationTriggered || false,
        sanctionsTriggered: pkg.blackMarketState.sanctionsTriggered || false,
      });
    }

    // Sync player cash to matching country
    usePlayerStore.getState().syncCashToCountry();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

// Generate compressed short sharing string
export async function createShareableLink(pkg: ScenarioPackage): Promise<string> {
  const jsonStr = JSON.stringify(pkg);
  const compressed = await compressString(jsonStr);
  const origin = window.location.origin + window.location.pathname;
  return `${origin}?scen_share=${compressed}`;
}

// Handle onboarding boot/restoration
export async function checkAndRestoreSharedScenario(urlSearch: string): Promise<boolean> {
  const params = new URLSearchParams(urlSearch);
  const shareToken = params.get('scen_share');
  if (!shareToken) return false;

  try {
    const jsonStr = await decompressString(shareToken);
    const pkg = JSON.parse(jsonStr) as ScenarioPackage;
    const res = hydrateScenario(pkg);
    return res.success;
  } catch (e) {
    console.error('Failed to parse sharing link or decompress package context:', e);
    return false;
  }
}
