import { ScenarioId, WorldState, PlayerState, ThreatLevel, PacingPreset } from '../types';

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  threatLevel: ThreatLevel;
  playableCountryIds: string[];
  winDescription: string;
  lossDescription: string;
  winCondition: (world: WorldState, player: PlayerState) => boolean;
  lossCondition: (world: WorldState, player: PlayerState) => boolean;
  winMessage: string;
  lossMessage: string;
  initialMutations: (world: WorldState, playerCountryId: string) => void;
  pacingPreset: PacingPreset;
}

export const SANDBOX_PACING: PacingPreset = {
  tickDuration: "week",
  maxTicks: "endless",
  warDeclarationCooldown: 30,
  escalationDamper: 0.2,
  earlyGameProtection: 50
};

export const KASHMIR_FLASHPOINT_PACING: PacingPreset = {
  tickDuration: "day",
  maxTicks: 800,
  warDeclarationCooldown: 20,
  escalationDamper: 0.3,
  earlyGameProtection: 20
};

export const TECH_WAR_PACING: PacingPreset = {
  tickDuration: "week",
  maxTicks: 1200,
  warDeclarationCooldown: 40,
  escalationDamper: 0.15,
  earlyGameProtection: 60
};

export const GLOBAL_HEGEMONY_PACING: PacingPreset = {
  tickDuration: "month",
  maxTicks: "endless",
  warDeclarationCooldown: 45,
  escalationDamper: 0.12,
  earlyGameProtection: 100
};

export const RESOURCE_SHOCK_PACING: PacingPreset = {
  tickDuration: "week",
  maxTicks: 900,
  warDeclarationCooldown: 35,
  escalationDamper: 0.18,
  earlyGameProtection: 40
};

export const NUCLEAR_BRINK_PACING: PacingPreset = {
  tickDuration: "day",
  maxTicks: 700,
  warDeclarationCooldown: 25,
  escalationDamper: 0.25,
  earlyGameProtection: 25
};

export const ARCTIC_CLAIM_PACING: PacingPreset = {
  tickDuration: "week",
  maxTicks: 750,
  warDeclarationCooldown: 28,
  escalationDamper: 0.22,
  earlyGameProtection: 30
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  MENA_SPARK: {
    id: 'MENA_SPARK',
    name: 'MENA Spark',
    description: 'Prevent a devastating regional conflict and potential nuclear exchange in the Middle East. Broker de-escalation and peace within 60 ticks.',
    difficulty: 'HARD',
    threatLevel: 'ORANGE',
    playableCountryIds: ['US', 'IL', 'SA', 'IR'],
    winDescription: 'Avoid nuclear launches and broker ceasing of all active wars between Israel (IL) and Iran (IR) / Palestine (PS).',
    lossDescription: 'Any nuclear missiles launched globally OR 60 ticks expire under conflict.',
    winMessage: 'Ceasefire negotiated and validated by the Security Council. MENA de-escalated. Sovereign stability restored.',
    lossMessage: 'Nuclear exchange detected. Multiple high-yield impacts over capital zones. Catastrophic sovereign fallout.',
    pacingPreset: NUCLEAR_BRINK_PACING,
    winCondition: (world) => {
      const il = world.countries['IL'];
      const ir = world.countries['IR'];
      if (!il || !ir) return false;
      const conflictsResolved = !il.atWarWith.includes('IR') && !il.atWarWith.includes('PS');
      return conflictsResolved && (world.currentTick < 60);
    },
    lossCondition: (world) => {
      if (world.nuclearExchangeOccurred) return true;
      if (world.currentTick >= 60) {
        // Did they fail to resolve war?
        const il = world.countries['IL'];
        const ir = world.countries['IR'];
        if (il && ir) {
          return il.atWarWith.includes('IR') || il.atWarWith.includes('PS');
        }
      }
      return false;
    },
    initialMutations: (world) => {
      // Israel, Palestine and Iran are in active conflict
      if (world.countries['IL'] && world.countries['IR'] && world.countries['PS']) {
        world.countries['IL'].atWarWith = ['PS', 'IR'];
        world.countries['PS'].atWarWith = ['IL'];
        world.countries['IR'].atWarWith = ['IL'];
        world.countries['IL'].arsenal.abmShieldStrength = 75;
        
        const irIcbm = world.countries['IR'].arsenal.units.find(u => u.type === 'ICBM');
        if (irIcbm) irIcbm.count = 12;

        const oilMarket = world.commodityMarkets.find(m => m.type === 'OIL');
        if (oilMarket) {
          oilMarket.spotPriceUSD *= 1.8;
          oilMarket.supplyShockActive = true;
        }
        world.globalThreatLevel = 'ORANGE';
      }
    }
  },

  KASHMIR_FLASHPOINT: {
    id: 'KASHMIR_FLASHPOINT',
    name: 'Kashmir Flashpoint',
    description: 'India and Pakistan are fully mobilizing along the Line of Control. De-escalate public unrest and direct combat before first nuclear launches. 45 ticks threshold.',
    difficulty: 'EXPERT',
    threatLevel: 'RED',
    playableCountryIds: ['IN', 'PK', 'US', 'CN'],
    winDescription: 'Completely eliminate the at-war states between India (IN) and Pakistan (PK) and direct hostilities.',
    lossDescription: 'Any ballistic missiles launched by IN or PK, OR 45 ticks expire.',
    winMessage: 'Bilateral LOC demilitarization completed. UN peacekeepers deployed. Threat returned to nominal.',
    lossMessage: 'Failure. LOC boundary breached. High-alt nuclear launch arcs confirmed. Intercept operations compromised.',
    pacingPreset: KASHMIR_FLASHPOINT_PACING,
    winCondition: (world) => {
      const ind = world.countries['IN'];
      const pak = world.countries['PK'];
      if (!ind || !pak) return false;
      return !ind.atWarWith.includes('PK') && !pak.atWarWith.includes('IN');
    },
    lossCondition: (world) => {
      const activeStrikesByInOrPk = world.activeStrikes.some(s => s.sourceCountryId === 'IN' || s.sourceCountryId === 'PK');
      if (activeStrikesByInOrPk) return true;
      if (world.currentTick >= 45) {
        const ind = world.countries['IN'];
        const pak = world.countries['PK'];
        if (ind && pak && (ind.atWarWith.includes('PK') || pak.atWarWith.includes('IN'))) {
          return true;
        }
      }
      return false;
    },
    initialMutations: (world) => {
      if (world.countries['IN'] && world.countries['PK']) {
        world.countries['IN'].atWarWith = ['PK'];
        world.countries['PK'].atWarWith = ['IN'];
        world.countries['IN'].political.popularUnrest = 70;
        world.countries['PK'].political.popularUnrest = 75;

        const inHard = world.countries['IN'].political.factions.find(f => f.type === 'MILITARY_HARDLINERS');
        if (inHard) inHard.strengthIndex = 82;

        const pkHard = world.countries['PK'].political.factions.find(f => f.type === 'MILITARY_HARDLINERS');
        if (pkHard) pkHard.strengthIndex = 88;

        world.globalThreatLevel = 'RED';
      }
    }
  },

  STRAIT_CLOSURE: {
    id: 'STRAIT_CLOSURE',
    name: 'Strait Closure',
    description: 'Iran has mined the Strait of Hormuz and deployed deep cruise arrays. Force a stand-down or disable their grid before a devastating global oil energy hyper-crisis hits (Price > $250/byl or 30 ticks).',
    difficulty: 'MEDIUM',
    threatLevel: 'YELLOW',
    playableCountryIds: ['US', 'IR', 'SA', 'GB'],
    winDescription: 'Iran stands down (HAARP weather/covert grid action or diplomatics) and Oil spot price supply shock is deactivated.',
    lossDescription: 'Oil spot price breaches $250 per barrel OR 30 ticks expire.',
    winMessage: 'Hormuz maritime routes declared clear. Brent crude index restored to nominal. Trade flowing.',
    lossMessage: 'Oil hyper-crisis triggered. Inflation rate spikes 15% worldwide causing widespread sovereign debt failures.',
    pacingPreset: RESOURCE_SHOCK_PACING,
    winCondition: (world) => {
      const ir = world.countries['IR'];
      const oil = world.commodityMarkets.find(m => m.type === 'OIL');
      if (!ir || !oil) return false;
      return !ir.haarpActive && !oil.supplyShockActive;
    },
    lossCondition: (world) => {
      const oil = world.commodityMarkets.find(m => m.type === 'OIL');
      if (oil && oil.spotPriceUSD > 250) return true;
      if (world.currentTick >= 30) {
        return true;
      }
      return false;
    },
    initialMutations: (world) => {
      const oil = world.commodityMarkets.find(m => m.type === 'OIL');
      if (oil) {
        oil.spotPriceUSD *= 3.0;
        oil.supplyShockActive = true;
      }
      if (world.countries['IR']) {
        const cruise = world.countries['IR'].arsenal.units.find(u => u.type === 'CRUISE_MISSILE');
        if (cruise) cruise.count = 200;
        world.countries['IR'].haarpActive = true;
        world.countries['IR'].threatLevel = 'RED';
      }
      ['SA', 'EG'].forEach(id => {
        if (world.countries[id]) {
          world.countries[id].threatLevel = 'ORANGE';
        }
      });
    }
  },

  SOVEREIGN_DEFAULT: {
    id: 'SOVEREIGN_DEFAULT',
    name: 'Sovereign Default',
    description: 'Eurozone debt failure. France, Germany, and the UK are experiencing catastrophic sovereign bond pressure. Bring Debt Stress indices below 60 within 50 ticks.',
    difficulty: 'MEDIUM',
    threatLevel: 'GREEN',
    playableCountryIds: ['US', 'DE', 'FR', 'GB'],
    winDescription: 'UK (GB), France (FR), and Germany (DE) all report Debt Stress below 60.',
    lossDescription: 'Any Eurozone anchor experiences debt stress > 97% OR 50 ticks pass.',
    winMessage: 'Eurobond bailouts secured. Central bank rates stabilized. Financial contagion halted.',
    lossMessage: 'Sovereign default cascades. Public infrastructure shuttered, widespread civil breakdown.',
    pacingPreset: GLOBAL_HEGEMONY_PACING,
    winCondition: (world) => {
      return ['DE', 'FR', 'GB'].every(id => {
        const c = world.countries[id];
        return c ? c.economic.debtStressIndex < 60 : true;
      });
    },
    lossCondition: (world) => {
      const peakStress = ['DE', 'FR', 'GB'].some(id => {
        const c = world.countries[id];
        return c ? c.economic.debtStressIndex > 97 : false;
      });
      return peakStress || (world.currentTick >= 50);
    },
    initialMutations: (world) => {
      ['DE', 'FR', 'GB'].forEach(id => {
        const c = world.countries[id];
        if (c) {
          c.economic.debtToGdpRatio = 145;
          c.economic.debtStressIndex = 80;
          c.economic.interestRate = 12;
          c.economic.currencyStrength = 60;
          c.political.popularUnrest = 65;
        }
      });
    }
  },

  TECH_WAR: {
    id: 'TECH_WAR',
    name: 'Tech War',
    description: 'Tech dominance race. China is leveraging silicon rare earth supply to challenge US. Unlock Quantum Communications and suppress China growth rate within 80 ticks.',
    difficulty: 'MEDIUM',
    threatLevel: 'YELLOW',
    playableCountryIds: ['US', 'CN', 'JP', 'TW'],
    winDescription: 'Player country unlocks Quantum Communications tech AND CN GDP growth rate is suppressed below 4%.',
    lossDescription: 'All player offensive cyber assets are compromised/destroyed OR CN GDP surpasses US GDP by 20%.',
    winMessage: 'Quantum cryptography grid successfully deployed. Silicon market embargo siphoned off.',
    lossMessage: 'Offensive digital network compromised. Silicon wafer tech dominance ceded to CN.',
    pacingPreset: TECH_WAR_PACING,
    winCondition: (world, player) => {
      const pc = world.countries[player.countryId];
      const cn = world.countries['CN'];
      if (!pc || !cn) return false;
      const isQuantumUnlocked = pc.researchUnlocked.includes('QUANTUM_COMMS');
      const cnGdpSuppressed = cn.economic.gdpGrowthRate < 4.0;
      return isQuantumUnlocked && cnGdpSuppressed;
    },
    lossCondition: (world, player) => {
      const pc = world.countries[player.countryId];
      const cn = world.countries['CN'];
      const us = world.countries['US'];
      if (!pc || !cn || !us) return false;
      
      const noCyber = pc.intelligence.cyberAssets.filter(a => a.type === 'OFFENSIVE').length === 0;
      if (noCyber) return true;

      const cnDominates = cn.economic.gdpB > (us.economic.gdpB * 1.2);
      if (cnDominates) return true;

      return world.currentTick >= 80;
    },
    initialMutations: (world) => {
      const rareEarth = world.commodityMarkets.find(m => m.type === 'RARE_EARTH');
      if (rareEarth) {
        rareEarth.spotPriceUSD *= 2.2;
      }
      if (world.countries['US']) {
        world.countries['US'].intelligence.cyberAssets = [
          { id: 'US_cyber_def', type: 'DEFENSIVE', powerLevel: 90, isDeployed: true, firewallRating: 85 },
          { id: 'US_cyber_off_1', type: 'OFFENSIVE', powerLevel: 80, isDeployed: false, firewallRating: 0 },
        ];
      }
      if (world.countries['CN']) {
        world.countries['CN'].economic.gdpGrowthRate = 7.5;
        world.countries['CN'].economic.treasuryCashB = 1200;
      }
    }
  },

  ARCTIC_CLAIM: {
    id: 'ARCTIC_CLAIM',
    name: 'Arctic Claim',
    description: 'Russia & China are advancing drilling vessels into exclusive Northern sectors. Secure sovereign alignment with at least 6 trade partners and keep domestic stability > 60% before tick 70.',
    difficulty: 'MEDIUM',
    threatLevel: 'ORANGE',
    playableCountryIds: ['US', 'RU', 'GB', 'AU'],
    winDescription: 'Player country stability score > 60% AND player has >= 6 active trade partners.',
    lossDescription: 'Direct shooting war (atWarWith) breaks out between US and RU or CN OR 70 ticks pass.',
    winMessage: 'Trade alignment successfully brokered. Polar mineral sector security validated by Arctic Council.',
    lossMessage: 'Direct military escalation. Severe sovereign conflict breaks out across Arctic pipelines.',
    pacingPreset: ARCTIC_CLAIM_PACING,
    winCondition: (world, player) => {
      const pc = world.countries[player.countryId];
      if (!pc) return false;
      return pc.political.stabilityIndex > 60 && pc.tradePartners.length >= 6;
    },
    lossCondition: (world) => {
      const us = world.countries['US'];
      if (us) {
        if (us.atWarWith.includes('RU') || us.atWarWith.includes('CN')) return true;
      }
      return world.currentTick >= 70;
    },
    initialMutations: (world) => {
      const gasMarket = world.commodityMarkets.find(m => m.type === 'NATURAL_GAS');
      if (gasMarket) {
        gasMarket.spotPriceUSD *= 2.0;
        gasMarket.supplyShockActive = true;
      }
      if (world.countries['RU']) {
        world.countries['RU'].economic.gdpGrowthRate = 4.0;
        world.countries['RU'].atWarWith = [];
        world.countries['RU'].threatLevel = 'ORANGE';
      }
    }
  }
};
