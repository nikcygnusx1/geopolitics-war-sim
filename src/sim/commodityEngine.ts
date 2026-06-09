import { WorldState } from '../types';

export function processMarkets(draft: WorldState) {
  // 1. Check active Middle East (MENA) conflicts for OIL index shocks
  const menaAtWar = ['IL', 'PS', 'IR', 'SA', 'EG'].filter((id) => {
    const c = draft.countries[id];
    return c && c.atWarWith.length > 0;
  });

  const oilMarket = draft.commodityMarkets.find((m) => m.type === 'OIL');
  if (oilMarket) {
    if (menaAtWar.length >= 2) {
      oilMarket.spotPriceUSD *= 1.04; // Rapid appreciation
      oilMarket.supplyShockActive = true;
      // Propose inflation globally due to fuel index spikes
      Object.keys(draft.countries).forEach((id) => {
        draft.countries[id].economic.inflationRate += 0.8;
      });
    } else {
      oilMarket.supplyShockActive = false;
    }
  }

  // 2. Check if China (CN) is embargoed or heavily sanctioned for RARE_EARTH index shocks
  const cnMarket = draft.countries['CN'];
  const rareEarthMarket = draft.commodityMarkets.find((m) => m.type === 'RARE_EARTH');
  if (cnMarket && rareEarthMarket) {
    if (cnMarket.economic.sanctionedBy.length > 0) {
      rareEarthMarket.spotPriceUSD *= 1.05;
      rareEarthMarket.supplyShockActive = true;
    } else {
      rareEarthMarket.supplyShockActive = false;
    }
  }

  // 3. Process normal drift and record price history on all markets
  draft.commodityMarkets.forEach((market) => {
    const variance = (Math.random() - 0.5) * 2 * (market.volatilityIndex * 0.01);
    market.spotPriceUSD *= (1 + variance);

    // Guard bounds to keep them realistic
    if (market.spotPriceUSD < market.baselinePrice * 0.1) {
      market.spotPriceUSD = market.baselinePrice * 0.1;
    }
    if (market.spotPriceUSD > market.baselinePrice * 20.0) {
      market.spotPriceUSD = market.baselinePrice * 20.0;
    }

    market.priceHistory.push(Math.round(market.spotPriceUSD * 100) / 100);
    if (market.priceHistory.length > 25) {
      market.priceHistory.shift();
    }
  });
}
