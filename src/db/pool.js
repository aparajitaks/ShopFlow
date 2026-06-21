'use strict';

require('dotenv').config();
const { Pool } = require('pg');

/**
 * Neon (hosted Postgres) connection pool.
 * SSL is required by Neon — rejectUnauthorized: false allows the self-signed cert
 * while still encrypting traffic in transit.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Keep pool lean — Neon free tier has connection limits
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  process.exit(-1);
});

module.exports = pool;
