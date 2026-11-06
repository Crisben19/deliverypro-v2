let token = null;
let pedidosGlobales = [];
let cobroPendiente = null;
let datosRestauranteGlobal = null;
let carritoPOS = [];
let todosLosProductosPOS = [];
let metodoPagoCaja = 'efectivo';

document.addEventListener('DOMContentLoaded', async () => {
  await hacerLoginAutomatico();
});

async function hacerLoginAutomatico() {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pizza@test.com', password: '123456' })
    });
    const data = await res.json();
    if (data.success && data.token) {
      token = data.token;
      await cargarDatosRestaurante();
      await cargarDashboard();
      await cargarPedidosEntrantes();
      await cargarMenu();
      await cargarInventario();
      await cargarCaja();
      await cargarAlertasStock();
      await cargarPOS();
    }
  } catch (error) { console.error(error); }
}

async function cargarDatosRestaurante() {
  try {
    const res = await fetch('/api/restaurantes/mio', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      datosRestauranteGlobal = await res.json();
      document.getElementById('nombre-restaurante-sidebar').textContent = datosRestauranteGlobal.nombre;
      document.getElementById('avatar-inicial').textContent = datosRestauranteGlobal.nombre.charAt(0).toUpperCase();
      if (datosRestauranteGlobal.nit) {
        document.getElementById('config-nit').value = datosRestauranteGlobal.nit;
        document.getElementById('config-razon-social').value = datosRestauranteGlobal.razonSocial || '';
        document.getElementById('config-dir-fiscal').value = datosRestauranteGlobal.direccionFiscal || '';
        document.getElementById('config-digifact-user').value = datosRestauranteGlobal.digifactUser || '';
        document.getElementById('config-digifact-pass').value = datosRestauranteGlobal.digifactPass || '';
      }
    }
  } catch (e) { console.error(e); }
}

async function cargarDashboard() {
  try {
    const res = await fetch('/api/pedidos/restaurante/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const stats = await res.json();
      const f = (n) => '$' + (n || 0).toFixed(2);
      document.getElementById('stat-ventas-totales').textContent = f(stats.ventasTotales);
      document.getElementById('stat-cobro-efectivo').textContent = f(stats.cobroEfectivo);
      document.getElementById('stat-cobro-tarjeta').textContent = f(stats.cobroTarjeta);
      document.getElementById('stat-pedidos-hoy').textContent = stats.pedidosHoy || 0;
      document.getElementById('stat-ticket-promedio').textContent = f(stats.ticketPromedio);
      document.getElementById('stat-tiempo-promedio').textContent = (stats.tiempoPromedio || 0) + ' min';

      const totalCobrado = stats.cobroEfectivo + stats.cobroTarjeta;
      document.getElementById('donut-total').textContent = '$' + totalCobrado.toFixed(0);
      const donut = document.getElementById('donut-chart');
      if (totalCobrado > 0) {
        const porcentajeEfectivo = (stats.cobroEfectivo / totalCobrado) * 100;
        donut.style.background = `conic-gradient(#10B981 0% ${porcentajeEfectivo}%, #3B82F6 ${porcentajeEfectivo}% 100%)`;
      } else {
        donut.style.background = `conic-gradient(#E2E8F0 0% 100%)`;
      }
    }
  } catch (e) { console.error(e); }
}

async function cargarPedidosEntrantes() {
  try {
    const res = await fetch('/api/pedidos/restaurante', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    pedidosGlobales = await res.json();
    const tabla = document.getElementById('tabla-entrantes');
    const badge = document.getElementById('badge-entrantes');
    
    if (!Array.isArray(pedidosGlobales) || pedidosGlobales.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No hay pedidos activos.</td></tr>';
      badge.textContent = '0';
      return;
    }

    badge.textContent = pedidosGlobales.length;
    tabla.innerHTML = pedidosGlobales.map(p => {
      let botonAccion = '';
      if (p.estado === 'pendiente') {
        botonAccion = `<button class="btn-caja" onclick="abrirConfirmacionCobro('${p._id}', ${p.total})">💵 Cobrar</button>`;
      } else if (p.estado === 'aceptado' || p.estado === 'preparando') {
        botonAccion = `<button class="btn-comanda" style="background:#F59E0B;" onclick="despacharPedido('${p._id}', 'en_camino')">🛵 Despachar</button>`;
      } else if (p.estado === 'en_camino') {
        botonAccion = `<span style="color: #3B82F6; font-weight: 600; font-size: 0.85rem;">⏳ En Camino</span>`;
      }

      return `
        <tr>
          <td><strong>${p.numeroOrden}</strong></td>
          <td>${p.clienteId ? p.clienteId.nombre : 'Cliente'}</td>
          <td>$${p.total.toFixed(2)}</td>
          <td><span class="status-badge status-${p.estado}">${p.estado.toUpperCase()}</span></td>
          <td>
            <button class="btn-comanda" onclick="verComanda('${p._id}')">🖨️</button>
            ${botonAccion}
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) { console.error(e); }
}

async function cargarDespachados() {
  try {
    const res = await fetch('/api/pedidos/restaurante/despachados', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const pedidos = await res.json();
    const tabla = document.querySelector('#tabla-despachados');
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      tabla.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94A3B8;">No hay pedidos despachados.</td></tr>';
      return;
    }
    tabla.innerHTML = pedidos.map(p => {
      let horaTexto = 'Pendiente';
      if (p.fechaEntrega) {
        const fecha = new Date(p.fechaEntrega);
        horaTexto = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const repartidor = p.repartidorId ? p.repartidorId.nombre : 'Sin asignar';
      const checkEntregado = p.estado === 'entregado' ? '✅' : '⏳';
      return `
        <tr>
          <td><strong>${p.numeroOrden}</strong></td>
          <td>${p.clienteId ? p.clienteId.nombre : 'Cliente'} <br><small>🛵 ${repartidor} | ⏱️ ${horaTexto}</small></td>
          <td>$${p.total.toFixed(2)} ${checkEntregado}</td>
        </tr>
      `;
    }).join('');
  } catch (e) { console.error(e); }
}

async function cargarEstadisticas() {
  try {
    const res = await fetch('/api/pedidos/restaurante/estadisticas', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('stat-ingresos-historicos').textContent = '$' + stats.ingresosTotales.toFixed(2);
      document.getElementById('stat-plato-estrella').textContent = stats.platoEstrella;
      const chartContainer = document.getElementById('chart-ventas');
      const maxVenta = Math.max(...stats.ventasSemana.map(d => d.total)) || 1;
      chartContainer.innerHTML = stats.ventasSemana.map(d => {
        const altura = (d.total / maxVenta) * 100;
        return `
          <div class="chart-bar-col">
            <div class="chart-bar-value">$${d.total.toFixed(0)}</div>
            <div class="chart-bar" style="height: ${altura}%;"></div>
            <div class="chart-label">${d.dia}</div>
          </div>
        `;
      }).join('');
    }
  } catch (e) { console.error(e); }
}

async function cargarMenu() {
  try {
    const res = await fetch('/api/menu/mio', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const items = await res.json();
    const tabla = document.getElementById('tabla-menu');
    if (!Array.isArray(items) || items.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No tienes productos aún.</td></tr>';
      return;
    }
    tabla.innerHTML = items.map(item => `
      <tr>
        <td>${item.imagen ? `<img src="${item.imagen}" class="img-tabla">` : '📦'}</td>
        <td><strong>${item.nombre}</strong></td>
        <td>${item.categoria}</td>
        <td>$${item.precio.toFixed(2)}</td>
        <td><span class="status-badge status-despachado">Activo</span></td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

// ============ INVENTARIO ============
async function cargarInventario() {
  try {
    const res = await fetch('/api/inventario', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const items = await res.json();
    const tabla = document.getElementById('tabla-inventario');
    if (!Array.isArray(items) || items.length === 0) {
      tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94A3B8;">No hay insumos registrados.</td></tr>';
      return;
    }
    tabla.innerHTML = items.map(i => `
      <tr>
        <td><strong>${i.nombreProducto}</strong></td>
        <td>${i.tipo}</td>
        <td style="color: ${i.stockActual <= i.stockMinimo ? '#EF4444' : '#1E293B'}; font-weight: bold;">${i.stockActual}</td>
        <td>${i.stockMinimo}</td>
        <td>$${(i.precioCompra || 0).toFixed(2)}</td>
        <td>
          <button class="btn-caja" style="padding: 5px 10px; font-size: 0.8rem;" onclick="registrarMovimiento('${i._id}', 'compra')">+ Compra</button>
          <button class="btn-comanda" style="padding: 5px 10px; font-size: 0.8rem; background: #EF4444;" onclick="registrarMovimiento('${i._id}', 'venta')">- Venta</button>
          <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="toggleProducto('${i._id}')">${i.activo ? 'Desactivar' : 'Activar'}</button>
        </td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

async function cargarAlertasStock() {
  try {
    const res = await fetch('/api/inventario/alertas', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const alertas = await res.json();
      if (alertas.length > 0) {
        mostrarNotificacion('⚠️ Alerta de Stock Bajo', `Tienes ${alertas.length} producto(s) por agotarse. Revisa tu inventario.`, 'error');
      }
    }
  } catch (e) { console.error(e); }
}

function abrirModalNuevoInsumo() {
  document.getElementById('form-nuevo-insumo').reset();
  document.getElementById('modal-nuevo-insumo').style.display = 'flex';
}

async function guardarNuevoInsumo(e) {
  e.preventDefault();
  const body = {
    nombreProducto: document.getElementById('insumo-nombre').value,
    tipo: 'insumo',
    stockActual: parseInt(document.getElementById('insumo-stock').value),
    stockMinimo: parseInt(document.getElementById('insumo-minimo').value),
    precioCompra: parseFloat(document.getElementById('insumo-precio').value) || 0,
    precioVenta: 0
  };

  try {
    const res = await fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      cerrarModal('modal-nuevo-insumo');
      mostrarNotificacion('¡Insumo Agregado!', 'El insumo se ha añadido al inventario.', 'exito');
      await cargarInventario();
    }
  } catch (error) { console.error(error); }
}

async function registrarMovimiento(id, tipo) {
  const cantidad = prompt(`Ingresa la cantidad para registrar ${tipo === 'compra' ? 'la compra' : 'la venta'}:`);
  if (!cantidad || isNaN(cantidad)) return;

  try {
    const res = await fetch(`/api/inventario/${id}/movimiento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ tipoMovimiento: tipo, cantidad: parseInt(cantidad), nota: `${tipo} registrada` })
    });
    if (res.ok) {
      mostrarNotificacion('¡Movimiento Registrado!', 'El inventario se actualizó correctamente.', 'exito');
      await cargarInventario();
    }
  } catch (error) { console.error(error); }
}

async function toggleProducto(id) {
  try {
    const res = await fetch(`/api/inventario/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      mostrarNotificacion('Producto Actualizado', 'El estado del producto cambió.', 'exito');
      await cargarInventario();
    }
  } catch (error) { console.error(error); }
}

// ============ CAJA VIRTUAL (POS) ============
async function cargarPOS() {
  try {
    const res = await fetch('/api/menu/mio', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    todosLosProductosPOS = await res.json();
    if (Array.isArray(todosLosProductosPOS)) {
      renderizarProductosPOS(todosLosProductosPOS);
      renderizarCategoriasPOS();
    }
  } catch (error) { console.error(error); }
}

function renderizarProductosPOS(productos) {
  const grid = document.getElementById('pos-grid-productos');
  if (!productos || productos.length === 0) {
    grid.innerHTML = '<p style="text-align:center; color:#94A3B8;">No hay productos en el catálogo.</p>';
    return;
  }
  grid.innerHTML = productos.map(p => `
    <div class="pos-producto-card" onclick="agregarAlCarritoPOS('${p._id}', '${p.nombre.replace(/'/g, "\\'")}', ${p.precio})">
      <div class="pos-producto-img">
        ${p.imagen ? `<img src="${p.imagen}" style="width:100%; height:100%; object-fit:cover;">` : '🍔'}
      </div>
      <div class="pos-producto-info">
        <h4>${p.nombre}</h4>
        <p>$${p.precio.toFixed(2)}</p>
      </div>
    </div>
  `).join('');
}

function renderizarCategoriasPOS() {
  const categorias = [...new Set(todosLosProductosPOS.map(p => p.categoria))];
  const contenedor = document.getElementById('pos-lista-categorias');
  contenedor.innerHTML = categorias.map(cat => `
    <button class="pos-cat-btn" onclick="filtrarCategoriaPOS('${cat}', this)">${cat}</button>
  `).join('');
}

function filtrarCategoriaPOS(categoria, btn) {
  document.querySelectorAll('.pos-cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  
  if (categoria === '') {
    renderizarProductosPOS(todosLosProductosPOS);
  } else {
    const filtrados = todosLosProductosPOS.filter(p => p.categoria === categoria);
    renderizarProductosPOS(filtrados);
  }
}

function filtrarProductosPOS(query) {
  if (!query) {
    renderizarProductosPOS(todosLosProductosPOS);
    return;
  }
  const filtrados = todosLosProductosPOS.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()));
  renderizarProductosPOS(filtrados);
}

function agregarAlCarritoPOS(id, nombre, precio) {
  const existente = carritoPOS.find(item => item.id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    carritoPOS.push({ id, nombre, precio, cantidad: 1 });
  }
  renderizarCarritoPOS();
}

function renderizarCarritoPOS() {
  const contenedor = document.getElementById('pos-carrito-items');
  if (carritoPOS.length === 0) {
    contenedor.innerHTML = '<p style="text-align:center; color:#94A3B8; margin-top:20px;">El carrito está vacío.</p>';
  } else {
    contenedor.innerHTML = carritoPOS.map(item => `
      <div class="pos-item-carrito">
        <div>
          <h5>${item.nombre}</h5>
          <p>$${item.precio.toFixed(2)} x ${item.cantidad}</p>
        </div>
        <div class="cantidad-controls">
          <button onclick="modificarCantidadPOS('${item.id}', -1)">-</button>
          <span>${item.cantidad}</span>
          <button onclick="modificarCantidadPOS('${item.id}', 1)">+</button>
        </div>
      </div>
    `).join('');
  }
  actualizarTotalesPOS();
}

function modificarCantidadPOS(id, cambio) {
  const item = carritoPOS.find(i => i.id === id);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) {
    carritoPOS = carritoPOS.filter(i => i.id !== id);
  }
  renderizarCarritoPOS();
}

function actualizarTotalesPOS() {
  const subtotal = carritoPOS.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const iva = subtotal * 0.12;
  const total = subtotal + iva;

  document.getElementById('pos-subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('pos-iva').textContent = '$' + iva.toFixed(2);
  document.getElementById('pos-total').textContent = '$' + total.toFixed(2);
}

// ============ FACTURACIÓN ============
function abrirModalFacturacion() {
  if (carritoPOS.length === 0) {
    mostrarNotificacion('Carrito Vacío', 'Agrega productos para facturar.', 'error');
    return;
  }
  const total = carritoPOS.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) * 1.12;
  document.getElementById('factura-total').textContent = '$' + total.toFixed(2);
  document.getElementById('factura-formulario').style.display = 'block';
  document.getElementById('factura-print').style.display = 'none';
  document.getElementById('modal-facturacion').classList.add('active');
}

function seleccionarPagoCaja(metodo) {
  metodoPagoCaja = metodo;
  const btnEfectivo = document.getElementById('btn-pago-efectivo');
  const btnTarjeta = document.getElementById('btn-pago-tarjeta');
  
  if (metodo === 'efectivo') {
    btnEfectivo.style.background = '#10B981';
    btnEfectivo.style.color = 'white';
    btnTarjeta.style.background = '#F1F5F9';
    btnTarjeta.style.color = '#475569';
  } else {
    btnTarjeta.style.background = '#10B981';
    btnTarjeta.style.color = 'white';
    btnEfectivo.style.background = '#F1F5F9';
    btnEfectivo.style.color = '#475569';
  }
}

async function buscarClientePorNIT(nit) {
  if (!nit || nit.length < 5) return;
  try {
    const res = await fetch(`/api/clientes/buscar/${nit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('factura-nombre').value = data.cliente.nombre;
      document.getElementById('factura-ciudad').value = data.cliente.ciudad || '';
      document.getElementById('factura-direccion').value = data.cliente.direccion || '';
    }
  } catch (error) { console.error(error); }
}

async function confirmarFacturacion() {
  const clienteNombre = document.getElementById('factura-nombre').value;
  const clienteNit = document.getElementById('factura-nit').value;
  const clienteCiudad = document.getElementById('factura-ciudad').value;
  const clienteDireccion = document.getElementById('factura-direccion').value;

  if (!clienteNombre || !clienteNit) {
    mostrarNotificacion('Faltan datos', 'El nombre y el NIT son obligatorios.', 'error');
    return;
  }

  const items = carritoPOS.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad }));

  try {
    const res = await fetch('/api/caja/facturar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        clienteNombre, clienteNit, clienteCiudad, clienteDireccion,
        items, metodoPago: metodoPagoCaja
      })
    });

    if (res.ok) {
      const data = await res.json();
      
      // Generar la factura para imprimir
      const subtotal = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
      const iva = subtotal * 0.12;
      const total = subtotal + iva;
      
      const facturaHTML = `
        <div style="font-family: 'Courier New', monospace; color: #000; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
            <h1 style="margin: 0; font-size: 1.5rem;">${datosRestauranteGlobal.razonSocial || datosRestauranteGlobal.nombre}</h1>
            <p style="margin: 5px 0;">NIT: ${datosRestauranteGlobal.nit || 'C/F'}</p>
            <p style="margin: 0;">${datosRestauranteGlobal.direccionFiscal || datosRestauranteGlobal.direccion}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Factura No:</strong> ${data.venta.numeroFactura}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${clienteNombre}</p>
            <p style="margin: 5px 0;"><strong>NIT:</strong> ${clienteNit}</p>
            <p style="margin: 5px 0;"><strong>Ciudad:</strong> ${clienteCiudad}</p>
            <p style="margin: 5px 0;"><strong>Dirección:</strong> ${clienteDireccion}</p>
            <p style="margin: 5px 0;"><strong>Método de Pago:</strong> ${metodoPagoCaja.toUpperCase()}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; padding: 5px;">Cant</th>
                <th style="text-align: left; padding: 5px;">Producto</th>
                <th style="text-align: right; padding: 5px;">Precio</th>
                <th style="text-align: right; padding: 5px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(i => `
                <tr>
                  <td style="padding: 5px;">${i.cantidad}</td>
                  <td style="padding: 5px;">${i.nombre}</td>
                  <td style="text-align: right; padding: 5px;">$${i.precio.toFixed(2)}</td>
                  <td style="text-align: right; padding: 5px;">$${(i.precio * i.cantidad).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="border-top: 2px solid #000; padding-top: 10px; text-align: right;">
            <p style="margin: 5px 0;">Subtotal: $${subtotal.toFixed(2)}</p>
            <p style="margin: 5px 0;">IVA (12%): $${iva.toFixed(2)}</p>
            <p style="margin: 10px 0; font-size: 1.3rem; font-weight: bold;">TOTAL: $${total.toFixed(2)}</p>
          </div>
          
          ${data.facturaFEL && data.facturaFEL.success ? `
            <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 0.8rem;">
              <p style="margin: 2px 0;"><strong>UUID SAT:</strong> ${data.facturaFEL.authNumber}</p>
              <p style="margin: 2px 0;"><strong>Serie:</strong> ${data.facturaFEL.batch || ''} <strong>No:</strong> ${data.facturaFEL.serial || ''}</p>
              <p style="margin: 2px 0;"><strong>Fecha Certificación:</strong> ${data.facturaFEL.enrolledTimeStamp || ''}</p>
            </div>
          ` : ''}
          
          <p style="text-align: center; margin-top: 30px;">¡Gracias por su compra!</p>
          <p style="text-align: center; font-size: 0.8rem;">DeliveryPro - Factura Electrónica</p>
        </div>
      `;
      
      document.getElementById('factura-print').innerHTML = facturaHTML;
      document.getElementById('factura-formulario').style.display = 'none';
      document.getElementById('factura-print').style.display = 'block';
      
      setTimeout(() => {
        if (confirm('¿Deseas imprimir la factura?')) {
          window.print();
        }
      }, 300);

      carritoPOS = [];
      document.getElementById('factura-nit').value = '';
      document.getElementById('factura-nombre').value = '';
      document.getElementById('factura-ciudad').value = '';
      document.getElementById('factura-direccion').value = '';
      renderizarCarritoPOS();
      await cargarCaja();
    } else {
      const error = await res.json();
      mostrarNotificacion('Error', error.error || 'No se pudo facturar.', 'error');
    }
  } catch (error) { console.error(error); }
}

async function cargarCaja() {
  try {
    const res = await fetch('/api/caja', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    // Opcional: mostrar historial de ventas
  } catch (e) { console.error(e); }
}

// ============ REPORTES Y ARQUEO ============
async function cargarReporte(periodo) {
  let desde = new Date();
  let hasta = new Date();
  
  if (periodo === 'hoy') {
    desde.setHours(0, 0, 0, 0);
  } else if (periodo === 'semana') {
    desde.setDate(desde.getDate() - 7);
  } else if (periodo === 'mes') {
    desde.setMonth(desde.getMonth() - 1);
  }

  try {
    const res = await fetch(`/api/caja/reportes?desde=${desde.toISOString()}&hasta=${hasta.toISOString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('resumen-reporte').style.display = 'grid';
      document.getElementById('rep-efectivo').textContent = '$' + data.totalEfectivo;
      document.getElementById('rep-tarjeta').textContent = '$' + data.totalTarjeta;
      document.getElementById('rep-total').textContent = '$' + data.totalGeneral;
      document.getElementById('rep-cantidad').textContent = data.totalVentas;
    }
  } catch (error) { console.error(error); }
}

async function realizarArqueo() {
  if (!confirm('¿Estás seguro de cerrar la caja? Se generará un arqueo del día.')) return;

  try {
    const res = await fetch('/api/caja/arqueo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ fecha: new Date().toISOString() })
    });
    if (res.ok) {
      const data = await res.json();
      mostrarNotificacion('✅ Arqueo Exitoso', `Total del día: $${data.arqueo.totalGeneral}. Caja cerrada.`, 'exito');
      await cargarCaja();
    }
  } catch (error) { console.error(error); }
}

// ============ FUNCIONES GENERALES ============
async function guardarDatosFiscales(e) {
  e.preventDefault();
  
  const nit = document.getElementById('config-nit').value;
  const razonSocial = document.getElementById('config-razon-social').value;
  const direccionFiscal = document.getElementById('config-dir-fiscal').value;
  const certificadorFEL = document.getElementById('config-certificador').value;
  const digifactUser = document.getElementById('config-digifact-user').value;
  const digifactPass = document.getElementById('config-digifact-pass').value;
  
  const firmaInput = document.getElementById('config-firma');
  let firmaSubida = false;

  if (firmaInput.files && firmaInput.files[0]) {
    const formDataFirma = new FormData();
    formDataFirma.append('firma', firmaInput.files[0]);
    
    try {
      const resFirma = await fetch('/api/restaurantes/firma-electronica', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataFirma
      });
      if (resFirma.ok) firmaSubida = true;
    } catch (error) { console.error(error); }
  }

  try {
    const res = await fetch('/api/restaurantes/mio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        nit, razonSocial, direccionFiscal, 
        certificadorFEL, 
        digifactUser, 
        digifactPass 
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      const statusDiv = document.getElementById('fel-status');
      
      if (data.restaurante.felHabilitado) {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#D1FAE5';
        statusDiv.style.color = '#059669';
        statusDiv.innerHTML = '✅ <strong>Facturación FEL Habilitada</strong><br>Tu comercio puede emitir facturas con su propio NIT.';
      } else {
        statusDiv.style.display = 'block';
        statusDiv.style.background = '#FEF3C7';
        statusDiv.style.color = '#D97706';
        statusDiv.innerHTML = '⚠️ <strong>Configuración incompleta</strong><br>Ingresa tu NIT, usuario Digifact y selecciona un certificador para habilitar la facturación.';
      }

      mostrarNotificacion('¡Datos Guardados!', 'La información fiscal se actualizó correctamente.', 'exito');
      await cargarDatosRestaurante();
    }
  } catch (error) { console.error(error); }
}

function abrirModalNuevoPlato() {
  document.getElementById('form-nuevo-plato').reset();
  document.getElementById('modal-nuevo-plato').style.display = 'flex';
}

async function guardarNuevoPlato(e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('nombre', document.getElementById('plato-nombre').value);
  formData.append('precio', document.getElementById('plato-precio').value);
  formData.append('categoria', document.getElementById('plato-categoria').value);
  formData.append('descripcion', document.getElementById('plato-descripcion').value);
  const imagen = document.getElementById('plato-imagen').files[0];
  if (imagen) formData.append('imagen', imagen);
  try {
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      cerrarModal('modal-nuevo-plato');
      mostrarNotificacion('¡Producto Agregado!', 'El producto se ha añadido a tu catálogo.', 'exito');
      await cargarMenu();
      await cargarPOS();
    }
  } catch (err) { console.error(err); }
}

function verComanda(pedidoId) {
  const pedido = pedidosGlobales.find(p => p._id === pedidoId);
  if (!pedido) return;
  document.getElementById('ticket-orden').textContent = pedido.numeroOrden;
  document.getElementById('ticket-cliente').textContent = pedido.clienteId ? pedido.clienteId.nombre : 'Cliente';
  document.getElementById('ticket-total').textContent = '$' + pedido.total.toFixed(2);
  document.getElementById('ticket-items').innerHTML = pedido.items.map(i => `<div class="ticket-item"><span>${i.cantidad}x ${i.nombre}</span><span>$${(i.precio * i.cantidad).toFixed(2)}</span></div>`).join('');
  if (datosRestauranteGlobal) {
    document.getElementById('ticket-nit').textContent = datosRestauranteGlobal.nit || 'No configurado';
    document.getElementById('ticket-razon-social').textContent = datosRestauranteGlobal.razonSocial || 'No configurado';
    document.getElementById('ticket-dir-fiscal').textContent = datosRestauranteGlobal.direccionFiscal || 'No configurado';
  }
  document.getElementById('modal-comanda').style.display = 'flex';
}

function abrirConfirmacionCobro(pedidoId, total) {
  cobroPendiente = pedidoId;
  document.getElementById('noti-titulo').textContent = 'Confirmar Cobro';
  document.getElementById('noti-mensaje').textContent = `¿Cobrar $${total.toFixed(2)}?`;
  document.getElementById('noti-icono').textContent = '💵';
  const btn = document.getElementById('noti-boton');
  btn.textContent = 'Confirmar';
  btn.style.background = '#10B981';
  btn.onclick = ejecutarCobro; 
  document.getElementById('modal-notificacion').style.display = 'flex';
}

async function ejecutarCobro() {
  if (!cobroPendiente) return;
  const idParaCobrar = cobroPendiente; 
  cerrarNotificacion();
  try {
    const res = await fetch(`/api/pedidos/${idParaCobrar}/cobrar`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      await fetch(`/api/pedidos/${idParaCobrar}/despachar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado: 'aceptado' })
      });
      await cargarPedidosEntrantes();
      await cargarDashboard();
    }
  } catch (e) { console.error(e); }
}

async function despacharPedido(pedidoId, nuevoEstado) {
  document.getElementById('modal-notificacion').style.display = 'none'; 
  try {
    const res = await fetch(`/api/pedidos/${pedidoId}/despachar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      await cargarPedidosEntrantes();
      await cargarDashboard();
      await cargarDespachados();
    }
  } catch (e) { console.error(e); }
}

function mostrarNotificacion(titulo, mensaje, tipo = 'exito') {
  document.getElementById('noti-titulo').textContent = titulo;
  document.getElementById('noti-mensaje').textContent = mensaje;
  document.getElementById('noti-icono').textContent = tipo === 'exito' ? '✅' : '❌';
  const btn = document.getElementById('noti-boton');
  btn.textContent = 'Aceptar';
  btn.style.background = tipo === 'exito' ? '#10B981' : '#EF4444';
  btn.onclick = cerrarNotificacion;
  document.getElementById('modal-notificacion').style.display = 'flex';
}

function cerrarModal(id) { 
  if(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id).style.display = 'none';
  } else {
    document.getElementById('modal-comanda').style.display = 'none';
  }
}

function cerrarNotificacion() { 
  document.getElementById('modal-notificacion').style.display = 'none'; 
  cobroPendiente = null; 
}

function cambiarSeccion(idSeccion, boton) {
  document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(idSeccion);
  if (target) target.classList.add('active');
  if (boton) boton.classList.add('active');

  if (idSeccion === 'pedidos-despachados') cargarDespachados();
  if (idSeccion === 'estadisticas') cargarEstadisticas();
  if (idSeccion === 'inventario') cargarInventario();
  if (idSeccion === 'caja-virtual') cargarPOS(); 
}

function abrirPerfil() {
  document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
  document.getElementById('perfil').classList.add('active');
  if (datosRestauranteGlobal) {
    document.getElementById('perfil-nombre').value = datosRestauranteGlobal.nombre;
    document.getElementById('perfil-categoria').value = datosRestauranteGlobal.categoria;
    document.getElementById('perfil-telefono').value = datosRestauranteGlobal.telefono;
    document.getElementById('perfil-direccion').value = datosRestauranteGlobal.direccion;
    document.getElementById('perfil-tipo-comercio').value = datosRestauranteGlobal.tipoComercio || 'Restaurante';
    document.getElementById('perfil-nombre-header').textContent = datosRestauranteGlobal.nombre;
    document.getElementById('perfil-categoria-header').textContent = datosRestauranteGlobal.categoria;
  }
}

async function guardarPerfil(e) {
  e.preventDefault();
  const fd = new FormData();
  fd.append('nombre', document.getElementById('perfil-nombre').value);
  fd.append('categoria', document.getElementById('perfil-categoria').value);
  fd.append('telefono', document.getElementById('perfil-telefono').value);
  fd.append('direccion', document.getElementById('perfil-direccion').value);
  fd.append('tipoComercio', document.getElementById('perfil-tipo-comercio').value);
  const logo = document.getElementById('perfil-logo');
  if (logo.files[0]) fd.append('logo', logo.files[0]);
  try {
    const res = await fetch('/api/restaurantes/mio', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
    if (res.ok) {
      mostrarNotificacion('¡Actualizado!', 'Perfil guardado correctamente.', 'exito');
      await cargarDatosRestaurante();
    }
  } catch (e) { console.error(e); }
}

function alternarEstado(cb) {
  mostrarNotificacion(cb.checked ? 'Comercio Abierto' : 'Comercio Pausado', cb.checked ? 'Recibiendo pedidos.' : 'No recibirás pedidos.', cb.checked ? 'exito' : 'error');
}

function cerrarSesion(event) {
  event.stopPropagation();
  document.getElementById('noti-titulo').textContent = 'Cerrar Sesión';
  document.getElementById('noti-mensaje').textContent = '¿Estás seguro?';
  document.getElementById('noti-icono').textContent = '🚪';
  const btn = document.getElementById('noti-boton');
  btn.textContent = 'Sí, Salir';
  btn.style.background = '#EF4444';
  btn.onclick = function() { localStorage.removeItem('token'); window.location.href = '/index.html'; };
  document.getElementById('modal-notificacion').style.display = 'flex';
}