/**
 * index.js - Tipos e interfaces para Health Score
 *
 * Este archivo define la estructura de datos para el Health Score.
 * Aunque usamos JavaScript, documentamos las interfaces como si fuera TypeScript
 * para mantener claridad y facilitar futura migración.
 */

/**
 * @typedef {Object} AgendaClinicaMetrics
 * Métricas obtenidas desde Agenda Clínica (por ahora mocks).
 * @property {string} companyId - ID del cliente
 * @property {number} reservas - Cantidad de reservas últimos 30 días
 * @property {number} confirmaciones - Cantidad de confirmaciones
 * @property {number} fichasClinicas - Fichas clínicas creadas
 * @property {Date|string} ultimoIngreso - Fecha del último ingreso
 * @property {number} frecuenciaIngreso - Días promedio entre ingresos
 */

/**
 * @typedef {Object} FinanceMetrics
 * Métricas obtenidas desde Finance (pagos, facturación).
 * @property {string} estadoPagos - 'verde' | 'naranja' | 'rojo'
 * @property {number} morosidad - Días de atraso o 0 si está al día
 * @property {boolean} dtesAlDia - true si todos los DTEs están al día
 * @property {number} montoFacturado - Monto total facturado
 * @property {number} totalProyectos - Cantidad de proyectos activos
 * @property {Date|string} ultimoProyecto - Fecha del último proyecto
 */

/**
 * @typedef {Object} HealthMetricsInput
 * Input completo para calcular Health Score.
 * @property {string} companyId
 * @property {string} companyName
 * @property {AgendaClinicaMetrics} agendaClinica
 * @property {FinanceMetrics} finance
 */

/**
 * @typedef {Object} WeightedMetric
 * Métrica individual con su peso y contribución.
 * @property {string} id - Identificador único
 * @property {string} label - Etiqueta para mostrar
 * @property {number} value - Valor crudo
 * @property {number} weight - Peso (0-100)
 * @property {number} maxPossible - Valor máximo para normalización
 * @property {number} normalizedValue - Valor normalizado (0-100)
 * @property {number} contribution - Puntaje aportado al total
 * @property {string} unit - Unidad opcional (ej: 'días', '$')
 * @property {string} category - 'uso' | 'valor' | 'paga'
 */

/**
 * @typedef {Object} HealthScoreResult
 * Resultado del cálculo de Health Score.
 * @property {number} score - Score total (0-100)
 * @property {'healthy'|'warning'|'critical'} status
 * @property {Object.<string, WeightedMetric>} metrics - Métricas por ID
 * @property {Date} calculatedAt - Fecha de cálculo
 */

/**
 * @typedef {Object} HealthScoreData
 * Datos completos para mostrar en UI.
 * @property {string} companyId
 * @property {string} companyName
 * @property {number} score
 * @property {'healthy'|'warning'|'critical'} status
 * @property {Array.<WeightedMetric>} metrics
 * @property {string} lastUpdated
 * @property {'up'|'down'|'stable'} [trend] - Tendencia (futuro)
 */

/**
 * @typedef {Object} ClienteHealthScore
 * Health Score de un cliente con info adicional.
 * @property {string} nombreCliente
 * @property {number} score
 * @property {'healthy'|'warning'|'critical'} status
 * @property {Array.<WeightedMetric>} metrics
 * @property {Date|null} fechaCancelacion - Si está cancelado
 * @property {string} lastUpdated
 */

/**
 * @typedef {Object} PagosInfo
 * Información de pagos (desplegable).
 * @property {'verde'|'naranja'|'rojo'} estado
 * @property {number} morosidadDias
 * @property {boolean} dtesAlDia
 * @property {number} montoFacturado
 */

/**
 * @typedef {Object} HealthScoreFilterOptions
 * Opciones de filtrado.
 * @property {string} [search] - Búsqueda por nombre/RUT/email
 * @property {'healthy'|'warning'|'critical'|'all'} [status]
 * @property {'activos'|'cancelados'|'todos'} [tipo]
 */

export default {};
