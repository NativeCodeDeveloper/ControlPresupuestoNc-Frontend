'use client';

import { useState, useEffect } from 'react';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useRealtime } from '../../hooks/useRealtime';
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
    Receipt,
    Pencil,
    X,
    Repeat,
    Mail,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input, Select } from '../../components/ui/FormElements';

export default function Ingresos() {
    const [activeTab, setActiveTab]       = usePersistedState('ingresos:activeTab', 'projects');
    const [searchTerm, setSearchTerm]     = usePersistedState('ingresos:search', '');
    const [filterType, setFilterType]     = usePersistedState('ingresos:filterType', 'Todos');
    const [filterStatus, setFilterStatus] = usePersistedState('ingresos:filterStatus', 'Todos');
    const [filterMonth, setFilterMonth]   = usePersistedState('ingresos:filterMonth', 'Todos');
    const [filterPago, setFilterPago]     = usePersistedState('ingresos:filterPago', 'Todos');
    const [expandedProject, setExpandedProject] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [projectPayments, setProjectPayments] = useState({});

    const [projectForm, setProjectForm] = useState({
        name: '',
        type: 'Web',
        status: 'Lead',
        agreedAmount: '',
        clientName: '',
        clientRut: '',
        clientPhone: '',
        clientEmail: '',
        clientProfession: '',
        deliveryDate: '',
        observations: '',
        ciclo: 'Unico',
        fechaInicioServicio: '',
        fechaProximoPago: '',
        urlCobroMp: '',
        afectoIva: true
    });

    const [quickPayLoadingId, setQuickPayLoadingId] = useState(null);

    const [incomeForm, setIncomeForm] = useState({
        projectId: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [projectTypesData, setProjectTypesData] = useState([]);
    const [projectStatusesData, setProjectStatusesData] = useState([]);

    const [editProject, setEditProject] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isEditLoading, setIsEditLoading] = useState(false);

    const [editPayment, setEditPayment] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({});
    const [isPaymentEditLoading, setIsPaymentEditLoading] = useState(false);

    const fmtPreview = (val) => {
        const n = Math.round(parseFloat(val) || 0);
        if (!n) return null;
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
    };

    const projectTypes = projectTypesData.length > 0
        ? projectTypesData.map(t => t.nombre)
        : ['Web', 'E-commerce', 'SaaS', 'Landing Page', 'Inmobiliaria', 'Marketing'];
    const projectStatuses = projectStatusesData.length > 0
        ? projectStatusesData.map(s => s.nombre)
        : ['Lead', 'Cotizado', 'Aceptado', 'En desarrollo', 'Entregado', 'Cancelado'];

    // Load projects, catalogs, and payments from backend
    useEffect(() => {
        const loadData = async () => {
            try {
                const [projectsResult, typesResult, statusesResult] = await Promise.all([
                    projectsService.getProjects(),
                    configService.getProjectTypes(),
                    configService.getProjectStatuses()
                ]);

                if (projectsResult && Array.isArray(projectsResult)) {
                    setProjects(projectsResult);
                    const paymentsResults = await Promise.all(
                        projectsResult.map(p => projectsService.getProjectPayments(p.id))
                    );
                    const paymentsMap = {};
                    projectsResult.forEach((p, i) => {
                        if (paymentsResults[i] && Array.isArray(paymentsResults[i])) {
                            paymentsMap[p.id] = paymentsResults[i];
                        }
                    });
                    setProjectPayments(paymentsMap);
                }
                if (typesResult && Array.isArray(typesResult) && typesResult.length > 0) setProjectTypesData(typesResult);
                if (statusesResult && Array.isArray(statusesResult) && statusesResult.length > 0) setProjectStatusesData(statusesResult);
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        };
        loadData();
    }, []);

    const reloadProjects = async () => {
        const updatedProjects = await projectsService.getProjects();
        if (updatedProjects && Array.isArray(updatedProjects)) {
            setProjects(updatedProjects);
            const paymentsMap = {};
            for (const p of updatedProjects) {
                const pagos = await projectsService.getProjectPayments(p.id);
                if (pagos && Array.isArray(pagos)) {
                    paymentsMap[p.id] = pagos;
                }
            }
            setProjectPayments(paymentsMap);
        }
    };

    useRealtime(reloadProjects);

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.name) return;

        setIsLoading(true);
        try {
            const tipoFound = projectTypesData.find(t => t.nombre === projectForm.type);
            const estadoFound = projectStatusesData.find(s => s.nombre === projectForm.status);
            const tipo_proyecto_id = tipoFound ? tipoFound.id : 1;
            const estado_proyecto_id = estadoFound ? estadoFound.id : 1;

            const newProject = await projectsService.addProject({
                nombre: projectForm.name,
                tipo_proyecto_id,
                estado_proyecto_id,
                nombre_cliente: projectForm.clientName,
                rut_cliente: projectForm.clientRut,
                email_cliente: projectForm.clientEmail,
                telefono_cliente: projectForm.clientPhone,
                profesion_cliente: projectForm.clientProfession || null,
                monto_acordado: Math.round(parseFloat(projectForm.agreedAmount || 0)),
                fecha_creacion: new Date().toISOString().split('T')[0],
                fecha_entrega: projectForm.deliveryDate || null,
                observaciones: projectForm.observations || null,
                ciclo_facturacion: projectForm.ciclo || 'Unico',
                fecha_inicio_servicio: projectForm.fechaInicioServicio || null,
                fecha_proximo_pago: projectForm.fechaProximoPago || null,
                url_cobro_mercadopago: projectForm.urlCobroMp || null,
                afecto_iva: projectForm.afectoIva ? 1 : 0
            });

            if (newProject && newProject.ok) {
                await reloadProjects();
                alert('Proyecto creado exitosamente');
            } else {
                alert('Error al crear proyecto');
            }

            setProjectForm({
                name: '',
                type: projectTypes[0] || 'Web',
                status: 'Lead',
                agreedAmount: '',
                clientName: '',
                clientRut: '',
                clientPhone: '',
                clientEmail: '',
                clientProfession: '',
                deliveryDate: '',
                observations: '',
                ciclo: 'Unico',
                fechaInicioServicio: '',
                fechaProximoPago: '',
                urlCobroMp: '',
                afectoIva: true
            });
            setActiveTab('projects');
        } catch (error) {
            console.error('Error creando proyecto:', error);
            alert('Error al crear proyecto');
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
            const description = incomeForm.description || (project ? project.nombre : 'Ingreso');

            const result = await projectsService.addProjectPayment(incomeForm.projectId, {
                concepto: description,
                monto: Math.round(parseFloat(incomeForm.amount)),
                fecha_pago: incomeForm.date
            });

            if (result && result.ok) {
                await reloadProjects();
                alert('Pago registrado exitosamente');
            } else {
                alert('Error al registrar pago');
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

    const handleDeleteProject = async (id) => {
        if (!window.confirm('¿Desactivar este proyecto? Dejará de verse en los listados activos.')) return;
        setIsLoading(true);
        try {
            await projectsService.deleteProject(id);
            await reloadProjects();
        } catch (error) {
            console.error('Error eliminando proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (projectId, newStatusName) => {
        const estadoFound = projectStatusesData.find(s => s.nombre === newStatusName);
        if (!estadoFound) return;
        try {
            await projectsService.updateProjectStatus(projectId, estadoFound.id);
            await reloadProjects();
        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    };

    const handleEditOpen = (project) => {
        setEditProject(project);
        setEditForm({
            name: project.nombre || '',
            type: project.tipo_nombre || projectTypes[0] || 'Web',
            status: project.estado_nombre || 'Lead',
            estadoId: project.estado_proyecto_id || null,
            tipoId: project.tipo_proyecto_id || null,
            agreedAmount: project.monto_acordado || '',
            clientName: project.nombre_cliente || '',
            clientRut: project.rut_cliente || '',
            clientPhone: project.telefono_cliente || '',
            clientEmail: project.email_cliente || '',
            clientProfession: project.profesion_cliente || '',
            deliveryDate: project.fecha_entrega ? project.fecha_entrega.split('T')[0] : '',
            observations: project.observaciones || '',
            ciclo: project.ciclo_facturacion || 'Unico',
            fechaInicioServicio: project.fecha_inicio_servicio ? project.fecha_inicio_servicio.split('T')[0] : '',
            fechaProximoPago: project.fecha_proximo_pago ? project.fecha_proximo_pago.split('T')[0] : '',
            urlCobroMp: project.url_cobro_mercadopago || '',
            afectoIva: project.afecto_iva !== undefined ? Boolean(project.afecto_iva) : true
        });
    };

    const handleEditClose = () => {
        setEditProject(null);
        setEditForm({});
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editProject) return;
        setIsEditLoading(true);
        try {
            const tipoFound = projectTypesData.find(t => t.nombre === editForm.type);
            const estadoFound = projectStatusesData.find(s => s.nombre === editForm.status);
            const tipo_proyecto_id = tipoFound?.id ?? editForm.tipoId;
            const estado_proyecto_id = estadoFound?.id ?? editForm.estadoId;

            const updates = {
                nombre: editForm.name,
                nombre_cliente: editForm.clientName,
                rut_cliente: editForm.clientRut,
                email_cliente: editForm.clientEmail,
                telefono_cliente: editForm.clientPhone,
                profesion_cliente: editForm.clientProfession || null,
                monto_acordado: Math.round(parseFloat(editForm.agreedAmount || 0)),
                fecha_entrega: editForm.deliveryDate || null,
                observaciones: editForm.observations || null,
                ciclo_facturacion: editForm.ciclo || 'Unico',
                fecha_inicio_servicio: editForm.fechaInicioServicio || null,
                fecha_proximo_pago: editForm.fechaProximoPago || null,
                url_cobro_mercadopago: editForm.urlCobroMp || null,
                tipo_proyecto_id: tipo_proyecto_id ?? null,
                estado_proyecto_id: estado_proyecto_id ?? null,
                afecto_iva: editForm.afectoIva ? 1 : 0,
            };

            const result = await projectsService.updateProject(editProject.id, updates);
            if (result && (result.ok || result.id)) {
                await reloadProjects();
                handleEditClose();
            } else {
                alert('Error al actualizar el proyecto');
            }
        } catch (error) {
            console.error('Error actualizando proyecto:', error);
            alert('Error al actualizar el proyecto');
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleQuickPago = async (project) => {
        if (!window.confirm(`¿Confirmas el pago de ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(project.monto_acordado)} para ${project.nombre_cliente}?`)) return;
        setQuickPayLoadingId(project.id);
        try {
            const result = await projectsService.addProjectPayment(project.id, {
                concepto: `Renovación ${project.ciclo_facturacion?.toLowerCase() || 'suscripción'}`,
                monto: Math.round(parseFloat(project.monto_acordado || 0)),
                fecha_pago: new Date().toISOString().split('T')[0]
            });
            if (result && result.ok) {
                await reloadProjects();
            } else {
                alert('Error al registrar el pago');
            }
        } catch (error) {
            console.error('Error en pago rápido:', error);
            alert('Error al registrar el pago');
        } finally {
            setQuickPayLoadingId(null);
        }
    };

    const handleEditPaymentOpen = (payment, project) => {
        setEditPayment({ ...payment, projectId: project.id });
        setEditPaymentForm({
            concepto: payment.concepto || '',
            monto: payment.monto || '',
            fecha_pago: payment.fecha_pago ? String(payment.fecha_pago).slice(0, 10) : '',
            numero_comprobante: payment.numero_comprobante || '',
            notas: payment.notas || '',
        });
    };

    const handleEditPaymentSubmit = async (e) => {
        e.preventDefault();
        if (!editPayment) return;
        setIsPaymentEditLoading(true);
        try {
            await projectsService.updateProjectPayment(editPayment.projectId, editPayment.id_proyecto_pago, {
                concepto: editPaymentForm.concepto,
                monto: Math.round(parseFloat(editPaymentForm.monto || 0)),
                fecha_pago: editPaymentForm.fecha_pago,
                numero_comprobante: editPaymentForm.numero_comprobante || null,
                notas: editPaymentForm.notas || null,
            });
            await reloadProjects();
            setEditPayment(null);
        } catch {
            alert('Error al actualizar el pago');
        } finally {
            setIsPaymentEditLoading(false);
        }
    };

    const handleDeletePayment = async (payment, project) => {
        if (!window.confirm(`¿Eliminar el pago "${payment.concepto}" de ${Math.round(parseFloat(payment.monto || 0)).toLocaleString('es-CL')}?`)) return;
        const ok = await projectsService.deleteProjectPayment(project.id, payment.id_proyecto_pago);
        if (ok) {
            await reloadProjects();
        } else {
            alert('Error al eliminar el pago');
        }
    };

    const getStatusBadgeProps = (status, colorHex) => {
        const base = "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer whitespace-nowrap";
        if (colorHex) {
            return {
                className: base,
                style: { backgroundColor: colorHex + '1A', color: colorHex, borderColor: colorHex + '33' }
            };
        }
        const colorCls = (() => {
            switch (status) {
                case 'Entregado':     return 'bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/20';
                case 'En desarrollo': return 'bg-[hsl(var(--turquoise-premium))]/10 text-[hsl(var(--turquoise-premium))] border-[hsl(var(--turquoise-premium))]/20';
                case 'Aceptado':      return 'bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))] border-[hsl(var(--purple-premium))]/20';
                case 'Cancelado':     return 'bg-[hsl(var(--copper))]/10 text-[hsl(var(--copper))] border-[hsl(var(--copper))]/20';
                default:              return 'bg-secondary text-muted-foreground border-border';
            }
        })();
        return { className: cn(base, colorCls), style: {} };
    };

    const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Evita el desfase de timezone al mostrar fechas almacenadas como DATE (sin hora).
    // new Date("2025-06-20") es medianoche UTC; en Chile (UTC-4) toLocaleDateString
    // lo convertiría al 19 de junio. Parsear los componentes directamente evita eso.
    const fmtDate = (dateStr) => {
        if (!dateStr) return '';
        const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
        const [y, m, d] = s.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
    };

    // Contadores de proyectos
    const allProjects = projects || [];
    const activeStatuses = ['En desarrollo', 'Aceptado', 'Cotizado', 'Lead', 'Activo'];
    const closedStatuses = ['Cancelado', 'Entregado', 'Desactivado por no pago'];
    const countActivos = allProjects.filter(p => activeStatuses.includes(p.estado_nombre)).length;
    const countInactivos = allProjects.filter(p => closedStatuses.includes(p.estado_nombre)).length;
    const countPorVencer = allProjects.filter(p => p.estado_alerta_pago === 'naranja' || p.estado_alerta_pago === 'rojo').length;
    const countAlDia    = allProjects.filter(p => p.estado_alerta_pago === 'verde').length;
    const countNaranja  = allProjects.filter(p => p.estado_alerta_pago === 'naranja').length;
    const countRojo     = allProjects.filter(p => p.estado_alerta_pago === 'rojo').length;
    const countByType = allProjects.reduce((acc, p) => {
        const tipo = p.tipo_nombre || 'Sin tipo';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const getPaymentAlertBadge = (alerta) => {
        switch (alerta) {
            case 'verde':   return { label: 'Al día', cls: 'bg-[hsl(var(--emerald-premium))]/15 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/30' };
            case 'naranja': return { label: 'Por vencer', cls: 'bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/30' };
            case 'rojo':    return { label: 'Vencido', cls: 'bg-destructive/15 text-destructive border-destructive/30' };
            default:        return null;
        }
    };

    const filteredProjects = (projects || []).filter(p => {
        const nombre = p.nombre || '';
        const codigo = p.codigo_interno || '';
        const tipo = p.tipo_nombre || '';
        const estado = p.estado_nombre || '';
        const matchesSearch = nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            codigo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todos' || tipo === filterType;
        const matchesStatus = filterStatus === 'Todos' || estado === filterStatus;

        let matchesMonth = true;
        if (filterMonth !== 'Todos') {
            const targetMonth = Number(filterMonth);
            const dateRef = p.fecha_entrega || p.fecha_inicio_servicio || p.fecha_creacion;
            if (dateRef) {
                const d = new Date(dateRef);
                matchesMonth = d.getUTCMonth() === targetMonth;
            }
        }

        const matchesPago = filterPago === 'Todos' || p.estado_alerta_pago === filterPago;

        return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesPago;
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
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            {activeTab === 'projects' ? <Briefcase size={18} /> : <DollarSign size={18} />}
                            {activeTab === 'projects' ? 'Nuevo Proyecto' : 'Registrar Pago'}
                        </h3>

                        {activeTab === 'projects' ? (
                            <form onSubmit={handleProjectSubmit} className="space-y-4">
                                <Input label="Nombre del Proyecto" placeholder="Ej: E-commerce Cliente X"
                                    value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Tipo" value={projectForm.type}
                                        onChange={(e) => {
                                            const selected = projectTypesData.find(t => t.nombre === e.target.value);
                                            const precio = selected?.precio_base ? String(Math.round(selected.precio_base)) : projectForm.agreedAmount;
                                            setProjectForm({ ...projectForm, type: e.target.value, agreedAmount: precio });
                                        }} required>
                                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                    <Select label="Estado" value={projectForm.status}
                                        onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} required>
                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Input label="Monto Acordado" type="number" placeholder="0" min="0" step="1"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={projectForm.agreedAmount} onChange={(e) => setProjectForm({ ...projectForm, agreedAmount: e.target.value })} required />
                                    {fmtPreview(projectForm.agreedAmount) && (
                                        <p className="text-[11px] text-[hsl(var(--emerald-premium))] mt-1 font-medium">{fmtPreview(projectForm.agreedAmount)}</p>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                        <User size={14} /> Datos del Cliente
                                    </h4>
                                    <div className="space-y-3">
                                        <Input label="Nombre Completo" placeholder="Nombre del cliente"
                                            value={projectForm.clientName} onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })} required />
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input label="RUT / ID" placeholder="12.345.678-9"
                                                value={projectForm.clientRut} onChange={(e) => setProjectForm({ ...projectForm, clientRut: e.target.value })} required />
                                            <Input label="Teléfono" placeholder="+56 9..."
                                                value={projectForm.clientPhone} onChange={(e) => setProjectForm({ ...projectForm, clientPhone: e.target.value })} required />
                                        </div>
                                        <Input label="Email" type="email" placeholder="cliente@email.com"
                                            value={projectForm.clientEmail} onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })} required />
                                        <Input label="Profesión / Giro (Opcional)" placeholder="Ej: Abogado, Retail..."
                                            value={projectForm.clientProfession} onChange={(e) => setProjectForm({ ...projectForm, clientProfession: e.target.value })} />
                                        <Input label="Fecha de Entrega (Opcional)" type="date"
                                            value={projectForm.deliveryDate}
                                            onChange={(e) => setProjectForm({ ...projectForm, deliveryDate: e.target.value })} />
                                        <Input label="Observaciones (Opcional)" placeholder="Notas del proyecto/cliente"
                                            value={projectForm.observations} onChange={(e) => setProjectForm({ ...projectForm, observations: e.target.value })} />
                                        <Input label="Link de cobro Mercado Pago (Opcional)" type="url" placeholder="https://mpago.la/..."
                                            value={projectForm.urlCobroMp} onChange={(e) => setProjectForm({ ...projectForm, urlCobroMp: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                        <Repeat size={14} /> Ciclo de Facturación
                                    </h4>
                                    <div className="space-y-3">
                                        <Select label="Tipo de Ciclo" value={projectForm.ciclo}
                                            onChange={(e) => setProjectForm({ ...projectForm, ciclo: e.target.value })}>
                                            <option value="Unico">Pago Único</option>
                                            <option value="Mensual">Mensual</option>
                                            <option value="Trimestral">Trimestral</option>
                                            <option value="Anual">Anual</option>
                                        </Select>
                                        {projectForm.ciclo !== 'Unico' && (<>
                                            <Input label="Inicio del Servicio" type="date"
                                                value={projectForm.fechaInicioServicio}
                                                onChange={(e) => setProjectForm({ ...projectForm, fechaInicioServicio: e.target.value })} />
                                            <Input label="Próximo Pago" type="date"
                                                value={projectForm.fechaProximoPago}
                                                onChange={(e) => setProjectForm({ ...projectForm, fechaProximoPago: e.target.value })} />
                                        </>)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/40">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Afecto a IVA</p>
                                        <p className="text-xs text-muted-foreground">Genera débito fiscal en F29 (19%)</p>
                                    </div>
                                    <button type="button"
                                        onClick={() => setProjectForm({ ...projectForm, afectoIva: !projectForm.afectoIva })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${projectForm.afectoIva ? 'bg-violet-500' : 'bg-border'}`}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${projectForm.afectoIva ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Creando...' : 'Crear Proyecto'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleIncomeSubmit} className="space-y-4">
                                <Select label="Proyecto" value={incomeForm.projectId}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, projectId: e.target.value })} required>
                                    <option value="">Seleccionar Proyecto...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </Select>
                                <div>
                                    <Input label="Monto del Pago" type="number" placeholder="0" min="0" step="1"
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
                                    {fmtPreview(incomeForm.amount) && (
                                        <p className="text-[11px] text-[hsl(var(--emerald-premium))] mt-1 font-medium">{fmtPreview(incomeForm.amount)}</p>
                                    )}
                                </div>
                                <Input label="Concepto del pago" placeholder="Ej: Dashboard, Landing Page, Anticipo 50%"
                                    value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} required />
                                <Input label="Fecha" type="date" value={incomeForm.date}
                                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
                                <button type="submit" disabled={isLoading}
                                    className="w-full bg-[hsl(var(--emerald-premium))] text-white font-medium py-2.5 rounded-lg hover:bg-[hsl(var(--emerald-light))] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Guardando...' : 'Guardar Pago'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Contadores resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-card border border-[hsl(var(--emerald-premium))]/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--emerald-premium))]">{countActivos}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Activos</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-muted-foreground">{countInactivos}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Cerrados</p>
                        </div>
                        <div className="bg-card border border-[hsl(var(--gold))]/30 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--gold))]">{countPorVencer}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Por vencer / Vencidos</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Por categoría</p>
                            <div className="space-y-0.5">
                                {Object.entries(countByType).slice(0, 4).map(([tipo, count]) => (
                                    <div key={tipo} className="flex justify-between text-[11px]">
                                        <span className="text-muted-foreground truncate">{tipo}</span>
                                        <span className="font-semibold text-foreground ml-2">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Buscar por nombre o ID..."
                                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="Todos">Todos los Tipos</option>
                                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="Todos">Todos los Estados</option>
                                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                                <option value="Todos">Todos los Meses</option>
                                {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {(searchTerm || filterType !== 'Todos' || filterStatus !== 'Todos' || filterMonth !== 'Todos' || filterPago !== 'Todos') && (
                        <div className="mb-2">
                            <button
                                onClick={() => { setSearchTerm(''); setFilterType('Todos'); setFilterStatus('Todos'); setFilterMonth('Todos'); setFilterPago('Todos'); }}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-foreground/5 transition-colors"
                            >
                                <X size={11} /> Limpiar filtros
                            </button>
                        </div>
                    )}

                    {(countAlDia > 0 || countNaranja > 0 || countRojo > 0) && (
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            {[
                                { value: 'Todos',   label: 'Todos',      count: allProjects.length, cls: filterPago === 'Todos'   ? 'bg-primary text-primary-foreground border-primary'                                                                                             : 'bg-card text-muted-foreground border-border hover:border-primary/40' },
                                { value: 'verde',   label: 'Al día',     count: countAlDia,   cls: filterPago === 'verde'   ? 'bg-[hsl(var(--emerald-premium))]/20 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]'  : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--emerald-premium))]/50' },
                                { value: 'naranja', label: 'Por vencer', count: countNaranja, cls: filterPago === 'naranja' ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))] border-[hsl(var(--gold))]'                                  : 'bg-card text-muted-foreground border-border hover:border-[hsl(var(--gold))]/50' },
                                { value: 'rojo',    label: 'Vencidos',   count: countRojo,    cls: filterPago === 'rojo'    ? 'bg-destructive/20 text-destructive border-destructive'                                                         : 'bg-card text-muted-foreground border-border hover:border-destructive/50' },
                            ].map(({ value, label, count, cls }) => (
                                <button key={value} onClick={() => setFilterPago(value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${cls}`}>
                                    {label}
                                    <span className="text-[10px] opacity-70">({count})</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center border border-border border-dashed rounded-xl bg-muted/20">
                            <Briefcase size={32} className="mb-4 opacity-50" />
                            <p className="font-medium">No se encontraron proyectos</p>
                            <p className="text-sm">Intenta con otra búsqueda o crea uno nuevo.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.map(project => {
                                const pagos = projectPayments[project.id] || [];
                                const totalPaid = parseFloat(project.monto_pagado || 0);
                                const agreedAmount = parseFloat(project.monto_acordado || 0);
                                const progress = agreedAmount > 0 ? (totalPaid / agreedAmount) * 100 : 0;

                                return (
                                    <div key={project.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
                                                        {project.codigo_interno || 'N/A'}
                                                    </span>
                                                    {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (
                                                        <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border bg-[hsl(var(--purple-premium))]/10 text-[hsl(var(--purple-premium))] border-[hsl(var(--purple-premium))]/30">
                                                            <Repeat size={9} /> {project.ciclo_facturacion}
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const badge = getPaymentAlertBadge(project.estado_alerta_pago);
                                                        if (!badge) return null;
                                                        return (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badge.cls}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <h4 className="font-semibold text-foreground text-base tracking-tight">{project.nombre}</h4>
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">{project.tipo_nombre}</span>
                                                    {project.nombre_cliente && (
                                                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                            <User size={10} /> {project.nombre_cliente}
                                                        </span>
                                                    )}
                                                    {project.rut_cliente && <span className="text-xs text-muted-foreground">RUT: {project.rut_cliente}</span>}
                                                    {project.email_cliente && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                                            <Mail size={10} className="shrink-0" />
                                                            {project.email_cliente}
                                                            {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (
                                                                <span
                                                                    title="Recordatorios automáticos activados para este cliente"
                                                                    className="text-[9px] px-1 py-0.5 rounded border bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] border-[hsl(var(--emerald-premium))]/30 font-medium shrink-0"
                                                                >
                                                                    recordatorios activos
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {project.telefono_cliente && <span className="text-xs text-muted-foreground">Tel: {project.telefono_cliente}</span>}
                                                    {project.url_cobro_mercadopago && (
                                                        <a
                                                            href={project.url_cobro_mercadopago.startsWith('http') ? project.url_cobro_mercadopago : `https://${project.url_cobro_mercadopago}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-[hsl(var(--emerald-premium))] flex items-center gap-1 hover:underline"
                                                            title="Link de cobro Mercado Pago"
                                                        >
                                                            <ExternalLink size={10} className="shrink-0" /> Link MP
                                                        </a>
                                                    )}
                                                    {project.profesion_cliente && <span className="text-xs text-muted-foreground">Giro: {project.profesion_cliente}</span>}
                                                    {project.fecha_entrega && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Calendar size={10} />
                                                            Entrega: {fmtDate(project.fecha_entrega)}
                                                        </span>
                                                    )}
                                                    {project.fecha_proximo_pago && project.ciclo_facturacion !== 'Unico' && (
                                                        <span className={`text-xs flex items-center gap-1 mt-0.5 font-medium ${
                                                            project.estado_alerta_pago === 'rojo' ? 'text-destructive' :
                                                            project.estado_alerta_pago === 'naranja' ? 'text-[hsl(var(--gold))]' :
                                                            'text-[hsl(var(--emerald-premium))]'
                                                        }`}>
                                                            <Calendar size={10} />
                                                            Próximo pago: {fmtDate(project.fecha_proximo_pago)}
                                                            {project.dias_para_vencer !== null && project.dias_para_vencer !== undefined && (
                                                                <span> · {project.dias_para_vencer >= 0 ? `${project.dias_para_vencer}d` : `${Math.abs(project.dias_para_vencer)}d vencido`}</span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {project.observaciones && (
                                                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            Obs: {project.observaciones}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="relative group/status">
                                                    {(() => {
                                                        const bp = getStatusBadgeProps(project.estado_nombre, project.estado_color);
                                                        return <span className={bp.className} style={bp.style}>{project.estado_nombre || '—'}</span>;
                                                    })()}
                                                    <select className="absolute inset-0 opacity-0 cursor-pointer"
                                                        value={project.estado_nombre}
                                                        onChange={(e) => handleStatusChange(project.id, e.target.value)}>
                                                        {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditOpen(project)}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1" title="Editar Proyecto">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteProject(project.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Eliminar Proyecto">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-5">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Acordado</span>
                                                <span className="text-foreground font-medium">{agreedAmount.toLocaleString('es-CL')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Pagado</span>
                                                <span className="text-[hsl(var(--emerald-premium))] font-medium">{totalPaid.toLocaleString('es-CL')}</span>
                                            </div>
                                        </div>

                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
                                            <div className="h-full bg-[hsl(var(--emerald-premium))] transition-all duration-500"
                                                style={{ width: `${Math.min(progress, 100)}%` }} />
                                        </div>

                                        {project.ciclo_facturacion && project.ciclo_facturacion !== 'Unico' && (project.estado_alerta_pago === 'naranja' || project.estado_alerta_pago === 'rojo') && (
                                            <button
                                                onClick={() => handleQuickPago(project)}
                                                disabled={quickPayLoadingId === project.id}
                                                className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[hsl(var(--emerald-premium))]/40 bg-[hsl(var(--emerald-premium))]/10 text-[hsl(var(--emerald-premium))] text-xs font-medium hover:bg-[hsl(var(--emerald-premium))]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle2 size={13} />
                                                {quickPayLoadingId === project.id ? 'Registrando...' : 'Marcar suscripción pagada'}
                                            </button>
                                        )}

                                        {pagos.length > 0 && (
                                            <div className="mb-3">
                                                <button onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground transition-colors">
                                                    <span className="flex items-center gap-2">
                                                        <Receipt size={12} />
                                                        {pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado{pagos.length !== 1 ? 's' : ''}
                                                    </span>
                                                    {expandedProject === project.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                {expandedProject === project.id && (
                                                    <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                        {[...pagos].reverse().map((payment, idx) => (
                                                            <div key={payment.id_proyecto_pago || idx} className="flex items-center justify-between p-2.5 bg-[hsl(var(--emerald-premium))]/5 border border-[hsl(var(--emerald-premium))]/10 rounded-lg gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium text-foreground truncate">{payment.concepto || 'Pago'}</p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {payment.fecha_pago ? fmtDate(payment.fecha_pago) : 'Sin fecha'}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-bold text-[hsl(var(--emerald-premium))] shrink-0">
                                                                    +{Math.round(parseFloat(payment.monto || 0)).toLocaleString('es-CL')}
                                                                </span>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => handleEditPaymentOpen(payment, project)}
                                                                        className="p-1 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                                        title="Editar pago"
                                                                    >
                                                                        <Pencil size={11} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePayment(payment, project)}
                                                                        className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                                        title="Eliminar pago"
                                                                    >
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button onClick={() => {
                                            setIncomeForm({ ...incomeForm, projectId: project.id });
                                            setActiveTab('new-income');
                                        }}
                                            className="w-full py-2 rounded-lg bg-[hsl(var(--emerald-premium))] text-white text-xs font-medium hover:bg-[hsl(var(--emerald-light))] transition-colors">
                                            Agregar Pago
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        {/* Edit Project Modal */}
        {editProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => e.target === e.currentTarget && handleEditClose()}>
                <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Pencil size={18} className="text-primary" />
                            Editar Proyecto
                        </h3>
                        <button onClick={handleEditClose}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary">
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                        <Input label="Nombre del Proyecto" placeholder="Ej: E-commerce Cliente X"
                            value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Tipo" value={editForm.type}
                                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} required>
                                {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </Select>
                            <Select label="Estado" value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} required>
                                {projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <Input label="Monto Acordado" type="number" placeholder="0" min="0" step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                            value={editForm.agreedAmount} onChange={(e) => setEditForm({ ...editForm, agreedAmount: e.target.value })} required />

                        <div className="pt-3 border-t border-border">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <User size={14} /> Datos del Cliente
                            </h4>
                            <div className="space-y-3">
                                <Input label="Nombre Completo" placeholder="Nombre del cliente"
                                    value={editForm.clientName} onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="RUT / ID" placeholder="12.345.678-9"
                                        value={editForm.clientRut} onChange={(e) => setEditForm({ ...editForm, clientRut: e.target.value })} required />
                                    <Input label="Teléfono" placeholder="+56 9..."
                                        value={editForm.clientPhone} onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })} required />
                                </div>
                                <Input label="Email" type="email" placeholder="cliente@email.com"
                                    value={editForm.clientEmail} onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })} required />
                                <Input label="Profesión / Giro (Opcional)" placeholder="Ej: Abogado, Retail..."
                                    value={editForm.clientProfession} onChange={(e) => setEditForm({ ...editForm, clientProfession: e.target.value })} />
                                <Input label="Fecha de Entrega (Opcional)" type="date"
                                    value={editForm.deliveryDate} onChange={(e) => setEditForm({ ...editForm, deliveryDate: e.target.value })} />
                                <Input label="Observaciones (Opcional)" placeholder="Notas del proyecto/cliente"
                                    value={editForm.observations} onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })} />
                                <Input label="Link de cobro Mercado Pago (Opcional)" type="url" placeholder="https://mpago.la/..."
                                    value={editForm.urlCobroMp || ''} onChange={(e) => setEditForm({ ...editForm, urlCobroMp: e.target.value })} />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                                <Repeat size={14} /> Ciclo de Facturación
                            </h4>
                            <div className="space-y-3">
                                <Select label="Tipo de Ciclo" value={editForm.ciclo || 'Unico'}
                                    onChange={(e) => setEditForm({ ...editForm, ciclo: e.target.value })}>
                                    <option value="Unico">Pago Único</option>
                                    <option value="Mensual">Mensual</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Anual">Anual</option>
                                </Select>
                                {(editForm.ciclo && editForm.ciclo !== 'Unico') && (<>
                                    <Input label="Inicio del Servicio" type="date"
                                        value={editForm.fechaInicioServicio || ''}
                                        onChange={(e) => setEditForm({ ...editForm, fechaInicioServicio: e.target.value })} />
                                    <Input label="Próximo Pago" type="date"
                                        value={editForm.fechaProximoPago || ''}
                                        onChange={(e) => setEditForm({ ...editForm, fechaProximoPago: e.target.value })} />
                                </>)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/40">
                            <div>
                                <p className="text-sm font-medium text-foreground">Afecto a IVA</p>
                                <p className="text-xs text-muted-foreground">Genera débito fiscal en F29 (19%)</p>
                            </div>
                            <button type="button"
                                onClick={() => setEditForm({ ...editForm, afectoIva: !editForm.afectoIva })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.afectoIva ? 'bg-violet-500' : 'bg-border'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editForm.afectoIva ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={handleEditClose}
                                className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors text-sm font-medium">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isEditLoading}
                                className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isEditLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal editar pago */}
        {editPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={(e) => e.target === e.currentTarget && setEditPayment(null)}>
                <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <h3 className="font-semibold text-foreground text-sm">Editar Pago</h3>
                        <button onClick={() => setEditPayment(null)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/6 rounded-lg transition-colors">
                            <X size={15} />
                        </button>
                    </div>
                    <form onSubmit={handleEditPaymentSubmit} className="p-5 space-y-3">
                        <Input label="Concepto" placeholder="Ej: Anticipo 50%, Cuota 1..."
                            value={editPaymentForm.concepto}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, concepto: e.target.value })}
                            required />
                        <Input label="Monto" type="number" placeholder="0" min="0" step="1"
                            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                            value={editPaymentForm.monto}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, monto: e.target.value })}
                            required />
                        <Input label="Fecha de Pago" type="date"
                            value={editPaymentForm.fecha_pago}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, fecha_pago: e.target.value })}
                            required />
                        <Input label="N° Comprobante (opcional)" placeholder="Ej: 00123"
                            value={editPaymentForm.numero_comprobante}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, numero_comprobante: e.target.value })} />
                        <Input label="Notas (opcional)" placeholder="Notas adicionales"
                            value={editPaymentForm.notas}
                            onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notas: e.target.value })} />
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setEditPayment(null)}
                                className="flex-1 border border-border text-muted-foreground font-medium py-2.5 rounded-lg hover:bg-foreground/5 transition-colors text-sm">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isPaymentEditLoading}
                                className="flex-1 bg-primary text-primary-foreground font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                {isPaymentEditLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </div>
    );
}
