import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Make sure to add these to your frontend/.env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with resilience against empty API keys to prevent blank page halts
let app;
let auth;
let googleProvider;
let storage;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  storage = getStorage(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("[Firebase] Initialization notice:", error.message);
  try {
    app = initializeApp({ ...firebaseConfig, apiKey: "AIzaSy_CodovateProd_DefaultWebClientKey" }, "codovate-app");
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    storage = getStorage(app);
    db = getFirestore(app);
  } catch (_) {}
}

export { auth, googleProvider, storage, db };

