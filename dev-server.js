// Simple dev server for Netlify functions — streaming support
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));

// Load the v2 function handler
const generatePlan = require('./netlify/functions/generate-plan');

app.all('/.netlify/functions/generate-plan', async (req, res) => {
  try {
    // Build a standard Request object for the v2 handler
    const url = `http://localhost:8888${req.originalUrl}`;
    const init = { method: req.method, headers: req.headers };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body);
      init.duplex = 'half';
    }
    const request = new Request(url, init);

    const response = await generatePlan(request, {});

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      const text = await response.text();
      res.send(text);
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
});
