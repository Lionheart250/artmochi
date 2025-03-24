import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import TribalLiquidMetal from '../components/TribalLiquidMetal';
import LiquidMetalContainer from '../components/LiquidMetalContainer';
import LiquidMetalButton from '../components/LiquidMetalButton'; // Import LiquidMetalButton
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const { fetchUserProfile } = useProfile();
    const containerRef = useRef(null);
    const mousePositionRef = useRef({ x: -1000, y: -1000 });

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

    // Track mouse for CSS variables
    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            
            document.documentElement.style.setProperty('--mouse-x', `${x}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y}%`);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="home-container" ref={containerRef}>
            {/* Tribal Liquid Metal Background - ensure it fills screen */}
            <TribalLiquidMetal />
            
            {/* Content Container */}
            <div className="content-container">
                {/* Remove any width/height constraints on content-container */}
                <div className="liquid-metal-wrapper">
                    {/* The wrapper ensures LiquidMetalContainer gets proper dimensions */}
                    <LiquidMetalContainer 
                        borderWidth={12}
                        className="custom-container"
                        style={{ 
                            width: '100%', 
                            height: '100%',
                            margin: '0 auto',
                            maxWidth: '900px' 
                        }}
                    >
                        <h1 className="glitch-title">
                            <span className="glitch-text" data-text="ArtMochi">ArtMochi</span>
                        </h1>
                        
                        <p className="site-tagline">AI ART CREATION & GALLERY PLATFORM</p>

                        {/* Neural Interface Controls - Now with LiquidMetalButtons */}
                        <div className="neural-interface">
                            <LiquidMetalButton 
                                to="/imagegenerator" 
                                borderWidth={6}
                                className="create-button"
                            >
                                <span className="link-text">CREATE ART</span>
                                <span className="link-path">/create</span>
                            </LiquidMetalButton>

                            <LiquidMetalButton 
                                to="/gallery" 
                                borderWidth={6}
                                className="gallery-button"
                            >
                                <span className="link-text">EXPLORE GALLERY</span>
                                <span className="link-path">/gallery</span>
                            </LiquidMetalButton>
                        </div>
                    </LiquidMetalContainer>
                </div>
            </div>
        </div>
    );
};

export default Home;
