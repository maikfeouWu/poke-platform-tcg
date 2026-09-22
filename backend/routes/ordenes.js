// routes/ordenes.js
// Implementa el Caso de Uso 2 "Procesar Compra y Checkout" del informe:
// transacción que relaciona USUARIO - PRODUCTO - ORDEN_COMPRA/DETALLE_ORDEN.
// Sigue el diagrama de secuencia: ValidarStock -> AutorizarPago(simulado)
// -> DescontarStock -> OrdenConfirmada.

const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ordenes  { id_usuario, metodo_envio, items: [{id_producto, cantidad}] }
router.post('/', (req, res) => {
  const { id_usuario, metodo_envio, items } = req.body;

  if (!id_usuario || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'id_usuario e items (>=1) son obligatorios.' });
  }

  const getProducto = db.prepare('SELECT * FROM PRODUCTO WHERE id_producto = ?');
  const bajarStock = db.prepare('UPDATE PRODUCTO SET cantidad_disponible = cantidad_disponible - ? WHERE id_producto = ? AND cantidad_disponible >= ?');
  const crearOrden = db.prepare('INSERT INTO ORDEN_COMPRA (id_usuario, total, estado, metodo_envio) VALUES (?, ?, ?, ?)');
  const crearDetalle = db.prepare('INSERT INTO DETALLE_ORDEN (id_orden, id_producto, cantidad, precio_historico) VALUES (?, ?, ?, ?)');

  const checkout = db.transaction((items) => {
    // 1) ValidarStock()
    let total = 0;
    const detalles = [];
    for (const item of items) {
      const producto = getProducto.get(item.id_producto);
      if (!producto) throw { code: 'NOT_FOUND', producto: item.id_producto };
      if (producto.cantidad_disponible < item.cantidad) {
        throw { code: 'SIN_STOCK', producto: producto.nombre };
      }
      total += producto.precio_actual * item.cantidad;
      detalles.push({ id_producto: producto.id_producto, cantidad: item.cantidad, precio: producto.precio_actual });
    }

    // 2) AutorizarPago(Monto,Tarjeta) — simulado como "aprobado" (webpay real
    //    se integraría aquí con la pasarela correspondiente)
    const pagoAprobado = true;
    if (!pagoAprobado) throw { code: 'PAGO_RECHAZADO' };

    // 3) Se crea la orden + detalle y se DescontarStock()
    const ordenInfo = crearOrden.run(id_usuario, total, 'pagado', metodo_envio || 'estandar');
    const idOrden = ordenInfo.lastInsertRowid;

    for (const d of detalles) {
      crearDetalle.run(idOrden, d.id_producto, d.cantidad, d.precio);
      const r = bajarStock.run(d.cantidad, d.id_producto, d.cantidad);
      if (r.changes === 0) throw { code: 'SIN_STOCK_RACE', producto: d.id_producto };
    }

    return { idOrden, total };
  });

  try {
    const { idOrden, total } = checkout(items);
    // 4) OrdenConfirmada() -> MostrarPantallaExito()
    res.status(201).json({ ok: true, id_orden: idOrden, total, estado: 'pagado' });
  } catch (err) {
    if (err.code === 'SIN_STOCK' || err.code === 'SIN_STOCK_RACE') {
      // MostrarErrorStockoPago()
      return res.status(409).json({ error: `Sin stock disponible para: ${err.producto}` });
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: `Producto ${err.producto} no existe.` });
    }
    if (err.code === 'PAGO_RECHAZADO') {
      return res.status(402).json({ error: 'Pago rechazado por la pasarela.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno procesando la orden.' });
  }
});

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT oc.id_orden, oc.fecha, oc.total, oc.estado, oc.metodo_envio, u.nombre AS cliente
    FROM ORDEN_COMPRA oc
    JOIN USUARIO u ON u.id_usuario = oc.id_usuario
    ORDER BY oc.fecha DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const orden = db.prepare(`
    SELECT oc.id_orden, oc.fecha, oc.total, oc.estado, oc.metodo_envio, u.nombre AS cliente, u.id_usuario
    FROM ORDEN_COMPRA oc JOIN USUARIO u ON u.id_usuario = oc.id_usuario
    WHERE oc.id_orden = ?
  `).get(req.params.id);
  if (!orden) return res.status(404).json({ error: 'Orden no encontrada.' });

  const detalles = db.prepare(`
    SELECT d.id_detalle, d.cantidad, d.precio_historico, p.nombre, p.tipo_producto
    FROM DETALLE_ORDEN d JOIN PRODUCTO p ON p.id_producto = d.id_producto
    WHERE d.id_orden = ?
  `).all(req.params.id);

  res.json({ ...orden, detalles });
});

// PUT /api/ordenes/:id/estado — Mantenedor: Administrador actualiza estado de pedido
router.put('/:id/estado', (req, res) => {
  const { estado } = req.body;
  const permitidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];
  if (!permitidos.includes(estado)) {
    return res.status(400).json({ error: `estado debe ser uno de: ${permitidos.join(', ')}` });
  }
  const info = db.prepare('UPDATE ORDEN_COMPRA SET estado = ? WHERE id_orden = ?').run(estado, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Orden no encontrada.' });
  res.json({ ok: true });
});

module.exports = router;
