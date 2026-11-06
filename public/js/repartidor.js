// ==========================================
// AUTENTICACIÓN AUTOMÁTICA PARA EL REPARTIDOR
// ==========================================
let token = null;

document.addEventListener('DOMContentLoaded', async () => {
  await hacerLoginAutomatico();
});

async function hacerLoginAutomatico() {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pedro@test.com', password: '123456' })
    });

    const data = await res.json();
    if (data.success && data.token) {
      token = data.token;
      console.log('✅ Sesión de repartidor iniciada.');
      await cargarPedidosDisponibles();
      await cargarMisEntregas();
    } else {
      alert('Error de autenticación del repartidor.');
    }
  } catch (error) { console.error(error); }
}

// ==========================================
// PEDIDOS DISPONIBLES
// ==========================================
async function cargarPedidosDisponibles() {
  try {
    const res = await fetch('/api/repartidores/pedidos-pendientes', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    const grid = document.getElementById('grid-disponibles');

    if (!data.pedidos || data.pedidos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94A3B8;">No hay pedidos disponibles ahora. ¡Espera un poco!</p>';
      return;
    }

    grid.innerHTML = data.pedidos.map(p => `
      <div class="pedido-card-rep">
        <div class="pedido-header">
          <div>
            <h3 style="margin:0; color:#1E293B;">${p.numeroOrden}</h3>
            <span style="font-size:0.85rem; color:#64748B;">Comercio: ${p.restauranteId.nombre}</span>
          </div>
          <div class="pedido-total-rep">$${p.total.toFixed(2)}</div>
        </div>
        
        <div class="ruta-info">
          <div>📍 <strong>Recoger en:</strong> ${p.restauranteId.direccion}</div>
          <div>🏠 <strong>Entregar en:</strong> ${p.direccionEntrega}</div>
          <div>📏 <strong>Distancia:</strong> ${p.distanciaKm} km</div>
        </div>

        <button class="btn-rep btn-aceptar" onclick="aceptarPedido('${p._id}')">Aceptar Pedido</button>
      </div>
    `).join('');
  } catch (error) { console.error(error); }
}

async function aceptarPedido(pedidoId) {
  try {
    const res = await fetch(`/api/repartidores/aceptar/${pedidoId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      mostrarNotificacion('¡Pedido Aceptado!', 'Ve al comercio a recoger el pedido.', 'exito');
      await cargarPedidosDisponibles();
      await cargarMisEntregas();
      cambiarSeccion('mis-entregas', document.querySelectorAll('.menu-item')[1]);
    }
  } catch (error) { console.error(error); }
}

// ==========================================
// MIS ENTREGAS
// ==========================================
async function cargarMisEntregas() {
  try {
    const res = await fetch('/api/pedidos/repartidor/mis-entregas', { headers: { 'Authorization': `Bearer ${token}` } });
    const pedidos = await res.json();
    const grid = document.getElementById('grid-mis-entregas');

    if (!pedidos || pedidos.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #94A3B8;">No tienes entregas en curso.</p>';
      return;
    }

    grid.innerHTML = pedidos.map(p => `
      <div class="pedido-card-rep">
        <div class="pedido-header">
          <div>
            <h3 style="margin:0; color:#1E293B;">${p.numeroOrden}</h3>
            <span style="font-size:0.85rem; color:#64748B;">Cliente: ${p.clienteId ? p.clienteId.nombre : 'Cliente'}</span>
          </div>
        </div>
        
        <div class="ruta-info">
          <div>🏠 <strong>Entregar en:</strong> ${p.direccionEntrega}</div>
        </div>

        <button class="btn-rep btn-entregar" onclick="entregarPedido('${p._id}', '${p.codigoSeguridad}')">Marcar como Entregado</button>
      </div>
    `).join('');
  } catch (error) { console.error(error); }
}

async function entregarPedido(pedidoId, pinCorrecto) {
  const pinIngresado = prompt(`Ingresa el código de seguridad de 4 dígitos:`);

  if (pinIngresado !== pinCorrecto) {
    alert('❌ Código de seguridad incorrecto. No puedes entregar el pedido.');
    return;
  }

  try {
    const res = await fetch(`/api/pedidos/${pedidoId}/despachar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ estado: 'entregado' })
    });
    if (res.ok) {
      mostrarNotificacion('¡Pedido Entregado!', 'El cliente ha recibido su pedido.', 'exito');
      await cargarMisEntregas();
    }
  } catch (error) { console.error(error); }
}

// ==========================================
// UTILIDADES
// ==========================================
function cambiarSeccion(idSeccion, boton) {
  document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(idSeccion);
  if (target) target.classList.add('active');
  if (boton) boton.classList.add('active');
}

function alternarDisponibilidad(checkbox) {
  const texto = document.getElementById('texto-disponibilidad');
  if (checkbox.checked) {
    texto.textContent = 'Estás en línea y disponible';
    texto.style.color = '#1E293B';
  } else {
    texto.textContent = 'Estás desconectado (No recibirás pedidos)';
    texto.style.color = '#EF4444';
  }
}

function mostrarNotificacion(titulo, mensaje, tipo = 'exito') {
  const modal = document.getElementById('modal-notificacion');
  const icono = document.getElementById('noti-icono');
  const btn = document.getElementById('noti-boton');
  document.getElementById('noti-titulo').textContent = titulo;
  document.getElementById('noti-mensaje').textContent = mensaje;
  if (tipo === 'exito') { icono.textContent = '✅'; btn.style.background = '#10B981'; } 
  else if (tipo === 'error') { icono.textContent = '❌'; btn.style.background = '#EF4444'; } 
  btn.textContent = 'Aceptar';
  btn.onclick = cerrarNotificacion;
  modal.style.display = 'flex';
}

function cerrarNotificacion() { document.getElementById('modal-notificacion').style.display = 'none'; }

function cerrarSesion(event) {
  event.stopPropagation();
  if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  }
}