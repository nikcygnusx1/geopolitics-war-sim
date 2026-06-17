import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import HexGauge from '../shared/HexGauge';
import { EconomicSectors, SupplyChains } from '../../types';
import { audio } from '../../utils/audio';
import { useUIStore } from '../../store/uiStore';
import AnimatedValue from '../shared/AnimatedValue';

export default function CentralBankPanel() {
  const countryId = usePlayerStore((s) => s.countryId);
  const countries = useWorldStore((s) => s.countries);
  const commodityMarkets = useWorldStore((s) => s.commodityMarkets);
  const updateCountry = useWorldStore((s) => s.updateCountry);

  const playerCountry = countries[countryId];
  if (!playerCountry) return <div className="text-red-500 font-mono p-4 border border-red-950 bg-black">Error: Country data not loaded.</div>;

  const econ = playerCountry.economic;
  const sectors = econ.sectors;
  const supply = econ.supplyChains;
  const markets = econ.financialMarkets;

  const [cbTab, setCbTab] = useState<'MONETARY' | 'MACRO_PROFILES' | 'SECTORS' | 'VULNERABILITY'>('MACRO_PROFILES');
  const selectedCountryId = useUIStore((s) => s.selectedCountryId);
  const [inspectMode, setInspectMode] = useState<'PLAYER' | 'SELECTED'>('PLAYER');

  const world = useWorldStore((s) => s.world);
  const activeCountryId = (inspectMode === 'SELECTED' && selectedCountryId) ? selectedCountryId : countryId;
  const activeCountry = countries[activeCountryId] || playerCountry;
  const activeCountryState = world?.countriesById[activeCountryId];
  const activeEconState = activeCountryState?.economy;

  const [bondAmt, setBondAmt] = useState(10);
  const [bondRate, setBondRate] = useState(5.5);
  const [bondTicks, setBondTicks] = useState(20);

  // Local state overlay for sovereign default confirmation instead of window.confirm
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false);

  // Fallback default properties for macro elements to support backward-compatibility seamlessly
  const activeCyclePhase = activeEconState?.businessCyclePhase || activeCountry.economic.businessCyclePhase || 'EXPANSION';
  const activeFragility = activeEconState?.fragilityScore ?? 30;
  const activeResilience = activeEconState?.resilienceScore ?? 70;
  const activeShockLoad = activeEconState?.shockLoad ?? 12;
  const activeTrend = activeEconState?.macroTrend || 'STABLE';
  const activeDriversList = activeEconState?.recentMacroDrivers || ['Peacetime stabilization cycles active'];
  const activePolicy = activeEconState?.policyPosture || activeCountry.economic.policyPosture || 'PRO_GROWTH';
  const activeCurrencyStability = activeEconState?.currencyStability ?? 75;

  const activeName = activeCountryState?.name || activeCountry.name;
  const activeGovType = activeCountryState?.governmentType || 'Constitutional Republic';
  const activeRegion = activeCountryState?.region || 'Global Space';
  const activeCapital = activeCountryState?.capital || 'Metropolis';

  const activeGDP = activeEconState?.gdp ?? activeCountry.economic.gdpB;
  const activeGrowthRate = activeEconState?.growthRate ?? activeCountry.economic.gdpGrowthRate;
  const activeInflation = activeEconState?.inflation ?? activeCountry.economic.inflationRate;
  const activeUnemployment = activeEconState?.unemployment ?? activeCountry.economic.unemploymentRate;
  const activeDebtRatio = activeEconState?.debtRatio ?? activeCountry.economic.debtToGdpRatio;
  const activeReserves = activeEconState?.reserves ?? activeCountry.economic.treasuryCashB;

  const handleAdjustInterest = (newRate: number) => {
    updateCountry(countryId, (draft) => {
      draft.economic.interestRate = newRate;
    });
    useWorldStore.getState().addGlobalEvent(`Central Bank: Policy rate adjusted to ${newRate}%.`, 'INFO');
  };

  const handleTogglePress = () => {
    audio.sfxKeyClick();
    updateCountry(countryId, (draft) => {
      draft.economic.printingPressActive = !draft.economic.printingPressActive;
    });
  };

  const handlePressIntensity = (val: number) => {
    audio.sfxKeyClick();
    updateCountry(countryId, (draft) => {
      draft.economic.printingPressIntensity = val;
    });
  };

  const handleAdjustPolicyPosture = (posture: 'PRO_GROWTH' | 'AUSTERITY' | 'CURRENCY_DEFENSE' | 'IMPORT_SUPPORT' | 'DEBT_STABILIZATION') => {
    audio.sfxKeyClick();
    updateCountry(countryId, (draft) => {
      draft.economic.policyPosture = posture;
    });
    useWorldStore.getState().addGlobalEvent(`Central Bank: Sovereign policy stance updated to ${posture.replace('_', ' ')}.`, 'INFO');
    
    useUIStore.getState().pushAlert({
      title: 'ECONOMIC DECREE PROCLAIMED',
      message: `Adjusted national monetary stance to: [${posture.replace('_', ' ')}]. Growth path multipliers updated.`,
      type: 'INFO'
    });
  };

  const handleIssueBonds = () => {
    audio.sfxKeyClick();
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
    
    useUIStore.getState().pushAlert({
      title: 'BOND OFFERS DELIVERED',
      message: `Released $${bondAmt}B treasury bills offering ${bondRate}% APY over ${bondTicks} ticks. Cash reserves increased immediately.`,
      type: 'INFO'
    });
  };

  const handleDefaultSovereign = () => {
    audio.sfxKeyClick();
    setShowDefaultConfirm(true);
  };

  const confirmSovereignDefault = () => {
    audio.sfxKeyClick();
    audio.sfxMarketCrash();
    setShowDefaultConfirm(false);

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
    
    useUIStore.getState().pushAlert({
      title: 'CREDIT COMPROMISED - DECLARED DEFAULT',
      message: 'The Sovereign treasury has officially renounced outstanding national debt. All treasury bills vaporized. Credit ratings ruined.',
      type: 'DANGER'
    });
  };

  const handleBuyBlackMarket = (weaponType: any, costB: number) => {
    audio.sfxKeyClick();
    if (playerCountry.intelligence.blackBudgetB < costB) {
      useUIStore.getState().pushAlert({
        title: 'SIGNALS AUDIT FAILED',
        message: 'Security warning: Black operations slush fund reserves are insufficient to complete target bazaar purchase.',
        type: 'DANGER'
      });
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
    
    useUIStore.getState().pushAlert({
      title: 'BLACK MARKET SHIPMENT RECEIVED',
      message: `Clandestine procurement complete: Delivered 5x "${weaponType.replace('_', ' ')}" directly to weapon silos. Private channels closed.`,
      type: 'INFO'
    });
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

  // Helper to generate beautifully authentic living charts based on active metrics and country characteristics
  const generateLivingHistory = (seed: string, currentVal: number, scale = 1, variance = 0.08) => {
    const history: number[] = [];
    let prev = currentVal;
    for (let i = 12; i >= 0; i--) {
      history.push(prev);
      const hash = Math.sin(i * 3.14 + seed.charCodeAt(0) * 1.5) * Math.cos(i * 2.5);
      prev = Math.max(0.1, prev * (1 + hash * variance));
    }
    return history.reverse();
  };

  return (
    <PanelFxShell panelId="central_bank" relevantFxTypes={['MARKET_CRASH','ECONOMIC_COLLAPSE']}>
      <div className="w-full text-xs flex flex-col gap-3 font-mono">
      {/* Sovereign Default Warning Modal Overlay */}
      {showDefaultConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border-2 border-red-500 bg-[#160005] p-5 max-w-sm w-full rounded text-center space-y-4">
            <h4 className="text-red-500 font-extrabold text-sm tracking-wider uppercase animate-pulse flex items-center justify-center gap-1.5">
              ⚠️ SYSTEM SECURITY DIRECTIVE: NATIONAL DECREE DEFAULTS
            </h4>
            <p className="text-[10px] text-gray-300 leading-normal lowercase normal-case">
              Invoking sovereign default wipes out all outstanding state bonds, but causes catastrophic failure metrics:
              <br/>
              <span className="text-red-400 font-bold font-mono">opinion loss -50 | stability index -40 | unrest spike +35 | credit collapse</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={confirmSovereignDefault}
                className="px-4 py-1.5 bg-[#40000a] text-red-500 border border-red-500 font-black cursor-pointer uppercase rounded text-[10px] tracking-wider transition-colors hover:bg-red-950"
              >
                EXECUTE DEFAULT
              </button>
              <button
                onClick={() => { audio.sfxKeyClick(); setShowDefaultConfirm(false); }}
                className="px-4 py-1.5 bg-[#030503] border border-gray-600 text-gray-300 font-bold cursor-pointer uppercase rounded text-[10px] tracking-wider hover:bg-gray-800"
              >
                ABORT DECREE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selector toggle for inspecting self or secondary map target */}
      {selectedCountryId && selectedCountryId !== countryId && (
        <div className="flex bg-[#030d05] border border-[#1a3f1d] px-3 py-2 justify-between items-center rounded gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff44] animate-pulse">🛰️</span>
            <span className="text-[10px] text-gray-300 uppercase">
              COVERT RADAR SYNCED: Selected Country target <span className="font-extrabold text-[#00ff44]">"{countries[selectedCountryId]?.name || selectedCountryId}"</span>
            </span>
          </div>
          <div className="flex bg-black/60 rounded p-0.5 border border-[#1a3a1a]">
            <button
              onClick={() => { audio.sfxKeyClick(); setInspectMode('PLAYER'); }}
              className={`px-3 py-1 text-[9px] uppercase font-bold rounded ${
                inspectMode === 'PLAYER' ? 'bg-[#1a4a1a] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              My Sovereign Desk
            </button>
            <button
              onClick={() => { audio.sfxKeyClick(); setInspectMode('SELECTED'); }}
              className={`px-3 py-1 text-[9px] uppercase font-bold rounded ${
                inspectMode === 'SELECTED' ? 'bg-[#1a3c5a] text-[#00ffc4]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Inspect Target
            </button>
          </div>
        </div>
      )}

      {/* Subtab navigation */}
      <div className="flex border-b border-[#1a3a1a] pb-2 mb-1 gap-1 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => { audio.sfxKeyClick(); setCbTab('MACRO_PROFILES'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer flex-shrink-0 ${
            cbTab === 'MACRO_PROFILES' ? 'bg-[#12314a] text-[#00ccff] border-[#00ccff] shadow-[0_0_8px_rgba(0,204,255,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          📊 Sovereign Macro Model
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setCbTab('MONETARY'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer flex-shrink-0 ${
            cbTab === 'MONETARY' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          💰 Monetary & Liquidity
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setCbTab('SECTORS'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer flex-shrink-0 ${
            cbTab === 'SECTORS' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          🏭 Industrial Sectors
        </button>
        <button
          onClick={() => { audio.sfxKeyClick(); setCbTab('VULNERABILITY'); }}
          className={`px-3 py-1 text-[10px] uppercase font-bold border rounded transition-all cursor-pointer flex-shrink-0 ${
            cbTab === 'VULNERABILITY' ? 'bg-[#1a4a1a] text-[#00ff44] border-[#00ff44] shadow-[0_0_8px_rgba(0,255,68,0.25)]' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          ⛓️ Supply Chains & Markets
        </button>
      </div>


      {cbTab === 'MACRO_PROFILES' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Active Country Overview Card Header */}
          <div className="border border-sky-900 bg-[#020b12] p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-sky-450 uppercase tracking-wider">{activeCountry.name}</span>
                <span className="bg-sky-950 text-sky-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-sky-850">ISO: {activeCountryId}</span>
                <span className="bg-[#1b1000] text-[#ff9900] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#442200]">{activeGovType}</span>
              </div>
              <div className="text-[9px] text-gray-400 mt-1 uppercase">
                Geopolitical Realm: {activeRegion} // Capital Command: {activeCapital}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <div className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">GDP LEVEL</div>
                <div className="text-sm font-black text-[#00ccff]">
                  $<AnimatedValue target={activeGDP} formatter={(v) => v.toFixed(1)} />B USD
                </div>
              </div>
              <div className="text-right font-mono border-l border-sky-955 pl-3">
                <div className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">ANNUAL GROWTH</div>
                <div className={`text-sm font-black ${activeGrowthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <AnimatedValue target={activeGrowthRate} formatter={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)} />%
                </div>
              </div>
            </div>
          </div>

          {/* Business Cycle Stepper Tracker */}
          <div className="combat-panel flex flex-col gap-3 border border-sky-900 bg-[#010910] p-4 rounded text-xs shadow-md">
            <div className="flex justify-between items-center border-b border-sky-950 pb-1.5 uppercase">
              <span className="font-bold tracking-wider text-sky-400 text-[9.5px]">Sovereign Business Cycle Phase</span>
              <span className="bg-sky-950 text-sky-300 text-[8px] px-1.5 py-0.5 rounded font-mono border border-sky-900 uppercase">
                Trend Outlook: {activeTrend}
              </span>
            </div>

            {/* Stepper Grid map */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 my-1 font-mono text-[9px]">
              {[
                { id: 'EXPANSION', label: 'Expansion', desc: 'Solid growth, stable' },
                { id: 'OVERHEATING', label: 'Overheating', desc: 'Bubble indicators' },
                { id: 'SLOWDOWN', label: 'Slowdown', desc: 'Fading momentum' },
                { id: 'CONTRACTION', label: 'Contraction', desc: 'GDP decay risk' },
                { id: 'CRISIS', label: 'Sovereign Crisis', desc: 'Liquidity breakdown' },
                { id: 'STABILIZATION', label: 'Stabilization', desc: 'Restructuring cycle' },
                { id: 'RECOVERY', label: 'Recovery', desc: 'Rebounding output' },
              ].map((phase, idx) => {
                const isCurrent = activeCyclePhase === phase.id;
                return (
                  <div
                    key={phase.id}
                    className={`border p-2 rounded flex flex-col justify-between h-[58px] transition-all relative ${
                      isCurrent
                        ? 'border-sky-500 bg-[#092236]/70 text-sky-300 shadow-[0_0_8px_rgb(6,182,212,0.25)]'
                        : 'border-sky-950/40 bg-black/30 text-gray-500 hover:border-sky-950 hover:bg-black/50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold uppercase text-[8.5px] leading-tight flex items-center gap-1">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                        {idx + 1}. {phase.label}
                      </div>
                      <div className="text-[7.5px] text-gray-550 leading-tight mt-1">{phase.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent macro drivers explainers list */}
            <div className="bg-black/45 border border-sky-955 p-2 rounded text-[10px] mt-1 text-gray-300 leading-normal">
              <span className="font-bold text-sky-400 text-[8.5px] uppercase block mb-1">Active Macroeconomic System Drivers:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {activeDriversList.map((driver, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-gray-300 font-mono">
                    <span className="text-sky-500 font-bold">▪</span>
                    <span>{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable Fragility & Resilience Double Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fragility Index Column */}
            <div className="combat-panel flex flex-col gap-3 border border-red-900 bg-[#0d0103] p-4 rounded text-xs shadow-md">
              <div className="flex justify-between items-center border-b border-red-950 pb-1.5">
                <span className="font-extrabold text-red-400 uppercase text-[9.5px] tracking-wider">Geopolitical Fragility Matrix</span>
                <span className="bg-red-950 text-red-400 text-[9px] font-black font-mono border border-red-900 px-1.5 rounded animate-pulse">
                  SCORE: {activeFragility}%
                </span>
              </div>
              <p className="text-[9px] text-red-500 leading-normal mb-1 font-mono uppercase">
                Systemic vulnerability to external trade shocks, sanctions, and national popular unrest pressure.
              </p>

              {/* Dynamic computed audit list of active fragility drivers */}
              <div className="space-y-1 mt-1 font-mono text-[9.5px]">
                {(() => {
                  const fragilityBullets = [];
                  if (activeInflation > 7) {
                    fragilityBullets.push(`Sticky consumer CPI inflation stresses social stability [${activeInflation.toFixed(1)}%]`);
                  }
                  if (activeUnemployment > 8) {
                    fragilityBullets.push(`High unemployment reduces labor market capabilities [${activeUnemployment.toFixed(1)}%]`);
                  }
                  if (activeDebtRatio > 90) {
                    fragilityBullets.push(`Public debt strains sovereign interest servicing [${activeDebtRatio.toFixed(1)}% GDP]`);
                  }
                  const basePopulationReserves = activeCountry.population * 0.3;
                  if (activeReserves < basePopulationReserves) {
                    fragilityBullets.push(`Sovereign reserves pool is dangerously thin compared to population`);
                  }
                  if (activeShockLoad > 30) {
                    fragilityBullets.push(`Active external shock tension index represents heavy strain [${Math.round(activeShockLoad)}%]`);
                  }
                  const activeWars = activeCountryState?.atWarWith?.length || activeCountry.atWarWith?.length || 0;
                  if (activeWars > 0) {
                    fragilityBullets.push(`Country participating in active kinetic conflicts (${activeWars} fronts)`);
                  }
                  const sanctionsValue = activeEconState?.sanctionsExposure || 0; // fallback gracefully if present
                  if (sanctionsValue > 0) {
                    fragilityBullets.push(`Strict unilateral state trade sanctions active [Exposure: ${sanctionsValue}]`);
                  }
                  if (fragilityBullets.length === 0) {
                    fragilityBullets.push(`Sovereign operates sound, well-balanced industrial margins`);
                  }

                  return fragilityBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 p-1.5 border border-red-950/20 bg-red-950/5 rounded text-red-300">
                      <span className="text-red-500">⚡</span>
                      <span className="leading-tight">{bullet}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Resilience Index Column */}
            <div className="combat-panel flex flex-col gap-3 border border-emerald-900 bg-[#010803] p-4 rounded text-xs shadow-md">
              <div className="flex justify-between items-center border-b border-[#14321b] pb-1.5">
                <span className="font-extrabold text-emerald-400 uppercase text-[9.5px] tracking-wider">Shock Absorption Resilience</span>
                <span className="bg-emerald-950 text-emerald-400 text-[9px] font-black font-mono border border-emerald-900 px-1.5 rounded">
                  BUFFER: {activeResilience}%
                </span>
              </div>
              <p className="text-[9px] text-emerald-500 leading-normal mb-1 font-mono uppercase">
                Active strategic buffers, financial assets, diversification levels and treaties allowing shock absorption.
              </p>

              {/* Dynamic computed list of active resilience drivers */}
              <div className="space-y-1 mt-1 font-mono text-[9.5px]">
                {(() => {
                  const resilienceBullets = [];
                  const macroSectors = activeEconState?.sectors || {
                    energy: activeCountry.economic.sectors?.energy || 10,
                    agriculture: activeCountry.economic.sectors?.agriculture || 15,
                    manufacturing: activeCountry.economic.sectors?.manufacturing || 25,
                    tech: activeCountry.economic.sectors?.technology || 10,
                    services: activeCountry.economic.sectors?.services || 30,
                    defense: activeCountry.economic.sectors?.defense || 5,
                    state: 10
                  };
                  const sectorValues = [macroSectors.energy, macroSectors.agriculture, macroSectors.manufacturing, macroSectors.tech, macroSectors.services];
                  const meanSecStr = sectorValues.reduce((s, v) => s + v, 0) / sectorValues.length;
                  const varSecStr = sectorValues.reduce((s, v) => s + Math.pow(v - meanSecStr, 2), 0) / sectorValues.length;
                  const varDiv = Math.max(0, 30 - Math.sqrt(varSecStr) * 1.5);

                  if (varDiv > 15) {
                    resilienceBullets.push(`Low sector variance ensures balanced structural diversification`);
                  }
                  if (activeDebtRatio < 45) {
                    resilienceBullets.push(`Low public debt loads allow clean sovereign borrowing room`);
                  }
                  const basePopulationReserves = activeCountry.population * 0.8;
                  if (activeReserves > basePopulationReserves) {
                    resilienceBullets.push(`Robust central bank foreign reserves pipeline cash reserves [$${activeReserves.toFixed(1)}B]`);
                  }
                  if (activeCurrencyStability > 80) {
                    resilienceBullets.push(`High sovereign currency exchange rate stability defending imports`);
                  }
                  const activeAlliances = activeCountryState?.allianceIds || [];
                  if (activeAlliances.length > 0) {
                    resilienceBullets.push(`Active defense treaty coalition memberships (${activeAlliances.join(', ')})`);
                  }
                  if (macroSectors.tech > 20) {
                    resilienceBullets.push(`Substantial hardware fabrication tech sector base [${macroSectors.tech}% GDP]`);
                  }
                  if (resilienceBullets.length === 0) {
                    resilienceBullets.push(`Narrow industrial base; shock absorption capacity is heavily constrained`);
                  }

                  return resilienceBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 p-1.5 border border-emerald-950/20 bg-emerald-950/5 rounded text-emerald-300">
                      <span className="text-emerald-500">🛡️</span>
                      <span className="leading-tight">{bullet}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Sovereign Policy Posture selection deck */}
          <div className="combat-panel flex flex-col gap-3 border border-sky-900 bg-[#010910] p-4 rounded text-xs shadow-md">
            <h3 className="font-bold border-b border-sky-950 pb-1 uppercase tracking-wider text-sky-400 text-[10px]/1">
              {activeCountryId === countryId ? '🛠️ Interactive Sovereign Monetary Policy Posture' : '🛰️ AI Policy Posture (Observation Mode)'}
            </h3>
            <p className="text-[9.5px] text-gray-400 leading-normal lowercase normal-case mb-1">
              Monetary stances direct central bank parameters, giving targeted modifiers on growth rate, inflation rate, reserves drift, and popular friction. Posture updates execute live upon scheduler tick resolution.
            </p>

            <div className="flex flex-col md:flex-row gap-2 mt-1">
              {[
                { id: 'PRO_GROWTH', label: 'Pro-Growth Stimulus', desc: 'Prioritizes rapid liquidity and output growth.', consequences: '+GDP Growth | -FX Reserves | +Inflation CPI' },
                { id: 'AUSTERITY', label: 'Fiscal Austerity', desc: 'Aggressive spending cuts to stabilize public debt.', consequences: '-Debt Ratio | -GDP Growth | +FX Reserves' },
                { id: 'CURRENCY_DEFENSE', label: 'Currency Defense', desc: 'Rate hike currency defense shield to arrest drop.', consequences: '+Rate Hikes | -GDP Growth | -Imports price' },
                { id: 'IMPORT_SUPPORT', label: 'Import Subsidy', desc: 'Subsidizes critical agricultural food/energy baskets.', consequences: '--Inflation CPI | ---FX Reserves (Burn)' },
                { id: 'DEBT_STABILIZATION', label: 'Debt Re-alignment', desc: 'Renegotiates outstanding public treasury bonds.', consequences: '-Debt Stress Index | -Corporate Output path' },
              ].map((policyOption) => {
                const isActive = activePolicy === policyOption.id;
                const isPlayerSelf = activeCountryId === countryId;

                return (
                  <button
                    key={policyOption.id}
                    disabled={!isPlayerSelf}
                    onClick={() => handleAdjustPolicyPosture(policyOption.id as any)}
                    className={`flex-1 border p-2 text-left rounded transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_8px_rgb(34,211,238,0.2)] text-white'
                        : isPlayerSelf
                        ? 'border-[#1a3a1a] bg-black/40 text-gray-400 hover:border-gray-500 hover:text-white'
                        : 'border-[#1a1a1a] bg-black/20 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black uppercase text-[8.5px]">{policyOption.label}</span>
                      {isActive && <span className="text-[8px] bg-cyan-400 text-black font-extrabold px-1 rounded">ACTIVE</span>}
                    </div>
                    <div className="text-[7.5px] text-gray-550 leading-tight mt-1">{policyOption.desc}</div>
                    <div className="text-[7.5px] text-cyan-400/80 font-bold border-t border-sky-950/40 pt-1 mt-1 font-mono uppercase text-right leading-tight">
                      {policyOption.consequences}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Living Sparklines Plot Grids */}
          <div className="combat-panel flex flex-col gap-3 border border-sky-900 bg-[#010910] p-4 rounded text-xs shadow-md">
            <h3 className="font-bold border-b border-sky-950 pb-1.5 uppercase tracking-wider text-sky-400 text-[10px]/1">
              📊 Real-Time 12-Tick Macroeconomic Trend Lines
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1 font-mono">
              {[
                {
                  id: 'gdp',
                  title: 'GDP Output Index',
                  color: 'stroke-sky-450',
                  fillColor: 'fill-sky-950/20',
                  val: `$${activeGDP.toFixed(1)}B`,
                  desc: 'Gross Domestic Output value',
                  history: generateLivingHistory(activeCountryId + '_gdp', activeGDP, 1, 0.03)
                },
                {
                  id: 'inflation',
                  title: 'Consumer CPI Inflation',
                  color: 'stroke-amber-450',
                  fillColor: 'fill-amber-950/20',
                  val: `${activeInflation.toFixed(1)}%`,
                  desc: 'Annualized consumer basket drift',
                  history: generateLivingHistory(activeCountryId + '_infl', activeInflation, 1, 0.1)
                },
                {
                  id: 'unemployment',
                  title: 'Structural Unemployment',
                  color: 'stroke-red-455',
                  fillColor: 'fill-red-950/20',
                  val: `${activeUnemployment.toFixed(1)}%`,
                  desc: 'Acreage of jobless labor pools',
                  history: generateLivingHistory(activeCountryId + '_unemp', activeUnemployment, 1, 0.08)
                },
                {
                  id: 'shock',
                  title: 'Shock Load Friction',
                  color: 'stroke-rose-500',
                  fillColor: 'fill-rose-955/20',
                  val: `${Math.round(activeShockLoad)}%`,
                  desc: 'Accumulated trading stress load',
                  history: generateLivingHistory(activeCountryId + '_shock', activeShockLoad, 1, 0.14)
                },
              ].map((chart) => {
                const path = getSparklinePath(chart.history, 140, 40);
                const areaPath = path ? `${path} L 140,40 L 0,40 Z` : '';
                return (
                  <div key={chart.id} className="border border-sky-950 bg-black/40 p-2.5 rounded flex flex-col justify-between h-[105px] hover:bg-black/60 transition-colors">
                    <div>
                      <div className="text-[8px] text-gray-400 uppercase tracking-widest leading-none font-extrabold">{chart.title}</div>
                      <div className="text-sm font-black text-white mt-1 leading-none">{chart.val}</div>
                    </div>
                    
                    <div className="relative h-[40px] flex items-center justify-center my-1">
                      <svg className="w-full h-full" viewBox="0 0 140 40" preserveAspectRatio="none">
                        {/* Grid guides block */}
                        <line x1="0" y1="10" x2="140" y2="10" stroke="#123d53" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                        <line x1="0" y1="20" x2="140" y2="20" stroke="#123d53" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                        <line x1="0" y1="30" x2="140" y2="30" stroke="#123d53" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                        
                        {/* Shaded Area fill path */}
                        {areaPath && (
                          <path d={areaPath} className={`${chart.fillColor}`} opacity="0.35" />
                        )}
                        {/* Linework stroke path */}
                        {path && (
                          <path d={path} fill="none" className={`${chart.color}`} strokeWidth="1.5" />
                        )}
                      </svg>
                    </div>
                    
                    <div className="text-[7.5px] text-gray-550 lowercase tracking-tight leading-none leading-relaxed">
                      {chart.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {cbTab === 'MONETARY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="combat-panel flex justify-around items-center h-[112px] py-2 px-4 border border-[#1a3a1a] bg-[#030503] rounded">
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Treasury Cash</div>
                <div className="text-lg font-black text-[#00ff44]">$<AnimatedValue target={econ.treasuryCashB} formatter={(v) => v.toFixed(1)} />B</div>
              </div>
              <div className="text-center font-mono">
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Sovereign Debt</div>
                <div className="text-lg font-black text-[#ffb300]"><AnimatedValue target={econ.debtToGdpRatio} formatter={(v) => v.toFixed(1)} />% GDP</div>
              </div>
              <HexGauge label="Inflation Index" value={econ.inflationRate} color={econ.inflationRate > 12 ? 'red' : 'green'} />
            </div>

            <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
                POLICY INTEREST DISCOUNTS
              </h3>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 uppercase font-bold">Base Lending Interest Rate</span>
                  <span className="font-black text-white font-mono">{econ.interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.25"
                  value={econ.interestRate}
                  onChange={(e) => handleAdjustInterest(parseFloat(e.target.value))}
                  className="w-full bg-[#0d1f0d] border border-[#1a3a1a] h-1.5 rounded outline-none accent-[#55ff77] cursor-pointer"
                />
                <p className="text-[8px] text-gray-500 leading-normal uppercase mt-1">
                  ↑ cooling rates decreases inflation but spikes interest service payments and limits GDP ratios.
                </p>
              </div>

              <div className="border-t border-[#1a3a1a] pt-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-300">Liquidity Printing Press:</div>
                  <div className="text-[9px] text-gray-550 uppercase">
                    {econ.printingPressActive ? 'ON — ACCUMULATING LIQUIDITY' : 'STANDBY'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {econ.printingPressActive && (
                    <select
                      value={econ.printingPressIntensity}
                      onChange={(e) => handlePressIntensity(parseInt(e.target.value))}
                      className="bg-[#030503] border border-[#1a3a1a] text-[#ffb300] outline-none text-[10px] p-1 font-mono uppercase rounded cursor-pointer"
                    >
                      <option value="1">1x Speed</option>
                      <option value="2">2x Speed</option>
                      <option value="3">3x Speed</option>
                      <option value="5">5x Speed</option>
                    </select>
                  )}
                  <button
                    onClick={handleTogglePress}
                    className={`px-3 py-1 font-bold uppercase text-[9px] rounded cursor-pointer transition-all active:translate-y-0.5 relative group ${
                      econ.printingPressActive
                        ? 'border-[#ff2244] text-[#ff2244] bg-[#2d0005] hover:bg-[#4d000a]'
                        : 'border-[#00ff44] text-[#00ff44] bg-[#021c02] hover:bg-[#063306]'
                    }`}
                  >
                    {econ.printingPressActive ? 'HALT PRESS' : 'ENABLE PRESS'}
                    <span className="absolute -top-1.5 -right-1.5 bg-[#1a1a1a] text-gray-400 border border-[#444] text-[6px] font-mono font-bold px-1 rounded transition-opacity">ALT+P</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00e5ff] text-[10px]/1">
                SOVEREIGN BOND OUTLET
              </h3>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  <span className="text-[8px] text-gray-500 font-bold block mb-1">BILLS RELEASE AMT</span>
                  <input
                    type="number"
                    value={bondAmt}
                    onChange={(e) => setBondAmt(Math.max(1, parseInt(e.target.value)))}
                    className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 font-bold block mb-1">APY YIELD RATE</span>
                  <input
                    type="number"
                    step="0.1"
                    value={bondRate}
                    onChange={(e) => setBondRate(Math.max(0.1, parseFloat(e.target.value)))}
                    className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
                  />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 font-bold block mb-1">MATURITY Ticks</span>
                  <input
                    type="number"
                    value={bondTicks}
                    onChange={(e) => setBondTicks(Math.max(5, parseInt(e.target.value)))}
                    className="w-full bg-[#030503] border border-[#1a3a1a] text-[#00e5ff] text-xs font-mono p-1 rounded outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 font-mono">
                <button
                  onClick={handleIssueBonds}
                  className="flex-1 px-3 py-1.5 bg-[#002f3c] border border-[#00e5ff] text-[#00e5ff] rounded hover:bg-[#004e63] font-bold uppercase text-[9px] cursor-pointer transition-all active:translate-y-0.5 relative group"
                >
                  DISTRIBUTE BILL RELEASES
                  <span className="absolute -top-1.5 -right-1 bg-black text-cyan-400 border border-current text-[6.5px] font-mono font-bold px-1 rounded transition-opacity">ALT+B</span>
                </button>
                <button
                  onClick={handleDefaultSovereign}
                  className="px-3 py-1.5 border border-red-900 text-red-500 hover:bg-[#ff2244]/15 rounded font-bold uppercase text-[9px] cursor-pointer transition-all"
                >
                  DECLARE DEFAULT
                </button>
              </div>
            </div>

            <div className="combat-panel flex flex-col gap-3 border border-[#1a4a1a] bg-[#030503] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#3c2a00] pb-1 uppercase tracking-wider text-[#ffb300] text-[10px]/1">
                TACTICAL BAZAAR OVER COVERT NETWORKS (${playerCountry.intelligence.blackBudgetB.toFixed(1)}B)
              </h3>
              <div className="space-y-1.5">
                {[
                  { id: 'CRUISE_MISSILE', name: '5x Cruise Missile Battery', price: 3.0, text: 'Secret guidance payloads.' },
                  { id: 'DRONE_SWARM', name: '5x Drone Swarms Aviation', price: 2.0, text: 'Asymmetric recon swarms.' },
                  { id: 'EMP_DEVICE', name: '1x Atmospheric EMP Ordnance', price: 6.0, text: 'High altitude infrastructure grid shocker.' }
                ].map((arm) => (
                  <div key={arm.id} className="border border-amber-900 bg-[#030503] p-1.5 flex justify-between items-center text-[10px] rounded hover:bg-[#0e0701] transition-colors">
                    <div>
                      <div className="font-bold text-[#ffb300] text-[9.5px] uppercase">{arm.name}</div>
                      <div className="text-[8px] text-gray-500 lowercase">{arm.text}</div>
                    </div>
                    <button
                      onClick={() => handleBuyBlackMarket(arm.id, arm.price)}
                      className="px-2 py-1 border border-amber-600 text-[#ffb300] hover:bg-[#ffb300]/15 rounded cursor-pointer font-bold uppercase text-[9px] transition-colors"
                    >
                      Procure (${arm.price}B)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {cbTab === 'SECTORS' && (
        <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner">
          <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
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
                <div key={sect.id} className="border border-[#1a3a1a] bg-[#020502] p-3 rounded space-y-2 hover:bg-[#050e05] transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-200 uppercase tracking-wide text-[10px]">{sect.label}</span>
                    <span className="font-mono text-[#00ff44] font-black">${val.toFixed(1)}B ({pct}%)</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 screen-vulnerability">
          {/* Supply Chain dependencies */}
          <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded shadow-inner text-xs">
            <h3 className="font-bold border-b border-[#1a3a1a] pb-1.5 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
              ⛓️ GLOBAL SUPPLY CHAIN DEPENDENCIES
            </h3>
            <p className="text-[10px] text-gray-500 leading-normal mb-2">
              Low self-reliance creates bottleneck vulnerabilities. If high semiconductor dependency exists and semiconductor suppliers (TW/KR) are disrupted, defense and tech sectors slip.
            </p>

            <div className="space-y-3 font-mono">
              {[
                { id: 'energyDependency', label: '⚡ Energy Supply Dependency', color: 'bg-amber-500', path: 'Oil dependency metrics' },
                { id: 'foodDependency', label: '🌾 Sustenance Food Dependency', color: 'bg-emerald-500', path: 'Wheat dependency metrics' },
                { id: 'semiconductorDependency', label: '💾 Microchips & Semiconductors', color: 'bg-purple-500', path: 'Assembled microchips dependency' },
                { id: 'defenseDependency', label: '🛡️ Defense Ordinance imports', color: 'bg-red-500', path: 'Armaments dependency' }
              ].map((dep) => {
                const val = supply ? (supply[dep.id as keyof SupplyChains] || 0) : 25;
                return (
                  <div key={dep.id} className="space-y-1">
                    <div className="flex justify-between font-mono text-[9.5px]">
                      <span className="text-gray-400 font-bold uppercase">{dep.label}</span>
                      <span className={`font-black ${val > 60 ? 'text-[#ff2244] animate-pulse' : 'text-green-500'}`}>{val}%</span>
                    </div>
                    <div className="w-full bg-black/40 border border-[#1a1a1a] h-1.5 rounded overflow-hidden">
                      <div className={`${dep.color} h-full`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Markets indicators */}
            <div className="combat-panel flex flex-col gap-3 border border-[#1a3a1a] bg-[#030503] p-4 rounded text-xs shadow-md">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00e5ff] text-[10px]/1">
                📈 BORSE EXCHANGES & CREDIT RATING
              </h3>
              <div className="space-y-2.5 font-mono text-[10.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">CREDIT RATING:</span>
                  <span className="font-black text-[#00ff44] bg-[#0d2a10] border border-[#1a5d20] px-1.5 py-0.5 text-xs rounded uppercase">
                    {markets?.sovereignRating || 'AAA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">Stock Index Level:</span>
                  <span className="font-bold text-white">
                    {markets ? Math.round(markets.stockMarketIndex).toLocaleString() : '10,000'} PTS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">Bond APY Interest:</span>
                  <span className="font-bold text-shadow text-[#00e5ff]">{markets?.bondYield}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 uppercase">Currency Value:</span>
                  <span className="font-bold text-white">{markets?.currencyMarketValue} index</span>
                </div>
              </div>
            </div>

            {/* Commodities index */}
            <div className="combat-panel flex flex-col gap-2 border border-[#1a3a1a] bg-[#030503] p-4 rounded">
              <h3 className="font-bold border-b border-[#1a3a1a] pb-1 uppercase tracking-wider text-[#00ff44] text-[10px]/1">
                RESOURCE DECK SPOT RATES
              </h3>
              <div className="space-y-1">
                {commodityMarkets.map((m) => {
                  const path = getSparklinePath(m.priceHistory);
                  return (
                    <div key={m.type} className="border border-[#0d1f0d] p-1.5 flex justify-between items-center bg-[#030503] rounded">
                      <span className="font-mono text-[9px] font-bold text-[#00e5ff] uppercase">{m.type}</span>
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
    </PanelFxShell>
  );
}
