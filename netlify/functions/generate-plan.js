// Netlify Functions v2 — streaming response to avoid timeout
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

function getCorsHeaders(req) {
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8888',
    process.env.SITE_URL,
  ].filter(Boolean);
  const origin = (req.headers.get ? req.headers.get('origin') : req.headers?.origin) || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const handler = async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { prompt, userId } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 12000,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        });

        let inputTokens = 0;
        let outputTokens = 0;

        for await (const event of stream) {
          if (event.type === 'message_start') {
            inputTokens = event.message?.usage?.input_tokens || 0;
          } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const chunk = JSON.stringify({ type: 'delta', text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          } else if (event.type === 'message_delta') {
            outputTokens = event.usage?.output_tokens || 0;
          }
        }

        const totalTokens = inputTokens + outputTokens;
        const estimatedCost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;

        // Track usage in Supabase
        if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
          try {
            const supabase = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_KEY,
            );
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
        controller.enqueue(encoder.encode(`data: ${done}\n\n`));
      } catch (error) {
        const err = JSON.stringify({
          type: 'error',
          error: error.message || 'Failed to generate plan',
        });
        controller.enqueue(encoder.encode(`data: ${err}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
};

// v2 function format: export the handler directly (not exports.handler)
module.exports = handler;
module.exports.config = {};
