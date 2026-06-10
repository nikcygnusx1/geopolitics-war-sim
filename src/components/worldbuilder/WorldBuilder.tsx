import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useClockStore } from '../../store/clockStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useDefconStore } from '../../store/defconStore';
import { useConsequenceStore } from '../../store/consequenceStore';
import { audio } from '../../utils/audio';

const SANDBOX_NATIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', continent: 'North America', gdp: 28000, desc: 'Global democratic hyperpower' },
  { id: 'CN', name: 'China', flag: '🇨🇳', continent: 'Asia', gdp: 19000, desc: 'Industrial production giant' },
  { id: 'RU', name: 'Russia', flag: '🇷🇺', continent: 'Europe', gdp: 2100, desc: 'Nuclear and natural resources anchor' },
  { id: 'IN', name: 'India', flag: '🇮🇳', continent: 'Asia', gdp: 3900, desc: 'Rapidly growing democratic block' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', continent: 'Europe', gdp: 3100, desc: 'Advanced carrier strike capability' },
  { id: 'FR', name: 'France', flag: '🇫🇷', continent: 'Europe', gdp: 3000, desc: 'Strategic nuclear independence Core' },
  { id: 'DE', name: 'Germany', flag: '🇩🇪', continent: 'Europe', gdp: 4500, desc: 'Economic core of Europe' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', continent: 'Asia', gdp: 4200, desc: 'Advanced pacifist defence fortress' },
  { id: 'KR', name: 'South Korea', flag: '🇰🇷', continent: 'Asia', gdp: 1800, desc: 'Technical near-peer semiconductor fabrication' },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', continent: 'Middle East', gdp: 1100, desc: 'Critical global petrochemical leverage' },
  { id: 'IL', name: 'Israel', flag: '🇮🇱', continent: 'Middle East', gdp: 520, desc: 'Tactical Iron Shield defensive dome' },
  { id: 'TW', name: 'Taiwan', flag: '🇹🇼', continent: 'Asia', gdp: 790, desc: 'Global semiconductor silicon core flashpoint' },
  { id: 'UA', name: 'Ukraine', flag: '🇺🇦', continent: 'Europe', gdp: 160, desc: 'Active perimeter defensive trench' },
  { id: 'BR', name: 'Brazil', flag: '🇧🇷', continent: 'South America', gdp: 2100, desc: 'Regulator of critical raw resources' },
  { id: 'ZA', name: 'South Africa', flag: '🇿🇦', continent: 'Africa', gdp: 400, desc: 'Minerals and mining supply hub' }
];

interface WorldBuilderProps {
  onLaunchSandbox: (selectedCountryId: string, options: any) => void;
  onBack: () => void;
}

export default function WorldBuilder({ onLaunchSandbox, onBack }: WorldBuilderProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [tensionPreset, setTensionPreset] = useState<'COLD_PEACE' | 'SIMMERING' | 'WORLD_ON_EDGE' | 'INFERNO'>('SIMMERING');
  const [multiplier, setMultiplier] = useState<'REALISTIC' | 'EMPOWERED' | 'CRISIS'>('REALISTIC');
  const [aiAggression, setAiAggression] = useState(2); 
  const [substateActivity, setSubstateActivity] = useState<'DORMANT' | 'ACTIVE' | 'SURGING'>('ACTIVE');

  // New Calendar + Duration setups in Sandbox as well (Section 13)
  const [durationMode, setDurationMode] = useState<'SCENARIO' | 'TIMED' | 'ENDLESS'>('ENDLESS');
  const [timedTicks, setTimedTicks] = useState(150);
  const [tickScale, setTickScale] = useState<'DAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [startDate, setStartDate] = useState('2027-01-15');

  const handleLaunch = () => {
    audio.sfxKlaxon();

    // 1. Setup clock parameters
    useClockStore.getState().initClock(
      startDate,
      durationMode,
      tickScale,
      durationMode === 'TIMED' ? timedTicks : 100
    );

    // 2. Setup Fog Of War
    useFogOfWarStore.getState().initFog(selectedCountry, [], 'PARTIAL');

    // 3. Reset DEFCON level
    useDefconStore.getState().resetDefcon();
    useConsequenceStore.getState().resetScars();

    onLaunchSandbox(selectedCountry, {
      tensionPreset,
      spendingMultiplier: multiplier === 'EMPOWERED' ? 3.0 : multiplier === 'CRISIS' ? 0.5 : 1.0,
      aiAggression,
      substateActivity
    });
  };

  return (
    <div className="absolute inset-0 bg-[#020402] flex flex-col justify-between p-6 overflow-hidden select-none text-green-400 font-mono">
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-3 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { audio.sfxKeyClick(); onBack(); }}
            className="text-gray-500 hover:text-white px-2 py-1 border border-transparent hover:border-[#1a5c1a] text-[10px] uppercase font-bold"
          >
            &lt; RETURN TO LOBBY
          </button>
          <span className="text-[#00ff44] text-xs font-bold font-display uppercase tracking-wider">
            Sovereign Command Sandbox Configuration Matrix
          </span>
        </div>
        <span className="text-[9px] text-[#00e5ff] tracking-widest font-bold">CLEARANCE: COSMIC TOP SECRET</span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 py-6 overflow-hidden min-h-0 relative z-20">
        
        {/* Column 1: Choose Your Nation */}
        <div className="border border-[#1a5c1a] bg-[#030603]/80 backdrop-blur p-4 flex flex-col min-h-0 rounded">
          <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
            🚩 1. SELECT COGNATE NATION
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {SANDBOX_NATIONS.map((n) => {
              const isSelected = n.id === selectedCountry;
              return (
                <div
                  key={n.id}
                  onClick={() => { audio.sfxKeyClick(); setSelectedCountry(n.id); }}
                  className={`border p-2 rounded cursor-pointer transition-all ${isSelected ? 'border-[#00ff44] bg-[#071707]' : 'border-[#0d2e0d] bg-black/60 hover:border-green-800'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs uppercase text-white">
                      {n.flag} {n.name}
                    </span>
                    <span className="text-[8px] px-1.5 bg-[#1a4a1a] text-[#00ff44] font-bold rounded">
                      {n.id}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-1 uppercase">
                    GDP: ${(n.gdp / 1000).toFixed(1)}T | {n.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: World Tension Presets */}
        <div className="border border-[#1a5c1a] bg-[#030603]/80 backdrop-blur p-4 flex flex-col rounded">
          <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
            ⚡ 2. WORLDBULDER CONFLICT POSTURE
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div
              onClick={() => { audio.sfxKeyClick(); setTensionPreset('COLD_PEACE'); }}
              className={`border p-2.5 rounded cursor-pointer ${tensionPreset === 'COLD_PEACE' ? 'border-[#00ff44] bg-[#071707]' : 'border-[#0d2e0d] bg-black/60'}`}
            >
              <div className="text-white text-xs font-bold uppercase">COLD PEACE</div>
              <p className="text-[9px] text-gray-400 mt-1 lowercase first-letter:uppercase leading-normal">
                All opinions stabilized. Basic trade networks fully functional, with no active wars anywhere.
              </p>
            </div>

            <div
              onClick={() => { audio.sfxKeyClick(); setTensionPreset('SIMMERING'); }}
              className={`border p-2.5 rounded cursor-pointer ${tensionPreset === 'SIMMERING' ? 'border-[#00ff44] bg-[#071707]' : 'border-[#0d2e0d] bg-black/60'}`}
            >
              <div className="text-white text-xs font-bold uppercase">SIMMERING TENSIONS</div>
              <p className="text-[9px] text-gray-400 mt-1 lowercase first-letter:uppercase leading-normal">
                Initial regional conflicts starting to cook. Some flashpoints active with baseline friction.
              </p>
            </div>

            <div
              onClick={() => { audio.sfxKeyClick(); setTensionPreset('WORLD_ON_EDGE'); }}
              className={`border p-2.5 rounded cursor-pointer ${tensionPreset === 'WORLD_ON_EDGE' ? 'border-[#00ff44] bg-[#071707]' : 'border-[#0d2e0d] bg-black/60'}`}
            >
              <div className="text-white text-xs font-bold uppercase">WORLD ON EDGE</div>
              <p className="text-[9px] text-gray-400 mt-1 lowercase first-letter:uppercase leading-normal">
                Severe active military operations. Multiple superpowers mobilized. High internal unrest.
              </p>
            </div>

            <div
              onClick={() => { audio.sfxKeyClick(); setTensionPreset('INFERNO'); }}
              className={`border p-2.5 rounded cursor-pointer ${tensionPreset === 'INFERNO' ? 'border-[#00ff44] bg-[#071707]' : 'border-[#0d2e0d] bg-black/60'}`}
            >
              <div className="text-white text-xs font-bold uppercase">INFERNO WARNING</div>
              <p className="text-[9px] text-red-500 mt-1 lowercase first-letter:uppercase font-bold leading-normal">
                SUPERPOWER ALIGNMENTS SEVERED. 8+ GLOBAL ACTIVE WARS AND MULTIPLE NATION THREAT CODES LEVEL RED.
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: Resource Multiplier & Duration configs */}
        <div className="border border-[#1a5c1a] bg-[#030603]/80 backdrop-blur p-4 flex flex-col rounded text-xs select-none">
          <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
            💵 3. SANDBOX CLOCK & MULTIPLIERS
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">RESOURCES MULTIPLE:</label>
              <select
                value={multiplier}
                onChange={(e) => { audio.sfxKeyClick(); setMultiplier(e.target.value as any); }}
                className="w-full bg-[#071307] border border-[#1a5c1a] text-xs px-2 py-1 rounded text-white outline-none focus:border-[#00ff44]"
              >
                <option value="REALISTIC">REALISTIC SEEDING (1.0X)</option>
                <option value="EMPOWERED">EMPOWERED BUFFED (3.0X)</option>
                <option value="CRISIS">CRISIS PENALTY HARD (0.5X)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">TEMPORAL DURATION PROTOCOL:</label>
              <div className="space-y-2 text-[10px] font-bold">
                <div
                  onClick={() => { audio.sfxKeyClick(); setDurationMode('ENDLESS'); }}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border ${durationMode === 'ENDLESS' ? 'border-[#00ff44] bg-[#071307]' : 'border-[#0d2e0d]'}`}
                >
                  <span className={durationMode === 'ENDLESS' ? 'text-[#00ff44]' : 'text-gray-600'}>●</span>
                  <span>ENDLESS MODE</span>
                </div>
                <div
                  onClick={() => { audio.sfxKeyClick(); setDurationMode('TIMED'); }}
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border ${durationMode === 'TIMED' ? 'border-[#00ff44] bg-[#071307]' : 'border-[#0d2e0d]'}`}
                >
                  <span className={durationMode === 'TIMED' ? 'text-[#00ff44]' : 'text-gray-600'}>●</span>
                  <span className="flex-1">TIMED LIMITS</span>
                  {durationMode === 'TIMED' && (
                    <input
                      type="number"
                      value={timedTicks}
                      onChange={(e) => setTimedTicks(Math.max(5, parseInt(e.target.value) || 150))}
                      className="w-12 bg-black border border-[#1a5c1a] text-center font-bold text-[#00ff44] text-[9px] rounded outline-none"
                    />
                  )}
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
              <label className="text-[10px] text-gray-400 uppercase block mb-1">START DATE:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#071307] border border-[#1a5c1a] text-xs px-2 py-1 rounded text-white outline-none focus:border-[#00ff44]"
              />
            </div>
          </div>
        </div>

        {/* Column 4: Advanced Options */}
        <div className="border border-[#1a5c1a] bg-[#030603]/80 backdrop-blur p-4 flex flex-col rounded justify-between relative z-20">
          <div>
            <h3 className="text-xs uppercase font-bold border-b border-[#1a5c1a] pb-2 mb-3 text-[#00e5ff]">
              🛠 4. ADVANCED POSTURE OPTIONS
            </h3>

            <div className="space-y-4 mt-2">
              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">AI Aggression Index:</label>
                <div className="flex gap-1 justify-between">
                  {['PASSIVE', 'BALANCED', 'HAWKISH', 'APOCALYPTIC'].map((val, idx) => (
                    <button
                      key={val}
                      onClick={() => { audio.sfxKeyClick(); setAiAggression(idx + 1); }}
                      className={`text-[8px] flex-1 px-1 py-1 border font-bold cursor-pointer rounded ${aiAggression === idx + 1 ? 'border-[#00ff44] bg-[#071707] text-[#00ff44]' : 'border-[#0d2e0d] text-gray-500 hover:text-white'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase block mb-1">Sub-State Activity Level:</label>
                <div className="flex gap-1 justify-between">
                  {['DORMANT', 'ACTIVE', 'SURGING'].map((val) => (
                    <button
                      key={val}
                      onClick={() => { audio.sfxKeyClick(); setSubstateActivity(val as any); }}
                      className={`text-[9px] flex-1 px-1 py-1 border font-bold cursor-pointer rounded ${substateActivity === val ? 'border-[#00ff44] bg-[#071707] text-[#00ff44]' : 'border-[#0d2e0d] text-gray-500 hover:text-white'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#0d2e0d] pt-4">
            <button
              onClick={handleLaunch}
              className="w-full py-3 border-2 border-[#00ff44] hover:bg-[#00ff44]/15 hover:shadow-lg text-xs font-bold font-display uppercase tracking-wider text-[#00ff44] cursor-pointer rounded animate-pulse"
            >
              LAUNCH SIMULATION
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
