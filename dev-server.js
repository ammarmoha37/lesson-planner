// Simple dev server for Netlify functions — no timeout
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
    const result = await generatePlan.handler(event, {});
    const headers = result.headers || {};
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    res.status(result.statusCode).send(result.body);
  } catch (err) {
    console.error('Function error:', err);
    res.status(500).json({ error: err.message, success: false });
  }
});

const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Functions dev server running on http://localhost:${PORT}`);
  console.log('No timeout limit — will wait as long as Claude needs.');
});
