/**
 * HealthDistributionBar.jsx
 *
 * Barra horizontal apilada con la proporción de clientes por estado
 * (saludable / en riesgo / crítico). Sin librería de charts — misma idea
 * que MetricProgressBar, solo que a nivel de cartera completa.
 */

'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { HEALTH_STATUS_CONFIG } from '../constants/healthScoreConstants';

const SEGMENT_STYLES = {
  healthy: { bar: 'bg-emerald-500', label: 'Saludable' },
  warning: { bar: 'bg-amber-500', label: 'En riesgo' },
  critical: { bar: 'bg-red-500', label: 'Crítico' },
};

export default function HealthDistributionBar({
  healthy = 0,
  warning = 0,
  critical = 0,
  atRiskClients = [],
  onSelectClient,
  className,
}) {
  const total = healthy + warning + critical;

  const segments = [
    { key: 'healthy', count: healthy },
    { key: 'warning', count: warning },
    { key: 'critical', count: critical },
  ].filter(s => s.count > 0);

  return (
    <div className={cn('bg-card border border-border/60 rounded-lg px-5 py-4', className)}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Distribución de cartera
      </p>

      {total === 0 ? (
        <div className="h-2.5 rounded-full bg-foreground/[0.06]" />
      ) : (
        <div className="flex items-center gap-[2px] h-2.5 rounded-full overflow-hidden">
          {segments.map(({ key, count }) => {
            const pct = (count / total) * 100;
            const { bar, label } = SEGMENT_STYLES[key];
            return (
              <div
                key={key}
                title={`${label}: ${count} (${Math.round(pct)}%)`}
                className={cn('h-full transition-opacity hover:opacity-80', bar)}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      )}

      {/* Detalle accionable — quién necesita atención, sin bajar a la lista completa */}
      <div className="mt-4 pt-4 border-t border-border/50">
        {atRiskClients.length === 0 ? (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            Todos los clientes están saludables
          </div>
        ) : (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
              <AlertTriangle size={12} className="shrink-0" />
              Necesitan atención
            </p>
            {atRiskClients.map(client => {
              const config = HEALTH_STATUS_CONFIG[client.status];
              return (
                <button
                  key={client.clientId}
                  onClick={() => onSelectClient?.(client.clientId)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] transition-colors text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
                    <span className="text-[12px] text-foreground truncate">{client.companyName}</span>
                  </span>
                  <span className={cn('text-[12px] font-semibold tabular-nums shrink-0', config.textClass)}>
                    {client.score}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
