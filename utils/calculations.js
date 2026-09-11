// Pure calculation functions (Section 35: server-side calculations).
// Models fetch raw sums from SQL, then hand them here — keeps the formulas
// testable without a database connection.

function computeBalance(confirmedIncome, confirmedExpenses) {
  return Number(confirmedIncome) - Number(confirmedExpenses);
}

function computeProfit(revenue, costOfGoods, businessExpenses) {
  return Number(revenue) - Number(costOfGoods) - Number(businessExpenses);
}

function computeRemaining(requiredAmount, confirmedPayments) {
  return Number(requiredAmount) - Number(confirmedPayments);
}

function computeBudgetRemaining(limitAmount, spent) {
  return Number(limitAmount) - Number(spent);
}

function computeAttendanceRate(presentDays, totalDays) {
  const total = Number(totalDays);
  if (!total) return null;
  return Number(presentDays) / total;
}

function computeOverallAcademicAverage(results) {
  if (!results.length) return null;
  const sum = results.reduce((acc, r) => acc + Number(r.score) / Number(r.maxScore), 0);
  return sum / results.length;
}

module.exports = {
  computeBalance,
  computeProfit,
  computeRemaining,
  computeBudgetRemaining,
  computeAttendanceRate,
  computeOverallAcademicAverage,
};
