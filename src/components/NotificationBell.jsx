'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellOff, X, CheckCheck, CalendarDays, CreditCard, Receipt, Hammer, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotificaciones } from '../hooks/useNotificaciones';

function getNotifStyle(tipo) {
    if (tipo === 'vencimiento')   return { Icon: CreditCard,      bg: 'bg-amber-500/15',  color: 'text-amber-400' };
    if (tipo === 'f29')           return { Icon: Receipt,          bg: 'bg-purple-500/15', color: 'text-purple-400' };
    if (tipo === 'ticket_nuevo')  return { Icon: Hammer,           bg: 'bg-sky-500/15',    color: 'text-sky-400' };
    if (tipo === 'ticket_estado') return { Icon: ArrowRightLeft,   bg: 'bg-teal-500/15',   color: 'text-teal-400' };
    return { Icon: CalendarDays, bg: 'bg-indigo-500/15', color: 'text-indigo-400' };
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, maxH: 400 });
    const btnRef = useRef(null);
    const { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas } = useNotificaciones();

    const calcPos = useCallback(() => {
        if (!btnRef.current) return;
        const r   = btnRef.current.getBoundingClientRect();
        const gap = 8;
        const w   = 320;
        const left = r.right + gap;
        const top  = r.top;
        // Asegurar que no se salga por la derecha
        const safeLeft = Math.min(left, window.innerWidth - w - 8);
        // Altura máxima: desde top hasta 24px del fondo de la ventana
        const maxH = Math.max(200, window.innerHeight - top - 24);
        setPos({ top, left: safeLeft, maxH });
    }, []);

    function toggle() {
        calcPos();
        setOpen(o => !o);
    }

    // Auto-marcar como leídas tras un tiempo largo con el panel abierto — respaldo
    // por si el usuario nunca usa el botón de tilde. No debe interrumpir la lectura,
    // así que el marcado manual (tilde / X por notificación) sigue siendo lo normal.
    useEffect(() => {
        if (!open || notifs.length === 0) return;
        const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
        const t = setTimeout(() => { marcarTodasLeidas(); }, SEIS_HORAS_MS);
        return () => clearTimeout(t);
    }, [open, notifs.length, marcarTodasLeidas]);

    useEffect(() => {
        if (!open) return;
        function onDown(e) {
            const panel = document.getElementById('notif-panel');
            if (btnRef.current?.contains(e.target)) return;
            if (panel?.contains(e.target)) return;
            setOpen(false);
        }
        function onScroll() { calcPos(); }
        document.addEventListener('mousedown', onDown);
        window.addEventListener('resize', onScroll);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('resize', onScroll);
        };
    }, [open, calcPos]);

    function formatRelativo(fecha) {
        const diff = Date.now() - new Date(fecha).getTime();
        const min  = Math.floor(diff / 60000);
        if (min < 1)  return 'ahora';
        if (min < 60) return `hace ${min} min`;
        const h = Math.floor(min / 60);
        if (h < 24)   return `hace ${h}h`;
        return `hace ${Math.floor(h / 24)} días`;
    }

    const panel = open && typeof document !== 'undefined' && createPortal(
        <div
            id="notif-panel"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 320, zIndex: 9999 }}
            className="bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
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
                <div className="px-4 py-3 bg-indigo-500/8 border-b border-indigo-500/20 shrink-0">
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
                <div className="px-4 py-2 bg-red-500/8 border-b border-red-500/20 flex items-center gap-2 shrink-0">
                    <BellOff size={12} className="text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-400">Notificaciones bloqueadas en el navegador.</p>
                </div>
            )}

            {/* Lista con scroll interno */}
            <div
                className="overflow-y-auto"
                style={{ maxHeight: pos.maxH - 80 }}
            >
                {notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Bell size={22} className="text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">Sin notificaciones pendientes</p>
                    </div>
                ) : (
                    notifs.map(n => {
                        const { Icon, bg, color } = getNotifStyle(n.tipo);
                        return (
                        <div
                            key={n.id}
                            className="flex items-start gap-3 px-4 py-3 border-b border-border/20 hover:bg-foreground/3 transition-colors group"
                        >
                            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Icon size={14} className={color} />
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
                        );
                    })
                )}
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
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
            {panel}
        </>
    );
}
