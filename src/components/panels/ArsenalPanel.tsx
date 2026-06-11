import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { GEO_COORDS } from '../../data/geoCoords';
import { getTickIncrement } from '../../sim/militaryEngine';
import { WeaponType, WeaponUnit } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';

export default function ArsenalPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const targetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const activeStrikes = useWorldStore((s) => s.activeStrikes);
  const currentTick = useWorldStore((s) => s.currentTick);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Country data not loaded.</div>;

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
    audio.sfxKeyClick();

    if (!targetId) {
      useUIStore.getState().pushAlert({
        title: 'LAUNCH LOCK PAUSED',
        message: 'Launch failed: No tactical coordinates are locked on the strategic targeted node. Use map select or target selection list.',
        type: 'DANGER'
      });
      return;
    }

    if (targetId === countryId) {
      useUIStore.getState().pushAlert({
        title: 'SELF-TARGET DIRECTIVE BLOCKED',
        message: 'Launch failed: Safety overrides triggered. Weapon coordinates resolved to home sovereign capital nodes.',
        type: 'DANGER'
      });
      return;
    }

    const currentWeapon = arsenal.units.find((u) => u.type === selectedWeapon);
    if (!currentWeapon || currentWeapon.count <= 0) {
      useUIStore.getState().pushAlert({
        title: 'ORDNANCE EXHAUSTED',
        message: `Launch aborted: Zero operational inventory of "${selectedWeapon.replace('_', ' ')}" remains in weapons bunker.`,
        type: 'DANGER'
      });
      return;
    }

    if (currentWeapon.fuelLevel < 20) {
      useUIStore.getState().pushAlert({
        title: 'PROPELLANT COLD STACK',
        message: `Launch aborted: Insufficient weapon propellant energy (${currentWeapon.fuelLevel}% / 20% minimum). Initiate refuelling protocol.`,
        type: 'DANGER'
      });
      return;
    }

    // Launch confirmed! Play sfx
    audio.sfxMissileLaunch();

    // Deduct inventory
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
        id: `strike_${Math.random().toString().substring(2, 8)}`,
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

    useWorldStore.getState().addGlobalEvent(`WAR CLERK: Fired 1x ${selectedWeapon.replace('_', ' ')} targeting ${targetId}.`, 'CRITICAL');
    
    useUIStore.getState().pushAlert({
      title: 'CRITICAL PAYLOAD DISPATCHED',
      message: `1x Operational "${selectedWeapon.replace('_', ' ')}" has launched out of silo bays, locked on target registry coordinates: [${targetId}]. ETA: ${tickDist} ticks.`,
      type: 'WARNING'
    });
  };

  const handleRefuelArsenal = () => {
    audio.sfxKeyClick();
    const costB = 2.0;
    if (playerCountry.economic.treasuryCashB < costB) {
      useUIStore.getState().pushAlert({
        title: 'REFUELLING ASSETS DENIED',
        message: 'Financial bounds: Propellant replenishment budgets exceed cash reserves available in sovereign vaults.',
        type: 'DANGER'
      });
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB -= costB;
      draft.arsenal.units.forEach((unit) => {
        unit.fuelLevel = 100;
      });
    });

    useWorldStore.getState().addGlobalEvent(`Logistics desk: Propellent supply re-injected.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'FLEET FUEL FULLY CHARGED',
      message: 'Propellant re-injected across all strategic weapon structures. Arsenal capacity is fully operational.',
      type: 'INFO'
    });
  };

  return (
    <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Subtab selection */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => { audio.sfxKeyClick(); setArsTab('STOCKPILE'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            arsTab === 'STOCKPILE' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🚀 ORDNANCE STOCKPILE
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setArsTab('LOGISTICS'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-colors cursor-pointer ${
            arsTab === 'LOGISTICS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🪖 EXPEDITIONARY LOGISTICS
        </button>
      </div>

      {arsTab === 'STOCKPILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
              <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-1.5 mb-1">
                <h3 className="font-bold uppercase tracking-wider text-[#00ff44] text-[10px]">
                  ORDNANCE DEPOT INVENTORY
                </h3>
                <span className="text-[8px] bg-[#142814] px-1 border border-[#1a4a1a] text-[#00ff44] font-bold">
                  SENSORS NOMINAL
                </span>
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[180px] pr-1 scrollbar-thin">
                {arsenal.units.map((unit) => {
                  const isDepleted = unit.count === 0;
                  const hasLowProp = unit.fuelLevel < 35;

                  return (
                    <div
                      key={unit.type}
                      className={`border p-2 rounded flex justify-between items-center text-[10px] transition-all ${
                        isDepleted ? 'border-red-950 bg-[#0e0204]/40 opacity-60' : 'border-[#0d1f0d] bg-[#020402] hover:bg-[#071307]'
                      }`}
                    >
                      <div className="font-mono">
                        <div className="font-bold uppercase text-[#00e5ff]">{unit.type.replace('_', ' ')}</div>
                        <div className="text-[8px] text-gray-500 uppercase">
                          DEPLOYABLE: <span className="text-white font-semibold">{unit.operational} units</span> | Rating: <span className="text-white">{Math.round(unit.combatPowerRating)} rating</span>
                        </div>
                      </div>

                      <div className="text-right font-mono flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[7.5px] text-gray-500 uppercase">PROPELLANT</span>
                          <span className={`font-bold ${hasLowProp ? 'text-[#ff2244] animate-pulse' : 'text-green-500'}`}>
                            {unit.fuelLevel}%
                          </span>
                        </div>

                        <div className="flex flex-col items-end min-w-[50px]">
                          <span className="text-[7.5px] text-gray-500 uppercase">QUANTITY</span>
                          <span className={`text-[12px] font-black ${isDepleted ? 'text-red-500' : 'text-[#00ff44]'}`}>
                            {unit.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t border-[#1a3a1a] pt-2 mt-1">
                <span className="text-[8px] text-gray-500 leading-normal uppercase">
                  Re-fueling injects maximum propellant across all silos.
                </span>
                <button
                  onClick={handleRefuelArsenal}
                  className="px-3 py-1.5 bg-[#102a10] border border-[#2aff44] text-[#00ff44] rounded hover:bg-[#1a401a] font-bold uppercase text-[9px] cursor-pointer transition-all active:translate-y-0.5"
                >
                  REFUEL ALL MISSILES ($2.0B)
                </button>
              </div>
            </div>

            <div className="combat-panel flex justify-around items-center h-[72px] border border-[#1a4a1a] bg-[#030603] rounded p-2">
              <div className="text-center font-mono">
                <div className="text-[8px] text-gray-400 uppercase tracking-wider">Arsenal Readiness</div>
                <div className="text-base font-extrabold text-[#00ff44]">{Math.round(arsenal.readinessLevel)}%</div>
              </div>
              <div className="h-6 w-[1px] bg-[#1a4a1a]" />
              <div className="text-center font-mono">
                <div className="text-[8px] text-gray-400 uppercase tracking-wider">Intercept Anti-Air Cover</div>
                <div className="text-base font-extrabold text-[#00e5ff]">{playerCountry.arsenal.abmShieldStrength}%</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3 border border-[#ff3355]/40 bg-[#030503] p-4 rounded shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 bg-[#ff2244] h-full" />
              <h3 className="font-bold border-b border-[#301015] pb-1.5 uppercase tracking-wider text-[#ff2244] text-[10px] flex justify-between items-center">
                <span>LAUNCH COMMAND PANEL</span>
                {isNukeW && <span className="text-red-500 animate-pulse text-[8px] font-black border border-red-500 px-1 bg-red-950/40">NUCLEAR ARMED</span>}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">TARGET SELECT REGISTRY:</span>
                  <select
                    value={targetId || ''}
                    onChange={(e) => { audio.sfxKeyClick(); setTargetCountry(e.target.value || null); }}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded w-[150px] cursor-pointer"
                  >
                    <option value="">-- DRIFT OFF-LOCK --</option>
                    {Object.keys(countries).map((id) => (
                      <option key={id} value={id}>
                        {id} - {countries[id].name}
                      </option>
                    ))}
                  </select>
                </div>

                {!targetId && (
                  <div className="border border-red-950/60 bg-[#160205] p-2 rounded text-[9px] text-[#ff3355] flex gap-2 items-center leading-normal animate-pulse">
                    <span>☢️</span>
                    <span>COORDINATES OFF-LOCK: Link satellite radar coordinates from world list to initialize weapons launch payload.</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-gray-400">SELECT Silo PAYLOAD:</span>
                  <select
                    value={selectedWeapon}
                    onChange={(e) => {
                      audio.sfxKeyClick();
                      setSelectedWeapon(e.target.value as WeaponType);
                      if (e.target.value !== 'ICBM' && e.target.value !== 'SLBM') setIsNukeW(false);
                    }}
                    className="bg-[#030503] border border-[#1a3a1a] text-[#00ff44] outline-none text-[10px] p-1 font-mono uppercase rounded w-[150px] cursor-pointer"
                  >
                    {arsenal.units.map((u) => (
                      <option key={u.type} value={u.type}>
                        {u.type.replace('_', ' ')} (qty: {u.count})
                      </option>
                    ))}
                  </select>
                </div>

                {(selectedWeapon === 'ICBM' || selectedWeapon === 'SLBM') && (
                  <div className="border border-red-950 p-2.5 rounded bg-[#100103] space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="authNuke"
                        checked={isNukeW}
                        onChange={(e) => { audio.sfxKeyClick(); setIsNukeW(e.target.checked); }}
                        className="accent-[#ff2244] h-3.5 w-3.5 rounded bg-black cursor-pointer"
                      />
                      <label htmlFor="authNuke" className="text-[#ff2244] font-black text-[9px] cursor-pointer tracking-wider select-none">
                        AUTHORIZE SYSTEM THERMONUCLEAR WARHEAD
                      </label>
                    </div>

                    {isNukeW && (
                      <div className="flex flex-col gap-1 border-t border-red-950/50 pt-2 text-[10px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-red-500 font-bold uppercase">Blast Yield Metric:</span>
                          <span className="text-[#ff2244] font-extrabold font-mono bg-red-950/25 px-1">{yieldMT} MT megatons</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="8.0"
                          step="0.2"
                          value={yieldMT}
                          onChange={(e) => setYieldMT(parseFloat(e.target.value))}
                          className="w-full accent-[#ff2244] cursor-pointer h-1 bg-red-950/40 rounded"
                        />
                        <span className="text-[7.5px] text-gray-500 uppercase leading-none mt-1">
                          Warning: yields exceeding 4.0MT ignite total global threat level and crash international credit.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleLaunchStrike}
                  className={`w-full py-2 flex justify-center items-center font-bold tracking-widest uppercase rounded cursor-pointer transition-all ${
                    !targetId
                      ? 'bg-gray-800 border-gray-900 border text-gray-500 select-none cursor-not-allowed opacity-50'
                      : isNukeW
                      ? 'bg-[#3b020c] border-2 border-[#ff2244] text-[#ff2244] hover:bg-[#600112] animate-pulse font-black shadow-[0_0_15px_rgba(255,34,68,0.25)]'
                      : 'bg-[#b88200]/15 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/30 font-extrabold shadow-[0_0_10px_rgba(255,179,0,0.15)]'
                  }`}
                >
                  {isNukeW ? '⚡ DEPLOY THERMONUCLEAR STRIKE' : '🚀 DISPATCH ACTIVE MISSILE'}
                </button>
              </div>
            </div>

            <div className="combat-panel flex-1 flex flex-col gap-1.5 min-h-[90px] border border-[#1a3a1a] bg-[#030503] p-3 rounded">
              <span className="text-[8px] uppercase tracking-wider text-gray-400 font-bold">
                LAUNCH RADAR TELEMETRY SCANNER:
              </span>
              <div className="overflow-y-auto max-h-[70px] space-y-1 font-mono text-[9px] pr-1 scrollbar-thin">
                {activeStrikes.length === 0 ? (
                  <p className="text-gray-600 italic leading-normal">No missile signatures detected inside operational hemisphere.</p>
                ) : (
                  activeStrikes.map((s) => {
                    const isUsTarget = s.targetCountryId === countryId;
                    const trackerColor = isUsTarget ? 'text-[#ff2244] font-bold animate-pulse' : 'text-gray-400';

                    return (
                      <div key={s.id} className="border-b border-[#0f240f] pb-1 flex justify-between items-center text-[8.5px]">
                        <span className={trackerColor}>
                          {s.weaponType}: {s.sourceCountryId} &rarr; {s.targetCountryId}
                          {s.warheadYieldMT ? ` [${s.warheadYieldMT}MT Nuke]` : ''}
                        </span>
                        <span className="font-bold flex items-center gap-1.5 text-white">
                          <span>{s.status === 'IN_FLIGHT' ? `${s.impactTick - currentTick}T` : s.status}</span>
                          <span className="text-[8px] text-gray-500">({Math.round(s.progressPct)}%)</span>
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
          <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]">
              🎖️ ARMED FORCES DIVISION & RESERVES
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal">
              Standing military personnel ready to protect borders. Reserves are mobilized automatically when hostilities are initiated. Elite teams support strategic penetration parameters.
            </p>

            <div className="space-y-2.5 font-mono">
              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded flex flex-col gap-0.5 whitespace-nowrap">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-gray-300">ACTIVE INFANTRY TROOPS:</span>
                  <span className="text-[#00ff44]">{personnel?.activeTroops || 250}k FRONT-LINE</span>
                </div>
                <div className="text-[8px] text-gray-500">CORE DEFENSE CAPABILITY FOR LAND INTRUSION ENGAGEMENTS.</div>
              </div>

              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded flex flex-col gap-0.5 whitespace-nowrap">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-gray-300">DOMESTIC DEFENSE RESERVES:</span>
                  <span className="text-amber-500">{personnel?.reserveTroops || 120}k CIVIL GUARD</span>
                </div>
                <div className="text-[8px] text-gray-500">CIVILIANS TRAINED TO RESPOND IN STATIONS OF DOMESTIC BREACH.</div>
              </div>

              <div className="border border-[#0d1f0d] bg-[#020502] p-2 rounded flex flex-col gap-0.5 whitespace-nowrap">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className="text-gray-300">TACTICAL SPECIAL SERVICES (SEALS):</span>
                  <span className="text-[#00e5ff]">{personnel?.specialForces || 15}k COMMANDOS</span>
                </div>
                <div className="text-[8px] text-gray-500">PRECISION RECONNAISSANCE AND IN-FLIGHT DEACTIVATION SQUADRON.</div>
              </div>
            </div>
          </div>

          {/* Physical logistics indicators */}
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]">
                📦 INDUSTRIAL SUPPLY CHAIN FLOW
              </h3>
              <p className="text-[10px] text-gray-500 leading-normal">
                Front-line ammunition and machinery supply depots (depletes per tactical action and warfare state):
              </p>

              <div className="space-y-2.5">
                {[
                  { id: 'ammunition', label: '⚔️ Ready Munitions Depots', val: logistics?.ammunition || 95 },
                  { id: 'fuel', label: '⛽ Heavy Propellant Fuel Reserve', val: logistics?.fuel || 90 },
                  { id: 'spareParts', label: '⚙️ Tactical Engineering Parts', val: logistics?.spareParts || 85 }
                ].map((log) => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-gray-400 uppercase">{log.label}</span>
                      <span className="font-bold text-white">{log.val}% CAP</span>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded border border-[#1d4d1d] overflow-hidden">
                      <div className="bg-[#00ff44] h-full transition-all" style={{ width: `${log.val}%` }} />
                    </div>
                  </div>
                ))}

                <div className="flex justify-between text-[10px] border-t border-[#0d210d] pt-2 font-mono mt-1">
                  <span className="text-gray-400 uppercase">DEPOT FORTIFICATIONS:</span>
                  <span className="text-white font-black">{logistics?.supplyDepots || 15} METROPOLITAN BASES</span>
                </div>
              </div>
            </div>

            <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs shadow-inner">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ff2244] text-[10px]">
                💥 REAL-TIME STRATEGIC ATTRITION
              </h3>
              <div className="space-y-1.5 font-mono text-[9.5px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">CASUALLY ATTRITION RATE:</span>
                  <span className="text-[#ff2244] font-bold">{combatRealism?.attrition || 0}% personnel/cycle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SUPPLY LINE INTEROPERABILITY:</span>
                  <span className="text-green-500 font-bold">{combatRealism?.supplyLineStatus || 100}% connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ACTIVE MILITARY DEBT MAINTENANCE:</span>
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
