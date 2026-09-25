'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Toast puntual para Synapse.
 *
 * El proyecto no tiene un sistema de toasts (Config.jsx usa alert() y los modales
 * muestran el error inline), así que este se mantiene acotado a Synapse. Si más
 * adelante se necesita en otras vistas, se mueve a components/ sin refactor.
 *
 * @param {{ tipo: 'ok'|'error', titulo: string, detalle?: string }|null} toast
 * @param {Function} onClose
 */
export default function SynapseToast({ toast, onClose }) {
    const [visible, setVisible] = useState(false);

    // Montaje: un frame después para que la transición de entrada se note.
    useEffect(() => {
        if (!toast) { setVisible(false); return; }
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, [toast]);

    // Auto-cierre. Los errores duran más porque suelen traer detalle que leer.
    useEffect(() => {
        if (!toast) return;
        const ms = toast.tipo === 'error' ? 6000 : 3000;
        const t = setTimeout(onClose, ms);
        return () => clearTimeout(t);
    }, [toast, onClose]);

    if (!toast || typeof document === 'undefined') return null;

    const esError = toast.tipo === 'error';
    const Icon = esError ? AlertTriangle : Check;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                right: 20,
                bottom: 20,
                zIndex: 9999,
                maxWidth: 400,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 160ms ease-out, transform 160ms ease-out',
            }}
            className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl bg-background',
                esError ? 'border-amber-500/40' : 'border-emerald-500/40'
            )}
            role="status"
        >
            <div className={cn(
                'p-1.5 rounded-lg shrink-0 mt-0.5',
                esError ? 'bg-amber-500/15' : 'bg-emerald-500/15'
            )}>
                <Icon size={13} className={esError ? 'text-amber-400' : 'text-emerald-400'} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-snug">
                    {toast.titulo}
                </p>
                {toast.detalle && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {toast.detalle}
                    </p>
                )}
            </div>

            <button
                onClick={onClose}
                className="p-1 -mr-1 -mt-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-foreground/6 transition-colors shrink-0"
                title="Cerrar"
            >
                <X size={12} />
            </button>
        </div>,
        document.body
    );
}
