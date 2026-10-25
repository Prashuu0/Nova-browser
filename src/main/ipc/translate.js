const { ipcMain } = require('electron');
const { translateText } = require('../services/translateService');

function registerTranslateHandlers() {
  ipcMain.handle('translate:text', async (_, { text, targetLang, sourceLang }) => {
    return translateText(text, targetLang, sourceLang);
  });
}

module.exports = { registerTranslateHandlers };
