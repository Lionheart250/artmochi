import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EmailVerification = () => {
    const [status, setStatus] = useState('verifying');
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/verify-email/${token}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus('error');
                } else {
                    setStatus('success');
                    setTimeout(() => navigate('/login'), 3000);
                }
            })
            .catch(() => setStatus('error'));
    }, [token, navigate]);

    return (
        <div className="verification-container">
            {status === 'verifying' && <p>Verifying your email...</p>}
            {status === 'success' && <p>Email verified successfully! Redirecting to login...</p>}
            {status === 'error' && <p>Verification failed. Please try again or contact support.</p>}
        </div>
    );
};

export default EmailVerification;