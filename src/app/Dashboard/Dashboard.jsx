'use client';

import { createElement, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as financeService from '../../services/financeService';
import { useRealtime } from '../../hooks/useRealtime';
import { formatCLP } from '../../lib/utils';
import {
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { Select } from '../../components/ui/FormElements';

const CashFlowChart = dynamic(() => import('./CashFlowChart'), { ssr: false, loading: () => (
    <div className="h-full w-full rounded-lg bg-foreground/2 animate-pulse" />
) });

const StatCard = ({ title, value, icon, color, change }) => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-border/80 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={`p-2 rounded-lg ${color || 'bg-secondary text-foreground'}`}>
                {icon ? createElement(icon, { size: 16 }) : null}
            </div>
        </div>
        <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
            {change !== null && change !== undefined && (
                <p className={`text-xs font-medium flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(change)}%
                    <span className="text-muted-foreground font-normal">vs mes anterior</span>
                </p>
            )}
        </div>
    </div>
);

const ALERT_BADGE = {
    verde: { label: 'Al día', cls: 'bg-[hsl(var(--emerald-premium))]/15 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/30' },
    naranja: { label: 'Por vencer', cls: 'bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/30' },
    rojo: { label: 'Vencido', cls: 'bg-destructive/15 text-destructive border-destructive/30' }
};

const formatDiaMes = (isoDate) => {
    if (!isoDate) return '—';
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
};

const formatFechaLarga = (isoDate) => {
    if (!isoDate) return '—';
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
};

const EMPTY_PROYECCION = { proyectos: [], totalProyectado: 0 };

const EMPTY_STATS = {
    totalIncome: 0,
    totalExpenses: 0,
    emergencyFundDeduction: 0,
    reinvestmentDeduction: 0,
    netProfit: 0,
    withdrawals: 0,
    partnersAvailable: 0,
    totalFixedCosts: 0,
    totalFixedCostsCommitted: 0,
    totalVariableCosts: 0,
    ivaAPagar: 0
};

const calcChange = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
};

const mapSummaryToStats = (summary) => {
    const totalIncome = Number(summary?.income || 0);
    const totalFixedCosts = Number(summary?.fixedCosts || 0);
    const totalFixedCostsCommitted = Number(summary?.fixedCostsCommitted ?? totalFixedCosts);
    const totalVariableCosts = Number(summary?.variableCosts || 0);
    const totalExpenses = Number(summary?.expenses ?? (totalFixedCosts + totalVariableCosts));
    const emergencyFundDeduction = Number(summary?.emergencyFundDeduction || 0);
    const reinvestmentDeduction = Number(summary?.reinvestmentDeduction || 0);
    const netProfit = Number(summary?.netProfit || 0);
    const withdrawals = Number(summary?.withdrawals || 0);

    const summaryTotalPartnersAvailable = Number(summary?.totalPartnersAvailable);
    const fallbackPartnersAvailable = Number(summary?.partnersAvailable ?? Math.max(0, netProfit - withdrawals));
    const partnersAvailable = Number.isFinite(summaryTotalPartnersAvailable)
        ? summaryTotalPartnersAvailable
        : fallbackPartnersAvailable;

    return {
        totalIncome,
        totalFixedCosts,
        totalFixedCostsCommitted,
        totalVariableCosts,
        totalExpenses,
        emergencyFundDeduction,
        reinvestmentDeduction,
        netProfit,
        withdrawals,
        partnersAvailable
    };
};

export default function Dashboard() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [stats, setStats] = useState(EMPTY_STATS);
    const [monthChange, setMonthChange] = useState({
        income: null,
        expenses: null,
        retentions: null,
        partnersAvailable: null
    });
    const [cashFlowData, setCashFlowData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [proyeccionCobros, setProyeccionCobros] = useState(EMPTY_PROYECCION);

    useEffect(() => {
        const loadData = async () => {
            setDataLoaded(false);
            try {
                const currentMonth = parseInt(selectedMonth, 10);
                const currentYear = parseInt(selectedYear, 10);
                const previous = new Date(currentYear, currentMonth - 1, 1);

                const [currentSummary, previousSummary, currentF29] = await Promise.all([
                    financeService.getFinancialSummary(currentMonth, currentYear),
                    financeService.getFinancialSummary(previous.getMonth(), previous.getFullYear()),
                    financeService.getF29(currentMonth, currentYear)
                ]);

                const currentStats = { ...mapSummaryToStats(currentSummary), ivaAPagar: Number(currentF29?.iva_neto || 0) };
                const previousStats = mapSummaryToStats(previousSummary);

                setStats(currentStats);

                setMonthChange({
                    income: calcChange(currentStats.totalIncome, previousStats.totalIncome),
                    expenses: calcChange(currentStats.totalExpenses, previousStats.totalExpenses),
                    retentions: calcChange(
                        currentStats.emergencyFundDeduction + currentStats.reinvestmentDeduction,
                        previousStats.emergencyFundDeduction + previousStats.reinvestmentDeduction
                    ),
                    partnersAvailable: calcChange(currentStats.partnersAvailable, previousStats.partnersAvailable)
                });

                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const monthRequests = [];
                for (let i = 6; i >= 0; i -= 1) {
                    const d = new Date(currentYear, currentMonth - i, 1);
                    monthRequests.push({
                        label: monthNames[d.getMonth()],
                        month: d.getMonth(),
                        year: d.getFullYear()
                    });
                }

                const summaries = await Promise.all(
                    monthRequests.map((m) => financeService.getFinancialSummary(m.month, m.year))
                );

                setCashFlowData(
                    summaries.map((summary, idx) => {
                        const monthStats = mapSummaryToStats(summary);
                        return {
                            name: monthRequests[idx].label,
                            income: monthStats.totalIncome,
                            expenses: monthStats.totalExpenses
                        };
                    })
                );
            } catch (error) {
                console.error('Error cargando datos del dashboard:', error);
                setStats(EMPTY_STATS);
                setCashFlowData([]);
            } finally {
                setDataLoaded(true);
            }
        };

        loadData();
    }, [selectedMonth, selectedYear]);

    // Independiente del mes/año seleccionado — siempre mira hacia adelante desde hoy.
    useEffect(() => {
        financeService.getProyeccionCobros(30)
            .then((data) => setProyeccionCobros(data || EMPTY_PROYECCION))
            .catch(() => setProyeccionCobros(EMPTY_PROYECCION));
    }, []);

    useRealtime(useCallback(() => {
        const currentMonth = parseInt(selectedMonth, 10);
        const currentYear  = parseInt(selectedYear, 10);
        Promise.all([
            financeService.getFinancialSummary(currentMonth, currentYear),
            financeService.getF29(currentMonth, currentYear)
        ])
            .then(([s, f29]) => { if (s) setStats({ ...mapSummaryToStats(s), ivaAPagar: Number(f29?.iva_neto || 0) }); })
            .catch(() => {});

        financeService.getProyeccionCobros(30)
            .then((data) => { if (data) setProyeccionCobros(data); })
            .catch(() => {});
    }, [selectedMonth, selectedYear]));

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Panel Financiero</h2>
                    <p className="text-sm text-muted-foreground mt-1">Resumen financiero general</p>
                </div>
                <div className="flex gap-4">
                    <div className="w-40">
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-card/50 backdrop-blur-sm border-border/50"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </Select>
                    </div>
                    <div className="w-32">
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-card/50 backdrop-blur-sm border-border/50"
                        >
                            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ingresos Totales" value={formatCLP(stats.totalIncome)} icon={DollarSign}
                    color="bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))]" change={monthChange.income} />
                <StatCard title="Gastos Operativos" value={formatCLP(stats.totalExpenses)} icon={Activity}
                    color="bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))]" change={monthChange.expenses} />
                <StatCard title="Retenciones (Fondo + Reinv.)" value={formatCLP(stats.emergencyFundDeduction + stats.reinvestmentDeduction)} icon={TrendingUp}
                    color="bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))]" change={monthChange.retentions} />
                <StatCard title="Neto a Repartir (Real)" value={formatCLP(stats.partnersAvailable)} icon={TrendingUp}
                    color="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" change={monthChange.partnersAvailable} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Flujo de Caja</h3>
                    <div className="h-80 w-full">
                        <CashFlowChart data={cashFlowData} />
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Gastos por Categoría</h3>
                    {dataLoaded ? (
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Costos Fijos</span>
                                <span className="font-medium text-foreground">{formatCLP(stats.totalFixedCosts)}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[hsl(var(--copper))] rounded-full"
                                    style={{
                                        width: `${stats.totalExpenses > 0 ? Math.round((stats.totalFixedCosts / stats.totalExpenses) * 100) : 0}%`
                                    }}
                                />
                            </div>

                            <div className="flex justify-between text-sm mt-4">
                                <span className="text-muted-foreground">Costos Variables</span>
                                <span className="font-medium text-foreground">{formatCLP(stats.totalVariableCosts)}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-foreground/80 rounded-full"
                                    style={{
                                        width: `${stats.totalExpenses > 0 ? Math.round((stats.totalVariableCosts / stats.totalExpenses) * 100) : 0}%`
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm mt-4">
                                <span className="text-muted-foreground">Fijos Vigentes (Compromiso)</span>
                                <span className="font-medium text-[hsl(var(--corporate-blue))]">{formatCLP(stats.totalFixedCostsCommitted)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-4 pt-4 border-t border-border/50">
                                <span className="text-muted-foreground">IVA a Pagar (F29)</span>
                                <span className="font-medium text-[hsl(var(--purple-premium))]">{formatCLP(stats.ivaAPagar)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-12">Cargando...</div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Proyección de Cobros</h3>
                        <p className="text-sm text-muted-foreground mt-1">Panorama de cobros esperados en los próximos 30 días</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total proyectado</p>
                            <p className="text-xl font-bold text-foreground">{formatCLP(proyeccionCobros.totalProyectado)}</p>
                        </div>
                        {proyeccionCobros.proyectos.length > 0 && (
                            <div className="text-right border-l border-border/50 pl-6">
                                <p className="text-xs text-muted-foreground">Todo cobrado (estimado) el</p>
                                <p className="text-xl font-bold text-[hsl(var(--gold))]">
                                    {formatFechaLarga(proyeccionCobros.proyectos[proyeccionCobros.proyectos.length - 1].fechaProximoPago)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {proyeccionCobros.proyectos.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">Sin cobros proyectados en los próximos 30 días.</div>
                ) : (
                    <div className="max-h-96 overflow-y-auto pr-1 space-y-1">
                        {proyeccionCobros.proyectos.map((p) => {
                            const badge = ALERT_BADGE[p.estadoAlerta] || ALERT_BADGE.verde;
                            return (
                                <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{p.nombreCliente}</p>
                                        <p className="text-xs text-muted-foreground">{formatDiaMes(p.fechaProximoPago)} · {p.cicloFacturacion}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                                        <div className="text-right w-24">
                                            <p className="text-sm font-medium text-foreground tabular-nums">{formatCLP(p.montoProyectado)}</p>
                                            <p className="text-[10px] text-muted-foreground tabular-nums">acum. {formatCLP(p.acumulado)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
