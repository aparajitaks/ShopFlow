'use strict';

const { Router } = require('express');
const { computeScore, getCustomerHistory, getCustomerLatest } = require('../controllers/trustScore.controller');

const router = Router();

/**
 * @openapi
 * /trust-score:
 *   post:
 *     summary: Compute a COD trust score for a customer
 *     tags: [Trust Score]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrustScoreInput'
 *     responses:
 *       200:
 *         description: Trust score computed and persisted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrustScoreOutput'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server or database error
 */
router.post('/', computeScore);

/**
 * @openapi
 * /trust-score/{customerId}/history:
 *   get:
 *     summary: Get all trust score calculations for a customer
 *     tags: [Trust Score]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: List of all score records, most recent first
 *       500:
 *         description: Database error
 */
router.get('/:customerId/history', getCustomerHistory);

/**
 * @openapi
 * /trust-score/{customerId}/latest:
 *   get:
 *     summary: Get the most recent trust score for a customer
 *     tags: [Trust Score]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: Most recent score record
 *       404:
 *         description: No score found for this customer
 *       500:
 *         description: Database error
 */
router.get('/:customerId/latest', getCustomerLatest);

module.exports = router;
