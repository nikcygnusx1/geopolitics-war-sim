import React, { useMemo, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { useUIStore } from '../../store/uiStore';
import { parseGlobalEvent, StructuredEvent } from '../../utils/eventConverter';
import { MajorActionType, ConsequenceEffectType, ScheduledConsequence } from '../../types';

export default function TimelineView() {
  const globalEventLog = useWorldStore((s) => s.globalEventLog);
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);
  const scheduledConsequences = useWorldStore((s) => s.scheduledConsequences || []);
  const recentResolvedConsequences = useWorldStore((s) => s.recentResolvedConsequences || []);

  const {
    selectedEventId,
    selectEvent,
    selectedCountryId,
    selectCountry,
    filterTypes,
    toggleFilterType,
  } = useLinkedAnalysisStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<'CHRONO' | 'ACTOR' | 'TYPE'>('CHRONO');
  
  // Brushable range: default to full [0, currentTick]
  const [minTick, setMinTick] = useState<number>(0);
  const [maxTick, setMaxTick] = useState<number>(1000);

  // Re-adjust max slider value dynamically to always fit simulation tick limits safely
  const resolvedMaxTick = Math.max(currentTick, 10);
  const currentMin = Math.min(minTick, resolvedMaxTick);
  const currentMax = Math.min(maxTick, resolvedMaxTick);

  // Group events parsed
  const allEvents = useMemo(() => {
    return globalEventLog.map((raw, idx) => parseGlobalEvent(raw, idx));
  }, [globalEventLog]);

  // Combined filters: time brush, search query, types checkboxes, and ego selected filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      // 1. Time range filter
      if (evt.tick < currentMin || evt.tick > currentMax) return false;

      // 2. Event type filter
      if (!filterTypes.includes(evt.type)) return false;

      // 3. Search text query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const textMatch = evt.description.toLowerCase().includes(query);
        const titleMatch = evt.title.toLowerCase().includes(query);
        const tagMatch = evt.tags.some((t) => t.toLowerCase().includes(query));
        const countryMatch = (evt.sourceCountryId && evt.sourceCountryId.toLowerCase().includes(query)) || 
                             (evt.targetCountryId && evt.targetCountryId.toLowerCase().includes(query));
        if (!textMatch && !titleMatch && !tagMatch && !countryMatch) return false;
      }

      // 4. If a country is selected as an analytical focal point, filter events to that country's direct actions
      if (selectedCountryId) {
        if (evt.sourceCountryId !== selectedCountryId && evt.targetCountryId !== selectedCountryId) {
          return false;
        }
      }

      return true;
    });
  }, [allEvents, currentMin, currentMax, filterTypes, searchQuery, selectedCountryId]);

  // Type styling configuration
  const eventConfig: Record<string, { label: string; textStyle: string; border: string; bg: string; dot: string }> = {
    STRIKE: { label: '💥 STRIKE', textStyle: 'text-red-500 font-bold', border: 'border-red-950/70', bg: 'bg-red-950/10 hover:bg-red-950/20', dot: 'bg-red-500' },
    SANCTION: { label: '🚫 SANCTION', textStyle: 'text-orange-500 font-bold', border: 'border-orange-950/70', bg: 'bg-orange-950/10 hover:bg-orange-950/20', dot: 'bg-orange-500' },
    DIPLOMACY: { label: '🤝 DIPLOMACY', textStyle: 'text-emerald-400 font-bold', border: 'border-emerald-950/70', bg: 'bg-emerald-950/10 hover:bg-emerald-950/20', dot: 'bg-emerald-400' },
    COVERT_OP: { label: '🕵️ COVERT OP', textStyle: 'text-fuchsia-400 font-bold', border: 'border-fuchsia-950/70', bg: 'bg-fuchsia-950/10 hover:bg-fuchsia-950/20', dot: 'bg-fuchsia-400' },
    RESEARCH: { label: '🔬 TECH BREAKTHROUGH', textStyle: 'text-cyan-400 font-bold', border: 'border-cyan-950/70', bg: 'bg-cyan-950/10 hover:bg-cyan-950/20', dot: 'bg-cyan-400' },
    FISCAL: { label: '⚖️ REVENUE/DECREE', textStyle: 'text-pink-400 font-bold', border: 'border-pink-950/70', bg: 'bg-pink-950/10 hover:bg-pink-950/20', dot: 'bg-pink-400' },
    MARKET: { label: '📈 ECONOMIC SHOCK', textStyle: 'text-amber-500 font-bold', border: 'border-amber-950/70', bg: 'bg-[#1b1502] hover:bg-[#2e2303]', dot: 'bg-amber-400' },
    SYSTEM: { label: '⚙️ CONTROL REPORT', textStyle: 'text-slate-400 font-bold', border: 'border-slate-800', bg: 'bg-slate-900/10 hover:bg-slate-950/20', dot: 'bg-slate-400' },
    OTHER: { label: '📡 FIELD TEL', textStyle: 'text-gray-400 font-bold', border: 'border-gray-800', bg: 'bg-black/10 hover:bg-black/20', dot: 'bg-gray-500' },
  };

  const handleEventClick = (evt: StructuredEvent) => {
    selectEvent(evt.id);
    if (evt.sourceCountryId) {
      selectCountry(evt.sourceCountryId);
    } else if (evt.targetCountryId) {
      selectCountry(evt.targetCountryId);
    }
  };

  // Group events by target group mode
  const groupModeEntries = useMemo(() => {
    if (activeGroup === 'CHRONO') {
      return [{ id: 'CHRONOLOGY', title: 'Chronological Signal Feed', list: filteredEvents }];
    }
    
    if (activeGroup === 'ACTOR') {
      const map: Record<string, StructuredEvent[]> = {};
      filteredEvents.forEach((e) => {
        const actor = e.sourceCountryId || 'GLOBAL';
        if (!map[actor]) map[actor] = [];
        map[actor].push(e);
      });
      return Object.entries(map).map(([actorId, list]) => ({
        id: actorId,
        title: actorId === 'GLOBAL' ? '🌍 INTER-AGENCY SECTORS' : `🗣️ ${countries[actorId]?.name || actorId} ACTION DECK`,
        list,
      }));
    }
    
    // Group by Event Type
    const map: Record<string, StructuredEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!map[e.type]) map[e.type] = [];
      map[e.type].push(e);
    });
    return Object.entries(map).map(([type, list]) => ({
      id: type,
      title: eventConfig[type]?.label || type,
      list,
    }));
  }, [filteredEvents, activeGroup, countries]);

  // MANDATORY T3.5 - UI COMPONENT LEVEL MEMOIZED STATES
  const activePendingConsequences = useMemo(() => {
    return scheduledConsequences
      .filter((c) => !c.resolved)
      .sort((a, b) => a.scheduledTick - b.scheduledTick);
  }, [scheduledConsequences]);

  const resolvedFalloutHistory = useMemo(() => {
    return recentResolvedConsequences.slice().reverse();
  }, [recentResolvedConsequences]);

  // Manual trigger for tester support
  const handleTestTrigger = (action: MajorActionType) => {
    useWorldStore.getState().registerConsequenceChain(action, {
      sourceCountryId: 'US', // player origin country standard
      targetCountryId: 'RU'  // designated tester baseline
    });

    useUIStore.getState().pushAlert({
      title: 'FALLOUT CHAIN ENQUEUED',
      message: `Developer protocol: Enqueued simulated multi-tick consequence chain for action [${action}] (USA and RUSSIA). Advances automatically on ticks.`,
      type: 'INFO'
    });
  };

  const handleClearHistory = () => {
    useWorldStore.getState().clearExpiredHistory();
    useUIStore.getState().pushAlert({
      title: 'RADAR CLEAR',
      message: 'Cleared all logged resolved consequence histories from visual radar deck.',
      type: 'INFO'
    });
  };

  // Styles mapper helper for consequence nodes
  const getConsequenceEffectStyle = (type: ConsequenceEffectType) => {
    switch (type) {
      case ConsequenceEffectType.SANCTIONS:
        return { label: '🚫 SANCTIONS', color: 'text-orange-500', barBg: 'bg-orange-500', border: 'border-orange-500/20', bg: 'bg-orange-500/5' };
      case ConsequenceEffectType.UN_RESOLUTION:
        return { label: '🏛️ UN RESOLUTION', color: 'text-cyan-400', barBg: 'bg-cyan-400', border: 'border-cyan-400/20', bg: 'bg-cyan-400/5' };
      case ConsequenceEffectType.REFUGEE_FLOW:
        return { label: '⛺ REFUGEE FLOWS', color: 'text-amber-500', barBg: 'bg-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' };
      case ConsequenceEffectType.MARKET_REACTION:
        return { label: '📉 MARKET REACTION', color: 'text-fuchsia-400', barBg: 'bg-fuchsia-400', border: 'border-fuchsia-400/20', bg: 'bg-fuchsia-400/5' };
      case ConsequenceEffectType.ALLIANCE_INVITATION:
        return { label: '🌍 ALLIANCE IMPACT', color: 'text-emerald-400', barBg: 'bg-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5' };
      case ConsequenceEffectType.COUP_RISK_INCREASE:
        return { label: '⚡ INSTABILITY COUP', color: 'text-rose-500', barBg: 'bg-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/5' };
    }
  };

  return (
    <div className="w-full h-full bg-[#030603] border border-[#1a5c1a] rounded p-3 text-white font-mono text-[11px] overflow-hidden flex flex-col space-y-3">
      
      {/* 1. Header block */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⏱️</span>
          <div>
            <h1 className="text-[12px] font-extrabold tracking-widest text-[#00ff44] uppercase leading-none font-sans">pattern of life system</h1>
            <p className="text-[9px] text-gray-500 uppercase mt-0.5">Dual-Analytical Log deck and delayed consequence fallout radar</p>
          </div>
        </div>

        {/* Group Switcher */}
        <div className="flex gap-0.5 bg-black/40 p-0.5 border border-[#113111] rounded">
          {(['CHRONO', 'ACTOR', 'TYPE'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-2.5 py-1 text-[8.5px] font-bold cursor-pointer transition-all rounded-[1px] uppercase ${
                activeGroup === g
                  ? 'bg-[#153a15] text-[#00ff44] border-b border-[#00ff44]'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Grid Deck layout columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden h-[540px]">
        
        {/* LEFT COLUMN: CHRONOLOGY SIGNAL FEED (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col h-full space-y-3 overflow-hidden">
          
          {/* Controllers Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/40 p-2 border border-[#1a3a1a]/50 rounded shrink-0">
            {/* Time-Window Slider */}
            <div className="flex flex-col space-y-1.5 justify-center">
              <div className="flex justify-between text-[8px] text-gray-400 font-bold leading-none uppercase">
                <span>CHRONO BRUSH:</span>
                <span className="text-[#00ff44]">TICK {currentMin} → {currentMax}</span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min={0}
                  max={resolvedMaxTick}
                  value={currentMin}
                  onChange={(e) => setMinTick(parseInt(e.target.value))}
                  className="w-full accent-[#00ff44] h-1"
                />
                <input
                  type="range"
                  min={0}
                  max={resolvedMaxTick}
                  value={currentMax}
                  onChange={(e) => setMaxTick(parseInt(e.target.value))}
                  className="w-full accent-[#00ff44] h-1"
                />
              </div>
            </div>

            {/* Text Filter Input */}
            <div className="flex flex-col space-y-1.5 justify-center">
              <span className="text-[8px] text-gray-400 font-bold uppercase leading-none">SEARCH INTERCEPTS:</span>
              <input
                type="text"
                placeholder="TAGS, COUNTRIES, DESCRIPTIONS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#010401] border border-[#1a3a1a] px-2 py-1 rounded text-[9.5px] text-white focus:outline-none focus:border-[#00ff44] uppercase placeholder:text-gray-700"
              />
            </div>
          </div>

          {/* Filter Type Selectors Row */}
          <div className="flex flex-wrap gap-1 items-center bg-black/20 p-1.5 border border-[#123012]/40 rounded shrink-0">
            <span className="text-[8px] text-gray-500 font-bold uppercase mr-1">TYPE:</span>
            {Object.entries(eventConfig).map(([type, c]) => {
              const isActive = filterTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleFilterType(type)}
                  className={`px-1 py-0.5 rounded-[1px] border text-[8px] uppercase font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#00ff44]/60 bg-[#143114]/50 text-[#00ff44]'
                      : 'border-[#1a3a1a]/30 bg-black/20 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`inline-block w-1 h-1 rounded-full mr-1 ${c.dot}`} />
                  {type}
                </button>
              );
            })}
          </div>

          {/* Scrollable Group List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {selectedCountryId && (
              <div className="bg-[#1b1c02] border border-[#ffb000]/60 p-2 text-[#ffb000] rounded text-[9px] uppercase flex justify-between items-center leading-none select-none">
                <span>🔎 FILTER CORES CO-ALIGNED WITH: <b>{countries[selectedCountryId]?.name || selectedCountryId}</b></span>
                <button onClick={() => selectCountry(null)} className="font-extrabold hover:text-white">❌ CLEAR</button>
              </div>
            )}

            {groupModeEntries.every((e) => e.list.length === 0) ? (
              <div className="text-center py-10 border border-dashed border-[#1a5c1a]/30 rounded text-gray-600 uppercase font-black tracking-widest select-none">
                🔴 NO CHRONO SIGNALS FOUND IN WINDOW
              </div>
            ) : (
              groupModeEntries.map((group) => {
                if (group.list.length === 0) return null;
                return (
                  <div key={group.id} className="space-y-1.5">
                    <h2 className="text-[#00ff44] bg-[#0c180c] px-2 py-1 rounded-sm border border-[#1b3d1b] font-bold text-[9px] tracking-widest uppercase">
                      {group.title} ({group.list.length})
                    </h2>

                    <div className="space-y-1">
                      {group.list.slice(0, 100).map((evt) => {
                        const c = eventConfig[evt.type] || eventConfig.OTHER;
                        const isSelected = selectedEventId === evt.id;
                        const isSourceFocus = selectedCountryId && evt.sourceCountryId === selectedCountryId;
                        const isTargetFocus = selectedCountryId && evt.targetCountryId === selectedCountryId;

                        return (
                          <div
                            key={evt.id}
                            onClick={() => handleEventClick(evt)}
                            className={`p-2 rounded-[1px] border flex flex-col sm:flex-row gap-2 justify-between cursor-pointer transition-all ${c.bg} ${c.border} ${
                              isSelected
                                ? 'ring-1 ring-[#00ff44] border-[#00ff44] bg-[#0e1f0e]'
                                : isSourceFocus || isTargetFocus
                                ? 'border-[#ffb000] bg-[#1a1c02]'
                                : ''
                            }`}
                          >
                            {/* Left metadata */}
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-1 text-[8px]">
                                <span className="text-gray-500 font-bold bg-[#010301] px-1 rounded-sm border border-[#123012]">
                                  T {evt.tick}
                                </span>
                                <span className={`${c.textStyle} tracking-widest`}>
                                  {c.label}
                                </span>
                                {evt.sourceCountryId && (
                                  <span className="text-[#00ff44] bg-[#0c180c] px-1 rounded-sm border border-[#123012] uppercase font-bold select-none">
                                    {countries[evt.sourceCountryId]?.flagEmoji} {evt.sourceCountryId}
                                  </span>
                                )}
                                {evt.targetCountryId && (
                                  <span className="text-red-500 bg-red-950/10 px-1 rounded-sm border border-red-950/30 uppercase font-bold select-none">
                                    → {countries[evt.targetCountryId]?.flagEmoji} {evt.targetCountryId}
                                  </span>
                                )}
                              </div>

                              <p className="text-[9.5px] text-white/90 font-sans tracking-wide leading-normal">
                                {evt.description}
                              </p>
                            </div>

                            {/* Right tags and details */}
                            <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 gap-1 select-none">
                              <div className="flex gap-1">
                                {evt.tags.map((tag) => (
                                  <span key={tag} className="text-[7px] text-gray-500 bg-[#020502] px-1 border border-[#122812]/50 tracking-widest uppercase">
                                    #{tag}
                                  </span>
                                ))}
                              </div>

                              <span className={`text-[8px] font-bold uppercase rounded px-1 py-0.5 ${
                                evt.severity === 'CRITICAL' ? 'bg-red-900/30 text-red-500 border border-red-500/30 animate-pulse' :
                                evt.severity === 'WARNING' ? 'bg-amber-950/30 text-[#ffb000] border border-amber-500/20' :
                                evt.severity === 'SYSTEM' ? 'bg-indigo-950/20 text-indigo-400 border border-indigo-400/20' :
                                'bg-slate-900 text-gray-500'
                              }`}>
                                {evt.severity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONSEQUENCE RADAR / DELAYED FALLOUT CHAINS (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col h-full space-y-3 overflow-hidden border-l border-[#1a3a1a]/30 pl-3">
          
          {/* Header */}
          <div className="bg-[#10100d] border border-[#ffb000]/60 p-2.5 rounded shrink-0 flex flex-col space-y-1">
            <div className="flex justify-between items-center text-[9.5px] font-bold text-[#ffb000] uppercase">
              <span>⚠️ GEOPOLITICAL FALLOUT RADAR</span>
              <span className="text-[8px] bg-amber-950/50 border border-amber-500/30 text-amber-400 px-1 py-0.5 rounded animate-pulse">SYSTEMS ACTIVE</span>
            </div>
            <p className="text-[8px] text-gray-500 uppercase leading-normal font-sans">
              Tracks multi-tick chain reactions triggered by war-declarations, nuclear payloads, coups, sanctions and key alliance pacts.
            </p>
          </div>

          {/* Interactive Tester Panel */}
          <div className="bg-black/40 border border-[#1a3a1a]/40 p-2 rounded shrink-0 flex flex-col space-y-1.5">
            <span className="text-[8.5px] font-black text-[#00ff44] uppercase tracking-wider">🔬 MANUAL SCENARIO ACTION INJECTOR:</span>
            <div className="grid grid-cols-2 gap-1">
              {(['DECLARE_WAR', 'LAUNCH_STRIKE', 'NUCLEAR_ESCALATION', 'IMPOSE_SANCTIONS', 'SIGN_ALLIANCE', 'DISPATCH_FOREIGN_AID', 'STAGE_COUP', 'REGIME_CHANGE'] as MajorActionType[]).map((act) => (
                <button
                  key={act}
                  onClick={() => handleTestTrigger(act)}
                  className="bg-[#0c180c] hover:bg-[#153115] border border-[#1a5c1a] hover:border-[#00ff44] text-white/90 hover:text-white transition-all py-1.5 rounded-[1px] text-[7.5px] font-black uppercase text-center select-none cursor-pointer"
                >
                  +{act.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tabular Lists Wrapper */}
          <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
            
            {/* 1. Pending Consequences Section */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[160px]">
              <div className="flex justify-between items-center bg-[#0d160d] border-b border-[#1a4a1a] pb-1 mr-1 mb-1.5 shrink-0">
                <span className="text-[#00ff44] font-black uppercase text-[9px] tracking-widest">⏳ PENDING CASCADES ({activePendingConsequences.length})</span>
                <span className="text-[8px] text-gray-500">CURRENT TICK: {currentTick}</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {activePendingConsequences.length === 0 ? (
                  <div className="text-center py-8 text-gray-700 bg-black/10 border border-dashed border-[#1a3a1a]/20 rounded text-[9.5px] uppercase italic">
                    NO PENDING GEOPOLITICAL CASCADES DETECTED.
                  </div>
                ) : (
                  activePendingConsequences.map((c) => {
                    const style = getConsequenceEffectStyle(c.effectType);
                    const ticksLeft = c.scheduledTick - currentTick;
                    const totalWait = c.scheduledTick - c.createdAtTick;
                    const pctComplete = totalWait > 0 ? Math.round(((totalWait - ticksLeft) / totalWait) * 100) : 100;

                    return (
                      <div key={c.id} className={`p-2 border rounded ${style.border} ${style.bg} flex flex-col space-y-1.5`}>
                        <div className="flex justify-between items-center text-[8.5px] font-bold">
                          <span className={`${style.color} uppercase`}>
                            {style.label}
                          </span>
                          <span className="text-amber-400">
                            IN {ticksLeft} TICKS (TICK {c.scheduledTick})
                          </span>
                        </div>

                        {/* Progress Metre */}
                        <div className="w-full bg-[#050705] h-1 border border-[#1a3a1a] rounded-sm overflow-hidden flex">
                          <div className={`${style.barBg} h-full transition-all duration-300`} style={{ width: `${pctComplete}%` }} />
                        </div>

                        <div className="text-[8px] text-gray-400 font-sans tracking-wide leading-tight">
                          FALLOUT FROM: <b className="text-white">{c.actionType}</b> TRIGGERED BY <b className="text-white">{countries[c.sourceCountryId]?.name || c.sourceCountryId}</b>
                          {c.targetCountryId && <React.Fragment> TARGETED AT <b className="text-white">{countries[c.targetCountryId]?.name || c.targetCountryId}</b></React.Fragment>}
                        </div>

                        <div className="flex justify-between items-center text-[7.5px] text-gray-500 leading-none">
                          <span>PROBABILITY ROLL CHECK: {Math.round(c.probability * 100)}%</span>
                          <span className="text-gray-400">ETA TICK {c.scheduledTick}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Recent Fallouts Log Section */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[160px]">
              <div className="flex justify-between items-center bg-[#150a0a]/40 border-b border-red-950/60 pb-1 mr-1 mb-1.5 shrink-0">
                <span className="text-red-500 font-black uppercase text-[9px] tracking-widest">⚡ RESOLVED FALLOUT HISTORIC ({resolvedFalloutHistory.length})</span>
                {resolvedFalloutHistory.length > 0 && (
                  <button onClick={handleClearHistory} className="text-[7.5px] bg-[#1a0808] hover:bg-[#310e0e] text-red-400 px-1 py-0.5 rounded border border-red-900/50 select-none cursor-pointer">
                    RESET LIST
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                {resolvedFalloutHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-700 bg-black/10 border border-dashed border-red-950/10 rounded text-[9.5px] uppercase italic">
                    RECORDS OF GEOPOLITICAL FALLOUT WILL EMIT HERE.
                  </div>
                ) : (
                  resolvedFalloutHistory.slice(0, 15).map((c) => {
                    const style = getConsequenceEffectStyle(c.effectType);

                    return (
                      <div key={c.id} className="p-1 px-2 border border-red-950/30 bg-[#0d0707] flex items-center justify-between gap-1 rounded-[1px]">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-[8.5px] text-red-400 font-bold uppercase select-none leading-none">
                            {style.label}
                          </span>
                          <span className="text-[7.5px] text-gray-500 leading-none font-sans mt-0.5">
                            ACTED AT TICK {c.scheduledTick} FROM SOURCE: {c.sourceCountryId}
                          </span>
                        </div>
                        <span className="text-[7.5px] text-red-500 bg-red-950/40 border border-red-900/40 px-1 py-0.5 font-bold uppercase select-none">
                          RESOLVED TRUE
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
