'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Columns3, Check, Loader2, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

const PANEL_W = 264;

/**
 * Selector de columnas visibles del tablero, por equipo.
 *
 * El panel se monta con createPortal en position:fixed porque el <main> de
 * MainLayout tiene overflow-hidden y recortaría un dropdown absolute.
 * Mismo patrón que components/NotificationBell.jsx.
 *
 * @param {Array}  estados  Estados activos (columnas del kanban)
 * @param {Array}  ocultos  ids de estado ocultos en este equipo
 * @param {Object} conteos  { [id_estado]: tareas activas del equipo }
 * @param {Function} onToggle  Recibe el id_estado a mostrar/ocultar
 * @param {boolean} saving   Hay un guardado en vuelo
 */
export default function ColumnasMenu({ estados, ocultos, conteos, onToggle, saving }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, maxH: 420 });
    const btnRef = useRef(null);

    const ocultosSet = new Set(ocultos);
    const visibles = estados.filter(e => !ocultosSet.has(e.id_estado));

    // Tickets que quedaron dentro de una columna oculta. No debería pasar (ocultar
    // una columna con tickets está bloqueado), pero sí es posible si alguien mueve
    // un ticket desde la vista global /synapse, que no filtra por equipo.
    const tareasOcultas = estados
        .filter(e => ocultosSet.has(e.id_estado))
        .reduce((acc, e) => acc + (conteos[e.id_estado] || 0), 0);

    const calcPos = useCallback(() => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();
        const gap = 8;
        // Alineado al borde derecho del botón, sin salirse de la ventana.
        const left = Math.max(8, Math.min(r.right - PANEL_W, window.innerWidth - PANEL_W - 8));
        const top = r.bottom + gap;
        const maxH = Math.max(200, window.innerHeight - top - 24);
        setPos({ top, left, maxH });
    }, []);

    function toggle() {
        calcPos();
        setOpen(o => !o);
    }

    useEffect(() => {
        if (!open) return;
        function onDown(e) {
            const panel = document.getElementById('synapse-columnas-panel');
            if (btnRef.current?.contains(e.target)) return;
            if (panel?.contains(e.target)) return;
            setOpen(false);
        }
        function onKey(e) { if (e.key === 'Escape') setOpen(false); }
        function onReflow() { calcPos(); }

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', onReflow);
        window.addEventListener('scroll', onReflow, true);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onReflow);
            window.removeEventListener('scroll', onReflow, true);
        };
    }, [open, calcPos]);

    const panel = open && typeof document !== 'undefined' && createPortal(
        <div
            id="synapse-columnas-panel"
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_W, zIndex: 9999 }}
            className="bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
            <div className="px-3.5 py-2.5 border-b border-border/30 shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Columnas del tablero
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Solo afecta a este equipo
                </p>
            </div>

            <div className="py-1.5 overflow-y-auto" style={{ maxHeight: pos.maxH - 90 }}>
                {estados.map(e => {
                    const oculto = ocultosSet.has(e.id_estado);
                    const total = conteos[e.id_estado] || 0;
                    // No se puede ocultar una columna con tickets, ni dejar el tablero vacío.
                    const bloqueada = !oculto && (total > 0 || visibles.length === 1);

                    return (
                        <button
                            key={e.id_estado}
                            onClick={() => onToggle(e.id_estado)}
                            disabled={saving}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors',
                                'hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-wait'
                            )}
                            title={
                                bloqueada && total > 0
                                    ? `No se puede ocultar: tiene ${total} ${total === 1 ? 'ticket' : 'tickets'}`
                                    : bloqueada
                                        ? 'Debe quedar al menos una columna visible'
                                        : oculto ? 'Mostrar columna' : 'Ocultar columna'
                            }
                        >
                            <span
                                className={cn(
                                    'w-3.5 h-3.5 rounded-[5px] border flex items-center justify-center shrink-0 transition-colors',
                                    oculto
                                        ? 'border-border bg-transparent'
                                        : 'border-violet-500 bg-violet-500 text-white'
                                )}
                            >
                                {!oculto && <Check size={9} strokeWidth={3} />}
                            </span>

                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: e.color_hex }}
                            />

                            <span className={cn(
                                'flex-1 text-[12px] truncate',
                                oculto ? 'text-muted-foreground' : 'text-foreground'
                            )}>
                                {e.nombre?.trim()}
                            </span>

                            {total > 0 && (
                                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                                    {total}
                                </span>
                            )}
                            {bloqueada && (
                                <Lock size={9} className="text-muted-foreground/40 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="px-3.5 py-2 border-t border-border/30 shrink-0">
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                    {tareasOcultas > 0
                        ? `Hay ${tareasOcultas} ${tareasOcultas === 1 ? 'ticket' : 'tickets'} dentro de columnas ocultas.`
                        : 'Una columna con tickets no se puede ocultar hasta moverlos.'}
                </p>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggle}
                className={cn(
                    'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border transition-colors',
                    tareasOcultas > 0
                        ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                        : open
                            ? 'border-border/40 bg-secondary/50 text-foreground'
                            : 'border-border/40 text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )}
                title="Mostrar u ocultar columnas en este equipo"
            >
                {saving
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Columns3 size={15} />}
                <span className="text-[11px] font-medium tabular-nums">
                    {visibles.length}/{estados.length}
                </span>
            </button>
            {panel}
        </>
    );
}
