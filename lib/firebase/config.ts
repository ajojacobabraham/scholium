import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyDr_ONYjWYhvKQ7kaWUa2ecAKhPf_IoRM8",

  authDomain: "scholium-9717e.firebaseapp.com",

  projectId: "scholium-9717e",

  storageBucket: "scholium-9717e.firebasestorage.app",

  messagingSenderId: "434637656063",

  appId: "1:434637656063:web:4a8db7067b1788dfe321ca"

};


// Prevents re-initialising the app on every hot reload in development
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
