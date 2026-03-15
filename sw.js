const CACHE_NAME = 'sakupintar-v5';

// Aset lokal yang wajib dicache saat install
const LOCAL_ASSETS = [
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Library CDN yang juga wajib dicache saat install
// agar app tetap berfungsi penuh saat offline pertama kali
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/flatpickr'
];

// ==============================
// INSTALL — Cache semua aset
// ==============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Install: menyimpan aset lokal & CDN');

      // Cache aset lokal — wajib berhasil semua
      await cache.addAll(LOCAL_ASSETS).catch(err => {
        console.error('[SW] Gagal cache aset lokal:', err);
      });

      // Cache CDN — best-effort, gagal satu tidak batalkan yang lain
      await Promise.allSettled(
        CDN_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Gagal cache CDN:', url, err.message);
          })
        )
      );

      console.log('[SW] Install selesai');
      return self.skipWaiting();
    })
  );
});

// ==============================
// ACTIVATE — Hapus cache lama
// ==============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Hapus cache lama:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Aktivasi selesai, claim clients');
        return self.clients.claim();
      })
  );
});

// ==============================
// FETCH — Strategi per jenis request
// ==============================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isCDN = url.hostname.includes('jsdelivr.net') ||
                url.hostname.includes('cdnjs.cloudflare.com') ||
                url.hostname.includes('tailwindcss.com') ||
                url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com');

  if (isLocal) {
    // Aset lokal: Network-first agar selalu dapat versi terbaru,
    // fallback ke cache jika offline
    event.respondWith(networkFirstWithFallback(event.request));
  } else if (isCDN) {
    // CDN: Cache-first agar cepat + update di background
    event.respondWith(cacheFirstWithUpdate(event.request));
  }
  // Request lain (API, analytics, dll) — biarkan browser tangani
});

// ==============================
// STRATEGI: Network-first
// Coba network -> update cache -> jika gagal, pakai cache
// ==============================
async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (err) {
    // Network gagal -> coba cache
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Offline, pakai cache:', request.url);
      return cached;
    }

    // Tidak ada cache sama sekali -> fallback ke index.html
    const offlinePage = await cache.match('/index.html');
    if (offlinePage) return offlinePage;

    // Fallback terakhir
    return new Response('Konten tidak tersedia saat offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ==============================
// STRATEGI: Cache-first + background update
// Pakai cache jika ada (cepat), update di background
// ==============================
async function cacheFirstWithUpdate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Update cache di background tanpa menunggu (stale-while-revalidate)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Gagal fetch CDN — tidak kritis jika sudah ada cache
    });

  return cached || fetchPromise || new Response('', { status: 503 });
}
