import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { produce } from 'immer';
import { useUNStore } from '../../store/unStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';
import { motion } from 'motion/react';
import { 
  Globe, 
  FileText, 
  Plus, 
  Trash2, 
  Scale, 
  ShieldAlert, 
  Users, 
  Coins, 
  MessageSquare, 
  PlusCircle, 
  Award, 
  History, 
  UserPlus, 
  Gavel,
  BookOpen,
  Vote,
  Compass,
  DollarSign
} from 'lucide-react';
import { ResolutionClause } from '../../types/un';

export default function UNPanel() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const playerCountry = countries[playerCountryId];

  // Store selections
  const {
    resolutions,
    activeResolutionId,
    draftResolution,
    lobbyStates,
    diplomaticDebtLedger,
    specialSessions,
    icjCases,
    tribunals,
    reputationShifts,
    institutionalMemories,
    unscReformStatus,
    createDraftResolution,
    updateDraftTitle,
    updateDraftRationale,
    addDraftClause,
    removeDraftClause,
    setDraftLegalStyle,
    tableDraftResolution,
    toggleSponsorship,
    lobbyCountry,
    proposeVoteTrade,
    callInDiplomaticDebt,
    executeUNSCVote,
    triggerEmergencySpecialSession,
    fileLegalReferral,
    escalateCaseToTribunal,
    triggerUNSCReformCrisis,
    voteInReformCrisis,
    getResolutionPreview
  } = useUNStore();

  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);

  // Sub-tab selection of UN workspace
  const [activeSubTab, setActiveSubTab] = useState<'COUNCIL' | 'DEBT' | 'COURT' | 'REPUTATION'>('COUNCIL');

  // Draft Clause temporary states
  const [clauseCategory, setClauseCategory] = useState<ResolutionClause['category']>('CONDEMN');
  const [clauseDescription, setClauseDescription] = useState('');
  const [clauseWeight, setClauseWeight] = useState(50);
  const [draftTarget, setDraftTarget] = useState('RU');

  // New Vote Trade Proposal temporary states
  const [tradeDebtor, setTradeDebtor] = useState('DE');
  const [tradeDealType, setTradeDealType] = useState<'VOTE_SUPPORT' | 'VOTE_ABSTAIN' | 'CO_SPONSORSHIP'>('VOTE_SUPPORT');
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradeMagnitude, setTradeMagnitude] = useState(3);

  // Legal Referral temporary states
  const [legalRespondent, setLegalRespondent] = useState('RU');
  const [legalClaimType, setLegalClaimType] = useState<'TERRITORY' | 'WAR_CRIMES' | 'SOVEREIGNTY_VIOLATION' | 'TREATY_BREACH' | 'ILLEGAL_FORCE'>('SOVEREIGNTY_VIOLATION');
  const [legalIntelligenceConfidence, setLegalIntelligenceConfidence] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [legalSourceProvenance, setLegalSourceProvenance] = useState<'SIGINT' | 'IMINT' | 'HUMINT' | 'PUBLIC_NGO'>('SIGINT');

  // Target dropdown for draft builder
  const globalNations = Object.keys(countries).filter(cid => cid !== playerCountryId);

  const selectedActiveUnRes = activeResolutionId ? resolutions[activeResolutionId] : Object.values(resolutions).find(r => r.status === 'LOBBYING_STAGE' || r.status === 'SPONSORSHIP_STAGE') || Object.values(resolutions)[0];

  const handleCreateDraft = () => {
    audio.sfxKeyClick();
    createDraftResolution(playerCountryId, draftTarget);
    pushTerminalLine(`UN SECURITY COUNCIL: Drafting initiated for resolution targeting ${draftTarget}.`, 'INFO');
  };

  const handleAddClause = () => {
    if (!clauseDescription.trim()) return;
    audio.sfxKeyClick();
    addDraftClause({
      id: `CL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      category: clauseCategory,
      description: clauseDescription,
      targetCountryId: draftResolution?.targetCountryId || draftTarget,
      severityWeight: clauseWeight,
      reputationalRiskWeight: Math.round(clauseWeight * 0.4)
    });
    setClauseDescription('');
  };

  const handleTableResolution = () => {
    if (!draftResolution || !draftResolution.clauses || draftResolution.clauses.length === 0) {
      useUIStore.getState().pushAlert({
        title: 'CLAUSES REQUIRED',
        message: 'A formal Security resolution must contain at least 1 operative clause before tabling.',
        type: 'WARNING'
      });
      return;
    }
    audio.sfxSuccessConfirmation();
    const resId = tableDraftResolution();
    pushTerminalLine(`UN SECURITY COUNCIL: Resolution ${resId} has been tabled on the floor for sponsorship.`, 'INFO');
  };

  const handleVetoBypass = (resId: string) => {
    audio.sfxKlaxon();
    const essId = triggerEmergencySpecialSession(resId);
    pushTerminalLine(`GENERAL ASSEMBLY: Emergency Special Session ${essId} successfully bypassed security council deadlocks!`, 'INFO');
  };

  const handleProposeTrade = () => {
    if (!tradeDescription.trim()) return;
    audio.sfxSuccessConfirmation();
    proposeVoteTrade(
      tradeDebtor,
      playerCountryId,
      tradeDealType,
      tradeDescription,
      tradeMagnitude,
      selectedActiveUnRes?.id
    );
    setTradeDescription('');
  };

  const handleFileLegal = () => {
    audio.sfxIntelChime();
    const evidence: any = {
      id: `EVI-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      claimType: legalClaimType,
      targetCountryId: legalRespondent,
      factualAllegations: [`Direct violations filed by the Sovereign Executive regarding ${legalClaimType}.`],
      sourceProvenance: legalSourceProvenance,
      intelligenceConfidence: legalIntelligenceConfidence,
      admissibilityScore: legalIntelligenceConfidence === 'HIGH' ? 85 : legalIntelligenceConfidence === 'MEDIUM' ? 60 : 35,
      corroborationState: 'PARTIAL',
      politicalContaminationRisk: 10,
      publicityLevel: 'PUBLIC_LEGITIMIZED'
    };

    const caseId = fileLegalReferral(playerCountryId, legalRespondent, legalClaimType, evidence);
    pushTerminalLine(`ICJ CASE FILED: Official legal proceedings registered (Docket ID: ${caseId}).`, 'INFO');
  };

  return (
    <PanelFxShell panelId="un" relevantFxTypes={['UN_RESOLUTION_PASSED','UN_VETO_CAST','WAR_DECLARED','CEASEFIRE_SIGNED']}>
      <div className="gotham-panel gotham-panel--primary flex flex-col font-mono text-green-400 font-bold select-none h-full min-h-[640px]" data-classification="CONFIDENTIAL">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-[#1a5c1a]/55 pb-3 mb-4">
        <div>
          <span className="text-shadow tracking-widest text-shadow-glow text-[#00ff44] text-[13px] uppercase block">
            🇺🇳 MULTILATERAL INSTITUTIONS & INTERNATIONAL LAW
          </span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest block">
            UN SECURITY COUNCIL OFFICE / LEGAL REFERRAL AGENCY
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-[#071f07] px-2.5 py-1 border border-[#00ff44]/30 rounded text-emerald-300">
            GRIDLOCKS: <span className="text-yellow-400 font-bold text-xs">{unscReformStatus.accumulatedGridlocks}</span> / 4 TO CRISIS
          </span>
          <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-[#00ff44]">
            TICK {currentTick}
          </span>
        </div>
      </div>

      {/* Main workspace navigation tabs */}
      <div className="flex border-b border-[#0d2e0d] mb-4 gap-1 overflow-x-auto">
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('COUNCIL'); }}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 tracking-wider flex items-center gap-1.5 transition-all text-shadow ${activeSubTab === 'COUNCIL' ? 'border-[#00ff44] text-[#00ff44] bg-emerald-950/20' : 'border-transparent text-gray-400 hover:text-green-300'}`}
        >
          <Globe className="w-3.5 h-3.5" /> SECURITY COUNCIL
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('DEBT'); }}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 tracking-wider flex items-center gap-1.5 transition-all text-shadow ${activeSubTab === 'DEBT' ? 'border-[#00ff44] text-[#00ff44] bg-emerald-950/20' : 'border-transparent text-gray-400 hover:text-green-300'}`}
        >
          <Coins className="w-3.5 h-3.5" /> DIPLOMATIC DEBT
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('COURT'); }}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 tracking-wider flex items-center gap-1.5 transition-all text-shadow ${activeSubTab === 'COURT' ? 'border-[#00ff44] text-[#00ff44] bg-emerald-950/20' : 'border-transparent text-gray-400 hover:text-green-300'}`}
        >
          <Scale className="w-3.5 h-3.5" /> ICJ & TRIBUNALS
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('REPUTATION'); }}
          className={`px-4 py-2 text-[10px] uppercase font-bold border-b-2 tracking-wider flex items-center gap-1.5 transition-all text-shadow ${activeSubTab === 'REPUTATION' ? 'border-[#00ff44] text-[#00ff44] bg-emerald-950/20' : 'border-transparent text-gray-400 hover:text-green-300'}`}
        >
          <Award className="w-3.5 h-3.5" /> SOVEREIGN REPUTATIONS
        </button>
      </div>

      {/* Primary Workspace Sections */}
      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-thin">
        {/* Workspace A: UNSC COUNCIL ENGINE */}
        {activeSubTab === 'COUNCIL' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Resolution Authoring Deck - Left Side (5 Cols) */}
            <div className="col-span-12 lg:col-span-5 p-3.5 border border-[#163a16]/45 bg-[#030d03] rounded-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                  <FileText className="w-4 h-4 text-[#00ff44]" /> DRAFT RESOLUTION BUILDER
                </div>

                {!draftResolution ? (
                  <div className="text-center py-6">
                    <p className="text-[10px] text-gray-500 uppercase mb-4 leading-relaxed">
                      No active drafts initialized. Sponsor a new Security Council framework.
                    </p>
                    <div className="flex gap-2 items-center justify-center">
                      <select
                        value={draftTarget}
                        onChange={(e) => setDraftTarget(e.target.value)}
                        className="bg-black text-[10px] border border-[#0d2e0d] text-green-400 p-1.5 hover:border-green-400 rounded outline-none"
                      >
                        {globalNations.map(cid => (
                          <option key={cid} value={cid}>{countries[cid]?.name} ({cid})</option>
                        ))}
                      </select>
                      <button
                        onClick={handleCreateDraft}
                        className="bg-emerald-950 border border-[#00ff44]/70 hover:bg-[#00ff44]/15 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all"
                      >
                        INIT RESOLUTION
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-[10px]">
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase block mb-1">TITLE SPECIFICATIONS</span>
                      <input
                        type="text"
                        value={draftResolution.title || ''}
                        onChange={(e) => updateDraftTitle(e.target.value)}
                        className="w-full bg-black border border-[#0d2e0d] text-green-400 p-2 rounded outline-none text-[10px]"
                      />
                    </div>

                    <div>
                      <span className="text-[8px] text-gray-500 uppercase block mb-1">PREAMBULAR LOBBYING FRAMEWORK</span>
                      <textarea
                        value={draftResolution.preambularRationale || ''}
                        onChange={(e) => updateDraftRationale(e.target.value)}
                        className="w-full bg-black border border-[#0d2e0d] text-green-400 p-2 rounded outline-none text-[10px] h-12"
                        placeholder="State legal background context or violations..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-gray-500 uppercase block mb-1">CHARTER LEVEL BASIS</span>
                        <select
                          value={draftResolution.legalBasisStyle}
                          onChange={(e: any) => setDraftLegalStyle(e.target.value)}
                          className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none text-[10px]"
                        >
                          <option value="CHARTER_CHAP_VI">CHAP VI (PEACEFUL)</option>
                          <option value="CHARTER_CHAP_VII">CHAP VII (MILITARY FORCE)</option>
                          <option value="NORMATIVE_DECLARATION">NORMATIVE NON-BINDING</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-500 uppercase block mb-1">TARGET ACTOR</span>
                        <span className="block p-1.5 bg-[#0b170b] border border-[#0d2e0d] rounded text-white text-center">
                          {countries[draftResolution.targetCountryId || '']?.name || draftResolution.targetCountryId}
                        </span>
                      </div>
                    </div>

                    {/* Operational Clauses Section */}
                    <div>
                      <div className="flex justify-between items-center text-[8px] text-gray-500 mb-1 border-b border-[#112d11] pb-1">
                        <span>OPERATIVE CLAUSES ({draftResolution.clauses?.length || 0})</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 mb-2">
                        {draftResolution.clauses?.map((clause, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-black/40 p-1 border border-[#113111]/30 rounded">
                            <div>
                              <span className="text-yellow-400 uppercase font-bold text-[8px] pr-2">[{clause.category}]</span>
                              <span className="text-gray-300">{clause.description}</span>
                            </div>
                            <button
                              onClick={() => removeDraftClause(clause.id)}
                              className="text-red-500 hover:text-red-400 text-[9px] p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Clause Form */}
                      <div className="space-y-1.5 bg-black/60 p-2 rounded border border-[#0d2e0d]">
                        <div className="flex gap-1">
                          <select
                            value={clauseCategory}
                            onChange={(e: any) => setClauseCategory(e.target.value)}
                            className="flex-1 bg-black border border-[#0d2e0d] text-[10px] p-1 text-green-400 outline-none"
                          >
                            <option value="CONDEMN">FORMALLY CONDEMN</option>
                            <option value="DEMAND_CEASEFIRE">DEMAND CEASEFIRE</option>
                            <option value="ECONOMIC_SANCTIONS">IMPOSE SANCTIONS</option>
                            <option value="ARMS_EMBARGO">ARMS EMBARGO</option>
                            <option value="INVESTIGATION_MANDATE">MANDATE ENQUIRY</option>
                          </select>
                          <input
                            type="text"
                            value={clauseDescription}
                            onChange={(e) => setClauseDescription(e.target.value)}
                            placeholder="Clause description..."
                            className="flex-2 bg-black border border-[#0d2e0d] text-[10px] p-1 text-green-400 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-500">PENAL COERCION STRATEGY ({clauseWeight}%):</span>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={clauseWeight}
                            onChange={(e) => setClauseWeight(Number(e.target.value))}
                            className="flex-1 accent-green-400 h-1 bg-[#112b11]"
                          />
                          <button
                            onClick={handleAddClause}
                            className="bg-[#0b280b] border border-green-500 hover:bg-[#00ff44]/15 px-2 py-0.5 rounded text-[8px] uppercase"
                          >
                            ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {draftResolution && (
                <div className="border-t border-[#0d2e0d] pt-3.5 mt-3 flex justify-between gap-2">
                  <button
                    onClick={() => useUNStore.setState({ draftResolution: null })}
                    className="bg-black border border-red-500/60 hover:bg-red-950/20 px-3 py-1.5 rounded text-[9px] uppercase text-red-500 transition-all font-bold"
                  >
                    DISCARD
                  </button>
                  <button
                    onClick={handleTableResolution}
                    className="bg-emerald-950 border border-green-400 text-green-400 hover:bg-[#00ff44]/15 px-4 py-1.5 rounded text-[9px] uppercase transition-all font-bold flex-1"
                  >
                    TABLE ON COUNCIL FLOOR
                  </button>
                </div>
              )}
            </div>

            {/* Voting Horseshoe and Active Resolution - Right/Center (7 Cols) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col justify-between p-3.5 border border-[#163a16]/45 bg-[#030c03] rounded-md">
              <div>
                <div className="flex justify-between items-center text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Vote className="w-4 h-4 text-green-400" /> UNSC VOTING BENCH
                  </span>
                  {selectedActiveUnRes && (
                    <span className="text-[10px] bg-[#0c240c] text-white px-2 py-0.5 rounded">
                      STATUS: <span className="text-yellow-400 font-bold">{selectedActiveUnRes.status}</span>
                    </span>
                  )}
                </div>

                {/* Dropdown to select active resolution */}
                {Object.values(resolutions).length > 0 && (
                  <div className="flex gap-2 items-center mb-3 text-[10px]">
                    <span className="text-gray-500 uppercase">SELECT BILL AGENDA:</span>
                    <select
                      value={selectedActiveUnRes?.id || ''}
                      onChange={(e) => useUNStore.setState({ activeResolutionId: e.target.value })}
                      className="bg-black border border-[#0d2e0d] text-green-400 p-1 rounded hover:border-green-400 outline-none max-w-sm"
                    >
                      {Object.values(resolutions).map(res => (
                        <option key={res.id} value={res.id}>
                          [{res.status}] {res.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedActiveUnRes ? (
                  <div className="space-y-4">
                    <div className="p-2 border border-emerald-950 bg-[#061106] rounded">
                      <span className="text-[9px] text-[#00ff44] uppercase font-bold block mb-1">
                        {selectedActiveUnRes.title}
                      </span>
                      <p className="text-[9px] text-gray-400 italic">
                        "{selectedActiveUnRes.preambularRationale}"
                      </p>
                    </div>

                    {/* Voting Horseshoe Representation using SVG */}
                    <div className="flex flex-col items-center justify-center p-2 border border-[#112d11]/40 rounded bg-black/30">
                      <div className="flex justify-between w-full text-[8px] text-gray-500 uppercase mb-1">
                        <span>P5 SEATS: FOR/AGAINST</span>
                        <span>COUNCIL VETO-RISK INFLUENCES INDICATORS</span>
                      </div>
                      
                      <div className="flex justify-center relative w-full h-24">
                        <svg className="w-56 h-24" viewBox="0 0 100 50">
                          <path d="M 10 40 A 40 40 0 0 1 90 40" fill="none" stroke="#003500" strokeWidth="4" />
                          
                          {/* Draw visual indicators representing the 12 active Council nations */}
                          {['US', 'RU', 'CN', 'GB', 'FR', 'DE', 'JP', 'KR', 'IN', 'IL', 'SA', 'BR'].map((cid, idx) => {
                            const th = Math.PI + (idx * Math.PI) / 11;
                            const x = 50 + 38 * Math.cos(th);
                            const y = 44 + 38 * Math.sin(th);

                            // Lookup lobby intention
                            const lStatus = lobbyStates[selectedActiveUnRes.id]?.lobbyProgressByCountry[cid];
                            let color = '#555555';
                            if (cid === selectedActiveUnRes.creatorId || selectedActiveUnRes.sponsors.includes(cid)) {
                              color = '#00ff44'; // Gold / Sponsor
                            } else if (lStatus) {
                              if (lStatus.intention === 'FOR') color = '#20ff70';
                              else if (lStatus.intention === 'AGAINST') color = '#ff2244';
                              else color = '#e2aa00';
                            } else {
                              // Default estimations colors
                              const country = countries[cid];
                              const op = country?.opinions[selectedActiveUnRes.creatorId] ?? 50;
                              if (op > 60) color = '#00ff44';
                              else if (op < 40) color = '#ff2244';
                              else color = '#999';
                            }

                            const isP5 = ['US', 'RU', 'CN', 'GB', 'FR'].includes(cid);

                            return (
                              <g key={cid}>
                                <circle cx={x} cy={y} r={isP5 ? 3 : 2} fill={color} className="transition-all duration-300" />
                                <text x={x} y={y - 5} fill="#fff" fontSize="4.5" textAnchor="middle" className="font-mono text-[4px] opacity-60">
                                  {cid}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex justify-between w-full text-[8.5px] uppercase border-t border-[#112c11] pt-1 mt-1">
                        <span className="text-[#00ff44]">SPONSORS: {selectedActiveUnRes.sponsors.join(', ')}</span>
                        <span className="text-yellow-400">CO-SPONSORS: {selectedActiveUnRes.coSponsors.join(', ') || 'NONE'}</span>
                      </div>
                    </div>

                    {/* Pre-vote Estimator Analysis and Veto warning */}
                    {selectedActiveUnRes.status === 'LOBBYING_STAGE' && (
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="p-2 border border-yellow-700/40 bg-yellow-950/10 rounded">
                          <span className="text-[8px] text-yellow-500 font-bold block mb-1">P5 VETO MATRIX ASSESSMENT</span>
                          <div className="space-y-1">
                            <span className="text-gray-400">Estimated risk of block: </span>
                            <span className="text-yellow-400 font-bold">
                              {getResolutionPreview(selectedActiveUnRes.id).vetoRiskPercentage}%
                            </span>
                            <div className="text-[8px] text-gray-500">
                              Crucial blockers: {getResolutionPreview(selectedActiveUnRes.id).potentialVetoingCountries.join(', ') || 'NEUTRAL'}
                            </div>
                          </div>
                        </div>

                        <div className="p-2 border border-emerald-950 bg-[#081508]/45 rounded flex flex-col justify-between">
                          <div className="text-[8.5px]">
                            <span className="text-gray-400">LEGITIMACY DELTA: </span>
                            <span className="text-emerald-400 font-bold">+{getResolutionPreview(selectedActiveUnRes.id).expectedSponsorLegitimacyGain} AP</span>
                          </div>
                          <div className="text-[8.5px]">
                            <span className="text-gray-400">DOWNSTREAM REPRISAL INDEX: </span>
                            <span className="text-red-400 font-bold">{getResolutionPreview(selectedActiveUnRes.id).reprisalsRiskRating} pts</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vote Summary Record (If decided) */}
                    {selectedActiveUnRes.voteRecord && (
                      <div className="p-2 border border-emerald-950 bg-black/60 rounded text-[10px] space-y-1.5">
                        <span className="text-[9px] text-[#00ff44] uppercase font-bold block">VOTE RECORD TALLIES:</span>
                        <div className="flex justify-between border-b border-[#113111]/45 pb-1">
                          <span>FOR: <span className="text-green-400">{selectedActiveUnRes.voteRecord.votesFor.join(', ')}</span></span>
                          <span className="font-bold">({selectedActiveUnRes.voteRecord.votesFor.length})</span>
                        </div>
                        <div className="flex justify-between border-b border-[#113111]/45 pb-1">
                          <span>AGAINST: <span className="text-red-400">{selectedActiveUnRes.voteRecord.votesAgainst.join(', ')}</span></span>
                          <span className="font-bold">({selectedActiveUnRes.voteRecord.votesAgainst.length})</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span>ABSTAINED: <span className="text-yellow-400">{selectedActiveUnRes.voteRecord.votesAbstain.join(', ')}</span></span>
                          <span className="font-bold">({selectedActiveUnRes.voteRecord.votesAbstain.length})</span>
                        </div>
                        {selectedActiveUnRes.voteRecord.vetoed && (
                          <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/40 p-1.5 rounded text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                            <span>VETO RECORDED DIRECTLY BY: {selectedActiveUnRes.voteRecord.vetoingP5s.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Operational Lobby / Action Buttons */}
                    <div className="border-t border-[#112d11] pt-3 flex gap-2 flex-wrap text-[10px]">
                      {selectedActiveUnRes.status === 'SPONSORSHIP_STAGE' && (
                        <>
                          <button
                            onClick={() => toggleSponsorship(selectedActiveUnRes.id, playerCountryId, 'CO_SPONSOR')}
                            className="bg-emerald-950 border border-green-500/70 hover:bg-[#00ff44]/15 px-3 py-1.5 rounded font-bold uppercase transition-all"
                          >
                            {selectedActiveUnRes.coSponsors.includes(playerCountryId) ? 'WITHDRAW CO-SPONSORSHIP' : 'SIGN CO-SPONSOR'}
                          </button>
                          <button
                            onClick={() => {
                              audio.sfxSuccessConfirmation();
                              useUNStore.setState(produce(s => { s.resolutions[selectedActiveUnRes.id].status = 'LOBBYING_STAGE'; }));
                              pushTerminalLine(`UN SECURITY COUNCIL: Resolution ${selectedActiveUnRes.id} pushed to formal lobbying stage.`, 'INFO');
                            }}
                            className="bg-[#124d12] border border-[#00ff44] text-white hover:bg-[#00ff44]/25 px-4 py-1.5 rounded font-bold uppercase transition-all"
                          >
                            INITIATE LOBBYING CONSOLE
                          </button>
                        </>
                      )}

                      {selectedActiveUnRes.status === 'LOBBYING_STAGE' && (
                        <div className="w-full space-y-3">
                          <div className="flex justify-between items-center bg-[#071307] p-2 border border-[#113111] rounded">
                            <span className="text-[#00ff44] text-[9.5px]">LOBBY SWING COUNCIL ACTORS ($2.5B per dispatch):</span>
                            <div className="flex gap-1">
                              {['RU', 'CN', 'DE', 'JP', 'IN'].map(cid => (
                                <button
                                  key={cid}
                                  onClick={() => lobbyCountry(selectedActiveUnRes.id, cid, 'REALPOLITIK')}
                                  className="bg-black border border-[#114411] hover:border-[#00ff44] text-[9px] px-2 py-1 rounded"
                                >
                                  SWAY {cid}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between gap-2 border-t border-[#112d11] pt-2">
                            <button
                              onClick={() => executeUNSCVote(selectedActiveUnRes.id)}
                              className="bg-emerald-950 border border-green-400 text-[#00ff44] hover:bg-[#00ff44]/15 px-4 py-2 rounded text-[10px] font-bold uppercase transition-all flex-1"
                            >
                              CONDUCT SUBSTANTIVE VOTE
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedActiveUnRes.status === 'VETOED' && (
                        <div className="w-full p-3 border border-red-800/40 bg-red-950/15 rounded flex justify-between items-center">
                          <div>
                            <span className="text-white uppercase font-bold block text-[10.5px]">SECURITY COUNCIL BLOCKED</span>
                            <span className="text-gray-400 text-[8.5px]">Convening General Assembly Special bypass overrides gridlock vectors.</span>
                          </div>
                          <button
                            onClick={() => handleVetoBypass(selectedActiveUnRes.id)}
                            className="bg-red-950 border border-red-500 hover:bg-red-900/45 text-white px-4 py-2 rounded text-[9.5px] font-bold transition-all uppercase"
                          >
                            BYPASS DEADLOCK (TRIGGER ESS)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 uppercase text-[10px]">
                    No active resolutions available. Initialize a draft blueprint.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workspace B: DIPLOMATIC DEBT LEDGER */}
        {activeSubTab === 'DEBT' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Action Card: Propose Deal / Vote Trade - Left (4 Cols) */}
            <div className="col-span-12 lg:col-span-4 p-3.5 border border-[#163a16]/45 bg-[#030d03] rounded-md flex flex-col justify-between text-[10px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                  <UserPlus className="w-4 h-4 text-green-400" /> VOTE & CONCESSION EXCHANGE
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">DEBTOR POWER (OWES THE PROMISE)</span>
                    <select
                      value={tradeDebtor}
                      onChange={(e) => setTradeDebtor(e.target.value)}
                      className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none"
                    >
                      {globalNations.map(cid => (
                        <option key={cid} value={cid}>{countries[cid]?.name} ({cid})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">CREDITOR POWER (OWED THE PROMISE)</span>
                    <span className="block p-1.5 bg-[#081508]/45 border border-[#0d2e0d] rounded text-white text-center">
                      {countries[playerCountryId]?.name} (YOU)
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">CONCESSION ARRANGEMENT TYPE</span>
                    <select
                      value={tradeDealType}
                      onChange={(e: any) => setTradeDealType(e.target.value)}
                      className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none"
                    >
                      <option value="VOTE_SUPPORT">COMMIT TO YES ON RESOLUTIONS</option>
                      <option value="VOTE_ABSTAIN">COMMIT TO ABSTAIN ON RESOLUTIONS</option>
                      <option value="CO_SPONSOR_DEAL">COMMIT TO CO-SPONSORING SUPPORT</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">COMMITMENT TERM SPECIFICATIONS</span>
                    <input
                      type="text"
                      value={tradeDescription}
                      onChange={(e) => setTradeDescription(e.target.value)}
                      placeholder="e.g. Vote support on flight limitations ban next tick"
                      className="w-full bg-black border border-[#0d2e0d] text-green-400 p-2 rounded outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">OBLIGATION INTENSITY ({tradeMagnitude}/5)</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={tradeMagnitude}
                      onChange={(e) => setTradeMagnitude(Number(e.target.value))}
                      className="w-full accent-green-400 h-1 bg-[#112b11]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleProposeTrade}
                className="bg-emerald-950 border border-green-400 text-[#00ff44] hover:bg-[#00ff44]/15 px-4 py-2 mt-4 rounded font-bold uppercase transition-all w-full"
              >
                PRODUCE TRANSACTION AGREEMENT
              </button>
            </div>

            {/* General Ledger Display - Right (8 Cols) */}
            <div className="col-span-12 lg:col-span-8 p-3.5 border border-[#163a16]/45 bg-[#030903] rounded-md flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Coins className="w-4 h-4 text-green-400" /> DIPLOMATIC DEBT REGISTER
                  </span>
                  <span className="text-[8.5px] text-gray-500">ACTIVE TICK DECK LEVERAGES</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.values(diplomaticDebtLedger).length === 0 ? (
                    <div className="text-center py-12 text-gray-500 uppercase text-[10px]">
                      Diplomatic transaction ledgers are currently empty. Create an exchange agreement to secure votes.
                    </div>
                  ) : (
                    Object.values(diplomaticDebtLedger).map((debt) => (
                      <div
                        key={debt.id}
                        className={`p-3 border rounded text-[10px] flex justify-between items-center ${debt.status === 'CALLED_IN' ? 'bg-[#153a15]/20 border-[#22ff55]/55' : debt.status === 'DEFAULTED' ? 'bg-[#3d0f0f]/20 border-red-900' : 'bg-black/60 border-[#113111]'}`}
                      >
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-[8px] bg-[#112c11] px-1.5 rounded text-white font-bold">{debt.id}</span>
                            <span className="font-bold text-[#00ff44] uppercase">{debt.debtorId} owes {debt.creditorId}</span>
                            <span className="text-yellow-400">({debt.dealType})</span>
                          </div>
                          <p className="text-gray-300">"{debt.description}"</p>
                          <div className="text-[8.5px] text-gray-500">
                            MAGNITUDE: {debt.magnitude}/5 | EXPIRES IN {debt.horizonTicks - (currentTick - debt.tickIncurred)} TICKS ({debt.status})
                          </div>
                        </div>

                        {debt.status === 'ACTIVE' && debt.creditorId === playerCountryId && selectedActiveUnRes && (
                          <button
                            onClick={() => callInDiplomaticDebt(debt.id, selectedActiveUnRes.id)}
                            className="bg-emerald-950 border border-green-500 hover:bg-[#00ff44]/15 px-3 py-1.5 rounded font-bold uppercase transition-all whitespace-nowrap"
                          >
                            CALL DEBT
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace C: ICJ & TRIBUNALS CHANCERY */}
        {activeSubTab === 'COURT' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Legal Referral Composer - Left (4 Cols) */}
            <div className="col-span-12 lg:col-span-4 p-3.5 border border-[#163a16]/45 bg-[#030d03] rounded-md flex flex-col justify-between text-[10px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                  <BookOpen className="w-4 h-4 text-green-400" /> REFERRAL DOCKET COMPOSER
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">RESPONDENT ACTOR</span>
                    <select
                      value={legalRespondent}
                      onChange={(e) => setLegalRespondent(e.target.value)}
                      className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none"
                    >
                      {globalNations.map(cid => (
                        <option key={cid} value={cid}>{countries[cid]?.name} ({cid})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[8px] text-gray-500 block mb-1">CAUSA BELLI CLAIMS CATEGORY</span>
                    <select
                      value={legalClaimType}
                      onChange={(e: any) => setLegalClaimType(e.target.value)}
                      className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none"
                    >
                      <option value="SOVEREIGNTY_VIOLATION">SOVEREIGNTY VIOLATIONS AND TRESPASS</option>
                      <option value="TERRITORY">TERRITORIAL COMPLAINTS</option>
                      <option value="WAR_CRIMES">ALLEGED ATROCITIES / WAR BREACHES</option>
                      <option value="TREATY_BREACH">UNILATERAL TREATY BREACH DISPUTE</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-gray-500 block mb-1">FORENSIC VECTOR</span>
                      <select
                        value={legalSourceProvenance}
                        onChange={(e: any) => setLegalSourceProvenance(e.target.value)}
                        className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none text-[9.5px]"
                      >
                        <option value="SIGINT">SIGINT ANALYSIS</option>
                        <option value="IMINT">IMINT SATELLITE</option>
                        <option value="HUMINT">HUMINT DOSSIERS</option>
                        <option value="PUBLIC_NGO">PUBLIC NGO REPORTS</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[8px] text-gray-500 block mb-1">CONFIDENCE MATRIX</span>
                      <select
                        value={legalIntelligenceConfidence}
                        onChange={(e: any) => setLegalIntelligenceConfidence(e.target.value)}
                        className="w-full bg-black border border-[#0d2e0d] text-green-400 p-1.5 rounded outline-none text-[9.5px]"
                      >
                        <option value="HIGH">HIGH (CONFIRMED)</option>
                        <option value="MEDIUM">MEDIUM (SITUATIONAL)</option>
                        <option value="LOW">LOW (CIRCUMSTANTIAL)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFileLegal}
                className="bg-emerald-950 border border-green-400 text-[#00ff44] hover:bg-[#00ff44]/15 px-4 py-2 mt-4 rounded font-bold uppercase transition-all w-full"
              >
                SUBMIT SUIT CASE REFERRAL
              </button>
            </div>

            {/* Legal Dossiers Display - Center/Right (8 Cols) */}
            <div className="col-span-12 lg:col-span-8 p-3.5 border border-[#163a16]/45 bg-[#030903] rounded-md">
              <div className="flex justify-between items-center text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3">
                <span className="flex items-center gap-1.5 font-bold">
                  <Gavel className="w-4 h-4 text-green-400" /> REGISTERED ICJ CASES & TRIBUNALS
                </span>
                <span className="text-[8.5px] text-gray-500">CANONICAL LEGAL SYSTEM REALTIME DOCKETS</span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.values(icjCases).length === 0 && Object.values(tribunals).length === 0 && (
                  <div className="text-center py-12 text-gray-500 uppercase text-[10px]">
                    Court rooms are empty. Register territorial complaints or human rights indictments.
                  </div>
                )}

                {/* Sub-block of active ICJ Cases */}
                {Object.values(icjCases).map((icj) => (
                  <div key={icj.id} className="p-3 border border-[#113111] bg-black/50 rounded text-[10px]">
                    <div className="flex justify-between border-b border-[#113111]/45 pb-1 mb-2 items-center">
                      <div className="flex gap-2 items-center">
                        <span className="text-[8px] bg-emerald-950 px-1.5 rounded text-[#00ff44] font-bold">{icj.id}</span>
                        <span className="text-white hover:underline uppercase font-bold">{icj.applicantId} vs {icj.respondentId}</span>
                      </div>
                      <span className="text-yellow-400 uppercase font-bold text-[9px]">{icj.proceduralStage}</span>
                    </div>

                    <div className="space-y-1 leading-relaxed">
                      <div><span className="text-gray-500">CLAIM LEVEL:</span> <span className="text-gray-200">{icj.claimType}</span></div>
                      <div><span className="text-gray-500">ADMISSIBLE FORCE:</span> <span className="text-green-400 font-bold">{icj.evidenceBundle.admissibilityScore}%</span> (CONF: {icj.evidenceBundle.intelligenceConfidence})</div>
                      {icj.interimMeasuresDecreed && (
                        <div className="text-[9.5px] bg-[#071907] p-1.5 border border-[#124112] rounded text-emerald-300 font-bold mb-1">
                          COURT MANDATE: {icj.interimMeasuresDecreed}
                        </div>
                      )}
                      {icj.proceduralStage !== 'DECIDED' && (
                        <div className="text-gray-400 text-[8.5px]">
                          Pending case evaluation hearings. Approx. <span className="text-[#00ff44]">{icj.ticksToNextStage}</span> ticks left.
                        </div>
                      )}
                      
                      {icj.finalFinding && (
                        <div className="p-1.5 bg-emerald-950/20 border border-emerald-900 rounded text-[9.5px]">
                          <span className="text-[#00ff44] font-bold block uppercase mb-1">JUDGMENT RECORDED:</span>
                          <span className="text-white">The court declares Respondent culpability: </span>
                          <span className="font-bold text-yellow-400 font-bold">{icj.finalFinding}</span>
                        </div>
                      )}

                      {/* Escalation options to War Crimes Tribunal */}
                      {icj.applicantId === playerCountryId && icj.proceduralStage === 'DECIDED' && icj.finalFinding === 'RESPONDENT_GUILTY' && (
                        <div className="mt-3.5 border-t border-[#112d11] pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              escalateCaseToTribunal(icj.id, 'High Operational Command');
                              pushTerminalLine(`ICJ CASE: Indicted elite respondent officers referred for war crimes arrests.`, 'CRITICAL');
                            }}
                            className="bg-emerald-950 border border-green-500 hover:bg-[#00ff44]/15 px-3 py-1 text-[9px] font-bold uppercase transition-all rounded"
                          >
                            ESCALATE TO WAR CRIMES TRIBUNAL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Sub-block of active Tribunals */}
                {Object.values(tribunals).map((t) => (
                  <div key={t.id} className="p-3 border border-red-950 bg-red-950/5 rounded text-[10px] space-y-1">
                    <div className="flex justify-between items-center border-b border-red-950/50 pb-1 mb-1">
                      <span className="text-red-400 uppercase font-bold tracking-widest text-[9px]">WAR CRIMES TRIBUNAL INQUIRY</span>
                      <span className="text-[8.5px] bg-red-950 px-1 text-red-300 font-bold rounded">{t.escalationLevel}</span>
                    </div>
                    <div className="space-y-1">
                      <div><span className="text-gray-500">SUBJECT TARGET:</span> <span className="text-white uppercase font-bold">{t.namedResponsibilitySubject}</span> [@{t.targetCountryId}]</div>
                      <div><span className="text-gray-500">PROBATILITY RATING:</span> <span className="text-red-400 font-bold">CONVICTION VERY LIKELY</span> (Index {t.internationalConsequencesRating}/10)</div>
                      <div className="text-[8.5px] text-gray-400">
                        {t.linkedEventLogs[t.linkedEventLogs.length - 1]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Workspace D: SOVEREIGN REPUTATIONS MODULE */}
        {activeSubTab === 'REPUTATION' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Global Reputations Grid - Left & Center (8 Cols) */}
            <div className="col-span-12 lg:col-span-8 p-3.5 border border-[#163a16]/45 bg-[#030903] rounded-md text-[10px]">
              <div className="flex justify-between items-center text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3 font-bold">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-green-400" /> SOVEREIGN INSTITUTIONAL DIMENSION MATRIX
                </span>
                <span className="text-[8.5px] text-gray-500">MULTILATERAL CAPITALS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-[#113111]/70 text-[8.5px] text-gray-400 uppercase">
                      <th className="py-2">POWER</th>
                      <th>LEGALITY</th>
                      <th>HUMANITARIAN</th>
                      <th>OBSTRUCTIONISM</th>
                      <th>PROCEDURAL</th>
                      <th>DEFAULT VECTOR</th>
                      <th>FAITH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(countries).slice(0, 10).map((c) => {
                      const memory = institutionalMemories[c.id] || {
                        habitualVetoCount: 1,
                        opportunisticAbstentions: 1,
                        goodFaithDebtRatio: 0.85,
                        democraticNormEntrepreneurship: 50,
                        sabotageActsCount: 0
                      };

                      // Aggregate customized dimensions calculations based on memory and alliance
                      const calculatedLegality = Math.round(Math.max(10, 85 - memory.sabotageActsCount * 12 + (memory.democraticNormEntrepreneurship * 0.15)));
                      const calcHumanitarian = Math.round(memory.democraticNormEntrepreneurship);
                      const obstructionCount = memory.habitualVetoCount;

                      return (
                        <tr key={c.id} className="border-b border-[#112d11]/45 hover:bg-emerald-950/10">
                          <td className="py-2.5 font-bold text-white uppercase text-[10px]">{c.name} ({c.id})</td>
                          <td className="text-[#00ff44]">{calculatedLegality}/100</td>
                          <td className="text-emerald-300">{calcHumanitarian}/100</td>
                          <td className="text-red-400 font-bold">{obstructionCount} Veto(es)</td>
                          <td className="text-yellow-400">Stable</td>
                          <td className="text-gray-400">0.05%</td>
                          <td className="text-[#00ff44] font-bold">{Math.round(memory.goodFaithDebtRatio * 100)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UN Reform Action - Right (4 Cols) */}
            <div className="col-span-12 lg:col-span-4 p-3.5 border border-[#163a16]/45 bg-[#030d03] rounded-md flex flex-col justify-between text-[10px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 uppercase border-b border-[#0f300f] pb-1.5 mb-3 font-bold">
                  <ShieldAlert className="w-4 h-4 text-[#00ff44]" /> UN CONSTITUTIONAL REFORM WORKSTATION
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                    Excessive Security Council deadlocks and P5 vetos can trigger global trust collapse, agitating the Assembly for basic structural reforms. High Risk / High Reward.
                  </p>

                  <div className="p-3 border border-yellow-700/40 bg-yellow-950/15 rounded text-center">
                    <span className="text-[8px] text-yellow-500 font-bold uppercase block mb-1">REFORM MOBILIZATION</span>
                    {unscReformStatus.activeReformCrisis ? (
                      <div className="space-y-4">
                        <span className="text-white uppercase font-bold text-[11px] block">CONSTITUTION STATUS: IN CRISIS</span>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-gray-400 uppercase">
                            <span>REFORM SUCCESS PROGRESS:</span>
                            <span>{unscReformStatus.reformCoersionLevel}%</span>
                          </div>
                          <div className="w-full bg-[#050f05] border border-emerald-900 h-2 flex rounded overflow-hidden">
                            <div className="bg-[#00ff44] h-full" style={{ width: `${unscReformStatus.reformCoersionLevel}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-1.5 justify-center mt-3">
                          <button
                            onClick={() => voteInReformCrisis(playerCountryId, true)}
                            className="bg-emerald-950 border border-green-400 text-[9px] hover:bg-[#00ff44]/15 px-3 py-1 rounded"
                          >
                            SUPPORT REFORM
                          </button>
                          <button
                            onClick={() => voteInReformCrisis(playerCountryId, false)}
                            className="bg-black border border-red-500/60 text-[9px] hover:bg-red-950/20 px-3 py-1 rounded"
                          >
                            OPPOSE REFORM
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-gray-400 text-[10px] block">System checks display standard administrative balances.</span>
                        <button
                          onClick={() => triggerUNSCReformCrisis()}
                          className="bg-emerald-950 border border-green-500/70 hover:bg-[#00ff44]/15 text-[9.5px] uppercase font-bold px-4 py-2 mt-2 rounded transition-all"
                        >
                          FORCE ACTION REFORM AGITATION
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* History / Timeline Log of reputation changes */}
              <div className="border-t border-[#0d2e0d] pt-3.5 mt-3 max-h-36 overflow-y-auto space-y-1.5">
                <span className="text-[8px] text-gray-500 block uppercase mb-1">Chancery Legal Logs:</span>
                {reputationShifts.slice(-3).reverse().map((r, idx) => (
                  <div key={idx} className="p-1 bg-[#040e04] rounded border border-[#112d11] text-[8px]">
                    <span className="text-yellow-400 italic font-bold">[{r.countryId}]</span>: {r.reason} (<span className={r.delta > 0 ? 'text-green-400' : 'text-red-400'}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>)
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PanelFxShell>
  );
}
