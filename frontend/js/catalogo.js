// catalogo.js — Caso de Uso "Consultar Catálogo y Singles"

let currentTipo = 'single';
let chipState = { rareza: '', idioma: '', expansion: '' };
let lastProductos = [];

const grid = document.getElementById('cardGrid');
const resultsCount = document.getElementById('resultsCount');
const filterRail = document.getElementById('filterRail');
const groupExpansion = document.getElementById('groupExpansion');
const groupRareza = document.getElementById('groupRareza');
const groupIdioma = document.getElementById('groupIdioma');
const groupCondicion = document.getElementById('groupCondicion');
const groupAcabado = document.getElementById('groupAcabado');

async function loadExpansiones() {
  const container = document.getElementById('chipsExpansion');
  try {
    const expansiones = await apiGet('/productos/expansiones/todas');
    expansiones.forEach((e) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.value = e.id_expansion;
      chip.textContent = e.nombre_set;
      container.appendChild(chip);
    });
    setupChips('chipsExpansion', 'expansion');
  } catch (err) {
    console.error('No se pudieron cargar las expansiones', err);
  }
}

function setupChips(containerId, key) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      chipState[key] = chip.dataset.value;
      loadProductos();
    });
  });
}

function cardTemplate(p) {
  const RAREZAS_PREMIUM = ['EX', 'Full Art', 'Alt Art', 'Hyper Rare', 'Promo Card'];
  const isRare = RAREZAS_PREMIUM.includes(p.rareza);
  const sinStock = p.cantidad_disponible <= 0;
  const metaBits = [];
  if (p.nombre_set) metaBits.push(p.nombre_set);
  if (p.tipo_caja) metaBits.push(p.tipo_caja);
  if (p.tipo_accesorio) metaBits.push(`${p.tipo_accesorio}${p.marca ? ' · ' + p.marca : ''}`);

  return `
    <article class="tcg-card ${isRare ? 'is-rare' : ''}" data-open="${p.id_producto}">
      <div class="tcg-card-art">
        ${p.rareza ? `<span class="rarity-badge">${p.rareza}</span>` : ''}
        ${p.condicion ? `<span class="condition-badge">${p.condicion}</span>` : ''}
        ${p.imagen_url
          ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" onerror="this.remove(); this.parentElement.querySelector('.placeholder-glyph').style.display='block';">`
          : ''}
        <span class="placeholder-glyph" style="${p.imagen_url ? 'display:none;' : ''}">⬡</span>
      </div>
      <div class="tcg-card-body">
        <span class="card-set">${metaBits.join(' · ') || 'Moka Tcg'}</span>
        <span class="card-name">${p.nombre}</span>
        <span class="card-meta">${p.acabado ? p.acabado + ' · ' : ''}${p.idioma || ''}</span>
        ${sinStock ? '<span class="stock-flag">Sin stock disponible</span>' : ''}
        <div class="card-footer-row">
          <span class="card-price">${formatCLP(p.precio_actual)}</span>
          <button class="add-btn" data-add="${p.id_producto}" ${sinStock ? 'disabled' : ''} title="Añadir al carrito">+</button>
        </div>
      </div>
    </article>
  `;
}

async function loadProductos() {
  const params = new URLSearchParams();
  params.set('tipo_producto', currentTipo);

  if (currentTipo === 'single') {
    if (chipState.expansion) params.set('id_expansion', chipState.expansion);
    if (chipState.rareza) params.set('rareza', chipState.rareza);
    if (chipState.idioma) params.set('idioma', chipState.idioma);
    const condicion = document.getElementById('filterCondicion').value;
    const acabado = document.getElementById('filterAcabado').value;
    if (condicion) params.set('condicion', condicion);
    if (acabado) params.set('acabado', acabado);
  }

  const min = document.getElementById('filterPrecioMin')?.value;
  const max = document.getElementById('filterPrecioMax')?.value;
  if (min) params.set('precio_min', min);
  if (max) params.set('precio_max', max);

  resultsCount.textContent = 'Buscando…';
  try {
    const productos = await apiGet(`/productos?${params.toString()}`);
    renderGrid(productos);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">No fue posible cargar el catálogo. ¿Está el backend corriendo? (${err.error || 'error'})</div>`;
    resultsCount.textContent = '';
  }
}

function renderGrid(productos) {
  lastProductos = productos;
  if (!productos.length) {
    grid.innerHTML = '<div class="empty-state">Sin resultados para estos filtros. Prueba otra combinación.</div>';
    resultsCount.textContent = '0 resultados';
    return;
  }
  resultsCount.textContent = `${productos.length} resultado${productos.length === 1 ? '' : 's'}`;
  grid.innerHTML = productos.map(cardTemplate).join('');

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const producto = productos.find((p) => String(p.id_producto) === btn.dataset.add);
      addToCart({ ...producto, tipo_producto: currentTipo });
      btn.textContent = '✓';
      setTimeout(() => (btn.textContent = '+'), 700);
    });
  });

  grid.querySelectorAll('[data-open]').forEach((card) => {
    card.addEventListener('click', () => openProductModal(card.dataset.open));
  });
}

function setCategory(tipo) {
  currentTipo = tipo;
  document.querySelectorAll('#categoryTabs .tab-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.tipo === tipo));

  const isSingle = tipo === 'single';
  [groupExpansion, groupRareza, groupIdioma, groupCondicion, groupAcabado].forEach((g) => {
    g.style.display = isSingle ? 'block' : 'none';
  });
  filterRail.querySelector('h3').textContent = isSingle ? 'Filtrar singles' : `Filtrar ${tipo === 'sellado' ? 'sellados' : 'accesorios'}`;

  loadProductos();
}

// --- Modal de especificaciones -------------------------------------------
const modalOverlay = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');

async function openProductModal(id) {
  modalContent.innerHTML = '<p>Cargando ficha del producto…</p>';
  modalOverlay.style.display = 'flex';
  try {
    const p = await apiGet(`/productos/${id}`);
    const specs = [];
    if (p.nombre_set) specs.push(['Expansión', p.nombre_set]);
    if (p.rareza) specs.push(['Rareza', p.rareza]);
    if (p.condicion) specs.push(['Condición', p.condicion]);
    if (p.acabado) specs.push(['Acabado', p.acabado]);
    if (p.idioma) specs.push(['Idioma', p.idioma]);
    if (p.tipo_caja) specs.push(['Tipo de caja', p.tipo_caja]);
    if (p.tipo_accesorio) specs.push(['Tipo', p.tipo_accesorio]);
    if (p.marca) specs.push(['Marca', p.marca]);
    specs.push(['Stock disponible', p.cantidad_disponible]);
    if (p.precio_sugerido) specs.push(['Precio sugerido (mercado)', formatCLP(p.precio_sugerido)]);

    modalContent.innerHTML = `
      <div class="modal-grid">
        <div class="modal-art">
          ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}">` : '<span class="placeholder-glyph">⬡</span>'}
        </div>
        <div>
          <h2>${p.nombre}</h2>
          <p class="card-price" style="font-size:1.4rem; margin-bottom:14px;">${formatCLP(p.precio_actual)}</p>
          <table class="spec-table">
            ${specs.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
          </table>
          ${p.descripcion ? `<p style="margin-top:16px;">${p.descripcion}</p>` : ''}
          <button class="btn btn-primary btn-block" id="modalAddToCart" ${p.cantidad_disponible <= 0 ? 'disabled' : ''}>
            ${p.cantidad_disponible <= 0 ? 'Sin stock disponible' : 'Añadir al carrito'}
          </button>
        </div>
      </div>
    `;
    document.getElementById('modalAddToCart')?.addEventListener('click', () => {
      addToCart({ ...p, tipo_producto: p.tipo_producto });
      closeModal();
    });
  } catch (err) {
    modalContent.innerHTML = `<p>No se pudo cargar la ficha del producto.</p>`;
  }
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.getElementById('categoryTabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (btn) setCategory(btn.dataset.tipo);
});

document.getElementById('applyFilters').addEventListener('click', loadProductos);

setupChips('chipsRareza', 'rareza');
setupChips('chipsIdioma', 'idioma');

loadExpansiones();
setCategory('single');
