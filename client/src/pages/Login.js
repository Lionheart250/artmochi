import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { jwtDecode } from 'jwt-decode'; 
import { useAuth } from '../context/AuthContext'; // Import useAuth to access the AuthContext
import { useProfile } from '../context/ProfileContext';
import './Login.css';
import '../components/GeometricEffects.css';

const Login = () => {
    const { setProfilePicture } = useProfile();
    const navigate = useNavigate(); 
    const { login } = useAuth(); // Access login function from AuthContext
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnverified, setIsUnverified] = useState(false);

    const fetchProfilePicture = async (token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/profile_picture`, {                
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.profile_picture) {
                    setProfilePicture(data.profile_picture ? 
                        `${process.env.REACT_APP_API_URL}/${data.profile_picture}` : 
                        '/default-avatar.png'
                    );                
                }
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUnverified(false);

        const payload = { email, password };

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/login`, {                
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.status === 403 && data.requiresVerification) {
                setIsUnverified(true);
                setError('Please verify your email to login');
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and userId
            const { token, refreshToken } = data; // Assuming the response also includes a refresh token
            localStorage.setItem('token', token); // Save the token for future use

            // Decode token to get userId
            const decodedToken = jwtDecode(token);
            localStorage.setItem('userId', decodedToken.userId); // Save userId to localStorage
            
            // Call the login function to update the user context
            login(token, refreshToken); // Add refresh token if available

            await fetchProfilePicture(token);

            navigate('/'); // Redirect to home page
        } catch (err) {
            setError(err.message);
        }
    };

    const handleResendVerification = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/verification-sent', { state: { email } });
            } else {
                setError(data.error || 'Failed to resend verification email');
            }
        } catch (err) {
            setError('Failed to resend verification email');
        }
    };

    return (
        <div className="login-container">
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
            <h2 className="login-heading">Login</h2>
            <form id="login-form" className="login-form" onSubmit={handleSubmit}>
                <div className="login-form-group">
                    <label className="login-label" htmlFor="email">Email:</label>
                    <input
                        className="login-input"
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="login-form-group">
                    <label className="login-label" htmlFor="password">Password:</label>
                    <input
                        className="login-input"
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {error && (
                    <div className="error-message">
                        {error}
                        {isUnverified && (
                            <button 
                                type="button"
                                onClick={handleResendVerification}
                                className="resend-verification-btn"
                            >
                                Resend Verification Email
                            </button>
                        )}
                    </div>
                )}
                <button type="submit" className="login-submit-btn">Log In</button>
            </form>
            <div className="signup-link">
                Don't have an account? <a href="/signup">Sign Up</a>
            </div>
        </div>
    );
};

export default Login;
