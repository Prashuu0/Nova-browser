import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePanel, fetchHistory, clearHistory, setSearchQuery } from '../../store/slices/historySlice';
import { updateTab } from '../../store/slices/tabsSlice';

function HistoryPanel() {
  const dispatch = useDispatch();
  const { items, panelOpen, searchQuery } = useSelector((state) => state.history);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);

  useEffect(() => {
    if (panelOpen) {
      dispatch(fetchHistory({ search: searchQuery }));
    }
  }, [panelOpen, searchQuery, dispatch]);

  if (!panelOpen) return null;

  const navigate = async (url) => {
    const resolved = await window.novaAPI.navigation.resolveUrl(url);
    if (resolved.type === 'error' || !resolved.url) return;
    dispatch(updateTab({
      id: activeTabId,
      url: resolved.url,
      pageType: resolved.pageType || 'web',
      isLoading: resolved.pageType === 'web',
      isNewTab: false,
      title: resolved.type === 'search' ? `${resolved.query} - Nova Search` : undefined
    }));
    dispatch(togglePanel());
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={() => dispatch(togglePanel())} />
      <div className="relative w-96 bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold">History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(clearHistory())}
              className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear All
            </button>
            <button onClick={() => dispatch(togglePanel())} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No history found</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(item.url)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-xs text-gray-400 truncate">{item.url}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatDate(item.last_visit)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPanel;
