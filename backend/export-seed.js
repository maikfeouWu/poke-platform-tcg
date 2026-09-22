const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data', 'pokevault.db');
const SEED_PATH = path.join(__dirname, '..', 'database', '02_seed.sql');

if (!fs.existsSync(DB_PATH)) {
  console.error('[export-seed] No existe backend/data/pokevault.db todavía.');
  console.error('[export-seed] Corre "npm start" al menos una vez antes de exportar.');
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insertBlock(tabla, columnas, filas) {
  if (!filas.length) return '';
  const valores = filas
    .map((fila) => ' (' + columnas.map((c) => sqlVal(fila[c])).join(', ') + ')')
    .join(',\n');
  return `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES\n${valores};\n\n`;
}

const usuarios = db.prepare('SELECT nombre, email, direccion_envio, rol FROM USUARIO ORDER BY id_usuario').all();
const expansiones = db.prepare('SELECT nombre_set, fecha_lanzamiento FROM EXPANSION ORDER BY id_expansion').all();

// PRODUCTO + subtipos: se exportan agrupados por categoría, en el mismo
// orden en que la BD los tiene, preservando los id_producto reales para
// que las FK de los subtipos (CARTA_SINGLE, PRODUCTO_SELLADO, ACCESORIO)
// y de DETALLE_ORDEN sigan apuntando al producto correcto.
const productoCols = ['id_producto', 'nombre', 'precio_actual', 'cantidad_disponible', 'tipo_producto', 'imagen_url', 'descripcion', 'precio_sugerido'];
const singles = db.prepare(`SELECT ${productoCols.join(', ')} FROM PRODUCTO WHERE tipo_producto = 'single' ORDER BY id_producto`).all();
const sellados = db.prepare(`SELECT ${productoCols.join(', ')} FROM PRODUCTO WHERE tipo_producto = 'sellado' ORDER BY id_producto`).all();
const accesorios = db.prepare(`SELECT ${productoCols.join(', ')} FROM PRODUCTO WHERE tipo_producto = 'accesorio' ORDER BY id_producto`).all();

const cartaSingle = db.prepare('SELECT id_producto, condicion, rareza, acabado, idioma, id_expansion FROM CARTA_SINGLE ORDER BY id_producto').all();
const productoSellado = db.prepare('SELECT id_producto, tipo_caja, idioma FROM PRODUCTO_SELLADO ORDER BY id_producto').all();
const accesorio = db.prepare('SELECT id_producto, tipo, marca FROM ACCESORIO ORDER BY id_producto').all();

const ordenes = db.prepare('SELECT id_orden, id_usuario, total, estado, metodo_envio FROM ORDEN_COMPRA ORDER BY id_orden').all();
const detalles = db.prepare('SELECT id_orden, id_producto, cantidad, precio_historico FROM DETALLE_ORDEN ORDER BY id_detalle').all();

let out = `-- =====================================================================
-- Moka Tcg (proyecto Poke-Platform TCG) — Datos de ejemplo (Etapa 1)
-- Generado automáticamente por backend/export-seed.js a partir de la base
-- de datos local (backend/data/pokevault.db) el ${new Date().toISOString()}.
-- Incluye cualquier foto, precio o stock que hayas cambiado desde el panel
-- de administración: este archivo es el que ve cualquiera que clone el
-- repo, así que súbelo a git para que esos cambios se vean en GitHub.
-- =====================================================================

`;

out += insertBlock('USUARIO', ['nombre', 'email', 'direccion_envio', 'rol'], usuarios);
out += insertBlock('EXPANSION', ['nombre_set', 'fecha_lanzamiento'], expansiones);

out += '-- --- SINGLES (tipo_producto = \'single\') -------------------------------\n';
out += insertBlock('PRODUCTO', productoCols, singles);
out += insertBlock('CARTA_SINGLE', ['id_producto', 'condicion', 'rareza', 'acabado', 'idioma', 'id_expansion'], cartaSingle);

out += '-- --- SELLADOS (tipo_producto = \'sellado\') ------------------------------\n';
out += insertBlock('PRODUCTO', productoCols, sellados);
out += insertBlock('PRODUCTO_SELLADO', ['id_producto', 'tipo_caja', 'idioma'], productoSellado);

out += '-- --- ACCESORIOS (tipo_producto = \'accesorio\') --------------------------\n';
out += insertBlock('PRODUCTO', productoCols, accesorios);
out += insertBlock('ACCESORIO', ['id_producto', 'tipo', 'marca'], accesorio);

if (ordenes.length) {
  out += '-- --- Órdenes de ejemplo -------------------------------------------------\n';
  out += insertBlock('ORDEN_COMPRA', ['id_orden', 'id_usuario', 'total', 'estado', 'metodo_envio'], ordenes);
  out += insertBlock('DETALLE_ORDEN', ['id_orden', 'id_producto', 'cantidad', 'precio_historico'], detalles);
}

fs.writeFileSync(SEED_PATH, out.trimEnd() + '\n');

console.log('[export-seed] database/02_seed.sql actualizado con tu base de datos local.');
console.log(`[export-seed] Productos exportados: ${singles.length} singles, ${sellados.length} sellados, ${accesorios.length} accesorios.`);
console.log('[export-seed] Ahora corre: git add database/02_seed.sql && git commit -m "..." && git push');
