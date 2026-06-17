import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useMirrorStore } from '../../store/mirrorStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';
import {
  Activity,
  Shield,
  Eye,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Cpu,
  BrainCircuit,
  Lock,
  Compass,
  FileSpreadsheet,
  Terminal,
  Volume2,
  CheckCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

export default function MirrorAdaptationPanel() {
  const currentTick = useWorldStore((s) => s.currentTick);
  const playerCountryId = usePlayerStore((s) => s.countryId);

  const mirrorState = useMirrorStore();
  const {
    profile,
    fingerprint,
    habits,
    preferenceModel,
    riskPattern,
    tempo,
    availableTemplates,
    activeCounterCommitment,
    candidates,
    honeypots,
    memories,
    confidence,
    stability,
    warningLevel,
    difficultySetting,
    learningSpeedMultiplier,
    counterHistory
  } = mirrorState;

  const [activeSubTab, setActiveSubTab] = useState<'VECTOR' | 'COUNTERS' | 'HONEYPOTS' | 'CHRONOLOGY'>('VECTOR');
  const [showGuide, setShowGuide] = useState(false);

  const getFingerprintLabel = (f: string) => {
    switch (f) {
      case 'SANCTIONS_GRINDER': return { title: 'SANCTIONS GRINDER', desc: 'Highly repetitive reliance on financial trade freezes, embargoes, and offshore freezes to throttle adversary cash flows.', color: 'text-amber-400' };
      case 'COVERT_OPERATOR': return { title: 'CLANDESTINE SYNDICATE', desc: 'Frequent deployment of black-budget operations, political subversion, factional destabilization and assassinations.', color: 'text-purple-400' };
      case 'MILITARY_BLITZER': return { title: 'KINETIC WARHAWK', desc: 'Dominant preference for high-yield ICBM strikes, air-tactical mobilizations, and decisive forward division actions.', color: 'text-red-400 animate-pulse' };
      case 'ALLIANCE_BROKER': return { title: 'MULTILATERAL COALITIONIST', desc: 'Extensive use of backchannel treaty cycles, economic integration, opinion-boosting, and geopolitical bloc building.', color: 'text-blue-400' };
      case 'INFORMATION_WAR_SPECIALIST': return { title: 'INFORMATION PSYOP MATRIX', desc: 'Consistently focuses on hacking regional hardware systems and injecting broadcast propaganda subversion.', color: 'text-cyan-400' };
      case 'ECONOMIC_STRANGLER': return { title: 'FISCAL HEGEMONIST', desc: 'Relies on manipulation of debt metrics, currency printing and economic substitution to collapse balance scores.', color: 'text-green-400' };
      case 'DEFENSIVE_TURTLER': return { title: 'FORTIFIED DE-ESCALATOR', desc: 'Characterized by highly cautious crisis concessions, backchannels, de-escalations, and low-tension positions.', color: 'text-emerald-400' };
      default: return { title: 'BALANCED GRAND STRATEGIST', desc: 'High variance between diplomatic compromises, kinetic responses, and covert actions. Unpredictable operational cadence.', color: 'text-[#00ff44]' };
    }
  };

  const getWarningClass = (level: string) => {
    if (level === 'CRITICAL') return 'bg-red-950 border-red-500 text-red-500 animate-pulse';
    if (level === 'HIGH') return 'bg-orange-950 border-orange-500 text-orange-400';
    if (level === 'MEDIUM') return 'bg-yellow-950/40 border-yellow-600 text-yellow-500';
    return 'bg-zinc-950 border-[#1a5c1a] text-[#00ff44]';
  };

  const handleTestBaitClick = (id: string, baitType: string) => {
    audio.sfxKeyClick();
    
    // Simulate player triggering this specific trap
    const result = mirrorState.interactWithBait(id, baitType, true);
    
    useUIStore.getState().pushAlert({
      title: result.success ? 'Honeypot Trigger Success' : '🚨 ENEMY TRAP TRIGGERED!',
      message: result.feedback,
      type: result.success ? 'INFO' : 'DANGER'
    });

    useWorldStore.getState().addGlobalEvent(`MIRROR ADAPTATION: Player fell into Honeypot [${id}]!`, 'CRITICAL');
  };

  const currentFp = getFingerprintLabel(fingerprint);

  return (
    <PanelFxShell panelId="ai_opponent" relevantFxTypes={['COUP_SUCCESS','WAR_DECLARED','DEFCON_ESCALATION','REGIME_CHANGE']}>
      <div className="w-full text-xs flex flex-col gap-3 font-mono text-gray-300">
      
      {/* Top Profile Header Summary Block */}
      <div className="border border-[#1a3a1a] bg-[#020502]/95 p-3 rounded flex flex-col gap-2 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ff44]/5 rounded-bl-full pointer-events-none" />
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-[#00ff44]" />
            <div>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block">PROACTIVE COGNITIVE ARCHIVE</span>
              <h2 className={`font-black text-xs leading-none uppercase ${currentFp.color}`}>
                PLAYER PROFILE: {currentFp.title}
              </h2>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => { audio.sfxKeyClick(); setShowGuide(!showGuide); }}
              className="px-2 py-0.5 border border-zinc-800 bg-zinc-900/40 text-[9px] text-zinc-400 hover:text-white uppercase font-bold"
            >
              <HelpCircle className="w-3 h-3 inline mr-1" /> GUIDE
            </button>
            <button
              onClick={() => { audio.sfxKeyClick(); mirrorState.resetMirrorStore(); }}
              className="px-2 py-0.5 border border-red-900 hover:border-red-600 bg-red-950/20 text-[9px] text-red-500 font-bold uppercase transition"
              title="Purge profiling metrics and restore to balanced grand strategist baseline"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" /> RESET ANALYZER
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 leading-normal pl-7 pr-4">
          {currentFp.desc}
        </p>

        {showGuide && (
          <div className="mt-2 border border-blue-900 bg-blue-950/20 p-2 text-[10px] text-blue-300 rounded leading-relaxed pl-7">
            <strong>System Concept:</strong> Mirror Adaptation learns from how you play. It parses actions over time to configure counters, lay honeypots (baiting you with unprotected targets), and launch active tactical countermeasures. Switching styles abruptly triggers "Cognitive Drift", temporarily throwing adversary prediction models off balance.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-1 pl-7 pt-1.5 border-t border-[#1a2d1a]/50">
          <div className="text-[10px]/1">
            <span className="text-gray-500 block text-[8px] uppercase">COGNITIVE STABILITY</span>
            <span className="font-extrabold text-[#00ff44]">
              {stability.coreStability}%
              {stability.driftDetected && <span className="text-orange-400 text-[8px] ml-1.5 animate-pulse">DRIFT DETECTED</span>}
            </span>
            <div className="w-20 bg-zinc-950 border border-[#1a3a1a] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="h-full bg-[#00ff44]" style={{ width: `${stability.coreStability}%` }} />
            </div>
          </div>

          <div className="text-[10px]/1">
            <span className="text-gray-500 block text-[8px] uppercase">PROSPECT MODEL CONFI.</span>
            <span className="font-extrabold text-cyan-400">{confidence.generalConfidence}%</span>
            <div className="w-20 bg-zinc-950 border border-[#1a3a1a] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: `${confidence.generalConfidence}%` }} />
            </div>
          </div>

          <div className="text-[10px]/1">
            <span className="text-gray-500 block text-[8px] uppercase">ANALYSIS RISK LEVEL</span>
            <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${getWarningClass(warningLevel)}`}>
              {warningLevel} PREDICTION
            </span>
          </div>

          <div className="text-[10px]/1">
            <span className="text-gray-500 block text-[8px] uppercase">LEARNING COEFFICIENT</span>
            <select
              value={difficultySetting}
              onChange={(e) => {
                audio.playPhaseReveal();
                mirrorState.setDifficulty(e.target.value as any);
              }}
              className="bg-black text-[9px] font-extrabold text-zinc-300 border border-[#1a3a1a] py-0.5 px-1.5 mt-0.5 rounded cursor-pointer outline-none focus:border-[#00ff44]"
            >
              <option value="EASY">EASY (0.5x SLOW)</option>
              <option value="MEDIUM">MEDIUM (1.0x MODERATE)</option>
              <option value="HARD">HARD (1.6x FAST)</option>
              <option value="NIGHTMARE">NIGHTMARE (2.4x TOURNAMENT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mini Tab Navigation for Mirror Panel */}
      <div className="flex border-b border-[#1a2d1a] gap-1.5">
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('VECTOR'); }}
          className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'VECTOR' ? 'border-[#00ff44] text-[#00ff44] font-bold bg-[#0c1f0d]/10' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          📈 Profiling Vector
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('COUNTERS'); }}
          className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'COUNTERS' ? 'border-[#00ff44] text-[#00ff44] font-bold bg-[#0c1f0d]/10' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          🛡️ Adversary Doctrine
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('HONEYPOTS'); }}
          className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'HONEYPOTS' ? 'border-[#00ff44] text-[#00ff44] font-bold bg-[#0c1f0d]/10' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          🪤 ACTIVE BAIT SYSTEMS ({honeypots.filter(h => !h.isTriggered).length})
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('CHRONOLOGY'); }}
          className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'CHRONOLOGY' ? 'border-[#00ff44] text-[#00ff44] font-bold bg-[#0c1f0d]/10' : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          📟 Archive Log ({memories.length})
        </button>
      </div>

      {/* Subtab Render 1: Profiling Vector Dimensions */}
      {activeSubTab === 'VECTOR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          {/* Instrumented Biases Gauges Column */}
          <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-3 rounded">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase text-[#00ff44] text-[9px]/1 flex items-center justify-between">
              <span>COGNITIVE INSTRUMENT FREQUENCIES</span>
              <Sliders className="w-3 h-3 text-gray-500" />
            </h3>

            <div className="space-y-2 mt-1">
              {/* Sanctions Bias */}
              <div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-amber-500">Economic Sanctions (Coercion Index)</span>
                  <span className="font-bold text-amber-500">{profile.sanctionsBias}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 border border-[#1a3a1a] rounded overflow-hidden mt-0.5 relative">
                  <div className="h-full bg-amber-500" style={{ width: `${profile.sanctionsBias}%` }} />
                </div>
              </div>

              {/* Covert Bias */}
              <div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-purple-400">Espionage Operations (Subversion Weight)</span>
                  <span className="font-bold text-purple-400">{profile.covertBias}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 border border-[#1a3a1a] rounded overflow-hidden mt-0.5 relative">
                  <div className="h-full bg-purple-500" style={{ width: `${profile.covertBias}%` }} />
                </div>
              </div>

              {/* Military Bias */}
              <div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-red-500">Kinetic Deployments (Striking Propensity)</span>
                  <span className="font-bold text-red-500">{profile.militaryBias}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 border border-[#1a3a1a] rounded overflow-hidden mt-0.5 relative">
                  <div className="h-full bg-red-600" style={{ width: `${profile.militaryBias}%` }} />
                </div>
              </div>

              {/* Diplomacy Bias */}
              <div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-blue-400">Multilateral Treaties (Alignment Frequency)</span>
                  <span className="font-bold text-blue-400">{profile.diplomacyBias}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 border border-[#1a3a1a] rounded overflow-hidden mt-0.5 relative">
                  <div className="h-full bg-blue-500" style={{ width: `${profile.diplomacyBias}%` }} />
                </div>
              </div>

              {/* Cyber Bias */}
              <div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-cyan-400">Cyber Intrusion Cadence</span>
                  <span className="font-bold text-cyan-400">{profile.cyberBias}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 border border-[#1a3a1a] rounded overflow-hidden mt-0.5 relative">
                  <div className="h-full bg-cyan-500" style={{ width: `${profile.cyberBias}%` }} />
                </div>
              </div>
            </div>
            
            <p className="text-[9px] text-gray-500 mt-1 lines-relaxed">
              These percentages dictate the predictive models for adversary responses. Bias levels over 24% focus the attention of leaders with matching countermeasures.
            </p>
          </div>

          {/* Core Analytics Variables */}
          <div className="combat-panel flex flex-col gap-2.5 border border-[#1a3a1a] bg-[#030503] p-3 rounded justify-between">
            <div>
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase text-[#00ff44] text-[9px]/1">
                BEHAVIORAL CADENCE & TEMPO MODELS
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mt-2 pr-1">
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="text-gray-500 block text-[8px] uppercase">DECISION TEMPO</span>
                  <span className="font-black text-gray-300 text-[10px]">{tempo.averageResponseTime} Ticks / Action</span>
                </div>
                
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="text-gray-500 block text-[8px] uppercase">ESCALATION CADENCE</span>
                  <span className="font-black text-zinc-300 text-[10px]">{tempo.escalationSpeed}</span>
                </div>

                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="text-gray-500 block text-[8px] uppercase">RISK TOLERANCE RATING</span>
                  <span className="font-black text-zinc-300 text-[10px]">{riskPattern.riskToleranceScore} / 100</span>
                </div>

                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="text-gray-500 block text-[8px] uppercase">BLUFF INDEX PROPENSITY</span>
                  <span className="font-black text-zinc-300 text-[10px]">{riskPattern.bluffPropensity}%</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0c130d] border border-[#1a5c1a]/45 p-2 rounded">
              <span className="text-[9px] text-[#00ff44] uppercase font-black block mb-0.5">⚠️ COUNTER EXPLOIT EXPOSURE</span>
              <p className="text-[9px] text-gray-400 leading-normal">
                Adversaries have computed your primary instrument propensity to be <strong>{preferenceModel.primaryInstrument}</strong> and secondary to be <strong>{preferenceModel.secondaryInstrument}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subtab Render 2: Adversary Doctrine & Active Counters */}
      {activeSubTab === 'COUNTERS' && (
        <div className="flex flex-col gap-3">
          
          {/* Active Counters Area */}
          <div className="combat-panel border border-[#1a3a1a] bg-[#030503] p-3 rounded relative">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase text-[#00ff44] text-[9px]/1 flex items-center justify-between">
              <span>ACTIVE ADVERSARY ANTICIPATION DOCTRINES</span>
              <Shield className="w-3.5 h-3.5 text-[#00ff44]" />
            </h3>

            {activeCounterCommitment ? (
              <div className="mt-2 bg-[#0c1f0d]/30 border border-[#1a5c1a] p-3 rounded flex flex-col gap-1">
                <div className="flex justify-between items-center border-b border-[#1a401d] pb-1">
                  <span className="text-[10px] font-black text-[#00ff44] tracking-wide">
                     {activeCounterCommitment.name}
                  </span>
                  <span className="text-[9px] text-orange-400 font-extrabold animate-pulse bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-850">
                    Deployed: {activeCounterCommitment.ticksActive} Ticks Active
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed mt-1">
                  {activeCounterCommitment.description}
                </p>
                <div className="mt-2 flex flex-col gap-1 text-[9px] text-gray-400 pl-3 border-l border-green-800">
                  <span><strong>Countering Primary Vector:</strong> {activeCounterCommitment.threatCounteredCategory}</span>
                  <span><strong>Effectiveness Rating:</strong> {activeCounterCommitment.effectivenessScore}% (OPTIMAL SECURITY COMPILATION)</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 italic">
                <p>No active adversary doctrines currently deployed against player actions.</p>
                <p className="text-[9px] text-gray-650 mt-1">Raise your profiling confidence by conducting actions to trigger counters.</p>
              </div>
            )}
          </div>

          {/* Candidate doctrines under review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="combat-panel border border-[#1a3a1a] bg-[#030503] p-3 rounded">
              <h4 className="font-bold text-[9px]/1 text-cyan-400 border-b border-[#10383d] pb-1 mb-2 uppercase">
                DOCTRINES UNDER REVIEW & VOTING CADENCE
              </h4>

              {candidates.length === 0 ? (
                <p className="text-gray-500 italic text-[9px]">Adversary systems are monitoring; no candidates currently queued.</p>
              ) : (
                <div className="space-y-2">
                  {candidates.map((c) => {
                    const temp = mirrorState.availableTemplates.find((t) => t.templateId === c.templateId);
                    return (
                      <div key={c.candidateId} className="bg-zinc-950/60 border border-zinc-900 p-2 rounded">
                        <div className="flex justify-between items-start text-[9px]">
                          <span className="font-black text-gray-300">{temp?.name}</span>
                          <span className="text-yellow-500 font-bold">Match: {c.scoreMatch}%</span>
                        </div>
                        <p className="text-[9px] text-gray-400 line-clamp-2 mt-1 leading-normal">{temp?.description}</p>
                        
                        <button
                          onClick={() => { audio.playPhaseReveal(); mirrorState.deployCounterStrategy(c.candidateId); }}
                          className="mt-1 px-2 py-0.5 border border-cyan-900 hover:border-cyan-500 text-[8px] text-cyan-400 hover:bg-cyan-950/20 uppercase font-black cursor-pointer transition rounded"
                        >
                          ⚡ Defer & Force-Deploy Tactics
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="combat-panel border border-[#1a3a1a] bg-[#030503] p-3 rounded">
              <h4 className="font-bold text-[9px]/1 text-gray-400 border-b border-zinc-850 pb-1 mb-2 uppercase">
                DOCTRINE DEPLOYMENT HISTORIC CHANNEL
              </h4>

              {counterHistory.length === 0 ? (
                <p className="text-gray-500 italic text-[9px]">No previous defensive doctrines recorded on this simulation cycle.</p>
              ) : (
                <div className="space-y-1.5 overflow-y-auto max-h-[160px] scrollbar-thin">
                  {counterHistory.map((hist, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[9px] bg-zinc-950/45 p-1 px-2 border border-zinc-950/20 rounded">
                      <span className="text-gray-400 line-clamp-1 select-all">{hist.strategyName}</span>
                      <span className="text-gray-500 text-[8px] shrink-0 font-bold ml-1.5">Tick {hist.tickDeployed}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab Render 3: Honeypots & Active Bait Clashing */}
      {activeSubTab === 'HONEYPOTS' && (
        <div className="combat-panel border border-[#1a3a1a] bg-[#030503] p-3 rounded">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase text-[#00ff44] text-[9px]/1 flex items-center justify-between">
            <span>ACTIVE ADVERSARY BAIT & DECOY ARRAYS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#00ff44]" />
          </h3>

          <p className="text-[9px] text-gray-500 mt-1 lines-relaxed mb-3">
            Adversaries establish beautiful decoy coordinates inside non-player state directories matching your highest instrument bias. If your SIGINT or intelligence networks are highly trained, they flags these bait traps as "EXPOSED".
          </p>

          {honeypots.filter(h => !h.isTriggered).length === 0 ? (
            <div className="text-center py-6 text-gray-500 italic">
              <p>No bait honeypots are currently deployed. Proceed with more profiling operations to generate bait grids.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {honeypots.filter(h => !h.isTriggered).map((hp) => (
                <div key={hp.id} className="bg-zinc-950 border border-zinc-900 p-3 rounded flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex justify-between items-start border-b border-zinc-900 pb-1">
                      <span className="font-extrabold text-[10px] text-zinc-200">
                        📍 {hp.name}
                      </span>
                      <span className={`px-1 rounded text-[8px] font-bold ${
                        hp.baitType === 'COVERT_LEAK' ? 'bg-purple-950 text-purple-400 border border-purple-800/10' :
                        hp.baitType === 'MILITARY_GAP' ? 'bg-red-950 text-red-500 border border-red-800/10' : 'bg-amber-950 text-amber-500'
                      }`}>
                        {hp.baitType}
                      </span>
                    </div>

                    <p className="text-[9px] text-gray-400 leading-normal mt-1.5">
                      {hp.description}
                    </p>

                    <div className="mt-2 text-[8px] space-y-0.5">
                      <div className="text-emerald-500 font-medium"><strong>Hypothetical Outcome (Gain):</strong> {hp.rewardToPlayerIfSucceeds}</div>
                      <div className="text-red-400 font-medium"><strong>Counter-Friction (Blowback penalty):</strong> {hp.penaltyToPlayerIfTrapped}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center justify-between mt-1 pt-1.5 border-t border-zinc-900">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 shrink-0">
                      Attractiveness Index: <span className="font-bold text-zinc-300">{hp.attractivenessIndex}%</span>
                    </span>
                    <button
                      onClick={() => handleTestBaitClick(hp.id, hp.baitType)}
                      className="px-2.5 py-1 bg-red-950/20 text-red-500 hover:text-red-400 border border-red-900 hover:border-red-650 uppercase font-black text-[8px] cursor-pointer"
                    >
                      ☠️ Engage Bait Coordinate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab Render 4: Chronology Feed */}
      {activeSubTab === 'CHRONOLOGY' && (
        <div className="combat-panel border border-[#1a3a1a] bg-[#030503] p-3 rounded">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase text-[#00ff44] text-[9px]/1 flex items-center justify-between">
            <span>PROFILER MEMORY CHRONOLOGY LOG</span>
            <Terminal className="w-3.5 h-3.5 text-[#00ff44]" />
          </h3>

          <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[220px] scrollbar-thin pr-1">
            {memories.length === 0 ? (
              <p className="text-gray-500 italic text-[9px]">Archive feed empty. Perform actions on Central Bank, Covert Ops, or Weapon Silos to record profiling updates.</p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="flex flex-col gap-0.5 p-1.5 bg-black/50 border border-zinc-950/50 rounded pl-2.5 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a5c1a]" />
                  <div className="flex justify-between items-center text-[9px] text-gray-500">
                    <span className="font-black text-zinc-400 shrink-0 select-all">LOG-{m.id}</span>
                    <span>TICK_STAMP: {m.tickOccurred}</span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-0.5 leading-relaxed">{m.playerActionContext}</p>
                  <p className="text-[9px] text-cyan-500/80">
                    AI Strategic Action State: <strong>{m.aiCounterActionExecuted}</strong> | Learning Shift: +{m.learnedWeightShift} weights
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
    </PanelFxShell>
  );
}
