import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab } from '../../store/slices/tabsSlice';
import { addBookmark } from '../../store/slices/bookmarksSlice';
import { toggleSidebar as toggleAI } from '../../store/slices/aiSlice';
import { toggleSidebar as toggleBookmarks } from '../../store/slices/bookmarksSlice';
import { togglePanel as toggleHistory } from '../../store/slices/historySlice';
import { togglePanel as toggleDownloads } from '../../store/slices/downloadsSlice';
import { togglePanel as toggleSettings } from '../../store/slices/settingsSlice';
import { togglePanel as togglePasswords } from '../../store/slices/passwordsSlice';
import { togglePrivacyDashboard, toggleReaderMode, toggleTranslationPanel, setReaderContent, toggleScreenshotMode, toggleNovaHub } from '../../store/slices/uiSlice';
import NavigationControls from '../Navigation/NavigationControls';
import SearchSuggestions from '../SearchSuggestions/SearchSuggestions';
import ShieldsButton from '../Shields/ShieldsButton';
import { formatAddressBarUrl } from '../../utils/novaUrls';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { EXTRACT_ARTICLE_SCRIPT } from '../../utils/autofillScript';
import { runInActiveTab } from '../../utils/tabBrowser';

function Toolbar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) =>
    state.tabs.tabs.find((t) => t.id === state.tabs.activeTabId)
  );
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const readerMode = useSelector((state) => state.ui.readerMode);
  const bookmarks = useSelector((state) => state.bookmarks.items);
  const searchEngine = useSelector((state) => state.settings.data.defaultSearchEngine);

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useKeyboardShortcuts(inputRef);

  useEffect(() => {
    if (activeTab) {
      setInputValue(formatAddressBarUrl(activeTab.url));
      setIsSecure(activeTab.url?.startsWith('https://'));
      const pageType = activeTab.pageType || (activeTab.url?.startsWith('nova://') ? 'nova' : 'web');
      if (activeTab.url && pageType === 'web') {
        window.novaAPI.bookmarks.isBookmarked(activeTab.url).then(setIsBookmarked);
      } else {
        setIsBookmarked(false);
      }
    }
  }, [activeTab?.url, activeTab?.id, activeTab?.pageType]);

  const navigate = useCallback(async (input) => {
    if (!input.trim()) return;
    const resolved = await window.novaAPI.navigation.resolveUrl(input);
    if (resolved.type === 'error') return;

    dispatch(updateTab({
      id: activeTab.id,
      url: resolved.url,
      pageType: resolved.pageType || 'newtab',
      isLoading: resolved.pageType === 'web',
      isNewTab: resolved.type === 'newtab',
      title: resolved.type === 'search' ? `${resolved.query} - Nova Search` : activeTab.title,
      hasError: false,
      ...(resolved.pageType === 'web' ? { loadKey: Date.now() } : {})
    }));
    setShowSuggestions(false);
  }, [activeTab, dispatch]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (value.length >= 2) {
        const results = await window.novaAPI.navigation.getSearchSuggestions(value);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigate(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleBookmark = async () => {
    if (!activeTab || activeTab.url === 'nova://newtab') return;
    if (isBookmarked) {
      const bookmark = bookmarks.find((b) => b.url === activeTab.url);
      if (bookmark) {
        const { removeBookmark } = require('../../store/slices/bookmarksSlice');
        dispatch(removeBookmark(bookmark.id));
        setIsBookmarked(false);
      }
    } else {
      dispatch(addBookmark({
        title: activeTab.title,
        url: activeTab.url,
        favicon: activeTab.favicon
      }));
      setIsBookmarked(true);
    }
  };

  const handleReaderMode = async () => {
    if (readerMode) {
      dispatch(toggleReaderMode());
      dispatch(setReaderContent(null));
      return;
    }
    const content = await runInActiveTab(activeTabId, EXTRACT_ARTICLE_SCRIPT);
    if (content?.text?.length > 50 || content?.html?.length > 50) {
        dispatch(setReaderContent(content));
      dispatch(toggleReaderMode());
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-800">
      <NavigationControls onNavigate={navigate} />
      <div className="flex-1 relative no-drag">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800/50 rounded-full px-3 py-1.5 gap-2 border border-transparent focus-within:border-nova-500/50 transition-colors">
          {isSecure && (
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-green-500 flex-shrink-0">
              <path fill="currentColor" d="M6 0L1 2v3c0 3.3 2.1 6.4 5 7.5 2.9-1.1 5-4.2 5-7.5V2L6 0zm2.5 4.5L5.5 7.5 3.5 5.5l1-1 1 1 3-3 1 1z" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search Nova or type a URL"
            className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
          />
          {inputValue && (
            <button onClick={() => { setInputValue(''); setSuggestions([]); }} className="text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M1 0L0 1l5 5-5 5 1 1 5-5 5 5 1-1-5-5 5-5-1-1-5 5z" />
              </svg>
            </button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <SearchSuggestions
            suggestions={suggestions}
            onSelect={(s) => { setInputValue(s); navigate(s); }}
          />
        )}
      </div>
      <div className="flex items-center gap-0.5 no-drag">
        <ShieldsButton />
        <ToolbarButton onClick={handleReaderMode} title="Reader Mode" active={readerMode}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h5v12H2V2zm7 0h5v12H9V2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleTranslationPanel())} title="Translate">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 1h6v2H3.4l2.1 5H6v2H1V8h2.6L1.5 3H1V1zm9 0h6v2h-3.6l2.1 5H16v2h-5v-2h2.6L10.5 3H10V1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={handleBookmark} title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'} active={isBookmarked}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M3 1h10v14l-5-3.5L3 15V1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleScreenshotMode())} title="Screenshot">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3h2l1-2h6l1 2h2a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm6 2a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleNovaHub())} title="Nova Hub">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4L8 1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleAI())} title="AI Assistant">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm-1 4h2v5H7V7z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleBookmarks())} title="Bookmarks">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h12v12l-3-2-3 2-3-2-3 2V2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleHistory())} title="History">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2v3.5l3 1.5.5-.9-2.5-1.2V5H7.5z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleDownloads())} title="Downloads">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1v9.3l2.6-2.6 1.4 1.4L8 14.5 4 9.1l1.4-1.4L8 10.3V1h0zM2 15h12v1H2v-1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(togglePasswords())} title="Passwords">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a3 3 0 00-3 3v2H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1V4a3 3 0 00-3-3zm0 2a1 1 0 011 1v2H7V4a1 1 0 011-1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(togglePrivacyDashboard())} title="Privacy">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => dispatch(toggleSettings())} title="Settings">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5l1 2.5 2.7.4-2 1.9.5 2.7L8 7.5 5.8 9l.5-2.7-2-1.9 2.7-.4L8 1.5zM8 11a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        active
          ? 'text-nova-500 bg-nova-500/10'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

export default Toolbar;
