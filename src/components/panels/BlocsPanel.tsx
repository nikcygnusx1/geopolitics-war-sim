import React, { useState } from 'react';
import { PanelFxShell } from '../fx/PanelFxShell';
import { produce } from 'immer';
import { motion } from 'motion/react';
import { useBlocStore } from '../../store/blocStore';
import { useWorldStore } from '../../store/worldStore';
import { usePlayerStore } from '../../store/playerStore';
import { BlocType, RegionalOrganization, BlocMemberState, BlocAgendaItem, SwingStateProfile, HedgingPostureState, CrossBlocChannel } from '../../types/bloc';

export default function BlocsPanel() {
  const { 
    organizations, 
    swingStates, 
    crossBlocChannels, 
    institutionalMemories, 
    mediationProcesses,
    proposeAgendaItem,
    voteOnAgendaItem,
    resolveAgendaItem,
    triggerArticle5,
    respondToArticle5,
    lobbyMember,
    proposeMediation,
    tickMediation,
    lodgeBurdenSharingComplaint,
    resolveBurdenSharingDispute,
    executeJointExercise,
    fundInfrastructureProject,
    toggleLocalCurrencySettlement,
    initiateMembershipApplication,
    advanceMembershipAccession,
    suspendMember,
    exitMember,
    engageHedgingAction,
    proposeCrossBlocCBM,
    auditContributions,
    getBlocActionPreview,
    pivotStates,
    unalignedPowers,
    influenceCompetition,
    proposeAllianceObjective,
    assignCoalitionTask,
    resolveCoalitionTask,
    courtPivotState,
    courtUnalignedPower,
    auditFreeRiders,
    reconcileFracture
  } = useBlocStore();

  const { countries, currentTick } = useWorldStore();
  const playerCountryId = usePlayerStore(s => s.countryId);

  const [selectedBlocId, setSelectedBlocId] = useState<BlocType>('NATO');
  const [selectedSwingStateId, setSelectedSwingStateId] = useState<string>('IN');
  const [activeSubTab, setActiveSubTab] = useState<'ACTION' | 'INTELLIGENCE'>('ACTION');
  
  // States for sub-forms
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaDesc, setNewAgendaDesc] = useState('');
  const [newAgendaType, setNewAgendaType] = useState<BlocAgendaItem['type']>('SECURITY_EXERCISE');
  const [newAgendaFunding, setNewAgendaFunding] = useState(5);
  const [newAgendaTarget, setNewAgendaTarget] = useState('DE');

  const [disputeDefendant, setDisputeDefendant] = useState('DE');
  const [disputeType, setDisputeType] = useState<'MILITARY_UNDERFUNDING' | 'REFUSION_OF_BASES' | 'EXCESSIVE_REFUGEE_EXPOSURE' | 'SANCTIONS_EVASION' | 'FINANCIAL_UNDERCONTRIBUTION'>('MILITARY_UNDERFUNDING');

  const [newApplicantId, setNewApplicantId] = useState('BR');
  const [newSuspendedId, setNewSuspendedId] = useState('TR');
  const [newExitedId, setNewExitedId] = useState('TR');

  // Module 4.4 states
  const [newObjName, setNewObjName] = useState('');
  const [newObjCategory, setNewObjCategory] = useState<'MILITARY_CONTAINMENT' | 'REGIONAL_DETERRENCE' | 'TRADE_PROTECTION' | 'INTELLIGENCE_INTEGRATION' | 'SANCTIONS_SYNCHRONIZATION'>('TRADE_PROTECTION');
  const [newObjPriority, setNewObjPriority] = useState(5);
  const [newObjCostFinance, setNewObjCostFinance] = useState(5.0);
  const [newObjAP, setNewObjAP] = useState(10);
  const [newObjConstraints, setNewObjConstraints] = useState('Friction of local legislative chambers.');

  const [newTaskAssignee, setNewTaskAssignee] = useState('DE');
  const [newTaskType, setNewTaskType] = useState<'INTELLIGENCE_DRILL' | 'PATROL_ZONE' | 'ECONOMIC_COMPAK' | 'SYNCHRONIZE_SANCTION' | 'NUCLEAR_BACKSTOP'>('INTELLIGENCE_DRILL');

  const [courtPivotId, setCourtPivotId] = useState('IN');
  const [courtActionType, setCourtActionType] = useState<'SECURITY_GUARANTEE' | 'ARMS_SALE' | 'TRADE_DEAL' | 'INFRASTRUCTURE' | 'COVERT_OPS'>('TRADE_DEAL');
  const [courtCostAP, setCourtCostAP] = useState(15);
  const [courtCostFinanceB, setCourtCostFinanceB] = useState(4.0);

  const [courtUnalignedId, setCourtUnalignedId] = useState('BR');
  const [courtBidB, setCourtBidB] = useState(2.5);

  const selectedBloc = organizations[selectedBlocId];
  const activeMemory = institutionalMemories[selectedBlocId];

  // Helper lists of countries for select boxes
  const supportedCountryIds = Object.keys(countries);

  // Quick Seed engine to configure scenarios instantly
  const handleSeedScenario = (scenarioKey: string) => {
    // We can directly manipulate standard store states to load predefined situations
    useBlocStore.setState(produce(draft => {
      if (scenarioKey === 'NATO_BURDEN_SHARING') {
        // Redo NATO burden sharing dispute with heavy intensity
        const org = draft.organizations.NATO;
        org.burdenSharingDisputes = [
          {
            id: 'NATO-D-BURDEN',
            initiatingCountryId: 'US',
            targetCountryId: 'DE',
            disputeType: 'MILITARY_UNDERFUNDING',
            intensity: 85,
            unresolvedTicks: 5,
            narrative: 'CRISIS SEED: High intensity strategic dispute. US refuses joint deployment coordinates unless Germany authorizes immediate $15B defense expenditure transfer.'
          }
        ];
        org.cohesion.strategicCoherence = 30;
        org.cohesion.overallScore = 48;
        org.cohesion.leadershipTrust = 40;
      }
      else if (scenarioKey === 'ARTICLE_5_AMBIGUOUS') {
        const org = draft.organizations.NATO;
        org.activeCollectiveDefenseTriggers = [
          {
            id: 'A5-AMBIGUOUS',
            attackerId: 'RU',
            victimId: 'TR',
            triggerTick: currentTick,
            status: 'PENDING_CONSULTATION',
            confidenceIndex: 40,
            contributingNations: ['TR', 'US'],
            refusingNations: ['DE']
          }
        ];
        org.cohesion.strategicCoherence = 45;
        org.cohesion.militaryReliability = 50;
      }
      else if (scenarioKey === 'ASEAN_CONCENSUS_PARALYSIS') {
        const org = draft.organizations.ASEAN;
        org.agenda = [
          {
            id: 'ASEAN-PARALYSIS',
            title: 'Sovereign Freedom of Navigation Joint Declaration',
            description: 'Require all regional littoral actors to ban foreign heavy carriers within territorial boundary corridors.',
            type: 'COMMUNIQUE_WORDING',
            initiatorId: 'JP',
            votesFor: ['JP'],
            votesAgainst: ['TW'], // Taiwan acts as block veto
            abstentions: ['KR'],
            status: 'PENDING_EXAMINATION'
          }
        ];
        org.cohesion.strategicCoherence = 20;
      }
      else if (scenarioKey === 'SCO_EXERCISE_SIGNALING') {
        const org = draft.organizations.SCO;
        org.securityMechanism.lastExerciseTick = currentTick;
        org.securityMechanism.jointExerciseReadinessBonus = 45;
        org.cohesion.militaryReliability = 80;
        org.cohesion.strategicCoherence = 75;
      }
      else if (scenarioKey === 'AU_MEDIATION_STRESS') {
        const org = draft.organizations.AFRICAN_UNION;
        org.burdenSharingDisputes = [
          {
            id: 'AU-D-MEDIATE',
            initiatingCountryId: 'ZA',
            targetCountryId: 'EG',
            disputeType: 'FINANCIAL_UNDERCONTRIBUTION',
            intensity: 70,
            unresolvedTicks: 3,
            narrative: 'AU MEDIATION SCENARIO: Severe funding gap splits the North-South peace support operation budget.'
          }
        ];
        // Initiate active mediation
        draft.mediationProcesses['MED-AU-STRESS'] = {
          id: 'MED-AU-STRESS',
          blocId: 'AFRICAN_UNION',
          disputeId: 'AU-D-MEDIATE',
          mediatorCountryId: 'ZA',
          concessionsProposedB: 1.2,
          successProbability: 38,
          status: 'ONGOING'
        };
      }
      else if (scenarioKey === 'ARAB_LEAGUE_SPLIT') {
        const org = draft.organizations.ARAB_LEAGUE;
        org.cohesion.strategicCoherence = 25;
        org.cohesion.overallScore = 32;
        org.cohesion.leadershipTrust = 30;
        org.burdenSharingDisputes.push({
          id: 'AL-D-NORMALISATION',
          initiatingCountryId: 'PS',
          targetCountryId: 'SA',
          disputeType: 'FINANCIAL_UNDERCONTRIBUTION',
          intensity: 90,
          unresolvedTicks: 8,
          narrative: 'ARAB LEAGUE SPLIT: Complete fracture on normalization with US alliance shields, threatening regional energy cartels.'
        });
      }
      else if (scenarioKey === 'BRICS_SANCTIONS_Bypass') {
        const org = draft.organizations.BRICS;
        org.economicMechanism.localCurrencySettlementActive = true;
        org.economicMechanism.localCurrencyTradeShare = 78;
        org.cohesion.sanctionsResilience = 95;
        org.economicMechanism.developmentBankReservesB = 85;
      }
      else if (scenarioKey === 'SWING_HEDGING_DEAL') {
        const sw = draft.swingStates.IN;
        sw.posture.tacticalAmbiguityRating = 95;
        sw.posture.concessionsExtractedB = 25.8;
        sw.posture.lastHedgingAction = 'SCENARIO ACTIVATE: Extracted alternate $4B infrastructure credit from BRICS bank while procuring defensive sonar assets from NATO powers.';
      }
      else if (scenarioKey === 'ACCESSION_OPPOSITION') {
        const org = draft.organizations.NATO;
        org.accessions = [
          {
            id: 'ACC-OPPOSITION',
            applicantCountryId: 'UA', // Ukraine or similar simulated
            stage: 'PENDING_VOTE',
            startTick: currentTick,
            vetoingMembers: ['TR'],
            readyScore: 65
          }
        ];
      }
      else if (scenarioKey === 'CROSS_BLOC_BACKCHANNEL') {
        draft.crossBlocChannels['CH-1'] = {
          id: 'CH-1',
          originBloc: 'NATO',
          targetBloc: 'SCO',
          channelType: 'BACK_CHANNEL',
          integrityIndex: 88,
          lastActivityTick: currentTick,
          agreedConfidenceMeasures: ['Hotline Communications', 'No-First-Cyber-Strike Pact']
        };
      }
      else if (scenarioKey === 'COMMUNIQUE_WORDING_FIGHT') {
        const org = draft.organizations.BRICS;
        org.agenda = [
          {
            id: 'BRICS-COMMUNIQUE',
            title: 'Multilateral Sovereign Integrity Communique',
            description: 'Drafting resolution text that explicitly denounces unilateral sanctions as a violation of WTO codes.',
            type: 'COMMUNIQUE_WORDING',
            initiatorId: 'RU',
            votesFor: ['RU', 'CN'],
            votesAgainst: [],
            abstentions: ['IN', 'BR'], // India and Brazil refuse to sign to keep optionality
            status: 'PENDING_EXAMINATION'
          }
        ];
        org.cohesion.strategicCoherence = 35;
      }
      else if (scenarioKey === 'MEMBER_DRIFT_NO_EXIT') {
        const org = draft.organizations.NATO;
        if (org.members.TR) {
          org.members.TR.role = 'RELUCTANT_PARTICIPANT';
          org.members.TR.trustScore = 15;
          org.members.TR.fractureVulnerability = 85;
        }
        org.burdenSharingDisputes.push({
          id: 'NATO-D-DRIFT',
          initiatingCountryId: 'US',
          targetCountryId: 'TR',
          disputeType: 'REFUSION_OF_BASES',
          intensity: 75,
          unresolvedTicks: 6,
          narrative: 'Turkey drifts silently away, declining to deploy naval coordinates in the Black Sea and shutting down alliance surveillance feeds.'
        });
      }
    }));
  };

  // Safe checks
  if (!selectedBloc) return <div className="text-red-500 p-8 font-mono">CRITICAL ERROR: Bloc registry uninitialized.</div>;

  return (
    <PanelFxShell panelId="alliance" relevantFxTypes={['ALLIANCE_FORMED','ALLIANCE_BROKEN','WAR_DECLARED']}>
      <div id="blocs-panel-root" className="gotham-panel gotham-panel--primary flex flex-col h-full bg-[#030d03] text-[#4af626] font-sans overflow-y-auto">
      {/* Top Strategic Header */}
      <div className="border-b border-[#0f3d0f] bg-[#051605] p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedBloc.flagSymbol}</span>
            <h1 className="text-lg font-bold font-mono text-white tracking-widest">{selectedBloc.name}</h1>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-mono">
            COMMAND ZONE // ACTIVE INGRESS DETECTED // NETWORK INTEGRITY CODES: OK
          </p>
        </div>

        {/* Global Organizations Toggle Tabs */}
        <div className="flex flex-wrap gap-1">
          {(Object.keys(organizations) as BlocType[]).map(oId => {
            const org = organizations[oId];
            const isSel = selectedBlocId === oId;
            return (
              <button
                key={oId}
                onClick={() => setSelectedBlocId(oId)}
                className={`px-3 py-1 text-[10px] md:text-xs font-mono font-bold tracking-tight rounded border transition-all uppercase ${
                  isSel 
                    ? 'bg-[#18ed10]/15 text-white border-[#18ed10] shadow-[0_0_10px_rgba(24,237,16,0.3)]' 
                    : 'bg-black text-[#56b149] border-[#0f3d0f] hover:bg-[#071d07]'
                }`}
              >
                {org.flagSymbol} {org.id} ({org.cohesion.overallScore}%)
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
        {/* LEFT COLUMN: Overview, Cohesion indicators, and Seed Scenario Trigger Room */}
        <div className="lg:border-r border-[#0f3d0f] p-5 flex flex-col gap-6 bg-[#041004]/40 h-full overflow-y-auto">
          
          {/* Template Identity Card */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded relative">
            <div className="absolute top-2 right-2 text-[8px] font-mono text-gray-600">ID_TEMPLATE_V0.9</div>
            <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-3">CONSTITUTIONAL ARCHITECTURE</h2>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Governance Agenda:</span>
                <span className="font-mono text-white">{selectedBloc.governanceRules.agendaSettingStyle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Decision Threshold:</span>
                <span className="font-mono text-white">{selectedBloc.governanceRules.decisionThreshold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security Command:</span>
                <span className="font-mono text-white">{selectedBloc.securityMechanism.hasJointCommand ? 'INTEGRATED' : 'Sovereignty-First'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Binding Resolutions:</span>
                <span className={`font-mono ${selectedBloc.governanceRules.isBinding ? 'text-green-400' : 'text-yellow-500'}`}>
                  {selectedBloc.governanceRules.isBinding ? 'YES (UNSC Linked)' : 'NO (Consultative)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ignore Reputational Cost:</span>
                <span className="font-mono text-cyan-400">{selectedBloc.governanceRules.reputationalCostOfIgnore} pts</span>
              </div>
            </div>
          </div>

          {/* Dynamic Multidimensional Cohesion Indicators */}
          <div className="border border-[#0f3d0f] bg-[#020902] p-4 rounded">
            <h2 className="text-[11px] uppercase text-white font-mono tracking-widest mb-4 flex justify-between">
              <span>COHESION DASHBOARD</span>
              <span className="text-[#18ed10]">{selectedBloc.cohesion.overallScore}%</span>
            </h2>

            <div className="space-y-3">
              {[
                { label: 'Strategic Coherence', val: selectedBloc.cohesion.strategicCoherence, color: 'bg-green-500' },
                { label: 'Military Reliability', val: selectedBloc.cohesion.militaryReliability, color: 'bg-blue-500' },
                { label: 'Economic Coordination', val: selectedBloc.cohesion.economicCoordination, color: 'bg-yellow-500' },
                { label: 'Procedural Legitimacy', val: selectedBloc.cohesion.proceduralLegitimacy, color: 'bg-purple-500' },
                { label: 'Leadership Trust', val: selectedBloc.cohesion.leadershipTrust, color: 'bg-pink-500' },
                { label: 'Sanctions Resilience', val: selectedBloc.cohesion.sanctionsResilience, color: 'bg-teal-500' },
              ].map(indicator => (
                <div key={indicator.label} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400">{indicator.label}</span>
                    <span className="font-mono text-white">{indicator.val}%</span>
                  </div>
                  <div className="w-full bg-[#112d11] h-1.5 rounded-full overflow-hidden">
                    <div className={`${indicator.color} h-full`} style={{ width: `${indicator.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INSTANT SEEDED SCENARIO TRIGGER ROOM */}
          <div className="border border-[#2f0f0f] bg-black p-4 rounded">
            <h2 className="text-[11px] uppercase text-red-500 font-mono tracking-widest mb-3 flex items-center gap-1.5">
              <span className="animate-pulse">🔴</span> SCENARIO DRILLS ROOM
            </h2>
            <p className="text-[10px] text-gray-500 mb-4 font-sans leading-relaxed">
              Inject geopolitical situations instantly into the live simulation engine to play and test Article 5 pathways, consensus gridlocks, or sanctions resistance.
            </p>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {[
                { key: 'NATO_BURDEN_SHARING', title: 'NATO Burden-Sharing dispute during Crisis', bloc: 'NATO' },
                { key: 'ARTICLE_5_AMBIGUOUS', title: 'Ambiguous Article-5 Trigger', bloc: 'NATO' },
                { key: 'ASEAN_CONCENSUS_PARALYSIS', title: 'ASEAN Consensus Block & Gridlock', bloc: 'ASEAN' },
                { key: 'SCO_EXERCISE_SIGNALING', title: 'SCO Exercise and Security Signaling', bloc: 'SCO' },
                { key: 'AU_MEDIATION_STRESS', title: 'AU Mediation under Capacity Stress', bloc: 'African Union' },
                { key: 'ARAB_LEAGUE_SPLIT', title: 'Arab League splits on Normalisation', bloc: 'Arab League' },
                { key: 'BRICS_SANCTIONS_Bypass', title: 'BRICS Local Currency Sanction Shock', bloc: 'BRICS' },
                { key: 'SWING_HEDGING_DEAL', title: 'Swing State Hedging Posture Deal', bloc: 'IN' },
                { key: 'ACCESSION_OPPOSITION', title: 'NATO Accession Bid opposed internally', bloc: 'NATO' },
                { key: 'CROSS_BLOC_BACKCHANNEL', title: 'Back-channel hotline de-escalation', bloc: 'Cross-Bloc' },
                { key: 'COMMUNIQUE_WORDING_FIGHT', title: 'BRICS Wording split Communique', bloc: 'BRICS' },
                { key: 'MEMBER_DRIFT_NO_EXIT', title: 'Silent member drifting without formal exit', bloc: 'NATO' }
              ].map(sc => (
                <button
                  key={sc.key}
                  onClick={() => {
                    handleSeedScenario(sc.key);
                    if (sc.bloc !== 'IN' && sc.bloc !== 'Cross-Bloc') {
                      setSelectedBlocId(sc.bloc === 'African Union' ? 'AFRICAN_UNION' : sc.bloc === 'Arab League' ? 'ARAB_LEAGUE' : sc.bloc as BlocType);
                    }
                  }}
                  className="w-full text-left bg-[#1a0a0a] border border-[#3a1a1a] hover:bg-[#3d1111] hover:border-red-500 text-[10px] p-2 rounded transition-all font-mono text-red-400 text-ellipsis truncate uppercase"
                >
                  🚀 {sc.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN 1: Member Roster, Disputes, and Article 5 triggers */}
        <div className="lg:border-r border-[#0f3d0f] p-5 flex flex-col gap-6 lg:col-span-2 overflow-y-auto h-full">
          
          {/* Sub Tab Navigation */}
          <div className="flex bg-[#051105] border border-[#0f3d0f] rounded p-1 mb-2">
            <button
              onClick={() => setActiveSubTab('ACTION')}
              className={`flex-grow py-2 text-xs font-bold font-mono uppercase tracking-widest rounded transition-all ${
                activeSubTab === 'ACTION'
                  ? 'bg-[#18ed10]/15 text-[#18ed10] border border-[#18ed10]/30 shadow-[0_0_6px_rgba(24,237,16,0.15)]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              🌐 COALITION ACTION CENTRE
            </button>
            <button
              onClick={() => setActiveSubTab('INTELLIGENCE')}
              className={`flex-grow py-2 text-xs font-bold font-mono uppercase tracking-widest rounded transition-all ${
                activeSubTab === 'INTELLIGENCE'
                  ? 'bg-[#18ed10]/15 text-[#18ed10] border border-[#18ed10]/30 shadow-[0_0_6px_rgba(24,237,16,0.15)]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              👁️ ALLIANCE BLOC INTELLIGENCE (v4.4)
            </button>
          </div>

          {activeSubTab === 'ACTION' ? (
            <>
              {/* Active Roster & Roles inside the Chosen Organization */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-4">MEMBER ROSTER AND ROLES mapping</h2>
                
                <div className="space-y-4">
                  {Object.keys(selectedBloc.members).map(cid => {
                    const member: BlocMemberState = selectedBloc.members[cid];
                    const country = countries[cid];
                    if (!country) return null;

                    return (
                      <div key={cid} className="border border-[#113011] bg-[#020a02] p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{country.flagEmoji}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-white font-bold">{country.name}</span>
                              <span className="text-[8px] bg-[#1a4a1a] px-1 text-green-300 font-mono tracking-tighter rounded uppercase">
                                {member.role.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                              ENTRANCE_TICK: {member.entranceTick} // CONTRIBUTION: ${member.accumulatedContributions}M
                            </div>
                          </div>
                        </div>

                        {/* Numeric Indicators */}
                        <div className="flex items-center gap-5 text-xs font-mono">
                          <div className="text-center">
                            <div className="text-[9px] text-gray-500 uppercase">Trust</div>
                            <div className={`font-bold ${member.trustScore > 75 ? 'text-green-400' : member.trustScore < 45 ? 'text-red-500' : 'text-yellow-400'}`}>
                              {member.trustScore}%
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-[9px] text-gray-500 uppercase">Fracture</div>
                            <div className="text-red-400 font-bold">{member.fractureVulnerability}%</div>
                          </div>

                          <div className="text-center">
                            <div className="text-[9px] text-gray-500 uppercase">Leverage</div>
                            <div className="text-cyan-400 font-bold">{member.leveragePoints}pt</div>
                          </div>

                          {/* Interactive Lobby Action */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => lobbyMember(selectedBlocId, cid, 'AID')}
                              className="bg-[#0c240c] border border-[#1b551b] hover:bg-[#164816] text-[8px] px-2 py-0.5 rounded text-white font-mono uppercase"
                            >
                              💸 Send Aid
                            </button>
                            <button
                              onClick={() => lobbyMember(selectedBlocId, cid, 'PRESSURE')}
                              className="bg-[#1e0a0a] border border-[#4a1a1a] hover:bg-[#3a1111] text-[8px] px-2 py-0.5 rounded text-red-400 font-mono uppercase"
                            >
                              ⚡ Pressure
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Burden Sharing disputes & Mediation ledger */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-4 flex justify-between">
                  <span>BURDEN-SHARING DISPUTES LEDGER</span>
                  <button
                    onClick={() => auditContributions(selectedBlocId)}
                    className="text-[9px] bg-red-950/40 border border-red-500/40 text-red-400 px-2 rounded hover:bg-red-900/30 transition-all uppercase font-mono"
                  >
                    🔍 Audit compliance
                  </button>
                </h2>

                {selectedBloc.burdenSharingDisputes.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono">No active disputes registered inside {selectedBlocId}. Strategic consensus maintains.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedBloc.burdenSharingDisputes.map(dispute => {
                      const initiatorC = countries[dispute.initiatingCountryId];
                      const defendantC = countries[dispute.targetCountryId];
                      if (!initiatorC || !defendantC) return null;

                      // Check if there is an active mediation process for this dispute
                      const mediation = Object.values(mediationProcesses).find(
                        m => m.disputeId === dispute.id && m.status === 'ONGOING'
                      );

                      return (
                        <div key={dispute.id} className="border border-red-900 bg-[#140505] p-3 rounded font-mono text-xs">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-red-400 font-bold bg-red-950 px-1 text-[9px] border border-red-800/60 uppercase">
                              DISPUTE: {dispute.disputeType.replace(/_/g, ' ')}
                            </span>
                            <div className="text-red-500 text-[10px] font-bold">INTENSITY: {dispute.intensity}%</div>
                          </div>

                          <p className="text-[11px] text-gray-300 leading-normal mb-3">
                            {dispute.narrative} <span className="text-red-600">(Unresolved {dispute.unresolvedTicks} ticks)</span>
                          </p>

                          <div className="flex flex-wrap justify-between items-center gap-2 border-t border-red-900/40 pt-2.5">
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span>Accuser: {initiatorC.flagEmoji} {dispute.initiatingCountryId}</span>
                              <span>↔</span>
                              <span>Target: {defendantC.flagEmoji} {dispute.targetCountryId}</span>
                            </div>

                            <div className="flex gap-1.5">
                              {mediation ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-cyan-400 animate-pulse font-bold">MEDIATION ONGOING ({Math.round(mediation.successProbability)}%)</span>
                                  <button
                                    onClick={() => tickMediation(mediation.id)}
                                    className="bg-[#102425] border border-cyan-500 text-[8px] px-1.5 py-0.5 rounded text-white"
                                  >
                                    Step
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => proposeMediation(selectedBlocId, dispute.id, playerCountryId)}
                                  className="bg-[#0b1b1d] border border-cyan-500/60 hover:bg-[#0f2d30] text-[9.5px] px-2 py-0.5 rounded text-cyan-400"
                                >
                                  🤝 Propose Mediation
                                </button>
                              )}

                              <button
                                onClick={() => resolveBurdenSharingDispute(selectedBlocId, dispute.id, true)}
                                className="bg-[#0c240c] border border-[#1b551b] hover:bg-[#164816] text-[9.5px] px-2 py-0.5 rounded text-green-400"
                              >
                                💳 Fund Side-payment ($800M)
                              </button>
                              <button
                                onClick={() => resolveBurdenSharingDispute(selectedBlocId, dispute.id, false)}
                                className="bg-[#1a0a0a] border border-[#4a1a1a] hover:bg-[#3a1111] text-[9.5px] px-2 py-0.5 rounded text-red-500"
                              >
                                ⚠️ Terminate Unilaterally
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Lodge a New Burden sharing Dispute (Player sandbox tool!) */}
                <div className="mt-4 border-t border-[#113011]/50 pt-4 text-xs font-mono">
                  <h3 className="text-gray-400 mb-2 uppercase text-[10px]">Lodge formal burden-sharing audit complaint</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={disputeDefendant}
                      onChange={e => setDisputeDefendant(e.target.value)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1"
                    >
                      {Object.keys(selectedBloc.members).map(cid => (
                        <option key={cid} value={cid}>{cid} - {countries[cid]?.name}</option>
                      ))}
                    </select>

                    <select
                      value={disputeType}
                      onChange={e => setDisputeType(e.target.value as any)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1"
                    >
                      <option value="MILITARY_UNDERFUNDING">Military Underfunding</option>
                      <option value="REFUSION_OF_BASES">Refusing Bases deployment</option>
                      <option value="EXCESSIVE_REFUGEE_EXPOSURE">Refuger logistics asymmetry</option>
                      <option value="SANCTIONS_EVASION">Sanctions Evasion</option>
                      <option value="FINANCIAL_UNDERCONTRIBUTION">Development default</option>
                    </select>

                    <button
                      onClick={() => lodgeBurdenSharingComplaint(selectedBlocId, playerCountryId, disputeDefendant, disputeType)}
                      className="bg-red-950/60 border border-red-500 text-red-400 rounded px-3 py-1 font-bold uppercase text-[10px]"
                    >
                      ⚡ Execute Audit complaint
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIVE ARTICLE-5 COLLECTIVE DEFENSE GUARANTEES */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-4">COLLECTIVE DEFENSE TRIGGER ROOM</h2>

                {selectedBloc.activeCollectiveDefenseTriggers.length === 0 ? (
                  <p className="text-xs text-gray-500 font-mono mb-4">No military trigger events reported. Extended security deterrence active.</p>
                ) : (
                  <div className="space-y-4 mb-4">
                    {selectedBloc.activeCollectiveDefenseTriggers.map(trig => {
                      return (
                        <div key={trig.id} className="border border-red-600 bg-[#250707] p-4 rounded font-mono text-xs">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[#18ed10] font-bold">ARTICLE 5 FILE: {trig.id}</span>
                            <span className="text-white text-[10px] bg-red-800 px-1 uppercase">{trig.status}</span>
                          </div>

                          <div className="mb-3 text-[11px] text-gray-300">
                            Pact member state <strong className="text-white">{trig.victimId}</strong> came under kinetic strike by non-pact actor <strong className="text-white">{trig.attackerId}</strong>. 
                            Mobilization Confidence Index: <strong className="text-[#18ed10]">{trig.confidenceIndex}%</strong>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-[10px]">
                            <div className="bg-black/40 p-2 border border-[#1b551b]/40 rounded text-green-300">
                              <strong>COORDINATED UNITS FOR MOBILISATION:</strong>
                              <div className="mt-1">{trig.contributingNations.join(', ') || 'None'}</div>
                            </div>
                            <div className="bg-black/40 p-2 border border-red-500/20 rounded text-red-400">
                              <strong>NATIONS REFUSING RESPONSES (OPT-OUTS):</strong>
                              <div className="mt-1">{trig.refusingNations.join(', ') || 'None'}</div>
                            </div>
                          </div>

                          {trig.status === 'PENDING_CONSULTATION' && (
                            <div className="flex gap-2 justify-end border-t border-red-800/40 pt-3">
                              <button
                                onClick={() => respondToArticle5(selectedBlocId, trig.id, playerCountryId, 'JOIN')}
                                className="bg-green-700 hover:bg-green-600 text-white font-bold px-3 py-1 rounded text-[10px]"
                              >
                                🟢 COMMIT BATTLE GROUP
                              </button>
                              <button
                                onClick={() => respondToArticle5(selectedBlocId, trig.id, playerCountryId, 'REFUSE')}
                                className="bg-red-800 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-[10px]"
                              >
                                🔴 EVADE / EXERCISE OPT-OUT
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Article 5 Simulator button (sandbox tool) */}
                <div className="border-t border-[#113011]/30 pt-3 flex flex-wrap justify-between items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono">Simulate a kinetic attack to test Article 5 limits:</span>
                  <button
                    onClick={() => {
                      const targetM = Object.keys(selectedBloc.members).find(c => c !== 'US') || 'DE';
                      triggerArticle5(selectedBlocId, 'RU', targetM);
                    }}
                    className="bg-black border border-red-500/70 hover:bg-red-950/20 px-3 py-1 text-[9px] uppercase font-bold text-red-400 tracking-wider rounded"
                  >
                    💥 Trigger Kinetic Attack Drill
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-6 font-sans">
              
              {/* SECTION 1: SHARED ALLIANCE OBJECTIVES */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">🎯 SHARED ALLIANCE OBJECTIVES COORDINATION</h3>
                  <span className="text-[9px] text-green-400 bg-green-950/40 px-1.5 border border-green-800 uppercase font-mono">
                    Last evaluation: Tick {selectedBloc.objectives?.lastEvaluationTick || 0}
                  </span>
                </div>
                
                <p className="text-[10px] text-gray-400 font-mono leading-relaxed mb-4">
                  {selectedBloc.objectives?.globalPrioritiesDescription || 'No priority briefs compiled.'}
                </p>

                {/* Objectives list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {selectedBloc.objectives?.objectives?.map(obj => (
                    <div key={obj.id} className="border border-[#113011] bg-[#020a02] p-3 rounded flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1 text-[10px]">
                          <span className="text-cyan-400 font-bold">{obj.id}</span>
                          <span className="text-[#18ed10] bg-[#102a10] px-1 uppercase font-mono">{obj.status}</span>
                        </div>
                        <h4 className="text-white font-bold leading-tight mb-2 text-xs">{obj.name}</h4>
                        <div className="space-y-1 text-[10px] text-gray-500 font-mono mb-2">
                          <div>Category: <span className="text-yellow-400">{obj.category.replace(/_/g, ' ')}</span></div>
                          <div className="truncate">Constraints: <span className="text-gray-300">{obj.domesticConstraints}</span></div>
                        </div>
                      </div>

                      <div className="border-t border-[#113011]/50 pt-2 flex justify-between items-center text-[10px] font-mono mt-2">
                        <div>Priority Score: <span className="text-white font-bold">{obj.priority}/10</span></div>
                        <div>Cost: <span className="text-[#18ed10] font-bold">${obj.costFinancialB}B</span> ({obj.costAP} AP)</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Propose Objective Form */}
                <div className="bg-[#030903] border border-[#113c11] p-3 rounded">
                  <span className="text-[10px] text-gray-400 font-mono block mb-2 uppercase select-none">Outline shared alliance objective</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 font-mono text-[11px]">
                    <input
                      type="text"
                      placeholder="Objective Statement (e.g. South sea logistics safeguarding)"
                      value={newObjName}
                      onChange={e => setNewObjName(e.target.value)}
                      className="w-full bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs sm:col-span-2"
                    />
                    <select
                      value={newObjCategory}
                      onChange={e => setNewObjCategory(e.target.value as any)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                    >
                      <option value="MILITARY_CONTAINMENT">Military Containment</option>
                      <option value="REGIONAL_DETERRENCE">Regional Deterrence</option>
                      <option value="TRADE_PROTECTION">Trade Protection</option>
                      <option value="INTELLIGENCE_INTEGRATION">Intelligence Integration</option>
                      <option value="SANCTIONS_SYNCHRONIZATION">Sanctions Sync</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase">Priority:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newObjPriority}
                        onChange={e => setNewObjPriority(Number(e.target.value))}
                        className="w-12 bg-black border border-[#113011] text-[#4af626] rounded px-1.5 py-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 uppercase">AP cost:</span>
                      <input
                        type="number"
                        value={newObjAP}
                        onChange={e => setNewObjAP(Number(e.target.value))}
                        className="w-16 bg-black border border-[#113011] text-[#4af626] rounded px-1.5 py-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-450 uppercase">Treasury cost (B):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={newObjCostFinance}
                        onChange={e => setNewObjCostFinance(Number(e.target.value))}
                        className="w-16 bg-black border border-[#113011] text-[#4af626] rounded px-1.5 py-0.5"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Domestic legislative barriers..."
                      value={newObjConstraints}
                      onChange={e => setNewObjConstraints(e.target.value)}
                      className="w-full bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs sm:col-span-2"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newObjName) return;
                      proposeAllianceObjective(selectedBlocId, {
                        name: newObjName,
                        category: newObjCategory,
                        priority: newObjPriority,
                        costAP: newObjAP,
                        costFinancialB: newObjCostFinance,
                        confidenceRating: {},
                        politicalPressure: Math.round(newObjPriority * 8 + Math.random() * 20),
                        domesticConstraints: newObjConstraints
                      });
                      setNewObjName('');
                    }}
                    className="w-full bg-[#0b240b] border border-[#18ed10] hover:bg-[#18ed10]/10 text-[#18ed10] py-1 text-[11px] font-mono font-bold uppercase rounded transition-all"
                  >
                    🚀 RATIFY COALITION OBJECTIVE
                  </button>
                </div>
              </div>

              {/* SECTION 2: COALITION TASKING & BURDEN PERFORMANCE */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">📋 COALITION TASKING & BURDEN SHARING</h3>
                  <button
                    onClick={() => auditFreeRiders(selectedBlocId)}
                    className="text-[9.5px] bg-red-950/40 border border-red-500/65 text-red-400 px-2.5 py-1 rounded hover:bg-red-900/30 font-mono uppercase font-bold"
                  >
                    ⚡ Audit Free Riders
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {selectedBloc.coalitionTasking?.activeTasks.map(t => {
                    const country = countries[t.assigneeCountryId];
                    return (
                      <div key={t.id} className="border border-cyan-900/40 bg-[#020c0f] p-3 rounded font-mono text-xs">
                        <div className="flex justify-between items-center mb-1.5">
                          <div>
                            <span className="text-cyan-400 font-bold">TASK {t.id}</span>
                            <span className="text-gray-400 ml-2 uppercase text-[9px]">({t.taskType.replace(/_/g, ' ')})</span>
                          </div>
                          <span className={`text-[8px] px-1 font-bold rounded uppercase ${
                            t.complianceStatus === 'FULL' ? 'bg-green-950 text-green-300' :
                            t.complianceStatus === 'PARTIAL' ? 'bg-yellow-950 text-yellow-300' : 'bg-red-950 text-red-400'
                          }`}>
                            {t.complianceStatus} COMPLIANCE
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-300 mb-2 leading-relaxed">
                          Assigned state: <strong>{country?.flagEmoji} {country?.name}</strong>. {t.narrative}
                        </p>

                        <div className="mb-3.5">
                          <div className="flex justify-between mb-1 text-[9px] text-[#56b149]">
                            <span>Task Progress:</span>
                            <span>{t.actualProgress}%</span>
                          </div>
                          <div className="w-full bg-[#112d11] h-1 rounded overflow-hidden">
                            <div className="bg-[#18ed10] h-full" style={{ width: `${t.actualProgress}%` }}></div>
                          </div>
                        </div>

                        {/* Interactive solve interface */}
                        {t.complianceStatus !== 'FULL' && (
                          <div className="flex gap-1.5 justify-end">
                            <span className="text-[9px] text-gray-500 pt-1">Resolve Sandbox:</span>
                            <button
                              onClick={() => resolveCoalitionTask(selectedBlocId, t.id, 'FULL')}
                              className="bg-green-950 text-green-400 border border-green-800 text-[9px] px-2 rounded font-bold"
                            >
                              FULL
                            </button>
                            <button
                              onClick={() => resolveCoalitionTask(selectedBlocId, t.id, 'QUIET_RESISTANCE')}
                              className="bg-red-950 text-red-400 border border-red-800 text-[9px] px-2 rounded font-bold"
                            >
                              RESIST
                            </button>
                            <button
                              onClick={() => resolveCoalitionTask(selectedBlocId, t.id, 'OVERT_DEFECTION')}
                              className="bg-red-900 text-white text-[9px] px-2 rounded font-bold"
                            >
                              DEFECT
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Delegate active chore form */}
                <div className="bg-[#030903] border border-[#113c11] p-3 rounded mb-4">
                  <span className="text-[10px] text-gray-400 font-mono block mb-2 uppercase">Outsource task to alliance member</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 font-mono text-xs">
                    <select
                      value={newTaskAssignee}
                      onChange={e => setNewTaskAssignee(e.target.value)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                    >
                      {Object.keys(selectedBloc.members).map(cid => (
                        <option key={cid} value={cid}>{cid} - {countries[cid]?.name}</option>
                      ))}
                    </select>

                    <select
                      value={newTaskType}
                      onChange={e => setNewTaskType(e.target.value as any)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                    >
                      <option value="INTELLIGENCE_DRILL">Joint Cyber Intel Drill</option>
                      <option value="PATROL_ZONE">Defense patrol corridor</option>
                      <option value="ECONOMIC_COMPAK">Economic aid allocation</option>
                      <option value="SYNCHRONIZE_SANCTION">Synchronize trade embargo</option>
                    </select>
                  </div>
                  <button
                    onClick={() => assignCoalitionTask(selectedBlocId, newTaskAssignee, newTaskType)}
                    className="w-full bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-cyan-300 py-1 text-[11px] font-mono font-bold uppercase rounded"
                  >
                    🛰️ DELEGATE TASK TO MEMBER
                  </button>
                </div>

                {/* Sub-Roster Reliability Matrix */}
                <div className="border border-[#113011]/60 bg-black/60 p-3 rounded">
                  <h4 className="text-[9.5px] uppercase text-gray-400 tracking-wider mb-2 font-mono">ALLIANCE MEMBER RELIABILITY DOSSIERS</h4>
                  <div className="space-y-3 font-mono text-[10.5px]">
                    {Object.keys(selectedBloc.members).map(cid => {
                      const prof = selectedBloc.memberProfiles?.[cid];
                      const country = countries[cid];
                      if (!prof) return null;
                      return (
                        <div key={cid} className="border-b border-[#222]/30 pb-2.5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-white font-bold">{country?.flagEmoji} {country?.name} ({cid})</span>
                            <span className="text-gray-500 uppercase text-[9px]">
                              Auditing: <span className={prof.freeRidePressure.activeAuditing ? 'text-red-400' : 'text-green-400'}>
                                {prof.freeRidePressure.activeAuditing ? 'Active Audit' : 'Excused'}
                              </span>
                            </span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[9px]">
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">Mil Reliance</div>
                              <span className="text-white">{prof.reliability.military}%</span>
                            </div>
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">Dipl Treaty</div>
                              <span className="text-white">{prof.reliability.diplomatic}%</span>
                            </div>
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">Intel Share</div>
                              <span className="text-white">{prof.reliability.intelligence}%</span>
                            </div>
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">Sanc Compliance</div>
                              <span className="text-white">{prof.reliability.sanctions}%</span>
                            </div>
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">Pay Willingness</div>
                              <span className="text-yellow-400">{prof.burdenShare.willingnessToPay}%</span>
                            </div>
                            <div className="bg-[#111] p-1 border border-[#333]/30 rounded text-center">
                              <div className="text-gray-500 font-bold uppercase text-[7px]">FreeRide Rating</div>
                              <span className="text-red-400">{prof.freeRidePressure.currentFreeRideIndex}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: PIVOT STATE COMPETITION MATRIX */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded">
                <h3 className="text-xs font-bold font-mono text-white tracking-wider mb-2 uppercase">🎯 PIVOT STATES & UNALIGNED POWER COURT ROOM</h3>
                <p className="text-[10px] text-gray-400 mb-4 font-mono leading-relaxed">
                  Geopolitical competition targets unaligned pivot states. Secure strategic leverage, transfer aid payments, or expand military ties to out-maneuver rival blocs.
                </p>

                {/* Pivot states mapping */}
                <div className="space-y-4 mb-4">
                  {Object.keys(pivotStates).map(pid => {
                    const p = pivotStates[pid];
                    const comp = influenceCompetition[pid];
                    const country = countries[pid];
                    return (
                      <div key={pid} className="border border-yellow-500/15 bg-[#090802] p-3 rounded font-mono text-xs">
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-yellow-400 text-xs">{country?.flagEmoji} {country?.name} (Pivot State)</strong>
                          <span className="text-[9px] bg-yellow-950 border border-yellow-800 text-yellow-300 px-1 uppercase">
                            STABILITY: {p.neutralityStability}%
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                          <strong>LOCATION:</strong> {p.strategicLocationDescription}
                        </div>

                        {/* Trade & Defense Weight Indicators */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
                          <div className="bg-black/60 p-2 rounded border border-[#222]">
                            <div className="text-[#18ed10] font-bold text-[8.5px] uppercase tracking-wider mb-1">Western Ties</div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Influence:</span>
                              <span className="text-white">{comp?.influenceWeightWest}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Trade share:</span>
                              <span className="text-white">{p.tradeDependencyWest}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Security links:</span>
                              <span className="text-white">{p.securityDependencyWest}%</span>
                            </div>
                          </div>

                          <div className="bg-black/60 p-2 rounded border border-[#222]">
                            <div className="text-red-400 font-bold text-[8.5px] uppercase tracking-wider mb-1">Eastern Ties</div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Influence:</span>
                              <span className="text-white">{comp?.influenceWeightEast}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Trade share:</span>
                              <span className="text-white">{p.tradeDependencyEast}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Security links:</span>
                              <span className="text-white">{p.securityDependencyEast}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Elite balance */}
                        <div className="bg-[#112] p-2 rounded text-[9.5px] mb-3 outline outline-blue-900/40">
                          <strong>Elite balance:</strong> Pro-West: <span className="text-white">{p.eliteFactionBalance.proWestPercent}%</span> // Pro-East: <span className="text-white">{p.eliteFactionBalance.proEastPercent}%</span> // Neutral: <span className="text-gray-400">{p.eliteFactionBalance.neutralPercent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Court dynamic form */}
                <div className="bg-[#030903] border border-[#113c11] p-3 rounded">
                  <span className="text-[10px] text-gray-400 font-mono block mb-2 uppercase">Lauch courting operations targeting Pivot state</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-3">
                    <select
                      value={courtPivotId}
                      onChange={e => setCourtPivotId(e.target.value)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                    >
                      {Object.keys(pivotStates).map(pid => (
                        <option key={pid} value={pid}>{pid} - {countries[pid]?.name}</option>
                      ))}
                    </select>

                    <select
                      value={courtActionType}
                      onChange={e => setCourtActionType(e.target.value as any)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                    >
                      <option value="SECURITY_GUARANTEE">Deploy security guarantees</option>
                      <option value="ARMS_SALE">Authorize precision Arms Sale</option>
                      <option value="TRADE_DEAL">Implement Bilateral Trade Pact</option>
                      <option value="INFRASTRUCTURE">Fund Corridor Corridors</option>
                      <option value="COVERT_OPS">Launch covert campaign</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase">AP leverage:</span>
                      <input
                        type="number"
                        value={courtCostAP}
                        onChange={e => setCourtCostAP(Number(e.target.value))}
                        className="w-16 bg-black border border-[#113011] text-[#4af626] rounded px-1.5 py-0.5 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase">Cost (B Cash):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={courtCostFinanceB}
                        onChange={e => setCourtCostFinanceB(Number(e.target.value))}
                        className="w-16 bg-black border border-[#113011] text-[#4af626] rounded px-1.5 py-0.5 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => courtPivotState(courtPivotId, selectedBlocId, courtActionType, courtCostAP, courtCostFinanceB)}
                    className="w-full bg-[#0b240b] border border-[#18ed10] hover:bg-[#18ed10]/15 text-[#18ed10] font-bold py-1.5 rounded uppercase font-mono text-[11px]"
                  >
                    🤝 COMMENCE ACTIVE COURTING INITIATIVE
                  </button>
                </div>
              </div>

              {/* SECTION 4: UNALIGNED POWERS BID ROOM */}
              <div className="border border-[#0f3d0f] bg-black p-4 rounded font-mono text-xs">
                <h3 className="text-xs font-bold font-mono text-white tracking-wider mb-2 uppercase">🎁 UNALIGNED POWERS BIDDING EXCHANGE</h3>
                <p className="text-[10px] text-gray-400 mb-4 leading-normal">
                  Genuine non-aligned nations offer strategic access options to the highest bidder. Transfer cash side-payments to buy diplomatic alignment or close port corridor options.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Object.keys(unalignedPowers).map(unid => {
                    const u = unalignedPowers[unid];
                    return (
                      <div key={unid} className="border border-[#113011] bg-[#020a02] p-3 rounded">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-white font-bold">{u.name} ({unid})</span>
                          <span className="text-yellow-400 font-bold bg-yellow-950 px-1 text-[8px] uppercase rounded">
                            {u.governanceStance.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[9.5px] text-gray-300">
                          <div>Sovereign Strength Score: <span className="text-cyan-400 font-bold">{u.strengthIndex}/100</span></div>
                          <div>Payments Demanded: <span className="text-green-400 font-bold">${u.sidePaymentsDemandedB.toFixed(1)}B</span></div>
                          <div className="text-gray-500 mt-1 uppercase text-[8px]">AVAILABLE ACCESS OPTIONS:</div>
                          <ul className="list-disc pl-3 text-[8.5px] text-yellow-105">
                            {u.accessSellingOptions.map((opt, id) => <li key={id}>{opt}</li>)}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#030903] border border-[#113c11] p-3 rounded">
                  <span className="text-[10px] text-gray-400 block mb-2 uppercase">Lauch side-payment bid for power alignment</span>
                  <div className="flex gap-2 mb-2">
                    <select
                      value={courtUnalignedId}
                      onChange={e => setCourtUnalignedId(e.target.value)}
                      className="bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs flex-grow"
                    >
                      {Object.keys(unalignedPowers).map(unid => (
                        <option key={unid} value={unid}>{unid} - {countries[unid]?.name}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 border border-[#113011] rounded text-[10px] text-[#18ed10]">
                      <span>Offer (Billions Cash):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={courtBidB}
                        onChange={e => setCourtBidB(Number(e.target.value))}
                        className="w-16 bg-black border-none text-[#18ed10] text-center"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => courtUnalignedPower(courtUnalignedId, selectedBlocId, courtBidB)}
                    className="w-full bg-[#0b240b] border border-[#18ed10] hover:bg-[#18ed10]/15 text-[#18ed10] font-bold py-1.5 rounded uppercase font-mono text-[11px]"
                  >
                    💸 DISPATCH AID BID TRANSFER
                  </button>
                </div>
              </div>

              {/* SECTION 5: COHESION MODEL & STRUCTURAL FRICTION */}
              <div className="border border-red-950/40 bg-black p-4 rounded font-mono text-xs">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-red-400 tracking-wider">⚡ ALLIANCE COHESION & FRACTURE MODEL</h3>
                  <button
                    onClick={() => reconcileFracture(selectedBlocId)}
                    className="bg-green-950 text-green-300 border border-green-800 text-[10px] px-2.5 py-1 rounded hover:bg-green-900/30 uppercase font-bold"
                  >
                    🤝 Reconcile Fracture Lines
                  </button>
                </div>

                {selectedBloc.cohesionModel && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] text-gray-300">
                    <div className="bg-[#050505] p-3 rounded border border-red-900/20">
                      <div className="text-white font-bold mb-2 uppercase text-[9px]">COHESION STRUCTURAL MULTIPLIERS</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Ideal Proximity bonus:</span>
                          <span className="text-green-400">+{selectedBloc.cohesionModel.ideologicalProximityBonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shared Threat multiplier:</span>
                          <span className="text-green-400">+{selectedBloc.cohesionModel.sharedThreatCohesionBonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trade interdependence:</span>
                          <span className="text-green-400">+{selectedBloc.cohesionModel.tradeInterdependenceFactor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unresolved disputes drag:</span>
                          <span className="text-red-400">-{selectedBloc.cohesionModel.unresolvedDisputesPenalty}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#050505] p-3 rounded border border-red-900/20 flex flex-col justify-between">
                      <div>
                        <div className="text-red-400 font-bold mb-2 uppercase text-[9px]">FRACTURE STATE RISK</div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Fracture Core Risk index:</span>
                          <span className="text-red-500 font-bold text-sm">{selectedBloc.fractureModel?.fractureRiskIndex || 10}%</span>
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase leading-snug">
                          CRITICAL STRESS VECTOR: <span className="text-red-400 font-bold">{selectedBloc.fractureModel?.primaryStressSource}</span>
                        </div>
                      </div>

                      {selectedBloc.fractureModel?.splinterFactionCountryIds && selectedBloc.fractureModel.splinterFactionCountryIds.length > 0 && (
                        <div className="text-[9px] bg-red-950/20 border border-red-900/40 p-1.5 rounded text-red-400 mt-2">
                          Splintering pair alignment risk: <strong>{selectedBloc.fractureModel.splinterFactionCountryIds.join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Summit agendas, voting, Hedging State Tracker, and Cross-bloc channels */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto h-full">
          
          {/* Summit Agenda & Resolutions list */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded">
            <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-4 flex justify-between items-center">
              <span>SUMMIT AGENDA & DEBATES</span>
              <span className="text-[9px] text-[#18ed10]">ACTIVE TRACKS</span>
            </h2>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {selectedBloc.agenda.map(item => {
                const preview = getBlocActionPreview(selectedBlocId, item.type);
                return (
                  <div key={item.id} className="border border-[#113011] bg-[#020702] p-3 rounded font-mono text-xs">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9.5px] text-cyan-400 font-bold">{item.id}</span>
                      <span className={`text-[8.5px] font-bold px-1 rounded uppercase ${
                        item.status === 'PASSED' ? 'bg-green-950 text-green-300 border border-green-800' :
                        item.status === 'VETOED' || item.status === 'DEFEATED' ? 'bg-red-950 text-red-400 border border-red-900' :
                        item.status === 'BLOCKED_BY_CONSENSUS' ? 'bg-yellow-950 text-yellow-300' : 'bg-blue-950 text-blue-300 animate-pulse'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <strong className="text-white text-[12px] block mb-1">{item.title}</strong>
                    <p className="text-[10px] text-gray-400 mb-3.5 leading-relaxed">{item.description}</p>

                    <div className="space-y-1 bg-black/40 p-2 border border-[#113011]/35 rounded text-[10px] mb-3">
                      <div>FOR: {item.votesFor.join(', ') || 'None'}</div>
                      <div>AGAINST: {item.votesAgainst.join(', ') || 'None'}</div>
                      <div>ABSTAIN: {item.abstentions.join(', ') || 'None'}</div>
                      <div className="text-[9.5px] text-gray-500 border-t border-[#113011]/30 pt-1 mt-1 justify-between flex">
                        <span>Expected Support: {preview.estimatedSupportPercentage}%</span>
                        <span>Cohesion Risk: {preview.cohesionRisk}pts</span>
                      </div>
                    </div>

                    {item.status === 'PENDING_EXAMINATION' && (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => voteOnAgendaItem(selectedBlocId, item.id, playerCountryId, 'FOR')}
                          className="bg-green-900/60 text-green-300 border border-green-700/60 hover:bg-green-800 px-2 py-0.5 rounded text-[9.5px]"
                        >
                          ✔ VOTE FOR
                        </button>
                        <button
                          onClick={() => voteOnAgendaItem(selectedBlocId, item.id, playerCountryId, 'AGAINST')}
                          className="bg-red-900/60 text-red-400 border border-red-800/60 hover:bg-red-800 px-2 py-0.5 rounded text-[9.5px]"
                        >
                          ❌ VOTE AGAINST
                        </button>
                        <button
                          onClick={() => voteOnAgendaItem(selectedBlocId, item.id, playerCountryId, 'ABSTAIN')}
                          className="bg-gray-800 text-white hover:bg-gray-700 px-2 py-0.5 rounded text-[9.5px]"
                        >
                          ABSTAIN
                        </button>
                        <button
                          onClick={() => resolveAgendaItem(selectedBlocId, item.id)}
                          className="bg-blue-900 text-white font-bold px-2 py-0.5 rounded text-[9.5px]"
                        >
                          DECIDE
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sandbox Propose Resolution panel */}
            <div className="mt-4 border-t border-[#113011]/40 pt-4 font-mono text-xs text-green-300">
              <h3 className="text-gray-400 mb-2 uppercase text-[10px]">Propose new sovereign resolution</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Resolution short title"
                  value={newAgendaTitle}
                  onChange={e => setNewAgendaTitle(e.target.value)}
                  className="w-full bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-xs"
                />
                
                <textarea
                  placeholder="Resolution protocol description..."
                  value={newAgendaDesc}
                  onChange={e => setNewAgendaDesc(e.target.value)}
                  className="w-full bg-black border border-[#113011] text-[#4af626] rounded px-2.5 py-1 text-[11px] h-12"
                />

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <select
                    value={newAgendaType}
                    onChange={e => setNewAgendaType(e.target.value as any)}
                    className="bg-black border border-[#113011] text-[#4af626] rounded px-2 py-1"
                  >
                    <option value="CRISIS_RESPONSE">Strategic Crisis Response</option>
                    <option value="SECURITY_EXERCISE">Joint Military Drills</option>
                    <option value="DEVELOPMENT_PACKAGE">Development aid grant</option>
                    <option value="LOCAL_CURRENCY_VOTE">Activate De-dollarization</option>
                    <option value="COMMUNIQUE_WORDING">Summit communique wording</option>
                  </select>

                  <button
                    onClick={() => {
                      if (!newAgendaTitle) return;
                      proposeAgendaItem(selectedBlocId, {
                        title: newAgendaTitle,
                        description: newAgendaDesc || 'No custom description provided.',
                        type: newAgendaType,
                        initiatorId: playerCountryId,
                        requiredFundingB: newAgendaFunding,
                        targetId: newAgendaTarget
                      });
                      setNewAgendaTitle('');
                      setNewAgendaDesc('');
                    }}
                    className="bg-[#0b240b] border border-[#18ed10] hover:bg-[#18ed10]/10 text-[#18ed10] font-bold py-1 px-3 rounded uppercase text-[10px]"
                  >
                    🚀 RATIFY RESOLUTION
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SWING STATES & HEDGING POSTURES TRACKER */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded">
            <h2 className="text-[11px] uppercase text-gray-400 font-mono tracking-widest mb-4 flex justify-between">
              <span>HEDGING SWING-STATES TACTICS</span>
              <span className="text-yellow-400">AMBIGUITY SCALE</span>
            </h2>

            <div className="grid grid-cols-4 gap-1 mb-3">
              {Object.keys(swingStates).map(sid => {
                const s = swingStates[sid];
                const isSel = selectedSwingStateId === sid;
                return (
                  <button
                    key={sid}
                    onClick={() => setSelectedSwingStateId(sid)}
                    className={`p-1.5 font-mono font-bold text-center border text-[10px] rounded uppercase ${
                      isSel 
                        ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300' 
                        : 'bg-black border-[#113011] text-gray-500 hover:text-green-300'
                    }`}
                  >
                    {countries[sid]?.flagEmoji} {sid}
                  </button>
                );
              })}
            </div>

            {(() => {
              const swObj = swingStates[selectedSwingStateId];
              if (!swObj) return <p className="text-xs text-gray-500 font-mono">No swing profile retrieved...</p>;
              const { profile, posture } = swObj;
              const country = countries[selectedSwingStateId];

              return (
                <div className="bg-[#080802] border border-yellow-500/25 p-3 rounded font-mono text-xs relative">
                  <div className="absolute top-2 right-2 text-[#ebd41d] font-bold">🎯 {posture.tacticalAmbiguityRating}% Ambiguity</div>
                  <strong className="text-white text-sm block mb-1">
                    {country?.flagEmoji} {country?.name} PROFILE
                  </strong>
                  
                  <div className="text-[10px] text-gray-400 mb-3 block">
                    PROCUREMENT ARCHITECTURE: <span className="text-yellow-300">{profile.militaryProcurementDiversity}</span> // INFRASTRUCTURE EXTRACTED: <span className="text-green-400">${posture.concessionsExtractedB.toFixed(1)}B</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-300 mb-3 border-b border-[#25250c] pb-2.5">
                    <div className="flex justify-between">
                      <span>Sovereign Autonomy preference:</span>
                      <span className="text-white font-bold">{profile.autonomyPreference}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alignment flexibility indicator:</span>
                      <span className="text-white font-bold">{profile.alignmentFlexibility}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Military Tilt:</span>
                      <span className="text-cyan-400 font-bold uppercase">{posture.primaryMilitaryTilt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Economic Tilt:</span>
                      <span className="text-green-300 font-bold uppercase">{posture.primaryEconomicTilt}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 bg-black/40 p-2 rounded mb-3 leading-tight border border-yellow-500/10">
                    <strong>LAST TACTICAL HEDGING RECORD:</strong>
                    <div className="mt-1 text-yellow-100">{posture.lastHedgingAction}</div>
                  </div>

                  {/* Sandbox actions to force hedge */}
                  {selectedSwingStateId === playerCountryId && (
                    <div className="flex flex-col gap-1 b-t border-[#1e1e0a] pt-2">
                      <span className="text-[9px] text-gray-500 uppercase">Trigger active hedging (Extract sovereign gains):</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => engageHedgingAction(playerCountryId, 'DIVERSIFY_ARMS')}
                          className="bg-yellow-950/40 border border-yellow-500 text-yellow-400 text-[8.5px] py-1 rounded"
                        >
                          📦 Diversify Defense ($1.2B)
                        </button>
                        <button
                          onClick={() => engageHedgingAction(playerCountryId, 'ACCEPT_ECONOMIC_CORRIDOR')}
                          className="bg-yellow-950/40 border border-yellow-500 text-yellow-400 text-[8.5px] py-1 rounded"
                        >
                          ⚓ Accept Corridor ($2.8B)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* BLOCK MEMBERSHIP ACCESSIONS & SUSPENSIONS */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded font-mono text-xs">
            <h2 className="text-[11px] uppercase text-gray-400 tracking-widest mb-3">ACCESSIONS, gatekeeping and SUSPENSIONS OFFICE</h2>
            
            <div className="space-y-4">
              {/* Accessions pipeline */}
              <div>
                <h4 className="text-[10px] text-cyan-400 uppercase mb-2">Gatekeeping candidate logs</h4>
                {selectedBloc.accessions.length === 0 ? (
                  <p className="text-[10px] text-gray-500">No active candidates are lobbying for admission.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedBloc.accessions.map(acc => {
                      return (
                        <div key={acc.id} className="bg-black/60 border border-[#113011] p-2 rounded tracking-tighter flex justify-between items-center text-[10px]">
                          <div>
                            Applicant: <strong>{acc.applicantCountryId}</strong> | Ready: <strong>{acc.readyScore}%</strong>
                            <div className="text-[9px] text-gray-400 uppercase">Stage: {acc.stage}</div>
                          </div>
                          
                          <button
                            onClick={() => advanceMembershipAccession(selectedBlocId, acc.applicantCountryId, playerCountryId)}
                            className="bg-cyan-900 text-white px-2 py-0.5 rounded text-[9px]"
                          >
                            🚀 Sponsor Pathway
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lobby Sandbox Entry applicant */}
              <div className="bg-[#030903] border border-[#113c11] p-3 rounded">
                <span className="text-[9px] text-gray-400 block mb-1">ENFORCE APPLICATION PIPELINE:</span>
                <div className="flex gap-2">
                  <select
                    value={newApplicantId}
                    onChange={e => setNewApplicantId(e.target.value)}
                    className="bg-black border border-[#113011] text-[#4af626] rounded px-2 py-1 text-[11px] flex-grow"
                  >
                    {supportedCountryIds.map(cid => (
                      <option key={cid} value={cid}>{cid} - {countries[cid]?.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => initiateMembershipApplication(selectedBlocId, newApplicantId)}
                    className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold px-3 py-1 rounded"
                  >
                    Initiate Dialog
                  </button>
                </div>
              </div>

              {/* Suspensions and drift panel */}
              <div className="border-t border-[#113011]/30 pt-3">
                <span className="text-[10px] text-red-400 block mb-1">POLITICAL SUSPENSION AUDIT:</span>
                <div className="flex gap-2">
                  <select
                    value={newSuspendedId}
                    onChange={e => setNewSuspendedId(e.target.value)}
                    className="bg-black border border-[#113011] text-[#4af626] rounded px-2 py-1 text-[11px] flex-grow"
                  >
                    {Object.keys(selectedBloc.members).map(cid => (
                      <option key={cid} value={cid}>{cid}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => suspendMember(selectedBlocId, newSuspendedId, 'FRACTURE_DISREGARD')}
                    className="bg-red-950 text-red-400 border border-red-900 text-[10px] px-3 py-1 rounded"
                  >
                    EXECUTE SUSPENSION
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CROSS-BLOC DIALOGUE HOTLINES & CONFIDENCE MEASURES */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded font-mono text-xs">
            <h2 className="text-[11px] uppercase text-gray-400 tracking-widest mb-3">CROSS-BLOC CONFIDENCE INTERFACES</h2>

            <div className="space-y-3">
              {Object.values(crossBlocChannels).map(ch => {
                return (
                  <div key={ch.id} className="border border-cyan-900 bg-[#021012] p-3 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-white text-[11px]">{ch.originBloc} ↔ {ch.targetBloc} Channel</strong>
                      <span className="text-cyan-400 text-[9px] bg-cyan-950 border border-cyan-800 px-1 uppercase">{ch.channelType}</span>
                    </div>

                    <p className="text-[10px] text-gray-400 leading-normal mb-2">
                      Dialogue status: <strong className="text-cyan-300">{ch.integrityIndex}% integrity</strong> | Last updated tick: {ch.lastActivityTick}
                    </p>

                    <div className="text-[9px] bg-black/40 p-2 border border-cyan-950 rounded mb-2.5">
                      <strong>RATIFIED CONFIDENCE MEASURES (CBM):</strong>
                      <ul className="list-disc pl-3 mt-1.5 text-gray-300">
                        {ch.agreedConfidenceMeasures.map((cm, idx) => (
                          <li key={idx}>{cm}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Propose a CBM */}
                    <button
                      onClick={() => proposeCrossBlocCBM(ch.id, 'Mutual Cyber Restraint Protocol', 15, 25)}
                      className="w-full bg-[#112325] border border-cyan-500 hover:bg-[#163a3d] text-[10px] py-1 text-cyan-400 rounded transition-all font-bold uppercase tracking-wider"
                    >
                      🤝 ENGAGE CONFIDENCE MEASURE (20 AP)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTORICAL INSTITUTIONAL MEMORY LOGS */}
          <div className="border border-[#0f3d0f] bg-black p-4 rounded font-mono text-[11px] h-[250px] flex flex-col">
            <h2 className="text-[11px] uppercase text-gray-400 tracking-widest mb-3 flex justify-between">
              <span>INSTITUTIONAL MEMORY LEDGERS</span>
              <span className="text-green-500">SECURE LOG</span>
            </h2>
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 text-[10px]">
              {activeMemory.historyLog.map((log, idx) => (
                <div key={idx} className="border-b border-[#113011]/30 pb-2 flex gap-2">
                  <span className="text-[#18ed10] font-bold">[{log.tick}T]</span>
                  <div>
                    <p className="text-white leading-normal">{log.description}</p>
                    <span className={`text-[8px] uppercase ${
                      log.impactType === 'COHESION_GAIN' || log.impactType === 'TRUST_BOOST' ? 'text-green-400' : 'text-red-500'
                    }`}>
                      IMPACT: {log.impactType} {log.relatedCountryId ? `// ATOM: ${log.relatedCountryId}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sandbox Global Drills controller */}
          <div className="flex gap-2">
            <button
              onClick={() => executeJointExercise(selectedBlocId)}
              className="flex-grow bg-[#0f2d0f] border border-[#18ed10] hover:bg-[#154615] hover:text-white px-3 py-2 text-xs uppercase font-bold text-[#18ed10] rounded transition-all font-mono"
            >
              🎯 Mobilise joint military drills
            </button>

            {selectedBlocId === 'BRICS' && (
              <button
                onClick={() => toggleLocalCurrencySettlement('BRICS')}
                className="bg-yellow-950 border border-yellow-500 text-yellow-300 font-bold px-3 py-2 text-xs uppercase rounded hover:bg-yellow-900 transition-all font-mono"
              >
                🧱 Toggle Local currency settle
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
    </PanelFxShell>
  );
}
