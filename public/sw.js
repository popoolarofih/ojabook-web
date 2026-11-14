/*
 * OjaBook service worker (guide section 9).
 *
 * It caches the app shell and static assets so the app opens offline. It deliberately does NOT
 * cache API traffic: financial data is read from the local IndexedDB copy that the app manages,
 * and anything written goes through the app's own queue. Browser background sync is only a hint
 * that asks open tabs to sync. Tokens live in page memory, so the worker cannot sync by itself.
 */
const VERSION = 'v2';
const SHELL = `ojabook-shell-${VERSION}`;
const ASSETS = `ojabook-assets-${VERSION}`;
const PAGES = `ojabook-pages-${VERSION}`;
// Static app shells. They contain no business data, so they are safe to save before sign in.
// Data comes from IndexedDB, which the app fills while online.
const PRECACHE = [
  '/offline', '/icon.svg', '/icons/icon-192.png', '/manifest.webmanifest',
  '/app', '/app/sales', '/app/sales/new', '/app/sales/receipt', '/app/inventory', '/app/debts', '/app/expenses', '/app/more', '/app/sync',
];

self.addEventListener('install', (event) => {
  // One missing page must not stop the worker installing, so each URL is added on its own.
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS, PAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // never touch the API or other origins

  // Hashed build assets and fonts never change: cache first.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Pages: network first so people see fresh screens, falling back to the last copy, then /offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname.startsWith('/app')) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        // Offline: this exact page, else the same page ignoring the query string (receipts), else the app shell.
        .catch(
          async () =>
            (await caches.match(req)) ||
            (await caches.match(req, { ignoreSearch: true })) ||
            (await caches.match('/app')) ||
            caches.match('/offline'),
        ),
    );
  }
});

// Optional Background Sync: wake any open tab so it runs its own sync.
self.addEventListener('sync', (event) => {
  if (event.tag === 'ojabook-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => clients.forEach((c) => c.postMessage({ type: 'ojabook-sync' }))),
    );
  }
});
