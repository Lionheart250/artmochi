import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/theme.css';

// Updated service worker registration with enhanced error handling and image caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Set up message listener for cache operations
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_STATUS') {
            console.log('Service Worker cache status:', event.data.status);
          }
        });
        
        // Setup periodic cache cleanup for old images
        const CACHE_CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
        setInterval(() => {
          if (navigator.onLine) {
            const channel = new MessageChannel();
            channel.port1.onmessage = event => {
              console.log('Cache cleanup result:', event.data);
            };
            registration.active.postMessage({
              type: 'CLEANUP_OLD_CACHE',
              maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            }, [channel.port2]);
          }
        }, CACHE_CLEANUP_INTERVAL);
      })
      .catch(err => {
        console.error('ServiceWorker registration failed:', err);
        
        // Fallback behavior when service worker fails
        const imgCache = {};
        
        // Simple memory cache for images when service worker isn't available
        window.__imageCache = {
          set: (url, blob) => {
            imgCache[url] = blob;
            // Limit cache size
            const urls = Object.keys(imgCache);
            if (urls.length > 100) {
              delete imgCache[urls[0]];
            }
          },
          get: (url) => imgCache[url] || null,
          clear: () => {
            Object.keys(imgCache).forEach(key => delete imgCache[key]);
          }
        };
      });
  });
}

// Function to manually clear image cache in case of issues
window.clearImageCache = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const channel = new MessageChannel();
    
    // Promise-based message exchange with service worker
    return new Promise((resolve) => {
      channel.port1.onmessage = (event) => {
        console.log('Cache cleared:', event.data.status);
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_IMAGES_CACHE'
      }, [channel.port2]);
    });
  } else {
    // Fallback if service worker isn't available
    if (window.__imageCache) window.__imageCache.clear();
    console.log('Memory image cache cleared');
    return Promise.resolve({ status: 'MEMORY_CACHE_CLEARED' });
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);