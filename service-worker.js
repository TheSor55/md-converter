const CACHE_NAME = "md-converter-v2.0.9";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/app.css",
  "./assets/js/app.js",
  "./assets/js/ui.js",
  "./assets/js/file-handler.js",
  "./assets/js/markdown.js",
  "./libs/mammoth.browser.min.js",
  "./libs/pdf.min.mjs",
  "./libs/pdf.worker.min.mjs",
  "./libs/xlsx.full.min.js",
  "./libs/jszip.min.js",
  "./libs/tesseract.min.js",
  "./converters/text.js",
  "./converters/docx.js",
  "./converters/pdf.js",
  "./converters/spreadsheet.js",
  "./converters/presentation.js",
  "./converters/image-ocr.js",
  "./converters/audio.js",
  "./converters/video.js",
  "./converters/youtube-transcript.js",
  "./converters/cad-code.js"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching App Shell and libraries");
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First Strategy (Online gets updates, Offline falls back to cache)
self.addEventListener("fetch", (e) => {
  // Only handle HTTP/HTTPS requests
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // If valid response, clone and update the cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(e.request);
      })
  );
});
