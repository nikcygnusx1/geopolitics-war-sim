import React from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { RESEARCH_TREES } from '../../constants';
import { ResearchNode } from '../../types';
import { audio } from '../../utils/audio';
import { useUIStore } from '../../store/uiStore';

export default function ResearchPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Player Country not loaded.</div>;

  const unlocked = playerCountry.researchUnlocked;

  const handleUnlockNode = (nodeId: ResearchNode, costB: number) => {
    audio.sfxKeyClick();
    if (usePlayerStore.getState().cashB < costB) {
      useUIStore.getState().pushAlert({
        title: 'FINANCIAL UNLOCKS LOCKED',
        message: `R&D budget warning: Unlocking technology "${nodeId.replace('_', ' ')}" requires $${costB}B in global treasury reserves. Sovereign liquidity low.`,
        type: 'DANGER'
      });
      return;
    }

    // Deduct cash, sync to store
    usePlayerStore.setState((state) => ({ cashB: state.cashB - costB }));
    usePlayerStore.getState().syncCashToCountry();

    updateCountry(countryId, (draft) => {
      draft.researchUnlocked.push(nodeId);
    });

    useWorldStore.getState().addGlobalEvent(`Technology upgrade: Sovereign researchers deployed and unlocked "${nodeId}".`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'TECHNOLOGICAL BREAKTHROUGH',
      message: `Sovereign research staff successfully deployed and completed R&D on node "${nodeId.replace('_', ' ')}"! New capabilities active.`,
      type: 'INFO'
    });
  };

  return (
    <PanelFxShell panelId="research_tech" relevantFxTypes={['CYBER_ATTACK','SANCTIONS_ESCALATION','ALLIANCE_FORMED']}>
      <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
      {/* List of research specs */}
      <div className="combat-panel flex flex-col gap-2.5 col-span-1 md:col-span-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
        <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
          MILITARY FINANCIAL R&amp;D DEFENSE TREE
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
          {RESEARCH_TREES.map((tech) => {
            const isUnlocked = unlocked.includes(tech.id);
            const canAfford = usePlayerStore.getState().cashB >= tech.costB;

            return (
              <div
                key={tech.id}
                className={`border p-3.5 rounded flex flex-col justify-between gap-3.5 transition-all bg-[#030503] uppercase font-mono ${
                  isUnlocked
                    ? 'border-[#00ff44] bg-[#021c02] text-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.15)]'
                    : 'border-[#1a3a1a] hover:border-green-950 text-gray-500'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center font-bold tracking-wide">
                    <span className={isUnlocked ? 'text-[#00ff44] text-shadow-sm text-[10px]' : 'text-[#00e5ff] text-[10px]'}>
                      {tech.name}
                    </span>
                    <span className="text-[8.5px] text-gray-500 font-bold">
                      {isUnlocked ? 'UNLOCKED / ACTIVE' : `LOCKED $${tech.costB}B`}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-gray-500 opacity-90 normal-case mt-1.5 text-left leading-relaxed font-sans">
                    {tech.desc}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-[#0d210d]">
                  <span className="text-[8.5px] text-gray-600 font-bold opacity-75">
                    CODEC ID: {tech.id}
                  </span>

                  {!isUnlocked ? (
                    <button
                      onClick={() => handleUnlockNode(tech.id, tech.costB)}
                      className={`px-3 py-1 font-bold rounded uppercase cursor-pointer text-[8.5px] tracking-wider transition-colors active:translate-y-0.5 ${
                        canAfford
                          ? 'bg-[#1a4a1a] border border-[#2aff4a] text-[#00ff44] hover:bg-[#205b20]'
                          : 'bg-[#121212] border border-gray-805 text-gray-650 cursor-not-allowed select-none opacity-50'
                      }`}
                    >
                      Authorize Funds
                    </button>
                  ) : (
                    <span className="text-[#00ff44] font-black text-[9px] tracking-widest">[INTEGRATED]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </PanelFxShell>
  );
}
