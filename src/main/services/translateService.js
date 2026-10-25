async function translateText(text, targetLang = 'hi', sourceLang = 'auto') {
  if (!text?.trim()) return { translated: '', source: text };

  const chunk = text.slice(0, 4000);
  const providers = [
    async () => {
      const url = `https://libretranslate.com/translate`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: chunk, source: sourceLang === 'auto' ? 'auto' : sourceLang, target: targetLang, format: 'text' })
      });
      if (!res.ok) throw new Error('LibreTranslate failed');
      const data = await res.json();
      return data.translatedText;
    },
    async () => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('MyMemory failed');
      const data = await res.json();
      return data.responseData?.translatedText;
    }
  ];

  for (const provider of providers) {
    try {
      const translated = await provider();
      if (translated) return { translated, source: chunk };
    } catch {}
  }

  throw new Error('All translation providers failed');
}

module.exports = { translateText };
