const { ipcMain } = require('electron');
const { AIService } = require('../services/aiService');

const aiService = new AIService();

function registerAIHandlers() {
  ipcMain.handle('ai:chat', async (_, { messages, provider, model }) => {
    return aiService.chat(messages, provider, model);
  });

  ipcMain.handle('ai:summarize', async (_, { content, provider }) => {
    return aiService.summarize(content, provider);
  });

  ipcMain.handle('ai:explain', async (_, { text, context, provider }) => {
    return aiService.explain(text, context, provider);
  });

  ipcMain.handle('ai:explainCode', async (_, { code, language, provider }) => {
    return aiService.explainCode(code, language, provider);
  });

  ipcMain.handle('ai:search', async (_, { query, provider }) => {
    return aiService.aiSearch(query, provider);
  });

  ipcMain.handle('ai:write', async (_, { prompt, style, provider }) => {
    return aiService.write(prompt, style, provider);
  });

  ipcMain.handle('ai:research', async (_, { topic, context, provider }) => {
    const prompt = context
      ? `Research topic: ${topic}\n\nContext from page:\n${context}`
      : topic;
    return aiService.research(prompt, provider);
  });

  ipcMain.handle('ai:testConnection', async (_, { provider }) => {
    return aiService.testConnection(provider);
  });

  ipcMain.handle('ai:getConversations', () => {
    const { getDatabase } = require('../database');
    const db = getDatabase();
    return db.prepare('SELECT id, title, created_at, updated_at FROM ai_conversations ORDER BY updated_at DESC').all();
  });

  ipcMain.handle('ai:saveConversation', (_, { id, title, messages }) => {
    const { getDatabase } = require('../database');
    const { v4: uuidv4 } = require('uuid');
    const db = getDatabase();
    const now = Date.now();
    const convId = id || uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO ai_conversations (id, title, messages_json, created_at, updated_at)
      VALUES (@id, @title, @messages_json, @created_at, @updated_at)
    `).run({
      id: convId,
      title,
      messages_json: JSON.stringify(messages),
      created_at: now,
      updated_at: now
    });
    return { id: convId };
  });

  ipcMain.handle('ai:deleteConversation', (_, id) => {
    const { getDatabase } = require('../database');
    const db = getDatabase();
    db.prepare('DELETE FROM ai_conversations WHERE id = ?').run(id);
    return { success: true };
  });
}

module.exports = { registerAIHandlers };
