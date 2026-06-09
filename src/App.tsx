import React, { useEffect, useState } from 'react';
import { useWorldStore } from './store/worldStore';
import { usePlayerStore } from './store/playerStore';
import { SCENARIOS } from './data/scenarios';
import { initScenario } from './sim/scenarioEngine';
import { restartTickTimer, stopTickTimer } from './sim/tickEngine';
import { ScenarioId } from './types';

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
import ThermalRecon from './components/telemetry/ThermalRecon';
import DroneFeed from './components/telemetry/DroneFeed';
import CyberFeed from './components/telemetry/CyberFeed';
import HaarpRadar from './components/telemetry/HaarpRadar';
import TerminalShell from './components/shared/TerminalShell';
import AlertBanner from './components/shared/AlertBanner';
import DataTicker from './components/shared/DataTicker';
import CountryInspector from './components/popups/CountryInspector';

export default function App() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

  const playerCountryId = usePlayerStore((s) => s.countryId);
  const playerState = usePlayerStore();
  const setTickSpeed = usePlayerStore((s) => s.setTickSpeed);

  const [scenarioSelected, setScenarioSelected] = useState<ScenarioId | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('POLITICAL');
  const [viewMode, setViewMode] = useState<'MAP' | 'GRAPH'>('MAP');

  const playerCountryData = countries[playerCountryId];

  // Initiate default loop on scenario choice
  const selectScenario = (id: ScenarioId) => {
    const config = SCENARIOS[id];
    if (!config) return;

    // Use default playable country as starting player
    const defaultCountry = config.playableCountryIds[0] || 'US';

    // 1. Core scenario mutation
    initScenario(id, defaultCountry);

    setScenarioSelected(id);
    setTickSpeed('NORMAL');

    // 2. Kickstart the tick timing engines
    setTimeout(() => {
      restartTickTimer();
    }, 100);
  };

  // Turn off timer on unmount
  useEffect(() => {
    return () => {
      stopTickTimer();
    };
  }, []);

  const resolution: 'ONGOING' | 'VICTORY' | 'DEFEAT' = playerState.victoryAchieved
    ? 'VICTORY'
    : playerState.gameOver
    ? 'DEFEAT'
    : 'ONGOING';

  if (!scenarioSelected) {
    // Elegant boot scenario selection interface
    return (
      <div className="min-h-screen bg-[#020502] flex flex-col justify-center items-center p-4">
        <div className="absolute inset-0 bg-radial-at-c from-green-950/15 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-4xl border border-[#1a3a1a] bg-[#050a05] shadow-2xl p-6 rounded relative z-10 font-mono text-[#00ff44]">
          {/* Top terminal headers decor */}
          <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-3 mb-6">
            <span className="text-xs uppercase tracking-widest text-[#00e5ff] font-bold">
              🖥&gt; SOVEREIGN COMMAND SIMULATOR v2.4a
            </span>
            <span className="text-[10px] text-gray-500">
              DESKTOP-READY CRT CONSOLE LOCK
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-shadow-md text-phosphor-green uppercase">
              Sovereign Operational Theater Briefing
            </h1>
            <p className="text-xs text-gray-400 mt-2 max-w-lg mx-auto normal-case leading-relaxed">
              Formulate taxation, deploy signal covert hacking intercepts, issue quantitative bonds, target orbital HAARP climate cells, and guide nuclear vectors to secure global domain hegemony.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(SCENARIOS).map((sc) => (
              <div
                key={sc.id}
                onClick={() => selectScenario(sc.id)}
                className="border border-[#1a3a1a] bg-[#030603] hover:border-[#00ff44] hover:bg-[#060f06] p-4 rounded flex flex-col justify-between gap-4 cursor-pointer group transition-all duration-300"
              >
                <div>
                  <div className="flex justify-between items-center font-bold pb-1.5 border-b border-[#0d1f0d]">
                    <span className="text-[#00e5ff] text-shadow group-hover:text-white transition-colors uppercase text-xs">
                      {sc.name}
                    </span>
                    <span className="text-[9px] text-[#ffb300]">
                      PLAY: {sc.playableCountryIds[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 normal-case leading-relaxed mt-2 text-left">
                    {sc.description}
                  </p>
                </div>

                <div className="text-[9px] border-t border-[#0d1f0d] pt-2 mt-1 space-y-1 text-gray-400 font-sans">
                  <div>
                    <span className="text-[#ff2244] uppercase font-bold font-mono">VICTORY TARGETS</span>: {sc.winDescription}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt footer */}
          <div className="mt-8 pt-4 border-t border-[#1a3a1a] text-center text-[10px] text-gray-600 uppercase">
            Awaiting commander directive selector... select sector to deploy full theater matrix.
          </div>
        </div>
      </div>
    );
  }

  // Active sovereign commanding dashboard
  return (
    <div className="h-screen w-screen flex flex-col bg-[#030503] relative text-xs font-mono overflow-hidden">
      {/* Dynamic Popups Inspector */}
      <CountryInspector />
      {/* Top alert widgets */}
      <AlertBanner />

      {/* 1. TOP HEADER STATUS BAR */}
      <header className="w-full h-11 bg-[#040804] border-b border-[#1a3a1a] flex justify-between items-center px-4 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="text-sm font-black tracking-widest text-phosphor-green text-shadow-sm uppercase">
            SOVEREIGN COMMAND HUB
          </span>

          <div className="hidden lg:flex items-center gap-3 border-l border-[#1a3a1a] pl-4 text-[10px] opacity-80 uppercase text-gray-500">
            <span>PLAYER BASE: {playerCountryId} {playerCountryData?.flagEmoji}</span>
            <span>TICK CLOCK: {currentTick}</span>
            <span>TREASURY RES: ${playerState.cashB.toFixed(1)}B</span>
            <span>GLOBAL STATUS: ACTIVE</span>
          </div>
        </div>

        {/* Speed selectors */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => { setTickSpeed('PAUSED'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'PAUSED' ? 'bg-red-950 text-phosphor-red font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ⏸️ PAUSE
          </button>
          <button
            onClick={() => { setTickSpeed('NORMAL'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'NORMAL' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ▶️ 1x
          </button>
          <button
            onClick={() => { setTickSpeed('FAST'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'FAST' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            ▶️▶️ 2x
          </button>
          <button
            onClick={() => { setTickSpeed('ULTRA'); restartTickTimer(); }}
            className={`px-2 py-1 border border-[#1a3a1a] text-[9px] uppercase cursor-pointer ${playerState.tickSpeed === 'ULTRA' ? 'bg-[#1a4a1a] text-[#00ff44] font-bold' : 'text-gray-500 hover:text-white'}`}
          >
            🔥 HYPER
          </button>
        </div>
      </header>

      {/* 2. LIVE DATA TICKER */}
      <DataTicker />

      {/* 3. MAIN CO-ORDINATE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Operational theater visualization map & telemetry */}
        <div className="w-[55%] flex flex-col border-r border-[#1a3a1a] h-full overflow-hidden shrink-0">
          {/* Map Controls selector */}
          <MapControls
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Active spatial arena */}
          <div className="flex-1 border-b border-[#1a3a1a] relative bg-black select-none">
            {viewMode === 'MAP' ? (
              <WorldMap activeLayer={activeLayer} />
            ) : (
              <AllianceGraph />
            )}
          </div>

          {/* Telemetry scrolling canvases grids: row-span stacked below map */}
          <div className="h-[215px] grid grid-cols-4 gap-1 p-1 bg-[#010301] shrink-0 select-none overflow-x-auto">
            <ThermalRecon />
            <DroneFeed />
            <CyberFeed />
            <HaarpRadar />
          </div>
        </div>

        {/* Right pane: Standard form action sheets deck (F1-F6) */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 bg-[#040704]">
          {/* Deck tab indicators */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-1 overflow-x-auto">
              {[
                { id: 1, label: 'GOVERNMENT (F1)' },
                { id: 2, label: 'CENTRAL BANK (F2)' },
                { id: 3, label: 'ARSENAL (F3)' },
                { id: 4, label: 'DIPLOMACY (F4)' },
                { id: 5, label: 'RESEARCH (F5)' },
                { id: 6, label: 'INTELLIGENCE (F6)' },
              ].map((tab) => {
                const isActive = playerState.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => playerState.setActiveTab(tab.id)}
                    className={`px-2.5 py-1 text-[9px] font-bold border border-[#1a3a1a] uppercase cursor-pointer rounded transition-colors ${
                      isActive
                        ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] text-shadow-sm'
                        : 'text-gray-400 hover:bg-[#071707]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Selected panel form */}
          <div className="flex-1">
            {playerState.activeTab === 1 && <GovernmentPanel />}
            {playerState.activeTab === 2 && <CentralBankPanel />}
            {playerState.activeTab === 3 && <ArsenalPanel />}
            {playerState.activeTab === 4 && <DiplomacyPanel />}
            {playerState.activeTab === 5 && <ResearchPanel />}
            {playerState.activeTab === 6 && <IntelPanel />}
          </div>
        </div>
      </div>

      {/* 4. SOVEREIGN SHELL TERMINAL FEED */}
      <TerminalShell />

      {/* Game loss or win overlay modals */}
      {resolution !== 'ONGOING' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
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
