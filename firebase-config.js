// firebase-config.js
// Configuración de Firebase

// Importaciones desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tu configuración
const firebaseConfig = {
    apiKey: "AIzaSyD8rpYKIsjLw6yOldNBlIyJSI6MSvAKF_k",
    authDomain: "produccion-codex.firebaseapp.com",
    projectId: "produccion-codex",
    storageBucket: "produccion-codex.firebasestorage.app",
    messagingSenderId: "1087026880559",
    appId: "1:1087026880559:web:ea457fd76afe356440a6da"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilitar persistencia offline
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Persistencia falló - múltiples pestañas abiertas');
    } else if (err.code == 'unimplemented') {
        console.log('Persistencia no soportada');
    }
});

console.log("🔥 Firebase conectado");

export { db, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp };