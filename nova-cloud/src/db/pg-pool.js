const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('[Nova Cloud] PostgreSQL pool error:', err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

console.log('[Nova Cloud] Using PostgreSQL database');

module.exports = { pool, query, isSqlite: false };
