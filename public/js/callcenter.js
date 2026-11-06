// ==========================================
// LÓGICA DEL CALL CENTER
// ==========================================
let token = null;

document.addEventListener('DOMContentLoaded', async () => {
  await hacerLoginAutomatico();
});

async function hacerLoginAutomatico() {
  try {
    // Hacemos login con un usuario de soporte (creado previamente en la BD)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'soporte@deliverypro.com', password: 'soporte123' })
    });
    const data = await res.json();
    if (data.success && data.token) {
      token = data.token;
      await cargarTickets();
    } else {
      alert('Error de autenticación del agente de soporte.');
    }
  } catch (error) { console.error(error); }
}

async function cargarTickets() {
  // Simulamos la carga de tickets (en el futuro se conectaría a la BD)
  const ticketsDemo = [
    { id: 'T-001', tipo: 'Cliente', asunto: 'Mi pedido no llegó', prioridad: 'urgente', estado: 'abierto' },
    { id: 'T-002', tipo: 'Repartidor', asunto: 'Problema con la app', prioridad: 'media', estado: 'en_proceso' },
    { id: 'T-003', tipo: 'Comercio', asunto: 'El cobro no se refleja', prioridad: 'alta', estado: 'abierto' }
  ];

  const tabla = document.getElementById('tabla-tickets');
  if (ticketsDemo.length > 0) {
    tabla.innerHTML = ticketsDemo.map(t => `
      <tr>
        <td><strong>#${t.id}</strong></td>
        <td>${t.tipo}</td>
        <td>${t.asunto}</td>
        <td><span class="status-badge status-${t.prioridad}">${t.prioridad.toUpperCase()}</span></td>
        <td>${t.estado.toUpperCase()}</td>
        <td><button class="btn-action" onclick="atenderTicket('${t.id}')">Atender</button></td>
      </tr>
    `).join('');
  } else {
    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94A3B8;">No hay tickets pendientes.</td></tr>';
  }

  // Actualizar métricas
  document.getElementById('metric-abiertos').textContent = ticketsDemo.filter(t => t.estado === 'abierto').length;
  document.getElementById('metric-urgentes').textContent = ticketsDemo.filter(t => t.prioridad === 'urgente').length;
  document.getElementById('metric-proceso').textContent = ticketsDemo.filter(t => t.estado === 'en_proceso').length;
  document.getElementById('metric-resueltos').textContent = '45'; // Simulado
}

function atenderTicket(id) {
  alert(`Atendiendo el ticket #${id}. Registra la acción en la auditoría.`);
  // Aquí iría la lógica para abrir un modal con los detalles del ticket
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
