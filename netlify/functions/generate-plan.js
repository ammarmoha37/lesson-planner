const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8888',
    process.env.SITE_URL, // Set this in Netlify env vars to your production domain
  ].filter(Boolean);

  const origin = event.headers?.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { prompt, userId } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      messages: [{ role: 'user', content: prompt }],
    });

    const fullText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Track usage in Supabase
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    // Claude Sonnet pricing: $3/M input, $15/M output
    const estimatedCost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

    if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        await supabase.from('api_usage').insert({
          user_id: userId,
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: totalTokens,
          estimated_cost: estimatedCost,
          model: 'claude-sonnet-4',
        });
      } catch (e) {
        console.error('Usage tracking error:', e);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: fullText,
        success: true,
        usage: { inputTokens, outputTokens, totalTokens, estimatedCost },
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to generate plan',
        success: false,
      }),
    };
  }
};
