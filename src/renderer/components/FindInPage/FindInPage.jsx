import React, { useState, useEffect, useRef } from 'react';
import { getTabWebContentsId } from '../../utils/tabBrowser';
import { useDispatch, useSelector } from 'react-redux';
import { setFindInPage } from '../../store/slices/uiSlice';

function FindInPage() {
  const dispatch = useDispatch();
  const { findInPageOpen, findMatch } = useSelector((state) => state.ui);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (findInPageOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      setQuery('');
      getTabWebContentsId(activeTabId).then((id) => {
        if (id) window.novaAPI.browser.stopFindInPage(id);
      });
    }
  }, [findInPageOpen, activeTabId]);

  const runFind = async (text, forward = true) => {
    const id = await getTabWebContentsId(activeTabId);
    if (!id || !text) return;
    window.novaAPI.browser.findInPage(id, text, { forward, findNext: true });
  };

  useEffect(() => {
    if (!window.novaAPI?.tabBrowser) return undefined;

    const onFound = (_, data) => {
      if (data.tabId !== activeTabId) return;
      dispatch(setFindInPage({
        match: {
          active: data.activeMatchOrdinal || 0,
          total: data.matches || 0
        }
      }));
    };

    window.novaAPI.tabBrowser.on('tab-browser:found-in-page', onFound);
    return () => window.novaAPI.tabBrowser.off('tab-browser:found-in-page');
  }, [activeTabId, dispatch]);

  if (!findInPageOpen) return null;

  return (
    <div className="absolute top-2 right-4 z-50 flex items-center gap-2 bg-[#2b2d31] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          runFind(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') runFind(query, !e.shiftKey);
          if (e.key === 'Escape') dispatch(setFindInPage({ open: false }));
        }}
        placeholder="Find in page"
        className="bg-transparent text-sm text-white outline-none w-40 placeholder-white/40"
      />
      <span className="text-xs text-white/50 min-w-[48px] text-center">
        {findMatch?.total ? `${findMatch.active}/${findMatch.total}` : '0/0'}
      </span>
      <button onClick={() => runFind(query, false)} className="text-white/60 hover:text-white px-1" title="Previous">↑</button>
      <button onClick={() => runFind(query, true)} className="text-white/60 hover:text-white px-1" title="Next">↓</button>
      <button
        onClick={() => dispatch(setFindInPage({ open: false }))}
        className="text-white/60 hover:text-white px-1"
      >
        ✕
      </button>
    </div>
  );
}

export default FindInPage;
