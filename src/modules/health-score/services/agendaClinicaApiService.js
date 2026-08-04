/**
 * agendaClinicaApiService.js
 *
 * Servicio MOCK para obtener métricas desde Agenda Clínica.
 *
 * TODO: Cuando el backend de Agenda Clínica esté listo:
 * - Reemplazar todos los métodos mock por llamadas fetch reales
 * - Agregar autenticación JWT entre Finance y Agenda Clínica
 * - Implementar caché para reducir carga
 * - Agregar retry logic para fallos de red
 *
 * ENDPOINTS FUTUROS (Agenda Clínica):
 * - GET /api/v1/companies/{companyId}/health/reservations
 * - GET /api/v1/companies/{companyId}/health/confirmations
 * - GET /api/v1/companies/{companyId}/health/clinical-records
 * - GET /api/v1/companies/{companyId}/health/last-login
 * - GET /api/v1/companies/{companyId}/health/login-frequency
 * - GET /api/v1/companies/{companyId}/health (todo en uno)
 */

import { generateMockHealthMetrics } from '../mocks/agendaClinicaMockData.js';

class AgendaClinicaApiService {
  constructor() {
    // URL base de Agenda Clínica (cuando esté lista)
    // this.baseUrl = process.env.AGENDA_CLINICA_URL || 'https://agendaclinicas.cl/api';
  }

  /**
   * Obtiene reservas de los últimos 30 días
   *
   * TODO: GET /api/v1/companies/{companyId}/health/reservations
   */
  async getReservations(companyId) {
    // TODO: Implementar llamada real a Agenda Clínica
    // const response = await fetch(`${this.baseUrl}/v1/companies/${companyId}/health/reservations`);
    // return response.json();

    return generateMockHealthMetrics(companyId).reservas;
  }

  /**
   * Obtiene confirmaciones
   *
   * TODO: GET /api/v1/companies/{companyId}/health/confirmations
   */
  async getConfirmations(companyId) {
    // TODO: Implementar llamada real a Agenda Clínica
    return generateMockHealthMetrics(companyId).confirmaciones;
  }

  /**
   * Obtiene fichas clínicas creadas
   *
   * TODO: GET /api/v1/companies/{companyId}/health/clinical-records
   */
  async getClinicalRecords(companyId) {
    // TODO: Implementar llamada real a Agenda Clínica
    return generateMockHealthMetrics(companyId).fichasClinicas;
  }

  /**
   * Obtiene último login
   *
   * TODO: GET /api/v1/companies/{companyId}/health/last-login
   */
  async getLastLogin(companyId) {
    // TODO: Implementar llamada real a Agenda Clínica
    return generateMockHealthMetrics(companyId).ultimoIngreso;
  }

  /**
   * Obtiene frecuencia de login
   *
   * TODO: GET /api/v1/companies/{companyId}/health/login-frequency
   */
  async getLoginFrequency(companyId) {
    // TODO: Implementar llamada real a Agenda Clínica
    return generateMockHealthMetrics(companyId).frecuenciaIngreso;
  }

  /**
   * Obtiene TODAS las métricas en una sola llamada (recomendado)
   *
   * TODO: GET /api/v1/companies/{companyId}/health
   * TODO: Implementar caché Redis cuando exista backend real
   */
  async getAllHealthMetrics(companyId) {
    // TODO: Reemplazar por llamada real single endpoint
    // const response = await fetch(`${this.baseUrl}/v1/companies/${companyId}/health`);
    // return response.json();

    return generateMockHealthMetrics(companyId);
  }
}

export default new AgendaClinicaApiService();
