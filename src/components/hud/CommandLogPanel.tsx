import React, { useState, useMemo } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { audio } from '../../utils/audio';

export function getEventCategory(text: string): 'MILITARY' | 'ECONOMY' | 'DIPLOMACY' | 'INTELLIGENCE' | 'SYSTEM' {
  const t = text.toLowerCase();
  if (t.includes('strike') || t.includes('fired') || t.includes('missile') || t.includes('intercept') || t.includes('nuclear') || t.includes('war') || t.includes('troops') || t.includes('military') || t.includes('combat') || t.includes('bomb') || t.includes('blast') || t.includes('payload') || t.includes('silo') || t.includes('ordnance') || t.includes('squadron') || t.includes('abm')) {
    return 'MILITARY';
  }
  if (t.includes('fiscal') || t.includes('reserve') || t.includes('treasury') || t.includes('cash') || t.includes('budget') || t.includes('tax') || t.includes('bond') || t.includes('liquid') || t.includes('market') || t.includes('currency') || t.includes('bazaar') || t.includes('procure') || t.includes('print') || t.includes('inflation') || t.includes('debt') || t.includes('financial') || t.includes('bribe') || t.includes('offshore') || t.includes('asset')) {
    return 'ECONOMY';
  }
  if (t.includes('diplomacy') || t.includes('treaty') || t.includes('alliance') || t.includes('sanction') || t.includes('blockade') || t.includes('tariff') || t.includes('opinion') || t.includes('pact') || t.includes('vote') || t.includes('bilateral') || t.includes('embargo') || t.includes('un security') || t.includes('allied') || t.includes('mutual')) {
    return 'DIPLOMACY';
  }
  if (t.includes('espionage') || t.includes('intelligence') || t.includes('covert') || t.includes('hacker') || t.includes('breach') || t.includes('leak') || t.includes('alert') || t.includes('agent') || t.includes('sabotage') || t.includes('assassinate') || t.includes('propaganda') || t.includes('counter-espionage') || t.includes('clandestine') || t.includes('signals')) {
    return 'INTELLIGENCE';
  }
  return 'SYSTEM';
}

export default function CommandLogPanel() {
  const globalEventLog = useWorldStore((s) => s.globalEventLog);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MILITARY' | 'ECONOMY' | 'DIPLOMACY' | 'INTELLIGENCE' | 'SYSTEM'>('ALL');

  const playerCountryId = usePlayerStore((s) => s.countryId);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const handleTriggerDrill = (type: 'MIL_CRITICAL' | 'LOCAL_FRICTION' | 'COLLAPSE_CRISIS' | 'STAND_DOWN') => {
    audio.sfxKeyClick();
    if (!playerCountryId) return;

    if (type === 'MIL_CRITICAL') {
      updateCountry(playerCountryId, (draft) => {
        draft.arsenal.readinessLevel = 5;
      });
      useWorldStore.getState().applyTickDelta((draft) => {
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: 'TACTICAL SYSTEMS DRILL: Arsenal readiness level manually forced to combat-critical 5%.',
          severity: 'CRITICAL'
        });
      });
    } else if (type === 'LOCAL_FRICTION') {
      updateCountry(playerCountryId, (draft) => {
        draft.political.stabilityIndex = 47; 
        draft.political.popularUnrest = 48;  
        draft.economic.treasuryCashB = 4.2;  
        draft.economic.inflationRate = 12.5; 
        draft.arsenal.readinessLevel = 80;   
      });
      useWorldStore.getState().applyTickDelta((draft) => {
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: 'REGIONAL FRICTION DRILL: Moderate civil unrest and reserves depreciation injected.',
          severity: 'WARNING'
        });
      });
    } else if (type === 'COLLAPSE_CRISIS') {
      updateCountry(playerCountryId, (draft) => {
        draft.political.stabilityIndex = 24; 
        draft.political.popularUnrest = 82;  
        draft.economic.treasuryCashB = 0.8;  
        draft.economic.inflationRate = 22.4; 
        draft.arsenal.readinessLevel = 5;    
      });
      useWorldStore.getState().applyTickDelta((draft) => {
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: '🚨 MULTI-SYSTEMS COLLAPSE DRILL: Extreme civil instability, treasury insolvency, and readiness depreciation active!',
          severity: 'CRITICAL'
        });
      });
    } else if (type === 'STAND_DOWN') {
      updateCountry(playerCountryId, (draft) => {
        draft.political.stabilityIndex = 80;
        draft.political.popularUnrest = 15;
        draft.economic.treasuryCashB = 15.0;
        draft.economic.inflationRate = 2.4;
        draft.economic.debtToGdpRatio = 35.0;
        draft.arsenal.readinessLevel = 80;
        if (draft.researchUnlocked.length < 3) {
          draft.researchUnlocked = ['HAARP_V1', 'IRON_DOME_V1', 'CYBER_FIREWALL_V1'];
        }
      });
      useWorldStore.getState().applyTickDelta((draft) => {
        draft.globalEventLog.unshift({
          tick: draft.currentTick,
          text: 'SOVEREIGN STAND-DOWN: Emergency simulation ceased. All military and financial sectors restored.',
          severity: 'SYSTEM'
        });
      });
    }
  };

  const handleTriggerCinematicEvent = (type: 'WAR' | 'NUKE' | 'COUP' | 'CRASH' | 'PEACE') => {
    audio.sfxKeyClick();
    if (!playerCountryId) return;

    if (type === 'WAR') {
      useWorldStore.getState().applyTickDelta((draft) => {
        const c = draft.countries[playerCountryId];
        const enemy = draft.countries['RU'];
        if (c && enemy) {
          if (!c.atWarWith.includes('RU')) c.atWarWith.push('RU');
          if (!enemy.atWarWith.includes(playerCountryId)) enemy.atWarWith.push(playerCountryId);
        }
      });
    } else if (type === 'NUKE') {
      const tick = useWorldStore.getState().currentTick;
      useWorldStore.getState().addStrike({
        id: `drill-strike-${Date.now()}`,
        sourceCountryId: playerCountryId,
        targetCountryId: 'RU',
        weaponType: 'ICBM',
        warheadYieldMT: 4.5,
        progressPct: 0,
        status: 'IN_FLIGHT',
        bezier: {
          startX: 500,
          startY: 250,
          controlX: 450,
          controlY: 100,
          endX: 400,
          endY: 200,
        },
        launchTick: tick,
        impactTick: tick + 5,
        isRetaliatory: false,
        interceptAttempted: false,
      });
    } else if (type === 'COUP') {
      useWorldStore.getState().updateCountry(playerCountryId, (draft) => {
        draft.political.leaderName = `General Junta Chief V${Math.floor(Math.random() * 9 + 1)}`;
      });
    } else if (type === 'CRASH') {
      useWorldStore.getState().updateCountry(playerCountryId, (draft) => {
        draft.economic.treasuryCashB = 0.35;
      });
    } else if (type === 'PEACE') {
      useWorldStore.getState().applyTickDelta((draft) => {
        const c = draft.countries[playerCountryId];
        const enemy = draft.countries['RU'];
        if (c) c.atWarWith = c.atWarWith.filter((x) => x !== 'RU');
        if (enemy) enemy.atWarWith = enemy.atWarWith.filter((x) => x !== playerCountryId);
      });
    }
  };

  // Categorize log entries on the fly safely using our exact semantic matcher
  const categorizedEvents = useMemo(() => {
    return globalEventLog.map((evt) => {
      return {
        ...evt,
        category: getEventCategory(evt.text),
      };
    });
  }, [globalEventLog]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'ALL') return categorizedEvents;
    return categorizedEvents.filter((evt) => evt.category === selectedFilter);
  }, [categorizedEvents, selectedFilter]);

  // Clear log locally (triggers an audio and sets global logs back to system state)
  const handleClearLog = () => {
    audio.sfxKeyClick();
    useWorldStore.getState().applyTickDelta((draft) => {
      draft.globalEventLog = [
        { tick: draft.currentTick, text: 'Operations log logs flush and systems recalibrated.', severity: 'SYSTEM' }
      ];
    });
  };

  return (
    <div className="gotham-panel gotham-panel--secondary p-3 flex flex-col font-mono text-[10.5px] shrink-0 overflow-hidden w-full mb-3" data-classification="SECRET" style={{ minHeight: '210px', maxHeight: '310px' }}>
      {/* Header and Filter Buttons */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a]/50 pb-2 mb-2 select-none">
        <span className="text-[10px] font-black uppercase text-[#00ff44] tracking-widest flex items-center gap-1.5 animate-pulse">
          📡 LIVE OPERATIONS COMMAND STREAM
        </span>
        <button
          onClick={handleClearLog}
          className="hover:text-[#ff2244] hover:bg-[#ff2244]/10 border border-transparent hover:border-red-950 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-gray-500 cursor-pointer transition-all"
        >
          Flush Feed
        </button>
      </div>

      {/* Category Selection Bar */}
      <div className="flex gap-1 overflow-x-auto py-1 mb-1.5 scrollbar-none border-b border-[#0d220d]/50 pb-1.5 select-none">
        {(['ALL', 'MILITARY', 'ECONOMY', 'DIPLOMACY', 'INTELLIGENCE', 'SYSTEM'] as const).map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => { audio.sfxKeyClick(); setSelectedFilter(filter); }}
              className={`rounded px-2 py-0.5 text-[8px] font-black tracking-wide cursor-pointer transition-all border whitespace-nowrap ${
                isActive
                  ? 'border-[#00ff44] bg-[#092c0d] text-[#00ff44] shadow-[0_0_5px_rgba(0,255,68,0.25)]'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Main Feed Queue */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin overflow-x-hidden">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-600 font-mono italic py-4">
            No system operations signals intercepted on filter queue [{selectedFilter}].
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            // Apply unique visuals depending on category/severity
            let severityColor = 'text-green-500';
            let bulletSymbol = '❯';
            
            if (evt.severity === 'WARNING') {
              severityColor = 'text-[#ffb300]';
              bulletSymbol = '⚠️';
            } else if (evt.severity === 'CRITICAL') {
              severityColor = 'text-[#ff2244] font-black';
              bulletSymbol = '☢️';
            } else if (evt.severity === 'SYSTEM') {
              severityColor = 'text-[#00e5ff]';
              bulletSymbol = '⚙️';
            }

            // Sub-category visual chip
            let catChipColor = 'text-gray-500 bg-[#0c0c0c] border-gray-800';
            if (evt.category === 'MILITARY') catChipColor = 'text-red-400 bg-red-950/20 border-red-900/40';
            if (evt.category === 'ECONOMY') catChipColor = 'text-[#00ff44] bg-emerald-950/20 border-emerald-900/40';
            if (evt.category === 'DIPLOMACY') catChipColor = 'text-cyan-400 bg-cyan-950/20 border-cyan-900/40';
            if (evt.category === 'INTELLIGENCE') catChipColor = 'text-[#ffb300] bg-amber-950/20 border-amber-900/40';

            return (
              <div key={idx} className="border border-[#0d210d] bg-[#020402] hover:bg-[#061406]/30 p-2 rounded flex flex-col gap-1 transition-all leading-normal">
                {/* Header info */}
                <div className="flex justify-between items-center text-[8px] border-b border-[#0d210d]/50 pb-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`px-1 rounded border text-[7.5px] scale-90 ${catChipColor}`}>
                      {evt.category}
                    </span>
                    <span className="text-gray-500">TICK {evt.tick}</span>
                  </div>
                  <span className="text-gray-500 font-bold uppercase">{evt.severity || 'INFO'}</span>
                </div>

                {/* Msg text */}
                <div className="flex gap-2">
                  <span className={`shrink-0 select-none ${severityColor}`}>{bulletSymbol}</span>
                  <p className="text-gray-200 break-words flex-1 leading-relaxed text-[10px]">
                    {evt.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sovereign Command simulated crisis diagnostic injector */}
      <div className="border-t border-[#1a5c1a]/40 mt-2 pt-2 flex flex-col gap-1.5 select-none shrink-0 border-b pb-1">
        <div className="text-[7.5px] text-gray-500 font-bold uppercase tracking-widest flex justify-between items-center">
          <span>⚠️ EMERGENCY DRILL SIMULATOR</span>
          <span className="text-[#00ff44] animate-pulse">● ONLINE</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleTriggerDrill('MIL_CRITICAL')}
            className="px-1 py-1 bg-[#1a0808] border border-red-900 text-red-500 hover:bg-red-950/40 rounded transition-all text-[7px] font-black uppercase cursor-pointer"
            title="Drill: Set Military readiness strength directly to 5%"
          >
            Readiness 5%
          </button>
          <button
            onClick={() => handleTriggerDrill('LOCAL_FRICTION')}
            className="px-1 py-1 bg-[#1c1204] border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#2b1b06] rounded transition-all text-[7px] font-black uppercase cursor-pointer"
            title="Drill: Moderate government stability and economic reserves decay"
          >
            Friction
          </button>
          <button
            onClick={() => handleTriggerDrill('COLLAPSE_CRISIS')}
            className="px-1 py-1 bg-[#ff0033]/15 border border-red-500 text-[#ff2244] hover:bg-red-950 rounded transition-all text-[7px] font-black uppercase cursor-pointer animate-pulse"
            title="Drill: Force Stability, Economy, and Military simultaneously into Critical"
          >
            Hyper Crisis
          </button>
          <button
            onClick={() => handleTriggerDrill('STAND_DOWN')}
            className="px-1 py-1 bg-[#091509] border border-green-900 text-green-500 hover:bg-[#122812] rounded transition-all text-[7px] font-black uppercase cursor-pointer"
            title="Cease crisis drill: Restore starting Sovereign parameters"
          >
            Stand Down
          </button>
        </div>
      </div>

      {/* Cinematic Overlays Injector Core */}
      <div className="mt-1 pt-1 flex flex-col gap-1 select-none shrink-0">
        <div className="text-[7.5px] text-gray-500 font-bold uppercase tracking-widest flex justify-between items-center">
          <span>🎞️ T2.3 CINEMATIC CONTROLLER</span>
          <span className="text-[#00ffcc]">READY</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          <button
            onClick={() => handleTriggerCinematicEvent('WAR')}
            className="px-1 py-1 bg-[#240c0c] border border-red-750 text-red-400 hover:bg-red-900/60 rounded transition-all text-[6.5px] font-black uppercase cursor-pointer"
            title="Fires a WAR_DECLARATION cinematic state transition between player and RU"
          >
            WAR
          </button>
          <button
            onClick={() => handleTriggerCinematicEvent('NUKE')}
            className="px-1 py-1 bg-[#2b1c05] border border-[#f5a623]/40 text-[#f5a623] hover:bg-[#3d2706] rounded transition-all text-[6.5px] font-black uppercase cursor-pointer"
            title="Launches a simulated Thermonuclear ICBM to trigger client overlay cinematic"
          >
            NUKE
          </button>
          <button
            onClick={() => handleTriggerCinematicEvent('COUP')}
            className="px-1 py-1 bg-[#061c06] border border-green-900 text-green-400 hover:bg-[#0c310c] rounded transition-all text-[6.5px] font-black uppercase cursor-pointer"
            title="Forces a country coup d'état leadership rollover event"
          >
            COUP
          </button>
          <button
            onClick={() => handleTriggerCinematicEvent('CRASH')}
            className="px-1 py-1 bg-[#1e071e] border border-fuchsia-950 text-fuchsia-400 hover:bg-[#340b34] rounded transition-all text-[6.5px] font-black uppercase cursor-pointer"
            title="Depletes the national reserves below $1B to force an insolvency DEFAULT stamp"
          >
            CRASH
          </button>
          <button
            onClick={() => handleTriggerCinematicEvent('PEACE')}
            className="px-1 py-1 bg-[#041a1a] border border-teal-900 text-teal-400 hover:bg-[#083535] rounded transition-all text-[6.5px] font-black uppercase cursor-pointer"
            title="Mediates a Ceasefire and terminates the ongoing WAR with RU"
          >
            PEACE
          </button>
        </div>
      </div>
    </div>
  );
}
