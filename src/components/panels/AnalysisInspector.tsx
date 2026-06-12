import React, { useMemo } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { parseGlobalEvent } from '../../utils/eventConverter';

export default function AnalysisInspector() {
  const countries = useWorldStore((s) => s.countries);
  const globalEventLog = useWorldStore((s) => s.globalEventLog);

  const {
    selectedCountryId,
    selectedEdge,
    selectedEventId,
    selectCountry,
    selectEdge,
    selectEvent,
  } = useLinkedAnalysisStore();

  // Parse all events to filter recent logs for inspected items
  const allEvents = useMemo(() => {
    return globalEventLog.map((raw, idx) => parseGlobalEvent(raw, idx));
  }, [globalEventLog]);

  // Derive country inspector detail view
  const countryData = useMemo(() => {
    if (!selectedCountryId || !countries[selectedCountryId]) return null;
    const c = countries[selectedCountryId];

    // Find all allies (same non-neutral block)
    const allies = Object.entries(countries)
      .filter(([id, other]) => id !== selectedCountryId && c.allianceBlock !== 'NEUTRAL' && c.allianceBlock === other.allianceBlock)
      .map(([id, other]) => ({ id, name: other.name, flag: other.flagEmoji }));

    // Find recent events related to this country
    const recent = allEvents
      .filter((evt) => evt.sourceCountryId === selectedCountryId || evt.targetCountryId === selectedCountryId)
      .slice(0, 5);

    return {
      raw: c,
      allies,
      recent,
    };
  }, [selectedCountryId, countries, allEvents]);

  // Derive edge/relationship detail view
  const edgeData = useMemo(() => {
    if (!selectedEdge) return null;
    const srcCountry = countries[selectedEdge.source];
    const tgtCountry = countries[selectedEdge.target];

    // Find events involving both countries
    const mutualEvents = allEvents
      .filter((evt) => 
        (evt.sourceCountryId === selectedEdge.source && evt.targetCountryId === selectedEdge.target) ||
        (evt.sourceCountryId === selectedEdge.target && evt.targetCountryId === selectedEdge.source)
      )
      .slice(0, 5);

    return {
      src: srcCountry ? { id: selectedEdge.source, name: srcCountry.name, flag: srcCountry.flagEmoji, ideology: srcCountry.political.ideology } : null,
      tgt: tgtCountry ? { id: selectedEdge.target, name: tgtCountry.name, flag: tgtCountry.flagEmoji, ideology: tgtCountry.political.ideology } : null,
      type: selectedEdge.type,
      mutualEvents,
    };
  }, [selectedEdge, countries, allEvents]);

  // Derive event detail view
  const eventData = useMemo(() => {
    if (!selectedEventId) return null;
    const found = allEvents.find((e) => e.id === selectedEventId);
    if (!found) return null;

    const src = found.sourceCountryId ? countries[found.sourceCountryId] : null;
    const tgt = found.targetCountryId ? countries[found.targetCountryId] : null;

    return {
      raw: found,
      srcObj: src ? { id: found.sourceCountryId!, name: src.name, flag: src.flagEmoji } : null,
      tgtObj: tgt ? { id: found.targetCountryId!, name: tgt.name, flag: tgt.flagEmoji } : null,
    };
  }, [selectedEventId, allEvents, countries]);

  return (
    <div className="w-full h-full bg-[#030603] border border-[#1a5c1a] rounded p-3 text-white font-mono text-[11px] overflow-y-auto space-y-3">
      {/* Dynamic Title / State Badge */}
      <div className="text-[10px] text-[#00ff44] bg-[#071307] border border-[#113111] px-2 py-1 rounded-[1.5px] font-bold flex justify-between items-center uppercase tracking-wider select-none leading-none mb-2">
        <span>📋 Workspace Inspector</span>
        <span className="text-gray-500 text-[8px] animate-pulse">Scanning Transducers...</span>
      </div>

      {/* CASE A: No selection */}
      {!countryData && !edgeData && !eventData && (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3 border border-dashed border-[#1a5c1a]/30 rounded">
          <div className="text-2xl animate-pulse">📡</div>
          <div className="space-y-1">
            <h2 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Awaiting Signal Synchronization</h2>
            <p className="text-[9px] text-gray-500 uppercase leading-relaxed max-w-[180px] mx-auto">
              Select a sovereign node, tie link, or timeline signal to initialize telemetry decoding.
            </p>
          </div>
        </div>
      )}

      {/* CASE B: Country selected */}
      {countryData && (
        <div className="space-y-3">
          {/* Flag section */}
          <div className="flex items-center gap-2.5 p-2 bg-[#061206] border border-[#1a5c1a] rounded-sm">
            <span className="text-2xl leading-none">{countryData.raw.flagEmoji}</span>
            <div className="flex-1">
              <h2 className="text-[12px] font-extrabold tracking-widest text-[#00ff44] uppercase leading-none">
                {countryData.raw.name}
              </h2>
              <p className="text-[8px] text-gray-500 uppercase font-semibold mt-0.5 tracking-wider">
                CODENAME INTERCEPT: {selectedCountryId} | BLOC: {countryData.raw.allianceBlock}
              </p>
            </div>
            <button
              onClick={() => selectCountry(null)}
              className="text-gray-500 hover:text-white text-[9px] font-extrabold border border-[#1a3a1a] px-1 bg-black/40"
            >
              CLEAR
            </button>
          </div>

          {/* Stats sheet */}
          <div className="space-y-1.5">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">KEY TELEMETRY STATS:</span>
            <div className="grid grid-cols-2 gap-1 bg-black/30 p-2 border border-[#1a3a1a]/50 rounded-sm">
              <div className="space-y-0.5">
                <span className="text-[7.5px] text-gray-500 block uppercase font-bold">REGIONAL TREASURY:</span>
                <span className="text-[#00ff44] text-[10px] font-bold">
                  ${countryData.raw.economic.treasuryCashB?.toFixed(2)}B
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7.5px] text-gray-500 block uppercase font-bold">GROSS DOMESTIC PRODUCT:</span>
                <span className="text-[#ffb000] text-[10px] font-bold">
                  ${countryData.raw.economic.gdpB?.toFixed(1)}B
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7.5px] text-gray-500 block uppercase font-bold">NUCLEAR CAPABLE:</span>
                <span className={`text-[10px] font-bold ${countryData.raw.arsenal.nuclearCapable ? 'text-red-500' : 'text-gray-500'}`}>
                  {countryData.raw.arsenal.nuclearCapable ? 'MUTUAL WARHEADS' : 'NON-WARHEADS'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7.5px] text-gray-500 block uppercase font-bold">MILITARY POWER INDEX:</span>
                <span className="text-cyan-400 text-[10px] font-bold">
                  {countryData.raw.arsenal.totalPowerRating?.toLocaleString() ?? '10,000'} PTS
                </span>
              </div>
            </div>
          </div>

          {/* Political alignment */}
          <div className="space-y-1.5 p-2 bg-[#020502] border border-[#122812] rounded-sm text-[10px]">
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase font-bold text-[8px]">IDEOLOGY:</span>
              <span className="font-extrabold text-white">{countryData.raw.political.ideology}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase font-bold text-[8px]">REGIME STABILITY:</span>
              <span className="font-extrabold text-[#00ff44]">{countryData.raw.political.stability}%</span>
            </div>
          </div>

          {/* Alliances map */}
          <div className="space-y-1">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">SECURE ALLIES ({countryData.allies.length}):</span>
            {countryData.allies.length === 0 ? (
              <div className="text-[9px] text-gray-600 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/20 uppercase">
                Isolated / Sovereign Neutral
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 font-sans">
                {countryData.allies.map((ally) => (
                  <button
                    key={ally.id}
                    onClick={() => selectCountry(ally.id)}
                    className="flex items-center gap-1.5 p-1 border border-[#1a3a1a]/50 bg-black/20 hover:bg-[#0c180c] transition-all text-[9.5px] rounded-sm text-left truncate"
                  >
                    <span>{ally.flag}</span>
                    <span className="truncate text-white/90 hover:text-[#00ff44] transition-colors">{ally.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* War Fronts */}
          <div className="space-y-1 text-sans">
            <span className="text-[8px] text-red-500 font-bold uppercase block tracking-wider">KINETIC WARS ACTIVE:</span>
            {!countryData.raw.atWarWith || countryData.raw.atWarWith.length === 0 ? (
              <div className="text-[9px] text-[#00ff44] italic bg-black/10 py-1.5 px-2 rounded-sm border border-[#1a5c1a]/20 uppercase">
                Peace state maintained
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {countryData.raw.atWarWith.map((hostileId) => (
                  <button
                    key={hostileId}
                    onClick={() => selectCountry(hostileId)}
                    className="flex items-center gap-1.5 p-1 border border-red-950/50 bg-red-950/5 hover:bg-red-950/25 transition-all text-[9.5px] rounded-sm text-left truncate text-red-400 font-bold"
                  >
                    <span>⚠️</span>
                    <span className="truncate">{countries[hostileId]?.name || hostileId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent localized events */}
          <div className="space-y-1">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">LOCAL SITUATION TELEMETRY:</span>
            {countryData.recent.length === 0 ? (
              <div className="text-[9px] text-gray-600 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/20 uppercase">
                Quiet sector. No immediate trace waves
              </div>
            ) : (
              <div className="space-y-1">
                {countryData.recent.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => selectEvent(evt.id)}
                    className="p-1.5 border border-[#1a3a1a]/40 bg-black/20 hover:bg-black/40 transition-all rounded-[1px] space-y-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-[7.5px] text-gray-500">
                      <span>TICK {evt.tick}</span>
                      <span className="text-[#00ff44] font-bold">{evt.severity}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-sans leading-snug line-clamp-2">
                      {evt.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASE C: Edge selected */}
      {edgeData && (
        <div className="space-y-3">
          {/* Header segment */}
          <div className="p-2 bg-[#09151c]/50 border border-slate-700 rounded-sm space-y-1">
            <h2 className="text-[11px] font-extrabold tracking-widest text-cyan-400 uppercase leading-none">
              🌐 Semantic Tie Analysis
            </h2>
            <p className="text-[8px] text-gray-500 uppercase tracking-widest font-semibold leading-none mt-1">
              REL: {edgeData.type} | CLASSIFIED LINK INTERFACE
            </p>
          </div>

          {/* Node counter-alignments */}
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-black/40 border border-[#1a3a1a] rounded-sm items-center">
            {/* Source */}
            {edgeData.src ? (
              <button
                onClick={() => selectCountry(edgeData.src!.id)}
                className="text-center p-2 border border-[#1a3a1a] hover:border-[#00ff44]/70 bg-black/30 hover:bg-[#071307] rounded-sm transition-all text-[10px]"
              >
                <span className="text-xl block mb-0.5 leading-none">{edgeData.src.flag}</span>
                <span className="font-extrabold text-white block uppercase truncate">{edgeData.src.name}</span>
                <span className="text-[8px] text-gray-500 uppercase block tracking-wider">{edgeData.src.ideology}</span>
              </button>
            ) : (
              <div className="text-center text-gray-600 text-[9px]">SOURCE DETACHED</div>
            )}

            {/* Target */}
            {edgeData.tgt ? (
              <button
                onClick={() => selectCountry(edgeData.tgt!.id)}
                className="text-center p-2 border border-[#1a3a1a] hover:border-[#00ff44]/70 bg-black/30 hover:bg-[#071307] rounded-sm transition-all text-[10px]"
              >
                <span className="text-xl block mb-0.5 leading-none">{edgeData.tgt.flag}</span>
                <span className="font-extrabold text-white block uppercase truncate">{edgeData.tgt.name}</span>
                <span className="text-[8px] text-gray-500 uppercase block tracking-wider">{edgeData.tgt.ideology}</span>
              </button>
            ) : (
              <div className="text-center text-gray-600 text-[9px]">TARGET DETACHED</div>
            )}
          </div>

          {/* Relationship Metrics */}
          <div className="space-y-1.5">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">TIE PROFILE DETAILS:</span>
            <div className="bg-[#020502] border border-[#122812] p-2 rounded-sm text-[10px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 text-[8.5px] font-bold uppercase">TIE DENSITY:</span>
                <span className="font-bold text-[#00ff44]">94.2 POWER WAVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-[8.5px] font-bold uppercase">CLASSIFICATIVE TYPE:</span>
                <span className={`font-black tracking-widest ${
                  edgeData.type === 'WAR' ? 'text-red-500' :
                  edgeData.type === 'SANCTIONS' ? 'text-orange-400' :
                  edgeData.type === 'ALLIANCE' ? 'text-emerald-400' :
                  'text-[#ffb000]'
                }`}>
                  {edgeData.type}
                </span>
              </div>
            </div>
          </div>

          {/* Mutual events */}
          <div className="space-y-1">
            <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">CO-ORDINATED RELATION INCIDENTS:</span>
            {edgeData.mutualEvents.length === 0 ? (
              <div className="text-[9px] text-gray-600 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/20 uppercase">
                No direct exchange events recorded
              </div>
            ) : (
              <div className="space-y-1.5">
                {edgeData.mutualEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => selectEvent(evt.id)}
                    className="p-1.5 border border-[#1a3a1a]/40 bg-black/20 hover:bg-black/40 transition-all rounded-[1px] space-y-1 cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-[7.5px] text-gray-500 uppercase leading-none">
                      <span>TICK {evt.tick} | {evt.type}</span>
                      <span className="text-cyan-400 font-bold">{evt.severity}</span>
                    </div>
                    <p className="text-[9.5px] text-gray-400 font-sans leading-snug">
                      {evt.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => selectEdge(null)}
            className="w-full text-center py-1.5 text-[8.5px] tracking-wider font-bold text-gray-500 bg-black/40 border border-[#1a3a1a] hover:text-white hover:bg-black/60 rounded"
          >
            DISMISS RELATION SPLIT
          </button>
        </div>
      )}

      {/* CASE D: Event selected */}
      {eventData && (
        <div className="space-y-3">
          {/* Header */}
          <div className="p-2 border border-red-950 bg-red-950/10 rounded-sm space-y-1 animate-fade-in text-sans">
            <div className="flex justify-between items-center text-[8px] text-red-400 font-bold leading-none select-none">
              <span>📊 SIGNAL ENVELOPE INTERCEPT</span>
              <span>TICK {eventData.raw.tick}</span>
            </div>
            <h2 className="text-[11.5px] font-extrabold tracking-widest text-[#ffb000] uppercase leading-none mt-1">
              {eventData.raw.title}
            </h2>
          </div>

          {/* Description Block */}
          <div className="bg-[#010401] border border-[#1a3a1a] p-2 rounded-sm space-y-1.5 text-sans">
            <span className="text-[7.5px] block text-gray-500 font-semibold tracking-wider uppercase select-none">DECRYPT CONTENT:</span>
            <p className="text-[10px] text-white/90 leading-relaxed font-sans">{eventData.raw.description}</p>
          </div>

          {/* Participants */}
          {(eventData.srcObj || eventData.tgtObj) && (
            <div className="space-y-1 select-none">
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">RESOLVED OPERATORS / AGENTS:</span>
              <div className="grid grid-cols-2 gap-1 text-center font-sans text-sans">
                {eventData.srcObj ? (
                  <button
                    onClick={() => selectCountry(eventData.srcObj!.id)}
                    className="p-1.5 border border-[#1d331d] bg-[#091509] hover:bg-[#122812] rounded transition-all text-left flex items-center gap-1.5 font-bold"
                  >
                    <span>{eventData.srcObj.flag}</span>
                    <span className="truncate text-[9.5px]">{eventData.srcObj.name}</span>
                  </button>
                ) : (
                  <div className="p-1 px-2 border border-zinc-900 bg-black/20 text-gray-600 text-[9px] rounded uppercase select-none">Global Sector</div>
                )}

                {eventData.tgtObj ? (
                  <button
                    onClick={() => selectCountry(eventData.tgtObj!.id)}
                    className="p-1.5 border border-[#301616] bg-[#160a0a] hover:bg-[#281212] rounded transition-all text-left flex items-center gap-1.5 text-red-400 font-bold"
                  >
                    <span>{eventData.tgtObj.flag}</span>
                    <span className="truncate text-[9.5px]">{eventData.tgtObj.name}</span>
                  </button>
                ) : (
                  <div className="p-1 px-2 border border-zinc-900 bg-black/20 text-gray-600 text-[9px] rounded uppercase select-none">No Traced Enemy</div>
                )}
              </div>
            </div>
          )}

          {/* Severity and Tags */}
          <div className="p-2 border border-[#1a2c1a] bg-[#020602] rounded-sm space-y-2 text-[9px] font-mono leading-none select-none">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 uppercase font-bold text-[8px]">SEVERITY INDEX:</span>
              <span className={`font-black tracking-widest ${
                eventData.raw.severity === 'CRITICAL' ? 'text-red-500' :
                eventData.raw.severity === 'WARNING' ? 'text-amber-500' :
                'text-[#00ff44]'
              }`}>
                {eventData.raw.severity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 uppercase font-bold text-[8px]">SYSTEM SIG-CATEGORIES:</span>
              <span className="font-extrabold uppercase text-cyan-400">{eventData.raw.type}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1 font-sans justify-end">
              {eventData.raw.tags.map((tag) => (
                <span key={tag} className="text-[7.5px] text-gray-500 bg-[#020502] px-1 border border-[#113111]/40 uppercase rounded-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => selectEvent(null)}
            className="w-full text-center py-1.5 text-[8.5px] tracking-wider font-bold text-gray-500 bg-black/40 border border-[#1a3a1a] hover:text-white hover:bg-black/60 rounded"
          >
            DISMISS COGNIZANT ENVELOPE
          </button>
        </div>
      )}
    </div>
  );
}
