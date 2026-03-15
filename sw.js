// ============================================================
// SakuPintar Service Worker — v7
// Update versi ini setiap kali ada perubahan file
// ============================================================
const CACHE_NAME = 'sakupintar-v8';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './icons.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Aset lokal — wajib semua berhasil
    try {
      await cache.addAll(LOCAL_ASSETS);
    } catch(e) {
      console.error('[SW] Gagal cache lokal:', e);
    }

    // CDN — best-effort, satu gagal tidak batalkan install
    await Promise.allSettled(
      CDN_ASSETS.map(url =>
        fetch(url, { mode: 'cors', credentials: 'omit' })
          .then(res => { if (res.ok || res.type==='opaque') cache.put(url, res); })
          .catch(() => {})
      )
    );

    // Aktif langsung tanpa tunggu tab lama tutup
    await self.skipWaiting();
  })());
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Hapus semua cache lama
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    // Ambil alih semua tab yang terbuka langsung
    await self.clients.claim();
  })());
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (!url.startsWith('http')) return;

  const { hostname, origin } = new URL(url);
  const isLocal = origin === self.location.origin;
  const isCDN   = hostname === 'cdn.jsdelivr.net';
  const isGoogleFontCSS  = hostname === 'fonts.googleapis.com';
  const isGoogleFontFile = hostname === 'fonts.gstatic.com';

  if (isLocal || isCDN) {
    event.respondWith(cacheFirst(event.request));
  } else if (isGoogleFontCSS || isGoogleFontFile) {
    // Font files: cache-first agar tersedia offline setelah pertama kali online
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    // Update di background untuk aset lokal (bukan CDN/gambar)
    const url = request.url;
    const skip = /\.(png|jpg|ico)$/i.test(url) || url.includes('jsdelivr');
    if (!skip) fetch(request).then(r => { if(r?.ok) cache.put(request, r.clone()); }).catch(()=>{});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res.ok || res.type==='opaque') cache.put(request, res.clone());
    return res;
  } catch {
    const fallback = await cache.match('./index.html');
    return fallback || offlinePage();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request)) || new Response('', {status:503});
  }
}

function offlinePage() {
  return new Response(
    `<!doctype html><meta charset=utf-8>
     <meta name="viewport" content="width=device-width,initial-scale=1">
     <title>SakuPintar — Offline</title>
     <style>
       *{box-sizing:border-box;margin:0;padding:0}
       body{font-family:-apple-system,sans-serif;background:#4f46e5;color:#fff;
            min-height:100vh;display:flex;align-items:center;justify-content:center;
            padding:2rem;text-align:center}
       .card{background:rgba(255,255,255,.15);border-radius:1.5rem;padding:2.5rem 2rem;
             max-width:300px}
       svg{width:3rem;height:3rem;margin:0 auto 1.25rem;display:block}
       h1{font-size:1.25rem;font-weight:700;margin-bottom:.75rem}
       p{font-size:.875rem;opacity:.8;line-height:1.6;margin-bottom:1.5rem}
       button{background:#fff;color:#4f46e5;border:none;border-radius:.75rem;
              padding:.75rem 1.5rem;font-weight:700;cursor:pointer;font-size:.875rem}
     </style>
     <div class="card">
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
         <path stroke-linecap="round" stroke-linejoin="round"
               d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
       </svg>
       <h1>Sedang Offline</h1>
       <p>Buka SakuPintar saat online pertama kali agar bisa digunakan offline.</p>
       <button onclick="location.reload()">Coba Lagi</button>
     </div>`,
    { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
  );
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
