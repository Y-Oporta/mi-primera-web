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

// 🔐 Configuración de Firebase (REEMPLAZAR CON TUS DATOS)
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

// Constantes
const COLECCION = "usuarios";

// Elementos del DOM
const elementos = {
    formulario: document.getElementById('formulario'),
    tablaDatos: document.getElementById('tabla-datos'),
    buscarInput: document.getElementById('buscar'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnCancelar: document.getElementById('btn-cancelar'),
    totalUsuarios: document.getElementById('total-usuarios'),
    loadingRow: document.getElementById('loading-row'),
    emptyState: document.getElementById('empty-state'),
    messageContainer: document.getElementById('message-container')
};

// Estado de la aplicación
let usuarios = [];
let editandoId = null;

// 🔧 Funciones utilitarias
function mostrarMensaje(texto, tipo = 'success') {
    const mensaje = document.createElement('div');
    mensaje.className = `message message-${tipo}`;
    mensaje.innerHTML = `
        <strong>${tipo === 'success' ? '✓' : tipo === 'error' ? '✗' : 'ℹ'}</strong>
        <span>${texto}</span>
    `;

    elementos.messageContainer.appendChild(mensaje);

    setTimeout(() => {
        mensaje.style.opacity = '0';
        mensaje.style.transform = 'translateY(-10px)';
        setTimeout(() => mensaje.remove(), 300);
    }, 3000);
}

function formatearFecha(timestamp) {
    if (!timestamp) return 'N/A';

    const fecha = timestamp.toDate();
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias === 0) {
        if (diffHoras === 0) {
            return `Hace ${diffMin} min`;
        }
        return `Hace ${diffHoras} h`;
    } else if (diffDias === 1) {
        return 'Ayer';
    } else if (diffDias < 7) {
        return `Hace ${diffDias} días`;
    }

    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// 📊 Funciones de datos
async function cargarUsuarios() {
    try {
        elementos.loadingRow.style.display = 'table-row';
        elementos.emptyState.style.display = 'none';

        usuarios = [];
        const q = query(collection(db, COLECCION), orderBy("fechaCreacion", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            elementos.loadingRow.style.display = 'none';
            elementos.emptyState.style.display = 'block';
            actualizarContador(0);
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            usuarios.push({
                id: docSnap.id,
                nombre: data.nombre || '',
                email: data.email || '',
                fechaCreacion: data.fechaCreacion || null,
                fechaActualizacion: data.fechaActualizacion || null
            });
        });

        mostrarUsuarios(usuarios);
        actualizarContador(usuarios.length);

    } catch (error) {
        console.error('Error cargando usuarios:', error);
        mostrarMensaje('Error al cargar los usuarios', 'error');
    } finally {
        elementos.loadingRow.style.display = 'none';
    }
}

function mostrarUsuarios(lista) {
    elementos.tablaDatos.innerHTML = '';

    if (lista.length === 0) {
        elementos.emptyState.style.display = 'block';
        return;
    }

    lista.forEach(usuario => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>
                <strong>${usuario.nombre}</strong>
            </td>
            <td>
                <a href="mailto:${usuario.email}" style="color: var(--primary); text-decoration: none;">
                    ${usuario.email}
                </a>
            </td>
            <td>
                <span style="color: var(--success);">${formatearFecha(usuario.fechaCreacion)}</span>
            </td>
            <td>
                <span style="color: var(--warning);">${formatearFecha(usuario.fechaActualizacion)}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn-icon btn-edit" title="Editar usuario" data-id="${usuario.id}">
                        <i class="icon-edit"></i>
                    </button>
                    <button type="button" class="btn-icon btn-delete" title="Eliminar usuario" data-id="${usuario.id}">
                        <i class="icon-delete"></i>
                    </button>
                </div>
            </td>
        `;

        elementos.tablaDatos.appendChild(fila);
    });

    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => prepararEdicion(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => confirmarEliminacion(btn.dataset.id));
    });
}

function actualizarContador(total) {
    elementos.totalUsuarios.textContent = `${total} ${total === 1 ? 'usuario' : 'usuarios'}`;
}

// 📝 Funciones del formulario
function prepararEdicion(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    editandoId = id;
    document.getElementById('nombre').value = usuario.nombre;
    document.getElementById('email').value = usuario.email;

    const submitBtn = elementos.formulario.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="icon-save"></i> Actualizar Usuario';

    elementos.btnCancelar.style.display = 'inline-flex';

    mostrarMensaje(`Editando usuario: ${usuario.nombre}`, 'info');
    document.getElementById('nombre').focus();
}

function cancelarEdicion() {
    editandoId = null;
    elementos.formulario.reset();

    const submitBtn = elementos.formulario.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="icon-save"></i> Guardar Usuario';

    elementos.btnCancelar.style.display = 'none';
}

async function guardarUsuario(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();

    // Validaciones
    if (!nombre || !email) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }

    if (!validarEmail(email)) {
        mostrarMensaje('Por favor ingresa un email válido', 'error');
        return;
    }

    const submitBtn = elementos.formulario.querySelector('button[type="submit"]');
    const btnOriginalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Procesando...</span>';

        const datosUsuario = {
            nombre,
            email,
            fechaActualizacion: serverTimestamp()
        };

        if (editandoId) {
            // Actualizar usuario existente
            await updateDoc(doc(db, COLECCION, editandoId), datosUsuario);
            mostrarMensaje(`Usuario "${nombre}" actualizado correctamente`, 'success');
        } else {
            // Crear nuevo usuario
            datosUsuario.fechaCreacion = serverTimestamp();
            await addDoc(collection(db, COLECCION), datosUsuario);
            mostrarMensaje(`Usuario "${nombre}" creado exitosamente`, 'success');
        }

        // Limpiar formulario y recargar
        cancelarEdicion();
        await cargarUsuarios();

    } catch (error) {
        console.error('Error guardando usuario:', error);
        mostrarMensaje('Error al guardar el usuario', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = btnOriginalText;
    }
}

// 🔍 Funcionalidad de búsqueda
function buscarUsuarios() {
    const termino = elementos.buscarInput.value.trim().toLowerCase();

    if (!termino) {
        mostrarUsuarios(usuarios);
        actualizarContador(usuarios.length);
        return;
    }

    const resultados = usuarios.filter(usuario =>
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.email.toLowerCase().includes(termino)
    );

    mostrarUsuarios(resultados);
    actualizarContador(resultados.length);
}

// 🗑️ Funciones de eliminación
async function confirmarEliminacion(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    // Usamos confirm nativo por simplicidad, pero puedes usar SweetAlert2
    if (confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre}"?\nEsta acción no se puede deshacer.`)) {
        await eliminarUsuario(id);
    }
}

async function eliminarUsuario(id) {
    try {
        await deleteDoc(doc(db, COLECCION, id));

        // Animación de eliminación
        const fila = document.querySelector(`button[data-id="${id}"]`).closest('tr');
        if (fila) {
            fila.style.transition = 'all 0.3s ease';
            fila.style.opacity = '0';
            fila.style.transform = 'translateX(-100%)';

            setTimeout(async () => {
                await cargarUsuarios();
            }, 300);
        } else {
            await cargarUsuarios();
        }

        mostrarMensaje('Usuario eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        mostrarMensaje('Error al eliminar el usuario', 'error');
    }
}

// 📱 Event Listeners
function inicializarEventListeners() {
    // Formulario
    elementos.formulario.addEventListener('submit', guardarUsuario);
    elementos.btnCancelar.addEventListener('click', cancelarEdicion);

    // Búsqueda
    elementos.buscarInput.addEventListener('input', buscarUsuarios);

    // Refresh
    elementos.btnRefresh.addEventListener('click', cargarUsuarios);

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + F para buscar
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            elementos.buscarInput.focus();
            elementos.buscarInput.select();
        }

        // Escape para cancelar edición
        if (e.key === 'Escape' && editandoId) {
            cancelarEdicion();
        }

        // F5 para refresh
        if (e.key === 'F5') {
            e.preventDefault();
            cargarUsuarios();
        }
    });

    // Focus en formulario al cargar
    document.getElementById('nombre').focus();
}

// 🚀 Inicializar aplicación
async function inicializarApp() {
    console.log('🚀 Panel de Administración - Iniciando...');

    try {
        inicializarEventListeners();
        await cargarUsuarios();

        console.log('✅ Aplicación cargada correctamente');

        // Mostrar mensaje de bienvenida
        setTimeout(() => {
            mostrarMensaje('Panel de administración listo', 'info');
        }, 1000);

    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
        mostrarMensaje('Error al inicializar la aplicación', 'error');
    }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
    inicializarApp();
}

export { cargarUsuarios, mostrarUsuarios, guardarUsuario };