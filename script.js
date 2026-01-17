import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔥 Configuración Firebase
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
const db = getFirestore(app);

// Referencias HTML
const formulario = document.getElementById("formulario");
const tabla = document.getElementById("tabla-datos");

// 👉 GUARDAR DATOS
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;

    await addDoc(collection(db, "formularios"), {
        nombre,
        email,
        fecha: new Date()
    });

    formulario.reset();
    cargarDatos();
});

// 👉 MOSTRAR DATOS EN LA TABLA
async function cargarDatos() {
    tabla.innerHTML = "";

    const q = query(
        collection(db, "formularios"),
        orderBy("fecha", "desc")
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        const fila = `
            <tr>
                <td>${data.nombre}</td>
                <td>${data.email}</td>
                <td>${data.fecha?.toDate().toLocaleString()}</td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

// Cargar datos al abrir la página
cargarDatos();
