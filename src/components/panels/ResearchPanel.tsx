import React from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { RESEARCH_TREES } from '../../constants';
import { ResearchNode } from '../../types';

export default function ResearchPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Player Country not loaded.</div>;

  const unlocked = playerCountry.researchUnlocked;

  const handleUnlockNode = (nodeId: ResearchNode, costB: number) => {
    if (usePlayerStore.getState().cashB < costB) {
      alert(`Financial locks: Tech research requires $${costB}B. Treasury reserves low.`);
      return;
    }

    // Deduct cash, sync to store
    usePlayerStore.setState((state) => ({ cashB: state.cashB - costB }));
    usePlayerStore.getState().syncCashToCountry();

    updateCountry(countryId, (draft) => {
      draft.researchUnlocked.push(nodeId);
    });

    useWorldStore.getState().addGlobalEvent(`Technology upgrade: Sovereign researchers deployed and unlocked "${nodeId}".`, 'INFO');
  };

  return (
    <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* List of research specs */}
      <div className="combat-panel flex flex-col gap-2.5 col-span-1 md:col-span-2">
        <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
          MILITARY FINANCIAL R&amp;D DEFENSE TREE
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {RESEARCH_TREES.map((tech) => {
            const isUnlocked = unlocked.includes(tech.id);
            const canAfford = usePlayerStore.getState().cashB >= tech.costB;

            return (
              <div
                key={tech.id}
                className={`border p-3 rounded flex flex-col justify-between gap-2.5 transition-all bg-[#030503] uppercase font-mono ${
                  isUnlocked
                    ? 'border-[#00ff44] bg-[#021c02] text-[#00ff44]'
                    : 'border-[#1a3a1a] hover:border-green-950 text-gray-400'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center font-bold tracking-wide">
                    <span className={isUnlocked ? 'text-[#00ff44] text-shadow-sm' : 'text-[#00e5ff]'}>
                      {tech.name}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold">
                      {isUnlocked ? 'UNLOCKED / ACTIVE' : `Locked — Cost: $${tech.costB}B`}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 opacity-90 lowercase mt-1 text-left leading-normal font-sans">
                    {tech.desc}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#0d210d]">
                  <span className="text-[9px] opacity-75">
                    ID: {tech.id}
                  </span>

                  {!isUnlocked ? (
                    <button
                      onClick={() => handleUnlockNode(tech.id, tech.costB)}
                      className={`px-3 py-1 font-bold rounded uppercase cursor-pointer text-[9px] ${
                        canAfford
                          ? 'bg-[#1a4a1a] border border-[#2aff4a] text-[#00ff44] hover:bg-[#205b20]'
                          : 'bg-[#121212] border border-gray-800 text-gray-600 cursor-not-allowed select-none'
                      }`}
                    >
                      Authorize Funds
                    </button>
                  ) : (
                    <span className="text-[#00ff44] font-bold text-[9px] tracking-widest">[INTEGRATED]</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
