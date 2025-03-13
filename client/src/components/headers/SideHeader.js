import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ReactComponent as ExploreIcon } from '../../assets/icons/explore.svg';
import { ReactComponent as CreateIcon } from '../../assets/icons/create.svg';
import { ReactComponent as FollowingIcon } from '../../assets/icons/following.svg';
import { ReactComponent as UpgradeIcon } from '../../assets/icons/upgrade.svg';
import { ReactComponent as SettingsIcon } from '../../assets/icons/settings.svg';
import { ReactComponent as MoreIcon } from '../../assets/icons/more.svg';

const SideHeader = ({ 
    isActive, 
    user, 
    logout, 
    profilePicElement, 
    toggleMoreMenu, 
    moreButtonRef, 
    headerClass 
}) => {
    return (
        <header className={`header side-header ${!isActive ? 'hidden' : ''} ${headerClass}`}>
            <div className="header-container">
                <Link to="/" className="logo-link" style={{ textDecoration: 'none' }}>
                    <div className="logo">
                        <h1>ArtMochi</h1>
                    </div>
                </Link>
                
                <nav className="nav-links">
                    {isActive && (
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
                                <NavLink 
                                    to={`/profile/${user.userId || user.id}`} 
                                    className="side-nav-link"
                                    onClick={(e) => {
                                        // Run gallery cleanup if available
                                        if (window.__galleryCleanup) {
                                            e.preventDefault();
                                            window.__galleryCleanup();
                                            // Navigate after a small delay to ensure cleanup completes
                                            setTimeout(() => {
                                                window.location.href = `/profile/${user.userId || user.id}`;
                                            }, 10);
                                        }
                                    }}
                                >
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
            </div>
        </header>
    );
};

export default SideHeader;