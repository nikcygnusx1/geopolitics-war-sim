import { GeoJsonLayer, ArcLayer, ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { WorldState, Country, BallisticStrike } from '../../types';
import { MAP_THEME } from './mapStyles';
import { hexToRGB, getAllianceColorRGB, gdpToRadius } from './mapUtils';
import { getCentroid } from './countryCentroids';

// ISO Normalization mapping arrays
const NAME_TO_A2: Record<string, string> = {
  "United States of America": "US",
  "United States": "US",
  "China": "CN",
  "India": "IN",
  "Pakistan": "PK",
  "Israel": "IL",
  "Palestine": "PS",
  "Iran": "IR",
  "Russia": "RU",
  "United Kingdom": "GB",
  "France": "FR",
  "Germany": "DE",
  "Japan": "JP",
  "South Korea": "KR",
  "Saudi Arabia": "SA",
  "Brazil": "BR",
  "South Africa": "ZA",
  "Australia": "AU",
  "Turkey": "TR",
  "Egypt": "EG",
  "Taiwan": "TW",
  "Ukraine": "UA",
  "Nigeria": "NG",
  "Indonesia": "ID",
  "Mexico": "MX",
  "Vietnam": "VN",
  "Poland": "PL",
  "Netherlands": "NL",
  "Spain": "ES",
  "Italy": "IT",
  "Canada": "CA",
  "Argentina": "AR",
  "Colombia": "CO",
  "Ethiopia": "ET",
  "Kenya": "KE",
  "Morocco": "MA",
  "Algeria": "DZ",
  "Libya": "LY",
  "Syria": "SY",
  "Iraq": "IQ",
  "Yemen": "YE",
  "Kazakhstan": "KZ",
  "Uzbekistan": "UZ",
  "Myanmar": "MM",
  "Thailand": "TH",
  "Malaysia": "MY",
  "Bangladesh": "BD",
  "Philippines": "PH",
  "Finland": "FI",
  "Sweden": "SE",
  "Belarus": "BY",
  "Serbia": "RS",
  "Azerbaijan": "AZ",
  "Armenia": "AM",
};

const NUMERIC_TO_A2: Record<string, string> = {
  "840": "US", "156": "CN", "356": "IN", "586": "PK", "376": "IL", "275": "PS",
  "364": "IR", "643": "RU", "826": "GB", "250": "FR", "276": "DE", "392": "JP",
  "410": "KR", "682": "SA", "076": "BR", "710": "ZA", "036": "AU", "792": "TR",
  "818": "EG", "158": "TW", "804": "UA", "566": "NG", "360": "ID", "484": "MX",
  "704": "VN", "616": "PL", "528": "NL", "724": "ES", "380": "IT", "124": "CA",
  "032": "AR", "170": "CO", "231": "ET", "404": "KE", "504": "MA", "012": "DZ",
  "434": "LY", "760": "SY", "368": "IQ", "887": "YE", "398": "KZ", "860": "UZ",
  "104": "MM", "764": "TH", "458": "MY", "050": "BD", "608": "PH", "246": "FI",
  "752": "SE", "112": "BY", "688": "RS", "031": "AZ", "051": "AM"
};

const ALPHA3_TO_A2: Record<string, string> = {
  USA: "US", CHN: "CN", IND: "IN", PAK: "PK", ISR: "IL", PSE: "PS", IRN: "IR", RUS: "RU",
  GBR: "GB", FRA: "FR", DEU: "DE", JPN: "JP", KOR: "KR", SAU: "SA", BRA: "BR", ZAF: "ZA",
  AUS: "AU", TUR: "TR", EGY: "EG", TWN: "TW", UKR: "UA", NGA: "NG", IDN: "ID", MEX: "MX",
  VNM: "VN", POL: "PL", NLD: "NL", ESP: "ES", ITA: "IT", CAN: "CA", ARG: "AR", COL: "CO",
  ETH: "ET", KEN: "KE", MAR: "MA", DZA: "DZ", LBY: "LY", SYR: "SY", IRQ: "IQ", YEM: "YE",
  KAZ: "KZ", UZB: "UZ", MMR: "MM", THA: "TH", MYS: "MY", BGD: "BD", PHL: "PH", FIN: "FI",
  SWE: "SE", BLR: "BY", SRB: "RS", AZE: "AZ", ARM: "AM"
};

/**
 * Returns Normalized Country Code (ISO-2) based on GeoJSON feature attributes
 */
export function getNormCountryId(feature: any): string | null {
  if (!feature || !feature.properties) return null;
  const props = feature.properties;

  // Try standard iso code fields
  const iso2 = props.ISO_A2 || props.iso_a2 || props.ISO2 || props.iso2;
  if (iso2 && iso2.length === 2 && iso2 !== '-99') return iso2.toUpperCase();

  const iso3 = props.ISO_A3 || props.iso_a3 || props.ISO3 || props.iso3 || feature.id;
  if (iso3 && iso3.length === 3) {
    const matched = ALPHA3_TO_A2[iso3.toUpperCase()];
    if (matched) return matched;
  }

  const codeNum = props.ISO_N3 || props.iso_n3 || props.codenum;
  if (codeNum) {
    const matched = NUMERIC_TO_A2[String(Number(codeNum))];
    if (matched) return matched;
  }

  // Try Name Matching fallback
  const name = props.NAME || props.name || props.admin || props.ADMIN;
  if (name) {
    const matched = NAME_TO_A2[name];
    if (matched) return matched;
    // Partial check fallback
    for (const [key, val] of Object.entries(NAME_TO_A2)) {
      if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
        return val;
      }
    }
  }

  return null;
}

/**
 * RENDER LAYER 1: BASE COUNTRIES LAYER (GEOJSON) WITH DYNAMIC COGNITIVE COLORS
 */
export function buildCountriesLayer(
  geoJsonData: any,
  countries: Record<string, Country>,
  playerCountryId: string,
  targetCountryId: string | undefined,
  activeLayer: string,
  onHover: (info: any) => void,
  onClick: (info: any) => void
) {
  return new GeoJsonLayer({
    id: 'geojson-countries',
    data: geoJsonData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: false,
    lineWidthMinPixels: 1,
    getLineWidth: (f: any) => {
      const id = getNormCountryId(f);
      if (id === playerCountryId) return 3;
      if (id === targetCountryId) return 3;
      if (id && countries[id]?.atWarWith?.length > 0) return 2;
      return 1;
    },
    getLineColor: (f: any) => {
      const id = getNormCountryId(f);
      if (id === playerCountryId) return hexToRGB(MAP_THEME.colors.playerNation);
      if (id === targetCountryId) return hexToRGB(MAP_THEME.colors.targetNation);
      if (id && countries[id]) {
        const c = countries[id];
        if (c.atWarWith?.length > 0) return hexToRGB(MAP_THEME.colors.conflicts);
        return getAllianceColorRGB(c.allianceBlock);
      }
      return [30, 60, 75, 100];
    },
    getFillColor: (f: any) => {
      const id = getNormCountryId(f);
      if (!id || !countries[id]) {
        return [10, 16, 20, 200]; // Unrepresented grey-dark
      }

      const c = countries[id];

      // Layer-specific thematic fill colouring
      switch (activeLayer) {
        case 'political': {
          // Color based on alliance blocks with custom alpha
          const baseColor = getAllianceColorRGB(c.allianceBlock);
          const isPlayer = id === playerCountryId;
          const alpha = isPlayer ? 110 : 55;
          return [...baseColor, alpha];
        }
        case 'conflicts': {
          if (c.atWarWith && c.atWarWith.length > 0) {
            return [255, 59, 78, 90]; // War active red highlight
          }
          const baseOp = c.opinions[playerCountryId] ?? 0;
          if (baseOp < -40) return [180, 50, 50, 40]; // High hostile threat
          return [10, 25, 20, 150];
        }
        case 'economic': {
          // Heatmap of GDP size
          const gdp = c.economic?.gdpB ?? 50;
          const greenAmt = Math.min(255, Math.floor((gdp / 15000) * 180 + 30));
          return [20, greenAmt, 40, 75];
        }
        case 'cyber': {
          const fw = c.intelligence?.cyberFirewallLevel ?? 1;
          const purpleAmt = Math.min(255, Math.floor(fw * 60 + 50));
          return [purpleAmt, 40, 200, 65];
        }
        case 'population': {
          const unrest = c.political?.popularUnrest ?? 0;
          const redAmt = Math.min(255, Math.floor((unrest / 100) * 180 + 30));
          const greenAmt = Math.min(255, Math.floor((1 - unrest / 100) * 120 + 30));
          return [redAmt, greenAmt, 20, 60];
        }
        case 'nuclear': {
          if (c.arsenal?.nuclearCapable) {
            return [0, 207, 255, 80]; // Radiative cyan
          }
          return [10, 20, 30, 150];
        }
        case 'military': {
          const strength = c.arsenal?.totalPowerRating ?? 0;
          const amberAmt = Math.min(255, Math.floor((strength / 500) * 160 + 40));
          return [amberAmt, 110, 20, 70];
        }
        default:
          return [12, 22, 32, 180];
      }
    },
    updateTriggers: {
      getFillColor: [countries, activeLayer, playerCountryId, targetCountryId],
      getLineColor: [countries, playerCountryId, targetCountryId],
      getLineWidth: [countries, playerCountryId, targetCountryId],
    },
    onHover,
    onClick,
  });
}

/**
 * RENDER LAYER 2: BALLISTIC STRIKE TRAJECTORIES
 */
export function buildStrikeArcsLayer(activeStrikes: BallisticStrike[]) {
  const dataset = activeStrikes
    .filter((s) => s.status === 'IN_FLIGHT')
    .map((s) => {
      const start = getCentroid(s.sourceCountryId);
      const end = getCentroid(s.targetCountryId);
      return {
        id: s.id,
        source: start,
        target: end,
        payload: s.weaponType,
        yield: s.warheadYieldMT ?? 0,
      };
    });

  return new ArcLayer({
    id: 'arc-strike-trajectories',
    data: dataset,
    pickable: true,
    getSourcePosition: (d: any) => d.source,
    getTargetPosition: (d: any) => d.target,
    getSourceColor: [255, 30, 70, 245], // Red ignition trail
    getTargetColor: [255, 180, 0, 120],  // Flare burn entry
    getWidth: (d: any) => (d.yield > 0 ? 4 : 2),
    getHeight: 0.6,
    greatCircle: true,
  });
}

/**
 * RENDER LAYER 3: CONFLICT MERIDIANS / ACTIVE ENGAGEMENT TETHER LINES
 */
export function buildConflictTetherLayer(countries: Record<string, Country>) {
  const links: Array<{ id: string; source: [number, number]; target: [number, number] }> = [];

  Object.entries(countries).forEach(([srcId, country]) => {
    if (country.atWarWith) {
      country.atWarWith.forEach((tgtId) => {
        // Prevent drawing duplicates
        if (srcId < tgtId) {
          const source = getCentroid(srcId);
          const target = getCentroid(tgtId);
          if (source[0] !== 0 && target[0] !== 0) {
            links.push({
              id: `${srcId}-${tgtId}`,
              source,
              target,
            });
          }
        }
      });
    }
  });

  return new LineLayer({
    id: 'line-conflict-tethers',
    data: links,
    pickable: false,
    getSourcePosition: (d: any) => d.source,
    getTargetPosition: (d: any) => d.target,
    getColor: [255, 35, 35, 160], // Intense red war-tie
    getWidth: 1.5,
  });
}

/**
 * RENDER LAYER 4: TRADE VALUE FLOOD LINES (ECONOMIC LAYER)
 */
export function buildTradeTetherLayer(countries: Record<string, Country>) {
  const links: Array<{ source: [number, number]; target: [number, number] }> = [];

  Object.entries(countries).forEach(([srcId, country]) => {
    if (country.tradePartners) {
      country.tradePartners.forEach((tgtId) => {
        if (srcId < tgtId) {
          const source = getCentroid(srcId);
          const target = getCentroid(tgtId);
          if (source[0] !== 0 && target[0] !== 0) {
            links.push({ source, target });
          }
        }
      });
    }
  });

  return new LineLayer({
    id: 'line-trade-tethers',
    data: links,
    pickable: false,
    getSourcePosition: (d: any) => d.source,
    getTargetPosition: (d: any) => d.target,
    getColor: [57, 217, 138, 45], // Dim emerald financial lines
    getWidth: 1.0,
  });
}

/**
 * RENDER LAYER 5: DETONATION IMPULSE SPARK RINGS
 */
export function buildDetonationPulseLayer(activeStrikes: BallisticStrike[]) {
  const dataset = activeStrikes
    .filter((s) => s.status === 'IMPACT' || s.status === 'INTERCEPTED')
    .map((s) => {
      const position = getCentroid(s.targetCountryId);
      const isInter = s.status === 'INTERCEPTED';
      return {
        id: s.id,
        position,
        color: isInter ? [0, 200, 255] : [255, 35, 35],
        radius: isInter ? 130000 : 250000,
      };
    });

  return new ScatterplotLayer({
    id: 'detonations-pulse',
    data: dataset,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => [...d.color, 40] as [number, number, number, number],
    getLineColor: (d: any) => [...d.color, 240] as [number, number, number, number],
    lineWidthMinPixels: 2.5,
    stroked: true,
    filled: true,
  });
}

/**
 * RENDER LAYER 6: MILITARY HARBOUR / BASE DEPLOYMENT HUBS
 */
export function buildMilitaryBasesLayer(
  countries: Record<string, Country>,
  playerCountryId: string,
  onClick: (id: string) => void
) {
  const data = Object.entries(countries).map(([id, c]) => {
    return {
      id,
      position: getCentroid(id),
      power: c.arsenal?.totalPowerRating ?? 50,
      isPlayer: id === playerCountryId,
    };
  }).filter((d) => d.position[0] !== 0);

  return new ScatterplotLayer({
    id: 'scatterplot-force-hubs',
    data,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => Math.log10(d.power + 1) * 75000 + 10000,
    getFillColor: (d: any) => (d.isPlayer ? [0, 255, 170, 180] : [245, 166, 35, 140]),
    getLineColor: [0, 0, 0, 150],
    stroked: true,
    filled: true,
    pickable: true,
    onClick: (info: any) => {
      if (info.object) onClick(info.object.id);
    },
  });
}

/**
 * OPERATIONS LAYERS 1: ISR / SENSOR COVERAGE GROUND TRACES
 */
export function buildIsrCoverageLayer(
  countries: Record<string, Country>,
  playerCountryId: string,
  targetCountryId: string | undefined,
  currentTick: number,
  enabled: boolean
) {
  if (!enabled) return null;

  const data: any[] = [];
  
  // Keplerian high-altitude satellites crossing the coordinate space
  const orbits = [
    { name: 'KOSMOS-2544 (RECON)', speed: 0.9, color: [0, 255, 170], offset: 0, latOffset: 20 },
    { name: 'AEGIS ORBITAL-3 (ABM)', speed: 0.6, color: [0, 207, 255], offset: 120, latOffset: -10 },
    { name: 'NROL-44 (SIGINT ELITE)', speed: 0.5, color: [255, 77, 0], offset: 240, latOffset: 40 },
    { name: 'CHINASAT-1C (EARLY WARN)', speed: 1.1, color: [238, 193, 82], offset: 60, latOffset: 0 },
  ];

  orbits.forEach((orb) => {
    const angle = (currentTick * orb.speed + orb.offset) * (Math.PI / 180);
    const lng = ((angle * (180 / Math.PI)) % 360) - 180;
    const lat = orb.latOffset + Math.sin(angle * 2.5) * 35;

    data.push({
      id: orb.name,
      position: [lng, lat],
      color: orb.color,
      radius: 1200000 + Math.sin(currentTick * 0.08) * 150000,
      opacity: 25,
    });
  });

  // Multi-spectrum scanner circle for current selected focus nation
  const focusedId = targetCountryId || playerCountryId;
  if (focusedId && countries[focusedId]) {
    const centroid = getCentroid(focusedId);
    if (centroid[0] !== 0) {
      data.push({
        id: `coverage-${focusedId}`,
        position: centroid,
        color: focusedId === playerCountryId ? [0, 255, 170] : [255, 30, 70],
        radius: 2200000,
        opacity: 35,
      });
    }
  }

  return new ScatterplotLayer({
    id: 'deck-isr-coverage',
    data,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => [...d.color, d.opacity] as [number, number, number, number],
    getLineColor: (d: any) => [...d.color, 160] as [number, number, number, number],
    lineWidthMinPixels: 1.5,
    stroked: true,
    filled: true,
    pickable: true,
    updateTriggers: {
      getPosition: [currentTick],
      getRadius: [currentTick],
    },
  });
}

/**
 * OPERATIONS LAYERS 2: RADAR & AIR DEFENSE WARNING ENVELOPE DOME FIELDS
 */
export function buildRadarDefenseLayer(
  countries: Record<string, Country>,
  playerCountryId: string,
  targetCountryId: string | undefined,
  currentTick: number,
  enabled: boolean
) {
  if (!enabled) return null;

  const data: any[] = [];

  // Render multi-band early warning circles around military powers
  Object.entries(countries).forEach(([id, c]) => {
    const power = c.arsenal?.totalPowerRating ?? 0;
    if (power > 150) {
      const centroid = getCentroid(id);
      if (centroid[0] !== 0) {
        const isPlayer = id === playerCountryId;
        const color = isPlayer ? [0, 255, 170] : [255, 110, 0];
        
        // Inner absolute intercept shield
        data.push({
          id: `radar-inner-${id}`,
          position: centroid,
          color,
          radius: 800000,
          opacity: 15,
        });
        
        // Outer strategic early-warning mesh
        data.push({
          id: `radar-outer-${id}`,
          position: centroid,
          color,
          radius: 1700000 + Math.sin(currentTick * 0.04) * 50000,
          opacity: 6,
        });
      }
    }
  });

  return new ScatterplotLayer({
    id: 'deck-radar-coverage',
    data,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => [...d.color, d.opacity] as [number, number, number, number],
    getLineColor: (d: any) => [...d.color, 110] as [number, number, number, number],
    lineWidthMinPixels: 1.0,
    stroked: true,
    filled: true,
    updateTriggers: {
      getRadius: [currentTick],
    },
  });
}

/**
 * OPERATIONS LAYERS 3: STRATEGIC LOGISTICS CORRIDORS
 */
export function buildLogisticsCorridorsLayer(
  countries: Record<string, Country>,
  enabled: boolean
) {
  if (!enabled) return null;

  const corridors = [
    { from: 'US', to: 'GB', name: 'Trans-Atlantic Express Belt' },
    { from: 'US', to: 'JP', name: 'Trans-Pacific Bridge' },
    { from: 'CN', to: 'SA', name: 'Mideast Commercial Corridor' },
    { from: 'RU', to: 'IN', name: 'Eurasian Logistics Route' },
    { from: 'DE', to: 'BR', name: 'Latam Merchant Lane' },
    { from: 'CN', to: 'JP', name: 'East-Sea Ingress Pathway' },
  ];

  const data: any[] = [];
  corridors.forEach((corr) => {
    const fromCent = getCentroid(corr.from);
    const toCent = getCentroid(corr.to);
    if (fromCent[0] !== 0 && toCent[0] !== 0) {
      data.push({
        id: `logistic-${corr.from}-${corr.to}`,
        source: fromCent,
        target: toCent,
      });
    }
  });

  return new ArcLayer({
    id: 'deck-logistics-corridors',
    data,
    pickable: true,
    getSourcePosition: (d: any) => d.source,
    getTargetPosition: (d: any) => d.target,
    getSourceColor: [0, 240, 255, 110],
    getTargetColor: [0, 120, 255, 30],
    getWidth: 2.0,
    getHeight: 0.18,
    greatCircle: true,
  });
}

/**
 * OPERATIONS LAYERS 4: LIVE ASSET MOVE TRACES
 */
export function buildLiveAssetTracesLayer(
  activeStrikes: BallisticStrike[],
  currentTick: number,
  enabled: boolean
) {
  if (!enabled) return null;

  const data: any[] = [];

  // Ballistic tracking vectors in flight
  activeStrikes.forEach((strike) => {
    if (strike.status === 'IN_FLIGHT') {
      const srcCent = getCentroid(strike.sourceCountryId);
      const tgtCent = getCentroid(strike.targetCountryId);

      if (srcCent[0] !== 0 && tgtCent[0] !== 0) {
        const pct = Math.min(1.0, Math.max(0.0, strike.progressPct / 100));
        const lng = srcCent[0] + (tgtCent[0] - srcCent[0]) * pct;
        const lat = srcCent[1] + (tgtCent[1] - srcCent[1]) * pct;

        const isNuke = strike.weaponType === 'ICBM' || strike.weaponType === 'SLBM';
        data.push({
          id: `trace-${strike.id}`,
          position: [lng, lat],
          color: isNuke ? [0, 207, 255] : [255, 0, 85],
          radius: 170000,
        });
      }
    }
  });

  // Combat Air Patrol (CAP) fighter flights near flashpoints
  const patrolSec = (currentTick * 2.2) * (Math.PI / 180);
  const patrols = [
    { center: [121.5, 23.5], radius: 1.5, color: [184, 127, 255] },
    { center: [37.6, 55.7], radius: 1.9, color: [184, 127, 255] },
    { center: [-77.0, 38.9], radius: 1.6, color: [184, 127, 255] },
    { center: [35.0, 31.5], radius: 1.0, color: [184, 127, 255] },
  ];

  patrols.forEach((pat, i) => {
    const lng = pat.center[0] + Math.cos(patrolSec + i * 4) * pat.radius;
    const lat = pat.center[1] + Math.sin(patrolSec + i * 4) * pat.radius;

    data.push({
      id: `patrol-${i}`,
      position: [lng, lat],
      color: pat.color,
      radius: 90000,
    });
  });

  return new ScatterplotLayer({
    id: 'deck-live-traces',
    data,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => [...d.color, 210] as [number, number, number, number],
    getLineColor: [255, 255, 255, 170],
    lineWidthMinPixels: 1.5,
    stroked: true,
    filled: true,
    updateTriggers: {
      getPosition: [currentTick],
    },
  });
}

/**
 * OPERATIONS LAYERS 5: ANALYST COPILOT CHOKEPOINTS & TARGET DETECTOR HALOS
 */
export function buildCopilotHighlightsLayer(
  highlightedCountryIds: string[],
  currentTick: number
) {
  if (!highlightedCountryIds || highlightedCountryIds.length === 0) return null;

  const data: any[] = [];

  highlightedCountryIds.forEach((id) => {
    const centroid = getCentroid(id);
    if (centroid[0] !== 0) {
      // 1. Core warning radar tracker point
      data.push({
        id: `copilot-core-${id}-${currentTick}`,
        position: centroid,
        color: [255, 179, 0], // Amber gold
        radius: 400000,
        opacity: 180,
      });

      // 2. Wide sweeping sweep-radar halo (dynamic pulsation)
      const pulseRadius = 1500000 + Math.sin(currentTick * 0.15) * 500000;
      data.push({
        id: `copilot-halo-${id}-${currentTick}`,
        position: centroid,
        color: [255, 130, 0], // Darker orange
        radius: pulseRadius,
        opacity: 35,
      });

      // 3. Pinpoint satellite lock glyph circle
      data.push({
        id: `copilot-pinpoint-${id}-${currentTick}`,
        position: centroid,
        color: [0, 229, 255], // Cyan
        radius: 2000000,
        opacity: 20,
      });
    }
  });

  return new ScatterplotLayer({
    id: 'deck-copilot-highlights',
    data,
    getPosition: (d: any) => [d.position[0], d.position[1], 0],
    getRadius: (d: any) => d.radius,
    getFillColor: (d: any) => [...d.color, d.opacity] as [number, number, number, number],
    getLineColor: (d: any) => [...d.color, 200] as [number, number, number, number],
    lineWidthMinPixels: 1.8,
    stroked: true,
    filled: true,
    pickable: false,
    updateTriggers: {
      getRadius: [currentTick],
    },
  });
}

