import React, { createContext, useContext, useState, useRef } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const savedScrollPosition = useRef(0);
  const savedHistoryState = useRef(null);
  
  const openModal = (modalId, modalProps = {}) => {
    // Save scroll position and history state
    savedScrollPosition.current = window.scrollY;
    
    // Block history functions during transition
    savedHistoryState.current = {
      pushState: window.history.pushState,
      replaceState: window.history.replaceState
    };
    
    // Start transition
    setIsTransitioning(true);
    
    // Add modal-open class to body
    document.body.classList.add('modal-open');
    
    // After a brief delay, set active modal
    setTimeout(() => {
      setActiveModal({ id: modalId, props: modalProps });
      setIsTransitioning(false);
    }, 50);
  };
  
  const closeModal = (callback) => {
    // Start transition
    setIsTransitioning(true);
    document.body.classList.add('modal-closing');
    
    // Block history functions
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function() { return; };
    window.history.replaceState = function() { return; };
    
    // Notify header of modal close
    document.dispatchEvent(new CustomEvent('modalclosing', {
      detail: { closing: true }
    }));
    
    // After brief delay, hide modal
    setTimeout(() => {
      document.body.classList.remove('modal-open');
      document.body.classList.remove('modal-closing');
      
      // Restore scroll position
      window.scrollTo(0, savedScrollPosition.current);
      
      // Restore history functions
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      
      // Execute callback if provided
      if (callback) callback();
      
      // Clear modal
      setActiveModal(null);
      setIsTransitioning(false);
    }, 50);
  };
  
  return (
    <ModalContext.Provider value={{ 
      activeModal,
      isTransitioning,
      openModal, 
      closeModal
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}