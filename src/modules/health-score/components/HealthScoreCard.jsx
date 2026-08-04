/**
 * HealthScoreCard.jsx
 *
 * Tarjeta principal de Health Score para un cliente.
 * Muestra el score, estado, y todas las métricas con barras de progreso.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import MetricProgressBar from './MetricProgressBar';
import { HEALTH_STATUS_CONFIG, PAGO_DOT_CLASS } from '../constants/healthScoreConstants';

function relativeTime(date) {
  if (!date) return 'ahora';
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const days = Math.floor(hr / 24);
  return `hace ${days} d`;
}

export default function HealthScoreCard({ data, isOpen, onToggle }) {
  const { score, status, metrics, calculatedAt } = data;
  const statusConfig = HEALTH_STATUS_CONFIG[status];
  const [pagosOpen, setPagosOpen] = useState(false);

  const usoMetrics = Object.values(metrics).filter(m => m.category === 'uso');
  const valorMetrics = Object.values(metrics).filter(m => m.category === 'valor');
  const pagaMetrics = Object.values(metrics).filter(m => m.category === 'paga');

  const estadoPagos = metrics.estadoPagos?.value;
  const dtesAlDia = metrics.dtesAlDia?.value;

  return (
    <div className="bg-card border border-border/60 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-foreground/[0.02] transition-colors"
      >
        <span className="font-medium text-[14px] text-foreground truncate">
          {data.companyName || data.clientId}
        </span>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-bold tabular-nums text-foreground leading-none">{score}</span>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotClass)} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {statusConfig.label}
            </span>
          </div>
          {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/50">

          {/* Pagos — resumen compacto y desplegable */}
          <div className="border-b border-border/50">
            <button
              onClick={() => setPagosOpen(!pagosOpen)}
              className="w-full px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-foreground/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2 text-[11px] min-w-0">
                <span className="font-medium text-foreground shrink-0">Pagos</span>
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', PAGO_DOT_CLASS[estadoPagos] || PAGO_DOT_CLASS.desconocido)} />
                <span className="text-muted-foreground truncate">
                  Estado: {estadoPagos || 'desconocido'} · DTEs {dtesAlDia ? 'al día' : 'con problema'}
                </span>
              </div>
              {pagosOpen ? <ChevronUp size={12} className="text-muted-foreground shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground shrink-0" />}
            </button>

            {pagosOpen && (
              <div className="px-5 pb-4 space-y-3">
                {pagaMetrics.map(metric => (
                  <MetricProgressBar
                    key={metric.id}
                    label={metric.label}
                    value={metric.value}
                    max={metric.maxPossible}
                    unit={metric.unit}
                    weight={metric.weight}
                    normalizedValue={metric.normalizedValue}
                    contribution={metric.contribution}
                    countsTowardScore={metric.countsTowardScore}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* USO — pendiente de conectar Agenda Clínica, no pondera aún */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Uso <span className="text-muted-foreground/50 normal-case italic">· sin conectar</span>
              </p>
              {usoMetrics.map(metric => (
                <MetricProgressBar
                  key={metric.id}
                  label={metric.label}
                  value={metric.value}
                  max={metric.maxPossible}
                  unit={metric.unit}
                  weight={metric.weight}
                  normalizedValue={metric.normalizedValue}
                  contribution={metric.contribution}
                  noValue={metric.value === null}
                  countsTowardScore={metric.countsTowardScore}
                />
              ))}
            </div>

            {/* VALOR (20%) */}
            {valorMetrics.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor <span className="text-muted-foreground/50 normal-case italic">· informativo</span>
                </p>
                {valorMetrics.map(metric => (
                  <MetricProgressBar
                    key={metric.id}
                    label={metric.label}
                    value={metric.value}
                    max={metric.maxPossible}
                    unit={metric.unit}
                    weight={metric.weight}
                    normalizedValue={metric.normalizedValue}
                    contribution={metric.contribution}
                    countsTowardScore={metric.countsTowardScore}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={11} />
            <span>Última actualización: {relativeTime(calculatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
