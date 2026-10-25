import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab } from '../../store/slices/tabsSlice';
import { addHistoryEntry } from '../../store/slices/historySlice';
import {
  parseNovaSearchUrl,
  buildNovaSearchUrl,
  buildDisplaySearchUrl
} from '../../utils/novaUrls';
import { NovaBrand } from '../common/NovaLogo';
import NovaSearchBar from '../common/NovaSearchBar';

const MAIN_TABS = [
  { id: 'ai', label: 'AI Mode' },
  { id: 'all', label: 'All' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'news', label: 'News' },
  { id: 'videos', label: 'Short videos' },
  { id: 'forums', label: 'Forums' },
  { id: 'images', label: 'Images' }
];

const MORE_ITEMS = [
  { id: 'books', label: 'Books' },
  { id: 'maps', label: 'Maps' },
  { id: 'flights', label: 'Flights' }
];

const TOOL_ITEMS = [
  { id: 'any', label: 'Any time' },
  { id: 'day', label: 'Past 24 hours' },
  { id: 'week', label: 'Past week' },
  { id: 'month', label: 'Past month' },
  { id: 'year', label: 'Past year' }
];

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function queryNovaSearch(searchQuery, type) {
  const payload = { query: searchQuery, type };
  if (window.novaAPI?.search?.query) {
    return window.novaAPI.search.query(payload);
  }
  if (window.novaAPI?.navigation?.performSearch) {
    return window.novaAPI.navigation.performSearch(payload);
  }
  throw new Error('Nova Search module not loaded. Close the app completely and run npm run dev again.');
}

function KnowledgePanel({ result, query, onVisit }) {
  if (!result) return null;
  const domain = getDomain(result.url);
  return (
    <div className="bg-[#202124] rounded-2xl border border-white/10 overflow-hidden sticky top-28">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-white text-xl font-semibold capitalize">{query}</h2>
        <p className="text-white/50 text-sm mt-1">{domain}</p>
      </div>
      {result.snippet && (
        <div className="p-5 border-b border-white/10">
          <p className="text-white/70 text-sm leading-relaxed line-clamp-6">{result.snippet}</p>
        </div>
      )}
      <div className="p-5">
        <button
          onClick={() => onVisit(result.url, result.title)}
          className="w-full py-2.5 bg-nova-500/20 hover:bg-nova-500/30 text-nova-400 rounded-xl text-sm font-medium border border-nova-500/30"
        >
          Visit {domain}
        </button>
      </div>
    </div>
  );
}

function NovaSearchPage({ tabId, url }) {
  const dispatch = useDispatch();
  const isIncognito = useSelector((state) => state.tabs.isIncognito);
  const aiProvider = useSelector((state) => state.settings.data.aiProvider || 'gemini');
  const tabState = useSelector((state) => state.tabs.tabs.find((t) => t.id === tabId));
  const { query, type: urlType } = parseNovaSearchUrl(url);
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTime, setSearchTime] = useState(0);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(urlType || 'all');
  const [aiAnswer, setAiAnswer] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [timeFilter, setTimeFilter] = useState('any');
  const moreRef = useRef(null);
  const toolsRef = useRef(null);
  const searchGenRef = useRef(0);

  useEffect(() => {
    setSearchInput(query);
    setActiveCategory(urlType || 'all');
    if (query) runSearch(query, urlType || 'all');
    else setLoading(false);
  }, [query, url, urlType, tabState?.searchReload]);

  useEffect(() => {
    const close = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setShowTools(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const runSearch = async (q, type = 'all') => {
    const gen = ++searchGenRef.current;
    setLoading(true);
    setError(null);
    setAiAnswer('');
    try {
      let searchQuery = q;
      if (timeFilter === 'day') searchQuery += ' past day';
      else if (timeFilter === 'week') searchQuery += ' past week';
      else if (timeFilter === 'month') searchQuery += ' past month';
      else if (timeFilter === 'year') searchQuery += ' past year';

      if (type === 'ai') {
        try {
          const aiData = await window.novaAPI?.ai?.search?.({ query: q, provider: aiProvider });
          const text = aiData?.content || aiData?.message || (typeof aiData === 'string' ? aiData : '');
          setAiAnswer(text || `Nova AI overview for "${q}". See results below. (Add API key in Settings → AI for smarter answers)`);
        } catch {
          setAiAnswer(`Results for "${q}" below. Enable AI in Settings → AI for smart answers.`);
        }
        type = 'all';
      }

      const data = await queryNovaSearch(searchQuery, type);
      if (gen !== searchGenRef.current) return;

      if (!data) {
        setError('No response from search. Restart Nova Browser.');
        setResults([]);
        return;
      }

      if (data.error) {
        setError(data.error);
        setResults([]);
        setSearchTime(data.searchTime || 0);
        return;
      }

      setResults(data.results || []);
      setSearchTime(data.searchTime || 0);

      dispatch(updateTab({
        id: tabId,
        url: buildNovaSearchUrl(q, type),
        pageType: 'search',
        title: `${q} - Nova Search`,
        isLoading: false
      }));

      if (!isIncognito) {
        dispatch(addHistoryEntry({ title: `${q} - Nova Search`, url: buildNovaSearchUrl(q, type) }));
      }
    } catch (err) {
      if (gen !== searchGenRef.current) return;
      setError(err?.message || 'Search failed. Close the app and run npm run dev again.');
      setResults([]);
    } finally {
      if (gen === searchGenRef.current) setLoading(false);
    }
  };

  const switchTab = (type) => {
    setActiveCategory(type);
    setShowMore(false);
    if (!query) return;
    const novaUrl = buildNovaSearchUrl(query, type);
    dispatch(updateTab({ id: tabId, url: novaUrl, pageType: 'search', isLoading: true }));
  };

  const handleSearch = (input) => {
    const trimmed = (input || searchInput).trim();
    if (!trimmed) return;
    dispatch(updateTab({
      id: tabId,
      url: buildNovaSearchUrl(trimmed, activeCategory),
      pageType: 'search',
      isNewTab: false,
      isLoading: true,
      title: trimmed
    }));
  };

  const openResult = (resultUrl, title) => {
    let finalUrl = (resultUrl || '').trim();
    if (!finalUrl) return;

    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl.replace(/^\/+/, '');

    try {
      new URL(finalUrl);
    } catch {
      return;
    }

    dispatch(updateTab({
      id: tabId,
      url: finalUrl,
      pageType: 'web',
      discarded: false,
      isNewTab: false,
      isLoading: true,
      title: title || finalUrl,
      hasError: false,
      errorCode: null,
      errorDescription: null,
      loadKey: Date.now()
    }));

    if (!isIncognito) {
      dispatch(addHistoryEntry({ title: title || finalUrl, url: finalUrl }));
    }
  };

  const isTabActive = (id) => activeCategory === id;

  return (
    <div className="flex-1 overflow-y-auto bg-[#202124] min-h-0">
      <div className="sticky top-0 z-20 bg-[#202124] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => dispatch(updateTab({ id: tabId, url: 'nova://newtab', pageType: 'newtab', isNewTab: true, title: 'New Tab' }))}>
              <NovaBrand />
            </button>
            <div className="flex-1">
              <NovaSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={handleSearch}
                onClear={() => setSearchInput('')}
                placeholder="Search Nova"
                size="sm"
              />
            </div>
          </div>

          {/* Google-style category tabs */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-thin -mx-2 px-2">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`relative px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                  isTabActive(tab.id)
                    ? 'text-[#8ab4f8]'
                    : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                {tab.label}
                {isTabActive(tab.id) && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#8ab4f8] rounded-t-full" />
                )}
              </button>
            ))}

            <div className="relative" ref={moreRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); setShowTools(false); }}
                className={`flex items-center gap-1 px-4 py-3 text-sm whitespace-nowrap ${
                  MORE_ITEMS.some((m) => isTabActive(m.id)) ? 'text-[#8ab4f8]' : 'text-[#9aa0a6] hover:text-white'
                }`}
              >
                More
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3l3 3 3-3z" /></svg>
              </button>
              {showMore && (
                <div className="absolute top-full left-0 mt-1 bg-[#303134] border border-white/10 rounded-lg shadow-xl py-1 z-30 min-w-[140px]">
                  {MORE_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => switchTab(item.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#e8eaed] hover:bg-white/10"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative ml-auto" ref={toolsRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowTools(!showTools); setShowMore(false); }}
                className="flex items-center gap-1 px-4 py-3 text-sm text-[#9aa0a6] hover:text-white whitespace-nowrap"
              >
                Tools
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 3l3 3 3-3z" /></svg>
              </button>
              {showTools && (
                <div className="absolute top-full right-0 mt-1 bg-[#303134] border border-white/10 rounded-lg shadow-xl py-1 z-30 min-w-[160px]">
                  {TOOL_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTimeFilter(item.id);
                        setShowTools(false);
                        if (query) runSearch(query, activeCategory);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 ${
                        timeFilter === item.id ? 'text-[#8ab4f8]' : 'text-[#e8eaed]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4 text-xs text-[#9aa0a6]">
          <span>About {results.length} results ({searchTime}s)</span>
          <span className="text-[#8ab4f8]">{buildDisplaySearchUrl(query, activeCategory).replace('https://', '')}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-10 h-10 border-2 border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9aa0a6] text-sm">Searching Nova...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => runSearch(query, activeCategory)} className="px-6 py-2.5 bg-[#8ab4f8] text-[#202124] rounded-full font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <>
            {aiAnswer && (
              <div className="mb-8 p-5 bg-[#303134] rounded-2xl border border-[#8ab4f8]/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#8ab4f8] text-xs font-semibold uppercase">Nova AI</span>
                </div>
                <p className="text-[#e8eaed] text-sm leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}

            {activeCategory === 'images' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {results.map((result, i) => (
                  <div
                    key={i}
                    onClick={() => openResult(result.url, result.title)}
                    className="cursor-pointer group rounded-xl overflow-hidden bg-[#303134] border border-white/5 hover:border-[#8ab4f8]/50"
                  >
                    <div className="aspect-video bg-[#3c4043] flex items-center justify-center overflow-hidden">
                      {result.thumbnail || result.imageUrl ? (
                        <img
                          src={result.thumbnail || result.imageUrl}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-[#9aa0a6] text-xs p-2 text-center">{getDomain(result.url)}</span>
                      )}
                    </div>
                    <p className="p-2 text-xs text-[#8ab4f8] truncate group-hover:underline">{result.title}</p>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#e8eaed] text-lg mb-2">No results for &quot;{query}&quot;</p>
                <p className="text-[#9aa0a6] text-sm">Try different keywords or another category</p>
              </div>
            ) : (
              <div className="flex gap-8">
                <div className="flex-1 min-w-0 space-y-7">
                  {results.map((result, index) => (
                    <div key={index} className="group cursor-pointer" onClick={() => openResult(result.url, result.title)}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-[#303134] flex items-center justify-center text-[10px] font-bold text-[#9aa0a6]">
                          {getDomain(result.url)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-[#e8eaed] truncate">{getDomain(result.url)}</p>
                          <p className="text-xs text-[#9aa0a6] truncate">{result.url}</p>
                        </div>
                      </div>
                      <h3 className="text-xl text-[#8ab4f8] group-hover:underline font-normal mb-1 leading-snug">
                        {result.title}
                      </h3>
                      {result.snippet && (
                        <p className="text-sm text-[#bdc1c6] leading-relaxed line-clamp-2">{result.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
                {results[0] && activeCategory === 'all' && (
                  <div className="w-72 flex-shrink-0 hidden xl:block">
                    <KnowledgePanel result={results[0]} query={query} onVisit={openResult} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NovaSearchPage;
