const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');
const { pgToSqlite, normalizeRows } = require('./sql-utils');

const dbPath = config.databaseUrl.replace(/^sqlite:/, '');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function coerceParams(params = []) {
  return params.map((p) => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p instanceof Date) return p.toISOString();
    return p;
  });
}

function runQuery(text, params = []) {
  const sql = pgToSqlite(text);
  const bound = coerceParams(params);
  const trimmed = sql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...bound);
    return { rows: normalizeRows(rows), rowCount: rows.length };
  }

  if (trimmed.startsWith('INSERT') && sql.includes('RETURNING')) {
    const base = sql.replace(/\s+RETURNING[\s\S]*$/i, '');
    const returningMatch = sql.match(/RETURNING\s+([\s\S]+)$/i);
    const returningCols = returningMatch
      ? returningMatch[1].split(',').map((c) => c.trim().split(/\s+AS\s+/i).pop().trim())
      : [];

    const info = db.prepare(base).run(...bound);
    const colsMatch = base.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)/i);
    if (returningCols.length && colsMatch) {
      const table = colsMatch[1];
      const cols = colsMatch[2].split(',').map((c) => c.trim());
      const idIdx = cols.indexOf('id');
      if (idIdx >= 0 && params[idIdx] != null) {
        const row = db.prepare(`SELECT ${returningCols.join(', ')} FROM ${table} WHERE id = ?`).get(bound[idIdx]);
        return { rows: normalizeRows([row]), rowCount: info.changes };
      }
    }
    return { rows: [], rowCount: info.changes };
  }

  const info = db.prepare(sql).run(...bound);
  return { rows: [], rowCount: info.changes };
}

async function query(text, params) {
  return runQuery(text, params);
}

const pool = {
  connect: async () => {
    let inTransaction = false;
    return {
      query: async (text, params) => {
        const upper = text.trim().toUpperCase();
        if (upper === 'BEGIN') {
          db.exec('BEGIN');
          inTransaction = true;
          return { rows: [] };
        }
        if (upper === 'COMMIT') {
          db.exec('COMMIT');
          inTransaction = false;
          return { rows: [] };
        }
        if (upper === 'ROLLBACK') {
          db.exec('ROLLBACK');
          inTransaction = false;
          return { rows: [] };
        }
        return runQuery(text, params);
      },
      release: () => {
        if (inTransaction) {
          try {
            db.exec('ROLLBACK');
          } catch {
            /* ignore */
          }
        }
      }
    };
  },
  end: async () => {
    db.close();
  },
  query
};

console.log(`[Nova Cloud] Using SQLite database (node:sqlite): ${dbPath}`);

module.exports = { pool, query, isSqlite: true };
