// /src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
// (Opcional) Analytics sólo si el entorno lo soporta
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAGAkg8tc0AV6WhGxnZISnI0OScaqQV1P0",
  authDomain: "corseweb-914bf.firebaseapp.com",
  projectId: "corseweb-914bf",
  storageBucket: "corseweb-914bf.firebasestorage.app",
  messagingSenderId: "771172579871",
  appId: "1:771172579871:web:47a0015fa0aa4213d2332a",
  measurementId: "G-GMR6X5C05Z"
};

export const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);
// (opcional) persistencia local para que la sesión quede guardada
setPersistence(auth, browserLocalPersistence).catch(() => {})

// (Opcional) Analytics
export let analytics = null;
analyticsSupported?.().then((ok) => {
  if (ok) analytics = getAnalytics(app);
});
