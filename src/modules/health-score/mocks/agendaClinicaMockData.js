/**
 * agendaClinicaMockData.js
 *
 * Datos simulados de Agenda Clínica para desarrollo.
 *
 * TODO: Cuando conectemos Agenda Clínica, eliminar este archivo
 * y reemplazar por llamadas reales al backend.
 */

// Datos mock por cliente (simulando diferentes escenarios)
const MOCK_CLIENTES = {
  // Cliente saludable - mucho uso
  'clinica-dental-abc': {
    reservas: 127,
    confirmaciones: 94,
    fichasClinicas: 81,
    ultimoIngreso: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ayer
    frecuenciaIngreso: 2, // Cada 2 días
  },
  // Cliente en riesgo - uso moderado
  'centro-medico-xyz': {
    reservas: 45,
    confirmaciones: 67,
    fichasClinicas: 23,
    ultimoIngreso: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Hace 15 días
    frecuenciaIngreso: 18, // Cada 18 días
  },
  // Cliente crítico - bajo uso
  'clinica-norte': {
    reservas: 12,
    confirmaciones: 45,
    fichasClinicas: 8,
    ultimoIngreso: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Hace 60 días
    frecuenciaIngreso: 28, // Cada 28 días
  },
  // Cliente nuevo - uso creciente
  'clinica-sur': {
    reservas: 78,
    confirmaciones: 89,
    fichasClinicas: 45,
    ultimoIngreso: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
    frecuenciaIngreso: 5, // Cada 5 días
  },
};

/**
 * Genera métricas mock para un cliente específico
 * @param {string} companyId - ID del cliente
 * @returns {Object} Métricas mock de Agenda Clínica
 */
export function generateMockHealthMetrics(companyId) {
  // Si existe el cliente en los mocks, usar esos datos
  if (companyId && MOCK_CLIENTES[companyId]) {
    return MOCK_CLIENTES[companyId];
  }

  // Si no, generar datos random pero creíbles
  return {
    reservas: Math.floor(Math.random() * 100) + 20,      // 20-120
    confirmaciones: Math.floor(Math.random() * 40) + 60, // 60-100%
    fichasClinicas: Math.floor(Math.random() * 80) + 10,  // 10-90
    ultimoIngreso: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
    frecuenciaIngreso: Math.floor(Math.random() * 25) + 1, // 1-25 días
  };
}

/**
 * Lista de clientes mock para desarrollo
 * TODO: Eliminar cuando se conecte con backend real
 */
export const MOCK_CLIENTES_LIST = [
  {
    id: 'clinica-dental-abc',
    nombre: 'Clínica Dental ABC',
    estado: 'activo',
  },
  {
    id: 'centro-medico-xyz',
    nombre: 'Centro Médico XYZ',
    estado: 'activo',
  },
  {
    id: 'clinica-norte',
    nombre: 'Clínica del Norte',
    estado: 'activo',
  },
  {
    id: 'clinica-sur',
    nombre: 'Clínica del Sur',
    estado: 'activo',
  },
];

export default { generateMockHealthMetrics, MOCK_CLIENTES_LIST };
