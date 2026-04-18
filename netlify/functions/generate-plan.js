// Netlify Functions — streaming via stream() wrapper to avoid 30s timeout
const { stream } = require('@netlify/functions');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8888',
    process.env.SITE_URL,
  ].filter(Boolean);
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

exports.handler = stream(async (event) => {
  const origin = event.headers?.origin || '';
  const cors = getCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: cors,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { prompt, userId } = body;

  if (!prompt) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Prompt is required' }),
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Run streaming in background — write chunks as they arrive
  (async () => {
    try {
      const messageStream = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 12000,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const ev of messageStream) {
        if (ev.type === 'message_start') {
          inputTokens = ev.message?.usage?.input_tokens || 0;
        } else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          const chunk = JSON.stringify({ type: 'delta', text: ev.delta.text });
          await writer.write(encoder.encode(`data: ${chunk}\n\n`));
        } else if (ev.type === 'message_delta') {
          outputTokens = ev.usage?.output_tokens || 0;
        }
      }

      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

      // Track usage in Supabase
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

      const done = JSON.stringify({
        type: 'done',
        usage: { inputTokens, outputTokens, totalTokens, estimatedCost },
      });
      await writer.write(encoder.encode(`data: ${done}\n\n`));
    } catch (error) {
      const err = JSON.stringify({
        type: 'error',
        error: error.message || 'Failed to generate plan',
      });
      await writer.write(encoder.encode(`data: ${err}\n\n`));
    }
    await writer.close();
  })();

  return {
    statusCode: 200,
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
    body: readable,
  };
});
module.exports.config = {};
