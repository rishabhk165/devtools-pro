/**
 * Plan Hierarchy utility module.
 * Defines the plan ranking and provides upgrade option filtering.
 */

const PLAN_HIERARCHY = [
  { name: 'Pro', price: 946, priceUSD: 10 },
  { name: 'Pro+', price: 1892, priceUSD: 20 },
  { name: 'Pro Max', price: 4730, priceUSD: 50 },
  { name: 'Power', price: 9461, priceUSD: 100 }
];

/**
 * Returns the list of plans ranked above the given plan.
 * If the plan is the highest ("Power") or not found, returns an empty array.
 *
 * @param {string} planName - The current plan name (e.g. "Pro", "Pro+", "Pro Max", "Power")
 * @returns {Array<{name: string, price: number, priceUSD: number}>} Plans above the current plan
 */
function getUpgradeOptions(planName) {
  const currentIndex = PLAN_HIERARCHY.findIndex(
    (plan) => plan.name === planName
  );

  if (currentIndex === -1) {
    return [];
  }

  return PLAN_HIERARCHY.slice(currentIndex + 1);
}

module.exports = { PLAN_HIERARCHY, getUpgradeOptions };
