import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import * as projectsService from '../../services/projectsService';
import * as configService from '../../services/configService';
import {
    Plus,
    Briefcase,
    DollarSign,
    MoreHorizontal,
    Search,
    Filter,
    Trash2,
    Calendar,
    User,
    ChevronDown,
    ChevronUp,
    Receipt
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';

export default function Ingresos() {
    const { addTransaction, addProject, updateProjectStatus, removeProject, data } = useFinance();
    const [activeTab, setActiveTab] = useState('projects');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('Todos');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [expandedProject, setExpandedProject] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState([]);

    const [projectForm, setProjectForm] = useState({
        name: '',
        type: 'Web',
        status: 'Lead',
        agreedAmount: '',
        // Client Data
        clientName: '',
        clientRut: '',
        clientPhone: '',
        clientEmail: '',
        clientProfession: '' // Optional
    });

    const [incomeForm, setIncomeForm] = useState({
        projectId: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Catálogos dinámicos desde BD
    const [projectTypesData, setProjectTypesData] = useState([]);
    const [projectStatusesData, setProjectStatusesData] = useState([]);

    const projectTypes = projectTypesData.length > 0
        ? projectTypesData.map(t => t.nombre)
        : (data?.projectTypes || ['Web', 'E-commerce', 'SaaS', 'Landing Page', 'Inmobiliaria', 'Marketing']);
    const projectStatuses = projectStatusesData.length > 0
        ? projectStatusesData.map(s => s.nombre)
        : (data?.projectStatuses || ['Lead', 'Cotizado', 'Aceptado', 'En desarrollo', 'Entregado', 'Cancelado']);

    // Cargar proyectos y catálogos desde el backend cuando el componente monta
    const [projectsLoaded, setProjectsLoaded] = useState(false);

    if (!projectsLoaded) {
        Promise.all([
            projectsService.getProjects().then(result => {
                if (result && Array.isArray(result)) {
                    setProjects(result);
                } else if (data?.projects) {
                    setProjects(data.projects);
                }
            }),
            configService.getProjectTypes().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setProjectTypesData(d);
            }),
            configService.getProjectStatuses().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setProjectStatusesData(d);
            })
        ]).then(() => setProjectsLoaded(true));
    }

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.name) return;

        setIsLoading(true);
        try {
            // Buscar IDs dinámicamente de los catálogos cargados
            const tipoFound = projectTypesData.find(t => t.nombre === projectForm.type);
            const estadoFound = projectStatusesData.find(s => s.nombre === projectForm.status);
            const tipo_proyecto_id = tipoFound ? tipoFound.id : 1;
            const estado_proyecto_id = estadoFound ? estadoFound.id : 1;

            // Backend genera codigo_interno automáticamente
            const newProject = await projectsService.addProject({
                nombre: projectForm.name,
                tipo_proyecto_id,
                estado_proyecto_id,
                nombre_cliente: projectForm.clientName,
                rut_cliente: projectForm.clientRut,
                email_cliente: projectForm.clientEmail,
                telefono_cliente: projectForm.clientPhone,
                profesion_cliente: projectForm.clientProfession || null,
                monto_acordado: parseFloat(projectForm.agreedAmount || 0),
                fecha_creacion: new Date().toISOString().split('T')[0],
                observaciones: null
            });

            // Si fue exitoso, agregar también al contexto local
            if (newProject && newProject.ok) {
                addProject({
                    id: newProject.resultado?.insertId || Date.now(),
                    ...projectForm,
                    agreedAmount: parseFloat(projectForm.agreedAmount || 0),
                    history: []
                });

                // Recargar proyectos desde backend
                const updatedProjects = await projectsService.getProjects();
                if (updatedProjects && Array.isArray(updatedProjects)) {
                    setProjects(updatedProjects);
                }

                alert('Proyecto creado exitosamente');
            }

            // Limpiar formulario
            setProjectForm({
                name: '',
                type: projectTypes[0] || 'Web',
                status: 'Lead',
                agreedAmount: '',
                clientName: '',
                clientRut: '',
                clientPhone: '',
                clientEmail: '',
                clientProfession: ''
            });

            setActiveTab('projects');
        } catch (error) {
            console.error('Error creando proyecto:', error);
            alert('Error al crear el proyecto. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        if (!incomeForm.projectId || !incomeForm.amount) return;

        setIsLoading(true);
        try {
            const project = (projects || []).find(p => p.id === parseInt(incomeForm.projectId));
            const description = incomeForm.description || (project ? (project.nombre || project.name) : 'Ingreso');

            // Enviar pago al backend
            const result = await projectsService.addProjectPayment(incomeForm.projectId, {
                concepto: description,
                monto: parseFloat(incomeForm.amount),
                fecha_pago: incomeForm.date
            });

            if (result && result.ok) {
                addTransaction({
                    id: result.resultado?.insertId || Date.now(),
                    type: 'project_income',
                    ...incomeForm,
                    description,
                    amount: parseFloat(incomeForm.amount)
                });

                const updatedProjects = await projectsService.getProjects();
                if (updatedProjects && Array.isArray(updatedProjects)) {
                    setProjects(updatedProjects);
                }
                alert('Pago registrado exitosamente');
            } else {
                addTransaction({
                    id: Date.now(),
                    type: 'project_income',
                    ...incomeForm,
                    description,
                    amount: parseFloat(incomeForm.amount)
                });
            }

            setIncomeForm({
                projectId: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error('Error registrando pago:', error);
            alert('Error al registrar pago');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
            removeProject(id);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Entregado': return 'bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/20';
            case 'En desarrollo': return 'bg-[hsl(var(--turquoise-premium))]/10 text-[hsl(var(--turquoise-premium))] border-[hsl(var(--turquoise-premium))]/20';
            case 'Aceptado': return 'bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))] border-[hsl(var(--purple-premium))]/20';
            case 'Cancelado': return 'bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))] border-[hsl(var(--copper))]/20';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    // Normalizar datos de proyecto para que funcionen tanto backend como local
    const normalizeProject = (p) => ({
        id: p.id,
        nombre: p.nombre || p.name,
        name: p.nombre || p.name,
        type: p.tipo_nombre || p.type,
        tipo_nombre: p.tipo_nombre || p.type,
        status: p.estado_nombre || p.status,
        estado_nombre: p.estado_nombre || p.status,
        customId: p.codigo_interno || p.customId,
        codigo_interno: p.codigo_interno || p.customId,
        agreedAmount: p.monto_acordado || p.agreedAmount,
        monto_acordado: p.monto_acordado || p.agreedAmount,
        clientName: p.nombre_cliente || p.clientName,
        nombre_cliente: p.nombre_cliente || p.clientName,
        history: p.history || []
    });

    const filteredProjects = (projects || [])
        .map(normalizeProject)
        .filter(p => {
            const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.codigo_interno && p.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = filterType === 'Todos' || p.tipo_nombre === filterType;
            const matchesStatus = filterStatus === 'Todos' || p.estado_nombre === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Proyectos</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gestión de trabajos y sus ingresos</p>
                </div>
                <div className="flex bg-secondary p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'projects' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Nuevo Proyecto
                    </button>
                    <button
                        onClick={() => setActiveTab('new-income')}
                        className={cn(
                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                            activeTab === 'new-income' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        + Ingreso
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            {activeTab === 'projects' ? <Briefcase size={18} /> : <DollarSign size={18} />}
                            {activeTab === 'projects' ? 'Nuevo Proyecto' : 'Registrar Pago'}
                        </h3>

                        {activeTab === 'projects' ? (
                            <form onSubmit={handleProjectSubmit} className="space-y-4">
                                <Input
                                    label="Nombre del Proyecto"
                                    placeholder="Ej: E-commerce Cliente X"
                                    value={projectForm.name}
                                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Tipo"
                                        value={projectForm.type}
                                        onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}
                                        required
                                    >
                                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                    <Select
                                        label="Estado"
                                        value={projectForm.status}
                                        onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                                        required
                                    >
                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </div>
                                <Input
                                    label="Monto Acordado"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                    value={projectForm.agreedAmount}
                                    onChange={(e) => setProjectForm({ ...projectForm, agreedAmount: e.target.value })}
                                    required
                                />

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                        <User size={14} /> Datos del Cliente
                                    </h4>
                                    <div className="space-y-3">
                                        <Input
                                            label="Nombre Completo"
                                            placeholder="Nombre del cliente"
                                            value={projectForm.clientName}
                                            onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="RUT / ID"
                                                placeholder="12.345.678-9"
                                                value={projectForm.clientRut}
                                                onChange={(e) => setProjectForm({ ...projectForm, clientRut: e.target.value })}
                                                required
                                            />
                                            <Input
                                                label="Teléfono"
                                                placeholder="+56 9..."
                                                value={projectForm.clientPhone}
                                                onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="cliente@email.com"
                                            value={projectForm.clientEmail}
                                            onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Profesión / Giro (Opcional)"
                                            placeholder="Ej: Abogado, Retail..."
                                            value={projectForm.clientProfession}
                                            onChange={(e) => setProjectForm({ ...projectForm, clientProfession: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Creando...' : 'Crear Proyecto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleIncomeSubmit} className="space-y-4">
                                <Select
                                    label="Proyecto"
                                    value={incomeForm.projectId}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, projectId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar Proyecto...</option>
                                    {projects.map(p => {
                                        const normalized = normalizeProject(p);
                                        return <option key={p.id} value={p.id}>{normalized.nombre}</option>;
                                    })}
                                </Select>
                                <Input
                                    label="Monto del Pago"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                    value={incomeForm.amount}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Concepto del pago"
                                    placeholder="Ej: Dashboard, Landing Page, Anticipo 50%"
                                    value={incomeForm.description}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Fecha"
                                    type="date"
                                    value={incomeForm.date}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4"
                                >
                                    Guardar Pago
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o ID..."
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="Todos">Todos los Tipos</option>
                                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select
                                className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="Todos">Todos los Estados</option>
                                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center border border-border border-dashed rounded-xl bg-muted/20">
                            <Briefcase size={32} className="mb-4 opacity-50" />
                            <p className="font-medium">No se encontraron proyectos</p>
                            <p className="text-sm">Intenta con otra búsqueda o crea uno nuevo.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.map(project => {
                                const totalPaid = project.history.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                                const progress = project.agreedAmount > 0 ? (totalPaid / project.agreedAmount) * 100 : 0;

                                return (
                                    <div key={project.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden">

                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
                                                        {project.customId || 'N/A'}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-foreground text-base tracking-tight">{project.nombre}</h4>
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">{project.tipo_nombre}</span>
                                                    {project.clientName && (
                                                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                            <User size={10} /> {project.clientName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className="relative group/status">
                                                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer", getStatusColor(project.estado_nombre))}>
                                                        {project.estado_nombre}
                                                    </span>
                                                    <select
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        value={project.estado_nombre}
                                                        onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                                                    >
                                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteProject(project.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                    title="Eliminar Proyecto"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Financials */}
                                        <div className="space-y-3 mb-5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Acordado</span>
                                                <span className="text-foreground font-medium">${(project.agreedAmount || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Pagado</span>
                                                <span className="text-[hsl(var(--emerald-premium))] font-medium">${totalPaid.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
                                            <div
                                                className="h-full bg-[hsl(var(--emerald-premium))] transition-all duration-500"
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>

                                        {/* Payment History Toggle */}
                                        {project.history && project.history.length > 0 && (
                                            <div className="mb-3">
                                                <button
                                                    onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Receipt size={12} />
                                                        {project.history.length} pago{project.history.length !== 1 ? 's' : ''} registrado{project.history.length !== 1 ? 's' : ''}
                                                    </span>
                                                    {expandedProject === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                {/* Expanded Payment History */}
                                                {expandedProject === project.id && (
                                                    <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                        {[...project.history].reverse().map((payment, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-[hsl(var(--emerald-premium))]/5 border border-[hsl(var(--emerald-premium))]/10 rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-foreground truncate">{payment.note || 'Pago'}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {payment.date ? new Date(payment.date).toLocaleDateString('es-CL') : 'Sin fecha'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-bold text-[hsl(var(--emerald-premium))] ml-2">
                                                                    +${(payment.amount || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                setIncomeForm({ ...incomeForm, projectId: project.id });
                                                setActiveTab('new-income');
                                            }}
                                            className="w-full py-2 rounded-lg bg-[hsl(var(--emerald-premium))] text-white text-xs font-medium hover:bg-[hsl(var(--emerald-light))] transition-colors"
                                        >
                                            Agregar Pago
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
