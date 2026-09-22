// checkout.js — Caso de Uso "Procesar Compra y Checkout"

const SHIPPING_COST = { estandar: 4990, retiro: 0 };
let metodoEnvio = 'estandar';

const categoryLabel = { single: 'Singles', sellado: 'Sellados', accesorio: 'Accesorios' };

async function loadClientes() {
  const select = document.getElementById('clienteSelect');
  const session = getSession();
  try {
    const usuarios = await apiGet('/usuarios');
    const clientes = usuarios.filter((u) => u.rol === 'cliente');
    (clientes.length ? clientes : usuarios).forEach((u) => {
      const opt = document.createElement('option');
      opt.value = u.id_usuario;
      opt.textContent = `${u.nombre} (${u.email})`;
      select.appendChild(opt);
    });
    if (session) {
      select.value = session.id_usuario;
      const notice = document.createElement('p');
      notice.className = 'notice';
      notice.style.marginTop = '6px';
      notice.textContent = `Comprando como ${session.nombre}. ¿No eres tú? Ve a "Mi cuenta" para cambiar de sesión.`;
      select.closest('.field').appendChild(notice);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartItems');

  if (!cart.length) {
    container.innerHTML = '<p style="color:var(--cream-dim); font-size:0.88rem;">Tu carrito está vacío. Vuelve al <a href="index.html" style="color:var(--teal);">catálogo</a>.</p>';
    updateTotals(0);
    return;
  }

  const groups = {};
  cart.forEach((item) => {
    const key = item.tipo_producto || 'single';
    groups[key] = groups[key] || [];
    groups[key].push(item);
  });

  let html = '';
  let subtotal = 0;
  Object.entries(groups).forEach(([tipo, items]) => {
    html += `<div class="order-group-label">${categoryLabel[tipo] || tipo}</div>`;
    items.forEach((item) => {
      const lineTotal = item.precio_actual * item.cantidad;
      subtotal += lineTotal;
      html += `
        <div class="order-line">
          <div class="order-line-thumb">
            ${item.imagen_url
              ? `<img src="${item.imagen_url}" alt="${item.nombre}">`
              : '<span class="placeholder-glyph" style="font-size:1.1rem;">⬡</span>'}
          </div>
          <div style="flex:1;">
            <div>${item.nombre}</div>
            <small>Cant. <input type="number" min="1" value="${item.cantidad}" data-qty="${item.id_producto}" style="width:48px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;"> · <a href="#" data-remove="${item.id_producto}" style="color:var(--rare-red);">quitar</a></small>
          </div>
          <span>${formatCLP(lineTotal)}</span>
        </div>`;
    });
  });

  container.innerHTML = html;
  updateTotals(subtotal);

  container.querySelectorAll('[data-qty]').forEach((input) => {
    input.addEventListener('change', () => {
      updateCartQty(Number(input.dataset.qty), Number(input.value));
      renderCart();
    });
  });
  container.querySelectorAll('[data-remove]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      removeFromCart(Number(link.dataset.remove));
      renderCart();
    });
  });
}

function updateTotals(subtotal) {
  const shipping = getCart().length ? SHIPPING_COST[metodoEnvio] : 0;
  document.getElementById('subtotalValue').textContent = formatCLP(subtotal);
  document.getElementById('shippingValue').textContent = shipping ? formatCLP(shipping) : 'Sin costo';
  document.getElementById('totalValue').textContent = formatCLP(subtotal + shipping);
}

document.getElementById('shipOptions').addEventListener('click', (e) => {
  const opt = e.target.closest('.ship-option');
  if (!opt) return;
  document.querySelectorAll('.ship-option').forEach((o) => o.classList.remove('is-selected'));
  opt.classList.add('is-selected');
  metodoEnvio = opt.dataset.metodo;
  renderCart();
});

document.getElementById('confirmarCompra').addEventListener('click', async () => {
  const banner = document.getElementById('resultBanner');
  const cart = getCart();
  const idUsuario = document.getElementById('clienteSelect').value;

  if (!cart.length) {
    banner.innerHTML = `<div class="result-banner error">Tu carrito está vacío.</div>`;
    return;
  }
  if (!idUsuario) {
    banner.innerHTML = `<div class="result-banner error">Selecciona un cliente para continuar.</div>`;
    return;
  }

  const btn = document.getElementById('confirmarCompra');
  btn.disabled = true;
  btn.textContent = 'Procesando pago…';

  try {
    const resp = await apiSend('POST', '/ordenes', {
      id_usuario: Number(idUsuario),
      metodo_envio: metodoEnvio,
      items: cart.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
    });
    banner.innerHTML = `<div class="result-banner success"><h3>Pedido confirmado #${resp.id_orden}</h3><p>Pago aprobado, stock actualizado y orden registrada. Total: ${formatCLP(resp.total)}.</p></div>`;
    clearCart();
    renderCart();
  } catch (err) {
    banner.innerHTML = `<div class="result-banner error"><h3>No pudimos procesar la compra</h3><p>${err.error || 'Error desconocido.'}</p></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar y pagar';
  }
});

loadClientes();
renderCart();
