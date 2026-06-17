import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { usePropagandaStore, MediaOperation } from '../../store/propagandaStore';
import { useUIStore } from '../../store/uiStore';

export default function PropagandaPanel() {
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const playerCashB = usePlayerStore((s) => s.cashB);
  
  const propagandaStore = usePropagandaStore();
  const activeOps = propagandaStore.activeOperations;

  // Form local state
  const [localSpend, setLocalSpend] = useState<number>(1.5);
  const [localDirection, setLocalDirection] = useState<'DESTABILIZE' | 'STABILIZE'>('DESTABILIZE');

  // Find selected country details
  const targetCountryId = selectedTargetId || Object.keys(countries).find(id => id !== playerCountryId) || '';
  const targetCountry = countries[targetCountryId];
  
  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetCountry(e.target.value);
  };

  const handleLaunchOperation = () => {
    if (!targetCountryId || targetCountryId === playerCountryId) return;

    // Check if player has enough money to cover at least the first tick
    if (playerCashB < localSpend) {
      return; // UI will also disable
    }

    // Check if an operation is already running against this target
    const exists = activeOps.some(
      (o) => o.targetCountryId === targetCountryId && o.createdBy === 'PLAYER' && o.active
    );

    if (exists) {
      alert("EMBARGO ERROR: Active narrative offensive already in progress against this sovereign domain. Terminate existing campaign to deploy new parameters.");
      return;
    }

    // Launch campaign!
    propagandaStore.launchMediaOperation(
      playerCountryId,
      targetCountryId,
      localSpend,
      localDirection,
      'PROPAGANDA',
      'PLAYER'
    );
  };

  const handleTerminateOperation = (id: string) => {
    propagandaStore.terminateMediaOperation(id);
  };

  // Helper values
  const isTargetOwnedByPlayer = targetCountryId === playerCountryId;
  const isTargetAlreadyUnderPlayerOp = activeOps.some(
    (o) => o.targetCountryId === targetCountryId && o.createdBy === 'PLAYER' && o.active
  );

  const estimatedEffectiveness = targetCountry
    ? (localSpend * 0.1) * (1 - (targetCountry.mediaResistance ?? 0.5))
    : 0;

  return (
    <PanelFxShell panelId="psyop" relevantFxTypes={['COUP_SUCCESS','REGIME_CHANGE','WAR_DECLARED','REGIME_PRESSURE_CRITICAL']}>
      <div className="flex flex-col h-full text-slate-200 font-mono text-xs w-full select-none" id="propaganda-operations-dashboard">
      
      {/* 1. Header and Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-3 border-b border-[#1e3540]/60 bg-[#0d1418]/40">
        <div className="flex flex-col">
          <span className="text-[10px] text-pink-500 font-bold tracking-widest uppercase">COGNITIVE THEATER DIRECTIVE</span>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">T3.2 Narrative & Propaganda Command</h2>
        </div>
        
        {/* Sleek Military Select dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#8aa4ad] font-bold">TARGET SITE:</span>
          <select
            value={targetCountryId}
            onChange={handleTargetChange}
            className="bg-[#0e171b] border border-[#1e3440] text-[#00ffc4] py-1 px-2.5 rounded-[1px] font-bold font-mono outline-none cursor-pointer focus:border-[#00e5c8] select-none text-[11px]"
            id="target-country-selector"
          >
            {Object.entries(countries)
              .filter(([id]) => id !== playerCountryId)
              .map(([id, c]) => (
                <option key={id} value={id}>
                  {c.flagEmoji} {c.name?.toUpperCase()} ({id})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 2. Primary Columns: Controller on left, Targets stats / active checklist list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
        
        {/* Left Col: Setup & Controls (5 cols) */}
        <div className="lg:col-span-5 p-3.5 border-r border-[#1e3540]/40 flex flex-col gap-3.5 bg-[#080d0f]/20">
          <div className="flex items-center gap-2 border-b border-[#1e3540]/30 pb-1.5">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">CONFIGURE INFORMATION CAMPAIGN</span>
          </div>

          {/* Spend per Tick Slider */}
          <div className="flex flex-col gap-2 bg-[#0e171b]/60 p-2.5 border border-[#1e3540]/25 rounded-[1px]">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-[#8aa4ad]">PER-TICK RECURRING BUDGET:</span>
              <span className="text-[#00ffc4] font-mono text-[11px] bg-[#112222]/80 px-1.5 py-0.5 border border-[#00ffc4]/15">${localSpend.toFixed(1)} Billion / Tick</span>
            </div>
            
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={localSpend}
              onChange={(e) => setLocalSpend(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#152327] rounded-lg appearance-none cursor-pointer accent-[#00ffc4] select-none outline-none"
              id="spend-allocation-slider"
            />
            
            <div className="flex justify-between text-[8px] text-[#6d848d] font-bold">
              <span>MIN: $0.2B</span>
              <span>MED: $2.0B</span>
              <span>MAX: $4.0B</span>
            </div>
          </div>

          {/* Narrative Line (hostile vs stabilization) */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-[#8aa4ad] font-bold">NARRATIVE ALIGNMENT VECTOR:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalDirection('DESTABILIZE')}
                className={`py-2 px-2.5 flex flex-col justify-center items-center gap-0.5 border font-semibold tracking-wider rounded-[1px] transition-all hover:bg-red-950/20
                  ${localDirection === 'DESTABILIZE'
                    ? 'border-red-500 bg-red-950/40 text-red-400 shadow-[inset_0_0_8px_rgba(239,68,68,0.25)]'
                    : 'border-[#1e3540]/60 bg-[#0c1214] text-slate-400'
                  }
                `}
                id="align-destabilize-btn"
              >
                <span className="text-[10px] font-extrabold uppercase">DESTABILIZE</span>
                <span className="text-[8px] opacity-75 font-normal tracking-tight">Decay target narrative</span>
              </button>
              
              <button
                type="button"
                onClick={() => setLocalDirection('STABILIZE')}
                className={`py-2 px-2.5 flex flex-col justify-center items-center gap-0.5 border font-semibold tracking-wider rounded-[1px] transition-all hover:bg-emerald-950/20
                  ${localDirection === 'STABILIZE'
                    ? 'border-[#39d98a] bg-[#112a1d]/60 text-[#39d98a] shadow-[inset_0_0_8px_rgba(57,217,138,0.25)]'
                    : 'border-[#1e3440]/60 bg-[#0c1214] text-slate-400'
                  }
                `}
                id="align-stabilize-btn"
              >
                <span className="text-[10px] font-extrabold uppercase">STABILIZE</span>
                <span className="text-[8px] opacity-75 font-normal tracking-tight">Support target narrative</span>
              </button>
            </div>
          </div>

          {/* Expected Outcome Prediction (Cooperative verification) */}
          <div className="bg-[#11191c]/80 border border-[#1e3540]/30 p-2.5 rounded-[1px] text-[10px] leading-relaxed flex flex-col gap-1 w-full text-slate-300">
            <span className="text-[9px] text-[#8aa4ad] font-bold uppercase border-b border-[#1e3540]/20 pb-0.5 mb-1">PROGNOSTIC MODELING:</span>
            <div className="flex justify-between">
              <span>Target mediaResistance:</span>
              <span className="font-bold text-amber-500">{(targetCountry?.mediaResistance ?? 0.5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Recurring Cost per Tick:</span>
              <span className="font-bold text-red-400">-${localSpend.toFixed(1)}B / tick</span>
            </div>
            <div className="flex justify-between border-t border-[#1e3540]/20 pt-1 mt-1 text-[#00ffc4]">
              <span>ESTIMATED SHIFT / TICK:</span>
              <span className="font-bold font-mono">
                {localDirection === 'DESTABILIZE' ? '-' : '+'}
                {estimatedEffectiveness.toFixed(3)}%
              </span>
            </div>
          </div>

          {/* Action Trigger Button */}
          {isTargetOwnedByPlayer ? (
            <div className="bg-red-950/30 border border-red-900/40 p-2.5 text-[10px] text-red-300 rounded-[1px]">
              ⚠️ SECURITY DIRECTIVE ERROR: Cognitive protocols prohibit firing informational offensive lines at your own domestic population. Select a foreign target on the map or dropdown.
            </div>
          ) : isTargetAlreadyUnderPlayerOp ? (
            <div className="bg-[#1b2b1a]/40 border border-[#3b5936]/40 p-2.5 text-[10px] text-emerald-300 rounded-[1px] flex flex-col gap-1.5">
              <span>📡 ACTIVE CAMPAIGN VERIFIED: You are already operating an informational campaign against {targetCountry?.name}.</span>
              <span className="text-[8.5px] opacity-80 font-normal">Terminate active campaign in operations feed to redeploy with modified budget / alignment presets.</span>
            </div>
          ) : (
            <button
              onClick={handleLaunchOperation}
              disabled={playerCashB < localSpend}
              className={`w-full py-2.5 rounded-[1px] font-bold tracking-widest text-[#000d08] transition-all select-none uppercase shadow-md text-xs
                ${playerCashB < localSpend
                  ? 'bg-slate-700/50 text-slate-500 border border-slate-650 cursor-not-allowed'
                  : 'bg-[#00ffc4] hover:bg-[#00e5c8] hover:scale-[1.01] active:translate-y-0.5 shadow-[#00ffc4]/10'
                }
              `}
              id="launch-propaganda-campaign-btn"
            >
              {playerCashB < localSpend ? 'INSUFFICIENT RESERVES' : 'AUTHORIZE INFORMATIVE CAMPAIGN'}
            </button>
          )}
        </div>

        {/* Right Col: Stats Display (Top) & Operations Feed (Bottom) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col overflow-y-auto">
          
          {/* Top Panel: Selected Country Live Intelligence Profile */}
          <div className="p-3.5 border-b border-[#1e3540]/40 bg-[#0d1418]/20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-[#1e3540]/30 pb-1.5">
              <div 
                className={`flex items-center gap-1.5 ${targetCountry ? 'cursor-pointer hover:underline hover:opacity-85' : ''}`}
                onClick={() => {
                  if (targetCountry) {
                    useUIStore.getState().setCountryInspector(targetCountry.id);
                  }
                }}
              >
                <span className="text-sm">{targetCountry?.flagEmoji || '🌍'}</span>
                <span className="text-[11px] font-bold tracking-widest text-slate-100 uppercase hover:text-[#00e5ff] transition-colors">{targetCountry?.name || 'DOMESTIC COMMAND'} SPEC-SHEET</span>
              </div>
              <span className="text-[9px] text-[#8aa4ad] font-bold">INFO BLOCK SECURITY: UNRESTRICTED</span>
            </div>

            {targetCountry ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Stat 1: Domestic Narrative */}
                <div className="bg-[#0e171b]/80 border border-[#1e3540]/25 p-2 flex flex-col gap-1 relative overflow-hidden">
                  <span className="text-[8.5px] text-[#8aa4ad] font-bold">DOMESTIC COHESION:</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-[#00ffc4]">
                      {(targetCountry.domesticNarrative !== undefined ? targetCountry.domesticNarrative : (targetCountry.political?.ideology === 'DEMOCRACY' ? 55 : 75)).toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-[#6d848d]">regime compliance</span>
                  </div>
                  {/* Progress bar visual colored segmentations */}
                  <div className="h-1.5 w-full bg-slate-900 rounded-[1px] relative overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-300
                        ${(targetCountry.domesticNarrative ?? 50) < 20 
                          ? 'bg-red-500 animate-pulse' 
                          : (targetCountry.domesticNarrative ?? 50) < 50 
                            ? 'bg-amber-500' 
                            : (targetCountry.domesticNarrative ?? 50) < 80 
                              ? 'bg-cyan-400' 
                              : 'bg-emerald-500'
                        }
                      `}
                      style={{ width: `${targetCountry.domesticNarrative ?? 50}%` }}
                    />
                  </div>
                </div>

                {/* Stat 2: Media Resistance Progress */}
                <div className="bg-[#0e171b]/80 border border-[#1e3540]/25 p-2 flex flex-col gap-1">
                  <span className="text-[8.5px] text-[#8aa4ad] font-bold">MEDIA RESISTANCE:</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-extrabold text-amber-500">
                      {((targetCountry.mediaResistance ?? 0.5) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[8px] text-[#6d848d]">information blockade</span>
                  </div>
                  {/* Static colored resistance bar */}
                  <div className="h-1.5 w-full bg-slate-900 rounded-[1px] mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${(targetCountry.mediaResistance ?? 0.5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stat 3: Recent Delta Movement */}
                <div className="bg-[#0e171b]/80 border border-[#1e3540]/25 p-2 flex flex-col gap-1 justify-between">
                  <span className="text-[8.5px] text-[#8aa4ad] font-bold">RECENT SHIFT RATE:</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    {targetCountry.recentNarrativeDelta !== undefined && targetCountry.recentNarrativeDelta !== 0 ? (
                      <>
                        <span className={`text-base font-extrabold font-mono
                          ${targetCountry.recentNarrativeDelta > 0 ? 'text-emerald-400' : 'text-red-400'}
                        `}>
                          {targetCountry.recentNarrativeDelta > 0 ? '▲' : '▼'}{Math.abs(targetCountry.recentNarrativeDelta).toFixed(3)}%
                        </span>
                        <span className="text-[8px] text-[#6d848d]">points/tick</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-extrabold text-[#8aa4ad] font-mono">0.000%</span>
                        <span className="text-[8px] text-[#6d848d]">stable information space</span>
                      </>
                    )}
                  </div>
                  <span className="text-[7.5px] text-[#556c75] font-semibold mt-1">Updates live at each simulation step</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic text-[11px] p-2 bg-slate-900/50 border border-[#1e3540]/15">
                Connecting sensor satellites... Select target country to build media intelligence telemetry.
              </div>
            )}
          </div>

          {/* Bottom Panel: Live Systems Active Operations Feed */}
          <div className="p-3.5 flex-1 flex flex-col gap-2 bg-[#05090a]/40">
            <div className="flex items-center gap-2 border-b border-[#1e3540]/30 pb-1.5">
              <span className="w-1.5 h-1.5 bg-[#00ffc4] rounded-full" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">ACTIVE COGNITIVE OPERATIONS REGISTER</span>
            </div>

            {/* Scrolling register list */}
            <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-2.5" id="active-operations-list">
              {activeOps.length > 0 ? (
                activeOps.map((op) => {
                  const sC = countries[op.sourceCountryId];
                  const tC = countries[op.targetCountryId];
                  const isPlayerOp = op.createdBy === 'PLAYER';

                  return (
                    <div
                      key={op.id}
                      className={`p-2.5 border rounded-[1px] relative transition-all duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-3
                        ${isPlayerOp
                          ? 'bg-[#0d1c1a]/90 border-[#1f594e] text-slate-100 shadow-[inset_0_0_6px_rgba(0,255,196,0.06)]'
                          : 'bg-[#1b1414]/90 border-[#5a2727] text-slate-200'
                        }
                      `}
                    >
                      {/* Left: Operation detail headers */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[1px]
                            ${isPlayerOp 
                              ? 'bg-teal-950/85 border-teal-800 text-[#00ffc4]' 
                              : 'bg-red-950/85 border-red-900 text-red-400'
                            }
                          `}>
                            {op.operationType === 'COUNTER_PROPAGANDA' ? 'COUNTER OP' : 'PROPAGANDA OP'}
                          </span>
                          
                          <span className="font-bold text-[11px] text-slate-200">
                            {sC?.flagEmoji || '🌍'} {sC?.name?.toUpperCase()} ➜ {tC?.flagEmoji || '🌍'} {tC?.name?.toUpperCase()}
                          </span>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#8aa4ad] font-medium font-mono mt-1">
                          <span>Spend/Tick: <strong className="text-slate-300">${op.spendPerTick.toFixed(1)}B</strong></span>
                          <span>Direction: <strong className={`${op.narrativeDirection === 'DESTABILIZE' || op.narrativeDirection === 'ANTI_PLAYER' ? 'text-red-400' : 'text-emerald-400'}`}>{op.narrativeDirection}</strong></span>
                          <span>Effectiveness: <strong className="text-[#00ffc4]">+{op.effectivenessPerTick?.toFixed(3)}/tick</strong></span>
                          <span>Duration: <strong className="text-slate-300">{op.runtimeTicks || 0} ticks</strong></span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {isPlayerOp ? (
                        <button
                          onClick={() => handleTerminateOperation(op.id)}
                          className="bg-red-950/60 hover:bg-red-900/80 hover:text-red-100 border border-red-700/60 px-2 py-1 text-[9px] font-bold tracking-wider rounded-[1px] active:translate-y-0.5 select-none uppercase text-red-400"
                        >
                          Terminate
                        </button>
                      ) : (
                        <span className="text-[9px] text-red-500 font-extrabold uppercase bg-red-950/30 px-2 py-1 border border-red-900/25">
                          HOSTILE ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col justify-center items-center text-center p-6 border border-dashed border-[#1e3540]/30 bg-[#0e171b]/25 italic text-slate-400 text-[10px] gap-2">
                  <div className="text-xl">📡</div>
                  <div className="font-bold uppercase tracking-widest text-[#5d737b] text-[9px]">COGNITIVE AIRSPACE CALM</div>
                  <div>No operations registered. Deploy a propaganda campaign targeting foreign nations to coordinate strategic informational vectors.</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
    </PanelFxShell>
  );
}
