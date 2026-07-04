'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';
const POLL_INTERVAL = 45_000; // 45 segundos

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
        const fire = () => onUpdateRef.current?.();

        // ── 1. Socket.io ──────────────────────────────────────────────
        const socket = getSocket();
        socketRefCount++;
        events.forEach(ev => socket.on(ev, fire));

        // ── 2. Polling cada 45s ───────────────────────────────────────
        const pollTimer = setInterval(fire, POLL_INTERVAL);

        // ── 3. Refresca al volver al tab ──────────────────────────────
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fire();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
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
