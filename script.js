import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML refs
const formulario = document.getElementById("formulario");
const tabla = document.getElementById("tabla-datos");
const buscarInput = document.getElementById("buscar");

let datos = [];

// ➕ Guardar registro
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

// 📥 Cargar datos
async function cargarDatos() {
    tabla.innerHTML = "";
    datos = [];

    const snapshot = await getDocs(collection(db, "formularios"));

    snapshot.forEach((docSnap) => {
        datos.push({ id: docSnap.id, ...docSnap.data() });
    });

    mostrarDatos(datos);
}

// 🖥️ Mostrar tabla y crear botones dinámicos
function mostrarDatos(lista) {
    tabla.innerHTML = "";

    lista.forEach((item) => {
        const fila = document.createElement("tr");

        const tdNombre = document.createElement("td");
        tdNombre.textContent = item.nombre;

        const tdEmail = document.createElement("td");
        tdEmail.textContent = item.email;

        const tdFecha = document.createElement("td");
        tdFecha.textContent = item.fecha?.toDate().toLocaleString() || "";

        const tdAcciones = document.createElement("td");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => editar(item.id));

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminar(item.id));

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);

        fila.appendChild(tdNombre);
        fila.appendChild(tdEmail);
        fila.appendChild(tdFecha);
        fila.appendChild(tdAcciones);

        tabla.appendChild(fila);
    });
}

// 🔍 Buscar en la tabla
buscarInput.addEventListener("keyup", () => {
    const texto = buscarInput.value.toLowerCase();
    const filtrados = datos.filter(d =>
        d.nombre.toLowerCase().includes(texto) ||
        d.email.toLowerCase().includes(texto)
    );
    mostrarDatos(filtrados);
});

// ✏️ Editar registro
async function editar(id) {
    const registro = datos.find(d => d.id === id);
    const nuevoNombre = prompt("Nuevo nombre:", registro.nombre);
    const nuevoEmail = prompt("Nuevo email:", registro.email);

    if (!nuevoNombre || !nuevoEmail) return;

    await updateDoc(doc(db, "formularios", id), {
        nombre: nuevoNombre,
        email: nuevoEmail
    });

    cargarDatos();
}

// 🗑️ Eliminar registro
async function eliminar(id) {
    if (!confirm("¿Seguro que quieres eliminar este registro?")) return;

    await deleteDoc(doc(db, "formularios", id));
    cargarDatos();
}

// Inicial
cargarDatos();

console.log("Panel cargado correctamente (PC y móvil)");
