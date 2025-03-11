const CACHE_NAME = 'artmochi-lora-cache-v2'; // Updated version number
const LORA_ASSETS = /\.(webp|jpg|jpeg|png|gif)$/i;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  
  // Clear old cache on activation
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.match(LORA_ASSETS)) {
    // Extract path to check if it's a thumbnail request
    const url = new URL(event.request.url);
    const isThumbRequest = url.pathname.includes('-thumb');
    
    console.log(`Intercepted ${isThumbRequest ? 'thumbnail' : 'image'} request:`, url.pathname);
    
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
          // Only cache successful responses
          if (networkResponse.ok) {
            console.log('Caching new response:', event.request.url);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('Fetch failed:', error);
          
          // For thumbnail requests, try fallback to original image
          if (isThumbRequest) {
            console.log('Attempting fallback for thumbnail...');
            // Extract original image URL from thumbnail URL
            const originalUrl = event.request.url.replace(/-thumb(-sm)?\.webp$/, '.webp');
            const originalRequest = new Request(originalUrl);
            
            // Try to get the original from cache
            const originalCached = await cache.match(originalRequest);
            if (originalCached) {
              console.log('Falling back to original image from cache');
              return originalCached;
            }
            
            // If not in cache, try fetching original
            try {
              const originalResponse = await fetch(originalRequest);
              if (originalResponse.ok) {
                cache.put(originalRequest, originalResponse.clone());
                return originalResponse;
              }
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
            }
          }
          
          // If we got here, both attempts failed
          throw error;
        }
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGES_CACHE') {
    console.log('Clearing image cache by request');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ status: 'CACHE_CLEARED' });
    });
  }
});