let token = null;

document.addEventListener('DOMContentLoaded', async () => {
  await hacerLoginAutomatico();
});

async function hacerLoginAutomatico() {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@deliverypro.com', password: 'admin123' })
    });
    const data = await res.json();
    if (data.success && data.token) {
      token = data.token;
      await cargarDashboard();
      await cargarComercios();
      await cargarRepartidores();
      await cargarPagos();
      await cargarMonitoreo();
    } else {
      alert('Error de autenticación del administrador.');
    }
  } catch (error) { console.error(error); }
}

async function cargarDashboard() {
  try {
    const resUsers = await fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resUsers.ok) {
      const stats = await resUsers.json();
      document.getElementById('metric-usuarios').textContent = stats.totalUsers || 0;
      document.getElementById('metric-comercios').textContent = stats.totalPedidos || 0; // Simulado
      document.getElementById('metric-repartidores').textContent = stats.pedidosPendientes || 0; // Simulado
      document.getElementById('metric-ingresos').textContent = '$' + (stats.ingresosTotales || 0).toFixed(2);
    }

    const resPedidos = await fetch('/api/pedidos', { headers: { 'Authorization': `Bearer ${token}` } });
    const pedidos = await resPedidos.json();
    const tabla = document.getElementById('tabla-ultimos-pedidos');
    
    if (Array.isArray(pedidos) && pedidos.length > 0) {
      tabla.innerHTML = pedidos.slice(0, 5).map(p => `
        <tr>
          <td><strong>${p.numeroOrden}</strong></td>
          <td>${p.clienteId ? p.clienteId.nombre : 'Cliente'}</td>
          <td>${p.restauranteId ? p.restauranteId.nombre : 'Comercio'}</td>
          <td>$${p.total.toFixed(2)}</td>
          <td><span class="status-badge status-pendiente">${p.estado.toUpperCase()}</span></td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
        </tr>
      `).join('');
    } else {
      tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94A3B8;">No hay pedidos registrados.</td></tr>';
    }
  } catch (error) { console.error(error); }
}

async function cargarPagos() {
  const tabla = document.getElementById('tabla-pagos');
  // Simulación de datos de pagos a comercios
  tabla.innerHTML = `
    <tr>
      <td><strong>Pizzería Don Benavides</strong></td>
      <td>45</td>
      <td>$1,250.00</td>
      <td>$125.00</td>
      <td style="color:#34D399; font-weight:700;">$1,125.00</td>
      <td><button class="btn-success" onclick="alert('Pago registrado y enviado')">Pagar</button></td>
    </tr>
    <tr>
      <td><strong>Farmacia Central</strong></td>
      <td>12</td>
      <td>$350.00</td>
      <td>$35.00</td>
      <td style="color:#34D399; font-weight:700;">$315.00</td>
      <td><button class="btn-success" onclick="alert('Pago registrado y enviado')">Pagar</button></td>
    </tr>
  `;
}

async function cargarMonitoreo() {
  const tabla = document.getElementById('tabla-monitoreo');
  // Simulación de viajes en vivo
  tabla.innerHTML = `
    <tr>
      <td><strong>ORD-2436</strong></td>
      <td>Pizzería Don Benavides</td>
      <td>Cliente Juan</td>
      <td>Repartidor Pedro</td>
      <td><span class="status-badge status-pendiente">EN CAMINO</span></td>
      <td>3.2 km</td>
    </tr>
    <tr>
      <td><strong>ORD-2437</strong></td>
      <td>Farmacia Central</td>
      <td>María López</td>
      <td>Sin asignar</td>
      <td><span class="status-badge status-verificado">PENDIENTE</span></td>
      <td>1.5 km</td>
    </tr>
  `;
}

async function cargarComercios() {
  try {
    const res = await fetch('/api/restaurantes', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const tabla = document.getElementById('tabla-comercios');
    
    if (data.restaurantes && data.restaurantes.length > 0) {
      tabla.innerHTML = data.restaurantes.map(c => `
        <tr>
          <td><strong>${c.nombre}</strong></td>
          <td>${c.tipoComercio || 'Restaurante'}</td>
          <td>${c.telefono || 'N/A'}</td>
          <td><span class="status-badge status-verificado">Verificado</span></td>
          <td><button class="btn-action" onclick="alert('Función de edición próximamente')">Ver Detalles</button></td>
        </tr>
      `).join('');
    } else {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94A3B8;">No hay comercios registrados.</td></tr>';
    }
  } catch (error) { console.error(error); }
}

async function cargarRepartidores() {
  const tabla = document.getElementById('tabla-repartidores');
  tabla.innerHTML = `
    <tr>
      <td><strong>Repartidor Pedro</strong></td>
      <td>Moto</td>
      <td><span class="status-badge status-pendiente">Pendiente</span></td>
      <td><button class="btn-action" onclick="alert('Documentos aprobados')">Aprobar</button></td>
    </tr>
    <tr>
      <td><strong>Cristian Benavides</strong></td>
      <td>Bicicleta</td>
      <td><span class="status-badge status-verificado">Verificado</span></td>
      <td><button class="btn-action" onclick="alert('Documentos revisados')">Ver Detalles</button></td>
    </tr>
  `;
}

function guardarPrecios(e) {
  e.preventDefault();
  const base = document.getElementById('precio-base').value;
  const km = document.getElementById('precio-km').value;
  alert(`Precios actualizados: Tarifa Base Q${base}, por Km Q${km}`);
}

function crearAgente(e) {
  e.preventDefault();
  alert('Cuenta de agente de soporte creada exitosamente.');
  e.target.reset();
}

function cambiarSeccion(id, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  const target = document.getElementById('view-' + id);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

function cerrarSesion(event) {
  event.stopPropagation();
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    window.location.href = '/index.html';
  }
}
