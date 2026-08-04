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
  score,
  weight,
  unit = '',
  className,
}) {
  const percentage = Math.min(100, Math.max(0, (score / 100) * 100));

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">
          {label} ({weight}%)
        </span>
        <span className="text-foreground font-medium tabular-nums">
          {value} {unit && <span className="text-muted-foreground">/ {max} {unit}</span>}
        </span>
        <span className="font-semibold text-amber-400 tabular-nums">{score} pts</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
