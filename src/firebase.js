import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMMZ-cCP3hy7dqm0bkCw53VNQAycEBxmU",
  authDomain: "dhuldev-nashta.firebaseapp.com",
  projectId: "dhuldev-nashta",
  storageBucket: "dhuldev-nashta.firebasestorage.app",
  messagingSenderId: "1094179536877",
  appId: "1:1094179536877:web:07aa7b9f8f35cb3df131e4",
  measurementId: "G-13GZCHH2ST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
