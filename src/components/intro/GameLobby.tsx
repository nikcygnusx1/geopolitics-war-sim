import React, { useState } from 'react';
import { SCENARIOS } from '../../data/scenarios';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useClockStore } from '../../store/clockStore';
import { useDefconStore } from '../../store/defconStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useConsequenceStore } from '../../store/consequenceStore';
import { ScenarioId } from '../../types';
import { audio } from '../../utils/audio';

// Seeded country helper inside lobby with metadata
const LOBBY_NATIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 28000, power: 95, diff: 'NOVICE' },
  { id: 'CN', name: 'China', flag: '🇨🇳', ideology: 'AUTOCRACY', alliance: 'SCO', gdp: 19000, power: 88, diff: 'OPERATIVE' },
  { id: 'RU', name: 'Russia', flag: '🇷🇺', ideology: 'AUTOCRACY', alliance: 'SCO', gdp: 2100, power: 90, diff: 'ELITE' },
  { id: 'IN', name: 'India', flag: '🇮🇳', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 3900, power: 72, diff: 'OPERATIVE' },
  { id: 'PK', name: 'Pakistan', flag: '🇵🇰', ideology: 'MILITARY_JUNTA', alliance: 'NEUTRAL', gdp: 350, power: 55, diff: 'ELITE' },
  { id: 'IL', name: 'Israel', flag: '🇮🇱', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 520, power: 78, diff: 'OPERATIVE' },
  { id: 'IR', name: 'Iran', flag: '🇮🇷', ideology: 'THEOCRACY', alliance: 'SCO', gdp: 400, power: 60, diff: 'ELITE' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 3100, power: 70, diff: 'NOVICE' },
  { id: 'FR', name: 'France', flag: '🇫🇷', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 3000, power: 68, diff: 'NOVICE' },
  { id: 'DE', name: 'Germany', flag: '🇩🇪', ideology: 'DEMOCRACY', alliance: 'NATO', gdp: 4500, power: 62, diff: 'NOVICE' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 4200, power: 58, diff: 'NOVICE' },
  { id: 'KR', name: 'South Korea', flag: '🇰🇷', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 1800, power: 60, diff: 'OPERATIVE' },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', ideology: 'THEOCRACY', alliance: 'GCC', gdp: 1100, power: 65, diff: 'OPERATIVE' },
  { id: 'BR', name: 'Brazil', flag: '🇧🇷', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 2100, power: 48, diff: 'NOVICE' },
  { id: 'ZA', name: 'South Africa', flag: '🇿🇦', ideology: 'DEMOCRACY', alliance: 'BRICS', gdp: 400, power: 35, diff: 'ELITE' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺', ideology: 'DEMOCRACY', alliance: 'QUAD', gdp: 1700, power: 55, diff: 'NOVICE' },
  { id: 'TR', name: 'Turkey', flag: '🇹🇷', ideology: 'AUTOCRACY', alliance: 'NATO', gdp: 1100, power: 62, diff: 'ELITE' },
  { id: 'EG', name: 'Egypt', flag: '🇪🇬', ideology: 'MILITARY_JUNTA', alliance: 'NEUTRAL', gdp: 470, power: 50, diff: 'OPERATIVE' },
  { id: 'TW', name: 'Taiwan', flag: '🇹🇼', ideology: 'DEMOCRACY', alliance: 'NEUTRAL', gdp: 790, power: 64, diff: 'LEGENDARY' }
];

interface GameLobbyProps {
  onStartScenario: (id: ScenarioId, countryId: string, customOptions?: any) => void;
  onOpenWorldBuilder: () => void;
}

export default function GameLobby({ onStartScenario, onOpenWorldBuilder }: GameLobbyProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('MENA_SPARK');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mission params
  const [durationMode, setDurationMode] = useState<'SCENARIO' | 'TIMED' | 'ENDLESS'>('SCENARIO');
  const [timedTicks, setTimedTicks] = useState(100);
  const [tickScale, setTickScale] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [startDate, setStartDate] = useState('2027-01-15');
  const [initialSpeed, setInitialSpeed] = useState<'PAUSED' | 'NORMAL' | 'FAST' | 'ULTRA'>('PAUSED');

  // Advanced configurations
  const [aiAggression, setAiAggression] = useState(2); // 1-5 slider
  const [nuclearDoctrine, setNuclearDoctrine] = useState<'NO_FIRST_USE' | 'FLEXIBLE' | 'LAUNCH_ON_WARNING'>('FLEXIBLE');
  const [startingIntel, setStartingIntel] = useState<'BLIND' | 'PARTIAL' | 'FULL'>('PARTIAL');
  const [consequencesEnabled, setConsequencesEnabled] = useState(true);
  const [economicVolatility, setEconomicVolatility] = useState(2); // 1-5 slider
  const [substateActivity, setSubstateActivity] = useState(3); // 1-5 slider

  const filteredNations = LOBBY_NATIONS.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeScenarioObj = SCENARIOS[selectedScenario];

  const handleLaunchGame = () => {
    audio.sfxKlaxon();
    
    // 1. Setup clock parameters
    useClockStore.getState().initClock(
      startDate,
      durationMode,
      tickScale,
      durationMode === 'TIMED' ? timedTicks : 100
    );

    // 2. Setup Fog Of War
    const targetAllies = selectedCountry === 'US' ? ['GB', 'FR', 'DE', 'JP', 'KR', 'AU'] : [];
    useFogOfWarStore.getState().initFog(selectedCountry, targetAllies, startingIntel);

    // 3. Setup DEFCON & Consequences State
    useDefconStore.getState().resetDefcon();
    if (!consequencesEnabled) {
      useConsequenceStore.getState().resetScars();
    }

    // 4. Trigger initiation
    onStartScenario(selectedScenario, selectedCountry, {
      aiAggression,
      nuclearDoctrine,
      economicVolatility,
      substateActivity
    });
  };

  return (
    <div className="absolute inset-0 bg-[#030503] flex items-center justify-center p-4 overflow-hidden z-50 select-none font-mono text-green-400">
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      <div className="w-full max-w-[1400px] h-[95vh] bg-[#050a05] border border-[#1a5c1a] rounded flex flex-col p-4 relative z-20 shadow-[0_0_24px_rgba(0,255,68,0.15)]">
        
        {/* Lobby Header */}
        <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-3 mb-4 flex-shrink-0">
          <div>
            <h1 className="text-xl font-display font-bold text-[#00ff44] tracking-widest uppercase leading-none text-shadow">
              ⚡ SOVEREIGN COMMAND SIMULATOR v4.0
            </h1>
            <p className="text-[10px] text-[#00e5ff] uppercase tracking-widest mt-1">
              COSMIC LEVEL-5 GEOPOLITICAL SIMULATION LOBBY
            </p>
          </div>
          <span className="text-[9px] text-[#ffb300] tracking-widest font-bold">CLEARANCE: TS/SCI_EYES_ONLY</span>
        </div>

        {/* Multi-Panel Columns Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 min-h-0 overflow-hidden mb-4">
          
          {/* PANEL 1: NATION DIRECTORY SELECT */}
          <div className="border border-[#1a5c1a] bg-black/60 p-3 flex flex-col min-h-0 rounded">
            <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
              🚩 DIRECTORY SELECT (NATION)
            </h3>
            <input
              type="text"
              placeholder="FILTER NATIONS..."
              value={searchQuery}
              onChange={(e) => { audio.sfxKeyClick(); setSearchQuery(e.target.value); }}
              className="w-full bg-[#071307] border border-[#1a5c1a] text-xs px-2 py-1.5 rounded mb-3 text-white placeholder-green-700 outline-none focus:border-[#00ff44]"
            />
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredNations.map((n) => {
                const isSelected = n.id === selectedCountry;
                return (
                  <div
                    key={n.id}
                    onClick={() => { audio.sfxKeyClick(); setSelectedCountry(n.id); }}
                    className={`border p-2 rounded cursor-pointer transition-all ${isSelected ? 'border-[#00ff44] bg-[#071707] shadow-[0_0_8px_rgba(0,255,68,0.2)]' : 'border-[#0d2e0d] bg-black/80 hover:border-green-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase text-white">
                        {n.flag} {n.name}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 border ${n.diff === 'LEGENDARY' || n.diff === 'ELITE' ? 'border-red-600 text-red-500' : 'border-green-600 text-green-400'}`}>
                        {n.diff}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-1 uppercase flex justify-between">
                      <span>GDP: ${(n.gdp / 1000).toFixed(1)}T</span>
                      <span>Alliance: {n.alliance}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 2: MISSION SELECT (SCENARIO VS SANDBOX) */}
          <div className="border border-[#1a5c1a] bg-black/60 p-3 flex flex-col min-h-0 rounded">
            <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
              📡 MISSION DIRECTIVE BRIEF
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <div className="text-[10px] text-green-600 border-b border-[#0d2e0d] pb-1 uppercase font-bold">
                PROV_SCENARIO PROTOCOLS:
              </div>
              {Object.values(SCENARIOS).map((sc) => {
                const isSelected = sc.id === selectedScenario;
                return (
                  <div
                    key={sc.id}
                    onClick={() => { audio.sfxKeyClick(); setSelectedScenario(sc.id); }}
                    className={`border p-2.5 rounded cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-[#ffb300] bg-[#1a1405]' : 'border-[#0d2e0d] bg-black/80'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-[#0d2e0d] pb-1 mb-1.5">
                        <span className={`font-bold text-[11px] uppercase ${isSelected ? 'text-[#ffb300]' : 'text-white'}`}>
                          {sc.name}
                        </span>
                        <span className="text-[8px] text-[#00e5ff] font-bold">
                          {sc.difficulty}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-normal lowercase first-letter:uppercase mb-2">
                        {sc.description}
                      </p>
                    </div>
                    <div className="text-[8px] text-gray-500 uppercase border-t border-[#0d2e0d]/50 pt-1.5">
                      <span className="text-red-500 font-bold block mb-0.5">OBJECTIVE:</span>
                      {sc.winDescription}
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t border-[#1a5c1a]/50 text-center">
                <button
                  onClick={() => { audio.sfxKeyClick(); onOpenWorldBuilder(); }}
                  className="w-full py-2 bg-[#1a4a1a]/30 hover:bg-[#1a4a1a]/60 border border-[#00ff44] text-[10px] text-[#00ff44] font-bold uppercase rounded cursor-pointer transition-all"
                >
                  🛠 OPEN WORLD BUILDER SANDBOX
                </button>
              </div>
            </div>
          </div>

          {/* PANEL 3: INGRESS MISSION PARAMETERS */}
          <div className="border border-[#1a5c1a] bg-black/60 p-3 flex flex-col min-h-0 rounded text-xs select-none">
            <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
              📅 DURATION PROTOCOL
            </h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">DURATION PROTOCOL:</label>
                <div className="space-y-2 font-bold text-[10px]">
                  <div
                    onClick={() => { audio.sfxKeyClick(); setDurationMode('SCENARIO'); }}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border ${durationMode === 'SCENARIO' ? 'border-[#00ff44] bg-[#071307]' : 'border-[#0d2e0d]'}`}
                  >
                    <span className={durationMode === 'SCENARIO' ? 'text-[#00ff44]' : 'text-gray-600'}>●</span>
                    <span>SCENARIO OBJECTIVE</span>
                  </div>
                  <div
                    onClick={() => { audio.sfxKeyClick(); setDurationMode('TIMED'); }}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border ${durationMode === 'TIMED' ? 'border-[#00ff44] bg-[#071307]' : 'border-[#0d2e0d]'}`}
                  >
                    <span className={durationMode === 'TIMED' ? 'text-[#00ff44]' : 'text-gray-600'}>●</span>
                    <span className="flex-1">TIMED OUT CAMPAIGN</span>
                    {durationMode === 'TIMED' && (
                      <input
                        type="number"
                        value={timedTicks}
                        onChange={(e) => setTimedTicks(Math.max(5, parseInt(e.target.value) || 100))}
                        className="w-12 bg-black border border-[#1a5c1a] text-center font-bold text-[#00ff44] text-[9px] rounded outline-none"
                      />
                    )}
                  </div>
                  <div
                    onClick={() => { audio.sfxKeyClick(); setDurationMode('ENDLESS'); }}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border ${durationMode === 'ENDLESS' ? 'border-[#00ff44] bg-[#071307]' : 'border-[#0d2e0d]'}`}
                  >
                    <span className={durationMode === 'ENDLESS' ? 'text-[#00ff44]' : 'text-gray-600'}>●</span>
                    <span>ENDLESS STRATEGY</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">TICK SCALE FREQUENCY:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['DAY', 'WEEK', 'MONTH'] as const).map(scale => (
                    <button
                      key={scale}
                      onClick={() => { audio.sfxKeyClick(); setTickScale(scale); }}
                      className={`text-[9px] font-bold py-1 border rounded cursor-pointer transition-all ${tickScale === scale ? 'border-[#00ff44] bg-[#071307] text-[#00ff44]' : 'border-[#0d2e0d] text-gray-500'}`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">CALENDAR START DATE:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#071307] border border-[#1a5c1a] text-xs px-2 py-1 rounded text-white outline-none focus:border-[#00ff44]"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">INITIAL SPEED MODE:</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['PAUSED', 'NORMAL', 'FAST', 'ULTRA'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => { audio.sfxKeyClick(); setInitialSpeed(speed); }}
                      className={`text-[8px] font-bold py-1 border rounded cursor-pointer transition-all ${initialSpeed === speed ? 'border-[#00ff44] bg-[#071307] text-[#00ff44]' : 'border-[#0d2e0d] text-gray-500'}`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PANEL 4: ADVANCED CONFIGURATION PARAMETERS */}
          <div className="border border-[#1a5c1a] bg-black/60 p-3 flex flex-col min-h-0 rounded select-none text-xs">
            <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
              🛠 ADVANCED PROTOCOLS
            </h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div>
                <div className="flex justify-between block mb-1">
                  <span className="text-[10px] text-gray-400 uppercase">AI Aggression Factor:</span>
                  <span className="text-[10px] text-[#00ff44] font-bold">{aiAggression}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={aiAggression}
                  onChange={(e) => { audio.sfxKeyClick(); setAiAggression(parseInt(e.target.value)); }}
                  className="w-full accent-[#00ff44]"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">NUCLEAR ESCALATION DOCTRINE:</label>
                <select
                  value={nuclearDoctrine}
                  onChange={(e) => { audio.sfxKeyClick(); setNuclearDoctrine(e.target.value as any); }}
                  className="w-full bg-[#071307] border border-[#1a5c1a] text-xs px-2 py-1 rounded text-white outline-none focus:border-[#00ff44]"
                >
                  <option value="NO_FIRST_USE">NO FIRST USE (DEFENSIVE CONTEXT)</option>
                  <option value="FLEXIBLE">FLEXIBLE RESPONSE (TENSE DETRACT)</option>
                  <option value="LAUNCH_ON_WARNING">LAUNCH ON TARGET SCANNING CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">STARTING MAP INTEL COVERAGE:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['BLIND', 'PARTIAL', 'FULL'] as const).map(intel => (
                    <button
                      key={intel}
                      onClick={() => { audio.sfxKeyClick(); setStartingIntel(intel); }}
                      className={`text-[9px] font-bold py-1 border rounded cursor-pointer transition-all ${startingIntel === intel ? 'border-[#00ff44] bg-[#071307] text-[#00ff44]' : 'border-[#0d2e0d] text-gray-500'}`}
                    >
                      {intel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-1 border border-[#0d2e0d] rounded">
                <span className="text-[10px] text-gray-400 uppercase">CONSEQUENCE PERMANENCE:</span>
                <input
                  type="checkbox"
                  checked={consequencesEnabled}
                  onChange={(e) => { audio.sfxKeyClick(); setConsequencesEnabled(e.target.checked); }}
                  className="w-4 h-4 accent-[#00ff44]"
                />
              </div>

              <div>
                <div className="flex justify-between block mb-1">
                  <span className="text-[10px] text-gray-400 uppercase">ECONOMIC VOLATILITY INDEX:</span>
                  <span className="text-[10px] text-[#00ff44] font-bold">{economicVolatility}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={economicVolatility}
                  onChange={(e) => { audio.sfxKeyClick(); setEconomicVolatility(parseInt(e.target.value)); }}
                  className="w-full accent-[#00ff44]"
                />
              </div>

              <div>
                <div className="flex justify-between block mb-1">
                  <span className="text-[10px] text-gray-400 uppercase">SUB-STATE GUERRILLA ACTIVITY:</span>
                  <span className="text-[10px] text-[#00ff44] font-bold">{substateActivity}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={substateActivity}
                  onChange={(e) => { audio.sfxKeyClick(); setSubstateActivity(parseInt(e.target.value)); }}
                  className="w-full accent-[#00ff44]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Lobby Ingress Control Bar */}
        <div className="border-t border-[#1a5c1a] pt-3 flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0">
          <div className="text-left">
            <span className="text-yellow-500 text-[10px] font-bold font-mono block">
              COGNATE: {selectedCountry} // scenario: {activeScenarioObj?.name.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              Double confirm parameters before initiating threat grids.
            </span>
          </div>

          <button
            onClick={handleLaunchGame}
            className="px-10 py-3 bg-[#00ff44] hover:bg-green-500 text-black text-xs font-bold font-display uppercase tracking-widest cursor-pointer rounded transition-all shadow-[0_0_12px_rgba(0,255,68,0.4)] hover:shadow-[0_0_24px_rgba(0,255,68,0.7)]"
          >
            INITIATE SECURE COMMAND STRATEGY ENGINES
          </button>
        </div>

      </div>
    </div>
  );
}
