/**
 * healthScoreCalculator.js
 *
 * Clase desacoplada para calcular Health Score.
 *
 * Responsabilidad ÚNICA: Transformar métricas en un score 0-100.
 * NO conoce APIs. NO conoce React. Solo recibe datos planos y devuelve resultado.
 *
 * TODO: Cuando conectemos Agenda Clínica, los métodos de normalización
 * pueden ajustarse según los datos reales que lleguen.
 */

import { HEALTH_SCORE_WEIGHTS, HEALTH_SCORE_THRESHOLDS, AGENDA_CLINICA_MAX_VALUES } from '../constants/healthScoreConstants.js';

class HealthScoreCalculator {
  constructor(config = {}) {
    this.weights = config.weights || HEALTH_SCORE_WEIGHTS;
    this.thresholds = config.thresholds || HEALTH_SCORE_THRESHOLDS;
    this.maxValues = config.maxValues || AGENDA_CLINICA_MAX_VALUES;
  }

  /**
   * Calcula el Health Score completo
   * @param {Object} input - Métricas de Agenda Clínica y Finance
   * @param {Object} input.agendaClinica - Métricas de uso (Agenda Clínica)
   * @param {Object} input.finance - Métricas financieras (Finance)
   * @returns {Object} HealthScoreResult
   */
  calculate(input) {
    const { agendaClinica, finance } = input;

    // Normalizar cada métrica a 0-100
    const metrics = {
      // USO - Agenda Clínica (60%)
      reservas: this._normalizeReservas(agendaClinica.reservas || 0),
      confirmaciones: this._normalizeConfirmaciones(agendaClinica.confirmaciones || 0),
      fichasClinicas: this._normalizeFichas(agendaClinica.fichasClinicas || 0),
      ultimoIngreso: this._normalizeUltimoIngreso(agendaClinica.ultimoIngreso),
      frecuenciaIngreso: this._normalizeFrecuencia(agendaClinica.frecuenciaIngreso || 30),

      // VALOR - Finance (20%)
      valorFacturado: this._normalizeValorFacturado(finance.montoFacturado || 0),

      // PAGA - Finance (20%)
      estadoPagos: this._normalizeEstadoPagos(finance.estadoPagos || 'verde'),
      morosidad: this._normalizeMorosidad(finance.morosidad || 0),
      dtesAlDia: this._normalizeDtesAlDia(finance.dtesAlDia || false),
    };

    // Calcular score total ponderado
    const score = this._computeTotalScore(metrics);

    return {
      score,
      status: this._determineStatus(score),
      metrics: this._buildMetricsOutput(metrics),
      calculatedAt: new Date(),
    };
  }

  /**
   * Construye el output de métricas con todos los detalles
   */
  _buildMetricsOutput(normalized) {
    const weights = this.weights;
    return {
      reservas: {
        id: 'reservas',
        label: 'Reservas',
        category: 'uso',
        value: normalized.reservas.value,
        weight: weights.reservas,
        maxPossible: this.maxValues.reservas,
        normalizedValue: normalized.reservas.normalizado,
        contribution: (normalized.reservas.normalizado * weights.reservas) / 100,
        unit: 'últimos 30 días',
      },
      confirmaciones: {
        id: 'confirmaciones',
        label: 'Confirmaciones',
        category: 'uso',
        value: normalized.confirmaciones.value,
        weight: weights.confirmaciones,
        maxPossible: this.maxValues.confirmaciones,
        normalizedValue: normalized.confirmaciones.normalizado,
        contribution: (normalized.confirmaciones.normalizado * weights.confirmaciones) / 100,
        unit: '%',
      },
      fichasClinicas: {
        id: 'fichasClinicas',
        label: 'Fichas clínicas',
        category: 'uso',
        value: normalized.fichasClinicas.value,
        weight: weights.fichasClinicas,
        maxPossible: this.maxValues.fichasClinicas,
        normalizedValue: normalized.fichasClinicas.normalizado,
        contribution: (normalized.fichasClinicas.normalizado * weights.fichasClinicas) / 100,
        unit: 'creadas',
      },
      ultimoIngreso: {
        id: 'ultimoIngreso',
        label: 'Último ingreso',
        category: 'uso',
        value: normalized.ultimoIngreso.value,
        weight: weights.ultimoIngreso,
        maxPossible: 90,
        normalizedValue: normalized.ultimoIngreso.normalizado,
        contribution: (normalized.ultimoIngreso.normalizado * weights.ultimoIngreso) / 100,
        unit: 'días atrás',
      },
      frecuenciaIngreso: {
        id: 'frecuenciaIngreso',
        label: 'Frecuencia de ingreso',
        category: 'uso',
        value: normalized.frecuenciaIngreso.value,
        weight: weights.frecuenciaIngreso,
        maxPossible: 30,
        normalizedValue: normalized.frecuenciaIngreso.normalizado,
        contribution: (normalized.frecuenciaIngreso.normalizado * weights.frecuenciaIngreso) / 100,
        unit: 'días entre ingresos',
      },
      valorFacturado: {
        id: 'valorFacturado',
        label: 'Valor facturado',
        category: 'valor',
        value: normalized.valorFacturado.value,
        weight: weights.valorFacturado,
        maxPossible: 5000000, // $5M como valor "excelente"
        normalizedValue: normalized.valorFacturado.normalizado,
        contribution: (normalized.valorFacturado.normalizado * weights.valorFacturado) / 100,
        unit: '$',
      },
      estadoPagos: {
        id: 'estadoPagos',
        label: 'Estado de pagos',
        category: 'paga',
        value: normalized.estadoPagos.value,
        weight: weights.estadoPagos,
        maxPossible: 1,
        normalizedValue: normalized.estadoPagos.normalizado,
        contribution: (normalized.estadoPagos.normalizado * weights.estadoPagos) / 100,
        unit: '',
      },
      morosidad: {
        id: 'morosidad',
        label: 'Morosidad',
        category: 'paga',
        value: normalized.morosidad.value,
        weight: weights.morosidad,
        maxPossible: 90,
        normalizedValue: normalized.morosidad.normalizado,
        contribution: (normalized.morosidad.normalizado * weights.morosidad) / 100,
        unit: 'días atraso',
      },
      dtesAlDia: {
        id: 'dtesAlDia',
        label: 'DTEs al día',
        category: 'paga',
        value: normalized.dtesAlDia.value,
        weight: weights.dtesAlDia,
        maxPossible: 1,
        normalizedValue: normalized.dtesAlDia.normalizado,
        contribution: (normalized.dtesAlDia.normalizado * weights.dtesAlDia) / 100,
        unit: '',
      },
    };
  }

  // ── Normalizadores: convierten valor crudo a 0-100 ─────────────────────

  /** Reservas: 0-150 es el rango normal */
  _normalizeReservas(value) {
    const max = this.maxValues.reservas;
    const normalizado = Math.min(100, (value / max) * 100);
    return { value, normalizado };
  }

  /** Confirmaciones: asume que viene como porcentaje 0-100 */
  _normalizeConfirmaciones(value) {
    const normalizado = Math.min(100, Math.max(0, value));
    return { value, normalizado };
  }

  /** Fichas clínicas: 0-120 es el rango normal */
  _normalizeFichas(value) {
    const max = this.maxValues.fichasClinicas;
    const normalizado = Math.min(100, (value / max) * 100);
    return { value, normalizado };
  }

  /** Último ingreso: más reciente = mejor (7 días = 100, 90 días = 0) */
  _normalizeUltimoIngreso(lastLogin) {
    const daysSince = this._daysSince(lastLogin);
    const max = 90;
    const min = 7;

    let normalizado;
    if (daysSince <= min) {
      normalizado = 100;
    } else if (daysSince >= max) {
      normalizado = 0;
    } else {
      normalizado = 100 - ((daysSince - min) / (max - min)) * 100;
    }

    return { value: daysSince, normalizado: Math.round(normalizado) };
  }

  /** Frecuencia de ingreso: más frecuente = mejor (1 día = 100, 30 días = 0) */
  _normalizeFrecuencia(days) {
    const max = 30;
    const min = 1;

    let normalizado;
    if (days <= min) {
      normalizado = 100;
    } else if (days >= max) {
      normalizado = 0;
    } else {
      normalizado = 100 - ((days - min) / (max - min)) * 100;
    }

    return { value: days, normalizado: Math.round(normalizado) };
  }

  /** Valor facturado: $5M = 100 (escala logarítmica suave) */
  _normalizeValorFacturado(monto) {
    const max = 5000000; // $5M
    // Usamos raíz cuadrada para suavizar la curva
    const normalizado = Math.min(100, (Math.sqrt(monto) / Math.sqrt(max)) * 100);
    return { value: monto, normalizado: Math.round(normalizado) };
  }

  /** Estado de pagos: verde=100, naranja=50, rojo=0 */
  _normalizeEstadoPagos(estado) {
    const mapa = { verde: 100, naranja: 50, rojo: 0 };
    const normalizado = mapa[estado] || 50;
    return { value: estado, normalizado };
  }

  /** Morosidad: 0 días = 100, 90+ días = 0 */
  _normalizeMorosidad(dias) {
    const max = 90;
    let normalizado;
    if (dias <= 0) {
      normalizado = 100;
    } else if (dias >= max) {
      normalizado = 0;
    } else {
      normalizado = 100 - (dias / max) * 100;
    }
    return { value: dias, normalizado: Math.round(normalizado) };
  }

  /** DTEs al día: true=100, false=0 */
  _normalizeDtesAlDia(alDia) {
    const normalizado = alDia ? 100 : 0;
    return { value: alDia, normalizado };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _computeTotalScore(metrics) {
    const weights = this.weights;
    let total = 0;

    for (const [key, metric] of Object.entries(metrics)) {
      total += (metric.normalizado * (weights[key] || 0)) / 100;
    }

    return Math.round(total);
  }

  _determineStatus(score) {
    if (score >= this.thresholds.HEALTHY) return 'healthy';
    if (score >= this.thresholds.WARNING) return 'warning';
    return 'critical';
  }

  _daysSince(date) {
    if (!date) return 999; // Muy antiguo si no hay fecha

    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

export default HealthScoreCalculator;
