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
            if (refreshToken && isTokenExpired(token)) {
                try {
                    const response = await axios.post('http://localhost:3000/refresh', { refreshToken });
                    const { token: newToken, refreshToken: newRefreshToken } = response.data;
                    login(newToken, newRefreshToken);
                } catch (error) {
                    console.error('Failed to refresh token:', error);
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
