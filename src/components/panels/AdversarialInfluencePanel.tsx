import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useInfluenceStore } from '../../store/influenceStore';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { audio } from '../../utils/audio';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  AlertTriangle,
  Fingerprint,
  Eye,
  EyeOff,
  Activity,
  Zap,
  Globe,
  Gauge,
  Sliders,
  Sparkles,
  Lock,
  Search,
  Scale,
  BrainCircuit,
  Settings2,
  Trash2,
  X,
  PlusCircle
} from 'lucide-react';

export default function AdversarialInfluencePanel() {
  const {
    propagandaCampaigns,
    deceptionCampaigns,
    plantedPackets,
    counterintelligenceResponses,
    playerBelief,
    trustChannels,
    misperceptionRisk,
    falseCertaintyVectors,
    counterAssets,
    baitOpportunities,
    outcomeTraces,
    difficultyLevel,
    warningMetrics,
    tickInfluenceSystem,
    triggerCIAction,
    investigateBait,
    scoutPacket,
    quarantineChannel,
    toggleCounterAsset,
    triggerAdversarialCampaign,
    plantFakeIntercept,
    adjustDifficulty,
    dismissOutcomeTrace
  } = useInfluenceStore();

  const playerCash = usePlayerStore((s) => s.cashB);

  const [activeSubTab, setActiveSubTab] = useState<'CAMPAIGNS' | 'CI_PROTOCOLS' | 'COGNITIVE_BIAS' | 'BAITS'>('CAMPAIGNS');

  // Utility to map country flag
  const getAdversaryName = (id: string) => {
    switch (id) {
      case 'RU': return 'Russia (SVR)';
      case 'CN': return 'China (MSS)';
      case 'KP': return 'North Korea (RGB)';
      case 'IR': return 'Iran (VEVAK)';
      default: return id;
    }
  };

  const getAdversaryColor = (id: string) => {
    switch (id) {
      case 'RU': return 'text-[#ff3b30] border-[#ff3b30]/30 bg-[#ff3b30]/5';
      case 'CN': return 'text-[#ffcc00] border-[#ffcc00]/30 bg-[#ffcc00]/5';
      case 'KP': return 'text-[#ff9500] border-[#ff9500]/30 bg-[#ff9500]/5';
      case 'IR': return 'text-[#4cd964] border-[#4cd964]/30 bg-[#4cd964]/5';
      default: return 'text-gray-400 border-gray-700 bg-gray-900/5';
    }
  };

  return (
    <PanelFxShell panelId="cognitive_shield" relevantFxTypes={['COUP_SUCCESS','REGIME_CHANGE','WAR_DECLARED','REGIME_PRESSURE_CRITICAL','CYBER_ATTACK']}>
      <div id="influence-panel-root" className="flex flex-col h-full bg-[#030703] border border-[#1a5c1a]/40 text-gray-100 font-mono text-xs rounded shadow-2xl overflow-hidden p-4 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#144214] pb-3 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert id="ci-hdr-icon" className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-400 tracking-widest uppercase">COGNITIVE DOMINANCE & ADV-INFLUENCE HUBS</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Analyzing electronic subversion, planted intelligence decoys, and foreign cognitive manipulation campaigns targeting Allied decision models.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#00ff44] uppercase font-bold">Threat Level:</span>
          <select
            value={difficultyLevel}
            onChange={(e) => {
              audio.sfxKeyClick();
              adjustDifficulty(e.target.value as any);
            }}
            className="bg-black/80 border border-[#144214] text-[#00ff44] text-[10px] uppercase font-bold py-1 px-2 rounded cursor-pointer hover:border-[#00ff44] outline-none"
          >
            <option value="EASY">EASY (PERSUASION DISENGAGED)</option>
            <option value="NORMAL">NORMAL (ACTIVE DECEPTION)</option>
            <option value="HARD">HARD (COGNITIVE WARFARE)</option>
            <option value="COGNITIVE_WARFARE">TOTAL DOMINANCE COGNITIVE HYBRID</option>
          </select>
        </div>
      </div>

      {/* CORE WAR ROOM METERS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        
        <div className="p-2 border border-[#1a5c1a]/30 bg-black/50 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Rumor Pressure</span>
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-yellow-400">{warningMetrics.rumorPressure}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1 rounded mt-1.5 overflow-hidden">
            <div className="bg-yellow-400 h-full" style={{ width: `${warningMetrics.rumorPressure}%` }} />
          </div>
          <span className="text-[7.5px] mt-1 text-gray-500">Public media noise spectrum</span>
        </div>

        <div className="p-2 border border-[#1a5c1a]/30 bg-black/50 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Anomaly Pressure</span>
            <Activity className="w-3.5 h-3.5 text-[#00e5ff]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-[#00e5ff]">{warningMetrics.anomalyPressure}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1 rounded mt-1.5 overflow-hidden">
            <div className="bg-[#00e5ff] h-full" style={{ width: `${warningMetrics.anomalyPressure}%` }} />
          </div>
          <span className="text-[7.5px] mt-1 text-gray-500">Unreconciled sensor mismatches</span>
        </div>

        <div className="p-2 border border-[#1a5c1a]/30 bg-black/50 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Deception Suspicion</span>
            <Search className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-red-400">{warningMetrics.deceptionSuspicion}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1 rounded mt-1.5 overflow-hidden">
            <div className="bg-red-500 h-full" style={{ width: `${warningMetrics.deceptionSuspicion}%` }} />
          </div>
          <span className="text-[7.5px] mt-1 text-gray-500">Active planted packet flags</span>
        </div>

        <div className="p-2 border border-[#1a5c1a]/30 bg-black/50 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Source Burn Risk</span>
            <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-purple-400">{warningMetrics.sourceBurnRisk}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1 rounded mt-1.5 overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: `${warningMetrics.sourceBurnRisk}%` }} />
          </div>
          <span className="text-[7.5px] mt-1 text-gray-500">HUMINT exposure risk</span>
        </div>

        <div className="p-2 border border-[#144214] bg-[#0c1f0d]/30 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400 uppercase font-bold">Contamination</span>
            <Globe className="w-3.5 h-3.5 text-[#00ff44]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-[#00ff44]">{warningMetrics.contaminationLevel}%</span>
          </div>
          <div className="w-full bg-gray-900 h-1 rounded mt-1.5 overflow-hidden">
            <div className="bg-[#00ff44] h-full" style={{ width: `${warningMetrics.contaminationLevel}%` }} />
          </div>
          <span className="text-[7.5px] mt-1 text-gray-400">Average poisoned channels</span>
        </div>

      </div>

      {/* SUB TAB LAYOUT */}
      <div className="flex border-b border-[#144214] mb-4 overflow-x-auto gap-1">
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('CAMPAIGNS'); }}
          className={`px-3.5 py-1.5 text-[10px] tracking-widest font-bold uppercase cursor-pointer rounded-t ${
            activeSubTab === 'CAMPAIGNS'
              ? 'bg-[#144214]/65 border-t border-x border-[#1a5c1a] text-[#00ff44]'
              : 'text-gray-400 hover:text-white hover:bg-[#071307]'
          }`}
        >
          Cognitive Attacks ({propagandaCampaigns.length + deceptionCampaigns.length})
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('CI_PROTOCOLS'); }}
          className={`px-3.5 py-1.5 text-[10px] tracking-widest font-bold uppercase cursor-pointer rounded-t ${
            activeSubTab === 'CI_PROTOCOLS'
              ? 'bg-[#144214]/65 border-t border-x border-[#1a5c1a] text-[#00ff44]'
              : 'text-gray-400 hover:text-white hover:bg-[#071307]'
          }`}
        >
          CI Counters ({counterintelligenceResponses.filter(r => r.active).length} Active)
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('COGNITIVE_BIAS'); }}
          className={`px-3.5 py-1.5 text-[10px] tracking-widest font-bold uppercase cursor-pointer rounded-t ${
            activeSubTab === 'COGNITIVE_BIAS'
              ? 'bg-[#144214]/65 border-t border-x border-[#1a5c1a] text-[#00ff44]'
              : 'text-gray-400 hover:text-white hover:bg-[#071307]'
          }`}
        >
          Allied Belief Profiles & Bias
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setActiveSubTab('BAITS'); }}
          className={`px-3.5 py-1.5 text-[10px] tracking-widest font-bold uppercase cursor-pointer rounded-t ${
            activeSubTab === 'BAITS'
              ? 'bg-[#144214]/65 border-t border-x border-[#1a5c1a] text-[#00ff44]'
              : 'text-gray-400 hover:text-white hover:bg-[#071307]'
          }`}
        >
          Hostile Bait Chambers ({baitOpportunities.length})
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[220px]">
        {activeSubTab === 'CAMPAIGNS' && (
          <div className="flex flex-col gap-4">
            
            {/* PROPAGANDA CAMPAIGNS GRID */}
            <div>
              <div className="flex justify-between items-center bg-[#071307] p-2 border-l-2 border-[#ff3b30] mb-2">
                <span className="font-bold text-[#ff3b30] uppercase text-[10px] tracking-wider">ACTIVE ADVERSARIAL PERSUASION CAMPAIGNS</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { audio.sfxKeyClick(); triggerAdversarialCampaign('RU'); }}
                    className="bg-[#ff3b30]/20 text-red-400 hover:bg-[#ff3b30]/30 hover:text-white border border-[#ff3b30]/40 text-[8.5px] px-2 py-0.5 rounded cursor-pointer"
                  >
                    Simulate Russia Attack
                  </button>
                  <button
                    onClick={() => { audio.sfxKeyClick(); triggerAdversarialCampaign('CN'); }}
                    className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/40 hover:bg-yellow-400/20 hover:text-white text-[8.5px] px-2 py-0.5 rounded cursor-pointer"
                  >
                    Simulate China Attack
                  </button>
                </div>
              </div>

              {propagandaCampaigns.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-800 text-center text-gray-500 rounded">
                  No active cognitive persuasion campaigns detected in current network spectrum.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {propagandaCampaigns.map((camp) => (
                    <div key={camp.id} className="p-3 border border-red-950/40 bg-black/60 rounded flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute right-2 top-2">
                        <span className="text-[7px] uppercase px-1 border border-red-500/40 text-red-400 rounded bg-red-950/20">
                          STAGE: {camp.stage}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getAdversaryColor(camp.adversaryCountryId)}`}>
                          {getAdversaryName(camp.adversaryCountryId)}
                        </span>
                        <span className="font-bold text-silver uppercase tracking-wider">{camp.codename}</span>
                      </div>

                      <div className="text-[10px] text-gray-300">
                        <span className="text-gray-500">Narrative Frame:</span> "{camp.narrativeFrame.replace(/_/g, ' ')}"
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] pt-1 border-t border-gray-900 mt-1">
                        <div>
                          <span className="text-gray-500">Target Channel:</span> <span className="text-purple-400 font-semibold">{camp.targetChannelId.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cognitive Reach:</span> <span className="text-red-400">{camp.reachIndex}/100</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Susceptibility:</span> <span className="text-yellow-500">{camp.susceptibilityIndex}/100</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Popular Unrest Cost:</span> <span className="text-red-400">+{camp.unrestImpact.toFixed(1)}/tick</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PLANTED INTELLIGENCE PACKETS */}
            <div className="mt-2">
              <div className="flex justify-between items-center bg-[#071307] p-2 border-l-2 border-[#00ebff] mb-2">
                <span className="font-bold text-[#00ebff] uppercase text-[10px] tracking-wider">PLANTED INTELLIGENCE DECIDED INCOMING DOSSIERS</span>
                <button
                  onClick={() => { audio.sfxKeyClick(); plantFakeIntercept('RU'); }}
                  className="bg-[#00ebff]/10 text-[#00ebff] border border-[#00ebff]/30 hover:bg-[#00ebff]/20 text-[8.5px] px-2 py-0.5 rounded cursor-pointer"
                >
                  Force Plant Forged Packet
                </button>
              </div>

              {plantedPackets.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-800 text-center text-gray-500 rounded">
                  All signal channels clean. No suspicious intercept leaks identified.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {plantedPackets.map((pkt) => (
                    <div key={pkt.id} className={`p-3 border rounded text-[10px] flex flex-col gap-2 relative ${
                      pkt.isExposed 
                        ? 'border-green-600 bg-[#061706]/40' 
                        : pkt.analyzed 
                          ? 'border-gray-800 bg-[#121212]' 
                          : 'border-yellow-950/40 bg-black/60'
                    }`}>
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <span className={`text-[8px] uppercase px-1 rounded ${
                          pkt.isExposed 
                            ? 'bg-green-950 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-950 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {pkt.isExposed ? 'EXPOSED FABRICATION' : pkt.analyzed ? 'SCOUTED & ANALYZED' : 'UNVERIFIED INTERCEPT'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-semibold">[PROVENANCE: {pkt.provenanceSource}]</span>
                        <span className="text-gray-400">Format: {pkt.format.replace(/_/g, ' ')}</span>
                      </div>

                      <h4 className="font-bold text-gray-100 text-sm">{pkt.headline}</h4>
                      <p className="text-gray-400 leading-normal text-[9.5px]">
                        {pkt.content}
                      </p>

                      <div className="flex items-center justify-between border-t border-gray-900 pt-2 mt-1">
                        <div className="flex gap-4 text-[9px]">
                          <div>
                            <span className="text-gray-500">Perceived Credibility:</span> <span className="text-[#00ebff] font-semibold">{pkt.perceivedCredibility}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Detection Difficulty:</span> <span className="text-yellow-600">{pkt.detectionDifficulty}</span>
                          </div>
                        </div>

                        {!pkt.analyzed && (
                          <button
                            onClick={() => { audio.sfxKeyClick(); scoutPacket(pkt.id); }}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-white border border-red-500/40 text-[9px] px-2.5 py-1 rounded cursor-pointer font-bold uppercase transition"
                          >
                            Execute Analytical Scouting
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeSubTab === 'CI_PROTOCOLS' && (
          <div className="flex flex-col gap-4">
            
            {/* COUNTERMEASURES PROTOCOLS ACTIONS */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-[#00ff44] mb-3">
                <span className="font-bold text-[#00ff44] uppercase text-[10px] tracking-wider">ACTIVE COUNTERINTELLIGENCE PROTOCOLS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {counterintelligenceResponses.map((ci) => {
                  const cooldownLeft = ci.cooldownRemaining;
                  const isReady = cooldownLeft === 0;
                  const hasCash = playerCash >= ci.costCashB;

                  return (
                    <div key={ci.id} className={`p-3 border rounded flex flex-col justify-between gap-2.5 transition ${
                      ci.active 
                        ? 'border-[#00ff44] bg-[#0c1f0d]/30' 
                        : 'border-[#1a5c1a]/30 bg-black/60 hover:border-[#1a5c1a]/50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-100 text-[11px] uppercase tracking-wider">{ci.title}</h4>
                          <span className="text-[8.5px] text-gray-500">Type: {ci.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[7.5px] uppercase font-bold px-1 py-0.5 rounded border border-gray-700 bg-gray-800 text-gray-300">
                            Success: {ci.successProbability}%
                          </span>
                        </div>
                      </div>

                      <p className="text-[9.5px] text-gray-400 leading-normal">
                        {ci.narrativeOnTrigger}
                      </p>

                      <div className="flex items-center justify-between border-t border-gray-900/60 pt-2.5 mt-1.5">
                        <div className="flex gap-2 text-[9px]">
                          <span className="text-[#00ff44] font-semibold">Cost: ${ci.costCashB}B</span>
                          <span className="text-gray-500">|</span>
                          <span className="text-cyan-400">{ci.costAP} AP</span>
                        </div>

                        <button
                          disabled={!isReady || ci.active || !hasCash}
                          onClick={() => { audio.sfxKeyClick(); triggerCIAction(ci.id); }}
                          className={`text-[9px] font-bold px-3 py-1 rounded border uppercase cursor-pointer transition ${
                            ci.active
                              ? 'bg-green-950/20 text-green-400 border-green-500/30 cursor-not-allowed'
                              : cooldownLeft > 0
                                ? 'bg-orange-950/20 text-orange-400 border-orange-500/30 cursor-not-allowed'
                                : !hasCash
                                  ? 'bg-red-950/20 text-red-500 border-red-500/30 cursor-not-allowed'
                                  : 'bg-[#1a5c1a]/20 text-[#00ff44] border-[#00ff44]/40 hover:bg-[#1a5c1a]/40 hover:text-white hover:border-[#00ff44]'
                          }`}
                        >
                          {ci.active 
                            ? 'PROTOCOL CONCLUDED' 
                            : cooldownLeft > 0 
                              ? `COOLDOWN: ${cooldownLeft}t` 
                              : !hasCash 
                                ? 'CASH BANK EXHAUSTED' 
                                : 'INITIATE DEPLOY'
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TRUST CHANNELS POISON STATUS */}
            <div className="mt-2">
              <div className="bg-[#071307] p-2 border-l-2 border-purple-500 mb-2">
                <span className="font-bold text-purple-400 uppercase text-[10px] tracking-wider">DISTRUBTED SIGNAL & CHANNEL POISON INDEX</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trustChannels.map((ch) => {
                  const hasCash = playerCash >= 0.5;
                  return (
                    <div key={ch.id} className="p-3 border border-purple-950/20 bg-black/60 rounded flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200 text-[10px]">{ch.channelName}</span>
                        <span className={`text-[8.5px] uppercase font-bold text-purple-400`}>
                          Poison: {ch.currentPoisoningLevel}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-900 h-1.5 rounded overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            ch.currentPoisoningLevel > 40 ? 'bg-red-500' : 'bg-purple-500'
                          }`} 
                          style={{ width: `${ch.currentPoisoningLevel}%` }} 
                        />
                      </div>

                      <div className="flex items-center justify-between text-[8px] mt-1 text-gray-500">
                        <div className="flex gap-2">
                          <span>Base Reliability: {ch.baseReliability}%</span>
                          <span>|</span>
                          <span>Reach: {ch.reachingCoverage}%</span>
                        </div>

                        {ch.currentPoisoningLevel > 0 && (
                          <button
                            disabled={!hasCash}
                            onClick={() => { audio.sfxKeyClick(); quarantineChannel(ch.id); }}
                            className={`px-2 py-0.5 border text-[7.5px] rounded uppercase cursor-pointer transition ${
                              !hasCash 
                                ? 'border-red-900/40 text-red-500 bg-red-950/10 cursor-not-allowed'
                                : 'border-purple-500/40 text-purple-400 bg-purple-950/10 hover:bg-purple-950/20 hover:text-white hover:border-purple-500'
                            }`}
                          >
                            Quarantine Channel ($0.5B)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {activeSubTab === 'COGNITIVE_BIAS' && (
          <div className="flex flex-col gap-4">
            
            {/* PLAYER BELIEF STATE MODEL */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-[#00ff44] mb-2 text-xs flex justify-between items-center">
                <span className="font-bold text-[#00ff44] uppercase text-[10px] tracking-wider">ALLIED COGNITIVE BELIEF PROFILE & ANCHORS</span>
                <span className="text-[9px] text-[#00e5ff] uppercase font-bold">MISPERCEPTION RISK SCORE: {misperceptionRisk.riskScore}%</span>
              </div>

              <div className="p-3 border border-[#1a5c1a]/30 bg-black/60 rounded flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px]">
                  <div>
                    <h4 className="font-bold text-gray-300 mb-1">Perceived Main Threat Vector</h4>
                    <div className="p-2 border border-blue-950/40 text-cyan-400 font-bold bg-cyan-950/5 rounded">
                      {playerBelief.perceivedMainThreatVector.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-300 mb-1">Current Focus Paradigm</h4>
                    <div className="p-2 border border-green-950/40 text-green-400 font-bold bg-green-950/5 rounded">
                      {playerBelief.dominantNarrative}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[10px]">
                  <div>
                    <h4 className="font-bold text-red-400 uppercase text-[9px] mb-1">Active Misperceptions List</h4>
                    <ul className="list-disc pl-4 text-gray-400 flex flex-col gap-1.5">
                      {playerBelief.activeMisperceptions.map((mis, idx) => (
                        <li key={idx}>"{mis}"</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#00ff44] uppercase text-[9px] mb-1">Anchored Strategic Asserts</h4>
                    <ul className="list-disc pl-4 text-gray-400 flex flex-col gap-1.5">
                      {playerBelief.anchoredAssumptions.map((anch, idx) => (
                        <li key={idx}>"{anch}"</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-[#1a5c1a]/20 pt-2.5 mt-2">
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <div>
                      <span className="font-bold uppercase text-[9px] text-yellow-500">Root Cognitive Vulnerability:</span>
                      <p className="text-[9.5px] mt-1 text-gray-300 font-semibold">{misperceptionRisk.primaryFactor}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FALSE CERTAINTY VECTOR LIST */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-orange-500 mb-2">
                <span className="font-bold text-orange-400 uppercase text-[10px] tracking-wider">IMPLANTED FALSE CERTAINTY VECTOR ALIGNMENT</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {falseCertaintyVectors.map((vector) => (
                  <div key={vector.id} className="p-3 border border-orange-950/30 bg-black/60 rounded flex flex-col gap-2 relative">
                    <div className="text-gray-200 leading-relaxed text-[10.5px]">
                      "{vector.beliefStatement}"
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-900 pt-2 mt-1.5 text-[9px] text-gray-500">
                      <span>Perceived Certainty: <span className="text-orange-400 font-bold">{vector.perceivedCertainty}%</span></span>
                      <span className="text-red-400 uppercase font-bold text-[8px]">
                        {vector.actualRealityInverted ? 'Reality Inverted Decoy' : 'Accurate Reality'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SYSTEM EXPLAINTER & NARRATIVE TRACES */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-red-500 mb-2">
                <span className="font-bold text-red-400 uppercase text-[10px] tracking-wider">COGNITIVE MANIPULATION OUTCOME INCIDENTS HISTROY</span>
              </div>

              <div className="flex flex-col gap-2">
                {outcomeTraces.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-800 text-center text-gray-500 rounded">
                    No strategic manipulation outcomes logged in historical records.
                  </div>
                ) : (
                  outcomeTraces.map((trace, idx) => (
                    <div key={idx} className="p-2.5 border border-red-950/30 bg-black/65 rounded flex items-start justify-between gap-3 text-[10px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-400 font-bold">[{trace.outcomeType.replace(/_/g, ' ')}]</span>
                          <span className="text-gray-500">Tick: {trace.tick}</span>
                          <span className="text-purple-400 font-semibold">{trace.campaignCodename}</span>
                        </div>
                        <p className="text-gray-300 mt-1 leading-normal">
                          {trace.effectDescription}
                        </p>
                      </div>

                      <button
                        onClick={() => { audio.sfxKeyClick(); dismissOutcomeTrace(idx); }}
                        className="text-gray-500 hover:text-white hover:bg-gray-900/60 p-1 rounded cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeSubTab === 'BAITS' && (
          <div className="flex flex-col gap-4">
            
            {/* BAIT BELIEFS */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-yellow-500 mb-2">
                <span className="font-bold text-yellow-500 uppercase text-[10px] tracking-wider">HOAX DECOYS & BAIT BELIEF HOLES</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {baitOpportunities.map((bait) => {
                  return (
                    <div key={bait.id} className={`p-3 border rounded flex flex-col justify-between gap-2.5 ${
                      bait.revealedAsTrap 
                        ? 'border-yellow-500 bg-yellow-950/10' 
                        : 'border-[#1a5c1a]/20 bg-black/60'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8.5px] uppercase font-bold text-[#00ebff]">Bait Type: {bait.baitType.replace(/_/g, ' ')}</span>
                          <p className="text-gray-100 text-[10.5px] font-semibold mt-1 leading-normal">
                            "{bait.statement}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-900 pt-2.5 mt-1">
                        <div className="flex gap-2 text-[8.5px] text-gray-500">
                          <span>Attractiveness: {bait.attractivenessScore}/100</span>
                          <span>|</span>
                          <span>Scout Actions: {bait.timesInvestigated}</span>
                        </div>

                        {bait.revealedAsTrap ? (
                          <span className="text-yellow-400 font-bold uppercase text-[9px] px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-950/20">
                            TRAP DISCOVERED
                          </span>
                        ) : (
                          <button
                            onClick={() => { audio.sfxKeyClick(); investigateBait(bait.id); }}
                            className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 hover:text-white border border-yellow-500/40 text-[9px] px-2.5 py-0.5 rounded cursor-pointer font-bold uppercase transition"
                          >
                            Investigate Probe
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COUNTER-NARRATIVE ASSETS TOGGLE */}
            <div>
              <div className="bg-[#071307] p-2 border-l-2 border-cyan-500 mb-2">
                <span className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider">ALLIED TRUTH REVERAL MEDIA BROADCAST CHANNELS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {counterAssets.map((asset) => {
                  return (
                    <div key={asset.id} className={`p-2.5 border rounded flex flex-col justify-between gap-2.5 transition ${
                      asset.active 
                        ? 'border-[#00ff44] bg-[#0c1f0d]/30 shadow-[0_0_8px_rgba(0,255,68,0.1)]' 
                        : 'border-[#1a5c1a]/20 bg-black/60'
                    }`}>
                      <div>
                        <h4 className="font-bold text-gray-100 text-[10px]">{asset.name}</h4>
                        <span className="text-[8px] text-gray-500 font-semibold">Category: {asset.mediaCategory.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-900 pt-2 mt-1">
                        <div className="flex flex-col text-[8px] text-gray-500">
                          <span>Credibility: {asset.credibilityIndex}%</span>
                          <span>Cost: ${asset.costPerTick}/t</span>
                        </div>

                        <button
                          onClick={() => { audio.sfxKeyClick(); toggleCounterAsset(asset.id); }}
                          className={`text-[8.5px] font-bold px-2.5 py-0.5 border rounded uppercase cursor-pointer transition ${
                            asset.active 
                              ? 'bg-[#00ff44]/20 text-[#00ff44] border-[#00ff44]/40 hover:bg-[#00ff44]/45' 
                              : 'bg-[#121212] text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                          }`}
                        >
                          {asset.active ? 'ACTIVE' : 'OFFLINE'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
    </PanelFxShell>
  );
}
