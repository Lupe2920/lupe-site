const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', hasKey: !!process.env.STRIPE_SECRET_KEY }));

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || 'aud',
      metadata: metadata || {},
      description: metadata ? `${metadata.property} | ${metadata.checkin} → ${metadata.checkout} | ${metadata.name}` : 'Lupe Accommodations',
      receipt_email: metadata?.email,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Payment intent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
