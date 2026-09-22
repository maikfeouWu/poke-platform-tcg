// api.js — helper de fetch al backend + carrito y sesión compartidos (localStorage)

const API_BASE = '/api';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw await res.json().catch(() => ({ error: 'Error de red' }));
  return res.json();
}

async function apiSend(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const CART_KEY = 'pokevault_cart_v1';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(producto) {
  const cart = getCart();
  const existing = cart.find((i) => i.id_producto === producto.id_producto);
  if (existing) {
    existing.cantidad += 1;
  } else {
    cart.push({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio_actual: producto.precio_actual,
      tipo_producto: producto.tipo_producto || producto.tipo,
      imagen_url: producto.imagen_url || null,
      cantidad: 1,
    });
  }
  saveCart(cart);
}

function removeFromCart(idProducto) {
  saveCart(getCart().filter((i) => i.id_producto !== idProducto));
}

function updateCartQty(idProducto, cantidad) {
  const cart = getCart();
  const item = cart.find((i) => i.id_producto === idProducto);
  if (item) {
    item.cantidad = Math.max(1, cantidad);
    saveCart(cart);
  }
}

function clearCart() {
  saveCart([]);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.cantidad, 0);
}

function updateCartCount() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = cartCount();
  });
}

function formatCLP(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
}

// --- Sesión de usuario (proyecto académico: sin contraseña, solo un
// identificador guardado en el navegador) --------------------------------
const SESSION_KEY = 'pokevault_session_v1';

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(usuario) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  reflectSessionInTopbar();
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  reflectSessionInTopbar();
}

function reflectSessionInTopbar() {
  const link = document.querySelector('a[href="cuenta.html"]');
  if (!link) return;
  const session = getSession();
  link.textContent = session ? `Hola, ${session.nombre.split(' ')[0]}` : 'Mi cuenta';
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  reflectSessionInTopbar();
});
