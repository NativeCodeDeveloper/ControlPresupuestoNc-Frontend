import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import * as costsService from '../../services/costsService';
import {
    Server,
    Users,
    MoreHorizontal,
    Briefcase,
    Trash2,
    Calendar,
    Repeat
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';

export default function Gastos() {
    const { addTransaction, removeTransaction, data } = useFinance();
    const [activeTab, setActiveTab] = useState('fixed');
    const [isLoading, setIsLoading] = useState(false);
    const [fixedCostsData, setFixedCostsData] = useState([]);
    const [variableCostsData, setVariableCostsData] = useState([]);

    const [fixedForm, setFixedForm] = useState({
        category: 'Infraestructura',
        service: '',
        provider: '',
        amount: '',
        frequency: 'Mensual',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    const [variableForm, setVariableForm] = useState({
        projectId: '',
        type: 'Freelancer',
        amount: '',
        observations: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ['Infraestructura', 'Software / IA', 'Marketing / Ads', 'Servicios', 'Suscripciones', 'Otros'];
    const serviceOptions = (data?.services?.length > 0) ? data.services : categories;
    const variableTypes = data?.variableCostTypes?.length > 0
        ? data.variableCostTypes
        : ['Freelancer', 'Plugin', 'Comisión', 'Marketing / Ads', 'Servicio Puntual'];
    const frequencies = ['Mensual', 'Anual', 'Trimestral'];

    // Cargar datos del backend cuando el componente monta
    const [costsLoaded, setCostsLoaded] = useState(false);
    if (!costsLoaded) {
        Promise.all([
            costsService.getFixedCosts().then(d => d && setFixedCostsData(d)),
            costsService.getVariableCosts().then(d => d && setVariableCostsData(d))
        ]).then(() => setCostsLoaded(true));
    }

    const handleFixedSubmit = async (e) => {
        e.preventDefault();
        if (!fixedForm.service || !fixedForm.amount) return;

        setIsLoading(true);
        try {
            // Guardar en backend
            const result = await costsService.addFixedCost({
                nombre: fixedForm.service,
                proveedor: fixedForm.provider,
                monto: parseFloat(fixedForm.amount),
                frecuencia: fixedForm.frequency,
                categoria: fixedForm.category,
                fecha_inicio: new Date().toISOString().split('T')[0],
                activo: true
            });

            if (result && result.ok) {
                // Agregar también al contexto local
                addTransaction({
                    id: result.resultado?.insertId || Date.now(),
                    type: 'fixed_cost',
                    ...fixedForm,
                    amount: parseFloat(fixedForm.amount)
                });

                // Recargar datos
                const freshData = await costsService.getFixedCosts();
                if (freshData) setFixedCostsData(freshData);

                alert('Costo fijo registrado exitosamente');
            }

            setFixedForm(prev => ({
                ...prev,
                service: '',
                provider: '',
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0]
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
            // Guardar en backend
            const result = await costsService.addVariableCost({
                proyecto_id: variableForm.projectId || null,
                tipo: variableForm.type,
                monto: parseFloat(variableForm.amount),
                observaciones: variableForm.observations,
                fecha: variableForm.date
            });

            if (result && result.ok) {
                // Agregar también al contexto local
                addTransaction({
                    id: result.resultado?.insertId || Date.now(),
                    ...variableForm,
                    type: 'variable_cost',
                    costType: variableForm.type,
                    amount: parseFloat(variableForm.amount)
                });

                // Recargar datos
                const freshData = await costsService.getVariableCosts();
                if (freshData) setVariableCostsData(freshData);

                alert('Costo variable registrado exitosamente');
            }

            setVariableForm({
                projectId: '',
                type: 'Freelancer',
                amount: '',
                observations: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error creando costo variable:', error);
            alert('Error al registrar costo variable');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id, type) => {
        if (window.confirm('¿Eliminar este gasto?')) {
            removeTransaction(id, type);
        }
    };

    // Safe Data Access
    const fixedCosts = fixedCostsData || [];
    const variableCosts = variableCostsData || [];
    const projects = data?.projects || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Gastos</h2>
                    <p className="text-sm text-muted-foreground mt-1">Control de costos fijos y variables</p>
                </div>
                <div className="flex bg-secondary p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('fixed')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'fixed' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Costos Fijos
                    </button>
                    <button
                        onClick={() => setActiveTab('variable')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'variable' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Costos Variables
                    </button>
                </div>
            </div>

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
                                <Select
                                    label="Servicio / Categoría"
                                    value={fixedForm.service}
                                    onChange={(e) => setFixedForm({
                                        ...fixedForm,
                                        service: e.target.value,
                                        category: e.target.value
                                    })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {serviceOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Monto"
                                        type="number"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={fixedForm.amount}
                                        onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })}
                                        required
                                    />
                                    <Select
                                        label="Frecuencia"
                                        value={fixedForm.frequency}
                                        onChange={(e) => setFixedForm({ ...fixedForm, frequency: e.target.value })}
                                    >
                                        {frequencies.map(f => <option key={f} value={f}>{f}</option>)}
                                    </Select>
                                </div>
                                <Input
                                    label="Fecha de Pago"
                                    type="date"
                                    value={fixedForm.paymentDate}
                                    onChange={(e) => setFixedForm({ ...fixedForm, paymentDate: e.target.value })}
                                    required
                                />
                                <button type="submit" disabled={isLoading} className="w-full bg-[hsl(var(--copper))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--copper-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Registrando...' : 'Registrar Gasto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVariableSubmit} className="space-y-4">
                                <Select
                                    label="Proyecto Asociado (Opcional)"
                                    value={variableForm.projectId}
                                    onChange={(e) => setVariableForm({ ...variableForm, projectId: e.target.value })}
                                >
                                    <option value="">General / Sin proyecto</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                                <Select
                                    label="Tipo de Gasto"
                                    value={variableForm.type}
                                    onChange={(e) => setVariableForm({ ...variableForm, type: e.target.value })}
                                >
                                    {variableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                                <Input
                                    label="Monto"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                    value={variableForm.amount}
                                    onChange={(e) => setVariableForm({ ...variableForm, amount: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Fecha"
                                    type="date"
                                    value={variableForm.date}
                                    onChange={(e) => setVariableForm({ ...variableForm, date: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Observaciones"
                                    placeholder="Detalles adicionales..."
                                    value={variableForm.observations}
                                    onChange={(e) => setVariableForm({ ...variableForm, observations: e.target.value })}
                                />
                                <button type="submit" disabled={isLoading} className="w-full bg-[hsl(var(--copper))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--copper-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
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
                                                    {cost.servicio_nombre || cost.category || 'Varios'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/50">
                                                    <Repeat size={10} /> {cost.frecuencia || cost.frequency || 'Mensual'}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold text-foreground text-lg tracking-tight">{cost.servicio_nombre || cost.service || cost.category}</h4>
                                            {(cost.proveedor || cost.provider) && <p className="text-sm text-muted-foreground mb-1">{cost.proveedor || cost.provider}</p>}
                                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium bg-secondary/30 w-fit px-2 py-1 rounded">
                                                <Calendar size={12} /> {cost.fecha_pago || cost.paymentDate}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-[hsl(var(--copper))] text-lg">
                                                -${parseFloat(cost.monto || cost.amount).toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(cost.id, 'fixed_cost')}
                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-2 bg-secondary/50 rounded-lg hover:bg-destructive/10"
                                                title="Eliminar Gasto"
                                            >
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
                                {variableCosts.slice().reverse().map((cost) => {
                                    const projectName = cost.proyecto_nombre || projects.find(p => p.id === parseInt(cost.proyecto_id || cost.projectId))?.name;
                                    return (
                                        <div key={cost.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-start group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-white bg-[hsl(var(--copper))] px-2 py-0.5 rounded-full">
                                                        {cost.tipo_nombre || cost.costType || cost.type}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-foreground">
                                                    {projectName || 'General'}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">{cost.observaciones || cost.observations || 'Sin observaciones'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="font-bold text-[hsl(var(--copper))]">
                                                    -${parseFloat(cost.monto || cost.amount).toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(cost.id, 'variable_cost')}
                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    title="Eliminar Gasto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
