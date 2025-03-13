import React from 'react';
import ReactDOM from 'react-dom';

const TransitionOverlay = ({ show, onComplete, duration = 300 }) => {
  const [mounted, setMounted] = React.useState(false);
  const [portalNode, setPortalNode] = React.useState(null);
  
  React.useEffect(() => {
    // Create dedicated portal node for safer DOM operations
    const overlayRoot = document.createElement('div');
    overlayRoot.id = `transition-overlay-${Date.now()}`;
    overlayRoot.className = 'transition-overlay-portal';
    document.body.appendChild(overlayRoot);
    setPortalNode(overlayRoot);
    setMounted(true);
    
    return () => {
      // Clean up when component unmounts
      if (overlayRoot && overlayRoot.parentNode) {
        try {
          overlayRoot.parentNode.removeChild(overlayRoot);
        } catch (e) {}
      }
    };
  }, []);
  
  React.useEffect(() => {
    if (!show && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete, duration]);
  
  // Don't render until portal node is ready
  if (!mounted || !portalNode) return null;
  
  // Use ReactDOM.createPortal for safer DOM manipulation
  return ReactDOM.createPortal(
    <div
      className="modal-transition-overlay"
      data-profile-owned="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
        pointerEvents: show ? 'auto' : 'none',
      }}
    />,
    portalNode
  );
};

export default TransitionOverlay;