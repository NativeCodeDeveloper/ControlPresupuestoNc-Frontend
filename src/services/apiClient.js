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
// CONFIGURACIÓN
// ========================================

const API_URL = '';

// Función inyectada por el provider de Clerk para obtener el token fresco
let tokenGetter = null;

/** Registrar la función que retorna el JWT de Clerk (llamar desde el provider) */
export const setTokenGetter = (fn) => { tokenGetter = fn; };

const getToken = async () => {
    if (tokenGetter) return await tokenGetter();
    return null;
};

const buildApiError = async (response) => {
    let data = null;
    let message = `HTTP ${response.status}: ${response.statusText}`;

    try {
        data = await response.json();
        if (data?.message) {
            message = data.message;
        }
    } catch (parseError) {
        void parseError;
        // noop: mantiene mensaje por status.
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    return error;
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
const buildHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

/**
 * fetchWithAuth - Fetch con Authorization adjunto, devuelve Response cruda.
 * Usar para endpoints que retornan Blob (PDF, CSV, JSON descargable) o FormData.
 * @param {string} endpoint
 * @param {RequestInit} options
 */
export const fetchWithAuth = async (endpoint, options = {}) => {
    const token = await getToken();
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...authHeader, ...(options.headers || {}) },
    });
};

const apiClient = {
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: await buildHeaders(),
            });
            if (!response.ok) throw await buildApiError(response);
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] GET ${endpoint}:`, error.message);
            throw error;
        }
    },

    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: await buildHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) throw await buildApiError(response);
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] POST ${endpoint}:`, error.message);
            throw error;
        }
    },

    put: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: await buildHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) throw await buildApiError(response);
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] PUT ${endpoint}:`, error.message);
            throw error;
        }
    },

    patch: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PATCH',
                headers: await buildHeaders(),
                body: JSON.stringify(data),
            });
            if (!response.ok) throw await buildApiError(response);
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] PATCH ${endpoint}:`, error.message);
            throw error;
        }
    },

    delete: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: await buildHeaders(),
            });
            if (!response.ok) throw await buildApiError(response);
            return await response.json();
        } catch (error) {
            console.error(`[API ERROR] DELETE ${endpoint}:`, error.message);
            throw error;
        }
    },
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
    if (error.status) {
        console.error('Error del servidor:', error.status, error.message);
        throw new Error(error.data?.message || error.message || 'Error del servidor');
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Error de conexión. Verifica tu internet.');
    } else {
        console.error('Error desconocido:', error.message);
        throw error;
    }
};
