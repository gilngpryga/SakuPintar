const CACHE_NAME = 'sakupintar-v2-offline';

// Daftar aset utama yang langsung di-download saat pertama kali web dibuka
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. EVENT INSTALL: Mendaftarkan Service Worker dan menyimpan aset statis utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching Aset Utama');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Memaksa SW baru langsung aktif
  );
});

// 2. EVENT ACTIVATE: Membersihkan sisa-sisa cache versi lama agar HP pengguna tidak penuh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus Cache Lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENT FETCH: Strategi Dynamic Caching untuk mendukung Offline Penuh (termasuk CDN)
self.addEventListener('fetch', (event) => {
  // Hanya memproses request GET (mengabaikan ekstensi/plugin browser)
  if (event.request.method !== 'GET') return;
  // Mengabaikan request dari skema chrome-extension://
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // PROSES BACKGROUND: Selalu ambil versi terbaru dari internet untuk di-update ke Cache
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Jika respons valid (200 OK, atau status 0 untuk Opaque CDN CORS seperti Tailwind/FontAwesome)
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        // Jika sedang offline, fetch akan gagal. Tidak masalah, kita tangkap errornya agar diam di konsol
        console.log('[Service Worker] Mode Offline Aktif. Memuat dari Cache:', event.request.url);
      });

      // RESPON UTAMA: 
      // Kembalikan dari Cache secara INSTAN jika ada. 
      // Jika belum ada di Cache, kembalikan hasil dari internet.
      return cachedResponse || fetchPromise;
    })
  );
});


