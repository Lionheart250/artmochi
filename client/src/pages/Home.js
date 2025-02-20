import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const { fetchUserProfile } = useProfile();

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

    return (
        <div className="home-container">
            <div className="home-hero">
                <h1 className="home-title">
                    Welcome to <span className="highlight">ArtMochi</span>
                </h1>
                <p className="home-subtitle">
                    Create beautiful images with the power of AI
                </p>
                <div className="home-cta">
                    <Link to="/imagegenerator" className="home-button primary">
                        Start Creating
                    </Link>
                    <Link to="/gallery" className="home-button secondary">
                        View Gallery
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
