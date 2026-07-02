'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    House, LayoutDashboard, TrendingUp, TrendingDown, PieChart,
    Settings, Menu, Users, PiggyBank, Waves, BookOpen, LogOut,
    Brain, ChevronLeft, DollarSign, LayoutGrid, Gauge, Server
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getTeams } from '../services/synapseService';
import { ThemeTogglerButton } from '../components/animate-ui/components/buttons/theme-toggler';
import { useClerk } from '@clerk/nextjs';

// ── Módulos ───────────────────────────────────────────────────────────────────

const MODULES = [
    {
        id: 'finance',
        Icon: DollarSign,
        label: 'Finance',
        accent: 'text-[hsl(var(--emerald-premium))]',
        accentBg: 'bg-[hsl(var(--emerald-premium))]/12',
        items: [
            { icon: LayoutDashboard, label: 'Panel Financiero',   path: '/dashboard',    tone: 'text-[hsl(var(--turquoise-premium))]', activeBg: 'bg-[hsl(var(--turquoise-premium))]/14' },
            { icon: TrendingUp,      label: 'Proyectos / Ingresos', path: '/ingresos',   tone: 'text-[hsl(var(--emerald-premium))]',   activeBg: 'bg-[hsl(var(--emerald-premium))]/14'  },
            { icon: TrendingDown,    label: 'Gastos / Pagos',     path: '/gastos',        tone: 'text-[hsl(var(--copper))]',            activeBg: 'bg-[hsl(var(--copper))]/14'           },
            { icon: Users,           label: 'Socios',             path: '/socios',        tone: 'text-[hsl(var(--gold))]',              activeBg: 'bg-[hsl(var(--gold))]/16'             },
            { icon: PiggyBank,       label: 'Inversiones',        path: '/inversiones',   tone: 'text-[hsl(var(--purple-premium))]',    activeBg: 'bg-[hsl(var(--purple-premium))]/14'   },
            { icon: Waves,           label: 'Flujo de Caja',      path: '/flujo-caja',    tone: 'text-[hsl(var(--turquoise-premium))]', activeBg: 'bg-[hsl(var(--turquoise-premium))]/14'},
            { icon: BookOpen,        label: 'Contabilidad',       path: '/contabilidad',  tone: 'text-[hsl(var(--corporate-blue))]',    activeBg: 'bg-[hsl(var(--corporate-blue))]/12'   },
            { icon: PieChart,        label: 'Reportes',           path: '/reportes',      tone: 'text-[hsl(var(--corporate-blue))]',    activeBg: 'bg-[hsl(var(--corporate-blue))]/12'   },
        ],
    },
    {
        id: 'synapse',
        Icon: Brain,
        label: 'Synapse',
        accent: 'text-violet-400',
        accentBg: 'bg-violet-500/12',
        items: [
            { icon: LayoutGrid, label: 'Synapse System',      path: '/synapse',            tone: 'text-violet-400', activeBg: 'bg-violet-500/14' },
            { icon: Gauge,      label: 'Production Cockpit',  path: '/synapse/cockpit',    tone: 'text-violet-400', activeBg: 'bg-violet-500/14' },
            { icon: Server,     label: 'Backserver',          path: '/synapse/backserver', tone: 'text-violet-400', activeBg: 'bg-violet-500/14' },
        ],
    },
];

function getActiveModule(pathname) {
    if (pathname.startsWith('/synapse')) return 'synapse';
    return 'finance';
}

const RAIL_W  = 60;   // px — columna de íconos
const PANEL_W = 196;  // px — panel de navegación
const TOTAL_W = RAIL_W + PANEL_W; // 256px (igual que el sidebar original)

// ── Componentes internos ──────────────────────────────────────────────────────

function NavItem({ item, isActive, onClick }) {
    return (
        <Link
            href={item.path}
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] group",
                isActive
                    ? `${item.activeBg} text-foreground font-medium`
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
        >
            <span className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                isActive ? "bg-white/70 dark:bg-black/10" : "bg-foreground/5"
            )}>
                {item.emoji ? (
                    <span className="text-[13px] leading-none">{item.emoji}</span>
                ) : (
                    <item.icon
                        size={14}
                        strokeWidth={isActive ? 2 : 1.7}
                        className={isActive ? item.tone : `${item.tone} opacity-80`}
                    />
                )}
            </span>
            <span className="truncate leading-none">{item.label}</span>
        </Link>
    );
}

// ── Layout principal ──────────────────────────────────────────────────────────

export default function MainLayout({ children }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isPanelOpen, setIsPanelOpen]   = useState(true);
    const [teams, setTeams]               = useState([]);

    useEffect(() => {
        getTeams().then(data => setTeams(Array.isArray(data) ? data : [])).catch(() => {});
    }, []);
    const pathname = usePathname();
    const router   = useRouter();
    const { signOut } = useClerk();

    const activeModuleId = getActiveModule(pathname);
    const activeModule   = MODULES.find(m => m.id === activeModuleId) || MODULES[0];
    const sidebarW       = isPanelOpen ? TOTAL_W : RAIL_W;

    const handleModuleClick = (module) => {
        if (module.id === activeModuleId) {
            // Módulo ya activo → colapsa / expande el panel
            setIsPanelOpen(p => !p);
        } else {
            // Módulo distinto → abre panel y navega al primer ítem
            setIsPanelOpen(true);
            router.push(module.items[0].path);
        }
    };

    // ── Contenido del sidebar ───────────────────────────────────────────────

    const sidebarContent = (
        <div className="flex h-full">

            {/* ① Rail de módulos (columna izquierda) */}
            <div
                className="flex flex-col items-center py-4 gap-1 border-r border-border/30 shrink-0"
                style={{ width: `${RAIL_W}px` }}
            >
                {/* Logo pequeño */}
                <div className="flex items-center justify-center w-full mb-3">
                    <img src="/logosoloncf.png" alt="NC" className="h-8 w-8 object-contain" />
                </div>

                {/* Íconos de módulos */}
                <div className="flex flex-col gap-1 w-full px-2">
                    {MODULES.map((mod) => {
                        const isActive = activeModuleId === mod.id;
                        return (
                            <button
                                key={mod.id}
                                onClick={() => handleModuleClick(mod)}
                                title={mod.label}
                                className={cn(
                                    "flex items-center justify-center w-full h-10 rounded-xl transition-all duration-200",
                                    isActive
                                        ? `${mod.accentBg} ${mod.accent}`
                                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/6"
                                )}
                            >
                                <mod.Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                            </button>
                        );
                    })}
                </div>

                {/* Separador + íconos de utilidad */}
                <div className="flex-1" />

                <div className="flex flex-col items-center gap-1 w-full px-2">
                    <ThemeTogglerButton
                        variant="ghost"
                        size="icon"
                        direction="horizontal"
                        modes={['light', 'dark']}
                    />

                    <Link
                        href="/config"
                        title="Configuración"
                        className={cn(
                            "flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150",
                            pathname.startsWith('/config')
                                ? "bg-foreground/10 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-foreground/6"
                        )}
                    >
                        <Settings size={15} strokeWidth={1.7} />
                    </Link>

                    <Link
                        href="/"
                        title="Inicio"
                        className={cn(
                            "flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150",
                            pathname === '/'
                                ? "bg-foreground/10 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-foreground/6"
                        )}
                    >
                        <House size={15} strokeWidth={1.7} />
                    </Link>

                    <button
                        onClick={() => signOut({ redirectUrl: '/' })}
                        title="Cerrar sesión"
                        className="flex items-center justify-center w-full h-10 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>

            {/* ② Panel de navegación (columna derecha, colapsable) */}
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out flex flex-col"
                style={{ width: isPanelOpen ? `${PANEL_W}px` : '0px' }}
            >
                <div className="flex flex-col h-full" style={{ width: `${PANEL_W}px` }}>

                    {/* Cabecera del módulo */}
                    <div className="flex items-center justify-between px-3 pt-4 pb-3 shrink-0">
                        <img
                            src="/ncflogo.png"
                            alt="NativeCode"
                            className="h-8 object-contain hidden dark:block"
                        />
                        <img
                            src="/ncfnegro.png"
                            alt="NativeCode"
                            className="h-8 object-contain block dark:hidden"
                        />
                        <button
                            onClick={() => setIsPanelOpen(false)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/6 rounded-lg transition-colors"
                            title="Colapsar panel"
                        >
                            <ChevronLeft size={13} />
                        </button>
                    </div>

                    {/* Navegación del módulo */}
                    <nav className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5">
                        {activeModule.items.map((item) => (
                            <NavItem
                                key={item.path}
                                item={item}
                                isActive={pathname === item.path}
                                onClick={() => setIsMobileOpen(false)}
                            />
                        ))}

                        {/* Teams — solo en módulo Synapse */}
                        {activeModuleId === 'synapse' && teams.length > 0 && (
                            <div className="pt-3">
                                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 py-1.5">
                                    Equipos
                                </p>
                                {teams.map(team => (
                                    <NavItem
                                        key={team.id_team}
                                        item={{
                                            emoji: team.emoji,
                                            label: team.nombre,
                                            path: `/synapse/team/${team.id_team}`,
                                            tone: 'text-violet-400',
                                            activeBg: 'bg-violet-500/14',
                                        }}
                                        isActive={pathname === `/synapse/team/${team.id_team}`}
                                        onClick={() => setIsMobileOpen(false)}
                                    />
                                ))}
                            </div>
                        )}

                    </nav>

                    {/* Footer */}
                    <div className="px-3 py-4 border-t border-border/30 shrink-0">
                        <div className="flex items-center gap-2 px-1">
                            <img src="/logosoloncf.png" alt="NC" className="h-5 w-5 object-contain shrink-0" />
                            <p className="text-[9px] text-muted-foreground leading-tight">
                                © 2026 NativeCode.<br />
                                Todos los derechos<br />
                                reservados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">

            {/* ── DESKTOP: sidebar como flex-child (no fixed) ── */}
            <aside
                className="hidden lg:flex flex-col shrink-0 overflow-hidden bg-background border-r border-border/50 transition-all duration-300 ease-in-out"
                style={{ width: `${sidebarW}px` }}
            >
                {sidebarContent}
            </aside>

            {/* ── MOBILE: overlay fijo ── */}
            {isMobileOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                    <aside
                        className="fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-background border-r border-border/50 lg:hidden"
                        style={{ width: `${sidebarW}px` }}
                    >
                        {sidebarContent}
                    </aside>
                </>
            )}

            {/* ── Contenido principal ── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Header mobile */}
                <header className="h-12 flex items-center justify-between px-4 border-b border-border/50 bg-background sticky top-0 z-30 lg:hidden shrink-0">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Menu size={18} />
                    </button>
                    <span className="text-xs font-semibold tracking-wider">NATIVECODE</span>
                    <ThemeTogglerButton
                        variant="ghost"
                        size="icon"
                        direction="horizontal"
                        modes={['light', 'dark']}
                    />
                </header>

                {/* Área scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
