import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [availableTiers, setAvailableTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscriptionData = async () => {
        try {
            console.log('Fetching subscription data...'); // Debug log
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/tiers`);
            if (!response.ok) {
                throw new Error('Failed to fetch tiers');
            }
            const data = await response.json();
            console.log('Received tiers:', data); // Debug log
            setAvailableTiers(data);
        } catch (err) {
            console.error('Error fetching tiers:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, []); // Run once on mount

    // Add this useEffect to fetch current subscription
    useEffect(() => {
        if (user?.userId) {
            fetchSubscription();
        }
    }, [user?.userId]);

    const upgradeSubscription = async (tierId, billingPeriod) => {
        try {
            const { url } = await subscriptionApi.createCheckoutSession(tierId, billingPeriod);
            window.location.href = url;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const cancelSubscription = async () => {
        try {
            await subscriptionApi.cancelSubscription();
            setCurrentSubscription(prev => prev ? { ...prev, status: 'canceled' } : null);
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const fetchSubscription = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/current`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch subscription');
            }

            const data = await response.json();
            console.log('Current subscription data:', data);
            if (data && Object.keys(data).length > 0) {
                setCurrentSubscription({
                    ...data,
                    current_period_end: new Date(data.current_period_end).getTime(),
                    tier_name: data.tier_name || 'Free'
                });
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateSubscription = (newSubscription) => {
        setCurrentSubscription(newSubscription);
    };

    // Add this to handle free tier updates
    const handleFreeSubscription = (subscription) => {
        setCurrentSubscription({
            ...subscription,
            tier_name: 'Free',
            status: 'active',
            billing_period: subscription.billing_period
        });
    };

    const value = {
        currentSubscription,
        availableTiers,
        isLoading,
        error,
        upgradeSubscription,
        cancelSubscription,
        fetchSubscription,
        setCurrentSubscription: updateSubscription,
        handleFreeSubscription
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};