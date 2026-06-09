import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { CovertOpType } from '../../types';

export default function IntelPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Player Country not loaded.</div>;

  const intel = playerCountry.intelligence;

  // Covert Op Form
  const [opType, setOpType] = useState<CovertOpType>('PLANT_PROPAGANDA');

  // Specs
  const opSpecs: Record<CovertOpType, { name: string; costB: number; ticks: number; desc: string; success: number; blowback: number }> = {
    ASSASSINATE_LEADER: {
      name: 'DEEP COVERT LEADERSHIP ASSASSINATION',
      costB: 5.0,
      ticks: 18,
      desc: 'Target high-profile leadership cells to severely collapse target alignment and stability.',
      success: 35,
      blowback: 65,
    },
    DESTABILIZE_FACTION: {
      name: 'POLITICAL FACTION DESTABILIZATION',
      costB: 1.5,
      ticks: 8,
      desc: 'Incite factional riots to decrease governing approval metrics.',
      success: 60,
      blowback: 30,
    },
    HACK_GRID: {
      name: 'CYBER CONTROL SYSTEM HACK',
      costB: 2.0,
      ticks: 10,
      desc: 'Inflict server failures inside defensive ABM tracking networks.',
      success: 75,
      blowback: 20,
    },
    SABOTAGE_OIL: {
      name: 'ENERGY PETROCHEM INFRASTRUCTURE SABOTAGE',
      costB: 2.5,
      ticks: 12,
      desc: 'Inflict pipe leaks to spark global Brent asset spot spikes.',
      success: 65,
      blowback: 40,
    },
    ELECTION_RIG: {
      name: 'DEMOCRATIC ELECTION INTERFERENCE',
      costB: 1.2,
      ticks: 7,
      desc: 'Infiltrate voter tallies to set favorable regime alignments.',
      success: 80,
      blowback: 15,
    },
    PLANT_PROPAGANDA: {
      name: 'COVERT PSYOP INTRUSION LAYERING',
      costB: 1.0,
      ticks: 6,
      desc: 'Filter targeted subversion streams in hostile media channels.',
      success: 85,
      blowback: 10,
    },
    FUND_REBELS: {
      name: 'PARAMILITARY REBEL MILITIA FUNDING',
      costB: 3.0,
      ticks: 14,
      desc: 'Stoke local sep separatism movements to spark popular unrest spikes.',
      success: 50,
      blowback: 50,
    },
    ARMS_SMUGGLE: {
      name: 'CLANDESTINE ARMS DEAL PIPELINE',
      costB: 2.2,
      ticks: 10,
      desc: 'Equip local splinter factions via gray market channels.',
      success: 70,
      blowback: 25,
    },
    FINANCIAL_ATTACK: {
      name: 'FOREIGN EXCHANGE FINANCIAL ASSAULT',
      costB: 4.0,
      ticks: 16,
      desc: 'Manipulate debt margins to collapse sovereign trade scores.',
      success: 45,
      blowback: 45,
    },
  };

  const handleLaunchCovertOp = () => {
    if (!selectedTargetId) {
      alert('Espionage alert: No target country locked in tactical aperture.');
      return;
    }

    if (selectedTargetId === countryId) {
      alert('Espionage alert: Domestic targeting restricted by federal safety boards.');
      return;
    }

    const spec = opSpecs[opType];
    if (intel.blackBudgetB < spec.costB) {
      alert(` Espionage alert: Slush finance insufficient. Hacking requires $${spec.costB}B covert budget.`);
      return;
    }

    // Launch Covert operation
    updateCountry(countryId, (draft) => {
      draft.intelligence.blackBudgetB -= spec.costB;
      draft.intelligence.activeCovertOps.push({
        id: `op_${Math.random().toString().substring(2,6)}`,
        type: opType,
        targetCountryId: selectedTargetId,
        successProbability: spec.success,
        costB: spec.costB,
        ticksToComplete: spec.ticks,
        remainingTicks: spec.ticks,
        status: 'ACTIVE',
        blowbackRisk: spec.blowback,
      });
    });

    useWorldStore.getState().addGlobalEvent(`COVERT SECTOR: Sent elite signal assets against ${selectedTargetId} executing "${opType}". ETA: ${spec.ticks} ticks.`, 'WARNING');
  };

  const handleFundBlackSlush = () => {
    const transferAmtB = 3.0;
    if (playerCountry.economic.treasuryCashB < transferAmtB) {
      alert('Debit warning: Budget allocation exceeds current cash reserves.');
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= transferAmtB;
      draft.intelligence.blackBudgetB += transferAmtB;
    });

    usePlayerStore.setState((state) => ({ cashB: state.cashB - transferAmtB }));
    usePlayerStore.getState().syncCashToCountry();

    useWorldStore.getState().addGlobalEvent(`Signals desk: Diverted $${transferAmtB}B from national cash reserves to covert operations.`, 'INFO');
  };

  return (
    <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Covert Ops ongoing */}
      <div className="flex flex-col gap-4">
        <div className="combat-panel flex flex-col gap-2">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
            ACTIVE ESPIONAGE VECTORS LOGS
          </h3>

          <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
            {intel.activeCovertOps.length === 0 ? (
              <p className="text-gray-600 italic text-[10px] py-2">No active clandestine Ops tracking inside foreign firewalls.</p>
            ) : (
              intel.activeCovertOps.map((op) => {
                const spec = opSpecs[op.type];
                return (
                  <div
                    key={op.id}
                    className="border border-[#0d1f0d] bg-[#030503] p-1.5 rounded flex justify-between items-center text-[10px] font-mono"
                  >
                    <div>
                      <div className="font-bold text-shadow-sm text-[#00e5ff]">{spec?.name || op.type}</div>
                      <div className="text-[8px] text-gray-500 uppercase">
                        TARGET: {op.targetCountryId} | REMAINING: {op.remainingTicks} TICKS
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-[#00ff44] font-bold py-0.5 px-1.5 bg-[#1a4a1a] uppercase text-[9px] rounded">
                        {Math.round(((op.ticksToComplete - op.remainingTicks) / op.ticksToComplete) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Slush fund transfer console */}
        <div className="combat-panel flex justify-between items-center h-20">
          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Espionage Slush Funds</div>
            <div className="text-lg font-bold text-phosphor-green text-shadow">${intel.blackBudgetB.toFixed(1)}B</div>
          </div>
          <button
            onClick={handleFundBlackSlush}
            className="px-3 py-1.5 bg-[#002f3c] border border-[#00e5ff] text-[#00e5ff] rounded hover:bg-[#00475b] font-bold uppercase text-[9px] cursor-pointer"
          >
            Divert $3.0B Cash
          </button>
        </div>
      </div>

      {/* Deploy Espionage operation */}
      <div className="flex flex-col gap-4">
        <div className="combat-panel flex flex-col gap-2.5">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-amber">
            ESPIONAGE DEPLOYMENT CONTROL
          </h3>

          <div className="space-y-2 uppercase text-[11px] font-mono">
            {/* Target LOCK info */}
            <div className="flex justify-between items-center">
              <span>Espionage Target locked:</span>
              <select
                value={selectedTargetId || ''}
                onChange={(e) => setTargetCountry(e.target.value || null)}
                className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded"
              >
                <option value="">-- NO LOCK --</option>
                {Object.keys(countries)
                  .filter((id) => id !== countryId)
                  .map((id) => (
                    <option key={id} value={id}>
                      {id} - {countries[id].name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Select Op type */}
            <div className="flex justify-between items-center">
              <span>espionage directive:</span>
              <select
                value={opType}
                onChange={(e) => setOpType(e.target.value as CovertOpType)}
                className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[10px] p-1 font-mono uppercase rounded"
              >
                {Object.keys(opSpecs).map((key) => (
                  <option key={key} value={key}>
                    {opSpecs[key as CovertOpType].name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description blurb */}
            <div className="border border-[#1a3a1a] bg-black p-2 rounded text-[9px] lowercase text-gray-500 leading-normal font-sans">
              {opSpecs[opType].desc}
            </div>

            <button
              onClick={handleLaunchCovertOp}
              disabled={!selectedTargetId}
              className={`w-full py-2 border font-bold uppercase text-[10px] rounded cursor-pointer transition-all ${
                !selectedTargetId
                  ? 'bg-gray-800 border-gray-900 border text-gray-400 select-none'
                  : 'bg-[#ffb300]/15 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/30'
              }`}
            >
              DEPLOY ESPIONAGE VECTORS (cost: ${opSpecs[opType].costB}B)
            </button>
          </div>
        </div>

        {/* Orbit coordinates */}
        <div className="combat-panel flex-1 flex flex-col justify-center">
          <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">Orbital satellites constellations:</span>
          <div className="text-[10px] font-mono leading-relaxed text-shadow-sm text-gray-400 uppercase">
            🛰️ CONSTELLATION CODENAME: SATELLITES-PALANTIR 9
            <br />
            🌍 COORDINATE ACCURACY LOCK: 99.87% SIGS NOMINAL
          </div>
        </div>
      </div>
    </div>
  );
}
