import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function open() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "scholarsat.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      target_score INTEGER,
      test_date TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      response TEXT NOT NULL,
      correct INTEGER NOT NULL,
      time_ms INTEGER,
      source TEXT NOT NULL DEFAULT 'practice',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id, created_at);
    CREATE INDEX IF NOT EXISTS attempts_user_q ON attempts(user_id, question_id);
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      state TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      score_rw INTEGER,
      score_math INTEGER
    );
    CREATE TABLE IF NOT EXISTS vocab_progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word TEXT NOT NULL,
      known INTEGER NOT NULL,
      PRIMARY KEY (user_id, word)
    );
  `);
  // Migrations
  const userCols = new Set((db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name));
  if (!userCols.has("google_sub")) db.exec("ALTER TABLE users ADD COLUMN google_sub TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL");
  return db;
}

export const db: Database.Database = globalThis.__db ?? (globalThis.__db = open());
