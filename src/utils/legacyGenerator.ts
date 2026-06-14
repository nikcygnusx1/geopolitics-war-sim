import { WorldState, PlayerState } from '../types';

export function generateLegacyNarrative(worldState: WorldState, playerState: PlayerState): string {
  const nationId = playerState.countryId;
  const country = worldState.countries[nationId];
  const nationName = country?.name || 'Your Nation';
  const ticks = worldState.currentTick;
  
  // 1. Calculate active/past wars
  const warsCount = country?.atWarWith?.length || 0;
  
  // 2. Count allies (Opinion > 50 with player)
  const alliesCount = Object.keys(worldState.countries).filter(
    (id) => id !== nationId && (worldState.countries[id]?.opinions[nationId] ?? 0) > 50
  ).length;

  // 3. Count player-launched strikes vs incoming strikes
  const playerStrikes = worldState.activeStrikes.filter((s) => s.sourceCountryId === nationId);
  const playerStrikesCount = playerStrikes.length;

  const incomingStrikes = worldState.activeStrikes.filter((s) => s.targetCountryId === nationId);
  const incomingStrikesCount = incomingStrikes.length;

  // 4. Calculate total civilian casualties from incoming strikes on player
  const playerCasualties = incomingStrikes
    .filter((s) => s.status === 'IMPACT')
    .reduce((acc, s) => acc + (s.damageDealt?.casualtiesEstimate || 0), 0);

  // 5. Total nuclear detonations on player or globally
  const globalNukes = worldState.activeStrikes.filter(
    (s) => s.status === 'IMPACT' && (s.weaponType === 'ICBM' || s.weaponType === 'SLBM' || (s.warheadYieldMT !== undefined && s.warheadYieldMT > 0))
  ).length;

  const isNukeOccurred = worldState.nuclearExchangeOccurred || globalNukes > 0;
  const isVictory = playerState.aftermathType === 'VICTORY' || playerState.victoryAchieved;

  // Formatting utility
  const formatNum = (n: number) => n.toLocaleString();

  // Variant 1: Severe Global Nuclear Exchange
  if (isNukeOccurred && globalNukes >= 2) {
    return `Your command of ${nationName} concluded in a silent nuclear winter. When the simulation collapsed under a global exchange, ${globalNukes} nuclear detonations had vaporized key administrative quadrants, claiming over ${formatNum(playerCasualties || 450000)} estimated civilian lives. Your doctrine of mutual ruin leaves behind only radioactive ash and a grim warning to future command modules.`;
  }

  // Variant 2: United States Victory, Diplomatic
  if (isVictory && nationId === 'US' && alliesCount >= 3) {
    return `Under your command, the United States maintained the delicate balance of the global order. Over ${ticks} weeks of severe geopolitical friction, you forged ${alliesCount} major strategic alliances while completely avoiding kinetic escalation. History will record your administration as a triumph of democratic containment and unmatched diplomatic stewardship.`;
  }

  // Variant 3: United States Victory, Kinetic/Hardline
  if (isVictory && nationId === 'US' && playerStrikesCount >= 2) {
    return `The United States secured absolute global hegemony through overwhelming kinetic dominance. In ${ticks} weeks, you authorized ${playerStrikesCount} ballistic missile strikes, neutralizing adversarial networks before they could mobilize. Your doctrine of unchecked technological deterrence has ushered in a Pax Americana under a permanent military shadow.`;
  }

  // Variant 4: China Victory, Economic Hegemony
  if (isVictory && nationId === 'CN' && (country?.economic?.treasuryCashB ?? 0) > 1500) {
    return `China accomplished its historical rise, navigating ${ticks} weeks of Western containment to establish a new multipolar hegemony. By preserving of the state treasury at ${formatNum(Math.round(country.economic.treasuryCashB))}B, your administration decoupled from the old order without triggering war. Beijing now stands as the undisputed center of global trade.`;
  }

  // Variant 5: China Victory, Tactical/Defense
  if (isVictory && nationId === 'CN' && playerStrikesCount >= 1) {
    return `The Middle Kingdom was unified and secured under an unbreakable tactical shield. Your decision to authorize ${playerStrikesCount} tactical strikes smashed external containment circles and asserted absolute sovereign authority. Under your hardline command, China has rewritten the world balance in bold lines of aerospace dominance.`;
  }

  // Variant 6: Russia Victory, Alliance/Sovereign Perseverance
  if (isVictory && nationId === 'RU') {
    return `Russia emerged from decades of hostile containment to assert a decisive Eurasian coalition. Through ${ticks} weeks of economic friction, you held the federation intact, forging ${alliesCount} critical defense treaties and repelling incoming cyber campaigns. Moscow has successfully secured its defensive security sphere against all odds.`;
  }

  // Variant 7: Non-aligned nation victory (regional breakout)
  if (isVictory && (nationId === 'IN' || nationId === 'KP' || nationId === 'IL' || nationId === 'IR' || nationId === 'PK')) {
    return `As ${nationName}, you achieved a historic sovereign breakthrough, defying the expectations of the global superpowers. Through ${ticks} weeks of intense regional friction, your administration built ${alliesCount} critical mutual defense agreements, leaving behind a legacy of absolute self-reliance that permanently altered the balance of world power.`;
  }

  // Variant 8: US Defeat, Unrest/Civilian Breakdown
  if (!isVictory && nationId === 'US' && (country?.political?.popularUnrest ?? 0) > 85) {
    return `The American experiment fractured under your command. Exhausted by ${ticks} weeks of fiscal instability and popular polarization, unrest reached critical thresholds, triggering a massive constitutional collapse. Your legacy is one of administrative fragmentation, where federal authority was swallowed by domestic rebellion.`;
  }

  // Variant 9: China Defeat, Debt/Economic Collapse
  if (!isVictory && nationId === 'CN' && (country?.economic?.debtStressIndex ?? 0) > 80) {
    return `The economic engine of China ground to a catastrophic halt under your oversight. Trapped under ${ticks} weeks of Western trade embargoes and a bond debt stress index of ${Math.round(country.economic.debtStressIndex)}%, the state treasury defaulted. Your legacy is a warning of financial over-leverage, which fractured the state from within.`;
  }

  // Variant 10: Russia Defeat, Defense/Sovereign Encirclement
  if (!isVictory && nationId === 'RU' && incomingStrikesCount >= 2) {
    return `Federal commands in Moscow went dark after ${ticks} weeks of containment. Surrounded by expanding defense blocks and heavily pounded by ${incomingStrikesCount} ballistic intercepts, the federation's borders fractured under pressure. Your legacy ends with the administrative segmentation of the Russian state under international observation.`;
  }

  // Variant 11: Defeat via Kinetic Missile Overrun
  if (!isVictory && incomingStrikesCount >= 2 && playerCasualties > 0) {
    return `Your administration of ${nationName} collapsed under a devastating ballistic bombardment. Pounded by ${incomingStrikesCount} missile strikes, your civilian shields were overwhelmed, claiming ${formatNum(playerCasualties)} casualties. The sovereign institutions of your homeland were dismantled, ending your command in total devastation.`;
  }

  // Variant 12: Defeat via Bankruptcy/Quantitative Ruin
  if (!isVictory && (country?.economic?.treasuryCashB ?? 0) < 10 && (country?.economic?.inflationRate ?? 0) > 25) {
    return `Your administration of ${nationName} suffered sudden fiscal insolvency after ${ticks} weeks. Overwhelmed by massive treasury deficits and ${Math.round(country.economic.inflationRate)}% runaway inflation, your structural authority disintegrated. Your rule will be remembered for hyperinflation and currency ruin.`;
  }

  // Variant 13: Generic Victory, Balanced Statehood
  if (isVictory) {
    return `You led ${nationName} through ${ticks} weeks of intense geopolitical storms to a hard-won victory. Navigating through ${warsCount} active wars and balancing ${alliesCount} global allies, you successfully secured your nation's sovereign survival and economic integrity. Your doctrine is the gold standard for future command responses.`;
  }

  // Variant 14: Defeat via Internal Coup/Purge failure
  if (!isVictory && (country?.political?.coupRiskLevel ?? 0) > 75) {
    return `Your rule over ${nationName} collapsed in a swift administrative Coup d'État. Having failed to subdue rising extreme political factions, your popular approval rating fell to ${Math.round(country.political.leaderApprovalRating ?? 0)}%. Dissident commanders seized federal radio networks, ending your command in ignominy.`;
  }

  // Variant 15: General Sovereign Collapse (Default Fallback)
  return `The sovereign commands of ${nationName} went dark after ${ticks} ticks of intense global simulation. Despite securing ${alliesCount} alliances, your rule was overwhelmed by cascading crises. Your administration leaves behind a record of high-stakes persistence, ending a brief but serious chapter in modern geopolitical conflict.`;
}
