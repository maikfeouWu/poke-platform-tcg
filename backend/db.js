// db.js — Conexión y arranque de la base de datos SQLite.
// Al primer arranque, ejecuta database/01_schema.sql y database/02_seed.sql
// para dejar la BD creada y funcional (requisito Etapa 1).

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'pokevault.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'database', '01_schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'database', '02_seed.sql');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const isNewDb = !fs.existsSync(DB_PATH);

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  db.exec(sql);
}

if (isNewDb) {
  console.log('[db] Base de datos no encontrada, inicializando esquema + datos de ejemplo...');
  runSqlFile(SCHEMA_PATH);
  runSqlFile(SEED_PATH);
  console.log('[db] Listo: backend/data/pokevault.db creada.');
} else {
  console.log('[db] Usando base de datos existente en backend/data/pokevault.db');
}

module.exports = db;
