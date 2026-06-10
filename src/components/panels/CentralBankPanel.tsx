import React, { useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import HexGauge from '../shared/HexGauge';
import { EconomicSectors, SupplyChains } from '../../types';

export default function CentralBankPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const commodityMarkets = useWorldStore((s) => s.commodityMarkets);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500">Error: Country data not loaded.</div>;

  const econ = playerCountry.economic;
  const sectors = econ.sectors;
  const supply = econ.supplyChains;
  const markets = econ.financialMarkets;

  const [cbTab, setCbTab] = useState<'MONETARY' | 'SECTORS' | 'VULNERABILITY'>('MONETARY');

  const [bondAmt, setBondAmt] = useState(10);
  const [bondRate, setBondRate] = useState(5.5);
  const [bondTicks, setBondTicks] = useState(20);

  const handleAdjustInterest = (newRate: number) => {
    updateCountry(countryId, (draft) => {
      draft.economic.interestRate = newRate;
    });
    useWorldStore.getState().addGlobalEvent(`Central Bank: Policy rate adjusted to ${newRate}%.`, 'INFO');
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
    useWorldStore.getState().addGlobalEvent(`Bond Desk: Disbursed $${bondAmt}B sovereign treasury bills at ${bondRate}%.`, 'INFO');
  };

  const handleDefaultSovereign = () => {
    if (!window.confirm('WARNING: Sovereign default drops foreign opinions by -50, spikes popular unrest, and crashes currency values. Confirm sovereign default?')) {
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.economic.bonds = [];
      draft.economic.debtToGdpRatio = 0;
      draft.economic.debtStressIndex = 0;
      draft.political.stabilityIndex = Math.max(5, draft.political.stabilityIndex - 40);
      draft.political.popularUnrest = Math.min(100, draft.political.popularUnrest + 35);
      draft.economic.currencyStrength = 10;
      Object.keys(draft.opinions).forEach((k) => {
        draft.opinions[k] = Math.max(-100, (draft.opinions[k] ?? 0) - 50);
      });
    });

    useWorldStore.getState().addGlobalEvent(`DEFAULT PROTOCOL: ${playerCountry.name} defaults on sovereign obligations!`, 'CRITICAL');
  };

  const handleBuyBlackMarket = (weaponType: any, costB: number) => {
    if (playerCountry.intelligence.blackBudgetB < costB) {
      alert('Signals audit failed: Black budget reserves are insufficient.');
      return;
    }

    updateCountry(countryId, (draft) => {
      draft.intelligence.blackBudgetB -= costB;
      const weapon = draft.arsenal.units.find(u => u.type === weaponType);
      if (weapon) {
        weapon.count += 5;
        weapon.operational = weapon.count;
      }
    });

    useWorldStore.getState().addGlobalEvent(`Signals desk: Procured black market ordnance.`, 'INFO');
  };

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
    <div className="w-full text-xs flex flex-col gap-3">
      {/* Subtab navigation */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-2">
        <button
          onClick={() => setCbTab('MONETARY')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            cbTab === 'MONETARY' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          💰 MONETARY & LIQUIDITY
        </button>
        <button
          onClick={() => setCbTab('SECTORS')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            cbTab === 'SECTORS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          🏭 INDUSTRIAL SECTORS
        </button>
        <button
          onClick={() => setCbTab('VULNERABILITY')}
          className={`px-3 py-1 text-[10px] font-bold border rounded transition-colors ${
            cbTab === 'VULNERABILITY' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44]' : 'text-gray-400 border-transparent hover:text-white'
          }`}
        >
          ⛓️ SUPPLY CHAINS & MARKETS
        </button>
      </div>

      {cbTab === 'MONETARY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex justify-around items-center h-24">
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">Treasury Cash</div>
                <div className="text-lg font-bold text-[#00ff44]">${econ.treasuryCashB.toFixed(1)}B</div>
              </div>
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest">Sovereign Debt</div>
                <div className="text-lg font-bold text-[#ffb300]">{econ.debtToGdpRatio.toFixed(1)}% GDP</div>
              </div>
              <HexGauge label="Inflation Index" value={econ.inflationRate} color={econ.inflationRate > 12 ? 'red' : 'green'} />
            </div>

            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                POLICY INTEREST DISCOUNTS
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 uppercase">Base Lending Interest Rate</span>
                  <span className="font-bold text-white font-mono">{econ.interestRate}%</span>
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
                  ↑ cooling rates decreases inflation but spikes interest service payments and limits GDP ratios.
                </p>
              </div>

              <div className="border-t border-[#1a3a1a] pt-3 flex justify-between items-center">
                <div>
                  <div className="font-bold">Liquidity Printing Press:</div>
                  <div className="text-[9px] text-gray-500">
                    {econ.printingPressActive ? 'ON — ACCUMULATING LIQUIDITY' : 'STANDBY'}
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
                      <option value="5">5x Speed</option>
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
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00e5ff] text-[10px]">
                SOVEREIGN BOND OUTLET
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[8px] text-gray-500 block">Bills Amount B</span>
                  <input
                    type="number"
                    value={bondAmt}
                    onChange={(e) => setBondAmt(Math.max(1, parseInt(e.target.value)))}
                    className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 block">Offering Interest</span>
                  <input
                    type="number"
                    step="0.1"
                    value={bondRate}
                    onChange={(e) => setBondRate(Math.max(0.1, parseFloat(e.target.value)))}
                    className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 block">Maturity Ticks</span>
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
                  DISTRIBUTE BILL RELEASES
                </button>
                <button
                  onClick={handleDefaultSovereign}
                  className="px-3 py-1.5 border border-red-900 text-red-500 hover:bg-[#ff2244]/15 rounded font-bold uppercase text-[9px] cursor-pointer"
                >
                  DECLARE DEFAULT
                </button>
              </div>
            </div>

            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#ffb300]">
                TACTICAL BAZAAR OVER COVERT NETWORKS (${playerCountry.intelligence.blackBudgetB.toFixed(1)}B)
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'CRUISE_MISSILE', name: '5x Cruise Missile Battery', price: 3.0, text: 'Secret guidance payloads.' },
                  { id: 'DRONE_SWARM', name: '5x Drone Swarms Aviation', price: 2.0, text: 'Asymmetric recon swarms.' },
                  { id: 'EMP_DEVICE', name: '1x Atmospheric EMP Ordnance', price: 6.0, text: 'High altitude infrastructure grid shocker.' }
                ].map((arm) => (
                  <div key={arm.id} className="border border-amber-900 bg-[#030503] p-1.5 flex justify-between items-center text-[10px] rounded">
                    <div>
                      <div className="font-bold text-[#ffb300]">{arm.name}</div>
                      <div className="text-[8px] text-gray-500">{arm.text}</div>
                    </div>
                    <button
                      onClick={() => handleBuyBlackMarket(arm.id, arm.price)}
                      className="px-2 py-0.5 border border-amber-600 text-[#ffb300] hover:bg-[#ffb300]/15 rounded cursor-pointer font-bold uppercase text-[9px]"
                    >
                      Buy (${arm.price}B)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {cbTab === 'SECTORS' && (
        <div className="combat-panel flex flex-col gap-3">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
            SECTORAL ECONOMIC DOMINATION SUMMARY
          </h3>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-xl">
            Sectors aggregate directly to construct total Gross Domestic Product (current GDP B: ${playerCountry.economic.gdpB.toFixed(1)}B). Tech sectors grow based on demographic education; military sectors expand through budget; war crashes services and tourism outputs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {[
              { id: 'agriculture', label: '🌾 AGRICULTURE', desc: 'Critical for sustenance. Lowers food import dependency index.', color: 'emerald' },
              { id: 'manufacturing', label: '🏭 HEAVY MANUFACTURING', desc: 'Constructs hardware and machinery. Declines during war/sanctions.', color: 'blue' },
              { id: 'services', label: '📈 UTILITIES & SERVICES', desc: 'Core consumer operations. Declines heavily under structural unrest.', color: 'cyan' },
              { id: 'technology', label: '💻 INFORMATION TECHNOLOGY', desc: 'Drives cyber shields and intelligence capabilities.', color: 'purple' },
              { id: 'energy', label: '⚡ ENERGY & OIL PRODUCTS', desc: 'Primary electricity grid supply. Affected directly by oil prices.', color: 'amber' },
              { id: 'defense', label: '🛡️ MILITARY DEFENSE MFG', desc: 'Industrial arms production rate. Fueled by military spending.', color: 'red' },
            ].map((sect) => {
              const val = sectors ? (sectors[sect.id as keyof EconomicSectors] || 0) : 0;
              const pct = econ.gdpB > 0 ? Math.round((val / econ.gdpB) * 100) : 0;

              return (
                <div key={sect.id} className="border border-[#1a3a1a] bg-[#020502] p-3 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200">{sect.label}</span>
                    <span className="font-mono text-[#00ff44] font-bold">${val.toFixed(1)}B ({pct}%)</span>
                  </div>
                  <p className="text-[9px] text-gray-500 leading-normal">{sect.desc}</p>
                  <div className="w-full bg-black/40 h-2 rounded border border-[#1a3a1a] overflow-hidden">
                    <div className="bg-[#00ff44] h-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cbTab === 'VULNERABILITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supply Chain dependencies */}
          <div className="combat-panel flex flex-col gap-3">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44]">
              ⛓️ GLOBAL SUPPLY CHAIN DEPENDENCIES
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal mb-2">
              Low self-reliance creates bottleneck vulnerabilities. If high semiconductor dependency exists and semiconductor suppliers (TW/KR) are disrupted, defense and tech sectors slip.
            </p>

            {[
              { id: 'energyDependency', label: '⚡ Energy Supply Dependency', color: 'bg-amber-500', path: 'Oil dependency metrics' },
              { id: 'foodDependency', label: '🌾 Sustenance Food Dependency', color: 'bg-emerald-500', path: 'Wheat dependency metrics' },
              { id: 'semiconductorDependency', label: '💾 Microchips & Semiconductors', color: 'bg-purple-500', path: 'Assembled microchips dependency' },
              { id: 'defenseDependency', label: '🛡️ Defense Ordinance imports', color: 'bg-red-500', path: 'Armaments dependency' }
            ].map((dep) => {
              const val = supply ? (supply[dep.id as keyof SupplyChains] || 0) : 25;
              return (
                <div key={dep.id} className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-gray-400">{dep.label}</span>
                    <span className={`font-bold ${val > 60 ? 'text-[#ff2244]' : 'text-green-500'}`}>{val}%</span>
                  </div>
                  <div className="w-full bg-black/40 border border-[#1a3a1a] h-1.5 rounded overflow-hidden">
                    <div className={`${dep.color} h-full`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            {/* Markets indicators */}
            <div className="combat-panel flex flex-col gap-3">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00e5ff]">
                📈 BORSE EXCHANGES & CREDIT RATING
              </h3>
              <div className="space-y-2.5 font-mono text-[10.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">CREDIT RATING:</span>
                  <span className="font-bold text-[#00ff44] bg-[#0d2a10] border border-[#1a5d20] px-1.5 py-0.5 text-xs rounded">
                    {markets?.sovereignRating || 'AAA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">STOCK INDEX LEVEL:</span>
                  <span className="font-bold text-white">
                    {markets ? Math.round(markets.stockMarketIndex).toLocaleString() : '10,000'} PTS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">BOND APY INTEREST:</span>
                  <span className="font-bold text-shadow text-[#00e5ff]">{markets?.bondYield}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CURRENCY VALUE:</span>
                  <span className="font-bold text-white">{markets?.currencyMarketValue} index</span>
                </div>
              </div>
            </div>

            {/* Commodities index */}
            <div className="combat-panel flex flex-col gap-2">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44]">
                RESOURCE INDEX
              </h3>
              <div className="space-y-1">
                {commodityMarkets.map((m) => {
                  const path = getSparklinePath(m.priceHistory);
                  return (
                    <div key={m.type} className="border border-[#0d1f0d] p-1 flex justify-between items-center bg-[#030503] rounded">
                      <span className="font-mono text-[9px] font-bold text-[#00e5ff]">{m.type}</span>
                      <svg className="w-16 h-4 opacity-50">
                        <path d={path} fill="none" stroke="#00e5ff" strokeWidth="1" />
                      </svg>
                      <span className="font-mono text-[10px] font-bold text-[#00ff44]">${m.spotPriceUSD.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
