import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTranslationPanel } from '../../store/slices/uiSlice';
import { runInActiveTab } from '../../utils/tabBrowser';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' }
];

function TranslatePanel() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.ui.translationPanel);
  const readerContent = useSelector((state) => state.ui.readerContent);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);

  const [targetLang, setTargetLang] = useState('hi');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceText, setSourceText] = useState('');

  if (!open) return null;

  const getSourceText = async () => {
    if (readerContent?.text) return readerContent.text.slice(0, 3000);
    const text = await runInActiveTab(activeTabId, 'document.body.innerText.slice(0, 3000)');
    return text || '';
  };

  const handleTranslate = async () => {
    setLoading(true);
    setTranslated('');
    try {
      const text = sourceText || await getSourceText();
      setSourceText(text);
      if (!text.trim()) {
        setTranslated('No text found on this page.');
        return;
      }
      const chunk = text.slice(0, 4000);
      const result = await window.novaAPI.translate.text({ text: chunk, targetLang, sourceLang: 'auto' });
      setTranslated(result.translated || 'Translation failed.');
    } catch {
      setTranslated('Translation failed. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={() => dispatch(toggleTranslationPanel())} />
      <div className="relative w-96 bg-[#2b2d31] shadow-2xl flex flex-col animate-slide-in border-l border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="font-semibold text-white">Translate Page</h2>
          <button onClick={() => dispatch(toggleTranslationPanel())} className="text-white/50 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Translate to</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg text-sm outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-gray-900">{l.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="w-full py-2.5 bg-nova-500 hover:bg-nova-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {loading ? 'Translating...' : 'Translate Current Page'}
          </button>
          {translated && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{translated}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TranslatePanel;
