// In a new file: /src/utils/CustomHistory.js
let listeners = [];

// Updated checkForOpenModal function to prevent closing modal during image navigation
const checkForOpenModal = () => {
  if (document.body.classList.contains('modal-open')) {
    // Don't close modal if navigating between images within the modal
    const currentPath = window.location.pathname;
    const isMovingBetweenImages = 
      // Check if current path is an image path
      currentPath.includes('/image/') &&
      // And if there's an internal navigation flag set (optional)
      window.__internalImageNavigation === true;
      
    // If this is navigation between images in the modal, allow it without closing
    if (isMovingBetweenImages) {
      console.log("📸 Internal image navigation detected - keeping modal open");
      // Reset the flag
      window.__internalImageNavigation = false;
      return Promise.resolve();
    }
    
    console.log("🚨 Detected navigation while modal open - forcing close");
    
    // This approach is more direct - dispatch a global event
    const event = new CustomEvent('forcemodalclose');
    document.dispatchEvent(event);
    
    // Return promise that resolves after giving modal time to start closing
    return new Promise(resolve => setTimeout(resolve, 150));
  }
  return Promise.resolve();
};

export const customHistory = {
  // Update push to check for open modals first
  push: async (path, state) => {
    // Check for open modals before navigation
    await checkForOpenModal();
    
    // Then proceed with navigation
    window.history.pushState(state || {}, '', path);
    notifyListeners({ action: 'PUSH', path, state });
  },
  
  // Update replace to check for open modals first
  replace: async (path, state) => {
    // Check for open modals before navigation
    await checkForOpenModal();
    
    // Then proceed with navigation
    window.history.replaceState(state || {}, '', path);
    notifyListeners({ action: 'REPLACE', path, state });
  },
  
  goBack: () => {
    window.history.back();
  },
  
  listen: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

function notifyListeners(location) {
  // Block ALL navigation during modal closing
  if (window.__preventGalleryRemount === true) {
    console.log("Blocking ALL navigation during modal transition");
    return;
  }

  // At the top of notifyListeners function
  if (window.__preventHistoryUpdate === true) {
    console.log("History update prevented by modal transition");
    return;
  }

  // Skip if the skip flag is set
  if (window.__skipHistoryListener === true) {
    console.log("Skipping history listener notification");
    return;
  }
  
  // Skip if state contains skipRouteChange flag
  if (location.state && location.state.skipRouteChange) {
    console.log("Skipping route change due to state flag");
    return;
  }
  
  // Add this important check - don't notify during modal transitions
  if (document.body.classList.contains('modal-closing') || 
      document.querySelector('.modal-transition-overlay')) {
    console.log("Modal transition in progress - skipping history update");
    return;
  }
  
  // Otherwise proceed with normal notification
  if (listeners && Array.isArray(listeners)) {
    listeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('Error in history listener:', error);
      }
    });
  }
}

// Handle native browser navigation
window.addEventListener('popstate', () => {
  notifyListeners({ 
    action: 'POP',
    path: window.location.pathname,
    state: window.history.state
  });
});