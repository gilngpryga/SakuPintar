// ============================================================
// SakuPintar Service Worker v1
// Cache-first strategy — offline ready
// ============================================================

const CACHE = 'sakupintar-v1';

const LOCAL = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

const CDN = [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js',
    'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        await cache.addAll(LOCAL);
        await Promise.allSettled(
            CDN.map(url =>
                fetch(url, { mode: 'cors', credentials: 'omit' })
                    .then(res => {
                        if (res.ok || res.type === 'opaque') cache.put(url, res);
                    })
                    .catch(() => {})
            )
        );
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = event.request.url;
    if (!url.startsWith('http')) return;
    const { hostname } = new URL(url);
    const isLocal = url.startsWith(self.location.origin);
    const isCDN   = hostname === 'cdn.tailwindcss.com'
                 || hostname === 'cdnjs.cloudflare.com'
                 || hostname === 'cdn.jsdelivr.net';
    const isFont  = hostname === 'fonts.googleapis.com'
                 || hostname === 'fonts.gstatic.com';
    if (isLocal || isCDN || isFont) {
        event.respondWith(cacheFirst(event.request));
    }
});

async function cacheFirst(request) {
    const cache  = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
        return response;
    } catch {
        const fallback = await cache.match('./index.html');
        return fallback ?? new Response('Offline', { status: 503 });
    }
}
