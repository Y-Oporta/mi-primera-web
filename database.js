// database.js - Base de datos local con Firebase

class LocalDatabase {
    constructor() {
        this.db = null;
        this.usuarios = [];
        this.trabajadores = [];
        this.actividades = [];
        this.bitacora = [];
        this.historialGrupos = [];
        this.contadorGrupo = 1;
        this.usuarioActual = null;
        this.conectado = false;
        this.sincronizando = false;
        this.init();
    }

    init() {
        this.cargarDatosLocales();
        this.inicializarFirebase();
        this.verificarSesion();
    }

    cargarDatosLocales() {
        // Cargar usuarios locales
        const usuariosGuardados = localStorage.getItem('eyp_usuarios');
        if (usuariosGuardados) {
            this.usuarios = JSON.parse(usuariosGuardados);
        } else {
            this.usuarios = this.crearAdminInicial();
        }

        // Cargar trabajadores locales
        this.trabajadores = JSON.parse(localStorage.getItem('eyp_trabajadores')) || [
            { codigo: '9', nombre: 'Alvaro Hernandez' },
            { codigo: '32', nombre: 'Ariel David Arauz Ramirez' },
            { codigo: '408', nombre: 'Yobelky Alejandra Duarte Gonzalez' },
            { codigo: '443', nombre: 'Luis Adolfo Miranda Arias' },
            { codigo: '1295', nombre: 'Mayela De Jesus Benitez Diaz' }
        ];

        // Cargar actividades locales
        this.actividades = JSON.parse(localStorage.getItem('eyp_actividades')) || [
            { codigo: 'SUP1003', nombre: 'SUP' },
            { codigo: 'SIEF107', nombre: 'BOLIADORA' },
            { codigo: 'SIEF101', nombre: 'DESCARGA' }
        ];

        // Cargar bitácora local
        this.bitacora = JSON.parse(localStorage.getItem('eyp_bitacora')) || [];

        // Cargar grupos históricos
        this.historialGrupos = JSON.parse(localStorage.getItem('eyp_historial')) || [];

        // Cargar contador de grupos
        this.contadorGrupo = parseInt(localStorage.getItem('eyp_contador')) || 1;
    }

    crearAdminInicial() {
        const admin = [
            {
                id: 1,
                username: this.descifrar('WS5vcG9ydGE='),
                password: this.hashPassword(this.descifrar('Q29kZXguMjAwNQ==')),
                nombre: this.descifrar('WWFkZXIgT3BvcnRh'),
                rol: 'administrador',
                activo: true,
                permisos: {
                    verAdminDB: true,
                    exportarExcel: true,
                    eliminarRegistros: true,
                    editarRegistros: true,
                    agregarRegistros: true,
                    gestionarUsuarios: true,
                    verHistorialGrupos: true,
                    verTodosLosGrupos: true,
                    cambiarPassword: true,
                    verBitacora: true
                },
                preguntaSeguridad: this.descifrar('wr9DdWFsIGVzIHR1IGNvbG9yIGZhdm9yaXRvPw=='),
                respuestaSeguridad: this.hashPassword(this.descifrar('YXp1bA=='))
            }
        ];
        localStorage.setItem('eyp_usuarios', JSON.stringify(admin));
        return admin;
    }

    descifrar(base64) {
        try {
            return atob(base64);
        } catch (e) {
            return '';
        }
    }

    hashPassword(password) {
        if (!password) return '';
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString() + password.length;
    }

    verificarPassword(passwordIngresada, passwordAlmacenada) {
        return this.hashPassword(passwordIngresada) === passwordAlmacenada;
    }

    inicializarFirebase() {
        if (typeof isFirebaseConnected === 'function' && isFirebaseConnected()) {
            this.db = getFirestore();
            this.conectado = true;
            console.log('Firebase conectado');
            this.subirDatosLocales();
        } else {
            console.log('Modo offline - Firebase no disponible');
            this.conectado = false;
        }
    }

    async subirDatosLocales() {
        if (!this.conectado || !this.db) return;

        try {
            // Subir usuarios
            for (const usuario of this.usuarios) {
                const usuarioLimpio = {
                    id: usuario.id,
                    username: usuario.username,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                    activo: usuario.activo,
                    permisos: usuario.permisos,
                    preguntaSeguridad: usuario.preguntaSeguridad || '',
                    ultimaSincronizacion: new Date().toISOString()
                };

                const usuarioRef = this.db.collection('usuarios').doc(usuario.username);
                await usuarioRef.set(usuarioLimpio, { merge: true });
            }

            // Subir trabajadores
            for (const trabajador of this.trabajadores) {
                const trabajadorRef = this.db.collection('trabajadores').doc(trabajador.codigo);
                await trabajadorRef.set(trabajador, { merge: true });
            }

            // Subir actividades
            for (const actividad of this.actividades) {
                const actividadRef = this.db.collection('actividades').doc(actividad.codigo);
                await actividadRef.set(actividad, { merge: true });
            }

            // Subir grupos históricos
            for (const grupo of this.historialGrupos) {
                const grupoRef = this.db.collection('grupos').doc(grupo.idGrupo);
                await grupoRef.set(grupo, { merge: true });
            }

            console.log('Datos locales subidos a Firebase');
        } catch (error) {
            console.log('Error subiendo datos:', error);
        }
    }

    verificarSesion() {
        const sesion = localStorage.getItem('eyp_sesion');
        if (sesion) {
            try {
                this.usuarioActual = JSON.parse(sesion);
            } catch (e) {
                this.cerrarSesion();
            }
        }
    }

    async login(username, password) {
        const usuario = this.usuarios.find(u => u.username === username && u.activo);

        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (!this.verificarPassword(password, usuario.password)) {
            return { success: false, message: 'Contraseña incorrecta' };
        }

        this.usuarioActual = {
            id: usuario.id,
            username: usuario.username,
            nombre: usuario.nombre,
            rol: usuario.rol,
            permisos: usuario.permisos
        };

        localStorage.setItem('eyp_sesion', JSON.stringify(this.usuarioActual));

        await this.registrarEnBitacora(
            'Login exitoso',
            `Usuario ${usuario.nombre} inició sesión`,
            'info'
        );

        return { success: true, message: 'Login exitoso', usuario: this.usuarioActual };
    }

    async cerrarSesion() {
        if (this.usuarioActual) {
            await this.registrarEnBitacora(
                'Logout',
                `Usuario ${this.usuarioActual.nombre} cerró sesión`,
                'info'
            );
        }
        this.usuarioActual = null;
        localStorage.removeItem('eyp_sesion');
    }

    haySesion() {
        return this.usuarioActual !== null;
    }

    getUsuarioActual() {
        return this.usuarioActual;
    }

    esAdministrador() {
        return this.usuarioActual && this.usuarioActual.rol === 'administrador';
    }

    tienePermiso(permiso) {
        if (!this.usuarioActual) return false;
        if (this.esAdministrador()) return true;
        return this.usuarioActual.permisos && this.usuarioActual.permisos[permiso] === true;
    }

    recuperarPassword(username, respuesta) {
        const usuario = this.usuarios.find(u => u.username === username);

        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (this.verificarPassword(respuesta, usuario.respuestaSeguridad)) {
            return {
                success: true,
                message: 'Respuesta correcta. Contacte al administrador para restablecer su contraseña.'
            };
        }

        return { success: false, message: 'Respuesta incorrecta' };
    }

    async cambiarPassword(username, passwordActual, passwordNueva, esAdmin = false) {
        const usuario = this.usuarios.find(u => u.username === username);

        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (!esAdmin && !this.verificarPassword(passwordActual, usuario.password)) {
            return { success: false, message: 'Contraseña actual incorrecta' };
        }

        usuario.password = this.hashPassword(passwordNueva);
        this.guardarUsuarios();

        await this.registrarEnBitacora(
            'Cambio de contraseña',
            `Usuario ${usuario.nombre} cambió su contraseña`,
            'seguridad'
        );

        return { success: true, message: 'Contraseña cambiada exitosamente' };
    }

    getUsuarios() {
        if (!this.esAdministrador()) return [];
        return this.usuarios.map(u => ({
            ...u,
            password: undefined,
            respuestaSeguridad: undefined
        }));
    }

    async agregarUsuario(usuarioData) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        if (this.usuarios.some(u => u.username === usuarioData.username)) {
            return { success: false, message: 'El nombre de usuario ya existe' };
        }

        const nuevoUsuario = {
            id: this.usuarios.length + 1,
            username: usuarioData.username,
            password: this.hashPassword(usuarioData.password),
            nombre: usuarioData.nombre,
            rol: usuarioData.rol || 'usuario',
            activo: true,
            permisos: usuarioData.permisos || {
                verAdminDB: false,
                exportarExcel: false,
                eliminarRegistros: false,
                editarRegistros: true,
                agregarRegistros: true,
                gestionarUsuarios: false,
                verHistorialGrupos: true,
                verTodosLosGrupos: false,
                cambiarPassword: false,
                verBitacora: false
            },
            preguntaSeguridad: usuarioData.preguntaSeguridad || '',
            respuestaSeguridad: this.hashPassword(usuarioData.respuestaSeguridad || '')
        };

        this.usuarios.push(nuevoUsuario);
        this.guardarUsuarios();

        await this.registrarEnBitacora(
            'Usuario agregado',
            `Se agregó usuario ${nuevoUsuario.nombre} (${nuevoUsuario.username})`,
            'administrativo'
        );

        return { success: true, message: 'Usuario agregado correctamente', usuario: nuevoUsuario };
    }

    async editarUsuario(id, usuarioData) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        const index = this.usuarios.findIndex(u => u.id === id);
        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (usuarioData.username && usuarioData.username !== this.usuarios[index].username) {
            if (this.usuarios.some(u => u.username === usuarioData.username)) {
                return { success: false, message: 'El nombre de usuario ya existe' };
            }
        }

        this.usuarios[index] = {
            ...this.usuarios[index],
            ...usuarioData,
            password: usuarioData.password ? this.hashPassword(usuarioData.password) : this.usuarios[index].password,
            respuestaSeguridad: usuarioData.respuestaSeguridad ? this.hashPassword(usuarioData.respuestaSeguridad) : this.usuarios[index].respuestaSeguridad
        };

        this.guardarUsuarios();

        await this.registrarEnBitacora(
            'Usuario editado',
            `Se editó usuario ${this.usuarios[index].nombre}`,
            'administrativo'
        );

        return { success: true, message: 'Usuario actualizado correctamente' };
    }

    async toggleUsuarioActivo(id) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        usuario.activo = !usuario.activo;
        this.guardarUsuarios();

        await this.registrarEnBitacora(
            usuario.activo ? 'Usuario habilitado' : 'Usuario inhabilitado',
            `Usuario ${usuario.nombre} ${usuario.activo ? 'habilitado' : 'inhabilitado'}`,
            'administrativo'
        );

        return {
            success: true,
            message: `Usuario ${usuario.activo ? 'habilitado' : 'inhabilitado'} correctamente`
        };
    }

    async eliminarUsuario(id) {
        if (!this.esAdministrador()) {
            return { success: false, message: 'No autorizado' };
        }

        if (id === 1) {
            return { success: false, message: 'No se puede eliminar al administrador principal' };
        }

        const index = this.usuarios.findIndex(u => u.id === id);
        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        const usuarioEliminado = this.usuarios[index];
        this.usuarios.splice(index, 1);
        this.guardarUsuarios();

        await this.registrarEnBitacora(
            'Usuario eliminado',
            `Se eliminó usuario ${usuarioEliminado.nombre}`,
            'administrativo'
        );

        return { success: true, message: 'Usuario eliminado correctamente' };
    }

    guardarUsuarios() {
        localStorage.setItem('eyp_usuarios', JSON.stringify(this.usuarios));
    }

    getTrabajadores() {
        return this.trabajadores;
    }

    buscarTrabajador(codigo) {
        if (!codigo) return null;
        return this.trabajadores.find(t => t.codigo === codigo.trim());
    }

    buscarTrabajadoresPorNombreOMatch(termino) {
        if (!termino) return [];
        return this.trabajadores.filter(t =>
            t.codigo.includes(termino) ||
            t.nombre.toLowerCase().includes(termino.toLowerCase())
        ).slice(0, 5);
    }

    async agregarTrabajador(codigo, nombre) {
        if (!this.tienePermiso('agregarRegistros')) {
            return { success: false, message: 'No tiene permiso para agregar trabajadores' };
        }

        if (!codigo || !nombre) {
            return { success: false, message: 'Código y nombre son requeridos' };
        }

        if (this.trabajadores.some(t => t.codigo === codigo)) {
            return { success: false, message: 'Ya existe un trabajador con ese código' };
        }

        this.trabajadores.push({ codigo, nombre });
        this.guardarTrabajadores();

        await this.registrarEnBitacora(
            'Trabajador agregado',
            `Se agregó trabajador ${nombre} (${codigo})`,
            'datos'
        );

        return { success: true, message: 'Trabajador agregado correctamente' };
    }

    guardarTrabajadores() {
        localStorage.setItem('eyp_trabajadores', JSON.stringify(this.trabajadores));
    }

    getActividades() {
        return this.actividades;
    }

    buscarActividad(codigo) {
        if (!codigo) return null;
        return this.actividades.find(a => a.codigo === codigo.trim());
    }

    buscarActividadesPorNombreOMatch(termino) {
        if (!termino) return [];
        return this.actividades.filter(a =>
            a.codigo.includes(termino) ||
            a.nombre.toLowerCase().includes(termino.toLowerCase())
        ).slice(0, 5);
    }

    async agregarActividad(codigo, nombre) {
        if (!this.tienePermiso('agregarRegistros')) {
            return { success: false, message: 'No tiene permiso para agregar actividades' };
        }

        if (!codigo || !nombre) {
            return { success: false, message: 'Código y actividad son requeridos' };
        }

        if (this.actividades.some(a => a.codigo === codigo)) {
            return { success: false, message: 'Ya existe una actividad con ese código' };
        }

        this.actividades.push({ codigo, nombre });
        this.guardarActividades();

        await this.registrarEnBitacora(
            'Actividad agregada',
            `Se agregó actividad ${nombre} (${codigo})`,
            'datos'
        );

        return { success: true, message: 'Actividad agregada correctamente' };
    }

    guardarActividades() {
        localStorage.setItem('eyp_actividades', JSON.stringify(this.actividades));
    }

    async guardarGrupo(datosGrupo) {
        if (!this.usuarioActual) {
            return { success: false, message: 'No hay sesión activa' };
        }

        const codigoGenerado = "E Y P " + this.contadorGrupo.toString().padStart(6, '0') + " " + this.usuarioActual.username.charAt(0);

        const nuevoGrupo = {
            idGrupo: codigoGenerado,
            fechaCreacion: new Date().toLocaleString(),
            timestamp: new Date().toISOString(),
            encargado: datosGrupo.encargado,
            observaciones: datosGrupo.observaciones || '',
            registros: [...datosGrupo.registros],
            creador: this.usuarioActual.username,
            creadorNombre: this.usuarioActual.nombre,
            ultimaModificacion: new Date().toISOString(),
            modificadoPor: this.usuarioActual.username
        };

        this.historialGrupos.unshift(nuevoGrupo);
        this.contadorGrupo++;

        localStorage.setItem('eyp_historial', JSON.stringify(this.historialGrupos));
        localStorage.setItem('eyp_contador', this.contadorGrupo);

        await this.registrarEnBitacora(
            'Grupo guardado',
            `Se guardó grupo ${codigoGenerado} con ${datosGrupo.registros.length} registros`,
            'grupo'
        );

        return { success: true, message: 'Grupo guardado exitosamente', grupo: nuevoGrupo };
    }

    async editarGrupo(index, datosActualizados) {
        if (!this.usuarioActual) {
            return { success: false, message: 'No hay sesión activa' };
        }

        this.historialGrupos[index] = {
            ...this.historialGrupos[index],
            ...datosActualizados,
            ultimaModificacion: new Date().toISOString(),
            modificadoPor: this.usuarioActual.username
        };

        localStorage.setItem('eyp_historial', JSON.stringify(this.historialGrupos));

        await this.registrarEnBitacora(
            'Grupo editado',
            `Se editó grupo ${this.historialGrupos[index].idGrupo}`,
            'grupo'
        );

        return { success: true, message: 'Grupo actualizado correctamente' };
    }

    async registrarEnBitacora(accion, detalles, tipo = 'info') {
        const entrada = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            usuario: this.usuarioActual ? this.usuarioActual.username : 'sistema',
            usuarioNombre: this.usuarioActual ? this.usuarioActual.nombre : 'Sistema',
            accion: accion,
            detalles: detalles,
            tipo: tipo
        };

        this.bitacora.unshift(entrada);

        if (this.bitacora.length > 1000) {
            this.bitacora = this.bitacora.slice(0, 1000);
        }

        localStorage.setItem('eyp_bitacora', JSON.stringify(this.bitacora));

        return entrada;
    }

    getBitacora(filtros = {}) {
        let resultados = [...this.bitacora];

        if (filtros.usuario) {
            resultados = resultados.filter(e => e.usuario === filtros.usuario);
        }

        if (filtros.desde) {
            resultados = resultados.filter(e => new Date(e.timestamp) >= new Date(filtros.desde));
        }

        if (filtros.hasta) {
            resultados = resultados.filter(e => new Date(e.timestamp) <= new Date(filtros.hasta));
        }

        if (filtros.accion) {
            resultados = resultados.filter(e => e.accion.includes(filtros.accion));
        }

        return resultados;
    }

    mostrarNotificacion(mensaje, tipo) {
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(mensaje, tipo);
        } else {
            alert(mensaje);
        }
    }
}

// Inicializar la base de datos
const db = new LocalDatabase();
window.db = db;