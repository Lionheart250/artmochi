import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import './EmailVerification.css';

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

                // Always consider it a success if we get tokens
                if (response.ok && data.token && data.refreshToken) {
                    setStatus('success');
                    await login(data.token, data.refreshToken);
                    await fetchUserProfile(data.token);
                    setTimeout(() => navigate('/', { replace: true }), 1500);
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
            {status === 'verifying' && (
                <div className="verification-message">
                    <h2>Verifying your email...</h2>
                    <div className="loader"></div>
                </div>
            )}

            {status === 'success' && (
                <div className="verification-message success">
                    <h2>Email Verified Successfully!</h2>
                    <p>Redirecting to homepage...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="verification-message error">
                    <h2>Verification Failed</h2>
                    <p>There was a problem verifying your email. Please try again or contact support.</p>
                    <button onClick={() => navigate('/login')} className="redirect-button">
                        Go to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailVerification;