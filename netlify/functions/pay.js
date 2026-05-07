const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Debug endpoint - shows what env vars are available
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasKey: !!process.env.STRIPE_SECRET_KEY,
        keyStart: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'NOT FOUND',
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('STRIPE'))
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { amount, currency, metadata, success_url, cancel_url } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'aud',
          product_data: {
            name: (metadata && metadata.property) || 'Lupe Accommodations Deposit',
            description: metadata ? `Check-in: ${metadata.checkin} | Check-out: ${metadata.checkout} | Guests: ${metadata.guests}` : ''
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: metadata && metadata.email,
      metadata: metadata || {},
      success_url: success_url || 'https://teal-brigadeiros-3a5674.netlify.app/?booking=success',
      cancel_url: cancel_url || 'https://teal-brigadeiros-3a5674.netlify.app/',
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
