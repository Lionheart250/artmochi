import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './VerificationSent.css';

const VerificationSent = () => {
  const { state } = useLocation();
  const { email, message } = state || {};
  const [verificationStatus, setVerificationStatus] = useState('waiting');
  const { login } = useAuth();
  const navigate = useNavigate();

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
          setVerificationStatus('verified');
          // Auto login if tokens are provided
          if (data.token && data.refreshToken) {
            await login(data.token, data.refreshToken);
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Verification check error:', error);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [email, login, navigate]);

  return (
    <div className="verification-sent-container">
      <div className="verification-sent-card">
        <h2>Check Your Email</h2>
        <div className="email-icon">✉️</div>
        <p>{message}</p>
        <p className="email-sent-to">
          We've sent a verification link to:<br />
          <strong>{email}</strong>
        </p>
        {verificationStatus === 'verified' && (
          <p className="verification-success">
            Email verified! Logging you in...
          </p>
        )}
        <div className="verification-links">
          <Link to="/login" className="login-link-button">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationSent;