// 1. Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxvevJBALj730d93hCTZUSp7mqd_3EzXM",
  authDomain: "dappi-smart-delivery-driver.firebaseapp.com",
  projectId: "dappi-smart-delivery-driver",
  storageBucket: "dappi-smart-delivery-driver.firebasestorage.app",
  messagingSenderId: "31152518272",
  appId: "1:31152518272:web:ea3b9e635922e8f16ce265",
  measurementId: "G-MXSWTGJS6G"
};

// 2. Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);

// 3. CONFIGURAR APP CHECK (Para que funcione en localhost)
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; 
const appCheck = firebase.appCheck(app);
// Aquí está el ID de tu llave de Google Cloud:
appCheck.activate('6LdDWgwuAAAAAFjNpaYb7lpAV4_dFHvu_rISTwjZ', true); 

// 4. Inicializar la base de datos Firestore
const db = firebase.firestore();

// ==========================================
// FUNCIONES DEL MODAL (Login y Registro)
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
// FUNCIONES DE LOGIN (Simuladas por ahora)
// ==========================================
function loginSocial(red) {
  alert("La conexión con " + red + " estará disponible muy pronto.");
}

function loginManual(event) {
  event.preventDefault();
  alert("El inicio de sesión manual estará disponible pronto.");
  cerrarAuth();
}

// ==========================================
// FUNCIÓN PARA GUARDAR EN FIREBASE (Formulario Principal)
// ==========================================
async function registroRapido(event) {
  event.preventDefault();

  const nombre = document.getElementById('rapido-nombre').value;
  const email = document.getElementById('rapido-email').value;
  const telefono = document.getElementById('rapido-telefono').value;
  const rol = document.getElementById('rapido-rol').value;

  try {
    await db.collection('usuarios').add({
      nombre: nombre,
      email: email,
      telefono: telefono,
      rol: rol,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("¡Éxito! Tus datos han sido guardados en Firebase. Bienvenido a DeliveryPro.");
    document.getElementById('form-rapido').reset();
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
    alert("Hubo un error al guardar. Revisa la consola (F12) para más detalles.");
  }
}

// ==========================================
// FUNCIÓN PARA GUARDAR EN FIREBASE (Modal de Registro)
// ==========================================
async function registroManual(event) {
  event.preventDefault();

  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const telefono = document.getElementById('reg-telefono').value;
  const rol = document.getElementById('reg-rol').value;

  try {
    await db.collection('usuarios').add({
      nombre: nombre,
      email: email,
      telefono: telefono,
      rol: rol,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("¡Cuenta creada con éxito! Ya estás en nuestra base de datos.");
    document.querySelector('#auth-registro form').reset();
    cerrarAuth();
  } catch (error) {
    console.error("Error al guardar en Firebase:", error);
    alert("Hubo un error al guardar. Revisa la consola (F12).");
  }
}