import { useFinance } from '../../context/FinanceContext';
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
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:border-border/80 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={`p-2 rounded-lg ${color || 'bg-secondary text-foreground'}`}>
                <Icon size={16} />
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

export default function Dashboard() {
    const { data: financeData, getFinancialStats, getReportStats } = useFinance();
    const stats = getFinancialStats();

    // Calculate real month-over-month percentage changes
    const getMonthChange = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) { prevMonth = 11; prevYear--; }

        const current = getReportStats(currentMonth, currentYear);
        const previous = getReportStats(prevMonth, prevYear);

        const calcChange = (curr, prev) => {
            if (prev === 0 && curr === 0) return null;
            if (prev === 0) return 100;
            return Math.round(((curr - prev) / prev) * 100);
        };

        const currentRetentions = (current.emergencyFundDeduction || 0) + (current.reinvestmentDeduction || 0);
        const previousRetentions = (previous.emergencyFundDeduction || 0) + (previous.reinvestmentDeduction || 0);

        return {
            income: calcChange(current.income, previous.income),
            expenses: calcChange(current.expenses, previous.expenses),
            retentions: calcChange(currentRetentions, previousRetentions),
            netProfit: calcChange(current.netProfit, previous.netProfit)
        };
    };

    const monthChange = getMonthChange();

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val);
    };

    // Generate real monthly data for the chart based on actual transactions
    const generateMonthlyChartData = () => {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        // Generate last 6 months + current month
        const months = [];
        for (let i = 6; i >= 0; i--) {
            let month = currentMonth - i;
            let year = currentYear;
            if (month < 0) {
                month += 12;
                year -= 1;
            }
            months.push({ month, year, name: monthNames[month] });
        }

        return months.map(({ month, year, name }) => {
            // Calculate income for this month from project history
            const projectIncome = (financeData?.projects || []).reduce((sum, proj) => {
                const historyInMonth = (proj.history || []).filter(h => {
                    if (!h.date) return false;
                    const d = new Date(h.date);
                    return d.getMonth() === month && d.getFullYear() === year;
                });
                return sum + historyInMonth.reduce((acc, h) => acc + (h.amount || 0), 0);
            }, 0);

            // Calculate fixed costs for this month
            const fixedCostsTotal = (financeData?.fixedCosts || []).reduce((sum, c) => {
                const dateStr = c.date || c.paymentDate;
                if (!dateStr) return sum;
                const d = new Date(dateStr);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    return sum + (c.amount || 0);
                }
                return sum;
            }, 0);

            // Calculate variable costs for this month
            const variableCostsTotal = (financeData?.variableCosts || []).reduce((sum, c) => {
                if (!c.date) return sum;
                const d = new Date(c.date);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    return sum + (c.amount || 0);
                }
                return sum;
            }, 0);

            return {
                name,
                income: projectIncome,
                expenses: fixedCostsTotal + variableCostsTotal
            };
        });
    };

    const cashFlowData = generateMonthlyChartData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">Resumen financiero general</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={formatCurrency(stats?.totalIncome || 0)}
                    icon={DollarSign}
                    color="bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))]"
                    change={monthChange.income}
                />
                <StatCard
                    title="Gastos Operativos"
                    value={formatCurrency(stats?.totalExpenses || 0)}
                    icon={Activity}
                    color="bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))]"
                    change={monthChange.expenses}
                />
                <StatCard
                    title="Retenciones (Fondo + Reinv.)"
                    value={formatCurrency((stats?.emergencyFundDeduction || 0) + (stats?.reinvestmentDeduction || 0))}
                    icon={TrendingUp}
                    color="bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))]"
                    change={monthChange.retentions}
                />
                <StatCard
                    title="Utilidad Neta (Socios)"
                    value={formatCurrency(stats?.netProfit || 0)}
                    icon={TrendingUp}
                    color="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]"
                    change={monthChange.netProfit}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Flujo de Caja</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dx={-10}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar dataKey="income" name="Ingresos" fill="hsl(var(--emerald-premium))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expenses" name="Gastos" fill="hsl(var(--copper))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Gastos por Categoría</h3>
                    <div className="space-y-6">
                        {(() => {
                            const totalExpenses = financeData?.expenses || 0;

                            const fixedCosts = financeData?.fixedCosts || [];
                            const variableCosts = financeData?.variableCosts || [];

                            const fixedMap = fixedCosts.reduce((acc, curr) => {
                                const key = curr.category || 'Otros';
                                acc[key] = (acc[key] || 0) + parseFloat(curr.amount || 0);
                                return acc;
                            }, {});

                            const variableMap = variableCosts.reduce((acc, curr) => {
                                const key = curr.type || 'Variable';
                                acc[key] = (acc[key] || 0) + parseFloat(curr.amount || 0);
                                return acc;
                            }, {});

                            const allExpenses = { ...fixedMap, ...variableMap };

                            const distribution = Object.entries(allExpenses)
                                .map(([label, amount]) => ({
                                    label,
                                    amount,
                                    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                                }))
                                .sort((a, b) => b.amount - a.amount)
                                .slice(0, 5);

                            if (distribution.length === 0) {
                                return <div className="text-sm text-muted-foreground text-center py-12">No hay gastos registrados.</div>;
                            }

                            return distribution.map((item, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-foreground">{item.label}</span>
                                        <span className="text-muted-foreground">{item.percentage}% ({formatCurrency(item.amount)})</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-foreground/80 rounded-full"
                                            style={{ width: `${item.percentage}%`, opacity: 1 - (idx * 0.15) }}
                                        ></div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
