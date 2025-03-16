import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import './VerificationSent.css';
import '../components/GeometricEffects.css';

const VerificationSent = () => {
  const { state } = useLocation();
  const { email } = state || {};
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { fetchUserProfile } = useProfile();

  useEffect(() => {
    if (!email) return;

    const checkVerification = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/check-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok && data.isVerified) {
          // Do login first
          await login(data.token, data.refreshToken);
          await fetchUserProfile(data.token);
          // Navigate immediately, don't wait for state update
          navigate('/', { replace: true });
          // Set status after navigation started
          setVerificationStatus('verified');
        }
      } catch (error) {
        console.error('Check verification error:', error);
      }
    };

    const interval = setInterval(checkVerification, 2000);
    return () => clearInterval(interval);
  }, [email, login, navigate, fetchUserProfile]);

  return (
    <div className="verification-sent-container">
      <div className="background-effects">
                <div className="terminal-grid"></div>
                <div className="scan-lines"></div>
                <div className="horizontal-scan"></div>
                <div className="hexagon-overlay"></div>
                <div className="sigil-flash"></div>
                <div className="micro-sigils"></div>
                <div className="ambient-pulse"></div>
                <div className="glitch-scan"></div>
                
                {/* Circuit nodes - add the number you want */}
                <div className="circuit-connections">
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                </div>
                </div>
      <div className="verification-sent-card">
        <h2>Check Your Email</h2>
        <div className="email-icon">✉️</div>
        <p>We've sent a verification link to:</p>
        <p className="email-sent-to"><strong>{email}</strong></p>
        {verificationStatus === 'verified' && (
          <p className="verification-success">
            Email verified! Redirecting...
          </p>
        )}
      </div>
    </div>
  );
};

export default VerificationSent;