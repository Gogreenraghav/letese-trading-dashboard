const CACHE_NAME = 'letese-v2';
const ASSETS = [
  '/mobile/',
  '/mobile/index.html',
  '/mobile/styles.css',
  '/mobile/app.js',
  '/mobile/install-handler.js',
  '/manifest.json',
];

// Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Handle /mobile → /mobile/ redirect for PWA criteria
  const url = new URL(e.request.url);
  if (url.pathname === '/mobile') {
    e.respondWith(
      caches.match('/mobile/').then(cached => {
        return cached || fetch('/mobile/');
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/mobile/');
        }
      });
    })
  );
});
