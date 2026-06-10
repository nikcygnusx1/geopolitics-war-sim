import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { getTickIncrement } from '../../sim/militaryEngine';
import { WeaponType, WeaponUnit } from '../../types';

export default function ArsenalPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const targetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const currentTick = useWorldStore((s) => s.currentTick);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Country data not loaded.</div>;

  const arsenal = playerCountry.arsenal;
  const personnel = arsenal.personnel;
  const logistics = arsenal.logistics;
  const readiness = arsenal.readiness;
  const combatRealism = arsenal.combatRealism;

  const [arsTab, setArsTab] = useState<'STOCKPILE' | 'LOGISTICS'>('STOCKPILE');

  // Selected launcher weapon controls
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('CRUISE_MISSILE');
  const [isNukeW, setIsNukeW] = useState(false);
  const [yieldMT, setYieldMT] = useState(1.2);

  const handleLaunchStrike = () => {
    if (!targetId) {
      alert('Launch failed: No coordinates locked on strategic target country node.');
      return;
    }

    if (targetId === countryId) {
      alert('Launch failed: Coordinates resolved to home country coordinates.');
      return;
    }

    const currentWeapon = arsenal.units.find((u) => u.type === selectedWeapon);
    if (!currentWeapon || currentWeapon.count <= 0) {
      alert(`Launch aborted: Zero operational inventory of "${selectedWeapon}" available.`);
      return;
    }

    if (currentWeapon.fuelLevel < 20) {
      alert(`Launch aborted: Insufficient weapon fuel reserves (${currentWeapon.fuelLevel}%).`);
      return;
    }

    // Launch confirmed! Deduct inventory
    updateCountry(countryId, (draft) => {
      const u = draft.arsenal.units.find((unit) => unit.type === selectedWeapon);
      if (u) {
        u.count--;
        u.operational = u.count;
      }
    });

    // Compute Bezier and launch tick parameters
    const scGeo = GEO_COORDS[countryId];
    const tgGeo = GEO_COORDS[targetId];
    const sx = scGeo ? scGeo.cx : 500;
    const sy = scGeo ? scGeo.cy : 250;
    const tx = tgGeo ? tgGeo.cx : 400;
    const ty = tgGeo ? tgGeo.cy : 200;

    const tickDist = Math.max(8, Math.round(100 / getTickIncrement(selectedWeapon)));

    useWorldStore.getState().applyTickDelta((draft) => {
      draft.activeStrikes.push({
        id: `strike_${Math.random().toString().substring(2,8)}`,
        sourceCountryId: countryId,
        targetCountryId: targetId,
        weaponType: selectedWeapon,
        warheadYieldMT: isNukeW ? yieldMT : undefined,
        progressPct: 0,
        status: 'IN_FLIGHT',
        bezier: {
          startX: sx,
          startY: sy,
          controlX: (sx + tx) / 2,
          controlY: Math.min(sy, ty) - 150,
          endX: tx,
          endY: ty,
        },
        launchTick: currentTick,
        impactTick: currentTick + tickDist,
        isRetaliatory: false,
        interceptAttempted: false,
      });
    });

    useWorldStore.getState().addGlobalEvent(`WAR CLERK: Fired 1x ${selectedWeapon} targeting ${targetId}.`, 'CRITICAL');
  };

  const handleRefuelArsenal = () => {
    const costB = 2.0;
    if (playerCountry.economic.treasuryCashB < costB) {
      alert('Financial bounds: Refuelling budget exceeds total treasury liquidity.');
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= costB;
      draft.arsenal.units.forEach((unit) => {
        unit.fuelLevel = 100;
      });
    });

    useWorldStore.getState().addGlobalEvent(`Logistics desk: Propellent supply re-injected.`, 'INFO');
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3">
      {/* Subtab selection */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => setArsTab('STOCKPILE')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            arsTab === 'STOCKPILE' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          🚀 ORDNANCE STOCKPILE
        </button>
        <button
          onClick={() => setArsTab('LOGISTICS')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            arsTab === 'LOGISTICS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          🪖 EXPEDITIONARY LOGISTICS
        </button>
      </div>

      {arsTab === 'STOCKPILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                WEAPONS STOCKPILE DIRECTORY
              </h3>

              <div className="space-y-1 overflow-y-auto max-h-[180px] pr-1">
                {arsenal.units.map((unit) => {
                  const isDepleted = unit.count === 0;
                  const hasLowProp = unit.fuelLevel < 35;

                  return (
                    <div
                      key={unit.type}
                      className="border border-[#0d1f0d] bg-[#030503] p-1.5 rounded flex justify-between items-center text-[10px]"
                    >
                      <div className="font-mono">
                        <div className="font-bold uppercase text-[#00e5ff]">{unit.type.replace('_', ' ')}</div>
                        <div className="text-[8px] text-gray-500 uppercase">
                          READY QTY: {unit.operational} units | rating: {Math.round(unit.combatPowerRating)} power
                        </div>
                      </div>

                      <div className="text-right font-mono flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-gray-500">PROPELLANT</span>
                          <span className={hasLowProp ? 'text-[#ff2244] font-bold' : 'text-green-500'}>
                            {unit.fuelLevel}%
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-gray-500">QUANTITY</span>
                          <span className={`text-[12px] font-bold ${isDepleted ? 'text-gray-600' : 'text-[#00ff44]'}`}>
                            {unit.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={handleRefuelArsenal}
                  className="px-3 py-1 bg-[#1a4a1a] border border-[#2aff4a] text-[#00ff44] rounded hover:bg-[#205b20] font-bold uppercase text-[9px] cursor-pointer"
                >
                  REFUEL MISSILES ($2.0B)
                </button>
              </div>
            </div>

            <div className="combat-panel flex justify-around items-center h-20">
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">Arsenal Readiness</div>
                <div className="text-lg font-bold text-[#00ff44]">{Math.round(arsenal.readinessLevel)}%</div>
              </div>
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-wider">ABM Air Cover Shield</div>
                <div className="text-lg font-bold text-[#00e5ff]">{playerCountry.arsenal.abmShieldStrength}%</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ff2244]">
                LAUNCH CONTROL SYSTEM
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span>TARGET LOCKS:</span>
                  <select
                    value={targetId || ''}
                    onChange={(e) => setTargetCountry(e.target.value || null)}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded"
                  >
                    <option value="">-- COORDINATES DRIFT --</option>
                    {Object.keys(countries).map((id) => (
                      <option key={id} value={id}>
                        {id} - {countries[id].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span>LAUNCH VEHICLE:</span>
                  <select
                    value={selectedWeapon}
                    onChange={(e) => {
                      setSelectedWeapon(e.target.value as WeaponType);
                      if (e.target.value !== 'ICBM' && e.target.value !== 'SLBM') setIsNukeW(false);
                    }}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[10px] p-1 font-mono uppercase rounded"
                  >
                    {arsenal.units.map((u) => (
                      <option key={u.type} value={u.type}>
                        {u.type.replace('_', ' ')} (qty: {u.count})
                      </option>
                    ))}
                  </select>
                </div>

                {(selectedWeapon === 'ICBM' || selectedWeapon === 'SLBM') && (
                  <div className="border border-red-950 p-2 rounded bg-red-950/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="authNuke"
                        checked={isNukeW}
                        onChange={(e) => setIsNukeW(e.target.checked)}
                        className="accent-[#ff2244] h-3 w-3 rounded bg-black cursor-pointer"
                      />
                      <label htmlFor="authNuke" className="text-[#ff2244] font-bold text-[10px] cursor-pointer">
                        AUTHORIZE NUCLEAR STRATEGIC LAUNCHPAYLOAD
                      </label>
                    </div>

                    {isNukeW && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-red-500">WARHEAD YIELD:</span>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="range"
                            min="0.2"
                            max="8.0"
                            step="0.2"
                            value={yieldMT}
                            onChange={(e) => setYieldMT(parseFloat(e.target.value))}
                            className="w-24 accent-[#ff2244]"
                          />
                          <span className="text-[#ff2244] font-bold font-mono">{yieldMT} MT</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLaunchStrike}
                  disabled={!targetId}
                  className={`w-full py-2.5 font-bold uppercase rounded cursor-pointer transition-all ${
                    !targetId
                      ? 'bg-gray-800 border-gray-900 border text-gray-400 select-none'
                      : isNukeW
                      ? 'bg-[#40000a] border border-[#ff2244] text-[#ff2244] hover:bg-[#60000e]'
                      : 'bg-[#ffb300]/15 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/30'
                  }`}
                >
                  {isNukeW ? '⚡ DEDEPLOY THERMONUCLEAR RESPONSE' : '🚀 DISPATCH ACTIVE ORDNANCE'}
                </button>
              </div>
            </div>

            <div className="combat-panel flex-1 flex flex-col gap-1.5 min-h-[90px]">
              <span className="text-[9px] uppercase tracking-wider text-gray-500">LAUNCH RADAR COMPACT BOARD:</span>
              <div className="overflow-y-auto max-h-[70px] space-y-1 font-mono text-[9px]">
                {activeStrikes.length === 0 ? (
                  <p className="text-gray-600 italic">No rocket patterns detected inside radar perimeter.</p>
                ) : (
                  activeStrikes.map((s) => {
                    const isUsTarget = s.targetCountryId === countryId;
                    const trackerColor = isUsTarget ? 'text-[#ff2244]' : 'text-gray-400';

                    return (
                      <div key={s.id} className="border-b border-[#0f240f] pb-1 flex justify-between items-center">
                        <span className={trackerColor}>
                          {s.weaponType}: {s.sourceCountryId} &rarr; {s.targetCountryId}
                        </span>
                        <span className="font-bold">
                          {s.status === 'IN_FLIGHT' ? `ETA: ${s.impactTick - currentTick} ticks (${Math.round(s.progressPct)}%)` : s.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {arsTab === 'LOGISTICS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personnel forces breakdown */}
          <div className="combat-panel flex flex-col gap-3">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
              🎖️ DIVISIONAL TROOPS & PERSONNEL
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal mb-2">
              Sovereign standing armies and reserves. In active war, reserves are mobilized to active standing lines. Special forces drive precision operations and satellite penetrations.
            </p>

            <div className="space-y-3 font-mono">
              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-200">ACTIVE FOOT SOLDIERS:</span>
                  <span className="text-[#00ff44]">{personnel?.activeTroops || 250}k Troops</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">Primary frontline defense and territorial containment lines.</p>
              </div>

              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-200">RESERVIST UNITS:</span>
                  <span className="text-amber-500">{personnel?.reserveTroops || 120}k Troops</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">Civil defenders mobilized when sovereign boundaries are declared at war.</p>
              </div>

              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-200">ELITE SPECIAL SECTOR SEALS:</span>
                  <span className="text-[#00e5ff]">{personnel?.specialForces || 15}k Special Forces</span>
                </div>
                <p className="text-[9px] text-gray-500 mt-0.5">Precision infiltration, intelligence recovery, and abm radar security.</p>
              </div>
            </div>
          </div>

          {/* Physical logistics indicators */}
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                📦 SUPPLY DEPOSITS & EQUIPMENT LOGISTICS
              </h3>
              <p className="text-[10px] text-gray-500 leading-normal">
                FRONT LINE COMBAT SUPPLY LEVELS (Depletes per tick under warfare states):
              </p>

              <div className="space-y-2">
                {[
                  { id: 'ammunition', label: '⚔️ Ready Munitions', val: logistics?.ammunition || 95 },
                  { id: 'fuel', label: '⛽ Transport Propellant Fuels', val: logistics?.fuel || 90 },
                  { id: 'spareParts', label: '⚙️ Tactical Machinery Spare Parts', val: logistics?.spareParts || 85 }
                ].map((log) => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-gray-400">{log.label}</span>
                      <span className="font-bold text-white">{log.val}%</span>
                    </div>
                    <div className="w-full bg-black/40 h-1 rounded border border-[#1d4d1d] overflow-hidden">
                      <div className="bg-[#00ff44] h-full" style={{ width: `${log.val}%` }} />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-[10.5px] border-t border-[#0d210d] pt-2 font-mono">
                  <span className="text-gray-500 uppercase">DEPOT NETWORKS:</span>
                  <span className="text-white font-bold">{logistics?.supplyDepots || 15} fortified locations</span>
                </div>
              </div>
            </div>

            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ff2244]">
                💥 REALISTIC COMBAT ATTRITION INDEX
              </h3>
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">DIVISION ATTRITION:</span>
                  <span className="text-[#ff2244] font-bold">{combatRealism?.attrition || 0}% casualties</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SUPPLY LINE CAPACITY:</span>
                  <span className="text-green-500 font-bold">{combatRealism?.supplyLineStatus || 100}% connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">OCCUPATION BURDEN RATE:</span>
                  <span className="text-[#ffb300] font-bold">${combatRealism?.occupationCosts || 0}B /tick</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
