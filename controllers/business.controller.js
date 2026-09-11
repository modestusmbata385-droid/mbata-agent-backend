const businessService = require('../services/businessService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  addProduct: wrap((req) => businessService.addProduct(req.user.id, req.body)),
  listProducts: wrap((req) => businessService.listProducts(req.user.id)),
  inventoryStatus: wrap((req) => businessService.getInventoryStatus(req.user.id)),
  recordSale: wrap((req) => businessService.recordSale(req.user.id, req.body)),
  listSales: wrap((req) => businessService.listSales(req.user.id)),
  addExpense: wrap((req) => businessService.addExpense(req.user.id, req.body)),
  profit: wrap((req) => businessService.getProfit(req.user.id)),
  addCustomer: wrap((req) => businessService.addCustomer(req.user.id, req.body)),
  listCustomers: wrap((req) => businessService.listCustomers(req.user.id)),
};
