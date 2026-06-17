import { WorldState } from '../types';
import { RegimePressureState, PressureCampaign, EliteFaction, BlowbackMemory } from '../types/regimePressure';

export function regimePressureEngine(draft: WorldState) {
  // Process regime pressure per country
  Object.keys(draft.countries).forEach((countryId) => {
    const country = draft.countries[countryId];
    if (!country.political.regimePressure) {
      country.political.regimePressure = initRegimePressureState();
    }
    const pressure = country.political.regimePressure;

    // 1. Process active campaigns
    const activeCampaigns = pressure.activeCampaigns.filter(c => c.state === 'EXECUTING' || c.state === 'PREPARING');
    activeCampaigns.forEach((campaign) => {
      // Advance execution
      if (campaign.state === 'EXECUTING') {
        campaign.progress += 2 + Math.random() * 5; // progress based on investment & operatives
        
        // Random exposure event based on risk
        if (Math.random() * 100 < campaign.risk * 0.1) {
          campaign.exposure = Math.min(100, campaign.exposure + 15);
        }

        if (campaign.progress >= 100) {
          campaign.progress = 0;
          campaign.phase += 1;
          
          if (campaign.phase > campaign.maxPhases) {
            resolveCampaignSuccess(draft, countryId, campaign);
            campaign.state = 'COMPLETED';
          }
        }
        
        // Fail if exposure too high
        if (campaign.exposure > 90) {
          campaign.state = 'EXPOSED';
          triggerBlowback(draft, countryId, campaign);
        }
      }
    });

    // Clean up finished campaigns
    pressure.activeCampaigns = pressure.activeCampaigns.filter(c => c.state === 'EXECUTING' || c.state === 'PREPARING');

    // 2. Baseline state decay & normalization
    // Protest temperature cools down if no active protest campaigns
    if (pressure.protestTemperature > 0) {
      pressure.protestTemperature = Math.max(0, pressure.protestTemperature - 0.5);
    }
    
    // Elite cohesion normalizes towards 50 + (legitimacy * 0.5)
    const targetCohesion = 50 + (pressure.legitimacy * 0.5);
    if (pressure.eliteCohesion < targetCohesion) {
      pressure.eliteCohesion += 0.2;
    } else {
      pressure.eliteCohesion -= 0.2;
    }
    
    // Blowback decays
    pressure.blowbackHistory.forEach(b => {
      b.magnitude = Math.max(0, b.magnitude - b.decayRate);
    });
    pressure.blowbackHistory = pressure.blowbackHistory.filter(b => b.magnitude > 0);

    // Link pressure stats back to standard political stats
    // High protest and low cohesion = high unrest
    const protestImpact = (pressure.protestTemperature / 100) * 30;
    const cohesionImpact = ((100 - pressure.eliteCohesion) / 100) * 20;
    
    country.political.popularUnrest = Math.min(100, country.political.popularUnrest + (protestImpact * 0.1));
    if (pressure.protestTemperature > 75) {
      country.political.stabilityIndex = Math.max(0, country.political.stabilityIndex - 0.5);
    }
  });
}

function initRegimePressureState(): RegimePressureState {
  return {
    legitimacy: 60 + Math.random() * 30,
    eliteCohesion: 50 + Math.random() * 40,
    oppositionStrength: 10 + Math.random() * 30,
    protestTemperature: 0,
    securityForceLoyalty: 70 + Math.random() * 20,
    mediaControl: 50 + Math.random() * 40,
    blowbackSensitivity: 50 + Math.random() * 20,
    activeCampaigns: [],
    blowbackHistory: [],
    eliteFactions: [
      { id: 'f1', name: 'Inner Circle', alignment: 'PRO_REGIME', power: 45, loyalty: 90, grievance: 10 },
      { id: 'f2', name: 'Military Brass', alignment: 'MILITARY', power: 35, loyalty: 70, grievance: 20 },
      { id: 'f3', name: 'Reformists', alignment: 'MODERATE', power: 15, loyalty: 40, grievance: 50 },
      { id: 'f4', name: 'Dissidents', alignment: 'OPPOSITION', power: 5, loyalty: 0, grievance: 90 },
    ]
  };
}

function triggerBlowback(draft: WorldState, targetCountryId: string, campaign: PressureCampaign) {
  const target = draft.countries[targetCountryId];
  const pressure = target.political.regimePressure!;
  
  pressure.blowbackHistory.push({
    id: `bb_${Math.random()}`,
    type: campaign.type,
    initiatorId: campaign.initiatorId,
    magnitude: 50 + Math.random() * 50,
    tickOccurred: draft.currentTick,
    decayRate: 0.5
  });

  // Alert
  draft.globalEventLog.unshift({
    tick: draft.currentTick,
    text: `BLOWBACK: A covert ${campaign.type} campaign initiated by ${campaign.initiatorId} was exposed in ${targetCountryId}! Diplomatic damage severe.`,
    severity: 'CRITICAL'
  });
  
  // Lower opinion
  const initiator = draft.countries[campaign.initiatorId];
  if (initiator && target.opinions[initiator.id] !== undefined) {
    target.opinions[initiator.id] = Math.max(-100, target.opinions[initiator.id] - 40);
  }
}

function resolveCampaignSuccess(draft: WorldState, targetCountryId: string, campaign: PressureCampaign) {
  const target = draft.countries[targetCountryId];
  const pressure = target.political.regimePressure!;

  switch(campaign.type) {
    case 'PROTEST':
      pressure.protestTemperature = Math.min(100, pressure.protestTemperature + 40);
      pressure.legitimacy = Math.max(0, pressure.legitimacy - 20);
      draft.globalEventLog.unshift({
        tick: draft.currentTick,
        text: `Mass protests orchestrated by foreign elements erupt in ${targetCountryId}!`,
        severity: 'INFO'
      });
      break;
    case 'COUP':
      target.political.coupRiskLevel = 100; // Trigger coup in political engine
      draft.globalEventLog.unshift({
        tick: draft.currentTick,
        text: `A staged coup orchestrated by ${campaign.initiatorId} has triggered a military crisis in ${targetCountryId}.`,
        severity: 'CRITICAL'
      });
      break;
    case 'ELECTION_INTERFERENCE':
      pressure.legitimacy = Math.max(0, pressure.legitimacy - 30);
      pressure.oppositionStrength = Math.min(100, pressure.oppositionStrength + 25);
      draft.globalEventLog.unshift({
        tick: draft.currentTick,
        text: `Evidence of severe election tampering surfaced in ${targetCountryId}, destabilizing the ruling party.`,
        severity: 'INFO'
      });
      break;
    case 'OPPOSITION_FUNDING':
      pressure.oppositionStrength = Math.min(100, pressure.oppositionStrength + 15);
      draft.globalEventLog.unshift({
        tick: draft.currentTick,
        text: `Opposition forces in ${targetCountryId} receive major anonymous capital influx.`,
        severity: 'INFO'
      });
      break;
    case 'TARGETED_REMOVAL':
      target.political.stabilityIndex = Math.max(0, target.political.stabilityIndex - 40);
      draft.globalEventLog.unshift({
        tick: draft.currentTick,
        text: `A highly classified targeted removal operation was successfully executed in ${targetCountryId}!`,
        severity: 'CRITICAL'
      });
      break;
  }
}
