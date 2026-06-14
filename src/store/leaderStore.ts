import { create } from 'zustand';
import { produce } from 'immer';
import { Leader, LeaderPersonality } from '../types';
import { generateLeaderPortrait } from '../utils/portraitGenerator';

// Deterministic PRNG helper for seed-based names and scores
function createSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
    h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Regional name pools for immersive classified-grade realism
const REGIONAL_NAMES: Record<string, { first: string[]; last: string[] }> = {
  US: {
    first: ['Joseph', 'Robert', 'Donald', 'Richard', 'John', 'Thomas', 'James', 'William', 'Charles', 'David', 'Sarah', 'Eleanor'],
    last: ['Vance', 'Harrison', 'Walker', 'Miller', 'Taylor', 'Reagan', 'Kennedy', 'Carter', 'Nixon', 'Lincoln', 'Marshall', 'Brooks']
  },
  CN: {
    first: ['Xi', 'Li', 'Wang', 'Zhang', 'Chen', 'Liu', 'Zhao', 'Zhou', 'Sun', 'Zhu', 'He', 'Gao'],
    last: ['Jinping', 'Qiang', 'Keqiang', 'Zemin', 'Xiaoping', 'Zedong', 'Enlai', 'Liyuan', 'Xiannian', 'Fuchun', 'Rongji', 'Jiabao']
  },
  RU: {
    first: ['Vladimir', 'Dmitry', 'Mikhail', 'Sergey', 'Alexei', 'Nikita', 'Boris', 'Yuri', 'Andrey', 'Evgeny', 'Elena', 'Tatiana'],
    last: ['Putin', 'Medvedev', 'Yeltsin', 'Gorbachev', 'Smirnov', 'Ivanov', 'Petrov', 'Volkov', 'Sokolov', 'Kozlov', 'Morozov', 'Fedorov']
  },
  IN: {
    first: ['Narendra', 'Rahul', 'Amit', 'Manmohan', 'Pranab', 'Vikram', 'Arjun', 'Indira', 'Rajiv', 'Yash', 'Sanjay', 'Meera'],
    last: ['Modi', 'Gandhi', 'Singh', 'Swaraj', 'Sharma', 'Patel', 'Joshi', 'Mehta', 'Verma', 'Mukherjee', 'Rao', 'Chidambaram']
  },
  PK: {
    first: ['Imran', 'Nawaz', 'Shehbaz', 'Asif', 'Pervez', 'Zulfikar', 'Liaquat', 'Arif', 'Ayub', 'Benazir', 'Bilawal', 'Hina'],
    last: ['Khan', 'Sharif', 'Bhutto', 'Ali', 'Zardari', 'Musharraf', 'Alvi', 'Bajwa', 'Iqbal', 'Qureshi', 'Rabbani', 'Aziz']
  },
  IL: {
    first: ['Benjamin', 'Ariel', 'Yitzhak', 'Ehud', 'Shimon', 'David', 'Menachem', 'Moshe', 'Golda', 'Yair', 'Naftali', 'Tzipi'],
    last: ['Netanyahu', 'Sharon', 'Rabin', 'Barak', 'Peres', 'Ben-Gurion', 'Begin', 'Lapid', 'Bennett', 'Livni', 'Meir', 'Dayan']
  },
  PS: {
    first: ['Mahmoud', 'Yasser', 'Ismail', 'Khaled', 'Yahya', 'Marwan', 'Rawhi', 'Hanan', 'Mustafa', 'Salam', 'Mohammad', 'Nabil'],
    last: ['Abbas', 'Arafat', 'Haniyeh', 'Meshal', 'Sinwar', 'Barghouti', 'Fattouh', 'Ashrawi', 'Barghouti', 'Fayyad', 'Shtayyeh', 'Shaath']
  },
  IR: {
    first: ['Ali', 'Ebrahim', 'Hassan', 'Mahmoud', 'Mohammad', 'Ruhollah', 'Akbar', 'Javad', 'Hossein', 'Masoud', 'Zari', 'Fatemeh'],
    last: ['Khamenei', 'Raisi', 'Rouhani', 'Ahmadinejad', 'Khatami', 'Khomeini', 'Rafsanjani', 'Zarif', 'Soleimani', 'Pezeshkian', 'Araghchi', 'Larijani']
  },
  GB: {
    first: ['Keir', 'Winston', 'Margaret', 'Tony', 'Boris', 'Rishi', 'David', 'Theresa', 'John', 'Harold', 'Liz', 'Elizabeth'],
    last: ['Starmer', 'Churchill', 'Thatcher', 'Blair', 'Johnson', 'Sunak', 'Cameron', 'May', 'Major', 'Wilson', 'Truss', 'Attlee']
  },
  FR: {
    first: ['Emmanuel', 'Charles', 'François', 'Nicolas', 'Jacques', 'Valéry', 'Georges', 'Edouard', 'Elisabeth', 'Marine', 'Jean', 'Ségolène'],
    last: ['Macron', 'de Gaulle', 'Mitterrand', 'Sarkozy', 'Chirac', 'Giscard', 'Pompidou', 'Philippe', 'Borne', 'Le Pen', 'Mélenchon', 'Royal']
  },
  DE: {
    first: ['Olaf', 'Angela', 'Gerhard', 'Helmut', 'Konrad', 'Willy', 'Ludwig', 'Annalena', 'Robert', 'Christian', 'Ursula', 'Frank-Walter'],
    last: ['Scholz', 'Merkel', 'Schröder', 'Kohl', 'Adenauer', 'Brandt', 'Erhard', 'Baerbock', 'Habeck', 'Lindner', 'von der Leyen', 'Steinmeier']
  },
  JP: {
    first: ['Shigeru', 'Fumio', 'Shinzo', 'Yoshihide', 'Taro', 'Yukio', 'Yasuo', 'Junichiro', 'Ryutaro', 'Yoshiro', 'Sanae', 'Yoko'],
    last: ['Ishiba', 'Kishida', 'Abe', 'Suga', 'Aso', 'Hatoyama', 'Fukuda', 'Koizumi', 'Hashimoto', 'Mori', 'Takaichi', 'Kamikawa']
  },
  KR: {
    first: ['Suk-yeol', 'Jae-in', 'Geun-hye', 'Myung-bak', 'Moo-hyun', 'Dae-jung', 'Young-sam', 'Tae-woo', 'Duk-soo', 'Nak-yon', 'Se-kyun', 'Sook'],
    last: ['Yoon', 'Moon', 'Park', 'Lee', 'Roh', 'Kim', 'Han', 'Chung', 'Hwang', 'Kang', 'Song', 'Yoo']
  },
  SA: {
    first: ['Salman', 'Mohammed', 'Abdullah', 'Fahd', 'Khalid', 'Faisal', 'Saud', 'Nayef', 'Adel', 'Turki', 'Haifa', 'Reema'],
    last: ['Al Saud', 'bin Abdulaziz', 'bin Salman', 'Al-Nasser', 'Al-Sudairy', 'Al-Jubeir', 'Al-Faisal', 'Al-Rasheed', 'Al-Sheikh', 'Al-Tuwajri', 'Al-Asaf', 'Al-Ghamdi']
  },
  BR: {
    first: ['Luiz', 'Jair', 'Dilma', 'Michel', 'Fernando', 'Getúlio', 'Itamar', 'Geraldo', 'Marina', 'Ciro', 'Simone', 'Janja'],
    last: ['Lula da Silva', 'Bolsonaro', 'Rousseff', 'Temer', 'Cardoso', 'Vargas', 'Franco', 'Alckmin', 'Silva', 'Gomes', 'Tebet', 'Mendonça']
  },
  ZA: {
    first: ['Cyril', 'Jacob', 'Thabo', 'Nelson', 'Kgalema', 'Fw', 'Paul', 'Nkosazana', 'Julius', 'John', 'Helen', 'Patricia'],
    last: ['Ramaphosa', 'Zuma', 'Mbeki', 'Mandela', 'Motlanthe', 'de Klerk', 'Mashatile', 'Dlamini-Zuma', 'Malema', 'Steenhuisen', 'Zille', 'de Lille']
  },
  AU: {
    first: ['Anthony', 'Scott', 'Malcolm', 'Tony', 'Julia', 'Kevin', 'John', 'Paul', 'Penny', 'Richard', 'Marise', 'Jacinta'],
    last: ['Albanese', 'Morrison', 'Turnbull', 'Abbott', 'Gillard', 'Rudd', 'Howard', 'Keating', 'Wong', 'Marles', 'Payne', 'Price']
  },
  TR: {
    first: ['Recep', 'Kemal', 'Ahmet', 'Abdullah', 'Suleyman', 'Turgut', 'Binali', 'Meral', 'Ali', 'Hakan', 'Sultan', 'Emine'],
    last: ['Erdogan', 'Kilicdaroglu', 'Davutoglu', 'Gul', 'Demirel', 'Ozal', 'Yildirim', 'Aksener', 'Babacan', 'Fidan', 'Sencer', 'Bayraktar']
  },
  EG: {
    first: ['Abdel', 'Hosni', 'Anwar', 'Gamal', 'Mohamed', 'Adly', 'Mustafa', 'Sameh', 'Hala', 'Rania', 'Sherif', 'Nabil'],
    last: ['Fattah al-Sisi', 'Mubarak', 'Sadat', 'Nasser', 'Morsi', 'Mansour', 'Madbouly', 'Shoukry', 'Zayed', 'Al-Mashat', 'Ismail', 'Fahmy']
  },
  TW: {
    first: ['Ching-te', 'Ing-wen', 'Ying-jeou', 'Shui-bian', 'Teng-hui', 'Kai-shek', 'Chien-jen', 'Tsang-chang', 'Bikhim', 'Hsiao-teng', 'Chung-xin', 'Bi-khim'],
    last: ['Lai', 'Tsai', 'Ma', 'Chen', 'Lee', 'Chiang', 'Chen', 'Su', 'Hsiao', 'Kuo', 'Han', 'Wang']
  }
};

// Default generic names fallback
const GENERIC_NAMES = {
  first: ['Edward', 'Arthur', 'Sophia', 'Victoria', 'Victor', 'Julian', 'Mark', 'Teresa', 'Adrian', 'Helena'],
  last: ['Sterling', 'Kovacs', 'Sloan', 'Dante', 'Sovereign', 'Vanguard', 'Sentinel', 'Graves', 'Mercer', 'Keel']
};

export interface Modifiers {
  escalationRate: number;
  warThresholdDelta: number;
  diplomacyAcceptMultiplier: number;
  sanctionsLikelihoodMultiplier: number;
  retaliationBias: number;
  riskToleranceMultiplier: number;
}

// MANDATORY T3.4 PERSONALITY MODIFIER TABLE
export const LEADER_PERSONALITY_MODIFIERS: Record<LeaderPersonality, Modifiers> = {
  [LeaderPersonality.HAWK]: {
    escalationRate: 1.4,
    warThresholdDelta: -10, // LOWER barrier (opinion < -60 triggers war check score)
    diplomacyAcceptMultiplier: 0.8,
    sanctionsLikelihoodMultiplier: 1.2,
    retaliationBias: 1.35,
    riskToleranceMultiplier: 1.25,
  },
  [LeaderPersonality.DOVE]: {
    escalationRate: 0.7,
    warThresholdDelta: 12, // STRICTER barrier (opinion < -82 required)
    diplomacyAcceptMultiplier: 1.6,
    sanctionsLikelihoodMultiplier: 0.85,
    retaliationBias: 0.7,
    riskToleranceMultiplier: 0.75,
  },
  [LeaderPersonality.PRAGMATIST]: {
    escalationRate: 1.0,
    warThresholdDelta: 0,
    diplomacyAcceptMultiplier: 1.1,
    sanctionsLikelihoodMultiplier: 1.0,
    retaliationBias: 1.0,
    riskToleranceMultiplier: 1.0,
  },
  [LeaderPersonality.IDEOLOGUE]: {
    escalationRate: 1.2,
    warThresholdDelta: -4,
    diplomacyAcceptMultiplier: 0.85, // Computed dynamically based on target system, base 0.85
    sanctionsLikelihoodMultiplier: 1.3,
    retaliationBias: 1.15,
    riskToleranceMultiplier: 1.1,
  },
  [LeaderPersonality.UNPREDICTABLE]: {
    escalationRate: 1.0, // Base
    warThresholdDelta: 0,
    diplomacyAcceptMultiplier: 0.9,
    sanctionsLikelihoodMultiplier: 1.1,
    retaliationBias: 1.0,
    riskToleranceMultiplier: 1.1,
  }
};

/**
 * Returns dynamic Leader modifiers, resolving any sliding variables or systems (UNPREDICTABLE / IDEOLOGUE).
 */
export function getLeaderModifiers(personality: LeaderPersonality, targetIsHostileIdeology: boolean = false, currentTick: number = 0): Modifiers {
  const base = LEADER_PERSONALITY_MODIFIERS[personality];
  if (personality === LeaderPersonality.UNPREDICTABLE) {
    // Generate deterministic noise centered around tick to make them erratic but stable on same frame
    const seed = `erratic_${currentTick}_offset`;
    const rand = createSeededRandom(seed);
    const noise = (rand() - 0.5) * 2; // [-1, +1]
    return {
      escalationRate: Math.max(0.6, Math.min(1.8, 1.0 + noise * 0.4)),
      warThresholdDelta: Math.round(noise * 12), // fluctuates between -12 and +12
      diplomacyAcceptMultiplier: Math.max(0.5, Math.min(1.7, 1.0 - noise * 0.5)),
      sanctionsLikelihoodMultiplier: Math.max(0.6, Math.min(1.6, 1.1 + noise * 0.3)),
      retaliationBias: Math.max(0.5, Math.min(1.7, 1.0 + noise * 0.5)),
      riskToleranceMultiplier: Math.max(0.8, Math.min(1.4, 1.1 + noise * 0.25)), // 0.9 to 1.3 roughly
    };
  }

  if (personality === LeaderPersonality.IDEOLOGUE) {
    return {
      ...base,
      diplomacyAcceptMultiplier: targetIsHostileIdeology ? 0.75 : 1.05,
    };
  }

  return base;
}

interface LeaderStoreState {
  leadersByCountryId: Record<string, Leader>;
  getLeader: (countryId: string) => Leader | undefined;
  setLeader: (countryId: string, leader: Leader) => void;
  initializeLeadersForAllCountries: (tick: number, overrides?: Record<string, LeaderPersonality>) => void;
  generateNewLeader: (countryId: string, source: 'INITIAL' | 'ELECTION' | 'COUP', tick: number, overrideType?: LeaderPersonality) => Leader;
  getLeaderModifiers: (countryId: string, targetCountryId?: string, currentTick?: number) => Modifiers;
}

export const useLeaderStore = create<LeaderStoreState>((set, get) => ({
  leadersByCountryId: {},

  getLeader: (countryId) => {
    return get().leadersByCountryId[countryId];
  },

  setLeader: (countryId, leader) => set(produce((draft) => {
    draft.leadersByCountryId[countryId] = leader;
  })),

  generateNewLeader: (countryId, source, tick, overrideType) => {
    // Stable timestamp/seed for pre-game sitrep files and initialization parity
    const timestamp = source === 'INITIAL' ? 42 : (Date.now() + Math.round(Math.random() * 100050));
    const seed = `${countryId}_${source}_${tick}_${timestamp}`;
    const rand = createSeededRandom(seed);

    // Set personality distribution intentionally
    let personality = overrideType || LeaderPersonality.PRAGMATIST;
    const roll = rand();

    if (!overrideType) {
      if (source === 'INITIAL') {
        // Intentionally disperse leaders deterministically for scenario testing
        const initialMap: Record<string, LeaderPersonality> = {
          US: LeaderPersonality.PRAGMATIST,
          CN: LeaderPersonality.HAWK,
          RU: LeaderPersonality.HAWK,
          IL: LeaderPersonality.IDEOLOGUE,
          IR: LeaderPersonality.IDEOLOGUE,
          GB: LeaderPersonality.DOVE,
          DE: LeaderPersonality.DOVE,
          JP: LeaderPersonality.PRAGMATIST,
          KP: LeaderPersonality.HAWK,
          TW: LeaderPersonality.DOVE,
          PK: LeaderPersonality.UNPREDICTABLE,
          IN: LeaderPersonality.PRAGMATIST,
        };
        
        personality = initialMap[countryId] || (
          roll < 0.25 ? LeaderPersonality.HAWK :
          roll < 0.50 ? LeaderPersonality.DOVE :
          roll < 0.75 ? LeaderPersonality.PRAGMATIST :
          roll < 0.90 ? LeaderPersonality.IDEOLOGUE :
          LeaderPersonality.UNPREDICTABLE
        );
      } else if (source === 'COUP') {
        // Coups highly skew HAWK, IDEOLOGUE, or UNPREDICTABLE
        personality = roll < 0.45 ? LeaderPersonality.HAWK :
                      roll < 0.75 ? LeaderPersonality.IDEOLOGUE :
                      roll < 0.95 ? LeaderPersonality.UNPREDICTABLE :
                      LeaderPersonality.PRAGMATIST;
      } else {
        // Elections draw broader distribution, leaning democratic/dovish/pragmatic
        personality = roll < 0.40 ? LeaderPersonality.PRAGMATIST :
                      roll < 0.75 ? LeaderPersonality.DOVE :
                      roll < 0.90 ? LeaderPersonality.IDEOLOGUE :
                      roll < 0.96 ? LeaderPersonality.HAWK :
                      LeaderPersonality.UNPREDICTABLE;
      }
    }

    // Generate country-appropriate name
    const regional = REGIONAL_NAMES[countryId] || GENERIC_NAMES;
    const first = regional.first[Math.floor(rand() * regional.first.length)];
    const last = regional.last[Math.floor(rand() * regional.last.length)];
    
    // Formatting: Asian name logic (CN, KR, TW where last name goes first)
    const AsianEast = ['CN', 'KR', 'TW', 'JP'];
    const name = AsianEast.includes(countryId) ? `${last} ${first}` : `${first} ${last}`;

    // Sub-scores
    const hawkDoveScore = Math.round(
      personality === LeaderPersonality.HAWK ? (80 + rand() * 20) :
      personality === LeaderPersonality.DOVE ? (10 + rand() * 20) :
      personality === LeaderPersonality.PRAGMATIST ? (40 + rand() * 25) :
      personality === LeaderPersonality.IDEOLOGUE ? (55 + rand() * 30) :
      (rand() * 100) // Unpredictable
    );

    const riskTolerance = Math.round(
      personality === LeaderPersonality.HAWK ? (70 + rand() * 30) :
      personality === LeaderPersonality.DOVE ? (15 + rand() * 35) :
      personality === LeaderPersonality.PRAGMATIST ? (40 + rand() * 30) :
      personality === LeaderPersonality.IDEOLOGUE ? (50 + rand() * 25) :
      (30 + rand() * 70) // Unpredictable
    );

    const portraitDataUrl = generateLeaderPortrait(personality, seed);

    return {
      id: `ldr_${countryId}_${Math.random().toString(36).substring(2, 9)}`,
      countryId,
      name,
      type: personality,
      hawkDoveScore,
      riskTolerance,
      portraitSeed: seed,
      portraitDataUrl,
      installedAtTick: tick,
      source
    };
  },

  initializeLeadersForAllCountries: (tick, overrides) => set(produce((draft) => {
    const list20Countries = ['US', 'CN', 'IN', 'PK', 'IL', 'PS', 'IR', 'RU', 'GB', 'FR', 'DE', 'JP', 'KR', 'SA', 'BR', 'ZA', 'AU', 'TR', 'EG', 'TW'];
    list20Countries.forEach((cId) => {
      draft.leadersByCountryId[cId] = get().generateNewLeader(cId, 'INITIAL', tick, overrides?.[cId]);
    });
  })),

  getLeaderModifiers: (countryId, targetCountryId, currentTick = 0) => {
    const leader = get().getLeader(countryId);
    if (!leader) {
      // Fallback baseline modifiers
      return {
        escalationRate: 1.0,
        warThresholdDelta: 0,
        diplomacyAcceptMultiplier: 1.0,
        sanctionsLikelihoodMultiplier: 1.0,
        retaliationBias: 1.0,
        riskToleranceMultiplier: 1.0,
      };
    }

    // Determine if ideologies conflict for Ideologues
    let targetIsHostileIdeology = false;
    if (targetCountryId && leader.type === LeaderPersonality.IDEOLOGUE) {
      // Grab world store country ideologies to check difference
      // Note: we can safely resolve this dynamically
      const worldStoreState = (window as any).worldStoreHack || null;
      if (worldStoreState) {
        const sourceCountry = worldStoreState.countries[countryId];
        const targetCountry = worldStoreState.countries[targetCountryId];
        if (sourceCountry && targetCountry) {
          const sIdeo = sourceCountry.political.ideology;
          const tIdeo = targetCountry.political.ideology;
          // Ideology categories clash (DEMOCRACY/TECHNOCRACY vs AUTOCRACY/THEOCRACY/MILITARY_JUNTA)
          const isSourceFree = sIdeo === 'DEMOCRACY' || sIdeo === 'TECHNOCRACY';
          const isTargetFree = tIdeo === 'DEMOCRACY' || tIdeo === 'TECHNOCRACY';
          targetIsHostileIdeology = isSourceFree !== isTargetFree;
        }
      }
    }

    return getLeaderModifiers(leader.type, targetIsHostileIdeology, currentTick);
  }
}));

// Provide a universal hack bridge for the modifiers function to access world state safely when needed
if (typeof window !== 'undefined') {
  (window as any).useLeaderStore = useLeaderStore;
}
