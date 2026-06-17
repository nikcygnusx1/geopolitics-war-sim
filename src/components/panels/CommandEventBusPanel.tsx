import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { createBusEvent } from '../../sim/eventBus/eventFactories';
import { queueBusEvent, processBusEventQueue } from '../../sim/eventBus/dispatcher';
import { BusEvent, BusEventType } from '../../sim/eventBus/types';
import { audio } from '../../utils/audio';
import { 
  Activity, 
  Cpu, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  Globe, 
  ChevronRight, 
  ChevronDown, 
  Terminal,
  Send,
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  Panel, 
  ActionButton, 
  KeyValueGrid, 
  ScrollRegion, 
  StatusBadge, 
  FactChip, 
  SectionBlock,
  ToggleGroup
} from '../shared/CommandPrimitives';

export default function CommandEventBusPanel() {
  const worldState = useWorldStore();
  const currentTick = worldState.currentTick;
  const canonicalWorld = worldState.world;
  const countries = worldState.countries;

  const [selectedTarget, setSelectedTarget] = useState('RU');
  const [selectedCascade, setSelectedCascade] = useState('SANCTIONS');
  const [executionMode, setExecutionMode] = useState<'INSTANT' | 'SIMULATED'>('INSTANT');
  const [selectedTrace, setSelectedTrace] = useState<BusEvent | null>(null);
  const [expandedChains, setExpandedChains] = useState<Record<string, boolean>>({});

  // Gather list of non-player country IDs
  const countryIds = Object.keys(countries).filter(id => id !== 'US');

  // Queued & history events
  const queuedEvents = canonicalWorld?.busEventQueue || [];
  const historyEvents = canonicalWorld?.busEventHistory || [];

  // Group history events by correlation ID to show trigger chains
  const chains: Record<string, BusEvent[]> = {};
  historyEvents.forEach(evt => {
    if (!chains[evt.correlationId]) {
      chains[evt.correlationId] = [];
    }
    chains[evt.correlationId].push(evt);
  });

  const toggleChain = (chainId: string) => {
    setExpandedChains(prev => ({
      ...prev,
      [chainId]: !prev[chainId]
    }));
  };

  const handleLaunchCascade = () => {
    audio.playPhaseReveal();

    worldState.applyTickDelta((draft) => {
      if (!draft.world) return;

      let primaryEvent: BusEvent;

      if (selectedCascade === 'SANCTIONS') {
        primaryEvent = createBusEvent({
          type: 'ECONOMIC_SANCTION_APPLIED',
          category: 'ECONOMIC',
          sourceSystem: 'PLAYER_COMMAND_DECK',
          sourceEntityType: 'COUNTRY',
          sourceEntityId: 'US',
          targetEntityType: 'COUNTRY',
          targetEntityIds: [selectedTarget],
          tick: draft.currentTick,
          severity: 'CRITICAL',
          visibility: 'PUBLIC',
          title: `Coercive Embargo Initiated`,
          summary: `The Department of the Treasury issued high-impact economic sanctions targeting ${selectedTarget} assets and debt operations.`,
          payload: { severity: 25, sanctionScope: 'GLOBAL_TRADE' }
        });
      } else if (selectedCascade === 'CYBER') {
        primaryEvent = createBusEvent({
          type: 'CYBER_INTRUSION_DETECTED',
          category: 'CYBER',
          sourceSystem: 'PLAYER_COMMAND_DECK',
          sourceEntityType: 'COUNTRY',
          sourceEntityId: 'US',
          targetEntityType: 'COUNTRY',
          targetEntityIds: [selectedTarget],
          tick: draft.currentTick,
          severity: 'CRITICAL',
          visibility: 'PUBLIC',
          title: `Malware Footprint Discovered`,
          summary: `Cyber Command payload signature 'AegisGrip' detected inside the electrical grid of ${selectedTarget}.`,
          payload: { malwareSignature: 'AEGIS_GRIP', targetSubgrid: 'MUNICIPAL' }
        });
      } else {
        // TREATY CEASEFIRE VIOLATION
        const treatyKey = Object.keys(draft.world.treatiesById)[0] || 'TREATY-CEASEFIRE-01';
        if (!draft.world.treatiesById[treatyKey]) {
          draft.world.treatiesById[treatyKey] = {
            id: treatyKey,
            name: 'Pact of Geneva Ceasefire',
            type: 'CEASE_FIRE',
            signatoryCountryIds: ['US', selectedTarget],
            obligations: ['Demilitarized Border Zone', 'Mutual Surveillance Access'],
            enforcementStrength: 70,
            secrecyLevel: 0,
            startTick: 0,
            expirationTick: null,
            complianceByCountry: { US: 100, [selectedTarget]: 100 },
            violationHistory: [],
            status: 'ACTIVE',
            blocEffects: {},
            tags: ['CEASE_FIRE', 'MIDDLE_EAST_AGREEMENT']
          };
        }

        primaryEvent = createBusEvent({
          type: 'TREATY_VIOLATED',
          category: 'DIPLOMATIC',
          sourceSystem: 'PLAYER_COMMAND_DECK',
          sourceEntityType: 'COUNTRY',
          sourceEntityId: 'US',
          targetEntityType: 'TREATY',
          targetEntityIds: [selectedTarget],
          tick: draft.currentTick,
          severity: 'CRITICAL',
          visibility: 'PUBLIC',
          title: `Sigint Treaty Breach Triggered`,
          summary: `High-altitude drone surveillance declassified forward tactical maneuvers violating terms of the ${draft.world.treatiesById[treatyKey].name}.`,
          payload: { treatyId: treatyKey, violatorId: selectedTarget, severity: 40 }
        });
      }

      // Add to queue
      queueBusEvent(draft.world, primaryEvent);

      // If instant, process right now in this atomic block!
      if (executionMode === 'INSTANT') {
        const result = processBusEventQueue(draft.world, draft.countries, draft.currentTick);
        result.logs.forEach(log => {
          draft.globalEventLog.unshift({
            tick: draft.currentTick,
            text: log,
            severity: 'SYSTEM'
          });
        });
      }
    });
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <StatusBadge label="CRITICAL" statusType="critical" />;
      case 'WARNING':
        return <StatusBadge label="WARN" statusType="strained" />;
      default:
        return <StatusBadge label="INFO" statusType="stable" />;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ECONOMIC': return <TrendingUp className="w-3 px-0.5 text-emerald-400 inline-block mr-1" />;
      case 'MILITARY': return <ShieldAlert className="w-3 px-0.5 text-[#ff5f5f] inline-block mr-1" />;
      case 'COVERT': return <Layers className="w-3 px-0.5 text-[#e57cff] inline-block mr-1" />;
      case 'CYBER': return <Zap className="w-3 px-0.5 text-cyan-400 inline-block mr-1" />;
      default: return <Cpu className="w-3 px-0.5 text-amber-400 inline-block mr-1" />;
    }
  };

  return (
    <PanelFxShell panelId="black_market" relevantFxTypes={['BLACK_MARKET_BUST','SANCTIONS_ESCALATION','CYBER_ATTACK']}>
      <div className="flex flex-col h-full font-mono text-[10px] text-gray-300 bg-[#020502]/95 border-b border-[#1a5c1a]/30 relative select-none">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1a5c1a]/40 bg-[#050f05] px-3.5 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ff44] animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-white uppercase">classified geopolitical signal pipeline</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[7.5px] border border-red-500/40 text-red-500 px-1.5 py-0.5 rounded-[1.5px] font-bold bg-red-955/10 uppercase tracking-widest leading-none select-none">
            COSMIC STRATEGY
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5px] text-gray-500 uppercase">SYS_TRACE: PASSIVE_INTEGRATED</span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#00ff44]" />
          </div>
        </div>
      </div>

      {/* Main Panel Content Split */}
      <div className="flex flex-1 overflow-hidden divide-x divide-[#1a5c1a]/20 h-full">
        
        {/* Left Side: Controlled Emulator Deck */}
        <div className="w-2/5 p-4 flex flex-col justify-between overflow-y-auto min-h-0 bg-[#030903]/40 space-y-4">
          <div className="space-y-4 flex-1">
            <SectionBlock title="Event Trigger Deck" rightNode="SIM_EMULATOR">
              <p className="text-[8px] text-gray-500 leading-relaxed uppercase">
                Inject direct strategic operations to inspect, analyze, and test multi-agent geopolitical cascade loops.
              </p>
            </SectionBlock>

            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="text-[7.5px] text-gray-500 uppercase font-black block">1. Target Sovereign Node</label>
              <div className="relative">
                <select 
                  value={selectedTarget} 
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-[#050f05] text-[#00ff44] border border-[#1a5c1a]/55 rounded px-2.5 py-1.5 text-[9.5px] font-mono outline-none cursor-pointer hover:border-[#00ff44] transition-all appearance-none uppercase"
                >
                  {countryIds.map(id => (
                    <option key={id} value={id}>
                      {id} — {countries[id]?.name?.toUpperCase() || 'EXTERNAL BLOCK'} ({countries[id]?.political?.leaderName?.toUpperCase() || 'AUTOCRATIC'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[8px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Cascade Chain Type */}
            <div className="space-y-2">
              <label className="text-[7.5px] text-gray-500 uppercase font-black block">2. Geopolitical Reaction Cascade</label>
              
              <div className="space-y-1.5">
                {/* Sanctions cascade */}
                <div 
                  onClick={() => { audio.sfxKeyClick(); setSelectedCascade('SANCTIONS'); }}
                  className={`border p-2.5 rounded-sm cursor-pointer transition-all ${
                    selectedCascade === 'SANCTIONS' 
                      ? 'bg-[#153a15]/15 border-[#00ff44] text-white shadow-[0_0_8px_rgba(0,255,68,0.05)]' 
                      : 'bg-[#010401] border-[#1a5c1a]/20 text-gray-400 hover:border-[#1a5c1a]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[9px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> 
                    <span className="uppercase text-[9px] tracking-wider">Sanctions Coercion Array</span>
                  </div>
                  <div className="text-[7.5px] text-gray-500 mt-1 pl-5 uppercase leading-normal font-mono">
                    EMBARGO → RAISES INSTABILITY → DRIVES POPULAR UNREST → TRIGGERS RETALIATION RESPONSES
                  </div>
                </div>

                {/* Cyber cascade */}
                <div 
                  onClick={() => { audio.sfxKeyClick(); setSelectedCascade('CYBER'); }}
                  className={`border p-2.5 rounded-sm cursor-pointer transition-all ${
                    selectedCascade === 'CYBER' 
                      ? 'bg-[#153a15]/15 border-[#00ff44] text-white shadow-[0_0_8px_rgba(0,255,68,0.05)]' 
                      : 'bg-[#010401] border-[#1a5c1a]/20 text-gray-400 hover:border-[#1a5c1a]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[9px]">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> 
                    <span className="uppercase text-[9px] tracking-wider">Cyber Intrusion Matrix</span>
                  </div>
                  <div className="text-[7.5px] text-gray-500 mt-1 pl-5 uppercase leading-normal font-mono">
                    GRID BREACH → LOWERS INFRASTRUCTURE → HARVESTS SIGINT DETECT → CHANGES ENEMY STRATEGY
                  </div>
                </div>

                {/* Standoff cascade */}
                <div 
                  onClick={() => { audio.sfxKeyClick(); setSelectedCascade('DIPLOMACY'); }}
                  className={`border p-2.5 rounded-sm cursor-pointer transition-all ${
                    selectedCascade === 'DIPLOMACY' 
                      ? 'bg-[#153a15]/15 border-[#00ff44] text-white shadow-[0_0_8px_rgba(0,255,68,0.05)]' 
                      : 'bg-[#010401] border-[#1a5c1a]/20 text-gray-400 hover:border-[#1a5c1a]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[9px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> 
                    <span className="uppercase text-[9px] tracking-wider">Ceasefire Breach Trigger</span>
                  </div>
                  <div className="text-[7.5px] text-gray-500 mt-1 pl-5 uppercase leading-normal font-mono">
                    BREACH TREATY → SPOILS ALLY COMPLIANCE → TANKS TRUST → SPIKES ENEMY AGGRESSION
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Vector Toggle */}
            <div className="space-y-2 pt-1 border-t border-[#1a5c1a]/15">
              <label className="text-[7.5px] text-gray-500 uppercase font-black block">3. Resolution Vector</label>
              <ToggleGroup 
                options={[
                  { value: 'INSTANT', label: 'instant process' },
                  { value: 'SIMULATED', label: 'queue on simulation tick' }
                ]}
                value={executionMode}
                onChange={(v) => setExecutionMode(v)}
                className="w-full grid-cols-2"
              />
            </div>
          </div>

          <ActionButton
            variant="primary"
            size="md"
            onClick={handleLaunchCascade}
            className="w-full tracking-widest mt-4 font-black"
            icon={<Send className="w-3.5 h-3.5" />}
          >
            INITIATE STRATEGIC CASCADE
          </ActionButton>
        </div>

        {/* Right Side: Log Tracer Feed */}
        <div className="w-3/5 p-4 flex flex-col justify-between overflow-y-auto min-h-0 bg-[#010301]/60 space-y-3">
          <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
            
            <SectionBlock 
              title="Active Pipeline Live Trace" 
              rightNode={
                <span className="text-[7.5px] bg-[#122e12] border border-[#1a5c1a]/40 px-1 text-[#00ff44] rounded-sm font-bold uppercase tracking-wider">
                  SYSTEM TICK {currentTick}
                </span>
              }
            />

            {/* Pending signals buffer */}
            {queuedEvents.length > 0 && (
              <div className="shrink-0 bg-[#0f0702] border border-amber-900/30 p-2.5 rounded-sm">
                <div className="text-amber-400 font-bold mb-1.5 text-[8px] tracking-widest uppercase flex items-center gap-1.5">
                  <span className="animate-pulse text-[#00ff44]">●</span> PENDING SIGNAL BUFFER ({queuedEvents.length})
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin">
                  {queuedEvents.map((evt) => (
                    <div key={evt.id} className="flex justify-between items-center bg-black/45 px-2 py-1 border border-amber-950/40 rounded-[1px]">
                      <span className="text-yellow-500 text-[8px] font-bold tracking-wide uppercase">{evt.type}</span>
                      <span className="text-gray-500 text-[6.5px] font-mono">TARGET_IDS: {evt.targetEntityIds?.join(',') || 'WORLD'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cascade trigger chains view scroll-region */}
            <ScrollRegion maxHeightClass="max-h-[300px]" className="flex-1">
              {historyEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-[#1a5c1a]/25 rounded-sm bg-black/20 p-6 py-12">
                  <Terminal className="w-6 h-6 text-gray-700 mb-2" />
                  <p className="text-[9px] uppercase tracking-widest text-[#00ff44] font-black mb-1">No Active Cascades</p>
                  <p className="text-[7.5px] text-gray-500 text-center max-w-[210px] uppercase leading-normal">
                    Inject a geopolitical cascade or advance tick cycles to acquire and visualize signal trace paths.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.keys(chains).map((chainId) => {
                    const chainEvts = chains[chainId];
                    const originEvt = chainEvts[chainEvts.length - 1]; // First chronologically
                    const isExpanded = !!expandedChains[chainId];
                    const numReactions = chainEvts.length - 1;

                    return (
                      <div key={chainId} className="border border-[#1a5c1a]/25 rounded-sm bg-[#020502]/90 overflow-hidden">
                        
                        {/* Chain Header block */}
                        <div 
                          onClick={() => toggleChain(chainId)}
                          className={`flex items-center justify-between p-2 px-2.5 cursor-pointer select-none transition-all border-b border-[#1a5c1a]/10 ${
                            isExpanded ? 'bg-[#0f210f]' : 'bg-black/50 hover:bg-[#061406]'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isExpanded ? <ChevronDown className="w-3.5 text-[#00ff44] shrink-0" /> : <ChevronRight className="w-3.5 text-gray-500 shrink-0" />}
                            <span className="text-[#00ff44] text-[8px] font-extrabold uppercase shrink-0 tracking-widest">CHAIN_{chainId.substring(5, 10).toUpperCase()}</span>
                            <div className="h-3 w-[1px] bg-[#1a5c1a]/20 shrink-0" />
                            <span className="text-white text-[8px] font-black truncate uppercase tracking-widest">
                              {originEvt?.title || 'TRACE ROUTE SIGNAL'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 pl-1.5">
                            {numReactions > 0 && (
                              <span className="bg-[#132c13] text-[#00ff44] px-1.5 py-0.5 text-[7px] rounded-[1px] border border-[#1a4c1a] uppercase font-bold tracking-wider animate-pulse">
                                {numReactions} CONSEQUENCE{numReactions > 1 ? 'S' : ''}
                              </span>
                            )}
                            <span className="text-gray-500 text-[8px] font-mono select-none">T:{originEvt?.tick}</span>
                          </div>
                        </div>

                        {/* Interactive Chain Events List details */}
                        {isExpanded && (
                          <div className="divide-y divide-[#1a5c1a]/10 bg-[#030703]/70 p-2 space-y-1">
                            {chainEvts.slice().reverse().map((evt, idx) => {
                              const isLeaf = idx > 0;
                              return (
                                <div 
                                  key={evt.id} 
                                  onClick={() => setSelectedTrace(evt)}
                                  className={`p-2 rounded-[1px] cursor-pointer border border-transparent transition-all hover:bg-[#071507] ${
                                    selectedTrace?.id === evt.id ? 'border-[#00ff44]/70 bg-[#0d210d]/50' : 'bg-black/20'
                                  } ${isLeaf ? 'ml-4 border-l-2 border-l-[#1a5c1a]/40 pl-2.5 bg-black/10' : ''}`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5 overflow-hidden truncate">
                                      {getCategoryIcon(evt.category)}
                                      <span className={`font-extrabold text-[8.5px] truncate uppercase tracking-wider ${isLeaf ? 'text-[#8eff92]' : 'text-white'}`}>
                                        {evt.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                      {getSeverityBadge(evt.severity)}
                                      <span className="text-gray-600 text-[6.5px] font-mono">VAL_ID:{evt.id.substring(evt.id.length - 4).toUpperCase()}</span>
                                    </div>
                                  </div>
                                  <p className="text-[8px] text-gray-500 leading-normal pl-4 font-sans tracking-wide">
                                    {evt.summary}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollRegion>

            {/* Custom visual trace details inspector */}
            {selectedTrace && (
              <div className="shrink-0 bg-[#050c05] border border-[#1a5c1a]/60 rounded-sm p-3 text-[8.5px] space-y-2 relative overflow-hidden shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center font-bold text-[#fafafa] border-b border-[#1a5c1a]/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#00ff44]" />
                    <span className="uppercase text-[8.5px] font-black tracking-widest text-white">Target Payload Inspector</span>
                  </div>
                  <button 
                    onClick={() => setSelectedTrace(null)}
                    className="text-gray-500 hover:text-white font-extrabold cursor-pointer text-[10px] leading-none"
                  >
                    ✕
                  </button>
                </div>
                
                <KeyValueGrid 
                  data={[
                    { label: 'Event Identifier', value: selectedTrace.id },
                    { label: 'System Type', value: selectedTrace.type, valClass: 'text-amber-400' },
                    { label: 'Source System', value: selectedTrace.sourceSystem },
                    { label: 'Correlation Chain ID', value: selectedTrace.correlationId.substring(0, 16) },
                    { label: 'Source Entity', value: `${selectedTrace.sourceEntityType} [${selectedTrace.sourceEntityId}]` },
                    { label: 'Target Target Nodes', value: `${selectedTrace.targetEntityType || 'GLOBAL'} [${selectedTrace.targetEntityIds?.join(',') || 'ALL'}]` }
                  ]}
                />

                <div className="space-y-1 pt-1.5 border-t border-[#1a5c1a]/15">
                  <span className="text-[7.5px] text-gray-500 font-bold uppercase tracking-wider block">Raw Telemetry Dictionary:</span>
                  <pre className="p-2 bg-black/50 border border-[#1a5c1a]/20 text-gray-400 rounded-sm text-[7.5px] font-mono max-h-24 overflow-y-auto scrollbar-thin leading-normal select-text">
                    {JSON.stringify(selectedTrace.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
    </PanelFxShell>
  );
}
