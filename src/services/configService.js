/**
 * configService.js
 * 
 * SERVICIO DE CONFIGURACIÓN Y CATÁLOGOS GLOBALES
 * 
 * ========================================
 * ENDPOINTS ESPERADOS EN BACKEND
 * ========================================
 * 
 * CONFIGURACIÓN:
 * GET    /api/config/financiera       - Obtener configuración
 * PUT    /api/config/financiera       - Actualizar configuración
 * 
 * CATÁLOGOS DE PROYECTO:
 * GET    /api/catalogos/tipos-proyecto     - Tipos
 * POST   /api/catalogos/tipos-proyecto     - Crear tipo
 * DELETE /api/catalogos/tipos-proyecto/:id - Eliminar tipo
 * 
 * GET    /api/catalogos/estados-proyecto   - Estados
 * 
 * CATÁLOGOS DE SERVICIOS:
 * GET    /api/catalogos/servicios          - Servicios disponibles
 * POST   /api/catalogos/servicios          - Crear servicio
 * DELETE /api/catalogos/servicios/:id      - Eliminar servicio
 * 
 * RESET:
 * POST   /api/admin/reset-data        - Limpiar todo (¡CUIDADO!)
 */

import apiClient from './apiClient';

// ========================================
// CONFIGURACIÓN FINANCIERA
// ========================================

/**
 * getFinancialConfig - Obtener configuración actual
 * 
 * @returns {Promise<Object>} - Configuración:
 *   {
 *     moneda: string,                    // 'COP', 'USD', etc.
 *     simbolo: string,                   // '$', '€', etc.
 *     tipo_cambio: number,               // Si es diferente a moneda base
 *     iva: number,                       // Porcentaje IVA (0-100)
 *     retension_fuente: number,          // Porcentaje retención (0-100)
 *     mes_inicio_fiscal: number,         // 0-11 (enero = 0)
 *     decimales: number,                 // Precisión (2 típicamente)
 *   }
 * 
 * FUTURO BACKEND:
 * GET /api/config/financiera
 */
export const getFinancialConfig = async () => {
    try {
        const data = await apiClient.get('/api/config/financiera');
        return data || null;
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return null;
    }
};

/**
 * updateFinancialConfig - Actualizar configuración
 * 
 * @param {Object} config - Nuevos valores
 * @returns {Promise<Object>} - Configuración actualizada
 */
export const updateFinancialConfig = async (config) => {
    try {
        const data = await apiClient.put('/api/config/financiera', config);
        return data || null;
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        return null;
    }
};

// ========================================
// CATÁLOGOS DE TIPOS DE PROYECTO
// ========================================

/**
 * getProjectTypes - Obtener lista de tipos de proyecto
 * 
 * @returns {Promise<Array>} - Tipos disponibles
 *   [
 *     { id: 1, nombre: 'Redesign Web', codigo: 'WEB' },
 *     { id: 2, nombre: 'Desarrollo App', codigo: 'APP' },
 *     { id: 3, nombre: 'Consultoría', codigo: 'CON' },
 *     ...
 *   ]
 * 
 * FUTURO BACKEND:
 * GET /api/catalogos/tipos-proyecto
 */
export const getProjectTypes = async () => {
    try {
        const data = await apiClient.get('/api/catalogos/tipos-proyecto');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo tipos de proyecto:', error);
        return [];
    }
};

/**
 * addProjectType - Crear nuevo tipo de proyecto
 * 
 * @param {Object} type - Datos del tipo:
 *   {
 *     nombre: string,   // Ej: "Redesign Web"
 *     codigo: string    // Ej: "WEB" (max 5 chars, único)
 *   }
 * @returns {Promise<Object>} - Tipo creado
 */
export const addProjectType = async (type) => {
    try {
        const data = await apiClient.post('/api/catalogos/tipos-proyecto', type);
        return data || null;
    } catch (error) {
        console.error('Error creando tipo de proyecto:', error);
        return null;
    }
};

/**
 * deleteProjectType - Eliminar tipo de proyecto
 * 
 * @param {number|string} id - ID del tipo
 * @returns {Promise<boolean>} - true si se eliminó
 * 
 * IMPORTANTE: Backend DEBE validar que no se use en proyectos activos
 * Si se intenta eliminar un tipo en uso → ERROR
 */
export const deleteProjectType = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? No se puede eliminar si hay proyectos usando este tipo.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(`/api/catalogos/tipos-proyecto/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando tipo de proyecto ${id}:`, error);
        return false;
    }
};

// ========================================
// CATÁLOGOS DE ESTADOS DE PROYECTO
// ========================================

/**
 * getProjectStatuses - Obtener lista de estados de proyecto
 * 
 * @returns {Promise<Array>} - Estados disponibles
 *   [
 *     { id: 1, nombre: 'Cotización', codigo: 'QUOTE' },
 *     { id: 2, nombre: 'Activo', codigo: 'ACTIVE' },
 *     { id: 3, nombre: 'Completado', codigo: 'COMPLETED' },
 *     { id: 4, nombre: 'En Pausa', codigo: 'PAUSED' },
 *     { id: 5, nombre: 'Cancelado', codigo: 'CANCELLED' },
 *     ...
 *   ]
 * 
 * FUTURO BACKEND:
 * GET /api/catalogos/estados-proyecto
 * 
 * NOTA: Estados típicamente son predefinidos (no se crean)
 */
export const getProjectStatuses = async () => {
    try {
        const data = await apiClient.get('/api/catalogos/estados-proyecto');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo estados de proyecto:', error);
        return [];
    }
};

export const addProjectStatus = async (status) => {
    try {
        const data = await apiClient.post('/api/catalogos/estados-proyecto', status);
        return data || null;
    } catch (error) {
        console.error('Error creando estado de proyecto:', error);
        return null;
    }
};

export const deleteProjectStatus = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? No se puede eliminar si hay proyectos usando este estado.'
        );
        if (!confirmDelete) return false;
        const result = await apiClient.delete(`/api/catalogos/estados-proyecto/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando estado de proyecto ${id}:`, error);
        return false;
    }
};

// ========================================
// CATÁLOGOS DE SERVICIOS
// ========================================

/**
 * getServices - Obtener catálogo de servicios
 * 
 * @returns {Promise<Array>} - Servicios disponibles
 *   [
 *     { id: 1, nombre: 'Diseño UX/UI', codigo: 'DESIGN' },
 *     { id: 2, nombre: 'Desarrollo Frontend', codigo: 'FRONTEND' },
 *     { id: 3, nombre: 'Desarrollo Backend', codigo: 'BACKEND' },
 *     { id: 4, nombre: 'Testing', codigo: 'QA' },
 *     ...
 *   ]
 * 
 * FUTURO BACKEND:
 * GET /api/catalogos/servicios
 */
export const getServices = async () => {
    try {
        const data = await apiClient.get('/api/catalogos/servicios');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return [];
    }
};

/**
 * addService - Crear nuevo servicio
 * 
 * @param {Object} service - Datos del servicio:
 *   {
 *     nombre: string,      // Ej: "Diseño UX/UI"
 *     codigo: string,      // Ej: "DESIGN" (único)
 *     descripcion: string  // Opcional
 *   }
 * @returns {Promise<Object>} - Servicio creado
 */
export const addService = async (service) => {
    try {
        const data = await apiClient.post('/api/catalogos/servicios', service);
        return data || null;
    } catch (error) {
        console.error('Error creando servicio:', error);
        return null;
    }
};

/**
 * deleteService - Eliminar servicio
 * 
 * @param {number|string} id - ID del servicio
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteService = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? Se eliminará el servicio del catálogo.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(`/api/catalogos/servicios/${id}`);
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando servicio ${id}:`, error);
        return false;
    }
};

// ========================================
// CATÁLOGOS DE TIPOS DE COSTO VARIABLE
// ========================================

/**
 * getVariableCostTypes - Obtener tipos de costo variable
 * 
 * @returns {Promise<Array>} - Tipos de costo
 *   [
 *     { id: 1, nombre: 'Licencias', codigo: 'LICENSES' },
 *     { id: 2, nombre: 'Hospedaje', codigo: 'HOSTING' },
 *     { id: 3, nombre: 'APIs', codigo: 'APIS' },
 *     ...
 *   ]
 */
export const getVariableCostTypes = async () => {
    try {
        const data = await apiClient.get('/api/catalogos/tipos-costo-variable');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo tipos de costo:', error);
        return [];
    }
};

/**
 * addVariableCostType - Crear tipo de costo variable
 * 
 * @param {Object} type - Datos:
 *   {
 *     nombre: string,   // Ej: "Licencias"
 *     codigo: string    // Único
 *   }
 * @returns {Promise<Object>} - Tipo creado
 */
export const addVariableCostType = async (type) => {
    try {
        const data = await apiClient.post(
            '/api/catalogos/tipos-costo-variable',
            type
        );
        return data || null;
    } catch (error) {
        console.error('Error creando tipo de costo:', error);
        return null;
    }
};

/**
 * deleteVariableCostType - Eliminar tipo de costo
 * 
 * @param {number|string} id - ID del tipo
 * @returns {Promise<boolean>} - true si se eliminó
 */
export const deleteVariableCostType = async (id) => {
    try {
        const confirmDelete = window.confirm(
            '¿Estás seguro? Se eliminará el tipo de costo del catálogo.'
        );
        
        if (!confirmDelete) return false;
        
        const result = await apiClient.delete(
            `/api/catalogos/tipos-costo-variable/${id}`
        );
        return result?.ok || result?.success || false;
    } catch (error) {
        console.error(`Error eliminando tipo de costo ${id}:`, error);
        return false;
    }
};

// ========================================
// DATOS Y LIMPIEZA (ADMINISTRADOR)
// ========================================

/**
 * resetAllData - ELIMINAR TODOS LOS DATOS
 * 
 * ¡¡¡ PELIGROSO !!!
 * 
 * Esto BORRA:
 * - Todos los proyectos
 * - Todos los costos (fijos y variables)
 * - Todos los socios y sus retiros
 * - Todos los ingresos y gastos
 * - PERO PRESERVA: Catálogos, configuración, historial de auditoría
 * 
 * FUTURO BACKEND:
 * POST /api/admin/reset-data
 * ⚠️  Requiere confirmación double-click y contraseña de admin
 */
export const resetAllData = async () => {
    try {
        const firstConfirmation = window.confirm(
            '⚠️ ADVERTENCIA: Esto eliminará TODOS los datos (proyectos, costos, socios).\n' +
            'Los catálogos y configuración se preservarán.\n' +
            '\n¿Estás COMPLETAMENTE seguro?'
        );
        
        if (!firstConfirmation) return false;
        
        // Doble confirmación para máxima seguridad
        const secondConfirmation = window.confirm(
            'Confirma escribiendo "RESET" en el siguiente prompt para proceder.\n' +
            'Esta acción es IRREVERSIBLE.'
        );
        
        if (!secondConfirmation) return false;
        
        const userInput = window.prompt('Escribe "RESET" para confirmar:', '');
        if (userInput !== 'RESET') {
            alert('Cancelado. Datos no eliminados.');
            return false;
        }
        
        const result = await apiClient.post('/api/admin/reset-data', {});
        return result?.success || false;
    } catch (error) {
        console.error('Error reseteando datos:', error);
        return false;
    }
};

/**
 * exportAllData - Exportar todos los datos a JSON
 * 
 * Crea un backup en JSON con:
 * - Todos los proyectos
 * - Todos los costos
 * - Todos los socios y retiros
 * - Configuración
 * - Timestamp de exportación
 * 
 * @returns {Promise<Blob>} - Archivo JSON descargable
 */
export const exportAllData = async () => {
    try {
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/export`,
            { method: 'GET' }
        );
        
        if (!response.ok) throw new Error('Error exportando datos');
        return await response.blob();
    } catch (error) {
        console.error('Error exportando datos:', error);
        return null;
    }
};

/**
 * importData - Importar datos desde JSON
 * 
 * @param {File} jsonFile - Archivo JSON generado por exportAllData()
 * @returns {Promise<boolean>} - true si se importó correctamente
 */
export const importData = async (jsonFile) => {
    try {
        const formData = new FormData();
        formData.append('file', jsonFile);
        
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/admin/import`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) throw new Error('Error importando datos');
        return true;
    } catch (error) {
        console.error('Error importando datos:', error);
        return false;
    }
};

// ========================================
// RESUMEN DE ESTRUCTURA DE CONFIGURACIÓN
// ========================================

/**
 * ESTRUCTURA TÍPICA DE CONFIGURACIÓN:
 * 
 * App Config {
 *   ├─ Financiero
 *   │  ├─ Moneda (COP, USD, EUR, etc.)
 *   │  ├─ Símbolo ($, €, etc.)
 *   │  ├─ IVA (porcentaje)
 *   │  ├─ Retención en la fuente
 *   │  └─ Mes inicio fiscal
 *   │
 *   ├─ Catálogos
 *   │  ├─ Tipos de Proyecto (predefinidos + custom)
 *   │  ├─ Estados de Proyecto (predefinidos)
 *   │  ├─ Servicios (custom, para costos variables)
 *   │  └─ Tipos de Costo (custom)
 *   │
 *   └─ Administración
 *      ├─ Exportar datos
 *      ├─ Importar datos
 *      └─ Reset (peligroso)
 * 
 * 
 * FLUJO TÍPICO:
 * 
 * 1. Administrator abre "Configuración"
 *    → configService.getFinancialConfig()
 *    → Muestra moneda, IVA, etc.
 * 
 * 2. Administrator quiere agregar un tipo de costo
 *    → configService.addVariableCostType({ nombre: "Licencias", codigo: "LIC" })
 *    → El tipo está disponible en todo el sistema
 * 
 * 3. Administrator quiere hacer backup
 *    → configService.exportAllData()
 *    → Descarga JSON con todo
 * 
 * 4. Cambio de máquina, importar backup
 *    → configService.importData(jsonFile)
 *    → Sistema restaurado a estado anterior
 */
