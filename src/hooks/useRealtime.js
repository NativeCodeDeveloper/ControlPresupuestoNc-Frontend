'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';
const POLL_INTERVAL = 45_000; // 45 segundos
const DEBOUNCE_MS = 1_500; // colapsa ráfagas de eventos (varias escrituras seguidas) en un solo reload

let sharedSocket = null;
let socketRefCount = 0;

function getSocket() {
    if (!sharedSocket || sharedSocket.disconnected) {
        sharedSocket = io(BACKEND_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            withCredentials: true,
        });
    }
    return sharedSocket;
}

/**
 * useRealtime — sincronización en tiempo real combinando 3 estrategias:
 *   1. Socket.io: actualización instantánea cuando el servidor emite un evento
 *   2. Polling: refresca cada 45s como respaldo si el socket falla
 *   3. visibilitychange: refresca al volver al tab
 *
 * @param {Function} onUpdate - función a llamar cuando hay datos nuevos
 * @param {string[]} events - eventos socket a escuchar (default: ['proyectos:updated'])
 */
export function useRealtime(onUpdate, events = ['ncf:update']) {
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    useEffect(() => {
        let debounceTimer = null;
        // Colapsa varios disparos seguidos (ej: 3 escrituras en 2s) en un solo reload,
        // en vez de recargar una vez por cada evento recibido.
        const fire = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => onUpdateRef.current?.(), DEBOUNCE_MS);
        };

        // ── 1. Socket.io ──────────────────────────────────────────────
        const socket = getSocket();
        socketRefCount++;
        events.forEach(ev => socket.on(ev, fire));

        // ── 2. Polling cada 45s ───────────────────────────────────────
        const pollTimer = setInterval(fire, POLL_INTERVAL);

        // ── 3. Refresca al volver al tab — inmediato, sin debounce ─────
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                clearTimeout(debounceTimer);
                onUpdateRef.current?.();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearTimeout(debounceTimer);
            events.forEach(ev => socket.off(ev, fire));
            clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibility);
            socketRefCount--;
            if (socketRefCount === 0 && sharedSocket) {
                sharedSocket.disconnect();
                sharedSocket = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
