import React, { useState } from 'react';
import { useSubscription } from '../features/subscriptions/store/SubscriptionContext';
import { subscriptionApi } from '../features/subscriptions/api/subscriptionApi';

import './Subscription.css';

const Subscription = () => {
    const { 
        currentSubscription, 
        availableTiers, 
        isLoading, 
        upgradeSubscription 
    } = useSubscription();
    
    const [billingPeriod, setBillingPeriod] = useState('monthly');

    const handlePlanSelect = async (tierId) => {
        try {
            console.log('Starting subscription upgrade process...');
            console.log('User ID:', localStorage.getItem('userId'));
            console.log('Tier ID:', tierId);
            console.log('Billing Period:', billingPeriod);
            
            const data = await subscriptionApi.createCheckoutSession(tierId, billingPeriod);
            console.log('Checkout session response:', data);

            if (!data) {
                throw new Error('No response received from checkout session creation');
            }

            if (!data.url) {
                console.error('Invalid response data:', data);
                throw new Error('No checkout URL received from server');
            }

            // Log before redirect
            console.log('Redirecting to checkout URL:', data.url);
            window.location.href = data.url;
        } catch (error) {
            console.error('Detailed upgrade error:', {
                message: error.message,
                stack: error.stack,
                responseData: error.response?.data
            });
            
            // More user-friendly error message
            const errorMessage = error.response?.data?.error || error.message || 'Failed to process upgrade';
            alert(`Subscription upgrade failed: ${errorMessage}. Please try again or contact support.`);
        }
    };

    if (isLoading) {
        return <div className="subscription-loading">Loading plans...</div>;
    }

    return (
        <div className="page-container subscription-page">
            <div className="content-area">
                <div className="plans-header">
                    <h2>Choose Your Plan</h2>
                    <div className="billing-toggle">
                        <button 
                            className={billingPeriod === 'monthly' ? 'active' : ''}
                            onClick={() => setBillingPeriod('monthly')}
                        >
                            Monthly
                        </button>
                        <button 
                            className={billingPeriod === 'annual' ? 'active' : ''}
                            onClick={() => setBillingPeriod('annual')}
                        >
                            Annually
                            <span className="save-badge">Save 20%</span>
                        </button>
                    </div>
                </div>

                <div className="plans-grid">
                    {availableTiers.map((tier) => (
                        <div 
                            key={tier.id} 
                            className={`plan-card ${currentSubscription?.tierId === tier.id ? 'current' : ''}`}
                        >
                            <div className="plan-header">
                                <h3>{tier.name}</h3>
                                <div className="plan-price">
                                    <span className="amount">
                                        ${billingPeriod === 'monthly' ? 
                                            Number(tier.monthly_price).toFixed(2) : 
                                            Number(tier.annual_price).toFixed(2)}
                                    </span>
                                    <span className="period">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                </div>
                            </div>
                            
                            <ul className="plan-features">
                                <li>{tier.features.imagesPerDay === -1 ? 'Unlimited' : tier.features.imagesPerDay} images per day</li>
                                <li>Up to {tier.features.maxResolution} resolution</li>
                                <li>{tier.features.maxConcurrent} concurrent generations</li>
                                <li>{tier.features.priority} priority in queue</li>
                                {tier.features.customStyles && <li>Custom style presets</li>}
                                {tier.features.apiAccess && <li>API access</li>}
                                <li>{tier.features.maxStorage}GB storage</li>
                            </ul>

                            <button 
                                className={`plan-button ${currentSubscription?.tierId === tier.id ? 'current' : ''}`}
                                onClick={() => handlePlanSelect(tier.id)}
                                disabled={currentSubscription?.tierId === tier.id}
                            >
                                {currentSubscription?.tierId === tier.id ? 'Current Plan' : 'Upgrade'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Subscription;