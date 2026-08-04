/**
 * index.js - Export principal del módulo Health Score
 */

// Components
export { default as HealthScoreCard } from './components/HealthScoreCard';
export { default as CancelledClientCard } from './components/CancelledClientCard';
export { default as MetricProgressBar } from './components/MetricProgressBar';

// Services
export { default as healthScoreService } from './services/healthScoreService';
export { default as agendaClinicaApiService } from './services/agendaClinicaApiService';

// Utils
export { default as HealthScoreCalculator } from './utils/healthScoreCalculator';

// Constants
export * from './constants/healthScoreConstants';
