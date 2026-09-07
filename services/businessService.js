const businessModel = require('../models/businessModel');
const profileService = require('../services/profileService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function addProduct(userId, body) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.addProduct(profile.id, body);
}

async function listProducts(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.listProducts(profile.id);
}

async function recordSale(userId, { customerId, paymentMethod, reference, items }) {
  if (!items || !items.length) throw httpError(400, 'A sale needs at least one item.');
  const profile = await profileService.requireOwnedProfile(userId, 'business');

  for (const item of items) {
    const product = await businessModel.getProduct(profile.id, item.productId);
    if (!product) throw httpError(404, `Product ${item.productId} not found.`);
    if (product.stock_quantity < item.quantity) {
      throw httpError(400, `Not enough stock for ${product.name} (have ${product.stock_quantity}, need ${item.quantity}).`);
    }
  }

  return businessModel.createSale(profile.id, { customerId, paymentMethod, reference, items });
}

async function listSales(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.listSales(profile.id);
}

async function addExpense(userId, body) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.addExpense(profile.id, body);
}

async function getProfit(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.getProfitSummary(profile.id);
}

async function getInventoryStatus(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  const [products, lowStock] = await Promise.all([
    businessModel.listProducts(profile.id),
    businessModel.lowStockProducts(profile.id),
  ]);
  return { products, lowStock };
}

async function addCustomer(userId, body) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.addCustomer(profile.id, body);
}

async function listCustomers(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'business');
  return businessModel.listCustomers(profile.id);
}

module.exports = {
  addProduct, listProducts, recordSale, listSales, addExpense,
  getProfit, getInventoryStatus, addCustomer, listCustomers,
};

