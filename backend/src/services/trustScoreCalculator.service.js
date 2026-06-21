'use strict';

/**
 * trustScoreCalculator.service.js
 *
 * Pure-function scoring engine for ShopFlow's COD Trust Score.
 * NO database access. NO HTTP. Fully unit-testable in isolation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCORING MODEL (100 pts total)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Delivery Rate Score      — 40 pts
 *    Formula : (delivered / orders) × 40
 *    Rationale: The single clearest positive signal. A customer who consistently
 *    accepts deliveries proves the address is real and intent is genuine.
 *
 * 2. RTO Penalty Score        — 25 pts
 *    Formula : (1 − rto / orders) × 25
 *    Rationale: Weighted higher than cancellations because an RTO costs ShopFlow
 *    TWICE — outbound logistics + return logistics — versus a pre-dispatch
 *    cancellation that only wastes the outbound reservation.
 *
 * 3. Cancellation Penalty Score — 20 pts
 *    Formula : (1 − cancelled / orders) × 20
 *    Rationale: Pre-dispatch cancellations indicate lower intent but are cheaper
 *    to absorb than RTOs, hence the lower weight.
 *
 * 4. Order Value Trust Score  — 10 pts
 *    Tiers  : avg_order_value ≥ 5000 → 10
 *             avg_order_value 2000–4999 → 7
 *             avg_order_value < 2000 → 4
 *    Rationale: High-value customers who complete orders are statistically lower
 *    risk — the financial stake raises their commitment. The minimum of 4 pts
 *    (not 0) avoids over-penalising genuinely low-income but honest customers.
 *
 * 5. COD Dependency Adjustment — 5 pts
 *    Formula : (1 − cod_orders / orders) × 5
 *    Rationale: A customer who occasionally uses prepaid payment has demonstrated
 *    willingness to commit funds upfront, a mild positive trust signal. The small
 *    weight (5 pts) avoids unfairly penalising cash-preferred customers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FRAUD FLAG (independent rule, runs inside the same function)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   IF rto_rate > 0.40 OR cancellation_rate > 0.30:
 *       fraud_flag = true
 *       Overrides recommendation → "Manual Review Required"
 *
 *   Boundary: strictly greater than — rto_rate === 0.40 does NOT trigger the flag.
 */

/**
 * Compute the order value tier score (10 pts component).
 * @param {number} avgOrderValue
 * @returns {number} 4 | 7 | 10
 */
function getOrderValueScore(avgOrderValue) {
  if (avgOrderValue >= 5000) return 10;
  if (avgOrderValue >= 2000) return 7;
  return 4;
}

/**
 * Map a trust score to a risk level.
 * @param {number} score  0–100
 * @returns {'Low'|'Medium'|'High'}
 */
function getRiskLevel(score) {
  if (score >= 80) return 'Low';
  if (score >= 50) return 'Medium';
  return 'High';
}

/**
 * Map a risk level to a base recommendation.
 * May be overridden by the fraud flag.
 * @param {'Low'|'Medium'|'High'} riskLevel
 * @returns {string}
 */
function getBaseRecommendation(riskLevel) {
  switch (riskLevel) {
    case 'Low':
      return 'Allow COD';
    case 'Medium':
      return 'Allow COD with monitoring';
    case 'High':
      return 'Restrict COD — Prepaid Only';
    default:
      return 'Manual Review Required';
  }
}

/**
 * Calculate the COD Trust Score for a customer.
 *
 * @param {object} input
 * @param {string} input.customer_id
 * @param {number} input.orders           Total orders placed
 * @param {number} input.delivered        Successfully delivered
 * @param {number} input.rto              Returned to origin (refused/undelivered)
 * @param {number} input.cancelled        Cancelled before dispatch
 * @param {number} input.avg_order_value  Average order value in INR
 * @param {number} input.cod_orders       Orders placed via Cash on Delivery
 *
 * @returns {object} Full score result
 */
function calculateTrustScore(input) {
  const { customer_id, orders, delivered, rto, cancelled, avg_order_value, cod_orders } = input;

  // ── Derived ratios ──────────────────────────────────────────────────────────
  const delivery_rate       = delivered  / orders;
  const rto_rate            = rto        / orders;
  const cancellation_rate   = cancelled  / orders;
  const cod_dependency      = cod_orders / orders;

  // ── Score components ────────────────────────────────────────────────────────
  const delivery_score              = parseFloat((delivery_rate     * 40).toFixed(2));
  const rto_penalty_score           = parseFloat(((1 - rto_rate)   * 25).toFixed(2));
  const cancellation_penalty_score  = parseFloat(((1 - cancellation_rate) * 20).toFixed(2));
  const order_value_score           = getOrderValueScore(avg_order_value);
  const cod_dependency_score        = parseFloat(((1 - cod_dependency) * 5).toFixed(2));

  const rawScore = (
    delivery_score +
    rto_penalty_score +
    cancellation_penalty_score +
    order_value_score +
    cod_dependency_score
  );

  // Clamp to [0, 100] and round
  const trust_score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // ── Risk level & recommendation ─────────────────────────────────────────────
  const risk_level = getRiskLevel(trust_score);
  let recommendation = getBaseRecommendation(risk_level);

  // ── Fraud flag rule — strictly greater than, NOT >= ─────────────────────────
  let fraud_flag = false;
  let fraud_reason = null;

  if (rto_rate > 0.40 || cancellation_rate > 0.30) {
    fraud_flag = true;
    fraud_reason = 'RTO/Cancellation threshold breached';
    recommendation = 'Manual Review Required';
  }

  return {
    customer_id,
    trust_score,
    risk_level,
    recommendation,
    fraud_flag,
    fraud_reason,
    score_breakdown: {
      delivery_score,
      rto_penalty_score,
      cancellation_penalty_score,
      order_value_score,
      cod_dependency_score,
    },
    calculated_at: new Date().toISOString(),
  };
}

module.exports = {
  calculateTrustScore,
  getOrderValueScore,  // exported for granular unit testing of tier boundaries
  getRiskLevel,
};
