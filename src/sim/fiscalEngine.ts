import { WorldState } from '../types';

export function processFiscal(draft: WorldState) {
  Object.keys(draft.countries).forEach((id) => {
    const c = draft.countries[id];
    const econ = c.economic;
    const pol = c.political;

    // 1. Revenue calculations (annualized to per-tick, e.g. divide by 52)
    const taxRevenue = econ.gdpB * (econ.taxRate / 100) * (1 / 52);
    const corporateRevenue = econ.gdpB * 0.08 * (econ.corporateTaxRate / 100) * (1 / 52);
    const totalRevenue = taxRevenue + corporateRevenue;

    // 2. Spending deductions
    const militarySpend = totalRevenue * econ.spendingAllocation.military;
    const propagandaSpend = totalRevenue * econ.spendingAllocation.propaganda;
    const intelligenceSpend = totalRevenue * econ.spendingAllocation.intelligence;

    // Bonds service costs
    const debtServiceCost = econ.bonds.reduce((acc, b) => {
      return acc + (b.amount * (b.interestRate / 100) * (1 / 52));
    }, 0);

    // Weapons maintenance
    const weaponMaintenance = c.arsenal.totalMaintenanceCost;

    const totalSpend = militarySpend + debtServiceCost + propagandaSpend + intelligenceSpend + weaponMaintenance;
    const netCashDelta = totalRevenue - totalSpend;

    econ.treasuryCashB += netCashDelta;

    // 3. Debt stress calculation
    econ.debtStressIndex = Math.max(0, Math.min(100, (econ.debtToGdpRatio - 60) * 1.2));

    if (econ.debtStressIndex > 80) {
      econ.inflationRate += 0.5;
      econ.currencyStrength = Math.max(0, econ.currencyStrength - 1);
    }

    if (econ.debtStressIndex > 95) {
      pol.popularUnrest = Math.min(100, pol.popularUnrest + 4);
      pol.stabilityIndex = Math.max(0, pol.stabilityIndex - 3);
      c.lastEventLog.unshift(`Financial stress: High debt service triggers rapid rating downgrades.`);
    }

    // 4. Printing press effect
    if (econ.printingPressActive) {
      const pIntensity = econ.printingPressIntensity || 1;
      econ.treasuryCashB += 5.0 * pIntensity;
      econ.inflationRate += 1.5 * pIntensity;
      pol.popularUnrest = Math.min(100, pol.popularUnrest + 1.5 * pIntensity);
      econ.currencyStrength = Math.max(0, econ.currencyStrength - 2 * pIntensity);
      c.lastEventLog.unshift(`Central Bank: Unchecked cash printing fuels inflation spiral.`);
    }

    // 5. Upgrade research bonus calculations
    let researchBonus = 0;
    if (c.researchUnlocked.includes('HAARP_V1')) researchBonus += 0.2;
    if (c.researchUnlocked.includes('QUANTUM_COMMS')) researchBonus += 0.5;

    // 6. GDP growth calculations
    const effectiveGrowth = econ.gdpGrowthRate
      - (econ.inflationRate * 0.2)
      - (pol.popularUnrest * 0.05)
      - (econ.debtStressIndex * 0.03)
      + (pol.stabilityIndex * 0.04)
      + researchBonus;

    econ.gdpB *= (1 + effectiveGrowth / 100 / 52);

    // Natural bond maturity tickdowns
    econ.bonds.forEach((b) => {
      if (b.remainingTicks > 0) {
        b.remainingTicks--;
      }
    });

    // Pay off matured bonds
    const matured = econ.bonds.filter(b => b.remainingTicks <= 0);
    matured.forEach(b => {
      if (econ.treasuryCashB >= b.amount) {
        econ.treasuryCashB -= b.amount;
        econ.debtToGdpRatio = Math.max(0, econ.debtToGdpRatio - (b.amount / econ.gdpB) * 100);
      } else {
        // Force default or refinance
        econ.debtToGdpRatio += 5;
        pol.stabilityIndex = Math.max(0, pol.stabilityIndex - 10);
      }
    });
    econ.bonds = econ.bonds.filter(b => b.remainingTicks > 0);

    // Cap boundaries to be clean
    if (econ.gdpB < 1) econ.gdpB = 1;
    econ.inflationRate = Math.max(-5, econ.inflationRate / 1.05); // lean toward recovery
    pol.popularUnrest = Math.max(0, pol.popularUnrest);
    pol.stabilityIndex = Math.max(0, Math.min(100, pol.stabilityIndex));
  });
}
