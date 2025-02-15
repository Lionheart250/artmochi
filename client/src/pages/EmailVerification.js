import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EmailVerification.css';

const EmailVerification = () => {
    const [status, setStatus] = useState('verifying');
    const [email, setEmail] = useState('');
    const [canResend, setCanResend] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        verifyEmail();
    }, [token]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && !canResend) {
            setCanResend(true);
        }
    }, [countdown]);

    const verifyEmail = async () => {
        try {
            setStatus('verifying');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/verify-email/${token}`);
            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                
                if (data.token && data.refreshToken) {
                    try {
                        await login(data.token, data.refreshToken);
                        setTimeout(() => {
                            navigate('/', { replace: true });
                        }, 1500);
                    } catch (loginError) {
                        console.error('Login error:', loginError);
                        setStatus('error');
                    }
                }
            } else {
                setEmail(data.email || '');
                setStatus(data.error?.includes('expired') ? 'expired' : 'invalid');
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('resent');
                setCanResend(false);
                setCountdown(300); // 5 minutes cooldown
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Resend error:', error);
            setStatus('resendError');
        }
    };

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

            {status === 'expired' && (
                <div className="verification-message error">
                    <h2>Verification Link Expired</h2>
                    <p>Would you like to receive a new verification link?</p>
                    <button 
                        onClick={handleResend} 
                        disabled={!canResend}
                        className="resend-button"
                    >
                        {canResend 
                            ? 'Resend Verification Email' 
                            : `Wait ${countdown} seconds`}
                    </button>
                </div>
            )}

            {status === 'invalid' && (
                <div className="verification-message error">
                    <h2>Invalid Verification Link</h2>
                    <p>Please check your email for the correct verification link.</p>
                </div>
            )}

            {status === 'resent' && (
                <div className="verification-message">
                    <h2>Verification Email Sent!</h2>
                    <p>Please check your email for the new verification link.</p>
                </div>
            )}

            {status === 'error' && (
                <div className="verification-message error">
                    <h2>Verification Failed</h2>
                    <p>An error occurred during verification. Please try again or contact support.</p>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="redirect-button"
                    >
                        Go to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmailVerification;