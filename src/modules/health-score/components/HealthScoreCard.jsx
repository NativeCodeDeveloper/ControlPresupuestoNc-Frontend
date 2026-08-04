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
import { HEALTH_STATUS_CONFIG } from '../constants/healthScoreConstants';

export default function HealthScoreCard({ data, isOpen, onToggle }) {
  const { score, status, metrics, lastUpdated } = data;
  const statusConfig = HEALTH_STATUS_CONFIG[status];

  // Agrupar métricas por categoría
  const usoMetrics = Object.values(metrics).filter(m => m.category === 'uso');
  const valorMetrics = Object.values(metrics).filter(m => m.category === 'valor');
  const pagaMetrics = Object.values(metrics).filter(m => m.category === 'paga');

  const [showPagos, setShowPagos] = useState(false);

  return (
    <div
      className={cn(
        'bg-card border rounded-2xl overflow-hidden transition-all duration-200',
        status === 'healthy' ? 'border-emerald-500/20' : status === 'warning' ? 'border-amber-500/20' : 'border-red-500/20',
        isOpen && 'shadow-sm'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Score badge */}
          <div
            className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center',
              statusConfig.bgClass
            )}
          >
            <span className={cn('text-2xl font-bold tabular-nums', statusConfig.textClass)}>
              {score}
            </span>
          </div>

          {/* Info */}
          <div className="text-left">
            <p className="font-semibold text-[14px] text-foreground">
              {data.companyName || data.clientId}
            </p>
            <p className={cn('text-[12px]', statusConfig.textClass)}>
              {statusConfig.label}
            </p>
          </div>
        </div>

        {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {/* Detail */}
      {isOpen && (
        <div className="px-5 py-4 space-y-5 border-t border-border/50 bg-muted/20">

          {/* USO - Protagonista (60%) */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              USO (60%)
            </p>
            {usoMetrics.map(metric => (
              <MetricProgressBar
                key={metric.id}
                label={metric.label}
                value={metric.value}
                max={metric.maxPossible}
                score={Math.round(metric.contribution)}
                weight={metric.weight}
                unit={metric.unit}
              />
            ))}
          </div>

          {/* VALOR (20%) */}
          {valorMetrics.length > 0 && (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                VALOR (20%)
              </p>
              {valorMetrics.map(metric => (
                <MetricProgressBar
                  key={metric.id}
                  label={metric.label}
                  value={metric.value}
                  max={metric.maxPossible}
                  score={Math.round(metric.contribution)}
                  weight={metric.weight}
                  unit={metric.unit}
                />
              ))}
            </div>
          )}

          {/* PAGA - Desplegable (20%) */}
          {pagaMetrics.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPagos(!showPagos)}
                className="flex items-center justify-between w-full text-[11px] font-semibold text-foreground uppercase tracking-wide hover:text-amber-400 transition-colors"
              >
                <span>PAGA (20%)</span>
                {showPagos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showPagos && (
                <div className="space-y-3 pl-2 border-l-2 border-amber-500/20">
                  {pagaMetrics.map(metric => (
                    <MetricProgressBar
                      key={metric.id}
                      label={metric.label}
                      value={metric.value}
                      max={metric.maxPossible}
                      score={Math.round(metric.contribution)}
                      weight={metric.weight}
                      unit={metric.unit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock size={11} />
            <span>Última actualización: {lastUpdated || 'Ahora'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
