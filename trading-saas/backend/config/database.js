const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  // Unix socket for local PostgreSQL (peer auth — no password)
  host: '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: 'trading_saas',
  user: 'postgres',
  password: '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

module.exports = pool;
