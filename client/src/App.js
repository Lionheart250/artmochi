import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useParams, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Following from './pages/Following';
import ImageGenerator from './pages/ImageGenerator';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import EmailVerification from './pages/EmailVerification';
import VerificationSent from './pages/VerificationSent';
import Header from './components/Header';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { SubscriptionProvider } from './features/subscriptions/store/SubscriptionContext';
import { ModalProvider } from './context/ModalContext';
import Subscription from './pages/Subscription';
import ImageModal from './components/ImageModal';
import './App.css';
import './styles/theme.css';
import { customHistory } from './utils/CustomHistory';
import ErrorBoundary from './components/ErrorBoundary';

// Emergency redirect loop breaker
if (typeof window !== 'undefined') {
  // Check if we're in a redirect loop
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('breakLoop')) {
    const redirectCount = parseInt(localStorage.getItem('redirectCount') || '0');
    const redirectTime = parseInt(localStorage.getItem('redirectTime') || '0');
    const now = Date.now();
    
    // If we've had 3+ redirects in the last 5 seconds, we're in a loop
    if (redirectCount > 3 && (now - redirectTime < 5000)) {
      console.log('Breaking redirect loop');
      // Set emergency flag to prevent further redirects
      localStorage.setItem('breakLoop', 'true');
      
      // Try to clear potential causes
      localStorage.removeItem('token');
      sessionStorage.clear();
      
      // Reload with clean slate
      window.location.replace('/?breakLoop=true');
    } else {
      // Update redirect count
      localStorage.setItem('redirectCount', (redirectCount + 1).toString());
      localStorage.setItem('redirectTime', now.toString());
      
      // Auto-reset counter after 10 seconds of successful page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          localStorage.setItem('redirectCount', '0');
        }, 10000);
      });
    }
  } else {
    // We're in emergency mode - reset counters
    localStorage.removeItem('redirectCount');
    localStorage.removeItem('redirectTime');
    // Clear emergency flag after page loads successfully
    window.addEventListener('load', () => {
      setTimeout(() => {
        localStorage.removeItem('breakLoop');
      }, 5000);
    });
  }
}

useEffect(() => {
  // If we detect we're in a production environment
  if (window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1') {
    
    // Check if we might be in a redirect loop
    const pageLoads = parseInt(localStorage.getItem('pageLoads') || '0');
    localStorage.setItem('pageLoads', (pageLoads + 1).toString());
    
    // If we've loaded the page too many times in a short period
    if (pageLoads > 5) {
      console.log('Detected potential redirect loop, clearing auth state');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.setItem('pageLoads', '0');
      
      // Force a clean reload
      if (!window.location.search.includes('clean=1')) {
        window.location.replace(window.location.pathname + '?clean=1');
      }
    }
    
    // Reset the counter after 10 seconds
    setTimeout(() => {
      localStorage.setItem('pageLoads', '0');
    }, 10000);
  }
}, []);

// Setup global error handler for DOM insertion errors
if (typeof window !== 'undefined' && !window.__insertionErrorHandlerAdded) {
  window.__insertionErrorHandlerAdded = true;
  
  // Last-resort error handling for DOM insertion errors
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('insertBefore') && 
        args[0].includes('not a child of this node')) {
      console.log('Suppressing DOM insertion error');
      
      // Clean up DOM
      document.querySelectorAll('.modal-transition-overlay').forEach(el => {
        if (el && el.parentNode) {
          try { el.parentNode.removeChild(el); } catch (e) {}
        }
      });
      document.body.classList.remove('modal-open');
      document.body.classList.remove('modal-closing');
      
      return;
    }
    originalError.apply(console, args);
  };
  
  // Also handle window errors
  window.addEventListener('error', event => {
    if (event.error && 
        event.error.message && 
        event.error.message.includes('insertBefore') && 
        event.error.message.includes('not a child of this node')) {
      event.preventDefault();
      return false;
    }
  }, true);
}

function App() {
  // Add this state
  const [isEmergencyMode] = useState(
    () => typeof window !== 'undefined' && 
    (localStorage.getItem('breakLoop') === 'true' || 
     window.location.search.includes('breakLoop=true'))
  );

  // History state protection for smooth transitions
  useEffect(() => {
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      if (window.__suppressRemount) {
        args[0] = args[0] || {};
        args[0].suppressRemount = true;
      }
      return originalPush.apply(this, args);
    };
    
    window.history.replaceState = function(...args) {
      if (window.__suppressRemount) {
        args[0] = args[0] || {};
        args[0].suppressRemount = true;
      }
      return originalReplace.apply(this, args);
    };
    
    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  return (
    <ProfileProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <ModalProvider>
            {/* Conditionally use custom history */}
            {isEmergencyMode ? (
              <Router>
                <ErrorBoundary>
                  <AppContent isEmergencyMode={true} />
                </ErrorBoundary>
              </Router>
            ) : (
              <Router navigator={customHistory} location={window.location.pathname}>
                <ErrorBoundary>
                  <AppContent isEmergencyMode={false} />
                </ErrorBoundary>
              </Router>
            )}
          </ModalProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ProfileProvider>
  );
}

// Separate component to use router hooks
function AppContent({ isEmergencyMode }) {
  const location = useLocation();
  const background = isEmergencyMode ? null : location.state?.background;

  return (
    <>
      <Header />
      {isEmergencyMode && (
        <div style={{
          background: '#ffebee', 
          padding: '10px', 
          textAlign: 'center',
          borderBottom: '1px solid #ffcdd2'
        }}>
          Recovered from redirect loop. Some features may be limited.
        </div>
      )}
      <Routes location={background || location}>
        <Route path="/" element={<Home />} />
        <Route 
          path="/gallery" 
          element={<Gallery key="persistent-gallery" />}
        />
        <Route path="/imagegenerator" element={<ImageGenerator />} />
        <Route path="/following" element={<Following />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        <Route path="/verification-sent" element={<VerificationSent />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route 
          path="/image/:id" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              <Gallery key="persistent-gallery" />
            </React.Suspense>
          } 
        />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
      
      {/* Show modal when we have a background location */}
      {background && (
        <Routes>
          <Route 
            path="/image/:imageId" 
            element={<ModalWrapper />} 
          />
        </Routes>
      )}
      <Footer />
    </>
  );
}

// Modal wrapper component to handle route parameters
function ModalWrapper() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  
  // Simple function to find image - replace with your actual implementation
  const findImage = (id) => {
    // This would typically fetch from your app state or API
    return { id, image_url: `/api/images/${id}` };
  };
  
  const image = findImage(imageId);

  return (
    <ImageModal
      isOpen={true}
      onClose={() => navigate(-1)}
      modalImage={image.image_url}
      activeImageId={imageId}
    />
  );
}

export default App;