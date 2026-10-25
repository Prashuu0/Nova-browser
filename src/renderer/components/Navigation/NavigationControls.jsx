import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { goBack, goForward, updateTab } from '../../store/slices/tabsSlice';
import { resolveTabPageType } from '../../utils/novaUrls';

function NavigationControls({ onNavigate }) {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) =>
    state.tabs.tabs.find((t) => t.id === state.tabs.activeTabId)
  );
  const homepage = useSelector((state) => state.settings.data.homepage);

  const tabPageType = activeTab ? resolveTabPageType(activeTab) : 'newtab';

  const canGoBack = () => {
    if (!activeTab) return false;
    return (activeTab.navIndex ?? 0) > 0 || tabPageType === 'web';
  };

  const canGoForward = () => {
    if (!activeTab) return false;
    return (
      (activeTab.navHistory && activeTab.navIndex < activeTab.navHistory.length - 1) ||
      tabPageType === 'web'
    );
  };

  const handleBack = async () => {
    if (!activeTab) return;
    if (tabPageType === 'web' && window.novaAPI?.tabBrowser) {
      const result = await window.novaAPI.tabBrowser.goBack(activeTab.id);
      if (result?.success) return;
    }
    dispatch(goBack());
  };

  const handleForward = async () => {
    if (!activeTab) return;
    if (tabPageType === 'web' && window.novaAPI?.tabBrowser) {
      const result = await window.novaAPI.tabBrowser.goForward(activeTab.id);
      if (result?.success) return;
    }
    dispatch(goForward());
  };

  const handleReload = () => {
    if (!activeTab) return;
    if (tabPageType === 'web' && window.novaAPI?.tabBrowser) {
      if (activeTab.isLoading) {
        window.novaAPI.tabBrowser.stop(activeTab.id);
        dispatch(updateTab({ id: activeTab.id, isLoading: false }));
      } else {
        window.novaAPI.tabBrowser.reload(activeTab.id);
        dispatch(updateTab({ id: activeTab.id, isLoading: true, hasError: false }));
      }
      return;
    }
    if (tabPageType === 'search') {
      dispatch(updateTab({ id: activeTab.id, isLoading: true, searchReload: Date.now() }));
    } else if (activeTab) {
      dispatch(updateTab({ id: activeTab.id, loadKey: (activeTab.loadKey || 0) + 1 }));
    }
  };

  const handleHome = () => {
    onNavigate(homepage || 'nova://newtab');
  };

  return (
    <div className="flex items-center gap-0.5 no-drag">
      <NavButton onClick={handleBack} disabled={!canGoBack()} title="Back">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 2L4 8l6 6V2z" />
        </svg>
      </NavButton>
      <NavButton onClick={handleForward} disabled={!canGoForward()} title="Forward">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 2v12l6-6-6-6z" />
        </svg>
      </NavButton>
      <NavButton onClick={handleReload} title={activeTab?.isLoading ? 'Stop' : 'Reload'}>
        {activeTab?.isLoading ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="4" width="8" height="8" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.5 3A6.5 6.5 0 003.1 11.5l1.4-1.4A4.5 4.5 0 1112 8h-2l3-3 3 3h-2a6.5 6.5 0 01-1.5-5z" />
          </svg>
        )}
      </NavButton>
      <NavButton onClick={handleHome} title="Home">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1L1 7v8h5v-5h4v5h5V7L8 1z" />
        </svg>
      </NavButton>
    </div>
  );
}

function NavButton({ children, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        disabled
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

export default NavigationControls;
