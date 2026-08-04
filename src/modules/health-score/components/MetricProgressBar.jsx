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
  countsTowardScore = true,
  className,
}) {
  const percentage = noValue ? 0 : Math.min(100, Math.max(0, normalizedValue));
  const barColor = !countsTowardScore
    ? 'bg-foreground/20'
    : percentage === 0
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
          {label}{' '}
          {countsTowardScore
            ? <span className="text-muted-foreground/60">{weight}%</span>
            : <span className="text-muted-foreground/40 italic">no pondera</span>}
        </span>
        <div className="flex items-center gap-2.5 tabular-nums shrink-0">
          <span className={cn(countsTowardScore ? 'text-foreground' : 'text-muted-foreground/70')}>
            {noValue ? '—' : value}
            {!noValue && unit && <span className="text-muted-foreground"> / {max} {unit}</span>}
          </span>
          <span className={cn('font-semibold', countsTowardScore ? 'text-foreground' : 'text-muted-foreground/70')}>
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
