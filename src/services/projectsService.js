/**
 * projectsService.js
 * 
 * SERVICIO DE GESTIÓN DE PROYECTOS
 * 
 * ========================================
 * ARQUITECTURA
 * ========================================
 * 
 * Este servicio encapsula TODA la lógica de proyectos.
 * Los componentes NO llaman al Context directamente.
 * Los componentes llaman a este servicio.
 * 
 * Esto hace que cambiar de localStorage → backend sea trivial:
 * 1. Los componentes usan: projectsService.addProject(...)
 * 2. Actualmente el servicio llama: financeContext.addProject(...)
 * 3. Cuando tengas backend, el servicio llama: apiClient.post('/api/proyectos', ...)
 * 4. Los componentes NO cambian nada
 * 
 * ========================================
 * ENDPOINTS ESPERADOS EN BACKEND
 * ========================================
 * 
 * GET    /api/proyectos              - Listar todos
 * GET    /api/proyectos/:id          - Detalle
 * POST   /api/proyectos              - Crear
 * PUT    /api/proyectos/:id          - Actualizar
 * DELETE /api/proyectos/:id          - Eliminar
 * PATCH  /api/proyectos/:id/estado   - Cambiar estado
 * GET    /api/proyectos/:id/pagos    - Histórico de pagos
 * POST   /api/proyectos/:id/pagos    - Añadir pago
 */

import apiClient from './apiClient';

/**
 * getProjects - Obtener todos los proyectos
 * 
 * @returns {Promise<Array>} - Lista de proyectos
 * 
 * FLUJO ACTUAL:
 * 1. Llama a apiClient.get('/api/proyectos')
 * 2. Como el backend no existe, retorna null
 * 3. El componente maneja null como "usar datos locales"
 * 
 * FLUJO FUTURO (BACKEND):
 * 1. apiClient.get() hace fetch real
 * 2. Retorna datos desde MySQL
 * 3. Componente usa datos del servidor automáticamente
 */
export const getProjects = async () => {
    try {
        const data = await apiClient.get('/api/proyectos');
        
        // ACTUALENTE: No hay backend, retorna null
        // Componentes manejarán esto obteniendo datos de Context
        
        // FUTURO: Será array de proyectos desde MySQL
        return data || null;
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        return null; // Componente cae back a FinanceContext
    }
};

/**
 * getProject - Obtener detalle de un proyecto
 * 
 * @param {number|string} id - ID del proyecto
 * @returns {Promise<Object>} - Datos del proyecto
 * 
 * FUTURO BACKEND:
 * GET /api/proyectos/123
 */
export const getProject = async (id) => {
    try {
        const data = await apiClient.get(`/api/proyectos/${id}`);
        return data || null;
    } catch (error) {
        console.error(`Error obteniendo proyecto ${id}:`, error);
        return null;
    }
};

/**
 * addProject - Crear nuevo proyecto
 * 
 * @param {Object} project - Datos del proyecto:
 *   {
 *     name: string,
 *     type: string,
 *     status: string,
 *     clientName: string,
 *     clientRut: string,
 *     clientPhone: string,
 *     clientEmail: string,
 *     clientProfession: string,
 *     agreedAmount: number
 *   }
 * @returns {Promise<Object>} - Proyecto creado con ID
 * 
 * ACTUALMENTE:
 * 1. Se ignora (retorna null)
 * 2. FinanceContext lo maneja (genera ID, guarda en localStorage)
 * 
 * FUTURO BACKEND:
 * 1. POST /api/proyectos con datos
 * 2. Backend genera ID personalizado (NCW0001)
 * 3. Se guarda en MySQL
 * 4. Retorna proyecto creado
 * 
 * IMPORTANTE: Backend DEBE generar el ID, no el cliente
 */
export const addProject = async (project) => {
    try {
        // ACTUALMENTE: No enviamos a backend
        // Componente sabr que null = hacer en local
        
        const data = await apiClient.post('/api/proyectos', project);
        
        // FUTURO: Será { id, customId: 'NCW0001', ...project }
        return data || null;
    } catch (error) {
        console.error('Error creando proyecto:', error);
        return null;
    }
};

/**
 * updateProject - Actualizar un proyecto existente
 * 
 * @param {number|string} id - ID del proyecto
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} - Proyecto actualizado
 * 
 * FUTURO BACKEND:
 * PUT /api/proyectos/123
 */
export const updateProject = async (id, updates) => {
    try {
        const data = await apiClient.put(`/api/proyectos/${id}`, updates);
        return data || null;
    } catch (error) {
        console.error(`Error actualizando proyecto ${id}:`, error);
        return null;
    }
};

/**
 * updateProjectStatus - Cambiar estado de un proyecto
 * 
 * @param {number|string} id - ID del proyecto
 * @param {string} newStatus - Nuevo estado
 * @returns {Promise<Object>} - Proyecto actualizado
 * 
 * FUTURO BACKEND:
 * PATCH /api/proyectos/123/estado
 * Body: { status: 'En desarrollo' }
 */
export const updateProjectStatus = async (id, newStatus) => {
    try {
        const data = await apiClient.patch(`/api/proyectos/${id}/estado`, {
            estado_proyecto_id: newStatus
        });
        return data || null;
    } catch (error) {
        console.error(`Error actualizando estado del proyecto ${id}:`, error);
        return null;
    }
};

/**
 * deleteProject - Eliminar un proyecto
 * 
 * @param {number|string} id - ID del proyecto
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 * 
 * FUTURO BACKEND:
 * DELETE /api/proyectos/123
 * 
 * IMPORTANTE: Esto revierte TODOS los pagos del proyecto
 * El backend debe validar esto
 */
export const deleteProject = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? Se eliminarán todos los datos del proyecto incluidos pagos.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(`/api/proyectos/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando proyecto ${id}:`, error);
        return false;
    }
};

/**
 * getProjectPayments - Obtener histórico de pagos de un proyecto
 * 
 * @param {number|string} id - ID del proyecto
 * @returns {Promise<Array>} - Lista de pagos
 * 
 * FUTURO BACKEND:
 * GET /api/proyectos/123/pagos
 */
export const getProjectPayments = async (id) => {
    try {
        const data = await apiClient.get(`/api/proyectos/${id}/pagos`);
        return data || [];
    } catch (error) {
        console.error(`Error obteniendo pagos del proyecto ${id}:`, error);
        return [];
    }
};

/**
 * addProjectPayment - Registrar pago recibido del proyecto
 * 
 * @param {number|string} projectId - ID del proyecto
 * @param {Object} payment - Datos del pago:
 *   {
 *     date: string (ISO),
 *     amount: number,
 *     description: string,
 *     receipt: string (número de comprobante, opcional)
 *   }
 * @returns {Promise<Object>} - Pago registrado
 * 
 * FLUJO ACTUAL (localStorage):
 * 1. Se crea una transacción de tipo 'project_income'
 * 2. FinanceContext actualiza project.history
 * 3. FinanceContext actualiza balance global
 * 
 * FLUJO FUTURO (BACKEND):
 * 1. POST /api/proyectos/123/pagos con datos
 * 2. Backend:
 *    - Registra en proyecto_pagos
 *    - Valida monto ≤ monto_acordado
 *    - Actualiza balance global
 *    - Calcula estadísticas nuevas
 *    - Crea registro en transacciones (auditoría)
 * 3. Retorna pago registrado
 * 
 * IMPORTANTE: No es solo guardar el pago
 * También actualiza múltiples tablas en BD
 */
export const addProjectPayment = async (projectId, payment) => {
    try {
        const data = await apiClient.post(`/api/proyectos/${projectId}/pagos`, payment);
        return data || null;
    } catch (error) {
        console.error(`Error registrando pago para proyecto ${projectId}:`, error);
        return null;
    }
};

/**
 * deleteProjectPayment - Eliminar un pago (reversa de transacción)
 * 
 * @param {number|string} projectId - ID del proyecto
 * @param {number|string} paymentId - ID del pago
 * @returns {Promise<boolean>} - true si se eliminó
 * 
 * FUTURO BACKEND:
 * DELETE /api/proyectos/123/pagos/456
 * 
 * IMPORTANTE: Esto NO borra la transacción
 * Crea una TRANSACCIÓN INVERSA para auditoría completa
 */
export const deleteProjectPayment = async (projectId, paymentId) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? Se revertirá el pago y ajustará el balance.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(
            `/api/proyectos/${projectId}/pagos/${paymentId}`
        );
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando pago ${paymentId}:`, error);
        return false;
    }
};

/**
 * Catálogos de proyectos
 * (tipos de proyecto, estados, etc)
 */

export const getProjectTypes = async () => {
    try {
        const data = await apiClient.get('/api/proyectos/tipos');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo tipos de proyecto:', error);
        return [];
    }
};

export const addProjectType = async (type) => {
    try {
        const data = await apiClient.post('/api/proyectos/tipos', { name: type });
        return data || null;
    } catch (error) {
        console.error('Error creando tipo de proyecto:', error);
        return null;
    }
};

export const deleteProjectType = async (type) => {
    try {
        const result = await apiClient.delete(`/api/proyectos/tipos/${type}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error('Error eliminando tipo de proyecto:', error);
        return false;
    }
};

export const getProjectStatuses = async () => {
    try {
        const data = await apiClient.get('/api/proyectos/estados');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo estados de proyecto:', error);
        return [];
    }
};

export const addProjectStatus = async (status) => {
    try {
        const data = await apiClient.post('/api/proyectos/estados', { name: status });
        return data || null;
    } catch (error) {
        console.error('Error creando estado de proyecto:', error);
        return null;
    }
};

export const deleteProjectStatus = async (status) => {
    try {
        const result = await apiClient.delete(`/api/proyectos/estados/${status}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error('Error eliminando estado de proyecto:', error);
        return false;
    }
};

// ========================================
// RESUMEN
// ========================================

/**
 * ARQUITECTURA DE ESTE SERVICIO:
 * 
 * Los componentes NUNCA llaman a FinanceContext directamente.
 * Los componentes llaman a funciones en este archivo.
 * 
 * ACTUALMENTE:
 * - projectsService.addProject() → retorna null
 * - Componente ve null → usa FinanceContext (con useFinance hook)
 * - Datos se guardan en localStorage
 * 
 * CUANDO TENGAS BACKEND:
 * - projectsService.addProject() → llama apiClient.post()
 * - apiClient.post() → hace fetch a servidor
 * - Backend maneja todo (BD, cálculos, auditoría)
 * - Componente recibe datos del servidor
 * - localStorage es solo caché
 * 
 * CAMBIOS NECESARIOS:
 * 1. Configurar API_URL en apiClient.js
 * 2. Reemplazar console.log() con fetch real
 * 3. Agregar manejo de errores
 * 4. Agregar autenticación (JWT tokens)
 * 
 * LOS COMPONENTES NO CAMBIAN
 * LAS PÁGINAS NO CAMBIAN
 */
