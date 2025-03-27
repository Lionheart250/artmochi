// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          maxWidth: '800px',
          margin: '30px auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#dc3545' }}>Something went wrong</h2>
          <p>The application encountered an error. Try refreshing the page.</p>
          <details style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#f1f1f1',
            borderRadius: '4px'
          }}>
            <summary>Technical Details</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#343a40',
              color: '#f8f9fa',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
            <p style={{ fontWeight: 'bold', marginTop: '15px' }}>Component Stack:</p>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              marginTop: '5px',
              padding: '10px',
              backgroundColor: '#343a40',
              color: '#f8f9fa',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 15px',
              backgroundColor: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
