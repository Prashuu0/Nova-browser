require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3850;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

const PROVIDERS = {
  gemini: {
    url: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    key: () => process.env.GEMINI_API_KEY
  },
  openai: {
    url: () => 'https://api.openai.com/v1/chat/completions',
    key: () => process.env.OPENAI_API_KEY
  }
};

async function callGemini(messages, model = 'gemini-2.0-flash') {
  const key = PROVIDERS.gemini.key();
  if (!key) return { error: 'GEMINI_API_KEY not set' };

  const text = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const res = await fetch(`${PROVIDERS.gemini.url(model)}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
    })
  });
  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || 'No response';
  return { content, provider: 'gemini', model };
}

async function callOpenAI(messages, model = 'gpt-4o-mini') {
  const key = PROVIDERS.openai.key();
  if (!key) return { error: 'OPENAI_API_KEY not set' };

  const res = await fetch(PROVIDERS.openai.url(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096 })
  });
  const data = await res.json();
  return { content: data.choices?.[0]?.message?.content || data.error?.message, provider: 'openai', model };
}

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'nova-ai', version: '1.0.0' }));

app.post('/v1/chat', async (req, res) => {
  const { messages, provider = 'gemini', model } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages required' });

  try {
    const result = provider === 'openai'
      ? await callOpenAI(messages, model)
      : await callGemini(messages, model);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/v1/summarize', async (req, res) => {
  const { content, provider = 'gemini' } = req.body;
  const messages = [
    { role: 'user', content: `Summarize concisely:\n\n${(content || '').slice(0, 12000)}` }
  ];
  const result = provider === 'openai' ? await callOpenAI(messages) : await callGemini(messages);
  res.json(result);
});

app.post('/v1/research', async (req, res) => {
  const { topic, context, provider = 'gemini' } = req.body;
  const messages = [
    { role: 'user', content: `Research thoroughly: ${topic}\n\nContext:\n${(context || '').slice(0, 8000)}` }
  ];
  const result = provider === 'openai' ? await callOpenAI(messages) : await callGemini(messages);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`[Nova AI] Inference server http://localhost:${PORT}`);
  console.log(`[Nova AI] Endpoints: /v1/chat /v1/summarize /v1/research`);
});
