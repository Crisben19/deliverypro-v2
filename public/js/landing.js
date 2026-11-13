// ==========================================
// FUNCIONES DEL MODAL (Abrir, Cerrar, Cambiar)
// ==========================================
function abrirAuth(tipo) {
  document.getElementById('modal-auth').classList.add('active');
  cambiarAuth(tipo);
}

function cerrarAuth() {
  document.getElementById('modal-auth').classList.remove('active');
}

function cambiarAuth(tipo) {
  if (tipo === 'login') {
    document.getElementById('auth-login').style.display = 'block';
    document.getElementById('auth-registro').style.display = 'none';
  } else {
    document.getElementById('auth-login').style.display = 'none';
    document.getElementById('auth-registro').style.display = 'block';
  }
}

// ==========================================
// FUNCIONES DEL FAQ
// ==========================================
function toggleFaq(element) {
  const item = element.parentElement;
  item.classList.toggle('open');
}

// ==========================================
// REGISTRO RÁPIDO (Formulario de la página principal)
// ==========================================
async function registroRapido(event) {
  event.preventDefault();

  const nombre = document.getElementById('rapido-nombre').value;
  const email = document.getElementById('rapido-email').value;
  const telefono = document.getElementById('rapido-telefono').value;
  const rol = document.getElementById('rapido-rol').value;
  const password = document.getElementById('rapido-password').value; 

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, rol, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta.");
      document.getElementById('form-rapido').reset();
    } else {
      alert("Error: " + (data.mensaje || "No se pudo registrar"));
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Hubo un error de conexión con el servidor.");
  }
}

// ==========================================
// REGISTRO MANUAL (Formulario del Modal)
// ==========================================
async function registroManual(event) {
  event.preventDefault();

  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const telefono = document.getElementById('reg-telefono').value;
  const password = document.getElementById('reg-password').value;
  const rol = document.getElementById('reg-rol').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, rol, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("¡Cuenta creada con éxito! Revisa tu correo electrónico.");
      document.querySelector('#auth-registro form').reset();
      cerrarAuth();
    } else {
      alert("Error: " + (data.mensaje || "No se pudo registrar"));
    }
  } catch (error) {
    console.error("Error al registrar:", error);
    alert("Hubo un error de conexión con el servidor.");
  }
}

// ==========================================
// LOGIN CON REDIRECCIÓN POR ROL (La Magia)
// ==========================================
async function loginManual(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardamos los datos del usuario para usarlos en los paneles
      localStorage.setItem('usuarioDappi', JSON.stringify(data));
      
      alert("¡Bienvenido a DAPPI, " + data.nombre + "!");
      
      // REDIRECCIÓN SEGÚN EL ROL
      if (data.rol === 'cliente') {
        window.location.href = '/cliente.html';
      } else if (data.rol === 'restaurante') {
        window.location.href = '/restaurante.html';
      } else if (data.rol === 'repartidor') {
        window.location.href = '/repartidor.html';
      } else if (data.rol === 'admin') {
        window.location.href = '/admin.html'; 
      } else {
        alert("Rol no reconocido.");
      }
      
    } else {
      alert(data.mensaje || "Credenciales inválidas.");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error de conexión con el servidor.");
  }
}

function loginSocial(red) {
  alert("La conexión con " + red + " estará disponible muy pronto.");
}