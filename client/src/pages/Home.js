import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import DitherBackground from '../components/DitherBackground';
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
            {/* WebGL Dithered Background */}
            <DitherBackground />
            
            {/* Content Container */}
            <div className="content-container">
                <div className="interface-layer">
                    {/* System Status */}
                    <div className="system-status">
                        <div className="status-line">NEURAL_ENGINE: ONLINE</div>
                        <div className="status-metrics">AI_SYSTEMS: READY</div>
                    </div>

                    {/* Main Content */}
                    <div className="content-frame">
                        <h1 className="glitch-title">
                            <span className="glitch-text" data-text="ArtMochi">ArtMochi</span>
                        </h1>
                        
                        <p className="site-tagline">AI ART CREATION & GALLERY PLATFORM</p>

                        {/* Neural Interface Controls */}
                        <div className="neural-interface">
                            <Link to="/imagegenerator" className="neural-link">
                                <span className="link-text">CREATE ART</span>
                                <span className="link-path">/neural/create</span>
                            </Link>

                            <Link to="/gallery" className="neural-link">
                                <span className="link-text">EXPLORE GALLERY</span>
                                <span className="link-path">/neural/gallery</span>
                            </Link>
                        </div>
                    </div>

                    {/* System Signature */}
                    <div className="system-signature">
                        <span className="signature-text">[NEURAL_ART_ENGINE:V2.0]</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
