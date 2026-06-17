import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { ShieldAlert, Crosshair, Users, Coins, Globe, Megaphone, Flame, ServerCrash } from 'lucide-react';
import { PressureActionType, PressureCampaign } from '../../types/regimePressure';
import { useOperativeStore } from '../../store/operativeStore';

export function RegimePressurePanel() {
  const world = useWorldStore();
  const playerState = usePlayerStore();
  const operativeStore = useOperativeStore();
  
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<PressureActionType | ''>('');
  
  const targetCountry = selectedTarget ? world.countries[selectedTarget] : null;
  const pressure = targetCountry?.political.regimePressure;

  const playerOps = Object.values(operativeStore.operatives).filter(o => o.regionOfOperation === selectedTarget && o.state === 'ACTIVE');

  const initiateCampaign = () => {
    if (!targetCountry || !selectedAction || !pressure) return;

    // We modify through world store draft mechanics directly if possible, or build an action in worldStore
    // For now, let's use the standard update method
    useWorldStore.setState((state) => {
      const draft = { ...state.countries };
      const t = draft[selectedTarget];
      
      const p = t.political.regimePressure;
      if (!p) return state;

      p.activeCampaigns.push({
        id: `cp_${Date.now()}`,
        type: selectedAction as PressureActionType,
        initiatorId: playerState.countryId,
        targetCountryId: selectedTarget,
        phase: 1,
        maxPhases: selectedAction === 'TARGETED_REMOVAL' ? 5 : 3,
        progress: 0,
        exposure: 0,
        risk: getBaseRisk(selectedAction),
        investment: 10,
        assignedOperatives: playerOps.slice(0, 2).map(o => o.id), // automatically push some ops into it
        state: 'PREPARING',
        consequences: {},
        tickStarted: state.currentTick,
        lastUpdatedTick: state.currentTick
      });

      return { countries: draft };
    });

    setSelectedAction('');
  };

  const getBaseRisk = (type: string) => {
    switch(type) {
        case 'PROTEST': return 20;
        case 'COUP': return 60;
        case 'ELECTION_INTERFERENCE': return 40;
        case 'OPPOSITION_FUNDING': return 15;
        case 'TARGETED_REMOVAL': return 80;
        default: return 30;
    }
  };

  const executeCampaign = (campaignId: string) => {
    useWorldStore.setState((state) => {
      const draft = { ...state.countries };
      const t = draft[selectedTarget];
      const p = t.political.regimePressure;
      if (!p) return state;

      const camp = p.activeCampaigns.find(c => c.id === campaignId);
      if (camp && camp.state === 'PREPARING') {
        camp.state = 'EXECUTING';
        usePlayerStore.setState((s) => ({ cashB: s.cashB - camp.investment }));
      }
      return { countries: draft };
    });
  };

  const abortCampaign = (campaignId: string) => {
    useWorldStore.setState((state) => {
      const draft = { ...state.countries };
      const t = draft[selectedTarget];
      const p = t.political.regimePressure;
      if (!p) return state;

      const camp = p.activeCampaigns.find(c => c.id === campaignId);
      if (camp) {
        camp.state = 'COMPLETED'; // or ABORTED, but let's filter it out
      }
      return { countries: draft };
    });
  };

  const getPhaseName = (camp: PressureCampaign) => {
    if (camp.type === 'TARGETED_REMOVAL') {
      const phases = ['IDENTIFICATION', 'ACCESS', 'POSITIONING', 'EXECUTION', 'EXFILTRATION', 'AFTERMATH'];
      return phases[camp.phase - 1] || 'FINALIZING';
    }
    const phases = ['PREPARATION', 'MOBILIZATION', 'CLIMAX', 'AFTERMATH'];
    return phases[camp.phase - 1] || 'COMPLETING';
  };

  return (
    <div className="h-full flex flex-col pt-6 px-6">
      <div className="flex justify-between items-center mb-6 border-b border-[#00e5ff]/20 pb-4">
        <h2 className="text-[#00e5ff] text-xl font-bold tracking-[0.2em] flex items-center shadow-text">
          <ShieldAlert className="w-6 h-6 mr-3 text-[#00e5ff]/80" />
          REGIME PRESSURE COVERT TOOLKIT
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {/* LEFT COL: Target Selection */}
        <div className="col-span-4 bg-black/40 border border-[#00e5ff]/20 p-4 relative flex flex-col gap-4">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#00e5ff]/10 border-b border-l border-[#00e5ff]/30 text-[10px] text-[#00e5ff] font-bold">
            TARGET ACQUISITION
          </div>
          
          <div className="mt-4">
            <label className="text-[10px] text-[#00e5ff]/60 uppercase font-bold tracking-widest mb-1.5 block">Select Target Sovereign</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full bg-[#001015] border border-[#00e5ff]/30 px-3 py-2 text-white text-xs uppercase tracking-widest focus:outline-none focus:border-[#00e5ff] transition-colors"
            >
              <option value="">-- NO TARGET ACQUIRED --</option>
              {Object.keys(world.countries).filter(id => id !== playerState.countryId).map(id => (
                <option key={id} value={id}>{world.countries[id].name} [{id}]</option>
              ))}
            </select>
          </div>

          {pressure && targetCountry ? (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-[#001015] p-3 border border-[#00e5ff]/10">
                <h3 className="text-white text-xs font-bold mb-2 uppercase tracking-widest border-b border-[#00e5ff]/20 pb-1 flex items-center">
                  <ServerCrash className="w-3 h-3 mr-1.5 text-amber-500" /> VULNERABILITY METRICS
                </h3>
                 <MetricRow label="REGIME LEGITIMACY" value={pressure.legitimacy} color="from-green-500 to-emerald-800" reverse />
                 <MetricRow label="OPPOSITION STRENGTH" value={pressure.oppositionStrength} color="from-amber-400 to-amber-900" />
                 <MetricRow label="ELITE COHESION" value={pressure.eliteCohesion} color="from-blue-400 to-blue-900" reverse />
                 <MetricRow label="SECURITY LOYALTY" value={pressure.securityForceLoyalty} color="from-purple-400 to-purple-900" reverse />
                 <MetricRow label="PROTEST TEMP" value={pressure.protestTemperature} color="from-red-500 to-orange-800" />
              </div>

               <div className="bg-[#001015] p-3 border border-[#00e5ff]/10">
                <h3 className="text-white text-[10px] font-bold mb-2 uppercase tracking-widest opacity-80 border-b border-[#00e5ff]/10 pb-1">
                  ELITE FACTIONS
                </h3>
                 {pressure.eliteFactions.map(f => (
                   <div key={f.id} className="flex justify-between items-center text-[9px] mb-1.5 group hover:bg-[#00e5ff]/5 px-1 py-0.5 transition-colors cursor-default">
                     <span className="text-white/80">{f.name} <span className="opacity-40">[{f.alignment}]</span></span>
                     <span className={`font-bold ${f.loyalty < 40 ? 'text-amber-400' : 'text-blue-400'}`}>LYL: {Math.round(f.loyalty)}%</span>
                   </div>
                 ))}
               </div>

                <div className="bg-[#001015] p-3 border border-[#00e5ff]/10 text-xs">
                <h3 className="text-white text-[10px] font-bold mb-2 uppercase tracking-widest opacity-80 border-b border-[#00e5ff]/10 pb-1 text-red-400 flex items-center">
                   <Flame className="w-3 h-3 mr-1.5" /> BLOWBACK HISTORY
                </h3>
                 {pressure.blowbackHistory.length === 0 ? <span className="text-[9px] text-[#00e5ff]/30 italic">No recent exposure.</span> : 
                   pressure.blowbackHistory.map(b => (
                     <div key={b.id} className="text-[9px] text-red-300 border-l border-red-500/50 pl-2 mb-1.5">
                       {b.type} (Mag: {Math.round(b.magnitude)})
                       <div className="opacity-50 text-[8px]">TICK: {b.tickOccurred}</div>
                     </div>
                   ))
                 }
               </div>

            </div>
          ) : (
            targetCountry && <div className="text-[10px] text-[#00e5ff]/40 p-4 text-center mt-8">Establishing telemetry with target systems... waiting for next simulator tick.</div>
          )}

        </div>

        {/* RIGHT COL: Campaigns */}
        <div className="col-span-8 bg-black/40 border border-[#00e5ff]/20 p-4 relative flex flex-col gap-4">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500/10 border-b border-l border-amber-500/30 text-[10px] text-amber-500 font-bold">
            PRESSURE OPERATIONS
            </div>

            {targetCountry && pressure ? (
              <>
               {/* INIT CONTROLS */}
                <div className="mt-4 border border-[#00e5ff]/20 p-3 bg-black/60 relative overflow-hidden">
                    <div className="absolute inset-0 bg-stripe-diagonal opacity-10 mix-blend-overlay pointer-events-none" />
                    <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-widest flex items-center">
                      <Crosshair className="w-3 h-3 mr-2 text-[#00e5ff]" />
                      ORCHESTRATE NEW OPERATION
                    </h3>
                    
                    <div className="flex gap-2">
                      <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value as PressureActionType)}
                        className="flex-1 bg-[#001015] border border-[#00e5ff]/50 px-3 py-1.5 text-white text-[10px] uppercase tracking-widest outline-none"
                      >
                        <option value="">- SELECT OPERATION VECTOR -</option>
                        <option value="PROTEST">Mass Protest Escalation</option>
                        <option value="OPPOSITION_FUNDING">Covert Opposition Funding</option>
                        <option value="ELECTION_INTERFERENCE">Electoral Interference</option>
                        <option value="COUP">Coup d'état Support</option>
                        <option value="TARGETED_REMOVAL">Targeted Elite Removal</option>
                      </select>

                      <button 
                        onClick={initiateCampaign}
                        disabled={!selectedAction || playerState.cashB < 10}
                        className="btn-sovereign px-4 py-1.5 text-[10px] flex items-center"
                      >
                        <Coins className="w-3 h-3 mr-1.5" />
                        PREPARE OPS ($10B)
                      </button>
                    </div>
                </div>

                {/* ACTIVE CAMPAIGNS */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mt-2">
                    {pressure.activeCampaigns.map(camp => (
                        <div key={camp.id} className="border border-[#00e5ff]/30 p-3 bg-gradient-to-r from-black to-[#001015] relative group hover:border-[#00e5ff] transition-colors">
                           
                           {/* BG Pulse if executing */}
                           {camp.state === 'EXECUTING' && (
                              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00e5ff] animate-ping opacity-50 translate-x-1 -translate-y-1" />
                           )}

                           <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h4 className="text-[#00e5ff] text-xs font-bold tracking-widest">{camp.type.replace('_', ' ')}</h4>
                                  <div className="text-[9px] uppercase text-white/50 tracking-widest">{getPhaseName(camp)} ({camp.phase}/{camp.maxPhases})</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-[10px] text-white/70">RISK FACTOR</div>
                                  <div className={`text-xs font-bold ${camp.risk > 50 ? 'text-red-400' : 'text-amber-400'}`}>{camp.risk}%</div>
                              </div>
                           </div>

                           <div className="mb-3 grid grid-cols-2 gap-4">
                               <div>
                                  <div className="flex justify-between text-[8px] mb-1 tracking-widest">
                                    <span className="text-[#00e5ff]/70">PHASE PROGRESS</span>
                                    <span className="text-[#00e5ff]">{Math.floor(camp.progress)}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-[#001015] border border-[#00e5ff]/20">
                                      <div className="h-full bg-[#00e5ff]" style={{ width: `${camp.progress}%`}} />
                                  </div>
                               </div>
                               <div>
                                  <div className="flex justify-between text-[8px] mb-1 tracking-widest">
                                    <span className="text-red-400/70">EXPOSURE LEVEL</span>
                                    <span className="text-red-400">{Math.floor(camp.exposure)}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-[#001015] border border-red-500/20">
                                      <div className="h-full bg-red-500" style={{ width: `${camp.exposure}%`}} />
                                  </div>
                               </div>
                           </div>

                           {/* CONTROLS */}
                           {camp.state === 'PREPARING' && (
                                <div className="flex gap-2">
                                    <button onClick={() => executeCampaign(camp.id)} className="flex-1 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/50 text-[#00e5ff] text-[9px] py-1 uppercase tracking-widest transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                                        COMMENCE EXECUTION
                                    </button>
                                    <button onClick={() => abortCampaign(camp.id)} className="px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 text-[9px] py-1 uppercase tracking-widest transition-colors">
                                        ABORT
                                    </button>
                                </div>
                           )}
                           {camp.state === 'EXECUTING' && (
                                <div className="flex gap-2 justify-between items-center bg-[#00e5ff]/5 border border-[#00e5ff]/10 px-3 py-1.5">
                                    <span className="text-[9px] text-[#00e5ff] uppercase tracking-widest animate-pulse">OPERATION IN PROGRESS...</span>
                                    <button onClick={() => abortCampaign(camp.id)} className="text-[9px] text-red-500 hover:text-red-400 underline decoration-red-500/30 underline-offset-2">EMERGENCY ABORT</button>
                                </div>
                           )}

                        </div>
                    ))}
                    {pressure.activeCampaigns.length === 0 && (
                        <div className="text-center text-[#00e5ff]/30 text-[10px] mt-10 italic uppercase border border-dashed border-[#00e5ff]/10 p-6">
                            NO ACTIVE COVERT DEPLOYMENTS
                        </div>
                    )}
                </div>
              </>
            ) : (
                <div className="text-center text-[#00e5ff]/30 text-[10px] uppercase h-full flex items-center justify-center border border-dashed border-[#00e5ff]/10 p-6">
                    SELECT A TARGET TO INITIATE PRESSURE TOOLKIT
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color, reverse = false }: { label: string, value: number, color: string, reverse?: boolean }) {
    const fillPercent = Math.min(100, Math.max(0, value));
    
    return (
        <div className="mb-2">
            <div className="flex justify-between text-[8px] uppercase tracking-widest text-[#00e5ff]/60 mb-1">
                <span>{label}</span>
                <span className="text-white font-bold">{Math.floor(value)}/100</span>
            </div>
            <div className="h-1.5 w-full bg-[#001015] border border-[#00e5ff]/20 overflow-hidden flex">
                <div 
                    className={`h-full bg-gradient-to-r ${color}`} 
                    style={{ 
                        width: `${fillPercent}%`,
                        marginLeft: reverse ? `${100 - fillPercent}%` : '0'
                    }} 
                />
            </div>
        </div>
    )
}
