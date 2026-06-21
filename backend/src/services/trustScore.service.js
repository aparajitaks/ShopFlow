'use strict';

const pool = require('../db/pool');

/**
 * trustScore.service.js
 *
 * Database service layer for the Trust Score Engine.
 * Handles persistence and retrieval of trust score history records.
 * The actual scoring math lives in trustScoreCalculator.service.js (no DB dependency).
 */

/**
 * Persist a trust score calculation to the trust_score_history table.
 *
 * @param {object} input   — original request body (customer_id, orders, etc.)
 * @param {object} result  — output from calculateTrustScore()
 * @returns {Promise<object>} the newly inserted row
 */
async function saveScore(input, result) {
  const {
    customer_id,
    orders,
    delivered,
    rto,
    cancelled,
    avg_order_value,
    cod_orders,
  } = input;

  const {
    trust_score,
    risk_level,
    recommendation,
    fraud_flag,
    fraud_reason,
    score_breakdown,
  } = result;

  const query = `
    INSERT INTO trust_score_history (
      customer_id, orders, delivered, rto, cancelled,
      avg_order_value, cod_orders,
      trust_score, risk_level, recommendation,
      fraud_flag, fraud_reason, score_breakdown
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;

  const values = [
    customer_id,
    orders,
    delivered,
    rto,
    cancelled,
    avg_order_value,
    cod_orders,
    trust_score,
    risk_level,
    recommendation,
    fraud_flag,
    fraud_reason || null,
    JSON.stringify(score_breakdown),
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Retrieve all trust score records for a customer, most recent first.
 *
 * @param {string} customerId
 * @returns {Promise<object[]>}
 */
async function getHistory(customerId) {
  const query = `
    SELECT *
    FROM trust_score_history
    WHERE customer_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [customerId]);
  return rows;
}

/**
 * Retrieve only the most recent trust score record for a customer.
 *
 * @param {string} customerId
 * @returns {Promise<object|null>}
 */
async function getLatest(customerId) {
  const query = `
    SELECT *
    FROM trust_score_history
    WHERE customer_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [customerId]);
  return rows[0] || null;
}

module.exports = { saveScore, getHistory, getLatest };
