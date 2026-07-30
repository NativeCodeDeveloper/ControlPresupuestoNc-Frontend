'use client';

import { useState, useEffect, useCallback, createElement } from 'react';
import {
    Radar, TrendingUp, Users, UserMinus, Gem, Megaphone, Rocket, Loader2, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select } from '../../components/ui/FormElements';
import { cn } from '../../lib/utils';
import { getMetricasNegocio } from '../../services/clientesService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);

const fmtPercent = (n) =>
    n == null ? '—' : `${(n * 100).toFixed(1)}%`;

const fmtOrDash = (n) => n == null ? '—' : fmt(n);

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const monthLabel = (periodo) => {
    const [y, m] = (periodo || '').split('-');
    if (!y || !m) return periodo;
    return `${MONTHS[Number(m) - 1]?.slice(0, 3)} ${y.slice(2)}`;
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, subtitle, hint, iconTone }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm" title={hint}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className={cn('p-2 rounded-lg', iconTone || 'bg-amber-500/12 text-amber-400')}>
                    {icon ? createElement(icon, { size: 18 }) : null}
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );
}

function ChartPanel({ title, subtitle, children }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="h-64">
                {children}
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function MetricasNegocio() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const mes = Number(selectedMonth) + 1;
            const result = await getMetricasNegocio(mes, selectedYear);
            setData(result);
        } catch (e) {
            console.error('[MetricasNegocio]', e);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => { load(); }, [load]);

    const ingresosChart = (data?.tendencia?.ingresos || []).map(r => ({
        name: monthLabel(r.periodo),
        total: Number(r.total || 0),
    }));

    const clientesChart = (data?.tendencia?.clientesNuevos || []).map(r => ({
        name: monthLabel(r.periodo),
        total: Number(r.total || 0),
    }));

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Radar size={18} className="text-amber-400" strokeWidth={1.8} />
                        <h1 className="text-[18px] font-semibold tracking-tight">Métricas de Negocio</h1>
                    </div>
                    <p className="text-[12px] text-muted-foreground">Indicadores SaaS del negocio — MRR, ARPA, Churn, LTV, CAC y ASP</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-36">
                        <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-card/50 backdrop-blur-sm border-border/50">
                            {MONTHS.map((label, index) => (
                                <option key={label} value={index}>{label}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="w-28">
                        <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-card/50 backdrop-blur-sm border-border/50">
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </Select>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[13px]">Calculando métricas…</span>
                </div>
            ) : (
                <>
                    {/* Métricas principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="MRR"
                            value={fmt(data?.mrr)}
                            icon={TrendingUp}
                            subtitle="Ingreso recurrente mensual contractual"
                            iconTone="bg-[hsl(var(--emerald-premium))]/12 text-[hsl(var(--emerald-premium))]"
                        />
                        <StatCard
                            title="ARPA"
                            value={fmt(data?.arpa)}
                            icon={Users}
                            subtitle="Ingreso mensual promedio por cuenta"
                            iconTone="bg-amber-500/12 text-amber-400"
                        />
                        <StatCard
                            title="Cuentas Recurrentes"
                            value={data?.cuentasActivas ?? 0}
                            icon={Users}
                            subtitle="Clientes con ciclo de facturación activo"
                            iconTone="bg-[hsl(var(--corporate-blue))]/12 text-[hsl(var(--corporate-blue))]"
                        />
                        <StatCard
                            title="Churn Rate"
                            value={data?.churnBasePeriodo > 0 ? fmtPercent(data?.churnRatePeriodo) : fmtPercent(data?.churnRate)}
                            icon={UserMinus}
                            subtitle={
                                data?.churnBasePeriodo > 0
                                    ? `${data?.churnCanceladosPeriodo ?? 0} de ${data?.churnBasePeriodo ?? 0} cuentas — cancelados en el período`
                                    : `${data?.churnCancelados ?? 0} de ${data?.churnTotal ?? 0} proyectos — snapshot actual`
                            }
                            hint={
                                data?.churnBasePeriodo > 0
                                    ? "Basado en fecha real de cancelación (solo se registra desde que un proyecto pasa a estado Cancelado). Desactivada no cuenta como churn."
                                    : "Aproximado: sin cancelaciones con fecha registrada en este período todavía (la fecha solo se guarda desde que se implementó), se muestra el snapshot del estado actual (Cancelado/Desactivada)."
                            }
                            iconTone="bg-red-500/12 text-red-400"
                        />
                    </div>

                    {/* Métricas derivadas / aproximadas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="LTV (estimado)"
                            value={fmtOrDash(data?.ltv)}
                            icon={Gem}
                            subtitle="ARPA ÷ Churn Rate"
                            hint="Estimado: depende del Churn Rate aproximado (snapshot), no de un cálculo por cohortes."
                            iconTone="bg-[hsl(var(--purple-premium))]/12 text-[hsl(var(--purple-premium))]"
                        />
                        <StatCard
                            title="CAC (aprox.)"
                            value={fmtOrDash(data?.cac)}
                            icon={Megaphone}
                            subtitle={`Gasto Marketing/Publicidad ÷ ${data?.cacClientesNuevos ?? 0} clientes nuevos`}
                            hint="Aproximación macro: gasto en categorías Marketing y Publicidad del período, sin atribución directa cliente-por-cliente."
                            iconTone="bg-[hsl(var(--copper))]/12 text-[hsl(var(--copper))]"
                        />
                        <StatCard
                            title="ASP"
                            value={fmtOrDash(data?.asp)}
                            icon={Rocket}
                            subtitle={`MRR promedio de ${data?.aspClientesConsiderados ?? 0} clientes nuevos del período`}
                            hint="Excluye clientes cuyo primer proyecto es de ciclo Único (sin ingreso recurrente)."
                            iconTone="bg-[hsl(var(--gold))]/16 text-[hsl(var(--gold))]"
                        />
                    </div>

                    {/* Tendencia */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartPanel title="Ingresos cobrados" subtitle="Últimos 12 meses — caja real">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ingresosChart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                                    <Tooltip
                                        formatter={(value) => fmt(value)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="total" name="Ingresos" fill="hsl(var(--emerald-premium))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartPanel>

                        <ChartPanel title="Clientes nuevos" subtitle="Últimos 12 meses — primer proyecto registrado">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={clientesChart}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="total" name="Clientes nuevos" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartPanel>
                    </div>
                </>
            )}
        </div>
    );
}
