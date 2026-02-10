import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import * as partnersService from '../../services/partnersService';
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
    const { data: financeData, updatePartnerPercentage, addWithdrawal, getFinancialStats } = useFinance();
    const stats = getFinancialStats();
    const [isLoading, setIsLoading] = useState(false);
    const [partnersData, setPartnersData] = useState([]);

    // Withdrawal Form State
    const [withdrawalForm, setWithdrawalForm] = useState({
        partnerId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Cargar socios desde backend cuando monta el componente
    const [partnersLoaded, setPartnersLoaded] = useState(false);
    if (!partnersLoaded) {
        partnersService.getPartners().then(data => {
            if (data && Array.isArray(data)) {
                setPartnersData(data);
            }
            setPartnersLoaded(true);
        });
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(val || 0);
    };

    const handlePercentageChange = async (id, val) => {
        setIsLoading(true);
        try {
            const result = await partnersService.updatePartnerPercentage(id, parseFloat(val));
            if (result && result.ok) {
                updatePartnerPercentage(id, val);
                const fresh = await partnersService.getPartners();
                if (fresh) setPartnersData(fresh);
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
                parseInt(withdrawalForm.partnerId),
                {
                    monto: parseFloat(withdrawalForm.amount),
                    fecha_retiro: withdrawalForm.date,
                    descripcion: 'Retiro de utilidades'
                }
            );

            if (result && result.ok) {
                addWithdrawal(
                    parseInt(withdrawalForm.partnerId),
                    parseFloat(withdrawalForm.amount),
                    withdrawalForm.date
                );

                const fresh = await partnersService.getPartners();
                if (fresh) setPartnersData(fresh);

                alert('Retiro registrado exitosamente');
            }

            setWithdrawalForm({
                partnerId: '',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error registrando retiro:', error);
            alert('Error al registrar retiro');
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, trendColor, subtitle }) => (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 bg-secondary rounded-lg text-foreground">
                    <Icon size={16} />
                </div>
            </div>
            <div className="space-y-1">
                <h3 className={cn("text-2xl font-bold tracking-tight text-foreground", trendColor)}>{value}</h3>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ingresos Totales"
                    value={formatCurrency(stats?.totalIncome || 0)}
                    icon={DollarSign}
                />
                <StatCard
                    title="Gastos Operativos"
                    value={formatCurrency(stats?.totalExpenses || 0)}
                    icon={Wallet}
                />
                <StatCard
                    title="Retenciones Empresa"
                    value={formatCurrency((stats?.emergencyFundDeduction || 0) + (stats?.reinvestmentDeduction || 0))}
                    icon={ShieldCheck}
                    subtitle="Fondo Emergencia + Reinversión"
                />
                <StatCard
                    title="Utilidad A Repartir"
                    value={formatCurrency(stats?.netProfit || 0)}
                    icon={PieChart}
                    trendColor="text-[hsl(var(--gold))]"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Partners Distribution */}
                <div className="space-y-6">
                    {(partnersData || []).map((partner) => {
                        const shareAmount = (stats.netProfit * (partner.percentage || 0)) / 100;
                        const totalWithdrawn = (partner.withdrawals || []).reduce((acc, curr) => acc + curr.amount, 0);
                        const available = shareAmount - totalWithdrawn;

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
                                                        onChange={(e) => handlePercentageChange(partner.id, e.target.value)}
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
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Asignado</p>
                                        <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(shareAmount)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-foreground/5 rounded-xl p-4 border border-foreground/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 w-2 rounded-full bg-foreground/40"></div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Retirado</p>
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

                {/* Withdrawal Form */}
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
                            {(partnersData || []).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                        <Input
                            label="Monto"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
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
