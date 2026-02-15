import { createElement, useState, useEffect } from 'react';
import * as financeService from '../../services/financeService';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    FileDown,
    Loader2,
    PiggyBank
} from 'lucide-react';
import { Select } from '../../components/ui/FormElements';
import { generateFinancialReport } from '../../lib/pdfGenerator';

export default function Reportes() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('screen');

    const [stats, setStats] = useState({
        income: 0,
        fixedCosts: 0,
        fixedCostsCommitted: 0,
        variableCosts: 0,
        expenses: 0,
        operatingResult: 0,
        emergencyFundDeduction: 0,
        reinvestmentDeduction: 0,
        emergencyFundPercentage: 0,
        reinvestmentPercentage: 0,
        netProfit: 0,
        withdrawals: 0,
        investmentsTotal: 0,
        investmentsReinvest: 0,
        investmentsEmergency: 0,
        fundReinvestAssigned: 0,
        fundReinvestUsed: 0,
        fundReinvestAvailable: 0,
        fundEmergencyAssigned: 0,
        fundEmergencyUsed: 0,
        fundEmergencyAvailable: 0,
        totalPartnersAvailable: 0,
        totalPartnersAvailableAccumulated: 0,
        partnersAvailability: []
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const month = parseInt(selectedMonth, 10);
                const year = parseInt(selectedYear, 10);
                const summary = await financeService.getFinancialSummary(month, year);
                const fixedCosts = Number(summary?.fixedCosts || 0);
                const fixedCostsCommitted = Number(summary?.fixedCostsCommitted ?? fixedCosts);
                const variableCosts = Number(summary?.variableCosts || 0);
                const expenses = fixedCosts + variableCosts;
                const income = Number(summary?.income || 0);
                const operatingResult = income - expenses;

                const summaryNetProfit = Number(summary?.netProfit || 0);
                const summaryWithdrawals = Number(summary?.withdrawals || 0);
                const summaryPartnersAvailable = Math.max(
                    0,
                    Number(summary?.partnersAvailable ?? (summaryNetProfit - summaryWithdrawals))
                );

                const partnersAvailability = Array.isArray(summary?.partnersAvailability)
                    ? summary.partnersAvailability.map((partner) => ({
                        id: Number(partner?.id),
                        name: partner?.name || partner?.nombre || `Socio ${partner?.id}`,
                        percentage: Number(partner?.percentage || partner?.porcentaje_participacion || 0),
                        assigned: Number(partner?.assigned || partner?.asignado || 0),
                        withdrawn: Number(partner?.withdrawn || partner?.retirado || 0),
                        available: Number(partner?.available || partner?.disponible || 0)
                    }))
                    : [];

                const summaryTotalPartnersAvailable = Number(summary?.totalPartnersAvailable);
                const totalPartnersAvailable = Number.isFinite(summaryTotalPartnersAvailable)
                    ? summaryTotalPartnersAvailable
                    : (partnersAvailability.length > 0
                        ? partnersAvailability.reduce((sum, partner) => sum + Number(partner.available || 0), 0)
                        : summaryPartnersAvailable);
                const summaryTotalPartnersAvailableAccumulated = Number(summary?.totalPartnersAvailableAccumulated);
                const totalPartnersAvailableAccumulated = Number.isFinite(summaryTotalPartnersAvailableAccumulated)
                    ? summaryTotalPartnersAvailableAccumulated
                    : totalPartnersAvailable;

                setStats({
                    income,
                    fixedCosts,
                    fixedCostsCommitted,
                    variableCosts,
                    expenses,
                    operatingResult,
                    emergencyFundDeduction: Number(summary?.emergencyFundDeduction || 0),
                    reinvestmentDeduction: Number(summary?.reinvestmentDeduction || 0),
                    emergencyFundPercentage: Number(summary?.config?.porcentaje_fondo_emergencia || 0),
                    reinvestmentPercentage: Number(summary?.config?.porcentaje_reinversion || 0),
                    netProfit: summaryNetProfit,
                    withdrawals: summaryWithdrawals,
                    investmentsTotal: Number(summary?.investments?.total || 0),
                    investmentsReinvest: Number(summary?.investments?.reinversion || 0),
                    investmentsEmergency: Number(summary?.investments?.emergencia || 0),
                    fundReinvestAssigned: Number(summary?.fondos?.reinversion?.asignado || 0),
                    fundReinvestUsed: Number(summary?.fondos?.reinversion?.usado || 0),
                    fundReinvestAvailable: Number(summary?.fondos?.reinversion?.disponible || 0),
                    fundEmergencyAssigned: Number(summary?.fondos?.emergencia?.asignado || 0),
                    fundEmergencyUsed: Number(summary?.fondos?.emergencia?.usado || 0),
                    fundEmergencyAvailable: Number(summary?.fondos?.emergencia?.disponible || 0),
                    totalPartnersAvailable,
                    totalPartnersAvailableAccumulated,
                    partnersAvailability
                });
            } catch (error) {
                console.error('Error cargando datos de reportes:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [selectedMonth, selectedYear]);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const handleExportPDF = async () => {
        setViewMode('pdf');
        setIsExporting(true);
        try {
            await generateFinancialReport(stats, months[parseInt(selectedMonth, 10)], selectedYear);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleViewInScreen = () => {
        setViewMode('screen');
        const node = document.getElementById('reportes-detalle');
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(val || 0));

    const totalAutomaticDeductions = stats.emergencyFundDeduction + stats.reinvestmentDeduction;
    const companyAvailableTotal = stats.fundReinvestAvailable + stats.fundEmergencyAvailable;
    const consolidatedAvailable = companyAvailableTotal + stats.totalPartnersAvailableAccumulated;

    const statementRows = [
        { label: 'Ingresos Totales', amount: stats.income },
        { label: 'Costos Fijos', amount: stats.fixedCosts },
        { label: 'Costos Fijos Vigentes (Compromiso)', amount: stats.fixedCostsCommitted },
        { label: 'Costos Variables', amount: stats.variableCosts },
        { label: 'Gastos Operativos (Fijos + Variables)', amount: stats.expenses },
        { label: 'Resultado Operativo', amount: stats.operatingResult },
        { label: 'Deducción Fondo de Emergencia', amount: stats.emergencyFundDeduction },
        { label: 'Deducción Reinversión', amount: stats.reinvestmentDeduction },
        { label: 'Total Deducciones Automáticas', amount: totalAutomaticDeductions },
        { label: 'Utilidad Neta a Distribuir', amount: stats.netProfit },
        { label: 'Retiros de Socios (Período)', amount: stats.withdrawals },
        { label: 'Disponible para Socios (Período)', amount: stats.totalPartnersAvailable },
        { label: 'Pozo Socios Acumulado', amount: stats.totalPartnersAvailableAccumulated },
        { label: 'TOTAL DISPONIBLE EMPRESA', amount: companyAvailableTotal, tone: 'company' },
        { label: 'TOTAL DISPONIBLE CONSOLIDADO', amount: consolidatedAvailable, tone: 'consolidated' }
    ];

    const fundsRows = [
        {
            fund: 'Reinversión',
            assigned: stats.fundReinvestAssigned,
            used: stats.fundReinvestUsed,
            available: stats.fundReinvestAvailable
        },
        {
            fund: 'Emergencia',
            assigned: stats.fundEmergencyAssigned,
            used: stats.fundEmergencyUsed,
            available: stats.fundEmergencyAvailable
        },
        {
            fund: 'TOTAL',
            assigned: stats.fundReinvestAssigned + stats.fundEmergencyAssigned,
            used: stats.fundReinvestUsed + stats.fundEmergencyUsed,
            available: companyAvailableTotal,
            tone: 'total'
        }
    ];

    const StatCard = ({ title, value, icon, subtitle, iconTone = 'bg-foreground/5 text-muted-foreground' }) => (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className={`p-2 rounded-lg ${iconTone}`}>
                    {icon ? createElement(icon, { size: 18 }) : null}
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(value)}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h2>
                    <p className="text-sm text-muted-foreground mt-1">Análisis detallado de flujos y distribución</p>
                </div>

                <div className="flex gap-4">
                    <div className="w-40">
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-card/50 backdrop-blur-sm border-border/50"
                        >
                            {months.map((monthLabel, index) => (
                                <option key={monthLabel} value={index}>{monthLabel}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="w-32">
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-card/50 backdrop-blur-sm border-border/50"
                        >
                            {yearOptions.map((yearValue) => (
                                <option key={yearValue} value={yearValue}>{yearValue}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleViewInScreen}
                            className={`flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm border ${
                                viewMode === 'screen'
                                    ? 'bg-[hsl(var(--corporate-blue))] text-white border-[hsl(var(--corporate-blue))]'
                                    : 'bg-card text-foreground border-border hover:bg-secondary/50'
                            }`}
                        >
                            <BarChart3 size={18} />
                            <span className="hidden sm:inline">Ver en Plataforma</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className={`flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border ${
                                viewMode === 'pdf'
                                    ? 'bg-[hsl(var(--purple-premium))] text-white border-[hsl(var(--purple-premium))]'
                                    : 'bg-card text-foreground border-border hover:bg-secondary/50'
                            }`}
                        >
                            {isExporting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <FileDown size={18} />
                            )}
                            <span className="hidden sm:inline">{isExporting ? 'Generando...' : 'Descargar PDF'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando reporte...</div>
            ) : (
                <>
                    <div className="text-xs text-muted-foreground -mt-3">
                        Modo comparativo: la vista en plataforma y el PDF usan exactamente el mismo período y cálculos.
                    </div>

                    <div id="reportes-detalle" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Ingresos Totales"
                            value={stats.income}
                            icon={TrendingUp}
                            subtitle="Facturación del período"
                            iconTone="bg-[hsl(var(--emerald-premium))]/12 text-[hsl(var(--emerald-premium))]"
                        />
                        <StatCard
                            title="Gastos Operativos"
                            value={stats.expenses}
                            icon={TrendingDown}
                            subtitle={`Fijos ${formatCurrency(stats.fixedCosts)} + Variables ${formatCurrency(stats.variableCosts)} · Compromiso fijo ${formatCurrency(stats.fixedCostsCommitted)}`}
                            iconTone="bg-[hsl(var(--copper))]/12 text-[hsl(var(--copper))]"
                        />
                        <StatCard
                            title="Utilidad Operativa"
                            value={stats.operatingResult}
                            icon={BarChart3}
                            subtitle="Antes de deducciones"
                            iconTone="bg-[hsl(var(--corporate-blue))]/12 text-[hsl(var(--corporate-blue))]"
                        />
                        <StatCard
                            title="Utilidad Neta a Distribuir"
                            value={stats.netProfit}
                            icon={Wallet}
                            subtitle="Luego de deducciones automáticas"
                            iconTone="bg-[hsl(var(--gold))]/14 text-[hsl(var(--gold))]"
                        />
                        <StatCard
                            title="Total Disponible Empresa"
                            value={companyAvailableTotal}
                            icon={PiggyBank}
                            subtitle="Fondos internos disponibles"
                            iconTone="bg-[hsl(var(--purple-premium))]/12 text-[hsl(var(--purple-premium))]"
                        />
                        <StatCard
                            title="Total Disponible Consolidado"
                            value={consolidatedAvailable}
                            icon={Users}
                            subtitle={`Empresa + pozo socios (${formatCurrency(stats.totalPartnersAvailableAccumulated)})`}
                            iconTone="bg-[hsl(var(--turquoise-premium))]/12 text-[hsl(var(--turquoise-premium))]"
                        />
                    </div>

                    <div className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-1">Estado de Resultados del Período</h3>
                        <p className="text-xs text-muted-foreground mb-5">
                            Período {months[parseInt(selectedMonth, 10)]} {selectedYear}
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[hsl(var(--corporate-blue))] text-white">
                                        <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Concepto</th>
                                        <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statementRows.map((row) => (
                                        <tr
                                            key={row.label}
                                            className={
                                                row.tone === 'consolidated'
                                                    ? 'bg-[hsl(var(--corporate-blue))] text-white'
                                                    : row.tone === 'company'
                                                        ? 'bg-[hsl(var(--corporate-blue))]/10 text-[hsl(var(--corporate-blue))]'
                                                        : 'border-b border-border/50'
                                            }
                                        >
                                            <td className="px-4 py-3 font-medium">{row.label}</td>
                                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                        <div className="xl:col-span-3 bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-1">Detalle de Fondos de Empresa</h3>
                            <p className="text-xs text-muted-foreground mb-5">
                                Asignado, usado y disponible de fondos estratégicos
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[hsl(var(--purple-premium))] text-white">
                                            <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Fondo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Asignado</th>
                                            <th className="px-4 py-3 text-right font-semibold">Usado</th>
                                            <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">Disponible</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fundsRows.map((row) => (
                                            <tr
                                                key={row.fund}
                                                className={
                                                    row.tone === 'total'
                                                        ? 'bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))]'
                                                        : 'border-b border-border/50'
                                                }
                                            >
                                                <td className="px-4 py-3 font-medium">{row.fund}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(row.assigned)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(row.used)}</td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.available)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="xl:col-span-2 bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Resumen Ejecutivo</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground">Ingresos</span>
                                    <span className="text-sm font-bold text-[hsl(var(--emerald-premium))] flex items-center gap-1.5">
                                        <ArrowUpRight size={16} /> {formatCurrency(stats.income)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground">Gastos Operativos</span>
                                    <span className="text-sm font-bold text-[hsl(var(--copper))] flex items-center gap-1.5">
                                        <ArrowDownRight size={16} /> {formatCurrency(stats.expenses)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground">Total Deducciones</span>
                                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <ArrowDownRight size={16} /> {formatCurrency(totalAutomaticDeductions)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground">Retiros de Socios</span>
                                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <ArrowDownRight size={16} /> {formatCurrency(stats.withdrawals)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-secondary/30 -mx-4 px-4 rounded-xl mt-4">
                                    <div>
                                        <span className="font-semibold text-foreground block">Pozo Socios Acumulado</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Acumulado histórico neto - retiros</span>
                                    </div>
                                    <span className="font-bold text-xl text-foreground tracking-tight">
                                        {formatCurrency(stats.totalPartnersAvailableAccumulated)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-foreground mb-1">Disponibilidad por Socio</h3>
                        <p className="text-xs text-muted-foreground mb-5">
                            Distribución, retiros y saldo disponible por socio en el período
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[hsl(var(--corporate-blue))] text-white">
                                        <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Socio</th>
                                        <th className="px-4 py-3 text-center font-semibold">%</th>
                                        <th className="px-4 py-3 text-right font-semibold">Asignado</th>
                                        <th className="px-4 py-3 text-right font-semibold">Retirado</th>
                                        <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">Disponible</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.partnersAvailability.length > 0 ? (
                                        stats.partnersAvailability.map((partner) => (
                                            <tr key={partner.id} className="border-b border-border/50">
                                                <td className="px-4 py-3 font-medium">{partner.name}</td>
                                                <td className="px-4 py-3 text-center">{Number(partner.percentage || 0).toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(partner.assigned)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(partner.withdrawn)}</td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(partner.available)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="border-b border-border/50">
                                            <td className="px-4 py-3 text-muted-foreground" colSpan={4}>Sin socios configurados</td>
                                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(stats.totalPartnersAvailable)}</td>
                                        </tr>
                                    )}
                                    <tr className="bg-[hsl(var(--corporate-blue))] text-white">
                                        <td className="px-4 py-3 font-semibold">TOTAL DISPONIBLE SOCIOS</td>
                                        <td className="px-4 py-3 text-center">-</td>
                                        <td className="px-4 py-3 text-right">-</td>
                                        <td className="px-4 py-3 text-right">-</td>
                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(stats.totalPartnersAvailable)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-[hsl(var(--corporate-blue))]/5 border border-[hsl(var(--corporate-blue))]/20 rounded-xl p-4">
                        <p className="text-sm font-semibold text-foreground">
                            Conclusión ejecutiva: Total disponible para la empresa {formatCurrency(companyAvailableTotal)}.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Disponible socios período {formatCurrency(stats.totalPartnersAvailable)} · Pozo socios acumulado {formatCurrency(stats.totalPartnersAvailableAccumulated)} · Disponible consolidado {formatCurrency(consolidatedAvailable)}.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
