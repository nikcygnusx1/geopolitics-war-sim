import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import GlowSlider from '../shared/GlowSlider';
import HexGauge from '../shared/HexGauge';
import { Ideology, FactionType } from '../../types';

export default function GovernmentPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono">Error: Player Country not loaded.</div>;

  const pol = playerCountry.political;
  const econ = playerCountry.economic;

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
      alert(`Budget failed allocation criteria! Allocations must sum exactly to 100% (currently: ${totalAlloc}%).`);
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
        debtService: draft.economic.spendingAllocation.debtService, // Preserve
      };
    });
    useWorldStore.getState().addGlobalEvent(`Fiscal Command: New budget plan approved in ${playerCountry.name}. Allocations modified.`, 'INFO');
  };

  const handleShiftIdeology = (newIdeology: Ideology) => {
    updateCountry(countryId, (draft) => {
      draft.political.ideology = newIdeology;
      draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 25);
      draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 20);
    });
    useWorldStore.getState().addGlobalEvent(`Constitutional Alarm: ${playerCountry.name} shifts sovereign system structures to ${newIdeology}!`, 'CRITICAL');
  };

  const handleBribeOligarch = (olId: string, costB: number) => {
    if (econ.treasuryCashB < costB) {
      alert('Sovereign debt limit exceeded. Insufficient treasury cash B.');
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= costB;
      const found = draft.economic.oligarchs.find((o) => o.id === olId);
      if (found) {
        found.loyalty = Math.min(100, found.loyalty + 25);
      }
    });

    useWorldStore.getState().addGlobalEvent(`Financial Desk: Dispatched Offshore retainer check to co-opt dissident networks.`, 'INFO');
  };

  const handleExileOligarch = (olId: string) => {
    updateCountry(countryId, (draft) => {
      const idx = draft.economic.oligarchs.findIndex((o) => o.id === olId);
      if (idx !== -1) {
        draft.political.stabilityIndex = Math.max(10, draft.political.stabilityIndex - 12);
        draft.economic.treasuryCashB += Math.round(draft.economic.oligarchs[idx].wealthB * 0.4); // confiscate portion
        draft.economic.oligarchs.splice(idx, 1);
      }
    });
    useWorldStore.getState().addGlobalEvent(`Executive decree: State expels industry oligarch assets confiscating onshore bank reserves.`, 'WARNING');
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
    useWorldStore.getState().addGlobalEvent(`Federal martial decree invoked over ${playerCountry.name} civil transport centers.`, 'WARNING');
  };

  return (
    <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Col 1: Budget adjustments */}
      <div className="combat-panel flex flex-col gap-3">
        <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
          FISCAL COMMISSARY CABINET
        </h3>

        <GlowSlider label="Income Tax Rate" value={tax} min={0} max={60} onChange={setTax} unit="%" color="green" />
        <GlowSlider label="Corporate Tax Rate" value={corpTax} min={0} max={40} onChange={setCorpTax} unit="%" color="green" />

        <div className="border-t border-[#1a3a1a] my-1 pt-1 opacity-80 uppercase text-[9px] font-bold text-gray-500">
          SPENDING ALLOCATIONS LIST ({totalAlloc}% of total budget):
        </div>

        <GlowSlider label="Military Allocation" value={Math.round(military * 100)} min={0} max={100} onChange={(v) => setMilitary(v / 100)} unit="%" color="amber" />
        <GlowSlider label="Healthcare Allocation" value={Math.round(healthcare * 100)} min={0} max={100} onChange={(v) => setHealthcare(v / 100)} unit="%" color="cyan" />
        <GlowSlider label="Education Allocation" value={Math.round(education * 100)} min={0} max={100} onChange={(v) => setEducation(v / 100)} unit="%" color="cyan" />
        <GlowSlider label="Infrastructure Allocation" value={Math.round(infra * 100)} min={0} max={100} onChange={(v) => setInfra(v / 100)} unit="%" color="green" />
        <GlowSlider label="Intelligence budget" value={Math.round(intel * 100)} min={0} max={100} onChange={(v) => setIntel(v / 100)} unit="%" color="amber" />
        <GlowSlider label="State Propaganda" value={Math.round(prop * 100)} min={0} max={100} onChange={(v) => setProp(v / 100)} unit="%" color="amber" />

        <div className="flex justify-between items-center mt-2 border-t border-[#162f16] pt-2">
          <span className={totalAlloc !== 100 ? 'text-phosphor-red font-bold' : 'text-phosphor-green'}>
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

      {/* Col 2: Administration policies + Oligarchs */}
      <div className="flex flex-col gap-4">
        {/* Core gauges */}
        <div className="combat-panel flex justify-around items-center h-28">
          <HexGauge label="Popular Unrest" value={pol.popularUnrest} color={pol.popularUnrest > 65 ? 'red' : 'amber'} />
          <HexGauge label="Sovereign Stability" value={pol.stabilityIndex} color={pol.stabilityIndex < 35 ? 'red' : 'green'} />
          <HexGauge label="Leader Approval" value={pol.leaderApprovalRating} color={pol.leaderApprovalRating < 40 ? 'amber' : 'green'} />
        </div>

        {/* Martial Law & Ideology Console */}
        <div className="combat-panel flex flex-col gap-2.5">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-amber text-[10px]">
            CONSTITUTIONAL EMERGENCY AUTHORITY
          </h3>

          <div className="flex justify-between items-center">
            <span>Sovereign Ideology System:</span>
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
              <div className="font-bold">Martial Decree Status:</div>
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

        {/* Oligarchs networks table */}
        <div className="combat-panel flex flex-col gap-2 flex-1">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]">
            FINANCIAL INDUSTRIAL TRUSTS & OLIGARCHS
          </h3>

          <div className="overflow-y-auto max-h-[160px] space-y-1">
            {econ.oligarchs.map((o) => (
              <div
                key={o.id}
                className="border border-[#0d1f0d] bg-[#030603] p-1.5 flex justify-between items-center rounded text-[11px]"
              >
                <div>
                  <div className="font-bold text-shadow-sm text-[#00e5ff]">{o.name}</div>
                  <div className="text-[8px] text-gray-500 uppercase">
                    NET WORTH: ${o.wealthB}B | sector: {o.sector}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col items-end mr-1.5 font-mono text-[9px]">
                    <span className="text-gray-500 uppercase">LOYALTY:</span>
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
  );
}
