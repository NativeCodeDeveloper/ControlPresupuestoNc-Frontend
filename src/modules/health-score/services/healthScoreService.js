/**
 * healthScoreService.js
 *
 * Servicio principal de Health Score para el frontend.
 *
 * TODO: Cuando backend esté listo:
 * - Estas funciones llamarán a /api/health-score/{endpoint}
 * - Por ahora usan mocks de agendaClinicaApiService + datos de Finance
 */

import apiClient from '../../../services/apiClient';
import agendaClinicaApiService from './agendaClinicaApiService.js';
import HealthScoreCalculator from '../../utils/healthScoreCalculator.js';

const calculator = new HealthScoreCalculator();

/**
 * Obtiene Health Score de un cliente específico
 *
 * TODO: GET /api/health-score/companies/{companyId}
 */
export async function getHealthScore(clientId) {
  // TODO: Reemplazar con llamada real al backend
  // return await apiClient.get(`/api/health-score/companies/${clientId}`);

  // Por ahora: fetch desde Agenda Clínica mock + cálculo local
  try {
    // Obtener métricas de Agenda Clínica (mock)
    const agendaClinicaMetrics = await agendaClinicaApiService.getAllHealthMetrics(clientId);

    // TODO: Obtener métricas de Finance (pagos, facturación)
    // Por ahora usamos valores mock para Finance también
    const financeMetrics = {
      estadoPagos: ['verde', 'naranja', 'rojo'][Math.floor(Math.random() * 3)],
      morosidad: Math.floor(Math.random() * 30),
      dtesAlDia: Math.random() > 0.3,
      montoFacturado: Math.floor(Math.random() * 5000000) + 500000,
    };

    // Calcular Health Score
    const result = calculator.calculate({
      agendaClinica: agendaClinicaMetrics,
      finance: financeMetrics,
    });

    return {
      clientId,
      companyName: clientId, // TODO: Obtener nombre real del cliente
      ...result,
    };
  } catch (error) {
    console.error('[getHealthScore]', error);
    throw error;
  }
}

/**
 * Obtiene Health Score de todos los clientes activos
 *
 * TODO: GET /api/health-score/companies?filter=activos
 */
export async function getAllHealthScores(options = {}) {
  // TODO: Reemplazar con llamada real al backend
  // const params = new URLSearchParams({ filter: 'activos', ...options });
  // return await apiClient.get(`/api/health-score/companies?${params}`);

  // Por ahora: mock data
  const { MOCK_CLIENTES_LIST } = await import('../../mocks/agendaClinicaMockData.js');

  const scores = await Promise.all(
    MOCK_CLIENTES_LIST.map(async (cliente) => {
      const score = await getHealthScore(cliente.id);
      return {
        ...score,
        clientId: cliente.id,
        companyName: cliente.nombre,
      };
    })
  );

  return scores;
}

/**
 * Obtiene Health Score de clientes cancelados (con historial)
 *
 * TODO: GET /api/health-score/companies?filter=cancelados
 */
export async function getCancelledHealthScores() {
  // TODO: Implementar con backend real
  // return await apiClient.get('/api/health-score/companies?filter=cancelados');

  // Por ahora: array vacío
  return [];
}

/**
 * Obtiene historial de Health Score de un cliente
 *
 * TODO: GET /api/health-score/companies/{companyId}/history?months={months}
 */
export async function getHealthScoreHistory(companyId, months = 6) {
  // TODO: Reemplazar con llamada real al backend
  // return await apiClient.get(`/api/health-score/companies/${companyId}/history?months=${months}`);

  // Por ahora: array vacío (historial no implementado aún)
  return [];
}

/**
 * Obtiene métricas financieras de un cliente desde Finance
 *
 * TODO: Esto ya debería existir en algún service de clientes/proyectos
 * Reutilizar esa lógica cuando esté disponible
 */
export async function getClientFinanceMetrics(clientId) {
  // TODO: Implementar usando datos reales de Finance
  // Debería retornar: estadoPagos, morosidad, dtesAlDia, montoFacturado, etc.

  return {
    estadoPagos: 'verde',
    morosidad: 0,
    dtesAlDia: true,
    montoFacturado: 0,
  };
}

export default {
  getHealthScore,
  getAllHealthScores,
  getCancelledHealthScores,
  getHealthScoreHistory,
  getClientFinanceMetrics,
};
