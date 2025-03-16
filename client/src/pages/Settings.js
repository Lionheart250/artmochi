import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getImageUrl } from '../utils/imageUtils';
import './Settings.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSubscription } from '../features/subscriptions/store/SubscriptionContext';
import '../components/GeometricEffects.css';

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

const Settings = () => {
    const { user } = useAuth();
    const { profilePicture, setProfilePicture, updateProfilePicture } = useProfile();    
    const { currentSubscription, fetchSubscription } = useSubscription();
    const [activeSection, setActiveSection] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [tempProfilePicture, setTempProfilePicture] = useState(null);
    const [headerProfilePic, setHeaderProfilePic] = useState('/default-avatar.png');
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async () => {
        if (!user?.userId) return;
        
        try {
            setIsLoading(true);
            console.log('Starting profile fetch for ID:', user.userId);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${user.userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await response.json();
            console.log('Profile data received:', data);
            
            setUsername(data.username);
            setBio(data.bio || '');
            setUserEmail(data.email);
            
            if (data.profile_picture) {
                const profilePicUrl = getImageUrl(data.profile_picture, 'profile');
                setProfilePicture(profilePicUrl);
                setTempProfilePicture(profilePicUrl);
            } else {
                setProfilePicture('/default-avatar.png');
                setTempProfilePicture('/default-avatar.png');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [user?.userId]);

    // Add this useEffect to fetch subscription data
    useEffect(() => {
        if (user?.userId) {
            fetchSubscription();
        }
    }, [user?.userId]);

    // Add this inside the Settings component
    useEffect(() => {
        console.log('Current subscription state:', currentSubscription);
    }, [currentSubscription]);

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const token = localStorage.getItem('token');
            
            if (profilePictureFile) {
                const formData = new FormData();
                formData.append('image', profilePictureFile);
                
                const response = await fetch(`${process.env.REACT_APP_API_URL}/upload_profile_picture`, {                    
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to upload profile picture');
                }

                // Update profile picture using context
                await updateProfilePicture(data.profilePicturePath);
                
                // Clear temporary states
                setProfilePictureFile(null);
                setTempProfilePicture(null);
                setMessage('Profile picture updated successfully');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setMessage('Error: New passwords do not match. Please try again.');
            return;
        }
        
        // Validate new password
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setMessage(validation.messages.join('\n'));
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/change_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update password');
            }
    
            setMessage('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
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
            <div className="settings-sidebar">
                <button 
                    className={`settings-nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveSection('profile')}
                >
                    Profile
                </button>
                <button 
                    className={`settings-nav-btn ${activeSection === 'subscription' ? 'active' : ''}`}
                    onClick={() => setActiveSection('subscription')}
                >
                    Subscription
                </button>
                <button 
                    className={`settings-nav-btn ${activeSection === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveSection('security')}
                >
                    Security
                </button>
            </div>
            
            <div className="settings-content">
                {activeSection === 'profile' && (
                    <div className="settings-section">
                        <h3>Profile Settings</h3>
                        <div className="settings-profile-container">
                            <label htmlFor="settings-avatar-input" className="settings-avatar-label">
                                <img 
                                    src={tempProfilePicture || headerProfilePic || '/default-avatar.png'}
                                    alt="Profile" 
                                    className="settings-avatar"
                                    onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                                <div className="settings-avatar-overlay">
                                    <span className="settings-avatar-text">Change Photo</span>
                                </div>
                            </label>
                            <input
                                type="file"
                                id="settings-avatar-input"
                                className="settings-avatar-input"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                            />
                        </div>
                        <div className="account-info">
                            <div className="info-item">
                                <label>Email</label>
                                <p>{userEmail || user?.email || 'No email available'}</p>
                                <small></small>
                            </div>
                        </div>
                        <div className="settings-actions">
                            <button 
                                className="settings-save-btn"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'subscription' && (
                    <div className="settings-section">
                        <h3>Subscription Details</h3>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : (
                            <div className="subscription-info">
                                <div className="info-item">
                                    <label>Current Plan</label>
                                    <p>{currentSubscription?.tier_name || 'No active subscription'}</p>
                                </div>
                                {currentSubscription && (
                                    <>
                                        <div className="info-item">
                                            <label>Billing Period</label>
                                            <p>{currentSubscription.billing_period === 'month' ? 'Monthly' : 'Annual'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Next Billing Date</label>
                                            <p>
                                                {currentSubscription.current_period_end 
                                                    ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                        <div className="info-item">
                                            <label>Status</label>
                                            <p>{currentSubscription.status}</p>
                                        </div>
                                    </>
                                )}
                                <div className="settings-actions">
                                    <button 
                                        className="settings-btn"
                                        onClick={() => window.location.href = '/subscription'}
                                    >
                                        {currentSubscription ? 'Change Plan' : 'Subscribe'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'security' && (
                    <div className="settings-section">
                        <h3>Security Settings</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handlePasswordChange(e);
                        }} className="settings-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength="8"
                                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?:{}|<>])[A-Za-z\d!@#$%^&*(),.?:{}|<>]{8,}$"
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <small className="password-requirements">
                                    Password must contain:
                                    <ul>
                                        <li className={newPassword.length >= 8 ? 'valid' : ''}>
                                            {newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                                        </li>
                                        <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>
                                            {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                                        </li>
                                        <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>
                                            {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
                                        </li>
                                        <li className={/\d/.test(newPassword) ? 'valid' : ''}>
                                            {/\d/.test(newPassword) ? '✓' : '○'} One number
                                        </li>
                                        <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'valid' : ''}>
                                            {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '○'} One special character (!@#$%^&*)
                                        </li>
                                        <li className={newPassword && confirmPassword && newPassword === confirmPassword ? 'valid' : ''}>
                                            {newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '○'} Passwords match
                                        </li>
                                    </ul>
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="eye-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="settings-save-btn" 
                                disabled={loading || !validatePassword(newPassword).isValid || newPassword !== confirmPassword}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}

                {message && (
                    <div className={`settings-message ${message.includes('error') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};  

export default Settings;
