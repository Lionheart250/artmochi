const CACHE_NAME = 'artmochi-lora-cache-v5'; // Increment version
const LORA_ASSETS = /\.(webp|jpg|jpeg|png|gif)$/i;

// FIXED: Hardcode your API domains or use self.__WB_MANIFEST for injection
const BYPASS_DOMAINS = [
  // List your actual API domains explicitly since env vars don't work in service workers
  'api.artmochi.ai',
  'artmochi-api.herokuapp.com',
  'localhost:3001',
  'localhost:8000'
];

// Add specific patterns to bypass
const BYPASS_PATTERNS = [
  '/optimized-image',
  '/images'
];

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
  const url = new URL(event.request.url);
  
  // FIXED: Check domain AND patterns that should bypass service worker
  // Skip API server and optimized image requests
  if (BYPASS_DOMAINS.some(domain => url.hostname.includes(domain)) ||
      BYPASS_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    return; // Do not intercept
  }
  
  // Only process image assets from approved sources
  if (event.request.url.match(LORA_ASSETS)) {
    // Skip blob URLs
    if (url.protocol === 'blob:') {
      return;
    }
    
    const isThumbRequest = url.pathname.includes('-thumb');
    
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network with better error handling
        try {
          // Create request with proper credentials
          const corsRequest = new Request(event.request.url, {
            mode: 'cors',
            credentials: 'same-origin',
            headers: event.request.headers
          });
          
          // Set a timeout for fetch requests to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000);
          });
          
          // Race between fetch and timeout
          const networkResponse = await Promise.race([
            fetch(corsRequest),
            timeoutPromise
          ]);
          
          // Only cache successful responses
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
          
          // If response is not OK, throw an error with status
          throw new Error(`Network response was not ok: ${networkResponse.status}`);
        } catch (error) {
          // MODIFIED: Only log errors that aren't about default-avatar.png
          if (!event.request.url.includes('default-avatar.png')) {
            console.error(`Fetch failed for ${event.request.url}:`, error.message);
          }
          
          // For thumbnails, try fallback with better error handling
          if (isThumbRequest) {
            try {
              const originalUrl = event.request.url.replace(/-thumb(-sm)?\.webp$/, '.webp');
              const originalRequest = new Request(originalUrl);
              
              // Try cached version of original
              const originalCached = await cache.match(originalRequest);
              if (originalCached) {
                return originalCached;
              }
              
              // If not cached, try network for original
              const fallbackResponse = await fetch(originalRequest);
              if (fallbackResponse.ok) {
                cache.put(originalRequest, fallbackResponse.clone());
                return fallbackResponse;
              }
              
              throw new Error('Fallback fetch failed');
            } catch (fallbackError) {
              // MODIFIED: Only log if not default-avatar related
              if (!event.request.url.includes('default-avatar.png')) {
                console.error('Fallback also failed:', fallbackError.message);
              }
              
              // Return a graceful fallback image
              return caches.match('/images/fallback-image.webp')
                .catch(() => {
                  // If no fallback image in cache, create a transparent 1px image
                  return new Response(
                    new Blob(
                      [new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,1,68,1,0,59])],
                      {type: 'image/gif'}
                    ),
                    {status: 200, headers: {'Content-Type': 'image/gif'}}
                  );
                });
            }
          }
          
          // If we got here, both attempts failed - return a transparent image instead of throwing
          // MODIFIED: Don't log the fallback message for default-avatar
          if (!event.request.url.includes('default-avatar.png')) {
            console.log('All fetch attempts failed, returning fallback image');
          }
          
          // MODIFIED: Completely skip the default avatar fetch attempt
          // since we know it fails and we don't need the console spam
          
          // As last resort, return a transparent 1x1 pixel
          return new Response(
            new Blob(
              [new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,1,68,1,0,59])],
              {type: 'image/gif'}
            ),
            {status: 200, headers: {'Content-Type': 'image/gif'}}
          );
        }
      }).catch(error => {
        // Handle any uncaught errors in the cache operations
        // MODIFIED: Only log non-default-avatar errors
        if (!error.message || !error.message.includes('default-avatar')) {
          console.error('Service worker cache error:', error);
        }
        return new Response(
          new Blob(
            [new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,1,68,1,0,59])],
            {type: 'image/gif'}
          ),
          {status: 200, headers: {'Content-Type': 'image/gif'}}
        );
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