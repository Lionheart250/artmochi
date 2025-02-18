class SubscriptionApi {
    constructor() {
        this.baseUrl = `${process.env.REACT_APP_API_URL}/subscription`;
    }

    async getCurrentSubscription() {
        const response = await fetch(`${this.baseUrl}/current`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subscription');
        }

        return response.json();
    }

    async getAvailableTiers() {
        const response = await fetch(`${this.baseUrl}/tiers`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch subscription tiers');
        }

        return response.json();
    }

    async createCheckoutSession(tierId, billingPeriod) {
        try {
            console.log('Making checkout session request:', {
                url: `${this.baseUrl}/create-checkout`,
                tierId,
                billingPeriod
            });

            const response = await fetch(`${this.baseUrl}/create-checkout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tierId, billingPeriod })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Checkout session creation failed:', data);
                throw new Error(data.error || 'Failed to create checkout session');
            }

            return data;
        } catch (error) {
            console.error('Checkout session error:', error);
            throw error;
        }
    }

    async cancelSubscription() {
        const response = await fetch(`${this.baseUrl}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel subscription');
        }
    }
}

export const subscriptionApi = new SubscriptionApi();