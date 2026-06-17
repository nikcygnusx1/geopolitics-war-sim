import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useSoftPowerStore, ALL_COUNTRIES } from '../../store/softPowerStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { 
  Globe, 
  Tv, 
  Award, 
  Users, 
  HeartHandshake, 
  Building2, 
  Sparkles, 
  ShieldAlert, 
  HelpCircle, 
  Flame, 
  ChevronRight, 
  Send,
  Milestone,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  AidProgramType, 
  InvestmentDiplomacyType, 
  PrestigeEventType, 
  BoycottStyle, 
  DiasporaActivationMode 
} from '../../types/softPower';

export default function SoftPowerPanel() {
  const playerCountryId = usePlayerStore((s) => s.countryId) || 'US';
  const currentTick = useWorldStore((s) => s.currentTick);
  const countries = useWorldStore((s) => s.countries);

  const softPowerStore = useSoftPowerStore();
  const { 
    profiles, 
    aidPrograms, 
    investmentRecords, 
    prestigeEvents, 
    exchangePrograms, 
    mediaReach, 
    diasporaProfiles, 
    diasporaActivations, 
    dissidentAwards, 
    publicMemories, 
    backlashRecords, 
    resonanceStates 
  } = softPowerStore;

  // Selected state for target country inspector
  const [selectedInspectCountry, setSelectedInspectCountry] = useState<string>('CN');
  
  // Tab states inside the Soft power panel
  const [activeSubTab, setActiveSubTab] = useState<'INDEX' | 'AID_INVEST' | 'PRESTIGE' | 'EDUCATION' | 'DIASPORA' | 'SCENARIOS'>('INDEX');

  // Input States for New Actions
  const [newAidTarget, setNewAidTarget] = useState<string>('EG');
  const [newAidType, setNewAidType] = useState<AidProgramType>('HUMANITARIAN_RELIEF');
  const [newAidFunding, setNewAidFunding] = useState<number>(2.0);
  const [newAidTied, setNewAidTied] = useState<boolean>(false);
  const [newAidConditional, setNewAidConditional] = useState<boolean>(false);

  const [newInvTarget, setNewInvTarget] = useState<string>('PK');
  const [newInvType, setNewInvType] = useState<InvestmentDiplomacyType>('STRATEGIC_INFRASTRUCTURE');
  const [newInvFunding, setNewInvFunding] = useState<number>(5.0);

  const [newEventTitle, setNewEventTitle] = useState<string>('Global Green Tech Summit');
  const [newEventType, setNewEventType] = useState<PrestigeEventType>('GLOBAL_SUMMIT_HOSTING');
  const [newEventTick, setNewEventTick] = useState<number>(currentTick + 5);

  const [newExcTarget, setNewExcTarget] = useState<string>('IN');
  const [newExcScholarships, setNewExcScholarships] = useState<number>(150);

  const [newMediaTarget, setNewMediaTarget] = useState<string>('RU');
  const [newMediaName, setNewMediaName] = useState<string>('Liberty Broadcaster');
  const [newMediaMedium, setNewMediaMedium] = useState<'BROADCASTER' | 'DIGITAL_PLATFORM' | 'NEWS_SYNDICATE' | 'STREAMING_ENTERTAINMENT' | 'LANGUAGE_INSTITUTE'>('BROADCASTER');
  const [newMediaCost, setNewMediaCost] = useState<number>(0.5);

  const [newDissidentName, setNewDissidentName] = useState<string>('Elena Petrova');
  const [newDissidentAdversary, setNewDissidentAdversary] = useState<string>('RU');
  const [newDissidentAwardTitle, setNewDissidentAwardTitle] = useState<string>('Sovereign Liberty Ribbon');

  const [newDiasporaHost, setNewDiasporaHost] = useState<string>('US');
  const [newDiasporaMode, setNewDiasporaMode] = useState<DiasporaActivationMode>('LOBBYING_HOST_GOVERNMENT');

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewActionKey, setPreviewActionKey] = useState<string>('AID');
  const [previewArgs, setPreviewArgs] = useState<any>({});

  const inspectProfile = profiles[selectedInspectCountry];
  const playerProfile = profiles[playerCountryId];

  const handleAidSubmit = () => {
    softPowerStore.proposeAidProgram(
      playerCountryId,
      newAidTarget,
      newAidType,
      newAidFunding,
      newAidTied,
      newAidConditional
    );
  };

  const handleInvSubmit = () => {
    softPowerStore.proposeInvestment(
      playerCountryId,
      newInvTarget,
      newInvType,
      newInvFunding
    );
  };

  const handleEventSubmit = () => {
    softPowerStore.schedulePrestigeEvent(
      newEventTitle,
      newEventType,
      playerCountryId,
      newEventTick
    );
  };

  const handleExcSubmit = () => {
    softPowerStore.sponsorExchangeProgram(
      playerCountryId,
      newExcTarget,
      newExcScholarships
    );
  };

  const handleMediaSubmit = () => {
    softPowerStore.expandMediaReach(
      playerCountryId,
      newMediaTarget,
      newMediaName,
      newMediaMedium,
      newMediaCost
    );
  };

  const handleDissidentSubmit = () => {
    softPowerStore.nominateDissident(
      newDissidentAwardTitle,
      newDissidentName,
      newDissidentAdversary,
      playerCountryId
    );
  };

  const handleDiasporaSubmit = () => {
    softPowerStore.activateDiaspora(
      playerCountryId,
      newDiasporaHost,
      newDiasporaMode
    );
  };

  const triggerInspectCountryPreview = (actionKey: string, args: any) => {
    setPreviewActionKey(actionKey);
    setPreviewArgs(args);
    setShowPreview(true);
  };

  const triggerActiveScenarioBoot = (key: string) => {
    softPowerStore.seedScenario(key);
  };

  // Convert map key values of objects to Arrays
  const listActiveAid = Object.values(aidPrograms).filter(p => p.sourceCountryId === playerCountryId || p.targetCountryId === playerCountryId);
  const listActiveInv = Object.values(investmentRecords).filter(i => i.sourceCountryId === playerCountryId || i.targetCountryId === playerCountryId);
  const listAllEvents = Object.values(prestigeEvents);
  const listExchPrograms = Object.values(exchangePrograms).filter(e => e.sourceCountryId === playerCountryId || e.targetCountryId === playerCountryId);
  const listDissidents = Object.values(dissidentAwards);
  const listActivations = Object.values(diasporaActivations).filter(a => a.sponsorCountryId === playerCountryId);
  const playerBacklashes = backlashRecords[playerCountryId] || [];

  return (
    <PanelFxShell panelId="soft_power" relevantFxTypes={['REGIME_CHANGE','COUP_SUCCESS','CEASEFIRE_SIGNED','ALLIANCE_FORMED']}>
      <div id="soft-power-workspace" className="text-gray-100 p-1 flex flex-col gap-4 text-xs h-full">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-[#09120a] p-3 border-b border-[#00f344]/30 rounded">
        <div>
          <span className="text-[14px] font-bold tracking-widest text-[#00ff44] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff44]" /> MODULE 3.4: SOFT POWER AND SYMBOLIC INFLUENCE
          </span>
          <p className="text-[10px] text-gray-400 mt-1">
            Build prestige, construct deep educational pipelines, activate loyal diaspora channels, and deploy development finance to shape international legitimacy.
          </p>
        </div>
        <div className="flex gap-2">
          {['INDEX', 'AID_INVEST', 'PRESTIGE', 'EDUCATION', 'DIASPORA', 'SCENARIOS'].map((sub) => (
            <button
              key={sub}
              onClick={() => { setActiveSubTab(sub as any); setShowPreview(false); }}
              className={`p-1.5 px-3 uppercase tracking-wider font-semibold border text-[9px] rounded transition-all cursor-pointer ${
                activeSubTab === sub
                  ? 'border-[#00ff44] text-[#00ff44] bg-[#0c240d]'
                  : 'border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/55'
              }`}
            >
              {sub.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* CORE ACTIVE SPACE CONTAINER */}
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* LEFT COLUMN: PRIMARY PROFILE MAPPING (4 COLS) */}
        <div className="col-span-4 flex flex-col gap-3 bg-[#020502]/65 p-3 border border-zinc-900 rounded">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="font-bold text-[#00e1ff] uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Target Influence Dossier
            </span>
            <select
              value={selectedInspectCountry}
              onChange={(e) => setSelectedInspectCountry(e.target.value)}
              className="bg-black text-white py-1 px-1.5 border border-[#1a5c1a]/50 text-[10px] rounded"
            >
              {Object.keys(countries).map((id) => (
                <option key={id} value={id}>
                  {countries[id]?.name || id} ({id})
                </option>
              ))}
            </select>
          </div>

          {/* CULTURAL INFLUENCE PROFILE DETAIL */}
          {inspectProfile ? (
            <div className="flex flex-col gap-2.5 h-[580px] overflow-y-auto scrollbar-thin">
              <div className="p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                <span className="text-zinc-400 text-[10px]">Composite Cultural Influence Level</span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[18px] font-mono font-bold text-white">
                    {inspectProfile.index.globalCompositeScore}%
                  </span>
                  <span className="text-green-400 font-mono text-[10px]">
                    {inspectProfile.index.globalCompositeScore > 65 ? 'SUPERPOWER REACH' : 'REGIONAL RESIDENCE'}
                  </span>
                </div>
                {/* Visual score bar */}
                <div className="w-full bg-zinc-800 h-1 rounded overflow-hidden mt-1.5">
                  <div 
                    className="bg-[#00ff44] h-full" 
                    style={{ width: `${inspectProfile.index.globalCompositeScore}%` }} 
                  />
                </div>
              </div>

              {/* INDIVIDUAL INDEX COMPONENT FACTOR SLIDERS */}
              <div>
                <span className="text-zinc-500 tracking-wider uppercase font-bold text-[9px] block mb-1.5">
                  Factors of Cultural Influence Index
                </span>
                <div className="space-y-1.5 text-[10px]">
                  {[
                    { label: 'Language Global Reach', value: inspectProfile.index.languageReach },
                    { label: 'Cross-Border Media Penetration', value: inspectProfile.index.mediaPenetration },
                    { label: 'University Attraction & Prestige', value: inspectProfile.index.educationAttractiveness },
                    { label: 'Sovereign Cultural Recognition', value: inspectProfile.index.culturalBrandRecognition },
                    { label: 'Entertainment/Art Exports', value: inspectProfile.index.entertainmentExportStrength },
                    { label: 'Elite Familiarity & Network Power', value: inspectProfile.index.eliteFamiliarity },
                    { label: 'Symbolic Moral Prestige', value: inspectProfile.index.symbolicPrestige },
                    { label: 'Legitimacy Trust Resonance', value: inspectProfile.index.trustLegitimacyResonance },
                    { label: 'Diaspora Cohesion Multiplier', value: inspectProfile.index.diasporaAmplification },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col gap-1 bg-black/40 p-1.5 border border-zinc-900 rounded">
                      <div className="flex justify-between items-center text-zinc-300">
                        <span>{f.label}</span>
                        <span className="font-mono font-bold text-[#00ff44]">{f.value}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-1 rounded overflow-hidden">
                        <div 
                          className="bg-[#00ff44]/70 h-full" 
                          style={{ width: `${f.value}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VECTOR SCORES */}
              <div>
                <span className="text-zinc-500 tracking-wider uppercase font-bold text-[9px] block mb-1.5">
                  Soft Power Vectors Resonance
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.values(inspectProfile.vectors).slice(0, 8).map((vec) => (
                    <div key={vec.type} className="p-1.5 bg-zinc-900/30 border border-zinc-800 rounded">
                      <span className="text-zinc-400 block text-[8px] truncate">{vec.type.replace(/_/g, ' ')}</span>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-mono font-bold text-[11px] text-white">{vec.score}</span>
                        <span className={`text-[8px] ${vec.recentDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {vec.recentDelta >= 0 ? `+${vec.recentDelta}` : vec.recentDelta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-center py-10">Select a country to load profile.</div>
          )}
        </div>

        {/* RIGHT AREA: ACTIONABLE TABS (8 COLS) */}
        <div className="col-span-8 flex flex-col gap-3">
          
          {/* SYSTEM SUMMARY BAR */}
          <div className="grid grid-cols-4 gap-3 bg-[#030603] p-2.5 border border-zinc-900 rounded">
            <div className="flex flex-col text-center border-r border-zinc-800 p-1">
              <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Active Scholarships</span>
              <span className="text-[#00e1ff] text-[14px] font-mono font-bold">
                {listExchPrograms.reduce((acc, exp) => acc + exp.scholarshipsAllocatedCount, 0)}
              </span>
            </div>
            <div className="flex flex-col text-center border-r border-zinc-800 p-1">
              <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Lobby Diaspora Units</span>
              <span className="text-[#00ff44] text-[14px] font-mono font-bold">
                {listActivations.length}
              </span>
            </div>
            <div className="flex flex-col text-center border-r border-zinc-800 p-1">
              <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Total Aid Portfolio</span>
              <span className="text-yellow-400 text-[14px] font-mono font-bold">
                ${listActiveAid.reduce((acc, item) => acc + item.fundingAmountB, 0).toFixed(1)}B
              </span>
            </div>
            <div className="flex flex-col text-center p-1">
              <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Adversary Backlash Incidents</span>
              <span className="text-red-500 text-[14px] font-mono font-bold">
                {playerBacklashes.length}
              </span>
            </div>
          </div>

          {/* ACTIVE SUB-TAB CHANNELS */}
          <div className="flex-1 bg-[#010301] p-3 border border-zinc-900 rounded min-h-[500px]">
            
            {/* 1. INDEX SUB-TAB */}
            {activeSubTab === 'INDEX' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="font-bold uppercase text-[#00ff44]">Legitimacy Status & Moral Authority</span>
                  <span className="text-zinc-400">Tactical Assessment</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                    <span className="font-bold text-white block mb-1 text-[11px]">Moral Prestige Reserves</span>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">
                      Your moral authority defines resolution sponsorship success weights in the UNSC. High authority blocks adversary hypocritical narrative campaigns.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[16px] font-mono text-[#00faf0]">
                        {playerProfile?.vectors['MORAL_AUTHORITY']?.score ?? 50}
                      </span>
                      <span className="text-[10px] text-zinc-500">Global Moral Rescale Scale</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                    <span className="font-bold text-white block mb-1 text-[11px]">Legitimacy Dimensions</span>
                    <div className="space-y-1 mt-1 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Developmental Credibility</span>
                        <span className="font-mono text-zinc-300">{playerProfile?.vectors['DEVELOPMENT_COMPETENCE']?.score ?? 50}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Humanitarian Trust</span>
                        <span className="font-mono text-zinc-300">{playerProfile?.vectors['HUMANITARIAN_LEGITIMACY']?.score ?? 50}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Educational Prestige</span>
                        <span className="font-mono text-zinc-300">{playerProfile?.vectors['EDUCATIONAL_PRESTIGE']?.score ?? 50}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL MEMORIES EVENT DECK */}
                <div className="bg-zinc-950 p-2.5 border border-zinc-900 rounded">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-zinc-400 block mb-2">
                    Sovereign Symbolic Memory Register
                  </span>
                  <div className="space-y-1.5 h-[180px] overflow-y-auto scrollbar-thin">
                    {(publicMemories[playerCountryId] || []).map((mem) => (
                      <div key={mem.id} className="p-1.5 bg-zinc-900/50 border border-zinc-800 rounded flex justify-between items-center">
                        <div>
                          <span className="text-white font-medium block">{mem.description}</span>
                          <span className="text-zinc-500 text-[8px]">Registered on tick {mem.tickRegistered}</span>
                        </div>
                        <span className={`font-mono text-[11px] font-bold ${mem.prestigeYieldPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mem.prestigeYieldPoints >= 0 ? `+${mem.prestigeYieldPoints}` : mem.prestigeYieldPoints}pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. AID DIPLOMACY SUB-TAB */}
            {activeSubTab === 'AID_INVEST' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white uppercase flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-yellow-400" /> Aid & Investment Allocation Operations
                  </span>
                  <span className="text-[10px] text-yellow-400 font-mono">FINANCE DIPLOMACY</span>
                </div>

                {/* ALLOCATE AID FORM */}
                <div className="grid grid-cols-2 gap-3 bg-[#0a0f0a] p-3 border border-[#00f344]/10 rounded">
                  <div className="space-y-2">
                    <span className="font-bold text-[#00ff44] block text-[10px]">PROPOSE AID PROGRAM</span>
                    <div>
                      <label className="block text-zinc-400 mb-1 text-[9px]">Recipient Country</label>
                      <select
                        value={newAidTarget}
                        onChange={(e) => setNewAidTarget(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      >
                        {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                          <option key={id} value={id}>{id} - {countries[id]?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Aid Program Type</label>
                        <select
                          value={newAidType}
                          onChange={(e) => setNewAidType(e.target.value as any)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          <option value="HUMANITARIAN_RELIEF">Humanit. Relief</option>
                          <option value="PURE_GRANT">Pure Grant</option>
                          <option value="CONCESSIONAL_LOAN">Concessional Loan</option>
                          <option value="INFRASTRUCTURE_FINANCING">Infras. Finance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Budget AmountB</label>
                        <input
                          type="number"
                          step="0.5"
                          value={newAidFunding}
                          onChange={(e) => setNewAidFunding(parseFloat(e.target.value) || 1)}
                          className="w-full bg-black text-white p-1 border border-zinc-800 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 p-1">
                      <label className="flex items-center gap-1.5 text-zinc-300">
                        <input
                          type="checkbox"
                          checked={newAidTied}
                          onChange={(e) => setNewAidTied(e.target.checked)}
                          className="accent-[#00ff44]"
                        />
                        <span>Tied Procurement?</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-zinc-300">
                        <input
                          type="checkbox"
                          checked={newAidConditional}
                          onChange={(e) => setNewAidConditional(e.target.checked)}
                          className="accent-[#00ff44]"
                        />
                        <span>Politically Conditional?</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => triggerInspectCountryPreview('AID', { fundingB: newAidFunding })}
                        className="flex-1 p-1.5 border border-zinc-700 bg-zinc-950 text-white rounded font-medium hover:bg-zinc-900 transition-all cursor-pointer"
                      >
                        Preview Returns
                      </button>
                      <button
                        onClick={handleAidSubmit}
                        className="flex-1 p-1.5 bg-[#0e3b0f] text-[#00ff44] border border-[#00ff44]/40 rounded font-bold hover:bg-[#124d14] transition-all cursor-pointer"
                      >
                        Deploy Proposal
                      </button>
                    </div>
                  </div>

                  {/* INVESTMENT FORM */}
                  <div className="space-y-2 border-l border-zinc-900 pl-3">
                    <span className="font-bold text-yellow-400 block text-[10px]">DEFER INVESTMENT PROJECT</span>
                    
                    <div>
                      <label className="block text-zinc-400 mb-1 text-[9px]">Target Sovereign State</label>
                      <select
                        value={newInvTarget}
                        onChange={(e) => setNewInvTarget(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      >
                        {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                          <option key={id} value={id}>{id} - {countries[id]?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Investment Field</label>
                        <select
                          value={newInvType}
                          onChange={(e) => setNewInvType(e.target.value as any)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          <option value="STRATEGIC_INFRASTRUCTURE">Infras. Project</option>
                          <option value="PORT_RAIL_LOGISTICS">Ports & Logistics</option>
                          <option value="ENERGY_INFRASTRUCTURE">Energy Networks</option>
                          <option value="MEDIA_CULTURAL_CENTER">Culture Centers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Funding Size B</label>
                        <input
                          type="number"
                          step="1"
                          value={newInvFunding}
                          onChange={(e) => setNewInvFunding(parseFloat(e.target.value) || 2)}
                          className="w-full bg-black text-white p-1 border border-zinc-800 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="pt-5">
                      <button
                        onClick={handleInvSubmit}
                        className="w-full p-2 bg-yellow-950/40 text-yellow-500 border border-yellow-700/50 rounded font-bold hover:bg-yellow-900/30 transition-all cursor-pointer"
                      >
                        Authorize Strategic Capital
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIST OF WORKING AID & INVESTMENTS */}
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="font-bold text-zinc-400 text-[9px] uppercase tracking-wider block mb-2">
                    Current Portfolio Deployments
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 h-[150px] overflow-y-auto scrollbar-thin">
                    {listActiveAid.map((ap) => (
                      <div key={ap.id} className="p-2 bg-[#020603] border border-zinc-800 rounded flex justify-between items-start">
                        <div>
                          <span className="text-[#00ff44] font-bold block">{ap.type.replace(/_/g, ' ')}</span>
                          <span className="text-zinc-500 text-[8px]">{ap.sourceCountryId} → {ap.targetCountryId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white block font-mono font-bold">${ap.fundingAmountB}B</span>
                          <span className="text-[8px] text-zinc-400">Leakage: {ap.corruptionLeakage}%</span>
                        </div>
                      </div>
                    ))}
                    {listActiveInv.map((iv) => (
                      <div key={iv.id} className="p-2 bg-zinc-900/30 border border-zinc-800 rounded flex justify-between items-start">
                        <div>
                          <span className="text-yellow-500 font-bold block">{iv.type.replace(/_/g, ' ')}</span>
                          <span className="text-zinc-500 text-[8px]">{iv.sourceCountryId} → {iv.targetCountryId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white block font-mono font-bold">${iv.fundingB}B</span>
                          <span className="text-[8px] text-zinc-400">Progress: {iv.deliveryProgress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRESTIGE EVENTS SUB-TAB */}
            {activeSubTab === 'PRESTIGE' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#00ff44]" /> Prestige Event Scheduling & Boycott Systems
                  </span>
                  <span className="text-[10px] uppercase text-[#00e1ff] font-mono">Mega Diplomacy</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  {/* SCHEDULE Mega hosting */}
                  <div className="bg-[#03070b] p-3 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-[#00e1ff] block text-[10px]">SCHEDULE PRESTIGE EVENT</span>
                    
                    <div>
                      <label className="block text-zinc-400 mb-0.5 text-[9px]">Event Name/Title</label>
                      <input
                        type="text"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-0.5 text-[9px]">Prestige Event Type</label>
                        <select
                          value={newEventType}
                          onChange={(e) => setNewEventType(e.target.value as any)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          <option value="OLYMPICS_MEGA">Friendship Games</option>
                          <option value="WORLD_EXPO">Sovereign World Expo</option>
                          <option value="CLIMATE_SUMMIT_HOSTING">Climate Summit</option>
                          <option value="GLOBAL_SUMMIT_HOSTING">Global Peace Summit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-0.5 text-[9px]">Tick Target</label>
                        <input
                          type="number"
                          value={newEventTick}
                          onChange={(e) => setNewEventTick(parseInt(e.target.value) || currentTick + 3)}
                          className="w-full bg-black text-white p-1 border border-zinc-800 rounded font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleEventSubmit}
                      className="w-full p-2 bg-blue-950/40 text-blue-400 border border-blue-700/50 rounded font-bold hover:bg-blue-900/30 transition-all cursor-pointer"
                    >
                      Log Global Directive Venue
                    </button>
                  </div>

                  {/* NOMINATE DISSIDENT MORAL NOMINATION */}
                  <div className="bg-[#120707]/30 p-3 border border-red-900/40 rounded space-y-2">
                    <span className="font-bold text-red-400 block text-[10px]">NOMINATE DISSIDENT AWARD</span>
                    
                    <div>
                      <label className="block text-zinc-400 mb-0.5 text-[9px]">Dissident Representative</label>
                      <input
                        type="text"
                        value={newDissidentName}
                        onChange={(e) => setNewDissidentName(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-0.5 text-[9px]">Adversary Country</label>
                        <select
                          value={newDissidentAdversary}
                          onChange={(e) => setNewDissidentAdversary(e.target.value)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-0.5 text-[9px]">Award Title</label>
                        <input
                          type="text"
                          value={newDissidentAwardTitle}
                          onChange={(e) => setNewDissidentAwardTitle(e.target.value)}
                          className="w-full bg-black text-white p-1 border border-zinc-800 rounded text-[10px]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleDissidentSubmit}
                      className="w-full p-2 bg-red-950/40 text-red-400 border border-red-700/50 rounded font-bold hover:bg-red-900/30 transition-all cursor-pointer"
                    >
                      Bestow Moral Distinction Reward
                    </button>
                  </div>
                </div>

                {/* CURRENT mega EVENTS CALENDAR */}
                <div className="bg-zinc-950 p-2.5 border border-zinc-900 rounded">
                  <span className="font-bold uppercase text-zinc-500 text-[8px] block mb-2 tracking-widest">
                    Prestige Venue Timeline Calendar
                  </span>
                  <div className="space-y-2 h-[155px] overflow-y-auto scrollbar-thin">
                    {listAllEvents.map((ev) => (
                      <div key={ev.id} className="p-2 bg-zinc-900/40 border border-zinc-800 rounded flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-[11px] block">{ev.title}</span>
                          <span className="text-zinc-400 text-[8px]">Hosted by {ev.hostCountryId} | Scheduled: Tick {ev.tickScheduled}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {ev.hostCountryId !== playerCountryId && (
                            <>
                              <button
                                onClick={() => softPowerStore.boycottEvent(ev.id, playerCountryId, 'FULL_BOYCOTT')}
                                className="p-1 px-2 border border-red-800/60 text-red-400 text-[8px] rounded uppercase font-semibold hover:bg-red-950/30 transition-all cursor-pointer"
                              >
                                Full Boycott
                              </button>
                              <button
                                onClick={() => softPowerStore.boycottEvent(ev.id, playerCountryId, 'SYMBOLIC_DIPLOMATIC_BOYCOTT')}
                                className="p-1 px-2 border border-zinc-700 text-zinc-400 text-[8px] rounded uppercase font-semibold hover:bg-zinc-900 transition-all cursor-pointer"
                              >
                                Diplomatic Boycott
                              </button>
                            </>
                          )}
                          <span className="bg-blue-900/40 text-blue-400 font-mono text-[9px] p-1 px-2 rounded">
                            {Object.keys(ev.boycottingNations).length} Boycotts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. EDUCATION PIPELINES & MEDIA SUB-TAB */}
            {activeSubTab === 'EDUCATION' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white uppercase flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-[#00ff44]" /> Academic Pipeline Exchanges & Global Broadcasters
                  </span>
                  <span className="text-[10px] text-zinc-500">ELITE DEVIATION FLATS</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  {/* EXPAND EXCHANGES */}
                  <div className="bg-[#030603] p-3 border border-zinc-900 rounded space-y-2">
                    <span className="font-bold text-[#00ff44] block text-[10px]">SPONSOR ELITE PIEPELINE EXCHANGE</span>
                    
                    <div>
                      <label className="block text-zinc-400 mb-1 text-[9px]">Target Country Channel</label>
                      <select
                        value={newExcTarget}
                        onChange={(e) => setNewExcTarget(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      >
                        {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                          <option key={id} value={id}>{id} - {countries[id]?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1 text-[9px]">Full Scholars AllocatedCount (per Tick)</label>
                      <input
                        type="number"
                        value={newExcScholarships}
                        onChange={(e) => setNewExcScholarships(parseInt(e.target.value) || 100)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded font-mono text-[10px]"
                      />
                    </div>

                    <button
                      onClick={handleExcSubmit}
                      className="w-full p-2 bg-[#0d2e0e] text-[#00ff44] border border-[#00f344]/35 rounded font-bold hover:bg-[#124213] transition-all cursor-pointer"
                    >
                      Authorize Scholarship Program
                    </button>
                  </div>

                  {/* MEDIA BROADCAST FOOTPRINT */}
                  <div className="bg-zinc-950 p-3 border border-zinc-900 rounded space-y-2">
                    <span className="font-bold text-[#00e1ff] block text-[10px]">DEPLOY GLOBAL BROADCAST CARRIER</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Target Reach Area</label>
                        <select
                          value={newMediaTarget}
                          onChange={(e) => setNewMediaTarget(e.target.value)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Medium Channel</label>
                        <select
                          value={newMediaMedium}
                          onChange={(e) => setNewMediaMedium(e.target.value as any)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          <option value="BROADCASTER">Broadcaster</option>
                          <option value="DIGITAL_PLATFORM">Digital Portal</option>
                          <option value="STREAMING_ENTERTAINMENT">Streaming</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 mb-1 text-[9px]">Broadcast Station Name</label>
                      <input
                        type="text"
                        value={newMediaName}
                        onChange={(e) => setNewMediaName(e.target.value)}
                        className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                      />
                    </div>

                    <button
                      onClick={handleMediaSubmit}
                      className="w-full p-2 bg-[#09292e] text-[#00e1ff] border border-[#00d0f0]/30 rounded font-bold hover:bg-[#0c3940] transition-all cursor-pointer"
                    >
                      Initiate Cross-Border Stream
                    </button>
                  </div>
                </div>

                {/* VISIBLE PIPELINE LISTS */}
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="font-bold uppercase text-zinc-500 text-[8px] block mb-1.5 tracking-wider">
                    Pipeline Accumulation Track (Matured Pipelines)
                  </span>
                  <div className="space-y-2 h-[150px] overflow-y-auto scrollbar-thin">
                    {listExchPrograms.map((ep) => (
                      <div key={ep.id} className="p-1.5 bg-[#030603] border border-zinc-900 rounded flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-white block">{ep.sourceCountryId} 🔁 {ep.targetCountryId} Fellowship</span>
                          <span className="text-zinc-400 text-[8px]">Active: {ep.activeTicks} ticks | Allocated {ep.scholarshipsAllocatedCount} Fellows</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#00ff44] block font-mono">Durable Influence: {ep.durableInfluenceScore}%</span>
                          <span className="text-zinc-500 text-[8px]">Cabinet Alumni count: {ep.pipeline.alumniInCabinet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. DIASPORA ACTIVATION SUB-TAB */}
            {activeSubTab === 'DIASPORA' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white uppercase flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#00ff44]" /> Diaspora Network Activation & Oversight
                  </span>
                  <span className="text-[10px] text-zinc-500">LOBBY CHANNELS</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-2">
                  {/* ACTIVATE DIASPORA */}
                  <div className="bg-[#030603] p-3 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-[#00ff44] block text-[10px]">MOBILIZE HOMELAND DIASPORA NETWORK</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Select Host Country</label>
                        <select
                          value={newDiasporaHost}
                          onChange={(e) => setNewDiasporaHost(e.target.value)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          {ALL_COUNTRIES.filter(c => c !== playerCountryId).map(id => (
                            <option key={id} value={id}>{id}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-zinc-400 mb-1 text-[9px]">Activation Mode</label>
                        <select
                          value={newDiasporaMode}
                          onChange={(e) => setNewDiasporaMode(e.target.value as any)}
                          className="w-full bg-black text-white p-1.5 border border-zinc-800 rounded text-[10px]"
                        >
                          <option value="LOBBYING_HOST_GOVERNMENT">Lobby Host Gov</option>
                          <option value="REMITTANCE_MOBILIZATION">Remittance Boost</option>
                          <option value="BUSINESS_CORRIDOR">Trade Corridor</option>
                          <option value="NARRATIVE_AMPLIFICATION">Broad Narratives</option>
                          <option value="SANCTIONS_EVASION_BRIDGE">Evasion Bridge</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleDiasporaSubmit}
                      className="w-full p-2 bg-[#0e3010] text-[#00ff44] border border-[#00f848]/30 rounded font-bold hover:bg-[#113a13] transition-all cursor-pointer"
                    >
                      Trigger Collective Diaspora Action
                    </button>
                  </div>

                  {/* SUSPICION / POLARIZATION GAUGES */}
                  <div className="bg-zinc-950 p-3 border border-zinc-950 rounded space-y-2.5">
                    <span className="font-bold text-yellow-500 block text-[10px]">Host State Trust & Backlash Monitoring</span>
                    <p className="text-zinc-400 text-[10px] leading-relaxed">
                      Lobbying campaigns carried out inside foreign targets can elevate local suspicion levels, giving rise to counter-espionage investigations or host state security clamps.
                    </p>
                    <div className="p-2 bg-black border border-zinc-900 rounded flex justify-between items-center">
                      <span className="text-zinc-400">Total Backlash Incidents logged:</span>
                      <span className="text-red-400 font-mono font-bold">{playerBacklashes.length}</span>
                    </div>
                  </div>
                </div>

                {/* CURRENT ACTIVATIONS LIST */}
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="font-bold uppercase text-zinc-500 text-[8px] block mb-1.5 tracking-wider">
                    Current Active Local Diaspora Activations
                  </span>
                  <div className="space-y-1.5 h-[150px] overflow-y-auto scrollbar-thin">
                    {listActivations.map((act) => (
                      <div key={act.id} className="p-2 bg-[#020603] border border-zinc-800 rounded flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-[#00ff44] block">{act.activationMode.replace(/_/g, ' ')}</span>
                          <span className="text-zinc-500 text-[8px]">Sponsor: {act.sponsorCountryId} 🔁 Host: {act.hostCountryId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-white block font-mono font-bold">Success Index: {act.successIndex}%</span>
                          <span className="text-yellow-500 text-[8px]">Suspicion delta: +{act.hostCountrySuspicionDelta}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. SCENARIOS SEEDING CHANNEL */}
            {activeSubTab === 'SCENARIOS' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#00f64c]/20 pb-2">
                  <span className="font-bold text-[#00f545] uppercase flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Seeded Scenario Simulations (Module 3.4)
                  </span>
                  <span className="text-zinc-400 text-[9px] font-mono">LIVE SEED TRIGGERS</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  {/* SEED 1: Dissident Nobel-like Award Pressure */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-white block text-[11px]">Nobel dissident pressure scenario</span>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      Grants a world-class prestigious freedom prize to a prominent dissident inside adversity networks. Embarrasses target and triggers domestic structural changes.
                    </p>
                    <button
                      onClick={() => triggerActiveScenarioBoot('DISSIDENT_PRESSURING')}
                      className="w-full p-2 bg-zinc-850 hover:bg-zinc-800 text-white font-semibold rounded border border-zinc-700 transition-all cursor-pointer text-[10px]"
                    >
                      Trigger Dissident Award Pressure
                    </button>
                  </div>

                  {/* SEED 2: Mega Sports boycotted games */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-white block text-[11px]">Selective mega Olympics boycott</span>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      Schedules the Pacific Century Summer Games mega event and automatically launches selective adversary boycotts, dividing international participation blocks.
                    </p>
                    <button
                      onClick={() => triggerActiveScenarioBoot('OLYMPICS_BOYCOTT_SHIELD')}
                      className="w-full p-2 bg-zinc-850 hover:bg-zinc-800 text-white font-semibold rounded border border-zinc-700 transition-all cursor-pointer text-[10px]"
                    >
                      Host Mega Games & Boycotts
                    </button>
                  </div>

                  {/* SEED 3: Diaspora evasion leak backlashes */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-white block text-[11px]">Diaspora counter log evasion backfires</span>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      Trigger state-funded trade corridors built on remote ethnic networks to bypass sanctions. Increases security scrutiny and sparks a counterintelligence crisis.
                    </p>
                    <button
                      onClick={() => triggerActiveScenarioBoot('DIASPORA_BACKLASH_INTENSITY')}
                      className="w-full p-2 bg-zinc-850 hover:bg-zinc-800 text-white font-semibold rounded border border-zinc-700 transition-all cursor-pointer text-[10px]"
                    >
                      Sponsor Diaspora Evasion Risk
                    </button>
                  </div>

                  {/* SEED 4: Aid Corruption & Coerced Ties */}
                  <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded space-y-2">
                    <span className="font-bold text-white block text-[11px]">Aid Corruption and Coerced Alignment</span>
                    <p className="text-zinc-500 text-[10px] leading-relaxed">
                      Sponsor massive infrastructure financing but ties it directly to procurement blockades, provoking local corruption leaks and severe regional backlash.
                    </p>
                    <button
                      onClick={() => triggerActiveScenarioBoot('AID_CORRUPTION_LEAK')}
                      className="w-full p-2 bg-zinc-850 hover:bg-zinc-800 text-white font-semibold rounded border border-zinc-700 transition-all cursor-pointer text-[10px]"
                    >
                      Simulate Coerced Aid Leakage
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ACTION RETURN STATE PREVIEW PANEL */}
          {showPreview && (
            <div className="p-3 bg-[#020508] border border-[#00d0f0]/35 rounded relative mt-2 text-[10px]">
              <span className="font-bold text-[#00d0f0] block mb-1 uppercase tracking-widest text-[11px]">
                Soft Power Prediction Engine Forecast (Preview)
              </span>
              <button 
                onClick={() => setShowPreview(false)} 
                className="absolute top-1.5 right-2 text-zinc-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <div className="grid grid-cols-4 gap-2 text-zinc-300 mt-2">
                <div className="p-2 bg-black rounded">
                  <span className="text-zinc-500 block text-[8px]">Short-Term Return</span>
                  <span className="text-[#00ff44] text-[13px] font-mono font-bold">+{softPowerStore.getSoftPowerActionPreview(playerCountryId, selectedInspectCountry, previewActionKey, previewArgs).shortTermInfluenceGain}%</span>
                </div>
                <div className="p-2 bg-black rounded">
                  <span className="text-zinc-500 block text-[8px]">Long-Horizon Yield</span>
                  <span className="text-[#00ff44] text-[13px] font-mono font-bold">+{softPowerStore.getSoftPowerActionPreview(playerCountryId, selectedInspectCountry, previewActionKey, previewArgs).longTermInfluenceGain}%</span>
                </div>
                <div className="p-2 bg-black rounded">
                  <span className="text-zinc-500 block text-[8px]">Backlash Hazard</span>
                  <span className="text-red-400 text-[13px] font-mono font-bold">{softPowerStore.getSoftPowerActionPreview(playerCountryId, selectedInspectCountry, previewActionKey, previewArgs).backlashRiskIndex}%</span>
                </div>
                <div className="p-2 bg-black rounded">
                  <span className="text-zinc-500 block text-[8px]">Project Fiscal Cost</span>
                  <span className="text-yellow-400 text-[13px] font-mono font-bold">${softPowerStore.getSoftPowerActionPreview(playerCountryId, selectedInspectCountry, previewActionKey, previewArgs).fiscalCostB}B</span>
                </div>
              </div>
              <p className="text-[9px] text-zinc-400 mt-2 italic leading-relaxed">
                *Outputs modeled using target segments: {softPowerStore.getSoftPowerActionPreview(playerCountryId, selectedInspectCountry, previewActionKey, previewArgs).targetedAudiences.join(', ')}. Backlash probabilities could scale heavily if coupled with high popular unrest.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
    </PanelFxShell>
  );
}
