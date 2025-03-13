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

function App() {
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
            <Router navigator={customHistory} location={window.location.pathname}>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </Router>
          </ModalProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ProfileProvider>
  );
}

// Separate component to use router hooks
function AppContent() {
  const location = useLocation();
  const background = location.state?.background;

  return (
    <>
      <Header />
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