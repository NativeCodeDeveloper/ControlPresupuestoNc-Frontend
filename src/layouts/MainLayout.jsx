import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    House,
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    PieChart,
    Settings,
    Menu,
    Users,
    PiggyBank
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function MainLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    if (location.pathname === '/') {
        return children;
    }

    const menuItems = [
        { icon: House, label: 'Inicio', path: '/' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: TrendingUp, label: 'Proyectos / Ingresos', path: '/ingresos' },
        { icon: TrendingDown, label: 'Gastos / Pagos', path: '/gastos' },
        { icon: Users, label: 'Socios', path: '/socios' },
        { icon: PiggyBank, label: 'Inversiones', path: '/inversiones' },
        { icon: PieChart, label: 'Reportes', path: '/reportes' },
        { icon: Settings, label: 'Configuración', path: '/config' },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <div
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 bg-background border-r border-border/50 transition-transform duration-300 ease-in-out lg:translate-x-0 hidden lg:flex flex-col",
                    isSidebarOpen ? "translate-x-0 !flex" : "-translate-x-full"
                )}
                style={{ width: '256px' }}
            >
                <div className="flex flex-col h-full px-4 py-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-3 mb-10">
                        <img
                            src="/ico2.png"
                            alt="NativeCode"
                            className="h-9 w-9 rounded-lg object-contain"
                        />
                        <div>
                            <h1 className="font-bold text-sm tracking-tight text-foreground">
                                NATIVECODE
                            </h1>
                            <p className="text-[10px] text-center text-muted-foreground tracking-widest uppercase">Finance</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-0.5">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px]",
                                        isActive
                                            ? "bg-[hsl(var(--corporate-blue))]/10 text-foreground font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                                    )}
                                >
                                    <item.icon
                                        size={16}
                                        strokeWidth={isActive ? 2 : 1.5}
                                        className={isActive ? "text-[hsl(var(--corporate-blue))]" : ""}
                                    />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="pt-4 border-t border-border/30">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="h-7 w-7 rounded-full bg-foreground/10 flex items-center justify-center text-[11px] font-semibold text-foreground shrink-0">
                                NC
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] leading-tight font-medium text-foreground">
                                    © 2026 NativeCode.<br />
                                    Todos los derechos<br />
                                    reservados.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="h-12 flex items-center justify-between px-4 border-b border-border/50 bg-background sticky top-0 z-30 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Menu size={18} />
                    </button>
                    <span className="text-xs font-semibold tracking-wider">NATIVECODE</span>
                    <div className="w-7" />
                </header>

                <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
