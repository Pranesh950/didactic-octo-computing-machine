/**
 * Firebase configuration for StartupWiki Terminal.
 *
 * Project: startupwikiterminal
 * Services: Firestore (workspace data), Auth (Google login), Hosting (frontend)
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_nVHcuF1IC1KhnM54UArB5sAnnfkk3ME",
  authDomain: "startupwikiterminal.firebaseapp.com",
  projectId: "startupwikiterminal",
  storageBucket: "startupwikiterminal.firebasestorage.app",
  messagingSenderId: "909256609501",
  appId: "1:909256609501:web:1182b2f533b5b170455534",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
