import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initWindow, restoreTabs } from '../../store/slices/tabsSlice';
import { fetchBookmarks } from '../../store/slices/bookmarksSlice';
import { getPageType, externalSearchToNova, parseNovaSearchUrl } from '../../utils/novaUrls';
import { setShieldStats } from '../../store/slices/uiSlice';
import TitleBar from './TitleBar';
import TabBar from '../TabBar/TabBar';
import Toolbar from '../Toolbar/Toolbar';
import BookmarkBar from '../Bookmarks/BookmarkBar';
import TabContent from '../TabContent/TabContent';
import FindInPage from '../FindInPage/FindInPage';
import AISidebar from '../AI/AISidebar';
import BookmarkSidebar from '../Bookmarks/BookmarkSidebar';
import HistoryPanel from '../History/HistoryPanel';
import DownloadsPanel from '../Downloads/DownloadsPanel';
import SettingsPanel from '../Settings/SettingsPanel';
import PasswordManager from '../PasswordManager/PasswordManager';
import PrivacyDashboard from '../Privacy/PrivacyDashboard';
import PasswordSavePrompt from '../PasswordSavePrompt/PasswordSavePrompt';
import OfflineBanner from '../common/OfflineBanner';
import TranslatePanel from '../Translate/TranslatePanel';
import NovaHubPanel from '../NovaHub/NovaHubPanel';
import ScreenshotTool from '../Screenshot/ScreenshotTool';
import UpdateBanner from '../Update/UpdateBanner';
import LegalPages from '../Legal/LegalPages';

function BrowserWindow() {
  const dispatch = useDispatch();
  const { tabs, activeTabId, windowId, isIncognito } = useSelector((state) => state.tabs);
  const aiOpen = useSelector((state) => state.ai.sidebarOpen);
  const offline = useSelector((state) => state.ui.offline);
  const pendingPassword = useSelector((state) => state.ui.pendingPassword);

  useEffect(() => {
    dispatch(initWindow({ windowId: 'loading', isIncognito: false }));

    const cleanup = window.novaAPI?.window?.onInit?.((data) => {
      dispatch(initWindow(data));
    });

    const sessionCleanup = window.novaAPI?.sessions?.onRestore?.((data) => {
      const sanitizedTabs = data.tabs.map((tab) => {
        const novaUrl = externalSearchToNova(tab.url);
        if (novaUrl) {
          const query = parseNovaSearchUrl(novaUrl).query;
          return {
            ...tab,
            url: novaUrl,
            pageType: 'search',
            title: `${query} - Nova Search`,
            isNewTab: false
          };
        }
        return { ...tab, pageType: tab.pageType || getPageType(tab.url) };
      });
      dispatch(restoreTabs({ tabs: sanitizedTabs, activeTabId: data.activeTabId }));
    });

    return () => {
      cleanup?.();
      sessionCleanup?.();
    };
  }, [dispatch]);

  useEffect(() => {
    if (isIncognito) return;
    const save = () => {
      window.novaAPI?.sessions?.save?.({ windowId, tabs, activeTabId, isIncognito });
    };
    const interval = setInterval(save, 20000);
    window.addEventListener('beforeunload', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, [windowId, tabs, activeTabId, isIncognito]);

  useEffect(() => {
    const loadStats = () => {
      window.novaAPI?.privacy?.getPrivacyStats?.().then((data) => {
        dispatch(setShieldStats(data || {}));
      });
    };
    loadStats();
    const interval = setInterval(loadStats, 3000);
    const cleanup = window.novaAPI?.privacy?.onStatsUpdated?.((data) => {
      dispatch(setShieldStats(data || {}));
    });
    return () => {
      clearInterval(interval);
      cleanup?.();
    };
  }, [dispatch]);

  useEffect(() => {
    if (isIncognito) return;
    const cloudCleanup = window.novaAPI?.cloud?.onSyncComplete?.((data) => {
      dispatch(fetchBookmarks());
      if (data.tabs?.length) {
        const sanitized = data.tabs.map((tab) => ({
          ...tab,
          id: tab.id || tab.client_id,
          pageType: tab.pageType || getPageType(tab.url),
          navHistory: tab.navHistory || [tab.url],
          navIndex: tab.navIndex ?? 0
        }));
        dispatch(restoreTabs({ tabs: sanitized, activeTabId: data.activeTabId || sanitized[0]?.id }));
      }
    });
    return () => cloudCleanup?.();
  }, [dispatch, isIncognito]);

  useEffect(() => {
    if (isIncognito || !tabs.length) return;
    const push = () => {
      window.novaAPI?.sync?.cloudPush?.({ tabs, activeTabId }).catch(() => {});
    };
    const t = setTimeout(push, 3000);
    return () => clearTimeout(t);
  }, [tabs, activeTabId, isIncognito]);

  return (
    <div className={`flex flex-col h-screen text-gray-900 dark:text-gray-100 ${isIncognito ? 'bg-gray-900' : 'bg-gray-100 dark:bg-surface-darker'}`}>
      <TitleBar />
      <UpdateBanner />
      {offline && <OfflineBanner />}
      <TabBar />
      <BookmarkBar />
      <Toolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex flex-col flex-1 overflow-hidden min-h-0 transition-all duration-300 ${aiOpen ? 'mr-80' : ''}`}>
          <TabContent />
          <FindInPage />
        </div>
        {aiOpen && <AISidebar />}
      </div>
      <BookmarkSidebar />
      <HistoryPanel />
      <DownloadsPanel />
      <SettingsPanel />
      <PasswordManager />
      <PrivacyDashboard />
      <TranslatePanel />
      <PasswordSavePrompt pending={pendingPassword} />
      <NovaHubPanel />
      <ScreenshotTool />
      <LegalPages />
    </div>
  );
}

export default BrowserWindow;
