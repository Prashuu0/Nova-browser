const { ipcMain, safeStorage } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');

function encrypt(value) {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('base64');
  }
  return Buffer.from(value).toString('base64');
}

function registerAutofillHandlers() {
  ipcMain.handle('autofill:getAddresses', () => {
    const db = getDatabase();
    return db.prepare('SELECT id, label, name, line1, line2, city, state, zip, country, phone, email FROM autofill_addresses ORDER BY created_at DESC').all();
  });

  ipcMain.handle('autofill:saveAddress', (_, data) => {
    const db = getDatabase();
    const id = data.id || uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO autofill_addresses (id, label, name, line1, line2, city, state, zip, country, phone, email, created_at)
      VALUES (@id, @label, @name, @line1, @line2, @city, @state, @zip, @country, @phone, @email, @created_at)
    `).run({ ...data, id, created_at: Date.now() });
    return { id };
  });

  ipcMain.handle('autofill:removeAddress', (_, id) => {
    getDatabase().prepare('DELETE FROM autofill_addresses WHERE id = ?').run(id);
    return { success: true };
  });

  ipcMain.handle('autofill:getCards', () => {
    const db = getDatabase();
    return db.prepare('SELECT id, label, name_on_card, expiry_month, expiry_year, created_at FROM autofill_cards ORDER BY created_at DESC').all();
  });

  ipcMain.handle('autofill:saveCard', (_, data) => {
    const db = getDatabase();
    const id = data.id || uuidv4();
    const last4 = data.number ? data.number.slice(-4) : '****';
    db.prepare(`
      INSERT OR REPLACE INTO autofill_cards (id, label, name_on_card, number_encrypted, expiry_month, expiry_year, created_at)
      VALUES (@id, @label, @name_on_card, @number_encrypted, @expiry_month, @expiry_year, @created_at)
    `).run({
      id,
      label: data.label || `Card •••• ${last4}`,
      name_on_card: data.nameOnCard || '',
      number_encrypted: encrypt(data.number || ''),
      expiry_month: data.expiryMonth || '',
      expiry_year: data.expiryYear || '',
      created_at: Date.now()
    });
    return { id };
  });

  ipcMain.handle('autofill:getScriptsForPage', (_, url) => {
    const db = getDatabase();
    const addresses = db.prepare('SELECT * FROM autofill_addresses LIMIT 5').all();
    const cards = db.prepare('SELECT id, label, name_on_card, number_encrypted, expiry_month, expiry_year FROM autofill_cards LIMIT 3').all();

    const addrScript = addresses.length
      ? `(function(){const d=${JSON.stringify(addresses)};document.querySelectorAll('input[name*="address"],input[autocomplete*="address"],input[name*="city"],input[name*="zip"]').forEach((el,i)=>{if(!el.value&&d[0]){const a=d[0];if(el.name?.includes('line1')||el.autocomplete?.includes('line1'))el.value=a.line1||'';if(el.name?.includes('city'))el.value=a.city||'';if(el.name?.includes('zip'))el.value=a.zip||'';}});})();`
      : '';

    return { addressScript: addrScript, cardCount: cards.length };
  });
}

module.exports = { registerAutofillHandlers };
