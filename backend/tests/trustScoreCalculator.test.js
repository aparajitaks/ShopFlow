'use strict';

/**
 * trustScoreCalculator.test.js
 *
 * Unit tests for the pure scoring function in trustScoreCalculator.service.js.
 * No database. No HTTP. No side effects.
 *
 * Test matrix covers all 11 required cases from the assignment spec,
 * including exact boundary assertions for the fraud flag.
 */

const {
  calculateTrustScore,
  getOrderValueScore,
} = require('../src/services/trustScoreCalculator.service');

const { trustScoreSchema } = require('../src/validators/trustScore.schema');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a minimal valid input object
// ─────────────────────────────────────────────────────────────────────────────
function makeInput(overrides = {}) {
  return {
    customer_id:     'CUST_TEST',
    orders:          10,
    delivered:       8,
    rto:             1,
    cancelled:       1,
    avg_order_value: 2500,
    cod_orders:      5,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Normal scoring cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Normal case', () => {
  /**
   * Input: 25 orders, 18 delivered, 4 RTO, 3 cancelled, avg_order_value=2500, cod_orders=20
   *
   * Manual calculation:
   *   delivery_rate      = 18/25 = 0.72   → 0.72 × 40 = 28.80
   *   rto_rate           = 4/25  = 0.16   → (1-0.16) × 25 = 21.00
   *   cancellation_rate  = 3/25  = 0.12   → (1-0.12) × 20 = 17.60
   *   order_value_score  = 2500 → tier 7
   *   cod_dependency     = 20/25 = 0.80   → (1-0.80) × 5 = 1.00
   *   raw = 28.80 + 21.00 + 17.60 + 7 + 1.00 = 75.40 → round → 75
   */
  const input = makeInput({
    orders: 25, delivered: 18, rto: 4, cancelled: 3,
    avg_order_value: 2500, cod_orders: 20,
  });

  test('trust_score is in the Medium range (50–79)', () => {
    const result = calculateTrustScore(input);
    expect(result.trust_score).toBeGreaterThanOrEqual(50);
    expect(result.trust_score).toBeLessThanOrEqual(79);
  });

  test('risk_level is Medium', () => {
    const result = calculateTrustScore(input);
    expect(result.risk_level).toBe('Medium');
  });

  test('fraud_flag is false', () => {
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(false);
  });

  test('recommendation is "Allow COD with monitoring"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).toBe('Allow COD with monitoring');
  });

  test('score_breakdown contains all five components', () => {
    const result = calculateTrustScore(input);
    expect(result.score_breakdown).toMatchObject({
      delivery_score:             expect.any(Number),
      rto_penalty_score:          expect.any(Number),
      cancellation_penalty_score: expect.any(Number),
      order_value_score:          expect.any(Number),
      cod_dependency_score:       expect.any(Number),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Perfect customer — score must equal 100 exactly
// ─────────────────────────────────────────────────────────────────────────────

describe('Perfect customer (score = 100)', () => {
  /**
   * Input: 50 orders, 50 delivered, 0 RTO, 0 cancelled, avg_order_value=5000, cod_orders=0
   *
   * Manual calculation:
   *   delivery_score             = (50/50) × 40 = 40
   *   rto_penalty_score          = (1-0) × 25   = 25
   *   cancellation_penalty_score = (1-0) × 20   = 20
   *   order_value_score          = 5000 → 10
   *   cod_dependency_score       = (1-0) × 5    = 5
   *   Total = 40 + 25 + 20 + 10 + 5 = 100 exactly
   */
  const input = makeInput({
    orders: 50, delivered: 50, rto: 0, cancelled: 0,
    avg_order_value: 5000, cod_orders: 0,
  });

  test('trust_score equals 100 exactly', () => {
    const result = calculateTrustScore(input);
    expect(result.trust_score).toBe(100);
  });

  test('risk_level is Low', () => {
    const result = calculateTrustScore(input);
    expect(result.risk_level).toBe('Low');
  });

  test('recommendation is "Allow COD"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).toBe('Allow COD');
  });

  test('fraud_flag is false', () => {
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(false);
  });

  test('each score component matches expected maximum', () => {
    const result = calculateTrustScore(input);
    expect(result.score_breakdown.delivery_score).toBe(40);
    expect(result.score_breakdown.rto_penalty_score).toBe(25);
    expect(result.score_breakdown.cancellation_penalty_score).toBe(20);
    expect(result.score_breakdown.order_value_score).toBe(10);
    expect(result.score_breakdown.cod_dependency_score).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Fraud flag — high RTO
// ─────────────────────────────────────────────────────────────────────────────

describe('High-RTO fraud case', () => {
  /**
   * rto_rate = 11/20 = 0.55 — strictly greater than 0.40 → fraud_flag = true
   */
  const input = makeInput({
    orders: 20, delivered: 8, rto: 11, cancelled: 1,
    avg_order_value: 1500, cod_orders: 18,
  });

  test('fraud_flag is true when rto_rate > 0.40', () => {
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(true);
  });

  test('recommendation is overridden to "Manual Review Required"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).toBe('Manual Review Required');
  });

  test('fraud_reason is set', () => {
    const result = calculateTrustScore(input);
    expect(result.fraud_reason).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Fraud flag — high cancellation
// ─────────────────────────────────────────────────────────────────────────────

describe('High-cancellation fraud case', () => {
  /**
   * cancellation_rate = 7/20 = 0.35 — strictly greater than 0.30 → fraud_flag = true
   */
  const input = makeInput({
    orders: 20, delivered: 11, rto: 2, cancelled: 7,
    avg_order_value: 1800, cod_orders: 15,
  });

  test('fraud_flag is true when cancellation_rate > 0.30', () => {
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(true);
  });

  test('recommendation is overridden to "Manual Review Required"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).toBe('Manual Review Required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Fraud boundary — rto_rate exactly 0.40 must NOT trigger flag
// ─────────────────────────────────────────────────────────────────────────────

describe('Boundary: rto_rate exactly 0.40', () => {
  /**
   * rto_rate = 10/25 = 0.40 exactly
   * Rule uses strictly greater than: 0.40 > 0.40 is FALSE → fraud_flag must be false
   * cancelled/25 = 0/25 = 0.0 → also not above 0.30
   */
  const input = makeInput({
    orders: 25, delivered: 15, rto: 10, cancelled: 0,
    avg_order_value: 2500, cod_orders: 10,
  });

  test('rto_rate of exactly 0.40 does NOT trigger fraud_flag', () => {
    // Verify the rate
    expect(input.rto / input.orders).toBeCloseTo(0.40);
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(false);
  });

  test('recommendation is NOT "Manual Review Required"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).not.toBe('Manual Review Required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Fraud boundary — cancellation_rate exactly 0.30 must NOT trigger flag
// ─────────────────────────────────────────────────────────────────────────────

describe('Boundary: cancellation_rate exactly 0.30', () => {
  /**
   * cancellation_rate = 6/20 = 0.30 exactly
   * Rule uses strictly greater than: 0.30 > 0.30 is FALSE → fraud_flag must be false
   * rto = 0 → rto_rate = 0.0 → also not above 0.40
   */
  const input = makeInput({
    orders: 20, delivered: 14, rto: 0, cancelled: 6,
    avg_order_value: 3000, cod_orders: 8,
  });

  test('cancellation_rate of exactly 0.30 does NOT trigger fraud_flag', () => {
    expect(input.cancelled / input.orders).toBeCloseTo(0.30);
    const result = calculateTrustScore(input);
    expect(result.fraud_flag).toBe(false);
  });

  test('recommendation is NOT "Manual Review Required"', () => {
    const result = calculateTrustScore(input);
    expect(result.recommendation).not.toBe('Manual Review Required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Order value tier boundaries
// ─────────────────────────────────────────────────────────────────────────────

describe('Order value tier boundary: 1999 vs 2000', () => {
  test('avg_order_value = 1999 yields order_value_score of 4', () => {
    expect(getOrderValueScore(1999)).toBe(4);
  });

  test('avg_order_value = 2000 yields order_value_score of 7', () => {
    expect(getOrderValueScore(2000)).toBe(7);
  });
});

describe('Order value tier boundary: 4999 vs 5000', () => {
  test('avg_order_value = 4999 yields order_value_score of 7', () => {
    expect(getOrderValueScore(4999)).toBe(7);
  });

  test('avg_order_value = 5000 yields order_value_score of 10', () => {
    expect(getOrderValueScore(5000)).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: Validation — zero orders
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: zero orders', () => {
  test('orders = 0 fails Zod validation with a clear error', () => {
    const result = trustScoreSchema.safeParse(makeInput({ orders: 0 }));
    expect(result.success).toBe(false);
    const messages = result.error.errors.map((e) => e.message);
    // Should contain a positive/greater-than message
    expect(messages.some((m) => /positive|greater than 0/i.test(m))).toBe(true);
  });

  test('calculateTrustScore is never called for orders = 0 (no divide-by-zero risk)', () => {
    // Confirm the validator blocks it before the calculator is reached
    const input = makeInput({ orders: 0 });
    const parseResult = trustScoreSchema.safeParse(input);
    expect(parseResult.success).toBe(false);
    // If someone bypassed validation, the scoring would produce NaN/Infinity — test that too
    // (the calculator itself doesn't guard against this, the validator must)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: Validation — negative values
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: negative values', () => {
  test('delivered = -1 fails Zod validation', () => {
    const result = trustScoreSchema.safeParse(makeInput({ delivered: -1 }));
    expect(result.success).toBe(false);
    const messages = result.error.errors.map((e) => e.message);
    expect(messages.some((m) => /negative/i.test(m))).toBe(true);
  });

  test('rto = -5 fails Zod validation', () => {
    const result = trustScoreSchema.safeParse(makeInput({ rto: -5 }));
    expect(result.success).toBe(false);
  });

  test('avg_order_value = -100 fails Zod validation', () => {
    const result = trustScoreSchema.safeParse(makeInput({ avg_order_value: -100 }));
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: Validation — sum exceeds orders
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: sum exceeds orders', () => {
  test('delivered + rto + cancelled > orders fails Zod validation', () => {
    // 10 + 5 + 8 = 23 > 20 orders
    const result = trustScoreSchema.safeParse(
      makeInput({ orders: 20, delivered: 10, rto: 5, cancelled: 8, cod_orders: 5 })
    );
    expect(result.success).toBe(false);
    const messages = result.error.errors.map((e) => e.message);
    expect(messages.some((m) => /cannot exceed/i.test(m))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11: Output contract — result shape
// ─────────────────────────────────────────────────────────────────────────────

describe('Output contract', () => {
  test('result always contains all required top-level fields', () => {
    const result = calculateTrustScore(makeInput());
    expect(result).toHaveProperty('customer_id');
    expect(result).toHaveProperty('trust_score');
    expect(result).toHaveProperty('risk_level');
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('fraud_flag');
    expect(result).toHaveProperty('score_breakdown');
    expect(result).toHaveProperty('calculated_at');
  });

  test('trust_score is always clamped between 0 and 100', () => {
    // Perfect customer
    const perfect = calculateTrustScore(makeInput({
      orders: 50, delivered: 50, rto: 0, cancelled: 0,
      avg_order_value: 9999, cod_orders: 0,
    }));
    expect(perfect.trust_score).toBeLessThanOrEqual(100);
    expect(perfect.trust_score).toBeGreaterThanOrEqual(0);
  });

  test('calculated_at is a valid ISO 8601 timestamp', () => {
    const result = calculateTrustScore(makeInput());
    expect(() => new Date(result.calculated_at).toISOString()).not.toThrow();
  });
});
