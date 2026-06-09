import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useEconomyStore } from '../../store/economyStore';
import GlowSlider from '../shared/GlowSlider';

export default function DiplomacyPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const selectedTargetId = usePlayerStore((s) => s.selectedTargetCountryId);
  const setTargetCountry = usePlayerStore((s) => s.setTargetCountry);

  const countries = useWorldStore((s) => s.countries);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Country data not loaded.</div>;

  const tradeTgtId = selectedTargetId || 'US';
  const targetC = countries[tradeTgtId];

  // Forms for bilateral tools
  const [tarValue, setTarValue] = useState(playerCountry.tariffs?.[tradeTgtId] ?? 0);
  const [aidAmount, setAidAmount] = useState(5.0);

  const handleAdjustTariff = (val: number) => {
    setTarValue(val);
    updateCountry(countryId, (draft) => {
      if (!draft.tariffs) draft.tariffs = {};
      draft.tariffs[tradeTgtId] = val;
    });
  };

  const handleDispatchAid = (aidType: 'HUMANITARIAN' | 'ECONOMIC' | 'MILITARY') => {
    if (playerCountry.economic.treasuryCashB < aidAmount) {
      alert('Debit warning: Budget allocation exceeds current cash reserves.');
      return;
    }

    usePlayerStore.setState((state) => ({ cashB: state.cashB - aidAmount }));
    usePlayerStore.getState().syncCashToCountry();

    updateCountry(tradeTgtId, (draft) => {
      draft.economic.treasuryCashB += aidAmount;
      draft.opinions[countryId] = Math.min(100, (draft.opinions[countryId] ?? 0) + (aidAmount * 3));
    });

    useWorldStore.getState().addGlobalEvent(`State Ministry: Sent $${aidAmount}B in direct ${aidType} aid to ${tradeTgtId}.`, 'INFO');
  };

  const handleImposeBlockade = () => {
    useEconomyStore.getState().imposeSanction(countryId, tradeTgtId);
    useWorldStore.getState().addGlobalEvent(`BLOCKADE DECREE: Placed aggregate sanctions on ${tradeTgtId}.`, 'WARNING');
  };

  const handleSignPact = () => {
    if ((targetC.opinions[countryId] ?? 0) < 55) {
      alert(`Diplomatic rejection: Foreign opinion of your country is too low [${Math.round(targetC.opinions[countryId] ?? 0)}/55] to enter mutual alignments.`);
      return;
    }

    updateCountry(countryId, (draft) => {
      if (targetC.allianceBlock !== 'NEUTRAL') {
        draft.allianceBlock = targetC.allianceBlock;
      } else {
        // Build bilateral trade pact
        draft.tradePartners.push(tradeTgtId);
      }
    });

    updateCountry(tradeTgtId, (draft) => {
      if (playerCountry.allianceBlock === 'NEUTRAL' && !draft.tradePartners.includes(countryId)) {
        draft.tradePartners.push(countryId);
      }
    });

    useWorldStore.getState().addGlobalEvent(`TREATY SIGNED: Signed Mutual Defense Alliance with ${tradeTgtId}. Borders aligned.`, 'INFO');
  };

  return (
    <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* List of sovereign countries */}
      <div className="combat-panel flex flex-col gap-2">
        <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
          DIPLOMATIC COUNTRY DIRECTORY
        </h3>

        <div className="space-y-1 overflow-y-auto max-h-[200px] pr-1">
          {Object.keys(countries)
            .filter((id) => id !== countryId)
            .map((id) => {
              const c = countries[id];
              const isSelected = id === tradeTgtId;
              const op = c.opinions[countryId] ?? 50;

              return (
                <div
                  key={id}
                  onClick={() => {
                    setTargetCountry(id);
                    setTarValue(playerCountry.tariffs?.[id] ?? 0);
                  }}
                  className={`border p-1.5 rounded flex justify-between items-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#00ff44] bg-[#0c1f0d]'
                      : 'border-[#0d1f0d] bg-[#030503] hover:border-green-800'
                  }`}
                >
                  <div className="font-mono">
                    <span className="mr-1">{c.flagEmoji}</span>
                    <span className="font-bold text-[#00e5ff]">{id}</span>
                    <span className="text-[10px] text-gray-500 ml-1.5 uppercase">
                      BLOCK: {c.allianceBlock}
                    </span>
                  </div>

                  <div className="font-mono text-right flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 uppercase">Opinion:</span>
                    <span className={op > 60 ? 'text-[#00ff44] font-bold' : op < 40 ? 'text-[#ff2244] font-bold' : 'text-[#ffb300]'}>
                      {Math.round(op)}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Selected country bilateral controls */}
      <div className="flex flex-col gap-4">
        {targetC ? (
          <div className="combat-panel flex flex-col gap-3">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-cyan">
              BILATERAL COMMUTE FOR: {targetC.name} {targetC.flagEmoji}
            </h3>

            {/* General info */}
            <div className="grid grid-cols-2 text-[10px] uppercase font-mono opacity-80 gap-1.5 border-b border-[#0d1f0d] pb-2">
              <div>Sovereign GDP: <span className="text-[#00ff44] font-bold">${targetC.economic.gdpB.toFixed(1)}B</span></div>
              <div>Arrest Stockpiles: <span className="text-phosphor-amber">${targetC.arsenal.totalPowerRating} VAL</span></div>
              <div>Domestic stability: <span className="text-phosphor-cyan">{Math.round(targetC.political.stabilityIndex)}%</span></div>
              <div>Ideology core: <span className="text-pink-500 font-bold">{targetC.political.ideology}</span></div>
            </div>

            {/* Custom Tariff slider */}
            <GlowSlider
              label={`Custom Tariffs on ${tradeTgtId} Imports`}
              value={tarValue}
              min={0}
              max={50}
              onChange={handleAdjustTariff}
              unit="%"
              color="cyan"
            />

            {/* Send Aid inputs */}
            <div className="flex justify-between items-center text-[11px] mt-1 gap-2">
              <span className="shrink-0 text-gray-500 uppercase">AID BUNDLE:</span>
              <div className="flex gap-1.5 items-center flex-1">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={aidAmount}
                  onChange={(e) => setAidAmount(Math.max(1, parseFloat(e.target.value)))}
                  className="w-14 bg-[#030503] border border-[#1a3a1a] text-phosphor-green text-[11px] p-1 rounded font-mono outline-none"
                />
                <span className="text-gray-500 font-bold">B</span>

                <button
                  onClick={() => handleDispatchAid('HUMANITARIAN')}
                  className="px-2 py-1 border border-cyan-800 text-cyan-400 font-mono hover:bg-[#002e3b] text-[9px] uppercase cursor-pointer"
                >
                  DISPATCH
                </button>
              </div>
            </div>

            {/* Pledge pact Blockades */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#0d1f0d]">
              <button
                onClick={handleSignPact}
                className="py-2 border border-[#00ff44] text-[#00ff44] hover:bg-[#021c02] font-bold uppercase text-[9px] rounded cursor-pointer"
              >
                🤝 PARTNERSHIP PACT
              </button>
              <button
                onClick={handleImposeBlockade}
                className="py-2 border border-[#ff2244] text-[#ff2244] hover:bg-[#220002] font-bold uppercase text-[9px] rounded cursor-pointer"
              >
                🚫 IMPOSE SANCTIONS
              </button>
            </div>
          </div>
        ) : (
          <div className="combat-panel flex items-center justify-center h-48 font-mono text-gray-600">
            [SELECT SOVEREIGN DIRECTORY TARGET TO COMPILE DIPLOMACY DECK]
          </div>
        )}

        {/* Global Security Guarantees summary */}
        <div className="combat-panel flex-1 flex flex-col justify-center">
          <span className="text-[9px] text-gray-500 uppercase font-mono mb-1">Defense Alignments list:</span>
          <div className="text-[10px] font-mono leading-relaxed text-shadow-sm">
            🛡️ Player Bloc alignment: <span className="text-[#00ff44] font-bold">{playerCountry.allianceBlock}</span>
            <br />
            🌍 Active Allied Network counts: {
              Object.keys(countries).filter(k => countries[k].allianceBlock === playerCountry.allianceBlock).length
            } Sovereign states
          </div>
        </div>
      </div>
    </div>
  );
}
