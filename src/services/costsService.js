/**
 * costsService.js
 * 
 * SERVICIO DE GESTIÓN DE COSTOS (FIJOS Y VARIABLES)
 * 
 * ========================================
 * ENDPOINTS ESPERADOS EN BACKEND
 * ========================================
 * 
 * COSTOS FIJOS:
 * GET    /api/costos-fijos             - Listar todos
 * POST   /api/costos-fijos             - Crear
 * PUT    /api/costos-fijos/:id         - Actualizar
 * DELETE /api/costos-fijos/:id         - Eliminar
 * 
 * COSTOS VARIABLES:
 * GET    /api/costos-variables         - Listar todos
 * POST   /api/costos-variables         - Crear
 * DELETE /api/costos-variables/:id     - Eliminar
 * 
 * SERVICIOS (catálogo):
 * GET    /api/servicios                - Listar todos
 * POST   /api/servicios                - Crear
 * DELETE /api/servicios/:id            - Eliminar
 * 
 * TIPOS DE COSTOS VARIABLES:
 * GET    /api/tipos-costos             - Listar todos
 * POST   /api/tipos-costos             - Crear
 * DELETE /api/tipos-costos/:id         - Eliminar
 */

import apiClient from './apiClient';

// ========================================
// COSTOS FIJOS (Gastos recurrentes)
// ========================================

/**
 * getFixedCosts - Obtener todos los costos fijos
 * 
 * @returns {Promise<Array>} - Lista de costos fijos
 */
export const getFixedCosts = async () => {
    try {
        const data = await apiClient.get('/api/costos-fijos');
        return data || null;
    } catch (error) {
        console.error('Error obteniendo costos fijos:', error);
        return null;
    }
};

/**
 * addFixedCost - Crear nuevo costo fijo
 * 
 * @param {Object} cost - Datos del costo:
 *   {
 *     service: string,              // Ej: "Hosting"
 *     category: string,             // Ej: "Hosting" (relacio a servicios)
 *     provider: string,             // Ej: "Kinsta"
 *     amount: number,               // $99.99
 *     frequency: string,            // "Mensual"
 *     paymentDate: string,          // Día del mes (1-31)
 *     date: string,                 // ISO date de inicio
 *     description: string           // Notas
 *   }
 * @returns {Promise<Object>} - Costo creado
 * 
 * FUTURO BACKEND:
 * POST /api/costos-fijos
 * 
 * IMPORTANTE:
 * - Se registra como transacción de tipo 'fixed_cost'
 * - Se deduce del balance inmediatamente
 * - Se repite cada mes (si está activo)
 */
export const addFixedCost = async (cost) => {
    try {
        const data = await apiClient.post('/api/costos-fijos', cost);
        return data || null;
    } catch (error) {
        console.error('Error creando costo fijo:', error);
        return null;
    }
};

/**
 * updateFixedCost - Actualizar costo fijo
 * 
 * @param {number|string} id - ID del costo
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - Costo actualizado
 */
export const updateFixedCost = async (id, updates) => {
    try {
        const data = await apiClient.put(`/api/costos-fijos/${id}`, updates);
        return data || null;
    } catch (error) {
        console.error(`Error actualizando costo fijo ${id}:`, error);
        return null;
    }
};

/**
 * deleteFixedCost - Eliminar costo fijo
 * 
 * @param {number|string} id - ID del costo
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteFixedCost = async (id) => {
    try {
        const result = await apiClient.delete(`/api/costos-fijos/${id}`);
        return result?.success || false;
    } catch (error) {
        console.error(`Error eliminando costo fijo ${id}:`, error);
        return false;
    }
};

// ========================================
// COSTOS VARIABLES (Gastos puntuales)
// ========================================

/**
 * getVariableCosts - Obtener todos los costos variables
 * 
 * @returns {Promise<Array>} - Lista de costos variables
 */
export const getVariableCosts = async () => {
    try {
        const data = await apiClient.get('/api/costos-variables');
        return data || null;
    } catch (error) {
        console.error('Error obteniendo costos variables:', error);
        return null;
    }
};

/**
 * addVariableCost - Crear nuevo costo variable
 * 
 * @param {Object} cost - Datos del costo:
 *   {
 *     type: string,                 // Ej: "Freelancer"
 *     amount: number,               // Cantidad
 *     date: string,                 // ISO date
 *     projectId: number,            // Opcional: asociar a proyecto
 *     observations: string,         // Notas
 *     description: string           // Descripción
 *   }
 * @returns {Promise<Object>} - Costo creado
 * 
 * FUTURO BACKEND:
 * POST /api/costos-variables
 * 
 * IMPORTANTE:
 * - Se registra como transacción de tipo 'variable_cost'
 * - Se puede asociar a un proyecto
 * - Se deduce del balance
 */
export const addVariableCost = async (cost) => {
    try {
        const data = await apiClient.post('/api/costos-variables', cost);
        return data || null;
    } catch (error) {
        console.error('Error creando costo variable:', error);
        return null;
    }
};

/**
 * deleteVariableCost - Eliminar costo variable
 * 
 * @param {number|string} id - ID del costo
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteVariableCost = async (id) => {
    try {
        const result = await apiClient.delete(`/api/costos-variables/${id}`);
        return result?.success || false;
    } catch (error) {
        console.error(`Error eliminando costo variable ${id}:`, error);
        return false;
    }
};

// ========================================
// CATÁLOGO DE SERVICIOS
// ========================================

/**
 * getServices - Obtener catálogo de servicios
 * 
 * @returns {Promise<Array>} - Lista de servicios
 */
export const getServices = async () => {
    try {
        const data = await apiClient.get('/api/servicios');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return [];
    }
};

/**
 * addService - Añadir nuevo servicio al catálogo
 * 
 * @param {string} name - Nombre del servicio
 * @returns {Promise<Object>} - Servicio creado
 */
export const addService = async (name) => {
    try {
        const data = await apiClient.post('/api/servicios', { name });
        return data || null;
    } catch (error) {
        console.error('Error creando servicio:', error);
        return null;
    }
};

/**
 * deleteService - Eliminar servicio del catálogo
 * 
 * @param {number|string} id - ID del servicio
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteService = async (id) => {
    try {
        const result = await apiClient.delete(`/api/servicios/${id}`);
        return result?.success || false;
    } catch (error) {
        console.error(`Error eliminando servicio ${id}:`, error);
        return false;
    }
};

// ========================================
// CATÁLOGO DE TIPOS DE COSTOS VARIABLES
// ========================================

/**
 * getVariableCostTypes - Obtener tipos de costos variables
 * 
 * @returns {Promise<Array>} - Lista de tipos
 */
export const getVariableCostTypes = async () => {
    try {
        const data = await apiClient.get('/api/tipos-costos');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo tipos de costos:', error);
        return [];
    }
};

/**
 * addVariableCostType - Añadir nuevo tipo de costo variable
 * 
 * @param {string} name - Nombre del tipo
 * @returns {Promise<Object>} - Tipo creado
 */
export const addVariableCostType = async (name) => {
    try {
        const data = await apiClient.post('/api/tipos-costos', { name });
        return data || null;
    } catch (error) {
        console.error('Error creando tipo de costo:', error);
        return null;
    }
};

/**
 * deleteVariableCostType - Eliminar tipo de costo variable
 * 
 * @param {number|string} id - ID del tipo
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteVariableCostType = async (id) => {
    try {
        const result = await apiClient.delete(`/api/tipos-costos/${id}`);
        return result?.success || false;
    } catch (error) {
        console.error(`Error eliminando tipo de costo ${id}:`, error);
        return false;
    }
};

// ========================================
// RESUMEN DE ARQUITECTURA
// ========================================

/**
 * IMPORTANTE:
 * 
 * Cuando el frontend llama a costsService.addFixedCost(), ACTUALMENTE:
 * 1. apiClient.post() retorna null
 * 2. El componente maneja null como "usar localStorage"
 * 3. FinanceContext guarda el costo
 * 4. Se registra transacción tipo 'fixed_cost'
 * 5. Se deduce del balance
 * 6. Todo se guarda en localStorage
 * 
 * CUANDO TENGAS BACKEND:
 * 1. apiClient.post() hace fetch real a /api/costos-fijos
 * 2. Backend valida datos
 * 3. Backend registra en MySQL:
 *    - costos_fijos (tabla principal)
 *    - transacciones (auditoría)
 *    - Actualiza balance global
 *    - Recalcula estadísticas
 * 4. Retorna costo creado con ID del servidor
 * 5. Frontend NO cambia (recibe mismo formato)
 * 
 * VALIDACIONES QUE BACKEND DEBE HACER:
 * - amount > 0
 * - paymentDate entre 1-31 (para costos fijos)
 * - frequency válida (Mensual, Semanal, etc)
 * - Si projectId está set, que el proyecto exista
 * - No duplicar registros en el mismo mes (evitar double-charges)
 */
