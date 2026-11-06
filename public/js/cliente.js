const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZDZmZDNmMWZhMTU5MTI2MDU4NTFhYSIsInJvbCI6ImNsaWVudGUiLCJpYXQiOjE3OTI0NzQ0MzEsImV4cCI6MTc5MjU2MDgzMX0.02bAbbm0LZBtL-mJaOU2czTZgowYesQiEaFr8f1-3Pc';

let carrito = [];
let restauranteActual = null;
let platoActual = null;
let extrasSeleccionados = [];
let metodoPago = 'efectivo';
let platosMenu = [];
let todosLosComercios = [];
let pedidosGlobales = []; 
let mapaDetalle = null;
let pedidoSeleccionadoDetalle = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!token) { alert('No has iniciado sesión.'); return; }
  await cargarComercios();
  await cargarMisPedidos();
});

// ============ COMERCIOS ============
async function cargarComercios() {
  try {
    const res = await fetch('/api/restaurantes');
    const data = await res.json();
    todosLosComercios = data.restaurantes || [];
    renderizarComercios(todosLosComercios);
  } catch (error) { 
    document.getElementById('grid-restaurantes').innerHTML = '<p class="loading-text">Error al cargar los comercios.</p>';
  }
}

function renderizarComercios(comercios) {
  const grid = document.getElementById('grid-restaurantes');
  if (comercios.length === 0) {
    grid.innerHTML = '<p class="loading-text">No hay comercios disponibles en esta categoría.</p>';
    return;
  }
  grid.innerHTML = comercios.map(r => `
    <div class="restaurante-card" onclick="abrirMenu('${r._id}', '${r.nombre.replace(/'/g, "\\'")}', '${(r.descripcion || '').replace(/'/g, "\\'")}', '${r.tipoComercio || 'Restaurante'}')">
      <div class="restaurante-img">
        ${r.logo ? `<img src="${r.logo}">` : '🏪'}
      </div>
      <div class="restaurante-info">
        <h3>${r.nombre}</h3>
        <p>${r.descripcion || 'Bienvenido'}</p>
        <span class="badge-cat" style="background:#F1F5F9; color:#475569;">${r.tipoComercio || 'Restaurante'}</span>
      </div>
    </div>
  `).join('');
}

function filtrarComercios(tipo) {
  const titulo = document.getElementById('titulo-seccion');
  if (tipo === '') {
    titulo.textContent = 'Todos los Comercios';
    renderizarComercios(todosLosComercios);
  } else {
    const filtrados = todosLosComercios.filter(c => c.tipoComercio === tipo);
    titulo.textContent = `Resultados: ${tipo}s`;
    renderizarComercios(filtrados);
  }
}

function buscarComercios(query) {
  if (!query) { renderizarComercios(todosLosComercios); return; }
  const filtrados = todosLosComercios.filter(r => 
    r.nombre.toLowerCase().includes(query.toLowerCase()) ||
    (r.tipoComercio || '').toLowerCase().includes(query.toLowerCase())
  );
  renderizarComercios(filtrados);
}

// ============ MENÚ ============
async function abrirMenu(comercioId, nombre, descripcion, tipo) {
  restauranteActual = comercioId;
  document.getElementById('menu-nombre').textContent = nombre;
  document.getElementById('menu-desc').textContent = descripcion;
  
  const banner = document.querySelector('.menu-banner');
  if (tipo === 'Farmacia') banner.style.background = '#0284C7';
  else if (tipo === 'Supermercado') banner.style.background = '#16A34A';
  else if (tipo === 'Floristería') banner.style.background = '#DB2777';
  else banner.style.background = '#FF5A5F';

  abrirModal('modal-menu');
  
  const lista = document.getElementById('menu-platos');
  lista.innerHTML = '<p class="loading-text">Cargando menú...</p>';

  try {
    const res = await fetch(`/api/menu/restaurante/${comercioId}`);
    platosMenu = await res.json();
    
    if (platosMenu.length === 0) {
      lista.innerHTML = '<p class="loading-text">Este comercio no tiene productos aún.</p>';
      return;
    }
    
    lista.innerHTML = platosMenu.map((p, i) => `
      <div class="menu-item-row">
        <div style="display: flex; gap: 15px; align-items: center;">
          <div class="menu-item-img">${p.imagen ? `<img src="${p.imagen}">` : '📦'}</div>
          <div>
            <h4 style="margin: 0; color: #1E293B;">${p.nombre}</h4>
            <p style="margin: 0; color: #64748B; font-size: 0.9rem;">${p.descripcion || ''}</p>
            <strong style="color: #FF5A5F;">$${p.precio.toFixed(2)}</strong>
          </div>
        </div>
        <button class="btn-primary" style="padding: 8px 15px;" onclick="abrirExtras(${i})">+ Agregar</button>
      </div>
    `).join('');
  } catch (error) { 
    lista.innerHTML = '<p class="loading-text">Error al cargar el menú.</p>';
  }
}

// ============ EXTRAS ============
function abrirExtras(index) {
  platoActual = platosMenu[index];
  extrasSeleccionados = [];
  document.getElementById('extras-nombre').textContent = platoActual.nombre;
  
  const container = document.getElementById('extras-grupos');
  if (!platoActual.gruposOpciones || platoActual.gruposOpciones.length === 0) {
    container.innerHTML = '<p style="color:#64748B;">Este producto no tiene opciones adicionales.</p>';
  } else {
    container.innerHTML = platoActual.gruposOpciones.map(grupo => `
      <div class="extra-group">
        <strong class="extra-group-title">${grupo.nombreGrupo}</strong>
        ${grupo.opciones.map(op => `
          <label class="extra-option">
            <input type="checkbox" onchange="toggleExtra('${op.nombre}', ${op.precioExtra})">
            ${op.nombre} ${op.precioExtra > 0 ? `(+$${op.precioExtra})` : ''}
          </label>
        `).join('')}
      </div>
    `).join('');
  }
  cerrarModal('modal-menu');
  abrirModal('modal-extras');
}

function toggleExtra(nombre, precio) {
  const index = extrasSeleccionados.findIndex(e => e.nombre === nombre);
  if (index > -1) extrasSeleccionados.splice(index, 1);
  else extrasSeleccionados.push({ nombre, precio });
}

function seleccionarPago(metodo) {
  metodoPago = metodo;
  document.getElementById('btn-pago-efectivo').classList.toggle('active', metodo === 'efectivo');
  document.getElementById('btn-pago-tarjeta').classList.toggle('active', metodo === 'tarjeta');
}

function confirmarAgregarAlCarrito() {
  const precioExtras = extrasSeleccionados.reduce((s, e) => s + e.precio, 0);
  carrito.push({ ...platoActual, precio: platoActual.precio + precioExtras, extras: extrasSeleccionados, metodoPago });
  actualizarCarritoUI();
  cerrarModal('modal-extras');
  notificar('¡Agregado!', `${platoActual.nombre} se añadió al carrito.`, '✅');
}

// ============ CARRITO ============
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('open'); }

function actualizarCarritoUI() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-price');
  const countEl = document.getElementById('cart-count');

  if (carrito.length === 0) {
    container.innerHTML = '<p class="empty-text">Tu carrito está vacío.</p>';
    totalEl.textContent = '$0.00'; countEl.textContent = '0';
    return;
  }
  let total = 0;
  container.innerHTML = carrito.map((item, i) => {
    total += item.precio;
    return `
      <div class="cart-item">
        <div>
          <strong style="color: #1E293B;">${item.nombre}</strong>
          <div style="font-size: 0.8rem; color: #FF5A5F;">${item.extras.map(e => e.nombre).join(', ') || ''}</div>
          <div style="color: #64748B;">$${item.precio.toFixed(2)}</div>
        </div>
        <button onclick="eliminarDelCarrito(${i})" style="background:none; border:none; cursor:pointer; color:#EF4444; font-size: 1.3rem;">✕</button>
      </div>
    `;
  }).join('');
  totalEl.textContent = '$' + total.toFixed(2);
  countEl.textContent = carrito.length;
}

function eliminarDelCarrito(index) { carrito.splice(index, 1); actualizarCarritoUI(); }

// ============ CREAR PEDIDO ============
function abrirModalDireccion() {
  if (carrito.length === 0) { notificar('Carrito Vacío', 'Agrega productos primero.', '⚠️'); return; }
  toggleCart(); abrirModal('modal-direccion');
}

async function enviarPedidoAlBackend() {
  const nombre = document.getElementById('input-nombre').value;
  const nit = document.getElementById('input-nit').value;
  const ciudad = document.getElementById('input-ciudad').value;
  const direccion = document.getElementById('input-direccion').value;

  if (!nombre || !nit || !ciudad || !direccion) {
    notificar('Faltan datos', 'Por favor completa todos los campos.', '⚠️');
    return;
  }

  const items = carrito.map(i => ({ menuItemId: i._id, cantidad: 1 }));

  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        restauranteId: restauranteActual,
        items,
        direccionEntrega: direccion,
        longitud: -90.5133,
        latitud: 14.6407,
        clienteNombre: nombre,
        clienteNit: nit,
        clienteCiudad: ciudad,
        metodoPago: metodoPago
      })
    });
    
    if (res.ok) {
      cerrarModal('modal-direccion');
      carrito = []; actualizarCarritoUI();
      notificar('¡Pedido Exitoso!', 'El comercio recibirá tu pedido en un momento.', '🎉');
      await cargarMisPedidos();
      cambiarSeccion('pedidos', document.querySelectorAll('.menu-item')[1]);
    } else {
      const error = await res.json();
      notificar('Error', error.error || 'No se pudo crear el pedido.', '❌');
    }
  } catch (error) { console.error(error); }
}

// ============ MIS PEDIDOS ============
async function cargarMisPedidos() {
  try {
    const res = await fetch('/api/pedidos', { headers: { 'Authorization': `Bearer ${token}` } });
    pedidosGlobales = await res.json();
    const tabla = document.getElementById('tabla-pedidos');

    if (!Array.isArray(pedidosGlobales) || pedidosGlobales.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" class="loading-text">Aún no tienes pedidos.</td></tr>';
      return;
    }
    tabla.innerHTML = pedidosGlobales.map(p => {
      let colorBg = '#FEF3C7', colorTx = '#D97706';
      if (p.estado === 'en_camino') { colorBg = '#DBEAFE'; colorTx = '#2563EB'; }
      else if (p.estado === 'entregado') { colorBg = '#D1FAE5'; colorTx = '#059669'; }
      else if (p.estado === 'aceptado' || p.estado === 'preparando') { colorBg = '#E0E7FF'; colorTx = '#4338CA'; }

      const botonFactura = p.uuidFactura 
        ? `<button class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; margin-left: 5px; background: #3B82F6; color: white; border: none; border-radius: 8px; cursor: pointer;" onclick="descargarFactura('${p._id}')">📄 Factura</button>`
        : '';

      return `
        <tr>
          <td><strong>${p.numeroOrden}</strong></td>
          <td>${p.restauranteId ? p.restauranteId.nombre : 'Comercio'}</td>
          <td>$${p.total.toFixed(2)}</td>
          <td><span class="badge-cat" style="background:${colorBg}; color:${colorTx};">${p.estado.toUpperCase()}</span></td>
          <td>
            <button class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="abrirDetallePedido('${p._id}')">Ver Detalles</button>
            ${botonFactura}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) { console.error(error); }
}

// ============ MODAL DE DETALLE Y MAPA ============
function abrirDetallePedido(pedidoId) {
  const pedido = pedidosGlobales.find(p => p._id === pedidoId);
  if (!pedido) return;

  pedidoSeleccionadoDetalle = pedido;

  document.getElementById('detalle-orden').textContent = pedido.numeroOrden;
  document.getElementById('detalle-total').textContent = '$' + pedido.total.toFixed(2);
  
  const repartidor = pedido.repartidorId ? pedido.repartidorId.nombre : 'Aún no asignado';
  document.getElementById('detalle-repartidor').textContent = repartidor;

  const estadoElement = document.getElementById('detalle-estado');
  estadoElement.textContent = pedido.estado.toUpperCase();
  
  if (pedido.estado === 'en_camino') {
    estadoElement.style.background = '#DBEAFE'; estadoElement.style.color = '#2563EB';
    estadoElement.textContent = 'EN CAMINO 🛵';
  } else if (pedido.estado === 'entregado') {
    estadoElement.style.background = '#D1FAE5'; estadoElement.style.color = '#059669';
    estadoElement.textContent = 'ENTREGADO ✅';
  } else if (pedido.estado === 'aceptado' || pedido.estado === 'preparando') {
    estadoElement.style.background = '#E0E7FF'; estadoElement.style.color = '#4338CA';
    estadoElement.textContent = 'PREPARANDO 👨‍🍳';
  }

  const contenedorPin = document.getElementById('contenedor-pin');
  if (pedido.estado === 'en_camino' && pedido.codigoSeguridad) {
    contenedorPin.style.display = 'block';
    document.getElementById('detalle-pin').textContent = pedido.codigoSeguridad;
  } else {
    contenedorPin.style.display = 'none';
  }

  const contenedorFactura = document.getElementById('contenedor-factura');
  if (pedido.uuidFactura) {
    contenedorFactura.style.display = 'block';
    document.getElementById('detalle-uuid').textContent = pedido.uuidFactura;
  } else {
    contenedorFactura.style.display = 'none';
  }

  abrirModal('modal-detalle-pedido');

  const mapaContainer = document.getElementById('mapa-detalle');
  if (pedido.estado === 'en_camino') {
    mapaContainer.style.display = 'block';
    setTimeout(() => {
      if (!mapaDetalle) {
        mapaDetalle = L.map('mapa-detalle').setView([14.6349, -90.5069], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaDetalle);
        L.marker([14.6407, -90.5133]).addTo(mapaDetalle);
      }
      mapaDetalle.invalidateSize();
    }, 100);
  } else {
    mapaContainer.style.display = 'none';
  }
}

// ============ DESCARGAR FACTURA ============
async function descargarFactura(pedidoId) {
  try {
    const res = await fetch(`/api/pedidos/${pedidoId}/factura`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      if (data.pdf) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdf}`;
        link.download = `factura-${pedidoId}.pdf`;
        link.click();
        notificar('Factura Descargada', 'La factura se ha descargado correctamente.', '✅');
      } else {
        notificar('Factura', `UUID: ${data.uuid}`, '✅');
      }
    } else {
      notificar('Error', data.error || 'No se pudo obtener la factura.', '❌');
    }
  } catch (error) { console.error(error); }
}

async function descargarFacturaDesdeDetalle() {
  if (pedidoSeleccionadoDetalle) {
    await descargarFactura(pedidoSeleccionadoDetalle._id);
  }
}

// ============ PERFIL ============
function abrirPerfil() { abrirModal('modal-perfil'); }
function guardarPerfil() {
  cerrarModal('modal-perfil');
  notificar('¡Perfil Guardado!', 'Tus datos se actualizaron.', '✅');
}

// ============ UTILIDADES ============
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('active'); }

function cambiarSeccion(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  const target = document.getElementById('view-' + id);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

function notificar(titulo, mensaje, icono = '✅') {
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; bottom: 30px; right: 30px; background: #1E293B; color: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 9999; font-family: Inter, sans-serif; display: flex; align-items: center; gap: 10px; transform: translateY(100px); opacity: 0; transition: all 0.3s ease;';
  toast.innerHTML = `<span style="font-size: 1.5rem;">${icono}</span> <div><strong style="display:block;">${titulo}</strong><span style="font-size:0.85rem; color:#CBD5E1;">${mensaje}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 10);
  setTimeout(() => { toast.style.transform = 'translateY(100px)'; toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function cerrarSesion(event) {
  event.stopPropagation();
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  }
}
