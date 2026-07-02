'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, X, CheckCheck, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotificaciones } from '../hooks/useNotificaciones';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas } = useNotificaciones();

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function formatRelativo(fecha) {
        const diff = Date.now() - new Date(fecha).getTime();
        const min  = Math.floor(diff / 60000);
        if (min < 1)  return 'ahora';
        if (min < 60) return `hace ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24)   return `hace ${h}h`;
        return `hace ${Math.floor(h / 24)} días`;
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                title="Notificaciones"
                className={cn(
                    "flex items-center justify-center w-full h-10 rounded-xl transition-all duration-150 relative",
                    open
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/6"
                )}
            >
                <Bell size={15} strokeWidth={1.7} />
                {notifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                        {notifs.length > 9 ? '9+' : notifs.length}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute left-full top-0 ml-2 z-50 w-80 bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                        <div className="flex items-center gap-2">
                            <Bell size={13} className="text-indigo-400" />
                            <span className="text-sm font-semibold text-foreground">Notificaciones</span>
                            {notifs.length > 0 && (
                                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                                    {notifs.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {notifs.length > 0 && (
                                <button
                                    onClick={marcarTodasLeidas}
                                    title="Marcar todas como leídas"
                                    className="p-1.5 text-muted-foreground hover:text-indigo-400 transition-colors rounded-lg hover:bg-foreground/6"
                                >
                                    <CheckCheck size={13} />
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/6"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Push permission banner */}
                    {permiso === 'default' && (
                        <div className="px-4 py-3 bg-indigo-500/8 border-b border-indigo-500/20">
                            <p className="text-xs text-indigo-300 mb-2">
                                Activa las notificaciones push para recibir recordatorios aunque no estés en la plataforma.
                            </p>
                            <button
                                onClick={pedirPermiso}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                            >
                                Activar notificaciones
                            </button>
                        </div>
                    )}
                    {permiso === 'denied' && (
                        <div className="px-4 py-2 bg-red-500/8 border-b border-red-500/20 flex items-center gap-2">
                            <BellOff size={12} className="text-red-400 shrink-0" />
                            <p className="text-[11px] text-red-400">
                                Notificaciones bloqueadas en el navegador.
                            </p>
                        </div>
                    )}

                    {/* Lista */}
                    <div className="max-h-72 overflow-y-auto">
                        {notifs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Bell size={22} className="text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">Sin notificaciones pendientes</p>
                            </div>
                        ) : (
                            notifs.map(n => (
                                <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/20 hover:bg-foreground/3 transition-colors group">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                        <CalendarDays size={14} className="text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate">{n.titulo}</p>
                                        {n.descripcion && (
                                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{n.descripcion}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            {formatRelativo(n.creado_en)} ·{' '}
                                            {new Date(n.fecha_evento).toLocaleString('es-CL', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => marcarLeida(n.id)}
                                        className="p-1 text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        title="Marcar como leída"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
