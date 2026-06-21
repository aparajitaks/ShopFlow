'use strict';

require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const cors = require('cors');
const trustScoreRoutes = require('./routes/trustScore.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
// Allow the React dev server (port 5173) and any other origins to call this API
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Swagger / OpenAPI documentation ────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShopFlow Trust Score Engine API',
      version: '1.0.0',
      description: `
**Customer Trust Score Engine** for ShopFlow's COD (Cash on Delivery) risk management.

Computes a weighted trust score (0–100) from a customer's historical order behavior
to determine whether COD should be allowed, restricted, or flagged for manual review.

### Score Components
| Component | Weight | Signal |
|---|---|---|
| Delivery Rate | 40 pts | Positive — completed deliveries |
| RTO Penalty | 25 pts | Negative — return-to-origin (costs 2× logistics) |
| Cancellation Penalty | 20 pts | Negative — pre-dispatch cancellations |
| Order Value Trust | 10 pts | Tiered: ≥₹5000 → 10, ₹2000–₹4999 → 7, <₹2000 → 4 |
| COD Dependency | 5 pts | Lower dependency = slight trust boost |

### Fraud Flag
If \`rto_rate > 0.40\` OR \`cancellation_rate > 0.30\`, the account is flagged and
the recommendation is overridden to **"Manual Review Required"**.
      `,
      contact: {
        name: 'ShopFlow Engineering',
      },
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local development' },
    ],
    components: {
      schemas: {
        TrustScoreInput: {
          type: 'object',
          required: ['customer_id', 'orders', 'delivered', 'rto', 'cancelled', 'avg_order_value', 'cod_orders'],
          properties: {
            customer_id:     { type: 'string',  example: 'CUST10234' },
            orders:          { type: 'integer', example: 25 },
            delivered:       { type: 'integer', example: 18 },
            rto:             { type: 'integer', example: 4 },
            cancelled:       { type: 'integer', example: 3 },
            avg_order_value: { type: 'number',  example: 2500 },
            cod_orders:      { type: 'integer', example: 20 },
          },
        },
        TrustScoreOutput: {
          type: 'object',
          properties: {
            customer_id:     { type: 'string',  example: 'CUST10234' },
            trust_score:     { type: 'integer', example: 72 },
            risk_level:      { type: 'string',  enum: ['Low', 'Medium', 'High'], example: 'Medium' },
            recommendation:  { type: 'string',  example: 'Allow COD with monitoring' },
            fraud_flag:      { type: 'boolean', example: false },
            fraud_reason:    { type: 'string',  nullable: true, example: null },
            score_breakdown: {
              type: 'object',
              properties: {
                delivery_score:             { type: 'number' },
                rto_penalty_score:          { type: 'number' },
                cancellation_penalty_score: { type: 'number' },
                order_value_score:          { type: 'number' },
                cod_dependency_score:       { type: 'number' },
              },
            },
            calculated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.routes.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ShopFlow Trust Score API',
}));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/trust-score', trustScoreRoutes);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'ShopFlow Trust Score Engine',
    version: '1.0.0',
    status: 'ok',
    docs: '/api-docs',
    endpoints: [
      'POST   /trust-score',
      'GET    /trust-score/:customerId/latest',
      'GET    /trust-score/:customerId/history',
      'GET    /health',
    ],
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ShopFlow Trust Score Engine', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start server ────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀  ShopFlow Trust Score Engine running at http://localhost:${PORT}`);
    console.log(`📚  API docs available at http://localhost:${PORT}/api-docs\n`);
  });
}

module.exports = app; // export for testing
