import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import  './Header.css';
import { ReactComponent as ExploreIcon } from '../assets/icons/explore.svg';
import { ReactComponent as CreateIcon } from '../assets/icons/create.svg';
import { ReactComponent as FollowingIcon } from '../assets/icons/following.svg';
import { ReactComponent as UpgradeIcon } from '../assets/icons/upgrade.svg';
import { ReactComponent as CreditsIcon } from '../assets/icons/credits.svg';
import { ReactComponent as SettingsIcon } from '../assets/icons/settings.svg';
import { ReactComponent as MoreIcon } from '../assets/icons/more.svg';
import { getImageUrl } from '../utils/imageUtils';

const Header = () => {
    const { user, logout } = useAuth();
    const { profilePicture, fetchUserProfile } = useProfile();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [headerProfilePic, setHeaderProfilePic] = useState('/default-avatar.png');
    const [headerPosition, setHeaderPosition] = useState('side');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef(null);
    const moreButtonRef = useRef(null);

    // Add this after your existing state variables
    const mobileNavItems = [
        { path: '/gallery', icon: <ExploreIcon />, text: 'Explore' },
        { path: '/imagegenerator', icon: <CreateIcon />, text: 'Create' },
        { path: '/following', icon: <FollowingIcon />, text: 'Following' }
    ];

    // Log user object to check structure
    useEffect(() => {
        console.log('Current user object:', user);
    }, [user]);

    // Replace the existing profile picture fetch effect with this
    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('token');
            if (user && token) {
                try {
                    await fetchUserProfile(token);
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        };

        loadProfile();
    }, [user, fetchUserProfile]);

    // Remove the separate fetchProfilePicture effect since we'll use profilePicture from context
    useEffect(() => {
        if (profilePicture) {
            setHeaderProfilePic(profilePicture);
        } else {
            setHeaderProfilePic('/default-avatar.png');
        }
    }, [profilePicture]);

    // Update the header position effect
    useEffect(() => {
        const updateHeaderPosition = () => {
            // Check if modal is open by looking at body class
            const isModalOpen = document.body.classList.contains('modal-open');
            
            if (isModalOpen) {
                // Always use top header when modal is open
                setHeaderPosition('top');
                return;
            }
            
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                setHeaderPosition('top');
            } else {
                const topHeaderPages = ['/'];
                const shouldBeTop = topHeaderPages.includes(location.pathname);
                setHeaderPosition(shouldBeTop ? 'top' : 'side');
            }
        };

        // Initial check
        updateHeaderPosition();

        // Add resize listener
        window.addEventListener('resize', updateHeaderPosition);
        
        // Create an observer to watch for body class changes
        const bodyObserver = new MutationObserver(updateHeaderPosition);
        bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        // Cleanup
        return () => {
            window.removeEventListener('resize', updateHeaderPosition);
            bodyObserver.disconnect();
        };
    }, [location.pathname]);

    const handleLogout = ()  => {
        logout();
        setIsDropdownOpen(false);
        setIsMoreMenuOpen(false);
        navigate('/');
    };

    const toggleMoreMenu = () => {
        setIsMoreMenuOpen(!isMoreMenuOpen);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Click outside effect
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (isMoreMenuOpen && 
                !moreButtonRef.current?.contains(event.target) && 
                !moreMenuRef.current?.contains(event.target)) {
                setIsMoreMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMoreMenuOpen]); // Add isMoreMenuOpen dependency

    const profilePicElement = (
        <img 
            src={headerProfilePic ? getImageUrl(headerProfilePic, 'profile') : '/default-avatar.png'}
            alt={user?.username}
            className="header-profile-pic"
            onError={(e) => {
                if (!headerProfilePic) {
                    const token = localStorage.getItem('token');
                    if (token && user?.id) {
                        // Retry fetch on error
                        fetch(`${process.env.REACT_APP_API_URL}/user_profile/${user.id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include'
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.profile_picture) {
                                setHeaderProfilePic(getImageUrl(data.profile_picture, 'profile'));
                            }
                        })
                        .catch(() => {
                            e.target.src = '/default-avatar.png';
                        });
                    }
                }
                e.target.src = '/default-avatar.png';
            }}
        />
    );

    return (
        <>
            <header className={`header ${headerPosition}-header ${isMoreMenuOpen ? 'drawer-open' : ''}`}>
                <div className="header-container">
                    <Link to="/" className="logo-link" style={{ textDecoration: 'none' }}>
                        <div className="logo">
                            <h1>ArtMochi</h1>
                        </div>
                    </Link>
                    <nav className="nav-links">
                        {headerPosition === 'top' && window.innerWidth > 768 && (
                            <>
                                <NavLink to="/gallery" end>Explore</NavLink>
                                <NavLink to="/imagegenerator">Create</NavLink>
                                <NavLink to="/following">Following</NavLink>
                            </>
                        )}
                        {headerPosition === 'side' && (
                            <>
                                <NavLink to="/gallery" className="side-nav-link">
                                    <ExploreIcon className="nav-icon" />
                                    <span>Explore</span>
                                </NavLink>
                                <NavLink to="/imagegenerator" className="side-nav-link">
                                    <CreateIcon className="nav-icon" />
                                    <span>Create</span>
                                </NavLink>
                                <NavLink to="/following" className="side-nav-link">
                                    <FollowingIcon className="nav-icon" />
                                    <span>Following</span>
                                </NavLink>
                                {user ? (
                                    <NavLink to={`/profile/${user.userId}`} className="side-nav-link">
                                        {profilePicElement}
                                        <span>Profile</span>
                                    </NavLink>
                                ) : (
                                    <NavLink to="/login" className="side-nav-link">
                                        <img src="/default-avatar.png" alt="Sign In" className="nav-icon header-profile-pic" />
                                        <span>Sign In</span>
                                    </NavLink>
                                )}
                                <NavLink to="/subscription" className="side-nav-link">
                                    <UpgradeIcon className="nav-icon" />
                                    <span>Upgrade</span>
                                </NavLink>
                                {/*<NavLink to="/credits" className="side-nav-link">
                                    <CreditsIcon className="nav-icon" />
                                    <span>Credits</span>
                                </NavLink> */}
                                <NavLink to="/settings" className="side-nav-link">
                                    <SettingsIcon className="nav-icon" />
                                    <span>Settings</span>
                                </NavLink>
                                <button 
                                    className="side-nav-link more-menu-button" 
                                    onClick={toggleMoreMenu}
                                    ref={moreButtonRef}
                                >
                                    <MoreIcon className="nav-icon" />
                                    <span>More</span>
                                </button>
                            </>
                        )}
                    </nav>
                    {headerPosition === 'top' && (
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
                                                        <NavLink key={item.path} to={item.path}>
                                                            {item.icon}
                                                            <span>{item.text}</span>
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                            <NavLink to={`/profile/${user.userId}`}>Profile</NavLink>
                                            <NavLink to="/subscription">Upgrade</NavLink>
                                            <NavLink to="/settings">Settings</NavLink>
                                            <button onClick={handleLogout} className="logout-btn">Log out</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <NavLink to="/login">Login</NavLink>
                                    <NavLink to="/signup">Sign Up</NavLink>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>
            
            {isMoreMenuOpen && (
                <div className="more-drawer-container open" ref={moreMenuRef}>
                    <div className="more-dropdown-menu">
                        <NavLink to="/settings">Settings</NavLink>
                        <NavLink to="/language">Language</NavLink>
                        <NavLink to="/feedback">Feedback</NavLink>
                        <NavLink to="/keyboard">Keyboard shortcuts</NavLink>
                        <button onClick={handleLogout} className="logout-button">
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
