'use strict';

const { trustScoreSchema } = require('../validators/trustScore.schema');
const { calculateTrustScore } = require('../services/trustScoreCalculator.service');
const { saveScore, getHistory, getLatest } = require('../services/trustScore.service');

/**
 * POST /trust-score
 * Validates input → computes score → persists → returns result.
 */
async function computeScore(req, res) {
  // ── 1. Validate input ───────────────────────────────────────────────────────
  const parseResult = trustScoreSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  const input = parseResult.data;

  // ── 2. Calculate score (pure function — no DB call) ─────────────────────────
  const result = calculateTrustScore(input);

  // ── 3. Persist to Neon ──────────────────────────────────────────────────────
  try {
    await saveScore(input, result);
  } catch (dbErr) {
    console.error('DB persistence error:', dbErr);
    // Return the result even if persistence fails — don't silently fail the API call
    return res.status(500).json({
      error: 'Score computed but could not be persisted to database',
      details: dbErr.message,
    });
  }

  // ── 4. Return result ────────────────────────────────────────────────────────
  // Omit fraud_reason from response if null (keep payload clean for non-fraud cases)
  const response = {
    customer_id: result.customer_id,
    trust_score: result.trust_score,
    risk_level: result.risk_level,
    recommendation: result.recommendation,
    fraud_flag: result.fraud_flag,
    score_breakdown: result.score_breakdown,
    calculated_at: result.calculated_at,
  };
  if (result.fraud_flag && result.fraud_reason) {
    response.fraud_reason = result.fraud_reason;
  }

  return res.status(200).json(response);
}

/**
 * GET /trust-score/:customerId/history
 * Returns all past score calculations for a customer, most recent first.
 */
async function getCustomerHistory(req, res) {
  const { customerId } = req.params;

  if (!customerId || customerId.trim() === '') {
    return res.status(400).json({ error: 'customerId parameter is required' });
  }

  try {
    const records = await getHistory(customerId.trim());
    return res.status(200).json({
      customer_id: customerId,
      count: records.length,
      history: records,
    });
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ error: 'Failed to fetch score history', details: err.message });
  }
}

/**
 * GET /trust-score/:customerId/latest
 * Returns only the most recent score calculation for a customer.
 */
async function getCustomerLatest(req, res) {
  const { customerId } = req.params;

  if (!customerId || customerId.trim() === '') {
    return res.status(400).json({ error: 'customerId parameter is required' });
  }

  try {
    const record = await getLatest(customerId.trim());
    if (!record) {
      return res.status(404).json({
        error: 'No score found for this customer',
        customer_id: customerId,
      });
    }
    return res.status(200).json(record);
  } catch (err) {
    console.error('Error fetching latest score:', err);
    return res.status(500).json({ error: 'Failed to fetch latest score', details: err.message });
  }
}

module.exports = { computeScore, getCustomerHistory, getCustomerLatest };
