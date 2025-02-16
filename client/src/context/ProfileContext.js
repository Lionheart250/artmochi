import React, { createContext, useContext, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('/default-avatar.png');
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const retryCount = useRef(0);
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const updateProfilePicture = async (newPicturePath) => {
        setProfilePicture(newPicturePath);
    };

    const fetchUserProfile = async (token) => {
        if (isLoading) return;
        
        try {
            setIsLoading(true);
            const decoded = jwtDecode(token);
            const userId = decoded.userId;

            const response = await fetch(`${process.env.REACT_APP_API_URL}/user_profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            setProfile(data);
            setProfilePicture(data.profile_picture || null);
            retryCount.current = 0; // Reset retry count on success
            return data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            if (retryCount.current < maxRetries) {
                retryCount.current++;
                console.log(`Retrying fetch (${retryCount.current}/${maxRetries}) in ${retryDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return fetchUserProfile(token);
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProfileContext.Provider value={{ 
            profile,
            profilePicture, 
            setProfilePicture,
            updateProfilePicture,
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