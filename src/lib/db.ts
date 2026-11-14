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
  // Several processes can open a fresh database at once (parallel `next build` workers, restarts).
  // Wait for locks instead of failing with SQLITE_BUSY.
  db.pragma("busy_timeout = 10000");
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
    CREATE TABLE IF NOT EXISTS daily_votes (
      day INTEGER NOT NULL,
      section TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      choice TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (day, section, user_id)
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
  const addColumn = (name: string, ddl: string) => {
    if (userCols.has(name)) return;
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${name} ${ddl}`);
    } catch (e) {
      // Another process added it between our check and the ALTER.
      if (!String(e).includes("duplicate column")) throw e;
    }
  };
  addColumn("google_sub", "TEXT");
  addColumn("grad_class", "TEXT");
  addColumn("current_score", "INTEGER");
  addColumn("study_minutes", "INTEGER");
  addColumn("focus", "TEXT");
  addColumn("avatar", "TEXT");
  addColumn("theme", "TEXT DEFAULT 'system'");
  addColumn("accent_color", "TEXT DEFAULT 'red'");
  addColumn("compact_mode", "INTEGER DEFAULT 0");
  addColumn("reduce_animations", "INTEGER DEFAULT 0");
  if (!userCols.has("onboarded_at")) {
    addColumn("onboarded_at", "INTEGER");
    // Accounts that existed before onboarding shipped don't get sent through it.
    db.exec("UPDATE users SET onboarded_at = created_at WHERE onboarded_at IS NULL");
  }
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL");

  // Sessions table migrations
  const sessionCols = new Set((db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[]).map((c) => c.name));
  const addSessionColumn = (name: string, ddl: string) => {
    if (sessionCols.has(name)) return;
    try {
      db.exec(`ALTER TABLE sessions ADD COLUMN ${name} ${ddl}`);
    } catch (e) {
      if (!String(e).includes("duplicate column")) throw e;
    }
  };
  addSessionColumn("user_agent", "TEXT");
  addSessionColumn("ip", "TEXT");
  addSessionColumn("created_at", "INTEGER");
  addSessionColumn("last_active", "INTEGER");

  // Vocab progress table migrations
  const vocabCols = new Set((db.prepare("PRAGMA table_info(vocab_progress)").all() as { name: string }[]).map((c) => c.name));
  if (!vocabCols.has("starred")) {
    try {
      db.exec("ALTER TABLE vocab_progress ADD COLUMN starred INTEGER DEFAULT 0");
    } catch (e) {
      if (!String(e).includes("duplicate column")) throw e;
    }
  }

  return db;
}

/**
 * Opened lazily on first use, so importing this module (e.g. while `next build` collects page data
 * in parallel workers) never touches the database file.
 */
function get() {
  return (globalThis.__db ??= open());
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const d = get();
    const v = Reflect.get(d, prop, d);
    return typeof v === "function" ? v.bind(d) : v;
  },
});
