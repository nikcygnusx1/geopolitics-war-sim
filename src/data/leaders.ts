export interface LeaderProfile {
  countryId: string;
  name: string;
  title: string;           // 'President' | 'Prime Minister' | 'Supreme Leader' etc.
  age: number;
  yearsInPower: number;
  militaryBackground: boolean;
  portraitSeed: {
    skinTone: number;      // 0-100
    uniformType: 'MILITARY' | 'SUIT' | 'ROBE' | 'CASUAL';
    hairStyle: number;     // 0-5
    facialHair: boolean;
    glassesStyle: number;  // 0=none, 1=thin, 2=thick
    backgroundType: 'FLAG' | 'DARK' | 'MAP' | 'CLASSIFIED';
  };
}

export const LEADER_PROFILES: Record<string, LeaderProfile> = {
  US: {
    countryId: 'US',
    name: 'President Franklin J. Vance',
    title: 'President',
    age: 62,
    yearsInPower: 3,
    militaryBackground: false,
    portraitSeed: { skinTone: 15, uniformType: 'SUIT', hairStyle: 1, facialHair: false, glassesStyle: 0, backgroundType: 'FLAG' }
  },
  CN: {
    countryId: 'CN',
    name: 'General Secretary Zhao Wei',
    title: 'Chairman',
    age: 69,
    yearsInPower: 11,
    militaryBackground: false,
    portraitSeed: { skinTone: 10, uniformType: 'SUIT', hairStyle: 2, facialHair: false, glassesStyle: 1, backgroundType: 'DARK' }
  },
  IN: {
    countryId: 'IN',
    name: 'Prime Minister Rajpath Deshmukh',
    title: 'Prime Minister',
    age: 58,
    yearsInPower: 4,
    militaryBackground: false,
    portraitSeed: { skinTone: 45, uniformType: 'ROBE', hairStyle: 3, facialHair: true, glassesStyle: 1, backgroundType: 'FLAG' }
  },
  PK: {
    countryId: 'PK',
    name: 'General Tariq Mahmood',
    title: 'Supreme Marshal',
    age: 55,
    yearsInPower: 2,
    militaryBackground: true,
    portraitSeed: { skinTone: 30, uniformType: 'MILITARY', hairStyle: 1, facialHair: true, glassesStyle: 0, backgroundType: 'MAP' }
  },
  IL: {
    countryId: 'IL',
    name: 'Prime Minister David Stern',
    title: 'Prime Minister',
    age: 64,
    yearsInPower: 8,
    militaryBackground: true,
    portraitSeed: { skinTone: 8, uniformType: 'SUIT', hairStyle: 2, facialHair: false, glassesStyle: 2, backgroundType: 'FLAG' }
  },
  PS: {
    countryId: 'PS',
    name: 'President Mahmoud Abbas',
    title: 'President',
    age: 82,
    yearsInPower: 14,
    militaryBackground: false,
    portraitSeed: { skinTone: 25, uniformType: 'SUIT', hairStyle: 4, facialHair: false, glassesStyle: 1, backgroundType: 'DARK' }
  },
  IR: {
    countryId: 'IR',
    name: 'Ayatollah Ali Al-Hosseini',
    title: 'Supreme Leader',
    age: 78,
    yearsInPower: 16,
    militaryBackground: false,
    portraitSeed: { skinTone: 20, uniformType: 'ROBE', hairStyle: 0, facialHair: true, glassesStyle: 0, backgroundType: 'CLASSIFIED' }
  },
  RU: {
    countryId: 'RU',
    name: 'President Vladislav Orlov',
    title: 'President',
    age: 65,
    yearsInPower: 12,
    militaryBackground: true,
    portraitSeed: { skinTone: 5, uniformType: 'SUIT', hairStyle: 5, facialHair: false, glassesStyle: 0, backgroundType: 'DARK' }
  },
  GB: {
    countryId: 'GB',
    name: 'Prime Minister Alistair Croft',
    title: 'Prime Minister',
    age: 49,
    yearsInPower: 1,
    militaryBackground: false,
    portraitSeed: { skinTone: 12, uniformType: 'SUIT', hairStyle: 1, facialHair: false, glassesStyle: 0, backgroundType: 'FLAG' }
  },
  FR: {
    countryId: 'FR',
    name: 'President Jean-Luc Moreau',
    title: 'President',
    age: 51,
    yearsInPower: 6,
    militaryBackground: false,
    portraitSeed: { skinTone: 10, uniformType: 'SUIT', hairStyle: 2, facialHair: false, glassesStyle: 0, backgroundType: 'FLAG' }
  },
  DE: {
    countryId: 'DE',
    name: 'Chancellor Katrin Werner',
    title: 'Chancellor',
    age: 56,
    yearsInPower: 3,
    militaryBackground: false,
    portraitSeed: { skinTone: 10, uniformType: 'SUIT', hairStyle: 4, facialHair: false, glassesStyle: 2, backgroundType: 'DARK' }
  },
  JP: {
    countryId: 'JP',
    name: 'Prime Minister Katsu Hayashi',
    title: 'Prime Minister',
    age: 61,
    yearsInPower: 2,
    militaryBackground: false,
    portraitSeed: { skinTone: 12, uniformType: 'SUIT', hairStyle: 1, facialHair: false, glassesStyle: 1, backgroundType: 'MAP' }
  },
  KR: {
    countryId: 'KR',
    name: 'President Han Min-soo',
    title: 'President',
    age: 54,
    yearsInPower: 3,
    militaryBackground: false,
    portraitSeed: { skinTone: 12, uniformType: 'SUIT', hairStyle: 2, facialHair: false, glassesStyle: 0, backgroundType: 'DARK' }
  },
  SA: {
    countryId: 'SA',
    name: 'Crown Prince Salman Al Saud',
    title: 'Crown Prince',
    age: 44,
    yearsInPower: 5,
    militaryBackground: false,
    portraitSeed: { skinTone: 28, uniformType: 'ROBE', hairStyle: 0, facialHair: true, glassesStyle: 0, backgroundType: 'CLASSIFIED' }
  },
  BR: {
    countryId: 'BR',
    name: 'President Carlos Silva',
    title: 'President',
    age: 59,
    yearsInPower: 4,
    militaryBackground: false,
    portraitSeed: { skinTone: 35, uniformType: 'CASUAL', hairStyle: 2, facialHair: true, glassesStyle: 0, backgroundType: 'FLAG' }
  },
  ZA: {
    countryId: 'ZA',
    name: 'President Thabo Mbeki II',
    title: 'President',
    age: 53,
    yearsInPower: 2,
    militaryBackground: false,
    portraitSeed: { skinTone: 85, uniformType: 'SUIT', hairStyle: 5, facialHair: false, glassesStyle: 0, backgroundType: 'DARK' }
  },
  AU: {
    countryId: 'AU',
    name: 'Prime Minister Sarah Jenkins',
    title: 'Prime Minister',
    age: 47,
    yearsInPower: 2,
    militaryBackground: false,
    portraitSeed: { skinTone: 8, uniformType: 'SUIT', hairStyle: 1, facialHair: false, glassesStyle: 1, backgroundType: 'FLAG' }
  },
  TR: {
    countryId: 'TR',
    name: 'President Tayfun Erdogan',
    title: 'President',
    age: 63,
    yearsInPower: 9,
    militaryBackground: false,
    portraitSeed: { skinTone: 18, uniformType: 'SUIT', hairStyle: 1, facialHair: true, glassesStyle: 0, backgroundType: 'DARK' }
  },
  EG: {
    countryId: 'EG',
    name: 'Field Marshal Abdel El-SAYED',
    title: 'President',
    age: 57,
    yearsInPower: 7,
    militaryBackground: true,
    portraitSeed: { skinTone: 32, uniformType: 'MILITARY', hairStyle: 5, facialHair: true, glassesStyle: 0, backgroundType: 'FLAG' }
  },
  TW: {
    countryId: 'TW',
    name: 'President Tsai Ying',
    title: 'President',
    age: 50,
    yearsInPower: 4,
    militaryBackground: false,
    portraitSeed: { skinTone: 10, uniformType: 'SUIT', hairStyle: 3, facialHair: false, glassesStyle: 1, backgroundType: 'MAP' }
  }
};

export function getLeaderProfile(countryId: string): LeaderProfile {
  if (LEADER_PROFILES[countryId]) return LEADER_PROFILES[countryId];
  // Procedural fallback
  const charSum = countryId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const skin = charSum % 90;
  const hair = charSum % 6;
  const uniform: Array<LeaderProfile['portraitSeed']['uniformType']> = ['SUIT', 'MILITARY', 'ROBE', 'CASUAL'];
  const uniforms = uniform[charSum % 4];
  const glasses = charSum % 3;
  const background: Array<LeaderProfile['portraitSeed']['backgroundType']> = ['FLAG', 'DARK', 'MAP', 'CLASSIFIED'];
  const bg = background[charSum % 4];

  return {
    countryId,
    name: `Leader of ${countryId}`,
    title: charSum % 2 === 0 ? 'President' : 'Prime Minister',
    age: 45 + (charSum % 30),
    yearsInPower: 1 + (charSum % 15),
    militaryBackground: charSum % 3 === 0,
    portraitSeed: {
      skinTone: skin,
      uniformType: uniforms,
      hairStyle: hair,
      facialHair: charSum % 2 === 0,
      glassesStyle: glasses,
      backgroundType: bg
    }
  };
}
