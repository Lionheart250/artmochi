import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './VerificationSent.css';

const VerificationSent = () => {
  const { state } = useLocation();
  const { email, message } = state || {};

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