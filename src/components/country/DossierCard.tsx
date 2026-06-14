import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useClockStore } from '../../store/clockStore';
import { getLeaderProfile } from '../../data/leaders';
import { useLeaderStore } from '../../store/leaderStore';
import { LeaderPortrait } from './LeaderPortrait';
import { fmtB, fmtDate, fmtPop } from '../../utils/format';
import { audio } from '../../utils/audio';
import { LeaderPersonality } from '../../types';
import { generateLeaderPortrait } from '../../utils/portraitGenerator';

interface DossierCardProps {
  countryId: string;
  onClose: () => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({ countryId, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const [activeTab, setActiveTab ] = useState<'GENERAL' | 'MILITARY' | 'COVERT'>('GENERAL');
  
  const country = useWorldStore((state) => state.countries[countryId]);
  const playerCountryId = usePlayerStore((state) => state.countryId);
  const hudMode = usePlayerStore((state) => state.hudMode);
  
  // Fog of war check
  const fogEntry = useFogOfWarStore((state) => state.fog[countryId]);
  const currentTick = useWorldStore((state) => state.currentTick);
  const calendarDate = useClockStore((state) => state.currentCalendarDate);

  if (!country) return null;

  const intelLevel = fogEntry ? fogEntry.intelLevel : 0;
  const staticLeader = getLeaderProfile(countryId);
  const activeLeader = useLeaderStore((state) => state.leadersByCountryId[countryId]);

  // Redacted helpers
  const isRedacted = (requiredLevel: number) => intelLevel < requiredLevel;

  const renderValueOrRedacted = (requiredLevel: number, displayValue: string | React.ReactNode) => {
    if (isRedacted(requiredLevel)) {
      return (
        <span className="bg-[#ff2244]/15 text-[#ff2244] border border-[#ff2244]/30 px-1 py-0.5 rounded text-[8px] tracking-wide font-bold uppercase select-none blink" title="CLASSIFIED - SIGNAL PENETRATION LEVEL TOO LOW">
          [CLASSIFIED]
        </span>
      );
    }
    return displayValue;
  };

  const handleProposeAlliance = () => {
    audio.sfxUNVote();
    useWorldStore.getState().addGlobalEvent(`Alliance Proposal sent from ${playerCountryId} to ${countryId}`, 'INFO');
    // Drift opinion
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      draft.opinions[playerCountryId] = Math.min(100, (draft.opinions[playerCountryId] || 0) + 15);
    });
  };

  const handleSendAid = () => {
    audio.sfxUNVote();
    const aidAmount = 5.0; // $5B
    useWorldStore.getState().updateCountry(playerCountryId, (draft) => {
      draft.economic.treasuryCashB = Math.max(0, draft.economic.treasuryCashB - aidAmount);
    });
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB += aidAmount;
      draft.opinions[playerCountryId] = Math.min(100, (draft.opinions[playerCountryId] || 0) + 20);
    });
    usePlayerStore.getState().syncCashFromCountry();
    useWorldStore.getState().addGlobalEvent(`Economic Aid dispatch of ${fmtB(aidAmount)} sent to ${country.name}`, 'INFO');
  };

  const handleImposeSanctions = () => {
    audio.sfxKlaxon();
    useWorldStore.getState().updateCountry(countryId, (draft) => {
      if (!draft.economic.sanctionedBy.includes(playerCountryId)) {
        draft.economic.sanctionedBy.push(playerCountryId);
      }
      draft.opinions[playerCountryId] = Math.max(-100, (draft.opinions[playerCountryId] || 0) - 25);
    });
    useWorldStore.getState().addGlobalEvent(`${playerCountryId} has imposed full unilateral sanctions on ${country.name}`, 'WARNING');
  };

  const handleSetTarget = () => {
    audio.sfxRadarPing();
    usePlayerStore.getState().setTargetCountry(countryId);
    useWorldStore.getState().addGlobalEvent(`Strike target locked: ${country.name}`, 'WARNING');
  };

  const handleCovertOp = () => {
    audio.sfxFactionAlert();
    useWorldStore.getState().addGlobalEvent(`Covert Operational Network established in ${countryId}. Signals scanning initiated.`, 'INFO');
    useFogOfWarStore.getState().setIntelLevel(countryId, Math.min(3, intelLevel + 1) as any, currentTick);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="dossier-wrapper w-full max-w-[540px] min-h-[500px]">
        {/* flip transition wrappers */}
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audio.sfxKeyClick();
              setFlipped(!flipped);
            }
          }}
          className={`dossier-card-3d relative w-full min-h-[500px] rounded text-green-400 cursor-pointer ${flipped ? 'dir-flipped' : ''}`}
        >
          
          {/* DOSSIER FRONT SHEET: Manila folder classified folder look */}
          <div className="dossier-front absolute inset-0 backface-hidden p-6 rounded flex flex-col justify-between cursor-default border border-[#5c4a30]">
            <div>
              <div className="border-b-2 border-red-700/80 pb-2 mb-4 flex justify-between items-center">
                <span className="classification text-red-500">⚠️ TOP SECRET // COGNITIVE RECON // C1-Z9</span>
                <span className="classification">NO FORN / ORCON</span>
              </div>

              <div className="bg-[#120e07] border border-[#5c4a30]/60 p-4 rounded text-center my-6 relative overflow-hidden">
                <div className="chrome-header text-[#ffb300] mb-1 select-all relative z-10" style={{ fontSize: '28px' }}>
                  CLASSIFIED DOSSIER
                </div>
                <div className="chrome-subtle text-gray-500 relative z-10">
                  CENTRAL INTELLIGENCE AGENCY DIRECTORY
                </div>
              </div>

              {/* Tilted custom physical stamp */}
              <div className="classified-stamp classification">
                CLASSIFIED
              </div>

              <div className="space-y-3 py-4">
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span className="field-label text-[#dfba88]">SUBJECT DIRECTIVE ID:</span>
                  <span className="data-value text-white font-bold tracking-widest">{countryId}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span className="field-label text-[#dfba88]">NATION NAME STATE:</span>
                  <span className="chrome-header text-white uppercase" style={{ fontSize: '11px' }}>{country.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span className="field-label text-[#dfba88]">RECORDING CHRONO:</span>
                  <span className="data-inline text-white font-bold">{fmtDate(calendarDate)}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span className="field-label text-[#dfba88]">INTELLIGENCE RELIABILTY:</span>
                  <span className="chrome text-white font-bold">LEVEL {intelLevel}/3 // {intelLevel === 3 ? 'FULL INTEGRITY' : intelLevel === 2 ? 'PARTIAL SCAN' : 'RESTRICTED REDACTED'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-[#5c4a30]/50 pt-4 mt-2">
              <span className="chrome-subtle text-gray-500">
                CRIM PROTOCOL 14A. ACC SUB TO CODE REVEAL.
              </span>
              <button
                onClick={() => { audio.sfxKeyClick(); setFlipped(true); }}
                className="btn-sovereign text-[#ffb300] border-[#ffb300] hover:bg-[#ffb300]/10"
              >
                OPEN DOSSIER FOLDER &gt;&gt;
              </button>
            </div>
          </div>

          {/* DOSSIER BACK SHEET: Geopolitical, Military, and Covert multi-tab dossier dossier-card */}
          <div className="dossier-back dossier-card absolute inset-0 rotate-y-180 backface-hidden bg-[#050c05] border-2 border-[#1a5c1a] p-4 rounded flex flex-col justify-between cursor-default">
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Dossier Header */}
              <div className="flex justify-between items-start border-b border-[#1a5c1a] pb-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flagEmoji}</span>
                    <h2 className="chrome-header text-[#00ff44]" style={{ fontSize: '13px' }}>
                      {country.name}
                    </h2>
                  </div>
                  <div className="chrome-subtle text-[#00e5ff] font-bold mt-0.5">
                    INTELLIGENCE COGNITIVE DOSSIER DATA
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => { audio.sfxKeyClick(); setFlipped(false); }}
                    className="btn-sovereign text-gray-400 border-gray-600/30 hover:text-[#ffb300] hover:border-[#ffb300] py-0.5 px-2"
                    title="Flip back to front cover folder"
                  >
                    COVERS
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); onClose(); }}
                    className="btn-sovereign text-red-500 border-red-800 hover:bg-[#ff2244]/10 py-0.5 px-2"
                  >
                    CLOSE [X]
                  </button>
                </div>
              </div>

              {/* Multi-Tab Selector Header Row */}
              <div className="flex border-b border-[#113a11] pb-1.5 mb-2 gap-1.5 justify-center sm:justify-start">
                {(['GENERAL', 'MILITARY', 'COVERT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { audio.sfxKeyClick(); setActiveTab(tab); }}
                    className={`px-3 py-1 text-[9px] border transition-all ${
                      activeTab === tab
                        ? 'btn-sovereign bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]'
                        : 'btn-sovereign text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Dossier Body with tab contents */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 min-h-0 overflow-y-auto custom-scrollbar flex-1 pr-1">
                
                {/* Left Column: Portrait & metadata */}
                <div className="sm:col-span-4 flex flex-col items-center border-r border-[#1a5c1a]/30 pr-2">
                  <LeaderPortrait countryId={countryId} />
                  <div className="text-center mt-2 w-full">
                    <span className="chrome-header text-white block truncate leading-tight">
                      {renderValueOrRedacted(1, activeLeader?.name || staticLeader.name)}
                    </span>
                    <span className="chrome-subtle text-gray-400 block">
                      {renderValueOrRedacted(1, `${staticLeader.title} — AGE ${activeLeader ? (staticLeader.age - 5 + Math.floor(activeLeader.hawkDoveScore % 10)) : staticLeader.age}`)}
                    </span>
                    <span className="chrome text-[#ffb300] block mt-1">
                      {renderValueOrRedacted(1, `POWER CHRONO: ${(activeLeader?.source === 'INITIAL' ? staticLeader.yearsInPower : 0) + Math.floor((currentTick - (activeLeader?.installedAtTick || 0)) / 10)} YRS`)}
                    </span>

                    {/* Classified Temperament Details panel */}
                    {!isRedacted(1) && activeLeader && (
                      <div className="mt-3 p-1.5 bg-black/50 border border-[#1a5c1a]/40 rounded text-left text-[8px] font-mono leading-normal space-y-1">
                        <div className="flex justify-between items-center border-b border-[#0d1f0d] pb-0.5">
                          <span className="text-gray-500 uppercase">TEMPERAMENT:</span>
                          <select
                            value={activeLeader.type}
                            onChange={(e) => {
                              const newType = e.target.value as LeaderPersonality;
                              const currentTick = useWorldStore.getState().currentTick;
                              const currentLeader = useLeaderStore.getState().getLeader(countryId);
                              if (currentLeader) {
                                const rand = Math.random;
                                const updatedLeader = {
                                  ...currentLeader,
                                  type: newType,
                                  hawkDoveScore: Math.round(
                                    newType === LeaderPersonality.HAWK ? (80 + rand() * 20) :
                                    newType === LeaderPersonality.DOVE ? (10 + rand() * 20) :
                                    newType === LeaderPersonality.PRAGMATIST ? (40 + rand() * 25) :
                                    newType === LeaderPersonality.IDEOLOGUE ? (55 + rand() * 30) :
                                    (rand() * 100)
                                  ),
                                  riskTolerance: Math.round(
                                    newType === LeaderPersonality.HAWK ? (70 + rand() * 30) :
                                    newType === LeaderPersonality.DOVE ? (15 + rand() * 35) :
                                    newType === LeaderPersonality.PRAGMATIST ? (40 + rand() * 30) :
                                    newType === LeaderPersonality.IDEOLOGUE ? (50 + rand() * 25) :
                                    (30 + rand() * 70)
                                  ),
                                  portraitSeed: `${countryId}_re_${newType}_${currentTick}_${Date.now()}`
                                };
                                updatedLeader.portraitDataUrl = generateLeaderPortrait(newType, updatedLeader.portraitSeed);
                                useLeaderStore.getState().setLeader(countryId, updatedLeader);
                                useWorldStore.getState().addGlobalEvent(
                                  `Intel Action: ${country.name} leader personality re-assigned to ${newType}. Modifiers updated.`,
                                  'WARNING'
                                );
                              }
                            }}
                            className="bg-black/80 border border-[#1a5c1a]/60 text-[8px] px-1 py-0.5 rounded font-mono text-[#00ff44] focus:outline-none focus:border-[#00ff44] cursor-pointer"
                          >
                            <option value="HAWK" className="text-red-500 bg-black">HAWK</option>
                            <option value="DOVE" className="text-green-400 bg-black font-bold">DOVE</option>
                            <option value="PRAGMATIST" className="text-cyan-400 bg-black">PRAGMATIST</option>
                            <option value="IDEOLOGUE" className="text-amber-400 bg-black">IDEOLOGUE</option>
                            <option value="UNPREDICTABLE" className="text-fuchsia-400 bg-black">UNPREDICTABLE</option>
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">HAWKISHNESS:</span>
                          <span className="text-[#00ff44] font-bold">{activeLeader.hawkDoveScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">RISK TOLERANCE:</span>
                          <span className="text-white font-bold">{activeLeader.riskTolerance}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 uppercase">ENTRY PATH:</span>
                          <span className="text-gray-400 uppercase font-bold text-[7px]">{activeLeader.source}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Active Tab Details */}
                <div className="sm:col-span-8 space-y-2.5">
                  {activeTab === 'GENERAL' && (
                    <div className="space-y-2.5 w-full">
                      <div className="grid grid-cols-2 gap-2 border-b border-[#0d2e0d]/50 pb-1.5">
                        <div>
                          <span className="field-label text-green-600 block">IDEOLOGY:</span>
                          <span className="chrome text-white font-bold">{renderValueOrRedacted(1, country.political.ideology)}</span>
                        </div>
                        <div>
                          <span className="field-label text-green-600 block">ALLIANCE BLOCK:</span>
                          <span className="chrome text-[#00ff44] font-bold">{renderValueOrRedacted(1, country.allianceBlock)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-b border-[#0d2e0d]/50 pb-1.5 block">
                        <div>
                          <span className="field-label text-green-600 block">GDP SIZE:</span>
                          <span className="readout text-[#00e5ff] font-bold block">{renderValueOrRedacted(2, fmtB(country.economic.gdpB))}</span>
                        </div>
                        <div>
                          <span className="field-label text-green-600 block">POPULATION:</span>
                          <span className="data-value text-white block">{renderValueOrRedacted(1, fmtPop(country.population))}</span>
                        </div>
                      </div>

                      {/* Gauges & Unrest metrics */}
                      <div className="space-y-1.5 bg-black/40 p-2 rounded border border-[#0d2e0d]">
                        <div className="flex justify-between items-center">
                          <span className="field-label">STABILITY INDEX:</span>
                          <span className="data-value text-green-400 font-bold">{renderValueOrRedacted(2, `${country.political.stabilityIndex.toFixed(0)}%`)}</span>
                        </div>
                        {!isRedacted(2) && (
                          <div className="w-full h-1 bg-[#0d2e0d] rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${country.political.stabilityIndex}%` }} />
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-1">
                          <span className="field-label">POPULAR UNREST FORCE:</span>
                          <span className="data-value text-red-400 font-bold">{renderValueOrRedacted(2, `${country.political.popularUnrest.toFixed(0)}%`)}</span>
                        </div>
                        {!isRedacted(2) && (
                          <div className="w-full h-1 bg-[#0d2e0d] rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 animate-pulse" style={{ width: `${country.political.popularUnrest}%` }} />
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-1">
                          <span className="field-label">LEADER APPROVAL RATIO:</span>
                          <span className="data-value text-[#00e5ff] font-bold">{renderValueOrRedacted(2, `${country.political.leaderApprovalRating.toFixed(0)}%`)}</span>
                        </div>
                        {!isRedacted(2) && (
                          <div className="w-full h-1 bg-[#0d2e0d] rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400" style={{ width: `${country.political.leaderApprovalRating}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'MILITARY' && (
                    <div className="space-y-2.5 w-full">
                      {/* Hardware stats list */}
                      <div className="bg-black/35 p-2 rounded border border-[#0d2e0d] space-y-1">
                        <span className="chrome text-green-600 block border-b border-[#0d2e0d] pb-1">OPERATIONAL HARDWARE LEDGER:</span>
                        {isRedacted(2) ? (
                          <div className="py-1 text-center">{renderValueOrRedacted(2, null)}</div>
                        ) : (
                          <div className="space-y-1">
                            {country.arsenal.units && country.arsenal.units.length > 0 ? (
                              country.arsenal.units.filter(u => u.count > 0).map((unit, uIdx) => (
                                <div key={uIdx} className="flex justify-between border-b border-[#0d1f0d]/35 pb-1">
                                  <span className="chrome-subtle text-gray-400 font-bold">{unit.type.replace('_', ' ')}</span>
                                  <span className="data-inline text-white font-bold">{unit.operational} / {unit.count} <span className="chrome-subtle text-gray-500">OP</span></span>
                                </div>
                              ))
                            ) : (
                              <div className="chrome-subtle text-gray-500 italic py-1 text-center">No strategic weaponry registered.</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Shield & Readiness values */}
                      <div className="grid grid-cols-2 gap-2 border-t border-[#0d2e0d]/50 pt-2">
                        <div>
                          <span className="field-label block">TROOP READINESS RATING:</span>
                          <span className="data-value text-[#ffb300] block">{renderValueOrRedacted(2, `${(country.arsenal.readinessLevel || 75).toFixed(0)}%`)}</span>
                        </div>
                        <div>
                          <span className="field-label block">ABM SHIELD CAPACITY:</span>
                          <span className="data-value text-[#00e5ff] block">{renderValueOrRedacted(2, `${(country.arsenal.abmShieldStrength || 0).toFixed(0)}%`)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'COVERT' && (
                    <div className="space-y-2.5 w-full">
                      <div className="grid grid-cols-1 gap-2 border-b border-[#0d2e0d]/50 pb-2">
                        <div>
                          <span className="field-label text-cyan-500 block">CYBER INTERNET DEFENSIBILITIES:</span>
                          <span className="chrome text-white block">{renderValueOrRedacted(3, `FIREWALL CAPACITY LEVEL ${country.intelligence.cyberFirewallLevel || 1}`)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-b border-[#0d2e0d]/50 pb-2">
                        <div>
                          <span className="field-label block">NUCLEAR ARSENAL ASSETS:</span>
                          <span className="chrome text-[#ff2244] font-bold block">{renderValueOrRedacted(3, country.arsenal.nuclearCapable ? 'CAPABLE ☢' : 'NONE')}</span>
                        </div>
                        <div>
                          <span className="field-label block">INTELLIGENCE SCAN CONFIDENCE:</span>
                          <span className="data-value text-[#ffb300] block">{renderValueOrRedacted(2, `${(country.intelligence.intelReportConfidence || intelLevel * 33).toFixed(0)}%`)}</span>
                        </div>
                      </div>

                      {/* Active covert spy ops listings */}
                      <div className="space-y-1">
                        <span className="field-label text-cyan-500 block">ACTIVE INFILTRATING OPERATIONS:</span>
                        {isRedacted(3) ? (
                          <div className="py-1">{renderValueOrRedacted(3, null)}</div>
                        ) : (
                          <div className="bg-[#020502] p-1.5 border border-[#1a3a1a] rounded max-h-16 overflow-y-auto">
                            {country.intelligence.activeCovertOps && country.intelligence.activeCovertOps.length > 0 ? (
                              country.intelligence.activeCovertOps.map((op, opI) => (
                                <div key={opI} className="text-[#00ff44] flex justify-between border-b border-[#0d1f0d] pb-0.5 mb-0.5">
                                  <span className="chrome">{op.type.replace('_', ' ')}</span>
                                  <span className="data-inline text-gray-400">CHRONO: {op.remainingTicks}t</span>
                                </div>
                              ))
                            ) : (
                              <div className="chrome-subtle text-gray-500 italic text-center py-1">No active clandestine missions traced.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* === SECTION 3.2: LIVE INTELLIGENCE LOGS SUB-WIDGET === */}
              <div className="mt-2.5 border-t border-[#1a5c1a]/40 pt-2 shrink-0">
                <div className="text-green-500 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#00ff44] rounded-full animate-ping text-[8px]" />
                  <span className="chrome">LIVE INTELLIGENCE FEED TELEMETRY</span>
                </div>
                <div className="space-y-1 max-h-[64px] overflow-y-auto custom-scrollbar">
                  {country.lastEventLog && country.lastEventLog.length > 0 ? (
                    country.lastEventLog.slice(0, 5).map((log, logIdx) => (
                       <div key={logIdx} className="bg-[#020502] p-1 border border-[#122e12] rounded flex items-start gap-1">
                        <span className="classification text-red-500 bg-red-950/40 px-1 border border-red-900 rounded select-none uppercase scale-95 shrink-0">INTEL</span>
                        <span className="data-inline flex-1 text-gray-300 truncate" title={log}>{log}</span>
                      </div>
                    ))
                  ) : (
                    <div className="chrome-subtle text-gray-500 italic py-1 text-center bg-[#020502] rounded border border-[#122e12]/50">No strategic telemetry logged for this geographic sector.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Dossier Bottom Interactive Actions context row */}
            <div className="border-t border-[#1a5c1a] pt-2 mt-2 flex flex-wrap gap-2 shrink-0 select-none">
              {hudMode === 'STATE' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleProposeAlliance}
                    className="btn-sovereign flex-1 min-w-[90px] py-1 border border-[#00ff44] text-[#00ff44] hover:bg-[#00ff44]/15"
                  >
                    PROPOSE ALLIANCE
                  </button>
                  <button
                    onClick={handleSendAid}
                    className="btn-sovereign flex-1 min-w-[95px] py-1 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/15"
                  >
                    SEND AID $5B
                  </button>
                  <button
                    onClick={handleImposeSanctions}
                    className="btn-sovereign flex-1 min-w-[90px] py-1 border border-[#ff2244] text-[#ff2244] hover:bg-[#ff2244]/15"
                  >
                    SANCTION
                  </button>
                </>
              )}

              {hudMode === 'WAR_ROOM' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleSetTarget}
                    className="btn-sovereign flex-1 min-w-[120px] py-1.5 bg-red-950/45 border border-red-500 text-red-500 hover:bg-[#ff2244]/20 animate-pulse"
                  >
                    LOCK AS MISSILE TARGET
                  </button>
                </>
              )}

              {hudMode === 'ANALYST' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleCovertOp}
                    className="btn-sovereign flex-1 min-w-[120px] py-1 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/15"
                  >
                    LAUNCH COVERT SPY EXPAND (+1 INTEL)
                  </button>
                </>
              )}

              <span className="classification text-gray-600 block w-full text-center mt-1">
                INTELLIGENT RECORD COMPILING SEC_M4. DO NOT RECORD TRACES.
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DossierCard;
