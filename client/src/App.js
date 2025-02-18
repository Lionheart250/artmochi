import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <ProfileProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <Header />
            <Routes>
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
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
            <Footer />
          </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </ProfileProvider>
  );
}

export default App;
