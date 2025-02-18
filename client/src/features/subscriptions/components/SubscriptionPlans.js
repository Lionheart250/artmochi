import React, { useState } from 'react';
import { PlanCard } from './PlanCard';
import { useSubscription } from '../store/SubscriptionContext';

export const SubscriptionPlans = () => {
    const { 
        currentSubscription, 
        availableTiers, 
        isLoading, 
        upgradeSubscription 
    } = useSubscription();
    
    const [billingPeriod, setBillingPeriod] = useState('monthly');

    const handlePlanSelect = async (tierId) => {
        try {
            await upgradeSubscription(tierId, billingPeriod);
        } catch (error) {
            console.error('Failed to upgrade subscription:', error);
        }
    };

    if (isLoading) {
        return <div className="subscription-loading">Loading plans...</div>;
    }

    return (
        <div className="subscription-plans">
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
                    <PlanCard
                        key={tier.id}
                        tier={tier}
                        isCurrentPlan={currentSubscription?.tierId === tier.id}
                        onSelect={handlePlanSelect}
                    />
                ))}
            </div>
        </div>
    );
};