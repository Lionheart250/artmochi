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

                if (!response.ok) {
                    setStatus('error');
                    return;
                }

                // Set success status
                setStatus('success');

                // Perform login
                if (data.token && data.refreshToken) {
                    try {
                        await login(data.token, data.refreshToken);
                        await fetchUserProfile(data.token);
                        // Navigate after successful login
                        navigate('/', { replace: true });
                    } catch (loginError) {
                        console.error('Login error:', loginError);
                        setStatus('error');
                    }
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