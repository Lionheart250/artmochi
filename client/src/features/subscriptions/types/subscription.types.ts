export interface SubscriptionTier {
    id: number;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
    features: {
        imagesPerDay: number;
        maxResolution: string;
        aiModels: string[];
        maxConcurrent: number;
        priority: 'normal' | 'high' | 'highest';
        canShare: boolean;
        maxStorage: number;
        customStyles: boolean;
        apiAccess: boolean;
    };
}

export interface UserSubscription {
    id: number;
    userId: number;
    tierId: number;
    status: 'active' | 'canceled' | 'past_due';
    billingPeriod: 'monthly' | 'annual';
    currentPeriodEnd: string;
}