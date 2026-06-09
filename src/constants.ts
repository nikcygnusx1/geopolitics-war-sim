import { WeaponType, ResearchNode, CommodityType } from './types';

export const TICK_SPEEDS = {
  PAUSED: 0,
  NORMAL: 2000,
  FAST: 800,
  ULTRA: 300,
};

export interface WeaponMetadata {
  name: string;
  combatPower: number;
  maintenanceCost: number; // in billions
  speed: number; // progress% increment per tick
  isNuclear: boolean;
}

export const WEAPON_METADATA: Record<WeaponType, WeaponMetadata> = {
  ICBM: { name: 'ICBM', combatPower: 95, maintenanceCost: 2.0, speed: 4, isNuclear: true },
  SLBM: { name: 'SLBM', combatPower: 90, maintenanceCost: 2.5, speed: 5, isNuclear: true },
  CRUISE_MISSILE: { name: 'Cruise Missile', combatPower: 45, maintenanceCost: 0.5, speed: 6, isNuclear: false },
  HYPERSONIC: { name: 'Hypersonic Glide', combatPower: 80, maintenanceCost: 1.5, speed: 8, isNuclear: true },
  FIGHTER_JET: { name: 'Fighter Squadron', combatPower: 35, maintenanceCost: 0.8, speed: 10, isNuclear: false },
  STEALTH_BOMBER: { name: 'Stealth Bomber wing', combatPower: 75, maintenanceCost: 1.8, speed: 6, isNuclear: true },
  CARRIER_GROUP: { name: 'Carrier Strike Group', combatPower: 85, maintenanceCost: 3.5, speed: 2, isNuclear: false },
  SUBMARINE: { name: 'Attack Submarine', combatPower: 60, maintenanceCost: 1.2, speed: 5, isNuclear: false },
  TANK_DIVISION: { name: 'Armor Division', combatPower: 30, maintenanceCost: 0.3, speed: 3, isNuclear: false },
  ARTILLERY: { name: 'Artillery Brigade', combatPower: 20, maintenanceCost: 0.1, speed: 4, isNuclear: false },
  DRONE_SWARM: { name: 'Drone Recon Swarm', combatPower: 25, maintenanceCost: 0.2, speed: 7, isNuclear: false },
  CYBER_WEAPON: { name: 'Stuxnet Intrusion Grid', combatPower: 15, maintenanceCost: 0.4, speed: 15, isNuclear: false },
  EMP_DEVICE: { name: 'Atmospheric EMP', combatPower: 40, maintenanceCost: 0.6, speed: 12, isNuclear: false },
  DIRTY_BOMB: { name: 'Radiological Dirty Bomb', combatPower: 50, maintenanceCost: 0.5, speed: 8, isNuclear: false },
};

export interface ResearchMetadata {
  id: ResearchNode;
  name: string;
  costB: number;
  ticks: number;
  desc: string;
  deps: ResearchNode[];
}

export const RESEARCH_TREES: ResearchMetadata[] = [
  { id: 'HAARP_V1', name: 'Ambient Weather Disruption I', costB: 8, ticks: 10, desc: '+15% HAARP weather disruption efficiency, unlocks basic global weather targeting', deps: [] },
  { id: 'HAARP_V2', name: 'Agricultural Shockwave II', costB: 18, ticks: 15, desc: '+30% effectiveness. Enables targeting of enemy crop fields and water tables', deps: ['HAARP_V1'] },
  { id: 'HAARP_V3', name: 'Cataclysm Engine III', costB: 35, ticks: 25, desc: '+50% effectiveness. Floods and severe droughts. Enemy unrest +5 per tick when targeted', deps: ['HAARP_V2'] },
  
  { id: 'IRON_DOME_V1', name: 'Tactical ABM Guard I', costB: 6, ticks: 8, desc: 'ABM shield deflection rate +8%', deps: [] },
  { id: 'IRON_DOME_V2', name: 'Aviation Thermal Shielding II', costB: 15, ticks: 12, desc: 'ABM shield +15%, also boosts intercept rates against high speed glide and Hypersonics +25%', deps: ['IRON_DOME_V1'] },
  { id: 'IRON_DOME_V3', name: 'Sovereign Aegis Grid III', costB: 30, ticks: 20, desc: 'ABM shield +25%, intercepts MIRV warheads', deps: ['IRON_DOME_V2'] },
  
  { id: 'CYBER_FIREWALL_V1', name: 'Sovereign Root Shield I', costB: 5, ticks: 6, desc: 'Enemy digital covert action and grid failure rate decreased by -25%', deps: [] },
  { id: 'CYBER_FIREWALL_V2', name: 'AI Attribution Heuristics II', costB: 12, ticks: 10, desc: 'Enemy hacking success decreased -50%, enables tracing attacker identity on failure', deps: ['CYBER_FIREWALL_V1'] },
  { id: 'CYBER_FIREWALL_V3', name: 'Stuxnet Mirror Network III', costB: 24, ticks: 15, desc: 'Hacking success -75%, has a 30% chance of mirroring the payload back to the attacker', deps: ['CYBER_FIREWALL_V2'] },
  
  { id: 'SATELLITE_RECON', name: 'LEO Reconnaissance Grid', costB: 10, ticks: 12, desc: 'Sovereign military orbital assets scan and flag passive covert ops against the country', deps: [] },
  { id: 'QUANTUM_COMMS', name: 'Inter-Alliance Quantum Cryptography', costB: 16, ticks: 15, desc: 'Diplomatic communications are strictly secure, bypasses signal intelligence intercept scoring entirely', deps: ['SATELLITE_RECON'] },
  
  { id: 'HYPERSONIC_TECH', name: 'Mach-9 Cruise Engineering', costB: 22, ticks: 18, desc: 'Unlocks the lethal HYPERSONIC glide weapon class, evades most standard legacy ABMs', deps: [] },
  { id: 'DEEP_STRIKE', name: 'Intercontinental Targeting Arrays', costB: 28, ticks: 20, desc: 'Strike target range modifier +50%, enabling deep global targeting', deps: ['HYPERSONIC_TECH'] },
  
  { id: 'BIO_WEAPON_DETECT', name: 'Pathogen Path Sensor Webs', costB: 14, ticks: 14, desc: 'Early thermal analysis signals biological threats and boosts general intelligence scores', deps: [] },
  { id: 'EMP_SHIELD', name: 'Hardened Power Matrices', costB: 20, ticks: 16, desc: 'Protects critical infrastructure, dampens EMP blackout outcomes completely', deps: [] },
];

export const COMMODITY_BASELINES: Record<CommodityType, { base: number; volatility: number; name: string }> = {
  OIL: { base: 75.0, volatility: 25, name: 'Crude Brent Oil Oil (per bl)' },
  NATURAL_GAS: { base: 3.5, volatility: 35, name: 'Natural Gas (per MMBtu)' },
  WHEAT: { base: 6.2, volatility: 15, name: 'Wheat Staple Grains (per bushel)' },
  RARE_EARTH: { base: 145.0, volatility: 45, name: 'Rare Earth Heavy Metals (per kg)' },
  SILICON: { base: 28.0, volatility: 30, name: 'High-Density Silicon Wafers' },
  WEAPONS_GRADE_URANIUM: { base: 320.0, volatility: 50, name: 'Enriched Weapons-Grade Uranium' },
  ARMS: { base: 1.2, volatility: 10, name: 'Standard Ordnance & Heavy Arms' },
};
