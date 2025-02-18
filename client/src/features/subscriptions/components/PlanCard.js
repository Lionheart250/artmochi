import React from 'react';

export const PlanCard = ({ tier, isCurrentPlan, onSelect }) => {
    return (
        <div className={`plan-card ${isCurrentPlan ? 'current' : ''}`}>
            <div className="plan-header">
                <h3>{tier.name}</h3>
                <div className="plan-price">
                    <span className="amount">${tier.monthlyPrice}</span>
                    <span className="period">/month</span>
                </div>
            </div>
            
            <ul className="plan-features">
                <li>
                    <strong>{tier.features.imagesPerDay}</strong> 
                    {tier.features.imagesPerDay === -1 ? 'Unlimited' : ''} images per day
                </li>
                <li>Up to {tier.features.maxResolution} resolution</li>
                <li>{tier.features.maxConcurrent} concurrent generations</li>
                <li>
                    {tier.features.priority} priority in queue
                </li>
                {tier.features.customStyles && (
                    <li>Custom style presets</li>
                )}
                {tier.features.apiAccess && (
                    <li>API access</li>
                )}
                <li>{tier.features.maxStorage}GB storage</li>
            </ul>

            <button 
                className={`plan-button ${isCurrentPlan ? 'current' : ''}`}
                onClick={() => !isCurrentPlan && onSelect(tier.id)}
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
            </button>
        </div>
    );
};