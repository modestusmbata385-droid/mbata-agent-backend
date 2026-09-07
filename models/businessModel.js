const { pool } = require('../config/db');

async function addProduct(profileId, { name, sku, buyingPrice, sellingPrice, stockQuantity, minimumStockLevel }) {
  const { rows } = await pool.query(
    `INSERT INTO business_products (profile_id, name, sku, buying_price, selling_price, stock_quantity, minimum_stock_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [profileId, name, sku, buyingPrice, sellingPrice, stockQuantity || 0, minimumStockLevel || 0]
  );
  return rows[0];
}

async function listProducts(profileId) {
  const { rows } = await pool.query('SELECT * FROM business_products WHERE profile_id = $1 ORDER BY name', [profileId]);
  return rows;
}

async function getProduct(profileId, productId) {
  const { rows } = await pool.query(
    'SELECT * FROM business_products WHERE id = $1 AND profile_id = $2',
    [productId, profileId]
  );
  return rows[0] || null;
}

async function decrementStock(productId, quantity) {
  await pool.query(
    'UPDATE business_products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
    [quantity, productId]
  );
}

async function lowStockProducts(profileId) {
  const { rows } = await pool.query(
    'SELECT * FROM business_products WHERE profile_id = $1 AND stock_quantity <= minimum_stock_level',
    [profileId]
  );
  return rows;
}

async function createSale(profileId, { customerId, paymentMethod, reference, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    for (const item of items) {
      total += item.unitPrice * item.quantity - (item.discount || 0);
    }

    const saleResult = await client.query(
      `INSERT INTO sales (profile_id, customer_id, payment_method, reference, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [profileId, customerId || null, paymentMethod, reference, total]
    );
    const sale = saleResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, item.productId, item.quantity, item.unitPrice, item.discount || 0]
      );
      await client.query(
        'UPDATE business_products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND profile_id = $3',
        [item.quantity, item.productId, profileId]
      );
    }

    await client.query('COMMIT');
    return sale;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listSales(profileId, limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM sales WHERE profile_id = $1 ORDER BY created_at DESC LIMIT $2',
    [profileId, limit]
  );
  return rows;
}

async function addExpense(profileId, { category, amount, note, occurredAt }) {
  const { rows } = await pool.query(
    `INSERT INTO business_expenses (profile_id, category, amount, note, occurred_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, now())) RETURNING *`,
    [profileId, category, amount, note, occurredAt]
  );
  return rows[0];
}

// Section 11: Profit = Revenue - Cost of Goods - Business Expenses.
async function getProfitSummary(profileId) {
  const revenueQuery = await pool.query(
    'SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM sales WHERE profile_id = $1',
    [profileId]
  );
  const cogsQuery = await pool.query(
    `SELECT COALESCE(SUM(si.quantity * bp.buying_price), 0) AS cogs
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN business_products bp ON bp.id = si.product_id
     WHERE s.profile_id = $1`,
    [profileId]
  );
  const expensesQuery = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS expenses FROM business_expenses WHERE profile_id = $1',
    [profileId]
  );

  const revenue = Number(revenueQuery.rows[0].revenue);
  const cogs = Number(cogsQuery.rows[0].cogs);
  const expenses = Number(expensesQuery.rows[0].expenses);

  return { revenue, costOfGoods: cogs, businessExpenses: expenses, netProfit: revenue - cogs - expenses };
}

async function addCustomer(profileId, { name, phoneNumber }) {
  const { rows } = await pool.query(
    'INSERT INTO business_customers (profile_id, name, phone_number) VALUES ($1, $2, $3) RETURNING *',
    [profileId, name, phoneNumber]
  );
  return rows[0];
}

async function listCustomers(profileId) {
  const { rows } = await pool.query('SELECT * FROM business_customers WHERE profile_id = $1 ORDER BY name', [profileId]);
  return rows;
}

module.exports = {
  addProduct, listProducts, getProduct, decrementStock, lowStockProducts,
  createSale, listSales, addExpense, getProfitSummary, addCustomer, listCustomers,
};

