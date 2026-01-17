import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔥 Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCOkJxMjRnlONU7tVx9XGmKhnzLMR80SSQ",
    authDomain: "mi-primera-web-7daca.firebaseapp.com",
    projectId: "mi-primera-web-7daca",
    storageBucket: "mi-primera-web-7daca.firebasestorage.app",
    messagingSenderId: "885845436483",
    appId: "1:885845436483:web:47cdedbb2df999b38cccf6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML refs
const formulario = document.getElementById("formulario");
const tabla = document.getElementById("tabla-datos");
const buscarInput = document.getElementById("buscar");

let datos = [];

// ➕ Guardar
formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "formularios"), {
        nombre: nombre.value,
        email: email.value,
        fecha: new Date()
    });

    formulario.reset();
    cargarDatos();
});

// 📥 Cargar datos
async function cargarDatos() {
    tabla.innerHTML = "";
    datos = [];

    const snapshot = await getDocs(collection(db, "formularios"));

    snapshot.forEach((docSnap) => {
        datos.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    mostrarDatos(datos);
}

// 🖥️ Mostrar tabla
function mostrarDatos(lista) {
    tabla.innerHTML = "";

    lista.forEach((item) => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.email}</td>
            <td>${item.fecha?.toDate().toLocaleString()}</td>
            <td class="acciones">
                <button onclick="editar('${item.id}')">Editar</button>
                <button onclick="eliminar('${item.id}')">Eliminar</button>
            </td>
        `;

        tabla.appendChild(fila);
    });
}

// 🔍 Buscar
buscarInput.addEventListener("keyup", () => {
    const texto = buscarInput.value.toLowerCase();

    const filtrados = datos.filter(d =>
        d.nombre.toLowerCase().includes(texto) ||
        d.email.toLowerCase().includes(texto)
    );

    mostrarDatos(filtrados);
});

// ✏️ Editar
window.editar = async (id) => {
    const registro = datos.find(d => d.id === id);

    const nuevoNombre = prompt("Nuevo nombre:", registro.nombre);
    const nuevoEmail = prompt("Nuevo email:", registro.email);

    if (nuevoNombre && nuevoEmail) {
        await updateDoc(doc(db, "formularios", id), {
            nombre: nuevoNombre,
            email: nuevoEmail
        });
        cargarDatos();
    }
};

// 🗑️ Eliminar
window.eliminar = async (id) => {
    if (confirm("¿Seguro que quieres eliminar este registro?")) {
        await deleteDoc(doc(db, "formularios", id));
        cargarDatos();
    }
};

// Inicial
cargarDatos();

console.log("Panel cargado correctamente");
