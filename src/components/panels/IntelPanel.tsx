import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { CovertOpType } from '../../types';

export default function IntelPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono">Error: Player Country not loaded.</div>;

  const intel = playerCountry.intelligence;
  const spyAssets = intel.spyAssets || [];

  const [intelTab, setIntelTab] = useState<'OPS' | 'ASSETS'>('OPS');
  const [opType, setOpType] = useState<CovertOpType>('PLANT_PROPAGANDA');

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
      alert('Espionage alert: Domestic targeting restricted.');
      return;
    }

    const spec = opSpecs[opType];
    if (intel.blackBudgetB < spec.costB) {
      alert(`Espionage alert: Slush finance insufficient. Op requires $${spec.costB}B.`);
      return;
    }

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

    useWorldStore.getState().addGlobalEvent(`COVERT SECTOR: Logged operative vectors against ${selectedTargetId}.`, 'WARNING');
  };

  const handleFundBlackSlush = () => {
    const transferAmtB = 3.0;
    if (playerCountry.economic.treasuryCashB < transferAmtB) {
      alert('Debit warning: Allocation exceeds current treasury cash reserves.');
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= transferAmtB;
      draft.intelligence.blackBudgetB += transferAmtB;
    });

    useWorldStore.getState().addGlobalEvent(`Signals desk: Transferred $${transferAmtB}B from treasury to black operations budget.`, 'INFO');
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3">
      {/* Subtab selection info */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => setIntelTab('OPS')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            intelTab === 'OPS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          🕵️ COVERT OPERATIONS
        </button>
        <button
          onClick={() => setIntelTab('ASSETS')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            intelTab === 'ASSETS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          📁 SIGINT & CLANDESTINE ASSETS
        </button>
      </div>

      {intelTab === 'OPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                ACTIVE ESPIONAGE VECTORS LOG
              </h3>

              <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                {intel.activeCovertOps.length === 0 ? (
                  <p className="text-gray-600 italic py-2">No active clandestine Ops tracking inside foreign firewalls.</p>
                ) : (
                  intel.activeCovertOps.map((op) => {
                    const spec = opSpecs[op.type];
                    return (
                      <div
                        key={op.id}
                        className="border border-[#0d1f0d] bg-[#030503] p-1.5 rounded flex justify-between items-center text-[10px] font-mono"
                      >
                        <div>
                          <div className="font-bold text-[#00e5ff]">{spec?.name || op.type}</div>
                          <div className="text-[8px] text-gray-500 uppercase">
                            TARGET: {op.targetCountryId} | REMAINING: {op.remainingTicks} TICKS
                          </div>
                        </div>
                        <span className="text-[#00ff44] font-bold py-0.5 px-1.5 bg-[#1a4a1a] uppercase text-[9px] rounded">
                          {Math.round(((op.ticksToComplete - op.remainingTicks) / op.ticksToComplete) * 100)}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="combat-panel flex justify-between items-center h-20">
              <div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Covert Slush Reserves</div>
                <div className="text-lg font-bold text-[#00ff44]">${intel.blackBudgetB.toFixed(1)}B</div>
              </div>
              <button
                onClick={handleFundBlackSlush}
                className="px-3 py-1.5 bg-[#002f3c] border border-[#00e5ff] text-[#00e5ff] rounded hover:bg-[#00475b] font-bold uppercase text-[9px] cursor-pointer"
              >
                Divert $3.0B Cash
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2.5">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ffb300]">
                ESPIONAGE DIRECTIVES LAUNCHER
              </h3>

              <div className="space-y-2 uppercase text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span>Target Coordinates:</span>
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

                <div className="border border-[#1a3a1a] bg-black p-2 rounded text-[9.5px] lowercase text-gray-500 leading-normal font-sans">
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
                  DEPLOY ESPIONAGE DIRECTIVE (cost: ${opSpecs[opType].costB}B)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {intelTab === 'ASSETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Spy Assets table */}
          <div className="combat-panel flex flex-col gap-3">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
              🕵️ ACTIVE HUMINT CLANDESTINE ASSETS
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal mb-2">
              Human intelligence networks operating on foreign soils. Clandestine agents feed intercept intelligence and confirm projectile directions, but risk being exposed or converted to double agents by hostile firewalls.
            </p>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto">
              {spyAssets.length === 0 ? (
                <p className="text-gray-600 italic">No human assets currently deployed abroad.</p>
              ) : (
                spyAssets.map((spy) => (
                  <div key={spy.id} className="border border-[#183618] bg-[#020502] p-2.5 rounded font-mono text-[10px] space-y-1.5">
                    <div className="flex justify-between items-center border-b border-[#0d1f0d] pb-1">
                      <span className="font-bold text-[#00e5ff]">{spy.alias}</span>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border ${
                        spy.status === 'ACTIVE'
                          ? 'bg-[#0b280d] border-[#1b6b21] text-[#00ff44]'
                          : spy.status === 'EXPOSED'
                          ? 'bg-[#3b0b0d] border-[#8b1b21] text-[#ff2244]'
                          : 'bg-yellow-950/40 border-yellow-800 text-yellow-400'
                      }`}>
                        {spy.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400">
                      <div>TARGET REGION: <span className="text-white font-bold">{spy.targetCountryId}</span></div>
                      <div>COMPETENCE: <span className="text-white font-bold">{spy.competence}%</span></div>
                      <div className="col-span-2">TICKS COMPLETED ACTIVE: <span className="text-white font-bold">{spy.ticksActive} cycles</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Intel accuracy score */}
            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                💾 SIGINT COGNITIVE METRICS
              </h3>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">INTEL REPORT CONFIDENCE:</span>
                  <span className="font-bold text-[#00ff44] text-xs">
                    {playerCountry.intelligence.intelReportConfidence ?? 95}% ACCURATE
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">SIGNAL INTERCEPT SCORE:</span>
                  <span className="font-bold text-[#00e5ff]">
                    {playerCountry.intelligence.signalIntelScore} dB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-mono">CYBER FIREWALL SHIELD:</span>
                  <span className="font-bold text-white">
                    LEVEL {playerCountry.intelligence.cyberFirewallLevel} ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Orbit diagnostics */}
            <div className="combat-panel flex-1 flex flex-col justify-center">
              <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">Orbital recon satellites:</span>
              <div className="text-[10px] font-mono leading-relaxed text-gray-450 uppercase space-y-1">
                <div>🛰️ ACTIVE IMAGING SENSORS: 9</div>
                <div>📡 BANDWIDTH FEED SPEED: 480 GBPS</div>
                <div>📡 CORRELATION COVERAGE: NOMINAL</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
