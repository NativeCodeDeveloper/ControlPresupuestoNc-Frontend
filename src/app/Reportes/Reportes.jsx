import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Wallet,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    FileDown,
    Loader2
} from 'lucide-react';
import { Select } from '../../components/ui/FormElements';
import { generateFinancialReport } from '../../lib/pdfGenerator';

export default function Reportes() {
    const { getReportStats } = useFinance();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [isExporting, setIsExporting] = useState(false);

    // Compute stats based on filters
    const stats = getReportStats(selectedMonth, selectedYear);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await generateFinancialReport(stats, months[parseInt(selectedMonth)], selectedYear);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val || 0);
    };


    const StatCard = ({ title, value, icon: Icon, subtitle }) => (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 rounded-lg bg-foreground/5 text-muted-foreground">
                    <Icon size={18} />
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
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </Select>
                    </div>
                    <div className="w-32">
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-card/50 backdrop-blur-sm border-border/50"
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </Select>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-[hsl(var(--purple-premium))] text-white font-medium px-4 py-2.5 rounded-lg hover:bg-[hsl(var(--purple-dark))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={stats?.income || 0}
                    icon={TrendingUp}
                    subtitle="Facturación bruta"
                />
                <StatCard
                    title="Gastos Operativos"
                    value={stats?.expenses || 0}
                    icon={TrendingDown}
                    subtitle="Fijos + Variables"
                />
                <StatCard
                    title="Utilidad Operativa"
                    value={stats?.operatingResult || 0}
                    icon={BarChart3}
                    subtitle="Antes de deducciones"
                />
                <StatCard
                    title="Disponible Socios"
                    value={stats?.netProfit || 0}
                    icon={Wallet}
                    subtitle="Utilidad Neta a Distribuir"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Distribution Breakdown */}
                <div className="lg:col-span-2 bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Distribución de Flujos</h3>

                    <div className="space-y-6">
                        {/* Deductions Section */}
                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest pl-1">Deducciones Automáticas</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[hsl(var(--emerald-premium))]/10 p-4 rounded-xl flex justify-between items-center border border-[hsl(var(--emerald-premium))]/20">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[hsl(var(--emerald-premium))]/20 p-2.5 rounded-xl text-[hsl(var(--emerald-premium))] ring-1 ring-[hsl(var(--emerald-premium))]/20">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground text-sm">Fondo Emergencia</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ahorro empresas</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-[hsl(var(--emerald-premium))] tracking-tight">{formatCurrency(stats?.emergencyFundDeduction || 0)}</span>
                                </div>

                                <div className="bg-[hsl(var(--purple-premium))]/10 p-4 rounded-xl flex justify-between items-center border border-[hsl(var(--purple-premium))]/20">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[hsl(var(--purple-premium))]/20 p-2.5 rounded-xl text-[hsl(var(--purple-premium))] ring-1 ring-[hsl(var(--purple-premium))]/20">
                                            <TrendingUp size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground text-sm">Reinversión</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Crecimiento</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-[hsl(var(--purple-premium))] tracking-tight">{formatCurrency(stats?.reinvestmentDeduction || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Partner Withdrawals */}
                        <div>
                            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest pl-1 mt-2">Retiros de Socios (Realizados)</h4>
                            <div className="bg-[hsl(var(--gold))]/10 p-4 rounded-xl flex justify-between items-center border border-[hsl(var(--gold))]/20">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[hsl(var(--gold))]/20 p-2.5 rounded-xl text-[hsl(var(--gold))] ring-1 ring-[hsl(var(--gold))]/20">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">Total Retirado en Periodo</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Suma de todos los socios</p>
                                    </div>
                                </div>
                                <span className="font-bold text-[hsl(var(--gold))] tracking-tight">{formatCurrency(stats?.withdrawals || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary / Analysis */}
                <div className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Resumen Financiero</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Ingresos</span>
                            <span className="text-sm font-bold text-[hsl(var(--emerald-premium))] flex items-center gap-1.5">
                                <ArrowUpRight size={16} /> {formatCurrency(stats?.income || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Gastos Operativos</span>
                            <span className="text-sm font-bold text-[hsl(var(--copper))] flex items-center gap-1.5">
                                <ArrowDownRight size={16} /> {formatCurrency(stats?.expenses || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Reservas (Fondo + Reinv.)</span>
                            <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                <ArrowDownRight size={16} /> {formatCurrency((stats?.emergencyFundDeduction || 0) + (stats?.reinvestmentDeduction || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-4 bg-secondary/30 -mx-4 px-4 rounded-xl mt-4">
                            <div>
                                <span className="font-semibold text-foreground block">Neto Disponible</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Para Socios</span>
                            </div>
                            <span className="font-bold text-xl text-foreground tracking-tight">
                                {formatCurrency(stats?.netProfit || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
