import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import './VerificationSent.css';

const VerificationSent = () => {
  const { state } = useLocation();
  const { email } = state || {};
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { fetchUserProfile } = useProfile();

  useEffect(() => {
    if (!email) return;

    let isSubscribed = true;

    const checkVerification = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/check-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!isSubscribed) return;

        if (response.ok && data.isVerified) {
          setVerificationStatus('verified');
          
          // Handle login sequence
          await login(data.token, data.refreshToken);
          await fetchUserProfile(data.token);
          
          // Force navigation after verification
          if (isSubscribed) {
            navigate('/', { replace: true });
          }
        }
      } catch (error) {
        console.error('Verification check error:', error);
      }
    };

    // Check immediately and then set up interval
    checkVerification();
    const interval = setInterval(checkVerification, 2000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [email, login, navigate, fetchUserProfile]);

  return (
    <div className="verification-sent-container">
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