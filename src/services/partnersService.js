/**
 * partnersService.js
 * 
 * SERVICIO DE GESTIÓN DE SOCIOS Y RETIROS
 * 
 * ========================================
 * ENDPOINTS ESPERADOS EN BACKEND
 * ========================================
 * 
 * SOCIOS:
 * GET    /api/socios                    - Listar todos
 * POST   /api/socios                    - Crear socio
 * PUT    /api/socios/:id                - Actualizar
 * DELETE /api/socios/:id                - Eliminar
 * PATCH  /api/socios/:id/porcentaje     - Cambiar porcentaje
 * 
 * RETIROS:
 * GET    /api/socios/:id/retiros        - Histórico de retiros
 * POST   /api/socios/:id/retiros        - Registrar retiro
 * DELETE /api/socios/:id/retiros/:rid   - Eliminar retiro
 * 
 * DISTRIBUCIÓN:
 * GET    /api/socios/:id/disponible     - Dinero disponible para retirar
 */

import apiClient from './apiClient';

const isNotFoundDelete = (error) => Number(error?.status) === 404;
const toQueryString = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.append(key, String(value));
    });
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

// ========================================
// SOCIOS
// ========================================

/**
 * getPartners - Obtener todos los socios
 * 
 * @returns {Promise<Array>} - Lista de socios
 * 
 * Cada socio tiene:
 * - id, name, percentage, email, telefono
 * - withdrawals: histórico de retiros
 * - disponible: dinero que puede retirar este mes
 */
export const getPartners = async (params = {}) => {
    try {
        const data = await apiClient.get(`/api/socios${toQueryString(params)}`);
        return data || null;
    } catch (error) {
        console.error('Error obteniendo socios:', error);
        return null;
    }
};

/**
 * getPartner - Obtener detalle de un socio
 * 
 * @param {number|string} id - ID del socio
 * @returns {Promise<Object>} - Datos del socio
 */
export const getPartner = async (id) => {
    try {
        const data = await apiClient.get(`/api/socios/${id}`);
        return data || null;
    } catch (error) {
        console.error(`Error obteniendo socio ${id}:`, error);
        return null;
    }
};

/**
 * addPartner - Crear nuevo socio
 * 
 * @param {Object} partner - Datos del socio:
 *   {
 *     name: string,           // Nombre (ej: "Dan Sepúlveda")
 *     email: string,          // Email
 *     phone: string,          // Teléfono
 *     percentage: number      // Participación %
 *   }
 * @returns {Promise<Object>} - Socio creado
 * 
 * IMPORTANTE:
 * - No modifica balance directamente
 * - Solo se crea el registro del socio
 * - Sus retiros se registran después con addWithdrawal()
 */
export const addPartner = async (partner) => {
    try {
        const data = await apiClient.post('/api/socios', partner);
        return data || null;
    } catch (error) {
        console.error('Error creando socio:', error);
        return null;
    }
};

/**
 * updatePartner - Actualizar datos del socio
 * 
 * @param {number|string} id - ID del socio
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - Socio actualizado
 */
export const updatePartner = async (id, updates) => {
    try {
        const data = await apiClient.put(`/api/socios/${id}`, updates);
        return data || null;
    } catch (error) {
        console.error(`Error actualizando socio ${id}:`, error);
        return null;
    }
};

/**
 * updatePartnerPercentage - Cambiar porcentaje de participación
 * 
 * @param {number|string} id - ID del socio
 * @param {number} newPercentage - Nuevo porcentaje (0-100)
 * @returns {Promise<Object>} - Socio actualizado
 * 
 * IMPORTANTE:
 * - Backend DEBE validar que sum(todos los porcentajes) = 100%
 * - ERROR si la suma no es 100
 * - Cambio es inmediato para cálculos futuros
 */
export const updatePartnerPercentage = async (id, newPercentage) => {
    try {
        const data = await apiClient.patch(`/api/socios/${id}/porcentaje`, {
            percentage: newPercentage
        });
        return data || null;
    } catch (error) {
        console.error(`Error actualizando porcentaje del socio ${id}:`, error);
        return null;
    }
};

/**
 * deletePartner - Eliminar socio
 * 
 * @param {number|string} id - ID del socio
 * @returns {Promise<boolean>} - true si se eliminó
 * 
 * IMPORTANTE:
 * - El backend elimina el socio junto a su historial asociado
 * - Acción irreversible
 */
export const deletePartner = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? El socio se desactivará y dejará de verse en el sistema.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(`/api/socios/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        if (isNotFoundDelete(error)) return true;
        console.error(`Error eliminando socio ${id}:`, error);
        return false;
    }
};

// ========================================
// RETIROS DE SOCIOS
// ========================================

/**
 * getWithdrawals - Obtener histórico de retiros de un socio
 * 
 * @param {number|string} partnerId - ID del socio
 * @returns {Promise<Array>} - Lista de retiros
 */
export const getWithdrawals = async (partnerId, params = {}) => {
    try {
        const data = await apiClient.get(`/api/socios/${partnerId}/retiros${toQueryString(params)}`);
        return data || [];
    } catch (error) {
        console.error(`Error obteniendo retiros del socio ${partnerId}:`, error);
        return [];
    }
};

/**
 * addWithdrawal - Registrar retiro de socio
 * 
 * @param {number|string} partnerId - ID del socio
 * @param {Object} withdrawal - Datos del retiro:
 *   {
 *     amount: number,                // Cantidad a retirar
 *     date: string,                  // ISO date
 *     description: string,           // Motivo/notas
 *     receipt: string                // Comprobante (opcional)
 *   }
 * @returns {Promise<Object>} - Retiro registrado
 * 
 * FLUJO ACTUAL (localStorage):
 * 1. Se crea transacción tipo 'withdrawal'
 * 2. FinanceContext deduce del balance
 * 3. FinanceContext agrega a partner.withdrawals
 * 
 * FLUJO FUTURO (BACKEND):
 * 1. POST /api/socios/123/retiros
 * 2. Backend VALIDA:
 *    - amount > 0
 *    - disponible >= amount
 *      donde disponible = (utilidad_neta_mes × porcentaje_socio) - retiros_mes
 *    - Si validación falla → ERROR
 * 3. Si válido:
 *    - Registra en retiros_socios
 *    - Crea transacción tipo 'withdrawal' (auditoría)
 *    - Deduce del balance
 * 4. Retorna retiro registrado
 * 
 * IMPORTANTE: Backend DEBE validar disponible
 * No permitir retirar más de lo que tiene
 */
export const addWithdrawal = async (partnerId, withdrawal) => {
    try {
        const data = await apiClient.post(`/api/socios/${partnerId}/retiros`, withdrawal);
        return data || null;
    } catch (error) {
        console.error(`Error registrando retiro para socio ${partnerId}:`, error);
        return {
            ok: false,
            message: error?.message || 'Error registrando retiro',
            error: error?.data || null
        };
    }
};

/**
 * deleteWithdrawal - Eliminar retiro (reversa)
 * 
 * @param {number|string} partnerId - ID del socio
 * @param {number|string} withdrawalId - ID del retiro
 * @returns {Promise<boolean>} - true si se eliminó
 * 
 * IMPORTANTE: No borra, crea TRANSACCIÓN INVERSA
 * Mantiene auditoría completa
 */
export const deleteWithdrawal = async (partnerId, withdrawalId) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? Se revertirá el retiro y se devolverá el dinero.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(
            `/api/socios/${partnerId}/retiros/${withdrawalId}`
        );
        return result?.ok || result?.success || false;
    } catch (error) {
        if (isNotFoundDelete(error)) return true;
        console.error(`Error eliminando retiro ${withdrawalId}:`, error);
        return false;
    }
};

// ========================================
// CALCULAR DISPONIBLE (Helper Utility)
// ========================================

/**
 * getAvailableAmount - Calcular dinero disponible para un socio
 * 
 * @param {number|string} partnerId - ID del socio
 * @param {number} month - Mes (0-11)
 * @param {number} year - Año
 * @returns {Promise<Object>} - Información de disponible
 *   {
 *     asignado: number,       // Utilidad asignada este mes
 *     retiros: number,        // Ya retirado
 *     disponible: number      // Lo que puede retirar
 *   }
 * 
 * FÓRMULA (esto lo calcula el backend):
 * disponible = (utilidad_neta_mes × porcentaje_socio) - retiros_mes
 * 
 * FUTURO BACKEND:
 * GET /api/socios/123/disponible?mes=2&año=2026
 */
export const getAvailableAmount = async (partnerId, month = null, year = null) => {
    try {
        const params = new URLSearchParams();
        if (month !== null) params.append('mes', month);
        if (year !== null) params.append('year', year);
        
        const query = params.toString();
        const url = query
            ? `/api/socios/${partnerId}/disponible?${query}`
            : `/api/socios/${partnerId}/disponible`;
        
        const data = await apiClient.get(url);
        return data || null;
    } catch (error) {
        console.error(`Error obteniendo disponible para socio ${partnerId}:`, error);
        return null;
    }
};

// ========================================
// RESUMEN DE ARQUITECTURA
// ========================================

/**
 * FLUJO TÍPICO EN LA APLICACIÓN:
 * 
 * 1. Usuario abre "Socios" page
 *    → Llama getPartners()
 *    → Si retorna null, usa datos de FinanceContext (local)
 *    → Si retorna array, usa datos del servidor
 * 
 * 2. Usuario ve lista de socios y sus porcentajes
 *    → Si hace clic en "cambiar %"
 *    → Llama updatePartnerPercentage(id, newPercent)
 *    → Si null, FinanceContext actualiza local
 *    → Si object, ya está actualizado en servidor
 * 
 * 3. Usuario registra retiro
 *    → Llama addWithdrawal(partnerId, { amount, date, ... })
 *    → Si null, FinanceContext actualiza local
 *    → Si object, ya está en servidor
 * 
 * 4. Cada mes, usuario ve reportes
 *    → Sistema calcula utilidad neta
 *    → Por cada socio: utilidad × porcentaje = asignado
 *    → Disponible = asignado - retiros_hechos
 *    → Usuario ve cuánto puede retirar
 * 
 * IMPORTANTE: Backend DEBE validar
 * - No permitir retirar > disponible
 * - Porcentajes sumen 100%
 * - Mantener auditoría de todo
 */
