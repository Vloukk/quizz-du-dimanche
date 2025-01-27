// Import des fonctions nécessaires de Firebase SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Ta configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQo3HNC_ni-0wvgJJ7qAeNJ4fAs6hoprk",
  authDomain: "quizz-c64bf.firebaseapp.com",
  projectId: "quizz-c64bf",
  storageBucket: "quizz-c64bf.firebasestorage.app",
  messagingSenderId: "451114954570",
  appId: "1:451114954570:web:a9b3e2dc71df188196dbb3",
  measurementId: "G-8ETV5N1NQH"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Si tu veux utiliser Google Analytics
const analytics = getAnalytics(app);

// Initialiser Realtime Database
const database = getDatabase(app);

// Initialiser Firestore
const db = getFirestore(app);

// Exporter l'application Firebase pour l'utiliser ailleurs dans le projet
export { app, analytics, database, db };
