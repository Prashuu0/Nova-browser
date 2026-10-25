const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');
const { pool, isSqlite } = require('./pool');

async function migrate() {
  const schemaFile = isSqlite ? 'schema-sqlite.sql' : 'schema.sql';
  const schemaPath = path.join(__dirname, schemaFile);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  if (isSqlite) {
    const dbPath = config.databaseUrl.replace(/^sqlite:/, '');
    const db = new DatabaseSync(dbPath);
    db.exec(sql);
    db.close();
    console.log('[Nova Cloud] SQLite schema applied successfully.');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('[Nova Cloud] PostgreSQL schema applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('[Nova Cloud] Migration failed:', err.message);
  process.exit(1);
});
