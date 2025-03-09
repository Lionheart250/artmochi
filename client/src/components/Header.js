import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import TopHeader from './headers/TopHeader';
import SideHeader from './headers/SideHeader';
import useHeaderTransition from '../hooks/useHeaderTransition';
import './Header.css';
import { getImageUrl } from '../utils/imageUtils';

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const Header = () => {
    const { user, logout } = useAuth();
    const { profilePicture, fetchUserProfile } = useProfile();
    const [headerProfilePic, setHeaderProfilePic] = useState('/default-avatar.png');
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef(null);
    const moreButtonRef = useRef(null);
    const location = useLocation();
    const lastPathRef = useRef(location.pathname);
    
    // Use custom hook to manage header transitions
    const { 
      position: headerPosition,
      topClass: topHeaderClass, 
      sideClass: sideHeaderClass,
      updatePosition,
      handleModalClosing,
      forceHeaderPosition
    } = useHeaderTransition();
    
    // User profile loading
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

    // Update profile picture when available
    useEffect(() => {
        if (profilePicture) {
            setHeaderProfilePic(profilePicture);
        } else {
            setHeaderProfilePic('/default-avatar.png');
        }
    }, [profilePicture]);
    
    // Force update header position when navigating to homepage
    const homeNavigationHandler = useCallback(() => {
        if (location.pathname === '/') {
            console.log("🏠 Force TOP header for homepage navigation");
            forceHeaderPosition('top');
        }
    }, [location.pathname, forceHeaderPosition]);
    
    // Check for path changes and update header accordingly
    useEffect(() => {
        // Check if this is a new path
        if (location.pathname !== lastPathRef.current) {
            console.log(`📍 Path changed: ${lastPathRef.current} → ${location.pathname}`);
            lastPathRef.current = location.pathname;
            
            // Special case for homepage
            if (location.pathname === '/') {
                homeNavigationHandler();
            } else {
                // For other pages, just do a normal update, but with a small delay
                // to ensure any modal closing operations complete first
                setTimeout(updatePosition, 10);
            }
        }
    }, [location.pathname, updatePosition, homeNavigationHandler]);
    
    // Set up event listeners for header updates with proper cleanup
    useEffect(() => {
        // Initial position check
        updatePosition();
        
        // Resize handler with debounce
        const debouncedResize = debounce(updatePosition, 100);
        window.addEventListener('resize', debouncedResize);
        
        // Track when modal closing has been handled to prevent duplicates
        let justHandledModalClosing = false;
        let modalCloseTimer = null;
        
        // Create reusable handler functions that we can both add and remove
        const handleModalOpen = () => {
            console.log("Modal opened event detected");
            updatePosition();
        };
        
        const handleModalClose = () => {
            if (justHandledModalClosing) return;
            
            console.log("Modal closing event detected");
            justHandledModalClosing = true;
            
            // Clear existing timer if any
            if (modalCloseTimer) clearTimeout(modalCloseTimer);
            
            // Handle modal closing
            handleModalClosing();
            
            // Reset flag after a while
            modalCloseTimer = setTimeout(() => {
                justHandledModalClosing = false;
            }, 1500);
        };
        
        // Add event listeners using the named functions
        document.addEventListener('modalopened', handleModalOpen);
        document.addEventListener('modalclosing', handleModalClose);
        
        // Create observer for body class changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') {
                    const bodyClasses = document.body.className;
                    
                    if (bodyClasses.includes('modal-closing')) {
                        if (!justHandledModalClosing) {
                            console.log("👀 Modal closing detected from body class");
                            handleModalClose();
                        }
                    } else if (bodyClasses.includes('modal-open')) {
                        updatePosition();
                    } else if (!justHandledModalClosing) {
                        // Only do regular updates if we're not handling a modal close
                        updatePosition();
                    }
                }
            });
        });
        
        observer.observe(document.body, { attributes: true });
        
        // Clean up all listeners using the same function references
        return () => {
            window.removeEventListener('resize', debouncedResize);
            document.removeEventListener('modalopened', handleModalOpen);
            document.removeEventListener('modalclosing', handleModalClose);
            if (modalCloseTimer) clearTimeout(modalCloseTimer);
            observer.disconnect();
        };
    }, [updatePosition, handleModalClosing]);

    // Toggle more menu
    const toggleMoreMenu = () => setIsMoreMenuOpen(!isMoreMenuOpen);

    // Handle clicks outside more menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMoreMenuOpen && 
                !moreButtonRef.current?.contains(event.target) && 
                !moreMenuRef.current?.contains(event.target)) {
                setIsMoreMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMoreMenuOpen]);

    // Profile picture element
    const profilePicElement = (
        <img 
            src={headerProfilePic ? getImageUrl(headerProfilePic, 'profile') : '/default-avatar.png'}
            alt={user?.username || "User"}
            className="header-profile-pic"
            onError={(e) => {
                if (e.target.src !== '/default-avatar.png') {
                    e.target.src = '/default-avatar.png';
                }
            }}
        />
    );

    return (
        <>
            {/* Only render the top header when it's active OR transitioning */}
            {(headerPosition === 'top' || topHeaderClass === 'entering' || topHeaderClass === 'exiting') && (
                <TopHeader 
                    isActive={headerPosition === 'top'}
                    user={user}
                    logout={logout}
                    profilePicElement={profilePicElement}
                    headerClass={topHeaderClass}
                />
            )}
            
            {/* Only render the side header when it's active OR transitioning */}
            {(headerPosition === 'side' || sideHeaderClass === 'entering' || sideHeaderClass === 'exiting') && (
                <SideHeader 
                    isActive={headerPosition === 'side'}
                    user={user}
                    logout={logout}
                    profilePicElement={profilePicElement}
                    toggleMoreMenu={toggleMoreMenu}
                    moreButtonRef={moreButtonRef}
                    headerClass={sideHeaderClass}
                />
            )}
            
            {isMoreMenuOpen && (
                <div className="more-drawer-container open" ref={moreMenuRef}>
                    <div className="more-dropdown-menu">
                        <NavLink to="/settings">Settings</NavLink>
                        <NavLink to="/language">Language</NavLink>
                        <NavLink to="/feedback">Feedback</NavLink>
                        <NavLink to="/keyboard">Keyboard shortcuts</NavLink>
                        <button 
                            onClick={() => {
                                logout();
                                setIsMoreMenuOpen(false);
                            }} 
                            className="logout-button"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;