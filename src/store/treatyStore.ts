import { create } from 'zustand';
import { produce } from 'immer';
import { useWorldStore } from './worldStore';
import { usePlayerStore } from './playerStore';
import { useUIStore } from './uiStore';
import { audio } from '../utils/audio';
import {
  RichTreatyState,
  TreatyObligation,
  TreatyDurationProfile,
  TreatyPenaltyProfile,
  TreatyHiddenProtocol,
  TreatyInspectionRule,
  TreatyViolationRecord,
  TreatyCredibilityMemory,
  TreatyConcessionItem,
  TreatyOfferPackage,
  TreatyCounteroffer,
  TreatyRedLineProfile,
  TreatyBargainingLeverageState,
  TreatyNegotiationLog,
  TreatyNegotiationSession,
  TreatyLegacyEffect
} from '../types/treaty';
import { TreatyState, WorldEvent } from '../types';

interface TreatyStoreState {
  credibilityMemories: Record<string, TreatyCredibilityMemory>;
  negotiationSessions: Record<string, TreatyNegotiationSession>;
  activeSessionId: string | null;
  legacyEffects: TreatyLegacyEffect[];
  treatyFatigueByCountry: Record<string, number>; // countryId -> 0-100 score
  initialized: boolean;
}

interface TreatyStoreActions {
  initializeTreatyStore: () => void;
  startNegotiationSession: (playerId: string, adversaryId: string, treatyType: string) => string;
  submitPlayerProposal: (sessionId: string) => void;
  acceptAdversaryOffer: (sessionId: string) => void;
  userWalkAway: (sessionId: string) => void;
  toggleObligation: (sessionId: string, obligationId: string) => void;
  toggleHiddenProtocol: (sessionId: string, protocolId: string) => void;
  addConcessionItem: (sessionId: string, concession: TreatyConcessionItem, category: 'OFFERED' | 'DEMANDED') => void;
  removeConcessionItem: (sessionId: string, concessionId: string, category: 'OFFERED' | 'DEMANDED') => void;
  violateTreatyClause: (treatyId: string, countryId: string, clauseId: string, breachType: string) => void;
  terminateTreaty: (treatyId: string, exitMethod: 'OPPORTUNISTIC_EXIT' | 'HONORABLE_EXIT') => void;
  tickTreatySimulation: (currentTick: number) => void;
  setActiveSessionId: (id: string | null) => void;
}

export const useTreatyStore = create<TreatyStoreState & TreatyStoreActions>((set, get) => ({
  credibilityMemories: {},
  negotiationSessions: {},
  activeSessionId: null,
  legacyEffects: [],
  treatyFatigueByCountry: {},
  initialized: false,

  initializeTreatyStore: () => {
    if (get().initialized) return;

    const initialMemories: Record<string, TreatyCredibilityMemory> = {
      US: {
        countryId: 'US',
        overallScore: 88,
        categoryScores: { military: 92, trade: 85, inspection: 90, intelligence: 95, sanctions: 80 },
        violationCount: 1,
        goodFaithFulfilmentStreak: 12,
        history: [{ tick: -50, treatyId: 'INIT', treatyName: 'Sovereign Debt Accord', actionType: 'FULFILLED', credibilityDelta: 2, description: 'Serviced all public debt coupons timely despite debt cap crises.' }]
      },
      GB: {
        countryId: 'GB',
        overallScore: 92,
        categoryScores: { military: 95, trade: 90, inspection: 92, intelligence: 96, sanctions: 88 },
        violationCount: 0,
        goodFaithFulfilmentStreak: 25,
        history: []
      },
      FR: {
        countryId: 'FR',
        overallScore: 85,
        categoryScores: { military: 88, trade: 82, inspection: 86, intelligence: 90, sanctions: 80 },
        violationCount: 2,
        goodFaithFulfilmentStreak: 8,
        history: []
      },
      DE: {
        countryId: 'DE',
        overallScore: 90,
        categoryScores: { military: 85, trade: 95, inspection: 94, intelligence: 85, sanctions: 92 },
        violationCount: 0,
        goodFaithFulfilmentStreak: 18,
        history: []
      },
      RU: {
        countryId: 'RU',
        overallScore: 40,
        categoryScores: { military: 32, trade: 45, inspection: 25, intelligence: 40, sanctions: 58 },
        violationCount: 6,
        goodFaithFulfilmentStreak: 1,
        history: [
          { tick: -42, treatyId: 'INF_TREATY', treatyName: 'Intermediate Nuclear Forces', actionType: 'CONFIRMED_BREACH', credibilityDelta: -25, description: 'Non-compliant deployment of tactical 9M729 cruise missile battalions.' },
          { tick: -10, treatyId: 'CEASE_FIRE_INIT', treatyName: 'Regional Disengagement', actionType: 'CONFIRMED_BREACH', credibilityDelta: -10, description: 'Forward surveillance units fired over de-mobilized frontier zones.' }
        ]
      },
      CN: {
        countryId: 'CN',
        overallScore: 65,
        categoryScores: { military: 70, trade: 55, inspection: 60, intelligence: 72, sanctions: 68 },
        violationCount: 3,
        goodFaithFulfilmentStreak: 4,
        history: [{ tick: -15, treatyId: 'INTEL_RESTRAINT', treatyName: 'Commercial Anti-Espionage', actionType: 'SUSPECTED_BREACH', credibilityDelta: -8, description: 'Covert IP extractions detected on advanced EU automotive servers.' }]
      },
      IR: {
        countryId: 'IR',
        overallScore: 35,
        categoryScores: { military: 30, trade: 40, inspection: 20, intelligence: 35, sanctions: 50 },
        violationCount: 5,
        goodFaithFulfilmentStreak: 2,
        history: [{ tick: -8, treatyId: 'JCPOA', treatyName: 'Nuclear Containment Compact', actionType: 'CONFIRMED_BREACH', credibilityDelta: -15, description: 'Evaded IAEA monitoring by sealing access to underground centrifuge cascades.' }]
      },
      KP: {
        countryId: 'KP',
        overallScore: 20,
        categoryScores: { military: 15, trade: 22, inspection: 10, intelligence: 15, sanctions: 38 },
        violationCount: 8,
        goodFaithFulfilmentStreak: 0,
        history: [{ tick: -60, treatyId: 'NPT', treatyName: 'Non-Proliferation Treaty', actionType: 'CONFIRMED_BREACH', credibilityDelta: -35, description: 'Withdrew unilaterally and detonated multiple baseline nuclear fission devices.' }]
      },
      IL: {
        countryId: 'IL',
        overallScore: 78,
        categoryScores: { military: 82, trade: 75, inspection: 70, intelligence: 85, sanctions: 80 },
        violationCount: 2,
        goodFaithFulfilmentStreak: 5,
        history: []
      }
    };

    set({
      credibilityMemories: initialMemories,
      treatyFatigueByCountry: { US: 25, GB: 15, FR: 20, DE: 18, RU: 45, CN: 30, IR: 55, KP: 60 },
      initialized: true
    });
  },

  setActiveSessionId: (id) => set({ activeSessionId: id }),

  startNegotiationSession: (playerId, adversaryId, treatyType) => {
    get().initializeTreatyStore();
    const sessionId = `NEGOTIATION-${adversaryId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const world = useWorldStore.getState().world;
    const countries = useWorldStore.getState().countries;
    const playerC = countries[playerId || 'US'];
    const advC = countries[adversaryId];

    // Build unique pre-seeded obligations depending on type
    const obligations: TreatyObligation[] = [];
    const hiddenProtocols: TreatyHiddenProtocol[] = [];
    let publicTextSummary = '';
    let privateTextSummary = '';
    let title = '';

    const defaultPenalties: TreatyPenaltyProfile[] = [
      {
        id: 'PEN-CRED-DEG',
        type: 'CREDIBILITY_DEGRADATION',
        severity: 'SEVERE',
        description: 'Permanent 15-point scarring of global bargaining credibility memory.',
        automaticTriggerTickCount: 1
      },
      {
        id: 'PEN-TARIFF-SNAP',
        type: 'TARIFF_SNAPBACK',
        severity: 'MODERATE',
        description: 'Immediate 25% import tariff hike applied in retaliatory markets.',
        automaticTriggerTickCount: 2
      }
    ];

    if (treatyType === 'CEASE_FIRE') {
      title = `De-escalation agreement with ${adversaryId}`;
      publicTextSummary = `Immediate halt of hostile kinetic actions, established communication corridors, and pull-back of forward armored brigade battlegroups.`;
      privateTextSummary = `Both signatures commit to cease combat operations, suspend targeted border cyber subversions, and exchange real-time military staging logs.`;
      obligations.push({
        id: 'OB-CEASE-FIRE',
        category: 'MILITARY',
        description: 'Complete suspension of kinetic strike vectors and airspace intrusions.',
        scope: 'Strike exclusion targeting sovereign administrative centers',
        triggerCondition: 'Immediate activation',
        observability: 'PUBLIC',
        complianceScore: 100,
        violationSeverityWeight: 90,
        attachedPenalties: ['PEN-CRED-DEG']
      });
      obligations.push({
        id: 'OB-CORRIDOR-SAFE',
        category: 'POSTURE',
        description: 'Secure transport route safety and maritime lane protection.',
        scope: 'Hormuz trade routes and choke points',
        triggerCondition: 'Active transport triggers',
        observability: 'PUBLIC',
        complianceScore: 100,
        violationSeverityWeight: 60,
        attachedPenalties: ['PEN-TARIFF-SNAP']
      });
    } else if (treatyType === 'TRADE') {
      title = `Preferential Economic Corridor agreement with ${adversaryId}`;
      publicTextSummary = `Bilateral tariff reductions on core consumer goods, streamlined custom inspection terminals, and mutual foreign direct investment waivers.`;
      privateTextSummary = `Agreement grants preferential silicon and agricultural shipping access, with a secret carve-out sheltering critical chip fabrication equipment from trade caps.`;
      obligations.push({
        id: 'OB-TARIFF-CAP',
        category: 'ECONOMIC',
        description: 'Enforce dynamic tariff caps flat-rated to a maximum of 5% on all primary manufacturing.',
        scope: 'Automotive and electronics exports',
        triggerCondition: 'Continuous',
        observability: 'PUBLIC',
        complianceScore: 100,
        violationSeverityWeight: 50,
        attachedPenalties: ['PEN-TARIFF-SNAP']
      });
      hiddenProtocols.push({
        id: 'HP-TECH-EXCLUSION',
        title: 'Secret Advanced Semiconductor Shelter',
        clauseSummaryPublic: 'Standard mutual intellectual property assurances.',
        clauseSummaryPrivate: 'Bypasses standard embargoes - player may import high-density cleanroom machinery silently.',
        signatoriesAllowed: [playerId, adversaryId],
        leverageOffset: 15,
        exposed: false,
        exposureImpactScore: 40
      });
    } else if (treatyType === 'ALLIANCE') {
      title = `Mutual Defensive Strategic Accord with ${adversaryId}`;
      publicTextSummary = `Binding article-level collective defense commitment. Any armed escalation on a signatory will be countered with unified defensive military maneuvers.`;
      privateTextSummary = `Unified threat warning synchronization, base access rights for forward recon command centers, and mutual high-grade radar feed sharing.`;
      obligations.push({
        id: 'OB-DEFENSE-AID',
        category: 'MILITARY',
        description: 'Provide immediate cyber, economic, and orbital defense support on territorial violations.',
        scope: 'Sovereign boundaries inclusion',
        triggerCondition: 'Sovereign border breach',
        observability: 'PUBLIC',
        complianceScore: 100,
        violationSeverityWeight: 95,
        attachedPenalties: ['PEN-CRED-DEG']
      });
      obligations.push({
        id: 'OB-BASE-ACCESS',
        category: 'BASE_ACCESS',
        description: 'Enable staging and defense installation placement at designated warm-water base hubs.',
        scope: 'Coastal base staging rights',
        triggerCondition: 'High alert status',
        observability: 'PUBLIC',
        complianceScore: 100,
        violationSeverityWeight: 75,
        attachedPenalties: ['PEN-CRED-DEG']
      });
    } else {
      // Default to Intelligence Compact
      title = `Intelligence sharing and Covert Deconfliction Pact with ${adversaryId}`;
      publicTextSummary = `Establish joint anti-terrorism deconfliction relays, share regional threat reports, and commit to non-targeting of critical satellite telemetry grids.`;
      privateTextSummary = `Deep signal intercept feeds shared weekly, exclusive access to dark fiber tracking databases, and backdoor sharing of advanced cyber target profiles.`;
      obligations.push({
        id: 'OB-INTEL-FEED',
        category: 'INTELLIGENCE',
        description: 'Transmit real-time regional threat assessments and tactical sigint reports.',
        scope: 'Middle East & Asia theater logs',
        triggerCondition: 'Weekly intervals',
        observability: 'CONFIDENTIAL',
        complianceScore: 100,
        violationSeverityWeight: 55,
        attachedPenalties: ['PEN-CRED-DEG']
      });
      hiddenProtocols.push({
        id: 'HP-CYBER-NOTARGET',
        title: 'Covert Critical Grid Waiver',
        clauseSummaryPublic: 'Standard joint digital defense cooperation framework.',
        clauseSummaryPrivate: 'Commit to zero cyber infiltration targeting sovereign banking core servers. Covert networks already placed will reside dormant.',
        signatoriesAllowed: [playerId, adversaryId],
        leverageOffset: 20,
        exposed: false,
        exposureImpactScore: 55
      });
    }

    // Determine default adversary red lines
    const adversaryRedLines: TreatyRedLineProfile[] = [];
    if (adversaryId === 'RU') {
      adversaryRedLines.push({
        id: 'RL-RU-MILITARY',
        category: 'MILITARY_EXPANSION',
        description: 'No deployment of heavy offensive rocket divisions inside neighboring frontier borders.',
        associatedCountryId: 'RU',
        severity: 85,
        currentTriggerScore: 0,
        breachEventDescription: 'Nodal deployment limits crossed!'
      });
    } else if (adversaryId === 'CN') {
      adversaryRedLines.push({
        id: 'RL-CN-TARIFF',
        category: 'TARIFFS',
        description: 'Strict restriction targeting import duty limits. Aggregate tariffs must absolutely sit below 18%.',
        associatedCountryId: 'CN',
        severity: 70,
        currentTriggerScore: 0,
        breachEventDescription: 'Excess tariffs breaching trading limits!'
      });
    } else if (adversaryId === 'IR') {
      adversaryRedLines.push({
        id: 'RL-IR-INSPECTIONS',
        category: 'INSPECTIONS',
        description: 'Rejection of snap UN-level deep physical audits on sensitive heavy enrichment centers.',
        associatedCountryId: 'IR',
        severity: 90,
        currentTriggerScore: 0,
        breachEventDescription: 'Inspection access limit triggered sovereign exclusion.'
      });
    }

    // Default player-assessed leverage
    const rawOppTrust = (advC as any)?.ai?.trustByCountry[playerId] ?? 50;
    const opponentCred = get().credibilityMemories[adversaryId]?.overallScore ?? 50;
    const leverageState: TreatyBargainingLeverageState = {
      militaryBalanceRatio: parseFloat(((playerC?.arsenal.totalPowerRating ?? 1000) / (advC?.arsenal.totalPowerRating ?? 500)).toFixed(2)),
      sanctionsPressureIndex: advC?.economic.inflationRate > 10 ? 80 : 35,
      tradeDependencePct: parseFloat((playerC?.opinions[adversaryId] ? 45 : 20).toFixed(0)),
      energyDependencePct: (advC as any)?.economic?.energyProfile === 'DEFICIT' ? 75 : 25,
      financialStressIndex: Math.round(playerC?.economic.treasuryCashB < 10 ? 85 : 25),
      allianceSupportRating: Object.values(countries).filter(c => c.allianceBlock === playerC?.allianceBlock).length * 15,
      urgencyAsymmetryFactor: useWorldStore.getState().globalThreatLevel === 'RED' ? 40 : 0,
      intelligenceAdvantageScore: 60,
      currentCredibilityRating: get().credibilityMemories[playerId]?.overallScore ?? 80,
      domesticStabilityBuffer: Math.round(playerC?.political.stabilityIndex ?? 80),
      treatyFatigueIndex: Math.round(get().treatyFatigueByCountry[playerId] ?? 20)
    };

    // Calculate approximate Zone of Possible Agreement (ZOPA) Feasibility
    const zopaFeasible = (rawOppTrust * 0.4 + opponentCred * 0.4 + (100 - leverageState.treatyFatigueIndex) * 0.2) > 40;

    const offer: TreatyOfferPackage = {
      title,
      type: treatyType as any,
      proposerId: playerId,
      recipientId: adversaryId,
      publicTextSummary,
      privateTextSummary,
      durationTicks: 30,
      detailedObligations: obligations,
      hiddenProtocols,
      offeredConcessions: [],
      demandedConcessions: [],
      isMultilateral: false,
      secrecyLevel: treatyType === 'TRADE' ? 30 : 65,
      enforcementStrength: 75
    };

    const newSession: TreatyNegotiationSession = {
      id: sessionId,
      title,
      playerId,
      adversaryId,
      stage: 'INITIAL_PROPOSAL',
      currentOfferPackage: offer,
      negotiationHistory: [],
      negotiationLogs: [
        {
          tick: world?.tick ?? 0,
          roundIndex: 0,
          actorId: playerId,
          action: 'PROPOSAL',
          description: `Initiated high-level official security corridor treaty session drafting.`
        }
      ],
      adversaryRedLines,
      playerAssessedLeverage: leverageState,
      zoneOfPossibleAgreementEstimated: {
        overlapExisted: zopaFeasible,
        confidenceLevel: Math.round(40 + rawOppTrust * 0.5),
        frictionPoints: leverageState.treatyFatigueIndex > 50 ? ['Sovereign Treaty Fatigue Limit'] : ['Opinion Divergence', 'Inspection Rights Audit'],
        partnerPriorities: treatyType === 'CEASE_FIRE' ? ['Frontline Security', 'Tension De-escalation'] : ['Trade Guarantees', 'Silicon corridor'],
        feasibilityRating: Math.round(rawOppTrust * 0.5 + opponentCred * 0.4)
      },
      roundsRemaining: 4,
      deadlineTicks: 24,
      provisionalAccepted: false
    };

    set(produce((draft: TreatyStoreState) => {
      draft.negotiationSessions[sessionId] = newSession;
      draft.activeSessionId = sessionId;
    }));

    return sessionId;
  },

  submitPlayerProposal: (sessionId) => {
    const session = get().negotiationSessions[sessionId];
    if (!session) return;
    if (session.roundsRemaining <= 0) {
      useUIStore.getState().pushAlert({
        title: 'DEADLINE REACHED',
        message: 'Formal diplomatic window elapsed. Adversary walked away from negotiations.',
        type: 'DANGER'
      });
      return;
    }

    audio.sfxKeyClick();

    // Core AI Evaluation Logic
    const playerId = session.playerId;
    const adversaryId = session.adversaryId;
    const currentOffer = session.currentOfferPackage;
    
    // Read adversary states
    const countries = useWorldStore.getState().countries;
    const advC = countries[adversaryId];
    const playerC = countries[playerId];

    const currentTick = useWorldStore.getState().currentTick;
    const advTrust = (advC as any)?.ai?.trustByCountry[playerId] ?? 50;
    const advCred = get().credibilityMemories[adversaryId]?.overallScore ?? 50;
    const playerCred = get().credibilityMemories[playerId]?.overallScore ?? 80;

    // Red line check:
    let redLineHitDescription = '';
    session.adversaryRedLines.forEach(rl => {
      // simulate trigger
      if (rl.category === 'TARIFFS' && currentOffer.type === 'TRADE') {
        const excessTariffsOccurred = currentOffer.offeredConcessions.some(c => c.type === 'TARIFF_REDUCTION' && c.concessionValue < 5);
        if (excessTariffsOccurred) {
          redLineHitDescription = rl.description;
        }
      } else if (rl.category === 'INSPECTIONS' && currentOffer.detailedObligations.some(o => o.category === 'BASE_ACCESS')) {
        redLineHitDescription = rl.description;
      }
    });

    if (redLineHitDescription) {
      set(produce((draft: TreatyStoreState) => {
        const s = draft.negotiationSessions[sessionId];
        s.stage = 'FAILED_LIMIT';
        s.roundsRemaining = 0;
        s.negotiationLogs.push({
          tick: currentTick,
          roundIndex: 5 - s.roundsRemaining,
          actorId: adversaryId,
          action: 'WALKED_AWAY',
          description: `CRITICAL DETOUR: Proposal breached sovereign Red Line ("${redLineHitDescription}"). Negotiation team recalled.`
        });
      }));

      useUIStore.getState().pushAlert({
        title: 'RED LINE BREACHED',
        message: `Strategic crisis: The proposal triggered an absolute sovereignty redline. Negotiation collapsed instantly.`,
        type: 'DANGER'
      });
      return;
    }

    // Bargaining balance evaluation
    let proposalUtility = 40; // baseline
    
    // Credibility factor
    proposalUtility += (playerCred - 50) * 0.3; // Poor credibility decreases utility

    // Trust factors
    proposalUtility += (advTrust - 50) * 0.4;

    // Concessions added
    const offerConcessionVal = currentOffer.offeredConcessions.reduce((acc, c) => acc + c.concessionValue, 0);
    const demandConcessionVal = currentOffer.demandedConcessions.reduce((acc, c) => acc + c.concessionValue, 0);
    proposalUtility += (offerConcessionVal - demandConcessionVal) * 0.8;

    // Hidden protocol offset
    const hiddenOffset = currentOffer.hiddenProtocols.reduce((acc, p) => acc + (p.exposed ? -20 : p.leverageOffset), 0);
    proposalUtility += hiddenOffset * 0.5;

    // Deadline urgency
    if (session.roundsRemaining === 1) {
      proposalUtility += 15; // desperation booster if mutual interests exist
    }

    // AI accepts if utility is 60+
    const accepted = proposalUtility >= 58;

    if (accepted) {
      set(produce((draft: TreatyStoreState) => {
        const s = draft.negotiationSessions[sessionId];
        s.stage = 'DRAFT_FINAL';
        s.provisionalAccepted = true;
        s.negotiationLogs.push({
          tick: currentTick,
          roundIndex: 5 - s.roundsRemaining,
          actorId: adversaryId,
          action: 'ACCEPTED',
          description: `Draft terms provisional acceptance confirmed. Signed and queued for sovereign ratification.`
        });
      }));

      useUIStore.getState().pushAlert({
        title: 'PROPOSAL ACCEPTED',
        message: `Diplomatic success: ${adversaryId} has accepted the draft parameters. Seal the partnership to activate.`,
        type: 'INFO'
      });
    } else {
      // Counter-offer generation
      const counterItem: TreatyConcessionItem = {
        id: `CON-COUNTER-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: currentOffer.type === 'TRADE' ? 'TARIFF_REDUCTION' : 'INTELLIGENCE_SHARING',
        description: currentOffer.type === 'TRADE' 
          ? `Demand additional 10% customs tariff waiver on consumer electronics imports.` 
          : 'Request high-volume direct radar sharing feeds mapped weekly.',
        offeredBy: adversaryId,
        recipientId: playerId,
        concessionValue: 20,
        leverageOffset: 12,
        politicalCost: 15
      };

      set(produce((draft: TreatyStoreState) => {
        const s = draft.negotiationSessions[sessionId];
        s.roundsRemaining = Math.max(0, s.roundsRemaining - 1);
        s.stage = 'CONCESSION_TRADING';
        
        // Generate counteroffer package
        const counterPack: TreatyOfferPackage = {
          ...currentOffer,
          proposerId: adversaryId,
          recipientId: playerId,
          demandedConcessions: [...currentOffer.demandedConcessions, counterItem]
        };

        s.negotiationHistory.push({
          id: `CO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          roundIndex: 4 - s.roundsRemaining,
          timestampTick: currentTick,
          offeredBy: adversaryId,
          package: counterPack,
          justificationText: `Initial parameters lack sovereign parity. Demanding complementary concessions regarding ${counterItem.type.replace('_', ' ').toLowerCase()} to reach strategic equilibrium.`
        });

        s.negotiationLogs.push({
          tick: currentTick,
          roundIndex: 4 - s.roundsRemaining,
          actorId: adversaryId,
          action: 'COUNTEROFFER',
          description: `Dispatched counter-framework. Required key concession adjustments passed to player envoy.`
        });
      }));

      useUIStore.getState().pushAlert({
        title: 'COUNTEROFFER RECEIVED',
        message: `Negotiation adjustment: ${adversaryId} returns a counterproposal. Review terms and remaining rounds.`,
        type: 'WARNING'
      });
    }
  },

  acceptAdversaryOffer: (sessionId) => {
    const session = get().negotiationSessions[sessionId];
    if (!session) return;

    audio.sfxKeyClick();
    const currentTick = useWorldStore.getState().currentTick;
    const currentOffer = session.currentOfferPackage;
    const treatyId = `TREATY-${currentOffer.type}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create standard compatible TreatyState
    const actualTreaty: RichTreatyState = {
      id: treatyId,
      name: currentOffer.title,
      type: currentOffer.type as any,
      signatoryCountryIds: [session.playerId, session.adversaryId],
      obligations: currentOffer.detailedObligations.map(o => o.description),
      detailedObligations: currentOffer.detailedObligations,
      enforcementStrength: currentOffer.enforcementStrength,
      secrecyLevel: currentOffer.secrecyLevel,
      startTick: currentTick,
      expirationTick: currentTick + currentOffer.durationTicks,
      complianceByCountry: { [session.playerId]: 100, [session.adversaryId]: 100 },
      violationHistory: [],
      status: 'ACTIVE',
      blocEffects: {},
      tags: ['TREATY_ARCHITECTURE', ...currentOffer.detailedObligations.map(o => o.category)],
      durationProfile: {
        startTick: currentTick,
        durationTicks: currentOffer.durationTicks,
        probationaryTicksEndTime: currentTick + 6,
        renewalWindowStartTicksDelta: 4,
        sunsetClauseDescription: 'Auto-expires naturally on terminal tick.',
        reviewIntervalTicks: 12,
        lastReviewTick: null,
        withdrawalNoticeTicks: 6
      },
      penalties: [
        { id: 'PEN-CRED', type: 'CREDIBILITY_DEGRADATION', severity: 'SEVERE', description: 'Violator loses credibility memory points.', automaticTriggerTickCount: 1 }
      ],
      hiddenProtocols: currentOffer.hiddenProtocols,
      inspectionRules: [
        { id: 'INSP-UN', agencyType: 'UN_INSPECTORS', frequencyTicks: 8, lastInspectionTick: null, evasionDifficulty: 50, effectivenessIndex: 70 }
      ],
      credibilityImpactToDate: { [session.playerId]: 0, [session.adversaryId]: 0 },
      publicText: currentOffer.publicTextSummary,
      privateText: currentOffer.privateTextSummary,
      isMultilateral: false,
      fatigueCostPerTick: currentOffer.detailedObligations.length * 1.5,
      legacyEffects: []
    };

    // Store in WorldStore
    useWorldStore.getState().applyTickDelta((draft) => {
      draft.world.treatiesById[treatyId] = actualTreaty;
    });

    // Update session stage
    set(produce((draft: TreatyStoreState) => {
      draft.negotiationSessions[sessionId].stage = 'COMPLETE';
      draft.activeSessionId = null;

      // Update Good faith streak in credibility memory
      const pId = session.playerId;
      const advId = session.adversaryId;
      if (draft.credibilityMemories[pId]) {
        draft.credibilityMemories[pId].goodFaithFulfilmentStreak += 1;
        draft.credibilityMemories[pId].history.unshift({
          tick: currentTick,
          treatyId,
          treatyName: actualTreaty.name,
          actionType: 'FULFILLED',
          credibilityDelta: 3,
          description: `Successfully signed and ratified commitment package "${actualTreaty.name}".`
        });
        draft.credibilityMemories[pId].overallScore = Math.min(100, draft.credibilityMemories[pId].overallScore + 3);
      }
    }));

    // Emit event
    useWorldStore.getState().addGlobalEvent(`TREATY RATIFIED: Signed Mutual agreement "${actualTreaty.name}" between ${session.playerId} and ${session.adversaryId}.`, 'INFO');

    useUIStore.getState().pushAlert({
      title: 'TREATY RATIFIED',
      message: `Agreement sealed: "${actualTreaty.name}" is now globally active and binding.`,
      type: 'INFO'
    });
  },

  userWalkAway: (sessionId) => {
    audio.sfxKeyClick();
    set(produce((draft: TreatyStoreState) => {
      const s = draft.negotiationSessions[sessionId];
      if (s) {
        s.stage = 'WALKED_AWAY';
        s.negotiationLogs.push({
          tick: useWorldStore.getState().currentTick,
          roundIndex: 5 - s.roundsRemaining,
          actorId: s.playerId,
          action: 'WALKED_AWAY',
          description: 'Left the negotiation chamber unilaterally. Draft discarded.'
        });
      }
      draft.activeSessionId = null;
    }));
  },

  toggleObligation: (sessionId, obligationId) => {
    set(produce((draft: TreatyStoreState) => {
      const s = draft.negotiationSessions[sessionId];
      if (s) {
        const index = s.currentOfferPackage.detailedObligations.findIndex(o => o.id === obligationId);
        if (index !== -1) {
          s.currentOfferPackage.detailedObligations.splice(index, 1);
        } else {
          // Re-insert standard obligation proxy
          s.currentOfferPackage.detailedObligations.push({
            id: obligationId,
            category: 'POSTURE',
            description: 'Custom commitment parameters for sovereign alignment.',
            scope: 'Territorial borders verification',
            triggerCondition: 'Immediate',
            observability: 'PUBLIC',
            complianceScore: 100,
            violationSeverityWeight: 50,
            attachedPenalties: ['PEN-CRED-DEG']
          });
        }
      }
    }));
  },

  toggleHiddenProtocol: (sessionId, protocolId) => {
    set(produce((draft: TreatyStoreState) => {
      const s = draft.negotiationSessions[sessionId];
      if (s) {
        const p = s.currentOfferPackage.hiddenProtocols.find(hp => hp.id === protocolId);
        if (p) {
          p.exposed = !p.exposed;
        }
      }
    }));
  },

  addConcessionItem: (sessionId, concession, category) => {
    set(produce((draft: TreatyStoreState) => {
      const s = draft.negotiationSessions[sessionId];
      if (s) {
        if (category === 'OFFERED') {
          s.currentOfferPackage.offeredConcessions.push(concession);
        } else {
          s.currentOfferPackage.demandedConcessions.push(concession);
        }
      }
    }));
  },

  removeConcessionItem: (sessionId, concessionId, category) => {
    set(produce((draft: TreatyStoreState) => {
      const s = draft.negotiationSessions[sessionId];
      if (s) {
        if (category === 'OFFERED') {
          s.currentOfferPackage.offeredConcessions = s.currentOfferPackage.offeredConcessions.filter(c => c.id !== concessionId);
        } else {
          s.currentOfferPackage.demandedConcessions = s.currentOfferPackage.demandedConcessions.filter(c => c.id !== concessionId);
        }
      }
    }));
  },

  violateTreatyClause: (treatyId, countryId, clauseId, breachType) => {
    const world = useWorldStore.getState().world;
    const treaty = world.treatiesById[treatyId] as RichTreatyState;
    if (!treaty) return;

    audio.sfxCrisisWarning();
    const currentTick = useWorldStore.getState().currentTick;

    // Consequence ladder application
    const severityMap: Record<string, 'SOFT' | 'MODERATE' | 'SEVERE' | 'CRITICAL'> = {
      'TECHNICAL_NON_COMPLIANCE': 'SOFT',
      'DELAYED_COMPLIANCE': 'MODERATE',
      'AMBIGUOUS_INTERPRETATION': 'MODERATE',
      'CONCEALED_VIOLATION': 'SEVERE',
      'INTENTIONAL_BREACH': 'CRITICAL',
      'COERCED_BREACH': 'SEVERE'
    };

    const sev = severityMap[breachType] || 'MODERATE';
    const credibilityDelta = sev === 'CRITICAL' ? -25 : sev === 'SEVERE' ? -15 : sev === 'MODERATE' ? -8 : -3;

    // Apply credibility damage & history entry
    set(produce((draft: TreatyStoreState) => {
      if (!draft.credibilityMemories[countryId]) {
        draft.credibilityMemories[countryId] = {
          countryId,
          overallScore: 70,
          categoryScores: { military: 70, trade: 70, inspection: 70, intelligence: 70, sanctions: 70 },
          violationCount: 0,
          goodFaithFulfilmentStreak: 0,
          history: []
        };
      }

      const memory = draft.credibilityMemories[countryId];
      memory.violationCount += 1;
      memory.goodFaithFulfilmentStreak = 0;
      memory.overallScore = Math.max(5, memory.overallScore + credibilityDelta);
      
      // Category adjustments
      if (treaty.type === 'TRADE') memory.categoryScores.trade = Math.max(5, memory.categoryScores.trade + credibilityDelta);
      if (treaty.type === 'ALLIANCE' || treaty.type === 'CEASE_FIRE') memory.categoryScores.military = Math.max(5, memory.categoryScores.military + credibilityDelta);

      memory.history.unshift({
        tick: currentTick,
        treatyId,
        treatyName: treaty.name,
        actionType: breachType === 'CONCEALED_VIOLATION' ? 'CONCEALED_BREACH' : 'CONFIRMED_BREACH',
        credibilityDelta,
        description: `Triggered critical breach: ${breachType.replace('_', ' ')} targeting clause "${clauseId}".`
      });
    }));

    // Depreciate compliance score inside the simulator world state
    useWorldStore.getState().applyTickDelta((draft) => {
      const liveTreaty = draft.world.treatiesById[treatyId];
      if (liveTreaty) {
        liveTreaty.complianceByCountry[countryId] = Math.max(0, (liveTreaty.complianceByCountry[countryId] ?? 100) - (sev === 'CRITICAL' ? 45 : 20));
        liveTreaty.violationHistory.unshift(`Tick ${currentTick}: High-profile violation reported for ${countryId}. Compliance depreciated -20%.`);
      }
    });

    // Update Opinion & trust downwards
    const otherSignatories = treaty.signatoryCountryIds.filter(id => id !== countryId);
    otherSignatories.forEach((otherId) => {
      useWorldStore.getState().applyTickDelta((draft) => {
        const cOther = draft.countries[otherId];
        if (cOther) {
          cOther.opinions[countryId] = Math.max(-100, (cOther.opinions[countryId] ?? 0) - 30);
          if ((cOther as any).ai) {
            (cOther as any).ai.trustByCountry[countryId] = Math.max(0, ((cOther as any).ai.trustByCountry[countryId] ?? 50) - 25);
            (cOther as any).ai.threatPerceptions[countryId] = Math.min(100, ((cOther as any).ai.threatPerceptions[countryId] ?? 30) + 20);
          }
        }
      });
    });

    // Register crisis event
    const crisisId = `CRISIS-BREACH-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const crisis: WorldEvent = {
      id: crisisId,
      type: 'DIPLOMATIC',
      title: `Treaty Breach: ${treaty.name}`,
      description: `Illicit compliance audit exposed severe ${breachType.replace('_', ' ').toLowerCase()} constraints inside ${countryId}. Defensive readiness escalated.`,
      severity: sev === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      status: 'active',
      visibility: breachType === 'CONCEALED_VIOLATION' ? 'CLASSIFIED' : 'PUBLIC',
      startTick: currentTick,
      endTick: null,
      involvedCountryIds: treaty.signatoryCountryIds,
      involvedLeaderIds: [],
      originatingSystem: 'DIPLOMATIC_INTELLIGENCE_SERVICE',
      effects: [],
      tags: ['TREATY_VIOLATION', countryId],
      linkedOperationIds: [],
      linkedIntelFactIds: [],
      escalationPotential: 75,
      historicalLogEntries: [`Tick ${currentTick}: Formal protest filed regarding breach of ${clauseId}.`]
    };

    useWorldStore.getState().applyTickDelta((draft) => {
      draft.world.eventsById[crisisId] = crisis;
    });

    useUIStore.getState().pushAlert({
      title: 'TREATY BREACH FILED',
      message: `${countryId} reported for intentional treaty non-compliance. Relations scarred.`,
      type: 'DANGER'
    });
  },

  terminateTreaty: (treatyId, exitMethod) => {
    const currentTick = useWorldStore.getState().currentTick;
    const world = useWorldStore.getState().world;
    const treaty = world.treatiesById[treatyId];
    if (!treaty) return;

    audio.sfxKeyClick();

    useWorldStore.getState().applyTickDelta((draft) => {
      const t = draft.world.treatiesById[treatyId];
      if (t) {
        t.status = 'TERMINATED';
      }
    });

    // Legacy effects
    const otherSignatories = treaty.signatoryCountryIds.filter(id => id !== 'US');
    const legacy: TreatyLegacyEffect = {
      id: `LEGACY-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      sourceTreatyId: treatyId,
      originalName: treaty.name,
      type: exitMethod === 'OPPORTUNISTIC_EXIT' ? 'SCARRED_TRUST' : 'INSTITUTIONAL_PRECEDENT',
      durationTicksRemaining: 12,
      description: exitMethod === 'OPPORTUNISTIC_EXIT' 
        ? `Scarred trust remains after opportunistic exit of ${treaty.name}. Sovereign partner feels betrayed.`
        : `De-escalation guidelines linger as legalistic memory after expiration.`,
      opinionModValue: exitMethod === 'OPPORTUNISTIC_EXIT' ? -25 : -5,
      economicTractionFactor: 0.95
    };

    set(produce((draft: TreatyStoreState) => {
      draft.legacyEffects.push(legacy);

      // Credibility impact
      const pId = 'US';
      if (draft.credibilityMemories[pId]) {
        const penalty = exitMethod === 'OPPORTUNISTIC_EXIT' ? -15 : -3;
        draft.credibilityMemories[pId].overallScore = Math.max(5, draft.credibilityMemories[pId].overallScore + penalty);
        draft.credibilityMemories[pId].history.unshift({
          tick: currentTick,
          treatyId,
          treatyName: treaty.name,
          actionType: exitMethod,
          credibilityDelta: penalty,
          description: `Terminated treaty "${treaty.name}" via exit method: ${exitMethod.replace('_', ' ').toLowerCase()}.`
        });
      }
    }));

    useWorldStore.getState().addGlobalEvent(`TREATY TERMINATED: Unilateral notice dissolved the accord "${treaty.name}".`, 'WARNING');

    useUIStore.getState().pushAlert({
      title: 'TREATY TERMINATED',
      message: `Accord dissolved. Trust penalties applied according to protocol.`,
      type: 'WARNING'
    });
  },

  tickTreatySimulation: (currentTick) => {
    // Process active treaties, audits, fatigue, and leakages
    get().initializeTreatyStore();
    const world = useWorldStore.getState().world;
    if (!world || !world.treatiesById) return;

    // Apply ticking on legacy effects
    set(produce((draft: TreatyStoreState) => {
      draft.legacyEffects = draft.legacyEffects
        .map(effect => ({ ...effect, durationTicksRemaining: effect.durationTicksRemaining - 1 }))
        .filter(effect => effect.durationTicksRemaining > 0);

      // Update Fatigue based on total Active obligations
      Object.keys(draft.treatyFatigueByCountry).forEach(cid => {
        let activeObligationsCount = 0;
        Object.values(world.treatiesById).forEach(treaty => {
          if (treaty.status === 'ACTIVE' && treaty.signatoryCountryIds.includes(cid)) {
            const rich = treaty as RichTreatyState;
            activeObligationsCount += rich.detailedObligations?.length || 2;
          }
        });

        const fatigueChange = activeObligationsCount > 3 ? 3 : -2;
        draft.treatyFatigueByCountry[cid] = Math.max(5, Math.min(100, (draft.treatyFatigueByCountry[cid] ?? 20) + fatigueChange));
      });
    }));
  }
}));
