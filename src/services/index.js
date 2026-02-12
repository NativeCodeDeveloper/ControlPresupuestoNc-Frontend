/**
 * index.js - Exportación centralizada de servicios
 * 
 * Este archivo actúa como "barrel export" para facilitar
 * la importación de servicios desde cualquier componente.
 * 
 * IMPORTAR EN COMPONENTES:
 * ─────────────────────────────
 * 
 * Manera antigua (SIN servicios):
 * ───────────────────────────────
 * import { useFinance } from '../context/FinanceContext';
 * 
 * const { projects, addProject } = useFinance();
 * 
 * 
 * Manera nueva (CON servicios):
 * ────────────────────────────────
 * import * as projectsService from '../services';
 * 
 * const handleAddProject = async (projectData) => {
 *     const result = await projectsService.addProject(projectData);
 *     if (result === null) {
 *         // Usar FinanceContext como fallback
 *         financeContext.addProject(projectData);
 *     } else {
 *         // Usar resultado del servidor
 *     }
 * };
 */

// ============================================
// API CLIENT - HTTP ABSTRACTION LAYER
// ============================================

export {
    get,
    post,
    put,
    patch,
    delete as deleteRequest,
    setAuthToken,
    getAuthToken,
    handleApiError
} from './apiClient';

// ============================================
// PROJECTS SERVICE
// ============================================

export {
    getProjects,
    getProject,
    addProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
    getProjectPayments,
    addProjectPayment,
    deleteProjectPayment,
    getProjectTypes,
    addProjectType,
    deleteProjectType,
    getProjectStatuses
} from './projectsService';

// ============================================
// COSTS SERVICE
// ============================================

export {
    // Fixed costs
    getFixedCosts,
    addFixedCost,
    updateFixedCost,
    deleteFixedCost,
    // Variable costs
    getVariableCosts,
    addVariableCost,
    deleteVariableCost,
    // Services catalog
    getServices,
    addService,
    deleteService,
    // Cost types
    getVariableCostTypes,
    addVariableCostType,
    deleteVariableCostType
} from './costsService';

// ============================================
// PARTNERS SERVICE
// ============================================

export {
    getPartners,
    getPartner,
    addPartner,
    updatePartner,
    updatePartnerPercentage,
    deletePartner,
    getWithdrawals,
    addWithdrawal,
    deleteWithdrawal,
    getAvailableAmount
} from './partnersService';

// ============================================
// REPORTS SERVICE
// ============================================

export {
    getFinancialStats,
    getReportStats,
    getMonthlyStats,
    getYearlyStats,
    getProjectsReport,
    getPartnersReport,
    getCostsReport,
    exportReportToPDF,
    exportReportToCSV
} from './reportsService';

// ============================================
// FINANCE SERVICE (RESUMEN + VENCIMIENTOS)
// ============================================

export {
    getFinancialSummary,
    getDueAlerts
} from './financeService';

// ============================================
// INVESTMENTS SERVICE
// ============================================

export {
    getInvestments,
    addInvestment,
    deleteInvestment
} from './investmentsService';

// ============================================
// CONFIG SERVICE
// ============================================

export {
    getFinancialConfig,
    updateFinancialConfig,
    getProjectTypes as getConfigProjectTypes,
    addProjectType as addConfigProjectType,
    deleteProjectType as deleteConfigProjectType,
    getProjectStatuses as getConfigProjectStatuses,
    getVariableCostTypes as getConfigVariableCostTypes,
    addVariableCostType as addConfigVariableCostType,
    deleteVariableCostType as deleteConfigVariableCostType,
    resetAllData,
    exportAllData,
    importData
} from './configService';

// ============================================
// DOCUMENTACIÓN DE MIGRACIÓN GRADUAL
// ============================================

/**
 * PLAN DE MIGRACIÓN DE COMPONENTES
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * La arquitectura de servicios permite una migración GRADUAL:
 * No es necesario cambiar TODO de una vez.
 * Puedes migrar componentes uno por uno.
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * FASE 1: Importar servicios en componentes
 * ──────────────────────────────────────────
 * 
 * ANTES:
 * ------
 * import { useFinance } from '../context/FinanceContext';
 * 
 * export default function Dashboard() {
 *     const { projects, addProject } = useFinance();
 *     
 *     const handleAdd = () => addProject({ name: 'Nuevo' });
 * }
 * 
 * 
 * DESPUÉS:
 * --------
 * import * as projectsService from '../services';
 * import { useFinance } from '../context/FinanceContext';
 * 
 * export default function Dashboard() {
 *     const financeContext = useFinance();
 *     
 *     const handleAdd = async () => {
 *         // Intenta usar servicio
 *         const result = await projectsService.addProject({ name: 'Nuevo' });
 *         
 *         // Si no hay backend, usa contexto
 *         if (result === null) {
 *             financeContext.addProject({ name: 'Nuevo' });
 *         }
 *     };
 * }
 * 
 * 
 * VENTAJAS INMEDIATAS:
 * - Componente sigue funcionando exactamente igual
 * - Preparado para backend
 * - Sin cambios en UI
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * FASE 2: Cuando backend esté listo
 * ────────────────────────────────────
 * 
 * SOLO CAMBIAR: src/services/apiClient.js
 * 
 * Cambiar ESTO:
 * ─────────────
 * export const get = async (endpoint) => {
 *     // Simulando con null
 *     return null;
 * };
 * 
 * 
 * POR ESTO:
 * ─────────
 * export const get = async (endpoint) => {
 *     const response = await fetch(`${API_URL}${endpoint}`, {
 *         method: 'GET',
 *         headers: {
 *             'Authorization': `Bearer ${getAuthToken()}`,
 *             'Content-Type': 'application/json'
 *         }
 *     });
 *     
 *     if (!response.ok) {
 *         throw handleApiError(response);
 *     }
 *     
 *     return await response.json();
 * };
 * 
 * 
 * Y LISTO. Los componentes siguen siendo exactamente iguales.
 * Todos los servicios ahora usan el backend real.
 * 
 * ═══════════════════════════════════════════════════════════════
 * 
 * FASES DE MIGRACIÓN RECOMENDADAS:
 * 
 * Fase 1 (Semana 1): Componentes más independientes
 *   - Config.jsx
 *   - Socios.jsx (menos dependencias)
 * 
 * Fase 2 (Semana 2): Datos básicos
 *   - Gastos.jsx (costos fijos y variables)
 *   - Ingresos.jsx (proyectos y pagos)
 * 
 * Fase 3 (Semana 3): Lógica compleja
 *   - Dashboard.jsx (usa múltiples servicios)
 *   - Reportes.jsx (cálculos de utilidades)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * TABLA DE MAPEO: COMPONENTES → SERVICIOS
 * 
 * ┌──────────────────┬─────────────────────────────────────────┐
 * │ COMPONENTE       │ SERVICIOS QUE USA                       │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Dashboard.jsx    │ - projectsService (getProjects)         │
 * │                  │ - reportsService (getFinancialStats)    │
 * │                  │ - partnersService (getPartners)         │
 * │                  │ - costsService (getCosts)               │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Ingresos.jsx     │ - projectsService (*)                   │
 * │                  │   getProjects, addProject,              │
 * │                  │   updateProjectStatus,                  │
 * │                  │   addProjectPayment                     │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Gastos.jsx       │ - costsService (*)                      │
 * │                  │   getFixedCosts, addFixedCost,          │
 * │                  │   getVariableCosts, addVariableCost     │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Socios.jsx       │ - partnersService (*)                   │
 * │                  │   getPartners, addPartner,              │
 * │                  │   updatePartnerPercentage,              │
 * │                  │   addWithdrawal                         │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Reportes.jsx     │ - reportsService (*)                    │
 * │                  │   getMonthlyStats, getYearlyStats,      │
 * │                  │   getProjectsReport,                    │
 * │                  │   getPartnersReport                     │
 * ├──────────────────┼─────────────────────────────────────────┤
 * │ Config.jsx       │ - configService (*)                     │
 * │                  │   updateFinancialConfig,                │
 * │                  │   resetAllData, exportAllData           │
 * └──────────────────┴─────────────────────────────────────────┘
 * 
 * (* = métodos más usados en ese componente)
 */
