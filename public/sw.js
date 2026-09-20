const CACHE_NAME = "focustrack-v2";
// Only truly static, unauthenticated assets. Never precache "/" or auth
// pages — they redirect based on session and caching them serves redirects.
const STATIC_ASSETS = ["/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-maskable.svg"];

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  // Only same-origin.
  if (url.origin !== self.location.origin) return false;
  // Never cache API responses (auth-gated JSON, stale/cross-user risk).
  if (url.pathname.startsWith("/api")) return false;
  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isCacheable(event.request)) {
    return;
  }

  const url = new URL(event.request.url);
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/sw.js" ||
    url.pathname.match(/\.(svg|png|ico|css|js|woff2?)$/);

  // Static assets: cache-first.
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const cloned = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Pages: network-first, no caching of responses (auth redirects live here).
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
