const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const { SCHEMA } = require('./schema');

let db = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'nova-browser.db');
}

function initDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(SCHEMA);

  return db;
}

function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDatabase, closeDatabase, getDbPath };
