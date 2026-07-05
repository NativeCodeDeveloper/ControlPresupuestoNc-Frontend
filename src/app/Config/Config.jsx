'use client';

import { createElement, useState, useEffect } from 'react';
import * as configService from '../../services/configService';
import * as partnersService from '../../services/partnersService';
import * as costsService from '../../services/costsService';
import * as synapseService from '../../services/synapseService';
import apiClient from '../../services/apiClient';
import {
    Settings,
    Shield,
    PiggyBank,
    TrendingUp,
    Save,
    Users,
    Trash2,
    Bell,
    Tag,
    Activity,
    Brain,
    Plus,
    GripVertical,
    CheckCircle2,
    Circle,
    Receipt
} from 'lucide-react';

const Section = ({ title, icon, children }) => (
    <div className="bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="px-6 py-5 border-b border-border/50 bg-secondary/20 flex items-center gap-3 backdrop-blur-sm">
            <div className="p-2 bg-foreground/10 rounded-lg text-foreground">
                {icon ? createElement(icon, { size: 18 }) : null}
            </div>
            <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

export default function Config() {
    // Estados para datos del backend
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingFinancialConfig, setIsSavingFinancialConfig] = useState(false);
    const [financialConfigError, setFinancialConfigError] = useState(null);
    const [projectTypesData, setProjectTypesData] = useState([]);
    const [projectStatusesData, setProjectStatusesData] = useState([]);
    const [servicesData, setServicesData] = useState([]);
    const [variableCostTypesData, setVariableCostTypesData] = useState([]);
    const [partnersData, setPartnersData] = useState([]);
    const [financialConfig, setFinancialConfig] = useState({
        emergencyFundPercentage: 0,
        reinvestmentPercentage: 0,
        tasaPpm: 1
    });

    // Synapse
    const [synapseEstados, setSynapseEstados] = useState([]);
    const [synapseEtiquetas, setSynapseEtiquetas] = useState([]);
    const [synapseTeams, setSynapseTeams] = useState([]);
    const [newEstadoForm, setNewEstadoForm] = useState({ nombre: '', color_hex: '#3B82F6', es_final: false });
    const [newEtiquetaForm, setNewEtiquetaForm] = useState({ nombre: '', color_hex: '#8B5CF6' });
    const [newTeamForm, setNewTeamForm] = useState({ nombre: '', emoji: '👥', color_hex: '#8B5CF6' });

    // Normalizar socio del backend
    const normalizePartner = (p) => ({
        ...p,
        name: p.nombre || p.name || 'Sin Nombre',
        percentage: parseFloat(p.porcentaje_participacion || p.percentage || 0)
    });

    // Cargar datos del backend cuando monta
    useEffect(() => {
        const loadData = async () => {
            try {
                const [types, statuses, services, costTypes, config, partners, synEstados, synEtiquetas, synTeams] = await Promise.all([
                    configService.getProjectTypes(),
                    configService.getProjectStatuses(),
                    costsService.getServices(),
                    configService.getVariableCostTypes(),
                    configService.getFinancialConfig(),
                    partnersService.getPartners(),
                    synapseService.getEstados(),
                    synapseService.getEtiquetas(),
                    synapseService.getTeams(),
                ]);
                if (synEstados && Array.isArray(synEstados)) setSynapseEstados(synEstados);
                if (synEtiquetas && Array.isArray(synEtiquetas)) setSynapseEtiquetas(synEtiquetas);
                if (synTeams && Array.isArray(synTeams)) setSynapseTeams(synTeams);

                if (types && Array.isArray(types)) setProjectTypesData(types);
                if (statuses && Array.isArray(statuses)) setProjectStatusesData(statuses);
                if (services && Array.isArray(services)) setServicesData(services);
                if (costTypes && Array.isArray(costTypes)) setVariableCostTypesData(costTypes);
                if (config && config.porcentaje_fondo_emergencia !== undefined) {
                    setFinancialConfig({
                        emergencyFundPercentage: parseFloat(config.porcentaje_fondo_emergencia || 0),
                        reinvestmentPercentage: parseFloat(config.porcentaje_reinversion || 0),
                        tasaPpm: parseFloat(config.tasa_ppm || 1)
                    });
                }
                if (partners && Array.isArray(partners)) setPartnersData(partners.map(normalizePartner));
            } catch (error) {
                console.error('Error cargando configuración:', error);
            }
        };
        loadData();
    }, []);

    // Guardar configuración financiera al backend
    const handleFinancialConfigChange = (key, value) => {
        setFinancialConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleFinancialConfigSave = async () => {
        if (isSavingFinancialConfig) return;
        setFinancialConfigError(null);

        const emergency = parseFloat(financialConfig.emergencyFundPercentage || 0);
        const reinversion = parseFloat(financialConfig.reinvestmentPercentage || 0);
        if (emergency + reinversion > 100) {
            setFinancialConfigError('La suma de ambos fondos no puede superar el 100%');
            return;
        }

        setIsSavingFinancialConfig(true);
        try {
            const ppm = parseFloat(financialConfig.tasaPpm || 1);
            const result = await configService.updateFinancialConfig({
                porcentaje_fondo_emergencia: emergency,
                porcentaje_reinversion: reinversion,
                tasa_ppm: ppm
            });

            if (result?.ok && result?.data) {
                setFinancialConfig({
                    emergencyFundPercentage: parseFloat(result.data.porcentaje_fondo_emergencia || 0),
                    reinvestmentPercentage: parseFloat(result.data.porcentaje_reinversion || 0),
                    tasaPpm: parseFloat(result.data.tasa_ppm || 1)
                });
                return;
            }

            const freshConfig = await configService.getFinancialConfig();
            if (freshConfig && freshConfig.porcentaje_fondo_emergencia !== undefined) {
                setFinancialConfig({
                    emergencyFundPercentage: parseFloat(freshConfig.porcentaje_fondo_emergencia || 0),
                    reinvestmentPercentage: parseFloat(freshConfig.porcentaje_reinversion || 0),
                    tasaPpm: parseFloat(freshConfig.tasa_ppm || 1)
                });
            }
        } catch (error) {
            console.error('Error guardando config financiera:', error);
            setFinancialConfigError('Error al guardar la configuración. Intenta nuevamente.');
        } finally {
            setIsSavingFinancialConfig(false);
        }
    };

    // === TIPOS DE PROYECTO ===
    const [newTypeForm, setNewTypeForm] = useState({ nombre: '', precio: '' });

    const handleAddProjectType = async () => {
        if (!newTypeForm.nombre.trim()) return;
        setIsLoading(true);
        try {
            const result = await configService.addProjectType({
                nombre: newTypeForm.nombre,
                precio_base: newTypeForm.precio ? Number(newTypeForm.precio) : null
            });
            if (result && result.ok) {
                const fresh = await configService.getProjectTypes();
                if (fresh && Array.isArray(fresh)) setProjectTypesData(fresh);
                setNewTypeForm({ nombre: '', precio: '' });
            }
        } catch (error) {
            console.error('Error agregando tipo proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProjectTypePrice = async (type, newPrice) => {
        const id = typeof type === 'string' ? null : type.id;
        if (!id) return;
        try {
            await apiClient.patch(`/api/catalogos/tipos-proyecto/${id}/precio`, {
                precio_base: newPrice ? Number(newPrice) : null
            });
            const fresh = await configService.getProjectTypes();
            if (fresh && Array.isArray(fresh)) setProjectTypesData(fresh);
        } catch (error) {
            console.error('Error actualizando precio:', error);
        }
    };

    const handleRemoveProjectType = async (type) => {
        const id = typeof type === 'string' ? null : type.id;
        if (!id) return;
        setIsLoading(true);
        try {
            const deleted = await configService.deleteProjectType(id);
            if (deleted) {
                const fresh = await configService.getProjectTypes();
                if (fresh && Array.isArray(fresh)) setProjectTypesData(fresh);
            }
        } catch (error) {
            console.error('Error eliminando tipo proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === ESTADOS DE PROYECTO ===
    const handleAddProjectStatus = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await configService.addProjectStatus({ nombre: name });
            if (result && result.ok) {
                const fresh = await configService.getProjectStatuses();
                if (fresh && Array.isArray(fresh)) setProjectStatusesData(fresh);
            }
        } catch (error) {
            console.error('Error agregando estado proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveProjectStatus = async (status) => {
        const id = typeof status === 'string' ? null : status.id;
        if (!id) return;
        setIsLoading(true);
        try {
            const deleted = await configService.deleteProjectStatus(id);
            if (deleted) {
                const fresh = await configService.getProjectStatuses();
                if (fresh && Array.isArray(fresh)) setProjectStatusesData(fresh);
            }
        } catch (error) {
            console.error('Error eliminando estado proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === SERVICIOS ===
    const handleAddService = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await costsService.addService(name);
            if (result && result.ok) {
                const fresh = await costsService.getServices();
                if (fresh && Array.isArray(fresh)) setServicesData(fresh);
            }
        } catch (error) {
            console.error('Error agregando servicio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveService = async (service) => {
        const id = typeof service === 'string' ? null : service.id;
        if (!id) return;
        setIsLoading(true);
        try {
            const deleted = await costsService.deleteService(id);
            if (deleted) {
                const fresh = await costsService.getServices();
                if (fresh && Array.isArray(fresh)) setServicesData(fresh);
            }
        } catch (error) {
            console.error('Error eliminando servicio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === TIPOS DE COSTOS VARIABLES ===
    const handleAddVariableCostType = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await configService.addVariableCostType({ nombre: name });
            if (result && result.ok) {
                const fresh = await configService.getVariableCostTypes();
                if (fresh && Array.isArray(fresh)) setVariableCostTypesData(fresh);
            }
        } catch (error) {
            console.error('Error agregando tipo costo variable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveVariableCostType = async (type) => {
        const id = typeof type === 'string' ? null : type.id;
        if (!id) return;
        setIsLoading(true);
        try {
            const deleted = await configService.deleteVariableCostType(id);
            if (deleted) {
                const fresh = await configService.getVariableCostTypes();
                if (fresh && Array.isArray(fresh)) setVariableCostTypesData(fresh);
            }
        } catch (error) {
            console.error('Error eliminando tipo costo variable:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === SOCIOS ===
    const handleAddPartner = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await partnersService.addPartner({ nombre: name, porcentaje_participacion: 0 });
            if (result && result.ok) {
                const fresh = await partnersService.getPartners();
                if (fresh && Array.isArray(fresh)) setPartnersData(fresh.map(normalizePartner));
            }
        } catch (error) {
            console.error('Error agregando socio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePartner = async (partner) => {
        setIsLoading(true);
        try {
            const deleted = await partnersService.deletePartner(partner.id);
            if (!deleted) return;
            const fresh = await partnersService.getPartners();
            if (fresh && Array.isArray(fresh)) setPartnersData(fresh.map(normalizePartner));
        } catch (error) {
            console.error('Error eliminando socio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // === SYNAPSE: TEAMS ===
    const handleAddSynapseTeam = async () => {
        if (!newTeamForm.nombre.trim()) return;
        const saved = { ...newTeamForm };
        setNewTeamForm({ nombre: '', emoji: '👥', color_hex: '#8B5CF6' });
        const tempId = `temp_${Date.now()}`;
        setSynapseTeams(prev => [...prev, { id_team: tempId, ...saved }]);
        try {
            const created = await synapseService.createTeam(saved);
            setSynapseTeams(prev => prev.map(t => t.id_team === tempId ? created : t));
        } catch (e) {
            console.error('Error creando team Synapse:', e);
            setSynapseTeams(prev => prev.filter(t => t.id_team !== tempId));
        }
    };

    const handleDeleteSynapseTeam = async (id) => {
        setSynapseTeams(prev => prev.filter(t => t.id_team !== id));
        try {
            await synapseService.deleteTeam(id);
        } catch (e) {
            console.error('Error eliminando team Synapse:', e);
            const fresh = await synapseService.getTeams();
            if (Array.isArray(fresh)) setSynapseTeams(fresh);
        }
    };

    // === SYNAPSE: ESTADOS ===
    const handleAddSynapseEstado = async () => {
        if (!newEstadoForm.nombre.trim()) return;
        setIsLoading(true);
        try {
            await synapseService.createEstado(newEstadoForm);
            const fresh = await synapseService.getEstados();
            if (Array.isArray(fresh)) setSynapseEstados(fresh);
            setNewEstadoForm({ nombre: '', color_hex: '#3B82F6', es_final: false });
        } catch (e) {
            console.error('Error creando estado Synapse:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSynapseEstado = async (id) => {
        setIsLoading(true);
        try {
            await synapseService.deleteEstado(id);
            const fresh = await synapseService.getEstados();
            if (Array.isArray(fresh)) setSynapseEstados(fresh);
        } catch (e) {
            alert(e.message || 'No se pudo eliminar el estado.');
        } finally {
            setIsLoading(false);
        }
    };

    // === SYNAPSE: ETIQUETAS ===
    const handleAddSynapseEtiqueta = async () => {
        if (!newEtiquetaForm.nombre.trim()) return;
        setIsLoading(true);
        try {
            await synapseService.createEtiqueta(newEtiquetaForm);
            const fresh = await synapseService.getEtiquetas();
            if (Array.isArray(fresh)) setSynapseEtiquetas(fresh);
            setNewEtiquetaForm({ nombre: '', color_hex: '#8B5CF6' });
        } catch (e) {
            console.error('Error creando etiqueta Synapse:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSynapseEtiqueta = async (id) => {
        setIsLoading(true);
        try {
            await synapseService.deleteEtiqueta(id);
            const fresh = await synapseService.getEtiquetas();
            if (Array.isArray(fresh)) setSynapseEtiquetas(fresh);
        } catch (e) {
            console.error('Error eliminando etiqueta Synapse:', e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                <div className="h-12 w-12 bg-[hsl(var(--purple-premium))]/20 rounded-2xl flex items-center justify-center border border-[hsl(var(--purple-premium))]/30">
                    <Settings className="text-[hsl(var(--purple-premium))]" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h2>
                    <p className="text-sm text-muted-foreground mt-1">Administra preferencias y datos del sistema</p>
                </div>
            </div>

            <div className="space-y-8">
                <Section title="Deducciones Automáticas" icon={PiggyBank}>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        Configura los porcentajes que se descontarán automáticamente de las utilidades operativas antes de la distribución a socios.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-[hsl(var(--emerald-premium))]/20 p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-[hsl(var(--emerald-premium))]/5 to-transparent">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[hsl(var(--emerald-premium))]/20 rounded-lg text-[hsl(var(--emerald-premium))]">
                                    <Shield size={20} />
                                </div>
                                <h4 className="font-semibold text-foreground text-sm">Fondo de Emergencia</h4>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={financialConfig.emergencyFundPercentage}
                                        onChange={(e) => handleFinancialConfigChange('emergencyFundPercentage', e.target.value)}
                                        onBlur={handleFinancialConfigSave}
                                        className="w-full bg-[hsl(var(--emerald-premium))]/10 border border-[hsl(var(--emerald-premium))]/30 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--emerald-premium))]/30 text-[hsl(var(--emerald-premium))]"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Ahorro imprevistos</p>
                        </div>

                        <div className="bg-card border border-[hsl(var(--purple-premium))]/20 p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-[hsl(var(--purple-premium))]/5 to-transparent">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-[hsl(var(--purple-premium))]/20 rounded-lg text-[hsl(var(--purple-premium))]">
                                    <TrendingUp size={20} />
                                </div>
                                <h4 className="font-semibold text-foreground text-sm">Fondo de Reinversión</h4>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={financialConfig.reinvestmentPercentage}
                                        onChange={(e) => handleFinancialConfigChange('reinvestmentPercentage', e.target.value)}
                                        onBlur={handleFinancialConfigSave}
                                        className="w-full bg-[hsl(var(--purple-premium))]/10 border border-[hsl(var(--purple-premium))]/30 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--purple-premium))]/30 text-[hsl(var(--purple-premium))]"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Crecimiento / Marketing</p>
                        </div>

                        <div className="bg-card border border-violet-500/20 p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-violet-500/5 to-transparent">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-500">
                                    <Receipt size={20} />
                                </div>
                                <h4 className="font-semibold text-foreground text-sm">Tasa PPM (F29)</h4>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={financialConfig.tasaPpm}
                                        onChange={(e) => handleFinancialConfigChange('tasaPpm', e.target.value)}
                                        onBlur={handleFinancialConfigSave}
                                        className="w-full bg-violet-500/10 border border-violet-500/30 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-violet-500"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                    />
                                </div>
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Pago provisional mensual SII</p>
                        </div>
                    </div>
                    {financialConfigError && (
                        <p className="mt-3 text-sm text-rose-500">{financialConfigError}</p>
                    )}
                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            onClick={handleFinancialConfigSave}
                            disabled={isSavingFinancialConfig}
                            className="inline-flex items-center gap-2 bg-[hsl(var(--corporate-blue))] text-white text-sm font-semibold px-4 py-2.5 rounded-lg border border-[hsl(var(--corporate-blue))] shadow-sm hover:opacity-95 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--corporate-blue))]/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            {isSavingFinancialConfig ? 'Guardando...' : 'Guardar porcentajes'}
                        </button>
                    </div>
                </Section>

                {/* Services Management */}
                <Section title="Servicios y Costos Recurrentes" icon={Shield}>
                    <p className="text-sm text-muted-foreground mb-4">
                        Define los servicios que paga la empresa (Hosting, Software, etc.) para seleccionarlos rápidamente al registrar gastos.
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nuevo servicio..."
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddService(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                disabled={isLoading}
                                className="bg-[hsl(var(--copper))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--copper-light))] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        handleAddService(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(servicesData || []).map(service => {
                                const name = typeof service === 'string' ? service : service.nombre;
                                const key = typeof service === 'string' ? service : service.id;
                                return (
                                <div key={key} className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full text-sm animate-in zoom-in-50 duration-200">
                                    <span>{name}</span>
                                    <button
                                        onClick={() => handleRemoveService(service)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </Section>

                {/* Variable Cost Categories */}
                <Section title="Categorías de Gastos Variables" icon={Tag}>
                    <p className="text-sm text-muted-foreground mb-4">
                        Define los tipos de gastos variables (ej: Freelancer, Plugin, Comisión) para seleccionarlos al registrar gastos.
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nueva categoría..."
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddVariableCostType(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                disabled={isLoading}
                                className="bg-[hsl(var(--copper))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--copper-light))] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        handleAddVariableCostType(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(variableCostTypesData || []).map(type => {
                                const name = typeof type === 'string' ? type : type.nombre;
                                const key = typeof type === 'string' ? type : type.id;
                                return (
                                <div key={key} className="flex items-center gap-2 bg-[hsl(var(--copper))]/10 border border-[hsl(var(--copper))]/20 px-3 py-1.5 rounded-full text-sm text-[hsl(var(--copper))]">
                                    <span>{name}</span>
                                    <button
                                        onClick={() => handleRemoveVariableCostType(type)}
                                        className="text-[hsl(var(--copper))]/70 hover:text-destructive transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </Section>

                {/* Project Categories */}
                <Section title="Categorías de Proyectos" icon={Bell}>
                    <p className="text-sm text-muted-foreground mb-4">
                        El precio base se auto-completa al seleccionar la categoría al crear un proyecto.
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nueva categoría..."
                                value={newTypeForm.nombre}
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setNewTypeForm(f => ({ ...f, nombre: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProjectType(); }}
                            />
                            <input
                                type="number"
                                placeholder="Precio base"
                                value={newTypeForm.precio}
                                min="0"
                                className="w-32 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setNewTypeForm(f => ({ ...f, precio: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddProjectType(); }}
                            />
                            <button
                                disabled={isLoading}
                                className="bg-[hsl(var(--turquoise-premium))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--turquoise-light))] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleAddProjectType}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(projectTypesData || []).map(type => {
                                const name = typeof type === 'string' ? type : type.nombre;
                                const key = typeof type === 'string' ? type : type.id;
                                const precio = typeof type === 'object' ? type.precio_base : null;
                                return (
                                <div key={key} className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-2 rounded-xl text-sm">
                                    <span className="flex-1 font-medium">{name}</span>
                                    <input
                                        type="number"
                                        defaultValue={precio || ''}
                                        placeholder="Sin precio"
                                        min="0"
                                        className="w-28 text-right bg-transparent border border-border/50 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                                        onBlur={(e) => handleUpdateProjectTypePrice(type, e.target.value)}
                                    />
                                    <span className="text-[10px] text-muted-foreground">CLP</span>
                                    <button
                                        onClick={() => handleRemoveProjectType(type)}
                                        className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                    >
                                        &times;
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </Section>

                {/* Project Statuses */}
                <Section title="Estados de Proyectos" icon={Activity}>
                    <p className="text-sm text-muted-foreground mb-4">
                        Define los estados disponibles para los proyectos (ej: Lead, En desarrollo, Entregado).
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nuevo estado..."
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddProjectStatus(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                disabled={isLoading}
                                className="bg-[hsl(var(--turquoise-premium))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--turquoise-light))] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        handleAddProjectStatus(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(projectStatusesData || []).map(status => {
                                const name = typeof status === 'string' ? status : status.nombre;
                                const key = typeof status === 'string' ? status : status.id;
                                return (
                                <div key={key} className="flex items-center gap-2 bg-[hsl(var(--turquoise-premium))]/10 border border-[hsl(var(--turquoise-premium))]/20 px-3 py-1.5 rounded-full text-sm text-[hsl(var(--turquoise-premium))]">
                                    <span>{name}</span>
                                    <button
                                        onClick={() => handleRemoveProjectStatus(status)}
                                        className="text-[hsl(var(--turquoise-premium))]/70 hover:text-destructive transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </Section>

                <Section title="Socios" icon={Users}>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nombre del nuevo socio..."
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddPartner(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                disabled={isLoading}
                                className="bg-[hsl(var(--gold))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--gold-dark))] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        handleAddPartner(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {(partnersData || []).map(partner => (
                                <div key={partner.id} className="flex items-center justify-between bg-secondary/50 border border-border px-4 py-3 rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold">
                                            {partner.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{partner.name || 'Sin Nombre'}</p>
                                            <p className="text-xs text-muted-foreground">{partner.percentage || 0}% Participación</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemovePartner(partner)}
                                        disabled={isLoading}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-2 disabled:opacity-50"
                                        title="Eliminar Socio"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Synapse: Teams ── */}
                <Section title="Synapse — Equipos de Trabajo" icon={Brain}>
                    <p className="text-sm text-muted-foreground mb-5">
                        Define los equipos o grupos de trabajo. Las tareas del tablero pueden asignarse a un equipo para filtrarlas y verlas por separado.
                    </p>

                    <div className="space-y-2 mb-5">
                        {synapseTeams.map(team => (
                            <div key={team.id_team} className="flex items-center gap-3 bg-secondary/40 border border-border/40 rounded-xl px-4 py-3">
                                <span className="text-sm font-medium text-foreground flex-1">{team.nombre}</span>
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color_hex }} />
                                <button
                                    onClick={() => handleDeleteSynapseTeam(team.id_team)}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/8 disabled:opacity-40"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {!synapseTeams.length && (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay equipos configurados aún.</p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 items-end">
                        <input
                            type="text"
                            placeholder="Nombre del equipo..."
                            value={newTeamForm.nombre}
                            onChange={(e) => setNewTeamForm(f => ({ ...f, nombre: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSynapseTeam(); }}
                            className="flex-1 min-w-36 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color</label>
                            <input
                                type="color"
                                value={newTeamForm.color_hex}
                                onChange={(e) => setNewTeamForm(f => ({ ...f, color_hex: e.target.value }))}
                                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={handleAddSynapseTeam}
                            disabled={isLoading || !newTeamForm.nombre.trim()}
                            className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Agregar
                        </button>
                    </div>
                </Section>

                {/* ── Synapse: Estados ── */}
                <Section title="Synapse — Estados del Kanban" icon={Brain}>
                    <p className="text-sm text-muted-foreground mb-5">
                        Define las columnas del tablero Kanban. Los estados marcados como <strong>Final</strong> registran la fecha de completado al mover una tarea.
                    </p>

                    {/* Listado */}
                    <div className="space-y-2 mb-5">
                        {synapseEstados.map(est => (
                            <div key={est.id_estado} className="flex items-center gap-3 bg-secondary/40 border border-border/40 rounded-xl px-4 py-3">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: est.color_hex }} />
                                <span className="text-sm font-medium text-foreground flex-1">{est.nombre}</span>
                                {est.es_final ? (
                                    <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                                        <CheckCircle2 size={11} /> Final
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Circle size={11} /> En progreso
                                    </span>
                                )}
                                <button
                                    onClick={() => handleDeleteSynapseEstado(est.id_estado)}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/8 disabled:opacity-40"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {!synapseEstados.length && (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay estados configurados aún.</p>
                        )}
                    </div>

                    {/* Formulario nuevo estado */}
                    <div className="flex flex-wrap gap-2 items-end">
                        <input
                            type="text"
                            placeholder="Nombre del estado..."
                            value={newEstadoForm.nombre}
                            onChange={(e) => setNewEstadoForm(f => ({ ...f, nombre: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSynapseEstado(); }}
                            className="flex-1 min-w-36 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color</label>
                            <input
                                type="color"
                                value={newEstadoForm.color_hex}
                                onChange={(e) => setNewEstadoForm(f => ({ ...f, color_hex: e.target.value }))}
                                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={newEstadoForm.es_final}
                                onChange={(e) => setNewEstadoForm(f => ({ ...f, es_final: e.target.checked }))}
                                className="rounded"
                            />
                            Es final
                        </label>
                        <button
                            onClick={handleAddSynapseEstado}
                            disabled={isLoading || !newEstadoForm.nombre.trim()}
                            className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Agregar
                        </button>
                    </div>
                </Section>

                <Section title="Synapse — Etiquetas" icon={Tag}>
                    <p className="text-sm text-muted-foreground mb-5">
                        Las etiquetas permiten categorizar tareas para filtrarlas rápidamente en el tablero.
                    </p>

                    {/* Listado */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {synapseEtiquetas.map(et => (
                            <div key={et.id_etiqueta} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50" style={{ background: et.color_hex + '22' }}>
                                <span className="text-xs font-medium" style={{ color: et.color_hex }}>{et.nombre}</span>
                                <button
                                    onClick={() => handleDeleteSynapseEtiqueta(et.id_etiqueta)}
                                    disabled={isLoading}
                                    className="ml-1 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                        {!synapseEtiquetas.length && (
                            <p className="text-sm text-muted-foreground">No hay etiquetas aún.</p>
                        )}
                    </div>

                    {/* Formulario nueva etiqueta */}
                    <div className="flex gap-2 items-center flex-wrap">
                        <input
                            type="text"
                            placeholder="Nombre de la etiqueta..."
                            value={newEtiquetaForm.nombre}
                            onChange={(e) => setNewEtiquetaForm(f => ({ ...f, nombre: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddSynapseEtiqueta(); }}
                            className="flex-1 min-w-36 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color</label>
                            <input
                                type="color"
                                value={newEtiquetaForm.color_hex}
                                onChange={(e) => setNewEtiquetaForm(f => ({ ...f, color_hex: e.target.value }))}
                                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={handleAddSynapseEtiqueta}
                            disabled={isLoading || !newEtiquetaForm.nombre.trim()}
                            className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Agregar
                        </button>
                    </div>
                </Section>
            </div>
        </div>
    );
}
