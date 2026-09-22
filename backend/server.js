// server.js — Punto de entrada del backend de Moka Tcg (proyecto Poke-Platform TCG)

const path = require('path');
const express = require('express');
const cors = require('cors');

require('./db'); // asegura que la BD exista antes de levantar rutas

const productosRouter = require('./routes/productos');
const usuariosRouter = require('./routes/usuarios');
const ordenesRouter = require('./routes/ordenes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/productos', productosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/ordenes', ordenesRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', servicio: 'moka-tcg-backend' }));

// Sirve el frontend estático (catálogo, checkout, cuenta, admin)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

if (!process.argv.includes('--reset-only')) {
  app.listen(PORT, () => {
    console.log(`\n  Moka Tcg backend corriendo en http://localhost:${PORT}\n`);
  });
}
