# ShopFlow — Customer Trust Score Engine

A Node.js + Express backend service that computes a **COD (Cash on Delivery) Trust Score** from a customer's historical order behavior. The score determines whether to allow, restrict, or flag COD orders on the ShopFlow D2C platform.

---

## Table of Contents

1. [Setup](#setup)
2. [Running the Migration](#running-the-migration)
3. [Starting the Server](#starting-the-server)
4. [API Reference & curl Examples](#api-reference--curl-examples)
5. [Scoring Logic & Rationale](#scoring-logic--rationale)
6. [Fraud Flag System](#fraud-flag-system)
7. [Running Tests](#running-tests)
8. [Project Structure](#project-structure)

---

## Setup

### Prerequisites

- Node.js ≥ 18
- A [Neon](https://neon.tech) Postgres project (connection string required)

### Install

```bash
git clone https://github.com/aparajitaks/ShopFlow.git
cd ShopFlow
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require
PORT=3000
NODE_ENV=development
```

---

## Running the Migration

This creates the `trust_score_history` table and its composite index in your Neon database.

```bash
npm run migrate
```

Or directly:

```bash
node src/db/migrate.js
```

Expected output:
```
Running migration: 001_create_trust_score_history.sql
✅  001_create_trust_score_history.sql — completed

✅  All migrations applied successfully.
```

The migration uses `CREATE TABLE IF NOT EXISTS` — re-running it is safe.

---

## Starting the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000` (configurable via `PORT` in `.env`).

**Swagger UI** is available at: `http://localhost:3000/api-docs`

---

## API Reference & curl Examples

### `POST /trust-score`

Compute a trust score for a customer and persist the result.

```bash
curl -X POST http://localhost:3000/trust-score \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST10234",
    "orders": 25,
    "delivered": 18,
    "rto": 4,
    "cancelled": 3,
    "avg_order_value": 2500,
    "cod_orders": 20
  }'
```

**Response (200):**
```json
{
  "customer_id": "CUST10234",
  "trust_score": 75,
  "risk_level": "Medium",
  "recommendation": "Allow COD with monitoring",
  "fraud_flag": false,
  "score_breakdown": {
    "delivery_score": 28.8,
    "rto_penalty_score": 21,
    "cancellation_penalty_score": 17.6,
    "order_value_score": 7,
    "cod_dependency_score": 1
  },
  "calculated_at": "2026-06-21T10:15:00.000Z"
}
```

**Validation error (400):**
```bash
# orders = 0 (divide-by-zero guard)
curl -X POST http://localhost:3000/trust-score \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST001","orders":0,"delivered":0,"rto":0,"cancelled":0,"avg_order_value":1000,"cod_orders":0}'
```

```json
{
  "error": "Validation failed",
  "details": [{ "field": "orders", "message": "orders must be greater than 0" }]
}
```

---

### `GET /trust-score/:customerId/history`

Get all past score calculations for a customer (most recent first).

```bash
curl http://localhost:3000/trust-score/CUST10234/history
```

**Response (200):**
```json
{
  "customer_id": "CUST10234",
  "count": 2,
  "history": [
    { "id": 2, "customer_id": "CUST10234", "trust_score": 75, "created_at": "2026-06-21T..." },
    { "id": 1, "customer_id": "CUST10234", "trust_score": 68, "created_at": "2026-06-20T..." }
  ]
}
```

---

### `GET /trust-score/:customerId/latest`

Get only the most recent score for a customer.

```bash
curl http://localhost:3000/trust-score/CUST10234/latest
```

**Response (200):** Single score record object.  
**Response (404):** `{ "error": "No score found for this customer" }` if the customer has no history.

---

### `GET /health`

Simple health check.

```bash
curl http://localhost:3000/health
```

---

## Scoring Logic & Rationale

The trust score is a **weighted sum of 5 components** totalling 100 points.

| Component | Weight | Formula | Rationale |
|---|---|---|---|
| **Delivery Rate** | 40 pts | `(delivered / orders) × 40` | The strongest positive signal — consistent deliveries prove real intent and a valid address. |
| **RTO Penalty** | 25 pts | `(1 − rto_rate) × 25` | Weighted **above** cancellations because an RTO costs ShopFlow twice: outbound logistics + return logistics. A pre-dispatch cancellation wastes only the outbound reservation. |
| **Cancellation Penalty** | 20 pts | `(1 − cancellation_rate) × 20` | Cheaper than RTOs but still a negative intent signal. |
| **Order Value Trust** | 10 pts | Tiered: `≥₹5000 → 10`, `₹2000–₹4999 → 7`, `<₹2000 → 4` | High-value customers who complete orders are statistically lower risk — financial stake increases commitment. The floor of 4 pts avoids over-penalising low-income but honest customers. |
| **COD Dependency** | 5 pts | `(1 − cod_dependency) × 5` | Customers who occasionally use prepaid payment have demonstrated willingness to commit funds upfront — a mild positive signal. Weight is intentionally small (5 pts) to avoid unfairly penalising cash-preferred customers. |

### Risk Level Mapping

| Score | Risk Level | Recommendation |
|---|---|---|
| 80–100 | Low | Allow COD |
| 50–79 | Medium | Allow COD with monitoring |
| 0–49 | High | Restrict COD — Prepaid Only |

---

## Fraud Flag System

**Independent of the weighted score**, the engine applies a rule-based fraud check inside the same calculation function:

```
IF rto_rate > 0.40 OR cancellation_rate > 0.30:
    fraud_flag = true
    fraud_reason = "RTO/Cancellation threshold breached"
    recommendation = "Manual Review Required"  ← overrides score-based recommendation
```

**Boundary**: The check uses **strict greater-than** (`>`), not `>=`.  
- `rto_rate = 0.40` → `fraud_flag = false`  
- `rto_rate = 0.401` → `fraud_flag = true`

This is enforced by the unit tests (see Section 5–6 of the test suite).

---

## Running Tests

```bash
npm test
```

The test suite covers **11 scenarios**:

| # | Scenario | Key Assertion |
|---|---|---|
| 1 | Normal case (25 orders) | Score in Medium range, no fraud |
| 2 | Perfect customer | Score = **100 exactly** |
| 3 | High-RTO fraud | `fraud_flag = true`, `"Manual Review Required"` |
| 4 | High-cancellation fraud | `fraud_flag = true` |
| 5 | Boundary: `rto_rate = 0.40` | `fraud_flag = **false**` |
| 6 | Boundary: `cancellation_rate = 0.30` | `fraud_flag = **false**` |
| 7 | Order value: 1999 vs 2000 | 1999 → 4 pts, 2000 → 7 pts |
| 8 | Order value: 4999 vs 5000 | 4999 → 7 pts, 5000 → 10 pts |
| 9 | Zero orders | Validation rejects (400) |
| 10 | Negative values | Validation rejects (400) |
| 11 | Sum > orders | Validation rejects (400) |

---

## Project Structure

```
ShopFlow/
├── src/
│   ├── index.js                           # Express app entry point + Swagger
│   ├── db/
│   │   ├── pool.js                        # Neon pg Pool (SSL configured)
│   │   ├── migrate.js                     # Migration runner script
│   │   └── migrations/
│   │       └── 001_create_trust_score_history.sql
│   ├── validators/
│   │   └── trustScore.schema.js           # Zod validation schema
│   ├── services/
│   │   ├── trustScoreCalculator.service.js  # Pure scoring logic (no DB/HTTP)
│   │   └── trustScore.service.js            # DB persistence & query layer
│   ├── controllers/
│   │   └── trustScore.controller.js
│   └── routes/
│       └── trustScore.routes.js
├── tests/
│   └── trustScoreCalculator.test.js       # Jest unit tests (11 cases)
├── .env.example                           # Environment variable template
├── .gitignore
├── package.json
└── README.md
```
