const CACHE_NAME = 'ncf-shell-v6';

const SHELL_ASSETS = [
    '/',
    '/dashboard',
    '/nexus',
    '/nexus/actualizaciones',
    '/nexus/qa',
    '/clientes',
    '/clientes/boveda',
    '/icon-192.png',
    '/icon-512.png',
    '/logonuevoblanco.png',
    '/ncflogo.png',
    '/ncfnegro.png',
];

// ── Instala y cachea el shell de la app ──────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
    );
    self.skipWaiting();
});

// ── Limpia caches viejos al activar ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Estrategia de fetch ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Llamadas a la API → siempre red (nunca cachear datos)
    if (url.pathname.startsWith('/api/')) return;

    // Assets estáticos (_next/static) → cache first
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.match(request).then(cached => cached || fetch(request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(request, clone));
                return res;
            }))
        );
        return;
    }

    // Páginas → network first, fallback a cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/') )
        );
        return;
    }
});

// ── Push notifications (código existente) ───────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;
    let data = {};
    try { data = event.data.json(); } catch { data = { titulo: 'Recordatorio', body: event.data.text() }; }

    event.waitUntil(
        self.registration.showNotification(data.titulo || 'NativeCode Finance', {
            body:  data.body  || '',
            icon:  data.icon  || '/logonuevoblanco.png',
            badge: '/logonuevoblanco.png',
            data:  { url: data.url || '/calendario' },
            vibrate: [200, 100, 200],
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/calendario';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            const match = list.find(c => c.url.includes(url));
            if (match) return match.focus();
            return clients.openWindow(url);
        })
    );
});
