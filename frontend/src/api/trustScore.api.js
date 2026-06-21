import client from './client';

/**
 * POST /trust-score
 * Submit new order metrics and receive a computed trust score.
 *
 * @param {object} payload - { customer_id, orders, delivered, rto, cancelled, avg_order_value, cod_orders }
 * @returns {Promise<object>} trust score result
 */
export async function postTrustScore(payload) {
  const { data } = await client.post('/trust-score', payload);
  return data;
}

/**
 * GET /trust-score/:customerId/history
 * Retrieve all past trust score calculations for a customer, newest first.
 *
 * @param {string} customerId
 * @returns {Promise<object>} { customer_id, count, history: [...] }
 */
export async function getTrustScoreHistory(customerId) {
  const { data } = await client.get(`/trust-score/${encodeURIComponent(customerId)}/history`);
  return data;
}

/**
 * GET /trust-score/:customerId/latest
 * Retrieve only the most recent score for a customer.
 * Returns null when the backend returns 404 (customer not yet scored — normal case).
 *
 * @param {string} customerId
 * @returns {Promise<object|null>}
 */
export async function getTrustScoreLatest(customerId) {
  try {
    const { data } = await client.get(`/trust-score/${encodeURIComponent(customerId)}/latest`);
    return data;
  } catch (error) {
    // 404 = customer exists but has never been scored — treat as null, not an error
    if (error.response?.status === 404) return null;
    throw error;
  }
}
