import { WorldState, PlayerState } from '../types';
import { deriveDebriefAnalysis } from './debriefDataDeriver';

export function generateLegacyNarrative(worldState: WorldState, playerState: PlayerState): string {
  const nationId = playerState.countryId;
  const country = worldState.countries[nationId];
  const nationName = country?.name || 'Your Nation';
  const ticks = worldState.currentTick;
  
  // Derive robust analytical properties of this run
  const { playerAssessment, turningPoints, analytics } = deriveDebriefAnalysis(worldState, playerState);
  
  const alliesCount = analytics.diplomaticBalance.allies;
  const isNukeOccurred = worldState.nuclearExchangeOccurred;
  const isVictory = playerState.aftermathType === 'VICTORY' || playerState.victoryAchieved;

  const firstTurningPoint = turningPoints.length > 0 ? turningPoints[0] : null;
  const tpMention = firstTurningPoint 
    ? `The historical trajectory of this administration was permanently locked at Tick ${firstTurningPoint.tick} during the critical milestone of the ${firstTurningPoint.title}.`
    : '';

  const formatNum = (n: number) => n.toLocaleString();

  // Variant A: Nuclear Armageddon / Strategic Ruin
  if (isNukeOccurred) {
    const playerCasualties = worldState.activeStrikes
      .filter((s) => s.targetCountryId === nationId && s.status === 'IMPACT')
      .reduce((acc, s) => acc + (s.damageDealt?.casualtiesEstimate || 0), 0);

    const falloutMention = playerCasualties > 0 
      ? `Within your sovereign borders, metropolitan grids crumbled and over ${formatNum(playerCasualties)} estimated civilian casualties were instantly categorized as tactical collateral.`
      : '';

    return `Sovereignty over the sovereign lands of ${nationName} dissolved into a silent nuclear winter. When strategic command structures collapsed under unrestrained aerospace strikes, the simulation recorded the complete neutralization of all civil communication grids. By enacting a leadership doctrine of "${playerAssessment.title}," your response pattern to regional escalations bypassed bilateral compromises in favor of mutually assured tactical decay. ${fallbackTpMention(tpMention)} Geopoliticians will record your administration not as a political office, but as a severe warning to future autonomous strategic modules: a doctrine of radioactive ash and terminal deterrence.`;
  }

  // Variant B: Diplomatic Mastery (The Peaceful Sovereign Circle)
  if (isVictory && playerAssessment.classification === 'DIPLOMATIC_PACIFIER') {
    return `History will record your command of ${nationName} as a masterclass of collective structural defense. Navigating ${ticks} weeks of extreme regional containment actions, you successfully locked in ${alliesCount} critical defensive agreements without authorizing a single kinetic weapon payload from your arsenal silos. By embodying a "${playerAssessment.title}" doctrine, your command transformed your borders into an unassailable bastion of multilateral sovereignty. ${tpMention} Your legacy stands as an absolute validation of containment theory and democratic balance in the modern geopolitical arena.`;
  }

  // Variant C: Hardline Kinetic Dominance (Sovereign Hegemon)
  if (isVictory && strikesCount(worldState, nationId) >= 2) {
    return `Through an uncompromising application of preemptive strategic force, the administrative modules of ${nationName} secured absolute regional hegemony. Across ${ticks} weeks of escalating tensions, your central commands authorized decisive kinetic operations to decapitate adversarial networks before multi-state containment circles could fully align. Backed by your leadership doctrine of a "${playerAssessment.title}," the state maintained nominal popular stability through aggressive aerospace superiority. Geopolitical textbooks will register this era as a triumph of technological deterrence under a permanent, unyielding sovereign shadow.`;
  }

  // Variant D: Treasury Fortress / Economic Superpower
  if (isVictory && playerAssessment.classification === 'MERCANTILE_GUARDIAN') {
    const finalTreasuryB = Math.round(country?.economic?.treasuryCashB || 0);
    return `Your administration rewritten the guidelines of modern friction by proving that treasury reserves are the ultimate defense shield. Holding the national treasury intact at a massive $${formatNum(finalTreasuryB)}B, ${nationName} established unrivaled global trade leverage without deploying kinetic missile arrays. Your command strategy, defined by a "${playerAssessment.title}" posture, systematically starved adversarial economic engines via targeted tariffs and embargoes while funding secondary defensive proxy grids. You leave behind a hyper-liquid legacy of mercantile immunity that outlasted all physical threats.`;
  }

  // Variant E: Active Pragmatic Balance (Balanced Win)
  if (isVictory) {
    return `Navigating the high-altitude turbulence of the global simulation, your command of ${nationName} successfully resolved in a calculated sovereign victory. Over ${ticks} weeks of intense intercontinental stress, your cabinet successfully sustained balance across critical economic stress indices, while managing ${alliesCount} active alliances and neutralizing targeted foreign disinformation subversions. Your balanced doctrine, classified as "${playerAssessment.title}," represents a highly cohesive defensive strategy. ${tpMention} Future strategic modules will model your decisions as the absolute benchmark of modern survivalism.`;
  }

  // Variant F: Bankruptcy / Resource Insolvency Defeat
  const finalCash = country?.economic?.treasuryCashB || 0;
  const inflation = country?.economic?.inflationRate || 0;
  if (!isVictory && finalCash < 50 && inflation > 25) {
    return `The institutions of ${nationName} suffered sudden administrative rigor mortis due to total quantitative insolvency. Trapped in a spiral of runaway inflation peaking at a devastating ${Math.round(inflation)}% and complete treasury depletion, sovereign authority completely fractured from within. Enacting a strategic posture of "${playerAssessment.title}," your administration failed to decouple treasury allocations from costly military maintenance during extreme resource blockages. Your legacy is the fiscal fragmentation of your state, where sovereign authority was peacefully dissolved under international bankruptcy observation.`;
  }

  // Variant G: Civil Revolt / Domestic Coup Defeat
  const unrest = country?.political?.popularUnrest || 0;
  if (!isVictory && unrest > 80) {
    return `The sovereign framework of ${nationName} fractured under a catastrophic civil rebellion. Overwhelmed by ${ticks} weeks of fiscal emergency and unpacified ideological factions, popular unrest reached critical thresholds, triggering a decisive Coup d'État. Under your doctrine of a "${playerAssessment.title}," the central command was unable to subdue rising extreme domestic networks. Declassified dossiers reveal how opposition leaders successfully seized federal broadcast facilities, permanently terminating your executive authority in absolute ignominy.`;
  }

  // Variant H: Kinetic Overrun (Military Defeat)
  const incomingCount = worldState.activeStrikes.filter((s) => s.targetCountryId === nationId).length;
  if (!isVictory && incomingCount >= 2) {
    return `Your administration of ${nationName} was terminated by devastating ballistic saturation of your civilian hubs. Incapable of sustaining intercept parameters across ${ticks} weeks of multi-theater encirclement, your defense grids collapsed, resulting in cascading infrastructural decay and massive casualties. Your leadership approach, categorized under a "${playerAssessment.title}," failed to deploy adequate anti-ballistic shields or forge mutual defense pacts before adversarial launch silos initialized. In the final geopolitical reckoning, your sovereignty remains segmented and under heavy foreign surveillance.`;
  }

  // Default Sovereign Collapse Fallback
  return `The sovereign command modules of ${nationName} went dark after ${ticks} ticks of intense geopolitical friction. Enacting an administration categorized by a "${playerAssessment.title}" doctrine, your command attempted to preserve balance but was eventually overwhelmed by cascading intercontinental crises. ${tpMention} Despite managing to secure stable alliances, your rule concludes as a deeply serious, high-stakes chapter in modern geopolitical history.`;
}

function strikesCount(worldState: WorldState, sourceId: string): number {
  return worldState.activeStrikes.filter(s => s.sourceCountryId === sourceId).length;
}

function fallbackTpMention(tpMention: string): string {
  return tpMention ? ` ${tpMention}` : '';
}
