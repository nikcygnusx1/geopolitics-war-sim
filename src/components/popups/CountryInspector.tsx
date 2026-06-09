import React from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import HexGauge from '../shared/HexGauge';

export default function CountryInspector() {
  const inspectorId = useUIStore((s) => s.countryInspectorId);
  const setCountryInspector = useUIStore((s) => s.setCountryInspector);

  const countries = useWorldStore((s) => s.countries);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);
  const playerCountryId = usePlayerStore((s) => s.countryId);

  if (!inspectorId) return null;

  const targetCountry = countries[inspectorId];
  if (!targetCountry) return null;

  const pol = targetCountry.political;
  const econ = targetCountry.economic;
  const arsenal = targetCountry.arsenal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#030603] border-2 border-[#1a3a1a] shadow-xl shadow-green-950/20 p-5 rounded relative font-mono text-xs text-[#00ff44]">
        {/* Top header */}
        <div className="flex justify-between items-center border-b border-[#1a3a1a] pb-2 mb-4 uppercase">
          <div className="flex items-center gap-2">
            <span className="text-xl">{targetCountry.flagEmoji}</span>
            <div>
              <h2 className="text-sm font-bold text-phosphor-green text-shadow-sm leading-none">
                {targetCountry.name} Dossier
              </h2>
              <span className="text-[10px] text-gray-500 font-semibold tracking-wider">
                ISO TARGET NODES: {inspectorId} | alignment: {targetCountry.allianceBlock}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCountryInspector(null)}
            className="px-3 py-1 bg-red-950 text-red-500 border border-red-900 rounded font-bold hover:bg-red-900/45 cursor-pointer select-none text-[10px]"
          >
            [CLOSE WINDOW]
          </button>
        </div>

        {/* Content body divided into columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Col 1: political stability + gauges */}
          <div className="space-y-4">
            <div className="combat-panel flex justify-around items-center h-24">
              <HexGauge label="Popular Unrest" value={pol.popularUnrest} color={pol.popularUnrest > 60 ? 'red' : 'amber'} size={52} />
              <HexGauge label="State Stability" value={pol.stabilityIndex} color={pol.stabilityIndex < 40 ? 'red' : 'green'} size={52} />
              <HexGauge label="Gov Approval" value={pol.leaderApprovalRating} color={pol.leaderApprovalRating < 40 ? 'amber' : 'green'} size={52} />
            </div>

            {/* Political Factions list */}
            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 text-[10px] text-phosphor-amber">
                DOMESTIC POLITICAL FACTIONS
              </h3>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {pol.factions.map((f) => {
                  const hasLowSat = f.demandsMetScore < 35;
                  const isPowerH = f.strengthIndex > 45;

                  return (
                    <div
                      key={f.type}
                      className="border border-[#0d1f0d] bg-black/40 p-1.5 rounded flex justify-between items-center text-[10px]"
                    >
                      <div>
                        <div className="font-bold text-[#00e5ff] uppercase">{f.type}</div>
                        <div className="text-[8px] text-gray-500 uppercase">
                          influence power weight: {Math.round(f.strengthIndex)}%
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <span className="text-[9px] text-gray-500">SATISFACTION:</span>
                        <span className={hasLowSat ? 'text-phosphor-red font-bold' : 'text-phosphor-green'}>
                          {Math.round(f.demandsMetScore)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Col 2: Economics and Military */}
          <div className="space-y-4">
            {/* Economic details */}
            <div className="combat-panel flex flex-col gap-1.5">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 text-[10px] text-phosphor-cyan">
                MACRO FISCAL TELEMETRY
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase">
                <div>GDP Core Size: <span className="text-[#00ff44] font-bold">${econ.gdpB.toFixed(1)}B</span></div>
                <div>Treasury reserves: <span className="text-[#00ff44] font-bold">${econ.treasuryCashB.toFixed(1)}B</span></div>
                <div>Debt-to-GDP: <span className="text-[#00ff44]">{econ.debtToGdpRatio}%</span></div>
                <div>Inflation Velocity: <span className={econ.inflationRate > 15 ? 'text-phosphor-red' : 'text-phosphor-amber'}>{econ.inflationRate.toFixed(1)}%</span></div>
                <div>Interest Index: <span className="text-phosphor-cyan">{econ.interestRate}%</span></div>
                <div>Currency Strength: <span className="text-[#00ff44]">{econ.currencyStrength} VAL</span></div>
              </div>
            </div>

            {/* Military holdings */}
            <div className="combat-panel flex flex-col gap-1.5">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 text-[10px] text-phosphor-red">
                MILITARY POWER MATRIX
              </h3>
              <div className="space-y-1 text-[10px] uppercase">
                <div className="flex justify-between">
                  <span>Aggregate Power Rating:</span>
                  <span className="font-bold text-phosphor-amber">{arsenal.totalPowerRating} VAL</span>
                </div>
                <div className="flex justify-between">
                  <span>Weapons stockpile types count:</span>
                  <span>{arsenal.units.length} ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>Nuclear deterrent silos:</span>
                  <span className={arsenal.units.some(u => (u.type === 'ICBM' || u.type === 'SLBM') && u.count > 0) ? 'text-phosphor-red font-bold animate-pulse' : 'text-gray-500'}>
                    {arsenal.units.some(u => (u.type === 'ICBM' || u.type === 'SLBM') && u.count > 0) ? 'YES — THERMONUCLEAR ARMED' : 'NO — CONVENTIONAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Diplomacy opinion with us */}
            <div className="combat-panel flex justify-between items-center py-2 h-16">
              <div className="font-mono uppercase text-[9px]">
                Bilateral opinion of Player ({playerCountryId}):
                <div className="text-[12px] font-bold text-phosphor-green text-shadow uppercase mt-0.5">
                  {targetCountry.opinions[playerCountryId] != null ? `${Math.round(targetCountry.opinions[playerCountryId])}%` : '50% (NOMINAL)'}
                </div>
              </div>

              {inspectorId !== playerCountryId && (
                <button
                  onClick={() => {
                    setTargetCountry(inspectorId);
                    setCountryInspector(null);
                  }}
                  className="px-3 py-1.5 border border-amber-500 text-phosphor-amber hover:bg-[#1d1400] font-bold uppercase rounded text-[10px] cursor-pointer"
                >
                  🔒 LOCK TARGET IN ARSENAL
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
