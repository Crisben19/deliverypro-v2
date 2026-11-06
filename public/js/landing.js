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

// 2. Inicializar Firebase (App, Auth, Firestore)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Inicializar App Check con reCAPTCHA V3
const appCheck = firebase.appCheck();
appCheck.activate(
  new firebase.appCheck.ReCaptchaV3Provider('6Lc33RiuAAAAAJPD_mAkRmUYwNcer0coeaaNjhcET'), 
  true
);

// ==========================================
// FUNCIONES DEL MODAL
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
// REGISTRO RÁPIDO (Formulario de la página)
// ==========================================
async function registroRapido(event) {
  event.preventDefault();

  const nombre = document.getElementById('rapido-nombre').value;
  const email = document.getElementById('rapido-email').value;
  const telefono = document.getElementById('rapido-telefono').value;
  const rol = document.getElementById('rapido-rol').value;
  
  const passwordTemporal = Math.random().toString(36).slice(-8) + "A1!";

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, passwordTemporal);
    const user = userCredential.user;

    await db.collection('usuarios').doc(user.uid).set({
      nombre: nombre,
      email: email,
      telefono: telefono,
      rol: rol,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("¡Éxito! Registro rápido completado. Bienvenido a DeliveryPro.");
    document.getElementById('form-rapido').reset();
  } catch (error) {
    console.error("Error al guardar:", error);
    if (error.code === 'auth/email-already-in-use') {
      alert("Este correo ya está registrado. Intenta iniciar sesión.");
    } else {
      alert("Hubo un error: " + error.message);
    }
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
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection('usuarios').doc(user.uid).set({
      nombre: nombre,
      email: email,
      telefono: telefono,
      rol: rol,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("¡Cuenta creada con éxito! Ya puedes iniciar sesión.");
    document.querySelector('#auth-registro form').reset();
    cerrarAuth();
  } catch (error) {
    console.error("Error al registrar:", error);
    if (error.code === 'auth/email-already-in-use') {
      alert("Este correo ya está registrado. Intenta iniciar sesión.");
    } else if (error.code === 'auth/weak-password') {
      alert("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
    } else {
      alert("Error al registrar: " + error.message);
    }
  }
}

// ==========================================
// LOGIN REAL
// ==========================================
async function loginManual(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    alert("¡Bienvenido de vuelta a DeliveryPro!");
    cerrarAuth();
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Correo o contraseña incorrectos.");
  }
}

// ==========================================
// LOGIN SOCIAL
// ==========================================
function loginSocial(red) {
  alert("La conexión con " + red + " estará disponible muy pronto.");
}