import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSidebarOpen } from '../../store/slices/bookmarksSlice';
import { updateTab } from '../../store/slices/tabsSlice';
import { removeBookmark } from '../../store/slices/bookmarksSlice';

function BookmarkSidebar() {
  const dispatch = useDispatch();
  const { items, sidebarOpen } = useSelector((state) => state.bookmarks);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);

  if (!sidebarOpen) return null;

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
    dispatch(setSidebarOpen(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={() => dispatch(setSidebarOpen(false))} />
      <div className="relative w-80 bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold">Bookmarks</h2>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No bookmarks yet. Click the star icon to bookmark a page.
            </div>
          ) : (
            items.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 group cursor-pointer"
                onClick={() => navigate(bookmark.url)}
              >
                {bookmark.favicon ? (
                  <img src={bookmark.favicon} alt="" className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 rounded bg-nova-500/20" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{bookmark.title}</div>
                  <div className="text-xs text-gray-400 truncate">{bookmark.url}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(removeBookmark(bookmark.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M1 0L0 1l5 5-5 5 1 1 5-5 5 5 1-1-5-5 5-5-1-1-5 5z" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default BookmarkSidebar;
