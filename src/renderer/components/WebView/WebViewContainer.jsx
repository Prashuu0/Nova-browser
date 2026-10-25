import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab, addTab } from '../../store/slices/tabsSlice';
import { addHistoryEntry } from '../../store/slices/historySlice';
import {
  externalSearchToNova,
  parseNovaSearchQuery,
  isNovaSearchUrl,
  resolveTabPageType
} from '../../utils/novaUrls';
import ErrorPage from '../ErrorPage/ErrorPage';
import PDFToolbar, { isPdfUrl } from '../PDF/PDFToolbar';

function isLoadableWebUrl(url) {
  return url && url.startsWith('http') && !isNovaSearchUrl(url);
}

function selectOverlayOpen(state) {
  return (
    state.ui.screenshotMode ||
    state.ui.privacyDashboard ||
    state.ui.translationPanel ||
    state.ui.readerMode ||
    state.ui.findInPageOpen ||
    state.ui.novaHubOpen ||
    state.ui.shieldsMenuOpen ||
    state.settings.panelOpen ||
    state.bookmarks.sidebarOpen ||
    state.history.panelOpen ||
    state.downloads.panelOpen ||
    state.passwords.panelOpen
  );
}

function WebViewContainer() {
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const { tabs, activeTabId, isIncognito } = useSelector((state) => state.tabs);
  const aiOpen = useSelector((state) => state.ai.sidebarOpen);
  const overlayOpen = useSelector(selectOverlayOpen);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const pageType = activeTab ? resolveTabPageType(activeTab) : 'newtab';
  const isWeb = pageType === 'web' && isLoadableWebUrl(activeTab?.url);
  const shouldShowView = isWeb && activeTab && !activeTab.hasError && !overlayOpen;

  const reportBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el || !window.novaAPI?.tabBrowser?.setBounds) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2 || rect.top < 48) return null;
    const bounds = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    window.novaAPI.tabBrowser.setBounds(bounds);
    return bounds;
  }, []);

  const showActiveView = useCallback((attempt = 0) => {
    if (!shouldShowView || !window.novaAPI?.tabBrowser?.show) return;

    const bounds = reportBounds();
    if (!bounds && attempt < 12) {
      setTimeout(() => showActiveView(attempt + 1), 80);
      return;
    }

    window.novaAPI.tabBrowser.show({
      tabId: activeTab.id,
      url: activeTab.url,
      incognito: isIncognito,
      loadKey: activeTab.loadKey
    }).then((result) => {
      if (!result?.success && attempt < 12) {
        setTimeout(() => showActiveView(attempt + 1), 100);
      }
    });
  }, [shouldShowView, activeTab, isIncognito, reportBounds]);

  useEffect(() => {
    reportBounds();
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(() => reportBounds());
    observer.observe(el);
    window.addEventListener('resize', reportBounds);

    const t1 = setTimeout(reportBounds, 100);
    const t2 = setTimeout(reportBounds, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reportBounds);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reportBounds, aiOpen, pageType, overlayOpen]);

  useEffect(() => {
    if (!window.novaAPI?.tabBrowser) return undefined;

    const onLoading = (_, data) => {
      if (data.tabId !== activeTabId) return;
      dispatch(updateTab({
        id: data.tabId,
        isLoading: data.isLoading,
        ...(data.canGoBack != null && { canGoBack: data.canGoBack }),
        ...(data.canGoForward != null && { canGoForward: data.canGoForward })
      }));
    };

    const onTitle = (_, data) => {
      if (data.tabId !== activeTabId) return;
      dispatch(updateTab({ id: data.tabId, title: data.title }));
    };

    const onFavicon = (_, data) => {
      if (data.tabId !== activeTabId) return;
      dispatch(updateTab({ id: data.tabId, favicon: data.favicon }));
    };

    const onNavigate = (_, data) => {
      if (data.tabId !== activeTabId) return;
      const novaSearch = externalSearchToNova(data.url);
      if (novaSearch) {
        const query = parseNovaSearchQuery(novaSearch);
        dispatch(updateTab({
          id: data.tabId,
          url: novaSearch,
          pageType: 'search',
          isLoading: false,
          title: `${query} - Nova Search`
        }));
        window.novaAPI.tabBrowser.hide();
        return;
      }
      dispatch(updateTab({
        id: data.tabId,
        url: data.url,
        pageType: 'web',
        isNewTab: false,
        isLoading: true
      }));
    };

    const onFinish = (_, data) => {
      if (data.tabId !== activeTabId) return;
      if (data.url?.startsWith('http') && !isIncognito) {
        dispatch(addHistoryEntry({ title: data.title || data.url, url: data.url }));
      }
      dispatch(updateTab({
        id: data.tabId,
        isLoading: false,
        canGoBack: data.canGoBack,
        canGoForward: data.canGoForward
      }));
    };

    const onError = (_, data) => {
      if (data.tabId !== activeTabId) return;
      dispatch(updateTab({
        id: data.tabId,
        isLoading: false,
        hasError: true,
        errorCode: data.errorCode,
        errorDescription: data.errorDescription
      }));
    };

    const onNewWindow = (_, data) => {
      if (!data.url) return;
      const novaSearch = externalSearchToNova(data.url);
      if (novaSearch) {
        dispatch(addTab({
          url: novaSearch,
          pageType: 'search',
          title: `${parseNovaSearchQuery(novaSearch)} - Nova Search`
        }));
      } else {
        dispatch(addTab({ url: data.url, pageType: 'web', title: 'Loading...' }));
      }
    };

    const subs = [
      ['tab-browser:loading', onLoading],
      ['tab-browser:title', onTitle],
      ['tab-browser:favicon', onFavicon],
      ['tab-browser:navigate', onNavigate],
      ['tab-browser:finish', onFinish],
      ['tab-browser:error', onError],
      ['tab-browser:new-window', onNewWindow]
    ].map(([ch, fn]) => {
      window.novaAPI.tabBrowser.on(ch, fn);
      return ch;
    });

    return () => {
      subs.forEach((ch) => window.novaAPI.tabBrowser.off(ch));
    };
  }, [activeTabId, dispatch, isIncognito]);

  useEffect(() => {
    if (!window.novaAPI?.tabBrowser) return;

    if (shouldShowView) {
      showActiveView();
    } else {
      window.novaAPI.tabBrowser.hide();
    }
  }, [shouldShowView, activeTab?.id, activeTab?.url, activeTab?.loadKey, showActiveView]);

  if (!activeTab) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col min-h-0 w-full h-full bg-white dark:bg-gray-900"
    >
      {isWeb && activeTab.isLoading && (
        <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-nova-500 loading-shimmer" />
      )}
      {isWeb && isPdfUrl(activeTab.url) && <PDFToolbar tabId={activeTab.id} />}
      {isWeb && activeTab.hasError && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-gray-900">
          <ErrorPage
            errorCode={activeTab.errorCode}
            errorDescription={activeTab.errorDescription}
            url={activeTab.url}
            onRetry={() => {
              dispatch(updateTab({
                id: activeTab.id,
                hasError: false,
                isLoading: true,
                loadKey: Date.now()
              }));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default WebViewContainer;
