import React, { useMemo, useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFinintStore } from '../../store/finintStore';
import { 
  FinancialCoercionType, 
  FinancialActor, 
  JurisdictionProfile, 
  ShellEntity 
} from '../../types/finint';
import { 
  DollarSign, 
  ShieldAlert, 
  Building, 
  Building2, 
  Globe, 
  FileText, 
  Sliders, 
  Lock, 
  Unlock, 
  Fingerprint, 
  AlertTriangle, 
  Layers, 
  Activity, 
  Radio, 
  Zap, 
  ArrowRight,
  TrendingUp,
  FileCheck,
  Percent,
  Timer
} from 'lucide-react';
import { audio } from '../../utils/audio';

export default function FinintPanel() {
  const { 
    actors, 
    jurisdictions, 
    shells, 
    activeActions, 
    incidentsLog,
    selectedActorId,
    selectedJurisdictionId,
    selectedSidebarTab,
    legitimacyDrain,
    paymentFragmentationRisk,
    dollarDominanceErosion,
    globalAggregatedBlowback,
    setSelectedActorId,
    setSelectedJurisdictionId,
    setSelectedSidebarTab,
    calculateFinancialPreview,
    executeFinancialAction,
    toggleShellStatus,
    updateJurisdictionCooperation
  } = useFinintStore();

  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);
  const playerCountryId = usePlayerStore((s) => s.countryId) || 'US';

  // Local state for interactive Coercion weapon sandbox
  const [sandboxTactic, setSandboxTactic] = useState<FinancialCoercionType>('ASSET_FREEZE');
  const [sandboxTargetCountry, setSandboxTargetCountry] = useState<string>('RU');
  const [sandboxTargetActor, setSandboxTargetActor] = useState<string>('volkov_holding');
  const [sandboxIntensity, setSandboxIntensity] = useState<number>(55);
  const [activePreview, setActivePreview] = useState<any | null>(null);

  // Derived selected profile items
  const selectedActorData = useMemo(() => {
    if (!selectedActorId) return null;
    return actors.find(a => a.id === selectedActorId) || null;
  }, [selectedActorId, actors]);

  const selectedJurisdictionData = useMemo(() => {
    if (!selectedJurisdictionId) return null;
    return jurisdictions.find(j => j.id === selectedJurisdictionId) || null;
  }, [selectedJurisdictionId, jurisdictions]);

  const associatedShellsForSelectedActor = useMemo(() => {
    if (!selectedActorId) return [];
    return shells.filter(s => s.linkedActorId === selectedActorId);
  }, [selectedActorId, shells]);

  const handleActorClick = (id: string) => {
    audio.sfxKeyClick();
    if (selectedActorId === id) {
      setSelectedActorId(null);
    } else {
      setSelectedActorId(id);
    }
  };

  const handleJurisdictionClick = (id: string) => {
    audio.sfxKeyClick();
    if (selectedJurisdictionId === id) {
      setSelectedJurisdictionId(null);
    } else {
      setSelectedJurisdictionId(id);
    }
  };

  const handleGeneratePreview = () => {
    audio.sfxKeyClick();
    const result = calculateFinancialPreview(
      sandboxTactic, 
      sandboxTargetCountry, 
      sandboxTargetActor === 'NONE' ? undefined : sandboxTargetActor, 
      sandboxIntensity
    );
    setActivePreview(result);
  };

  const handleExecuteAction = () => {
    if (!activePreview) return;
    audio.sfxKeyClick();
    executeFinancialAction(
      sandboxTactic, 
      sandboxTargetCountry, 
      sandboxTargetActor === 'NONE' ? undefined : sandboxTargetActor, 
      sandboxIntensity
    );
    setActivePreview(null);
  };

  const getActorTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <PanelFxShell panelId="finint" relevantFxTypes={['MARKET_CRASH','ECONOMIC_COLLAPSE','SANCTIONS_ESCALATION']}>
      <div id="finint-classified-console" className="flex flex-col h-full bg-[#050505]/95 text-gray-200 p-2.5 font-mono text-[10px] leading-relaxed select-none">
      
      {/* 1. TOP STATS AND TELEMETRY GRID */}
      <div id="finint-kpi-bar" className="flex flex-wrap justify-between items-center border-b border-amber-900/30 pb-2 mb-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded">
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-widest text-amber-500 uppercase">FININT // FINANCIAL INTELLIGENCE & COERCIOUS</h2>
            <p className="text-[8px] text-gray-400 font-sans">MONITORING ILLICIT WEALTH NETWORKS, SECTOR JURISDICTIONS, SWIFT EXCLUSIONS, AND SYSTEMIC COLLATERAL FALLOUTS</p>
          </div>
        </div>

        {/* Global Risk Indicators */}
        <div className="flex items-center gap-3 bg-[#0a0805] border border-amber-950 px-3 py-1 rounded text-[8px] tracking-wider">
          <div className="flex flex-col">
            <span className="text-gray-400 font-light text-[7px]">LEGITIMACY DRAIN</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold ${legitimacyDrain > 50 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {Math.round(legitimacyDrain)}%
              </span>
              <span className="text-[6px] text-gray-400">({legitimacyDrain > 40 ? 'LOW TRUST' : 'STABLE'})</span>
            </div>
          </div>
          <div className="w-[1px] h-6 bg-amber-950" />
          <div className="flex flex-col">
            <span className="text-gray-400 font-light text-[7px]">PAYMENT SYSTEM STRESS</span>
            <span className="text-xs font-bold text-[#00e5ff]">{Math.round(paymentFragmentationRisk)}%</span>
          </div>
          <div className="w-[1px] h-6 bg-amber-950" />
          <div className="flex flex-col">
            <span className="text-gray-400 font-light text-[7px]">DOLLAR DOMINANCE EROSION</span>
            <span className="text-xs font-bold text-emerald-400">{Math.round(dollarDominanceErosion)}%</span>
          </div>
          <div className="w-[1px] h-6 bg-amber-950" />
          <div className="flex flex-col">
            <span className="text-gray-400 font-light text-[7px]">CUMULATIVE METRIC BLOWBACK</span>
            <span className={`text-xs font-bold ${globalAggregatedBlowback > 60 ? 'text-red-400 font-black animate-pulse' : 'text-amber-400'}`}>
              {Math.round(globalAggregatedBlowback)}% RISK
            </span>
          </div>
        </div>
      </div>

      {/* 2. MODE SELECTORS / NAVIGATION RAILS */}
      <div id="finint-tab-selector" className="flex items-center gap-1 mb-2.5 bg-black/60 p-1 border border-amber-950/20 rounded">
        <button
          onClick={() => { audio.sfxKeyClick(); setSelectedSidebarTab('capital'); }}
          className={`py-1 px-3.5 rounded font-sans text-[8.5px] font-bold tracking-wider cursor-pointer ${
            selectedSidebarTab === 'capital'
              ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.1)]'
              : 'bg-transparent border border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          ● CORES & SHELL CAPITAL NETWORKS
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setSelectedSidebarTab('jurisdictions'); }}
          className={`py-1 px-3.5 rounded font-sans text-[8.5px] font-bold tracking-wider cursor-pointer ${
            selectedSidebarTab === 'jurisdictions'
              ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.1)]'
              : 'bg-transparent border border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          ● SECRECY JURISDICTIONS POSTURE
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setSelectedSidebarTab('coercion'); }}
          className={`py-1 px-3.5 rounded font-sans text-[8.5px] font-bold tracking-wider cursor-pointer ${
            selectedSidebarTab === 'coercion'
              ? 'bg-amber-500/15 border border-amber-500/50 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.1)]'
              : 'bg-transparent border border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          ● COERCIVE PRESSURE TERMINAL
        </button>
      </div>

      {/* 3. COOP TWIN-PANELS MAIN PANEL WORKSPACE */}
      <div id="finint-main-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-[300px]">
        
        {/* TAB 1: CAPITAL AND OFFSHORE NETWORKS */}
        {selectedSidebarTab === 'capital' && (
          <>
            {/* Left list of actors */}
            <div className="lg:col-span-5 flex flex-col border border-amber-950/30 bg-black/60 rounded p-2">
              <span className="text-[7.5px] text-amber-500/75 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                <span>FLIGHT RISK / HIGH-VALUE FINANCIAL OBJECTS REGISTERED</span>
              </span>

              <div id="actors-list-viewport" className="flex-1 overflow-y-auto max-h-[310px] space-y-1 scrollbar-thin pr-1">
                {actors.map((actor) => {
                  const isSelected = selectedActorId === actor.id;
                  const associatedShellsCount = shells.filter(s => s.linkedActorId === actor.id).length;
                  return (
                    <div
                      key={actor.id}
                      onClick={() => handleActorClick(actor.id)}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/20 border-amber-500 text-amber-100 shadow-[0_0_6px_rgba(245,158,11,0.08)]'
                          : 'bg-[#0a0705]/80 border-amber-950/40 text-gray-300 hover:border-amber-900/60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-white text-[8.5px]">{actor.name}</span>
                        <span className="text-[7px] text-[#00e5ff] uppercase px-1 border border-cyan-500/20 bg-cyan-950/20 rounded">
                          {actor.linkedCountryId}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[7px] text-gray-400">
                        <span className="uppercase">{getActorTypeLabel(actor.actorType)}</span>
                        <span className="text-amber-400 font-bold">CAPITAL: ${(actor.capitalWeight / 1000).toFixed(1)}B</span>
                      </div>

                      <div className="flex justify-between items-center text-[6.5px] border-t border-amber-950/20 mt-1 pt-1">
                        <span>SANCTIONS: <span className="font-bold text-red-400">{actor.associatedSanctionStatus}</span></span>
                        <span>{associatedShellsCount} SHELLS DETECTED</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right details panel for actor */}
            <div className="lg:col-span-7 flex flex-col border border-amber-950/30 bg-[#070503] rounded p-2.5">
              {selectedActorData ? (
                <div id="actor-detail-dossier" className="flex flex-col h-full gap-2 text-[8px]">
                  <div className="flex justify-between items-start border-b border-amber-950/30 pb-1">
                    <div>
                      <span className="text-[6.5px] text-amber-400 uppercase font-bold tracking-wider">OFFSHORE DOSSIER AND CAPITALS NETWORK</span>
                      <h3 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">{selectedActorData.name}</h3>
                    </div>
                    <button
                      onClick={() => { audio.sfxKeyClick(); setSelectedActorId(null); }}
                      className="text-gray-400 hover:text-white border border-amber-950/30 px-1 py-0.2 rounded text-[7px]"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[7.5px]">
                    <div className="bg-black/50 border border-amber-950/40 p-1.5 rounded">
                      <span className="text-gray-400 block font-light">NETWORK ROLE / EXPLOITATION</span>
                      <p className="font-bold text-white uppercase mt-0.5">{selectedActorData.networkRole}</p>
                    </div>
                    <div className="bg-black/50 border border-amber-950/40 p-1.5 rounded">
                      <span className="text-gray-400 block font-light">SANCTION DESIGNATION FLAG</span>
                      <p className="font-extrabold text-red-500 mt-0.5 uppercase">{selectedActorData.associatedSanctionStatus}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[7px] text-gray-300">
                    <div className="bg-black/30 p-1 rounded border border-amber-950/20">
                      <span className="text-gray-500 block">TOTAL VALUE WEIGHT</span>
                      <span className="font-bold text-white text-[8.5px]">${(selectedActorData.capitalWeight / 1000).toFixed(1)}B USD</span>
                    </div>
                    <div className="bg-black/30 p-1 rounded border border-amber-950/20">
                      <span className="text-gray-500 block">UNCOVER VISIBILITY</span>
                      <span className="font-bold text-[#00e5ff] text-[8.5px]">{selectedActorData.visibilityScore}%</span>
                    </div>
                    <div className="bg-black/30 p-1 rounded border border-amber-950/20">
                      <span className="text-gray-500 block">DENIABILITY CAP</span>
                      <span className="font-bold text-amber-400 text-[8.5px]">{selectedActorData.plausibleDeniabilityIndex}%</span>
                    </div>
                  </div>

                  {/* Associated Shell Companies Subcomponent */}
                  <div className="flex-1 mt-1 flex flex-col">
                    <span className="text-[7.5px] text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-amber-400" />
                      <span>IDENTIFIED SHELL ENTITIES AND CAPITAL SHELTERS</span>
                    </span>

                    <div className="flex-1 overflow-y-auto max-h-[140px] space-y-1.5 pr-1 scrollbar-thin">
                      {associatedShellsForSelectedActor.length > 0 ? (
                        associatedShellsForSelectedActor.map((shell) => {
                          const isFrozen = shell.status === 'FROZEN';
                          return (
                            <div key={shell.id} className="bg-black/80 border border-amber-950/20 p-2 rounded flex justify-between items-center text-[7.5px]">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-white">{shell.name}</span>
                                  <span className="text-[6.5px] px-1 bg-amber-950/20 text-amber-400 border border-amber-950/30 rounded uppercase">
                                    {shell.jurisdictionId}
                                  </span>
                                </div>
                                <div className="text-gray-400 text-[6.8px] flex items-center gap-2">
                                  <span>SECRECY: {shell.secrecyLevel}%</span>
                                  <span>ASSET CLASSES: {shell.assetClasses.join(', ')}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => { audio.sfxKeyClick(); toggleShellStatus(shell.id); }}
                                className={`px-2 py-0.5 rounded font-sans text-[7px] font-bold cursor-pointer transition-all border ${
                                  isFrozen
                                    ? 'bg-red-950/30 border-red-500/50 text-red-400'
                                    : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
                                }`}
                              >
                                {isFrozen ? 'UNFREEZE SHELL' : '💥 SEIZE ASSETS / FREEZE'}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 italic uppercase">No offshore shell capital nodes registered for this actor profile.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 uppercase h-full py-10 gap-2">
                  <Fingerprint className="w-8 h-8 text-amber-950" />
                  <span>SELECT A REGISTERED CAPITAL ACTOR TO EXPAND OFFSHORE INTERDICTION ANALYTICS</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: SECRECY JURISDICTIONS POSTURE */}
        {selectedSidebarTab === 'jurisdictions' && (
          <>
            {/* Left jurisdictions list */}
            <div className="lg:col-span-5 flex flex-col border border-amber-950/30 bg-black/60 rounded p-2">
              <span className="text-[7.5px] text-amber-500/75 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>SECRECY SHELTERS AND JURISDICTIONS DIRECTORIES</span>
              </span>

              <div id="jurisdiction-list-viewport" className="flex-1 overflow-y-auto max-h-[310px] space-y-1 scrollbar-thin pr-1">
                {jurisdictions.map((jur) => {
                  const isSelected = selectedJurisdictionId === jur.id;
                  const hostedShellsCount = shells.filter(s => s.jurisdictionId === jur.id).length;
                  return (
                    <div
                      key={jur.id}
                      onClick={() => handleJurisdictionClick(jur.id)}
                      className={`p-2 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/20 border-amber-500 text-amber-100 shadow-[0_0_6px_rgba(245,158,11,0.08)]'
                          : 'bg-[#0a0705]/80 border-amber-950/40 text-gray-300 hover:border-amber-900/60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-white text-[8.5px]">{jur.name}</span>
                        <span className="text-[6.5px] text-[#00ff44] px-1 bg-emerald-950/25 border border-emerald-500/20 rounded font-sans scale-90">
                          {jur.secrecyRating} SECRECY
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[7px] text-gray-400 mt-1">
                        <span>COMPLIANCE: <span className="font-bold text-white">{jur.compliancePosture}</span></span>
                        <span className="text-amber-400 font-bold">COOPERATION: {jur.currentCooperationMultiplier}%</span>
                      </div>

                      <div className="flex justify-between items-center text-[6.5px] border-t border-amber-950/20 mt-1 pt-1">
                        <span>ENFORCEMENT RISK: {jur.enforcementRisk}/100</span>
                        <span>{hostedShellsCount} REGISTERED CAPITALS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right details and interactive adjuster slider */}
            <div className="lg:col-span-7 flex flex-col border border-amber-950/30 bg-[#070503] rounded p-2.5">
              {selectedJurisdictionData ? (
                <div id="jurisdiction-detail-panel" className="flex flex-col h-full gap-2 text-[8px]">
                  <div className="flex justify-between items-start border-b border-amber-950/30 pb-0.5">
                    <div>
                      <span className="text-[6.5px] text-amber-400 uppercase font-bold tracking-wider">SOVEREIGN EXPOSURE POLICY & PRESSURE ENGINE</span>
                      <h3 className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">{selectedJurisdictionData.name}</h3>
                    </div>
                    <button
                      onClick={() => { audio.sfxKeyClick(); setSelectedJurisdictionId(null); }}
                      className="text-gray-400 hover:text-white border border-amber-950/30 px-1 py-0.2 rounded text-[7px]"
                    >
                      CLOSE
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[7.5px] mt-1">
                    <div className="bg-black/50 border border-amber-950/40 p-1.5 rounded">
                      <span className="text-gray-400 block font-light">SOVEREIGN PROTECTIVE SHIELDING</span>
                      <p className="font-bold text-white mt-0.5 uppercase">{selectedJurisdictionData.sovereignShieldingPower}/100 SHIELD</p>
                    </div>
                    <div className="bg-black/50 border border-amber-950/40 p-1.5 rounded">
                      <span className="text-gray-400 block font-light">LAUNDERING PARKING ATTRACTIVENESS</span>
                      <p className="font-black text-amber-500 mt-0.5 uppercase">{selectedJurisdictionData.attractivenessForShells}/100 SCORE</p>
                    </div>
                  </div>

                  {/* Active policy manipulator */}
                  <div className="bg-black/60 border border-amber-950/30 p-2.5 rounded flex flex-col gap-1.5">
                    <span className="text-[7.5px] text-[#00ff44] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>COERCE / INCENTIVISE COMPLIANCE COOPERATION LEVEL</span>
                    </span>

                    <p className="text-gray-400 text-[7px] leading-relaxed">
                      Leverage bilateral treaties, treasury sanctions, or intelligence sharing arrays to shift this jurisdiction's compliance metrics dynamically. Increasing integration decreases anonymous capital attraction.
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-1 px-1">
                      <span className="text-gray-400 font-bold uppercase text-[7px]">ENFORCEMENT COOPERATION:</span>
                      <input
                        id="jurisdiction-coop-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={selectedJurisdictionData.currentCooperationMultiplier}
                        onChange={(e) => updateJurisdictionCooperation(selectedJurisdictionData.id, parseInt(e.target.value))}
                        className="flex-1 accent-amber-500 bg-amber-950/40 h-1.2 rounded cursor-pointer"
                      />
                      <span className="text-[#00ff44] text-[9px] font-black w-8 text-right">
                        {selectedJurisdictionData.currentCooperationMultiplier}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-amber-950/20 text-[6.8px] text-gray-500">
                      <span>● HIGHER COOPERATION HIGHLIGHTS SEIZURE FEASIBILITY</span>
                      <span>● LOWER POSTURE PREVENTS EXTRADITION POLICIES</span>
                    </div>
                  </div>

                  {/* Host list for this jurisdiction */}
                  <div className="flex-1 mt-1.5 flex flex-col">
                    <span className="text-[7.5px] text-amber-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>HOSTED ILLICIT NETWORKS REGISTRY</span>
                    </span>

                    <div className="flex-1 overflow-y-auto max-h-[110px] space-y-1 pr-1 scrollbar-thin">
                      {shells.filter(s => s.jurisdictionId === selectedJurisdictionData.id).map(s => (
                        <div key={s.id} className="bg-black/40 border border-amber-950/10 p-1.5 rounded flex justify-between items-center text-[7.5px]">
                          <div>
                            <span className="font-bold text-white">{s.name}</span>
                            <span className="text-gray-400 text-[6.8px] block">STATUS: {s.status} — RISK LEVEL: {s.exposureRisk}%</span>
                          </div>
                          <span className="font-bold text-purple-400">BENEFICIARY: {s.linkedActorId.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 uppercase h-full py-10 gap-2">
                  <Building2 className="w-8 h-8 text-amber-950" />
                  <span>SELECT A SOVEREIGN SHELTER OR OFFSHORE JURISDICTION TO MANIPULATE COMPLIANCE POLICIES</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 3: COERCIVE PRESSURE TERMINAL */}
        {selectedSidebarTab === 'coercion' && (
          <>
            {/* Left Sandbox Controllers */}
            <div className="lg:col-span-5 flex flex-col border border-amber-950/30 bg-black/60 rounded p-2.5 gap-2 font-sans text-[8px]">
              <span className="text-[7.5px] text-amber-500/75 uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>COERCIVE WEAPON SANDBOX SELECTION</span>
              </span>

              {/* Tactic Choice */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase text-[7px] font-bold">COERCIVE ACTION TYPE:</label>
                <select
                  value={sandboxTactic}
                  onChange={(e) => { audio.sfxKeyClick(); setSandboxTactic(e.target.value as any); }}
                  className="bg-black border border-amber-950 text-amber-400 rounded py-0.5 px-1.5 text-[8px] cursor-pointer font-mono"
                >
                  <option value="ASSET_FREEZE">ASSET FREEZE (CORRESPONDENT BLOCKS)</option>
                  <option value="RESERVE_ATTACK">RESERVE ATTACK (CENTRAL BANK LIQUIDITY STRIKE)</option>
                  <option value="DEBT_PRESSURE">DEBT PRESSURE (SOVEREIGN INTERIOR EXPLOITATION)</option>
                  <option value="SWIFT_EXCLUSION">SWIFT MESSAGE CHANNEL REMOVAL</option>
                </select>
              </div>

              {/* Target sovereign */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase text-[7px] font-bold">TARGET NATION:</label>
                <select
                  value={sandboxTargetCountry}
                  onChange={(e) => { audio.sfxKeyClick(); setSandboxTargetCountry(e.target.value); }}
                  className="bg-black border border-amber-950 text-[#00ff44] rounded py-0.5 px-1.5 text-[8px] cursor-pointer font-mono"
                >
                  {Object.keys(countries)
                    .filter(id => id !== playerCountryId)
                    .map(id => (
                      <option key={id} value={id}>{id} — {countries[id]?.name || id}</option>
                    ))}
                </select>
              </div>

              {/* Targeting Actor */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 uppercase text-[7px] font-bold">TARGET SPECIFIC ACTOR CORE (OPTIONAL):</label>
                <select
                  value={sandboxTargetActor}
                  onChange={(e) => { audio.sfxKeyClick(); setSandboxTargetActor(e.target.value); }}
                  className="bg-black border border-amber-950 text-white rounded py-0.5 px-1.5 text-[8px] cursor-pointer font-mono"
                >
                  <option value="NONE">NO SINGLE TARGET (SOVEREIGN OVERALL SYSTEM)</option>
                  {actors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Intensity factor */}
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex justify-between items-center text-[7px] font-bold">
                  <span className="text-gray-400 uppercase">WEAPON PRESSURE INTENSITY:</span>
                  <span className="text-red-400">{sandboxIntensity}% STRENGTH</span>
                </div>
                <input
                  id="sandbox-intensity-slider"
                  type="range"
                  min="5"
                  max="100"
                  value={sandboxIntensity}
                  onChange={(e) => setSandboxIntensity(parseInt(e.target.value))}
                  className="accent-amber-500 bg-amber-950/40 h-1.2 rounded cursor-pointer"
                />
              </div>

              {/* Trigger Analysis buttons */}
              <button
                onClick={handleGeneratePreview}
                className="bg-amber-950 border border-amber-500/40 hover:border-amber-500 text-amber-300 py-1.2 rounded font-sans text-[8px] font-bold cursor-pointer text-center uppercase tracking-wider mt-2 transition-all active:scale-95"
              >
                PROMPT INTERDICTION ESCALATION FEEDBACKS
              </button>
            </div>

            {/* Right Sandbox Escalation Previews */}
            <div className="lg:col-span-7 flex flex-col border border-amber-950/30 bg-[#070503] rounded p-2.5">
              {activePreview ? (
                <div className="flex flex-col h-full gap-2 text-[8px] animate-fade-in justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-amber-950/30 pb-1.5 mb-1">
                      <span className="font-bold text-red-400 flex items-center gap-1 uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span>PRE-ACTION SYSTEMIC COLLATERAL DISCLOSURE</span>
                      </span>
                      <span className="text-[7.5px] font-black bg-red-950/20 text-red-500 px-1.5 border border-red-500/30 rounded">
                        CONFIDENCE: {activePreview.confidenceScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[7px] mb-2 text-gray-300">
                      <div className="bg-black/50 border border-amber-950/40 p-1 rounded">
                        <span className="text-gray-500 uppercase block">EXPECTED COERCE STRENGTH:</span>
                        <span className="font-bold text-white text-[8.5px]">{activePreview.expectedLeverageLevel}/100</span>
                      </div>
                      <div className="bg-black/50 border border-amber-950/40 p-1 rounded">
                        <span className="text-gray-500 uppercase block">CUMULATIVE METRIC BLOWBACK:</span>
                        <span className="font-bold text-red-400 text-[8.5px]">{activePreview.expectedTotalBlowback}% ACCUM.</span>
                      </div>
                    </div>

                    <p className="bg-[#120505] p-2 rounded border border-red-900/30 text-gray-300 leading-relaxed mb-2">
                      <span className="text-red-400 font-extrabold block mb-0.5 uppercase">1ST-ORDER FINANCIAL PRESSURE REPORT:</span>
                      {activePreview.firstOrderFinancialImpact}
                    </p>

                    <p className="bg-[#120505] p-2 rounded border border-red-900/30 text-gray-300 leading-relaxed">
                      <span className="text-red-400 font-extrabold block mb-0.5 uppercase">1ST-ORDER STRATEGIC RETALIATION THREATS:</span>
                      {activePreview.firstOrderStrategicRetaliationRisk}
                    </p>

                    <div className="grid grid-cols-3 gap-1 text-[6.8px] text-gray-500 mt-2.5 pt-1.5 border-t border-amber-950/20 uppercase">
                      <div>
                        <span>ALLIANCE FRICTION:</span>
                        <span className="block font-bold text-white">+{activePreview.allianceDiscomfortPenalty}%</span>
                      </div>
                      <div>
                        <span>LEGITIMACY EROSION:</span>
                        <span className="block font-bold text-white">+{activePreview.reputationalErosion}%</span>
                      </div>
                      <div>
                        <span>DE-DOLLARIZE INCENTIVES:</span>
                        <span className="block font-bold text-white">+{activePreview.dollarDominanceErosion}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch final coercive trigger */}
                  <button
                    onClick={handleExecuteAction}
                    className="bg-red-950 border border-red-500 hover:border-red-400 text-red-400 py-1.5 rounded font-sans text-[8.5px] font-extrabold cursor-pointer text-center uppercase tracking-wider transition-all mt-3 active:scale-95 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                  >
                    ⚠ EXECUTE TARGETED INTERDICTION / EMIT DISRUPT SIGNALS
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-gray-500 uppercase h-full py-10 gap-2">
                  <Fingerprint className="w-8 h-8 text-amber-950" />
                  <span>PROMPT INTERDICTION ESCALATION FEEDBACKS ON THE LEFT TO COMPUTE ADVANCED GEO-FINANCIAL PREVIEWS</span>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* 4. CHRONO PRESSURE AND DISCOVERY HISTORY TIMELINE */}
      <div id="finint-incidents-timeline" className="mt-2.5 border border-amber-950/30 bg-[#020202] p-2 rounded">
        <div className="flex justify-between items-center border-b border-amber-950/20 pb-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-500" />
            <span className="font-extrabold text-white uppercase tracking-wider text-[8px]">FINANCIAL TACTICAL INCIDENTS LOGS & INTERDICTION MEMOS</span>
          </div>
          <span className="text-[6.5px] text-[#00e5ff] font-bold uppercase tracking-wider">SECURE SHADOW TELEMETRY LINK</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 overflow-y-auto max-h-[55px] scrollbar-thin pr-1 text-[7px]">
          {incidentsLog.length > 0 ? (
            incidentsLog.map((incident, idx) => {
              const isCrit = incident.severity === 'CRITICAL';
              return (
                <div 
                  key={idx} 
                  className={`p-1 rounded border ${
                    isCrit 
                      ? 'bg-red-950/20 border-red-500/20 text-red-300' 
                      : 'bg-black/80 border-amber-950/20 text-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-0.5 font-bold">
                    <span className="text-amber-400">TICK {incident.tick}</span>
                    <span className={`uppercase text-[6px] ${isCrit ? 'text-red-500' : 'text-emerald-500'}`}>
                      {incident.actionType}
                    </span>
                  </div>
                  <p className="line-clamp-2 leading-relaxed">{incident.summary}</p>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-2 text-gray-500 uppercase">
              No financial interdiction signals recorded. Global clearing networks remain stable.
            </div>
          )}
        </div>
      </div>

    </div>
    </PanelFxShell>
  );
}
