import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { CommodityType } from '../../types';
import HexGauge from '../shared/HexGauge';

export default function CentralBankPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const commodityMarkets = useWorldStore((s) => s.commodityMarkets);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Country data not loaded.</div>;

  const econ = playerCountry.economic;

  // Real-time state form for bond issuance
  const [bondAmt, setBondAmt] = useState(10);
  const [bondRate, setBondRate] = useState(5.5);
  const [bondTicks, setBondTicks] = useState(20);

  const handleAdjustInterest = (newRate: number) => {
    updateCountry(countryId, (draft) => {
      draft.economic.interestRate = newRate;
    });
    useWorldStore.getState().addGlobalEvent(`Central Bank: Base policy lending rate adjusted to ${newRate}%.`, 'INFO');
    useUIStore.getState().pushTerminalLine(`BANK: Base policy discount rate shifted to ${newRate}%.`, 'INFO');
  };

  const handleTogglePress = () => {
    updateCountry(countryId, (draft) => {
      draft.economic.printingPressActive = !draft.economic.printingPressActive;
    });
  };

  const handlePressIntensity = (val: number) => {
    updateCountry(countryId, (draft) => {
      draft.economic.printingPressIntensity = val;
    });
  };

  const handleIssueBonds = () => {
    updateCountry(countryId, (draft) => {
      draft.economic.treasuryCashB += bondAmt;
      draft.economic.debtToGdpRatio += Math.round((bondAmt / draft.economic.gdpB) * 100);
      draft.economic.bonds.push({
        id: `bond_${Math.random().toString().substring(2,6)}`,
        amount: bondAmt,
        interestRate: bondRate,
        maturityTicks: bondTicks,
        remainingTicks: bondTicks,
        holder: 'MARKET',
      });
    });
    useWorldStore.getState().addGlobalEvent(`Bond Desk: Disbursed $${bondAmt}B sovereign treasury bills at ${bondRate}% interest.`, 'INFO');
  };

  const handleDefaultSovereign = () => {
    if (!window.confirm('WARNING: Sovereign default is highly destructive. All foreign opinions drop -50, popular unrest spikes +30, and currency collapse occurs. Confirm sovereign default?')) {
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.bonds = []; // clear debt
      draft.economic.debtToGdpRatio = 0;
      draft.economic.debtStressIndex = 0;
      draft.political.stabilityIndex = Math.max(5, draft.political.stabilityIndex - 40);
      draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 35);
      draft.economic.currencyStrength = 10; // crashed
      // opinions fall
      Object.keys(draft.opinions).forEach((k) => {
        draft.opinions[k] = Math.max(-100, (draft.opinions[k] ?? 0) - 50);
      });
    });

    useWorldStore.getState().addGlobalEvent(`DEFAULT PROTOCOL: ${playerCountry.name} declares aggregate default on sovereign guarantees. National credit smashed.`, 'CRITICAL');
  };

  const handleBuyBlackMarket = (weaponType: any, costB: number) => {
    if (playerCountry.intelligence.blackBudgetB < costB) {
      alert('Signals audit failed: Black budget reserves are completely insufficient.');
      return;
    }

    // Deduct covert slush, grant weapons
    updateCountry(countryId, (draft) => {
      draft.intelligence.blackBudgetB -= costB;
      const weapon = draft.arsenal.units.find(u => u.type === weaponType);
      if (weapon) {
        weapon.count += 5;
        weapon.operational = weapon.count;
      }
    });

    useWorldStore.getState().addGlobalEvent(`Signals desk: Procured black market ordnance under covert channels. Direct sanctions avoided.`, 'INFO');
  };

  // Helper to draw clean SVG sparkline path
  const getSparklinePath = (history: number[], width = 100, height = 24) => {
    if (history.length < 2) return '';
    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const range = maxVal - minVal || 1;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height * 0.85) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="w-full text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Col 1: Monetary Policy & Debt Bonds */}
      <div className="flex flex-col gap-4">
        {/* Treasury metrics */}
        <div className="combat-panel flex justify-around items-center h-28">
          <div className="text-center font-mono">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">Treasury Cash</div>
            <div className="text-lg font-bold text-phosphor-green text-shadow">${econ.treasuryCashB.toFixed(1)}B</div>
          </div>
          <div className="text-center font-mono">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">Sovereign Debt</div>
            <div className="text-lg font-bold text-phosphor-amber text-shadow">{econ.debtToGdpRatio.toFixed(1)}% GDP</div>
          </div>
          <HexGauge label="Inflation Index" value={econ.inflationRate} color={econ.inflationRate > 12 ? 'red' : 'green'} />
        </div>

        {/* Central bank Discount Rate */}
        <div className="combat-panel flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
            CENTRAL BANK FUND DISCOUNT CONSOLE
          </h3>

          <div className="flex flex-col gap-1 py-1">
            <div className="flex justify-between items-center text-[10px] tracking-wider uppercase text-gray-400">
              <span>Policy Discount Interest Rate</span>
              <span className="font-bold">{econ.interestRate}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="25"
              step="0.25"
              value={econ.interestRate}
              onChange={(e) => handleAdjustInterest(parseFloat(e.target.value))}
              className="w-full bg-[#0d1f0d] border border-[#1a3a1a] h-1 rounded outline-none accent-[#00ff44] cursor-pointer"
            />
            <p className="text-[8px] text-gray-500 leading-normal uppercase mt-1">
              ↑ interest rate de-escalates inflation velocity but dampens GDP multiplier and increases sovereign bond repayments.
            </p>
          </div>

          {/* Printing Press */}
          <div className="border-t border-[#1a3a1a] pt-3 flex justify-between items-center mt-1">
            <div>
              <div className="font-bold">Treasury Printing Press:</div>
              <div className="text-[9px] text-gray-500">
                {econ.printingPressActive ? 'ON — EMITTING $5B PER TICK' : 'OFF — STANDBY'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {econ.printingPressActive && (
                <select
                  value={econ.printingPressIntensity}
                  onChange={(e) => handlePressIntensity(parseInt(e.target.value))}
                  className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded"
                >
                  <option value="1">1x Speed</option>
                  <option value="2">2x Speed</option>
                  <option value="3">3x Speed</option>
                  <option value="4">4x Speed</option>
                  <option value="5">5x HIGH OUTPUT</option>
                </select>
              )}
              <button
                onClick={handleTogglePress}
                className={`px-3 py-1 font-bold uppercase text-[9px] rounded cursor-pointer ${
                  econ.printingPressActive
                    ? 'border-[#ff2244] text-[#ff2244] bg-[#220005]'
                    : 'border-[#00ff44] text-[#00ff44] bg-[#021c02]'
                }`}
              >
                {econ.printingPressActive ? 'HALT PRESS' : 'ENABLE PRESS'}
              </button>
            </div>
          </div>
        </div>

        {/* Bond desk */}
        <div className="combat-panel flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-cyan text-[10px]">
            SOVEREIGN BOND ISSUANCE DESK
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[8px] text-gray-500 uppercase block mb-1">Issue Amount</span>
              <input
                type="number"
                value={bondAmt}
                onChange={(e) => setBondAmt(Math.max(1, parseInt(e.target.value)))}
                className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
              />
            </div>
            <div>
              <span className="text-[8px] text-gray-500 uppercase block mb-1">Interest Rate</span>
              <input
                type="number"
                step="0.1"
                value={bondRate}
                onChange={(e) => setBondRate(Math.max(0.1, parseFloat(e.target.value)))}
                className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
              />
            </div>
            <div>
              <span className="text-[8px] text-gray-500 uppercase block mb-1">Maturity (Ticks)</span>
              <input
                type="number"
                value={bondTicks}
                onChange={(e) => setBondTicks(Math.max(5, parseInt(e.target.value)))}
                className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleIssueBonds}
              className="flex-1 px-3 py-1.5 bg-[#002f3c] border border-[#00e5ff] text-[#00e5ff] rounded hover:bg-[#004e63] font-bold uppercase text-[9px] cursor-pointer"
            >
              DISTRIBUTE SOVEREIGN BILLS
            </button>
            <button
              onClick={handleDefaultSovereign}
              className="px-3 py-1.5 border border-red-900 text-red-500 hover:bg-[#ff2244]/15 rounded font-bold uppercase text-[9px] cursor-pointer"
            >
              TRIGGER DEFAULT
            </button>
          </div>
        </div>
      </div>

      {/* Col 2: Markets & Black arms smuggler */}
      <div className="flex flex-col gap-4">
        {/* Sparkline Commodities Index */}
        <div className="combat-panel flex flex-col gap-2">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
            COMMODITIES INDEX EXCHANGES
          </h3>

          <div className="space-y-1.5">
            {commodityMarkets.map((m) => {
              const path = getSparklinePath(m.priceHistory);
              return (
                <div
                  key={m.type}
                  className="border border-[#0d1f0d] p-1 flex justify-between items-center bg-[#030503] rounded"
                >
                  <div className="font-mono text-[10px]">
                    <div className="font-bold text-[#00e5ff] uppercase">{m.type}</div>
                    <div className="text-[8px] text-gray-500">SPOT PRICE</div>
                  </div>

                  {/* SVG Sparkline */}
                  <svg className="w-24 h-6 border-l border-r border-[#0d1f0d]">
                    <path d={path} fill="none" stroke="#00e5ff" strokeWidth="1.5" />
                  </svg>

                  <div className="text-right font-mono">
                    <div className="font-bold text-phosphor-cyan">${m.spotPriceUSD.toFixed(1)}</div>
                    <div className="text-[7px] text-gray-500 uppercase">
                      {m.supplyShockActive ? 'SHOCKED' : 'NOMINAL'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arms black market */}
        <div className="combat-panel flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-phosphor-amber">
            TAC ARMS EMBLEMS COVERT BAZAAR (COVERT BUDGET: ${playerCountry.intelligence.blackBudgetB.toFixed(1)}B)
          </h3>

          <div className="overflow-y-auto max-h-[120px] space-y-1.5 pr-1">
            <div className="border border-amber-900 bg-[#030503] p-1.5 flex justify-between items-center text-[10px] rounded">
              <div>
                <div className="font-bold text-[#ffb300]">5x Cruise Missile Battery</div>
                <div className="text-[8px] opacity-75">Unsanctioned precision munitions.</div>
              </div>
              <button
                onClick={() => handleBuyBlackMarket('CRUISE_MISSILE', 3.0)}
                className="px-2 py-1 border border-amber-600 text-[#ffb300] hover:bg-[#ffb300]/15 rounded cursor-pointer font-bold uppercase text-[9px]"
              >
                Buy ($3.0B Black Budget)
              </button>
            </div>

            <div className="border border-amber-900 bg-[#030503] p-1.5 flex justify-between items-center text-[10px] rounded">
              <div>
                <div className="font-bold text-[#ffb300]">5x Drone Swarms Air Wing</div>
                <div className="text-[8px] opacity-75">Asymmetric recon payload.</div>
              </div>
              <button
                onClick={() => handleBuyBlackMarket('DRONE_SWARM', 2.0)}
                className="px-2 py-1 border border-amber-600 text-[#ffb300] hover:bg-[#ffb300]/15 rounded cursor-pointer font-bold uppercase text-[9px]"
              >
                Buy ($2.0B Black Budget)
              </button>
            </div>

            <div className="border border-amber-900 bg-[#030503] p-1.5 flex justify-between items-center text-[10px] rounded">
              <div>
                <div className="font-bold text-[#ffb300]">1x ATMOSPHERIC EMP GRID</div>
                <div className="text-[8px] opacity-75">High attitude shock unit.</div>
              </div>
              <button
                onClick={() => handleBuyBlackMarket('EMP_DEVICE', 6.0)}
                className="px-2 py-1 border border-amber-600 text-[#ffb300] hover:bg-[#ffb300]/15 rounded cursor-pointer font-bold uppercase text-[9px]"
              >
                Buy ($6.0B Black Budget)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
