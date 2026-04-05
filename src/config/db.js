const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

let dbInstance;

function resolveDbPath() {
  const defaultPath = process.env.VERCEL ? "/tmp/finance.db" : "data/finance.db";
  const configuredPath = process.env.DB_PATH || defaultPath;
  return configuredPath === ":memory:" ? configuredPath : path.resolve(process.cwd(), configuredPath);
}

function ensureDbDirectory(dbPath) {
  if (dbPath === ":memory:") {
    return;
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDb() {
  if (!dbInstance) {
    const dbPath = resolveDbPath();
    ensureDbDirectory(dbPath);
    dbInstance = new Database(dbPath);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
  }

  return dbInstance;
}

function runMigrations(database = getDb()) {
  const schemaSql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  database.exec(schemaSql);
}

function initializeDatabase() {
  const db = getDb();
  runMigrations(db);
  return db;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDb,
  runMigrations,
  initializeDatabase,
  closeDb,
  resolveDbPath,
};
