import React, { useMemo, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { parseGlobalEvent, StructuredEvent } from '../../utils/eventConverter';

export default function TimelineView() {
  const globalEventLog = useWorldStore((s) => s.globalEventLog);
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

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

  return (
    <div className="w-full h-full flex flex-col bg-[#030603] border border-[#1a5c1a] rounded p-3 text-white font-mono text-[11px] overflow-hidden space-y-3">
      {/* 1. Header block */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⏱️</span>
          <div>
            <h1 className="text-[12px] font-extrabold tracking-widest text-[#00ff44] uppercase leading-none">pattern of life system</h1>
            <p className="text-[9px] text-gray-500 uppercase mt-0.5">Chronolog of intelligence alerts and transaction intercepts</p>
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

      {/* 2. Range brush & Search controllers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40 p-2.5 border border-[#1a3a1a]/50 rounded">
        {/* Time-Window Slider */}
        <div className="flex flex-col space-y-1.5 justify-center">
          <div className="flex justify-between text-[9px] text-gray-400 font-bold leading-none uppercase">
            <span>CHRONOLOGY BRUSH SLIDER:</span>
            <span className="text-[#00ff44]">TICK {currentMin} → TICK {currentMax}</span>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="range"
              min={0}
              max={resolvedMaxTick}
              value={currentMin}
              onChange={(e) => setMinTick(parseInt(e.target.value))}
              className="w-full accent-[#00ff44]"
            />
            <input
              type="range"
              min={0}
              max={resolvedMaxTick}
              value={currentMax}
              onChange={(e) => setMaxTick(parseInt(e.target.value))}
              className="w-full accent-[#00ff44]"
            />
          </div>
          <p className="text-[8px] text-gray-600 uppercase italic">Slide left/right to isolate historical intervals and wave cycles</p>
        </div>

        {/* Text Filter Input */}
        <div className="flex flex-col space-y-1.5 justify-center">
          <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">SEARCH DESCRIP / METADATA TAGS:</span>
          <div className="relative">
            <input
              type="text"
              placeholder="FILTER SIGNAL TAGS, COUNTRIES, DESCRIPTIONS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#010401] border border-[#1a3a1a] px-2 py-1.5 rounded text-[10px] text-white focus:outline-none focus:border-[#00ff44] uppercase tracking-wider placeholder:text-gray-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-[8.5px] text-gray-400 hover:text-white"
              >
                ❌ CLEAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Filter Type Selectors Row */}
      <div className="flex flex-wrap gap-1 items-center bg-black/20 p-2 border border-[#123012]/40 rounded">
        <span className="text-[9px] text-gray-500 font-bold uppercase mr-1">TYPES FILTER:</span>
        {Object.entries(eventConfig).map(([type, c]) => {
          const isActive = filterTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilterType(type)}
              className={`px-1.5 py-0.5 rounded-[1px] border text-[8.5px] uppercase font-bold transition-all cursor-pointer ${
                isActive
                  ? 'border-[#00ff44]/60 bg-[#143114]/50 text-[#00ff44]'
                  : 'border-[#1a3a1a]/30 bg-black/20 text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${c.dot}`} />
              {type}
            </button>
          );
        })}
      </div>

      {/* 4. Scrollable Group List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[480px]">
        {selectedCountryId && (
          <div className="bg-[#1b1c02] border border-[#ffb000]/60 p-2 text-[#ffb000] rounded text-[9.5px] uppercase flex justify-between items-center leading-none">
            <span>🔎 LOCALIZING WAVEFORMS FOR CORES CO-ALIGNED WITH: <b>{countries[selectedCountryId]?.name || selectedCountryId}</b></span>
            <button onClick={() => selectCountry(null)} className="font-extrabold hover:text-white">❌ DISMISS EGO TRACK</button>
          </div>
        )}

        {groupModeEntries.every((e) => e.list.length === 0) ? (
          <div className="text-center py-10 border border-dashed border-[#1a5c1a]/30 rounded text-gray-600 uppercase font-black tracking-widest">
            🔴 NO CO-ALIGNED SIGNALS TRACKED IN GIVEN FILTERS / TICK WINDOW
          </div>
        ) : (
          groupModeEntries.map((group) => {
            if (group.list.length === 0) return null;
            return (
              <div key={group.id} className="space-y-1.5">
                <div className="text-[9.5px] text-[#00ff44] bg-[#071307] border border-[#113111] px-2 py-1 rounded-[1px] font-bold uppercase tracking-wider flex justify-between items-center select-none">
                  <span>{group.title}</span>
                  <span className="text-gray-500 text-[8.5px]">{group.list.length} RECORDS</span>
                </div>

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
                          <div className="flex flex-wrap items-center gap-1.5 text-[8.5px]">
                            <span className="text-gray-500 font-bold bg-[#010301] px-1 rounded-sm border border-[#123012]">
                              TICK {evt.tick}
                            </span>
                            <span className={`${c.textStyle} tracking-widest`}>
                              {c.label}
                            </span>
                            {evt.sourceCountryId && (
                              <span className="text-[#00ff44] bg-[#0c180c] px-1 rounded-sm border border-[#123012] uppercase font-bold select-none">
                                FROM: {countries[evt.sourceCountryId]?.flagEmoji} {evt.sourceCountryId}
                              </span>
                            )}
                            {evt.targetCountryId && (
                              <span className="text-red-500 bg-red-950/10 px-1 rounded-sm border border-red-950/30 uppercase font-bold select-none">
                                TO: {countries[evt.targetCountryId]?.flagEmoji} {evt.targetCountryId}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-white/90 font-sans tracking-wide leading-relaxed">
                            {evt.description}
                          </p>
                        </div>

                        {/* Right tags and details */}
                        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 gap-1 select-none">
                          <div className="flex gap-1">
                            {evt.tags.map((tag) => (
                              <span key={tag} className="text-[7.5px] text-gray-500 bg-[#020502] px-1 border border-[#122812]/50 tracking-widest uppercase">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <span className={`text-[8.5px] font-bold uppercase rounded px-1.5 py-0.5 ${
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
  );
}
