# ShopFlow Trust & Risk Console — Frontend

React (Vite) internal dashboard for ShopFlow's Risk & Ops team. Consumes the ShopFlow Trust Score Engine backend to display COD trust scores, risk levels, and fraud flags in a professional, e-commerce-grade UI.

---

## Table of Contents

1. [Setup](#setup)
2. [Environment Variables](#environment-variables)
3. [Running the App](#running-the-app)
4. [Monorepo Structure](#monorepo-structure)
5. [The 3D Trust Orb](#the-3d-trust-orb)
6. [Backend Extensions Needed](#backend-extensions-needed)
7. [Manual QA Checklist](#manual-qa-checklist)

---

## Setup

### Prerequisites

- Node.js >= 18
- Backend running at `http://localhost:3000` (see `/README.md` in repo root)

### Install

```bash
cd frontend
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the Trust Score Engine Express backend |

---

## Running the App

```bash
# Start the backend first (from repo root):
npm run dev

# Then start the frontend (from /frontend):
npm run dev
```

Frontend dev server: `http://localhost:5173`

The Vite dev server proxies `/trust-score/*` requests to `VITE_API_BASE_URL`, avoiding CORS issues in development.

---

## Monorepo Structure

```
ShopFlow/                        <- repo root (backend)
  src/                           <- Express backend source
  frontend/                      <- React frontend (this directory)
    src/
      api/                       <- Axios client + API functions
      theme/
        riskPalette.js           <- Single source of truth for risk colors
      components/
        TrustOrb/                <- Three.js orb component
      hooks/                     <- TanStack Query hooks
      pages/                     <- HomePage, CustomerProfilePage, WatchlistPage
    .env.example
  README.md
```

---

## The 3D Trust Orb

The Trust Orb (`src/components/TrustOrb/TrustOrb.jsx`) is the signature visual on the Customer Profile page. It uses `@react-three/fiber` with `MeshDistortMaterial` from `@react-three/drei`.

### Color and Motion -> Risk Level Mapping

| State | Color | Distortion | Speed | Notes |
|---|---|---|---|---|
| Low Risk | `#10B981` (Emerald) | 0.18 | 0.7 | Calm, slow surface movement |
| Medium Risk | `#F59E0B` (Amber) | 0.42 | 1.6 | Moderate animation |
| High Risk | `#EF4444` (Red) | 0.68 | 2.8 | More turbulent surface |
| Fraud Flag | `#DC2626` (Deep Red) | 0.88 | 4.2 | Pulsing red + warning torus ring |

**Color source**: All four colors are defined once in `src/theme/riskPalette.js` and imported by both the orb (`orbColor.js`) and `RiskBadge.jsx`. Changing a color in one place changes it everywhere.

**Accessibility**: The canvas is `aria-hidden`. Score, risk level, and recommendation are rendered as normal DOM text alongside the canvas.

**prefers-reduced-motion**: When the OS setting is enabled, `useFrame` animations are frozen.

**Why the orb and not a gauge**: The orb was a deliberate product design choice. The DOM score + RiskBadge remains fully functional if WebGL is unavailable.

---

## Backend Extensions Needed

Two screens use data the backend does not yet expose:

### 1. Home Page Stats Row

The four stats cards show placeholder values with "stub" badges.

**To implement**: Add `GET /trust-score/stats` returning:
```json
{ "scored_today": 42, "avg_trust_score": 71, "high_risk_count": 8, "fraud_flags_week": 3 }
```

### 2. Risk Watchlist Page

The `/watchlist` page uses static mock data.

**To implement**: Add `GET /trust-score/flagged?page=1&limit=20` filtering high-risk and fraud-flagged customers.

Both are labeled with "stub" badges and blue info banners in the UI.

---

## Manual QA Checklist

- [ ] Tab through the profile page -- score, risk level, and recommendation readable without WebGL
- [ ] Resize to 768px tablet width -- reflow without clipping
- [ ] Enable prefers-reduced-motion -- orb stops rotating/pulsing
- [ ] Look up a never-scored customer -- see "No Trust Score Yet" state, not a crash
- [ ] Refresh the home page after several searches -- recent-search chips persist (localStorage)
- [ ] Submit Recalculate form with orders=0 -- inline error on the field
- [ ] Submit with delivered+rto+cancelled > orders -- inline error on delivered field
- [ ] Trigger fraud-flag response (rto_rate > 0.40) -- red fraud banner above the orb

---

## Tech Stack

| Library | Purpose |
|---|---|
| React + Vite | UI framework |
| TailwindCSS v3 | Styling |
| @react-three/fiber + @react-three/drei | 3D Trust Orb |
| Recharts | Score breakdown bar chart |
| TanStack Query | API calls, caching, loading/error state |
| react-hook-form + Zod | Form validation (mirrors backend rules) |
| axios | HTTP client |
| react-router-dom | Client-side routing |
| date-fns | Date formatting in history table |
