export interface GeoCoord {
  id: string;
  name: string;
  cx: number;      // Center X for nodes/labels/cities
  cy: number;      // Center Y
  rx: number;      // Oval bounding radius X (for circles/radar effects)
  ry: number;      // Oval bounding radius Y
  labelX: number;
  labelY: number;
  path: string;    // Simplified SVG path polygon drawing approximation of land boundaries
}

export const GEO_COORDS: Record<string, GeoCoord> = {
  US: {
    id: 'US',
    name: 'United States',
    cx: 180, cy: 190, rx: 70, ry: 40,
    labelX: 180, labelY: 190,
    path: 'M 100,140 L 260,140 L 250,225 L 140,240 L 95,190 Z'
  },
  CN: {
    id: 'CN',
    name: 'China',
    cx: 740, cy: 220, rx: 65, ry: 45,
    labelX: 740, labelY: 220,
    path: 'M 670,180 L 800,185 L 810,250 L 730,270 L 680,240 Z'
  },
  IN: {
    id: 'IN',
    name: 'India',
    cx: 680, cy: 285, rx: 40, ry: 45,
    labelX: 680, labelY: 285,
    path: 'M 645,245 L 705,245 L 710,285 L 685,340 L 650,290 Z'
  },
  PK: {
    id: 'PK',
    name: 'Pakistan',
    cx: 635, cy: 260, rx: 25, ry: 25,
    labelX: 635, labelY: 250,
    path: 'M 620,230 L 650,235 L 650,275 L 625,285 L 615,260 Z'
  },
  IL: {
    id: 'IL',
    name: 'Israel',
    cx: 535, cy: 250, rx: 12, ry: 15,
    labelX: 520, labelY: 240,
    path: 'M 533,243 L 539,243 L 538,255 L 532,255 Z'
  },
  PS: {
    id: 'PS',
    name: 'Palestine',
    cx: 536, cy: 257, rx: 10, ry: 10,
    labelX: 525, labelY: 270,
    path: 'M 534,251 L 538,251 L 537,260 L 533,260 Z'
  },
  IR: {
    id: 'IR',
    name: 'Iran',
    cx: 585, cy: 245, rx: 35, ry: 25,
    labelX: 585, labelY: 245,
    path: 'M 560,220 L 610,225 L 615,260 L 570,265 L 555,245 Z'
  },
  RU: {
    id: 'RU',
    name: 'Russia',
    cx: 650, cy: 110, rx: 170, ry: 50,
    labelX: 650, labelY: 110,
    path: 'M 420,80 L 880,75 L 850,150 L 580,140 L 450,130 Z'
  },
  GB: {
    id: 'GB',
    name: 'United Kingdom',
    cx: 415, cy: 155, rx: 15, ry: 25,
    labelX: 385, labelY: 150,
    path: 'M 410,140 L 422,142 L 420,175 L 412,170 Z'
  },
  FR: {
    id: 'FR',
    name: 'France',
    cx: 435, cy: 195, rx: 20, ry: 20,
    labelX: 435, labelY: 195,
    path: 'M 420,180 L 450,180 L 455,210 L 422,215 Z'
  },
  DE: {
    id: 'DE',
    name: 'Germany',
    cx: 462, cy: 180, rx: 18, ry: 20,
    labelX: 470, labelY: 170,
    path: 'M 452,165 L 477,165 L 475,195 L 450,195 Z'
  },
  JP: {
    id: 'JP',
    name: 'Japan',
    cx: 840, cy: 215, rx: 15, ry: 35,
    labelX: 860, labelY: 215,
    path: 'M 833,185 L 845,190 L 840,245 L 830,240 Z'
  },
  KR: {
    id: 'KR',
    name: 'South Korea',
    cx: 808, cy: 215, rx: 10, ry: 12,
    labelX: 808, labelY: 200,
    path: 'M 803,208 L 813,208 L 812,222 L 802,222 Z'
  },
  SA: {
    id: 'SA',
    name: 'Saudi Arabia',
    cx: 550, cy: 285, rx: 35, ry: 25,
    labelX: 550, labelY: 285,
    path: 'M 525,265 L 580,270 L 585,310 L 530,305 Z'
  },
  BR: {
    id: 'BR',
    name: 'Brazil',
    cx: 320, cy: 360, rx: 65, ry: 60,
    labelX: 320, labelY: 360,
    path: 'M 270,305 L 370,320 L 385,385 L 315,430 L 265,370 Z'
  },
  ZA: {
    id: 'ZA',
    name: 'South Africa',
    cx: 495, cy: 415, rx: 30, ry: 25,
    labelX: 495, labelY: 415,
    path: 'M 470,390 L 520,395 L 515,435 L 475,435 Z'
  },
  AU: {
    id: 'AU',
    name: 'Australia',
    cx: 820, cy: 410, rx: 70, ry: 45,
    labelX: 820, labelY: 410,
    path: 'M 755,370 L 880,380 L 875,445 L 765,445 Z'
  },
  TR: {
    id: 'TR',
    name: 'Turkey',
    cx: 520, cy: 215, rx: 25, ry: 15,
    labelX: 520, labelY: 205,
    path: 'M 498,205 L 542,205 L 540,225 L 496,225 Z'
  },
  EG: {
    id: 'EG',
    name: 'Egypt',
    cx: 490, cy: 265, rx: 25, ry: 20,
    labelX: 490, labelY: 265,
    path: 'M 465,248 L 510,248 L 512,282 L 467,282 Z'
  },
  TW: {
    id: 'TW',
    name: 'Taiwan',
    cx: 795, cy: 265, rx: 8, ry: 12,
    labelX: 810, labelY: 275,
    path: 'M 792,258 L 798,258 L 797,272 L 791,272 Z'
  }
};
