// ============================================================================
// API CLIENT - GIS RISK ZULIA
// Manejo de comunicación con el backend
// ============================================================================

const API_URL = 'http://localhost:3000/api';

class ApiClient {
    // Obtener token del localStorage
    static getToken() {
        return localStorage.getItem('gis_token');
    }

    // Guardar token en localStorage
    static saveToken(token) {
        localStorage.setItem('gis_token', token);
    }

    // Eliminar token
    static removeToken() {
        localStorage.removeItem('gis_token');
    }

    // Guardar datos de usuario
    static saveUser(user) {
        localStorage.setItem('gis_user', JSON.stringify(user));
    }

    // Obtener datos de usuario
    static getUser() {
        const user = localStorage.getItem('gis_user');
        return user ? JSON.parse(user) : null;
    }

    // Eliminar datos de usuario
    static removeUser() {
        localStorage.removeItem('gis_user');
    }

    // Verificar si está autenticado
    static isAuthenticated() {
        return !!this.getToken();
    }

    // ✅ CORREGIDO: Hacer petición fetch con manejo apropiado de errores
    static async fetch(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            // ✅ Si la respuesta es exitosa (200-299)
            if (response.ok) {
                return {
                    success: true,
                    ...data
                };
            }

            // ✅ Si hay error HTTP (400-599), devolver objeto con success: false
            // en lugar de lanzar error
            return {
                success: false,
                message: data.error || data.mensaje || 'Error en la petición',
                statusCode: response.status,
                error: data.error
            };

        } catch (error) {
            // ✅ Error de red o JSON inválido
            console.error('Error de conexión:', error);
            return {
                success: false,
                message: 'Error de conexión con el servidor. Verifica que el backend esté corriendo.',
                error: error.message
            };
        }
    }

    // ========== ENDPOINTS DE AUTENTICACIÓN ==========

    // Registro de consultor
    static async registroConsultor(username, email, password) {
        return await this.fetch('/auth/registro/consultor', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    // Solicitar registro (analista/admin)
    static async solicitarRegistro(username, email, rol) {
        return await this.fetch('/auth/solicitud', {
            method: 'POST',
            body: JSON.stringify({ username, email, rol })
        });
    }

    // Completar registro con código
    static async completarRegistro(email, codigo, password) {
        return await this.fetch('/auth/completar-registro', {
            method: 'POST',
            body: JSON.stringify({ email, codigo, password })
        });
    }

    // Login
    static async login(email, password) {
        return await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Verificar solicitud
    static async verificarSolicitud(email) {
        return await this.fetch(`/auth/solicitud/${email}`);
    }

    // Obtener perfil
    static async obtenerPerfil() {
        return await this.fetch('/auth/perfil');
    }

    // ========== ENDPOINTS DE ADMINISTRACIÓN ==========

    // Listar solicitudes pendientes
    static async listarSolicitudesPendientes() {
        return await this.fetch('/admin/solicitudes/pendientes');
    }

    // Listar todas las solicitudes
    static async listarTodasSolicitudes() {
        return await this.fetch('/admin/solicitudes');
    }

    // Aprobar solicitud
    static async aprobarSolicitud(id) {
        return await this.fetch(`/admin/solicitudes/${id}/aprobar`, {
            method: 'POST'
        });
    }

    // Rechazar solicitud
    static async rechazarSolicitud(id) {
        return await this.fetch(`/admin/solicitudes/${id}/rechazar`, {
            method: 'POST'
        });
    }

    // Regenerar código
    static async regenerarCodigo(id) {
        return await this.fetch(`/admin/solicitudes/${id}/regenerar-codigo`, {
            method: 'POST'
        });
    }

    // Contar solicitudes pendientes
    static async contarSolicitudesPendientes() {
        return await this.fetch('/admin/solicitudes/contar');
    }

    // Listar usuarios
    static async listarUsuarios() {
        return await this.fetch('/admin/usuarios');
    }

    // Desactivar usuario
    static async desactivarUsuario(id) {
        return await this.fetch(`/admin/usuarios/${id}/desactivar`, {
            method: 'PATCH'
        });
    }

    // Activar usuario
    static async activarUsuario(id) {
        return await this.fetch(`/admin/usuarios/${id}/activar`, {
            method: 'PATCH'
        });
    }

    // Logout
    static logout() {
        this.removeToken();
        this.removeUser();
        window.location.href = '/';
    }
}

// Exportar para uso global
window.ApiClient = ApiClient;