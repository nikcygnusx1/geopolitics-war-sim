import React, { useState, useEffect } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useEconomyStore } from '../../store/economyStore';
import { useTreatyStore } from '../../store/treatyStore';
import { useUIStore } from '../../store/uiStore';
import GlowSlider from '../shared/GlowSlider';
import { audio } from '../../utils/audio';
import { RichTreatyState, TreatyObligation, TreatyConcessionItem } from '../../types/treaty';
import { 
  Globe, 
  BookOpen, 
  ShieldAlert, 
  Scale, 
  Trash2, 
  Send, 
  AlertTriangle, 
  HeartHandshake, 
  ShieldCheck, 
  Activity, 
  FileText, 
  ChevronRight, 
  RefreshCw, 
  Clock, 
  TrendingDown, 
  Fingerprint, 
  Lock, 
  Unlock,
  Award,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function DiplomacyPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);
  const currentTick = useWorldStore((s) => s.currentTick);
  
  // Safe-guard: select the stable treatiesById reference and memoize Object.values to prevent infinite render loops under React 18 / Zustand getSnapshot rules.
  const treatiesById = useWorldStore((s) => s.world?.treatiesById);
  const activeTreaties = React.useMemo(() => (treatiesById ? Object.values(treatiesById) : []), [treatiesById]);

  const playerCountry = countries[countryId];

  // Initialize Treaty Store
  useEffect(() => {
    useTreatyStore.getState().initializeTreatyStore();
  }, []);

  const credibilityMemories = useTreatyStore((s) => s.credibilityMemories);
  const negotiationSessions = useTreatyStore((s) => s.negotiationSessions);
  const activeSessionId = useTreatyStore((s) => s.activeSessionId);
  const legacyEffects = useTreatyStore((s) => s.legacyEffects);
  const treatyFatigueByCountry = useTreatyStore((s) => s.treatyFatigueByCountry);

  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'DIRECTORY' | 'LEDGER' | 'CHAMBER' | 'CREDIBILITY'>('DIRECTORY');

  const tradeTgtId = selectedTargetId || 'US';
  const targetC = countries[tradeTgtId];

  // Forms for bilateral tools
  const [tarValue, setTarValue] = useState(playerCountry?.tariffs?.[tradeTgtId] ?? 0);
  const [aidAmount, setAidAmount] = useState(5.0);

  // Selected treaty for breach/violation menu
  const [selectedViolationTreatyId, setSelectedViolationTreatyId] = useState<string | null>(null);
  const [selectedViolationClauseId, setSelectedViolationClauseId] = useState<string>('');
  const [selectedBreachType, setSelectedBreachType] = useState<string>('TECHNICAL_NON_COMPLIANCE');

  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Country data not loaded.</div>;

  const handleAdjustTariff = (val: number) => {
    setTarValue(val);
    updateCountry(countryId, (draft) => {
      if (!draft.tariffs) draft.tariffs = {};
      draft.tariffs[tradeTgtId] = val;
    });
  };

  const handleDispatchAid = (aidType: 'HUMANITARIAN' | 'ECONOMIC' | 'MILITARY') => {
    audio.sfxKeyClick();
    if (playerCountry.economic.treasuryCashB < aidAmount) {
      useUIStore.getState().pushAlert({
        title: 'RESERVES OVERFLOW',
        message: `Debit warning: Aid allocation ($${aidAmount}B) exceeds current sovereign cash reserves ($${playerCountry.economic.treasuryCashB.toFixed(1)}B).`,
        type: 'DANGER'
      });
      return;
    }

    usePlayerStore.setState((state) => ({ cashB: state.cashB - aidAmount }));
    usePlayerStore.getState().syncCashToCountry();

    updateCountry(tradeTgtId, (draft) => {
      draft.economic.treasuryCashB += aidAmount;
      draft.opinions[countryId] = Math.min(100, (draft.opinions[countryId] ?? 0) + (aidAmount * 3));
    });

    useWorldStore.getState().registerConsequenceChain('DISPATCH_FOREIGN_AID', { sourceCountryId: countryId, targetCountryId: tradeTgtId, aidAmount });
    useWorldStore.getState().addGlobalEvent(`State Ministry: Sent $${aidAmount}B in direct ${aidType} aid to ${tradeTgtId}.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'FOREIGN AID DISPATCHED',
      message: `Successfully transferred an official $${aidAmount}B ${aidType} aid package to targeted [${tradeTgtId}] accounts. Opinion rating upgraded.`,
      type: 'INFO'
    });
  };

  const handleImposeBlockade = () => {
    audio.sfxKeyClick();
    useEconomyStore.getState().imposeSanction(countryId, tradeTgtId);
    useWorldStore.getState().addGlobalEvent(`BLOCKADE DECREE: Placed aggregate sanctions on ${tradeTgtId}.`, 'WARNING');
    
    useUIStore.getState().pushAlert({
      title: 'SOVEREIGN BLOC SANCTIONS IMPOSED',
      message: `Enforced total trade embargo parameters regarding imports or technology transfers against target [${tradeTgtId}].`,
      type: 'WARNING'
    });
  };

  const handleQuickInitiateNegotiation = (type: string) => {
    audio.sfxKeyClick();
    const sessionId = useTreatyStore.getState().startNegotiationSession(countryId, tradeTgtId, type);
    setActiveSubTab('CHAMBER');
    useUIStore.getState().pushAlert({
      title: 'CHAMBER CONVENED',
      message: `Secured custom negotiation track with ${tradeTgtId} regarding ${type.replace('_', ' ')} Treaty parameters.`,
      type: 'INFO'
    });
  };

  const activeSessionInstance = activeSessionId ? negotiationSessions[activeSessionId] : null;

  return (
    <PanelFxShell panelId="diplomacy" relevantFxTypes={['CEASEFIRE_SIGNED','PEACE_TREATY_RATIFIED','WAR_DECLARED','ALLIANCE_FORMED','ALLIANCE_BROKEN','UN_RESOLUTION_PASSED','UN_VETO_CAST']}>
      <div className="w-full text-xs font-mono flex flex-col gap-4">
      {/* Sovereign Panel Tabs */}
      <div className="flex border-b border-[#1a3a1a] bg-[#020502] p-1 gap-1 items-center rounded shadow">
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('DIRECTORY'); }}
          className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider text-[10px] flex items-center gap-1.5 ${
            activeSubTab === 'DIRECTORY' ? 'bg-[#102d11] text-[#00ff44] border-b border-[#00ff44]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Sovereign Directory
        </button>

        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('LEDGER'); }}
          className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider text-[10px] flex items-center gap-1.5 ${
            activeSubTab === 'LEDGER' ? 'bg-[#102d11] text-[#00ff44] border-b border-[#00ff44]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Treaty Ledger
          {activeTreaties.length > 0 && (
            <span className="bg-[#00ff44] text-black rounded-full px-1 text-[8px] font-bold">{activeTreaties.length}</span>
          )}
        </button>

        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('CHAMBER'); }}
          className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider text-[10px] flex items-center gap-1.5 ${
            activeSubTab === 'CHAMBER' ? 'bg-[#102d11] text-[#00ff44] border-b border-[#00ff44]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          Negotiation Chamber
          {activeSessionId && (
            <span className="bg-amber-500 text-black rounded-full px-1 text-[8px] font-bold">1</span>
          )}
        </button>

        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('CREDIBILITY'); }}
          className={`px-3 py-1.5 font-bold uppercase transition-all tracking-wider text-[10px] flex items-center gap-1.5 ${
            activeSubTab === 'CREDIBILITY' ? 'bg-[#102d11] text-[#00ff44] border-b border-[#00ff44]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5" />
          Credibility Dossiers
        </button>
      </div>

      {/* --- TAB 1: SOVEREIGN DIRECTORY --- */}
      {activeSubTab === 'DIRECTORY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* List of countries */}
          <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1 flex justify-between items-center">
              <span>Sovereign Diplomatic Map Roster</span>
              <span className="text-gray-500 text-[8px]">TOTAL: {Object.keys(countries).length - 1} SHIFT-STATIONS</span>
            </h3>

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
              {Object.keys(countries)
                .filter((id) => id !== countryId)
                .map((id) => {
                  const c = countries[id];
                  const isSelected = id === tradeTgtId;
                  const op = c.opinions[countryId] ?? 50;
                  const cred = credibilityMemories[id]?.overallScore ?? 'N/A';
                  const fatigue = treatyFatigueByCountry[id] ?? 10;

                  return (
                    <div
                      key={id}
                      onClick={() => {
                        audio.sfxKeyClick();
                        setTargetCountry(id);
                        setTarValue(playerCountry.tariffs?.[id] ?? 0);
                        useUIStore.getState().setCountryInspector(id);
                      }}
                      className={`border p-2 rounded flex justify-between items-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#00ff44] bg-[#0c1f0d] shadow-[0_0_8px_rgba(0,255,68,0.15)]'
                          : 'border-[#0d1f0d] bg-[#030503] hover:border-green-800'
                      }`}
                    >
                      <div className="font-mono">
                        <span className="mr-1.5">{c.flagEmoji}</span>
                        <span className="font-bold text-[#00e5ff]">{id}</span>
                        <span className="text-[9px] text-gray-550 ml-2 uppercase">
                          BLOCK: <span className="text-gray-400 font-bold">{c.allianceBlock}</span>
                        </span>
                        <span className="text-[8.5px] italic text-rose-500 ml-2">
                          Fatigue: {fatigue}%
                        </span>
                      </div>

                      <div className="font-mono text-right flex items-center gap-3">
                        <div className="text-[9px]">
                          <span className="text-gray-500 mr-1 uppercase">Credibility:</span>
                          <span className="font-bold text-teal-400">{cred}%</span>
                        </div>
                        <div className="text-[9px]">
                          <span className="text-gray-500 mr-1 uppercase">Opinion:</span>
                          <span className={op > 60 ? 'text-[#00ff44] font-bold' : op < 40 ? 'text-[#ff2244] font-bold' : 'text-[#ffb300]'}>
                            {Math.round(op)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Selected target controls */}
          <div className="flex flex-col gap-4">
            {targetC ? (
              <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-md">
                <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]">
                  Bilateral Commands: {targetC.name} {targetC.flagEmoji}
                </h3>

                {/* General info */}
                <div className="grid grid-cols-2 text-[10.1px] uppercase font-mono opacity-80 gap-1.5 border-b border-[#0d1f0d] pb-2">
                  <div>Sovereign GDP: <span className="text-[#00ff44] font-bold">${targetC.economic.gdpB.toFixed(1)}B</span></div>
                  <div>Arrest Stockpiles: <span className="text-amber-500 font-bold">{targetC.arsenal.totalPowerRating} RAT</span></div>
                  <div>Domestic stability: <span className="text-[#00e5ff] font-bold">{Math.round(targetC.political.stabilityIndex)}%</span></div>
                  <div>Ideology core: <span className="text-pink-500 font-bold">{targetC.political.ideology}</span></div>
                </div>

                {/* Custom Tariff slider */}
                <GlowSlider
                  label={`Custom Tariffs on ${tradeTgtId} Imports`}
                  value={tarValue}
                  min={0}
                  max={50}
                  onChange={handleAdjustTariff}
                  unit="%"
                  color="cyan"
                />

                {/* Direct aid inputs */}
                <div className="flex justify-between items-center text-[10.5px] mt-1 gap-2">
                  <span className="shrink-0 text-gray-500 font-bold uppercase">AID BUNDLE:</span>
                  <div className="flex gap-2 items-center flex-1">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={aidAmount}
                      onChange={(e) => setAidAmount(Math.max(1, parseFloat(e.target.value)))}
                      className="w-16 bg-[#030503] border border-[#1a3a1a] text-[#00ff44] text-[11px] p-1 rounded font-mono outline-none"
                    />
                    <span className="text-gray-500 font-bold">B</span>

                    <button
                      onClick={() => handleDispatchAid('ECONOMIC')}
                      className="px-2.5 py-1 border border-cyan-800 text-cyan-400 font-mono hover:bg-[#002e3b] text-[9px] uppercase cursor-pointer transition-colors"
                    >
                      Dispatch Direct Aid
                    </button>
                  </div>
                </div>

                {/* Pledging and Sanctions Actions */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#0d1f0d]">
                  <button
                    onClick={handleImposeBlockade}
                    className="py-1.5 border border-[#ff2244] text-[#ff2244] hover:bg-[#220002] font-semibold uppercase text-[9px] rounded cursor-pointer transition-colors"
                  >
                    🚫 Blockade/Sanction
                  </button>
                  
                  {/* Quick-start Treaty Draft options */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleQuickInitiateNegotiation('CEASE_FIRE')}
                      className="py-1 px-2 border border-yellow-600 text-yellow-400 hover:bg-[#291e03] font-semibold uppercase text-[8.5px] rounded cursor-pointer transition-all"
                    >
                      🤝 Flag Ceasefire
                    </button>
                    <button
                      onClick={() => handleQuickInitiateNegotiation('TRADE')}
                      className="py-1 px-2 border border-teal-600 text-teal-400 hover:bg-[#021f1c] font-semibold uppercase text-[8.5px] rounded cursor-pointer transition-all"
                    >
                      📊 Corridor Deal
                    </button>
                    <button
                      onClick={() => handleQuickInitiateNegotiation('ALLIANCE')}
                      className="py-1 px-2 border border-green-600 text-[#00ff44] hover:bg-[#021c02] font-semibold uppercase text-[8.5px] rounded cursor-pointer transition-all"
                    >
                      🛡️ Strategic Security
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="combat-panel flex items-center justify-center h-48 font-mono border border-gray-900 bg-black/45 rounded text-gray-600">
                [SELECT SOVEREIGN DIRECTORY TARGET TO COMPILE DIPLOMACY DECK]
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: TREATY LEDGER --- */}
      {activeSubTab === 'LEDGER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* List of active/inactive treaties */}
          <div className="md:col-span-2 flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px] flex justify-between items-center">
              <span>Active Treaty State Ledger</span>
              <span className="text-gray-500 text-[8px]">TICK COUNTER: {currentTick}</span>
            </h3>

            {activeTreaties.length === 0 ? (
              <div className="text-center py-12 text-gray-550 border border-dashed border-gray-950 rounded bg-[#010301] italic uppercase">
                [No bilateral or multilateral treaties are currently registered as active]
              </div>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                {activeTreaties.map((t) => {
                  const rt = t as RichTreatyState;
                  const isSuspended = t.status === 'SUSPENDED';
                  const isTerminated = t.status === 'TERMINATED' || t.status === 'EXPIRED';

                  return (
                    <div 
                      key={t.id} 
                      className={`border p-3.5 rounded bg-[#020302] flex flex-col gap-3 transition-all ${
                        isSuspended ? 'border-amber-700 bg-amber-950/5' : isTerminated ? 'border-gray-900 opacity-60' : 'border-[#1a441a]'
                      }`}
                    >
                      <div className="flex justify-between items-start border-b border-[#0c1f0c] pb-2">
                        <div>
                          <h4 className="font-bold text-[#00ff44] text-[11px] uppercase">{t.name}</h4>
                          <div className="text-[8.5px] text-gray-500 uppercase flex gap-2 mt-0.5">
                            <span>ID: <span className="font-mono text-cyan-400">{t.id}</span></span>
                            <span>TYPE: <span className="font-mono text-yellow-500 font-bold">{t.type}</span></span>
                            <span>STATUS: <span className="font-bold text-[#00e5ff]">{t.status}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-right font-mono text-[9px]">
                          <span className="text-gray-500 uppercase">Expires:</span>
                          <span className="text-[#00e5ff] font-bold">
                            {t.expirationTick !== null ? `Tick ${t.expirationTick}` : 'INDEFINITE'}
                          </span>
                        </div>
                      </div>

                      {/* Summary public text */}
                      <div className="text-gray-400 text-[10px] leading-relaxed italic bg-[#040804] p-2 border border-[#0d1c0d] rounded">
                        <strong>Public Text Summary: </strong>
                        {rt.publicText || 'Standard non-aggression and mutual collaboration assurances compiled by security ministries.'}
                      </div>

                      {/* Obligations line-by-line */}
                      <div>
                        <span className="text-[8.5px] uppercase text-gray-500 font-bold block mb-1">Clause Obligations Details:</span>
                        <div className="space-y-1">
                          {rt.detailedObligations ? (
                            rt.detailedObligations.map((o) => (
                              <div key={o.id} className="bg-[#030603] border border-[#0d1f0d] p-1.5 rounded flex justify-between items-center text-[9.5px]">
                                <div className="flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  <span className="text-gray-200"><strong>{o.category}:</strong> {o.description}</span>
                                </div>
                                <div className="text-right text-gray-500 font-mono text-[8px] uppercase">
                                  SEV: <span className="text-rose-500 font-bold">{o.violationSeverityWeight}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            t.obligations.map((oStr, idx) => (
                              <div key={idx} className="bg-[#030603] border border-[#0d1f0d] p-1.5 rounded text-[9.5px] flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{oStr}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Hidden protocols */}
                      {rt.hiddenProtocols && rt.hiddenProtocols.length > 0 && (
                        <div className="border border-purple-950 bg-purple-950/5 p-2 rounded">
                          <span className="text-[8px] text-purple-400 font-bold uppercase flex items-center gap-1 mb-1">
                            <Lock className="w-3 h-3 text-purple-400" />
                            CLASSIFIED SECRET PROTOCOLS ({rt.hiddenProtocols.length})
                          </span>
                          {rt.hiddenProtocols.map(hp => (
                            <div key={hp.id} className="text-[9.5px] text-purple-200 border-t border-purple-950/40 pt-1 mt-1 font-mono">
                              <strong>{hp.title}: </strong>
                              {hp.exposed ? (
                                <span className="text-rose-400">EXPOSED TO THIRD PARTIES! Actual details leaked: {hp.clauseSummaryPrivate}</span>
                              ) : (
                                <span>{hp.clauseSummaryPrivate} <span className="text-[8px] text-gray-500">(Private Annex Secured)</span></span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Signatories Compliance */}
                      <div className="grid grid-cols-2 gap-3 bg-[#030503] border border-[#0d1f0d] p-2 rounded">
                        {Object.keys(t.complianceByCountry).map((cid) => {
                          const comp = t.complianceByCountry[cid];
                          return (
                            <div key={cid} className="flex justify-between items-center text-[9px]">
                              <span className="text-gray-400 uppercase font-bold">{countries[cid]?.flagEmoji} {cid} compliance:</span>
                              <span className={`font-bold ${comp > 80 ? 'text-[#00ff44]' : comp > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {comp}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action trigger hooks */}
                      <div className="flex gap-2 justify-end mt-1 pt-2 border-t border-[#0c1f0c]/30">
                        {t.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedViolationTreatyId(t.id);
                                // select first clause pre-emptively
                                const cId = rt.detailedObligations?.[0]?.id || 'OB-DEFAULT';
                                setSelectedViolationClauseId(cId);
                              }}
                              className="px-2 py-1 bg-rose-950 border border-rose-800 text-rose-200 hover:bg-rose-900 rounded font-semibold text-[8px] uppercase cursor-pointer"
                            >
                              ⚠️ Stage Breach (Violation Ladder)
                            </button>

                            <button
                              onClick={() => useTreatyStore.getState().terminateTreaty(t.id, 'OPPORTUNISTIC_EXIT')}
                              className="px-2 py-1 bg-[#1c0c0d] border border-red-900 text-red-400 hover:bg-red-950 rounded font-semibold text-[8px] uppercase cursor-pointer"
                            >
                              ❌ Opportunistic Termination
                            </button>
                            <button
                              onClick={() => useTreatyStore.getState().terminateTreaty(t.id, 'HONORABLE_EXIT')}
                              className="px-2 py-1 bg-[#0b1c11] border border-green-800 text-green-300 hover:bg-green-950 rounded font-semibold text-[8px] uppercase cursor-pointer"
                            >
                              📜 Honorable Exit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sider panel: Legacy effects & Active Scars / Violation Ladder Desk */}
          <div className="flex flex-col gap-4">
            {/* Direct Violation Ladder Simulation Tool */}
            {selectedViolationTreatyId && (
              <div className="combat-panel flex flex-col gap-2.5 border border-rose-950 bg-[#050101] p-4 rounded shadow-md">
                <h3 className="font-bold border-b border-rose-900 pb-1.5 uppercase tracking-wider text-rose-500 text-[10px] flex justify-between items-center">
                  <span>Sovereign Violation Ladder</span>
                  <button onClick={() => setSelectedViolationTreatyId(null)} className="text-gray-400 hover:text-white uppercase text-[8px]">
                    Cancel
                  </button>
                </h3>
                
                <div className="text-[10px] text-gray-400 leading-normal mb-1">
                  Instruct core state intelligence networks to deliberately bypass, slow-roll, or break treaty obligations.
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] text-gray-500 font-bold uppercase block">Target Treaty ID:</label>
                  <div className="text-red-300 font-bold bg-rose-950/20 p-2 border border-rose-950 text-[10.5px]">
                    {selectedViolationTreatyId}
                  </div>

                  <label className="text-[8px] text-gray-500 font-bold uppercase block">Triggering Clause Target:</label>
                  <select 
                    value={selectedViolationClauseId} 
                    onChange={(e) => setSelectedViolationClauseId(e.target.value)}
                    className="w-full bg-[#030503] border border-rose-900 text-[#00ff44] text-[10px] p-2 rounded outline-none"
                  >
                    {((useWorldStore.getState().world?.treatiesById[selectedViolationTreatyId] as RichTreatyState)?.detailedObligations || []).map(o => (
                      <option key={o.id} value={o.id}>{o.category}: {o.description.substring(0, 32)}...</option>
                    ))}
                    <option value="OB-GENERIC">Generic Sovereignty Infraction</option>
                  </select>

                  <label className="text-[8px] text-gray-500 font-bold uppercase block">Breach Intensity (Ladder):</label>
                  <select 
                    value={selectedBreachType} 
                    onChange={(e) => setSelectedBreachType(e.target.value)}
                    className="w-full bg-[#030503] border border-rose-900 text-rose-400 text-[10px] p-2 rounded outline-none uppercase font-bold"
                  >
                    <option value="TECHNICAL_NON_COMPLIANCE">Technical slip (Soft reprimand)</option>
                    <option value="DELAYED_COMPLIANCE">Delayed logistics (Moderate friction)</option>
                    <option value="AMBIGUOUS_INTERPRETATION">Opportunistic loop (Dispute stage)</option>
                    <option value="CONCEALED_VIOLATION">Concealed bypass (Covert risk)</option>
                    <option value="INTENTIONAL_BREACH">Direct intentional breach (Retaliation trigger)</option>
                  </select>

                  <button
                    onClick={() => {
                      useTreatyStore.getState().violateTreatyClause(selectedViolationTreatyId, countryId, selectedViolationClauseId, selectedBreachType);
                      setSelectedViolationTreatyId(null);
                    }}
                    className="w-full mt-2 py-2 bg-rose-900 border border-red-500 hover:bg-rose-800 text-white font-bold uppercase text-[9.5px] rounded cursor-pointer"
                  >
                    ☢️ Execute Treaty breach
                  </button>
                </div>
              </div>
            )}

            {/* Legacy scars */}
            <div className="combat-panel flex flex-col gap-2 border border-gray-900 bg-[#020302] p-4 rounded text-xs flex-1">
              <h4 className="font-bold text-[9px] uppercase text-gray-500 tracking-wider">Historical Treaty Scars:</h4>
              {legacyEffects.length === 0 ? (
                <div className="py-6 italic text-gray-600 text-center uppercase">
                  [Clean regulatory history: zero current commitment scars]
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {legacyEffects.map(le => (
                    <div key={le.id} className="p-2 border border-yellow-950 bg-yellow-950/10 rounded">
                      <div className="flex justify-between font-bold text-yellow-500 text-[9.5px]">
                        <span className="uppercase">{le.type}</span>
                        <span className="text-[8px] text-gray-500 font-mono">DUR: {le.durationTicksRemaining}T</span>
                      </div>
                      <div className="text-[8.5px] text-gray-400 mt-1 italic leading-normal">
                        {le.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: NEGOTIATION CHAMBER --- */}
      {activeSubTab === 'CHAMBER' && (
        <div className="border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner flex flex-col gap-4">
          {!activeSessionInstance ? (
            <div className="text-center py-16 text-gray-500 uppercase flex flex-col justify-center items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-yellow-600" />
              <span>[Negotiation chamber vacant: Select a sovereign capital from Directory to host talks]</span>
              <button
                onClick={() => { audio.sfxKeyClick(); setActiveSubTab('DIRECTORY'); }}
                className="mt-2 px-3 py-1.5 border border-[#00ff44] text-[#00ff44] hover:bg-[#021c02] rounded uppercase text-[9.5px]/1"
              >
                Assemble Envoy Directory
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Draft terms and concessions details */}
              <div className="md:col-span-2 flex flex-col gap-3 border border-[#1a3a1a] bg-[#020402] p-4 rounded">
                <div className="flex justify-between items-center border-b border-[#0d1f0d] pb-2">
                  <div>
                    <h4 className="font-bold text-[#00e5ff] text-[12px] uppercase">
                      Drafting: {activeSessionInstance.title}
                    </h4>
                    <span className="text-gray-500 text-[8.5px] uppercase">
                      Envoy partner: <span className="text-[#00ff44] font-bold">{activeSessionInstance.adversaryId}</span> | stage: <span className="text-amber-500 font-bold">{activeSessionInstance.stage}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[9px] text-right">
                    <div>
                      <span className="text-gray-500 uppercase mr-1">Rounds:</span>
                      <span className="text-red-400 font-bold">{activeSessionInstance.roundsRemaining} Left</span>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase mr-1">Expiry Clock:</span>
                      <span className="text-amber-400 font-bold">{activeSessionInstance.deadlineTicks} Ticks</span>
                    </div>
                  </div>
                </div>

                {/* Main draft content selectors */}
                <div className="space-y-3">
                  {/* Public summary */}
                  <div className="text-[10px] bg-[#050a05] border border-[#0d1f0d] p-3 rounded">
                    <strong>Draft Public Summary Text:</strong>
                    <div className="mt-1 pb-1 leading-normal text-gray-400 font-mono italic">
                      "{activeSessionInstance.currentOfferPackage.publicTextSummary}"
                    </div>
                  </div>

                  {/* Obligations toggle framework */}
                  <div>
                    <span className="text-[9px] text-[#00ff44] font-bold uppercase block mb-1.5">Configure Treaty Obligation Packages:</span>
                    <div className="space-y-1.5">
                      {activeSessionInstance.currentOfferPackage.detailedObligations.map(ob => {
                        return (
                          <div key={ob.id} className="p-2.5 border border-[#0f2c10] bg-[#030603] rounded flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-emerald-400 uppercase text-[9.5px]/1">{ob.category} COMMITMENT</span>
                              <p className="text-[9.2px] text-gray-300 mt-0.5">{ob.description}</p>
                              <span className="text-[7.5px] text-gray-550 block font-mono mt-0.5">SCOPE: {ob.scope}</span>
                            </div>
                            <button
                              onClick={() => useTreatyStore.getState().toggleObligation(activeSessionId!, ob.id)}
                              className="px-2 py-0.5 bg-red-950/40 text-rose-400 border border-rose-900/40 hover:bg-rose-900 font-mono text-[7px] uppercase rounded"
                            >
                              Toggle Clause
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secret protocol configurations */}
                  {activeSessionInstance.currentOfferPackage.hiddenProtocols.length > 0 && (
                    <div>
                      <span className="text-[9px] text-purple-400 font-bold uppercase block mb-1.5">Draft Covert side-letters:</span>
                      {activeSessionInstance.currentOfferPackage.hiddenProtocols.map(hp => {
                        return (
                          <div key={hp.id} className="p-2.5 border border-purple-950 bg-purple-950/5 rounded flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-purple-400 uppercase text-[9px] flex items-center gap-1.5">
                                <Lock className="w-3 h-3" />
                                {hp.title}
                              </span>
                              <p className="text-[9.1px] text-purple-200/80 mt-0.5 italic">"{hp.clauseSummaryPrivate}"</p>
                            </div>
                            <button
                              onClick={() => useTreatyStore.getState().toggleHiddenProtocol(activeSessionId!, hp.id)}
                              className={`px-2 py-1 leading-none text-[8px] rounded uppercase font-bold text-black border ${
                                hp.exposed ? 'bg-rose-500 border-rose-300' : 'bg-purple-600 border-purple-400 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {hp.exposed ? 'Cancel protocol' : 'Keep Secret'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Concession trading section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {/* Offered concessions */}
                    <div className="bg-[#030603] border border-[#0d1f0d] p-3 rounded">
                      <span className="text-[8.5px] text-[#00ff44] uppercase font-bold block mb-1">Your Offered Concessions:</span>
                      
                      {activeSessionInstance.currentOfferPackage.offeredConcessions.length === 0 ? (
                        <div className="text-[9.2px] italic text-gray-550 uppercase py-2">
                          No complementary concessions offered
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {activeSessionInstance.currentOfferPackage.offeredConcessions.map(c => (
                            <div key={c.id} className="p-1 border border-cyan-950 bg-cyan-950/10 rounded flex justify-between items-center text-[9px]">
                              <span className="text-teal-300">{c.description}</span>
                              <button
                                onClick={() => useTreatyStore.getState().removeConcessionItem(activeSessionId!, c.id, 'OFFERED')}
                                className="text-rose-500 hover:text-white"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Quick-add buttons */}
                      <button
                        onClick={() => {
                          const customC: TreatyConcessionItem = {
                            id: `CON-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                            type: 'TARIFF_REDUCTION',
                            description: 'Waive bilateral agricultural tariff rate',
                            offeredBy: countryId,
                            recipientId: activeSessionInstance.adversaryId,
                            concessionValue: 12,
                            leverageOffset: 5,
                            politicalCost: 8
                          };
                          useTreatyStore.getState().addConcessionItem(activeSessionId!, customC, 'OFFERED');
                        }}
                        className="mt-2 text-[8px] border border-cyan-800 text-cyan-400 px-1.5 py-0.5 uppercase rounded hover:bg-cyan-950 hover:text-cyan-200 transition-colors"
                      >
                        + Offer Tariff Reduction
                      </button>
                    </div>

                    {/* Demanded concessions */}
                    <div className="bg-[#030603] border border-[#0d1f0d] p-3 rounded">
                      <span className="text-[8.5px] text-[#ff2244] uppercase font-bold block mb-1">Your Demanded Concessions:</span>
                      
                      {activeSessionInstance.currentOfferPackage.demandedConcessions.length === 0 ? (
                        <div className="text-[9.2px] italic text-gray-550 uppercase py-2">
                          No concessions demanded
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {activeSessionInstance.currentOfferPackage.demandedConcessions.map(c => (
                            <div key={c.id} className="p-1 border border-yellow-950 bg-yellow-950/10 rounded flex justify-between items-center text-[9px]">
                              <span className="text-yellow-400">{c.description}</span>
                              <button
                                onClick={() => useTreatyStore.getState().removeConcessionItem(activeSessionId!, c.id, 'DEMANDED')}
                                className="text-rose-500 hover:text-white"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const customD: TreatyConcessionItem = {
                            id: `DEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                            type: 'INTELLIGENCE_SHARING',
                            description: 'Demand signal decryption backdoor authorization',
                            offeredBy: activeSessionInstance.adversaryId,
                            recipientId: countryId,
                            concessionValue: 18,
                            leverageOffset: 8,
                            politicalCost: 15
                          };
                          useTreatyStore.getState().addConcessionItem(activeSessionId!, customD, 'DEMANDED');
                        }}
                        className="mt-2 text-[8px] border border-yellow-850 text-yellow-400 px-1.5 py-0.5 uppercase rounded hover:bg-yellow-950 hover:text-yellow-200 transition-colors"
                      >
                        + Demand Signal Backdoor
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom workspace trigger actions */}
                <div className="flex justify-between items-center pt-3 border-t border-[#0d1f0d] mt-3">
                  <button
                    onClick={() => useTreatyStore.getState().userWalkAway(activeSessionId!)}
                    className="px-3.5 py-1.5 bg-[#1b090a] border border-red-900 text-red-400 hover:bg-red-950 text-[10px] uppercase font-bold rounded cursor-pointer"
                  >
                    Walk Away (Discard Draft)
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => useTreatyStore.getState().submitPlayerProposal(activeSessionId!)}
                      className="px-3.5 py-1.5 bg-[#0b1c0b] border border-green-800 text-[#00ff44] hover:bg-green-900 text-[10px] uppercase font-bold rounded cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-[#00ff44]" />
                      Submit Proposal
                    </button>

                    {activeSessionInstance.stage === 'DRAFT_FINAL' && activeSessionInstance.provisionalAccepted && (
                      <button
                        onClick={() => useTreatyStore.getState().acceptAdversaryOffer(activeSessionId!)}
                        className="px-4 py-1.5 bg-cyan-900 border border-cyan-400 text-white font-bold uppercase text-[10.5px] rounded animate-pulse cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        RATIFY TREATY
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Leverage details & Back-and-forth negotiation history */}
              <div className="flex flex-col gap-4">
                {/* Bargaining leverage card */}
                <div className="combat-panel flex flex-col gap-2.5 border border-[#1a3a1a] bg-[#020302] p-4 rounded text-xs">
                  <h4 className="font-bold text-[9px] uppercase text-gray-550 border-b border-[#0d1f0d] pb-1 tracking-wider flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-yellow-500" />
                    Bargaining Leverage Indexes 
                  </h4>

                  <div className="space-y-1.5 text-[9.5px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400 uppercase">Military Ratio:</span>
                      <span className="font-bold text-emerald-400">{activeSessionInstance.playerAssessedLeverage.militaryBalanceRatio}x Ratio</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 uppercase">Sanctions Pressure:</span>
                      <span className="font-bold text-cyan-400">{activeSessionInstance.playerAssessedLeverage.sanctionsPressureIndex}% index</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 uppercase">Energy Dependence:</span>
                      <span className="font-bold text-amber-500">{activeSessionInstance.playerAssessedLeverage.energyDependencePct}% dependent</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 uppercase">Player Credibility:</span>
                      <span className="font-bold text-teal-400">{activeSessionInstance.playerAssessedLeverage.currentCredibilityRating}% rating</span>
                    </div>
                  </div>

                  {/* ZOPA gauge */}
                  <div className="border border-cyan-950 bg-cyan-950/10 p-2.5 rounded text-[9.5px] mt-1 font-mono leading-normal">
                    <div className="font-bold text-cyan-400 uppercase text-[8px] flex items-center gap-1 mb-1">
                      <Scale className="w-3 h-3 text-cyan-400" />
                      ZOPA Feasibility Estimate
                    </div>
                    <strong>Est Overlap Overlap:</strong> {activeSessionInstance.zoneOfPossibleAgreementEstimated.overlapExisted ? 'FEASIBLE' : 'CRITICAL OVERHANG'}
                    <br />
                    <strong>Est Feasibility index:</strong> {activeSessionInstance.zoneOfPossibleAgreementEstimated.feasibilityRating}%
                  </div>
                </div>

                {/* back-and-forth logs */}
                <div className="combat-panel flex-1 flex flex-col gap-2 border border-blue-950 bg-[#010408] p-4 rounded text-xs min-h-[220px]">
                  <h4 className="font-bold text-[9px] uppercase text-[#00ff55] border-b border-blue-950 pb-1.5 tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-pink-400" />
                    Bilateral negotiation Logs
                  </h4>

                  <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 flex-1">
                    {activeSessionInstance.negotiationLogs.map((log, idx) => (
                      <div key={idx} className="border-b border-[#0d1a2d]/50 pb-1.5 mt-1">
                        <span className="text-[7px] text-gray-500 font-mono italic block">Tick {log.tick} | Round {log.roundIndex}</span>
                        <div className="text-[9.5px] text-white">
                          <strong className={log.actorId === countryId ? 'text-[#00ff44]' : 'text-[#00e5ff]'}>
                            {log.actorId}:
                          </strong>{' '}
                          {log.description}
                        </div>
                      </div>
                    ))}
                    
                    {activeSessionInstance.negotiationHistory.map((history, hIdx) => {
                      return (
                        <div key={history.id} className="p-2 border border-purple-950 bg-purple-950/10 rounded mt-2">
                          <span className="text-[7px] text-purple-400 font-bold block mb-1">Adversary counter-offer #{hIdx+1}</span>
                          <div className="text-[9.2px] text-purple-200 mt-1 italic">
                            "{history.justificationText}"
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: CREDIBILITY MEMORIES --- */}
      {activeSubTab === 'CREDIBILITY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main profile select */}
          <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner justify-between">
            <div>
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]">
                Sovereign Credibility dossiers
              </h3>
              <div className="space-y-1.5 mt-2.5 max-h-[300px] overflow-y-auto pr-1">
                {Object.keys(credibilityMemories).map(cid => {
                  const m = credibilityMemories[cid];
                  const activeClass = cid === tradeTgtId ? 'border-[#00ff44] bg-[#0c1f0d]' : 'border-gray-950 bg-[#010301] hover:border-gray-800';

                  return (
                    <div 
                      key={cid}
                      onClick={() => { audio.sfxKeyClick(); setTargetCountry(cid); }}
                      className={`border p-2 rounded cursor-pointer transition-all flex justify-between items-center ${activeClass}`}
                    >
                      <div className="font-bold text-[#00ff44] uppercase text-[10px]/1">
                        {countries[cid]?.flagEmoji || '🌍'} {cid} Profile
                      </div>
                      <div className="text-right text-[9px] font-bold text-amber-500">
                        {m.overallScore}% CRED
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overall summaries */}
            <div className="bg-[#051105]/40 border border-[#0a200a]/20 p-2.5 rounded mt-3 text-[9px] uppercase text-gray-500 leading-relaxed font-mono">
              ⚡ <strong>Credibility rule:</strong> Repeatedly violating clauses or walking away near review windows will permanent scar sovereign bargaining power, leading to narrow negotiation zones.
            </div>
          </div>

          {/* Target Memory Dossier Details */}
          {credibilityMemories[tradeTgtId] ? (
            <div className="md:col-span-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-[#1a3a1a] pb-2">
                <div>
                  <h4 className="font-bold text-[#00e5ff] text-[11px] uppercase flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    Commitment Memory log: {tradeTgtId}
                  </h4>
                  <div className="text-[8.2px] text-gray-500 mt-0.5 uppercase flex gap-3">
                    <span>Good faith streak: <span className="text-[#00ff44] font-bold">{credibilityMemories[tradeTgtId].goodFaithFulfilmentStreak} Pacts</span></span>
                    <span>Violation Count: <span className="text-red-400 font-bold">{credibilityMemories[tradeTgtId].violationCount} Breaches</span></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-gray-500 font-bold uppercase text-[7.5px] block">Overall Index</span>
                  <span className="text-[14px] font-black font-sans text-teal-400">
                    {credibilityMemories[tradeTgtId].overallScore}%
                  </span>
                </div>
              </div>

              {/* Category scores block */}
              <div>
                <span className="text-[8.5px] text-gray-500 font-bold block uppercase mb-1.5">Category-Aware Scores:</span>
                <div className="grid grid-cols-5 gap-2 font-mono uppercase text-center text-[8.5px]">
                  <div className="bg-[#020502] border border-green-950 p-1.5 rounded">
                    <span className="text-gray-500 block mb-0.5">MILITARY</span>
                    <strong className="text-[#00ff44]">{credibilityMemories[tradeTgtId].categoryScores.military}%</strong>
                  </div>
                  <div className="bg-[#020502] border border-cyan-950 p-1.5 rounded">
                    <span className="text-gray-500 block mb-0.5">TRADE</span>
                    <strong className="text-[#00e5ff]">{credibilityMemories[tradeTgtId].categoryScores.trade}%</strong>
                  </div>
                  <div className="bg-[#020502] border border-yellow-955 p-1.5 rounded">
                    <span className="text-gray-500 block mb-0.5">INSPECT</span>
                    <strong className="text-yellow-500">{credibilityMemories[tradeTgtId].categoryScores.inspection}%</strong>
                  </div>
                  <div className="bg-[#020502] border border-purple-955 p-1.5 rounded">
                    <span className="text-gray-500 block mb-0.5">INTEL</span>
                    <strong className="text-purple-400">{credibilityMemories[tradeTgtId].categoryScores.intelligence}%</strong>
                  </div>
                  <div className="bg-[#020502] border border-rose-955 p-1.5 rounded">
                    <span className="text-gray-500 block mb-0.5">SANCTIONS</span>
                    <strong className="text-rose-500">{credibilityMemories[tradeTgtId].categoryScores.sanctions}%</strong>
                  </div>
                </div>
              </div>

              {/* History logs */}
              <div>
                <span className="text-[8.5px] text-gray-500 font-bold block uppercase mb-1.5">Archived Diplomatic Incident Records:</span>
                
                {credibilityMemories[tradeTgtId].history.length === 0 ? (
                  <div className="py-8 italic text-gray-600 text-center uppercase border border-dashed border-gray-950 rounded">
                    [No historic commitment breaches or positive actions logged for this state]
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {credibilityMemories[tradeTgtId].history.map((h, hIdx) => {
                      const isBreach = h.actionType.includes('BREACH');
                      return (
                        <div key={hIdx} className="bg-[#020402] border border-[#0d1c0d] p-2 rounded flex justify-between items-start text-[9.5px]">
                          <div>
                            <div className="flex gap-2 items-center">
                              <span className={`px-1 text-[7.5px] font-bold rounded uppercase ${isBreach ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                                {h.actionType}
                              </span>
                              <strong className="text-cyan-400">{h.treatyName}</strong>
                            </div>
                            <p className="text-gray-400 text-[9px] mt-0.5 leading-normal italic">
                              "{h.description}"
                            </p>
                          </div>
                          <div className="text-right font-mono font-bold text-[8.5px] whitespace-nowrap pl-2">
                            <span className={h.credibilityDelta < 0 ? 'text-red-500' : 'text-emerald-400'}>
                              {h.credibilityDelta > 0 ? `+${h.credibilityDelta}` : h.credibilityDelta} CRED
                            </span>
                            <span className="text-gray-500 block mt-0.5">T{h.tick}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 border border-gray-900 bg-black/45 rounded flex items-center justify-center p-12 text-gray-600 italic">
              [No credibility record loaded for selected sovereign target]
            </div>
          )}
        </div>
      )}
    </div>
    </PanelFxShell>
  );
}
