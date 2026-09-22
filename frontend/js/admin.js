// admin.js — Mantenedores Productos / Usuarios + gestión de Pedidos

document.getElementById('adminTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  document.querySelectorAll('#adminTabs .tab-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  document.querySelectorAll('.admin-panel').forEach((p) => (p.style.display = 'none'));
  document.getElementById(`panel-${btn.dataset.panel}`).style.display = 'block';
});

// --- Formulario: mostrar/ocultar campos según la categoría elegida ------
const tipoSelect = document.getElementById('tipoProductoSelect');
function toggleCamposPorTipo() {
  const tipo = tipoSelect.value;
  document.querySelectorAll('.campos-single').forEach((el) => (el.style.display = tipo === 'single' ? '' : 'none'));
  document.querySelectorAll('.campos-sellado').forEach((el) => (el.style.display = tipo === 'sellado' ? '' : 'none'));
  document.querySelectorAll('.campos-accesorio').forEach((el) => (el.style.display = tipo === 'accesorio' ? '' : 'none'));
}
tipoSelect.addEventListener('change', toggleCamposPorTipo);
toggleCamposPorTipo();

async function loadExpansionesAdmin() {
  const select = document.getElementById('expansionSelectAdmin');
  try {
    const expansiones = await apiGet('/productos/expansiones/todas');
    select.innerHTML = expansiones.map((e) => `<option value="${e.id_expansion}">${e.nombre_set}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

// --- Productos ----------------------------------------------------------
async function loadProductosAdmin() {
  const tbody = document.getElementById('productosBody');
  tbody.innerHTML = '<tr><td colspan="9">Cargando…</td></tr>';
  try {
    const expansiones = await apiGet('/productos/expansiones/todas');
    const [sellados, accesorios, ...porExpansion] = await Promise.all([
      apiGet('/productos?tipo_producto=sellado'),
      apiGet('/productos?tipo_producto=accesorio'),
      ...expansiones.map((e) => apiGet(`/productos?tipo_producto=single&id_expansion=${e.id_expansion}`)),
    ]);
    const singles = porExpansion.flat();
    const productos = [...singles, ...sellados, ...accesorios];

    if (!productos.length) {
      tbody.innerHTML = '<tr><td colspan="9">Sin productos registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = productos.map((p) => {
      const categoria = p.tipo_caja ? 'sellado' : p.tipo_accesorio ? 'accesorio' : 'single';
      const esc = (v) => (v == null ? '' : String(v).replace(/"/g, '&quot;'));
      return `
      <tr>
        <td>${p.id_producto}</td>
        <td>${p.nombre}</td>
        <td>${categoria}</td>
        <td><input type="number" data-field="precio_actual" data-id="${p.id_producto}" value="${p.precio_actual}" style="width:90px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:4px 6px;"></td>
        <td><input type="number" data-field="precio_sugerido" data-id="${p.id_producto}" value="${p.precio_sugerido ?? ''}" placeholder="—" style="width:90px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:4px 6px;"></td>
        <td><input type="number" data-field="cantidad_disponible" data-id="${p.id_producto}" value="${p.cantidad_disponible}" style="width:64px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:4px 6px;"></td>
        <td><input type="text" data-field="imagen_url" data-id="${p.id_producto}" value="${esc(p.imagen_url)}" placeholder="https://…" style="width:150px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:4px 6px;"></td>
        <td><input type="text" data-field="descripcion" data-id="${p.id_producto}" value="${esc(p.descripcion)}" placeholder="Descripción…" style="width:160px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:4px 6px;"></td>
        <td class="row-actions">
          <button data-save="${p.id_producto}">Guardar</button>
          <button data-del="${p.id_producto}">Eliminar</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto?')) return;
        try {
          await apiSend('DELETE', `/productos/${btn.dataset.del}`);
          loadProductosAdmin();
        } catch (err) {
          if (err.pedidos && err.pedidos.length) {
            const lista = err.pedidos
              .map((p) => `  · Pedido #${p.id_orden} — ${p.estado} — ${new Date(p.fecha).toLocaleDateString('es-CL')}`)
              .join('\n');
            alert(
              `No se puede eliminar: este producto ya se vendió en ${err.pedidos.length} pedido(s):\n\n${lista}\n\n` +
              `Ve a la pestaña "Pedidos" y elimina esos pedidos primero (si son de prueba), y luego podrás borrar el producto.`
            );
          } else {
            alert(err.error || 'No se pudo eliminar.');
          }
        }
      });
    });

    tbody.querySelectorAll('[data-save]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.save;
        const row = btn.closest('tr');
        const payload = {};
        row.querySelectorAll('[data-field]').forEach((input) => {
          payload[input.dataset.field] = input.value === '' ? null : input.value;
        });
        try {
          await apiSend('PUT', `/productos/${id}`, payload);
          btn.textContent = '✓ Guardado';
          setTimeout(() => (btn.textContent = 'Guardar'), 1200);
        } catch (err) {
          alert(err.error || 'No se pudo actualizar el producto.');
        }
      });
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="9">Error cargando productos.</td></tr>`;
  }
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  try {
    await apiSend('POST', '/productos', {
      nombre: form.get('nombre'),
      precio_actual: Number(form.get('precio_actual')),
      precio_sugerido: form.get('precio_sugerido') ? Number(form.get('precio_sugerido')) : null,
      cantidad_disponible: Number(form.get('cantidad_disponible') || 0),
      tipo_producto: form.get('tipo_producto'),
      imagen_url: form.get('imagen_url') || null,
      descripcion: form.get('descripcion') || null,
      // single
      rareza: form.get('rareza') || null,
      condicion: form.get('condicion'),
      acabado: form.get('acabado'),
      idioma: form.get('idioma'),
      id_expansion: form.get('id_expansion') ? Number(form.get('id_expansion')) : null,
      // sellado
      tipo_caja: form.get('tipo_caja') || null,
      idioma_sellado: form.get('idioma_sellado'),
      // accesorio
      tipo_accesorio: form.get('tipo_accesorio') || null,
      marca: form.get('marca') || null,
    });
    e.target.reset();
    toggleCamposPorTipo();
    loadProductosAdmin();
  } catch (err) {
    alert(err.error || 'No se pudo crear el producto.');
  }
});

// --- Usuarios -------------------------------------------------------------
async function loadUsuariosAdmin() {
  const tbody = document.getElementById('usuariosBody');
  tbody.innerHTML = '<tr><td colspan="5">Cargando…</td></tr>';
  try {
    const usuarios = await apiGet('/usuarios');
    tbody.innerHTML = usuarios.map((u) => `
      <tr>
        <td>${u.id_usuario}</td>
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>${u.rol}</td>
        <td class="row-actions"><button data-del="${u.id_usuario}">Eliminar</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este usuario?')) return;
        try {
          await apiSend('DELETE', `/usuarios/${btn.dataset.del}`);
          loadUsuariosAdmin();
        } catch (err) {
          alert(err.error || 'No se pudo eliminar.');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando usuarios.</td></tr>';
  }
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  try {
    await apiSend('POST', '/usuarios', {
      nombre: form.get('nombre'),
      email: form.get('email'),
      direccion_envio: form.get('direccion_envio'),
      rol: form.get('rol'),
    });
    e.target.reset();
    loadUsuariosAdmin();
  } catch (err) {
    alert(err.error || 'No se pudo crear el usuario.');
  }
});

// --- Pedidos ----------------------------------------------------------------
async function loadPedidos() {
  const tbody = document.getElementById('pedidosBody');
  tbody.innerHTML = '<tr><td colspan="7">Cargando…</td></tr>';
  try {
    const pedidos = await apiGet('/ordenes');
    if (!pedidos.length) {
      tbody.innerHTML = '<tr><td colspan="7">Aún no hay pedidos. Ve al catálogo, agrega productos al carrito y confirma la compra en "Carrito y checkout".</td></tr>';
      return;
    }
    tbody.innerHTML = pedidos.map((o) => `
      <tr>
        <td>#${o.id_orden}</td>
        <td>${o.cliente}</td>
        <td>${new Date(o.fecha).toLocaleString('es-CL')}</td>
        <td>${formatCLP(o.total)}</td>
        <td><span class="status-pill ${o.estado}">${o.estado}</span></td>
        <td>
          <select data-estado="${o.id_orden}">
            ${['pendiente', 'pagado', 'enviado', 'cancelado'].map((s) => `<option value="${s}" ${s === o.estado ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td class="row-actions"><button data-del-orden="${o.id_orden}">Eliminar</button></td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-estado]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiSend('PUT', `/ordenes/${sel.dataset.estado}/estado`, { estado: sel.value });
          loadPedidos();
        } catch (err) {
          alert(err.error || 'No se pudo actualizar el estado.');
        }
      });
    });

    tbody.querySelectorAll('[data-del-orden]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delOrden;
        if (!confirm(`¿Eliminar el pedido #${id}? Esto también libera cualquier producto que estuviera bloqueado por esta venta.`)) return;
        try {
          await apiSend('DELETE', `/ordenes/${id}`);
          loadPedidos();
        } catch (err) {
          alert(err.error || 'No se pudo eliminar el pedido.');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7">Error cargando pedidos. Revisa que el backend esté corriendo.</td></tr>';
  }
}

document.getElementById('refreshPedidos').addEventListener('click', loadPedidos);

loadExpansionesAdmin();
loadProductosAdmin();
loadUsuariosAdmin();
loadPedidos();
