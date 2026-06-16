import React, { useEffect, useState } from 'react';
import { useWorldStore } from './store/worldStore';
import { usePlayerStore } from './store/playerStore';
import { usePropagandaStore } from './store/propagandaStore';
import { SCENARIOS } from './data/scenarios';
import { initScenario } from './sim/scenarioEngine';
import { restartTickTimer, stopTickTimer, executeSimulationStep } from './sim/tickEngine';
import { ScenarioId } from './types';
import { playGlobeTransition } from './utils/transition';
import { audio } from './utils/audio';

// Components
import WorldMap from './components/map/WorldMap';
import AllianceGraph from './components/map/AllianceGraph';
import MapControls, { MapLayer } from './components/map/MapControls';
import GovernmentPanel from './components/panels/GovernmentPanel';
import CentralBankPanel from './components/panels/CentralBankPanel';
import ArsenalPanel from './components/panels/ArsenalPanel';
import DiplomacyPanel from './components/panels/DiplomacyPanel';
import ResearchPanel from './components/panels/ResearchPanel';
import IntelPanel from './components/panels/IntelPanel';
import SpacePanel from './components/panels/SpacePanel';
import PopulationPanel from './components/panels/PopulationPanel';
import PropagandaPanel from './components/panels/PropagandaPanel';
import GothamPanel from './components/panels/GothamPanel';
import FoundryPanel from './components/panels/FoundryPanel';
import FinintPanel from './components/panels/FinintPanel';
import { useFinintStore } from './store/finintStore';
import TradeMatrixPanel from './components/panels/TradeMatrixPanel';
import { useTradeStore } from './store/tradeStore';
import CommandEventBusPanel from './components/panels/CommandEventBusPanel';
import ScenarioPersistencePanel from './components/panels/ScenarioPersistencePanel';
import { checkAndRestoreSharedScenario, hydrateScenario, ScenarioPackage } from './utils/persistence';

import AnalysisModeSwitcher from './components/map/AnalysisModeSwitcher';
import TimelineStrip from './components/map/TimelineStrip';
import TimelineView from './components/panels/TimelineView';
import AnalysisInspector from './components/panels/AnalysisInspector';
import { useLinkedAnalysisStore } from './store/linkedAnalysisStore';

// Telemetry & feeds
import ThermalRecon, { SatelliteWorkstation } from './components/telemetry/ThermalRecon';
import DroneFeed, { DroneWorkstation } from './components/telemetry/DroneFeed';
import CyberFeed, { CyberWorkstation } from './components/telemetry/CyberFeed';
import HaarpRadar, { HaarpWorkstation } from './components/telemetry/HaarpRadar';
import TerminalShell from './components/shared/TerminalShell';
import AlertBanner from './components/shared/AlertBanner';
import DataTicker from './components/shared/DataTicker';
import CountryInspector from './components/popups/CountryInspector';
import { PostGameDebrief } from './components/debrief/PostGameDebrief';

// Immersion upgrade: Comms
import CommsPanel from './components/hud/CommsPanel';
import CommsSyncController from './components/hud/CommsSyncController';
import { useCommsStore } from './store/commsStore';

import CinematicsSyncController from './components/cinematics/CinematicsSyncController';
import CinematicsManager from './components/cinematics/CinematicsManager';

import { useOnboardingStore } from './store/onboardingStore';
import OnboardingHints from './components/hud/OnboardingHints';
import AnimatedValue from './components/shared/AnimatedValue';
import BlinkingDot from './components/shared/BlinkingDot';
import { usePanelAlertState } from './hooks/usePanelAlertState';
import { getPanelAlertSeverity } from './utils/panelAlerts';

// New features Phase 5 - 10
import CinematicIntro from './components/intro/CinematicIntro';
import GameLobby from './components/intro/GameLobby';
import WorldBuilder from './components/worldbuilder/WorldBuilder';
import StockMarketTicker from './components/reactive/StockMarketTicker';

// Arachne additions
import { useArachneStore } from './store/arachneStore';
import ArachneBriefingModal from './components/shared/ArachneBriefingModal';
import NewspaperFeed from './components/reactive/NewspaperFeed';
import UnSecurityCouncil from './components/reactive/UnSecurityCouncil';
import BlackMarketBazaar from './components/blackmarket/BlackMarketBazaar';
import { useBlackMarketStore } from './store/blackMarketStore';
import CommandLogPanel from './components/hud/CommandLogPanel';
import DefconBar from './components/hud/DefconBar';
import WhiteFlashOverlay from './components/hud/WhiteFlashOverlay';
import { useDefconStore, applyDefconPalette } from './store/defconStore';
import { GEO_COORDS } from './data/geoCoords';
import { getTickIncrement } from './sim/militaryEngine';
import { useEconomyStore } from './store/economyStore';
import { useUIStore } from './store/uiStore';

const getTabClassification = (tabId: number): string => {
  switch (tabId) {
    case 1: return "TOP SECRET"; // Government
    case 2: return "CONFIDENTIAL"; // Central bank
    case 3: return "TOP SECRET"; // Arsenal
    case 4: return "SECRET"; // Diplomacy
    case 5: return "RESTRICTED"; // Research
    case 6: return "TOP SECRET"; // Intel
    case 7: return "SECRET"; // Space
    case 8: return "RESTRICTED"; // Population
    case 10: return "COSMIC STRATEGY"; // Event pipeline trace (F10)
    case 11: return "CLASSIFIED ARCHIVE"; // Scenario persistence manager (F11)
    case 12: return "GOTHAM SIGNAL GRAPH"; // Geopolitical network (F12)
    case 13: return "FOUNDRY LOGISTICS"; // Supply-Chain Intelligence (Shift+F1)
    case 14: return "FINANCIAL WARFARE"; // Financial Special Operations (Shift+F2)
    case 15: return "COERCIVE TRADE GRAPH"; // Trade Interdependence (Shift+F3)
    default: return "CONFIDENTIAL";
  }
};

interface TabButtonProps {
  id: number;
  label: string;
  isActive: boolean;
  getTabKPI: (tabId: number) => string;
  onClick: () => void;
  key?: React.Key;
}

function TabButton({ id, label, isActive, getTabKPI, onClick }: TabButtonProps) {
  const { severity, isAlertActive } = usePanelAlertState((worldState, country) => {
    return getPanelAlertSeverity(id, worldState, country);
  });

  const getAlertClass = () => {
    if (severity === 'critical') return 'state-critical';
    if (severity === 'warning') return 'state-warning';
    return '';
  };

  const alertClass = getAlertClass();

  return (
    <button
      onClick={onClick}
      className={`btn-sovereign text-[8px] tracking-wider py-1.5 px-3.5 whitespace-nowrap flex flex-col justify-center items-center min-w-[110px] border rounded transition-all select-none cursor-pointer ${alertClass} ${
        isActive 
          ? 'border-[#00ff44] text-[#00ff44] bg-[#0c1f0d] shadow-[0_0_8px_rgba(0,255,68,0.15)] active' 
          : 'border-[#1a5c1a]/35 bg-[#020502] text-gray-400 hover:border-green-800 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isAlertActive && <BlinkingDot severity={severity} />}
        <span className="font-bold tracking-widest">{label}</span>
      </div>
      <span className="text-[7.5px] text-[#00e5ff] font-medium mt-0.5 tracking-normal opacity-90 select-none">{getTabKPI(id)}</span>
    </button>
  );
}

function ActivePanelWrapper({ activeTab, getTabClassification }: { activeTab: number, getTabClassification: (tab: number) => string }) {
  const { severity } = usePanelAlertState((worldState, country) => {
    return getPanelAlertSeverity(activeTab, worldState, country);
  });

  const getAlertClass = () => {
    if (severity === 'critical') return 'state-critical';
    if (severity === 'warning') return 'state-warning';
    return '';
  };

  const alertClass = getAlertClass();

  return (
    <div 
      className={`gotham-panel gotham-panel--primary mb-3.5 ${alertClass}`} 
      data-classification={getTabClassification(activeTab)}
      style={{ minHeight: '340px' }}
    >
      {activeTab === 1 && <GovernmentPanel />}
      {activeTab === 2 && <CentralBankPanel />}
      {activeTab === 3 && <ArsenalPanel />}
      {activeTab === 4 && <DiplomacyPanel />}
      {activeTab === 5 && <ResearchPanel />}
      {activeTab === 6 && <IntelPanel />}
      {activeTab === 7 && <SpacePanel />}
      {activeTab === 8 && <PopulationPanel />}
      {activeTab === 9 && <PropagandaPanel />}
      {activeTab === 10 && <CommandEventBusPanel />}
      {activeTab === 11 && <ScenarioPersistencePanel />}
      {activeTab === 12 && <GothamPanel />}
      {activeTab === 13 && <FoundryPanel />}
      {activeTab === 14 && <FinintPanel />}
      {activeTab === 15 && <TradeMatrixPanel />}
    </div>
  );
}

export default function App() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

  const expandedWorkstation = useUIStore((s) => s.expandedWorkstation);
  const setExpandedWorkstation = useUIStore((s) => s.setExpandedWorkstation);

  const analysisMode = useLinkedAnalysisStore((s) => s.analysisMode);
  const isMaximized = useLinkedAnalysisStore((s) => s.isMaximized);
  const inspectorCollapsed = useLinkedAnalysisStore((s) => s.inspectorCollapsed);

  const playerCountryId = usePlayerStore((s) => s.countryId);
  const playerState = usePlayerStore();
  const worldState = useWorldStore();
  const setTickSpeed = usePlayerStore((s) => s.setTickSpeed);
  const suspicion = useBlackMarketStore((s) => s.internationalSuspicion);

  useEffect(() => {
    // Synchronize DEFCON variables and classes on initial mount
    const level = useDefconStore.getState().currentDefconLevel;
    applyDefconPalette(level);

    // Stop tick timer only on true app unmount
    return () => {
      stopTickTimer();
    };
  }, []);

  // Intro and game states
  const [showIntro, setShowIntro] = useState(true);
  const [lobbyActive, setLobbyActive] = useState(true);
  const [worldBuilderActive, setWorldBuilderActive] = useState(false);
  const [scenarioSelected, setScenarioSelected] = useState<ScenarioId | null>(null);

  // Hook up instant scenario restoration from URL share tokens
  useEffect(() => {
    checkAndRestoreSharedScenario(window.location.search).then((success) => {
      if (success) {
        setShowIntro(false);
        setLobbyActive(false);
        setWorldBuilderActive(false);
        // Clear search tokens safely to avoid re-hydrations on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
  }, []);

  // Map settings
  const [activeLayer, setActiveLayer] = useState<MapLayer>('POLITICAL');
  const [viewMode, setViewMode] = useState<'MAP' | 'GRAPH'>('MAP');

  // Floating modules
  const [showBazaar, setShowBazaar] = useState(false);
  const [commsOpen, setCommsOpen] = useState(false);
  const unreadCommsCount = useCommsStore((s) => s.unreadCount);

  // Aftermath states
  const [aftermathCountdown, setAftermathCountdown] = useState<number | null>(null);
  const [showChoices, setShowChoices] = useState(false);
  const [spectatingAftermath, setSpectatingAftermath] = useState(false);

  useEffect(() => {
    if (playerState.aftermathActive) {
      setAftermathCountdown(6); // 6-second dramatic pause for nuclear fallout/impact VFX
      setShowChoices(false);
      setSpectatingAftermath(false);
      
      const interval = setInterval(() => {
        setAftermathCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            setShowChoices(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setAftermathCountdown(null);
      setShowChoices(false);
      setSpectatingAftermath(false);
    }
  }, [playerState.aftermathActive]);

  const playerCountryData = countries[playerCountryId];

  // Real-time State-Driven KPI extractor for each F-Tab
  const getTabKPI = (tabId: number): string => {
    if (!playerCountryData) return '';
    switch (tabId) {
      case 1: { // GOVERNMENT
        const pol = playerCountryData.political;
        return pol ? `unrest:${Math.round(pol.popularUnrest)}% appr:${Math.round(pol.leaderApprovalRating)}%` : '';
      }
      case 2: { // CENTRAL BANK
        const econ = playerCountryData.economic;
        return econ ? `inf:${econ.inflationRate.toFixed(1)}% cash:$${econ.treasuryCashB.toFixed(0)}B` : '';
      }
      case 3: { // ARSENAL
        const ars = playerCountryData.arsenal;
        const count = ars?.units.reduce((sum, u) => sum + u.count, 0) ?? 0;
        return ars ? `stock:${count} abm:${ars.abmShieldStrength}%` : '';
      }
      case 4: { // DIPLOMACY
        const partners = playerCountryData.tradePartners?.length ?? 0;
        return `bloc:${playerCountryData.allianceBlock.substring(0, 4)} part:${partners}`;
      }
      case 5: { // RESEARCH
        const unlockedCount = playerCountryData.researchUnlocked?.length ?? 0;
        return `r&d:${unlockedCount}/6 tech`;
      }
      case 6: { // INTELLIGENCE
        const intel = playerCountryData.intelligence;
        const unread = useArachneStore.getState().unreadAlertCount;
        return intel ? `brief:${unread} ops:${intel.activeCovertOps?.length ?? 0}` : '';
      }
      case 7: { // SPACE
        const sats = playerCountryData.intelligence?.satellites?.length ?? 0;
        return `sats:${sats} haarp:${playerCountryData.haarpActive ? 'active' : 'stby'}`;
      }
      case 8: { // POPULATION
        return `civs:${playerCountryData.population.toFixed(1)}m unrest:${Math.round(playerCountryData.political.popularUnrest)}%`;
      }
      case 9: { // PROPAGANDA
        const opsCount = usePropagandaStore.getState().activeOperations.filter(o => o.createdBy === 'PLAYER' && o.active).length;
        const score = playerCountryData.domesticNarrative ?? 55;
        return `ops:${opsCount} dms:${score.toFixed(0)}%`;
      }
      case 10: { // SHIFT EVENT PIPELINE
        const busHistory = useWorldStore.getState().world?.busEventHistory?.length || 0;
        return `signals:${busHistory} active`;
      }
      case 12: { // GOTHAM GRAPH
        const stability = Math.round(
          Object.values(countries).reduce((sum, n) => sum + (n.political?.stabilityIndex ?? 50), 0) / Object.keys(countries).length
        );
        return `stab:${stability}%`;
      }
      case 13: { // FOUNDRY LOGISTICS
        return `flows:10 secure`;
      }
      case 14: { // FINANCIAL SPECIAL OPERATIONS (FININT)
        return `blowback:${Math.round(useFinintStore.getState().globalAggregatedBlowback)}%`;
      }
      case 15: { // TRADE MATRIX (Shift+F3)
        const campaignsCount = useTradeStore.getState().campaigns.length;
        return `friction:${campaignsCount} active`;
      }
      default:
        return '';
    }
  };

  // Initiate scenario from lobby selection
  const selectScenario = (id: ScenarioId, playableCountryId?: string, customOptions?: any) => {
    const config = SCENARIOS[id];
    if (!config) return;

    audio.resume();

    const selectedCountryId = playableCountryId || config.playableCountryIds[0] || 'US';

    initScenario(id, selectedCountryId, customOptions?.leaderOverrides);

    setScenarioSelected(id);
    setLobbyActive(false);
    setTickSpeed('NORMAL');

    playGlobeTransition(() => {
      restartTickTimer();
    });
  };

  // Initiate custom sandbox from WorldBuilder selection
  const launchSandbox = (selectedCountryId: string, options: any) => {
    audio.resume();
    audio.sfxKlaxon();

    initScenario('MENA_SPARK', selectedCountryId); // Core structures setup

    useWorldStore.getState().applyTickDelta((draft) => {
      draft.currentTick = 0;
      draft.globalThreatLevel = options.tensionPreset === 'INFERNO' ? 'RED' : options.tensionPreset === 'WORLD_ON_EDGE' ? 'ORANGE' : 'GREEN';
      draft.nuclearExchangeOccurred = false;
      draft.activeStrikes = [];

      Object.keys(draft.countries).forEach((id) => {
        const c = draft.countries[id];
        if (c) {
          if (options.tensionPreset === 'COLD_PEACE') {
            c.atWarWith = [];
            Object.keys(c.opinions).forEach((k) => { c.opinions[k] = 60; });
          } else if (options.tensionPreset === 'INFERNO') {
            c.atWarWith = Object.keys(draft.countries).filter((ni) => ni !== id).slice(0, 3);
            Object.keys(c.opinions).forEach((k) => { c.opinions[k] = -80; });
          }
          c.economic.treasuryCashB = Math.round(c.economic.treasuryCashB * options.spendingMultiplier * 10) / 10;
        }
      });
    });

    setScenarioSelected('MENA_SPARK');
    setLobbyActive(false);
    setWorldBuilderActive(false);
    setTickSpeed('NORMAL');

    playGlobeTransition(() => {
      restartTickTimer();
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Standard F1 - F11 tab switcher
      if (e.key >= 'F1' && e.key <= 'F9') {
        e.preventDefault();
        const tabNum = parseInt(e.key.substring(1), 10);
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(tabNum);
        return;
      }

      if (e.key === 'F10' || e.key === 'F11' || e.key === 'F12') {
        e.preventDefault();
        const tabNum = parseInt(e.key.substring(1), 10);
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(tabNum);
        return;
      }

      // Check Shift+F1 for Foundry Logistics routing console
      if (e.key === 'F1' && e.shiftKey) {
        e.preventDefault();
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(13);
        return;
      }

      // Check Shift+F2 for Financial Warfare (FININT) command console
      if (e.key === 'F2' && e.shiftKey) {
        e.preventDefault();
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(14);
        return;
      }

      // Check Shift+F3 for Trade Interdependence (TRADE MATRIX) command console
      if (e.key === 'F3' && e.shiftKey) {
        e.preventDefault();
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(15);
        return;
      }

      // Check key 'c' to toggle Comms Center
      if (e.key.toLowerCase() === 'c' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        const isInputActive = document.activeElement && (
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT' ||
          document.activeElement.getAttribute('contenteditable') === 'true'
        );
        if (!isInputActive) {
          e.preventDefault();
          audio.sfxKeyClick();
          setCommsOpen((prev) => !prev);
          return;
        }
      }

      // 2. Alt combinations for strategic rapid actions
      if (e.altKey) {
        const key = e.key.toLowerCase();
        
        // Safety guard: ignore if typing in fields or selectors
        const isInputActive = document.activeElement && (
          document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT' ||
          document.activeElement.getAttribute('contenteditable') === 'true'
        );
        if (isInputActive) return;

        const pCountry = countries[playerCountryId];
        if (!pCountry) return;

        if (key === 'm') {
          // Alt+M: Toggle Martial Law
          e.preventDefault();
          let nextActiveState = false;
          useWorldStore.getState().applyTickDelta((draft) => {
            const c = draft.countries[playerCountryId];
            if (c) {
              if (c.political.martialLawActive) {
                c.political.martialLawActive = false;
                c.political.martialLawTicksRemaining = 0;
              } else {
                c.political.martialLawActive = true;
                c.political.martialLawTicksRemaining = 25;
                c.political.stabilityIndex = Math.min(100, c.political.stabilityIndex + 15);
                c.political.popularUnrest = Math.max(0, c.political.popularUnrest - 20);
                nextActiveState = true;
              }
            }
          });
          
          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent(
            `Federal martial decree updated in ${pCountry.name}: Status is ${nextActiveState ? 'OPERATIONAL' : 'DORMANT'}.`,
            nextActiveState ? 'WARNING' : 'INFO'
          );

          useUIStore.getState().pushAlert({
            title: nextActiveState ? 'MARTIAL LAW ENFORCED' : 'MARTIAL LAW STAND-DOWN',
            message: nextActiveState 
              ? 'Sovereign forces deployed to metropolitan sectors. Unrest is suppressed, borders secured.'
              : 'Emergency martial guidelines lifted. Democratic channels restored.',
            type: nextActiveState ? 'WARNING' : 'INFO'
          });
        } else if (key === 'b') {
          // Alt+B: Issue Sovereign Bonds
          e.preventDefault();
          const bondAmt = 10;
          const bondRate = 5.5;
          const bondTicks = 20;

          useWorldStore.getState().applyTickDelta((draft) => {
            const c = draft.countries[playerCountryId];
            if (c) {
              c.economic.treasuryCashB += bondAmt;
              c.economic.debtToGdpRatio += Math.round((bondAmt / c.economic.gdpB) * 100);
              c.economic.bonds.push({
                id: `bond_${Math.random().toString().substring(2,6)}`,
                amount: bondAmt,
                interestRate: bondRate,
                maturityTicks: bondTicks,
                remainingTicks: bondTicks,
                holder: 'MARKET',
              });
            }
          });
          usePlayerStore.setState({ cashB: usePlayerStore.getState().cashB + bondAmt });

          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent(`Bond Desk: Discharged $${bondAmt}B treasury bills via Alt+B.`, 'INFO');
          
          useUIStore.getState().pushAlert({
            title: 'BOND ENVELOPE ISSUED (ALT+B)',
            message: `Distributed $${bondAmt}B sovereign treasury bills at ${bondRate}% APY maturing in ${bondTicks} ticks. Cash injected immediately.`,
            type: 'INFO'
          });
        } else if (key === 'p') {
          // Alt+P: Toggle Printing Press
          e.preventDefault();
          let isPrinting = false;
          useWorldStore.getState().applyTickDelta((draft) => {
            const c = draft.countries[playerCountryId];
            if (c) {
              c.economic.printingPressActive = !c.economic.printingPressActive;
              isPrinting = c.economic.printingPressActive;
            }
          });

          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent(`Central Bank: Printing press toggled via Hotkey. Status: ${isPrinting ? 'ACTIVE' : 'INACTIVE'}.`, 'INFO');
          
          useUIStore.getState().pushAlert({
            title: isPrinting ? 'PRINTING PRESS ENGAGED' : 'PRINTING PRESS HALTED',
            message: isPrinting 
              ? 'Quantitative easing active. Treasury gains instant liquidity but fuels inflation index risk.' 
              : 'Sovereign currency printing stopped.',
            type: isPrinting ? 'WARNING' : 'INFO'
          });
        } else if (key === 'r') {
          // Alt+R: Refuel All Missiles
          e.preventDefault();
          const cost = 2.0;
          if (usePlayerStore.getState().cashB < cost) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'REFUELLING DIRECTIVE REJECTED',
              message: 'Treasury bounds error: Refuelling operation requires $2.0B.',
              type: 'DANGER'
            });
            return;
          }

          usePlayerStore.setState(s => ({ cashB: s.cashB - cost }));
          usePlayerStore.getState().syncCashToCountry();

          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent('Logistics Desk: Propellant full fuel charge injected via Alt+R.', 'INFO');
          
          useUIStore.getState().pushAlert({
            title: 'FLEET FUEL RESET (ALT+R)',
            message: 'All ordnance missile compartments refueled to 100% and ready to launch.',
            type: 'INFO'
          });
        } else if (key === 'l') {
          // Alt+L: Deploy Tactical Rocket Strike
          e.preventDefault();
          const targetId = usePlayerStore.getState().selectedTargetCountryId;
          if (!targetId) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'LAUNCH ABORTED: OFF-LOCK',
              message: 'System lock error: Assign a target from the world map directory to input lock-on telemetry coordinate.',
              type: 'DANGER'
            });
            return;
          }
          if (targetId === playerCountryId) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'LAUNCH FAILS: TARGET INVALID',
              message: 'Launch failed: Self-targeting Capital assets triggered security lock safeguards.',
              type: 'DANGER'
            });
            return;
          }

          // Choose the first weapon with quantity > 0
          let pickedWeaponModule: any = null;
          useWorldStore.getState().applyTickDelta((draft) => {
            const p = draft.countries[playerCountryId];
            if (p) {
              const u = p.arsenal.units.find(ut => ut.count > 0 && ut.fuelLevel >= 20);
              if (u) {
                pickedWeaponModule = u.type;
                u.count--;
                u.operational = u.count;
              }
            }
          });

          if (!pickedWeaponModule) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'WEAPON COLD LOCK',
              message: 'Ordnance failed: No in-stock missile units available in weapons bunkers, or fuel is depleted (<20%).',
              type: 'DANGER'
            });
            return;
          }

          audio.sfxMissileLaunch();
          const scCoords = GEO_COORDS[playerCountryId];
          const tgCoords = GEO_COORDS[targetId];
          const sx = scCoords ? scCoords.cx : 500;
          const sy = scCoords ? scCoords.cy : 250;
          const tx = tgCoords ? tgCoords.cx : 400;
          const ty = tgCoords ? tgCoords.cy : 200;
          const tickDist = Math.max(8, Math.round(100 / getTickIncrement(pickedWeaponModule)));

          useWorldStore.getState().applyTickDelta((draft) => {
            draft.activeStrikes.push({
              id: `strike_alt_${Math.random().toString().substring(2, 8)}`,
              sourceCountryId: playerCountryId,
              targetCountryId: targetId,
              weaponType: pickedWeaponModule,
              progressPct: 0,
              status: 'IN_FLIGHT',
              bezier: {
                startX: sx,
                startY: sy,
                controlX: (sx + tx) / 2,
                controlY: Math.min(sy, ty) - 150,
                endX: tx,
                endY: ty,
              },
              launchTick: currentTick,
              impactTick: currentTick + tickDist,
              isRetaliatory: false,
              interceptAttempted: false,
            });
            draft.globalEventLog.unshift({
              tick: currentTick,
              text: `WAR CLERK: Dispatched 1x ${pickedWeaponModule.replace('_', ' ')} targeting ${targetId} via Rapid Strike Hotkey [AL+L].`,
              severity: 'CRITICAL',
            });
          });

          useUIStore.getState().pushAlert({
            title: 'RAPID MISSILE DEPLOYED (ALT+L)',
            message: `1x Operational "${pickedWeaponModule.replace('_', ' ')}" launched out of silos, targeting [${targetId}]. ETA: ${tickDist} T.`,
            type: 'WARNING'
          });
        } else if (key === 'a') {
          // Alt+A: Dispatch Foreign Aid
          e.preventDefault();
          const targetId = usePlayerStore.getState().selectedTargetCountryId;
          if (!targetId || targetId === playerCountryId) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'FOREIGN AID DENIED',
              message: 'Direct transfer failed: Select a foreign sovereign target to compile aid allocation parameters.',
              type: 'DANGER'
            });
            return;
          }

          const aidAmt = 5.0;
          if (usePlayerStore.getState().cashB < aidAmt) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'FOREIGN AID BLOCKED',
              message: `Liquidity warning: Sovereign treasury bounds exceeded. Requires $${aidAmt}B cash.`,
              type: 'DANGER'
            });
            return;
          }

          usePlayerStore.setState(s => ({ cashB: s.cashB - aidAmt }));
          usePlayerStore.getState().syncCashToCountry();

          useWorldStore.getState().applyTickDelta((draft) => {
            const tgt = draft.countries[targetId];
            if (tgt) {
              tgt.economic.treasuryCashB += aidAmt;
              tgt.opinions[playerCountryId] = Math.min(100, (tgt.opinions[playerCountryId] ?? 0) + 15);
            }
          });

          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent(`State Ministry: Sent $${aidAmt}B in direct economic aid to ${targetId} via ALT+A.`, 'INFO');
          
          useUIStore.getState().pushAlert({
            title: 'FOREIGN AID TRANSCRIBED (ALT+A)',
            message: `Dispatched an official $${aidAmt}B aid package to ${targetId}. opinion rating improved.`,
            type: 'INFO'
          });
        } else if (key === 's') {
          // Alt+S: Impose Sanctions
          e.preventDefault();
          const targetId = usePlayerStore.getState().selectedTargetCountryId;
          const tgtC = countries[targetId || ''];
          if (!targetId || targetId === playerCountryId || !tgtC) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'SANCTIONS DISENGAGED',
              message: 'Execution error: Select an operational target country to impose embargo parameters.',
              type: 'DANGER'
            });
            return;
          }

          useEconomyStore.getState().imposeSanction(playerCountryId, targetId);
          audio.sfxKeyClick();
          
          useWorldStore.getState().addGlobalEvent(`BLOCKADE DECREE: Placed aggregate sanctions on ${targetId} via Rapid Command [Alt+S].`, 'WARNING');
          
          useUIStore.getState().pushAlert({
            title: 'TRADE EMBARGO RATIFIED (ALT+S)',
            message: `Sovereign trade block imposed blockades on all import tech-transfers involving [${targetId}].`,
            type: 'WARNING'
          });
        } else if (key === 't') {
          // Alt+T: Partnership Pact
          e.preventDefault();
          const targetId = usePlayerStore.getState().selectedTargetCountryId;
          const tgtC = countries[targetId || ''];
          if (!targetId || targetId === playerCountryId || !tgtC) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'TREATY RATIFICATION FAILED',
              message: 'Execution error: Select an allied candidate country to propose border alignments.',
              type: 'DANGER'
            });
            return;
          }

          if ((tgtC.opinions[playerCountryId] ?? 0) < 55) {
            audio.sfxKeyClick();
            useUIStore.getState().pushAlert({
              title: 'ALLIANCE NEGOTIATIONS FAILED',
              message: `Treaty rejected: ${tgtC.name} opinion of player block is too low (${Math.round(tgtC.opinions[playerCountryId] ?? 0)}/55 ratio limit).`,
              type: 'WARNING'
            });
            return;
          }

          useWorldStore.getState().applyTickDelta((draft) => {
            const playerC = draft.countries[playerCountryId];
            const targetC = draft.countries[targetId];
            if (playerC && targetC) {
              if (targetC.allianceBlock !== 'NEUTRAL') {
                playerC.allianceBlock = targetC.allianceBlock;
              } else {
                if (!playerC.tradePartners.includes(targetId)) {
                  playerC.tradePartners.push(targetId);
                }
              }
              if (playerC.allianceBlock === 'NEUTRAL' && !targetC.tradePartners.includes(playerCountryId)) {
                targetC.tradePartners.push(playerCountryId);
              }
            }
          });

          audio.sfxKeyClick();
          useWorldStore.getState().addGlobalEvent(`TREATY RATIFIED: Formalized Mutual Defensive Pact aligned with ${targetId} [Alt+T].`, 'INFO');
          
          useUIStore.getState().pushAlert({
            title: 'PARTNERSHIP SIGNED (ALT+T)',
            message: `Ratified bilateral defensive parameters with ${tgtC.name}. Border lines synchronized.`,
            type: 'INFO'
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [countries, playerCountryId, currentTick]);

  const resolution: 'ONGOING' | 'VICTORY' | 'DEFEAT' = playerState.victoryAchieved
    ? 'VICTORY'
    : playerState.gameOver
    ? 'DEFEAT'
    : 'ONGOING';

  const isDebriefOpen = ((resolution !== 'ONGOING') || (playerState.aftermathActive && showChoices)) && !spectatingAftermath;
  const isMapFullyHidden = isDebriefOpen || (expandedWorkstation !== null) || showBazaar;

  // 1. Cinematic Intro Phase
  if (showIntro) {
    return <CinematicIntro onComplete={() => setShowIntro(false)} />;
  }

  // 2. World Builder Sandbox Phase
  if (worldBuilderActive) {
    return (
      <WorldBuilder
        onLaunchSandbox={launchSandbox}
        onBack={() => setWorldBuilderActive(false)}
      />
    );
  }

  // 3. Game Lobby Selection Phase
  if (lobbyActive) {
    return (
      <GameLobby
        onStartScenario={selectScenario}
        onOpenWorldBuilder={() => setWorldBuilderActive(true)}
        onResumeScenario={(pkg: ScenarioPackage) => {
          audio.resume();
          audio.sfxSuccessConfirmation();
          const res = hydrateScenario(pkg);
          if (res.success) {
            setScenarioSelected(pkg.playerState.activeScenario);
            setShowIntro(false);
            setLobbyActive(false);
            setWorldBuilderActive(false);
            useUIStore.getState().pushAlert({
              title: 'PROJECTION RESUMED',
              message: `Restored active projection "${pkg.scenarioName}" at Tick ${pkg.worldState.currentTick}.`,
              type: 'INFO'
            });
            playGlobeTransition(() => {
              restartTickTimer();
            });
          } else {
            audio.sfxCrisisWarning();
            alert(`FAILED TO RESUME DIRECTIVE: ${res.error}`);
          }
        }}
      />
    );
  }

  // 4. Main Dashboard Simulation View
  return (
    <div className="h-screen w-screen flex flex-col bg-[#030503] relative text-xs font-mono overflow-hidden">
      {/* Popups, Alerts & Bazaar overlays */}
      <WhiteFlashOverlay />
      <CountryInspector />
      <AlertBanner />
      <OnboardingHints />
      {showBazaar && <BlackMarketBazaar onClose={() => setShowBazaar(false)} />}
      <CommsSyncController />
      <CommsPanel isOpen={commsOpen} onClose={() => setCommsOpen(false)} />
      <CinematicsSyncController />
      <CinematicsManager />

      {/* Top command status HUD bar */}
      <DefconBar />

      {/* Header bar */}
      <header className="w-full h-11 bg-[#040804] border-b border-[#1a3a1a] flex justify-between items-center px-4 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="text-sm font-black tracking-widest text-[#00ff44] text-shadow-sm uppercase">
            SOVEREIGN COMMAND HUB
          </span>

          <div className="hidden lg:flex items-center gap-3 border-l border-[#1a3a1a] pl-4 text-[10px] opacity-80 uppercase text-gray-500">
            <span>PLAYER BASE: {playerCountryId} {playerCountryData?.flagEmoji}</span>
            <span>TICK CLOCK: {currentTick}</span>
            <span>TREASURY RES: $<AnimatedValue target={playerState.cashB} formatter={(v) => v.toFixed(1)} />B</span>
            <span className="flex items-center gap-1.5 border-l border-[#1a3a1a] pl-3">
              SUSPICION: <span className={`font-bold ${suspicion > 80 ? 'text-red-500 animate-pulse' : suspicion > 60 ? 'text-orange-400' : 'text-yellow-500'}`}>{suspicion}%</span>
              <div className="w-12 bg-gray-950 h-1.5 border border-[#1a3a1a] overflow-hidden rounded relative">
                <div 
                  className={`h-full transition-all duration-300 ${suspicion > 80 ? 'bg-red-500 animate-pulse' : suspicion > 60 ? 'bg-orange-400' : 'bg-yellow-500'}`} 
                  style={{ width: `${suspicion}%` }}
                />
              </div>
            </span>
            <span>GLOBAL STATUS: ACTIVE</span>
          </div>
        </div>

        {/* Global actions: Black Market & Speed controls */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => { audio.playPhaseReveal(); useOnboardingStore.getState().startOnboarding(); }}
            className="px-2.5 py-1 border border-cyan-800 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/40 text-[9px] uppercase font-bold cursor-pointer transition-all"
            title="Sovereign Command Interactive Tactical Manual"
          >
            ❓ SIM GUIDE
          </button>

          <div className="h-4 w-[1px] bg-[#1a3a1a]" />

          <button
            onClick={() => { audio.sfxKeyClick(); setCommsOpen(true); }}
            className={`px-2.5 py-1 border text-[9px] uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              unreadCommsCount > 0
                ? 'border-red-500 text-red-500 bg-red-950/25'
                : 'border-[#00ff44]/60 text-[#00ff44] bg-[#00ff44]/5 hover:bg-[#00ff44]/15'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${unreadCommsCount > 0 ? 'animate-ping bg-red-400' : 'bg-green-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${unreadCommsCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
            </span>
            📡 COMMS PORT {unreadCommsCount > 0 ? `(${unreadCommsCount})` : ''}
          </button>

          <div className="h-4 w-[1px] bg-[#1a3a1a]" />

          <button
            onClick={() => { audio.sfxKeyClick(); setShowBazaar(true); }}
            className="px-2.5 py-1 border border-yellow-800 text-yellow-500 bg-yellow-950/10 hover:bg-yellow-950/30 text-[9px] uppercase font-bold cursor-pointer transition-all"
          >
            ☠️ BLACK BAZAAR
          </button>

          <div className="h-4 w-[1px] bg-[#1a3a1a]" />

          <button
            onClick={() => { setTickSpeed('PAUSED'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'PAUSED' ? 'bg-red-950 text-red-500 font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ⏸️ PAUSE
          </button>
          <button
            onClick={() => { setTickSpeed('NORMAL'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'NORMAL' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ▶️ 1X
          </button>
          <button
            onClick={() => { setTickSpeed('FAST'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'FAST' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ▶️▶️ 2X
          </button>
          <button
            onClick={() => { setTickSpeed('ULTRA'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'ULTRA' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            🔥 HYPER
          </button>

          <div className="h-4 w-[1px] bg-[#1a3a1a]" />

          {/* Time & Speed Controls */}
          <div className="flex items-center gap-1.5 bg-[#020502]/85 border border-[#1a5c1a]/55 p-1 px-1.5 rounded-sm select-none">
            {/* Status Label */}
            <span className={`text-[8.5px] font-extrabold tracking-widest uppercase px-1 rounded-sm border mr-1 ${
              playerState.tickSpeed === 'PAUSED'
                ? 'border-red-950 bg-red-950/20 text-red-500 animate-pulse'
                : 'border-green-950 bg-green-950/20 text-[#00ff44]'
            }`}>
              {playerState.tickSpeed === 'PAUSED' ? '■ PAUSED' : '▶ RUNNING'}
            </span>

            {/* Precise manual stepping buttons */}
            <button
              onClick={() => {
                audio.sfxKeyClick();
                if (playerState.tickSpeed !== 'PAUSED') {
                  setTickSpeed('PAUSED');
                  stopTickTimer();
                }
                executeSimulationStep();
              }}
              className="px-2 py-0.5 border border-[#1a5c1a]/45 bg-[#0c180c] hover:bg-[#1a5c1a]/30 text-white hover:text-[#00ff44] text-[8.5px] uppercase font-bold cursor-pointer transition-all rounded-sm hover:border-[#00ff44]"
              title="Manual Step +1 Tick"
            >
              +1 TURN
            </button>
            <button
              onClick={() => {
                audio.playPhaseReveal();
                if (playerState.tickSpeed !== 'PAUSED') {
                  setTickSpeed('PAUSED');
                  stopTickTimer();
                }
                for (let i = 0; i < 5; i++) {
                  executeSimulationStep();
                }
              }}
              className="px-2 py-0.5 border border-[#1a5c1a]/45 bg-[#0c180c] hover:bg-[#1a5c1a]/30 text-white hover:text-[#00ff44] text-[8.5px] uppercase font-bold cursor-pointer transition-all rounded-sm hover:border-[#00ff44]"
              title="Manual Step +5 Ticks"
            >
              +5 TURNS
            </button>
          </div>
        </div>
      </header>

      {/* Global headline data ticker */}
      <DataTicker />

      {/* Major split sections */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Side: Coordinated Workstation containing Switcher, Canvas, bottom Timeline, and Side Inspector */}
        <div className={`${isMaximized ? 'w-full' : 'w-[58%]'} flex flex-col border-r border-[#1a3a1a] h-full overflow-hidden shrink-0 bg-black transition-all duration-300`}>
          {/* Analysis Workspace switcher command bar */}
          <AnalysisModeSwitcher />

          {/* Coordinated canvas and inspector split */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left element: map / graph / timeline active surface */}
            <div data-testid="onboarding-surface" className="flex-1 flex flex-col overflow-hidden h-full relative">
              {/* Optional dynamic Layer controller */}
              {(analysisMode === 'MAP' || analysisMode === 'SPLIT') && !isMapFullyHidden && (
                <MapControls
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                />
              )}

              {/* View selection routing */}
              <div className="flex-1 relative bg-black overflow-hidden select-none">
                {analysisMode === 'MAP' && (
                  !isMapFullyHidden ? (
                    <WorldMap activeLayer={activeLayer} />
                  ) : (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-gray-500 font-mono text-[10px] gap-2">
                      <span className="animate-pulse">🔒 SECURE INTERFACE EMULATOR DETACHED</span>
                      <span className="text-[8px] text-gray-600">MAP DISENGAGED UNDER SECURITY PROTOCOLS // DOCTRINE ARTIFACT LOADED</span>
                    </div>
                  )
                )}
                {analysisMode === 'GRAPH' && (
                  <AllianceGraph />
                )}
                {analysisMode === 'TIMELINE' && (
                  <TimelineView />
                )}
                {analysisMode === 'SPLIT' && (
                  <div className="h-full flex flex-col divide-y divide-[#1a5c1a]">
                    <div className="flex-1 relative">
                      {!isMapFullyHidden ? (
                        <WorldMap activeLayer={activeLayer} />
                      ) : (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-gray-500 font-mono text-[10px] gap-2">
                          <span className="animate-pulse">🔒 SECURE INTERFACE EMULATOR DETACHED</span>
                          <span className="text-[8px] text-gray-600">MAP SHIELDED IN SIDE-PANE COMPARTMENT</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <AllianceGraph />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom slim timeline strip (visible in Map, Graph, and Split workstation modes) */}
              {analysisMode !== 'TIMELINE' && (
                <TimelineStrip />
              )}
            </div>

            {/* Live Workstation Inspector Sidebar */}
            {!inspectorCollapsed && (
              <div className="w-[230px] border-l border-[#1d3c1d] h-full overflow-hidden shrink-0 bg-[#020502] flex flex-col p-1 animate-fade-in transition-all">
                <AnalysisInspector />
              </div>
            )}
          </div>

          {/* Scrolling ticker tape */}
          <StockMarketTicker />

          {/* Satellite live feeds matrix row */}
          <div className="h-[220px] grid grid-cols-4 gap-1.5 p-1 bg-[#010301] shrink-0 select-none overflow-hidden border-t border-[#1a5c1a]">
            <ThermalRecon />
            <DroneFeed />
            <CyberFeed />
            <HaarpRadar />
          </div>
        </div>

        {/* Right Side: Tab action decks and world intelligence boxes */}
        {!isMaximized && (
          <div data-testid="onboarding-actions" className="flex-1 flex flex-col h-full overflow-y-auto p-4 bg-[#040704] justify-between animate-fade-in scrollbar-thin">
          <div>
            {/* Action command tabs button matrices (F1 - F8) */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-none w-full">
                {[
                  { id: 1, label: 'GOVERNMENT (F1)' },
                  { id: 2, label: 'CENTRAL BANK (F2)' },
                  { id: 3, label: 'ARSENAL (F3)' },
                  { id: 4, label: 'DIPLOMACY (F4)' },
                  { id: 5, label: 'RESEARCH (F5)' },
                  { id: 6, label: 'INTELLIGENCE (F6)' },
                  { id: 7, label: 'SPACE (F7)' },
                  { id: 8, label: 'POPULATION (F8)' },
                  { id: 9, label: 'PROPAGANDA (F9)' },
                  { id: 10, label: 'SIGNAL TRACE (F10)' },
                  { id: 11, label: 'SCENARIOS (F11)' },
                  { id: 12, label: 'GOTHAM GRAPH (F12)' },
                  { id: 13, label: 'FOUNDRY LOGISTICS (Shift+F1)' },
                  { id: 14, label: 'FINANCIAL WARFARE (Shift+F2)' },
                  { id: 15, label: 'TRADE COERCION (Shift+F3)' },
                ].map((tab) => {
                  const isActive = playerState.activeTab === tab.id;
                  return (
                    <TabButton
                      key={tab.id}
                      id={tab.id}
                      label={tab.label}
                      isActive={isActive}
                      getTabKPI={getTabKPI}
                      onClick={() => { audio.sfxKeyClick(); playerState.setActiveTab(tab.id); }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Active panel — customized with .gotham-panel and .gotham-panel--primary system */}
            <ActivePanelWrapper
              activeTab={playerState.activeTab}
              getTabClassification={getTabClassification}
            />

            {/* PERSISTENT OPERATIONS LOG CHANNEL */}
            <CommandLogPanel />
          </div>

          {/* Bottom Reactive columns: Newspaper and UN Council Chambers side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-auto shrink-0 mb-2">
            <NewspaperFeed />
            <UnSecurityCouncil />
          </div>
        </div>
        )}
      </div>

      {/* Bottom telemetry text logs shell console */}
      <TerminalShell />

      {/* Expanded Subsystem Workstations */}
      {expandedWorkstation === 'SATELLITE' && (
        <SatelliteWorkstation onClose={() => setExpandedWorkstation(null)} />
      )}
      {expandedWorkstation === 'DRONE' && (
        <DroneWorkstation onClose={() => setExpandedWorkstation(null)} />
      )}
      {expandedWorkstation === 'CYBER' && (
        <CyberWorkstation onClose={() => setExpandedWorkstation(null)} />
      )}
      {expandedWorkstation === 'HAARP' && (
        <HaarpWorkstation onClose={() => setExpandedWorkstation(null)} />
      )}

      {/* Flashing nuclear aftermath warning overlay (bottom status bar) */}
      {playerState.aftermathActive && aftermathCountdown !== null && aftermathCountdown > 0 && (
        <div className="fixed bottom-14 left-1/2 transform -translate-x-1/2 z-40 bg-black/95 border border-red-500/50 text-red-500 px-6 py-3 rounded shadow-2xl flex items-center gap-3 animate-pulse font-mono tracking-wider max-w-xl text-center">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
          <span className="text-xs uppercase font-bold text-shadow">
            [ DIRECT DIRECTIVE RESOLUTION: SECURING TRANS-ATMOSPHERIC SIGNALS... COUNTDOWN ({aftermathCountdown}S) ]
          </span>
        </div>
      )}

      {/* Floating button when spectating aftermath */}
      {spectatingAftermath && (
        <button
          onClick={() => setSpectatingAftermath(false)}
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-black/95 border rounded-md text-shadow font-black uppercase tracking-widest text-[10px] cursor-pointer animate-pulse shadow-lg ${
            playerState.aftermathType === 'VICTORY' 
              ? 'border-[#00ff44] text-[#00ff44] hover:bg-[#00ff44]/15' 
              : 'border-[#ff2244] text-[#ff2244] hover:bg-[#ff2244]/15'
          }`}
        >
          [ RE-OPEN SIMULATION RESOLUTION MODULE ]
        </button>
      )}

      {/* Unified Campaign Resolution Modals with Checkpoint Rollback */}
      {isDebriefOpen && (
        <PostGameDebrief
          id="tactical-post-game-debrief-overlay"
          worldState={worldState}
          playerState={{
            ...playerState,
            rollbackToCheckpoint: () => {
              setSpectatingAftermath(false);
              playerState.rollbackToCheckpoint();
            }
          }}
          onSpectate={() => setSpectatingAftermath(true)}
          onRestart={() => {
            stopTickTimer();
            window.location.reload();
          }}
        />
      )}

      {/* Presidential Daily Briefing Card Stack Overlay */}
      <ArachneBriefingModal />
    </div>
  );
}
