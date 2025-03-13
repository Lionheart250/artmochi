// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      silentRecovery: false,
      renderKey: 0 // Add a key to force re-render
    };
    
    // Track recovery attempts to prevent infinite loops
    this.recoveryAttempts = 0;
    this.cleanupTried = false;
    
    // Clean up any existing issues immediately on creation
    this.cleanupDOM();
    
    // Install a global error handler to catch React errors
    this.originalError = console.error;
    console.error = (...args) => {
      // Check if this is the DOM insertion error
      const errorText = args.join(' ');
      if (errorText.includes('insertBefore') && errorText.includes('not a child of this node')) {
        // Don't display DOM insertion errors in console
        console.log('Suppressing DOM insertion error');
        
        // Trigger DOM cleanup
        this.cleanupDOM();
        
        // Force a remount after cleanup
        setTimeout(() => {
          this.setState(prevState => ({
            renderKey: prevState.renderKey + 1
          }));
        }, 0);
        return;
      }
      
      // Pass through all other errors to the original handler
      this.originalError.apply(console, args);
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a DOM insertion error that we should handle silently
    const isInsertionError = 
      error && 
      error.message && 
      (error.message.includes('insertBefore') || 
       error.message.includes('appendChild')) && 
      error.message.includes('not a child of this node');
      
    // For DOM insertion errors, initiate silent recovery mode
    if (isInsertionError) {
      return { 
        hasError: false,  // This is critical - we don't want to show an error UI
        silentRecovery: true
      };
    }
    
    // For other errors, show the error UI
    return {
      hasError: true,
      silentRecovery: false
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.log('Error caught by boundary:', error);
    
    // Store error info in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Check if this is the DOM insertion error
    const isInsertionError = 
      error && 
      error.message && 
      (error.message.includes('insertBefore') || 
       error.message.includes('appendChild')) && 
      error.message.includes('not a child of this node');
    
    // For DOM insertion errors, attempt recovery
    if (isInsertionError) {
      this.recoveryAttempts++;
      
      // Perform thorough DOM cleanup
      this.cleanupDOM();
      
      // Schedule state reset after a brief delay
      setTimeout(() => {
        this.setState({
          hasError: false,
          silentRecovery: false,
          renderKey: this.state.renderKey + 1 // Force fresh render
        });
      }, 0);
    }
  }
  
  componentDidMount() {
    // Clean up DOM on mount
    this.cleanupDOM();
    
    // Patch window.onerror to catch React errors that bubble up
    this.originalOnError = window.onerror;
    window.onerror = (message, source, line, column, error) => {
      if (message && 
          (message.includes('insertBefore') || message.includes('appendChild')) && 
          message.includes('not a child of this node')) {
        this.cleanupDOM();
        return true; // Suppress the error
      }
      
      // Call original handler for other errors
      if (this.originalOnError) {
        return this.originalOnError(message, source, line, column, error);
      }
      return false;
    };
    
    // Also patch unhandledrejection for async errors
    this.originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      if (event.reason && 
          (event.reason.message?.includes('insertBefore') || 
           event.reason.message?.includes('appendChild')) && 
          event.reason.message?.includes('not a child of this node')) {
        this.cleanupDOM();
        event.preventDefault(); // Prevent the error from showing
        return true;
      }
      
      // Call original handler for other rejections
      if (this.originalUnhandledRejection) {
        return this.originalUnhandledRejection(event);
      }
    };
  }
  
  componentWillUnmount() {
    // Restore original error handler
    if (this.originalError) {
      console.error = this.originalError;
    }
    
    // Clean up DOM on unmount
    this.cleanupDOM();
  }
  
  cleanupDOM() {
    try {
      // Avoid repeated cleanup attempts in a single cycle
      if (this.cleanupTried) return;
      this.cleanupTried = true;
      setTimeout(() => { this.cleanupTried = false; }, 100);
      
      // 1. Clean up modal overlays
      document.querySelectorAll('.modal-transition-overlay').forEach(element => {
        if (element && element.parentNode) {
          try {
            element.parentNode.removeChild(element);
          } catch (e) {}
        }
      });
      
      // 2. Clean up transition overlays
      document.querySelectorAll('.transition-overlay').forEach(element => {
        if (element && element.parentNode) {
          try {
            element.parentNode.removeChild(element);
          } catch (e) {}
        }
      });
      
      // 3. Clean up portal containers
      document.querySelectorAll('.transition-overlay-portal').forEach(element => {
        if (element && element.parentNode) {
          try {
            element.parentNode.removeChild(element);
          } catch (e) {}
        }
      });
      
      // 4. Clean up fixed positioning elements (modal related)
      document.querySelectorAll('[class*="modal"]:not(.app-container)').forEach(element => {
        if (element && element.parentNode && element.style.position === 'fixed') {
          try {
            element.parentNode.removeChild(element);
          } catch (e) {}
        }
      });
      
      // 5. Reset body classes
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.classList.remove('modal-closing');
        document.body.style.overflow = ''; // Restore scrolling
      }
      
      // 6. Clean up global flags
      if (typeof window !== 'undefined') {
        if (window.__galleryNavigating !== undefined) window.__galleryNavigating = false;
        if (window.__internalImageNavigation !== undefined) window.__internalImageNavigation = false;
        if (window.__modalOverlays) window.__modalOverlays.clear();
      }
    } catch (e) {
      console.log('Error during DOM cleanup:', e);
    }
  }

  render() {
    // If we're in silent recovery mode, render a minimal fallback that will be quickly replaced
    if (this.state.silentRecovery) {
      return (
        <div className="silent-recovery" style={{ width: '100%', height: '100%' }}>
          {/* Empty content during recovery */}
        </div>
      );
    }
    
    // If we have a non-DOM insertion error, show the error UI
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }}>
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>The application has encountered an issue. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '20px' }}>
                <summary>Error Details</summary>
                <p>{this.state.error && this.state.error.toString()}</p>
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Render children with a key to force remount when needed
    return (
      <React.Fragment key={this.state.renderKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default ErrorBoundary;
