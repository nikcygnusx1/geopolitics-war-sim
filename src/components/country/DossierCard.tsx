import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFogOfWarStore } from '../../store/fogOfWarStore';
import { useClockStore } from '../../store/clockStore';
import { getLeaderProfile } from '../../data/leaders';
import { LeaderPortrait } from './LeaderPortrait';
import { fmtB, fmtInt, fmtDate, fmtPop } from '../../utils/format';
import { audio } from '../../utils/audio';

interface DossierCardProps {
  countryId: string;
  onClose: () => void;
}

export const DossierCard: React.FC<DossierCardProps> = ({ countryId, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const country = useWorldStore((state) => state.countries[countryId]);
  const playerCountryId = usePlayerStore((state) => state.countryId);
  const hudMode = usePlayerStore((state) => state.hudMode);
  
  // Fog of war check (Section 7)
  const fogEntry = useFogOfWarStore((state) => state.fog[countryId]);
  const currentTick = useWorldStore((state) => state.currentTick);
  const calendarDate = useClockStore((state) => state.currentCalendarDate);

  if (!country) return null;

  const intelLevel = fogEntry ? fogEntry.intelLevel : 0;
  const leader = getLeaderProfile(countryId);

  // Redacted helpers (Section 9.3)
  const isRedacted = (requiredLevel: number) => intelLevel < requiredLevel;

  const renderValueOrRedacted = (requiredLevel: number, displayValue: string | React.ReactNode) => {
    if (isRedacted(requiredLevel)) {
      return (
        <span className="bg-[#1a3d13] text-[#1a3d13] px-2 rounded cursor-help font-bold tracking-widest hover:text-[#00ff44] hover:bg-[#1a4a1a]/40 transition-all select-none" title="REDACTED - INVEST INTEL TO REVEAL">
          ██████████
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur select-none font-mono">
      <div className="dossier-container w-full max-w-[650px] min-h-[480px]">
        {/* flip transition wrappers */}
        <div 
          onClick={(e) => {
            // only flips if clicking specific outer handles
            if (e.target === e.currentTarget) {
              audio.sfxKeyClick();
              setFlipped(!flipped);
            }
          }}
          className={`dossier-card relative w-full min-h-[480px] shadow-2xl rounded text-green-400 transform-style preserve-3d transition-transform duration-500 cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
        >
          
          {/* DOSSIER FRONT SHEET: Manila folder classified folder look */}
          <div className="dossier-front absolute inset-0 backface-hidden bg-[#241e12] border-2 border-[#5c4a30] p-6 rounded flex flex-col justify-between cursor-default">
            <div>
              <div className="border-b-2 border-red-700/80 pb-2 mb-4 flex justify-between items-center text-xs font-bold text-red-500">
                <span className="tracking-widest">⚠️ TOP SECRET // COGNITIVE RECON // C1-Z9</span>
                <span>NO FORN / ORCON</span>
              </div>

              <div className="bg-[#16120b] border border-[#5c4a30] p-4 rounded text-center my-6">
                <div className="text-[28px] font-bold text-[#ffb300] tracking-wide mb-1 select-all">
                  CLASSIFIED DOSSIER
                </div>
                <div className="text-[11px] text-gray-500 tracking-widest uppercase">
                  CENTRAL INTELLIGENCE AGENCY DIRECTORY
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#dfba88] py-4">
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span>SUBJECT DIRECTIVE ID:</span>
                  <span className="font-bold text-white tracking-widest">{countryId}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span>NATION NAME STATE:</span>
                  <span className="font-bold text-white uppercase">{country.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span>RECORDING CHRONO:</span>
                  <span className="font-bold text-white">{fmtDate(calendarDate)}</span>
                </div>
                <div className="flex justify-between border-b border-[#5c4a30]/30 pb-1">
                  <span>INTELLIGENCE RELIABILTY:</span>
                  <span className="font-bold text-white">LEVEL {intelLevel}/3 // {intelLevel === 3 ? 'FULL INTEGRITY' : intelLevel === 2 ? 'PARTIAL SCAN' : 'RESTRICTED REDACTED'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-[#5c4a30]/50 pt-4 mt-2">
              <span className="text-[8px] text-gray-500 uppercase">
                CRIM PROTOCOL 14A. ACC SUB TO CODE REVEAL.
              </span>
              <button
                onClick={() => { audio.sfxKeyClick(); setFlipped(true); }}
                className="px-4 py-1.5 bg-[#4c3a1e] hover:bg-[#ffb300] hover:text-black border border-[#ffb300] text-[10px] text-[#ffb300] font-bold uppercase rounded cursor-pointer transition-all"
              >
                OPEN DOSSIER FOLDER &gt;&gt;
              </button>
            </div>
          </div>

          {/* DOSSIER BACK SHEET: Geopolitical and Military stats */}
          <div className="dossier-back absolute inset-0 rotate-y-180 backface-hidden bg-[#050c05] border-2 border-[#1a5c1a] p-4 rounded flex flex-col justify-between cursor-default">
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Dossier Header */}
              <div className="flex justify-between items-start border-b border-[#1a5c1a] pb-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flagEmoji}</span>
                    <h2 className="text-[#00ff44] text-sm font-bold uppercase tracking-wider font-display">
                      {country.name}
                    </h2>
                  </div>
                  <div className="text-[9px] text-[#00e5ff] tracking-widest font-bold mt-0.5">
                    SUBJECT PROFILE DIRECTIVES MATCH
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { audio.sfxKeyClick(); setFlipped(false); }}
                    className="border border-[#1a5c1a]/50 text-gray-500 hover:text-[#ffb300] hover:border-[#ffb300] text-[8px] px-2 py-1 rounded"
                    title="Flip back"
                  >
                    COVERS
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); onClose(); }}
                    className="border-red-800 text-red-500 hover:bg-[#ff2244]/10 text-[10px] px-2 py-0.5 font-bold border rounded cursor-pointer"
                  >
                    CLOSE [X]
                  </button>
                </div>
              </div>

              {/* Dossier Body with Portrait */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 min-h-0 overflow-y-auto custom-scrollbar flex-1 pr-1">
                
                {/* Portrait + Basic Information */}
                <div className="sm:col-span-4 flex flex-col items-center border-r border-[#1a5c1a]/30 pr-2">
                  <LeaderPortrait countryId={countryId} />
                  <div className="text-center mt-2 w-full text-[10px]">
                    <span className="text-white block font-bold truncate leading-tight">
                      {renderValueOrRedacted(1, leader.name)}
                    </span>
                    <span className="text-gray-400 block text-[8px] uppercase">
                      {renderValueOrRedacted(1, `${leader.title} — AGE ${leader.age}`)}
                    </span>
                    <span className="text-[#ffb300] block text-[8px] tracking-wide mt-1">
                      {renderValueOrRedacted(1, `IN POWER: ${leader.yearsInPower} YRS`)}
                    </span>
                  </div>
                </div>

                {/* Country Ingress Details Column */}
                <div className="sm:col-span-8 space-y-2.5 text-[10px]">
                  
                  {/* Row 1: Ideological Alignments */}
                  <div className="grid grid-cols-2 gap-2 border-b border-[#0d2e0d]/50 pb-1.5">
                    <div>
                      <span className="text-green-600 block text-[8px]">IDEOLOGY CATEGORY:</span>
                      <span className="text-white font-bold">{renderValueOrRedacted(1, country.political.ideology)}</span>
                    </div>
                    <div>
                      <span className="text-green-600 block text-[8px]">ALLIANCE BLOCKS:</span>
                      <span className="text-[#00ff44] font-bold">{renderValueOrRedacted(1, country.allianceBlock)}</span>
                    </div>
                  </div>

                  {/* Row 2: Economical Metrics */}
                  <div className="grid grid-cols-2 gap-2 border-b border-[#0d2e0d]/50 pb-1.5">
                    <div>
                      <span className="text-green-600 block text-[8px]">GDP VALUE RATIO:</span>
                      <span className="text-[#00e5ff] font-bold">{renderValueOrRedacted(2, fmtB(country.economic.gdpB))}</span>
                    </div>
                    <div>
                      <span className="text-green-600 block text-[8px]">POPULATION:</span>
                      <span className="text-white">{renderValueOrRedacted(1, fmtPop(country.population))}</span>
                    </div>
                  </div>

                  {/* Row 3: Domestic Gages */}
                  <div className="space-y-1 bg-black/40 p-1.5 rounded border border-[#0d2e0d]">
                    <div className="flex justify-between text-[8px]">
                      <span>STABILITY INDEX STATUS:</span>
                      <span className="text-green-400 font-bold">{renderValueOrRedacted(2, `${country.political.stabilityIndex.toFixed(0)}%`)}</span>
                    </div>
                    {!isRedacted(2) && (
                      <div className="w-full h-1.5 bg-[#0d2e0d] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${country.political.stabilityIndex}%` }} />
                      </div>
                    )}

                    <div className="flex justify-between text-[8px] mt-1.5">
                      <span>POPULAR UNREST FORCE:</span>
                      <span className="text-red-400 font-bold">{renderValueOrRedacted(2, `${country.political.popularUnrest.toFixed(0)}%`)}</span>
                    </div>
                    {!isRedacted(2) && (
                      <div className="w-full h-1.5 bg-[#0d2e0d] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 animate-pulse" style={{ width: `${country.political.popularUnrest}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Row 4: Nuclear doctrines & covert intelligence threat levels */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-[9px]">
                    <div>
                      <span className="text-green-600 block text-[8px]">NUCLEAR WEAPON DISPATCH:</span>
                      <span className="text-white font-bold">{renderValueOrRedacted(3, country.arsenal.nuclearCapable ? 'CAPABLE ☢' : 'NONE')}</span>
                    </div>
                    <div>
                      <span className="text-green-600 block text-[8px]">Hostility to US:</span>
                      <span className="text-red-500 font-bold">{renderValueOrRedacted(2, `${(country.opinions[playerCountryId] || 0) < 0 ? 'HOSTILE' : 'STABLE'} (${(country.opinions[playerCountryId] || 0).toFixed(0)})`)}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Dossier Bottom Interactive Actions context row */}
            <div className="border-t border-[#1a5c1a] pt-2.5 mt-2 flex flex-wrap gap-2 shrink-0 select-none">
              {hudMode === 'STATE' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleProposeAlliance}
                    className="flex-1 min-w-[90px] py-1 border border-[#00ff44] text-[8px] font-bold text-[#00ff44] rounded uppercase hover:bg-[#00ff44]/15 cursor-pointer"
                  >
                    PROPOSE ALLIANCE
                  </button>
                  <button
                    onClick={handleSendAid}
                    className="flex-1 min-w-[95px] py-1 border border-[#00e5ff] text-[8px] font-bold text-[#00e5ff] rounded uppercase hover:bg-[#00e5ff]/15 cursor-pointer"
                  >
                    SEND AID $5B
                  </button>
                  <button
                    onClick={handleImposeSanctions}
                    className="flex-1 min-w-[90px] py-1 border border-[#ff2244] text-[8px] font-bold text-[#ff2244] rounded uppercase hover:bg-[#ff2244]/15 cursor-pointer"
                  >
                    SANCTION
                  </button>
                </>
              )}

              {hudMode === 'WAR_ROOM' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleSetTarget}
                    className="flex-1 min-w-[120px] py-1.5 bg-red-950 border border-red-500 text-[9px] font-bold text-red-500 rounded uppercase hover:bg-[#ff2244]/20 cursor-pointer animate-pulse"
                  >
                    LOCK AS MISSILE TARGET
                  </button>
                </>
              )}

              {hudMode === 'ANALYST' && countryId !== playerCountryId && (
                <>
                  <button
                    onClick={handleCovertOp}
                    className="flex-1 min-w-[120px] py-1 border border-[#ffb300] text-[9px] font-bold text-[#ffb300] rounded uppercase hover:bg-[#ffb300]/15 cursor-pointer"
                  >
                    LAUNCH COVERT SPY EXPAND (+1 INTEL)
                  </button>
                </>
              )}

              <span className="text-[7px] text-gray-600 uppercase block w-full text-center mt-1">
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
