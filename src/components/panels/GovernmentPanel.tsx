import React, { useState, useEffect } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import GlowSlider from '../shared/GlowSlider';
import HexGauge from '../shared/HexGauge';
import { Ideology, CabinetMember, Cabinet } from '../../types';
import { audio } from '../../utils/audio';
import { useUIStore } from '../../store/uiStore';

const CABINET_NAMES = [
  'Hon. Christopher Vance', 'Dr. Aris Sterling', 'Elena Rostova', 'Linus Zhao', 
  'Rajesh Patel', 'Akira Takahashi', 'Arthur Pendelton', 'Fatima Al-Sayed', 
  'Marcus Aurel', 'Sarah Jenkins', 'Jin-Woo Park', 'Nadia Kowalski'
];

export default function GovernmentPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Player Country not loaded.</div>;

  const pol = playerCountry.political;
  const econ = playerCountry.economic;
  const pop = playerCountry.populationSim;
  const cabinet = playerCountry.cabinet;

  // Sub-tab navigation
  const [govSubTab, setGovSubTab] = useState<'STRUGGLE' | 'LEGISLATURE'>('STRUGGLE');

  // Local state for budgeting sliders
  const [tax, setTax] = useState(econ.taxRate);
  const [corpTax, setCorpTax] = useState(econ.corporateTaxRate);
  const [military, setMilitary] = useState(econ.spendingAllocation.military);
  const [healthcare, setHealthcare] = useState(econ.spendingAllocation.healthcare);
  const [education, setEducation] = useState(econ.spendingAllocation.education);
  const [infra, setInfra] = useState(econ.spendingAllocation.infrastructure);
  const [intel, setIntel] = useState(econ.spendingAllocation.intelligence);
  const [prop, setProp] = useState(econ.spendingAllocation.propaganda);

  // Sync sliders to incoming state shifts on tick
  useEffect(() => {
    setTax(econ.taxRate);
    setCorpTax(econ.corporateTaxRate);
    setMilitary(econ.spendingAllocation.military);
    setHealthcare(econ.spendingAllocation.healthcare);
    setEducation(econ.spendingAllocation.education);
    setInfra(econ.spendingAllocation.infrastructure);
    setIntel(econ.spendingAllocation.intelligence);
    setProp(econ.spendingAllocation.propaganda);
  }, [econ]);

  // Compute total spending percentage
  const totalAlloc = Math.round((military + healthcare + education + infra + intel + prop) * 100);

  const handleApplyBudget = () => {
    audio.sfxKeyClick();
    if (totalAlloc !== 100) {
      useUIStore.getState().pushAlert({
        title: 'FISCAL ALLOCATION REJECTED',
        message: `Budget assignment error: Spending allocations must sum up to exactly 100% of available resources (currently configured at ${totalAlloc}%). Please re-adjust sliders or use presets.`,
        type: 'WARNING'
      });
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.taxRate = tax;
      draft.economic.corporateTaxRate = corpTax;
      draft.economic.spendingAllocation = {
        military: military,
        healthcare: healthcare,
        education: education,
        infrastructure: infra,
        intelligence: intel,
        propaganda: prop,
        debtService: draft.economic.spendingAllocation.debtService,
      };
    });
    
    useWorldStore.getState().addGlobalEvent(`Fiscal Command: New budget plan approved in ${playerCountry.name}.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'FISCAL DECREE APPROVED',
      message: `The national treasury has successfully applied the new tax rates and structural budget splits. Budgeting matrices synchronized.`,
      type: 'INFO'
    });
  };

  const handleApplyPreset = (preset: 'BALANCED' | 'DEFENSE' | 'WELFARE' | 'CLANDESTINE') => {
    audio.sfxKeyClick();
    if (preset === 'BALANCED') {
      setMilitary(0.18);
      setHealthcare(0.17);
      setEducation(0.17);
      setInfra(0.16);
      setIntel(0.16);
      setProp(0.16);
    } else if (preset === 'DEFENSE') {
      setMilitary(0.50);
      setHealthcare(0.10);
      setEducation(0.10);
      setInfra(0.10);
      setIntel(0.10);
      setProp(0.10);
    } else if (preset === 'WELFARE') {
      setMilitary(0.10);
      setHealthcare(0.35);
      setEducation(0.35);
      setInfra(0.10);
      setIntel(0.05);
      setProp(0.05);
    } else if (preset === 'CLANDESTINE') {
      setMilitary(0.15);
      setHealthcare(0.10);
      setEducation(0.10);
      setInfra(0.05);
      setIntel(0.30);
      setProp(0.30);
    }
  };

  const handleShiftIdeology = (newIdeology: Ideology) => {
    audio.sfxKeyClick();
    updateCountry(countryId, (draft) => {
      draft.political.ideology = newIdeology;
      draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 25);
      draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 20);
    });
    useWorldStore.getState().addGlobalEvent(`Constitutional Core Focus shifted to ${newIdeology} in ${playerCountry.name}!`, 'CRITICAL');
    
    useUIStore.getState().pushAlert({
      title: 'CONSTITUTION OVERHAULED',
      message: `Sovereign parameters shifted to: "${newIdeology.replace('_', ' ')}". Expect brief social stability friction and public popular unrest index spikes.`,
      type: 'WARNING'
    });
  };

  const handleBribeOligarch = (olId: string, costB: number) => {
    audio.sfxKeyClick();
    if (econ.treasuryCashB < costB) {
      useUIStore.getState().pushAlert({
        title: 'TRANSACTION REJECTED',
        message: `Sovereign liquidity failed: Transmision of offshore bribery fund requires $${costB}B. Treasury is heavily underfunded.`,
        type: 'DANGER'
      });
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= costB;
      const found = draft.economic.oligarchs.find((o) => o.id === olId);
      if (found) {
        found.loyalty = Math.min(100, found.loyalty + 25);
      }
    });
    
    useWorldStore.getState().addGlobalEvent(`Financial Desk: Dispatched Offshore retainer to co-opt oligarchs.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'CO-OPT COVENTS ROUTED',
      message: `Offshore assets routed to Industrial Oligarch. Sector loyalty index successfully expanded by +25%.`,
      type: 'INFO'
    });
  };

  const handleExileOligarch = (olId: string) => {
    audio.sfxKeyClick();
    let nameExiled = '';
    let wealthRecovered = 0;

    updateCountry(countryId, (draft) => {
      const idx = draft.economic.oligarchs.findIndex((o) => o.id === olId);
      if (idx !== -1) {
        nameExiled = draft.economic.oligarchs[idx].name;
        wealthRecovered = Math.round(draft.economic.oligarchs[idx].wealthB * 0.4);
        draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 12);
        draft.economic.treasuryCashB += wealthRecovered;
        draft.economic.oligarchs.splice(idx, 1);
      }
    });

    useWorldStore.getState().addGlobalEvent(`decree: State expels industry oligarch assets.`, 'WARNING');
    
    useUIStore.getState().pushAlert({
      title: 'OLIGARCH ASSET SEIZURE',
      message: `Exiled oligarch "${nameExiled}". Seized domestic assets yielded $${wealthRecovered}B into the state treasury. Public stability marginally impacted.`,
      type: 'WARNING'
    });
  };

  const handleToggleMartialLaw = () => {
    audio.sfxKeyClick();
    let active = false;
    updateCountry(countryId, (draft) => {
      if (draft.political.martialLawActive) {
        draft.political.martialLawActive = false;
        draft.political.martialLawTicksRemaining = 0;
      } else {
        draft.political.martialLawActive = true;
        draft.political.martialLawTicksRemaining = 25;
        draft.political.stabilityIndex = Math.min(100, draft.political.stabilityIndex + 15);
        draft.political.popularUnrest = Math.max(0, draft.political.popularUnrest - 20);
        active = true;
      }
    });
    useWorldStore.getState().addGlobalEvent(`Federal martial decree invoked in ${playerCountry.name}.`, 'WARNING');
    
    useUIStore.getState().pushAlert({
      title: active ? 'MARTIAL LAW ENFORCED' : 'MARTIAL LAW DEACTIVATED',
      message: active 
        ? 'Sovereign forces mobilized onto capital nodes. Unrest is suppressed, national stability index stabilized.'
        : 'Emergency martial guidelines deactivated. Democratic legislative channels re-opened.',
      type: active ? 'WARNING' : 'INFO'
    });
  };

  const handleReappointMinister = (portfolio: keyof Cabinet) => {
    audio.sfxKeyClick();
    const cost = 5.0; // five billion dollars
    if (econ.treasuryCashB < cost) {
      useUIStore.getState().pushAlert({
        title: 'TRANSITION BLOCKADE',
        message: `Cabinet Reshuffle Denied: Transitioning administrative personnel requires $5.0B in state treasury reserves. Current cash is low.`,
        type: 'DANGER'
      });
      return;
    }

    const randomName = CABINET_NAMES[Math.floor(Math.random() * CABINET_NAMES.length)];
    const generated: CabinetMember = {
      name: randomName,
      competence: Math.round(60 + Math.random() * 40),
      loyalty: Math.round(65 + Math.random() * 35),
      corruption: Math.round(Math.random() * 20),
      ideology: pol.ideology
    };

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= cost;
      if (draft.cabinet) {
        draft.cabinet[portfolio] = generated;
      }
    });

    useWorldStore.getState().addGlobalEvent(`Cabinet reshuffle: New appointee ${generated.name} is now the target minister for ${portfolio}.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'CABINET REORGANIZED',
      message: `Ministry appointed: "${generated.name}" has taken control of the "${portfolio.replace('_', ' ')}" portfolio. Competence: ${generated.competence}%.`,
      type: 'INFO'
    });
  };

  return (
    <PanelFxShell panelId="government_stability" relevantFxTypes={['COUP_SUCCESS','REGIME_CHANGE','REGIME_PRESSURE_CRITICAL','WAR_DECLARED','SANCTIONS_ESCALATION']}>
      <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Sub tabs switches */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => { audio.sfxKeyClick(); setGovSubTab('STRUGGLE'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            govSubTab === 'STRUGGLE' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          ⚔️ Struggle & Instability
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setGovSubTab('LEGISLATURE'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            govSubTab === 'LEGISLATURE' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🏛️ Legislature & Policies
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      {govSubTab === 'STRUGGLE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Popular Gauges */}
          <div className="space-y-4">
            <div className="combat-panel flex justify-around items-center h-[112px] py-2 px-4 border border-[#1a5c1a] bg-[#030603] rounded">
              <HexGauge label="Popular Unrest" value={pol.popularUnrest} color={pol.popularUnrest > 65 ? 'red' : 'amber'} />
              <HexGauge label="Sovereign Stability" value={pol.stabilityIndex} color={pol.stabilityIndex < 35 ? 'red' : 'green'} />
              <HexGauge label="Leader Approval" value={pol.leaderApprovalRating} color={pol.leaderApprovalRating < 40 ? 'amber' : 'green'} />
            </div>

            {/* Constitution Emergency */}
            <div id="constitutional-emergency-panel" className="combat-panel flex flex-col gap-2.5 border border-[#1a5c1a] bg-[#030603] p-4 rounded shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ffb300] text-[10px]/1">
                CONSTITUTIONAL EMERGENCY AUTHORITY
              </h3>

              <div id="martial-law-row" className="flex justify-between items-center pt-2">
                <div>
                  <div className="font-bold text-gray-300 text-[11px]">Martial Decree Level:</div>
                  <div className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
                    {pol.martialLawActive ? `ACTIVE [REMAINING: ${pol.martialLawTicksRemaining} TICKS]` : 'STANDBY - NOMINAL RULES'}
                  </div>
                </div>
                <button
                  id="martial-law-toggle-btn"
                  onClick={handleToggleMartialLaw}
                  className={`w-[150px] py-2 border font-bold uppercase text-[9px] rounded cursor-pointer text-center tracking-wider transition-all active:translate-y-0.5 relative group ${
                    pol.martialLawActive
                      ? 'border-[#ff2244] text-[#ff2244] bg-[#220002] hover:bg-[#400005]'
                      : 'border-[#ffb300] text-[#ffb300] bg-[#1d1400] hover:bg-[#352000]'
                  }`}
                >
                  {pol.martialLawActive ? 'DISABLE MARTIAL LAW' : 'ENACT MARTIAL LAW'}
                  <span className="absolute -top-1.5 -right-1 bg-black text-gray-400 border border-current text-[6.5px] font-mono font-bold px-1 rounded transition-opacity">ALT+M</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Oligarchs & Networks */}
          <div className="combat-panel flex flex-col gap-2 border border-[#1a5c1a] bg-[#030603] p-4 rounded shadow-inner">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
              INDUSTRIALS & OLIGARCH NETWORKS
            </h3>
            <div className="overflow-y-auto max-h-[180px] space-y-1.5 pr-1 scrollbar-thin">
              {econ.oligarchs.map((o) => (
                <div key={o.id} className="border border-[#0d1f0d] bg-[#020402] p-2.5 flex justify-between items-center rounded text-[11px] hover:bg-[#061206]">
                  <div>
                    <div className="font-bold text-[#00e5ff]">{o.name}</div>
                    <div className="text-[8px] text-gray-500 uppercase">
                      Wealth Portfolio: <span className="text-white">${o.wealthB}B</span> | Sector: <span className="text-white">{o.sector}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-right text-[9px] mr-1 font-mono">
                      <span className="text-gray-500 uppercase">LOYALTY:</span>{' '}
                      <span className={`font-bold ${o.loyalty > 65 ? 'text-[#00ff44]' : o.loyalty < 35 ? 'text-[#ff2244] animate-pulse font-black' : 'text-[#ffb300]'}`}>
                        {o.loyalty}%
                      </span>
                    </div>
                    <button
                      onClick={() => handleBribeOligarch(o.id, 5.0)}
                      className="px-2 py-1 bg-[#102a10] border border-[#163a16] text-gray-400 hover:text-[#00ff44] hover:bg-[#071707] cursor-pointer text-[9px] rounded font-bold transition-all"
                    >
                      Bribe ($5B)
                    </button>
                    <button
                      onClick={() => handleExileOligarch(o.id)}
                      className="px-2 py-1 bg-[#2a1012] border border-red-950 text-red-500 hover:bg-[#ff2244]/15 cursor-pointer text-[9px] rounded font-bold transition-all"
                    >
                      Exile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {govSubTab === 'LEGISLATURE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Budget assignments & Ideology model */}
          <div className="space-y-4">
            <div className="combat-panel flex flex-col gap-3 border border-[#1a5c1a] bg-[#030603] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                FISCAL DECREE BUDGET
              </h3>

              <div id="ideology-selector-row" className="flex justify-between items-center bg-[#071407]/40 p-2 border border-[#113211]/50 rounded">
                <span className="text-gray-400 font-bold">Ideology State model:</span>
                <select
                  id="ideology-state-select"
                  value={pol.ideology}
                  onChange={(e) => handleShiftIdeology(e.target.value as Ideology)}
                  className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[11px] p-1 font-mono uppercase rounded w-[150px] text-center cursor-pointer"
                >
                  <option value="DEMOCRACY">Democracy</option>
                  <option value="AUTOCRACY">Autocracy</option>
                  <option value="MILITARY_JUNTA">Military Junta</option>
                  <option value="THEOCRACY">Theocracy</option>
                  <option value="TECHNOCRACY">Technocracy</option>
                  <option value="OLIGARCHY">Oligarchy</option>
                </select>
              </div>

              <GlowSlider label="Income Tax Rate" value={tax} min={0} max={60} onChange={setTax} unit="%" color="green" />
              <GlowSlider label="Corporate Tax Rate" value={corpTax} min={0} max={40} onChange={setCorpTax} unit="%" color="green" />

              <div className="border-t border-[#1a3a1a] my-1 pt-2">
                <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <span>BUDGET DIVISIONS ({totalAlloc}% / 100%):</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleApplyPreset('BALANCED')} className="cursor-pointer font-sans px-1.5 py-0.5 border border-cyan-800 text-cyan-400 bg-cyan-950/20 rounded hover:bg-cyan-900/30 text-[8px]">Balanced</button>
                    <button onClick={() => handleApplyPreset('DEFENSE')} className="cursor-pointer font-sans px-1.5 py-0.5 border border-red-800 text-red-400 bg-red-950/20 rounded hover:bg-red-900/30 text-[8px]">Hawks</button>
                    <button onClick={() => handleApplyPreset('WELFARE')} className="cursor-pointer font-sans px-1.5 py-0.5 border border-green-800 text-green-400 bg-green-950/20 rounded hover:bg-green-900/30 text-[8px]">Social</button>
                    <button onClick={() => handleApplyPreset('CLANDESTINE')} className="cursor-pointer font-sans px-1.5 py-0.5 border border-amber-800 text-amber-500 bg-amber-950/20 rounded hover:bg-amber-900/30 text-[8px]">Covert</button>
                  </div>
                </div>
              </div>

              <GlowSlider label="Military Allocation" value={Math.round(military * 100)} min={0} max={100} onChange={(v) => setMilitary(v / 100)} unit="%" color="amber" />
              <GlowSlider label="Healthcare Allocation" value={Math.round(healthcare * 100)} min={0} max={100} onChange={(v) => setHealthcare(v / 100)} unit="%" color="cyan" />
              <GlowSlider label="Education Allocation" value={Math.round(education * 100)} min={0} max={100} onChange={(v) => setEducation(v / 100)} unit="%" color="cyan" />
              <GlowSlider label="Infrastructure Allocation" value={Math.round(infra * 100)} min={0} max={100} onChange={(v) => setInfra(v / 100)} unit="%" color="green" />
              <GlowSlider label="Intelligence budget" value={Math.round(intel * 100)} min={0} max={100} onChange={(v) => setIntel(v / 100)} unit="%" color="amber" />
              <GlowSlider label="State Propaganda" value={Math.round(prop * 100)} min={0} max={100} onChange={(v) => setProp(v / 100)} unit="%" color="amber" />

              <div className="flex justify-between items-center mt-2.5 border-t border-[#162f16] pt-2">
                <span className={`font-black tracking-wide ${totalAlloc !== 100 ? 'text-[#ff2244]' : 'text-[#00ff44]'}`}>
                  ALLOCATION SUM: {totalAlloc} / 100%
                </span>
                <button
                  onClick={handleApplyBudget}
                  className="px-4 py-1.5 bg-[#103510] border border-[#2aff4a] text-[#00ff44] rounded hover:bg-[#1f5f1f] font-bold uppercase cursor-pointer text-[10px] transition-all active:translate-y-0.5"
                >
                  APPLY BUDGET PLAN
                </button>
              </div>
            </div>

            {/* Demographics indicators info block */}
            <div className="combat-panel flex flex-col gap-2 border border-[#1a5c1a] bg-[#030603] p-4 rounded text-[11px] space-y-1 shadow-inner">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00e5ff] text-[10px]">
                👥 GEOPOLITICAL STATE POPULUST CONSTITUTION
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-400 font-mono text-[10px]">
                <div>TOTAL HEADCOUNT: <span className="font-bold text-white">{playerCountry.population.toFixed(1)}M</span></div>
                <div>BIRTH REGISTER: <span className="font-bold text-white">+{pop?.birthRate || 14.5}/k</span></div>
                <div>MORTALITY REGISTER: <span className="font-bold text-red-500">-{pop?.deathRate || 7.2}/k</span></div>
                <div>NET MIGRATION: <span className={(pop?.migration ?? 0) < 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{pop?.migration && pop.migration > 0 ? `+${pop.migration}` : pop?.migration}k</span></div>
                <div>URBAN RESIDENTS: <span className="font-bold text-white">{pop?.urbanization || 72}%</span></div>
                <div>LITERACY RATING: <span className="font-bold text-[#00ff44]">{pop?.educationLevel || 85}%</span></div>
              </div>
            </div>
          </div>

          {/* Column 2: State cabinet list */}
          <div className="combat-panel flex flex-col gap-3 border border-[#1a5c1a] bg-[#030603] p-4 rounded shadow-inner">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
              SOVEREIGN MINISTERIAL ASSEMBLY CABINET
            </h3>
            <p className="text-[9px] text-gray-500 leading-normal">
              Portfolio holders influence domestic state efficiency. Expending $5B swaps underperforming ministers.
            </p>

            <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
              {[
                { key: 'defenseMinister', tag: 'DEFENSE MINISTER', desc: 'Directs deployment rates and reduces defense fatigue.', icon: '🛡️' },
                { key: 'financeMinister', tag: 'FINANCE MINISTER', desc: 'Sustains tax yield output and safeguards corporate bonds.', icon: '💼' },
                { key: 'foreignMinister', tag: 'FOREIGN MINISTER', desc: 'Improves diplomatic opinions and lowers alliance friction.', icon: '🌍' },
                { key: 'intelligenceChief', tag: 'INTELLIGENCE CHIEF', desc: 'Boosts cyber network scores and reduces operation exposure.', icon: '💾' },
                { key: 'centralBankGovernor', tag: 'CENTRAL BANK GOVERNOR', desc: 'Manages interest settings and liquidity printing multipliers.', icon: '🏛️' }
              ].map((min) => {
                const member = cabinet ? cabinet[min.key as keyof Cabinet] : null;
                if (!member) return null;

                return (
                  <div key={min.key} className="border border-[#1a3a1a] bg-[#020502] p-2.5 rounded flex flex-col justify-between gap-1.5 hover:bg-[#050e05] transition-all">
                    <div>
                      <div className="flex justify-between items-center border-b border-[#0f240f] pb-1">
                        <span className="font-bold text-[#00ff44] tracking-wide text-[9px] uppercase">
                          {min.icon} {min.tag}
                        </span>
                        <span className="text-[8px] uppercase bg-[#142814] px-1 py-0.5 border border-[#1a4a1a] text-[#00e5ff] font-bold">
                          {member.ideology}
                        </span>
                      </div>
                      <div className="mt-1 font-bold text-gray-200 text-[10px] uppercase tracking-wide">{member.name}</div>
                      <p className="text-[8.5px] text-gray-500 leading-normal mt-0.5">{min.desc}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[9px] bg-black/40 p-1.5 border border-[#0d1c0d] rounded text-center font-mono">
                      <div>
                        <div className="text-gray-500 text-[7.5px] uppercase">SKILL</div>
                        <span className={`font-black ${member.competence > 75 ? 'text-[#00ff44]' : member.competence < 45 ? 'text-[#ff2244]' : 'text-amber-500'}`}>
                          {member.competence}%
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[7.5px] uppercase">LOYAL</div>
                        <span className={`font-black ${member.loyalty > 75 ? 'text-[#00ff44]' : member.loyalty < 45 ? 'text-[#ff2244]' : 'text-amber-500'}`}>
                          {member.loyalty}%
                        </span>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[7.5px] uppercase">CORRUPT</div>
                        <span className={`font-black ${member.corruption > 25 ? 'text-[#ff2244] animate-pulse' : 'text-gray-400'}`}>
                          {member.corruption}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReappointMinister(min.key as keyof Cabinet)}
                      className="w-full text-center py-1.5 bg-[#102d10] hover:bg-[#1a4a1a] border border-[#1d4d1d] rounded text-[8.5px] font-bold uppercase transition-colors text-shadow cursor-pointer tracking-wider active:translate-y-0.5"
                    >
                      🔀 REAPPOINT CABINET OFFICER ($5.0B)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
    </PanelFxShell>
  );
}
