import { useState, useEffect } from 'react';
import * as costsService from '../../services/costsService';
import * as projectsService from '../../services/projectsService';
import * as financeService from '../../services/financeService';
import {
    Server,
    Users,
    MoreHorizontal,
    Briefcase,
    Trash2,
    Calendar,
    Repeat,
    AlertTriangle,
    BellRing
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';

export default function Gastos() {
    const [activeTab, setActiveTab] = useState('fixed');
    const [isLoading, setIsLoading] = useState(false);
    const [fixedCostsData, setFixedCostsData] = useState([]);
    const [variableCostsData, setVariableCostsData] = useState([]);
    const [servicesFromBD, setServicesFromBD] = useState([]);
    const [variableTypesFromBD, setVariableTypesFromBD] = useState([]);
    const [projectsFromBD, setProjectsFromBD] = useState([]);
    const [dueAlerts, setDueAlerts] = useState([]);

    const [fixedForm, setFixedForm] = useState({
        category: 'Infraestructura',
        service: '',
        provider: '',
        amount: '',
        frequency: 'Mensual',
        paymentDay: String(new Date().getDate()),
        startDate: new Date().toISOString().split('T')[0]
    });

    const [variableForm, setVariableForm] = useState({
        projectId: '',
        type: 'Freelancer',
        amount: '',
        observations: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: ''
    });

    const defaultCategories = ['Infraestructura', 'Software / IA', 'Marketing / Ads', 'Servicios', 'Suscripciones', 'Otros'];
    const defaultVariableTypes = ['Freelancer', 'Plugin', 'Comisión', 'Marketing / Ads', 'Servicio Puntual'];
    const frequencies = ['Mensual', 'Anual', 'Trimestral'];

    const serviceOptions = servicesFromBD.length > 0
        ? servicesFromBD.map(s => typeof s === 'string' ? s : s.nombre)
        : defaultCategories;
    const variableTypes = variableTypesFromBD.length > 0
        ? variableTypesFromBD.map(t => typeof t === 'string' ? t : t.nombre)
        : defaultVariableTypes;

    // Load data from backend on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [fixedData, variableData, services, types, projects, dueData] = await Promise.all([
                    costsService.getFixedCosts(),
                    costsService.getVariableCosts(),
                    costsService.getServices(),
                    costsService.getVariableCostTypes(),
                    projectsService.getProjects(),
                    financeService.getDueAlerts(10)
                ]);
                if (fixedData && Array.isArray(fixedData)) setFixedCostsData(fixedData);
                if (variableData && Array.isArray(variableData)) setVariableCostsData(variableData);
                if (services && Array.isArray(services) && services.length > 0) setServicesFromBD(services);
                if (types && Array.isArray(types) && types.length > 0) setVariableTypesFromBD(types);
                if (projects && Array.isArray(projects)) setProjectsFromBD(projects);
                if (dueData?.items && Array.isArray(dueData.items)) setDueAlerts(dueData.items);
            } catch (error) {
                console.error('Error cargando datos de gastos:', error);
            }
        };
        loadData();
    }, []);

    const handleFixedSubmit = async (e) => {
        e.preventDefault();
        if (!fixedForm.service || !fixedForm.amount) return;

        setIsLoading(true);
        try {
            const result = await costsService.addFixedCost({
                nombre: fixedForm.service,
                proveedor: fixedForm.provider,
                monto: parseFloat(fixedForm.amount),
                frecuencia: fixedForm.frequency,
                categoria: fixedForm.category,
                fecha_pago: parseInt(fixedForm.paymentDay || '1', 10),
                fecha_inicio: fixedForm.startDate,
                activo: true
            });

            if (result && result.ok) {
                const [freshData, dueData] = await Promise.all([
                    costsService.getFixedCosts(),
                    financeService.getDueAlerts(10)
                ]);
                if (freshData) setFixedCostsData(freshData);
                if (dueData?.items) setDueAlerts(dueData.items);
                alert('Costo fijo registrado exitosamente');
            } else {
                alert('Error al registrar costo fijo');
            }

            setFixedForm(prev => ({
                ...prev,
                service: '',
                provider: '',
                amount: '',
                paymentDay: String(new Date().getDate()),
                startDate: new Date().toISOString().split('T')[0]
            }));
        } catch (error) {
            console.error('Error creando costo fijo:', error);
            alert('Error al registrar costo fijo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariableSubmit = async (e) => {
        e.preventDefault();
        if (!variableForm.amount) return;

        setIsLoading(true);
        try {
            const result = await costsService.addVariableCost({
                proyecto_id: variableForm.projectId || null,
                tipo: variableForm.type,
                monto: parseFloat(variableForm.amount),
                observaciones: variableForm.observations,
                fecha: variableForm.date,
                fecha_vencimiento: variableForm.dueDate || null
            });

            if (result && result.ok) {
                const [freshData, dueData] = await Promise.all([
                    costsService.getVariableCosts(),
                    financeService.getDueAlerts(10)
                ]);
                if (freshData) setVariableCostsData(freshData);
                if (dueData?.items) setDueAlerts(dueData.items);
                alert('Costo variable registrado exitosamente');
            } else {
                alert('Error al registrar costo variable');
            }

            setVariableForm({
                projectId: '',
                type: variableTypes[0] || 'Freelancer',
                amount: '',
                observations: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: ''
            });
        } catch (error) {
            console.error('Error creando costo variable:', error);
            alert('Error al registrar costo variable');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFixed = async (id) => {
        if (!window.confirm('¿Eliminar este gasto fijo?')) return;
        setIsLoading(true);
        try {
            await costsService.deleteFixedCost(id);
            const [freshData, dueData] = await Promise.all([
                costsService.getFixedCosts(),
                financeService.getDueAlerts(10)
            ]);
            if (freshData) setFixedCostsData(freshData);
            if (dueData?.items) setDueAlerts(dueData.items);
        } catch (error) {
            console.error('Error eliminando costo fijo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVariable = async (id) => {
        if (!window.confirm('¿Eliminar este gasto variable?')) return;
        setIsLoading(true);
        try {
            await costsService.deleteVariableCost(id);
            const [freshData, dueData] = await Promise.all([
                costsService.getVariableCosts(),
                financeService.getDueAlerts(10)
            ]);
            if (freshData) setVariableCostsData(freshData);
            if (dueData?.items) setDueAlerts(dueData.items);
        } catch (error) {
            console.error('Error eliminando costo variable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fixedCosts = fixedCostsData || [];
    const variableCosts = variableCostsData || [];
    const projects = projectsFromBD;

    const buildDateInMonth = (year, month, day) => {
        const safeDay = Math.max(1, Number(day || 1));
        const lastDay = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, Math.min(safeDay, lastDay));
    };

    const getFrequencyStep = (freq) => {
        const val = String(freq || 'Mensual').toLowerCase();
        if (val.includes('trimes')) return 3;
        if (val.includes('anual')) return 12;
        return 1;
    };

    const getNextFixedDueDate = (cost) => {
        const today = new Date();
        const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const start = cost.fecha_inicio ? new Date(cost.fecha_inicio) : ref;
        let due = buildDateInMonth(start.getFullYear(), start.getMonth(), cost.fecha_pago || start.getDate());
        const step = getFrequencyStep(cost.frecuencia);

        if (due < start) {
            due = buildDateInMonth(start.getFullYear(), start.getMonth() + step, cost.fecha_pago || start.getDate());
        }

        while (due < ref) {
            due = buildDateInMonth(due.getFullYear(), due.getMonth() + step, cost.fecha_pago || start.getDate());
        }

        if (cost.fecha_fin) {
            const end = new Date(cost.fecha_fin);
            if (due > end) return null;
        }

        return due;
    };

    const getDueStatus = (dueDate) => {
        if (!dueDate) return { label: 'Sin vencimiento', className: 'text-muted-foreground' };
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const due = new Date(dueDate);
        const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        const days = Math.floor((target - today) / (1000 * 60 * 60 * 24));

        if (days < 0) return { label: `Vencido (${Math.abs(days)}d)`, className: 'text-red-600' };
        if (days <= 3) return { label: `Vence en ${days}d`, className: 'text-amber-600' };
        return { label: `Vence en ${days}d`, className: 'text-[hsl(var(--emerald-premium))]' };
    };

    const getDueAlertTone = (daysRemaining) => {
        const days = Number(daysRemaining);
        if (!Number.isFinite(days)) {
            return {
                label: 'Por revisar',
                rowClass: 'border-border/60 bg-secondary/20',
                badgeClass: 'bg-secondary text-muted-foreground border-border/70'
            };
        }
        if (days < 0) {
            return {
                label: 'Vencido',
                rowClass: 'border-destructive/50 bg-destructive/10',
                badgeClass: 'bg-destructive/20 text-destructive border-destructive/40'
            };
        }
        if (days <= 3) {
            return {
                label: 'Urgente',
                rowClass: 'border-[hsl(var(--copper))]/50 bg-[hsl(var(--copper))]/10',
                badgeClass: 'bg-[hsl(var(--copper))]/20 text-[hsl(var(--copper-light))] border-[hsl(var(--copper))]/40'
            };
        }
        if (days <= 7) {
            return {
                label: 'Próximo',
                rowClass: 'border-[hsl(var(--gold))]/45 bg-[hsl(var(--gold))]/10',
                badgeClass: 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/40'
            };
        }
        return {
            label: 'Programado',
            rowClass: 'border-[hsl(var(--turquoise-premium))]/45 bg-[hsl(var(--turquoise-premium))]/10',
            badgeClass: 'bg-[hsl(var(--turquoise-premium))]/20 text-[hsl(var(--turquoise-light))] border-[hsl(var(--turquoise-premium))]/40'
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Gastos</h2>
                    <p className="text-sm text-muted-foreground mt-1">Control de costos fijos y variables</p>
                </div>
                <div className="flex bg-secondary p-1 rounded-lg">
                    <button onClick={() => setActiveTab('fixed')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'fixed' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                        Costos Fijos
                    </button>
                    <button onClick={() => setActiveTab('variable')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'variable' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                        Costos Variables
                    </button>
                </div>
            </div>

            {dueAlerts.length > 0 && (
                <div className="relative overflow-hidden bg-card border border-[hsl(var(--gold))]/35 rounded-2xl p-5 shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[hsl(var(--gold))] via-[hsl(var(--copper))] to-[hsl(var(--purple-premium))]" />
                    <div className="flex items-start gap-3 mb-4 pt-1">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(var(--gold))]/15 border border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] flex items-center justify-center">
                            <BellRing size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Alertas de vencimiento</h3>
                            <p className="text-xs text-muted-foreground">Pagos que requieren seguimiento para mantener continuidad operativa.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dueAlerts.slice(0, 6).map((item) => {
                            const tone = getDueAlertTone(item.dias_restantes);
                            return (
                                <div key={item.id} className={`rounded-xl border px-3 py-2.5 ${tone.rowClass}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <AlertTriangle size={14} className="mt-0.5 text-[hsl(var(--gold))] shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.tipo} · vence {item.fecha_vencimiento}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${tone.badgeClass}`}>
                                            {tone.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            {activeTab === 'fixed' ? <Server size={18} /> : <Briefcase size={18} />}
                            {activeTab === 'fixed' ? 'Nuevo Costo Fijo' : 'Nuevo Costo Variable'}
                        </h3>

                        {activeTab === 'fixed' ? (
                            <form onSubmit={handleFixedSubmit} className="space-y-4">
                                <Select label="Servicio / Categoría" value={fixedForm.service}
                                    onChange={(e) => setFixedForm({ ...fixedForm, service: e.target.value, category: e.target.value })} required>
                                    <option value="">Seleccionar...</option>
                                    {serviceOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Monto" type="number" placeholder="0.00" min="0" step="0.01"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={fixedForm.amount} onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })} required />
                                    <Select label="Frecuencia" value={fixedForm.frequency}
                                        onChange={(e) => setFixedForm({ ...fixedForm, frequency: e.target.value })}>
                                        {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Día de Pago" type="number" min="1" max="31"
                                        value={fixedForm.paymentDay}
                                        onChange={(e) => setFixedForm({ ...fixedForm, paymentDay: e.target.value })} required />
                                    <Input label="Fecha Inicio" type="date" value={fixedForm.startDate}
                                        onChange={(e) => setFixedForm({ ...fixedForm, startDate: e.target.value })} required />
                                </div>
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--copper))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--copper-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Registrando...' : 'Registrar Gasto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVariableSubmit} className="space-y-4">
                                <Select label="Proyecto Asociado (Opcional)" value={variableForm.projectId}
                                    onChange={(e) => setVariableForm({ ...variableForm, projectId: e.target.value })}>
                                    <option value="">General / Sin proyecto</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </Select>
                                <Select label="Tipo de Gasto" value={variableForm.type}
                                    onChange={(e) => setVariableForm({ ...variableForm, type: e.target.value })}>
                                    {variableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                                <Input label="Monto" type="number" placeholder="0.00" min="0" step="0.01"
                                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                    value={variableForm.amount} onChange={(e) => setVariableForm({ ...variableForm, amount: e.target.value })} required />
                                <Input label="Fecha" type="date" value={variableForm.date}
                                    onChange={(e) => setVariableForm({ ...variableForm, date: e.target.value })} required />
                                <Input label="Fecha Vencimiento (Opcional)" type="date" value={variableForm.dueDate}
                                    onChange={(e) => setVariableForm({ ...variableForm, dueDate: e.target.value })} />
                                <Input label="Observaciones" placeholder="Detalles adicionales..."
                                    value={variableForm.observations} onChange={(e) => setVariableForm({ ...variableForm, observations: e.target.value })} />
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--copper))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--copper-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Guardando...' : 'Guardar Costo Variable'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold text-foreground">
                        {activeTab === 'fixed' ? 'Historial de Costos Fijos' : 'Historial de Costos Variables'}
                    </h3>

                    {activeTab === 'fixed' ? (
                        fixedCosts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                                No hay costos fijos registrados.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {fixedCosts.slice().reverse().map((cost) => (
                                    <div key={cost.id} className="bg-card glass-card border border-border/50 p-5 rounded-2xl flex justify-between items-start group hover:shadow-lg transition-all duration-300">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-white bg-[hsl(var(--copper))] px-2 py-0.5 rounded-lg border border-[hsl(var(--copper))] uppercase tracking-wider">
                                                    {cost.servicio_nombre || 'Varios'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/50">
                                                    <Repeat size={10} /> {cost.frecuencia || 'Mensual'}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-foreground text-lg tracking-tight">{cost.servicio_nombre || cost.proveedor || 'Costo Fijo'}</h4>
                                            {cost.proveedor && <p className="text-sm text-muted-foreground mb-1">{cost.proveedor}</p>}
                                            {(() => {
                                                const nextDue = getNextFixedDueDate(cost);
                                                const status = getDueStatus(nextDue);
                                                return (
                                                    <p className={`text-xs mt-2 font-medium ${status.className}`}>
                                                        {nextDue ? `Próximo vencimiento: ${nextDue.toLocaleDateString('es-CL')} · ${status.label}` : status.label}
                                                    </p>
                                                );
                                            })()}
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium bg-secondary/30 w-fit px-2 py-1 rounded">
                                                <Calendar size={12} /> {cost.fecha_inicio ? new Date(cost.fecha_inicio).toLocaleDateString('es-CL') : `Día ${cost.fecha_pago}`}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-[hsl(var(--copper))] text-lg">
                                                -${parseFloat(cost.monto || 0).toLocaleString()}
                                            </span>
                                            <button onClick={() => handleDeleteFixed(cost.id)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-2 bg-secondary/50 rounded-lg hover:bg-destructive/10"
                                                title="Eliminar Gasto">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        variableCosts.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                                No hay costos variables registrados.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {variableCosts.slice().reverse().map((cost) => (
                                    <div key={cost.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-start group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium text-white bg-[hsl(var(--copper))] px-2 py-0.5 rounded-full">
                                                    {cost.tipo_nombre || 'Variable'}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-foreground">
                                                {cost.proyecto_nombre || 'General'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{cost.observaciones || cost.concepto || 'Sin observaciones'}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {cost.fecha ? new Date(cost.fecha).toLocaleDateString('es-CL') : ''}
                                            </p>
                                            {cost.fecha_vencimiento && (
                                                <p className={`text-xs mt-1 font-medium ${getDueStatus(cost.fecha_vencimiento).className}`}>
                                                    Vence: {new Date(cost.fecha_vencimiento).toLocaleDateString('es-CL')} · {getDueStatus(cost.fecha_vencimiento).label}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-[hsl(var(--copper))]">
                                                -${parseFloat(cost.monto || 0).toLocaleString()}
                                            </span>
                                            <button onClick={() => handleDeleteVariable(cost.id)}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Eliminar Gasto">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
