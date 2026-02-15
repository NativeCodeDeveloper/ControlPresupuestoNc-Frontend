import { useState, useEffect } from 'react';
import * as financeService from '../../services/financeService';
import * as investmentsService from '../../services/investmentsService';
import { Input, Select } from '../../components/ui/FormElements';
import {
    PiggyBank,
    ArrowDownCircle,
    PlusCircle,
    Trash2,
    TrendingUp,
    ShieldAlert
} from 'lucide-react';

const CATEGORIES = ['Equipo', 'Software', 'Infraestructura', 'Capacitacion', 'Marketing', 'Otro'];

export default function Inversiones() {
    const [isLoading, setIsLoading] = useState(false);
    const [investments, setInvestments] = useState([]);
    const [summary, setSummary] = useState(null);

    const [form, setForm] = useState({
        concept: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Otro',
        fund: 'reinversion',
        movementType: 'inversion',
        notes: ''
    });

    const loadData = async () => {
        const now = new Date();
        const [summaryData, invData] = await Promise.all([
            financeService.getFinancialSummary(now.getMonth(), now.getFullYear()),
            investmentsService.getInvestments()
        ]);
        setSummary(summaryData);
        setInvestments(Array.isArray(invData) ? invData : []);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await loadData();
            } catch (error) {
                console.error('Error cargando inversiones:', error);
            }
        };
        init();
    }, []);

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(value || 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.concept || !form.amount) return;

        setIsLoading(true);
        try {
            const result = await investmentsService.addInvestment({
                concepto: form.concept,
                monto: parseFloat(form.amount),
                fecha_inversion: form.date,
                categoria: form.category,
                fondo_origen: form.fund,
                tipo_movimiento: form.movementType,
                observaciones: form.notes || null
            });

            if (result && result.ok) {
                await loadData();
                alert('Movimiento registrado');
                setForm({
                    concept: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    category: 'Otro',
                    fund: 'reinversion',
                    movementType: 'inversion',
                    notes: ''
                });
            } else {
                alert(result?.message || 'No se pudo registrar el movimiento');
            }
        } catch (error) {
            console.error('Error registrando inversión:', error);
            alert('Error registrando inversión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Desactivar este registro?')) return;
        setIsLoading(true);
        try {
            const ok = await investmentsService.deleteInvestment(id);
            if (ok) {
                await loadData();
            }
        } catch (error) {
            console.error('Error eliminando inversión:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fondos = summary?.fondos || {
        reinversion: { asignado: 0, usado: 0, disponible: 0 },
        emergencia: { asignado: 0, usado: 0, disponible: 0 }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Inversiones</h2>
                <p className="text-sm text-muted-foreground mt-1">Uso de fondos de reinversión y emergencia</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp size={16} /> Fondo Reinversión
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Disponible</p>
                    <p className="text-2xl font-bold text-[hsl(var(--emerald-premium))]">{formatCurrency(fondos.reinversion?.disponible)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Asignado: {formatCurrency(fondos.reinversion?.asignado)} · Usado: {formatCurrency(fondos.reinversion?.usado)}
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <ShieldAlert size={16} /> Fondo Emergencia
                        </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Disponible</p>
                    <p className="text-2xl font-bold text-[hsl(var(--gold))]">{formatCurrency(fondos.emergencia?.disponible)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Asignado: {formatCurrency(fondos.emergencia?.asignado)} · Usado: {formatCurrency(fondos.emergencia?.usado)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <PlusCircle size={18} /> Nuevo Movimiento
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Concepto"
                                value={form.concept}
                                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                                required
                            />
                            <Input
                                label="Monto"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Fondo" value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })}>
                                    <option value="reinversion">Reinversión</option>
                                    <option value="emergencia">Emergencia</option>
                                </Select>
                                <Select label="Tipo" value={form.movementType} onChange={(e) => setForm({ ...form, movementType: e.target.value })}>
                                    <option value="inversion">Inversión</option>
                                    <option value="retiro">Retiro Fondo</option>
                                </Select>
                            </div>
                            <Select label="Categoría" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <Input
                                label="Fecha"
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                required
                            />
                            <Input
                                label="Observaciones"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full inline-flex items-center justify-center gap-2 bg-[hsl(var(--corporate-blue))] text-white font-semibold py-2.5 rounded-lg border border-[hsl(var(--corporate-blue))] shadow-sm hover:opacity-95 active:scale-[0.98] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--corporate-blue))]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusCircle size={16} />
                                {isLoading ? 'Guardando...' : 'Registrar Movimiento'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Historial</h3>
                    {investments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                            Sin movimientos de inversión registrados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {investments.map((item) => (
                                <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border uppercase">
                                                {item.fondo_origen || 'reinversion'}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border uppercase">
                                                {item.tipo_movimiento || 'inversion'}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-foreground">{item.concepto}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.categoria || 'Otro'} · {item.fecha_inversion ? new Date(item.fecha_inversion).toLocaleDateString('es-CL') : '-'}
                                        </p>
                                        {item.observaciones && (
                                            <p className="text-xs text-muted-foreground mt-1">{item.observaciones}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[hsl(var(--copper))]">-{formatCurrency(item.monto)}</p>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="mt-2 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2 text-foreground">
                    <PiggyBank size={16} />
                    <h4 className="font-semibold">Regla aplicada</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                    Los movimientos de inversiones/retiros descuentan solo el fondo seleccionado (reinversión o emergencia)
                    y no vuelven a descontar el neto de socios.
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <ArrowDownCircle size={12} />
                    Validación activa: no permite usar más de lo disponible en cada fondo.
                </p>
            </div>
        </div>
    );
}
