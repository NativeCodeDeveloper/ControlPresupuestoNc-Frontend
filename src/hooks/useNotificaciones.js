'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';

const BASE = '/api/calendario';

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const reg = await navigator.serviceWorker.register('/sw.js');
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

    async function pedirPermiso() {
        if (!('Notification' in window)) return;
        const result = await Notification.requestPermission();
        setPermiso(result);
        if (result === 'granted') {
            try { await subscribeToPush(); } catch (e) { console.warn('[PUSH]', e); }
        }
    }

    useEffect(() => {
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
