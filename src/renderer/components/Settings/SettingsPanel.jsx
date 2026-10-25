import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePanel, updateSetting } from '../../store/slices/settingsSlice';
import { setFilterStats, openLegal } from '../../store/slices/uiSlice';

function SettingsPanel() {
  const dispatch = useDispatch();
  const { data, panelOpen } = useSelector((state) => state.settings);
  const filterStats = useSelector((state) => state.ui.filterStats);
  const [activeSection, setActiveSection] = useState('general');
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);

  useEffect(() => {
    if (panelOpen) {
      window.novaAPI?.filters?.getStats?.().then((stats) => {
        if (stats) dispatch(setFilterStats(stats));
      });
    }
  }, [panelOpen, dispatch]);

  if (!panelOpen) return null;

  const handleChange = (key, value) => {
    dispatch(updateSetting({ key, value }));
    if (key === 'aiProvider' || key === 'geminiApiKey' || key === 'aiApiKey') {
      setAiTestResult(null);
    }
  };

  const testAiConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const result = await window.novaAPI.ai.testConnection({ provider: data.aiProvider });
      setAiTestResult(result);
    } catch {
      setAiTestResult({ success: false, message: 'Connection test failed. Restart the browser.' });
    } finally {
      setTestingAi(false);
    }
  };

  const refreshFilters = async () => {
    setLoadingFilters(true);
    try {
      const stats = await window.novaAPI.filters.load();
      dispatch(setFilterStats(stats));
    } finally {
      setLoadingFilters(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(togglePanel())} />
      <div className="relative w-[700px] h-[500px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex overflow-hidden animate-fade-in">
        <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-3">
          <h2 className="text-lg font-semibold px-3 py-2 mb-2">Settings</h2>
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === section.id
                  ? 'bg-nova-500/10 text-nova-600 dark:text-nova-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => dispatch(togglePanel())}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
            </svg>
          </button>

          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-4">General</h3>
              <SettingRow label="Search Engine">
                <div className="px-3 py-1.5 bg-nova-500/10 text-nova-600 dark:text-nova-400 rounded-lg text-sm font-medium">
                  Nova Search
                </div>
              </SettingRow>
              <SettingRow label="Homepage">
                <input
                  type="text"
                  value={data.homepage}
                  onChange={(e) => handleChange('homepage', e.target.value)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none w-48"
                />
              </SettingRow>
              <SettingRow label="Session Restore">
                <Toggle checked={data.sessionRestore} onChange={(v) => handleChange('sessionRestore', v)} />
              </SettingRow>
              <SettingRow label="Spell Check">
                <Toggle checked={data.spellcheck} onChange={(v) => handleChange('spellcheck', v)} />
              </SettingRow>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-4">Appearance</h3>
              <SettingRow label="Theme">
                <div className="flex gap-2">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleChange('theme', theme)}
                      className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                        data.theme === theme
                          ? 'bg-nova-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </SettingRow>
              <SettingRow label="Show Bookmark Bar">
                <Toggle checked={data.showBookmarkBar} onChange={(v) => handleChange('showBookmarkBar', v)} />
              </SettingRow>
              <SettingRow label="Default Zoom">
                <select
                  value={data.defaultZoom}
                  onChange={(e) => handleChange('defaultZoom', parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
                >
                  {[75, 90, 100, 110, 125, 150].map((z) => (
                    <option key={z} value={z}>{z}%</option>
                  ))}
                </select>
              </SettingRow>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
              <SettingRow label="Ad Blocker">
                <Toggle checked={data.adBlockerEnabled} onChange={(v) => handleChange('adBlockerEnabled', v)} />
              </SettingRow>
              <SettingRow label="Tracker Blocker">
                <Toggle checked={data.trackerBlockerEnabled} onChange={(v) => handleChange('trackerBlockerEnabled', v)} />
              </SettingRow>
              <SettingRow label="Fingerprint Protection">
                <Toggle checked={data.fingerprintProtection} onChange={(v) => handleChange('fingerprintProtection', v)} />
              </SettingRow>
              <SettingRow label="Do Not Track">
                <Toggle checked={data.doNotTrack} onChange={(v) => handleChange('doNotTrack', v)} />
              </SettingRow>
              <SettingRow label="Block Third-Party Cookies">
                <Toggle checked={data.blockThirdPartyCookies} onChange={(v) => handleChange('blockThirdPartyCookies', v)} />
              </SettingRow>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-medium mb-3">Filter Lists (EasyList)</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
                  <p>Ad domains: {filterStats.adDomains?.toLocaleString() || 0}</p>
                  <p>Tracker domains: {filterStats.trackerDomains?.toLocaleString() || 0}</p>
                  {filterStats.lastUpdated && (
                    <p>Updated: {new Date(filterStats.lastUpdated).toLocaleString()}</p>
                  )}
                </div>
                <button
                  onClick={refreshFilters}
                  disabled={loadingFilters}
                  className="w-full px-4 py-2.5 bg-nova-500/20 text-nova-600 dark:text-nova-400 rounded-lg text-sm hover:bg-nova-500/30 disabled:opacity-50"
                >
                  {loadingFilters ? 'Updating...' : 'Update Filter Lists'}
                </button>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <button
                  onClick={() => window.novaAPI.privacy.clearCache()}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Cache
                </button>
                <button
                  onClick={() => window.novaAPI.privacy.clearCookies()}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Cookies
                </button>
                <button
                  onClick={() => window.novaAPI.privacy.clearAll()}
                  className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Clear All Browsing Data
                </button>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
              <SettingRow label="AI Provider">
                <select
                  value={data.aiProvider}
                  onChange={(e) => handleChange('aiProvider', e.target.value)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </SettingRow>
              {data.aiProvider === 'openai' && (
                <>
                  <SettingRow label="OpenAI API Key">
                    <input
                      type="password"
                      value={data.aiApiKey || ''}
                      onChange={(e) => handleChange('aiApiKey', e.target.value)}
                      placeholder="sk-..."
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none w-56"
                    />
                  </SettingRow>
                  <SettingRow label="Model">
                    <select
                      value={data.aiModel}
                      onChange={(e) => handleChange('aiModel', e.target.value)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
                    >
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                  </SettingRow>
                </>
              )}
              {data.aiProvider === 'gemini' && (
                <>
                  <SettingRow label="Gemini API Key">
                    <input
                      type="password"
                      value={data.geminiApiKey || ''}
                      onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                      placeholder="AIza..."
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none w-56"
                    />
                  </SettingRow>
                  <SettingRow label="Gemini Model">
                    <select
                      value={data.geminiModel || 'gemini-2.0-flash'}
                      onChange={(e) => handleChange('geminiModel', e.target.value)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
                      <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                  </SettingRow>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Free API key:{' '}
                    <button
                      type="button"
                      onClick={() => window.novaAPI.shell.openExternal('https://aistudio.google.com/apikey')}
                      className="text-nova-500 hover:underline"
                    >
                      aistudio.google.com/apikey
                    </button>
                  </p>
                </>
              )}
              {data.aiProvider === 'ollama' && (
                <>
                  <SettingRow label="Ollama URL">
                    <input
                      type="text"
                      value={data.ollamaUrl}
                      onChange={(e) => handleChange('ollamaUrl', e.target.value)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none w-56"
                    />
                  </SettingRow>
                  <SettingRow label="Ollama Model">
                    <input
                      type="text"
                      value={data.ollamaModel}
                      onChange={(e) => handleChange('ollamaModel', e.target.value)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none w-56"
                    />
                  </SettingRow>
                </>
              )}
              <div className="pt-2">
                <button
                  onClick={testAiConnection}
                  disabled={testingAi}
                  className="w-full px-4 py-2.5 bg-nova-500 text-white rounded-lg text-sm hover:bg-nova-600 disabled:opacity-50"
                >
                  {testingAi ? 'Testing...' : 'Test AI Connection'}
                </button>
                {aiTestResult && (
                  <p className={`text-xs mt-2 ${aiTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                    {aiTestResult.success ? '✓ ' : '✗ '}
                    {aiTestResult.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold mb-4">Advanced</h3>
              <SettingRow label="Hardware Acceleration">
                <Toggle checked={data.hardwareAcceleration} onChange={(v) => handleChange('hardwareAcceleration', v)} />
              </SettingRow>
              <SettingRow label="Clear Data on Exit">
                <Toggle checked={data.clearDataOnExit} onChange={(v) => handleChange('clearDataOnExit', v)} />
              </SettingRow>
              <div className="pt-4 space-y-2">
                <p className="text-xs text-gray-400">Nova Browser v2.0 Beta</p>
                <div className="flex flex-wrap gap-2">
                  {['about', 'privacy', 'terms', 'release'].map((s) => (
                    <button key={s} onClick={() => dispatch(openLegal(s))} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-nova-500 capitalize">
                      {s === 'release' ? 'Release Notes' : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-nova-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default SettingsPanel;
