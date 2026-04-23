const CACHE_VERSION = "v3";
const SHELL_CACHE = `jackcast-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `jackcast-static-${CACHE_VERSION}`;
const API_CACHE = `jackcast-api-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = "/index.html";
const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.jpg",
  "/logo.png",
  "/logo_192.png",
];
const STATIC_DESTINATIONS = new Set(["font", "image", "script", "style"]);
const WEATHER_API_HOSTS = new Set([
  "api.open-meteo.com",
  "air-quality-api.open-meteo.com",
  "geocoding-api.open-meteo.com",
]);

const isSuccessfulResponse = (response) =>
  response && response.ok && response.type !== "opaque";

const isSameOriginStaticAsset = (request, url) =>
  url.origin === self.location.origin &&
  STATIC_DESTINATIONS.has(request.destination);

const isWeatherApiRequest = (url) => WEATHER_API_HOSTS.has(url.hostname);

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxEntries) {
    return;
  }

  await cache.delete(keys[0]);
  await trimCache(cacheName, maxEntries);
};

const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (isSuccessfulResponse(response)) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }

  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (isSuccessfulResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  });

  if (cachedResponse) {
    return cachedResponse;
  }

  return networkPromise;
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (isSuccessfulResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, STATIC_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      );

      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const response = await fetch(event.request);
          if (isSuccessfulResponse(response)) {
            const shellCache = await caches.open(SHELL_CACHE);
            shellCache.put(OFFLINE_FALLBACK_URL, response.clone());
          }
          return response;
        } catch (error) {
          const cachedResponse = await caches.match(OFFLINE_FALLBACK_URL);
          if (cachedResponse) {
            return cachedResponse;
          }

          throw error;
        }
      })(),
    );
    return;
  }

  if (isWeatherApiRequest(requestUrl)) {
    event.respondWith(
      (async () => {
        const response = await networkFirst(event.request, API_CACHE);
        event.waitUntil(trimCache(API_CACHE, 40));
        return response;
      })(),
    );
    return;
  }

  if (isSameOriginStaticAsset(event.request, requestUrl)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
});
