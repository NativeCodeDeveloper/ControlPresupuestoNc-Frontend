'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFlujoCaja } from '../../services/financeService';
import {
    ArrowDownRight,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Wallet,
    CalendarDays,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    Minus
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const fmt = (n) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtShort = (n) => {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ─── Componentes menores ───────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon: Icon, colorClass, subLabel }) => (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={14} />
            </div>
        </div>
        <p className="text-xl font-bold tracking-tight text-foreground">{fmt(value)}</p>
        {subLabel && <p className="text-[11px] text-muted-foreground mt-1">{subLabel}</p>}
    </div>
);

const FlowIndicator = ({ value }) => {
    if (value > 0) return <span className="text-emerald-500 flex items-center gap-0.5"><ChevronUp size={13} />{fmtShort(value)}</span>;
    if (value < 0) return <span className="text-rose-500 flex items-center gap-0.5"><ChevronDown size={13} />{fmtShort(value)}</span>;
    return <span className="text-muted-foreground flex items-center gap-0.5"><Minus size={13} />$0</span>;
};

// ─── CustomTooltip para recharts ───────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-[12px]">
            <p className="font-semibold text-foreground mb-2">{MESES_FULL[parseInt(label) - 1] || label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
                    <span>{entry.name}:</span>
                    <span className="font-medium">{fmt(entry.value)}</span>
                </p>
            ))}
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FlujoCaja() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getFlujoCaja(year);
            if (!result) throw new Error('Sin respuesta del servidor');
            setData(result);
        } catch (e) {
            setError(e.message || 'Error al cargar flujo de caja');
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => { load(); }, [load]);

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const currentMonthIndex = new Date().getMonth(); // 0-indexed

    const meses = data?.meses || [];
    const totales = data?.totales || {};

    // Datos para el gráfico de barras
    const chartData = meses.map((m) => ({
        mes: String(m.mes),
        Ingresos: Math.round(m.ingresos || 0),
        'Egresos Efectivos': Math.round((m.costosFijosEfectivos || 0) + (m.costosVariables || 0) + (m.retiros || 0)),
        'Provisiones': Math.round(m.costosFijosDevengados || 0),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Flujo de Caja</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Movimientos reales de efectivo por mes</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-8 px-3 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--turquoise-premium))]"
                    >
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-foreground/5 transition-colors"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin text-muted-foreground' : 'text-foreground'} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-600">
                    {error}
                </div>
            )}

            {/* Skeleton / Loading */}
            {loading && !data && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />
                    ))}
                </div>
            )}

            {data && (
                <>
                    {/* Tarjetas resumen anuales */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard
                            label="Ingresos Totales"
                            value={totales.ingresos}
                            icon={TrendingUp}
                            colorClass="bg-[hsl(var(--emerald-premium))]/15 text-[hsl(var(--emerald-premium))]"
                            subLabel={`Año ${year}`}
                        />
                        <SummaryCard
                            label="Egresos Efectivos"
                            value={(totales.costosFijosEfectivos || 0) + (totales.costosVariables || 0) + (totales.retiros || 0)}
                            icon={TrendingDown}
                            colorClass="bg-[hsl(var(--copper))]/15 text-[hsl(var(--copper))]"
                            subLabel="Costos + retiros pagados"
                        />
                        <SummaryCard
                            label="Provisiones Acumuladas"
                            value={totales.costosFijosDevengados}
                            icon={Wallet}
                            colorClass="bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]"
                            subLabel="Costos devengados (accrual)"
                        />
                        <SummaryCard
                            label="Flujo Neto Anual"
                            value={totales.flujoNeto}
                            icon={totales.flujoNeto >= 0 ? ArrowUpRight : ArrowDownRight}
                            colorClass={
                                (totales.flujoNeto || 0) >= 0
                                    ? 'bg-[hsl(var(--turquoise-premium))]/15 text-[hsl(var(--turquoise-premium))]'
                                    : 'bg-rose-500/15 text-rose-500'
                            }
                            subLabel="Ingresos − Egresos totales"
                        />
                    </div>

                    {/* Gráfico de barras */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <CalendarDays size={15} className="text-[hsl(var(--turquoise-premium))]" />
                            Ingresos vs Egresos — {year}
                        </h2>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="mes"
                                        tickFormatter={(v) => MESES[parseInt(v) - 1] || v}
                                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={fmtShort}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={58}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="Ingresos" fill="hsl(var(--emerald-premium))" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Egresos Efectivos" fill="hsl(var(--copper))" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Provisiones" fill="hsl(var(--gold))" radius={[3, 3, 0, 0]} opacity={0.7} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tabla mensual detallada */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-border/50">
                            <h2 className="text-sm font-semibold text-foreground">Detalle mensual</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="bg-foreground/3 border-b border-border/50">
                                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Mes</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-[hsl(var(--emerald-premium))]">Ingresos</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-[hsl(var(--copper))]">C. Fijos Efectivos</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-[hsl(var(--gold))]">Provisión Mensual</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-[hsl(var(--copper))]">C. Variables</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Retiros</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Fondo Emerg.</th>
                                        <th className="text-right px-4 py-2.5 font-medium text-foreground">Flujo Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meses.map((m, idx) => {
                                        const isCurrent = year === currentYear && idx === currentMonthIndex;
                                        const flujoNeto = m.flujoNeto || 0;
                                        return (
                                            <tr
                                                key={m.mes}
                                                className={`border-b border-border/30 transition-colors hover:bg-foreground/3 ${isCurrent ? 'bg-[hsl(var(--turquoise-premium))]/5' : ''}`}
                                            >
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        {MESES_FULL[idx]}
                                                        {isCurrent && <span className="text-[9px] bg-[hsl(var(--turquoise-premium))]/20 text-[hsl(var(--turquoise-premium))] px-1.5 py-0.5 rounded-full">Actual</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-[hsl(var(--emerald-premium))] font-medium">{fmt(m.ingresos)}</td>
                                                <td className="px-4 py-2.5 text-right text-[hsl(var(--copper))]">{fmt(m.costosFijosEfectivos)}</td>
                                                <td className="px-4 py-2.5 text-right text-[hsl(var(--gold))]">{fmt(m.costosFijosDevengados)}</td>
                                                <td className="px-4 py-2.5 text-right text-[hsl(var(--copper))]">{fmt(m.costosVariables)}</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{fmt(m.retiros)}</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{fmt(m.fondoEmergencia)}</td>
                                                <td className="px-4 py-2.5 text-right font-semibold">
                                                    <FlowIndicator value={flujoNeto} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-foreground/5 border-t border-border/60 font-semibold">
                                        <td className="px-4 py-3 text-foreground">TOTAL {year}</td>
                                        <td className="px-4 py-3 text-right text-[hsl(var(--emerald-premium))]">{fmt(totales.ingresos)}</td>
                                        <td className="px-4 py-3 text-right text-[hsl(var(--copper))]">{fmt(totales.costosFijosEfectivos)}</td>
                                        <td className="px-4 py-3 text-right text-[hsl(var(--gold))]">{fmt(totales.costosFijosDevengados)}</td>
                                        <td className="px-4 py-3 text-right text-[hsl(var(--copper))]">{fmt(totales.costosVariables)}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{fmt(totales.retiros)}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{fmt(totales.fondoEmergencia)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <FlowIndicator value={totales.flujoNeto} />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Nota informativa */}
                    <div className="bg-[hsl(var(--gold))]/8 border border-[hsl(var(--gold))]/25 rounded-xl p-4">
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-[hsl(var(--gold))]">Provisión Mensual (Devengado):</span>{' '}
                            Fracción mensual de costos fijos anuales/trimestrales que se reserva para garantizar el pago cuando vence.
                            Por ejemplo, un hosting anual de $300.000 CLP genera una provisión de $25.000/mes.{' '}
                            <span className="font-semibold text-[hsl(var(--copper))]">C. Fijos Efectivos:</span>{' '}
                            Pagos reales realizados en el mes (solo aparecen en el mes de vencimiento real).
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
