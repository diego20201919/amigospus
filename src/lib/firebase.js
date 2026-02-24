import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCR2JiiA6PD9V-OKnOFiXu7pooF3ILaKH8",
  authDomain: "chatamigos-5c2ec.firebaseapp.com",
  projectId: "chatamigos-5c2ec",
  storageBucket: "chatamigos-5c2ec.firebasestorage.app",
  messagingSenderId: "522779719067",
  appId: "1:522779719067:android:8bbdd3a16d796e9cbedd3e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
