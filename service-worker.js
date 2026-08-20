const CACHE_NAME = "md-converter-v2.0.0";
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

// Fetch Event
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback for offline if resource not found
        console.log("[Service Worker] Resource not found offline:", e.request.url);
      });
    })
  );
});
