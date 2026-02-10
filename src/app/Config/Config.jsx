import { useFinance } from '../../context/FinanceContext';
import * as configService from '../../services/configService';
import * as projectsService from '../../services/projectsService';
import * as costsService from '../../services/costsService';
import { useState } from 'react';
import {
    Settings,
    Shield,
    PiggyBank,
    TrendingUp,
    Users,
    Trash2,
    Bell,
    Tag,
    Activity
} from 'lucide-react';

export default function Config() {
    const {
        data,
        addProjectType,
        removeProjectType,
        addProjectStatus,
        removeProjectStatus,
        addService,
        removeService,
        addVariableCostType,
        removeVariableCostType,
        updateFinancialConfig,
        addPartner,
        removePartner,
        resetData
    } = useFinance();

    // Estados para datos del backend
    const [isLoading, setIsLoading] = useState(false);
    const [projectTypesData, setProjectTypesData] = useState(data?.projectTypes || []);
    const [projectStatusesData, setProjectStatusesData] = useState(data?.projectStatuses || []);
    const [servicesData, setServicesData] = useState(data?.services || []);
    const [variableCostTypesData, setVariableCostTypesData] = useState(data?.variableCostTypes || []);

    // Cargar datos del backend cuando monta
    const [configLoaded, setConfigLoaded] = useState(false);
    if (!configLoaded) {
        Promise.all([
            configService.getProjectTypes().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setProjectTypesData(d);
            }),
            configService.getProjectStatuses().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setProjectStatusesData(d);
            }),
            costsService.getServices().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setServicesData(d);
            }),
            configService.getVariableCostTypes().then(d => {
                if (d && Array.isArray(d) && d.length > 0) setVariableCostTypesData(d);
            }),
            configService.getFinancialConfig().then(d => {
                if (d && d.porcentaje_fondo_emergencia !== undefined) {
                    updateFinancialConfig('emergencyFundPercentage', d.porcentaje_fondo_emergencia);
                    updateFinancialConfig('reinvestmentPercentage', d.porcentaje_reinversion);
                }
            })
        ]).then(() => setConfigLoaded(true));
    }

    // Funciones helper para interactuar con backend
    const handleAddProjectType = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await configService.addProjectType({ nombre: name });
            if (result && result.ok) {
                addProjectType(name);
                const fresh = await configService.getProjectTypes();
                if (fresh && Array.isArray(fresh) && fresh.length > 0) setProjectTypesData(fresh);
            }
        } catch (error) {
            console.error('Error agregando tipo proyecto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddService = async (name) => {
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await costsService.addService(name);
            if (result && result.ok) {
                addService(name);
                const fresh = await costsService.getServices();
                if (fresh) setServicesData(fresh);
            }
        } catch (error) {
            console.error('Error agregando servicio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const Section = ({ title, icon: Icon, children }) => (
        <div className="bg-card glass-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="px-6 py-5 border-b border-border/50 bg-secondary/20 flex items-center gap-3 backdrop-blur-sm">
                <div className="p-2 bg-foreground/10 rounded-lg text-foreground">
                    <Icon size={18} />
                </div>
                <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        value={data.financialConfigs?.emergencyFundPercentage || 0}
                                        onChange={(e) => updateFinancialConfig('emergencyFundPercentage', e.target.value)}
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
                                        value={data.financialConfigs?.reinvestmentPercentage || 0}
                                        onChange={(e) => updateFinancialConfig('reinvestmentPercentage', e.target.value)}
                                        className="w-full bg-[hsl(var(--purple-premium))]/10 border border-[hsl(var(--purple-premium))]/30 rounded-lg px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--purple-premium))]/30 text-[hsl(var(--purple-premium))]"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Crecimiento / Marketing</p>
                        </div>
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
                                        onClick={() => removeService(name)}
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
                                        addVariableCostType(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                className="bg-[hsl(var(--copper))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--copper-light))] transition-colors shadow-sm"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        addVariableCostType(input.value);
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
                                        onClick={() => removeVariableCostType(name)}
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
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nueva categoría..."
                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddProjectType(e.currentTarget.value);
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
                                        handleAddProjectType(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(projectTypesData || []).map(type => {
                                const name = typeof type === 'string' ? type : type.nombre;
                                const key = typeof type === 'string' ? type : type.id;
                                return (
                                <div key={key} className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full text-sm">
                                    <span>{name}</span>
                                    <button
                                        onClick={() => removeProjectType(name)}
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
                                        addProjectStatus(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                className="bg-[hsl(var(--turquoise-premium))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--turquoise-light))] transition-colors shadow-sm"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        addProjectStatus(input.value);
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
                                        onClick={() => removeProjectStatus(name)}
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
                                        addPartner(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                className="bg-[hsl(var(--gold))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[hsl(var(--gold-dark))] transition-colors shadow-sm"
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling;
                                    if (input.value) {
                                        addPartner(input.value);
                                        input.value = '';
                                    }
                                }}
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {data.partners?.map(partner => (
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
                                        onClick={() => {
                                            if (window.confirm(`¿Eliminar a ${partner.name}?`)) removePartner(partner.id);
                                        }}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                                        title="Eliminar Socio"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Danger Zone */}
                <div className="mt-12 pt-8 border-t border-destructive/20">
                    <h3 className="text-destructive font-bold text-lg mb-4 flex items-center gap-2">
                        <Trash2 size={20} /> Zona de Peligro
                    </h3>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
                        <h4 className="font-semibold text-destructive mb-2">Eliminar todos los datos</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Esta acción eliminará permanentemente todos los proyectos, gastos, configuraciones y registros.
                            No se puede deshacer.
                        </p>
                        <button
                            onClick={resetData}
                            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                        >
                            Eliminar Todo y Reiniciar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
