import { RouteNode, RouteSegment, BilateralTradeProfile, TradeIncident, StrategicTradeCategory } from '../types/trade';

export const INITIAL_ROUTE_NODES: RouteNode[] = [
  {
    id: 'node_hormuz',
    name: 'Strait of Hormuz',
    type: 'sealane',
    coordinates: { x: 582, y: 255 },
    capacityIndex: 95,
    currentUsage: 78,
    vulnerabilityScore: 85,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['IR', 'SA'],
    description: 'The world\'s most critical energy chokepoint, conveying over 20% of global petroleum liquids.'
  },
  {
    id: 'node_malacca',
    name: 'Strait of Malacca',
    type: 'sealane',
    coordinates: { x: 730, y: 320 },
    capacityIndex: 90,
    currentUsage: 85,
    vulnerabilityScore: 65,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['IN', 'CN'],
    description: 'Primary sea lane connecting the Indian Ocean to the South China Sea. Vital tech/mineral shipping gateway.'
  },
  {
    id: 'node_suez',
    name: 'Suez Canal & Bab al-Mandab',
    type: 'sealane',
    coordinates: { x: 525, y: 255 },
    capacityIndex: 85,
    currentUsage: 70,
    vulnerabilityScore: 75,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['EG'],
    description: 'Maritime artery linking East Asia to Mediterranean/European markets. Subject to asymmetric regional targeting.'
  },
  {
    id: 'node_druzhba',
    name: 'Druzhba Pipeline Terminal',
    type: 'pipeline',
    coordinates: { x: 535, y: 155 },
    capacityIndex: 80,
    currentUsage: 45,
    vulnerabilityScore: 40,
    operationalStatus: 'STRESSED',
    controllingCountryIds: ['RU', 'DE'],
    description: 'Major trans-Eurasian pipeline system conveying crude oil and natural gas directly from Russian basins to Central Europe.'
  },
  {
    id: 'node_cpec',
    name: 'Karakoram Corridor (CPEC)',
    type: 'corridor',
    coordinates: { x: 650, y: 250 },
    capacityIndex: 60,
    currentUsage: 50,
    vulnerabilityScore: 55,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['CN', 'PK'],
    description: 'Bilateral overland highway and infrastructure network linking Kashgar in Xinjiang directly to Gwadar Port.'
  },
  {
    id: 'node_taiwans_strait',
    name: 'Taiwan Strait Lanes',
    type: 'sealane',
    coordinates: { x: 790, y: 255 },
    capacityIndex: 98,
    currentUsage: 92,
    vulnerabilityScore: 90,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['TW', 'US', 'CN'],
    description: 'High-density container highway carrying advanced semiconductor fabrications, subject to naval exclusion exercises.'
  },
  {
    id: 'node_rotterdam',
    name: 'Port of Rotterdam',
    type: 'port',
    coordinates: { x: 445, y: 165 },
    capacityIndex: 100,
    currentUsage: 80,
    vulnerabilityScore: 20,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['DE', 'FR'],
    description: 'Europe\'s largest mega-port; core inbound point for global trade, raw materials, agricultural and consumer goods.'
  },
  {
    id: 'node_shanghai',
    name: 'Port of Shanghai Deepwater',
    type: 'port',
    coordinates: { x: 785, y: 225 },
    capacityIndex: 100,
    currentUsage: 88,
    vulnerabilityScore: 35,
    operationalStatus: 'OPERATIONAL',
    controllingCountryIds: ['CN'],
    description: 'World\'s busiest container shipping complex; handles dominant share of East-West industrial and consumer trade.'
  }
];

export const INITIAL_ROUTE_SEGMENTS: RouteSegment[] = [
  {
    id: 'seg_druzhba_line',
    name: 'Druzhba Trunk Pipeline',
    type: 'pipeline',
    originNodeId: 'node_shanghai', // proxy links for visual flow on map
    destNodeId: 'node_druzhba',
    capacityIndex: 75,
    status: 'STRESSED',
    chokepointRisk: 50,
    controlCountryId: 'RU',
    description: 'Direct pipeline flows conveying siberian crude toward Central European hubs.'
  },
  {
    id: 'seg_cpec_road',
    name: 'Karakoram Highway',
    type: 'corridor',
    originNodeId: 'node_cpec',
    destNodeId: 'node_shanghai',
    capacityIndex: 55,
    status: 'OPERATIONAL',
    chokepointRisk: 45,
    controlCountryId: 'PK',
    description: 'Mountain pass corridor vulnerable to seismic events and regional militia action.'
  },
  {
    id: 'seg_hormuz_lane',
    name: 'Persian Gulf Transit Lane',
    type: 'sealane',
    originNodeId: 'node_hormuz',
    destNodeId: 'node_malacca',
    capacityIndex: 90,
    status: 'OPERATIONAL',
    chokepointRisk: 80,
    controlCountryId: 'IR',
    description: 'Deep sea tanker channel through which critical Gulf sweet crude progresses toward Indo-Pacific destinations.'
  },
  {
    id: 'seg_malacca_highway',
    name: 'Malacca shipping arterial',
    type: 'sealane',
    originNodeId: 'node_malacca',
    destNodeId: 'node_shanghai',
    capacityIndex: 95,
    status: 'OPERATIONAL',
    chokepointRisk: 60,
    description: 'East Asian shipping transit highway carrying raw iron ore, oil, gas, and finished electronics.'
  },
  {
    id: 'seg_taiwan_crossing',
    name: 'East China Sea Tech Shipping',
    type: 'sealane',
    originNodeId: 'node_taiwans_strait',
    destNodeId: 'node_rotterdam',
    capacityIndex: 95,
    status: 'OPERATIONAL',
    chokepointRisk: 75,
    description: 'Trans-Pacific container lanes carrying over 60% of international advanced microchips.'
  }
];

export const INITIAL_BILATERAL_PROFILES: BilateralTradeProfile[] = [
  {
    exporterCountryId: 'RU',
    importerCountryId: 'DE',
    totalTradeWeight: 78,
    totalTradeValueB: 42.5,
    categoryBreakdown: [
      {
        categoryId: 'energy',
        direction: 'EXPORT',
        weightShare: 80,
        valueIndexB: 34.0,
        strategicImportance: 10,
        substitutability: 9, // Pipelines cannot easily be replaced
        routeDependence: 8,
        disruptionSensitivity: 85,
        policyExposure: 90
      },
      {
        categoryId: 'minerals',
        direction: 'EXPORT',
        weightShare: 15,
        valueIndexB: 6.3,
        strategicImportance: 8,
        substitutability: 7,
        routeDependence: 6,
        disruptionSensitivity: 60,
        policyExposure: 70
      },
      {
        categoryId: 'inputs',
        direction: 'EXPORT',
        weightShare: 5,
        valueIndexB: 2.2,
        strategicImportance: 4,
        substitutability: 4,
        routeDependence: 3,
        disruptionSensitivity: 30,
        policyExposure: 40
      }
    ],
    importDependenceScore: 82, // Germany is highly dependent on Russian energy pipelines
    exportDependenceScore: 60, // Russia is moderately dependent on German cash flows
    substitutionDifficulty: 85,
    strategicSensitivity: 90,
    routeIds: ['node_druzhba', 'seg_druzhba_line'],
    currentRestrictionLevel: 'TARIFFS',
    currentTariffPressure: 15,
    restrictedCategories: [],
    bilateralTradeTrend: 'DECLINING',
    lastUpdatedTick: 0
  },
  {
    exporterCountryId: 'TW',
    importerCountryId: 'US',
    totalTradeWeight: 92,
    totalTradeValueB: 110.8,
    categoryBreakdown: [
      {
        categoryId: 'tech',
        direction: 'EXPORT',
        weightShare: 75,
        valueIndexB: 83.1,
        strategicImportance: 10,
        substitutability: 10, // Extreme semiconductor dependence (TSMC)
        routeDependence: 9,
        disruptionSensitivity: 95,
        policyExposure: 80
      },
      {
        categoryId: 'defense',
        direction: 'EXPORT',
        weightShare: 15,
        valueIndexB: 16.6,
        strategicImportance: 9,
        substitutability: 8,
        routeDependence: 9,
        disruptionSensitivity: 75,
        policyExposure: 85
      },
      {
        categoryId: 'services',
        direction: 'EXPORT',
        weightShare: 10,
        valueIndexB: 11.1,
        strategicImportance: 5,
        substitutability: 4,
        routeDependence: 2,
        disruptionSensitivity: 20,
        policyExposure: 30
      }
    ],
    importDependenceScore: 90, // America depends heavily on Taiwanese fabrication
    exportDependenceScore: 40,
    substitutionDifficulty: 95,
    strategicSensitivity: 95,
    routeIds: ['node_taiwans_strait', 'seg_taiwan_crossing'],
    currentRestrictionLevel: 'NONE',
    currentTariffPressure: 0,
    restrictedCategories: [],
    bilateralTradeTrend: 'EXPANDING',
    lastUpdatedTick: 0
  },
  {
    exporterCountryId: 'CN',
    importerCountryId: 'PK',
    totalTradeWeight: 65,
    totalTradeValueB: 24.2,
    categoryBreakdown: [
      {
        categoryId: 'inputs',
        direction: 'EXPORT',
        weightShare: 40,
        valueIndexB: 9.6,
        strategicImportance: 6,
        substitutability: 5,
        routeDependence: 7,
        disruptionSensitivity: 50,
        policyExposure: 60
      },
      {
        categoryId: 'infrastructure' as StrategicTradeCategory, // fallback mapping to inputs
        direction: 'EXPORT',
        weightShare: 35,
        valueIndexB: 8.5,
        strategicImportance: 8,
        substitutability: 7,
        routeDependence: 8,
        disruptionSensitivity: 40,
        policyExposure: 75
      },
      {
        categoryId: 'consumer',
        direction: 'EXPORT',
        weightShare: 25,
        valueIndexB: 6.1,
        strategicImportance: 3,
        substitutability: 3,
        routeDependence: 4,
        disruptionSensitivity: 15,
        policyExposure: 30
      }
    ],
    importDependenceScore: 70, // Pakistan is dependent on Chinese input corridor
    exportDependenceScore: 25,
    substitutionDifficulty: 55,
    strategicSensitivity: 65,
    routeIds: ['node_cpec', 'seg_cpec_road'],
    currentRestrictionLevel: 'NONE',
    currentTariffPressure: 0,
    restrictedCategories: [],
    bilateralTradeTrend: 'STABLE',
    lastUpdatedTick: 0
  },
  {
    exporterCountryId: 'BR',
    importerCountryId: 'CN',
    totalTradeWeight: 70,
    totalTradeValueB: 88.4,
    categoryBreakdown: [
      {
        categoryId: 'food',
        direction: 'EXPORT',
        weightShare: 65,
        valueIndexB: 57.4,
        strategicImportance: 9, // Soybeans, grains, animal feed supply stability
        substitutability: 6,
        routeDependence: 7,
        disruptionSensitivity: 80,
        policyExposure: 50
      },
      {
        categoryId: 'minerals',
        direction: 'EXPORT',
        weightShare: 35,
        valueIndexB: 31.0,
        strategicImportance: 8, // Iron ore, rare earth inputs
        substitutability: 5,
        routeDependence: 7,
        disruptionSensitivity: 65,
        policyExposure: 40
      }
    ],
    importDependenceScore: 78, // China depends on Brazil agricultural caloric flows
    exportDependenceScore: 68, // Brazil depends on Chinese capital buying power
    substitutionDifficulty: 60,
    strategicSensitivity: 75,
    routeIds: ['node_rotterdam', 'node_shanghai', 'seg_malacca_highway'], // global maritime routing
    currentRestrictionLevel: 'NONE',
    currentTariffPressure: 0,
    restrictedCategories: [],
    bilateralTradeTrend: 'EXPANDING',
    lastUpdatedTick: 0
  },
  {
    exporterCountryId: 'SA',
    importerCountryId: 'JP',
    totalTradeWeight: 88,
    totalTradeValueB: 38.6,
    categoryBreakdown: [
      {
        categoryId: 'energy',
        direction: 'EXPORT',
        weightShare: 95,
        valueIndexB: 36.6,
        strategicImportance: 10, // Extreme crude supply dependency
        substitutability: 8,
        routeDependence: 9, // Extreme maritime transit dependence (Hormuz + Malacca)
        disruptionSensitivity: 90,
        policyExposure: 70
      },
      {
        categoryId: 'services',
        direction: 'EXPORT',
        weightShare: 5,
        valueIndexB: 2.0,
        strategicImportance: 3,
        substitutability: 3,
        routeDependence: 2,
        disruptionSensitivity: 10,
        policyExposure: 20
      }
    ],
    importDependenceScore: 85, // Japan imports 40% of its energy from Saudi sources
    exportDependenceScore: 35,
    substitutionDifficulty: 80,
    strategicSensitivity: 85,
    routeIds: ['node_hormuz', 'seg_hormuz_lane', 'node_malacca', 'seg_malacca_highway'],
    currentRestrictionLevel: 'NONE',
    currentTariffPressure: 0,
    restrictedCategories: [],
    bilateralTradeTrend: 'STABLE',
    lastUpdatedTick: 0
  },
  {
    exporterCountryId: 'CN',
    importerCountryId: 'US',
    totalTradeWeight: 95,
    totalTradeValueB: 504.2,
    categoryBreakdown: [
      {
        categoryId: 'consumer',
        direction: 'EXPORT',
        weightShare: 45,
        valueIndexB: 226.9,
        strategicImportance: 6,
        substitutability: 5,
        routeDependence: 5,
        disruptionSensitivity: 40,
        policyExposure: 70
      },
      {
        categoryId: 'inputs',
        direction: 'EXPORT',
        weightShare: 35,
        valueIndexB: 176.5,
        strategicImportance: 8,
        substitutability: 8,
        routeDependence: 6,
        disruptionSensitivity: 70,
        policyExposure: 80
      },
      {
        categoryId: 'tech',
        direction: 'EXPORT',
        weightShare: 20,
        valueIndexB: 100.8,
        strategicImportance: 9,
        substitutability: 8,
        routeDependence: 7,
        disruptionSensitivity: 85,
        policyExposure: 90
      }
    ],
    importDependenceScore: 68, // America is dependent on Chinese assembly & input supply chains
    exportDependenceScore: 88, // China is highly dependent on US financial buyers
    substitutionDifficulty: 75,
    strategicSensitivity: 85,
    routeIds: ['node_shanghai', 'seg_malacca_highway', 'node_rotterdam'],
    currentRestrictionLevel: 'SECTORAL',
    currentTariffPressure: 25,
    restrictedCategories: ['tech'], // Semiconductor & tech battle active!
    bilateralTradeTrend: 'DECLINING',
    lastUpdatedTick: 0
  }
];

export const INITIAL_TRADE_INCIDENTS: TradeIncident[] = [
  {
    id: 'inc_tariff_01',
    tick: 1,
    type: 'TARIFF_ALERT',
    actorCountryId: 'US',
    targetCountryId: 'CN',
    summary: 'United States implements a 25% targeted tariff package on Chinese advanced computing components.',
    economicImpactRating: 'STRESSED'
  },
  {
    id: 'inc_route_02',
    tick: 3,
    type: 'ROUTE_DISRUPTION',
    routeId: 'node_druzhba',
    actorCountryId: 'RU',
    summary: 'Druzhba pipeline compressor maintenance restrictions reduce fuel flow to Central Europe by 25%.',
    economicImpactRating: 'STRESSED'
  },
  {
    id: 'inc_coerce_03',
    tick: 5,
    type: 'COERCIVE_LEVERAGE_PRESSURE',
    actorCountryId: 'TW',
    targetCountryId: 'US',
    summary: 'Asymmetric reliance on Taiwanese physical chip fabrication hits historic alert levels; US warns of vulnerability.',
    economicImpactRating: 'SEVERE'
  }
];
