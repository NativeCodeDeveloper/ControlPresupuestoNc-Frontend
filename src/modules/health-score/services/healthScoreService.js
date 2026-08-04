/**
 * healthScoreService.js
 *
 * Servicio principal de Health Score para el frontend.
 *
 * Conecta con el backend real para obtener Health Scores de clientes.
 */

import apiClient from '../../../services/apiClient';

/**
 * Obtiene Health Score de un cliente específico
 *
 * GET /api/health-score/companies/{clientId}
 */
export async function getHealthScore(clientId) {
  return await apiClient.get(`/api/health-score/companies/${clientId}`);
}

/**
 * Obtiene Health Score de todos los clientes activos
 *
 * GET /api/health-score/companies?filter=activos
 */
export async function getAllHealthScores(options = {}) {
  const params = new URLSearchParams({ filter: 'activos', ...options });
  return await apiClient.get(`/api/health-score/companies?${params}`);
}

/**
 * Obtiene Health Score de clientes cancelados (con historial)
 *
 * GET /api/health-score/companies?filter=cancelados
 */
export async function getCancelledHealthScores() {
  return await apiClient.get('/api/health-score/companies?filter=cancelados');
}

/**
 * Obtiene historial de Health Score de un cliente
 *
 * GET /api/health-score/companies/{companyId}/history?months={months}
 */
export async function getHealthScoreHistory(companyId, months = 6) {
  return await apiClient.get(`/api/health-score/companies/${companyId}/history?months=${months}`);
}

/**
 * Obtiene estadísticas agregadas (healthy, warning, critical counts)
 *
 * GET /api/health-score/stats
 */
export async function getHealthScoreStats() {
  return await apiClient.get('/api/health-score/stats');
}

/**
 * Obtiene la tendencia de la distribución de cartera (un snapshot por día)
 *
 * GET /api/health-score/historial?days={days}
 */
export async function getPortfolioHistory(days = 90) {
  return await apiClient.get(`/api/health-score/historial?days=${days}`);
}

export default {
  getHealthScore,
  getAllHealthScores,
  getCancelledHealthScores,
  getHealthScoreHistory,
  getHealthScoreStats,
  getPortfolioHistory,
};
