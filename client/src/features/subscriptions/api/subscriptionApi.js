class SubscriptionApi {
    constructor() {
        console.log('Current API URL:', process.env.REACT_APP_API_URL);
        // Add /api prefix to match your server routes
        this.baseUrl = `${process.env.REACT_APP_API_URL}/api/subscription`;
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
            const url = `${this.baseUrl}/create-checkout`;
            console.log('Making checkout request to:', url);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tierId, billingPeriod })
            });

            // Debug response
            if (!response.ok) {
                const text = await response.text();
                console.error('Server response:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    body: text
                });
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
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