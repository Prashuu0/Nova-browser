import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab } from '../../store/slices/tabsSlice';

function BookmarkBar() {
  const dispatch = useDispatch();
  const bookmarks = useSelector((state) => state.bookmarks.items);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const showBar = useSelector((state) => state.settings.data.showBookmarkBar);

  if (!showBar || bookmarks.length === 0) return null;

  const navigate = async (url) => {
    const resolved = await window.novaAPI.navigation.resolveUrl(url);
    if (!resolved.url || resolved.type === 'error') return;
    dispatch(updateTab({
      id: activeTabId,
      url: resolved.url,
      pageType: resolved.pageType || 'web',
      isLoading: resolved.pageType === 'web',
      isNewTab: false,
      title: resolved.type === 'search' ? `${resolved.query} - Nova Search` : undefined
    }));
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-thin">
      {bookmarks.slice(0, 20).map((bookmark) => (
        <button
          key={bookmark.id}
          onClick={() => navigate(bookmark.url)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 whitespace-nowrap max-w-[160px]"
          title={bookmark.url}
        >
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-3 h-3" />
          ) : (
            <div className="w-3 h-3 rounded-full bg-nova-500/30" />
          )}
          <span className="truncate">{bookmark.title}</span>
        </button>
      ))}
    </div>
  );
}

export default BookmarkBar;
