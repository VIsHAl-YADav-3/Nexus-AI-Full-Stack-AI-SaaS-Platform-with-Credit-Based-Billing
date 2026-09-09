/**
 * Centralized plan configuration.
 *
 * The backend is the single source of truth for pricing. The frontend only
 * ever sends a `plan` identifier (e.g. "basic", "pro") — never an amount or
 * credit count — so a tampered client request can never change what a user
 * is charged or how many credits they receive.
 */
const PLANS = {
  basic: {
    name: 'Basic Plan',
    amount: 199, // INR (rupees)
    credits: 100,
  },
  pro: {
    name: 'Pro Plan',
    amount: 999, // INR (rupees)
    credits: 1000,
  },
};

/**
 * Looks up a plan by its identifier. Returns null if the plan does not exist.
 */
const getPlan = (planId) => {
  if (!planId || typeof planId !== 'string') return null;
  return PLANS[planId.toLowerCase()] || null;
};

module.exports = { PLANS, getPlan };
