import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Ensure jwtDecode is imported with curly braces
import { useAuth } from '../context/AuthContext'; // Import useAuth to access the AuthContext
import { useProfile } from '../context/ProfileContext';
import './Signup.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Add these imports at the top

// Add validatePassword function above the Signup component
const validatePassword = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const messages = [];
    if (!requirements.minLength) messages.push('Password must be at least 8 characters long');
    if (!requirements.hasUpperCase) messages.push('Include at least one uppercase letter');
    if (!requirements.hasLowerCase) messages.push('Include at least one lowercase letter');
    if (!requirements.hasNumber) messages.push('Include at least one number');
    if (!requirements.hasSpecialChar) messages.push('Include at least one special character');

    return {
        isValid: Object.values(requirements).every(Boolean),
        messages
    };
};

// Add these validation functions at the top with your validatePassword function
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

const validateForm = (username, email, password) => {
    const errors = [];
    
    if (!username || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (!email || !validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.messages);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();
  const { login } = useAuth(); // Destructure login from useAuth
  const { setProfilePicture } = useProfile(); // Destructure setProfilePicture from useProfile
  const [showPassword, setShowPassword] = useState(false); // Inside the Signup component, add this state

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
      } else {
        console.error('Failed to fetch profile picture:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // Start loading

    try {
      // Validate all fields
      const validation = validateForm(username, email, password);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        setIsLoading(false); // Stop loading on validation error
        return;
      }

      // Rest of your existing signup logic...
      const checkResponse = await fetch(`${process.env.REACT_APP_API_URL}/check-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      const checkData = await checkResponse.json();
      
      if (!checkResponse.ok) {
        setError(checkData.error || 'Username or email already exists');
        setIsLoading(false); // Stop loading on error
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Show success message and redirect
        setIsLoading(false); // Stop loading on success
        navigate('/verification-sent', { 
          state: { 
            email,
            message: 'Registration successful! Please check your email to verify your account.' 
          }
        });
      } else {
        setError(data.error || 'An error occurred during signup.');
        setIsLoading(false); // Stop loading on error
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Failed to connect to the server.');
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="signup-container">
        <h2 className="signup-page-heading">Sign Up</h2>
        <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-form-group">
                <label className="signup-label" htmlFor="username">Username:</label>
                <input
                    className="signup-input"
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="signup-form-group">
                <label className="signup-label" htmlFor="email">Email:</label>
                <input
                    className="signup-input"
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="signup-form-group">
                <label className="signup-label" htmlFor="password">Password:</label>
                <div className="password-input-container">
                    <input
                        className="signup-input"
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="8"
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?:{}|<>])[A-Za-z\d!@#$%^&*(),.?:{}|<>]{8,}$"
                    />
                    <button
                        type="button"
                        className="eye-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                <small className="password-requirements">
                    Password must contain:
                    <ul>
                        <li className={password.length >= 8 ? 'valid' : ''}>
                            {password.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(password) ? 'valid' : ''}>
                            {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(password) ? 'valid' : ''}>
                            {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/\d/.test(password) ? 'valid' : ''}>
                            {/\d/.test(password) ? '✓' : '○'} One number
                        </li>
                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : ''}>
                            {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'} One special character (!@#$%^&*)
                        </li>
                    </ul>
                </small>
            </div>
            {error && <div className="signup-error">{error}</div>}
            <button 
              type="submit" 
              className={`signup-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="button-content">
                  <span className="spinner"></span>
                  Creating Account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
        </form>
        <div className="login-link">
            Already have an account? <a href="/login">Login</a>
        </div>
    </div>
  );
}

export default Signup;
