/**
 * reportsService.js
 * 
 * SERVICIO DE REPORTES Y ESTADÍSTICAS FINANCIERAS
 * 
 * ========================================
 * ENDPOINTS ESPERADOS EN BACKEND
 * ========================================
 * 
 * REPORTES:
 * GET    /api/reportes/financiero              - Resumen financiero actual
 * GET    /api/reportes/mensual?mes=M&año=YYYY  - Rpt. mensual
 * GET    /api/reportes/anual?año=YYYY          - Rpt. anual
 * GET    /api/reportes/proyectos               - Estado de proyectos
 * GET    /api/reportes/socios                  - Distribución de socios
 */

import apiClient from './apiClient';

// ========================================
// ESTADÍSTICAS FINANCIERAS GENERALES
// ========================================

/**
 * getFinancialStats - Obtener resumen financiero actual
 * 
 * @returns {Promise<Object>} - Estadísticas:
 *   {
 *     periodo: { mes: number, año: number },
 *     ingresos: { 
 *       total: number,
 *       porProyecto: { [projectId]: number }
 *     },
 *     gastos: {
 *       costosFijos: number,
 *       costosVariables: number,
 *       total: number,
 *       porProyecto: { [projectId]: number }
 *     },
 *     deducciones: {
 *       retiros: number,
 *       otros: number,
 *       total: number
 *     },
 *     utilidad: {
 *       bruta: number,        // ingresos - gastos
 *       neta: number,         // bruta - deducciones
 *       porcentaje: number    // neta / ingresos (si ingresos > 0)
 *     },
 *     balance: {
 *       pesos: number,        // Dinero disponible
 *       pendientes: number    // Por cobrar
 *     },
 *     socios: {
 *       total: number,
 *       distribuibles: {
 *         [partnerId]: { porcentaje: number, asignado: number, retirado: number, disponible: number }
 *       }
 *     }
 *   }
 * 
 * FÓRMULAS CRÍTICAS:
 * ─────────────────────────────────────────────────────────────
 * 1. INGRESOS
 *    ingresos_total = SUM(ALL pagos de proyectos)
 *    ingresos_mes = SUM(pagos donde fecha ENTRE mes_inicio Y mes_fin)
 * 
 * 2. GASTOS
 *    gastos_fijos_total = SUM(todos costos fijos)
 *    gastos_variables_total = SUM(todos costos variables)
 *    gastos_mes = SUM(gastos donde fecha ENTRE mes_inicio Y mes_fin)
 * 
 * 3. UTILIDAD BRUTA
 *    utilidad_bruta = ingresos_mes - gastos_mes
 * 
 * 4. DEDUCCIONES (retiros, otros)
 *    deducciones = SUM(retiros_mes) + SUM(otros_mes)
 * 
 * 5. UTILIDAD NETA
 *    utilidad_neta = utilidad_bruta - deducciones
 * 
 * 6. DISTRIBUCIÓN A SOCIOS
 *    Para cada socio:
 *      asignado = utilidad_neta × porcentaje_socio
 *      retirado = SUM(retiros_socio_mes)
 *      disponible = asignado - retirado
 * 
 * 7. BALANCE PESOS
 *    balance = SUM(transactions con saldo = dinero disponible)
 * 
 * 8. MARGEN
 *    margen_pct = (utilidad_neta / ingresos_mes) × 100
 * ─────────────────────────────────────────────────────────────
 */
export const getFinancialStats = async () => {
    try {
        const data = await apiClient.get('/api/reportes/financiero');
        return data || null;
    } catch (error) {
        console.error('Error obteniendo estadísticas financieras:', error);
        return null;
    }
};

/**
 * getReportStats - Obtener estadísticas de reporte (alias)
 * 
 * @returns {Promise<Object>} - Mismo que getFinancialStats()
 * 
 * NOTA: Este método es idéntico a getFinancialStats()
 * Existe para compatibilidad con código existente
 */
export const getReportStats = async () => {
    // Mismo que getFinancialStats
    return getFinancialStats();
};

// ========================================
// REPORTES POR PERÍODO
// ========================================

/**
 * getMonthlyStats - Obtener estadísticas de un mes
 * 
 * @param {number} month - Mes (0-11, donde 0 = enero)
 * @param {number} year - Año (ej: 2026)
 * @returns {Promise<Object>} - Estadísticas del mes
 *   {
 *     mes: number,
 *     año: number,
 *     ingresos_total: number,
 *     gastos_total: number,
 *     utilidad_bruta: number,
 *     deducciones: number,
 *     utilidad_neta: number,
 *     margen_pct: number,
 *     proyectos: [
 *       { id, nombre, ingresos, gastos, utilidad },
 *       ...
 *     ],
 *     socios: [
 *       { id, nombre, porcentaje, asignado, retirado, disponible },
 *       ...
 *     ]
 *   }
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/mensual?mes=2&año=2026
 */
export const getMonthlyStats = async (month, year) => {
    try {
        const data = await apiClient.get(
            `/api/reportes/mensual?mes=${month}&año=${year}`
        );
        return data || null;
    } catch (error) {
        console.error(`Error obteniendo reporte mensual ${month}/${year}:`, error);
        return null;
    }
};

/**
 * getYearlyStats - Obtener estadísticas de un año
 * 
 * @param {number} year - Año (ej: 2026)
 * @returns {Promise<Object>} - Estadísticas anuales
 *   {
 *     año: number,
 *     meses: [
 *       { mes: 0, ingresos, gastos, utilidad, margen_pct },
 *       { mes: 1, ingresos, gastos, utilidad, margen_pct },
 *       ...
 *     ],
 *     totales: {
 *       ingresos: number,
 *       gastos: number,
 *       utilidad: number,
 *       margen_pct: number
 *     },
 *     promedio_mensual: {
 *       ingresos: number,
 *       gastos: number,
 *       utilidad: number,
 *       margen_pct: number
 *     }
 *   }
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/anual?año=2026
 */
export const getYearlyStats = async (year) => {
    try {
        const data = await apiClient.get(`/api/reportes/anual?año=${year}`);
        return data || null;
    } catch (error) {
        console.error(`Error obteniendo reporte anual ${year}:`, error);
        return null;
    }
};

// ========================================
// REPORTES POR ENTIDAD
// ========================================

/**
 * getProjectsReport - Reporte por proyectos
 * 
 * @returns {Promise<Array>} - Lista de proyectos con su estado
 *   [
 *     {
 *       id,
 *       nombre,
 *       estado,
 *       ingresos_total: number,
 *       gastos_total: number,
 *       utilidad: number,
 *       costosFijos: number,
 *       costosVariables: number,
 *       margen_pct: number,
 *       estado_pago: 'pagado' | 'parcial' | 'pendiente'
 *     },
 *     ...
 *   ]
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/proyectos
 */
export const getProjectsReport = async () => {
    try {
        const data = await apiClient.get('/api/reportes/proyectos');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo reporte de proyectos:', error);
        return [];
    }
};

/**
 * getPartnersReport - Reporte de distribución a socios
 * 
 * @returns {Promise<Array>} - Lista de socios con su distribución
 *   [
 *     {
 *       id,
 *       nombre,
 *       porcentaje,
 *       utilidad_asignada: number,    // Total histórico
 *       retiros_totales: number,      // Total histórico
 *       saldo: number,                // asignada - retiros
 *       mes_actual: {
 *         asignado: number,
 *         retirado: number,
 *         disponible: number
 *       }
 *     },
 *     ...
 *   ]
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/socios
 */
export const getPartnersReport = async () => {
    try {
        const data = await apiClient.get('/api/reportes/socios');
        return data || [];
    } catch (error) {
        console.error('Error obteniendo reporte de socios:', error);
        return [];
    }
};

/**
 * getCostsReport - Reporte de costos
 * 
 * @returns {Promise<Object>} - Análisis de costos
 *   {
 *     costos_fijos: {
 *       total: number,
 *       items: [
 *         { concepto, monto, mes_creado }
 *       ]
 *     },
 *     costos_variables: {
 *       total: number,
 *       porMes: {
 *         [mes]: { total, items }
 *       }
 *     },
 *     total_mensual: number,
 *     total_anual: number
 *   }
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/costos
 */
export const getCostsReport = async () => {
    try {
        const data = await apiClient.get('/api/reportes/costos');
        return data || null;
    } catch (error) {
        console.error('Error obteniendo reporte de costos:', error);
        return null;
    }
};

// ========================================
// EXPORTAR REPORTES
// ========================================

/**
 * exportReportToPDF - Exportar reporte a PDF
 * 
 * @param {string} reportType - Tipo: 'mensual' | 'anual' | 'general'
 * @param {Object} params - Parámetros (mes, año, etc.)
 * @returns {Promise<Blob>} - Archivo PDF
 * 
 * FUTURO BACKEND:
 * GET /api/reportes/export/pdf?tipo=mensual&mes=2&año=2026
 */
export const exportReportToPDF = async (reportType, params) => {
    try {
        const queryParams = new URLSearchParams({ tipo: reportType, ...params });
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/reportes/export/pdf?${queryParams}`,
            { method: 'GET' }
        );
        
        if (!response.ok) throw new Error('Error exportando PDF');
        return await response.blob();
    } catch (error) {
        console.error('Error exportando reportes:', error);
        return null;
    }
};

/**
 * exportReportToCSV - Exportar reporte a CSV
 * 
 * @param {string} reportType - Tipo: 'mensual' | 'anual' | 'socios' | 'proyectos'
 * @param {Object} params - Parámetros
 * @returns {Promise<Blob>} - Archivo CSV
 */
export const exportReportToCSV = async (reportType, params) => {
    try {
        const queryParams = new URLSearchParams({ tipo: reportType, ...params });
        const response = await fetch(
            `${process.env.REACT_APP_API_URL}/api/reportes/export/csv?${queryParams}`,
            { method: 'GET' }
        );
        
        if (!response.ok) throw new Error('Error exportando CSV');
        return await response.blob();
    } catch (error) {
        console.error('Error exportando reportes:', error);
        return null;
    }
};

// ========================================
// FÓRMULAS CRÍTICAS (DOCUMENTACIÓN)
// ========================================

/**
 * IMPORTANTE: FÓRMULAS PARA BACKEND
 * 
 * El backend DEBE implementar estas fórmulas exactamente así:
 * 
 * ┌────────────────────────────────────────────────────────────┐
 * │ CÁLCULO DE UTILIDAD NETA (MES ACTUAL)                     │
 * ├────────────────────────────────────────────────────────────┤
 * │                                                            │
 * │ Paso 1: INGRESOS DEL MES                                  │
 * │ ─────────────────────────                                 │
 * │ ingresos = SUM(pagos.monto)                               │
 * │            WHERE pagos.fecha BETWEEN mes_inicio Y mes_fin │
 * │                                                            │
 * │ Paso 2: GASTOS FIJOS (MENSUALES)                          │
 * │ ─────────────────────────                                 │
 * │ gastos_fijos = SUM(fixed_costs.monto)                     │
 * │               WHERE fixed_costs.activo = true             │
 * │                                                            │
 * │ Paso 3: GASTOS VARIABLES (MENSUALES)                      │
 * │ ──────────────────────────                                │
 * │ gastos_variables = SUM(variable_costs.monto)              │
 * │                    WHERE fecha BETWEEN mes_inicio Y mes_fin│
 * │                                                            │
 * │ Paso 4: TOTAL GASTOS                                      │
 * │ ──────────────────                                        │
 * │ gastos_total = gastos_fijos + gastos_variables            │
 * │                                                            │
 * │ Paso 5: UTILIDAD BRUTA                                    │
 * │ ────────────────────                                      │
 * │ utilidad_bruta = ingresos - gastos_total                  │
 * │                                                            │
 * │ Paso 6: RETIROS (DEDUCCIONES)                             │
 * │ ──────────────────────────                                │
 * │ retiros_totales = SUM(withdrawals.monto)                  │
 * │                   WHERE fecha BETWEEN mes_inicio Y mes_fin│
 * │                                                            │
 * │ Paso 7: UTILIDAD NETA                                     │
 * │ ─────────────────                                         │
 * │ utilidad_neta = utilidad_bruta - retiros_totales          │
 * │                                                            │
 * │ Paso 8: DISTRIBUCIÓN POR SOCIO (CADA UNO)                │
 * │ ─────────────────────────────────────────                │
 * │ para cada socio:                                          │
 * │   asignado_socio = utilidad_neta × (socio.porcentaje/100) │
 * │   retirado_socio = SUM(withdrawals[socio].monto)          │
 * │   disponible_socio = asignado_socio - retirado_socio      │
 * │                                                            │
 * │ Paso 9: MARGEN DE GANANCIA                                │
 * │ ────────────────────────                                  │
 * │ margen_pct = (utilidad_neta / ingresos) × 100             │
 * │              (si ingresos > 0, else 0)                    │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 * 
 * VALIDACIONES CRÍTICAS:
 * ────────────────────────
 * ✓ Mes válido (0-11) y año válido (> 1900)
 * ✓ SUM(socios.porcentaje) == 100%
 * ✓ No permitir retiro si disponible < monto
 * ✓ Mantener auditoría de cada cálculo
 * ✓ Usar precisión decimal (no enteros) para dinero
 * 
 * EJEMPLO CONCRETO:
 * ─────────────────
 * Mes: Enero 2026 (mes=0, año=2026)
 * 
 * Ingresos del mes:  $100,000
 * Costos fijos:      $20,000
 * Costos variables:  $30,000
 * ─────────────────────────────
 * Utilidad bruta:    $50,000
 * Retiros mes:       $10,000
 * ─────────────────────────────
 * Utilidad neta:     $40,000
 * 
 * Socios:
 * - Dan: 70% × $40,000 = $28,000 (ya retiró $5,000, disponible: $23,000)
 * - Carlos: 30% × $40,000 = $12,000 (ya retiró $2,000, disponible: $10,000)
 * 
 * Margen:
 * ($40,000 / $100,000) × 100 = 40%
 */

