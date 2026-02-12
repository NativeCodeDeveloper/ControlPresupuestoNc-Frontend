import { createElement, useState, useEffect } from 'react';
import * as partnersService from '../../services/partnersService';
import * as financeService from '../../services/financeService';
import {
    Users,
    DollarSign,
    ArrowUpRight,
    Wallet,
    PieChart,
    ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';

export default function Socios() {
    const [isLoading, setIsLoading] = useState(false);
    const [partnersData, setPartnersData] = useState([]);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        emergencyFundDeduction: 0,
        reinvestmentDeduction: 0,
        netProfit: 0,
        withdrawals: 0,
        totalPartnerAssigned: 0,
        totalPartnerWithdrawn: 0,
        totalPartnerAvailable: 0
    });

    const [withdrawalForm, setWithdrawalForm] = useState({
        partnerId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const loadAllData = async () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const [partners, summary] = await Promise.all([
            partnersService.getPartners(),
            financeService.getFinancialSummary(month, year)
        ]);

        const financialStats = {
            totalIncome: Number(summary?.income || 0),
            totalExpenses: Number(summary?.expenses || 0),
            emergencyFundDeduction: Number(summary?.emergencyFundDeduction || 0),
            reinvestmentDeduction: Number(summary?.reinvestmentDeduction || 0),
            netProfit: Number(summary?.netProfit || 0),
            withdrawals: Number(summary?.withdrawals || 0),
            totalPartnerAssigned: 0,
            totalPartnerWithdrawn: 0,
            totalPartnerAvailable: 0
        };

        if (partners && Array.isArray(partners)) {
            const enrichedPartners = await Promise.all(
                partners.map(async (p) => {
                    const [retiros, disponible] = await Promise.all([
                        partnersService.getWithdrawals(p.id),
                        partnersService.getAvailableAmount(p.id, month, year)
                    ]);

                    const porcentaje = Number(p.porcentaje_participacion || p.percentage || 0);
                    const fallbackAsignado = Math.max(0, (financialStats.netProfit * porcentaje) / 100);

                    return {
                        ...p,
                        name: p.nombre || p.name || 'Sin Nombre',
                        percentage: porcentaje,
                        assigned: Number(disponible?.asignado ?? fallbackAsignado),
                        withdrawnPeriod: Number(disponible?.retirado ?? 0),
                        available: Number(disponible?.disponible ?? Math.max(0, fallbackAsignado)),
                        withdrawals: (retiros || []).map((r) => ({
                            id: r.id,
                            amount: Number(r.monto || 0),
                            date: r.fecha_retiro,
                            description: r.descripcion
                        }))
                    };
                })
            );

            setPartnersData(enrichedPartners);
            const partnerTotals = enrichedPartners.reduce((acc, partner) => ({
                assigned: acc.assigned + Number(partner.assigned || 0),
                withdrawn: acc.withdrawn + Number(partner.withdrawnPeriod || 0),
                available: acc.available + Number(partner.available || 0)
            }), { assigned: 0, withdrawn: 0, available: 0 });

            setStats({
                ...financialStats,
                totalPartnerAssigned: partnerTotals.assigned,
                totalPartnerWithdrawn: partnerTotals.withdrawn,
                totalPartnerAvailable: partnerTotals.available
            });
        } else {
            setPartnersData([]);
            setStats({
                ...financialStats,
                totalPartnerAssigned: Math.max(0, financialStats.netProfit),
                totalPartnerWithdrawn: Math.max(0, financialStats.withdrawals),
                totalPartnerAvailable: Math.max(0, financialStats.netProfit - financialStats.withdrawals)
            });
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await loadAllData();
            } catch (error) {
                console.error('Error cargando datos de socios:', error);
            }
        };
        loadData();
    }, []);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    const handlePercentageInput = (id, val) => {
        setPartnersData((prev) => prev.map((p) =>
            p.id === id ? { ...p, percentage: parseFloat(val) || 0 } : p
        ));
    };

    const handlePercentageSave = async (id, val) => {
        setIsLoading(true);
        try {
            const result = await partnersService.updatePartnerPercentage(id, parseFloat(val));
            if (result && result.ok) {
                await loadAllData();
            }
        } catch (error) {
            console.error('Error actualizando porcentaje:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawalSubmit = async (e) => {
        e.preventDefault();
        if (!withdrawalForm.partnerId || !withdrawalForm.amount) return;

        setIsLoading(true);
        try {
            const result = await partnersService.addWithdrawal(
                parseInt(withdrawalForm.partnerId, 10),
                {
                    monto: parseFloat(withdrawalForm.amount),
                    fecha_retiro: withdrawalForm.date,
                    descripcion: 'Retiro de utilidades'
                }
            );

            if (result && result.ok) {
                await loadAllData();
                alert('Retiro registrado exitosamente');
                setWithdrawalForm({
                    partnerId: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0]
                });
            } else {
                const msg = result?.message || 'Error al registrar retiro';
                const disponible = result?.error?.disponible;
                alert(disponible !== undefined
                    ? `${msg}. Disponible actual: ${formatCurrency(disponible)}`
                    : msg);
            }
        } catch (error) {
            console.error('Error registrando retiro:', error);
            alert('Error al registrar retiro');
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, trendColor, subtitle }) => (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 bg-secondary rounded-lg text-foreground">
                    {icon ? createElement(icon, { size: 16 }) : null}
                </div>
            </div>
            <div className="space-y-1">
                <h3 className={cn('text-2xl font-bold tracking-tight text-foreground', trendColor)}>{value}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Distribución</h2>
                <p className="text-sm text-muted-foreground mt-1">Utilidades y retiros de socios</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ingresos Totales" value={formatCurrency(stats.totalIncome)} icon={DollarSign} />
                <StatCard title="Gastos Operativos" value={formatCurrency(stats.totalExpenses)} icon={Wallet} />
                <StatCard
                    title="Retenciones Empresa"
                    value={formatCurrency(stats.emergencyFundDeduction + stats.reinvestmentDeduction)}
                    icon={ShieldCheck}
                    subtitle="Fondo Emergencia + Reinversión"
                />
                <StatCard
                    title="Total Disponible Socios"
                    value={formatCurrency(stats.totalPartnerAvailable)}
                    icon={PieChart}
                    trendColor="text-[hsl(var(--gold))]"
                    subtitle={`Asignado ${formatCurrency(stats.totalPartnerAssigned)} · Retirado ${formatCurrency(stats.totalPartnerWithdrawn)}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {(partnersData || []).map((partner) => {
                        const shareAmount = Number(partner.assigned || 0);
                        const totalWithdrawn = Number(partner.withdrawnPeriod || 0);
                        const available = Number(partner.available || 0);

                        return (
                            <div key={partner.id} className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-foreground/10 rounded-full flex items-center justify-center text-foreground font-bold text-lg ring-4 ring-background group-hover:scale-105 transition-transform">
                                            {partner.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-foreground tracking-tight">{partner.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Participación</span>
                                                <div className="flex items-center gap-1 bg-secondary/50 rounded-md px-2 py-0.5 border border-transparent focus-within:border-primary/20 transition-all">
                                                    <input
                                                        type="number"
                                                        value={partner.percentage}
                                                        onChange={(e) => handlePercentageInput(partner.id, e.target.value)}
                                                        onBlur={(e) => handlePercentageSave(partner.id, e.target.value)}
                                                        className="w-10 bg-transparent text-foreground text-sm font-bold text-center focus:outline-none"
                                                        min="0"
                                                        max="100"
                                                    />
                                                    <span className="text-xs text-muted-foreground font-medium">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Asignado Mes</p>
                                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(shareAmount)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-foreground/5 rounded-xl p-4 border border-foreground/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-foreground/40"></div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Retirado Mes</p>
                                        </div>
                                        <p className="text-lg font-bold text-foreground/70">{formatCurrency(totalWithdrawn)}</p>
                                    </div>
                                    <div className="bg-[hsl(var(--emerald-premium))]/10 rounded-xl p-4 border border-[hsl(var(--emerald-premium))]/20 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-[hsl(var(--emerald-premium))]"></div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Disponible</p>
                                        </div>
                                        <p className="text-lg font-bold text-[hsl(var(--emerald-premium))]">{formatCurrency(available)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setWithdrawalForm({ ...withdrawalForm, partnerId: partner.id })}
                                    className="w-full py-3 bg-[hsl(var(--purple-premium))] hover:bg-[hsl(var(--purple-dark))] text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <ArrowUpRight size={16} />
                                    Registrar Retiro
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-card glass-card border border-border/50 rounded-2xl p-6 shadow-sm sticky top-24 h-fit">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-3">
                        <div className="p-2 bg-[hsl(var(--gold))]/20 rounded-lg text-[hsl(var(--gold))]">
                            <Users size={20} />
                        </div>
                        Nuevo Retiro
                    </h3>
                    <form onSubmit={handleWithdrawalSubmit} className="space-y-5">
                        <Select
                            label="Socio"
                            value={withdrawalForm.partnerId}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, partnerId: e.target.value })}
                            required
                            className="bg-secondary/30 focus:ring-primary/20"
                        >
                            <option value="">Seleccionar Socio...</option>
                            {(partnersData || []).map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                        <Input
                            label="Monto"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                            value={withdrawalForm.amount}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                            required
                        />
                        <Input
                            label="Fecha"
                            type="date"
                            value={withdrawalForm.date}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, date: e.target.value })}
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[hsl(var(--purple-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--purple-dark))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Procesando...' : 'Confirmar Retiro'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
