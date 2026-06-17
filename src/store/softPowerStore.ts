import { create } from 'zustand';
import { produce } from 'immer';
import { useWorldStore } from './worldStore';
import { useUIStore } from './uiStore';
import { usePlayerStore } from './playerStore';
import {
  SoftPowerVectorType,
  AidProgramType,
  InvestmentDiplomacyType,
  PrestigeEventType,
  BoycottStyle,
  DiasporaActivationMode,
  AudienceSegmentId,
  SoftPowerVector,
  CulturalReachChannel,
  MediaReachNetwork,
  AudienceSegmentProfile,
  NarrativeResonanceState,
  CulturalInfluenceIndex,
  CulturalInfluenceProfile,
  AidProgramRecord,
  InvestmentDiplomacyRecord,
  PrestigeEventRecord,
  EliteFormationPipeline,
  ExchangeProgramRecord,
  DiasporaNetworkProfile,
  DiasporaActivationRecord,
  LegitimacyBonusRecord,
  SymbolicPressureEvent,
  PublicPrestigeMemory,
  SoftPowerActionPreview,
  InfluenceConversionRecord,
  SoftPowerBacklashRecord
} from '../types/softPower';

interface SoftPowerState {
  initialized: boolean;
  profiles: Record<string, CulturalInfluenceProfile>;
  aidPrograms: Record<string, AidProgramRecord>;
  investmentRecords: Record<string, InvestmentDiplomacyRecord>;
  prestigeEvents: Record<string, PrestigeEventRecord>;
  exchangePrograms: Record<string, ExchangeProgramRecord>;
  mediaReach: Record<string, MediaReachNetwork>;
  diasporaProfiles: Record<string, DiasporaNetworkProfile[]>; // sourceCountryId -> host profiles
  diasporaActivations: Record<string, DiasporaActivationRecord>;
  dissidentAwards: Record<string, SymbolicPressureEvent>;
  publicMemories: Record<string, PublicPrestigeMemory[]>;
  backlashRecords: Record<string, SoftPowerBacklashRecord[]>;
  conversions: Record<string, InfluenceConversionRecord>;
  resonanceStates: Record<string, NarrativeResonanceState>;
}

interface SoftPowerActions {
  initializeSoftPowerStore: () => void;
  proposeAidProgram: (
    sourceCountryId: string,
    targetCountryId: string,
    type: AidProgramType,
    fundingB: number,
    tiedProcurement: boolean,
    politicallyConditional: boolean
  ) => void;
  proposeInvestment: (
    sourceCountryId: string,
    targetCountryId: string,
    type: InvestmentDiplomacyType,
    fundingB: number
  ) => void;
  schedulePrestigeEvent: (
    title: string,
    type: PrestigeEventType,
    hostCountryId: string,
    tickScheduled: number
  ) => void;
  boycottEvent: (eventId: string, countryId: string, style: BoycottStyle) => void;
  activateDiaspora: (
    sponsorCountryId: string,
    hostCountryId: string,
    activationMode: DiasporaActivationMode
  ) => void;
  sponsorExchangeProgram: (
    sourceCountryId: string,
    targetCountryId: string,
    scholarshipsCount: number
  ) => void;
  expandMediaReach: (
    sourceCountryId: string,
    targetCountryId: string,
    channelName: string,
    medium: CulturalReachChannel['medium'],
    investmentCostB: number
  ) => void;
  nominateDissident: (
    awardTitle: string,
    recipientDissidentId: string,
    adversaryCountryId: string,
    sponsorCountryId: string
  ) => void;
  triggerBacklash: (
    offendingCountryId: string,
    targetCountryId: string,
    reason: SoftPowerBacklashRecord['reason'],
    severity: number
  ) => void;
  convertInfluence: (
    sourceCountryId: string,
    targetCountryId: string,
    style: InfluenceConversionRecord['convertedAsso']
  ) => void;
  getSoftPowerActionPreview: (
    sourceCountryId: string,
    targetCountryId: string,
    actionKey: string,
    args: any
  ) => SoftPowerActionPreview;
  calculateLegitimacyBonus: (countryId: string) => LegitimacyBonusRecord;
  tickSoftPowerSystem: (currentTick: number) => void;
  seedScenario: (scenarioKey: string) => void;
}

export const ALL_COUNTRIES = [
  'US', 'CN', 'RU', 'IN', 'PK', 'IL', 'IR', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW', 'PS', 'UA'
];

const AUDIENCE_SEGMENTS: AudienceSegmentId[] = [
  'MASS_PUBLIC', 'URBAN_YOUTH', 'RURAL_CONSERVATIVES', 'ELITE_TECHNOCRATS',
  'MILITARY_ESTABLISHMENT', 'CIVIL_SOCIETY', 'DIASPORA_COMMUNITIES', 'BUSINESS_ELITES',
  'UNIVERSITY_POPULATIONS', 'REGIME_LOYALISTS'
];

const SOFT_POWER_VECTORS: SoftPowerVectorType[] = [
  'HUMANITARIAN_LEGITIMACY', 'ASPIRATIONAL_MODERNITY', 'EDUCATIONAL_PRESTIGE',
  'ENTERTAINMENT_ATTRACTION', 'CIVIL_SIGE' as any, 'CIVIL_SOCIETY' as any, // fallback checks
  'CIVILIZATIONAL_PRESTIGE', 'MORAL_AUTHORITY', 'DEVELOPMENT_COMPETENCE',
  'ANTI_IMPERIAL_CREDIBILITY', 'INNOVATION_PRESTIGE', 'SPORTS_PRESTIGE', 'NARRATIVE_REACH'
].filter(x => !x.includes('CIVIL_SI') && !x.includes('CIVIL_SOCIETY') && x !== '') as SoftPowerVectorType[];

const makeDefaultIndex = (isSuperpower: boolean): CulturalInfluenceIndex => ({
  languageReach: isSuperpower ? 80 : 35,
  mediaPenetration: isSuperpower ? 78 : 30,
  educationAttractiveness: isSuperpower ? 82 : 28,
  culturalBrandRecognition: isSuperpower ? 75 : 40,
  entertainmentExportStrength: isSuperpower ? 85 : 20,
  eliteFamiliarity: isSuperpower ? 70 : 30,
  symbolicPrestige: isSuperpower ? 65 : 45,
  trustLegitimacyResonance: isSuperpower ? 60 : 50,
  diasporaAmplification: isSuperpower ? 48 : 55,
  globalCompositeScore: isSuperpower ? 72 : 38
});

export const useSoftPowerStore = create<SoftPowerState & SoftPowerActions>((set, get) => ({
  initialized: false,
  profiles: {},
  aidPrograms: {},
  investmentRecords: {},
  prestigeEvents: {},
  exchangePrograms: {},
  mediaReach: {},
  diasporaProfiles: {},
  diasporaActivations: {},
  dissidentAwards: {},
  publicMemories: {},
  backlashRecords: {},
  conversions: {},
  resonanceStates: {},

  initializeSoftPowerStore: () => set(produce((draft: SoftPowerState) => {
    if (draft.initialized) return;
    draft.initialized = true;
    // Generate templates for each country
    ALL_COUNTRIES.forEach(cId => {
      const isSuper = cId === 'US' || cId === 'CN' || cId === 'RU';
      const isSwing = cId === 'IN' || cId === 'TR' || cId === 'BR' || cId === 'ZA' || cId === 'EG';

      const idx = makeDefaultIndex(isSuper);
      if (isSwing) {
        idx.symbolicPrestige += 15;
        idx.diasporaAmplification += 20;
        idx.trustLegitimacyResonance += 15;
        idx.globalCompositeScore += 10;
      }

      // Configure vectors
      const vectorsMap: Record<SoftPowerVectorType, SoftPowerVector> = {} as any;
      SOFT_POWER_VECTORS.forEach(vType => {
        vectorsMap[vType] = {
          type: vType,
          score: isSuper ? 60 : isSwing ? 50 : 30,
          recentDelta: 0
        };
      });

      // Tailor specific models
      if (cId === 'US') {
        vectorsMap['ENTERTAINMENT_ATTRACTION'].score = 92;
        vectorsMap['EDUCATIONAL_PRESTIGE'].score = 90;
        vectorsMap['INNOVATION_PRESTIGE'].score = 88;
      } else if (cId === 'CN') {
        vectorsMap['DEVELOPMENT_COMPETENCE'].score = 85;
        vectorsMap['INNOVATION_PRESTIGE'].score = 75;
        vectorsMap['ASPIRATIONAL_MODERNITY'].score = 78;
      } else if (cId === 'RU') {
        vectorsMap['CIVILIZATIONAL_PRESTIGE'].score = 82;
        vectorsMap['NARRATIVE_REACH'].score = 72;
      } else if (cId === 'IN') {
        vectorsMap['CIVILIZATIONAL_PRESTIGE'].score = 90;
        vectorsMap['ANTI_IMPERIAL_CREDIBILITY'].score = 85;
      } else if (cId === 'GB') {
        vectorsMap['EDUCATIONAL_PRESTIGE'].score = 88;
      } else if (cId === 'FR') {
        vectorsMap['CIVILIZATIONAL_PRESTIGE'].score = 85;
        vectorsMap['HUMANITARIAN_LEGITIMACY'].score = 80;
      }

      const mults: Record<string, number> = {};
      ALL_COUNTRIES.forEach(oth => {
        mults[oth] = 1.0;
      });

      draft.profiles[cId] = {
        countryId: cId,
        index: idx,
        regionalReachMultiplier: mults,
        vectors: vectorsMap
      };

      // Configure media footprint
      draft.mediaReach[cId] = {
        channels: [
          {
            id: `CH-BROADCAST-${cId}`,
            name: `${cId} Free Broadcaster`,
            medium: 'BROADCASTER',
            targetCountryId: 'DE',
            penetrationRate: isSuper ? 40 : 15,
            censored: false
          }
        ],
        globalBroadcasterReach: isSuper ? 65 : 20,
        digitalFootprintScore: isSuper ? 70 : 25
      };

      // Set up Audience resonances
      const segsMap: Record<AudienceSegmentId, AudienceSegmentProfile> = {} as any;
      AUDIENCE_SEGMENTS.forEach(segId => {
        segsMap[segId] = {
          id: segId,
          name: segId.replace(/_/g, ' '),
          trustFactor: 50,
          receptivity: 55,
          dissidentSymphaty: segId === 'CIVIL_SOCIETY' || segId === 'UNIVERSITY_POPULATIONS' ? 70 : 40
        };
      });

      draft.resonanceStates[cId] = {
        countryId: cId,
        segments: segsMap,
        priorTrust: 50,
        fatigueWithForeignInfluence: 20
      };

      // Diaspora networks (Homeland resides in cId, residing in hosts)
      const listHosts: DiasporaNetworkProfile[] = [];
      const dummyHosts = cId === 'IN' ? ['US', 'GB', 'CA'] : cId === 'CN' ? ['US', 'AU', 'JP'] : ['US', 'DE', 'FR'];
      dummyHosts.forEach(hId => {
        listHosts.push({
          hostCountryId: hId,
          sizeMillions: cId === 'IN' ? 4.5 : cId === 'CN' ? 3.0 : 1.2,
          wealthRemittanceCapacity: 80,
          politicalMobilizationScore: 70,
          assimilationScore: 65,
          homelandLoyaltyScore: 75,
          vulnerabilityToIntimidation: 30
        });
      });
      draft.diasporaProfiles[cId] = listHosts;

      // Seed baseline memory
      draft.publicMemories[cId] = [
        {
          id: `MEM-INIT-${cId}`,
          countryId: cId,
          description: 'Historical contribution to global education and reconstruction treaties.',
          tickRegistered: -20,
          prestigeYieldPoints: 12,
          hypocrisyPenaltyActive: false
        }
      ];

      draft.backlashRecords[cId] = [];
    });

    // Seed preconfigured scenarios
    const initialTick = 0;

    // 1. Humanitarian Aid Response scenario: US aid to Egypt (EG)
    draft.aidPrograms['AID-SEED-HUMANITARIAN'] = {
      id: 'AID-SEED-HUMANITARIAN',
      sourceCountryId: 'US',
      targetCountryId: 'EG',
      type: 'HUMANITARIAN_RELIEF',
      fundingAmountB: 2.4,
      unresolvedTicks: 2,
      tiedProcurement: false,
      politicallyConditional: false,
      corruptionLeakage: 12,
      repaymentResentment: 0,
      goodwillRemaining: 85
    };

    // 2. Infrastructure Loan Package: China (CN) infrastructure loan for Pakistan (PK)
    draft.aidPrograms['AID-SEED-INFRASTRUCTURE'] = {
      id: 'AID-SEED-INFRASTRUCTURE',
      sourceCountryId: 'CN',
      targetCountryId: 'PK',
      type: 'INFRASTRUCTURE_FINANCING',
      fundingAmountB: 15.0,
      unresolvedTicks: 5,
      tiedProcurement: true,
      politicallyConditional: true,
      corruptionLeakage: 30,
      repaymentResentment: 45,
      goodwillRemaining: 60
    };

    // Add corresponding investment record
    draft.investmentRecords['INV-SEED-LOGISTICS'] = {
      id: 'INV-SEED-LOGISTICS',
      sourceCountryId: 'CN',
      targetCountryId: 'PK',
      type: 'PORT_RAIL_LOGISTICS',
      fundingB: 15.0,
      deliveryProgress: 40,
      eliteGratitude: 85,
      dependencyIndex: 75,
      corruptionRisk: 25,
      futureSovereignLeverage: 80
    };

    // 3. Maturing Exchange Program: GB scholarship program for student in India (IN)
    draft.exchangePrograms['EXCH-SEED-MATURING'] = {
      id: 'EXCH-SEED-MATURING',
      sourceCountryId: 'GB',
      targetCountryId: 'IN',
      activeTicks: 15,
      scholarshipsAllocatedCount: 350,
      durableInfluenceScore: 82,
      brainDrainMultiplier: 1.4,
      pipeline: {
        countryId: 'IN',
        alumniInCabinet: 3,
        technocratAffinitiesCount: 15,
        militaryCollegeExchangesCount: 2
      }
    };

    // 4. Prestige Sports Event: Moscow games Olympic-type scheduled with boycott risk
    draft.prestigeEvents['EV-SEED-OLYMPICS'] = {
      id: 'EV-SEED-OLYMPICS',
      title: 'Yekaterinburg Friendship Winter Games',
      type: 'OLYMPICS_MEGA',
      hostCountryId: 'RU',
      tickScheduled: initialTick + 8,
      boycottingNations: {
        'US': 'FULL_BOYCOTT',
        'GB': 'SYMBOLIC_DIPLOMATIC_BOYCOTT'
      },
      scandalOccurred: false,
      narrativeControlIndex: 45,
      tourismCapitalInflowB: 1.5,
      overallPrestigeYield: 30
    };

    // 5. Dissident Award triggering symbolic pressure on Russia
    draft.dissidentAwards['AWARD-SEED-SACRED'] = {
      id: 'AWARD-SEED-SACRED',
      awardTitle: 'Sovereign Liberty Medal',
      recipientDissidentId: 'Alexei Sokolov',
      adversaryCountryId: 'RU',
      moralPrestigeTransferred: 75,
      regimeEmbarrassmentIndex: 82,
      crackdownBacklashSeverity: 55,
      expiryTick: initialTick + 12
    };

    // 6. Diaspora Activation Campaign: India activates network in US
    draft.diasporaActivations['DIAS-SEED-ACTIVATION'] = {
      id: 'DIAS-SEED-ACTIVATION',
      sponsorCountryId: 'IN',
      hostCountryId: 'US',
      activationMode: 'LOBBYING_HOST_GOVERNMENT',
      successIndex: 78,
      backlashSeverity: 12,
      hostCountrySuspicionDelta: 25,
      active: true
    };

    // 7. Media expansion effort blocked by censorship list: US streams in RU
    draft.mediaReach['US'].channels.push({
      id: 'CH-US-RU-BLOCKED',
      name: 'Beacon Streaming Broadcaster RU',
      medium: 'STREAMING_ENTERTAINMENT',
      targetCountryId: 'RU',
      penetrationRate: 5,
      censored: true
    });

    // 8. Cultural prestige surge after mediation: Brazil (BR) mediated regional borders
    draft.profiles['BR'].vectors['HUMANITARIAN_LEGITIMACY'].score = 85;
    draft.publicMemories['BR'].push({
      id: 'MEM-MEDIATE',
      countryId: 'BR',
      description: 'SUCCESSFUL MEDIATION: Mediated high-tension border alignments without kinetic fires.',
      tickRegistered: -2,
      prestigeYieldPoints: 35,
      hypocrisyPenaltyActive: false
    });

    // 9. Legitimacy collapse: US double standard exposure
    draft.backlashRecords['US'].push({
      id: 'BACK-HYPOCRISY',
      offendingCountryId: 'US',
      targetCountryId: 'CN',
      reason: 'DOUBLE_STANDARD_HYPOCRISY',
      severity: 80
    });
    draft.profiles['US'].vectors['MORAL_AUTHORITY'].score = 25;

    // 10. Swing State Alignment dilemma: India (IN) receiving UK fellowships while accepting CN port logistics investments
    draft.exchangePrograms['EXCH-IN-GB'] = {
      id: 'EXCH-IN-GB',
      sourceCountryId: 'GB',
      targetCountryId: 'IN',
      activeTicks: 10,
      scholarshipsAllocatedCount: 200,
      durableInfluenceScore: 75,
      brainDrainMultiplier: 1.2,
      pipeline: {
        countryId: 'IN',
        alumniInCabinet: 2,
        technocratAffinitiesCount: 10,
        militaryCollegeExchangesCount: 0
      }
    };

    draft.investmentRecords['INV-CN-IN'] = {
      id: 'INV-CN-IN',
      sourceCountryId: 'CN',
      targetCountryId: 'IN',
      type: 'PORT_RAIL_LOGISTICS',
      fundingB: 8.5,
      deliveryProgress: 25,
      eliteGratitude: 55,
      dependencyIndex: 40,
      corruptionRisk: 10,
      futureSovereignLeverage: 65
    };

  })),

  proposeAidProgram: (sourceId, targetId, type, fundingB, tied, conditional) => set(produce((draft: SoftPowerState) => {
    const id = `AID-${sourceId}-${targetId}-${Date.now().toString().slice(-4)}`;
    
    // Calculate initial leakage rate based on target country corruption baseline or fallback
    const corruptionLeak = targetId === 'PK' || targetId === 'EG' || targetId === 'PS' ? 35 : 15;
    
    // Loan vs Grant dependency resentment setup
    let repaymentResent = 0;
    if (type === 'CONCESSIONAL_LOAN') {
      repaymentResent = tied ? 55 : 30;
    }

    draft.aidPrograms[id] = {
      id,
      sourceCountryId: sourceId,
      targetCountryId: targetId,
      type,
      fundingAmountB: fundingB,
      unresolvedTicks: 0,
      tiedProcurement: tied,
      politicallyConditional: conditional,
      corruptionLeakage: corruptionLeak,
      repaymentResentment: repaymentResent,
      goodwillRemaining: 100
    };

    // Immediate soft power vector trigger
    const profile = draft.profiles[sourceId];
    if (profile) {
      const vType = type === 'HUMANITARIAN_RELIEF' || type === 'FOOD_AID' || type === 'REFUGEE_SUPPORT'
        ? 'HUMANITARIAN_LEGITIMACY'
        : 'DEVELOPMENT_COMPETENCE';
      
      profile.vectors[vType].score = Math.min(100, profile.vectors[vType].score + Math.round(fundingB * 3));
      profile.vectors[vType].recentDelta += Math.round(fundingB * 2);
    }

    useUIStore.getState().pushTerminalLine(
      `AID INITIATED: ${sourceId} allocated $${fundingB}B in ${type.replace(/_/g, ' ')} to ${targetId}. (Tied: ${tied ? 'YES' : 'NO'})`,
      'INFO'
    );
  })),

  proposeInvestment: (sourceId, targetId, type, fundingB) => set(produce((draft: SoftPowerState) => {
    const id = `INV-${sourceId}-${targetId}-${Date.now().toString().slice(-4)}`;
    draft.investmentRecords[id] = {
      id,
      sourceCountryId: sourceId,
      targetCountryId: targetId,
      type,
      fundingB,
      deliveryProgress: 0,
      eliteGratitude: 100,
      dependencyIndex: Math.round(fundingB * 4),
      corruptionRisk: targetId === 'PK' || targetId === 'ZA' ? 40 : 15,
      futureSovereignLeverage: Math.round(fundingB * 5)
    };

    const profile = draft.profiles[sourceId];
    if (profile) {
      profile.vectors['DEVELOPMENT_COMPETENCE'].score = Math.min(100, profile.vectors['DEVELOPMENT_COMPETENCE'].score + Math.round(fundingB * 2));
    }

    useUIStore.getState().pushTerminalLine(
      `INVESTMENT SIGNED: ${sourceId} launched $${fundingB}B infrastructure package (${type.replace(/_/g, ' ')}) in ${targetId}.`,
      'INFO'
    );
  })),

  schedulePrestigeEvent: (title, type, hostId, tickScheduled) => set(produce((draft: SoftPowerState) => {
    const id = `EV-${hostId}-${Date.now().toString().slice(-4)}`;
    draft.prestigeEvents[id] = {
      id,
      title,
      type,
      hostCountryId: hostId,
      tickScheduled,
      boycottingNations: {},
      scandalOccurred: false,
      narrativeControlIndex: 65,
      tourismCapitalInflowB: type === 'OLYMPICS_MEGA' ? 5.2 : 1.8,
      overallPrestigeYield: 0
    };

    useUIStore.getState().pushTerminalLine(
      `PRESTIGE CALENDAR: ${hostId} scheduled "${title}" (${type}) at Tick ${tickScheduled}.`,
      'INFO'
    );
  })),

  boycottEvent: (eventId, countryId, style) => set(produce((draft: SoftPowerState) => {
    const ev = draft.prestigeEvents[eventId];
    if (ev) {
      ev.boycottingNations[countryId] = style;
      useUIStore.getState().pushTerminalLine(
        `BOYCOTT ENFORCED: ${countryId} joined with style ${style} around "${ev.title}".`,
        'WARNING'
      );
    }
  })),

  activateDiaspora: (sponsorId, hostId, mode) => set(produce((draft: SoftPowerState) => {
    const id = `DIAS-ACT-${sponsorId}-${hostId}`;
    
    // Calculate initial metrics based on loyalty profile
    const profilesList = draft.diasporaProfiles[sponsorId] || [];
    const prof = profilesList.find(p => p.hostCountryId === hostId) || {
      homelandLoyaltyScore: 70,
      politicalMobilizationScore: 60,
      wealthRemittanceCapacity: 50
    };

    const success = Math.round((prof.homelandLoyaltyScore + prof.politicalMobilizationScore) / 2);
    const backlash = mode === 'SANCTIONS_EVASION_BRIDGE' || mode === 'LOBBYING_HOST_GOVERNMENT' ? 45 : 15;

    draft.diasporaActivations[id] = {
      id,
      sponsorCountryId: sponsorId,
      hostCountryId: hostId,
      activationMode: mode,
      successIndex: success,
      backlashSeverity: backlash,
      hostCountrySuspicionDelta: Math.round(backlash * 0.8),
      active: true
    };

    useUIStore.getState().pushTerminalLine(
      `DIASPORA MOBILIZED: ${sponsorId} activated network in ${hostId} for ${mode.replace(/_/g, ' ')}. (Success Index: ${success}%)`,
      'INFO'
    );
  })),

  sponsorExchangeProgram: (sourceId, targetId, scholarshipsCount) => set(produce((draft: SoftPowerState) => {
    const id = `EXCH-${sourceId}-${targetId}`;
    draft.exchangePrograms[id] = {
      id,
      sourceCountryId: sourceId,
      targetCountryId: targetId,
      activeTicks: 0,
      scholarshipsAllocatedCount: scholarshipsCount,
      durableInfluenceScore: 10, // starts low and accumulates
      brainDrainMultiplier: 1.1,
      pipeline: {
        countryId: targetId,
        alumniInCabinet: 0,
        technocratAffinitiesCount: 0,
        militaryCollegeExchangesCount: 0
      }
    };

    useUIStore.getState().pushTerminalLine(
      `EXCHANGE LINKED: Scholar pipeline funded between ${sourceId} and ${targetId} for ${scholarshipsCount} fellows.`,
      'INFO'
    );
  })),

  expandMediaReach: (sourceId, targetId, channelName, medium, investmentCostB) => set(produce((draft: SoftPowerState) => {
    const sourceNet = draft.mediaReach[sourceId];
    if (sourceNet) {
      const existing = sourceNet.channels.find(ch => ch.targetCountryId === targetId && ch.medium === medium);
      if (existing) {
        existing.penetrationRate = Math.min(100, existing.penetrationRate + Math.round(investmentCostB * 15));
      } else {
        sourceNet.channels.push({
          id: `CH-${sourceId}-${targetId}-${Date.now().toString().slice(-4)}`,
          name: channelName,
          medium,
          targetCountryId: targetId,
          penetrationRate: Math.round(investmentCostB * 20),
          censored: targetId === 'RU' || targetId === 'CN' || targetId === 'IR'
        });
      }

      useUIStore.getState().pushTerminalLine(
        `BROADCAST REACH: ${sourceId} expanded "${channelName}" inside ${targetId} via ${medium}.`,
        'INFO'
      );
    }
  })),

  nominateDissident: (awardTitle, recipient, adversaryId, sponsorId) => set(produce((draft: SoftPowerState) => {
    const id = `SYMBOLIC-AWARD-${adversaryId}-${Date.now().toString().slice(-4)}`;
    draft.dissidentAwards[id] = {
      id,
      awardTitle,
      recipientDissidentId: recipient,
      adversaryCountryId: adversaryId,
      moralPrestigeTransferred: 60,
      regimeEmbarrassmentIndex: 75,
      crackdownBacklashSeverity: 40,
      expiryTick: useWorldStore.getState().currentTick + 15
    };

    // Embark moral prestige rewards to sponsor
    const sponsorProfile = draft.profiles[sponsorId];
    if (sponsorProfile) {
      sponsorProfile.vectors['MORAL_AUTHORITY'].score = Math.min(100, sponsorProfile.vectors['MORAL_AUTHORITY'].score + 12);
    }

    useUIStore.getState().pushTerminalLine(
      `Dissident Award "${awardTitle}" granted to "${recipient}" from ${adversaryId} under sponsorship of ${sponsorId}.`,
      'WARNING'
    );
  })),

  triggerBacklash: (offendingId, targetId, reason, severity) => set(produce((draft: SoftPowerState) => {
    const entry = {
      id: `BACKLASH-${offendingId}-${Date.now().toString().slice(-4)}`,
      offendingCountryId: offendingId,
      targetCountryId: targetId,
      reason,
      severity
    };
    if (!draft.backlashRecords[offendingId]) {
      draft.backlashRecords[offendingId] = [];
    }
    draft.backlashRecords[offendingId].push(entry);

    // Degrade core profiles
    const prof = draft.profiles[offendingId];
    if (prof) {
      prof.vectors['MORAL_AUTHORITY'].score = Math.max(0, prof.vectors['MORAL_AUTHORITY'].score - Math.round(severity * 0.4));
      prof.vectors['HUMANITARIAN_LEGITIMACY'].score = Math.max(0, prof.vectors['HUMANITARIAN_LEGITIMACY'].score - Math.round(severity * 0.3));
    }

    useUIStore.getState().pushTerminalLine(
      `GEOPOLITICAL BACKLASH: ${offendingId} incurred ${reason.replace(/_/g, ' ')} backlash in ${targetId}. Severity: ${severity}%`,
      'WARNING'
    );
  })),

  convertInfluence: (sourceId, targetId, style) => set(produce((draft: SoftPowerState) => {
    const id = `CONV-${sourceId}-${targetId}-${style}-${Date.now().toString().slice(-4)}`;
    draft.conversions[id] = {
      id,
      countryId: sourceId,
      targetCountryId: targetId,
      convertedAsso: style,
      efficiencyRate: 85
    };

    useUIStore.getState().pushTerminalLine(
      `INFLUENCE TRANSLATED: ${sourceId} leveraged prestige to secure easier conditions for ${style.replace(/_/g, ' ')} with ${targetId}.`,
      'INFO'
    );
  })),

  getSoftPowerActionPreview: (sourceId, targetId, actionKey, args) => {
    const result: SoftPowerActionPreview = {
      targetedAudiences: ['MASS_PUBLIC', 'ELITE_TECHNOCRATS'],
      shortTermInfluenceGain: 25,
      longTermInfluenceGain: 40,
      legitimacyBonusPotential: 15,
      backlashRiskIndex: 10,
      corruptionLeakageRisk: 15,
      boycottProbability: 5,
      fiscalCostB: args?.fundingB || 1.2
    };

    if (actionKey === 'AID') {
      result.targetedAudiences = ['MASS_PUBLIC', 'DIASPORA_COMMUNITIES'];
      result.corruptionLeakageRisk = targetId === 'PK' || targetId === 'EG' ? 35 : 10;
    } else if (actionKey === 'PRESTIGE_HOST') {
      result.targetedAudiences = ['MASS_PUBLIC', 'CIVIL_SOCIETY'];
      result.boycottProbability = targetId === 'RU' || targetId === 'CN' ? 85 : 5;
    } else if (actionKey === 'DIASPORA') {
      result.targetedAudiences = ['DIASPORA_COMMUNITIES', 'BUSINESS_ELITES'];
      result.backlashRiskIndex = 40;
    }

    return result;
  },

  calculateLegitimacyBonus: (countryId) => {
    const parentState = get();
    const profile = parentState.profiles[countryId] || { vectors: {} };
    const getScore = (v: SoftPowerVectorType) => (profile.vectors?.[v]?.score ?? 40);

    return {
      countryId,
      humanitarianLegitimacy: getScore('HUMANITARIAN_LEGITIMACY'),
      moralAuthority: getScore('MORAL_AUTHORITY'),
      developmentalCredibility: getScore('DEVELOPMENT_COMPETENCE'),
      culturalPrestige: getScore('CIVILIZATIONAL_PRESTIGE'),
      eliteTrust: getScore('EDUCATIONAL_PRESTIGE'),
      antiImperialCredibility: getScore('ANTI_IMPERIAL_CREDIBILITY')
    };
  },

  seedScenario: (scenarioKey) => set(produce((draft: SoftPowerState) => {
    if (scenarioKey === 'DISSIDENT_PRESSURING') {
      draft.dissidentAwards['AWARD-CRISIS'] = {
        id: 'AWARD-CRISIS',
        awardTitle: 'Universal Truth Prize',
        recipientDissidentId: 'Vandana Sen',
        adversaryCountryId: 'CN',
        moralPrestigeTransferred: 90,
        regimeEmbarrassmentIndex: 95,
        crackdownBacklashSeverity: 80,
        expiryTick: useWorldStore.getState().currentTick + 20
      };
      draft.profiles['US'].vectors['MORAL_AUTHORITY'].score = 90;
      useUIStore.getState().pushAlert({
        title: '🏆 DISSIDENT PRIZE CRITICAL SHOCK',
        message: 'Dissident Vandana Sen nominated for Universal Truth Prize. Regime embarrassment index spike in CN.',
        type: 'WARNING'
      });
    } else if (scenarioKey === 'AID_CORRUPTION_LEAK') {
      const id = 'AID-CORRUPT';
      draft.aidPrograms[id] = {
        id,
        sourceCountryId: 'US',
        targetCountryId: 'EG',
        type: 'INFRASTRUCTURE_FINANCING',
        fundingAmountB: 4.5,
        unresolvedTicks: 1,
        tiedProcurement: true,
        politicallyConditional: true,
        corruptionLeakage: 80, // Heavy corruption
        repaymentResentment: 90,
        goodwillRemaining: 20
      };
      
      const backlashId = 'BACK-CORRUPT';
      draft.backlashRecords['US'].push({
        id: backlashId,
        offendingCountryId: 'US',
        targetCountryId: 'EG',
        reason: 'AID_COERCIVE_TIE',
        severity: 90
      });
      draft.profiles['US'].vectors['HUMANITARIAN_LEGITIMACY'].score = Math.max(0, draft.profiles['US'].vectors['HUMANITARIAN_LEGITIMACY'].score - 45);
    } else if (scenarioKey === 'OLYMPICS_BOYCOTT_SHIELD') {
      draft.prestigeEvents['EV-WESTERN-BOYCOTT'] = {
        id: 'EV-WESTERN-BOYCOTT',
        title: 'Pacific Century Summer Expo',
        type: 'WORLD_EXPO',
        hostCountryId: 'CN',
        tickScheduled: useWorldStore.getState().currentTick + 4,
        boycottingNations: {
          'US': 'FULL_BOYCOTT',
          'GB': 'FULL_BOYCOTT',
          'FR': 'SYMBOLIC_DIPLOMATIC_BOYCOTT',
          'JP': 'SYMBOLIC_DIPLOMATIC_BOYCOTT'
        },
        scandalOccurred: false,
        narrativeControlIndex: 80,
        tourismCapitalInflowB: 4.8,
        overallPrestigeYield: 75
      };
      useUIStore.getState().pushAlert({
        title: '🏁 SELECTIVE BOYCOTT OVER EXPO',
        message: 'Pacific Century Summer Expo scheduled in Beijing triggered US/UK joint Full Boycott declarations.',
        type: 'DANGER'
      });
    } else if (scenarioKey === 'DIASPORA_BACKLASH_INTENSITY') {
      const id = 'DIAS-BACK';
      draft.diasporaActivations[id] = {
        id,
        sponsorCountryId: 'RU',
        hostCountryId: 'DE',
        activationMode: 'SANCTIONS_EVASION_BRIDGE',
        successIndex: 35,
        backlashSeverity: 85,
        hostCountrySuspicionDelta: 90,
        active: true
      };
      useUIStore.getState().pushAlert({
        title: '🚨 DIASPORA COUNTER-LOGISTICS SCRUTINY',
        message: 'Security forces track Kremlin back-channels leveraging diaspora trade corridors to bypass manufacturing parts sanctions.',
        type: 'DANGER'
      });
    }
  })),

  tickSoftPowerSystem: (currentTick) => set(produce((draft: SoftPowerState) => {
    // 1. Accumulate active exchange program influence slowly (10-20 tick horizon)
    Object.keys(draft.exchangePrograms).forEach(epId => {
      const ep = draft.exchangePrograms[epId];
      ep.activeTicks += 1;
      
      // Every 3 ticks, increase pipeline and influence
      if (ep.activeTicks % 3 === 0) {
        ep.durableInfluenceScore = Math.min(100, ep.durableInfluenceScore + 5);
        ep.pipeline.technocratAffinitiesCount += 1;
        
        if (ep.activeTicks >= 12) {
          ep.pipeline.alumniInCabinet += 1;
          ep.pipeline.militaryCollegeExchangesCount += 1;
        }

        // Apply a trace increase to source country index
        const sourceProf = draft.profiles[ep.sourceCountryId];
        if (sourceProf) {
          sourceProf.index.educationAttractiveness = Math.min(100, sourceProf.index.educationAttractiveness + 2);
          sourceProf.index.eliteFamiliarity = Math.min(100, sourceProf.index.eliteFamiliarity + 1);
          sourceProf.vectors['EDUCATIONAL_PRESTIGE'].score = Math.min(100, sourceProf.vectors['EDUCATIONAL_PRESTIGE'].score + 2);
        }
      }
    });

    // 2. Progress infrastructure delivery and dependency index
    Object.keys(draft.investmentRecords).forEach(invId => {
      const inv = draft.investmentRecords[invId];
      if (inv.deliveryProgress < 100) {
        inv.deliveryProgress = Math.min(100, inv.deliveryProgress + 10);
        inv.dependencyIndex = Math.min(100, inv.dependencyIndex + 2);

        const sourceProf = draft.profiles[inv.sourceCountryId];
        if (sourceProf && inv.deliveryProgress === 100) {
          sourceProf.index.culturalBrandRecognition = Math.min(100, sourceProf.index.culturalBrandRecognition + 3);
          sourceProf.vectors['DEVELOPMENT_COMPETENCE'].score = Math.min(100, sourceProf.vectors['DEVELOPMENT_COMPETENCE'].score + 4);
        }
      }
    });

    // 3. Process scheduled prestige events
    Object.keys(draft.prestigeEvents).forEach(evId => {
      const ev = draft.prestigeEvents[evId];
      if (ev.tickScheduled === currentTick) {
        // Calculate the boycott dynamic
        const totalBoycottPower = Object.keys(ev.boycottingNations).reduce((acc, cId) => {
          const style = ev.boycottingNations[cId];
          return acc + (style === 'FULL_BOYCOTT' ? 25 : style === 'SYMBOLIC_DIPLOMATIC_BOYCOTT' ? 10 : 5);
        }, 0);

        const hostProfile = draft.profiles[ev.hostCountryId];
        if (hostProfile) {
          let yieldVal = 60 - Math.round(totalBoycottPower * 0.5);
          if (ev.scandalOccurred) yieldVal = Math.round(yieldVal * 0.3);
          
          ev.overallPrestigeYield = Math.max(10, yieldVal);
          
          hostProfile.index.symbolicPrestige = Math.min(100, hostProfile.index.symbolicPrestige + Math.round(yieldVal * 0.2));
          hostProfile.vectors['SPORTS_PRESTIGE'].score = Math.min(100, hostProfile.vectors['SPORTS_PRESTIGE'].score + Math.round(yieldVal * 0.3));
          
          draft.publicMemories[ev.hostCountryId].push({
            id: `MEM-PRESTIGE-${Date.now().toString().slice(-4)}`,
            countryId: ev.hostCountryId,
            description: `HOSTED ${ev.title}: Prestige event concluded with overall performance index ${yieldVal}%.`,
            tickRegistered: currentTick,
            prestigeYieldPoints: yieldVal,
            hypocrisyPenaltyActive: false
          });

          useUIStore.getState().pushTerminalLine(
            `EVENT WRAP: Prestige event "${ev.title}" completed. Yield: ${ev.overallPrestigeYield}% on host ${ev.hostCountryId}.`,
            'SUCCESS' as any
          );
        }
      }
    });

    // 4. Decay and logical memory updates
    ALL_COUNTRIES.forEach(cId => {
      const prof = draft.profiles[cId];
      if (prof) {
        // Soft decay of vectors (e.g. -1 point per tick) to ensure dynamic states
        SOFT_POWER_VECTORS.forEach(vType => {
          const v = prof.vectors[vType];
          if (v && v.score > 20) {
            v.score = Math.max(10, v.score - 1);
          }
        });

        // Decay goodwill remaining of aid records
        Object.keys(draft.aidPrograms).forEach(aidId => {
          const aid = draft.aidPrograms[aidId];
          if (aid.sourceCountryId === cId && aid.goodwillRemaining > 10) {
            aid.goodwillRemaining = Math.max(10, aid.goodwillRemaining - 3);
          }
        });

        // Recalculate composite global score
        const totalScoreVec = SOFT_POWER_VECTORS.reduce((acc, vType) => acc + (prof.vectors[vType]?.score ?? 30), 0);
        prof.index.globalCompositeScore = Math.min(100, Math.round(totalScoreVec / SOFT_POWER_VECTORS.length));
      }
    });

    // 5. AI auto-investments and strategy actions (for other nations)
    const playerCId = usePlayerStore.getState().countryId || 'US';
    ALL_COUNTRIES.forEach(aiCId => {
      if (aiCId === playerCId) return;

      // Check if world time modulo suggests soft power check
      if (currentTick % 4 === 1) {
        // Randomly launch aid, expansion, or dissident sponsorships
        const dice = Math.random();
        if (dice < 0.2) {
          // Launch aid
          const target = ALL_COUNTRIES[Math.floor(Math.random() * ALL_COUNTRIES.length)];
          if (target !== aiCId) {
            const listTypes: AidProgramType[] = ['HUMANITARIAN_RELIEF', 'CONCESSIONAL_LOAN', 'PURE_GRANT'];
            const selType = listTypes[Math.floor(Math.random() * listTypes.length)];
            const fund = Math.round(Math.random() * 3 + 1);
            
            // Draft aid logic safely
            const targetLeak = target === 'PK' || target === 'EG' ? 35 : 15;
            const aidId = `AID-AI-${aiCId}-${target}-${Date.now().toString().slice(-3)}`;
            draft.aidPrograms[aidId] = {
              id: aidId,
              sourceCountryId: aiCId,
              targetCountryId: target,
              type: selType,
              fundingAmountB: fund,
              unresolvedTicks: 0,
              tiedProcurement: Math.random() > 0.5,
              politicallyConditional: Math.random() > 0.5,
              corruptionLeakage: targetLeak,
              repaymentResentment: Math.round(Math.random() * 30),
              goodwillRemaining: 100
            };

            const aiProfile = draft.profiles[aiCId];
            if (aiProfile) {
              const vec = selType === 'HUMANITARIAN_RELIEF' ? 'HUMANITARIAN_LEGITIMACY' : 'DEVELOPMENT_COMPETENCE';
              aiProfile.vectors[vec].score = Math.min(100, aiProfile.vectors[vec].score + fund);
            }
          }
        } else if (dice < 0.4) {
          // Launch exchange
          const target = ALL_COUNTRIES[Math.floor(Math.random() * ALL_COUNTRIES.length)];
          if (target !== aiCId && !draft.exchangePrograms[`EXCH-${aiCId}-${target}`]) {
            const id = `EXCH-${aiCId}-${target}`;
            draft.exchangePrograms[id] = {
              id,
              sourceCountryId: aiCId,
              targetCountryId: target,
              activeTicks: 0,
              scholarshipsAllocatedCount: 150,
              durableInfluenceScore: 15,
              brainDrainMultiplier: 1.1,
              pipeline: {
                countryId: target,
                alumniInCabinet: 0,
                technocratAffinitiesCount: 0,
                militaryCollegeExchangesCount: 0
              }
            };
          }
        }
      }
    });

  })),
}));

// Auto-initialize soft power records on bundle stream load
useSoftPowerStore.getState().initializeSoftPowerStore();

export default useSoftPowerStore;
