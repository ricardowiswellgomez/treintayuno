const CACHE_NAME = "treseiscinco-shell-v5";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-treseiscinco.svg",
  "/icon-treseiscinco-192.png",
  "/icon-treseiscinco-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("treseiscinco-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\\/(api|auth|rest|functions|storage)\\//.test(url.pathname)) return;

  // Prefer the current deployed site on every page load; retain the last shell for outages.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(new Request(request, { cache: "no-store" })).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
        }
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match("/")))
    );
    return;
  }

  const isAppAsset = ["script", "style", "image", "font", "manifest"].includes(request.destination)
    || url.pathname === "/manifest.webmanifest";
  if (!isAppAsset) return;

  // Network-first lets a deployed JavaScript/CSS revision replace the cached revision.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(new Request(request, { cache: "no-cache" }));
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }
      return response?.status >= 500 && cached ? cached : response;
    } catch {
      return cached || Response.error();
    }
  })());
});
