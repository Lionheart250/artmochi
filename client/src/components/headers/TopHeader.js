import React, { useState, useRef } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { ReactComponent as ExploreIcon } from '../../assets/icons/explore.svg';
import { ReactComponent as CreateIcon } from '../../assets/icons/create.svg';
import { ReactComponent as FollowingIcon } from '../../assets/icons/following.svg';

const TopHeader = ({ isActive, user, logout, profilePicElement, headerClass }) => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Toggle dropdown
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };
    
    // Function to close modal and navigate - FIXED VERSION
    const closeModalAndNavigate = (path, e) => {
        // Prevent default navigation
        if (e) e.preventDefault();
        
        // Check if Gallery cleanup function exists (we added this earlier)
        const needsGalleryCleanup = window.__galleryCleanup && document.querySelector('.custom-dropdown-wrapper');
        
        // Run gallery cleanup if available - this fixes the DOM insertion error
        if (needsGalleryCleanup) {
            console.log('Running gallery cleanup before navigation from TopHeader');
            window.__galleryCleanup();
        }
        
        // Different handling based on whether modal is open
        if (document.body.classList.contains('modal-open')) {
            // Close the modal first
            const closeButton = document.querySelector('.image-close-button');
            if (closeButton) {
                closeButton.click();
                
                // Navigate after a small delay to allow modal closing and cleanup to complete
                setTimeout(() => {
                    navigate(path);
                }, needsGalleryCleanup ? 50 : 30);
            } else {
                // If can't find close button, navigate directly after cleanup
                setTimeout(() => {
                    navigate(path);
                }, needsGalleryCleanup ? 10 : 0);
            }
        } else {
            // For non-modal navigation, still ensure cleanup completes first
            setTimeout(() => {
                navigate(path);
            }, needsGalleryCleanup ? 10 : 0);
        }
    };

    // Handle clicks outside dropdown
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Mobile navigation items
    const mobileNavItems = [
        { path: '/gallery', icon: <ExploreIcon />, text: 'Explore' },
        { path: '/imagegenerator', icon: <CreateIcon />, text: 'Create' },
        { path: '/following', icon: <FollowingIcon />, text: 'Following' }
    ];

    return (
        <header className={`header top-header ${!isActive ? 'hidden' : ''} ${headerClass}`}>
            <div className="header-container">
                <Link 
                    to="/" 
                    className="logo-link" 
                    onClick={(e) => {
                        closeModalAndNavigate('/', e);
                        sessionStorage.setItem('navigatingTo', 'home');
                    }} 
                    style={{ textDecoration: 'none' }}
                >
                    <div className="logo">
                        <h1>ArtMochi</h1>
                    </div>
                </Link>
                <nav className="nav-links">
                    {isActive && window.innerWidth > 768 && (
                        <>
                            <NavLink 
                                to="/gallery" 
                                end
                                onClick={(e) => closeModalAndNavigate('/gallery', e)}
                            >
                                Explore
                            </NavLink>
                            <NavLink 
                                to="/imagegenerator"
                                onClick={(e) => closeModalAndNavigate('/imagegenerator', e)}
                            >
                                Create
                            </NavLink>
                            <NavLink 
                                to="/following"
                                onClick={(e) => closeModalAndNavigate('/following', e)}
                            >
                                Following
                            </NavLink>
                        </>
                    )}
                </nav>
                {isActive && (
                    <div className="header-auth-buttons">
                        {user ? (
                            <div className="profile-dropdown" onClick={toggleDropdown} ref={dropdownRef}>
                                {profilePicElement}
                                <span className="header-username">{user?.username}</span>
                                {isDropdownOpen && (
                                    <div className="dropdown-menu">
                                        {window.innerWidth <= 768 && (
                                            <div className="mobile-nav-items">
                                                {mobileNavItems.map(item => (
                                                    <NavLink 
                                                        key={item.path} 
                                                        to={item.path}
                                                        onClick={(e) => closeModalAndNavigate(item.path, e)}
                                                    >
                                                        {item.icon}
                                                        <span>{item.text}</span>
                                                    </NavLink>
                                                ))}
                                            </div>
                                        )}
                                        <NavLink 
                                            to={`/profile/${user.userId || user.id}`}
                                            onClick={(e) => {
                                                // Run gallery cleanup if available
                                                if (window.__galleryCleanup) {
                                                    e.preventDefault();
                                                    setIsDropdownOpen(false); // Close dropdown first

                                                    window.__galleryCleanup();
                                                    // Navigate after a small delay to ensure cleanup completes
                                                        window.location.href = `/profile/${user.userId || user.id}`;
                                                } else {
                                                    closeModalAndNavigate(`/profile/${user.userId || user.id}`, e);
                                                }
                                            }}
                                        >
                                            Profile
                                        </NavLink>
                                        <NavLink 
                                            to="/subscription"
                                            onClick={(e) => closeModalAndNavigate('/subscription', e)}
                                        >
                                            Upgrade
                                        </NavLink>
                                        <NavLink 
                                            to="/settings"
                                            onClick={(e) => closeModalAndNavigate('/settings', e)}
                                        >
                                            Settings
                                        </NavLink>
                                        <button onClick={handleLogout} className="logout-btn">Log out</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <NavLink 
                                    to="/login" 
                                    className="auth-link"
                                    onClick={(e) => closeModalAndNavigate('/login', e)}
                                >
                                    Login
                                </NavLink>
                                <NavLink 
                                    to="/signup" 
                                    className="auth-link register"
                                    onClick={(e) => closeModalAndNavigate('/signup', e)}
                                >
                                    Sign Up
                                </NavLink>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopHeader;