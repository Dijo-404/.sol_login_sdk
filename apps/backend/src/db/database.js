import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "..", "data.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    wallet TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    domain TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reputation_cache (
    wallet TEXT PRIMARY KEY,
    score INTEGER NOT NULL,
    breakdown TEXT NOT NULL,
    indexed_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS verified_credentials (
    id TEXT PRIMARY KEY,
    wallet TEXT NOT NULL,
    type TEXT NOT NULL,
    threshold INTEGER,
    tx_sig TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    expires_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_credentials_wallet ON verified_credentials(wallet);
  CREATE INDEX IF NOT EXISTS idx_sessions_wallet ON sessions(wallet);
`);

export default db;
