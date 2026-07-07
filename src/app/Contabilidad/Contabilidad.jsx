'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { getFinancialSummary, getFlujoCaja, getF29 } from '../../services/financeService';
import {
    BookOpen,
    Scale,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Info,
    ArrowRight,
    Receipt
} from 'lucide-react';
import {
    LineChart,
    Line,
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

const monthOptions = MESES_FULL.map((m, i) => ({ value: i, label: m }));
const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

// ─── Componentes menores ───────────────────────────────────────────────────────

const MetricCard = ({ label, value, sub, colorClass, icon: Icon }) => (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            {Icon && (
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={14} />
                </div>
            )}
        </div>
        <p className="text-xl font-bold tracking-tight text-foreground">{fmt(value)}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
);

const CompareRow = ({ label, cashValue, accrualValue, isTotal }) => {
    const diff = (accrualValue || 0) - (cashValue || 0);
    return (
        <tr className={`border-b border-border/30 last:border-0 ${isTotal ? 'font-semibold bg-secondary/20' : ''}`}>
            <td className="py-2.5 pr-4 text-[13px] text-muted-foreground whitespace-nowrap">{label}</td>
            <td className="py-2.5 px-3 text-[13px] text-right font-medium text-foreground tabular-nums">{fmt(cashValue)}</td>
            <td className="py-2.5 px-2 text-center"><ArrowRight size={11} className="text-muted-foreground mx-auto" /></td>
            <td className="py-2.5 px-3 text-[13px] text-right font-medium text-foreground tabular-nums">{fmt(accrualValue)}</td>
            <td className={`py-2.5 pl-3 text-[12px] text-right tabular-nums ${diff > 0 ? 'text-[hsl(var(--gold))]' : diff < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                {diff !== 0 ? `${diff > 0 ? '+' : ''}${fmt(diff)}` : '—'}
            </td>
        </tr>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-[12px]">
            <p className="font-semibold text-foreground mb-2">{MESES[parseInt(label) - 1] || label}</p>
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

export default function Contabilidad() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth());   // 0-indexed
    const [year, setYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState(null);
    const [flujoCaja, setFlujoCaja] = useState(null);
    const [f29Data, setF29Data] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        if (!silent) setError(null);
        try {
            const [sum, flujo, f29] = await Promise.all([
                getFinancialSummary(month, year),
                getFlujoCaja(year),
                getF29(month, year).catch(() => null)
            ]);
            setSummary(sum);
            setFlujoCaja(flujo);
            setF29Data(f29);
        } catch (e) {
            if (!silent) setError(e.message || 'Error al cargar datos contables');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [month, year]);

    const loadSilent = useCallback(() => load(true), [load]);
    useRealtime(loadSilent);

    useEffect(() => { load(); }, [load]);

    // Extraer métricas del mes seleccionado
    const ingresos = Number(summary?.income || 0);
    const costosFijosEfectivos = Number(summary?.fixedCosts || 0);
    const costosFijosDevengados = Number(summary?.costosDevengados ?? summary?.fixedCosts ?? 0);
    const costosVariables = Number(summary?.variableCosts || 0);

    // Base cash (efectivo)
    const resultadoCash = ingresos - costosFijosEfectivos - costosVariables;
    const fondoEmergenciaCash = Number(summary?.emergencyFundDeduction || 0);
    const utilidadCash = Number(summary?.netProfit || 0);

    // Base accrual (devengado)
    const emergencyPct = Number(summary?.config?.porcentaje_fondo_emergencia || 0);
    const reinvestPct = Number(summary?.config?.porcentaje_reinversion || 0);
    const totalDeduccionPct = emergencyPct + reinvestPct;
    const resultadoContable = Number(summary?.resultadoContable ?? (ingresos - costosFijosDevengados - costosVariables));
    const utilidadContable = Number(summary?.utilidadContable ?? resultadoContable);
    const fondoEmergenciaContable = resultadoContable - utilidadContable;

    // Gráfico anual: resultado cash vs resultado contable por mes
    const chartData = (flujoCaja?.meses || []).map((m) => {
        const ing = m.ingresos || 0;
        const cf = m.costosFijosEfectivos || 0;
        const cv = m.costosVariables || 0;
        const dev = m.costosFijosDevengados || 0;
        return {
            mes: String(m.mes),
            'Resultado Cash': Math.round(ing - cf - cv),
            'Resultado Contable': Math.round(ing - dev - cv),
        };
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BookOpen size={22} className="text-[hsl(var(--corporate-blue))]" />
                        Contabilidad
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Vista de devengado — costos provisionados mes a mes
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="h-8 px-3 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--corporate-blue))]"
                    >
                        {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-8 px-3 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--corporate-blue))]"
                    >
                        {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
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

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-sm text-rose-600">
                    {error}
                </div>
            )}

            {loading && !summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />
                    ))}
                </div>
            )}

            {summary && (
                <>
                    {/* Título del período */}
                    <p className="text-sm font-medium text-muted-foreground">
                        Período: <span className="text-foreground">{MESES_FULL[month]} {year}</span>
                    </p>

                    {/* Métricas del mes - Vista Devengado */}
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <Scale size={13} />
                            Vista Contable (Devengado)
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                label="Ingresos"
                                value={ingresos}
                                icon={TrendingUp}
                                colorClass="bg-[hsl(var(--emerald-premium))]/15 text-[hsl(var(--emerald-premium))]"
                                sub="Pagos recibidos del mes"
                            />
                            <MetricCard
                                label="Costos Devengados"
                                value={costosFijosDevengados + costosVariables}
                                icon={TrendingDown}
                                colorClass="bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]"
                                sub={`Prov. fijos ${fmt(costosFijosDevengados)} + var. ${fmt(costosVariables)}`}
                            />
                            <MetricCard
                                label="Resultado Contable"
                                value={resultadoContable}
                                colorClass={resultadoContable >= 0 ? 'bg-[hsl(var(--turquoise-premium))]/15 text-[hsl(var(--turquoise-premium))]' : 'bg-rose-500/15 text-rose-500'}
                                sub="Ingresos − costos devengados"
                            />
                            <MetricCard
                                label="Utilidad Contable"
                                value={utilidadContable}
                                colorClass={utilidadContable >= 0 ? 'bg-[hsl(var(--corporate-blue))]/15 text-[hsl(var(--corporate-blue))]' : 'bg-rose-500/15 text-rose-500'}
                                sub={totalDeduccionPct > 0 ? `Fondos devengados: ${fmt(fondoEmergenciaContable)}` : 'Sin deducciones configuradas'}
                            />
                        </div>
                    </div>

                    {/* Comparación: Flujo de Caja vs Contabilidad */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Scale size={15} className="text-[hsl(var(--corporate-blue))]" />
                            Comparación: Flujo de Caja vs Contabilidad
                        </h2>
                        <p className="text-[11px] text-muted-foreground mb-4">
                            {MESES_FULL[month]} {year} — Flujo de Caja (efectivo) → Contabilidad (devengado)
                        </p>

                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px]">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="py-2 pr-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Concepto</th>
                                    <th className="py-2 px-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Flujo Caja</th>
                                    <th className="py-2 px-2 w-6" />
                                    <th className="py-2 px-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contable</th>
                                    <th className="py-2 pl-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <CompareRow label="Ingresos" cashValue={ingresos} accrualValue={ingresos} />
                                <CompareRow label="Costos Fijos" cashValue={costosFijosEfectivos} accrualValue={costosFijosDevengados} />
                                <CompareRow label="Costos Variables" cashValue={costosVariables} accrualValue={costosVariables} />
                                <CompareRow label="Resultado Operativo" cashValue={resultadoCash} accrualValue={resultadoContable} />
                                <CompareRow label={`Fondos (${totalDeduccionPct}%)`} cashValue={fondoEmergenciaCash} accrualValue={fondoEmergenciaContable} />
                                <CompareRow label="Utilidad Neta / Contable" cashValue={utilidadCash} accrualValue={utilidadContable} isTotal />
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Gráfico anual: resultado cash vs contable */}
                    {flujoCaja && chartData.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp size={15} className="text-[hsl(var(--corporate-blue))]" />
                                Resultado Cash vs Contable — {year}
                            </h2>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
                                        <Line
                                            type="monotone"
                                            dataKey="Resultado Cash"
                                            stroke="hsl(var(--copper))"
                                            strokeWidth={2}
                                            dot={{ r: 3, fill: 'hsl(var(--copper))' }}
                                            activeDot={{ r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Resultado Contable"
                                            stroke="hsl(var(--corporate-blue))"
                                            strokeWidth={2}
                                            strokeDasharray="5 3"
                                            dot={{ r: 3, fill: 'hsl(var(--corporate-blue))' }}
                                            activeDot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* IVA / Obligación Tributaria F29 */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Receipt size={15} className="text-[hsl(var(--purple-premium))]" />
                                    Obligación Tributaria — F29 SII
                                </h2>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    IVA débito, crédito fiscal y PPM de {MESES_FULL[month]} {year}
                                </p>
                            </div>
                            {f29Data?.vencimiento && (
                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[hsl(var(--purple-premium))]/10 border border-[hsl(var(--purple-premium))]/25 text-[hsl(var(--purple-premium))] font-medium">
                                    Vence {new Date(f29Data.vencimiento + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                                </span>
                            )}
                        </div>

                        {!f29Data ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Sin datos tributarios para este período.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Débito Fiscal</p>
                                        <p className="text-lg font-bold text-foreground">{fmt(f29Data.debito_fiscal.iva)}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Base: {fmt(f29Data.debito_fiscal.base)}</p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Crédito Fiscal</p>
                                        <p className="text-lg font-bold text-[hsl(var(--emerald-premium))]">{fmt(f29Data.credito_fiscal.total)}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">IVA compras con factura</p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">PPM ({f29Data.ppm.tasa}%)</p>
                                        <p className="text-lg font-bold text-[hsl(var(--corporate-blue))]">{fmt(f29Data.ppm.monto)}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Base: {fmt(f29Data.debito_fiscal.base)}</p>
                                    </div>
                                    <div className="rounded-xl border border-[hsl(var(--purple-premium))]/30 bg-[hsl(var(--purple-premium))]/8 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--purple-premium))]/70 mb-1">Total F29</p>
                                        <p className="text-lg font-bold text-[hsl(var(--purple-premium))]">{fmt(f29Data.total_f29)}</p>
                                        <p className="text-[10px] text-[hsl(var(--purple-premium))]/60 mt-1">IVA neto + PPM</p>
                                    </div>
                                </div>

                                {/* Fila resumen IVA neto / remanente */}
                                <div className="rounded-lg bg-secondary/20 border border-border/40 px-4 py-2.5 flex items-center justify-between text-[12px]">
                                    <span className="text-muted-foreground">IVA Neto (Débito − Crédito)</span>
                                    <span className={`font-semibold ${f29Data.remanente > 0 ? 'text-[hsl(var(--emerald-premium))]' : 'text-foreground'}`}>
                                        {fmt(f29Data.iva_neto)}
                                        {f29Data.remanente > 0 && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">remanente {fmt(f29Data.remanente)} a favor</span>}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Nota conceptual */}
                    <div className="bg-[hsl(var(--corporate-blue))]/6 border border-[hsl(var(--corporate-blue))]/20 rounded-xl p-4 flex gap-3">
                        <Info size={15} className="text-[hsl(var(--corporate-blue))] shrink-0 mt-0.5" />
                        <div className="text-[12px] text-muted-foreground leading-relaxed space-y-1">
                            <p>
                                <span className="font-semibold text-[hsl(var(--copper))]">Flujo de Caja (Efectivo):</span>{' '}
                                Registra los costos en el mes en que realmente se pagan. Un hosting anual de $300.000 aparece completo solo en su mes de pago.
                            </p>
                            <p>
                                <span className="font-semibold text-[hsl(var(--corporate-blue))]">Contabilidad (Devengado):</span>{' '}
                                Distribuye el costo anual en 12 cuotas mensuales de $25.000 para reflejar la carga real de cada mes y asegurar los fondos para el próximo vencimiento.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
