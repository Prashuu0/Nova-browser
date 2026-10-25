const JSON_COLUMNS = new Set([
  'settings', 'messages', 'results', 'manifest', 'item_counts', 'event_data', 'tabs'
]);

const BOOL_COLUMNS = new Set([
  'email_verified', 'is_active', 'is_featured', 'is_published', 'enabled'
]);

function pgToSqlite(sql) {
  let s = sql;
  s = s.replace(/\$(\d+)/g, '?');
  s = s.replace(/\bNOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*days'/gi, "datetime('now', '-$1 days')");
  s = s.replace(/\bNOW\(\)/gi, "datetime('now')");
  s = s.replace(/\bCURRENT_DATE\b/gi, "date('now')");
  s = s.replace(/\bGREATEST\s*\(/gi, 'MAX(');
  s = s.replace(/\bTRUE\b/g, '1');
  s = s.replace(/\bFALSE\b/g, '0');
  return s;
}

function normalizeRow(row) {
  if (!row) return row;
  const out = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === 'string' && JSON_COLUMNS.has(key)) {
      try {
        out[key] = JSON.parse(value);
      } catch {
        /* keep string */
      }
    }
    if (BOOL_COLUMNS.has(key)) {
      out[key] = value === 1 || value === true || value === '1';
    }
  }
  return out;
}

function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

module.exports = { pgToSqlite, normalizeRow, normalizeRows, JSON_COLUMNS };
