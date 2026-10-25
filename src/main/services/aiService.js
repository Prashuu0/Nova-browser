const Store = require('electron-store');

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
const NOVA_AI_URL = process.env.NOVA_AI_URL || 'http://localhost:3850';

class AIService {
  constructor() {
    this.settingsStore = new Store({ name: 'nova-settings' });
  }

  async callNovaAI(endpoint, body) {
    try {
      const response = await fetch(`${NOVA_AI_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.error) return null;
      return { content: data.content, provider: data.provider || 'nova-ai' };
    } catch {
      return null;
    }
  }

  getConfig(provider) {
    const settings = this.settingsStore.store;
    const selectedProvider = provider || settings.aiProvider || 'gemini';
    return {
      provider: selectedProvider,
      apiKey: settings.aiApiKey || '',
      aiModel: settings.aiModel || 'gpt-4o-mini',
      geminiModel: settings.geminiModel || 'gemini-2.0-flash',
      ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
      ollamaModel: settings.ollamaModel || 'llama3',
      geminiApiKey: settings.geminiApiKey || ''
    };
  }

  resolveModel(config, model) {
    if (model) return model;
    if (config.provider === 'gemini') return config.geminiModel;
    if (config.provider === 'ollama') return config.ollamaModel;
    return config.aiModel;
  }

  async chat(messages, provider, model) {
    const config = this.getConfig(provider);
    const useModel = this.resolveModel(config, model);
    const nova = await this.callNovaAI('/v1/chat', {
      messages,
      provider: config.provider,
      model: useModel
    });
    if (nova) return nova;

    switch (config.provider) {
      case 'openai':
        return this.callOpenAI(messages, config.apiKey, useModel);
      case 'gemini':
        return this.callGemini(messages, config.geminiApiKey, useModel);
      case 'ollama':
        return this.callOllama(messages, config.ollamaUrl, config.ollamaModel);
      default:
        return this.callGemini(messages, config.geminiApiKey, useModel);
    }
  }

  async testConnection(provider) {
    try {
      const result = await this.chat(
        [{ role: 'user', content: 'Reply with exactly: Nova AI connected successfully.' }],
        provider
      );
      if (result.error) {
        return { success: false, message: result.content, error: result.error };
      }
      return { success: true, message: result.content };
    } catch (err) {
      return { success: false, message: err.message || 'Connection failed', error: 'CONNECTION_ERROR' };
    }
  }

  async callOpenAI(messages, apiKey, model) {
    if (!apiKey) {
      return {
        content: 'Please add your OpenAI API key in Settings → AI.',
        error: 'NO_API_KEY'
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { content: `OpenAI Error: ${err.error?.message || response.statusText}`, error: 'API_ERROR' };
    }

    const data = await response.json();
    return { content: data.choices[0].message.content, usage: data.usage };
  }

  buildGeminiPayload(messages) {
    let systemInstruction = null;
    const contents = [];

    for (const message of messages) {
      if (message.role === 'system') {
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n${message.content}`
          : message.content;
        continue;
      }
      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      });
    }

    return { systemInstruction, contents };
  }

  async callGemini(messages, apiKey, model) {
    if (!apiKey) {
      return {
        content: 'Please add your Gemini API key in Settings → AI. Get one free at aistudio.google.com/apikey',
        error: 'NO_API_KEY'
      };
    }

    const geminiModel = GEMINI_MODELS.includes(model) ? model : 'gemini-2.0-flash';
    const { systemInstruction, contents } = this.buildGeminiPayload(messages);

    if (contents.length === 0) {
      return { content: 'No message to send.', error: 'EMPTY_MESSAGE' };
    }

    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || response.statusText;
      return { content: `Gemini Error: ${msg}`, error: 'API_ERROR' };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    if (!text) {
      const blocked = data.candidates?.[0]?.finishReason;
      return {
        content: blocked === 'SAFETY'
          ? 'Gemini blocked this response due to safety filters. Try rephrasing.'
          : 'Gemini returned an empty response. Try again.',
        error: 'EMPTY_RESPONSE'
      };
    }
    return { content: text };
  }

  async callOllama(messages, ollamaUrl, model) {
    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false })
      });

      if (!response.ok) {
        return {
          content: `Ollama Error: Make sure Ollama is running at ${ollamaUrl}`,
          error: 'OLLAMA_ERROR'
        };
      }

      const data = await response.json();
      return { content: data.message.content };
    } catch {
      return {
        content: `Cannot connect to Ollama at ${ollamaUrl}. Start Ollama with: ollama serve`,
        error: 'OLLAMA_CONNECTION'
      };
    }
  }

  async summarize(content, provider) {
    const nova = await this.callNovaAI('/v1/summarize', { content, provider });
    if (nova) return nova;

    const messages = [
      {
        role: 'system',
        content: 'You are Nova AI. Summarize web pages concisely with key bullet points.'
      },
      {
        role: 'user',
        content: `Summarize the following webpage content:\n\n${content.slice(0, 15000)}`
      }
    ];
    return this.chat(messages, provider);
  }

  async explain(text, context, provider) {
    const messages = [
      {
        role: 'system',
        content: 'You are Nova AI. Explain text clearly and concisely.'
      },
      {
        role: 'user',
        content: `Explain the following text${context ? ' in the context of: ' + context : ''}:\n\n${text}`
      }
    ];
    return this.chat(messages, provider);
  }

  async explainCode(code, language, provider) {
    const messages = [
      {
        role: 'system',
        content: 'You are Nova AI, an expert programmer. Explain code clearly with examples when helpful.'
      },
      {
        role: 'user',
        content: `Explain this ${language || ''} code:\n\n\`\`\`\n${code}\n\`\`\``
      }
    ];
    return this.chat(messages, provider);
  }

  async aiSearch(query, provider) {
    const messages = [
      {
        role: 'system',
        content:
          'You are Nova AI, a research assistant. Provide comprehensive, well-structured answers to search queries. Use headings and bullet points.'
      },
      {
        role: 'user',
        content: `Research and answer: ${query}`
      }
    ];
    return this.chat(messages, provider);
  }

  async write(prompt, style, provider) {
    const messages = [
      {
        role: 'system',
        content: `You are Nova AI, a professional writing assistant. Write in a ${style || 'clear and professional'} style.`
      },
      { role: 'user', content: prompt }
    ];
    return this.chat(messages, provider);
  }

  async research(topic, provider) {
    const nova = await this.callNovaAI('/v1/research', { topic, provider });
    if (nova) return nova;

    const messages = [
      {
        role: 'system',
        content:
          'You are Nova AI, a research assistant. Provide thorough research summaries with key findings and actionable insights.'
      },
      {
        role: 'user',
        content: `Research this topic thoroughly: ${topic}`
      }
    ];
    return this.chat(messages, provider);
  }
}

module.exports = { AIService, GEMINI_MODELS };
