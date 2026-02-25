// firebase-config.js
// Configuración de Firebase

const firebaseConfig = {
    apiKey: "AIzaSyD8rpYKIsjLw6yOldNBlIyJSI6MSvAKF_k",
    authDomain: "produccion-codex.firebaseapp.com",
    projectId: "produccion-codex",
    storageBucket: "produccion-codex.firebasestorage.app",
    messagingSenderId: "1087026880559",
    appId: "1:1087026880559:web:ea457fd76afe356440a6da"
};

// Inicializar Firebase
let db = null;
let firebaseInicializado = false;

function inicializarFirebase() {
    return new Promise((resolve, reject) => {
        try {
            if (typeof firebase !== 'undefined' && !firebaseInicializado) {
                // Inicializar Firebase
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }

                // Obtener instancia de Firestore
                db = firebase.firestore();

                // Configurar settings
                db.settings({
                    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
                });

                // Habilitar persistencia offline
                db.enablePersistence()
                    .then(() => {
                        console.log('Persistencia offline habilitada');
                    })
                    .catch((err) => {
                        if (err.code == 'failed-precondition') {
                            console.log('Persistencia falló - múltiples pestañas abiertas');
                        } else if (err.code == 'unimplemented') {
                            console.log('Persistencia no soportada');
                        }
                    });

                firebaseInicializado = true;
                console.log("🔥 Firebase conectado");
                resolve(db);
            } else {
                resolve(db);
            }
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            reject(error);
        }
    });
}

// Función para obtener Firestore
function getFirestore() {
    return db;
}

// Función para verificar si Firebase está conectado
function isFirebaseConnected() {
    return firebaseInicializado && db !== null;
}

// Hacer funciones globales
window.inicializarFirebase = inicializarFirebase;
window.getFirestore = getFirestore;
window.isFirebaseConnected = isFirebaseConnected;