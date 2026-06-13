import React, { useEffect, useState } from 'react';
import { useWorldStore } from './store/worldStore';
import { usePlayerStore } from './store/playerStore';
import { SCENARIOS } from './data/scenarios';
import { initScenario } from './sim/scenarioEngine';
import { restartTickTimer, stopTickTimer } from './sim/tickEngine';
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

// Immersion upgrade: Comms
import CommsPanel from './components/hud/CommsPanel';
import CommsSyncController from './components/hud/CommsSyncController';
import { useCommsStore } from './store/commsStore';

import { useOnboardingStore } from './store/onboardingStore';
import OnboardingHints from './components/hud/OnboardingHints';

// New features Phase 5 - 10
import CinematicIntro from './components/intro/CinematicIntro';
import GameLobby from './components/intro/GameLobby';
import WorldBuilder from './components/worldbuilder/WorldBuilder';
import StockMarketTicker from './components/reactive/StockMarketTicker';
import NewspaperFeed from './components/reactive/NewspaperFeed';
import UnSecurityCouncil from './components/reactive/UnSecurityCouncil';
import BlackMarketBazaar from './components/blackmarket/BlackMarketBazaar';
import CommandLogPanel from './components/hud/CommandLogPanel';
import DefconBar from './components/hud/DefconBar';
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
    default: return "CONFIDENTIAL";
  }
};

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
  const setTickSpeed = usePlayerStore((s) => s.setTickSpeed);

  useEffect(() => {
    // Synchronize DEFCON variables and classes on initial mount
    const level = useDefconStore.getState().currentDefconLevel;
    applyDefconPalette(level);
  }, []);

  // Intro and game states
  const [showIntro, setShowIntro] = useState(true);
  const [lobbyActive, setLobbyActive] = useState(true);
  const [worldBuilderActive, setWorldBuilderActive] = useState(false);
  const [scenarioSelected, setScenarioSelected] = useState<ScenarioId | null>(null);

  // Map settings
  const [activeLayer, setActiveLayer] = useState<MapLayer>('POLITICAL');
  const [viewMode, setViewMode] = useState<'MAP' | 'GRAPH'>('MAP');

  // Floating modules
  const [showBazaar, setShowBazaar] = useState(false);
  const [commsOpen, setCommsOpen] = useState(false);
  const unreadCommsCount = useCommsStore((s) => s.unreadCount);

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
        return intel ? `ops:${intel.activeCovertOps?.length ?? 0} slush:$${intel.blackBudgetB.toFixed(1)}B` : '';
      }
      case 7: { // SPACE
        const sats = playerCountryData.intelligence?.satellites?.length ?? 0;
        return `sats:${sats} haarp:${playerCountryData.haarpActive ? 'active' : 'stby'}`;
      }
      case 8: { // POPULATION
        return `civs:${playerCountryData.population.toFixed(1)}m unrest:${Math.round(playerCountryData.political.popularUnrest)}%`;
      }
      default:
        return '';
    }
  };

  // Initiate scenario from lobby selection
  const selectScenario = (id: ScenarioId, playableCountryId?: string) => {
    const config = SCENARIOS[id];
    if (!config) return;

    audio.resume();

    const selectedCountryId = playableCountryId || config.playableCountryIds[0] || 'US';

    initScenario(id, selectedCountryId);

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
      // 1. Standard F1 - F8 tab switcher
      if (e.key >= 'F1' && e.key <= 'F8') {
        e.preventDefault();
        const tabNum = parseInt(e.key.substring(1), 10);
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(tabNum);
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
      stopTickTimer();
    };
  }, [countries, playerCountryId, currentTick]);

  const resolution: 'ONGOING' | 'VICTORY' | 'DEFEAT' = playerState.victoryAchieved
    ? 'VICTORY'
    : playerState.gameOver
    ? 'DEFEAT'
    : 'ONGOING';

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
      />
    );
  }

  // 4. Main Dashboard Simulation View
  return (
    <div className="h-screen w-screen flex flex-col bg-[#030503] relative text-xs font-mono overflow-hidden">
      {/* Popups, Alerts & Bazaar overlays */}
      <CountryInspector />
      <AlertBanner />
      <OnboardingHints />
      {showBazaar && <BlackMarketBazaar onClose={() => setShowBazaar(false)} />}
      <CommsSyncController />
      <CommsPanel isOpen={commsOpen} onClose={() => setCommsOpen(false)} />

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
            <span>TREASURY RES: ${playerState.cashB.toFixed(1)}B</span>
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
              {(analysisMode === 'MAP' || analysisMode === 'SPLIT') && (
                <MapControls
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                />
              )}

              {/* View selection routing */}
              <div className="flex-1 relative bg-black overflow-hidden select-none">
                {analysisMode === 'MAP' && (
                  <WorldMap activeLayer={activeLayer} />
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
                      <WorldMap activeLayer={activeLayer} />
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
                ].map((tab) => {
                  const isActive = playerState.activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { audio.sfxKeyClick(); playerState.setActiveTab(tab.id); }}
                      className={`btn-sovereign text-[8px] tracking-wider py-1.5 px-3.5 whitespace-nowrap flex flex-col justify-center items-center min-w-[110px] border rounded transition-all select-none cursor-pointer ${
                        isActive 
                          ? 'border-[#00ff44] text-[#00ff44] bg-[#0c1f0d] shadow-[0_0_8px_rgba(0,255,68,0.15)] active' 
                          : 'border-[#1a5c1a]/35 bg-[#020502] text-gray-400 hover:border-green-800 hover:text-white'
                      }`}
                    >
                      <span className="font-bold tracking-widest">{tab.label}</span>
                      <span className="text-[7.5px] text-[#00e5ff] font-medium mt-0.5 tracking-normal opacity-90 select-none">{getTabKPI(tab.id)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active panel — customized with .gotham-panel and .gotham-panel--primary system */}
            <div 
              className="gotham-panel gotham-panel--primary mb-3.5" 
              data-classification={getTabClassification(playerState.activeTab)}
              style={{ minHeight: '340px' }}
            >
              {playerState.activeTab === 1 && <GovernmentPanel />}
              {playerState.activeTab === 2 && <CentralBankPanel />}
              {playerState.activeTab === 3 && <ArsenalPanel />}
              {playerState.activeTab === 4 && <DiplomacyPanel />}
              {playerState.activeTab === 5 && <ResearchPanel />}
              {playerState.activeTab === 6 && <IntelPanel />}
              {playerState.activeTab === 7 && <SpacePanel />}
              {playerState.activeTab === 8 && <PopulationPanel />}
            </div>

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

      {/* Game loss or win overlay modals */}
      {resolution !== 'ONGOING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className={`w-full max-w-lg border-2 p-6 rounded text-center font-mono ${resolution === 'VICTORY' ? 'border-[#00ff44] text-[#00ff44] bg-[#021c02]' : 'border-[#ff2244] text-[#ff2244] bg-[#1a0004]'}`}>
            <h2 className="text-2xl font-bold tracking-widest text-shadow mb-3">
              {resolution === 'VICTORY' ? '🏆 CAMPAIGN ACCOMPLISHED' : '💀 SYSTEM DEFEATED'}
            </h2>
            <p className="text-xs mb-6 normal-case leading-relaxed">
              {resolution === 'VICTORY'
                ? `Your sovereign command decisions have achieved victory: ${playerState.victoryReason}`
                : `Sovereign command has collapsed: ${playerState.gameOverReason}`}
            </p>

            <button
              onClick={() => {
                stopTickTimer();
                window.location.reload();
              }}
              className="px-6 py-2 bg-transparent border border-current hover:bg-[#00ff44]/15 rounded font-bold uppercase tracking-wider text-xs cursor-pointer"
            >
              Restart Campaign Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
