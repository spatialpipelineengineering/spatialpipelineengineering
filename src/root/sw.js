/* Service worker — modern caching for fast, offline-capable loads. */
const VERSION = "spe-v2";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;

// App shell precached on install for instant repeat + offline navigation.
const APP_SHELL = [
  "/",
  "/assets/css/style.css",
  "/assets/js/app.js",
  "/assets/img/logo.svg",
  "/favicon.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== PRECACHE && k !== RUNTIME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isAsset(url) {
  return /\.(css|js|mjs|svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|otf|json)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first with cached fallback (then app shell "/").
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate. Serve cache instantly, but always
  // refetch in the background so redeploys reach users without a hard refresh.
  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything else: network-first, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
