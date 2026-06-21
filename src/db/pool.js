'use strict';

require('dotenv').config();
const { Pool } = require('pg');

/**
 * Neon (hosted Postgres) connection pool.
 *
 * Neon uses SSL with channel_binding — we pass the connection string directly
 * and override SSL settings to ensure compatibility with both the Neon pooler
 * and the pg library's SSL mode handling.
 *
 * connectionTimeoutMillis is set higher (10s) to handle Neon's cold-start latency
 * on the serverless pooler, which can take a few seconds to warm up.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    // channel_binding is handled at the protocol level by pg; we just ensure
    // the SSL socket is established so Neon accepts the connection.
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  process.exit(-1);
});

module.exports = pool;
