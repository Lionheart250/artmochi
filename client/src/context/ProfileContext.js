import React, { createContext, useContext, useState } from 'react';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('/default-avatar.png');

    const updateProfilePicture = async (newPicturePath) => {
        setProfilePicture(newPicturePath);
    };

    const fetchUserProfile = async (token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfilePicture(data.profilePicture);
                return data;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
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