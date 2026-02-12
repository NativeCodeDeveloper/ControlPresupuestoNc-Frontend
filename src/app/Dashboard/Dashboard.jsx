import { createElement, useState, useEffect } from 'react';
import * as financeService from '../../services/financeService';
import * as costsService from '../../services/costsService';
import {
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

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

const EMPTY_STATS = {
    totalIncome: 0,
    totalExpenses: 0,
    emergencyFundDeduction: 0,
    reinvestmentDeduction: 0,
    netProfit: 0,
    totalFixedCosts: 0,
    totalVariableCosts: 0
};

const calcChange = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
};

const toAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9,.-]/g, '');
        if (!cleaned) return 0;

        const hasComma = cleaned.includes(',');
        const hasDot = cleaned.includes('.');
        let normalized = cleaned;

        if (hasComma && hasDot) {
            normalized = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
                ? cleaned.replace(/\./g, '').replace(',', '.')
                : cleaned.replace(/,/g, '');
        } else if (hasComma && !hasDot) {
            normalized = cleaned.replace(',', '.');
        }

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;

        let match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }

        match = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
        if (match) {
            return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        }
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getFrequencyStepMonths = (frequency) => {
    const value = String(frequency || 'Mensual').toLowerCase();
    if (value.includes('trimes')) return 3;
    if (value.includes('anual')) return 12;
    return 1;
};

const buildDateInMonth = (year, monthIndex, dayOfMonth) => {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const safeDay = Math.min(Math.max(1, Number(dayOfMonth) || 1), lastDay);
    return new Date(year, monthIndex, safeDay);
};

const computeNextFixedDueDate = (cost, referenceDate = new Date()) => {
    const ref = normalizeDate(referenceDate);
    const start = normalizeDate(cost?.fecha_inicio) || ref;
    const end = normalizeDate(cost?.fecha_fin);
    const paymentDay = Number(cost?.fecha_pago || start.getDate());
    const stepMonths = getFrequencyStepMonths(cost?.frecuencia);

    let due = buildDateInMonth(start.getFullYear(), start.getMonth(), paymentDay);
    if (due < start) {
        const moved = new Date(start.getFullYear(), start.getMonth() + stepMonths, 1);
        due = buildDateInMonth(moved.getFullYear(), moved.getMonth(), paymentDay);
    }

    while (due < ref) {
        const moved = new Date(due.getFullYear(), due.getMonth() + stepMonths, 1);
        due = buildDateInMonth(moved.getFullYear(), moved.getMonth(), paymentDay);
    }

    if (end && due > end) return null;
    return due;
};

const fixedCostOccursInPeriod = (cost, year, monthIndex) => {
    const periodStart = new Date(year, monthIndex, 1);
    const periodEnd = new Date(year, monthIndex + 1, 0);
    const start = normalizeDate(cost?.fecha_inicio);
    const end = normalizeDate(cost?.fecha_fin);

    if (end && end < periodStart) return false;
    if (start && start > periodEnd) return false;
    if (start && start >= periodStart && start <= periodEnd) return true;

    const dueDate = computeNextFixedDueDate(cost, periodStart);
    if (!dueDate) return false;
    return dueDate >= periodStart && dueDate <= periodEnd;
};

const getMonthCosts = (fixedCosts, variableCosts, year, monthIndex) => {
    const periodStart = new Date(year, monthIndex, 1);
    const periodEnd = new Date(year, monthIndex + 1, 0);

    const fixed = (Array.isArray(fixedCosts) ? fixedCosts : [])
        .filter((cost) => fixedCostOccursInPeriod(cost, year, monthIndex))
        .reduce((sum, cost) => sum + toAmount(cost?.monto), 0);

    const variable = (Array.isArray(variableCosts) ? variableCosts : [])
        .filter((cost) => {
            const date = normalizeDate(cost?.fecha || cost?.date || cost?.created_at);
            return date && date >= periodStart && date <= periodEnd;
        })
        .reduce((sum, cost) => sum + toAmount(cost?.monto), 0);

    return {
        fixed,
        variable,
        expenses: fixed + variable
    };
};

export default function Dashboard() {
    const [stats, setStats] = useState(EMPTY_STATS);
    const [monthChange, setMonthChange] = useState({
        income: null,
        expenses: null,
        retentions: null,
        netProfit: null
    });
    const [cashFlowData, setCashFlowData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const previous = new Date(currentYear, currentMonth - 1, 1);

                const [currentSummary, previousSummary, fixedCostsData, variableCostsData] = await Promise.all([
                    financeService.getFinancialSummary(currentMonth, currentYear),
                    financeService.getFinancialSummary(previous.getMonth(), previous.getFullYear()),
                    costsService.getFixedCosts(),
                    costsService.getVariableCosts()
                ]);

                const currentCosts = getMonthCosts(fixedCostsData, variableCostsData, currentYear, currentMonth);
                const previousCosts = getMonthCosts(fixedCostsData, variableCostsData, previous.getFullYear(), previous.getMonth());

                const currentIncome = Number(currentSummary?.income || 0);
                const currentOperatingResult = currentIncome - currentCosts.expenses;
                const currentBaseForDeductions = Math.max(0, currentOperatingResult);
                const currentEmergencyPct = Number(currentSummary?.config?.porcentaje_fondo_emergencia || 0);
                const currentReinvestPct = Number(currentSummary?.config?.porcentaje_reinversion || 0);
                const currentEmergencyDeduction = (currentBaseForDeductions * currentEmergencyPct) / 100;
                const currentReinvestDeduction = (currentBaseForDeductions * currentReinvestPct) / 100;

                const currentStats = {
                    totalIncome: currentIncome,
                    totalFixedCosts: currentCosts.fixed,
                    totalVariableCosts: currentCosts.variable,
                    totalExpenses: currentCosts.expenses,
                    emergencyFundDeduction: currentEmergencyDeduction,
                    reinvestmentDeduction: currentReinvestDeduction,
                    netProfit: currentOperatingResult - currentEmergencyDeduction - currentReinvestDeduction
                };
                setStats(currentStats);

                const previousIncome = Number(previousSummary?.income || 0);
                const previousExpenses = previousCosts.expenses;
                const previousOperatingResult = previousIncome - previousExpenses;
                const previousBaseForDeductions = Math.max(0, previousOperatingResult);
                const previousEmergencyPct = Number(previousSummary?.config?.porcentaje_fondo_emergencia || 0);
                const previousReinvestPct = Number(previousSummary?.config?.porcentaje_reinversion || 0);
                const previousRetentions = (previousBaseForDeductions * previousEmergencyPct) / 100
                    + (previousBaseForDeductions * previousReinvestPct) / 100;
                const previousNet = previousOperatingResult - previousRetentions;

                setMonthChange({
                    income: calcChange(currentStats.totalIncome, previousIncome),
                    expenses: calcChange(currentStats.totalExpenses, previousExpenses),
                    retentions: calcChange(currentStats.emergencyFundDeduction + currentStats.reinvestmentDeduction, previousRetentions),
                    netProfit: calcChange(currentStats.netProfit, previousNet)
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
                    summaries.map((summary, idx) => ({
                        name: monthRequests[idx].label,
                        income: Number(summary?.income || 0),
                        expenses: getMonthCosts(
                            fixedCostsData,
                            variableCostsData,
                            monthRequests[idx].year,
                            monthRequests[idx].month
                        ).expenses
                    }))
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
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">Resumen financiero general</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ingresos Totales" value={formatCurrency(stats.totalIncome)} icon={DollarSign}
                    color="bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))]" change={monthChange.income} />
                <StatCard title="Gastos Operativos" value={formatCurrency(stats.totalExpenses)} icon={Activity}
                    color="bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))]" change={monthChange.expenses} />
                <StatCard title="Retenciones (Fondo + Reinv.)" value={formatCurrency(stats.emergencyFundDeduction + stats.reinvestmentDeduction)} icon={TrendingUp}
                    color="bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))]" change={monthChange.retentions} />
                <StatCard title="Utilidad Neta (Socios)" value={formatCurrency(stats.netProfit)} icon={TrendingUp}
                    color="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" change={monthChange.netProfit} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Flujo de Caja</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} tickFormatter={(value) => `$${value}`} />
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Bar dataKey="income" name="Ingresos" fill="hsl(var(--emerald-premium))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expenses" name="Gastos" fill="hsl(var(--copper))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Gastos por Categoría</h3>
                    {dataLoaded ? (
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Costos Fijos</span>
                                <span className="font-medium text-foreground">{formatCurrency(stats.totalFixedCosts)}</span>
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
                                <span className="font-medium text-foreground">{formatCurrency(stats.totalVariableCosts)}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-foreground/80 rounded-full"
                                    style={{
                                        width: `${stats.totalExpenses > 0 ? Math.round((stats.totalVariableCosts / stats.totalExpenses) * 100) : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground text-center py-12">Cargando...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
