import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { audio } from '../../utils/audio';

export default function SpacePanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const currentTick = useWorldStore((s) => s.currentTick);
  const country = countries[countryId];

  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine);
  
  const [selectOrbit, setSelectOrbit] = useState<'LEO' | 'POLAR' | 'GEO'>('LEO');
  const [selectType, setSelectType] = useState<'RECON_SAT' | 'COMMS_SAT' | 'GPS_SAT' | 'KILL_SAT'>('RECON_SAT');

  if (!country) return null;

  const satellites = country.intelligence.satellites || [];

  const handleLaunchSat = () => {
    const cost = selectOrbit === 'GEO' ? 8.0 : selectOrbit === 'POLAR' ? 4.0 : 2.0;
    if (country.economic.treasuryCashB < cost) {
      pushTerminalLine(`CRITICAL: INSUFFICIENT TREASURY FUNDS TO LAUNCH OBITAL SATELLITE. REQUIRES $${cost}B.`, 'CRITICAL');
      audio.sfxKeyClick();
      return;
    }

    // Deduct and launch
    useWorldStore.getState().applyTickDelta((draft) => {
      const c = draft.countries[countryId];
      if (c) {
        c.economic.treasuryCashB -= cost;
        c.intelligence.satellites.push({
          id: `${countryId}_sat_${Math.floor(Math.random() * 900) + 100}`,
          orbitType: selectOrbit as any,
          coverageCountryIds: [countryId],
          reconQuality: 85,
          isCompromised: false,
          launchCostB: cost
        });
      }
    });

    audio.sfxMissileLaunch();
    pushTerminalLine(`SPACE DEPLOYMENT: Successfully launched ${selectType} into ${selectOrbit} orbit. Cost: $${cost}B.`, 'INFO');
  };

  const handleDecommission = (satId: string) => {
    audio.sfxSatDestroy();
    useWorldStore.getState().applyTickDelta((draft) => {
      const c = draft.countries[countryId];
      if (c) {
        c.intelligence.satellites = c.intelligence.satellites.filter((s) => s.id !== satId);
      }
    });
    pushTerminalLine(`ORBITAL SERVICE: Decommissioned asset [${satId}] completely.`, 'WARNING');
  };

  return (
    <PanelFxShell panelId="haarp" relevantFxTypes={['HAARP_ACTIVATED','NUCLEAR_DETONATION']}>
      <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-[#1a5c1a] pb-2">
        <span className="text-xs uppercase font-bold text-[#00ff44] tracking-wider font-display">
          📡 Space Operations & Early Warning Matrix (F7)
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          ORBITAL POSITIONING: LOCK GRID
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orbital Constellation SVG Drawing */}
        <div className="border border-[#1a5c1a] bg-[#030603] p-4 flex flex-col items-center">
          <span className="text-[9px] font-mono text-gray-400 uppercase mb-3 text-center">
            ACTIVE SOVEREIGN CONSTELLATION RADAR MAP
          </span>

          <svg className="w-48 h-48" viewBox="0 0 200 200">
            {/* Earth core */}
            <circle cx="100" cy="100" r="30" fill="#041204" stroke="#00ff44" strokeWidth="1" />
            <text x="100" y="103" fill="#00ff44" fontSize="8" textAnchor="middle" fontFamily="monospace">EARTH</text>

            {/* LEO Circle */}
            <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(0,255,100,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
            <text x="100" y="47" fill="rgba(0,255,100,0.4)" fontSize="6" textAnchor="middle" fontFamily="monospace">LEO</text>

            {/* MEO Circle */}
            <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x="100" y="27" fill="rgba(0,229,255,0.4)" fontSize="6" textAnchor="middle" fontFamily="monospace">MEO</text>

            {/* GEO Circle */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(204,136,255,0.15)" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x="100" y="7" fill="rgba(204,136,255,0.4)" fontSize="6" textAnchor="middle" fontFamily="monospace">GEO</text>

            {/* Satellites drawing orbiting dynamically */}
            {satellites.map((sat, idx) => {
              const ringR = sat.orbitType === 'GEO' ? 90 : sat.orbitType === 'POLAR' ? 70 : 50;
              const angle = (currentTick * 0.15 + idx * 1.5) % (Math.PI * 2);
              const x = 100 + ringR * Math.cos(angle);
              const y = 100 + ringR * Math.sin(angle);

              return (
                <g key={`radar-sat-${sat.id}`}>
                  <circle cx={x} cy={y} r="3" fill="#00ff44" className="animate-pulse" />
                  <line x1="100" y1="100" x2={x} y2={y} stroke="rgba(0,255,100,0.1)" strokeWidth="0.3" />
                </g>
              );
            })}
          </svg>

          <div className="text-[9px] font-mono text-center text-gray-500 mt-2 leading-relaxed">
            ACTIVE ORBITAL ALIGNMENT CHANNELS RE-LERPED LIVE EVERY TICK. LEO SWEEPS AT +4.5°/TICK.
          </div>
        </div>

        {/* Launch panel controls */}
        <div className="border border-[#1a5c1a] bg-[#030603] p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#00e5ff] uppercase block mb-3 border-b border-[#0d2e0d] pb-1">
              🚀 LAUNCH SATELLITE ASSET
            </span>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Target Orbit Zone:</label>
                <div className="flex gap-1">
                  {['LEO', 'POLAR', 'GEO'].map((orb) => (
                    <button
                      key={orb}
                      onClick={() => { audio.sfxKeyClick(); setSelectOrbit(orb as any); }}
                      className={`flex-1 py-1 border text-[9px] font-bold cursor-pointer transition-all rounded ${selectOrbit === orb ? 'border-[#00ff44] text-[#00ff44] bg-[#071407]' : 'border-gray-800 text-gray-500'}`}
                    >
                      {orb} ({orb === 'LEO' ? '$2B' : orb === 'POLAR' ? '$4B' : '$8B'})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Select Asset Module Payload:</label>
                <div className="grid grid-cols-2 gap-1">
                  {['RECON_SAT', 'COMMS_SAT', 'GPS_SAT', 'KILL_SAT'].map((pType) => (
                    <button
                      key={pType}
                      onClick={() => { audio.sfxKeyClick(); setSelectType(pType as any); }}
                      className={`py-1.5 border text-[9px] font-bold cursor-pointer transition-all rounded ${selectType === pType ? 'border-[#00ff44] text-[#00ff44] bg-[#071407]' : 'border-gray-800 text-gray-500'}`}
                    >
                      {pType.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLaunchSat}
            className="w-full py-2 border border-[#00ff44] bg-transparent hover:bg-[#00ff44]/15 text-[10px] font-bold uppercase cursor-pointer rounded mt-3"
          >
            CONFIRM LAUNCH DIRECTIVE
          </button>
        </div>
      </div>

      {/* Orbit List */}
      <div className="border border-[#1a5c1a] bg-[#030603] p-4">
        <span className="text-[10px] font-bold text-[#00e5ff] uppercase block mb-3 border-b border-[#0d2e0d] pb-1">
          📁 SYSTEM SATELLITE REGISTRY ({satellites.length} ACTIVE ASSETS)
        </span>

        {satellites.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-600">
            NO SATELLITE CONSTELLATIONS RECORDED ON SYSTEM. ORBIT OVERWATCH: DORMANT.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px] space-y-1">
              <thead>
                <tr className="border-b border-[#0d2e0d] text-gray-500">
                  <th className="pb-1 uppercase">ASSET ID</th>
                  <th className="pb-1 uppercase">TYPE</th>
                  <th className="pb-1 uppercase">ORBITAL TYPE</th>
                  <th className="pb-1 uppercase">RECON QUALITY</th>
                  <th className="pb-1 uppercase text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {satellites.map((sat) => (
                  <tr key={sat.id} className="border-b border-[#0d2e0d]/50 hover:bg-[#071407]/40">
                    <td className="py-1.5 text-white font-bold">{sat.id}</td>
                    <td className="py-1.5">RECON RECEIVER</td>
                    <td className="py-1.5 text-cyan-400">{sat.orbitType}</td>
                    <td className="py-1.5 text-green-400">{sat.reconQuality}%</td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={() => handleDecommission(sat.id)}
                        className="px-1.5 py-0.5 border border-red-950 text-red-500 hover:border-red-500 rounded text-[8px] cursor-pointer"
                      >
                        DECOM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PanelFxShell>
  );
}
