// netlify/functions/submit-contact.js

exports.handler = async (event) => {
  // Production environment check
  if (process.env.NODE_ENV !== 'production') {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Form submission successful in dev mode!' }),
    };
  }
  
  // Get the Turnstile secret key from your Netlify environment variables
  const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

  if (!TURNSTILE_SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Turnstile secret key is not configured.' }),
    };
  }

  const body = JSON.parse(event.body);
  const token = body['cf-turnstile-response'];
  const ip = event.headers['x-nf-client-connection-ip'];

  // 1. Verify the Turnstile token
  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const turnstileData = await turnstileResponse.json();

  if (!turnstileData.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Human verification failed. Please try again.' }),
    };
  }

  // 2. If Turnstile is valid, submit the form data to Netlify Forms
  // This requires your FORM_ID and a Netlify Personal Access Token
  const NETLIFY_FORM_ID = process.env.NETLIFY_FORM_ID;
  const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN;

  if (!NETLIFY_FORM_ID || !NETLIFY_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Netlify form environment variables are not configured.' }),
    };
  }

  // Prepare form data for Netlify API
  const formData = new URLSearchParams({
    'form-name': 'contact',
    ...body,
  });

  try {
    const netlifyResponse = await fetch(
      `https://api.netlify.com/api/v1/forms/${NETLIFY_FORM_ID}/submissions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        },
        body: formData.toString(),
      }
    );

    if (!netlifyResponse.ok) {
      throw new Error(`Netlify API responded with status: ${netlifyResponse.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Thank you for your message!' }),
    };
  } catch (error) {
    console.error('Error submitting to Netlify Forms:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sorry, there was an issue sending your message.' }),
    };
  }
};