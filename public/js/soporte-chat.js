// ==========================================
// SISTEMA DE CHAT DE SOPORTE (REUTILIZABLE)
// ==========================================
let socketSoporte = null;
let usuarioActualSoporte = null;

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarChatSoporte();
});

async function inicializarChatSoporte() {
  try {
    // Obtener los datos del usuario logueado (para saber quién es)
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch('/api/users/perfil', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    usuarioActualSoporte = await res.json();
    
    // Conectar a Socket.io
    if (typeof io !== 'undefined') {
      socketSoporte = io();
      
      socketSoporte.on('nuevo:mensaje:soporte', (mensaje) => {
        // Si el mensaje NO es del usuario actual, lo mostramos como recibido
        if (mensaje.emisorId !== usuarioActualSoporte._id) {
          agregarMensajeAlChat(mensaje.texto, 'recibido');
        }
      });
    }
  } catch (error) { console.error(error); }
}

function abrirChatSoporte() {
  document.getElementById('chat-soporte-ventana').style.display = 'flex';
}

function cerrarChatSoporte() {
  document.getElementById('chat-soporte-ventana').style.display = 'none';
}

function enviarMensajeSoporte() {
  const input = document.getElementById('chat-soporte-input');
  const texto = input.value.trim();
  if (!texto || !socketSoporte || !usuarioActualSoporte) return;

  // Agregar al chat visual
  agregarMensajeAlChat(texto, 'enviado');
  input.value = '';

  // Enviar por Socket.io
  socketSoporte.emit('mensaje:soporte', {
    emisorId: usuarioActualSoporte._id,
    emisorNombre: usuarioActualSoporte.nombre,
    emisorRol: usuarioActualSoporte.rol,
    texto: texto,
    fecha: new Date()
  });
}

function agregarMensajeAlChat(texto, tipo) {
  const contenedor = document.getElementById('chat-soporte-mensajes');
  const div = document.createElement('div');
  div.style.cssText = `
    max-width: 80%;
    padding: 10px 15px;
    border-radius: 12px;
    margin-bottom: 10px;
    font-size: 0.9rem;
    ${tipo === 'enviado' 
      ? 'align-self: flex-end; background: #FF5A5F; color: white;' 
      : 'align-self: flex-start; background: #F1F5F9; color: #1E293B;'}
  `;
  div.textContent = texto;
  contenedor.appendChild(div);
  contenedor.scrollTop = contenedor.scrollHeight;
}
