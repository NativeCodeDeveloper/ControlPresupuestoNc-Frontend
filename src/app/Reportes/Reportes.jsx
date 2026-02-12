import { createElement, useState, useEffect } from 'react';
import * as financeService from '../../services/financeService';
import * as partnersService from '../../services/partnersService';
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

    const [stats, setStats] = useState({
        income: 0,
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
        partnersAvailability: []
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const month = parseInt(selectedMonth, 10);
                const year = parseInt(selectedYear, 10);
                const [summary, partners] = await Promise.all([
                    financeService.getFinancialSummary(month, year),
                    partnersService.getPartners()
                ]);

                let partnersAvailability = [];
                let totalPartnersAvailable = 0;

                if (Array.isArray(partners) && partners.length > 0) {
                    const availability = await Promise.all(
                        partners.map(async (partner) => {
                            const availableData = await partnersService.getAvailableAmount(partner.id, month, year);
                            return {
                                id: partner.id,
                                name: partner.nombre || partner.name || `Socio ${partner.id}`,
                                percentage: Number(
                                    availableData?.socio?.porcentaje_participacion
                                    ?? partner.porcentaje_participacion
                                    ?? partner.percentage
                                    ?? 0
                                ),
                                assigned: Number(availableData?.asignado || 0),
                                withdrawn: Number(availableData?.retirado || 0),
                                available: Number(availableData?.disponible || 0)
                            };
                        })
                    );

                    partnersAvailability = availability;
                    totalPartnersAvailable = availability.reduce((sum, p) => sum + Number(p.available || 0), 0);
                } else {
                    totalPartnersAvailable = Math.max(
                        0,
                        Number(summary?.netProfit || 0) - Number(summary?.withdrawals || 0)
                    );
                }

                setStats({
                    income: Number(summary?.income || 0),
                    expenses: Number(summary?.expenses || 0),
                    operatingResult: Number(summary?.operatingResult || 0),
                    emergencyFundDeduction: Number(summary?.emergencyFundDeduction || 0),
                    reinvestmentDeduction: Number(summary?.reinvestmentDeduction || 0),
                    emergencyFundPercentage: Number(summary?.config?.porcentaje_fondo_emergencia || 0),
                    reinvestmentPercentage: Number(summary?.config?.porcentaje_reinversion || 0),
                    netProfit: Number(summary?.netProfit || 0),
                    withdrawals: Number(summary?.withdrawals || 0),
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

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val || 0);
    };

    const StatCard = ({ title, value, icon, subtitle }) => (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 rounded-lg bg-foreground/5 text-muted-foreground">
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

            {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando reporte...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Ingresos Totales"
                            value={stats.income}
                            icon={TrendingUp}
                            subtitle="Facturación bruta"
                        />
                        <StatCard
                            title="Gastos Operativos"
                            value={stats.expenses}
                            icon={TrendingDown}
                            subtitle="Fijos + Variables"
                        />
                        <StatCard
                            title="Utilidad Operativa"
                            value={stats.operatingResult}
                            icon={BarChart3}
                            subtitle="Antes de deducciones"
                        />
                        <StatCard
                            title="Disponible Socios"
                            value={stats.netProfit}
                            icon={Wallet}
                            subtitle="Utilidad Neta a Distribuir"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Distribución de Flujos</h3>

                            <div className="space-y-6">
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
                                            <span className="font-bold text-[hsl(var(--emerald-premium))] tracking-tight">{formatCurrency(stats.emergencyFundDeduction)}</span>
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
                                            <span className="font-bold text-[hsl(var(--purple-premium))] tracking-tight">{formatCurrency(stats.reinvestmentDeduction)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest pl-1 mt-2">Uso de Fondos (Inversiones/Retiros)</h4>
                                    <div className="bg-[hsl(var(--corporate-blue))]/10 p-4 rounded-xl border border-[hsl(var(--corporate-blue))]/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <PiggyBank size={16} className="text-[hsl(var(--corporate-blue))]" />
                                                <p className="font-semibold text-foreground text-sm">Total Movimientos Fondo</p>
                                            </div>
                                            <span className="font-bold text-[hsl(var(--corporate-blue))]">{formatCurrency(stats.investmentsTotal)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Reinversión: {formatCurrency(stats.investmentsReinvest)} · Emergencia: {formatCurrency(stats.investmentsEmergency)}
                                        </p>
                                    </div>
                                </div>

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
                                        <span className="font-bold text-[hsl(var(--gold))] tracking-tight">{formatCurrency(stats.withdrawals)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-foreground mb-6">Resumen Financiero</h3>
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
                                    <span className="text-sm font-medium text-muted-foreground">Reservas (Fondo + Reinv.)</span>
                                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <ArrowDownRight size={16} /> {formatCurrency(stats.emergencyFundDeduction + stats.reinvestmentDeduction)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border/50">
                                    <span className="text-sm font-medium text-muted-foreground">Mov. de Fondos</span>
                                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                                        <ArrowDownRight size={16} /> {formatCurrency(stats.investmentsTotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-secondary/30 -mx-4 px-4 rounded-xl mt-4">
                                    <div>
                                        <span className="font-semibold text-foreground block">Neto Disponible</span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Para Socios</span>
                                    </div>
                                    <span className="font-bold text-xl text-foreground tracking-tight">
                                        {formatCurrency(stats.netProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
