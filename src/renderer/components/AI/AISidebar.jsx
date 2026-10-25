import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runInActiveTab } from '../../utils/tabBrowser';
import {
  toggleSidebar,
  addMessage,
  clearMessages,
  sendChatMessage,
  setActiveMode
} from '../../store/slices/aiSlice';

function AISidebar() {
  const dispatch = useDispatch();
  const { messages, loading, activeMode } = useSelector((state) => state.ai);
  const aiProvider = useSelector((state) => state.settings.data.aiProvider);
  const aiModel = useSelector((state) => {
    const settings = state.settings.data;
    if (settings.aiProvider === 'gemini') return settings.geminiModel || 'gemini-2.0-flash';
    if (settings.aiProvider === 'ollama') return settings.ollamaModel;
    return settings.aiModel || 'gpt-4o-mini';
  });
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const activeTab = useSelector((state) =>
    state.tabs.tabs.find((t) => t.id === state.tabs.activeTabId)
  );
  const [input, setInput] = useState('');
  const [modeLoading, setModeLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const isBusy = loading || modeLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput('Voice not supported on this system');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim() || isBusy) return;
    const userMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    dispatch(addMessage(userMessage));
    const text = input.trim();
    setInput('');

    if (activeMode === 'search') {
      setModeLoading(true);
      try {
        const result = await window.novaAPI.ai.search({ query: text, provider: aiProvider });
        dispatch(addMessage({ role: 'assistant', content: result.content, timestamp: Date.now() }));
      } catch {
        dispatch(addMessage({ role: 'assistant', content: 'AI search failed. Check Settings → AI.', timestamp: Date.now() }));
      } finally {
        setModeLoading(false);
      }
      return;
    }

    if (activeMode === 'write') {
      setModeLoading(true);
      try {
        const result = await window.novaAPI.ai.write({ prompt: text, provider: aiProvider });
        dispatch(addMessage({ role: 'assistant', content: result.content, timestamp: Date.now() }));
      } catch {
        dispatch(addMessage({ role: 'assistant', content: 'AI write failed. Check Settings → AI.', timestamp: Date.now() }));
      } finally {
        setModeLoading(false);
      }
      return;
    }

    if (['research', 'explain', 'rewrite', 'pdf', 'youtube'].includes(activeMode)) {
      await runProAction(activeMode);
      setInput('');
      return;
    }

    const allMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content
    }));

    dispatch(sendChatMessage({ messages: allMessages, provider: aiProvider, model: aiModel }));
  };

  const handleSummarize = async () => {
    if (!activeTab || activeTab.isNewTab) return;
    dispatch(setActiveMode('summarize'));
    dispatch(addMessage({ role: 'user', content: 'Summarize this page', timestamp: Date.now() }));

    const content = await runInActiveTab(activeTabId, 'document.body.innerText');
    if (content) {
      try {
        const result = await window.novaAPI.ai.summarize({ content, provider: aiProvider });
        dispatch(addMessage({ role: 'assistant', content: result.content, timestamp: Date.now() }));
      } catch {
        dispatch(addMessage({
          role: 'assistant',
          content: 'Could not extract page content for summarization.',
          timestamp: Date.now()
        }));
      }
    } else {
      dispatch(addMessage({
        role: 'assistant',
        content: 'Open a website first, then summarize.',
        timestamp: Date.now()
      }));
    }
  };

  const modes = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'summarize', label: 'Summarize', icon: '📄' },
    { id: 'research', label: 'Research', icon: '🔬' },
    { id: 'search', label: 'AI Search', icon: '🔍' },
    { id: 'write', label: 'Write', icon: '✍️' },
    { id: 'explain', label: 'Explain', icon: '💡' },
    { id: 'rewrite', label: 'Rewrite', icon: '✏️' }
  ];

  const getPageText = async () => runInActiveTab(activeTabId, 'document.body.innerText').catch(() => '');

  const getSelectedText = async () => runInActiveTab(activeTabId, 'window.getSelection().toString()').catch(() => '');

  const runProAction = async (mode) => {
    setModeLoading(true);
    try {
      const url = activeTab?.url || '';
      let result;
      if (mode === 'summarize' || mode === 'pdf') {
        const content = await getPageText();
        result = await window.novaAPI.ai.summarize({ content, provider: aiProvider });
      } else if (mode === 'youtube') {
        const content = await getPageText();
        result = await window.novaAPI.ai.summarize({
          content: `Summarize this YouTube page content as video summary with key points:\n${content.slice(0, 12000)}`,
          provider: aiProvider
        });
      } else if (mode === 'explain') {
        const selected = await getSelectedText();
        const text = selected || input.trim();
        if (!text) throw new Error('Select text on page or type in box');
        result = await window.novaAPI.ai.explain({ text, context: url, provider: aiProvider });
      } else if (mode === 'rewrite') {
        const selected = await getSelectedText();
        const text = selected || input.trim();
        if (!text) throw new Error('Select text or type to rewrite');
        result = await window.novaAPI.ai.write({ prompt: `Rewrite this text clearly:\n${text}`, style: 'clear', provider: aiProvider });
      } else if (mode === 'research') {
        const topic = input.trim() || 'current page';
        const pageContent = await getPageText();
        result = await window.novaAPI.ai.research({
          topic,
          context: pageContent.slice(0, 8000),
          provider: aiProvider
        });
      }
      dispatch(addMessage({ role: 'assistant', content: result?.content || 'No response', timestamp: Date.now() }));
    } catch (err) {
      dispatch(addMessage({ role: 'assistant', content: err.message || 'Nova AI Pro action failed.', timestamp: Date.now() }));
    } finally {
      setModeLoading(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-surface-dark border-l border-gray-200 dark:border-gray-800 flex flex-col z-40 animate-slide-in shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-nova-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-nova-500/30">
            <span className="text-white text-[10px] font-bold">PRO</span>
          </div>
          <div>
            <span className="font-semibold text-sm block leading-tight">Nova AI Pro</span>
            <span className="text-[10px] text-nova-400">Summarize · Research · Explain</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch(clearMessages())}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            title="Clear chat"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M5 1h4l1 2h3v1H1V3h3l1-2zm1 4h2v5H6V5zm-1 6h4v1H5v-1z" />
            </svg>
          </button>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => {
              dispatch(setActiveMode(mode.id));
              if (mode.id === 'summarize') handleSummarize();
              if (['pdf', 'youtube'].includes(mode.id)) runProAction(mode.id);
            }}
            className={`text-xs py-1.5 px-2 rounded-lg transition-colors ${
              activeMode === mode.id
                ? 'bg-nova-500/15 text-nova-500 ring-1 ring-nova-500/30'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
        {activeTab?.url?.includes('youtube') && (
          <button onClick={() => runProAction('youtube')} className="text-xs py-1.5 px-2 rounded-lg bg-red-500/10 text-red-400">▶️ YouTube</button>
        )}
        {activeTab?.url?.endsWith('.pdf') && (
          <button onClick={() => runProAction('pdf')} className="text-xs py-1.5 px-2 rounded-lg bg-orange-500/10 text-orange-400">📑 PDF</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask me anything about the current page, or get help with research, writing, and more.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-nova-500 text-white rounded-br-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isBusy && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              activeMode === 'search' ? 'Ask Nova AI to research...' :
              activeMode === 'write' ? 'What should Nova AI write?' :
              'Ask Nova AI...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24 placeholder-gray-400"
          />
          <button
            onClick={startVoice}
            className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}
            title="Voice input"
          >
            🎤
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isBusy}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-nova-500 text-white disabled:opacity-40 hover:bg-nova-600 transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M13 1L1 7l5 2 2 5 5-13z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Powered by {aiProvider === 'ollama' ? 'Ollama' : aiProvider === 'gemini' ? `Gemini (${aiModel})` : 'OpenAI'}
        </p>
      </div>
    </div>
  );
}

export default AISidebar;
