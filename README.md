# ShopFlow — Trust & Risk Console & Trust Score Engine

This is the repository for **ShopFlow's Customer Trust Score System**, divided into:
- `/backend`: A Node.js + Express backend service that computes and persists COD (Cash on Delivery) Trust Scores using Neon Postgres.
- `/frontend`: A React + Three.js internal dashboard console for the Risk & Ops team featuring the 3D Trust Orb.

---

## Repository Structure

```
ShopFlow/
├── backend/
│   ├── src/
│   │   ├── index.js                           # Express app entry point + Swagger
│   │   ├── db/
│   │   │   ├── pool.js                        # Neon pg Pool (SSL configured)
│   │   │   ├── migrate.js                     # Migration runner script
│   │   │   └── migrations/
│   │   │       └── 001_create_trust_score_history.sql
│   │   ├── validators/
│   │   │   └── trustScore.schema.js           # Zod validation schema
│   │   ├── services/
│   │   │   ├── trustScoreCalculator.service.js # Pure scoring logic (no DB/HTTP)
│   │   │   └── trustScore.service.js            # DB persistence & query layer
│   │   ├── controllers/
│   │   │   └── trustScore.controller.js
│   │   └── routes/
│   │       └── trustScore.routes.js
│   ├── tests/
│   │   └── trustScoreCalculator.test.js       # Jest unit tests (32 cases)
│   ├── .env.example                           # Environment variable template
│   ├── package.json
│   └── README.md
└── frontend/                                  # React + Three.js Vite frontend app
    ├── src/
    ├── public/
    ├── package.json
    └── README.md
```

---

## Setup & Running

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your Neon connection string in .env
npm run migrate
npm run dev # Starts backend on http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev # Starts Vite server on http://localhost:5173
```

---

## Scoring Logic & Rationale

The trust score is a **weighted sum of 5 components** totalling 100 points.

| Component | Weight | Formula | Rationale |
|---|---|---|---|
| **Delivery Rate** | 40 pts | `(delivered / orders) × 40` | The strongest positive signal — consistent deliveries prove real intent and a valid address. |
| **RTO Penalty** | 25 pts | `(1 − rto_rate) × 25` | Weighted **above** cancellations because an RTO costs ShopFlow twice: outbound logistics + return logistics. |
| **Cancellation Penalty** | 20 pts | `(1 − cancellation_rate) × 20` | Cheaper than RTOs but still a negative intent signal. |
| **Order Value Trust** | 10 pts | Tiered: `≥₹5000 → 10`, `₹2000–₹4999 → 7`, `<₹2000 → 4` | High-value customers who complete orders are statistically lower risk. |
| **COD Dependency** | 5 pts | `(1 − cod_dependency) × 5` | Customers who occasionally use prepaid payment have demonstrated willingness to commit funds upfront. |

### Risk Level Mapping

| Score | Risk Level | Recommendation |
|---|---|---|
| 80–100 | Low | Allow COD |
| 50–79 | Medium | Allow COD with monitoring |
| 0–49 | High | Restrict COD — Prepaid Only |

---

## Running Tests

To run the backend Jest unit tests:

```bash
cd backend
npm test
```

