import React, { useMemo, useState, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { useLinkedAnalysisStore } from '../../store/linkedAnalysisStore';
import { parseGlobalEvent } from '../../utils/eventConverter';
import { audio } from '../../utils/audio';
import { useCopilotStore, CopilotCategory, AssistanceLevel } from '../../store/copilotStore';
import { usePlayerStore } from '../../store/playerStore';

export default function AnalysisInspector() {
  const countries = useWorldStore((s) => s.countries);
  const globalEventLog = useWorldStore((s) => s.globalEventLog);
  const currentTick = useWorldStore((s) => s.currentTick);

  const {
    selectedCountryId,
    selectedEdge,
    selectedEventId,
    selectCountry,
    selectEdge,
    selectEvent,
    savedInvestigations,
    saveInvestigation,
    loadInvestigation,
    deleteInvestigation,
    renameInvestigation,
  } = useLinkedAnalysisStore();

  const {
    assistanceLevel,
    activeInsights,
    activeInsightId,
    activePipeline,
    setAssistanceLevel,
    setActiveInsightId,
    runAnalysis,
    triggerPipeline,
  } = useCopilotStore();

  const [inspectorTab, setInspectorTab] = useState<'INSPECT' | 'COPILOT'>('COPILOT');
  const [newInvName, setNewInvName] = useState('');
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [editingInvName, setEditingInvName] = useState('');

  // Dynamically run heuristics on player and time tick events
  useEffect(() => {
    runAnalysis();
  }, [currentTick, runAnalysis]);

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

    // Dynamic relationship metrics derived from real state
    let hostilityStr = 'MODERATE';
    let dependencyStr = 'INDEPENDENT';
    
    if (srcCountry && tgtCountry) {
      const srcOpinion = srcCountry.opinions[selectedEdge.target] ?? 50;
      const tgtOpinion = tgtCountry.opinions[selectedEdge.source] ?? 50;
      const avgOpinion = (srcOpinion + tgtOpinion) / 2;
      
      if (avgOpinion < 20) hostilityStr = 'CRITICAL / WAR STATE';
      else if (avgOpinion < 45) hostilityStr = 'HIGH SECTOR TENSION';
      else if (avgOpinion > 70) hostilityStr = 'SECURED AMITY';
      
      const isTradePartner = srcCountry.tradePartners.includes(selectedEdge.target) || tgtCountry.tradePartners.includes(selectedEdge.source);
      dependencyStr = isTradePartner ? 'INTENSE DEEP MERCHANDISE LINK' : 'ISOLATED/RESTRICTIVE';
    }

    return {
      src: srcCountry ? { id: selectedEdge.source, name: srcCountry.name, flag: srcCountry.flagEmoji, ideology: srcCountry.political.ideology } : null,
      tgt: tgtCountry ? { id: selectedEdge.target, name: tgtCountry.name, flag: tgtCountry.flagEmoji, ideology: tgtCountry.political.ideology } : null,
      type: selectedEdge.type,
      mutualEvents,
      hostilityStr,
      dependencyStr,
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

  // Save current analytical state
  const handleSaveInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;
    saveInvestigation(newInvName.trim());
    setNewInvName('');
    audio.sfxKeyClick();
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingInvId(id);
    setEditingInvName(name);
    audio.sfxKeyClick();
  };

  const handleApplyRename = (id: string) => {
    if (editingInvName.trim()) {
      renameInvestigation(id, editingInvName.trim());
    }
    setEditingInvId(null);
    audio.sfxKeyClick();
  };

  return (
    <div className="w-full h-full bg-[#030603] border border-[#1a5c1a] rounded p-3 text-white font-mono text-[11px] overflow-y-auto space-y-4 flex flex-col justify-between scrollbar-thin" style={{ maxHeight: '100%' }}>
      <div className="space-y-4">
        {/* Dual Tab Router Row */}
        <div className="grid grid-cols-2 gap-1 bg-[#010401] p-1 border border-[#1a5c1a]/40 rounded-sm select-none">
          <button
            onClick={() => { audio.sfxKeyClick(); setInspectorTab('COPILOT'); }}
            className={`py-1 text-[9px] font-black uppercase text-center cursor-pointer transition-all rounded-[1px] ${
              inspectorTab === 'COPILOT'
                ? 'bg-[#153a15] text-[#00ff44] border border-[#00ff44]/70'
                : 'bg-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            📡 Operations AI
          </button>
          <button
            onClick={() => { audio.sfxKeyClick(); setInspectorTab('INSPECT'); }}
            className={`py-1 text-[9px] font-black uppercase text-center cursor-pointer transition-all rounded-[1px] ${
              inspectorTab === 'INSPECT'
                ? 'bg-[#153a15] text-[#00ff44] border border-[#00ff44]/70'
                : 'bg-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            📋 Inspect Deck
          </button>
        </div>

        {/* TAB 1: OPERATIONS AI COPILOT DETECTOR ENGINE */}
        {inspectorTab === 'COPILOT' && (
          <div className="space-y-3 animate-fade-in">
            {/* Status indicators */}
            <div className="p-2 bg-[#061206] border border-[#1a5c1a] rounded-sm space-y-1">
              <div className="flex justify-between items-center text-[8.5px] uppercase font-bold text-gray-400 font-sans">
                <span>SYSTEM SIG-COPILOT STATUS:</span>
                <span className="text-[#00ff44] animate-pulse">● ACTIVE SCAN</span>
              </div>
              <p className="text-[7.5px] text-gray-500 uppercase leading-snug">
                Heuristic detectors scanning regional vectors for trade stresses, nuclear doctrines, and border alliances.
              </p>
            </div>

            {/* Assistance level setup */}
            <div className="space-y-1">
              <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider block">ADVISORY INTENSITY PROFILE:</span>
              <div className="grid grid-cols-3 gap-0.5 bg-black/40 p-0.5 border border-green-950 rounded-sm">
                {(['MINIMAL', 'ASSIST', 'FULL'] as AssistanceLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => { audio.sfxKeyClick(); setAssistanceLevel(lvl); }}
                    className={`py-0.5 text-[7.5px] uppercase font-extrabold cursor-pointer transition-all rounded-[1px] ${
                      assistanceLevel === lvl
                        ? 'bg-[#00e5ff]/20 text-[#00e5ff] font-bold border border-[#00e5ff]/50'
                        : 'text-gray-550 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Suggestion Pipelines Trigger Board */}
            <div className="space-y-1">
              <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider block">PRESETS DIAGNOSIS SWEEP:</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => triggerPipeline('FLASHPOINT')}
                  className={`p-1 border text-[7.5px] uppercase font-black cursor-pointer rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-center leading-none ${
                    activePipeline === 'FLASHPOINT'
                      ? 'bg-red-955/45 text-red-500 border-red-500 shadow-[0_0_4px_rgba(239,68,68,0.25)]'
                      : 'bg-black/35 border-red-955/40 text-red-400 hover:bg-red-900/10'
                  }`}
                  title="Detect active warfront boundaries and flashpoint vectors"
                >
                  <span className="text-sm">🔥</span>
                  <span className="truncate w-full block">FLASHPOINT</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPipeline('CHOKEPOINT')}
                  className={`p-1 border text-[7.5px] uppercase font-black cursor-pointer rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-center leading-none ${
                    activePipeline === 'CHOKEPOINT'
                      ? 'bg-amber-955/45 text-amber-500 border-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.25)]'
                      : 'bg-black/35 border-amber-955/40 text-amber-400 hover:bg-amber-900/10'
                  }`}
                  title="Detect critical trade reliance choke points and supply disruptions"
                >
                  <span className="text-sm">⚓</span>
                  <span className="truncate w-full block">CHOKEPOINT</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPipeline('ALLIANCE')}
                  className={`p-1 border text-[7.5px] uppercase font-black cursor-pointer rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-center leading-none ${
                    activePipeline === 'ALLIANCE'
                      ? 'bg-cyan-950/45 text-cyan-400 border-cyan-500 shadow-[0_0_4px_rgba(6,182,212,0.25)]'
                      : 'bg-black/35 border-cyan-950/45 text-cyan-400 hover:bg-cyan-900/10'
                  }`}
                  title="Find internal friction and low opinions between treaty allies"
                >
                  <span className="text-sm">💔</span>
                  <span className="truncate w-full block">ALLIANCES</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPipeline('CORRIDOR')}
                  className={`p-1 border text-[7.5px] uppercase font-black cursor-pointer rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-center leading-none ${
                    activePipeline === 'CORRIDOR'
                      ? 'bg-purple-950/45 text-purple-400 border-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.25)]'
                      : 'bg-black/35 border-purple-950/45 text-purple-400 hover:bg-purple-900/10'
                  }`}
                  title="Examine high-degree hazard hubs and battleground corridors"
                >
                  <span className="text-sm">⚡</span>
                  <span className="truncate w-full block">CORRIDORS</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPipeline('SANCTION')}
                  className={`p-1 border text-[7.5px] uppercase font-black cursor-pointer rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all text-center leading-none ${
                    activePipeline === 'SANCTION'
                      ? 'bg-orange-950/45 text-orange-400 border-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.25)]'
                      : 'bg-black/35 border-orange-950/45 text-orange-400 hover:bg-[#7c2d12]/10'
                  }`}
                  title="Track strict embargos and debt stress isolation chains"
                >
                  <span className="text-sm">⛓️</span>
                  <span className="truncate w-full block">SANCTIONS</span>
                </button>

                <button
                  type="button"
                  onClick={() => { audio.sfxKeyClick(); triggerPipeline(null); }}
                  className="p-1 border border-zinc-800 bg-black/40 text-gray-500 text-[7.5px] uppercase font-black cursor-pointer rounded-sm hover:text-white hover:border-zinc-500 flex items-center justify-center leading-none"
                  title="Clear active scans and filters"
                >
                  <span>✕ RESET</span>
                </button>
              </div>
            </div>

            {/* AI Advisor Diagnosis Insights Grid */}
            <div className="space-y-1.5 flex-1 select-none">
              <div className="flex justify-between items-center text-[7.5px] text-gray-550 font-bold uppercase tracking-wider font-sans">
                <span>DETECTED SECURITY THREATS ({activeInsights.length}):</span>
                <span className="text-[#00ff44]">CONFIDENCE MATRIX</span>
              </div>

              {activeInsights.length === 0 ? (
                <div className="text-[9px] text-gray-500 italic bg-black/15 py-5 px-3 rounded-sm border border-dashed border-[#1a5c1a]/25 text-center uppercase leading-snug">
                  🤖 SCANNERS NOMINAL. NO EXCEEDING ANOMALIES RECORDED FOR CURRENT ADVISOR GRADE.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin pr-0.5">
                  {activeInsights.map((ins) => {
                    const isFocused = activeInsightId === ins.id;
                    const sevColor = ins.severity === 'HIGH' ? 'text-red-500 font-extrabold' : 'text-amber-500 font-extrabold';

                    return (
                      <div
                        key={ins.id}
                        id={ins.id}
                        onClick={() => setActiveInsightId(isFocused ? null : ins.id)}
                        className={`p-2 border rounded-sm transition-all text-[9.5px] space-y-1.5 cursor-pointer flex flex-col hover:bg-[#071307]/20 ${
                          isFocused 
                            ? 'bg-[#0f1d0f]/50 border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.1)]' 
                            : 'bg-black/35 border-green-950/60'
                        }`}
                      >
                        {/* Title and indicators */}
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-extrabold text-white uppercase tracking-tight flex-1 text-[9px] leading-tight">
                            {ins.title}
                          </span>
                          <div className="text-[7.5px] shrink-0 font-bold flex flex-col items-end">
                            <span className={sevColor}>{ins.severity} ALERT</span>
                            <span className="text-cyan-400 mt-0.5 font-sans">Certainty: {ins.confidence}%</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[9px] text-gray-400 font-sans leading-relaxed">
                          {ins.description}
                        </p>

                        {/* Explainable Diagnostic Breakdown */}
                        {isFocused && (
                          <div className="p-1.5 bg-[#020502] border border-green-950 rounded-sm text-[8px] font-mono leading-normal text-left space-y-1.5 animate-slide-up select-none">
                            <div>
                              <span className="text-gray-550 block font-bold uppercase tracking-wide">factors / signal source:</span>
                              <p className="text-gray-300 leading-none mt-0.5">{ins.whySurfaced}</p>
                            </div>
                            <div>
                              <span className="text-gray-550 block font-bold uppercase tracking-wide">operational vectors:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5 leading-none">
                                {ins.signalsUsed.map((sig, sidx) => (
                                  <span key={sidx} className="bg-black text-[#00ff44] px-1 border border-[#113111]/40 rounded-[1px] text-[7px] uppercase font-bold text-sans">
                                    {sig}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-555 block font-bold uppercase tracking-wide">potential consequence:</span>
                              <p className="text-red-400 mt-0.5 leading-tight">{ins.potentialConsequence}</p>
                            </div>

                            {/* Tactical Command Action Row */}
                            <div className="border-t border-[#113111]/60 pt-1.5 mt-1 grid grid-cols-2 gap-1 font-sans">
                              {/* Action A: Bind map centroids and pulse scanning circles */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  audio.playPhaseReveal();
                                  
                                  const analysisStore = useLinkedAnalysisStore.getState();
                                  analysisStore.setAnalysisMode(ins.recommendedView.analysisMode);
                                  analysisStore.setPresetFocusMode(ins.recommendedView.presetFocusMode);
                                  
                                  if (ins.entities.countries.length > 0) {
                                    analysisStore.selectCountry(ins.entities.countries[0]);
                                  }
                                }}
                                className="py-1 px-1 bg-[#1a441a]/40 border border-[#00ff44]/60 text-[#00ff44] hover:bg-[#00ff44]/20 rounded-sm text-[7.5px] uppercase font-bold text-center cursor-pointer transition-all"
                              >
                                🗺️ Focus World
                              </button>

                              {/* Action B: Bind and focus relation graph parameters */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  audio.playPhaseReveal();

                                  const analysisStore = useLinkedAnalysisStore.getState();
                                  analysisStore.setAnalysisMode('GRAPH');
                                  analysisStore.setPresetFocusMode(ins.recommendedView.presetFocusMode);
                                  
                                  if (ins.entities.edges.length > 0) {
                                    analysisStore.selectEdge(ins.entities.edges[0]);
                                  } else if (ins.entities.countries.length > 0) {
                                    analysisStore.selectCountry(ins.entities.countries[0]);
                                  }
                                }}
                                className="py-1 px-1 bg-[#0f2430] border border-[#00d5ff]/60 text-[#00e5ff] hover:bg-[#00e5ff]/20 rounded-sm text-[7.5px] uppercase font-bold text-center cursor-pointer transition-all"
                              >
                                🕸️ Trace corridor
                              </button>

                              {/* Action C: Open specific interactive HUD Tab inside command center */}
                              {ins.recommendedView.targetTab && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    audio.sfxKeyClick();
                                    usePlayerStore.getState().setActiveTab(ins.recommendedView.targetTab!);
                                  }}
                                  className="py-1 px-1 bg-[#37240c]/45 border border-[#ffb300]/60 text-[#ffb000] hover:bg-[#ffb000]/20 rounded-sm text-[7.5px] uppercase font-bold text-center col-span-2 mt-0.5 cursor-pointer transition-all"
                                >
                                  🚨 Activate {ins.recommendedView.targetTab === 3 ? 'War Room Arsenal' : ins.recommendedView.targetTab === 2 ? 'Central Bank vault' : ins.recommendedView.targetTab === 4 ? 'Diplomatic Desk' : 'Intelligence Panel'}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED WORKSPACE INSPECTOR SELECTIONS */}
        {inspectorTab === 'INSPECT' && (
          <div className="space-y-4">
            {/* Dynamic Title / State Badge */}
            <div className="text-[10px] text-[#00ff44] bg-[#071307] border border-[#113111] px-2 py-1.5 rounded-[1.5px] font-bold flex justify-between items-center uppercase tracking-wider select-none leading-none">
              <span>📋 Workspace Inspector</span>
              <span className="text-gray-500 text-[8px] animate-pulse">Scanning Transducers...</span>
            </div>

        {/* CASE A: No selection */}
        {!countryData && !edgeData && !eventData && (
          <div className="flex flex-col items-center justify-center text-center py-7 px-4 space-y-3 border border-dashed border-[#1a5c1a]/35 rounded bg-black/10 select-none">
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
          <div className="space-y-3 animate-fade-in">
            {/* Flag section */}
            <div className="flex items-center gap-2.5 p-2 bg-[#061206] border border-[#1a5c1a] rounded-sm">
              <span className="text-2xl leading-none">{countryData.raw.flagEmoji}</span>
              <div className="flex-1">
                <h2 className="text-[12px] font-extrabold tracking-widest text-[#00ff44] uppercase leading-none">
                  {countryData.raw.name}
                </h2>
                <p className="text-[8px] text-gray-500 uppercase font-semibold mt-1 tracking-wider">
                  CODENAME INTERCEPT: {selectedCountryId} | BLOC: {countryData.raw.allianceBlock}
                </p>
              </div>
              <button
                onClick={() => { audio.sfxKeyClick(); selectCountry(null); }}
                className="text-gray-500 hover:text-white text-[9px] font-extrabold border border-[#1a3a1a] px-1.5 py-0.5 bg-black/40 cursor-pointer"
              >
                CLEAR
              </button>
            </div>

            {/* Stats sheet */}
            <div className="space-y-1.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">KEY TELEMETRY STATS:</span>
              <div className="grid grid-cols-2 gap-1 bg-black/30 p-2 border border-[#1a3a1a]/50 rounded-sm">
                <div className="space-y-0.5">
                  <span className="text-[7.5px] text-gray-550 block uppercase font-bold">REGIONAL TREASURY:</span>
                  <span className="text-[#00ff44] text-[10px] font-bold">
                    ${countryData.raw.economic.treasuryCashB?.toFixed(2)}B
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7.5px] text-gray-550 block uppercase font-bold">GROSS DOMESTIC PRODUCT:</span>
                  <span className="text-[#ffb000] text-[10px] font-bold">
                    ${countryData.raw.economic.gdpB?.toFixed(1)}B
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7.5px] text-gray-550 block uppercase font-bold">NUCLEAR CAPABLE:</span>
                  <span className={`text-[10px] font-bold ${countryData.raw.arsenal.nuclearCapable ? 'text-red-500' : 'text-gray-500'}`}>
                    {countryData.raw.arsenal.nuclearCapable ? 'MUTUAL WARHEADS' : 'NON-WARHEADS'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7.5px] text-gray-550 block uppercase font-bold">MILITARY POWER INDEX:</span>
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
                <span className="font-extrabold text-[#00ff44]">{countryData.raw.political.stabilityIndex}%</span>
              </div>
            </div>

            {/* Alliances map */}
            <div className="space-y-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider font-sans">SECURE ALLIES ({countryData.allies.length}):</span>
              {countryData.allies.length === 0 ? (
                <div className="text-[9px] text-gray-650 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/20 uppercase">
                  Isolated / Sovereign Neutral
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 font-sans">
                  {countryData.allies.map((ally) => (
                    <button
                      key={ally.id}
                      onClick={() => { audio.sfxKeyClick(); selectCountry(ally.id); }}
                      className="flex items-center gap-1.5 p-1 border border-[#1a3a1a]/50 bg-black/20 hover:bg-[#0c180c] transition-all text-[9.5px] rounded-sm text-left truncate cursor-pointer"
                    >
                      <span>{ally.flag}</span>
                      <span className="truncate text-white/90 hover:text-[#00ff44] transition-colors">{ally.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* War Fronts */}
            <div className="space-y-1">
              <span className="text-[8px] text-red-500 font-bold uppercase block tracking-wider">KINETIC WARS ACTIVE:</span>
              {!countryData.raw.atWarWith || countryData.raw.atWarWith.length === 0 ? (
                <div className="text-[9px] text-[#00ff44] italic bg-black/10 py-1.5 px-2 rounded-sm border border-[#1a5c1a]/20 uppercase select-none">
                  Peace state maintained
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {countryData.raw.atWarWith.map((hostileId) => (
                    <button
                      key={hostileId}
                      onClick={() => { audio.sfxKeyClick(); selectCountry(hostileId); }}
                      className="flex items-center gap-1.5 p-1 border border-red-950/50 bg-red-950/5 hover:bg-red-950/25 transition-all text-[9.5px] rounded-sm text-left truncate text-red-400 font-bold cursor-pointer"
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
                <div className="text-[9px] text-gray-650 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/20 uppercase">
                  Quiet sector. No immediate trace waves
                </div>
              ) : (
                <div className="space-y-1">
                  {countryData.recent.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => { audio.sfxKeyClick(); selectEvent(evt.id); }}
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

        {/* CASE C: Edge / Relationship selected */}
        {edgeData && (
          <div className="space-y-3 animate-fade-in">
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
                  onClick={() => { audio.sfxKeyClick(); selectCountry(edgeData.src!.id); }}
                  className="text-center p-2 border border-[#1a3a1a] hover:border-[#00ff44]/70 bg-black/30 hover:bg-[#071307] rounded-sm transition-all text-[10px] cursor-pointer"
                >
                  <span className="text-xl block mb-0.5 leading-none">{edgeData.src.flag}</span>
                  <span className="font-extrabold text-white block uppercase truncate">{edgeData.src.name}</span>
                  <span className="text-[8px] text-gray-500 uppercase block tracking-wider">{edgeData.src.ideology}</span>
                </button>
              ) : (
                <div className="text-center text-gray-600 text-[9px] select-none">SOURCE DETACHED</div>
              )}

              {/* Target */}
              {edgeData.tgt ? (
                <button
                  onClick={() => { audio.sfxKeyClick(); selectCountry(edgeData.tgt!.id); }}
                  className="text-center p-2 border border-[#1a3a1a] hover:border-[#00ff44]/70 bg-black/30 hover:bg-[#071307] rounded-sm transition-all text-[10px] cursor-pointer"
                >
                  <span className="text-xl block mb-0.5 leading-none">{edgeData.tgt.flag}</span>
                  <span className="font-extrabold text-white block uppercase truncate">{edgeData.tgt.name}</span>
                  <span className="text-[8px] text-gray-500 uppercase block tracking-wider">{edgeData.tgt.ideology}</span>
                </button>
              ) : (
                <div className="text-center text-gray-600 text-[9px] select-none">TARGET DETACHED</div>
              )}
            </div>

            {/* Relationship Metrics & Geographic context */}
            <div className="space-y-1.5">
              <span className="text-[8px] text-gray-500 font-bold uppercase block tracking-wider">TIE PROFILE DETAILS:</span>
              <div className="bg-[#020502] border border-[#122812] p-2 rounded-sm text-[10px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[8.5px] font-bold uppercase">HOSTILITY STATE VALUE:</span>
                  <span className="font-bold text-[#ff2244]">{edgeData.hostilityStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[8.5px] font-bold uppercase">DEPENDENCY LEVEL:</span>
                  <span className="font-bold text-cyan-400">{edgeData.dependencyStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[8.5px] font-bold uppercase">GEOGRAPHICAL THEATER:</span>
                  <span className="font-bold text-[#ffb000]">TRANS-CONTINENTAL INTERALIGNED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[8.5px] font-bold uppercase">CLASSIFICATIVE TYPE:</span>
                  <span className={`font-black tracking-widest ${
                    edgeData.type === 'WAR' ? 'text-red-500 font-extrabold' :
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
                <div className="text-[9px] text-gray-650 italic bg-black/10 py-1.5 px-2 rounded-sm border border-dashed border-[#1a5c1a]/25 uppercase">
                  No direct exchange events recorded
                </div>
              ) : (
                <div className="space-y-1.5">
                  {edgeData.mutualEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => { audio.sfxKeyClick(); selectEvent(evt.id); }}
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
              onClick={() => { audio.sfxKeyClick(); selectEdge(null); }}
              className="w-full text-center py-1.5 text-[8.5px] tracking-wider font-bold text-gray-500 bg-black/40 border border-[#1a3a1a] hover:text-white hover:bg-black/60 rounded cursor-pointer transition-all"
            >
              DISMISS RELATION SPLIT
            </button>
          </div>
        )}

        {/* CASE D: Event selected */}
        {eventData && (
          <div className="space-y-3 animate-fade-in">
            {/* Header */}
            <div className="p-2 border border-red-950 bg-red-950/10 rounded-sm space-y-1 text-sans">
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
                      onClick={() => { audio.sfxKeyClick(); selectCountry(eventData.srcObj!.id); }}
                      className="p-1.5 border border-[#1d331d] bg-[#091509] hover:bg-[#122812] rounded transition-all text-left flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <span>{eventData.srcObj.flag}</span>
                      <span className="truncate text-[9.5px] text-white">{eventData.srcObj.name}</span>
                    </button>
                  ) : (
                    <div className="p-1 px-2 border border-zinc-900 bg-black/20 text-gray-600 text-[9px] rounded uppercase select-none">Global Sector</div>
                  )}

                  {eventData.tgtObj ? (
                    <button
                      onClick={() => { audio.sfxKeyClick(); selectCountry(eventData.tgtObj!.id); }}
                      className="p-1.5 border border-[#301616] bg-[#160a0a] hover:bg-[#281212] rounded transition-all text-left flex items-center gap-1.5 text-red-400 font-bold cursor-pointer"
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
                  eventData.raw.severity === 'CRITICAL' ? 'text-red-500 font-black' :
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
              onClick={() => { audio.sfxKeyClick(); selectEvent(null); }}
              className="w-full text-center py-1.5 text-[8.5px] tracking-wider font-bold text-gray-500 bg-black/40 border border-[#1a3a1a] hover:text-white hover:bg-black/60 rounded cursor-pointer transition-all"
            >
              DISMISS COGNIZANT ENVELOPE
            </button>
          </div>
        )}
      </div>
    )}
  </div>

      {/* WORKSPACE SAVED INVESTIGATIONS CONTEXT MATRIX */}
      <div className="border-t border-[#1a5c1a]/30 pt-3 mt-3 space-y-2 select-none">
        <span className="text-[8.5px] text-[#00ff44] font-black uppercase tracking-widest flex items-center gap-1.5">
          💾 SAVED COGNIZANT CONTEXTS DIRECTORY
        </span>

        {/* Save current state container */}
        <form onSubmit={handleSaveInvestigation} className="flex gap-1.5 items-center bg-black/20 p-1.5 border border-[#1a5c1a]/30 rounded">
          <input
            type="text"
            placeholder="Save current coordinates as..."
            value={newInvName}
            onChange={(e) => setNewInvName(e.target.value)}
            className="flex-1 bg-black border border-green-950 px-2 py-1 text-[9px] rounded text-white outline-none focus:border-[#00ff44]"
          />
          <button
            type="submit"
            className="px-2 py-1 text-[8.5px] bg-[#003c15] border border-[#00ff44] text-[#00ff44] rounded hover:bg-[#005e21] cursor-pointer transition-all font-black uppercase"
          >
            Record
          </button>
        </form>

        {/* Directory Items List */}
        <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
          {savedInvestigations.length === 0 ? (
            <div className="text-[8px] text-gray-600 italic py-2 text-center uppercase">
              Operational directory empty. Record a trace to persist.
            </div>
          ) : (
            savedInvestigations.map((inv) => {
              const isEditing = editingInvId === inv.id;
              
              // Compute dynamic counts or visual elements representation depending on saved payload
              const detailsText = inv.selectedCountryId 
                ? `Node: ${inv.selectedCountryId} | Preset: ${inv.presetFocusMode}` 
                : inv.selectedEdge 
                ? `Link: ${inv.selectedEdge.source}-${inv.selectedEdge.target} (${inv.selectedEdge.type})`
                : `General Overview | Preset: ${inv.presetFocusMode}`;

              return (
                <div key={inv.id} className="p-1.5 bg-black/40 hover:bg-[#071307]/30 border border-[#0d210d] rounded flex flex-col gap-1 transition-all">
                  <div className="flex justify-between items-center gap-1">
                    {isEditing ? (
                      <div className="flex gap-1 flex-1">
                        <input
                          type="text"
                          value={editingInvName}
                          onChange={(e) => setEditingInvName(e.target.value)}
                          className="bg-black border border-green-800 text-[8.5px] px-1.5 py-0.5 rounded text-white outline-none flex-1 font-mono uppercase"
                          autoFocus
                        />
                        <button
                          onClick={() => handleApplyRename(inv.id)}
                          className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 text-[7px] rounded uppercase cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0" onClick={() => { audio.sfxKeyClick(); loadInvestigation(inv.id); }}>
                        <span className="text-[9px] font-bold text-gray-200 hover:text-[#00ff44] cursor-pointer transition-colors block truncate uppercase">
                          📂 {inv.name}
                        </span>
                        <span className="text-[7.5px] text-gray-500 block truncate">{detailsText}</span>
                      </div>
                    )}

                    <div className="flex gap-1 text-[7.5px] shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => handleStartRename(inv.id, inv.name)}
                          className="hover:text-cyan-400 text-gray-500 cursor-pointer text-[7.5px]"
                        >
                          [RENAME]
                        </button>
                      )}
                      <button
                        onClick={() => { audio.sfxKeyClick(); deleteInvestigation(inv.id); }}
                        className="hover:text-red-500 text-gray-600 cursor-pointer text-[7.5px]"
                      >
                        [✕]
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
