import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('/default-avatar.png');
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fetchInProgress = useRef(false);

    const fetchUserProfile = useCallback(async (token) => {
        if (fetchInProgress.current || isLoading) return;
        
        try {
            fetchInProgress.current = true;
            setIsLoading(true);
            
            const decoded = jwtDecode(token);
            const userId = decoded.userId;

            const response = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            setProfile(data);
            setProfilePicture(data.profile_picture || '/default-avatar.png');
            
        } catch (error) {
            console.error('Profile fetch error:', error);
        } finally {
            setIsLoading(false);
            fetchInProgress.current = false;
        }
    }, []); // Empty dependency array for useCallback

    // Add initialization effect
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !profile) {
            fetchUserProfile(token).catch(console.error);
        }
    }, []);

    return (
        <ProfileContext.Provider value={{
            profile,
            profilePicture,
            setProfilePicture,
            fetchUserProfile,
            isLoading
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};