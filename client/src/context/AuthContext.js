import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

    const decodeAndSetUser = (token) => {
        try {
            const decodedToken = jwtDecode(token);
            setUser({
                id: decodedToken.userId,
                username: decodedToken.username,
                role: decodedToken.role,
            });
        } catch (error) {
            console.error('Failed to decode token:', error);
            logout();
        }
    };

    const isTokenExpired = (token) => {
        try {
            const { exp } = jwtDecode(token);
            return Date.now() >= exp * 1000;
        } catch {
            return true;
        }
    };

    const login = async (token, refreshToken) => {
        try {
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            setToken(token);
            setRefreshToken(refreshToken);
            const decoded = jwtDecode(token);
            setUser({
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role
            });
            setIsAuthenticated(true);
            return token;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    useEffect(() => {
        const refreshAuthToken = async () => {
            // Add check for emergency loop prevention at the top
            if (localStorage.getItem('pauseAuthRefresh') === 'true') {
                console.log('Auth refresh is paused due to too many failures');
                return; // Skip the entire function if we're in emergency mode
            }

            if (refreshToken && isTokenExpired(token)) {
                try {
                    // Use environment variable or window.location
                    const baseUrl = process.env.REACT_APP_API_URL || 
                                    (window.location.hostname === 'localhost' ? 
                                    'http://localhost:3000' : 
                                    'https://api.artmochi.com'); // Or your actual production API URL
                    
                    // Use this baseUrl for refresh
                    const response = await axios.post(`${baseUrl}/refresh`, { refreshToken });
                    const { token: newToken, refreshToken: newRefreshToken } = response.data;
                    login(newToken, newRefreshToken);
                } catch (error) {
                    console.error('Failed to refresh token:', error);
                    
                    // Emergency Loop Prevention - Check how many failures we've had
                    const failCount = parseInt(localStorage.getItem('tokenRefreshFails') || '0');
                    localStorage.setItem('tokenRefreshFails', (failCount + 1).toString());
                    
                    // If we've failed too many times, just stop trying for a while
                    if (failCount > 3) {
                        console.log('Too many token refresh failures, suspending auth checks for 1 minute');
                        localStorage.setItem('pauseAuthRefresh', 'true');
                        
                        // Resume after 1 minute
                        setTimeout(() => {
                            localStorage.removeItem('tokenRefreshFails');
                            localStorage.removeItem('pauseAuthRefresh');
                        }, 60000);
                        
                        return; // Don't logout, just stop the cycle
                    }
                    
                    logout();
                }
            } else if (token) {
                decodeAndSetUser(token);
            }
        };

        refreshAuthToken();
    }, [token, refreshToken]);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 > Date.now()) {
                        setUser({
                            userId: decoded.userId,
                            username: decoded.username,
                            role: decoded.role
                        });
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                    }
                } catch (error) {
                    console.error('Token initialization error:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
            }
        };

        initializeAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout,
            setIsAuthenticated,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
