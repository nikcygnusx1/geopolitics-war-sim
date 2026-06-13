import React, { useState, useMemo } from 'react';
import { useWorldStore } from '../../store/worldStore';
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
    <div className="gotham-panel gotham-panel--secondary p-3 flex flex-col font-mono text-[10.5px] shrink-0 overflow-hidden w-full mb-3" data-classification="SECRET" style={{ minHeight: '190px', maxHeight: '280px' }}>
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
    </div>
  );
}
