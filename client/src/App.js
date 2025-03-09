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
import Subscription from './pages/Subscription';
import ImageModal from './components/ImageModal';
import './App.css';
import './styles/theme.css';
import { customHistory } from './utils/CustomHistory';

function App() {
  return (
    <ProfileProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Router navigator={customHistory} location={window.location.pathname}>
            <AppContent />
          </Router>
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
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/imagegenerator" element={<ImageGenerator />} />
        <Route path="/following" element={<Following />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        <Route path="/verification-sent" element={<VerificationSent />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/image/:imageId" element={<ImageDetailPage />} />
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
  const image = findImageById(imageId); // Implement this function

  return (
    <ImageModal
      isOpen={true}
      onClose={() => navigate(-1)}
      modalImage={image}
    />
  );
}

// Add this helper function to locate an image by ID
// This is a placeholder - you'll need to implement proper fetching
function findImageById(id) {
  // Try to get from recent images in state/context
  // You might need to adjust this based on where your image data is stored
  return null; // This will cause the component to fetch from API
}

// Update your ImageDetailPage function to use React Router v6 hooks
function ImageDetailPage() {
  const { imageId } = useParams(); // v6 way to get params
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        const response = await fetch(`/api/images/${imageId}`);
        const data = await response.json();
        setImage(data);
      } catch (error) {
        console.error('Error fetching image:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [imageId]);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!image) {
    return <div className="error-message">Image not found</div>;
  }

  return (
    <div className="image-detail-page">
      {/* Similar content to your ImageModal but as a page */}
    </div>
  );
}

export default App;
