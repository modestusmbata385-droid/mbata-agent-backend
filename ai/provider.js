// Thin AI provider client. Uses global fetch (Node 18+) against the
// Anthropic Messages API. No key configured -> caller gets a clear error
// instead of a silent failure.
const env = require('../config/env');

async function callProvider(systemPrompt, userMessage) {
  if (!env.ai.apiKey) {
    const err = new Error('AI provider is not configured (AI_PROVIDER_API_KEY missing).');
    err.status = 503;
    throw err;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ai.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`AI provider error: ${text}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

module.exports = { callProvider };

