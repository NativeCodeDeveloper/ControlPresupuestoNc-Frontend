self.addEventListener('push', (event) => {
    if (!event.data) return;
    let data = {};
    try { data = event.data.json(); } catch { data = { titulo: 'Recordatorio', body: event.data.text() }; }

    event.waitUntil(
        self.registration.showNotification(data.titulo || 'NativeCode Finance', {
            body:  data.body  || '',
            icon:  data.icon  || '/logosoloncf.png',
            badge: '/logosoloncf.png',
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
