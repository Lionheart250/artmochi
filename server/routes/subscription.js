const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateTokenWithAutoRefresh } = require('../middleware/auth');
const { pool } = require('../db');

// Get subscription tiers
router.get('/tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subscription_tiers ORDER BY monthly_price');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch tiers:', error);
        res.status(500).json({ error: 'Failed to fetch subscription tiers' });
    }
});

// Get user's current subscription
router.get('/current', authenticateTokenWithAutoRefresh, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = $2',
            [req.user.userId, 'active']
        );
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Failed to fetch subscription:', error);
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
});

// Create Stripe checkout session
router.post('/create-checkout', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { tierId, billingPeriod } = req.body;
    try {
        const tier = await pool.query('SELECT * FROM subscription_tiers WHERE id = $1', [tierId]);
        
        const session = await stripe.checkout.sessions.create({
            customer_email: req.user.email,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: billingPeriod === 'monthly' ? tier.rows[0].stripe_price_id_monthly : tier.rows[0].stripe_price_id_annual,
                quantity: 1,
            }],
            success_url: `${process.env.CLIENT_URL}/subscription?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/subscription?canceled=true`,
            metadata: {
                userId: req.user.userId,
                tierId: tierId
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Failed to create checkout:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Track feature usage
router.post('/track-usage', authenticateTokenWithAutoRefresh, async (req, res) => {
    const { featureName, count = 1 } = req.body;
    try {
        await pool.query(
            `INSERT INTO subscription_features_usage 
            (user_id, feature_name, usage_count) 
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, feature_name) 
            DO UPDATE SET usage_count = subscription_features_usage.usage_count + $3`,
            [req.user.userId, featureName, count]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to track usage:', error);
        res.status(500).json({ error: 'Failed to track feature usage' });
    }
});

module.exports = router;