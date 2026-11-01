const Database = require('better-sqlite3');
const db = new Database('bulletin.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS bulletin_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL UNIQUE,
    image_url TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_created ON bulletin_cache(created_at DESC);
`);

module.exports = db;