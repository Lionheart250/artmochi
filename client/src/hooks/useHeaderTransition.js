import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function useHeaderTransition() {
  const location = useLocation();
  const [headerState, setHeaderState] = useState({
    position: 'side', 
    topClass: 'hidden', 
    sideClass: '',
    transitioning: false
  });
  
  // Use refs to track the latest state without causing dependency issues
  const stateRef = useRef(headerState);
  
  // Keep track of modal state
  const prevModalOpenState = useRef(document.body.classList.contains('modal-open'));
  
  // Also use a ref to block updates during modal closing
  const blockUpdatesRef = useRef(false);
  
  useEffect(() => {
    stateRef.current = headerState;
  }, [headerState]);
  
  // Determine which header should be visible based on current conditions
  const determineHeaderPosition = useCallback(() => {
    // NEW FLAG: Check if we're in the middle of navigating between images inside a modal
    const isNavigatingBetweenModalImages = 
      document.body.classList.contains('modal-open') && 
      window.__internalImageNavigation === true;
    
    // If we're navigating between images in a modal, don't change header position
    if (isNavigatingBetweenModalImages) {
      // Reset the flag after using it
      window.__internalImageNavigation = false;
      
      // Keep the current header position instead of changing it
      return stateRef.current.position;
    }
    
    // Otherwise, proceed with normal logic
    const isModalOpen = document.body.classList.contains('modal-open');
    
    // Current location checks
    const isImagePage = location.pathname.includes('/image/');
    const isMobile = window.innerWidth <= 768;
    const isHomePage = location.pathname === '/' || location.pathname === '/home';
    
    // Log what we're detecting for debugging
    console.log("Path check:", {
      path: location.pathname,
      isHomePage,
      isImagePage,
      isMobile,
      isModalOpen
    });
    
    // Rules for when to use top header (in order of priority)
    if (isModalOpen) {
      console.log("Using TOP header because modal is open");
      return 'top';
    }
    
    if (isImagePage) {
      console.log("Using TOP header because we're on an image page");
      return 'top';
    }
    
    if (isMobile) {
      console.log("Using TOP header because we're on mobile");
      return 'top';
    }
    
    if (isHomePage) {
      console.log("Using TOP header because we're on the homepage");
      return 'top';
    }
    
    // Default to side header for all other pages
    console.log("Using SIDE header (default case)");
    return 'side';
  }, [location.pathname]);

  // Handle standard transitions
  const transitionHeader = useCallback((targetPosition) => {
    // Get current state from the ref to avoid stale closures
    const currentState = stateRef.current;
    
    // Skip if already transitioning or in the right position or blocked
    if (currentState.transitioning || currentState.position === targetPosition || blockUpdatesRef.current) {
      return;
    }
    
    // Set transitioning flag first
    setHeaderState(prev => ({ ...prev, transitioning: true }));
    
    if (targetPosition === 'top') {
      // Side to top transition
      setHeaderState(prev => ({ ...prev, sideClass: 'exiting' }));
      
      setTimeout(() => {
        setHeaderState({
          position: 'top',
          topClass: 'entering',
          sideClass: 'hidden',
          transitioning: true
        });
        
        setTimeout(() => {
          setHeaderState({
            position: 'top',
            topClass: '',
            sideClass: 'hidden',
            transitioning: false
          });
        }, 0);
      }, 0);
    } else {
      // Top to side transition
      setHeaderState(prev => ({ ...prev, topClass: 'exiting' }));
      
      setTimeout(() => {
        setHeaderState({
          position: 'side',
          topClass: 'hidden',
          sideClass: 'entering',
          transitioning: true
        });
        
        setTimeout(() => {
          setHeaderState({
            position: 'side',
            topClass: 'hidden',
            sideClass: '',
            transitioning: false
          });
        }, 0);
      }, 0);
    }
  }, [/* No dependencies on state */]);
  
  // Handle modal closing - immediate transition with update blocking
  const handleModalClosing = useCallback(() => {
    console.log("🚀 Modal closing handled in useHeaderTransition hook");
    
    // Block updates first to prevent any other changes
    blockUpdatesRef.current = true;
    
    // Get the current conditions - include a route check for precision
    const isImagePage = location.pathname.includes('/image/');
    const isMobile = window.innerWidth <= 768;
    const isHomePage = location.pathname === '/' || location.pathname === '/home';
    const isNavigatingToHomePage = sessionStorage.getItem('navigatingTo') === 'home';
    
    // Check if we have a pending navigation that will affect the header
    if (isNavigatingToHomePage) {
      console.log("Detected navigation to homepage during modal close");
      sessionStorage.removeItem('navigatingTo'); // Clear the marker
      
      // Force top header for home page navigation during modal close
      setHeaderState({
        position: 'top',
        topClass: '',
        sideClass: 'hidden',
        transitioning: false
      });
      
      // Keep blocking updates for a while
      setTimeout(() => {
        blockUpdatesRef.current = false;
      }, 2000);
      
      return;
    }
    
    // Regular logic for modal closing
    const shouldBeTop = isHomePage || isMobile;
    
    console.log(`Modal closing: header will be ${shouldBeTop ? 'TOP' : 'SIDE'}`);
    
    setHeaderState({
      position: shouldBeTop ? 'top' : 'side',
      topClass: shouldBeTop ? '' : 'hidden',
      sideClass: shouldBeTop ? 'hidden' : '',
      transitioning: false
    });
    
    setTimeout(() => {
      blockUpdatesRef.current = false;
    }, 2000);
    
  }, [location.pathname]);

  // Create a stable updatePosition function
  const updatePosition = useCallback(() => {
    // Skip if we're blocking updates or transitioning
    if (blockUpdatesRef.current || stateRef.current.transitioning) {
      console.log("Update skipped - blocked or transitioning");
      return;
    }
    
    // Skip during modal closing
    if (document.body.classList.contains('modal-closing')) {
      console.log("Update skipped - modal is closing");
      return;
    }
    
    const targetPosition = determineHeaderPosition();
    transitionHeader(targetPosition);
  }, [determineHeaderPosition, transitionHeader]);

  // Force header position immediately without animation
  const forceHeaderPosition = useCallback((position) => {
    console.log(`🔥 Force header position: ${position}`);
    
    // Immediately set the header position without animation
    setHeaderState({
      position: position,
      topClass: position === 'top' ? '' : 'hidden',
      sideClass: position === 'side' ? '' : 'hidden',
      transitioning: false
    });
    
    // Block other updates briefly to ensure this takes effect
    blockUpdatesRef.current = true;
    setTimeout(() => {
      blockUpdatesRef.current = false;
    }, 500);
  }, []);

  // Add a special effect to track modal open state
  useEffect(() => {
    const handleModalOpen = () => {
      console.log("🔍 Modal open detected - forcing TOP header");
      
      // Force update to top header immediately when a modal opens
      setHeaderState(prev => ({
        ...prev,
        position: 'top',
        topClass: '',
        sideClass: 'hidden',
        transitioning: false
      }));
    };

    // Use the modal-open class as the indicator
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const bodyClasses = document.body.className;
          
          // When modal-open class is added (not when removed)
          if (bodyClasses.includes('modal-open') && !prevModalOpenState.current) {
            prevModalOpenState.current = true;
            console.log("👀 Modal open detected from body class");
            handleModalOpen();
          } else if (!bodyClasses.includes('modal-open') && prevModalOpenState.current) {
            prevModalOpenState.current = false;
            // Don't do anything when modal closes - that's handled elsewhere
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, { attributes: true });
    
    return () => {
      observer.disconnect();
    };
  }, []); // No dependencies to ensure it only runs once

  return {
    position: headerState.position,
    topClass: headerState.topClass,
    sideClass: headerState.sideClass,
    transitioning: headerState.transitioning,
    updatePosition,
    handleModalClosing,
    forceHeaderPosition
  };
}