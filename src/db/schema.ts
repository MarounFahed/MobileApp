import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function db(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('mafiazo.db');
  }
  return _db;
}

const CURRENT_VERSION = 1;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS roster (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    photo_uri TEXT,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS roster_stats (
    roster_id TEXT PRIMARY KEY NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    mvp_sheriff INTEGER NOT NULL DEFAULT 0,
    mvp_mafia INTEGER NOT NULL DEFAULT 0,
    mvp_civilian INTEGER NOT NULL DEFAULT 0,
    mvp_bluffer INTEGER NOT NULL DEFAULT 0,
    role_godfather INTEGER NOT NULL DEFAULT 0,
    role_mafia INTEGER NOT NULL DEFAULT 0,
    role_sheriff INTEGER NOT NULL DEFAULT 0,
    role_police INTEGER NOT NULL DEFAULT 0,
    role_detective INTEGER NOT NULL DEFAULT 0,
    role_civilian INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (roster_id) REFERENCES roster(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    mode TEXT NOT NULL,
    play_mode TEXT NOT NULL,
    winner TEXT,
    settings_json TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    mvps_json TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS active_game (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    snapshot_json TEXT NOT NULL,
    saved_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );`,
];

export function init(): void {
  const d = db();
  d.execSync('PRAGMA foreign_keys = ON;');
  d.execSync('PRAGMA journal_mode = WAL;');
  SCHEMA.forEach((sql) => d.execSync(sql));
  const row = d.getFirstSync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['schema_version'],
  );
  if (!row) {
    d.runSync('INSERT INTO app_meta (key, value) VALUES (?, ?)', [
      'schema_version',
      String(CURRENT_VERSION),
    ]);
  }
}
