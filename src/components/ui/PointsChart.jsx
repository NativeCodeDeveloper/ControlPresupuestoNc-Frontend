"use client"

import * as React from "react"
import { Star } from "lucide-react"
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { cn } from "../../lib/utils"

function defaultFormatValue(value) {
    return Math.round(value).toLocaleString("es-CL")
}

function LevelReferenceStarLabel({ viewBox, color }) {
    const x = viewBox?.x
    const y = viewBox?.y

    if (typeof x !== "number" || typeof y !== "number") {
        return null
    }

    return (
        <g transform={`translate(${x - 14},${y})`}>
            <Star x={-5} y={-5} width={10} height={10} fill={color} stroke={color} strokeWidth={1.75} />
        </g>
    )
}

// Gráfico de línea genérico para series temporales (tendencias mensuales, etc).
// Adaptado del patrón shadcn "points-chart" a las convenciones del proyecto:
// JS plano (sin TS), imports relativos, y tokens de color hsl(var(--x)) en vez
// de var(--x) directo, porque acá las variables CSS guardan tripletes HSL.
function PointsChart({
    data,
    height = 256,
    title,
    subtitle,
    headerRight,
    yAxisLabel,
    levels,
    valueFormatter = defaultFormatValue,
    className,
    ...props
}) {
    const yDomain = React.useMemo(() => {
        const values = [
            ...data.map((item) => item.total),
            ...(levels?.map((level) => level.value) ?? []),
        ]

        if (values.length === 0) return [0, 100]

        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        const range = maxValue - minValue

        if (range === 0) {
            const padding = Math.max(maxValue * 0.15, 10)
            return [Math.max(0, minValue - padding), maxValue + padding]
        }

        const padding = Math.max(range * 0.12, 10)
        return [Math.max(0, minValue - padding), maxValue + padding]
    }, [data, levels])

    return (
        <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm", className)} {...props}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
            </div>
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            domain={yDomain}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            tickFormatter={valueFormatter}
                            width={64}
                            label={
                                yAxisLabel
                                    ? {
                                        value: yAxisLabel,
                                        angle: -90,
                                        position: "insideLeft",
                                        fill: "hsl(var(--muted-foreground))",
                                        fontSize: 12,
                                        dx: -18,
                                    }
                                    : undefined
                            }
                        />
                        {levels?.map((level) => (
                            <ReferenceLine
                                key={level.value}
                                y={level.value}
                                stroke={level.color}
                                strokeDasharray="6 6"
                                strokeWidth={2}
                                label={{
                                    position: "left",
                                    content: (labelProps) => (
                                        <LevelReferenceStarLabel viewBox={labelProps.viewBox ?? null} color={level.color} />
                                    ),
                                }}
                            />
                        ))}
                        <Tooltip
                            cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "4 4" }}
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null
                                const row = payload[0].payload
                                const changePrefix = row.change > 0 ? "+" : ""
                                return (
                                    <div className="bg-popover text-popover-foreground rounded-lg border border-border px-3 py-2 text-sm shadow-md">
                                        <p className="text-muted-foreground mb-1">{label}</p>
                                        <p className="font-medium tabular-nums">Total {valueFormatter(row.total)}</p>
                                        {row.change !== undefined && (
                                            <p className="text-muted-foreground text-xs tabular-nums">
                                                {changePrefix}
                                                {valueFormatter(row.change)}
                                            </p>
                                        )}
                                    </div>
                                )
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            connectNulls
                            dot={{ r: 3, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export { PointsChart }
