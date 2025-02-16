import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('/default-avatar.png');

    const updateProfilePicture = async (newPicturePath) => {
        setProfilePicture(newPicturePath);
    };

    const fetchUserProfile = async (token) => {
        try {
            // Get userId from the decoded token
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
            return data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    };

    return (
        <ProfileContext.Provider value={{ 
            profilePicture, 
            setProfilePicture,
            updateProfilePicture,
            fetchUserProfile
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