import { ArachneIntelItem, ArachneTheme, ArachneSourceClass, ArachneUrgency, ArachneConfidence, ArachneFreshness, ArachnePriority, ArachneBriefGroup } from '../types/arachne';
import { ScenarioId, WorldState } from '../types';

export interface SeedTemplate {
  title: string;
  summary: string;
  fullBrief: string;
  whyItMatters: string;
  countryIds: string[];
  regionIds: string[];
  themeTags: ArachneTheme[];
  urgency: ArachneUrgency;
  confidence: ArachneConfidence;
  sourceType: ArachneSourceClass;
  sourceLabel: string;
  strategicPriority: ArachnePriority;
  requiresAttention: boolean;
  briefingCategory: ArachneBriefGroup;
  icon?: string;
  storyId?: string;
}

// Global baseline records that exist in any scenario to enrich the environment.
export const GLOBAL_BASELINES: SeedTemplate[] = [
  {
    title: "Global Supply Chain Congestion",
    summary: "Integrated sensor feeds report 12% rise in idle deepwater freight liners docked at secondary ports.",
    fullBrief: "Remote terminal imaging combined with open commercial satellite records (OSINT) reveals structured backup lines across key choke points. This indicates quiet pre-positioning and elevated shipping insurance premiums.",
    whyItMatters: "May bottleneck micro-component transfer, increasing silicon and tech-sector dependencies.",
    countryIds: ["US", "CN", "DE"],
    regionIds: ["Pacific Rim", "North Sea"],
    themeTags: ["TRADE", "ECONOMIC"],
    urgency: "LOW",
    confidence: "HIGH",
    sourceType: "OSINT",
    sourceLabel: "EUMETSAT / AIS Transponder Feeds",
    strategicPriority: "BACKGROUND",
    requiresAttention: false,
    briefingCategory: "BACKGROUND_SIGNAL",
    storyId: "st_shipping_backup"
  },
  {
    title: "Vessel-Tracking Rumor: Dark Fleet Transfers",
    summary: "Raw maritime gossip notes potential unflagged tanker transfers in deep international waters.",
    fullBrief: "Intercepted harbor master VHF signals (RUMINT/OSINT) hint at sea-surface oil transfers from sanctioned entities. Intelligence confidence remains low, but tracking indicators show persistent transponder spoofing patterns.",
    whyItMatters: "Sanctioned states may bypass resource embargoes to sustain current military financing.",
    countryIds: ["RU", "IR"],
    regionIds: ["Baltic Coast", "Persian Gulf"],
    themeTags: ["SANCTIONS", "ENERGY", "COVERT_RISK"],
    urgency: "MEDIUM",
    confidence: "LOW",
    sourceType: "RUMINT",
    sourceLabel: "Baltic Freight Brokers Direct Network",
    strategicPriority: "MEDIUM",
    requiresAttention: false,
    briefingCategory: "ACTIVE_WATCH",
    storyId: "st_dark_fleet"
  },
  {
    title: "Cyber Security: Decoy Intrusion in SCADA System",
    summary: "Technical signal capture notes automated ping sweep targeting Baltic civilian power segments.",
    fullBrief: "SIGINT elements observed quiet technical footprints that mimic local domestic utilities but originate from remote staging hosts. Direct malicious code was not deployed, indicating reconnaissance phase telemetry scanning.",
    whyItMatters: "Establishes a capability for offensive grid-destabilization actions if proxy tension escalates.",
    countryIds: ["RU", "DE"],
    regionIds: ["Central Europe", "Baltic Grid"],
    themeTags: ["CYBER", "INTELLIGENCE"],
    urgency: "MEDIUM",
    confidence: "HIGH",
    sourceType: "SIGINT",
    sourceLabel: "BND Cyber Defense Command Wire",
    strategicPriority: "MEDIUM",
    requiresAttention: true,
    briefingCategory: "ACTIVE_WATCH",
    storyId: "st_baltic_scada"
  },
  {
    title: "Internal Report: Hardliner Coaction",
    summary: "Confidential human assets note highly structured meeting between military factions.",
    fullBrief: "HUMINT agent networks inside secondary regional offices report elite defense hardliners coordinating with domestic propaganda networks. The discourse centered on accelerating strategic weapons readiness due to alleged global containment.",
    whyItMatters: "Indicates systemic risk of internal government posture shift towards hawk doctrines.",
    countryIds: ["CN", "RU"],
    regionIds: ["Eurasian Heartland"],
    themeTags: ["LEADERSHIP", "MILITARY"],
    urgency: "HIGH",
    confidence: "MEDIUM",
    sourceType: "HUMINT",
    sourceLabel: "Clandestine Humint Desk - Sector 4",
    strategicPriority: "HIGH",
    requiresAttention: true,
    briefingCategory: "TOP_STORY",
    storyId: "st_hardliner_coaction"
  }
];

// Scenario Specific Seed Templates
export const SCENARIO_SEEDS: Record<ScenarioId, SeedTemplate[]> = {
  MENA_SPARK: [
    {
      title: "ALERT: Israel-Iran Mutual Wartime Mobilization",
      summary: "CONFIRMED: Sovereign war declarations trigger immediate force projection postures in Tel Aviv and Tehran.",
      fullBrief: "Following escalating border conflicts, both Israel and Iran have declared active hostilities. Defense command centers are fully staffed. Standard public tracking networks report full combat troop mobilization and airspace closures.",
      whyItMatters: "Direct risk of missile strikes bypasses conventional diplomacy. Critical potential for nuclear escalation.",
      countryIds: ["IL", "IR", "PS"],
      regionIds: ["Middle East", "Levant"],
      themeTags: ["MILITARY", "DIPLOMACY"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "Sovereign Command Multi-Channel Verification",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_mena_mobilize"
    },
    {
      title: "Signals Intercept: Iranian Missiles Fueling",
      summary: "SIGINT detection of heat signatures consistent with liquid propellant loading in Central Iran.",
      fullBrief: "Technical sensors (SIGINT) have isolated high-frequency secure communications from the Islamic Revolutionary Guard Corps missile brigade. Satellite imagery confirms mobile transporter-erector-launchers (TELs) are exiting deep caverns.",
      whyItMatters: "Tactical warning: First strike capability is actively prepped. ABM defensive systems must go to maximum standby.",
      countryIds: ["IR", "IL"],
      regionIds: ["Iranian Plateau"],
      themeTags: ["MILITARY", "PROLIFERATION"],
      urgency: "CRITICAL",
      confidence: "HIGH",
      sourceType: "SIGINT",
      sourceLabel: "NSA GCHQ Shared Sat-Signals Desk",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_ir_propellant"
    },
    {
      title: "Human Asset Feed: Jerusalem Cabinet Disaccord",
      summary: "Cabinet insiders describe acute split over preemptive strike strategy.",
      fullBrief: "HUMINT reporting from deep within the Israeli security cabinet reveals severe friction between the Minister of Defense and intelligence analysts regarding the speed of retaliatory response. Hardliners are advocating for immediate strikes on key enrichment facilities.",
      whyItMatters: "Coup-risk and political instability indicators. The cabinet is sensitive to public sentiments and US opinions.",
      countryIds: ["IL", "US"],
      regionIds: ["Levant"],
      themeTags: ["LEADERSHIP", "ALLIANCES"],
      urgency: "HIGH",
      confidence: "HIGH",
      sourceType: "HUMINT",
      sourceLabel: "Mossad Internal Informant Network 81",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_il_cabinet_split"
    },
    {
      title: "OSINT Report: Gulf Oil Tankers Rerouting",
      summary: "Commercial shipping data indicates oil exports bypass Strait of Hormuz.",
      fullBrief: "Open-source intelligence (OSINT) maritime routing registries verify that 35 tankers have changed vectors in the past 24 hours. The cost of Brent crude oil insurance has risen 85% due to the hazard of anti-ship missile batteries on the coast.",
      whyItMatters: "Triggers supply shock in global markets, degrading GDP of major importing nations.",
      countryIds: ["SA", "US", "IR"],
      regionIds: ["Persian Gulf"],
      themeTags: ["ECONOMIC", "ENERGY", "TRADE"],
      urgency: "HIGH",
      confidence: "TOTAL",
      sourceType: "OSINT",
      sourceLabel: "Lloyd's List Intelligence Tracker",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_mena_oil_routes"
    },
    {
      title: "Rumor: Riyadh Secret Backchannel Talks",
      summary: "Local gossip hints at back-channel guarantees between Russian and Saudi envoys.",
      fullBrief: "Rumors (RUMINT) from diplomatic staff in Cairo suggest Saudi Arabia is negotiating a quiet security guarantee with BRICS members in exchange for a pledge not to host US strike platforms if the war widens.",
      whyItMatters: "Could strain NATO and GCC alliance configurations, degrading Western diplomatic options.",
      countryIds: ["SA", "RU", "US"],
      regionIds: ["Arabian Peninsula"],
      themeTags: ["DIPLOMACY", "ALLIANCES"],
      urgency: "MEDIUM",
      confidence: "LOW",
      sourceType: "RUMINT",
      sourceLabel: "Cairo Diplomatic Corridor Rumors",
      strategicPriority: "MEDIUM",
      requiresAttention: false,
      briefingCategory: "BACKGROUND_SIGNAL",
      storyId: "st_riyadh_backchannel"
    }
  ],
  KASHMIR_FLASHPOINT: [
    {
      title: "ALERT: LOC Troop Build-Up Confirmed",
      summary: "New radar and visual intelligence reveals division-scale mechanised troop movements along the LOC.",
      fullBrief: "Confirmed military troop deployments (OSINT + IMINT) show India and Pakistan mobilizing upwards of 250,000 personnel. Strategic drone units are conducting constant electronic jamming raids along the border.",
      whyItMatters: "High risk of flashpoint ignition. Any border clash could trigger immediate military retaliations.",
      countryIds: ["IN", "PK"],
      regionIds: ["Kashmir LOC"],
      themeTags: ["MILITARY", "UNREST"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "Joint Command Combined Imaging Constellation",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_loc_buildup"
    },
    {
      title: "Intercept: Rawalpindi Strategic Nuclear Alert",
      summary: "SIGINT has decrypted command authentication codes sent to Pakistan missile bases.",
      fullBrief: "NSA communications signals intercept (SIGINT) registers active prep protocols at Sargodha and Khuzdar missile storage facilities. Decrypted orders suggest Pakistan command has authorized warhead mating steps under preemptive deterrence doctrines.",
      whyItMatters: "Direct threat of nuclear escalation. First strikes could be initiated on minimal indicators.",
      countryIds: ["PK", "IN"],
      regionIds: ["Punjab Plain"],
      themeTags: ["PROLIFERATION", "CYBER"],
      urgency: "CRITICAL",
      confidence: "HIGH",
      sourceType: "SIGINT",
      sourceLabel: "Sovereign Sigint Section-9 Intercept",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_pk_missile_mate"
    },
    {
      title: "Humint Report: New Delhi Sovereign Council Friction",
      summary: "Clandestine informant states raw nationalist factions are pressuring prime leadership.",
      fullBrief: "Human intelligence reporting (HUMINT) indicates the Governing Military/Nationalist Faction is demanding aggressive airspace incursions into Azad Kashmir to satisfy public unrest and patriotic demands.",
      whyItMatters: "Governing faction demands can destabilize political cabinets and force irrational tactical choices.",
      countryIds: ["IN", "US"],
      regionIds: ["New Delhi District"],
      themeTags: ["LEADERSHIP", "UNREST"],
      urgency: "HIGH",
      confidence: "MEDIUM",
      sourceType: "HUMINT",
      sourceLabel: "Clandestine Station Delhi-Alpha",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_delhi_unrest"
    },
    {
      title: "Economic Watch: Rupee Collapses Margin Markets",
      summary: "Bourse monitors record 24% volatility in Indian and Pakistani currency trading.",
      fullBrief: "Commercial market feeds (OSINT) confirm massive capital flights out of Mumbai and Karachi. International banks have downgraded both sovereign bond ratings to BBB/C, forcing liquidity panics.",
      whyItMatters: "Collapses trade surplus margins, spikes domestic inflation and stokes severe popular unrest.",
      countryIds: ["IN", "PK"],
      regionIds: ["South Asia"],
      themeTags: ["ECONOMIC", "TRADE"],
      urgency: "HIGH",
      confidence: "TOTAL",
      sourceType: "OSINT",
      sourceLabel: "Reuters Financial Bourse Wire",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_kashmir_economic_panic"
    }
  ],
  STRAIT_CLOSURE: [
    {
      title: "ALERT: Strait of Malacca Blockade Enforced",
      summary: "Military exercises clamp down on regional shipping. Vessel checkports established.",
      fullBrief: "Citing security threats, China (CN) has initiated a massive naval blockade in the Malacca Strait. Armed frigates are actively turning back commercial container liners headed for Western ports.",
      whyItMatters: "Degrades global semiconductor and industrial supply chains. Direct breach of sea navigation treaties.",
      countryIds: ["CN", "US", "JP"],
      regionIds: ["Southeast Asia", "Strait of Malacca"],
      themeTags: ["MILITARY", "TRADE", "SANCTIONS"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "Pacific Command Naval Intelligence Feed",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_malacca_blockade"
    },
    {
      title: "SIGINT Scan: Seventh Fleet Tactical Jammers",
      summary: "Electronic reconnaissance registers intense cyber jamming envelopes in South China Sea.",
      fullBrief: "US carrier strike groups are operating high-power broad-spectrum electronic attack modules to shield surface movements from Chinese space reconnaissance. Airwaves are saturated with noise signals.",
      whyItMatters: "Indicates active preparatory combat operations. Local drone feeds are compromised.",
      countryIds: ["US", "CN"],
      regionIds: ["South China Sea"],
      themeTags: ["CYBER", "MILITARY"],
      urgency: "HIGH",
      confidence: "HIGH",
      sourceType: "SIGINT",
      sourceLabel: "7th Fleet Shipborne Sigint Desk",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_7th_fleet_jamming"
    },
    {
      title: "Human Asset: Taiwan Sea Operations Sabotage Risk",
      summary: "Operational assets warn of sleeper agents positioned near critical shore relays.",
      fullBrief: "HUMINT intelligence suggests state-sponsored sleeper cells have mapped underwater communications lines exiting Taiwan, planning covert cuts in coordination with maritime blockades.",
      whyItMatters: "Would isolate tech communications, disabling immediate global reaction capabilities.",
      countryIds: ["TW", "CN"],
      regionIds: ["Taiwan Strait"],
      themeTags: ["COVERT_RISK", "CYBER"],
      urgency: "HIGH",
      confidence: "MEDIUM",
      sourceType: "HUMINT",
      sourceLabel: "Taipei Counter-Intel Operative Network",
      strategicPriority: "HIGH",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_taiwan_sleeper"
    }
  ],
  SOVEREIGN_DEFAULT: [
    {
      title: "ALERT: Sovereign Debt Default Declared",
      summary: "Major emerging power halts bond yield coupon payments, triggering IMF emergency session.",
      fullBrief: "Faced with critical debt-to-GDP and massive capital flight, sovereign finance offices have declared an official freeze on payment settlements. Global markets are tumbling.",
      whyItMatters: "Extreme economic distress could collapse political cabinets and prompt quick populist coup attempts.",
      countryIds: ["BR", "US", "ZA"],
      regionIds: ["Latin America", "Sub-Saharan Africa"],
      themeTags: ["ECONOMIC", "TRADE"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "IMF / Bloomberg Sovereign Debt Monitor",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_sov_default"
    },
    {
      title: "HUMINT Feed: Riot Controllers Overrun in Johannesburg",
      summary: "Field contacts report popular unrest is breaching administrative compound perimeters.",
      fullBrief: "HUMINT agents describe massive civilian crowds breaching police blockades in Johannesburg due to food price spikes and fuel rationing. The government cabinet has entered an underground secure shelter.",
      whyItMatters: "High risk of regime collapse or coup d'etat. Military factions may step in to enforce martial law.",
      countryIds: ["ZA"],
      regionIds: ["Southern Africa"],
      themeTags: ["UNREST", "LEADERSHIP"],
      urgency: "HIGH",
      confidence: "HIGH",
      sourceType: "HUMINT",
      sourceLabel: "Pretoria Field Liaison Station",
      strategicPriority: "HIGH",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_za_riots"
    }
  ],
  TECH_WAR: [
    {
      title: "ALERT: Semiconductor Export Sanctions Slapped on Beijing",
      summary: "Washington bans all raw silicon and photolithography asset transfers.",
      fullBrief: "The Department of Commerce has issued a total ban on semiconductor-related sales. US naval surveillance units have intercepted two cargo flights carrying advanced micro-processing assets.",
      whyItMatters: "Severe escalations of industrial-technological espionage. Prompts immediate cyber counterattacks.",
      countryIds: ["US", "CN", "TW"],
      regionIds: ["East Asia"],
      themeTags: ["SANCTIONS", "TRADE", "ECONOMIC"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "Federal Register Commerce Watch",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_semicon_sanctions"
    },
    {
      title: "SIGINT Raid: CN Threat Actor 'APT-41' Breaches Boeing",
      summary: "Secure digital registries verify massive industrial schematics extraction in progress.",
      fullBrief: "Intrusion indicators show APT-41 has successfully penetrated defensive commercial firewalls, carrying out exfiltration of drone software routines. Digital trace confirms Beijing staging servers.",
      whyItMatters: "Industrial espionage compromises drone military units, giving rivals tactical cyber exploits.",
      countryIds: ["CN", "US"],
      regionIds: ["Cyber Domain"],
      themeTags: ["CYBER", "COVERT_RISK"],
      urgency: "HIGH",
      confidence: "HIGH",
      sourceType: "SIGINT",
      sourceLabel: "Cybersecurity and Infrastructure Security Agency Wire",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_boeing_breach"
    }
  ],
  ARCTIC_CLAIM: [
    {
      title: "ALERT: Arctic Continental Shelf Claimed",
      summary: "Tactical bombers deployed near polar border coordinates. Sub-polar patrols intensified.",
      fullBrief: "In a sweeping polar decree, Russia (RU) has declared exclusive economic jurisdiction over the Lomonosov Ridge. Heavy icebreakers flanked by stealth bombers are establishing a persistent naval corridor.",
      whyItMatters: "Direct risk to NATO polar alliances. Elevates energy tensions over raw rare-earth and oil resources beneath the caps.",
      countryIds: ["RU", "US", "FR", "GB"],
      regionIds: ["Arctic Circle"],
      themeTags: ["MILITARY", "ENERGY", "ALLIANCES"],
      urgency: "CRITICAL",
      confidence: "TOTAL",
      sourceType: "CONFIRMED",
      sourceLabel: "Norwegian Polar Fleet Radar Group",
      strategicPriority: "CRITICAL",
      requiresAttention: true,
      briefingCategory: "TOP_STORY",
      storyId: "st_arctic_claim"
    },
    {
      title: "SIGINT Log: Russian Acoustic Undersea Buoys Deployed",
      summary: "Submarine sonar gathers telemetry showing new heavy acoustic arrays targeting Cap Polar.",
      fullBrief: "Nuclear fast-attack sub-patrols have intercepted underwater signals from newly deployed Russian benthic arrays. These are designed to map and target NATO SLBM units traversing the deep ice sheet.",
      whyItMatters: "Degrades nuclear second-strike capabilities, tilting local naval balance.",
      countryIds: ["RU", "US", "GB"],
      regionIds: ["Barents Sea"],
      themeTags: ["MILITARY", "INTELLIGENCE"],
      urgency: "HIGH",
      confidence: "HIGH",
      sourceType: "SIGINT",
      sourceLabel: "Royal Navy Sonobuoys Hydrophone Net",
      strategicPriority: "HIGH",
      requiresAttention: false,
      briefingCategory: "ACTIVE_WATCH",
      storyId: "st_arctic_buoys"
    }
  ]
};

/**
 * Generate a dynamic 'Why it Matters' analytical summary based on real-time country stats
 */
export function generateDynamicWhyItMatters(countryId: string, theme: ArachneTheme, worldState: WorldState): string {
  const c = worldState.countries[countryId];
  if (!c) return "Strategic implications currently under analytical assessment.";

  switch (theme) {
    case "MILITARY":
      if (c.arsenal && c.arsenal.readinessLevel < 40) {
        return `Threatens regional security because ${c.name}'s military readiness is dangerously low (${c.arsenal.readinessLevel.toFixed(0)}%).`;
      }
      return `${c.name} possesses high mobilization flexibility. Strategic posturing may trigger immediate defensive responses.`;
    case "ECONOMIC":
    case "SANCTIONS":
    case "TRADE":
      if (c.economic && c.economic.debtStressIndex > 60) {
        return `Spikes systemic risk: ${c.name} is experiencing structural economic debt stress (${c.economic.debtStressIndex.toFixed(0)}%). Inflation risk is high.`;
      }
      return `Potential disruptor to ${c.allianceBlock} trade lines and global commodity pricing stability.`;
    case "UNREST":
    case "LEADERSHIP":
      if (c.political && c.political.stabilityIndex < 50) {
        return `Political stability is compromised (${c.political.stabilityIndex.toFixed(0)}%). High probability of civil fractures or sovereign administration shifts.`;
      }
      return `Popular friction raises coup probability. Radical groups could exploit this popular unrest.`;
    case "CYBER":
      return `Offensive exploits are active. Trace risks trigger immediate diplomatic retaliations inside cyber domains.`;
    default:
      return `${c.name} regional balance of influence is shifting. NATO and BRICS structures are monitoring closely.`;
  }
}
