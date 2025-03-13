// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      attemptingRecovery: false
    };
    
    // Track recovery attempts
    this.recoveryAttempts = 0;
    
    // Immediately clean up when created
    this.cleanupDOM();
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Check if this is the DOM insertion error
    const isInsertionError = 
      error && error.message && 
      (error.message.includes('insertBefore') || 
       error.message.includes('Node') || 
       error.message.includes('not a child of this node'));
    
    // If it's the insertion error and we haven't tried too many times, attempt recovery
    if (isInsertionError && this.recoveryAttempts < 2) {
      this.recoveryAttempts++;
      console.log("Attempting automatic recovery from DOM insertion error...");
      
      // Set recovery state
      this.setState({ attemptingRecovery: true });
      
      // Cleanup DOM first
      this.cleanupDOM();
      
      // Try recovery after a brief delay
      setTimeout(() => {
        // Reset error state to retry rendering
        this.setState({ 
          hasError: false,
          attemptingRecovery: false
        });
      }, 100);
    }
  }
  
  // Enhanced DOM cleanup function
  cleanupDOM() {
    try {
      // 1. Remove all modal transition overlays
      document.querySelectorAll('.modal-transition-overlay').forEach(el => {
        if (el && el.parentNode) {
          try {
            el.parentNode.removeChild(el);
          } catch (e) {}
        }
      });
      
      // 2. Remove transition overlay portals
      document.querySelectorAll('.transition-overlay-portal').forEach(el => {
        if (el && el.parentNode) {
          try {
            el.parentNode.removeChild(el);
          } catch (e) {}
        }
      });

      // 3. Remove any fixed-position elements with high z-index (likely modals/overlays)
      document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]').forEach(el => {
        // Check if it's likely a modal/overlay by z-index or class
        if (
          (el.style.zIndex > 100) || 
          el.classList.contains('modal') ||
          el.classList.contains('overlay')
        ) {
          try {
            el.parentNode.removeChild(el);
          } catch (e) {}
        }
      });
      
      // 4. Remove modal-related body classes
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.classList.remove('modal-closing');
        document.body.style.overflow = '';
      }

      // 5. Reset any global navigation flags
      if (window.__galleryNavigating) window.__galleryNavigating = false;
      if (window.__internalImageNavigation) window.__internalImageNavigation = false;
      
    } catch (e) {
      console.error("Error during DOM cleanup:", e);
    }
  }

  // Clean up when component unmounts
  componentWillUnmount() {
    this.cleanupDOM();
  }

  render() {
    if (this.state.attemptingRecovery) {
      return (
        <div className="recovery-message" style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '4px',
          zIndex: 9999
        }}>
          Fixing display issue...
        </div>
      );
    }
    
    if (this.state.hasError) {
      // Check if this is the DOM insertion error
      const isInsertionError = 
        this.state.error && 
        this.state.error.message && 
        (this.state.error.message.includes('insertBefore') ||
         this.state.error.message.includes('Node') ||
         this.state.error.message.includes('not a child of this node'));
      
      return (
        <div className="error-container" style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <h2>Something went wrong</h2>
          
          {isInsertionError ? (
            <div>
              <p>There was a display issue with the page. This can happen when navigating between sections.</p>
              <button 
                onClick={() => {
                  // Clean up DOM
                  this.cleanupDOM();
                  
                  // Force a full reload to the current route
                  window.location.href = window.location.pathname;
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Fix and Continue
              </button>
            </div>
          ) : (
            <p>We're having trouble loading this content. Please try refreshing the page.</p>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: isInsertionError ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
          
          {this.props.showDetails && (
            <details style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>
              <summary>Error Details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary;