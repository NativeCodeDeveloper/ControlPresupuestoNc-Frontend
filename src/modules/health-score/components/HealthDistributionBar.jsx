/**
 * HealthDistributionBar.jsx
 *
 * Barra horizontal apilada con la proporción de clientes por estado
 * (saludable / en riesgo / crítico). Sin librería de charts — misma idea
 * que MetricProgressBar, solo que a nivel de cartera completa.
 */

'use client';

import { cn } from '../../../lib/utils';

const SEGMENT_STYLES = {
  healthy: { bar: 'bg-emerald-500', label: 'Saludable' },
  warning: { bar: 'bg-amber-500', label: 'En riesgo' },
  critical: { bar: 'bg-red-500', label: 'Crítico' },
};

export default function HealthDistributionBar({ healthy = 0, warning = 0, critical = 0, className }) {
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
    </div>
  );
}
