import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUnitStore } from '../../store/unitStore';
import { useUIStore } from '../../store/uiStore';
import { getTickIncrement } from '../../sim/militaryEngine';
import { calculateHaversineDistanceKm } from '../../utils/routeMath';
import { WeaponType, CarrierGroupUnit, ICBMSiloUnit, SubmarineUnit, AirWingUnit, SpecForceUnit } from '../../types';
import { audio } from '../../utils/audio';
import AnimatedValue from '../shared/AnimatedValue';
import { useMirrorStore } from '../../store/mirrorStore';
import {
  Anchor,
  Compass,
  Shield,
  Target,
  Activity,
  Navigation,
  Zap,
  Ship,
  Plane,
  Layers,
  Check,
  AlertCircle,
  Crosshair,
  ArrowRight
} from 'lucide-react';

const PREDEFINED_OCEAN_DESTINATIONS = [
  { name: 'North Atlantic Escort Sector B', lat: 38.0, lon: -42.0 },
  { name: 'Western Pacific Strike Sector', lat: 18.0, lon: 130.0 },
  { name: 'Eastern Mediterranean Task Sector', lat: 34.0, lon: 26.0 },
  { name: 'Persian Gulf Access Chokepoint', lat: 26.0, lon: 52.0 },
  { name: 'Sea of Japan High-Threat Guard', lat: 39.0, lon: 133.5 },
  { name: 'Southern Indian Ocean Patrol', lat: -12.0, lon: 74.0 },
  { name: 'North Sea Security Zone Alpha', lat: 56.5, lon: 3.5 }
];

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
  const combatRealism = arsenal.combatRealism;

  const [arsTab, setArsTab] = useState<'UNITS' | 'LOGISTICS'>('UNITS');

  // Unit Store selectors
  const {
    units,
    selectedUnitId,
    selectedUnitTypeTab,
    selectUnit,
    setSelectedUnitTypeTab,
    deployCarrierGroup,
    setStrikeMission
  } = useUnitStore();

  const playerUnits = units.filter((u) => u.owner === countryId);
  const selectedUnit = playerUnits.find((u) => u.id === selectedUnitId);

  // Filter unit list for current tab
  const activeTabUnits = playerUnits.filter((u) => u.type === selectedUnitTypeTab);

  // States for Launch Options
  const [isNukeW, setIsNukeW] = useState(false);
  const [yieldMT, setYieldMT] = useState(1.2);

  // State for chosen carrier deployment option index
  const [carrierDeployIdx, setCarrierDeployIdx] = useState<number>(0);

  // Action: Launch strike from chosen Silo
  const handleLaunchSiloStrike = (siloId: string) => {
    audio.sfxKeyClick();

    if (!targetId) {
      useUIStore.getState().pushAlert({
        title: 'LAUNCH LOCK LOCKED',
        message: 'Launch failed: No tactical coordinates are locked on the strategic targeted node. Use map select or target selection list.',
        type: 'DANGER'
      });
      return;
    }

    if (targetId === countryId) {
      useUIStore.getState().pushAlert({
        title: 'SELF-TARGET AUTO-OVERRIDE',
        message: 'Launch failed: Safety overrides triggered. Weapon coordinates resolved to home sovereign capital nodes.',
        type: 'DANGER'
      });
      return;
    }

    const silo = playerUnits.find((u) => u.id === siloId) as ICBMSiloUnit | undefined;
    if (!silo || silo.missileReadiness < 100) {
      useUIStore.getState().pushAlert({
        title: 'SILO COOLING RECHARGE',
        message: 'Launch aborted: ICBM launching system requires thermal recharge and reload protocols (readiness must be 100%).',
        type: 'DANGER'
      });
      return;
    }

    // Launch confirmed! Play launch sfx
    audio.sfxMissileLaunch();

    // Compute Bezier and launch tick parameters based on real coords
    const targetCountry = countries[targetId];
    const tx = targetCountry ? getCentroidLon(targetId) : 400;
    const ty = targetCountry ? getCentroidLat(targetId) : 200;
    const sx = silo.position.lon;
    const sy = silo.position.lat;

    // Mapping ICBM speed
    const tickDist = 8; // ICBM flies fast

    useWorldStore.getState().applyTickDelta((draft) => {
      draft.activeStrikes.push({
        id: `strike_${Math.random().toString().substring(2, 8)}`,
        sourceCountryId: countryId,
        targetCountryId: targetId,
        weaponType: 'ICBM',
        warheadYieldMT: isNukeW ? yieldMT : undefined,
        progressPct: 0,
        status: 'IN_FLIGHT',
        bezier: {
          startX: sx,
          startY: sy,
          controlX: (sx + tx) / 2,
          controlY: Math.min(sy, ty) - 15,
          endX: tx,
          endY: ty,
        },
        launchTick: currentTick,
        impactTick: currentTick + tickDist,
        isRetaliatory: false,
        interceptAttempted: false,
      });

      // Maintain legacy compatibility by deducting arsenal stockpile counts
      const lWeapon = draft.countries[countryId].arsenal.units.find((u) => u.type === 'ICBM');
      if (lWeapon && lWeapon.count > 0) {
        lWeapon.count--;
        lWeapon.operational = lWeapon.count;
      }
    });

    // Record Military player action for Mirror Adaptation
    useMirrorStore.getState().recordPlayerAction('MILITARY', 25, currentTick);

    // Update specific silo state
    setStrikeMission(siloId, targetCountry.name, ty, tx, targetId);

    // Global announce
    useWorldStore.getState().addGlobalEvent(
      `WAR ROOM: Silo Group [${silo.name}] launched direct-impact ${isNukeW ? 'THERMONUCLEAR' : 'KINETIC'} payload targeting coords on Capital of ${targetId}.`,
      'CRITICAL'
    );

    useUIStore.getState().pushAlert({
      title: 'SILO DISPATCH SUCCESSFUL',
      message: `Strategic silo Group "${silo.name}" has dispatched payload. Nuclear payload intercept attempted near terminal layer. ETA: ${tickDist} ticks.`,
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
      title: 'FUNDS COMMITTED: ARSENAL HIGH propellants REFILLED',
      message: 'Propellant re-injected across all strategic weapon structures. Arsenal capacity is fully operational.',
      type: 'INFO'
    });
  };

  function getCentroidLon(cid: string): number {
    return cid === 'US' ? -95.7 : cid === 'CN' ? 104.2 : cid === 'RU' ? 105.3 : 15.0;
  }
  function getCentroidLat(cid: string): number {
    return cid === 'US' ? 37.0 : cid === 'CN' ? 35.9 : cid === 'RU' ? 61.5 : 45.0;
  }

  // Count player units per type
  const counts = {
    CarrierGroup: playerUnits.filter((u) => u.type === 'CarrierGroup').length,
    Submarine: playerUnits.filter((u) => u.type === 'Submarine').length,
    ICBMSilo: playerUnits.filter((u) => u.type === 'ICBMSilo').length,
    AirWing: playerUnits.filter((u) => u.type === 'AirWing').length,
    SpecForce: playerUnits.filter((u) => u.type === 'SpecForce').length,
  };

  return (
    <PanelFxShell panelId="strategic_arsenal" relevantFxTypes={['NUCLEAR_DETONATION','MISSILE_LAUNCH','DEFCON_ESCALATION','NUCLEAR_DETERRENCE_ACHIEVED']}>
      <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Subtab selection */}
      <div className="flex border-b border-[#162a16] pb-2 mb-1 gap-2">
        <button
          onClick={() => { audio.sfxKeyClick(); setArsTab('UNITS'); }}
          id="tab-unit-command"
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer ${
            arsTab === 'UNITS' ? 'bg-[#143c14] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          💻 TACTICAL UNIT COMMAND
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setArsTab('LOGISTICS'); }}
          id="tab-military-logistics"
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer ${
            arsTab === 'LOGISTICS' ? 'bg-[#143c14] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🗃️ EXPEDITIONARY LOGISTICS
        </button>
      </div>

      {arsTab === 'UNITS' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Column 1 & 2: Unit Register list */}
          <div className="md:col-span-2 flex flex-col gap-3">
            
            {/* System select inner pills */}
            <div className="grid grid-cols-5 gap-1 border-b border-[#132813] pb-2">
              {[
                { type: 'CarrierGroup' as const, label: 'Carrier', icon: Ship, qty: counts.CarrierGroup },
                { type: 'Submarine' as const, label: 'Sub', icon: Compass, qty: counts.Submarine },
                { type: 'ICBMSilo' as const, label: 'Silo', icon: Target, qty: counts.ICBMSilo },
                { type: 'AirWing' as const, label: 'Wing', icon: Plane, qty: counts.AirWing },
                { type: 'SpecForce' as const, label: 'Spec', icon: Shield, qty: counts.SpecForce },
              ].map((pill) => {
                const Icon = pill.icon;
                const isActive = selectedUnitTypeTab === pill.type;
                return (
                  <button
                    key={pill.type}
                    onClick={() => { audio.sfxKeyClick(); setSelectedUnitTypeTab(pill.type); }}
                    className={`flex flex-col items-center justify-center py-2 border rounded text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#00ff44] bg-[#0c250c] text-[#00ff44]'
                        : 'border-[#132213] bg-black/40 text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-0.5" />
                    <span className="text-[7.5px] uppercase font-bold font-mono">{pill.label}</span>
                    <span className="text-[9px] font-black">{pill.qty}</span>
                  </button>
                );
              })}
            </div>

            {/* List scrollable box */}
            <div className="flex flex-col gap-1.5 border border-[#132a13] bg-black/80 rounded p-2 overflow-y-auto max-h-[300px] scrollbar-thin">
              <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-widest block mb-1">
                REGISTERED {selectedUnitTypeTab.toUpperCase()} UNITS
              </span>

              {activeTabUnits.length === 0 ? (
                <div className="text-gray-600 italic text-[9.5px] text-center py-4">No active assets classified.</div>
              ) : (
                activeTabUnits.map((u) => {
                  const isSelected = u.id === selectedUnitId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => { audio.sfxKeyClick(); selectUnit(u.id); }}
                      className={`w-full text-left p-2 border rounded flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00ff44] bg-[#0c200c]'
                          : 'border-[#0f1d0f]/50 bg-[#020402]/90 hover:bg-[#071307]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold uppercase text-[10.5px] text-[#00e5ff] truncate max-w-[150px]">
                          {u.name}
                        </div>
                        <div className="flex gap-2 text-[8px] text-gray-500 uppercase font-mono">
                          <span>SYS: {u.status}</span>
                          <span>HP: {u.health}%</span>
                          {u.type === 'ICBMSilo' && (
                            <span className="text-[#ff3838]">MT: {(u as ICBMSiloUnit).missileReadiness}%</span>
                          )}
                          {u.eta && <span className="text-amber-500">ETA: {u.eta}T</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {u.status === 'MOVING' && (
                          <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />
                        )}
                        {u.status === 'DEPLOYED' && (
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                        )}
                        {u.status === 'IDLE' && (
                          <span className="flex h-2 w-2 rounded-full bg-gray-500" />
                        )}
                        {isSelected && <ArrowRight className="h-3 w-3 text-[#00ff44]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* General Auxiliary stockpile stats for backward consistency */}
            <div className="border border-[#142614] bg-[#020502]/60 rounded p-2 space-y-1.5">
              <span className="text-[7.5px] text-gray-400 font-bold uppercase tracking-widest block">AUXILIARY STORES</span>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                {arsenal.units
                  .filter((u) => u.type !== 'ICBM' && u.type !== 'CARRIER_GROUP')
                  .slice(0, 4)
                  .map((u) => (
                    <div key={u.type} className="flex justify-between border-b border-[#0f1d0f]/50 pb-0.5 font-mono">
                      <span className="text-gray-500 uppercase truncate max-w-[80px]">{u.type.replace('_', ' ')}</span>
                      <span className="text-white font-bold">{u.count}</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          {/* Column 3, 4 & 5: Detailed command action desk */}
          <div className="md:col-span-3 flex flex-col gap-3">
            {selectedUnit ? (
              <div className="combat-panel flex-1 border border-[#00ff44]/35 bg-[#030603] p-4 rounded relative overflow-hidden flex flex-col gap-3 shadow-md">
                <div className="absolute top-0 right-0 h-1 bg-[#00ff44] w-full" />
                
                {/* Header */}
                <div className="border-b border-[#1a3a1a] pb-2 flex justify-between items-start">
                  <div>
                    <span className="text-[8px] bg-[#102d10] text-[#00ff44] border border-[#00ff44]/30 font-bold uppercase px-1 rounded">
                      {selectedUnit.type.toUpperCase()}
                    </span>
                    <h3 className="font-extrabold text-[12px] uppercase text-white mt-1 leading-normal font-mono">
                      {selectedUnit.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[8.5px] text-gray-500 uppercase tracking-wide block">HEALTH INTEGRITY</span>
                    <span className={`font-black text-[13px] ${selectedUnit.health > 50 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedUnit.health}%
                    </span>
                  </div>
                </div>

                {/* Grid positions & metrics */}
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono border-b border-[#142c14] pb-3">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">HOMELAND LOCK:</span>
                      <span className="text-white font-bold uppercase">{selectedUnit.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">COORDINATES:</span>
                      <span className="text-[#00e2ff] font-semibold">
                        {selectedUnit.position.lat.toFixed(2)}N, {selectedUnit.position.lon.toFixed(2)}E
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">OPERATING STATUS:</span>
                      <span className="text-[#00ff44] font-black uppercase text-[9.5px] tracking-wide">{selectedUnit.status}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-gray-500">UNIT PROPELLANT:</span>
                      <span className={`font-bold ${selectedUnit.fuel < 35 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>{selectedUnit.fuel}%</span>
                    </div>
                    {selectedUnit.type === 'CarrierGroup' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">EMBARKED WINGS:</span>
                        <span className="text-white">{(selectedUnit as CarrierGroupUnit).embarkedAirWings} Squadrons</span>
                      </div>
                    )}
                    {selectedUnit.type === 'ICBMSilo' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">LAUNCH RECHARGE:</span>
                        <span className="text-[#ff4444] font-extrabold">{(selectedUnit as ICBMSiloUnit).missileReadiness}% ready</span>
                      </div>
                    )}
                    {selectedUnit.type === 'Submarine' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">STEALTH EMISSION:</span>
                        <span className="text-purple-400">{(selectedUnit as SubmarineUnit).stealthProfile}% reduction</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Operations Form according to Unit Type */}
                
                {/* 1. CARRIER OCEAN DEPLOYMENT FLOW */}
                {selectedUnit.type === 'CarrierGroup' && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-gray-400 block mb-1">
                        OCEAN COMMAND TRANSIT PORT
                      </span>
                      <div className="flex justify-between items-center gap-2">
                        <select
                          value={carrierDeployIdx}
                          onChange={(e) => { audio.sfxKeyClick(); setCarrierDeployIdx(parseInt(e.target.value)); }}
                          className="bg-black border border-[#163a16] text-[#00ff44] outline-none text-[10px] p-1.5 font-mono uppercase rounded flex-1 cursor-pointer"
                        >
                          {PREDEFINED_OCEAN_DESTINATIONS.map((dest, idx) => {
                            const dKm = calculateHaversineDistanceKm(
                              selectedUnit.position.lat,
                              selectedUnit.position.lon,
                              dest.lat,
                              dest.lon
                            );
                            const travelTicks = Math.max(3, Math.min(15, Math.round(dKm / 1000)));
                            return (
                              <option key={dest.name} value={idx}>
                                {dest.name} (~{travelTicks} ticks, {Math.round(dKm)}km)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedUnit.status === 'MOVING' && selectedUnit.route && (
                        <div className="mt-2 border border-amber-950 bg-amber-950/20 p-2 rounded text-[9.5px] leading-normal space-y-1">
                          <div className="flex justify-between text-amber-500 font-bold">
                            <span>TRANSIT PLOTTED IN PROGESS</span>
                            <span>ETA {selectedUnit.eta} TICKS</span>
                          </div>
                          <div className="text-gray-400">
                            Navigating geodesic track from [{selectedUnit.route.source.lat.toFixed(1)}, {selectedUnit.route.source.lon.toFixed(1)}] to [{selectedUnit.route.destination.lat.toFixed(1)}, {selectedUnit.route.destination.lon.toFixed(1)}]
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const targetDest = PREDEFINED_OCEAN_DESTINATIONS[carrierDeployIdx];
                        if (targetDest) {
                          deployCarrierGroup(selectedUnit.id, targetDest.lat, targetDest.lon, targetDest.name);
                          audio.sfxKlaxon();
                        }
                      }}
                      className="w-full py-2 bg-[#0c250c] border border-green-500 text-green-400 font-bold rounded uppercase hover:bg-[#1a4a1a] shadow-[0_0_10px_rgba(34,197,94,0.15)] flex justify-center items-center gap-1 cursor-pointer transition-all active:translate-y-0.5"
                    >
                      <Navigation className="h-3 w-3" /> Mobilize Carrier Group Deployment
                    </button>
                  </div>
                )}

                {/* 2. ICBM SILO LAUNCH FLOW */}
                {selectedUnit.type === 'ICBMSilo' && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <div className="border border-red-950/40 bg-[#140204]/60 p-2.5 rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#ff3838] font-bold text-[8.5px] uppercase">STRATEGIC WARHEAD SELECTOR</span>
                        {isNukeW && (
                          <span className="text-red-500 animate-pulse text-[8px] font-black border border-red-500 px-1 bg-red-950/40">NUCLEAR ARMED</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="siloAuthNuke"
                          checked={isNukeW}
                          onChange={(e) => { audio.sfxKeyClick(); setIsNukeW(e.target.checked); }}
                          className="accent-[#ff2244] h-3.5 w-3.5 rounded bg-black cursor-pointer"
                        />
                        <label htmlFor="siloAuthNuke" className="text-[#ff2244] font-black text-[8.5px] cursor-pointer tracking-wider select-none">
                          AUTHORIZE SYSTEM THERMONUCLEAR WARHEAD
                        </label>
                      </div>

                      {isNukeW && (
                        <div className="flex flex-col gap-1 border-t border-red-950/50 pt-2 text-[10px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-red-500 font-bold uppercase text-[8.5px]">BLAST DISPOSAL MULTIPLIER:</span>
                            <span className="text-[#ff2244] font-extrabold font-mono bg-red-950/25 px-1">{yieldMT} Megatons</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="8.0"
                            step="0.2"
                            value={yieldMT}
                            onChange={(e) => setYieldMT(parseFloat(e.target.value))}
                            className="w-full accent-[#ff2244] cursor-pointer h-1.5 bg-red-950/40 rounded"
                          />
                        </div>
                      )}
                    </div>

                    {!targetId ? (
                      <div className="border border-red-950/60 bg-[#160205] p-2 rounded text-[8.5px] text-[#ff3355] flex gap-2 items-center leading-normal animate-pulse">
                        <span>☢️</span>
                        <span>TARGET REGISTER EMPTY: Lock target coordinates on Map first to deploy Silo weapon payload.</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[9px] text-gray-400">
                        <span>LOCKED STRATEGIC NODE:</span>
                        <span className="text-[#ff3c3c] font-bold uppercase">{countries[targetId]?.name} ({targetId})</span>
                      </div>
                    )}

                    <button
                      disabled={!targetId || (selectedUnit as ICBMSiloUnit).missileReadiness < 100}
                      onClick={() => handleLaunchSiloStrike(selectedUnit.id)}
                      className={`w-full py-2 flex justify-center items-center font-bold tracking-widest uppercase rounded cursor-pointer transition-all relative group ${
                        !targetId || (selectedUnit as ICBMSiloUnit).missileReadiness < 100
                          ? 'bg-gray-800 border-gray-900 border text-gray-500 select-none cursor-not-allowed opacity-50'
                          : isNukeW
                          ? 'bg-[#3b020c] border-2 border-[#ff2244] text-[#ff2244] hover:bg-[#600112] animate-pulse font-black shadow-[0_0_15px_rgba(255,34,68,0.25)]'
                          : 'bg-[#b88200]/15 border border-[#ffb300] text-[#ffb300] hover:bg-[#ffb300]/30 font-extrabold shadow-[0_0_10px_rgba(255,179,0,0.15)]'
                      }`}
                    >
                      {isNukeW ? '☄️ DIRECT NUCLEAR STRIKE DISPATCH' : '🚀 DISPATCH KINETIC DEFENSE PAYLOAD'}
                    </button>
                  </div>
                )}

                {/* 3. SUBMARINE, AIRWING, SPECFORCE EXPOSITIONS */}
                {selectedUnit.type !== 'CarrierGroup' && selectedUnit.type !== 'ICBMSilo' && (
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-[10px] text-gray-500 leading-normal border border-[#142a14] bg-[#020402]/80 p-2.5 rounded">
                      {selectedUnit.type === 'Submarine' && 'Submarines operate silently in deep-sea sectors. Stealth level affects defensive sonar evasion parameters.'}
                      {selectedUnit.type === 'AirWing' && 'Sorities operate out of military bases. Combat range restricts strike capability to immediate regional neighbors.'}
                      {selectedUnit.type === 'SpecForce' && 'Sovereign commandos perform underground sabotage. Deployable on map and cyber-breach interfaces.'}
                    </p>

                    <button
                      onClick={() => {
                        audio.sfxKeyClick();
                        useWorldStore.getState().addGlobalEvent(`MILITARY HQ: Refortified patrol patterns for ${selectedUnit.name}.`, 'INFO');
                      }}
                      className="w-full py-2 bg-black border border-gray-700 text-gray-400 font-bold rounded uppercase hover:text-white hover:bg-white/5 flex justify-center items-center gap-1 cursor-pointer"
                    >
                      Refortify Sentinel Guard
                    </button>
                  </div>
                )}

                {/* Transaction activity logs */}
                <div className="border border-[#142614] bg-black/50 rounded p-2 text-[8 px]">
                  <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                    RECENT DISPATCH LOGS
                  </span>
                  <div className="max-h-[50px] overflow-y-auto space-y-1 font-mono pr-1 scrollbar-thin">
                    {selectedUnit.recentActivity && selectedUnit.recentActivity.length > 0 ? (
                      selectedUnit.recentActivity.map((log, idx) => (
                        <div key={idx} className="text-gray-400 text-[8px] leading-tight border-b border-[#0f1d0f]/30 pb-0.5">
                          - {log}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-600 italic">No historical activities dispatched.</span>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="border border-dashed border-[#143c14] bg-black/40 rounded p-12 text-center flex flex-col justify-center items-center h-full min-h-[250px]">
                <Layers className="h-8 w-8 text-[#1a5a1a] mb-2 animate-pulse" />
                <h4 className="text-gray-400 uppercase font-extrabold text-[10px] tracking-widest">TACTICAL DETAILS REGISTER</h4>
                <p className="text-[9.5px] text-gray-600 max-w-[200px] mt-1.5 leading-normal">
                  Select a registered tactical fleet, sub base, Command specforce, or ready ICBM silo node from the list ledger to decode satellite transmissions and map coordinates.
                </p>
              </div>
            )}
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
                Box INDUSTRIAL SUPPLY CHAIN FLOW
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
    </PanelFxShell>
  );
}
