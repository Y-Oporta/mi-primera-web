// Importar Firebase desde CDN (para web simple)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCOkJxMjRnlONU7tVx9XGmKhnzLMR80SSQ",
    authDomain: "mi-primera-web-7daca.firebaseapp.com",
    projectId: "mi-primera-web-7daca",
    storageBucket: "mi-primera-web-7daca.firebasestorage.app",
    messagingSenderId: "885845436483",
    appId: "1:885845436483:web:47cdedbb2df999b38cccf6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore (BASE DE DATOS)
const db = getFirestore(app);

// Evento del formulario
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;

    try {
        await addDoc(collection(db, "formularios"), {
            nombre: nombre,
            email: email,
            fecha: new Date()
        });

        alert("Datos guardados correctamente");
        document.getElementById("formulario").reset();

    } catch (error) {
        alert("Error al guardar");
        console.error(error);
    }
});
