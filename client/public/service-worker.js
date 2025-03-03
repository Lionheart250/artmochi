const CACHE_NAME = 'artmochi-lora-cache-v1';
const LORA_ASSETS = /\.(webp|jpg|jpeg|png|gif)$/i;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.match(LORA_ASSETS)) {
    console.log('Intercepted Lora asset request:', event.request.url);
    
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          console.log('Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // If not in cache, fetch and cache
        try {
          const networkResponse = await fetch(event.request);
          console.log('Caching new response:', event.request.url);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          console.error('Fetch failed:', error);
          throw error;
        }
      })
    );
  }
});