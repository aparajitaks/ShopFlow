-- Migration: 001_create_trust_score_history
-- Creates the trust_score_history table for persisting all COD trust score calculations.
-- Run via: node src/db/migrate.js

CREATE TABLE IF NOT EXISTS trust_score_history (
    id              SERIAL PRIMARY KEY,
    customer_id     VARCHAR(64) NOT NULL,
    orders          INT NOT NULL,
    delivered       INT NOT NULL,
    rto             INT NOT NULL,
    cancelled       INT NOT NULL,
    avg_order_value NUMERIC(10,2) NOT NULL,
    cod_orders      INT NOT NULL,
    trust_score     INT NOT NULL,
    risk_level      VARCHAR(10) NOT NULL,
    recommendation  VARCHAR(64) NOT NULL,
    fraud_flag      BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_reason    VARCHAR(128),
    score_breakdown JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index: both /history and /latest filter by customer_id AND sort by created_at DESC.
-- A composite index on both columns is more efficient than indexing customer_id alone,
-- since Postgres can satisfy the ORDER BY from the index without a separate sort step.
CREATE INDEX IF NOT EXISTS idx_trust_score_customer_created
    ON trust_score_history(customer_id, created_at DESC);
