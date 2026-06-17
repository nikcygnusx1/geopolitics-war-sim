import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Coins, 
  Globe, 
  ChevronRight, 
  Info, 
  Lock, 
  PlusCircle, 
  Activity, 
  X, 
  Zap, 
  AlertTriangle, 
  FileText, 
  RotateCw, 
  Sliders, 
  TrendingDown, 
  Check, 
  Eye, 
  AlertOctagon 
} from 'lucide-react';
import { useSanctionsStore, ALL_MEASURES } from '../../store/sanctionsStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { SanctionsTierType, CoalitionMemberRole, EvasionChannel } from '../../types/sanctions';

export default function SanctionsPanel() {
  const { 
    campaigns, 
    incidents, 
    selectedCampaignId, 
    activeMapOverlay, 
    setSelectedCampaignId, 
    setActiveMapOverlay,
    proposeCampaign,
    assembleCoalitionSupport,
    toggleMeasure,
    escalateCampaignTier,
    influenceCoalitionMember,
    deployEvasionChannel,
    shutDownEvasionChannel,
    calculatePreview
  } = useSanctionsStore();

  const worldCountries = useWorldStore((s) => s.countries);
  const currentTick = useWorldStore((s) => s.currentTick);
  const playerCountryId = usePlayerStore((s) => s.countryId) || 'US';

  // Local state managers
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('RU');
  const [formLegitimacy, setFormLegitimacy] = useState<'HUMANITARIAN' | 'DEFENSIVE' | 'ALLIANCE_SOLIDARITY' | 'LAW_ENFORCEMENT' | 'UNILATERAL_PRESSURE'>('DEFENSIVE');
  const [formJustification, setFormJustification] = useState('');

  // Local state for deploying new evasion channel
  const [showEvasionForm, setShowEvasionForm] = useState(false);
  const [evasionName, setEvasionName] = useState('');
  const [evasionType, setEvasionType] = useState<'GRAY_MARKET' | 'PAYMENT_WORKAROUND' | 'PARTNER_REORIENTATION'>('GRAY_MARKET');
  const [evasionPartner, setEvasionPartner] = useState('CN');
  const [evasionCap, setEvasionCap] = useState(25);
  const [evasionLeakage, setEvasionLeakage] = useState(65);

  const campaignsArray = Object.values(campaigns);
  const activeCampaign = selectedCampaignId ? campaigns[selectedCampaignId] : campaignsArray[0] || null;

  // Render metrics ribbon
  const totalSystemicPressure = campaignsArray.reduce((sum, c) => sum + (c.status === 'ACTIVE' ? c.targetPressureScore : 0), 0);
  const activeEmbargoes = ALL_MEASURES.filter(m => campaignsArray.some(c => c.status === 'ACTIVE' && c.activeMeasures.includes(m.id))).length;
  const avgFatigue = campaignsArray.length > 0 
    ? Math.round(campaignsArray.reduce((sum, c) => sum + c.allyFatigueScore, 0) / campaignsArray.length) 
    : 0;

  const handleProposeCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formTarget || !formJustification) return;
    proposeCampaign(formName, playerCountryId, [formTarget], formLegitimacy, formJustification);
    setShowForm(false);
    setFormName('');
    setFormJustification('');
  };

  const handleDeployEvasionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign || !evasionName) return;
    deployEvasionChannel(activeCampaign.id, {
      name: evasionName,
      type: evasionType,
      partnerCountryId: evasionPartner,
      capacityMtoeOrValueB: Number(evasionCap),
      enforcementLeakagePct: Number(evasionLeakage)
    });
    setShowEvasionForm(false);
    setEvasionName('');
  };

  // Preview data based on slider state, using the active campaign
  const previewData = activeCampaign 
    ? calculatePreview(activeCampaign.initiatorCountryId, activeCampaign.targetCountryIds, activeCampaign.campaignTier, activeCampaign.activeMeasures)
    : null;

  return (
    <PanelFxShell panelId="sanctions" relevantFxTypes={['SANCTIONS_ESCALATION','ECONOMIC_COLLAPSE','MARKET_CRASH']}>
      <div id="sanctions-architecture-console" className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col font-sans">
      
      {/* HEADER SECTION WITH DESIGN SPEC DETAILS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-amber-200">
              COERCIVE ECONOMIC WARFARE COMMAND
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
            Sanctions Architecture Matrix // Dynamic Coalition-Building ENGINE // Evasion Countermeasures Node
          </p>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0 font-mono text-xs">
          <button 
            onClick={() => setActiveMapOverlay(activeMapOverlay === 'PRESSURE' ? 'NONE' : 'PRESSURE')}
            className={`px-3 py-1.5 rounded border transition-all ${
              activeMapOverlay === 'PRESSURE' 
                ? 'bg-red-950/80 border-red-500 text-red-300 shadow-lg shadow-red-950/20' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            🛰️ OVERLAY: PRESSURE
          </button>
          <button 
            onClick={() => setActiveMapOverlay(activeMapOverlay === 'FATIGUE' ? 'NONE' : 'FATIGUE')}
            className={`px-3 py-1.5 rounded border transition-all ${
              activeMapOverlay === 'FATIGUE' 
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/20' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            🤝 OVERLAY: FATIGUE
          </button>
        </div>
      </header>

      {/* METRICS INDEX RIBBON */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center gap-4">
          <div className="p-3 rounded bg-red-950/50 border border-red-900/50 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Net Coercive Cohesion</div>
            <div className="text-xl font-bold text-slate-100 font-mono">{totalSystemicPressure}%</div>
            <div className="text-[10px] text-red-400 font-mono">target stress index</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center gap-4">
          <div className="p-3 rounded bg-amber-950/50 border border-amber-900/50 text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Avg Coalition Fatigue</div>
            <div className="text-xl font-bold text-slate-100 font-mono">{avgFatigue}%</div>
            <div className="text-[10px] text-amber-400 font-mono">system fatigue load</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center gap-4">
          <div className="p-3 rounded bg-blue-950/50 border border-blue-900/50 text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Active Heavy Embargoes</div>
            <div className="text-xl font-bold text-slate-100 font-mono">{activeEmbargoes}</div>
            <div className="text-[10px] text-blue-400 font-mono">restricted channels</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded p-4 flex items-center gap-4">
          <div className="p-3 rounded bg-emerald-950/50 border border-emerald-900/50 text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">World Epoch Ticks</div>
            <div className="text-xl font-bold text-slate-100 font-mono">T-#{currentTick}</div>
            <div className="text-[10px] text-emerald-400 font-mono">continuous timeline</div>
          </div>
        </div>
      </section>

      {/* SYSTEM CRADLE MAP OVERLAY ALERT BAR */}
      <AnimatePresence>
        {activeMapOverlay !== 'NONE' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 animate-pulse" />
              <p className="text-xs text-slate-300">
                <span className="font-mono text-emerald-400 font-bold uppercase mr-1">🛰️ SAT MAP OVERLAY INJECTED:</span>
                Currently viewing live <span className="font-bold underline text-white">{activeMapOverlay}</span> metrics scaled globally on the central workspace layout.
              </p>
            </div>
            <button 
              onClick={() => setActiveMapOverlay('NONE')} 
              className="text-slate-500 hover:text-slate-300 text-xs px-2"
            >
              [DISMISS]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT BAR: CAMPAIGN INDEX (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono">
                Active & Proposed Campaigns
              </h2>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="p-1 rounded bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-slate-700 transition"
                title="Propose new campaign"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            {/* PROPONENT DIALOG */}
            {showForm && (
              <form onSubmit={handleProposeCampaignSubmit} className="bg-slate-950 border border-slate-800 rounded p-3 mb-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                  <span className="text-xs font-bold font-mono text-emerald-400">PROPOSE NEW MEASURE</span>
                  <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-mono mb-1">Campaign Name</label>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="e.g. Iron Fortress Pact"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-mono mb-1">Target Geopolitical State</label>
                  <select 
                    value={formTarget} 
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  >
                    <option value="RU">RU - Russian Federation</option>
                    <option value="CN">CN - People's Republic of China</option>
                    <option value="IR">IR - Islamic Republic of Iran</option>
                    <option value="BR">BR - Federative Republic of Brazil</option>
                    <option value="SA">SA - Kingdom of Saudi Arabia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-mono mb-1">Legitimacy Justification Framing</label>
                  <select 
                    value={formLegitimacy} 
                    onChange={(e) => setFormLegitimacy(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                  >
                    <option value="DEFENSIVE">DEFENSIVE (Sovereign Buffer Defense)</option>
                    <option value="HUMANITARIAN">HUMANITARIAN (Civil Protection Protocols)</option>
                    <option value="ALLIANCE_SOLIDARITY">ALLIANCE SOLIDARITY (Bloc Security)</option>
                    <option value="LAW_ENFORCEMENT">LAW ENFORCEMENT (Maritime Law Accords)</option>
                    <option value="UNILATERAL_PRESSURE">UNILATERAL PRESSURE (Strategic Enclosure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-mono mb-1">Public Strategic Policy Directive</label>
                  <textarea 
                    value={formJustification} 
                    onChange={(e) => setFormJustification(e.target.value)}
                    placeholder="Provide full legal/strategic justification..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-1 bg-emerald-950 border border-emerald-500 hover:bg-emerald-900 text-emerald-300 font-mono text-xs rounded uppercase font-bold"
                >
                  🚀 INITIATE PAC LOBBY
                </button>
              </form>
            )}

            <div className="space-y-2">
              {campaignsArray.map((c) => {
                const isSelected = activeCampaign?.id === c.id;
                const statusColor = 
                  c.status === 'ACTIVE' ? 'bg-emerald-500' :
                  c.status === 'ASSEMBLING' ? 'bg-amber-400' : 'bg-slate-500';

                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                      isSelected 
                        ? 'bg-slate-800/80 border-rose-500 shadow-md shadow-rose-950/20' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-xs truncate max-w-[80%]">{c.name}</h3>
                      <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                      <span>Initiator: {c.initiatorCountryId}</span>
                      <span>Target: {c.targetCountryIds.join(', ')}</span>
                    </div>

                    {/* Miniature stats indicators */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                      <div>Pressure: <span className="text-slate-100 font-bold">{c.targetPressureScore}%</span></div>
                      <div>Fatigue: <span className="text-amber-400 font-bold">{c.allyFatigueScore}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Core System Capabilities
            </h3>
            <ul className="space-y-2 font-mono text-[10px] text-slate-400">
              <li className="flex items-start gap-1 p-1 bg-slate-950 rounded">
                <span className="text-rose-400">⚡</span>
                <span>Tier Scale ranges from Targeted Asset Freezes to total SWIFT Isolation.</span>
              </li>
              <li className="flex items-start gap-1 p-1 bg-slate-950 rounded">
                <span className="text-rose-400">⚡</span>
                <span>Asymmetric blowback scales inflation rate & domestic dissatisfaction.</span>
              </li>
              <li className="flex items-start gap-1 p-1 bg-slate-950 rounded">
                <span className="text-rose-400">⚡</span>
                <span>Gray market evasion corridors require tactical G7 shutdowns.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MIDDLE COLUMN: TIER STAIRCASE & CAMPAIGN CONTROLS (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {activeCampaign ? (
              <motion.div 
                key={activeCampaign.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-6"
              >
                
                {/* CAMPAIGN METRICS RIBBON */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                  <div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded font-bold uppercase">
                      Campaign Ledger: {activeCampaign.id}
                    </span>
                    <h2 className="text-lg font-bold text-slate-100 mt-1">{activeCampaign.name}</h2>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">
                      Posture: {activeCampaign.legitimacyPosture} // Initiated Tick #{activeCampaign.startTick}
                    </p>
                  </div>

                  {activeCampaign.status === 'PROPOSED' ? (
                    <button 
                      onClick={() => assembleCoalitionSupport(activeCampaign.id)}
                      className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 border border-emerald-500 rounded text-xs font-mono font-bold text-emerald-200 uppercase tracking-wider"
                    >
                      🤝 Assembled Coalition Support
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-center font-mono text-[10px]">
                        <span className="block text-slate-500">PRESSURE INDEX</span>
                        <span className="text-sm font-bold text-rose-500">{activeCampaign.targetPressureScore}%</span>
                      </div>
                      <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-center font-mono text-[10px]">
                        <span className="block text-slate-500">BLOWBACK INDEX</span>
                        <span className="text-sm font-bold text-amber-500">{activeCampaign.sanctionerBlowbackScore}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ESCALATION STAIRCASE TIER SLIDER/LADDER */}
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-slate-400 mb-3 flex items-center justify-between">
                    <span>COERCIVE TIERS STAIRCASE LADDER</span>
                    <span className="text-yellow-400 text-[10px]">ACTIVE LEVEL: {activeCampaign.campaignTier.replace('_', ' ')}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                    {[
                      { id: 'TIER_1_TARGETED', title: 'Tier 1: Targeted', desc: 'Sovereign asset freezes, elite bans' },
                      { id: 'TIER_2_SECTORAL', title: 'Tier 2: Sectoral', desc: 'Dual-use tech, industrial exports' },
                      { id: 'TIER_3_FINANCIAL_TRADE', title: 'Tier 3: Financial', desc: 'Exclusion from Switft, capital bans' },
                      { id: 'TIER_4_TOTAL_EXCLUSION', title: 'Tier 4: Exclusion', desc: 'All-sector secondary blockade' }
                    ].map((step, idx) => {
                      const isCurrent = activeCampaign.campaignTier === step.id;
                      const isActiveRange = (() => {
                        const tiers = ['TIER_1_TARGETED', 'TIER_2_SECTORAL', 'TIER_3_FINANCIAL_TRADE', 'TIER_4_TOTAL_EXCLUSION'];
                        const activeIdx = tiers.indexOf(activeCampaign.campaignTier);
                        return idx <= activeIdx;
                      })();

                      return (
                        <div 
                          key={step.id}
                          onClick={() => activeCampaign.status !== 'PROPOSED' && escalateCampaignTier(activeCampaign.id, step.id as any)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                            isCurrent 
                              ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/20' 
                              : isActiveRange 
                                ? 'bg-slate-900 border-rose-900/40 text-slate-200' 
                                : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] font-mono block mb-1">STAIR {idx + 1}</span>
                            <h4 className="font-bold text-xs">{step.title}</h4>
                            <p className="text-[10px] mt-1 leading-tight">{step.desc}</p>
                          </div>

                          <div className="mt-3 flex justify-between items-center text-[9px] font-mono">
                            {isActiveRange ? (
                              <span className="text-rose-400 font-bold uppercase">● Active</span>
                            ) : (
                              <span className="text-slate-600 font-bold uppercase">○ Locked</span>
                            )}
                            {isCurrent && <Zap className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MODULAR MEASURES CHECKBOX TILES */}
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-slate-400 mb-3">
                    Active Camapign Measures Configurer
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ALL_MEASURES.filter(m => {
                      // Filter based on selected tier to show contextually matching measures
                      return true; 
                    }).map((m) => {
                      const activeInCampaign = activeCampaign.activeMeasures.includes(m.id);

                      return (
                        <div 
                          key={m.id}
                          onClick={() => activeCampaign.status !== 'PROPOSED' && toggleMeasure(activeCampaign.id, m.id)}
                          className={`p-3 rounded-lg border flex items-start gap-3 text-left cursor-pointer transition ${
                            activeInCampaign 
                              ? 'bg-slate-950 border-indigo-500 text-slate-100 shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-800'
                          }`}
                        >
                          <div className="mt-0.5">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              activeInCampaign 
                                ? 'border-indigo-500 bg-indigo-950 text-indigo-400' 
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {activeInCampaign && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs">{m.name}</span>
                              <span className="text-[8px] bg-slate-900 border border-slate-800 font-mono px-1 rounded-sm text-slate-400">
                                {m.tier.replace('TIER_', 'T')}
                              </span>
                            </div>
                            <p className="text-[10px] line-clamp-2">{m.description}</p>
                            <div className="flex gap-3 text-[9px] font-mono text-slate-500 pt-1">
                              <span>Pressure: <span className="text-rose-400 font-bold">+{m.coerciveImpact}</span></span>
                              <span>Blowback: <span className="text-amber-400 font-medium">+{m.blowbackCost}</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TARGET EVASION CONTROLS (GRAY MARKETS, PAYMENTS, CORRIDORS) */}
                <div className="border-t border-slate-800 pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold font-mono uppercase text-slate-400">
                        Target Evasion Channels & Countermeasures
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Seventeen alternative payment and gray market leakages detected.
                      </p>
                    </div>

                    <button 
                      onClick={() => setShowEvasionForm(!showEvasionForm)}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 text-[10px] font-mono text-indigo-300 rounded hover:bg-slate-700"
                    >
                      [+ SEED EVASION TRADELINK]
                    </button>
                  </div>

                  {/* DEPLOY EVASION WIDGET */}
                  {showEvasionForm && (
                    <form onSubmit={handleDeployEvasionSubmit} className="bg-slate-950 border border-slate-800 rounded p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                        <span className="text-xs font-bold font-mono text-indigo-400">DEPLOY DUAL EVASION WATERWAY</span>
                        <button type="button" onClick={() => setShowEvasionForm(false)} className="text-slate-500 hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase text-slate-500 font-mono mb-1">Channel Label</label>
                          <input 
                            type="text" 
                            value={evasionName} 
                            onChange={(e) => setEvasionName(e.target.value)} 
                            placeholder="e.g. Caspian Ghost Fleet pipeline"
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase text-slate-500 font-mono mb-1">Evasion System Mechanism</label>
                          <select 
                            value={evasionType} 
                            onChange={(e) => setEvasionType(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                          >
                            <option value="GRAY_MARKET">GRAY MARKET (Product Re-routing)</option>
                            <option value="PAYMENT_WORKAROUND">PAYMENT WORKAROUND (Shadow Financial Core)</option>
                            <option value="PARTNER_REORIENTATION">PARTNER REORIENTATION (Primary Substitutions)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase text-slate-500 font-mono mb-1">Intermediary Partner State</label>
                          <select 
                            value={evasionPartner} 
                            onChange={(e) => setEvasionPartner(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono"
                          >
                            <option value="IN">IN - Republic of India</option>
                            <option value="CN">CN - People's Republic of China</option>
                            <option value="SA">SA - Kingdom of Saudi Arabia</option>
                            <option value="BR">BR - Federative Republic of Brazil</option>
                            <option value="RU">RU - Russian Federation</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] uppercase text-slate-500 font-mono mb-1">Enforcement Leakage Capacity ({evasionCap}B)</label>
                          <input 
                            type="range" 
                            min="5" 
                            max="100" 
                            value={evasionCap} 
                            onChange={(e) => setEvasionCap(Number(e.target.value))} 
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-1 bg-indigo-950 border border-indigo-500 hover:bg-indigo-900 text-indigo-300 font-mono text-[10px] rounded uppercase font-bold"
                      >
                        ⚡ SEED WORKAROUND
                      </button>
                    </form>
                  )}

                  {/* EVASION ITERATOR STATS CARD */}
                  <div className="space-y-2">
                    {activeCampaign.evasionChannels.length === 0 ? (
                      <div className="bg-slate-950 border border-slate-800/80 rounded p-4 text-center text-xs text-slate-500 font-mono">
                        No active evasion channels detected. Targets compliance appears nominal.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {activeCampaign.evasionChannels.map((ch) => {
                          return (
                            <div 
                              key={ch.id} 
                              className={`p-3 bg-slate-950 border rounded-lg text-left transition flex flex-col justify-between ${
                                ch.isShutDown 
                                  ? 'border-slate-900 opacity-40' 
                                  : 'border-slate-800 shadow shadow-indigo-950/20'
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-xs truncate max-w-[70%]">{ch.name}</span>
                                  <span className={`text-[8px] px-1 font-mono rounded uppercase font-bold ${
                                    ch.isShutDown 
                                      ? 'bg-slate-800 text-slate-400' 
                                      : ch.type === 'GRAY_MARKET' 
                                        ? 'bg-red-950/60 border border-red-500 text-red-300' 
                                        : 'bg-indigo-950/60 border border-indigo-500 text-indigo-300'
                                  }`}>
                                    {ch.type.replace('_', ' ')}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-2 text-slate-400">
                                  <div>Route: <span className="text-white font-bold">{ch.partnerCountryId}</span></div>
                                  <div>Volume: <span className="text-white font-bold">${ch.capacityMtoeOrValueB}B/yr</span></div>
                                  <div>Leakage: <span className="text-amber-400 font-bold">{ch.enforcementLeakagePct}%</span></div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-slate-900 flex justify-between items-center">
                                <span className="text-[8px] text-slate-500 font-mono">ACTIVE SINCE T-#{ch.activeSinceTick}</span>
                                {!ch.isShutDown ? (
                                  <button 
                                    onClick={() => shutDownEvasionChannel(activeCampaign.id, ch.id)}
                                    className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 border border-rose-500 text-[9px] font-mono text-rose-300 rounded uppercase font-bold"
                                  >
                                    CHOKE PATHWAY
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-slate-500 font-mono italic uppercase">[CHOKED]</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-10 text-center text-slate-400">
                Please select or propose a coercive-economic campaign in the left channel roster.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: COALITION BUILDING & PREVIEWS (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-400 mb-4 flex items-center justify-between">
              <span>Coalition Building Hub</span>
              <span className="text-blue-400 text-[10px]">Matrix</span>
            </h3>

            {activeCampaign && (
              <div className="space-y-3.5">
                {Object.values(activeCampaign.members).map((member) => {
                  const countryName = worldCountries[member.countryId]?.political?.leaderName || member.countryId;
                  const isInitiator = member.countryId === activeCampaign.initiatorCountryId;

                  let roleBadgeColor = 'bg-slate-950 border-slate-800 text-slate-500';
                  if (member.role === 'LEAD_SPONSOR') roleBadgeColor = 'bg-rose-950/60 border border-rose-500 text-rose-300';
                  if (member.role === 'FULL_PARTICIPANT') roleBadgeColor = 'bg-emerald-950/60 border border-emerald-500 text-emerald-300';
                  if (member.role === 'RELUCTANT_PARTICIPANT') roleBadgeColor = 'bg-amber-950/60 border border-amber-500 text-amber-300';
                  if (member.role === 'SPOILER_BLOCKER') roleBadgeColor = 'bg-red-950/60 border border-red-500 text-red-300';
                  if (member.role === 'SILENT_ENABLER') roleBadgeColor = 'bg-indigo-950/60 border border-indigo-500 text-indigo-300';

                  return (
                    <div key={member.countryId} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-xs">{member.countryId}</span>
                          <span className="text-[9px] text-slate-500 block">Leader: {countryName}</span>
                        </div>
                        <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-bold font-mono ${roleBadgeColor}`}>
                          {member.role.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                        <div>Aln Affinity: <span className="text-white">{member.alignmentAffinity}%</span></div>
                        <div>Exposure: <span className="text-amber-400">{member.economicExposureToTarget}%</span></div>
                        <div>Fatigue Level: <span className="text-rose-400">{member.allyFatigueLevel}%</span></div>
                        <div>Willingness: <span className="text-indigo-400">{member.participationWillingness}%</span></div>
                      </div>

                      {/* Interactive Sweeteners/Coercions */}
                      {!isInitiator && member.isParticipating && member.countryId !== playerCountryId && (
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          <button 
                            onClick={() => influenceCoalitionMember(activeCampaign.id, member.countryId, 'DIPLOMATIC_SWEETENER')}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded font-mono text-[8px] text-emerald-400 py-1"
                            title="Apply economic sweetener, lowers fatigue"
                          >
                            Sweeten
                          </button>
                          <button 
                            onClick={() => influenceCoalitionMember(activeCampaign.id, member.countryId, 'PUBLIC_PRESSURE')}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded font-mono text-[8px] text-blue-400 py-1"
                            title="Mobilize popular opinion pressure"
                          >
                            Pressure
                          </button>
                          <button 
                            onClick={() => influenceCoalitionMember(activeCampaign.id, member.countryId, 'COERCION')}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded font-mono text-[8px] text-red-400 py-1"
                            title="Enforce compliance under secondary threats"
                          >
                            Coerce
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ESCALATION ACTION PREVIEW FOR SYSTEM DEPTH */}
          {previewData && (
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-4 space-y-4">
              <h3 className="text-xs font-bold font-mono uppercase text-slate-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Sliders className="w-3.5 h-3.5 text-rose-500" /> Pre-execution Impact Estimator
              </h3>

              <div className="space-y-3 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>Expected Coalition Consensus:</span>
                  <span className="text-emerald-400 font-bold">{previewData.expectedCoalitionSupport}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Enforcement Compliance:</span>
                  <span className="text-blue-400 font-bold">{previewData.complianceStrengthAssumption}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Evasion Leakage:</span>
                  <span className="text-amber-400 font-bold">{previewData.expectedEvasionLeakage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Inflation Spike (Initiator):</span>
                  <span className="text-amber-500 font-bold">+{previewData.inflationImpactOnInitiatorPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quarterly GDP Drag (Target):</span>
                  <span className="text-rose-500 font-bold">-{previewData.gdpImpactOnTargetPct}%</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-850 rounded text-[9px] font-mono text-slate-500 italic">
                Note: Estimator factors in G7 alternative payment lines, SWIFT leakage rates, and partner reorientation parameters.
              </div>
            </div>
          )}
        </div>

      </section>

      {/* FOOTER TIMELINE JOURNAL LOGS */}
      <footer className="mt-8 border-t border-slate-800 pt-5">
        <h2 className="text-xs font-bold font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
          <span>COERCIVE SYSTEM CRITICAL INTEGRITY TIMELINE LOG</span>
          <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-[9px] text-rose-400">ARCHNE LINKED</span>
        </h2>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-h-[180px] overflow-y-auto space-y-2">
          {incidents.slice(0, 10).map((inc) => {
            const severityColor = 
              inc.severity === 'CRITICAL' ? 'text-red-400 bg-red-950/40 border border-red-900/30' :
              inc.severity === 'WARNING' ? 'text-amber-400 bg-amber-950/40 border border-amber-900/30' : 
              'text-blue-400 bg-blue-950/40 border border-blue-900/30';

            return (
              <div key={inc.id} className="flex gap-4 p-2 bg-slate-950 rounded-lg text-left items-start">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${severityColor}`}>
                  T-#{inc.tick}
                </span>

                <div className="space-y-0.5 flex-1">
                  <div className="flex justify-between items-center flex-wrap">
                    <span className="text-[10px] font-bold text-slate-200 uppercase font-mono">{inc.type.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] text-slate-500 font-mono">ID: {inc.id}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{inc.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      </footer>

    </div>
    </PanelFxShell>
  );
}
