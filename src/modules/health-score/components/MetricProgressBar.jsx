/**
 * MetricProgressBar.jsx
 *
 * Componente de barra de progreso para métricas de Health Score.
 */

'use client';

import { cn } from '../../../lib/utils';

export default function MetricProgressBar({
  label,
  value,
  max,
  unit = '',
  weight,
  normalizedValue = 0,
  contribution = 0,
  noValue = false,
  className,
}) {
  const percentage = noValue ? 0 : Math.min(100, Math.max(0, normalizedValue));
  const barColor = percentage === 0
    ? 'bg-transparent'
    : percentage >= 80
      ? 'bg-emerald-500'
      : percentage >= 50
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-muted-foreground shrink-0">
          {label} <span className="text-muted-foreground/60">{weight}%</span>
        </span>
        <div className="flex items-center gap-2.5 tabular-nums shrink-0">
          <span className="text-foreground">
            {noValue ? '—' : value}
            {!noValue && unit && <span className="text-muted-foreground"> / {max} {unit}</span>}
          </span>
          <span className="text-foreground font-semibold">
            {noValue ? '—' : Math.round(contribution)} <span className="font-normal text-muted-foreground">pts</span>
          </span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
