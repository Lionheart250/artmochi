import React, { createContext, useContext, useState } from 'react';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const [profilePicture, setProfilePicture] = useState('/default-avatar.png');

    const updateProfilePicture = async (newPicturePath) => {
        setProfilePicture(newPicturePath);
    };

    return (
        <ProfileContext.Provider value={{ 
            profilePicture, 
            setProfilePicture,
            updateProfilePicture 
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