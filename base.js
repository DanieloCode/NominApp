// -----------------------------
// base.js
// Archivo de configuración e inicialización de Firebase
// -----------------------------

// Importamos la función principal para inicializar Firebase desde el SDK web
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

// Importamos la función para obtener Firestore (base de datos en la nube)
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// -----------------------------
// Configuración del proyecto Firebase
// -----------------------------
// Este objeto contiene las credenciales y datos necesarios para conectar tu app con Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDPWZl87a9c8NLrryto4B2dyf8I-XSFL4E",           // Clave de API pública
  authDomain: "nominaapp.firebaseapp.com",                    // Dominio de autenticación del proyecto
  projectId: "nominaapp",                                     // ID del proyecto en Firebase
  storageBucket: "nominaapp.appspot.com",                     // Bucket para subir archivos (no usado aún)
  messagingSenderId: "360209650145",                          // ID del remitente de mensajes (usado para notificaciones)
  appId: "1:360209650145:web:42351a2a81aba1f1b402a0"           // ID de la app web (único)
};

// -----------------------------
// Inicializar Firebase con la configuración del proyecto
// -----------------------------
const app = initializeApp(firebaseConfig);

// -----------------------------
// Obtener una instancia de la base de datos Firestore y exportarla
// -----------------------------
// Esto nos permite usar `db` desde otros archivos como `script.js`
export const db = getFirestore(app);