import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import './EmailVerification.css';
import '../components/GeometricEffects.css';

const EmailVerification = () => {
    const [status, setStatus] = useState('verifying');
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { fetchUserProfile } = useProfile();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-email/${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    await login(data.token, data.refreshToken);
                    await fetchUserProfile(data.token); // Fetch profile here
                    // Add 4 second delay before navigation
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 4000);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
            }
        };

        verifyEmail();
    }, [token, login, navigate, fetchUserProfile]);

    return (
        <div className="verification-container">
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
            {status === 'verifying' && (
                <div className="verification-message">
                    <h2>Verifying your email...</h2>
                    <div className="loader"></div>
                </div>
            )}

            {status === 'success' && (
                <div className="verification-message success">
                    <h2>Email Verified Successfully!</h2>
                    <p>Redirecting...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="verification-message error">
                    <h2>Email Verified</h2>
                    <p>Your email has been verified. You can now log in.</p>
                    <button onClick={() => navigate('/login')} className="redirect-button">
                        Go to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailVerification;