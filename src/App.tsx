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
import ThermalRecon from './components/telemetry/ThermalRecon';
import DroneFeed from './components/telemetry/DroneFeed';
import CyberFeed from './components/telemetry/CyberFeed';
import HaarpRadar from './components/telemetry/HaarpRadar';
import TerminalShell from './components/shared/TerminalShell';
import AlertBanner from './components/shared/AlertBanner';
import DataTicker from './components/shared/DataTicker';
import CountryInspector from './components/popups/CountryInspector';

// New features Phase 5 - 10
import CinematicIntro from './components/intro/CinematicIntro';
import GameLobby from './components/intro/GameLobby';
import WorldBuilder from './components/worldbuilder/WorldBuilder';
import StockMarketTicker from './components/reactive/StockMarketTicker';
import NewspaperFeed from './components/reactive/NewspaperFeed';
import UnSecurityCouncil from './components/reactive/UnSecurityCouncil';
import BlackMarketBazaar from './components/blackmarket/BlackMarketBazaar';

export default function App() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

  const analysisMode = useLinkedAnalysisStore((s) => s.analysisMode);

  const playerCountryId = usePlayerStore((s) => s.countryId);
  const playerState = usePlayerStore();
  const setTickSpeed = usePlayerStore((s) => s.setTickSpeed);

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

  const playerCountryData = countries[playerCountryId];

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
      if (e.key >= 'F1' && e.key <= 'F8') {
        e.preventDefault();
        const tabNum = parseInt(e.key.substring(1), 10);
        audio.sfxKeyClick();
        usePlayerStore.getState().setActiveTab(tabNum);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopTickTimer();
    };
  }, []);

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
      {showBazaar && <BlackMarketBazaar onClose={() => setShowBazaar(false)} />}

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
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Left Side: Coordinated Workstation containing Switcher, Canvas, bottom Timeline, and Side Inspector */}
        <div className="w-[58%] flex flex-col border-r border-[#1a3a1a] h-full overflow-hidden shrink-0 bg-black">
          {/* Analysis Workspace switcher command bar */}
          <AnalysisModeSwitcher />

          {/* Coordinated canvas and inspector split */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left element: map / graph / timeline active surface */}
            <div className="flex-1 flex flex-col overflow-hidden h-full relative">
              {/* Optional dynamic Layer controller */}
              {(analysisMode === 'MAP' || analysisMode === 'SPLIT') && (
                <MapControls
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  viewMode={analysisMode === 'SPLIT' ? 'MAP' : (analysisMode as any)}
                  setViewMode={() => {}}
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
            <div className="w-[230px] border-l border-[#1d3c1d] h-full overflow-hidden shrink-0 bg-[#020502] flex flex-col p-1">
              <AnalysisInspector />
            </div>
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
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 bg-[#040704] justify-between">
          <div>
            {/* Action command tabs button matrices (F1 - F8) */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-1 overflow-x-auto py-1">
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
                      className={`btn-sovereign text-[8px] tracking-wider py-1.5 whitespace-nowrap ${
                        isActive ? 'active' : ''
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active panel — customized with .instrument-block design system */}
            <div className="instrument-block mb-4" style={{ minHeight: '340px' }}>
              {playerState.activeTab === 1 && <GovernmentPanel />}
              {playerState.activeTab === 2 && <CentralBankPanel />}
              {playerState.activeTab === 3 && <ArsenalPanel />}
              {playerState.activeTab === 4 && <DiplomacyPanel />}
              {playerState.activeTab === 5 && <ResearchPanel />}
              {playerState.activeTab === 6 && <IntelPanel />}
              {playerState.activeTab === 7 && <SpacePanel />}
              {playerState.activeTab === 8 && <PopulationPanel />}
            </div>
          </div>

          {/* Bottom Reactive columns: Newspaper and UN Council Chambers side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-auto shrink-0 mb-2">
            <NewspaperFeed />
            <UnSecurityCouncil />
          </div>
        </div>
      </div>

      {/* Bottom telemetry text logs shell console */}
      <TerminalShell />

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
