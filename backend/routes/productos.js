// routes/productos.js
// - GET  /api/productos           -> Caso de Uso "Consultar Catálogo y Singles"
//   Filtro obligatorio: tipo_producto (se elige con las pestañas de categoría)
//   Filtros opcionales: id_expansion, rareza, idioma, condicion, acabado,
//   precio_min/precio_max (para singles); idioma para sellados.
// - GET  /api/productos/:id       -> detalle completo de un producto (ficha técnica)
// - POST /api/productos           -> Mantenedor Productos: crear (incluye subtipo)
// - PUT  /api/productos/:id       -> Mantenedor Productos: modificar (precio, stock,
//   imagen, descripción, precio sugerido y campos propios del subtipo)
// - DELETE /api/productos/:id     -> Mantenedor Productos: eliminar

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/productos?tipo_producto=single&id_expansion=1&rareza=Ultra%20Rare...
router.get('/', (req, res) => {
  const {
    tipo_producto,       // filtro obligatorio
    id_expansion,        // filtro opcional (singles)
    rareza,               // opcional
    idioma,               // opcional (singles y sellados)
    condicion,            // opcional
    acabado,              // opcional
    precio_min,           // opcional
    precio_max,           // opcional
  } = req.query;

  if (!tipo_producto) {
    return res.status(400).json({ error: 'El filtro "tipo_producto" es obligatorio.' });
  }

  if (tipo_producto === 'single') {
    const clauses = ['p.tipo_producto = ?'];
    const params = ['single'];

    if (id_expansion) { clauses.push('cs.id_expansion = ?'); params.push(id_expansion); }
    if (rareza)    { clauses.push('cs.rareza = ?');    params.push(rareza); }
    if (idioma)    { clauses.push('cs.idioma = ?');    params.push(idioma); }
    if (condicion) { clauses.push('cs.condicion = ?'); params.push(condicion); }
    if (acabado)   { clauses.push('cs.acabado = ?');   params.push(acabado); }
    if (precio_min) { clauses.push('p.precio_actual >= ?'); params.push(precio_min); }
    if (precio_max) { clauses.push('p.precio_actual <= ?'); params.push(precio_max); }

    const sql = `
      SELECT p.id_producto, p.nombre, p.precio_actual, p.cantidad_disponible, p.imagen_url,
             p.descripcion, p.precio_sugerido,
             cs.condicion, cs.rareza, cs.acabado, cs.idioma, e.nombre_set, e.id_expansion
      FROM PRODUCTO p
      JOIN CARTA_SINGLE cs ON cs.id_producto = p.id_producto
      JOIN EXPANSION e ON e.id_expansion = cs.id_expansion
      WHERE ${clauses.join(' AND ')}
      ORDER BY p.precio_actual ASC
    `;
    const rows = db.prepare(sql).all(...params);
    return res.json(rows);
  }

  // Sellados / accesorios
  const clauses = ['p.tipo_producto = ?'];
  const params = [tipo_producto];
  if (precio_min) { clauses.push('p.precio_actual >= ?'); params.push(precio_min); }
  if (precio_max) { clauses.push('p.precio_actual <= ?'); params.push(precio_max); }

  let extraSelect = '';
  let extraJoin = '';
  if (tipo_producto === 'sellado') {
    extraSelect = ', ps.tipo_caja, ps.idioma';
    extraJoin = 'JOIN PRODUCTO_SELLADO ps ON ps.id_producto = p.id_producto';
    if (idioma) { clauses.push('ps.idioma = ?'); params.push(idioma); }
  } else if (tipo_producto === 'accesorio') {
    extraSelect = ', a.tipo AS tipo_accesorio, a.marca';
    extraJoin = 'JOIN ACCESORIO a ON a.id_producto = p.id_producto';
  }

  const sql = `
    SELECT p.id_producto, p.nombre, p.precio_actual, p.cantidad_disponible, p.imagen_url,
           p.descripcion, p.precio_sugerido ${extraSelect}
    FROM PRODUCTO p
    ${extraJoin}
    WHERE ${clauses.join(' AND ')}
    ORDER BY p.precio_actual ASC
  `;
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Listado de expansiones (para el filtro opcional de set)
router.get('/expansiones/todas', (req, res) => {
  const rows = db.prepare('SELECT id_expansion, nombre_set, fecha_lanzamiento FROM EXPANSION ORDER BY fecha_lanzamiento DESC').all();
  res.json(rows);
});

// Detalle completo (ficha técnica / modal de especificaciones)
router.get('/:id', (req, res) => {
  const producto = db.prepare('SELECT * FROM PRODUCTO WHERE id_producto = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

  let detalle = null;
  if (producto.tipo_producto === 'single') {
    detalle = db.prepare(`
      SELECT cs.condicion, cs.rareza, cs.acabado, cs.idioma, e.nombre_set, e.id_expansion
      FROM CARTA_SINGLE cs JOIN EXPANSION e ON e.id_expansion = cs.id_expansion
      WHERE cs.id_producto = ?
    `).get(req.params.id);
  } else if (producto.tipo_producto === 'sellado') {
    detalle = db.prepare('SELECT tipo_caja, idioma FROM PRODUCTO_SELLADO WHERE id_producto = ?').get(req.params.id);
  } else if (producto.tipo_producto === 'accesorio') {
    detalle = db.prepare('SELECT tipo AS tipo_accesorio, marca FROM ACCESORIO WHERE id_producto = ?').get(req.params.id);
  }

  res.json({ ...producto, ...detalle });
});

// --- Mantenedor Productos (CRUD) --------------------------------------

router.post('/', (req, res) => {
  const {
    nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url,
    descripcion, precio_sugerido,
    // subtipo single
    condicion, rareza, acabado, idioma, id_expansion,
    // subtipo sellado
    tipo_caja, idioma_sellado,
    // subtipo accesorio
    tipo_accesorio, marca,
  } = req.body;

  if (!nombre || !precio_actual || !tipo_producto) {
    return res.status(400).json({ error: 'nombre, precio_actual y tipo_producto son obligatorios.' });
  }

  const crear = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO PRODUCTO (nombre, precio_actual, cantidad_disponible, tipo_producto, imagen_url, descripcion, precio_sugerido)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(nombre, precio_actual, cantidad_disponible || 0, tipo_producto, imagen_url || null, descripcion || null, precio_sugerido || null);

    const idProducto = info.lastInsertRowid;

    if (tipo_producto === 'single') {
      if (!condicion || !rareza || !acabado || !id_expansion) {
        throw { code: 'FALTAN_CAMPOS', mensaje: 'Para singles: condición, rareza, acabado e id_expansion son obligatorios.' };
      }
      db.prepare(`
        INSERT INTO CARTA_SINGLE (id_producto, condicion, rareza, acabado, idioma, id_expansion)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(idProducto, condicion, rareza, acabado, idioma || 'EN', id_expansion);
    } else if (tipo_producto === 'sellado') {
      if (!tipo_caja) throw { code: 'FALTAN_CAMPOS', mensaje: 'Para sellados: tipo_caja es obligatorio.' };
      db.prepare(`
        INSERT INTO PRODUCTO_SELLADO (id_producto, tipo_caja, idioma)
        VALUES (?, ?, ?)
      `).run(idProducto, tipo_caja, idioma_sellado || idioma || 'EN');
    } else if (tipo_producto === 'accesorio') {
      db.prepare(`
        INSERT INTO ACCESORIO (id_producto, tipo, marca)
        VALUES (?, ?, ?)
      `).run(idProducto, tipo_accesorio || 'General', marca || null);
    }

    return idProducto;
  });

  try {
    const idProducto = crear();
    res.status(201).json({ id_producto: idProducto });
  } catch (err) {
    if (err.code === 'FALTAN_CAMPOS') return res.status(400).json({ error: err.mensaje });
    console.error(err);
    res.status(500).json({ error: 'No se pudo crear el producto.' });
  }
});

router.put('/:id', (req, res) => {
  const {
    nombre, precio_actual, cantidad_disponible, imagen_url, descripcion, precio_sugerido,
    condicion, rareza, acabado, idioma, id_expansion,
    tipo_caja, idioma_sellado,
    tipo_accesorio, marca,
  } = req.body;

  const producto = db.prepare('SELECT tipo_producto FROM PRODUCTO WHERE id_producto = ?').get(req.params.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

  const actualizar = db.transaction(() => {
    db.prepare(`
      UPDATE PRODUCTO
      SET nombre = COALESCE(?, nombre),
          precio_actual = COALESCE(?, precio_actual),
          cantidad_disponible = COALESCE(?, cantidad_disponible),
          imagen_url = COALESCE(?, imagen_url),
          descripcion = COALESCE(?, descripcion),
          precio_sugerido = COALESCE(?, precio_sugerido)
      WHERE id_producto = ?
    `).run(nombre, precio_actual, cantidad_disponible, imagen_url, descripcion, precio_sugerido, req.params.id);

    if (producto.tipo_producto === 'single' && (condicion || rareza || acabado || idioma || id_expansion)) {
      db.prepare(`
        UPDATE CARTA_SINGLE
        SET condicion = COALESCE(?, condicion),
            rareza = COALESCE(?, rareza),
            acabado = COALESCE(?, acabado),
            idioma = COALESCE(?, idioma),
            id_expansion = COALESCE(?, id_expansion)
        WHERE id_producto = ?
      `).run(condicion, rareza, acabado, idioma, id_expansion, req.params.id);
    }
    if (producto.tipo_producto === 'sellado' && (tipo_caja || idioma_sellado || idioma)) {
      db.prepare(`
        UPDATE PRODUCTO_SELLADO
        SET tipo_caja = COALESCE(?, tipo_caja),
            idioma = COALESCE(?, idioma)
        WHERE id_producto = ?
      `).run(tipo_caja, idioma_sellado || idioma, req.params.id);
    }
    if (producto.tipo_producto === 'accesorio' && (tipo_accesorio || marca)) {
      db.prepare(`
        UPDATE ACCESORIO
        SET tipo = COALESCE(?, tipo),
            marca = COALESCE(?, marca)
        WHERE id_producto = ?
      `).run(tipo_accesorio, marca, req.params.id);
    }
  });

  try {
    actualizar();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar el producto.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM PRODUCTO WHERE id_producto = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    // ON DELETE RESTRICT: no se puede borrar un producto con ventas asociadas
    res.status(409).json({ error: 'No es posible eliminar: el producto tiene ventas asociadas.' });
  }
});

module.exports = router;
