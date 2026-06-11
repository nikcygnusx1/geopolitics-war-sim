import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { CovertOpType } from '../../types';
import { audio } from '../../utils/audio';
import { useUIStore } from '../../store/uiStore';

export default function IntelPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Player Country not loaded.</div>;

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
      success: 80,
      blowback: 15,
      ticks: 7,
      costB: 1.2,
      desc: 'Infiltrate voter tallies to set favorable regime alignments.',
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
      desc: 'Stoke local separatist movements to spark popular unrest spikes.',
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
    audio.sfxKeyClick();

    if (!selectedTargetId) {
      useUIStore.getState().pushAlert({
        title: 'TACTICAL DRIFT WARNING',
        message: 'Espionage alert: No target country locked in tactical aperture. Link targeted foreign node on orbital directory.',
        type: 'WARNING'
      });
      return;
    }

    if (selectedTargetId === countryId) {
      useUIStore.getState().pushAlert({
        title: 'DOMESTIC ESPIONAGE BLOCKED',
        message: 'Espionage alert: Domestic active operations restricted. Local signal desks already enforce supreme internal quarantine.',
        type: 'WARNING'
      });
      return;
    }

    const spec = opSpecs[opType];
    if (intel.blackBudgetB < spec.costB) {
      useUIStore.getState().pushAlert({
        title: 'COVERT RESERVES LOW',
        message: `Espionage alert: Slush finance insufficient. Direct espionage directive "${spec.name}" requires $${spec.costB}B.`,
        type: 'DANGER'
      });
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
    
    useUIStore.getState().pushAlert({
      title: 'Espionage Directive DEPLOYED',
      message: `Clandestine agents dispatched for "${spec.name}" inside target [${selectedTargetId}] sector firewalls. Probe triggers initialized.`,
      type: 'INFO'
    });
  };

  const handleFundBlackSlush = () => {
    audio.sfxKeyClick();
    const transferAmtB = 3.0;
    if (playerCountry.economic.treasuryCashB < transferAmtB) {
      useUIStore.getState().pushAlert({
        title: 'ALLOCATION DENIED',
        message: 'Debit warning: Covert allocation exceeds current treasury cash reserves. Liquid assets deficient.',
        type: 'DANGER'
      });
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= transferAmtB;
      draft.intelligence.blackBudgetB += transferAmtB;
    });

    useWorldStore.getState().addGlobalEvent(`Signals desk: Transferred $${transferAmtB}B from treasury to black operations budget.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'COVERT FUNDS REFILLED',
      message: `Asset routing successfully processed. Routed $${transferAmtB}B sovereign funds into clandestine operations accounts.`,
      type: 'INFO'
    });
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Subtab selection info */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => { audio.sfxKeyClick(); setIntelTab('OPS'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            intelTab === 'OPS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🕵️ COVERT OPERATIONS
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setIntelTab('ASSETS'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            intelTab === 'ASSETS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          📁 SIGINT & CLANDESTINE ASSETS
        </button>
      </div>

      {intelTab === 'OPS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase text-[#00ff44] text-[10px]/1">
                ACTIVE ESPIONAGE VECTORS LOG
              </h3>

              <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1 scrollbar-thin">
                {intel.activeCovertOps.length === 0 ? (
                  <p className="text-gray-600 italic py-2 leading-relaxed text-[10px]/1">No active clandestine Ops tracking inside foreign firewalls.</p>
                ) : (
                  intel.activeCovertOps.map((op) => {
                    const spec = opSpecs[op.type];
                    return (
                      <div
                        key={op.id}
                        className="border border-[#0d1f0d] bg-[#030503] p-2 rounded flex justify-between items-center text-[10px] hover:bg-[#071307]"
                      >
                        <div className="font-mono">
                          <div className="font-bold text-[#00e5ff] text-[9.5px] uppercase">{spec?.name || op.type}</div>
                          <div className="text-[8px] text-gray-500 uppercase">
                            TARGET: <span className="text-white font-bold">{op.targetCountryId}</span> | REMAINING: <span className="text-white font-bold">{op.remainingTicks} TICKS</span>
                          </div>
                        </div>
                        <span className="text-[#00ff44] font-black py-0.5 px-1.5 bg-[#1a4a1a] uppercase text-[9px] rounded font-mono">
                          {Math.round(((op.ticksToComplete - op.remainingTicks) / op.ticksToComplete) * 100)}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="combat-panel flex justify-between items-center h-[72px] border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-sm">
              <div>
                <div className="text-[8.5px] text-gray-500 uppercase tracking-wider font-bold">Covert Slush Reserves</div>
                <div className="text-base font-black text-[#00ff44]">${intel.blackBudgetB.toFixed(1)}B</div>
              </div>
              <button
                onClick={handleFundBlackSlush}
                className="px-3 py-1.5 bg-[#002f3c] border border-[#00e5ff] text-[#00e5ff] rounded hover:bg-[#00475b] font-bold uppercase text-[9px] cursor-pointer transition-all active:translate-y-0.5"
              >
                Divert $3.0B Cash
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2.5 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-md relative">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase text-[#ffb300] text-[10px]/1">
                ESPIONAGE DIRECTIVES LAUNCHER
              </h3>

              <div className="space-y-3.5 uppercase text-[10.5px] text-gray-405 font-mono">
                <div className="flex justify-between items-center bg-[#071407]/30 p-2 border border-[#113211]/50 rounded">
                  <span className="text-gray-400 font-bold">Target Coordinates:</span>
                  <select
                    value={selectedTargetId || ''}
                    onChange={(e) => { audio.sfxKeyClick(); setTargetCountry(e.target.value || null); }}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded w-[150px] cursor-pointer"
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

                <div className="flex justify-between items-center bg-[#071407]/30 p-2 border border-[#113211]/50 rounded">
                  <span className="text-gray-400 font-bold">Espionage Directive:</span>
                  <select
                    value={opType}
                    onChange={(e) => { audio.sfxKeyClick(); setOpType(e.target.value as CovertOpType); }}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[10px] p-1 font-mono uppercase rounded w-[150px] cursor-pointer"
                  >
                    {Object.keys(opSpecs).map((key) => (
                      <option key={key} value={key}>
                        {opSpecs[key as CovertOpType].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-[#1a2d1a] bg-black/60 p-2.5 rounded text-[10px] lowercase text-gray-400 leading-relaxed font-sans normal-case relative">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#00ff44] block mb-1">PROBE PROTOCOL PARAMETERS:</span>
                  {opSpecs[opType].desc}
                </div>

                <button
                  onClick={handleLaunchCovertOp}
                  disabled={!selectedTargetId}
                  className={`w-full py-2 border font-extrabold uppercase text-[10px] tracking-widest rounded cursor-pointer transition-all active:translate-y-0.5 ${
                    !selectedTargetId
                      ? 'bg-gray-850 border-gray-900 border text-gray-500 opacity-50 cursor-not-allowed select-none'
                      : 'bg-[#ffb300]/15 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/30 shadow-[0_0_10px_rgba(255,179,0,0.15)] animate-pulse'
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
          <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]">
              🕵️ ACTIVE HUMINT CLANDESTINE ASSETS
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal mb-2">
              Human intelligence networks operating on foreign soils. Clandestine agents feed intercept intelligence and confirm projectile directions, but risk being exposed or converted to double agents by hostile firewalls.
            </p>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin">
              {spyAssets.length === 0 ? (
                <p className="text-gray-600 italic leading-normal">No human assets currently deployed abroad.</p>
              ) : (
                spyAssets.map((spy) => (
                  <div key={spy.id} className="border border-[#183618] bg-[#020502] p-2.5 rounded font-mono text-[10px] space-y-1.5 hover:bg-[#061206] transition-colors">
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

                    <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-400 uppercase font-mono">
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
            <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]">
                💾 SIGINT COGNITIVE METRICS
              </h3>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-[#0f240f] pb-1.5">
                  <span className="text-gray-500 font-bold">INTEL REPORT CONFIDENCE:</span>
                  <span className="font-black text-[#00ff44] text-[12px]">
                    {playerCountry.intelligence.intelReportConfidence ?? 95}% ACCURATE
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#0f240f] pb-1.5">
                  <span className="text-gray-500 font-bold">SIGNAL INTERCEPT SCORE:</span>
                  <span className="font-black text-[#00e5ff] text-[11px]">
                    {playerCountry.intelligence.signalIntelScore} dB
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#0f240f] pb-1.5">
                  <span className="text-gray-500 font-bold">CYBER FIREWALL SHIELD:</span>
                  <span className="font-bold text-white text-[11px]">
                    LEVEL {playerCountry.intelligence.cyberFirewallLevel} ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Orbit diagnostics */}
            <div className="combat-panel flex-1 flex flex-col justify-center border border-[#1a3a1a] bg-[#030503] p-4 rounded">
              <span className="text-[9px] text-gray-500 uppercase font-mono font-bold mb-1">Orbital recon satellites telemetry:</span>
              <div className="text-[10px] font-mono leading-relaxed text-gray-400 uppercase space-y-1">
                <div>🛰️ ACTIVE IMAGING SENSORS: 9 ARRAY NODES</div>
                <div>📡 BANDWIDTH FEED SPEED: 480 GBPS REAL-TIME</div>
                <div>📡 CORRELATION COVERAGE: NOMINAL SWEEPS</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
