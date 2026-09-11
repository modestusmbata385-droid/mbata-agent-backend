const {
  computeBalance, computeProfit, computeRemaining,
  computeBudgetRemaining, computeAttendanceRate, computeOverallAcademicAverage,
} = require('../utils/calculations');

describe('computeBalance (Section 10)', () => {
  test('income minus expenses', () => {
    expect(computeBalance(15000, 4000)).toBe(11000);
  });
  test('handles string numerics from pg', () => {
    expect(computeBalance('15000.00', '4000.00')).toBe(11000);
  });
  test('negative balance when expenses exceed income', () => {
    expect(computeBalance(1000, 5000)).toBe(-4000);
  });
});

describe('computeProfit (Section 11)', () => {
  test('revenue - COGS - expenses', () => {
    expect(computeProfit(100000, 40000, 20000)).toBe(40000);
  });
  test('loss is negative', () => {
    expect(computeProfit(10000, 8000, 5000)).toBe(-3000);
  });
});

describe('computeRemaining (Section 16)', () => {
  test('required minus confirmed only (pending excluded upstream)', () => {
    expect(computeRemaining(15000, 10000)).toBe(5000);
  });
  test('zero when fully paid', () => {
    expect(computeRemaining(15000, 15000)).toBe(0);
  });
  test('negative when overpaid', () => {
    expect(computeRemaining(15000, 20000)).toBe(-5000);
  });
});

describe('computeBudgetRemaining', () => {
  test('limit minus spent', () => {
    expect(computeBudgetRemaining(50000, 30000)).toBe(20000);
  });
});

describe('computeAttendanceRate', () => {
  test('present/total', () => {
    expect(computeAttendanceRate(18, 20)).toBe(0.9);
  });
  test('null when no days recorded', () => {
    expect(computeAttendanceRate(0, 0)).toBeNull();
  });
});

describe('computeOverallAcademicAverage', () => {
  test('averages score/maxScore ratios', () => {
    const results = [{ score: 80, maxScore: 100 }, { score: 45, maxScore: 50 }];
    expect(computeOverallAcademicAverage(results)).toBeCloseTo(0.85, 5);
  });
  test('empty array short-circuits at the caller, not here', () => {
    expect(() => computeOverallAcademicAverage([])).not.toThrow();
    expect(Number.isNaN(computeOverallAcademicAverage([]))).toBe(true);
  });
});
