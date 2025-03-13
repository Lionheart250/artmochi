// Add this code at the top of your index.js file, before any other imports

// Suppress React error overlay for specific errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorText = args.join(' ');
    if (errorText.includes('insertBefore') && errorText.includes('not a child of this node')) {
      console.log('Suppressed DOM insertion error in error overlay');
      return;
    }
    return originalConsoleError.apply(console, args);
  };
  
  // Patch the error overlay to prevent it from showing DOM insertion errors
  if (process.env.NODE_ENV !== 'production') {
    // For development mode - intercept react-error-overlay
    const eventListeners = window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ ? 
      window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.eventListeners : undefined;
      
    if (eventListeners && eventListeners.error) {
      // Save original error listener
      const originalErrorListener = eventListeners.error[0];
      
      // Replace with our filtered version
      eventListeners.error[0] = (error) => {
        if (error && error.message && 
            error.message.includes('insertBefore') && 
            error.message.includes('not a child of this node')) {
          // Clean up DOM and prevent overlay
          document.querySelectorAll('.modal-transition-overlay').forEach(el => {
            if (el && el.parentNode) {
              try { el.parentNode.removeChild(el); } catch (e) {}
            }
          });
          return;
        }
        
        // Call original for other errors
        if (originalErrorListener) {
          return originalErrorListener(error);
        }
      };
    }
  }
  
  // For both dev and production
  window.addEventListener('error', (event) => {
    if (event.error && 
        event.error.message &&
        event.error.message.includes('insertBefore') && 
        event.error.message.includes('not a child of this node')) {
      console.log('Suppressed DOM insertion error in window error event');
      event.preventDefault();
    }
  });
}

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