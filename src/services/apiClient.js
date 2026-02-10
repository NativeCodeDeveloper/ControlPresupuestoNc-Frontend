/**
 * apiClient.js
 * 
 * CLIENTE HTTP CENTRALIZADO PARA COMUNICACIÓN CON BACKEND
 * 
 * ========================================
 * PROPÓSITO
 * ========================================
 * 
 * Este archivo es el punto central para todas las llamadas HTTP al backend.
 * Actualmente NO hace llamadas (usa localStorage como dato falso).
 * Cuando tengas el backend listo, solo cambia aquí.
 * 
 * Los componentes NO necesitarán cambios.
 * Las páginas NO necesitarán cambios.
 * Solo este archivo cambiará.
 * 
 * ========================================
 * USO ACTUAL (localStorage)
 * ========================================
 * 
 * const data = await apiClient.get('/api/proyectos');
 * // Retorna datos desde localStorage (simulado)
 * 
 * await apiClient.post('/api/proyectos', { nombre: '...' });
 * // Guarda en localStorage
 * 
 * ========================================
 * USO FUTURO (Backend Real)
 * ========================================
 * 
 * Solo reemplaza el código de abajo con fetch/axios real:
 * 
 * const response = await fetch(`${API_URL}${endpoint}`, {
 *   method,
 *   headers: { 'Content-Type': 'application/json', 'Authorization': token },
 *   body: JSON.stringify(data)
 * });
 * 
 * Eso es TODO. Sin cambios en componentes.
 */

// ========================================
// CONFIGURACIÓN (cambiar para backend)
// ========================================

// Conectar a backend local
const API_URL = 'http://localhost:3000';

// Token de autenticación (FUTURO: obtener del login)
let authToken = null;

/**
 * setAuthToken - Guardar token de autenticación
 * 
 * FUTURO: Cuando tengas login, guarda el token aquí
 * 
 * @param {string} token - JWT o token de sesión
 */
export const setAuthToken = (token) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

/**
 * getAuthToken - Obtener token guardado
 * 
 * @returns {string|null} - Token si existe
 */
export const getAuthToken = () => {
    return authToken || localStorage.getItem('authToken');
};

// ========================================
// CLIENTE HTTP (CONECTADO A BACKEND REAL)
// ========================================

/**
 * apiClient - Objeto central para llamadas HTTP
 * 
 * MÉTODOS:
 * - get(endpoint) → GET request
 * - post(endpoint, data) → POST request
 * - put(endpoint, data) → PUT request
 * - delete(endpoint) → DELETE request
 * - patch(endpoint, data) → PATCH request
 * 
 * AHORA: Llamadas reales a backend
 */
const apiClient = {
    /**
     * GET - Obtener datos
     */
    get: async (endpoint) => {
        try {
            console.log(`[API] GET ${API_URL}${endpoint}`);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`[API ERROR] GET ${endpoint}:`, error);
            throw error;
        }
    },

    /**
     * POST - Crear nuevo recurso
     */
    post: async (endpoint, data) => {
        try {
            console.log(`[API] POST ${API_URL}${endpoint}`, data);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[API ERROR] POST ${endpoint}:`, error);
            throw error;
        }
    },

    /**
     * PUT - Actualizar recurso
     */
    put: async (endpoint, data) => {
        try {
            console.log(`[API] PUT ${API_URL}${endpoint}`, data);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[API ERROR] PUT ${endpoint}:`, error);
            throw error;
        }
    },

    /**
     * PATCH - Actualización parcial
     */
    patch: async (endpoint, data) => {
        try {
            console.log(`[API] PATCH ${API_URL}${endpoint}`, data);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[API ERROR] PATCH ${endpoint}:`, error);
            throw error;
        }
    },

    /**
     * DELETE - Eliminar recurso
     */
    delete: async (endpoint) => {
        try {
            console.log(`[API] DELETE ${API_URL}${endpoint}`);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[API ERROR] DELETE ${endpoint}:`, error);
            throw error;
        }
    }
};

export default apiClient;

// ========================================
// HELPER PARA ERRORES (Opcional pero útil)
// ========================================

/**
 * Manejo centralizado de errores de API
 * 
 * FUTURO: Cuando tengas errores del backend, úsalo aquí
 */
export const handleApiError = (error) => {
    if (error.response) {
        // Error del servidor (4xx, 5xx)
        console.error('Error del servidor:', error.response.status, error.response.data);
        throw new Error(error.response.data.message || 'Error del servidor');
    } else if (error.request) {
        // Error sin respuesta (red desconectada)
        console.error('Error de conexión:', error.request);
        throw new Error('Error de conexión. Verifica tu internet.');
    } else {
        // Error desconocido
        console.error('Error desconocido:', error.message);
        throw error;
    }
};
