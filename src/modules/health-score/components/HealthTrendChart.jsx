/**
 * HealthTrendChart.jsx
 *
 * Tendencia de la distribución de cartera (saludable/en riesgo/crítico) en
 * el tiempo — un snapshot diario. Recharts directo, mismo patrón que
 * PointsChart.jsx: JS plano (sin TS), imports relativos.
 */

'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { cn } from '../../../lib/utils';

const SERIES = [
  { key: 'healthy', label: 'Saludable', color: '#10b981' },
  { key: 'warning', label: 'En riesgo', color: '#f59e0b' },
  { key: 'critical', label: 'Crítico', color: '#ef4444' },
];

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border border-border px-3 py-2 text-[12px] shadow-md">
      <p className="text-muted-foreground mb-1">{formatFecha(label)}</p>
      {payload.map(item => (
        <p key={item.dataKey} className="flex items-center gap-1.5 tabular-nums">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{SERIES.find(s => s.key === item.dataKey)?.label}:</span>
          <span className="font-medium text-foreground">{item.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function HealthTrendChart({ data = [], height = 220, className }) {
  const hasEnoughData = data.length >= 2;

  return (
    <div className={cn('bg-card border border-border/60 rounded-lg px-5 py-4', className)}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Tendencia de cartera
      </p>

      {!hasEnoughData ? (
        <div className="flex flex-col items-center justify-center text-center gap-1 text-muted-foreground" style={{ height }}>
          <p className="text-[12px]">Todavía no hay suficiente historial</p>
          <p className="text-[11px] text-muted-foreground/60">
            Se guarda un snapshot diario — vuelve en unos días para ver la tendencia
          </p>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatFecha}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeDasharray: '4 4' }} />
              {SERIES.map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
