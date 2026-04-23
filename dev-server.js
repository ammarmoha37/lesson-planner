// Simple dev server for Netlify functions — streaming support
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));

// Load the function handler
const generatePlan = require('./netlify/functions/generate-plan');

app.all('/.netlify/functions/generate-plan', async (req, res) => {
  try {
    const event = {
      httpMethod: req.method,
      body: JSON.stringify(req.body),
      headers: req.headers,
    };

    console.log('Dev server: handling request for user:', req.body?.userId || 'anonymous');

    const result = await generatePlan.handler(event, {});
    const headers = result.headers || {};
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

    // Handle streaming body (ReadableStream - Web Streams API)
    if (result.body && typeof result.body.getReader === 'function') {
      res.status(result.statusCode);
      const reader = result.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Dev server: stream completed');
            break;
          }
          // Convert Uint8Array to string and send
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamError) {
        console.error('Stream error:', streamError);
      }

      res.end();
    } else {
      // Handle regular JSON response
      res.status(result.statusCode).send(result.body);
    }
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).json({ error: err.message, success: false });
  }
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Functions dev server running on http://localhost:${PORT}`);
  console.log('Streaming enabled — no timeout limit.');
  console.log('Environment variables loaded:', {
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
  });
});
