'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';
import { useRealtime } from './useRealtime';

const BASE = '/api/calendario';

// Registra el Service Worker sin depender del permiso de notificaciones —
// necesario para que la PWA tenga cache de assets y sea instalable incluso
// si el usuario nunca acepta push.
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
        return await navigator.serviceWorker.register('/sw.js');
    } catch (e) {
        console.warn('[SW]', e);
        return null;
    }
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const reg = await registerServiceWorker();
    if (!reg) return;
    const { key } = await apiClient.get(`${BASE}/vapid-key`);
    if (!key) return;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
        await apiClient.post(`${BASE}/push-subscribe`, {
            endpoint: existing.endpoint,
            keys: { p256dh: existing.toJSON().keys.p256dh, auth: existing.toJSON().keys.auth },
        });
        return;
    }

    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
    });

    await apiClient.post(`${BASE}/push-subscribe`, {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.toJSON().keys.p256dh, auth: sub.toJSON().keys.auth },
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function useNotificaciones() {
    const [notifs,     setNotifs]     = useState([]);
    const [permiso,    setPermiso]    = useState('default');
    const intervalRef = useRef(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const data = await apiClient.get(`${BASE}/notificaciones/pendientes`);
            setNotifs(Array.isArray(data) ? data : []);
        } catch {}
    }, []);

    useEffect(() => {
        fetchNotifs();
        intervalRef.current = setInterval(fetchNotifs, 30_000);
        return () => clearInterval(intervalRef.current);
    }, [fetchNotifs]);

    // Actualización instantánea vía socket cuando hay cambios en el sistema
    useRealtime(fetchNotifs);

    async function pedirPermiso() {
        if (!('Notification' in window)) return;
        const result = await Notification.requestPermission();
        setPermiso(result);
        if (result === 'granted') {
            try { await subscribeToPush(); } catch (e) { console.warn('[PUSH]', e); }
        }
    }

    useEffect(() => {
        registerServiceWorker();
        if ('Notification' in window) {
            setPermiso(Notification.permission);
            if (Notification.permission === 'granted') {
                subscribeToPush().catch(() => {});
            }
        }
    }, []);

    async function marcarLeida(id) {
        try {
            await apiClient.post(`${BASE}/notificaciones/${id}/leer`);
            setNotifs(n => n.filter(x => x.id !== id));
        } catch {}
    }

    async function marcarTodasLeidas() {
        try {
            await apiClient.post(`${BASE}/notificaciones/leer-todas`);
            setNotifs([]);
        } catch {}
    }

    return { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas, refetch: fetchNotifs };
}
