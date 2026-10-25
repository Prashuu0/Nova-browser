# Nova AI Inference Server

Member 4 — AI Engineer

Centralized AI API for Nova Browser desktop + mobile. Brand as **Nova AI** while using Gemini/OpenAI under the hood.

## Setup
```bash
cp .env.example .env
# Add GEMINI_API_KEY
npm install
npm run dev
```

## Endpoints
- `POST /v1/chat` — `{ messages, provider, model }`
- `POST /v1/summarize` — `{ content, provider }`
- `POST /v1/research` — `{ topic, context, provider }`
- `GET /health`

## Future
- Fine-tuned Llama/Qwen model
- Own GPU inference
- Rate limits per Nova account
