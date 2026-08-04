/**
 * healthScoreConstants.js
 *
 * Constantes y configuración del Health Score.
 */

// Pesos de las métricas (total debe sumar 100)
export const HEALTH_SCORE_WEIGHTS = {
  // USO - Protagonista (60%)
  reservas: 35,
  confirmaciones: 20,
  fichasClinicas: 20,
  ultimoIngreso: 15,
  frecuenciaIngreso: 10,

  // VALOR (20%)
  valorFacturado: 20,

  // PAGA (20%)
  estadoPagos: 10,
  morosidad: 5,
  dtesAlDia: 5,
};

// Umbrales para determinar el estado del Health Score
export const HEALTH_SCORE_THRESHOLDS = {
  HEALTHY: 70,      // 70-100: Saludable
  WARNING: 40,      // 40-69: En riesgo
  // 0-39: Crítico
};

// Configuración de estados visuales
export const HEALTH_STATUS_CONFIG = {
  healthy: {
    color: 'emerald',
    label: 'Saludable',
    icon: 'CheckCircle',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  warning: {
    color: 'amber',
    label: 'En riesgo',
    icon: 'AlertTriangle',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20',
  },
  critical: {
    color: 'red',
    label: 'Crítico',
    icon: 'XCircle',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/20',
  },
};

// Valores máximos para normalización de métricas de Agenda Clínica
export const AGENDA_CLINICA_MAX_VALUES = {
  reservas: 150,           // 150 reservas/mes = 100%
  confirmaciones: 100,     // 100% confirmación = 100%
  fichasClinicas: 120,     // 120 fichas/mes = 100%
  ultimoIngreso: 7,        // 7 días = 100%, 90 días = 0%
  frecuenciaIngreso: 1,    // 1 día entre ingresos = 100%, 30 días = 0%
};

// Estados de proyectos (desde backend)
export const PROYECTO_ESTADOS = {
  CANCELADO: 6,
  DESACTIVADA: 9,
};

// Filtro SQL para clientes recurrentes activos
export const CLIENTE_ACTIVO_FILTER = `
  activo = 1
  AND id_estado_proyecto NOT IN (6, 9)
  AND (observaciones IS NULL OR observaciones NOT LIKE '[ELIMINADO]#%')
`;
