const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ status: 'ok', keyLoaded: !!process.env.STRIPE_SECRET_KEY }) 
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { amount, currency, metadata, success_url, cancel_url } = JSON.parse(event.body);

    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe key not configured on server' })
      };
    }

    // Create Stripe Checkout Session — fully hosted by Stripe, no card element needed
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'aud',
          product_data: {
            name: metadata.property || 'Lupe Accommodations Deposit',
            description: `Check-in: ${metadata.checkin} | Check-out: ${metadata.checkout} | Guests: ${metadata.guests}`
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: metadata.email,
      metadata: metadata,
      success_url: success_url || 'https://teal-brigadeiros-3a5674.netlify.app/?booking=success',
      cancel_url: cancel_url || 'https://teal-brigadeiros-3a5674.netlify.app/?booking=cancelled',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id })
    };

  } catch (err) {
    console.error('Checkout error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
