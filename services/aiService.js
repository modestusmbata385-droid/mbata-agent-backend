// Section 21-23: module-scoped advisors sharing one permission-filtered
// context pipeline. AI never sees the whole database — only what
// buildContext() explicitly assembles for this user's own profile.
const profileService = require('../services/profileService');
const financeService = require('../services/financeService');
const businessService = require('../services/businessService');
const { callProvider } = require('../ai/provider');

const SYSTEM_PROMPTS = {
  finance: 'You are a financial advisor inside Mbata Agent. Give short, practical, recommendation-first advice based only on the JSON context provided. Never invent numbers not present in the context.',
  business: 'You are a business advisor inside Mbata Agent. Give short, practical, recommendation-first advice based only on the JSON context provided. Never invent numbers not present in the context.',
  general: 'You are a general advisor inside Mbata Agent, a personal/business management platform. Be concise and practical.',
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Section 22: Identify Active Module -> Retrieve Allowed Data -> Sanitize.
async function buildContext(userId, module) {
  switch (module) {
    case 'finance': {
      const dashboard = await financeService.getDashboard(userId); // throws if no finance profile — that IS the permission check
      return {
        balance: dashboard.balance,
        confirmedIncome: dashboard.confirmedIncome,
        confirmedExpenses: dashboard.confirmedExpenses,
        goals: dashboard.goals.map((g) => ({ title: g.title, target: g.target_amount, saved: g.saved_amount })),
      };
    }
    case 'business': {
      const profit = await businessService.getProfit(userId);
      const inventory = await businessService.getInventoryStatus(userId);
      return {
        profit,
        lowStockCount: inventory.lowStock.length,
        productCount: inventory.products.length,
      };
    }
    case 'general': {
      const profiles = await profileService.listProfiles(userId);
      return { activeModules: profiles.map((p) => p.profile_type) };
    }
    default:
      throw httpError(400, `Unknown or unsupported AI module: ${module}`);
  }
}

// Section 23: AI is recommendation-first — the caller (frontend) still
// needs explicit user confirmation before turning this into a system action.
async function getAdvice(userId, module, question) {
  if (!SYSTEM_PROMPTS[module]) throw httpError(400, `No advisor configured for module "${module}".`);

  const context = await buildContext(userId, module);
  const userMessage = `Context: ${JSON.stringify(context)}\n\nQuestion: ${question || 'Give me a general check-in on this module.'}`;

  const recommendation = await callProvider(SYSTEM_PROMPTS[module], userMessage);

  return { module, context, recommendation, requiresConfirmation: true };
}

module.exports = { buildContext, getAdvice };

