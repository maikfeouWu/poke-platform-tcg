// routes/usuarios.js — Mantenedor Usuarios (Consultar, Crear, Modificar, Eliminar)
// + búsqueda por email para el flujo simple de "Mi cuenta" (cuenta.html)

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id_usuario, nombre, email, direccion_envio, rol, creado_en FROM USUARIO ORDER BY creado_en DESC').all();
  res.json(rows);
});

// GET /api/usuarios/buscar/por-email?email=... -> usado por "Iniciar sesión"
// en cuenta.html (proyecto académico: sin contraseña, solo identificación por email)
router.get('/buscar/por-email', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Falta el parámetro email.' });
  const row = db.prepare('SELECT id_usuario, nombre, email, direccion_envio, rol FROM USUARIO WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'No existe una cuenta con ese email.' });
  res.json(row);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT id_usuario, nombre, email, direccion_envio, rol FROM USUARIO WHERE id_usuario = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { nombre, email, direccion_envio, rol } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: 'nombre y email son obligatorios.' });
  try {
    const info = db.prepare(`
      INSERT INTO USUARIO (nombre, email, direccion_envio, rol)
      VALUES (?, ?, ?, COALESCE(?, 'cliente'))
    `).run(nombre, email, direccion_envio || null, rol);
    res.status(201).json({ id_usuario: info.lastInsertRowid });
  } catch (err) {
    res.status(409).json({ error: 'Ese email ya está registrado.' });
  }
});

router.put('/:id', (req, res) => {
  const { nombre, direccion_envio, rol } = req.body;
  const info = db.prepare(`
    UPDATE USUARIO
    SET nombre = COALESCE(?, nombre),
        direccion_envio = COALESCE(?, direccion_envio),
        rol = COALESCE(?, rol)
    WHERE id_usuario = ?
  `).run(nombre, direccion_envio, rol, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM USUARIO WHERE id_usuario = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: 'No es posible eliminar: el usuario tiene órdenes de compra asociadas.' });
  }
});

module.exports = router;
