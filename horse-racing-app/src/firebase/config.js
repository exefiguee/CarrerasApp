// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

// Configuración usando variables de entorno
// Las variables se leen desde el archivo .env (que NO se commitea)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Verificación de que las variables están configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("⚠️ ERROR: Variables de entorno de Firebase no configuradas correctamente");
  console.error("Asegurate de tener un archivo .env en la raíz del proyecto");
}

export const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);
// Persistencia local para que la sesión quede guardada
setPersistence(auth, browserLocalPersistence).catch(() => {})

// Analytics (opcional)
export let analytics = null;
analyticsSupported?.().then((ok) => {
  if (ok) analytics = getAnalytics(app);
});