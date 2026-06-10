import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import GlowSlider from '../shared/GlowSlider';
import HexGauge from '../shared/HexGauge';
import { Ideology, CabinetMember, Cabinet } from '../../types';

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
  if (!playerCountry) return <div className="text-red-500 font-mono">Error: Player Country not loaded.</div>;

  const pol = playerCountry.political;
  const econ = playerCountry.economic;
  const pop = playerCountry.populationSim;
  const cabinet = playerCountry.cabinet;

  // Sub-tab navigation
  const [govSubTab, setGovSubTab] = useState<'FISCAL' | 'CABINET' | 'DEMO'>('FISCAL');

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
    if (totalAlloc !== 100) {
      alert(`Budget assignment rejected! Spending divisions must aggregate exactly to 100% (current: ${totalAlloc}%).`);
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
  };

  const handleShiftIdeology = (newIdeology: Ideology) => {
    updateCountry(countryId, (draft) => {
      draft.political.ideology = newIdeology;
      draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 25);
      draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 20);
    });
    useWorldStore.getState().addGlobalEvent(`Constitutional Core Focus shifted to ${newIdeology} in ${playerCountry.name}!`, 'CRITICAL');
  };

  const handleBribeOligarch = (olId: string, costB: number) => {
    if (econ.treasuryCashB < costB) {
      alert('Sovereign funds insufficient.');
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
  };

  const handleExileOligarch = (olId: string) => {
    updateCountry(countryId, (draft) => {
      const idx = draft.economic.oligarchs.findIndex((o) => o.id === olId);
      if (idx !== -1) {
        draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 12);
        draft.economic.treasuryCashB += Math.round(draft.economic.oligarchs[idx].wealthB * 0.4);
        draft.economic.oligarchs.splice(idx, 1);
      }
    });
    useWorldStore.getState().addGlobalEvent(`decree: State expels industry oligarch assets.`, 'WARNING');
  };

  const handleToggleMartialLaw = () => {
    updateCountry(countryId, (draft) => {
      if (draft.political.martialLawActive) {
        draft.political.martialLawActive = false;
        draft.political.martialLawTicksRemaining = 0;
      } else {
        draft.political.martialLawActive = true;
        draft.political.martialLawTicksRemaining = 25;
        draft.political.stabilityIndex = Math.min(100, draft.political.stabilityIndex + 15);
        draft.political.popularUnrest = Math.max(0, draft.political.popularUnrest - 20);
      }
    });
    useWorldStore.getState().addGlobalEvent(`Federal martial decree invoked in ${playerCountry.name}.`, 'WARNING');
  };

  const handleReappointMinister = (portfolio: keyof Cabinet) => {
    const cost = 5.0; // five billion dollars
    if (econ.treasuryCashB < cost) {
      alert('Insufficient cash in treasury to fund transition.');
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
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3">
      {/* Sub tabs switches */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => setGovSubTab('FISCAL')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            govSubTab === 'FISCAL' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          ⚙️ FISCAL & EMERGENCIA
        </button>
        <button
          onClick={() => setGovSubTab('CABINET')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            govSubTab === 'CABINET' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          🛡️ THE STATE CABINET
        </button>
        <button
          onClick={() => setGovSubTab('DEMO')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            govSubTab === 'DEMO' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          👥 SOVEREIGN POPULATIONS
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      {govSubTab === 'FISCAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Budget assignments */}
          <div className="combat-panel flex flex-col gap-3">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
              FISCAL COMMISSARY BUDGET
            </h3>

            <GlowSlider label="Income Tax Rate" value={tax} min={0} max={60} onChange={setTax} unit="%" color="green" />
            <GlowSlider label="Corporate Tax Rate" value={corpTax} min={0} max={40} onChange={setCorpTax} unit="%" color="green" />

            <div className="border-t border-[#1a3a1a] my-1 pt-1 opacity-80 uppercase text-[9px] font-bold text-gray-500">
              SPENDING DIVISIONS LIST ({totalAlloc}% allocation):
            </div>

            <GlowSlider label="Military Allocation" value={Math.round(military * 100)} min={0} max={100} onChange={(v) => setMilitary(v / 100)} unit="%" color="amber" />
            <GlowSlider label="Healthcare Allocation" value={Math.round(healthcare * 100)} min={0} max={100} onChange={(v) => setHealthcare(v / 100)} unit="%" color="cyan" />
            <GlowSlider label="Education Allocation" value={Math.round(education * 100)} min={0} max={100} onChange={(v) => setEducation(v / 100)} unit="%" color="cyan" />
            <GlowSlider label="Infrastructure Allocation" value={Math.round(infra * 100)} min={0} max={100} onChange={(v) => setInfra(v / 100)} unit="%" color="green" />
            <GlowSlider label="Intelligence budget" value={Math.round(intel * 100)} min={0} max={100} onChange={(v) => setIntel(v / 100)} unit="%" color="amber" />
            <GlowSlider label="State Propaganda" value={Math.round(prop * 100)} min={0} max={100} onChange={(v) => setProp(v / 100)} unit="%" color="amber" />

            <div className="flex justify-between items-center mt-2 border-t border-[#162f16] pt-2">
              <span className={totalAlloc !== 100 ? 'text-[#ff2244] font-bold' : 'text-[#00ff44]'}>
                ALLOCATED: {totalAlloc} / 100%
              </span>
              <button
                onClick={handleApplyBudget}
                className="px-4 py-1.5 bg-[#1a4a1a] border border-[#2aff4a] text-[#00ff44] rounded hover:bg-[#256525] font-bold uppercase cursor-pointer"
              >
                APPLY BUDGET PLAN
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Gauges */}
            <div className="combat-panel flex justify-around items-center h-24">
              <HexGauge label="Popular Unrest" value={pol.popularUnrest} color={pol.popularUnrest > 65 ? 'red' : 'amber'} />
              <HexGauge label="Sovereign Stability" value={pol.stabilityIndex} color={pol.stabilityIndex < 35 ? 'red' : 'green'} />
              <HexGauge label="Leader Approval" value={pol.leaderApprovalRating} color={pol.leaderApprovalRating < 40 ? 'amber' : 'green'} />
            </div>

            {/* Constitution */}
            <div className="combat-panel flex flex-col gap-2.5">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-amber text-[10px]">
                CONSTITUTIONAL EMERGENCY AUTHORITY
              </h3>

              <div className="flex justify-between items-center">
                <span>Ideology state model:</span>
                <select
                  value={pol.ideology}
                  onChange={(e) => handleShiftIdeology(e.target.value as Ideology)}
                  className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[11px] p-1 font-mono uppercase rounded"
                >
                  <option value="DEMOCRACY">Democracy</option>
                  <option value="AUTOCRACY">Autocracy</option>
                  <option value="MILITARY_JUNTA">Military Junta</option>
                  <option value="THEOCRACY">Theocracy</option>
                  <option value="TECHNOCRACY">Technocracy</option>
                  <option value="OLIGARCHY">Oligarchy</option>
                </select>
              </div>

              <div className="flex justify-between items-center mt-2 border-t border-[#162f16] pt-2">
                <div>
                  <div className="font-bold">Martial Decree:</div>
                  <div className="text-[10px] text-gray-500">
                    {pol.martialLawActive ? `ACTIVE (${pol.martialLawTicksRemaining} ticks)` : 'STANDBY'}
                  </div>
                </div>
                <button
                  onClick={handleToggleMartialLaw}
                  className={`px-3 py-1.5 border font-bold uppercase text-[10px] rounded cursor-pointer ${
                    pol.martialLawActive
                      ? 'border-[#ff2244] text-[#ff2244] bg-[#220005] hover:bg-[#40000a]'
                      : 'border-[#ffb300] text-[#ffb300] bg-[#1d1400] hover:bg-[#352000]'
                  }`}
                >
                  {pol.martialLawActive ? 'DISABLE MARTIAL LAW' : 'ENACT MARTIAL LAW'}
                </button>
              </div>
            </div>

            {/* Oligarchs */}
            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]">
                INDUSTRIALS & OLIGARCH NETWORKS
              </h3>
              <div className="overflow-y-auto max-h-[140px] space-y-1">
                {econ.oligarchs.map((o) => (
                  <div key={o.id} className="border border-[#0d1f0d] bg-[#030603] p-1.5 flex justify-between items-center rounded text-[11px]">
                    <div>
                      <div className="font-bold text-[#00e5ff]">{o.name}</div>
                      <div className="text-[8px] text-gray-500 uppercase">
                        WEALTH: ${o.wealthB}B | sector: {o.sector}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-right text-[9px] mr-1.5 font-mono">
                        <span className="text-gray-500 uppercase">LOYALTY:</span>{' '}
                        <span className={o.loyalty > 65 ? 'text-[#00ff44]' : o.loyalty < 35 ? 'text-[#ff2244]' : 'text-[#ffb300]'}>
                          {o.loyalty}%
                        </span>
                      </div>
                      <button
                        onClick={() => handleBribeOligarch(o.id, 5.0)}
                        className="px-2 py-0.5 border border-[#1a3a1a] text-gray-400 hover:text-[#00ff44] hover:bg-[#071707] cursor-pointer text-[10px]"
                      >
                        Bribe ($5B)
                      </button>
                      <button
                        onClick={() => handleExileOligarch(o.id)}
                        className="px-2 py-0.5 border border-red-950 text-red-500 hover:bg-[#ff2244]/15 cursor-pointer text-[10px]"
                      >
                        Exile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {govSubTab === 'CABINET' && (
        <div className="combat-panel flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
            SOVEREIGN MINISTERIAL ASSEMBLY
          </h3>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-2xl">
            Incompetence in cabinet positions causes systemic leakage (corruption triggers offshore siphons, un-aligned Central Bankers resist cash orders, low foreign ministry skills stall broker lines). Spend $5B to reshuffle and reappoint.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {[
              { key: 'defenseMinister', tag: 'DEFENSE MINISTER', desc: 'Influences deployment speeds, abm interceptions, and troop maintenance rates.', icon: '🛡️' },
              { key: 'financeMinister', tag: 'FINANCE MINISTER', desc: 'Affects tax multipliers, rating reports, and corporate GDP expansion coefficients.', icon: '💼' },
              { key: 'foreignMinister', tag: 'FOREIGN MINISTER', desc: 'Drives opinion recovery thresholds and lowers block trade tariff penalties.', icon: '🌍' },
              { key: 'intelligenceChief', tag: 'INTELLIGENCE CHIEF', desc: 'Improves signal penetration scores and counterintelligence exposure chance.', icon: '💾' },
              { key: 'centralBankGovernor', tag: 'CENTRAL BANK GOVERNOR', desc: 'Directs monetary yields, inflation rates, and cash printing margins.', icon: '🏛️' }
            ].map((min) => {
              const member = cabinet ? cabinet[min.key as keyof Cabinet] : null;
              if (!member) return null;

              return (
                <div key={min.key} className="border border-[#1a3a1a] bg-[#020502] p-3 rounded flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex justify-between items-center border-b border-[#0f240f] pb-1.5">
                      <span className="font-bold text-[#00ff44] tracking-wide text-shadow">
                        {min.icon} {min.tag}
                      </span>
                      <span className="text-[9px] uppercase bg-[#142814] px-1 py-0.5 border border-[#1a4a1a] text-[#00e5ff]">
                        {member.ideology}
                      </span>
                    </div>
                    <div className="mt-1.5 font-bold text-gray-300 text-[11px]">{member.name}</div>
                    <p className="text-[9px] text-gray-500 leading-normal mt-1">{min.desc}</p>
                  </div>

                  <div className="space-y-1 text-[10px] bg-black/40 p-2 border border-[#0d1c0d] rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-500">COMPETENCE:</span>
                      <span className={`font-bold ${member.competence > 75 ? 'text-[#00ff44]' : member.competence < 45 ? 'text-[#ff2244]' : 'text-amber-500'}`}>
                        {member.competence}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">STATE LOYALTY:</span>
                      <span className={`font-bold ${member.loyalty > 75 ? 'text-[#00ff44]' : member.loyalty < 45 ? 'text-[#ff2244]' : 'text-amber-500'}`}>
                        {member.loyalty}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">CORRUPTION PROFILE:</span>
                      <span className={`font-bold ${member.corruption > 25 ? 'text-[#ff2244]' : 'text-gray-400'}`}>
                        {member.corruption}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReappointMinister(min.key as keyof Cabinet)}
                    className="w-full text-center py-1 bg-[#102d10] hover:bg-[#1a4a1a] border border-[#1d4d1d] rounded text-[10px] font-bold uppercase transition-colors text-shadow cursor-pointer mt-1"
                  >
                    🔀 REAPPOINT MEMBER ($5B)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {govSubTab === 'DEMO' && (
        <div className="combat-panel flex flex-col gap-4">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
            SOVEREIGN POPULATION SIMULATION REGISTER
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Demographics details */}
            <div className="border border-[#1a3a1a] bg-[#020502] p-3 rounded space-y-3">
              <span className="font-bold text-[#00ff44] block border-b border-[#0d1c0d] pb-1">
                👥 CORE INDICATORS
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">TOTAL POPULATION:</span>
                  <span className="font-bold text-white">{playerCountry.population.toFixed(1)} Million</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">BIRTH RATE (per per 1000):</span>
                  <span className="font-bold text-shadow text-white">{pop?.birthRate}/k</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-mono">DEATH RATE (per 1000):</span>
                  <span className="font-bold text-[#ff2244]">{pop?.deathRate}/k</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">NET MIGRATION DRIFT:</span>
                  <span className={`font-bold ${pop && pop.migration < 0 ? 'text-[#ff2244]' : 'text-[#00ff44]'}`}>
                    {pop && pop.migration > 0 ? `+${pop.migration}` : pop?.migration}k /tick
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">WORKFORCE PARTICIPATION:</span>
                  <span className="font-bold text-[#00ff44]">{pop?.workforceParticipation}%</span>
                </div>
              </div>
            </div>

            {/* Demographics details 2 */}
            <div className="border border-[#1a3a1a] bg-[#020502] p-3 rounded space-y-3">
              <span className="font-bold text-[#00ff44] block border-b border-[#0d1c0d] pb-1">
                🎂 AGE DEMOGRAPHICS
              </span>
              <div className="space-y-2">
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-gray-400">
                    <span>YOUTH (Under 18):</span>
                    <span>{pop?.ageDemographics.youthPct}%</span>
                  </div>
                  <div className="w-full bg-[#0d1f0d] h-2 rounded overflow-hidden border border-[#1a3a1a]">
                    <div className="bg-[#00e5ff] h-full" style={{ width: `${pop?.ageDemographics.youthPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-gray-400">
                    <span>ADULTS (18 - 65):</span>
                    <span>{pop?.ageDemographics.adultPct}%</span>
                  </div>
                  <div className="w-full bg-[#0d1f0d] h-2 rounded overflow-hidden border border-[#1a3a1a]">
                    <div className="bg-[#00ff44] h-full" style={{ width: `${pop?.ageDemographics.adultPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-gray-400">
                    <span>ELDERLY (65+):</span>
                    <span>{pop?.ageDemographics.elderlyPct}%</span>
                  </div>
                  <div className="w-full bg-[#0d1f0d] h-2 rounded overflow-hidden border border-[#1a3a1a]">
                    <div className="bg-[#ffb300] h-full" style={{ width: `${pop?.ageDemographics.elderlyPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Demographic composition */}
            <div className="border border-[#1a3a1a] bg-[#020502] p-3 rounded space-y-3">
              <span className="font-bold text-[#00ff44] block border-b border-[#0d1c0d] pb-1">
                📊 SOCIO-CIVIL INDEX
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">EDUCATION LEVEL:</span>
                  <span className="font-bold text-[#00ff44]">{pop?.educationLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-mono">URBANIZATION:</span>
                  <span className="font-bold text-white">{pop?.urbanization}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">POVERTY RATE:</span>
                  <span className={`font-bold ${pop && pop.poverty > 30 ? 'text-[#ff2244]' : 'text-green-500'}`}>
                    {pop?.poverty}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] border-t border-[#0e1d0e] pt-1">
                  <span className="text-gray-500 font-mono">RELIGIOUS MOOD:</span>
                  <span className="text-gray-300">
                    Secular {pop?.religiousComposition.secular}% / Faith {pop?.religiousComposition.religiousA}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">ETHNIC SPLIT:</span>
                  <span className="text-gray-300">
                    Majority {pop?.ethnicComposition.majority}% / Diversity {pop?.ethnicComposition.minorityA}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
