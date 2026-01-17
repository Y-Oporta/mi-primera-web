import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔐 IMPORTANTE: Las credenciales de Firebase deben estar en variables de entorno
// Esto es solo para demostración. En producción usa environment variables.
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
};

// Validación básica de configuración
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY") {
    console.error("❌ Configuración de Firebase no válida");
    mostrarError("Error de configuración. Contacta al administrador.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a elementos del DOM
const formulario = document.getElementById("formulario");
const tabla = document.getElementById("tabla-datos");
const buscarInput = document.getElementById("buscar");
const btnLimpiarBusqueda = document.getElementById("btn-limpiar-busqueda");
const formMessage = document.getElementById("form-message");
const loadingRow = document.getElementById("loading-row");

// Estado de la aplicación
let datos = [];
let editandoId = null;
const COLECCION = "usuarios"; // Nombre centralizado de la colección

// 🔧 Utilidades
function mostrarMensaje(texto, tipo = 'success') {
    formMessage.textContent = texto;
    formMessage.className = `form-message ${tipo}`;
    formMessage.style.display = 'block';

    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 3000);
}

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `❌ Error: ${mensaje}`;
    errorDiv.style.cssText = `
        background: #ffebee;
        color: #c62828;
        padding: 15px;
        margin: 15px 0;
        border-radius: 4px;
        border-left: 4px solid #c62828;
    `;

    document.querySelector('.container').prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

function formatearFecha(fechaFirebase) {
    if (!fechaFirebase) return 'Fecha no disponible';

    const fecha = fechaFirebase.toDate();
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 📋 Cargar y mostrar datos
async function cargarDatos() {
    try {
        if (loadingRow) {
            loadingRow.innerHTML = '<td colspan="4" class="loading">Cargando datos...</td>';
        }

        tabla.innerHTML = '';
        datos = [];

        const q = query(collection(db, COLECCION), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tabla.innerHTML = `
                <tr id="empty-row">
                    <td colspan="4" class="empty-state">
                        📭 No hay usuarios registrados todavía
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            datos.push({
                id: docSnap.id,
                nombre: data.nombre || '',
                email: data.email || '',
                fecha: data.fecha
            });
        });

        mostrarDatos(datos);

    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarError("No se pudieron cargar los datos");
        tabla.innerHTML = `
            <tr id="error-row">
                <td colspan="4" style="color: #c62828; text-align: center; padding: 30px;">
                    ❌ Error al cargar los datos
                </td>
            </tr>
        `;
    } finally {
        if (loadingRow) loadingRow.remove();
    }
}

function mostrarDatos(lista) {
    tabla.innerHTML = '';

    lista.forEach((item) => {
        const fila = document.createElement("tr");

        // Agregar atributos para responsive
        const celdas = [
            { label: "Nombre", value: item.nombre, className: "nombre" },
            { label: "Email", value: item.email, className: "email" },
            { label: "Fecha de registro", value: formatearFecha(item.fecha), className: "fecha" }
        ];

        celdas.forEach(celda => {
            const td = document.createElement("td");
            td.textContent = celda.value;
            td.className = celda.className;
            td.setAttribute('data-label', celda.label);
            fila.appendChild(td);
        });

        // Celda de acciones
        const tdAcciones = document.createElement("td");
        tdAcciones.className = "actions";
        tdAcciones.setAttribute('data-label', 'Acciones');

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "✏️ Editar";
        btnEditar.className = "btn btn-edit";
        btnEditar.title = "Editar usuario";
        btnEditar.addEventListener("click", () => prepararEdicion(item));

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "🗑️ Eliminar";
        btnEliminar.className = "btn btn-delete";
        btnEliminar.title = "Eliminar usuario";
        btnEliminar.addEventListener("click", () => confirmarEliminacion(item));

        tdAcciones.appendChild(btnEditar);
        tdAcciones.appendChild(btnEliminar);
        fila.appendChild(tdAcciones);

        // Agregar ID como atributo para referencia
        fila.setAttribute('data-id', item.id);

        tabla.appendChild(fila);
    });
}

// 📝 Manejo del formulario
function prepararEdicion(item) {
    editandoId = item.id;

    document.getElementById("nombre").value = item.nombre;
    document.getElementById("email").value = item.email;

    const submitBtn = formulario.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-text">Actualizar usuario</span>';

    mostrarMensaje(`Editando usuario: ${item.nombre}`, 'info');
    document.getElementById("nombre").focus();
}

async function guardarRegistro(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const submitBtn = formulario.querySelector('button[type="submit"]');

    // Validaciones
    if (!nombre || !email) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('Por favor ingresa un email válido', 'error');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Guardando...</span>';

        if (editandoId) {
            // Modo edición
            await updateDoc(doc(db, COLECCION, editandoId), {
                nombre,
                email,
                actualizado: serverTimestamp()
            });

            mostrarMensaje(`Usuario "${nombre}" actualizado correctamente`, 'success');
            editandoId = null;
        } else {
            // Nuevo registro
            await addDoc(collection(db, COLECCION), {
                nombre,
                email,
                fecha: serverTimestamp()
            });

            mostrarMensaje(`Usuario "${nombre}" creado correctamente`, 'success');
        }

        formulario.reset();
        cargarDatos();

    } catch (error) {
        console.error("Error guardando registro:", error);
        mostrarError("Error al guardar el registro");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Guardar usuario</span>';
    }
}

// 🔍 Funcionalidad de búsqueda
function filtrarDatos() {
    const texto = buscarInput.value.toLowerCase().trim();

    if (!texto) {
        mostrarDatos(datos);
        return;
    }

    const filtrados = datos.filter(item =>
        item.nombre.toLowerCase().includes(texto) ||
        item.email.toLowerCase().includes(texto)
    );

    if (filtrados.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    🔍 No se encontraron usuarios que coincidan con "${texto}"
                </td>
            </tr>
        `;
    } else {
        mostrarDatos(filtrados);
    }
}

// 🗑️ Eliminación con confirmación
async function confirmarEliminacion(item) {
    const confirmacion = await Swal.fire({
        title: `¿Eliminar a ${item.nombre}?`,
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        await eliminarRegistro(item.id);
    }
}

async function eliminarRegistro(id) {
    try {
        await deleteDoc(doc(db, COLECCION, id));

        // Animar la eliminación
        const fila = document.querySelector(`tr[data-id="${id}"]`);
        if (fila) {
            fila.style.opacity = '0.5';
            fila.style.transform = 'translateX(-100%)';
            setTimeout(() => cargarDatos(), 300);
        } else {
            cargarDatos();
        }

        mostrarMensaje('Usuario eliminado correctamente', 'success');
    } catch (error) {
        console.error("Error eliminando registro:", error);
        mostrarError("Error al eliminar el registro");
    }
}

// 🔧 Event Listeners
formulario.addEventListener("submit", guardarRegistro);

buscarInput.addEventListener("keyup", filtrarDatos);

btnLimpiarBusqueda?.addEventListener("click", () => {
    buscarInput.value = '';
    mostrarDatos(datos);
});

// ⌨️ Atajos de teclado
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        buscarInput.focus();
    }

    if (e.key === 'Escape' && editandoId) {
        formulario.reset();
        editandoId = null;
        const submitBtn = formulario.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="btn-text">Guardar usuario</span>';
        mostrarMensaje('Edición cancelada', 'info');
    }
});

// 📱 Detectar tipo de dispositivo
function detectarDispositivo() {
    if ('maxTouchPoints' in navigator) {
        document.body.classList.add('touch-device');
    }
}

// 📊 Inicialización
async function inicializarApp() {
    detectarDispositivo();

    // Mostrar versión/estado
    console.log(`🚀 Panel de administración v1.0`);
    console.log(`📊 Colección: ${COLECCION}`);
    console.log(`📱 Dispositivo: ${window.innerWidth}px`);

    await cargarDatos();

    // Auto-focus en búsqueda
    buscarInput.focus();
}

// Iniciar aplicación
inicializarApp().catch(error => {
    console.error("Error inicializando aplicación:", error);
    mostrarError("Error al inicializar la aplicación");
});

export { cargarDatos, mostrarDatos, guardarRegistro };