import React, { useState } from 'react';
import { useSubscription } from '../features/subscriptions/store/SubscriptionContext';
import { subscriptionApi } from '../features/subscriptions/api/subscriptionApi';
import '../components/GeometricEffects.css';
import './Subscription.css';

const Subscription = () => {
    const { 
        currentSubscription, 
        availableTiers, 
        isLoading, 
        upgradeSubscription,
        setCurrentSubscription // Add this
    } = useSubscription();
    
    const [billingPeriod, setBillingPeriod] = useState('monthly');
    const [selectedTierId, setSelectedTierId] = useState(null);

    const handlePlanSelect = async (tierId) => {
        setSelectedTierId(tierId);
        try {
            console.log('Starting subscription upgrade process...');
            console.log('User ID:', localStorage.getItem('userId'));
            console.log('Tier ID:', tierId);
            console.log('Billing Period:', billingPeriod);
            
            const data = await subscriptionApi.createCheckoutSession(tierId, billingPeriod);
            console.log('Subscription response:', data);

            if (data.isFree) {
                // Handle free tier subscription
                console.log('Free tier subscription created:', data.subscription);
                // Update local subscription state
                setCurrentSubscription(data.subscription);
                // Show success message
                alert('Successfully subscribed to Free tier!');
                // Optionally redirect to dashboard or profile
                window.location.href = '/';
                return;
            }

            if (!data.url) {
                throw new Error('No checkout URL received from server');
            }

            // Handle paid subscriptions
            console.log('Redirecting to checkout URL:', data.url);
            window.location.href = data.url;
        } catch (error) {
            setSelectedTierId(null); // Reset on error
            console.error('Subscription error:', error);
            alert('Failed to process subscription. Please try again.');
        }
    };

    const handleBillingPeriodChange = (period) => {
        setBillingPeriod(period);
        setSelectedTierId(null); // Clear selection when switching billing period
    };

    if (isLoading) {
        return <div className="subscription-loading">Loading plans...</div>;
    }

    return (
        <div className="page-container subscription-page">
            <div className="background-effects">
                <div className="terminal-grid"></div>
                <div className="scan-lines"></div>
                <div className="horizontal-scan"></div>
                <div className="hexagon-overlay"></div>
                <div className="sigil-flash"></div>
                <div className="micro-sigils"></div>
                <div className="ambient-pulse"></div>
                <div className="glitch-scan"></div>
                
                {/* Circuit nodes - add the number you want */}
                <div className="circuit-connections">
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                    <div className="circuit-node"></div>
                </div>
                </div>
            <div className="content-area">
                <div className="plans-header">
                    <h2>Choose Your Plan</h2>
                    {/* Only show billing toggle if there are paid plans available */}
                    {availableTiers.some(tier => tier.monthly_price > 0) && (
                        <div className="billing-toggle-container">
                            <div className="billing-toggle">
                                <button 
                                    className={billingPeriod === 'monthly' ? 'active' : ''}
                                    onClick={() => handleBillingPeriodChange('monthly')}
                                >
                                    Monthly Billing
                                </button>
                                <button 
                                    className={billingPeriod === 'annual' ? 'active' : ''}
                                    onClick={() => handleBillingPeriodChange('annual')}
                                >
                                    Annual Billing
                                    <span className="save-badge">Save 20%</span>
                                </button>
                            </div>
                            <div className="billing-hint">
                                Click to switch between monthly and annual billing options
                            </div>
                        </div>
                    )}
                </div>

                <div className="plans-grid">
                    {availableTiers.map((tier) => (
                        <div 
                            key={tier.id} 
                            className={`plan-card ${
                                currentSubscription?.tier_name === tier.name 
                                    ? 'current' 
                                    : selectedTierId === tier.id 
                                        ? 'selected' 
                                        : ''
                            }`}
                            onClick={() => {
                                if (currentSubscription?.tier_name !== tier.name) {
                                    setSelectedTierId(tier.id);
                                }
                            }}
                        >
                            <div className="plan-header">
                                <h3>{tier.name}</h3>
                                <div className="plan-price">
                                    {tier.name.toLowerCase() === 'free' ? (
                                        <>
                                            <span className="amount">$0</span>
                                            <span className="period">/month</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="amount">
                                                ${billingPeriod === 'monthly' ? 
                                                    Number(tier.monthly_price).toFixed(2) : 
                                                    Number(tier.annual_price).toFixed(2)}
                                            </span>
                                            <span className="period">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                                        </>
                                    )}
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
                                className={`plan-button ${currentSubscription?.tier_name === tier.name ? 'current' : ''}`}
                                onClick={() => handlePlanSelect(tier.id)}
                                disabled={currentSubscription?.tier_name === tier.name}
                            >
                                {currentSubscription?.tier_name === tier.name ? (
                                    <>
                                        <span>Current Plan</span>
                                        <span className="billing-info">
                                            {currentSubscription.billing_period === 'monthly' ? 'Monthly' : 'Annual'} billing
                                        </span>
                                    </>
                                ) : (
                                    `${currentSubscription?.tier_name === 'Free' ? 'Upgrade to' : 'Switch to'} ${tier.name}`
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Subscription;