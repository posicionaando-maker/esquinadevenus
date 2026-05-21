const CACHE_NAME = 'esquina-venus-v1';
const urlsToCache = ['/', '/index.php', '/carrito.php', '/offline.html', '/css/style.css', '/js/carrito.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => e.request.mode === 'navigate' ? caches.match('/offline.html') : new Response('Offline')))));